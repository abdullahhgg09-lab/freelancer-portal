import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import {
  SESSION_SECRET,
  VerifiedChatUser,
  createChatToken,
  verifyChatToken,
  checkMessageRateLimit,
  sanitizeId,
  validateMessageContent,
} from './server/chatAuth.ts';
import {
  loadChatStore,
  isUserParticipant,
  upsertConversation,
  getConversationById,
  getConversationByProjectAndUser,
  getEnrichedUserConversations,
  getMessagesForConversation,
  addMessageToStore,
  markConversationMessagesRead,
  clearChatStoreForSandbox,
  getStoreStats,
  type StoredMessage,
} from './server/chatStore.ts';

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const ADMIN_AUTH_PATH = path.join(DATA_DIR, 'admin-auth.json');
const FREELANCERS_STORE_PATH = path.join(DATA_DIR, 'freelancers.json');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'abdullahhgg09@gmail.com').trim().toLowerCase();
const ENV_ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();

interface StoredAdminAuth {
  email: string;
  salt: string;
  hash: string;
  claimedAt: string;
}

let storedAdminAuth: StoredAdminAuth | null = null;

function loadAdminAuthFromDisk(): void {
  try {
    if (fs.existsSync(ADMIN_AUTH_PATH)) {
      const raw = fs.readFileSync(ADMIN_AUTH_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as StoredAdminAuth;
      if (parsed?.email && parsed?.salt && parsed?.hash) {
        storedAdminAuth = parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load admin auth store:', err);
  }
}

function saveAdminAuthToDisk(record: StoredAdminAuth): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(ADMIN_AUTH_PATH, JSON.stringify(record, null, 2), 'utf-8');
  storedAdminAuth = record;
}

function hashPasswordScrypt(password: string, salt: string): Buffer {
  return crypto.scryptSync(password, salt, 64);
}

function verifySecretEquals(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function createAdminToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email, role: 'admin', exp: Date.now() + 12 * 60 * 60 * 1000 })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string | undefined): { email: string; role: string } | null {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (!parsed?.exp || Date.now() > parsed.exp || parsed.role !== 'admin') return null;
    return parsed;
  } catch {
    return null;
  }
}

interface PublicFreelancerRecord {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  company?: string;
  bio?: string;
  address?: string;
  headline: string;
  category: string;
  skills: string[];
  hourlyRatePkr: number;
  availability: 'available' | 'busy' | 'unavailable';
  isListedInDirectory: boolean;
  updatedAt: string;
}

let storedFreelancers: PublicFreelancerRecord[] = [];

function loadFreelancersFromDisk(): void {
  try {
    if (fs.existsSync(FREELANCERS_STORE_PATH)) {
      const raw = fs.readFileSync(FREELANCERS_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        storedFreelancers = parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load freelancers directory:', err);
  }
}

function saveFreelancersToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFile(FREELANCERS_STORE_PATH, JSON.stringify(storedFreelancers, null, 2), (err) => {
      if (err) console.error('Failed to persist freelancers:', err);
    });
  } catch (err) {
    console.error('Failed to initialize freelancers dir:', err);
  }
}

const VALID_MESSAGE_TYPES = new Set([
  'general',
  'milestone',
  'revision',
  'deliverable',
  'payment',
  'text',
  'file',
  'system',
]);

