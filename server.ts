import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

interface ChatMessage {
  id: string;
  projectId: string;
  projectName?: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'freelancer' | 'client';
  recipientId: string;
  recipientName: string;
  content: string;
  tag?: 'general' | 'revision' | 'milestone' | 'deliverable' | 'payment';
  timestamp: string;
}

interface RoomParticipant {
  userId: string;
  userName: string;
  userRole: string;
}

interface ClientSession {
  ws: WebSocket;
  rooms: Set<string>;
  user?: RoomParticipant;
}

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const CHAT_STORE_PATH = path.join(DATA_DIR, 'portal-messages.json');
const ADMIN_AUTH_PATH = path.join(DATA_DIR, 'admin-auth.json');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'abdullahhgg09@gmail.com').trim().toLowerCase();
const ENV_ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

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

// Server-authoritative message store
let storedMessages: ChatMessage[] = [];

function loadMessagesFromDisk(): void {
  try {
    if (fs.existsSync(CHAT_STORE_PATH)) {
      const raw = fs.readFileSync(CHAT_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        storedMessages = parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load stored messages:', err);
  }
}

function saveMessagesToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFile(CHAT_STORE_PATH, JSON.stringify(storedMessages, null, 2), (err) => {
      if (err) console.error('Failed to persist messages:', err);
    });
  } catch (err) {
    console.error('Failed to initialize chat storage dir:', err);
  }
}

function upsertMessage(msg: ChatMessage): boolean {
  if (!msg || !msg.id || !msg.projectId || !msg.content) return false;
  if (storedMessages.some((m) => m.id === msg.id)) {
    return false; // Idempotent duplicate protection
  }
  storedMessages.push(msg);
  if (storedMessages.length > 2000) {
    storedMessages = storedMessages.slice(-2000);
  }
  saveMessagesToDisk();
  return true;
}

async function startServer() {
  loadMessagesFromDisk();
  loadAdminAuthFromDisk();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });
  const sessions = new Map<WebSocket, ClientSession>();

  function getRoomParticipants(projectId: string): RoomParticipant[] {
    const map = new Map<string, RoomParticipant>();
    for (const session of sessions.values()) {
      if (session.rooms.has(projectId) && session.user) {
        map.set(session.user.userId, session.user);
      }
    }
    return Array.from(map.values());
  }

  function broadcastToRoom(projectId: string, payload: unknown, excludeWs?: WebSocket) {
    const raw = JSON.stringify(payload);
    for (const [clientWs, session] of sessions.entries()) {
      if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
        if (session.rooms.has(projectId) || session.rooms.has('*')) {
          clientWs.send(raw);
        }
      }
    }
  }

  function broadcastAll(payload: unknown, excludeWs?: WebSocket) {
    const raw = JSON.stringify(payload);
    for (const [clientWs] of sessions.entries()) {
      if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(raw);
      }
    }
  }

  wss.on('connection', (ws) => {
    const session: ClientSession = { ws, rooms: new Set(['*']) };
    sessions.set(ws, session);

    // Send initial message hydration on socket connect
    ws.send(
      JSON.stringify({
        type: 'init:messages',
        payload: storedMessages,
      })
    );

    ws.on('message', (data) => {
      try {
        const event = JSON.parse(data.toString());
        if (!event || typeof event.type !== 'string') return;

        switch (event.type) {
          case 'room:join': {
            const { projectId, userId, userName, userRole } = event;
            if (typeof projectId === 'string' && projectId) {
              session.rooms.add(projectId);
              if (userId) {
                session.user = {
                  userId: String(userId),
                  userName: String(userName || 'Portal User'),
                  userRole: String(userRole || 'client'),
                };
              }
              const participants = getRoomParticipants(projectId);
              broadcastToRoom(projectId, {
                type: 'presence:update',
                projectId,
                users: participants,
              });
            }
            break;
          }

          case 'room:leave': {
            const { projectId } = event;
            if (typeof projectId === 'string') {
              session.rooms.delete(projectId);
              const participants = getRoomParticipants(projectId);
              broadcastToRoom(projectId, {
                type: 'presence:update',
                projectId,
                users: participants,
              });
            }
            break;
          }

          case 'message:send': {
            const msg = event.payload as ChatMessage;
            const added = upsertMessage(msg);
            if (added) {
              broadcastAll({
                type: 'message:created',
                payload: msg,
              });
            }
            break;
          }

          case 'typing:state': {
            const { projectId, userId, userName, isTyping } = event;
            if (typeof projectId === 'string' && userId) {
              broadcastToRoom(
                projectId,
                {
                  type: 'typing:update',
                  projectId,
                  userId,
                  userName,
                  isTyping: Boolean(isTyping),
                },
                ws
              );
            }
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    });

    ws.on('close', () => {
      const joinedRooms = Array.from(session.rooms);
      sessions.delete(ws);
      for (const room of joinedRooms) {
        if (room !== '*') {
          broadcastToRoom(room, {
            type: 'presence:update',
            projectId: room,
            users: getRoomParticipants(room),
          });
        }
      }
    });
  });

  // REST API Endpoints
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, connectedClients: sessions.size, messageCount: storedMessages.length });
  });

  app.get('/api/messages', (req, res) => {
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
    if (projectId) {
      res.json({ messages: storedMessages.filter((m) => m.projectId === projectId) });
    } else {
      res.json({ messages: storedMessages });
    }
  });

  app.post('/api/messages', (req, res) => {
    const msg = req.body as ChatMessage;
    if (!msg || !msg.id || !msg.projectId || !msg.content) {
      res.status(400).json({ error: 'Invalid message payload' });
      return;
    }
    const added = upsertMessage(msg);
    if (added) {
      broadcastAll({
        type: 'message:created',
        payload: msg,
      });
    }
    res.json({ ok: true, message: msg, duplicate: !added });
  });

  app.post('/api/sandbox/reset', (_req, res) => {
    storedMessages = [];
    saveMessagesToDisk();
    broadcastAll({ type: 'sandbox:reset' });
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
