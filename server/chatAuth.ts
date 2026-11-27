import crypto from 'node:crypto';

export const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

export interface VerifiedChatUser {
  userId: string;
  userName: string;
  userRole: 'admin' | 'freelancer' | 'client';
  email?: string;
  exp: number;
}

export function createSignedToken(payloadObj: Record<string, unknown>, ttlMs = 12 * 60 * 60 * 1000): string {
  const payload = Buffer.from(
    JSON.stringify({
      ...payloadObj,
      exp: Date.now() + ttlMs,
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySignedToken<T extends { exp?: number }>(token: string | undefined): T | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (!payload || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as T;
    if (!parsed || typeof parsed.exp !== 'number' || Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function createChatToken(user: {
  userId: string;
  userName: string;
  userRole: 'admin' | 'freelancer' | 'client';
  email?: string;
}): string {
  return createSignedToken({
    typ: 'chat',
    userId: user.userId,
    userName: user.userName,
    userRole: user.userRole,
    email: user.email,
  });
}

export function verifyChatToken(token: string | undefined): VerifiedChatUser | null {
  const parsed = verifySignedToken<VerifiedChatUser & { typ?: string }>(token);
  if (!parsed || parsed.typ !== 'chat') return null;
  if (!parsed.userId || !parsed.userName || !['admin', 'freelancer', 'client'].includes(parsed.userRole)) {
    return null;
  }
  return {
    userId: parsed.userId,
    userName: parsed.userName,
    userRole: parsed.userRole,
    email: parsed.email,
    exp: parsed.exp,
  };
}

// Sliding-window rate limiter per authenticated userId
const userMessageTimestamps = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX_MESSAGES = 15;

export function checkMessageRateLimit(userId: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const existing = (userMessageTimestamps.get(userId) || []).filter((ts) => ts > windowStart);

  if (existing.length >= RATE_LIMIT_MAX_MESSAGES) {
    const oldestInWindow = existing[0] || now;
    const retryAfterMs = Math.max(500, RATE_LIMIT_WINDOW_MS - (now - oldestInWindow));
    userMessageTimestamps.set(userId, existing);
    return { allowed: false, retryAfterMs };
  }

  existing.push(now);
  userMessageTimestamps.set(userId, existing);
  return { allowed: true, retryAfterMs: 0 };
}

export function sanitizeId(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/[^a-zA-Z0-9_.:-]/g, '').slice(0, 120);
}

export function validateMessageContent(raw: unknown): { valid: boolean; text: string; error?: string } {
  if (typeof raw !== 'string') {
    return { valid: false, text: '', error: 'Message text is required.' };
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, text: '', error: 'Message cannot be empty.' };
  }
  if (trimmed.length > 4000) {
    return { valid: false, text: '', error: 'Message exceeds maximum length of 4000 characters.' };
  }
  return { valid: true, text: trimmed };
}