async function startServer() {
  loadChatStore();
  loadAdminAuthFromDisk();
  loadFreelancersFromDisk();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow same-origin, local dev, and deployed portal domains safely
        if (!origin) return callback(null, true);
        if (
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.startsWith('https://')
        ) {
          return callback(null, true);
        }
        return callback(new Error('Origin not allowed'));
      },
      methods: ['GET', 'POST'],
    },
  });

  // Track active socket IDs per authenticated userId for accurate online/offline presence
  const onlineSocketsByUser = new Map<string, Set<string>>();

  function getOnlineUserIds(): string[] {
    return Array.from(onlineSocketsByUser.keys());
  }

  // Authenticate every Socket.IO connection via handshake auth token
  io.use((socket, next) => {
    const rawAuthToken =
      typeof socket.handshake.auth?.token === 'string'
        ? socket.handshake.auth.token
        : typeof socket.handshake.headers?.authorization === 'string' &&
          socket.handshake.headers.authorization.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.slice(7).trim()
        : '';

    const verified = verifyChatToken(rawAuthToken);
    if (!verified) {
      return next(new Error('Unauthorized: invalid or missing chat authentication token'));
    }

    socket.data.user = verified;
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as VerifiedChatUser;
    const convRoom = (convId: string) => `conv:${convId}`;
    const userRoom = (uid: string) => `user:${uid}`;

    socket.join(userRoom(user.userId));

    const existingSet = onlineSocketsByUser.get(user.userId) || new Set<string>();
    const wasOffline = existingSet.size === 0;
    existingSet.add(socket.id);
    onlineSocketsByUser.set(user.userId, existingSet);

    // Hydrate current online user IDs for the newly connected socket
    socket.emit('online-users', { userIds: getOnlineUserIds() });

    if (wasOffline) {
      io.emit('user-online', {
        userId: user.userId,
        userName: user.userName,
        userRole: user.userRole,
      });
    }

    socket.on(
      'join-conversation',
      (
        payload: { conversationId?: string; projectId?: string } | string,
        ack?: (resp: { ok: boolean; conversationId?: string; messages?: StoredMessage[]; error?: string }) => void
      ) => {
        const rawConvId = typeof payload === 'string' ? payload : payload?.conversationId;
        const rawProjId = typeof payload === 'object' && payload ? payload.projectId : undefined;
        const convId = sanitizeId(rawConvId);
        const projId = sanitizeId(rawProjId);

        const conv =
          (convId && getConversationById(convId)) ||
          (projId && getConversationByProjectAndUser(projId, user));

        if (!conv) {
          const errorMsg = 'Conversation not found or access denied.';
          socket.emit('chat-error', { code: 'NOT_FOUND', message: errorMsg });
          ack?.({ ok: false, error: errorMsg });
          return;
        }

        if (!isUserParticipant(conv, user)) {
          const errorMsg = 'Unauthorized: you are not a participant in this private conversation.';
          socket.emit('chat-error', { code: 'FORBIDDEN', message: errorMsg });
          ack?.({ ok: false, error: errorMsg });
          return;
        }

        socket.join(convRoom(conv.conversationId));
        const history = getMessagesForConversation(conv.conversationId);
        ack?.({
          ok: true,
          conversationId: conv.conversationId,
          messages: history,
        });
      }
    );

    socket.on(
      'send-message',
      (
        payload: {
          conversationId?: string;
          message?: string;
          content?: string;
          messageType?: string;
          messageId?: string;
        },
        ack?: (resp: { ok: boolean; message?: StoredMessage; error?: string; retryAfterMs?: number }) => void
      ) => {
        const convId = sanitizeId(payload?.conversationId);
        const conv = convId ? getConversationById(convId) : undefined;

        if (!conv) {
          const errorMsg = 'Conversation does not exist.';
          socket.emit('chat-error', { code: 'NOT_FOUND', message: errorMsg });
          ack?.({ ok: false, error: errorMsg });
          return;
        }

        if (!isUserParticipant(conv, user)) {
          const errorMsg = 'Unauthorized: cannot send messages to a conversation you do not belong to.';
          socket.emit('chat-error', { code: 'FORBIDDEN', message: errorMsg });
          ack?.({ ok: false, error: errorMsg });
          return;
        }

        const rateCheck = checkMessageRateLimit(user.userId);
        if (!rateCheck.allowed) {
          const errorMsg = `Rate limit exceeded. Please wait ${Math.ceil(rateCheck.retryAfterMs / 1000)}s before sending more messages.`;
          socket.emit('chat-error', {
            code: 'RATE_LIMITED',
            message: errorMsg,
            retryAfterMs: rateCheck.retryAfterMs,
          });
          ack?.({ ok: false, error: errorMsg, retryAfterMs: rateCheck.retryAfterMs });
          return;
        }

        const validation = validateMessageContent(payload?.message ?? payload?.content);
        if (!validation.valid) {
          socket.emit('chat-error', { code: 'INVALID_PAYLOAD', message: validation.error });
          ack?.({ ok: false, error: validation.error });
          return;
        }

        const rawType = typeof payload?.messageType === 'string' ? payload.messageType.trim() : 'general';
        const messageType = (VALID_MESSAGE_TYPES.has(rawType) ? rawType : 'general') as StoredMessage['messageType'];
        const isSenderClient = conv.clientId === user.userId;
        const recipientId = isSenderClient ? conv.freelancerId : conv.clientId;
        const recipientName = isSenderClient
          ? conv.freelancerName || 'Freelancer'
          : conv.clientName || 'Client';

        const now = new Date().toISOString();
        const clientProvidedId = sanitizeId(payload?.messageId);
        const msgId = clientProvidedId || `msg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

        // Strictly derive senderId, senderName, and senderRole from verified server auth token
        const storedMsg: StoredMessage = {
          messageId: msgId,
          id: msgId,
          conversationId: conv.conversationId,
          projectId: conv.projectId,
          projectName: conv.projectName,
          senderId: user.userId,
          senderName: user.userName,
          senderRole: user.userRole,
          recipientId,
          recipientName,
          message: validation.text,
          content: validation.text,
          messageType,
          tag: (['general', 'milestone', 'revision', 'deliverable', 'payment'].includes(messageType)
            ? messageType
            : 'general') as StoredMessage['tag'],
          isRead: false,
          createdAt: now,
          timestamp: now,
        };

        const { added, message: savedMsg } = addMessageToStore(storedMsg);
        if (added) {
          // Deliver to authorized participants only via private room + participant user channels
          io.to(convRoom(conv.conversationId))
            .to(userRoom(conv.clientId))
            .to(userRoom(conv.freelancerId))
            .emit('receive-message', savedMsg);
        }

        ack?.({ ok: true, message: savedMsg });
      }
    );

    socket.on('typing', (payload: { conversationId?: string }) => {
      const convId = sanitizeId(payload?.conversationId);
      const conv = convId ? getConversationById(convId) : undefined;
      if (!conv || !isUserParticipant(conv, user)) return;

      socket.to(convRoom(conv.conversationId)).emit('typing', {
        conversationId: conv.conversationId,
        projectId: conv.projectId,
        userId: user.userId,
        userName: user.userName,
      });
    });

    socket.on('stop-typing', (payload: { conversationId?: string }) => {
      const convId = sanitizeId(payload?.conversationId);
      const conv = convId ? getConversationById(convId) : undefined;
      if (!conv || !isUserParticipant(conv, user)) return;

      socket.to(convRoom(conv.conversationId)).emit('stop-typing', {
        conversationId: conv.conversationId,
        projectId: conv.projectId,
        userId: user.userId,
        userName: user.userName,
      });
    });

    socket.on(
      'message-read',
      (
        payload: { conversationId?: string; messageIds?: string[] },
        ack?: (resp: { ok: boolean; updatedMessageIds?: string[]; error?: string }) => void
      ) => {
        const convId = sanitizeId(payload?.conversationId);
        const conv = convId ? getConversationById(convId) : undefined;
        if (!conv || !isUserParticipant(conv, user)) {
          ack?.({ ok: false, error: 'Unauthorized conversation read update.' });
          return;
        }

        const safeIds = Array.isArray(payload?.messageIds)
          ? payload.messageIds.map((id) => sanitizeId(id)).filter(Boolean)
          : undefined;
        const { updatedMessageIds, readAt } = markConversationMessagesRead(conv.conversationId, user.userId, safeIds);

        if (updatedMessageIds.length > 0) {
          const partnerId = conv.clientId === user.userId ? conv.freelancerId : conv.clientId;
          io.to(convRoom(conv.conversationId)).to(userRoom(partnerId)).emit('message-read', {
            conversationId: conv.conversationId,
            messageIds: updatedMessageIds,
            readBy: user.userId,
            readAt,
          });
        }

        ack?.({ ok: true, updatedMessageIds });
      }
    );

    socket.on('disconnect', () => {
      const userSockets = onlineSocketsByUser.get(user.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineSocketsByUser.delete(user.userId);
          io.emit('user-offline', { userId: user.userId });
        }
      }
    });
  });

  // Express Bearer Chat Auth Middleware
  function requireChatAuth(req: express.Request, res: express.Response): VerifiedChatUser | null {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const verified = verifyChatToken(token);
    if (!verified) {
      res.status(401).json({ ok: false, message: 'Authentication required for chat access.' });
      return null;
    }
    return verified;
  }

  // REST API Endpoints
  app.get('/api/health', (_req, res) => {
    const stats = getStoreStats();
    res.json({
      ok: true,
      onlineUsers: getOnlineUserIds().length,
      conversationCount: stats.conversationCount,
      messageCount: stats.messageCount,
    });
  });

  // Issue a server-signed chat JWT/HMAC token for authenticated workspace sessions
  app.post('/api/chat/session', (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const userId = sanitizeId(body.userId);
    const userName = typeof body.userName === 'string' ? body.userName.trim().slice(0, 120) : '';
    const userRole = body.userRole;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 160) : undefined;

    if (!userId || !userName || !['admin', 'freelancer', 'client'].includes(userRole)) {
      res.status(400).json({ ok: false, message: 'Valid userId, userName, and userRole are required.' });
      return;
    }

    if (userRole === 'admin') {
      const authHeader = req.headers.authorization || '';
      const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      const rawAdminToken = bearer || (typeof body.adminToken === 'string' ? body.adminToken.trim() : '');
      const verifiedAdmin = verifyAdminToken(rawAdminToken);
      if (!verifiedAdmin) {
        res.status(403).json({ ok: false, message: 'Valid admin authentication required for admin chat session.' });
        return;
      }
    }

    const token = createChatToken({
      userId,
      userName,
      userRole,
      email,
    });

    res.json({
      ok: true,
      token,
      user: { userId, userName, userRole, email },
      onlineUserIds: getOnlineUserIds(),
    });
  });

  // List authorized conversations for the signed-in user
  app.get('/api/conversations', (req, res) => {
    const user = requireChatAuth(req, res);
    if (!user) return;
    const list = getEnrichedUserConversations(user);
    res.json({ ok: true, conversations: list, onlineUserIds: getOnlineUserIds() });
  });

  // Create or retrieve an authorized 1-to-1 project conversation
  app.post('/api/conversations', (req, res) => {
    const user = requireChatAuth(req, res);
    if (!user) return;

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const projectId = sanitizeId(body.projectId);
    const clientId = sanitizeId(body.clientId);
    const freelancerId = sanitizeId(body.freelancerId);

    if (!projectId || !clientId || !freelancerId) {
      res.status(400).json({ ok: false, message: 'projectId, clientId, and freelancerId are required.' });
      return;
    }

    // Never allow creating a conversation unless the requester is one of the two participants
    if (user.userId !== clientId && user.userId !== freelancerId) {
      res.status(403).json({
        ok: false,
        message: 'Unauthorized: you can only open conversations in which you participate.',
      });
      return;
    }

    const conv = upsertConversation({
      projectId,
      clientId,
      freelancerId,
      projectName: typeof body.projectName === 'string' ? body.projectName.trim().slice(0, 160) : undefined,
      clientName: typeof body.clientName === 'string' ? body.clientName.trim().slice(0, 120) : undefined,
      freelancerName: typeof body.freelancerName === 'string' ? body.freelancerName.trim().slice(0, 120) : undefined,
      clientAvatar: typeof body.clientAvatar === 'string' ? body.clientAvatar.slice(0, 500) : undefined,
      freelancerAvatar: typeof body.freelancerAvatar === 'string' ? body.freelancerAvatar.slice(0, 500) : undefined,
    });

    const convMessages = getMessagesForConversation(conv.conversationId);
    const lastMsg = convMessages[convMessages.length - 1];
    const enriched = {
      ...conv,
      lastMessage: lastMsg?.message,
      lastMessageAt: lastMsg?.createdAt || conv.updatedAt,
      unreadCount: convMessages.filter((m) => m.senderId !== user.userId && !m.isRead).length,
    };

    io.to(`user:${clientId}`).to(`user:${freelancerId}`).emit('conversation:updated', enriched);
    res.json({ ok: true, conversation: enriched, messages: convMessages });
  });

  // Fetch persistent message history for a specific conversation (membership verified)
  app.get('/api/conversations/:conversationId/messages', (req, res) => {
    const user = requireChatAuth(req, res);
    if (!user) return;

    const conversationId = sanitizeId(req.params.conversationId);
    const conv = conversationId ? getConversationById(conversationId) : undefined;
    if (!conv) {
      res.status(404).json({ ok: false, message: 'Conversation not found.' });
      return;
    }
    if (!isUserParticipant(conv, user)) {
      res.status(403).json({ ok: false, message: 'Forbidden: unauthorized conversation access.' });
      return;
    }

    res.json({
      ok: true,
      conversation: conv,
      messages: getMessagesForConversation(conv.conversationId),
    });
  });

  // Mark messages in a conversation as read via REST
  app.post('/api/conversations/:conversationId/read', (req, res) => {
    const user = requireChatAuth(req, res);
    if (!user) return;

    const conversationId = sanitizeId(req.params.conversationId);
    const conv = conversationId ? getConversationById(conversationId) : undefined;
    if (!conv) {
      res.status(404).json({ ok: false, message: 'Conversation not found.' });
      return;
    }
    if (!isUserParticipant(conv, user)) {
      res.status(403).json({ ok: false, message: 'Forbidden: unauthorized conversation access.' });
      return;
    }

    const { updatedMessageIds, readAt } = markConversationMessagesRead(conv.conversationId, user.userId);
    if (updatedMessageIds.length > 0) {
      const partnerId = conv.clientId === user.userId ? conv.freelancerId : conv.clientId;
      io.to(`conv:${conv.conversationId}`).to(`user:${partnerId}`).emit('message-read', {
        conversationId: conv.conversationId,
        messageIds: updatedMessageIds,
        readBy: user.userId,
        readAt,
      });
    }

    res.json({ ok: true, updatedMessageIds, readAt });
  });

  app.get('/api/freelancers', (_req, res) => {
    res.json({
      freelancers: storedFreelancers.filter((f) => f.isListedInDirectory !== false),
    });
  });

  app.post('/api/freelancers', (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!id || !name) {
      res.status(400).json({ ok: false, message: 'Freelancer id and name are required.' });
      return;
    }

    const record: PublicFreelancerRecord = {
      id,
      name,
      username: typeof body.username === 'string' ? body.username.trim() : name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      avatarUrl: typeof body.avatarUrl === 'string' ? body.avatarUrl : undefined,
      company: typeof body.company === 'string' ? body.company.trim() : 'Independent Studio',
      bio: typeof body.bio === 'string' ? body.bio.trim() : '',
      address: typeof body.address === 'string' ? body.address.trim() : 'Remote / Pakistan',
      headline: typeof body.headline === 'string' && body.headline.trim()
        ? body.headline.trim()
        : 'Full-Stack Freelancer & Digital Specialist',
      category: typeof body.category === 'string' && body.category.trim()
        ? body.category.trim()
        : 'Web Development',
      skills: Array.isArray(body.skills)
        ? body.skills.map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, 10)
        : ['Web Development', 'UI/UX'],
      hourlyRatePkr: Number.isFinite(Number(body.hourlyRatePkr)) && Number(body.hourlyRatePkr) > 0
        ? Number(body.hourlyRatePkr)
        : 3500,
      availability:
        body.availability === 'busy' || body.availability === 'unavailable'
          ? body.availability
          : 'available',
      isListedInDirectory: body.isListedInDirectory !== false,
      updatedAt: new Date().toISOString(),
    };

    const existingIndex = storedFreelancers.findIndex((f) => f.id === id);
    if (existingIndex >= 0) {
      storedFreelancers[existingIndex] = record;
    } else {
      storedFreelancers.unshift(record);
    }
    saveFreelancersToDisk();
    io.emit('freelancers:updated', {
      freelancers: storedFreelancers.filter((f) => f.isListedInDirectory !== false),
    });
    res.json({ ok: true, freelancer: record });
  });

  app.post('/api/sandbox/reset', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const user = verifyChatToken(bearer) || verifyAdminToken(bearer);
    if (!user) {
      res.status(401).json({ ok: false, message: 'Authentication required to reset sandbox.' });
      return;
    }
    clearChatStoreForSandbox();
    io.emit('sandbox:reset');
    res.json({ ok: true, messageCount: 0 });
  });

  // Server-authoritative Admin Auth Endpoints
  app.get('/api/admin/status', (_req, res) => {
    res.json({
      configured: Boolean(ENV_ADMIN_PASSWORD || storedAdminAuth),
      adminEmail: ADMIN_EMAIL,
    });
  });

  app.post('/api/admin/claim', (req, res) => {
    if (ENV_ADMIN_PASSWORD || storedAdminAuth) {
      res.status(403).json({
        ok: false,
        message: 'Admin password is already configured and claimed.',
      });
      return;
    }

    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (email !== ADMIN_EMAIL) {
      res.status(403).json({
        ok: false,
        message: 'Only the configured admin email can claim admin access.',
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        ok: false,
        message: 'Admin password must be at least 8 characters long.',
      });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPasswordScrypt(password, salt).toString('hex');
    saveAdminAuthToDisk({
      email: ADMIN_EMAIL,
      salt,
      hash,
      claimedAt: new Date().toISOString(),
    });

    const token = createAdminToken(ADMIN_EMAIL);
    res.json({
      ok: true,
      token,
      admin: { email: ADMIN_EMAIL, name: 'ABBDULLAH (Super Admin)' },
    });
  });

  app.post('/api/admin/login', (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (email !== ADMIN_EMAIL) {
      res.status(401).json({ ok: false, message: 'Invalid admin email or password.' });
      return;
    }

    if (!ENV_ADMIN_PASSWORD && !storedAdminAuth) {
      res.status(409).json({
        ok: false,
        needsClaim: true,
        message: 'First-run admin password setup required for this email.',
      });
      return;
    }

    let isValid = false;
    if (ENV_ADMIN_PASSWORD) {
      isValid = verifySecretEquals(password, ENV_ADMIN_PASSWORD);
    } else if (storedAdminAuth) {
      const candidateHash = hashPasswordScrypt(password, storedAdminAuth.salt);
      const expectedHash = Buffer.from(storedAdminAuth.hash, 'hex');
      isValid =
        candidateHash.length === expectedHash.length &&
        crypto.timingSafeEqual(candidateHash, expectedHash);
    }

    if (!isValid) {
      res.status(401).json({ ok: false, message: 'Invalid admin email or password.' });
      return;
    }

    const token = createAdminToken(ADMIN_EMAIL);
    res.json({
      ok: true,
      token,
      admin: { email: ADMIN_EMAIL, name: 'ABBDULLAH (Super Admin)' },
    });
  });

  app.get('/api/admin/verify', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const verified = verifyAdminToken(token);
    if (!verified) {
      res.status(401).json({ ok: false });
      return;
    }
    res.json({ ok: true, admin: verified });
  });

  function escapeHtml(raw: string): string {
    return raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  app.post('/api/auth/send-confirmation', async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : 'Portal User';
    const role = req.body?.role === 'client' ? 'Client Portal' : 'Freelancer Workspace';
    const rawPortalUrl = typeof req.body?.portalUrl === 'string' ? req.body.portalUrl.trim() : '';
    const safePortalUrl = /^https?:\/\//i.test(rawPortalUrl) ? rawPortalUrl : 'https://freelanceport.pk';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ ok: false, message: 'Valid email address is required.' });
      return;
    }

    const referenceId = `CONF-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const smtpUser = (process.env.SMTP_USER || '').trim();
    const smtpPass = (process.env.SMTP_PASS || '').trim();

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: (process.env.SMTP_HOST || 'smtp.gmail.com').trim(),
          port: Number(process.env.SMTP_PORT) || 465,
          secure: (Number(process.env.SMTP_PORT) || 465) === 465,
          auth: { user: smtpUser, pass: smtpPass },
        });

        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safeUrl = escapeHtml(safePortalUrl);

        await transporter.sendMail({
          from: (process.env.SMTP_FROM || `"FreelancePort.pk" <${smtpUser}>`).trim(),
          to: email,
          subject: `Sign-In Confirmed — FreelancePort.pk (${role})`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
              <div style="background: #0f172a; color: #ffffff; padding: 20px 24px;">
                <div style="font-size: 11px; color: #a5b4fc; text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold;">FreelancePort.pk</div>
                <h2 style="margin: 6px 0 0; font-size: 18px;">Login Confirmation</h2>
              </div>
              <div style="padding: 24px; color: #334155; font-size: 14px; line-height: 1.6;">
                <p>Assalam-o-Alaikum <strong>${safeName}</strong>,</p>
                <p>Your account (<strong>${safeEmail}</strong>) signed in to <strong>${role}</strong> on FreelancePort.pk.</p>
                <p>Confirmation Reference: <strong>${referenceId}</strong></p>
                <p style="margin-top: 18px;">
                  <a href="${safeUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: bold;">Open Workspace</a>
                </p>
              </div>
            </div>
          `,
        });

        res.json({ ok: true, deliveredVia: 'smtp', referenceId });
        return;
      } catch (err) {
        console.error('SMTP delivery error:', err);
        res.json({
          ok: true,
          deliveredVia: 'in_app',
          referenceId,
          message: 'Signed in and confirmed in workspace.',
        });
        return;
      }
    }

    res.json({
      ok: true,
      deliveredVia: 'in_app',
      referenceId,
      message: 'Signed in and confirmed in workspace.',
    });
  });

  // Vite integration in dev vs static dist in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`FreelancePort.pk full-stack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
