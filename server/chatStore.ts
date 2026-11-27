import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { VerifiedChatUser } from './chatAuth.ts';

export interface StoredConversation {
  conversationId: string;
  clientId: string;
  freelancerId: string;
  projectId: string;
  projectName?: string;
  clientName?: string;
  freelancerName?: string;
  clientAvatar?: string;
  freelancerAvatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMessage {
  messageId: string;
  id: string;
  conversationId: string;
  projectId: string;
  projectName?: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'freelancer' | 'client';
  recipientId: string;
  recipientName: string;
  message: string;
  content: string;
  messageType: 'general' | 'milestone' | 'revision' | 'deliverable' | 'payment' | 'text' | 'file' | 'system';
  tag?: 'general' | 'milestone' | 'revision' | 'deliverable' | 'payment';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  timestamp: string;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const CONVERSATIONS_PATH = path.join(DATA_DIR, 'conversations.json');
const MESSAGES_PATH = path.join(DATA_DIR, 'portal-messages.json');

let conversations: StoredConversation[] = [];
let messages: StoredMessage[] = [];

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function buildConversationId(projectId: string, clientId: string, freelancerId: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(`${projectId}::${clientId}::${freelancerId}`)
    .digest('hex')
    .slice(0, 12);
  const safeProj = projectId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'proj';
  return `conv-${safeProj}-${hash}`;
}

export function loadChatStore(): void {
  ensureDataDir();

  try {
    if (fs.existsSync(CONVERSATIONS_PATH)) {
      const raw = fs.readFileSync(CONVERSATIONS_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        conversations = parsed.filter(
          (c) => c && typeof c.conversationId === 'string' && typeof c.clientId === 'string' && typeof c.freelancerId === 'string'
        );
      }
    }
  } catch (err) {
    console.error('Failed to load conversations store:', err);
  }

  try {
    if (fs.existsSync(MESSAGES_PATH)) {
      const raw = fs.readFileSync(MESSAGES_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        messages = parsed
          .filter((m) => m && (m.messageId || m.id) && (m.message || m.content))
          .map((m) => {
            const msgId = String(m.messageId || m.id);
            const msgText = String(m.message || m.content);
            const created = String(m.createdAt || m.timestamp || new Date().toISOString());
            const projId = String(m.projectId || 'general');
            let convId = m.conversationId ? String(m.conversationId) : '';

            if (!convId) {
              const matchedConv = conversations.find((c) => c.projectId === projId);
              if (matchedConv) {
                convId = matchedConv.conversationId;
              } else {
                const isSenderClient = m.senderRole === 'client';
                const cId = isSenderClient ? String(m.senderId) : String(m.recipientId || 'client');
                const fId = isSenderClient ? String(m.recipientId || 'freelancer') : String(m.senderId);
                convId = buildConversationId(projId, cId, fId);
                conversations.push({
                  conversationId: convId,
                  clientId: cId,
                  freelancerId: fId,
                  projectId: projId,
                  projectName: m.projectName,
                  clientName: isSenderClient ? m.senderName : m.recipientName,
                  freelancerName: isSenderClient ? m.recipientName : m.senderName,
                  createdAt: created,
                  updatedAt: created,
                });
              }
            }

            return {
              messageId: msgId,
              id: msgId,
              conversationId: convId,
              projectId: projId,
              projectName: m.projectName,
              senderId: String(m.senderId),
              senderName: String(m.senderName || 'Portal User'),
              senderRole: m.senderRole === 'client' || m.senderRole === 'admin' ? m.senderRole : 'freelancer',
              recipientId: String(m.recipientId),
              recipientName: String(m.recipientName || 'Partner'),
              message: msgText,
              content: msgText,
              messageType: m.messageType || m.tag || 'general',
              tag: m.tag || (['general', 'milestone', 'revision', 'deliverable', 'payment'].includes(m.messageType) ? m.messageType : 'general'),
              isRead: Boolean(m.isRead),
              readAt: m.readAt,
              createdAt: created,
              timestamp: created,
            } as StoredMessage;
          });
      }
    }
  } catch (err) {
    console.error('Failed to load messages store:', err);
  }
}

function saveConversationsToDisk(): void {
  ensureDataDir();
  fs.writeFile(CONVERSATIONS_PATH, JSON.stringify(conversations, null, 2), (err) => {
    if (err) console.error('Failed to persist conversations:', err);
  });
}

function saveMessagesToDisk(): void {
  ensureDataDir();
  fs.writeFile(MESSAGES_PATH, JSON.stringify(messages, null, 2), (err) => {
    if (err) console.error('Failed to persist messages:', err);
  });
}

export function isUserParticipant(conv: StoredConversation, user: Pick<VerifiedChatUser, 'userId' | 'userRole'>): boolean {
  if (!conv || !user?.userId) return false;
  return conv.clientId === user.userId || conv.freelancerId === user.userId;
}

export function upsertConversation(input: {
  conversationId?: string;
  projectId: string;
  clientId: string;
  freelancerId: string;
  projectName?: string;
  clientName?: string;
  freelancerName?: string;
  clientAvatar?: string;
  freelancerAvatar?: string;
}): StoredConversation {
  const existing =
    (input.conversationId && conversations.find((c) => c.conversationId === input.conversationId)) ||
    conversations.find(
      (c) =>
        c.projectId === input.projectId &&
        c.clientId === input.clientId &&
        c.freelancerId === input.freelancerId
    );

  const now = new Date().toISOString();
  if (existing) {
    let changed = false;
    if (input.projectName && existing.projectName !== input.projectName) {
      existing.projectName = input.projectName;
      changed = true;
    }
    if (input.clientName && existing.clientName !== input.clientName) {
      existing.clientName = input.clientName;
      changed = true;
    }
    if (input.freelancerName && existing.freelancerName !== input.freelancerName) {
      existing.freelancerName = input.freelancerName;
      changed = true;
    }
    if (input.clientAvatar && existing.clientAvatar !== input.clientAvatar) {
      existing.clientAvatar = input.clientAvatar;
      changed = true;
    }
    if (input.freelancerAvatar && existing.freelancerAvatar !== input.freelancerAvatar) {
      existing.freelancerAvatar = input.freelancerAvatar;
      changed = true;
    }
    if (changed) {
      saveConversationsToDisk();
    }
    return existing;
  }

  const created: StoredConversation = {
    conversationId: input.conversationId || buildConversationId(input.projectId, input.clientId, input.freelancerId),
    clientId: input.clientId,
    freelancerId: input.freelancerId,
    projectId: input.projectId,
    projectName: input.projectName,
    clientName: input.clientName,
    freelancerName: input.freelancerName,
    clientAvatar: input.clientAvatar,
    freelancerAvatar: input.freelancerAvatar,
    createdAt: now,
    updatedAt: now,
  };
  conversations.unshift(created);
  saveConversationsToDisk();
  return created;
}

export function getConversationById(conversationId: string): StoredConversation | undefined {
  return conversations.find((c) => c.conversationId === conversationId);
}

export function getConversationByProjectAndUser(
  projectId: string,
  user: Pick<VerifiedChatUser, 'userId' | 'userRole'>
): StoredConversation | undefined {
  return conversations.find((c) => c.projectId === projectId && isUserParticipant(c, user));
}

export function getEnrichedUserConversations(user: Pick<VerifiedChatUser, 'userId' | 'userRole'>) {
  return conversations
    .filter((c) => isUserParticipant(c, user))
    .map((conv) => {
      const convMsgs = messages.filter((m) => m.conversationId === conv.conversationId);
      const lastMsg = convMsgs[convMsgs.length - 1];
      const unreadCount = convMsgs.filter((m) => m.senderId !== user.userId && !m.isRead).length;
      return {
        ...conv,
        lastMessage: lastMsg ? lastMsg.message : undefined,
        lastMessageAt: lastMsg ? lastMsg.createdAt : conv.updatedAt,
        unreadCount,
      };
    })
    .sort((a, b) => new Date(b.lastMessageAt || b.updatedAt).getTime() - new Date(a.lastMessageAt || a.updatedAt).getTime());
}

export function getMessagesForConversation(conversationId: string): StoredMessage[] {
  return messages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function addMessageToStore(msg: StoredMessage): { added: boolean; message: StoredMessage } {
  const dup = messages.find((m) => m.messageId === msg.messageId);
  if (dup) {
    return { added: false, message: dup };
  }

  messages.push(msg);
  if (messages.length > 5000) {
    messages = messages.slice(-5000);
  }

  const conv = getConversationById(msg.conversationId);
  if (conv) {
    conv.updatedAt = msg.createdAt;
    saveConversationsToDisk();
  }

  saveMessagesToDisk();
  return { added: true, message: msg };
}

export function markConversationMessagesRead(
  conversationId: string,
  readerUserId: string,
  specificMessageIds?: string[]
): { updatedMessageIds: string[]; readAt: string } {
  const readAt = new Date().toISOString();
  const specificSet = Array.isArray(specificMessageIds) && specificMessageIds.length > 0 ? new Set(specificMessageIds) : null;
  const updatedMessageIds: string[] = [];

  for (const m of messages) {
    if (m.conversationId === conversationId && m.senderId !== readerUserId && !m.isRead) {
      if (!specificSet || specificSet.has(m.messageId)) {
        m.isRead = true;
        m.readAt = readAt;
        updatedMessageIds.push(m.messageId);
      }
    }
  }

  if (updatedMessageIds.length > 0) {
    saveMessagesToDisk();
  }

  return { updatedMessageIds, readAt };
}

export function clearChatStoreForSandbox(): void {
  messages = [];
  saveMessagesToDisk();
}

export function getStoreStats() {
  return {
    conversationCount: conversations.length,
    messageCount: messages.length,
  };
}
