import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
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
