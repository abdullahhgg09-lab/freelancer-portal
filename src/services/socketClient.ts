import { io, Socket } from 'socket.io-client';
import { Message } from '../types';

export interface SocketAckResponse<T = Record<string, unknown>> {
  ok: boolean;
  error?: string;
  retryAfterMs?: number;
  conversationId?: string;
  messages?: Message[];
  message?: Message;
  updatedMessageIds?: string[];
  data?: T;
}

export interface TypingEventPayload {
  conversationId: string;
  projectId?: string;
  userId: string;
  userName: string;
}

export interface ReadReceiptEventPayload {
  conversationId: string;
  messageIds: string[];
  readBy: string;
  readAt: string;
}

export interface UserPresenceEventPayload {
  userId: string;
  userName?: string;
  userRole?: string;
}

export interface ChatErrorEventPayload {
  code: string;
  message: string;
  retryAfterMs?: number;
}

export function createPortalSocket(token: string): Socket {
  return io({
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    transports: ['websocket', 'polling'],
  });
}

export function joinConversationSocket(
  socket: Socket | null,
  payload: { conversationId?: string; projectId?: string }
): Promise<SocketAckResponse> {
  return new Promise((resolve) => {
    if (!socket || !socket.connected) {
      resolve({ ok: false, error: 'Socket not connected yet' });
      return;
    }
    socket.emit('join-conversation', payload, (resp: SocketAckResponse) => {
      resolve(resp || { ok: false, error: 'No response from server' });
    });
  });
}

export function sendSocketMessage(
  socket: Socket | null,
  payload: {
    conversationId: string;
    message: string;
    messageType?: string;
    messageId?: string;
  }
): Promise<SocketAckResponse> {
  return new Promise((resolve) => {
    if (!socket || !socket.connected) {
      resolve({ ok: false, error: 'Socket disconnected. Reconnecting...' });
      return;
    }
    socket.emit('send-message', payload, (resp: SocketAckResponse) => {
      resolve(resp || { ok: false, error: 'Failed to send message' });
    });
  });
}

export function emitSocketTyping(socket: Socket | null, conversationId: string): void {
  if (!socket || !socket.connected || !conversationId) return;
  socket.emit('typing', { conversationId });
}

export function emitSocketStopTyping(socket: Socket | null, conversationId: string): void {
  if (!socket || !socket.connected || !conversationId) return;
  socket.emit('stop-typing', { conversationId });
}

export function emitSocketMessageRead(
  socket: Socket | null,
  conversationId: string,
  messageIds?: string[]
): Promise<SocketAckResponse> {
  return new Promise((resolve) => {
    if (!socket || !socket.connected || !conversationId) {
      resolve({ ok: false });
      return;
    }
    socket.emit('message-read', { conversationId, messageIds }, (resp: SocketAckResponse) => {
      resolve(resp || { ok: true });
    });
  });
}
