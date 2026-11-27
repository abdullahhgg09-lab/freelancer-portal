import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { avatarFreelancerProImg, avatarClientExecImg } from '../assets/images';
import type { Socket } from 'socket.io-client';
import {
  User,
  Project,
  Invoice,
  ProjectFile,
  Message,
  MessageTag,
  Conversation,
  ChatNotification,
  RoomParticipant,
  TypingParticipant,
  ActivityLog,
  ClientProfile,
  UserRole,
  SubscriptionPlanId,
  SupabaseConfig,
  ProjectStatus,
  PayoutSettings,
  RealtimePaymentRecord,
  FreelancerProfileSummary
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CLIENTS,
  INITIAL_PROJECTS,
  INITIAL_INVOICES,
  INITIAL_FILES,
  INITIAL_MESSAGES,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_PAYOUT_SETTINGS,
  INITIAL_REALTIME_TRANSACTIONS
} from '../data/mockData';
import { getSupabaseClient, testSupabaseConnection } from '../lib/supabase';
import {
  initFirebaseAuthListener,
  signOutFirebaseAuth,
} from '../services/firebaseAuth';
import {
  createPortalSocket,
  joinConversationSocket,
  sendSocketMessage,
  emitSocketTyping,
  emitSocketStopTyping,
  emitSocketMessageRead,
  type TypingEventPayload,
  type ReadReceiptEventPayload,
  type UserPresenceEventPayload,
  type ChatErrorEventPayload,
} from '../services/socketClient';

export interface PendingGmailConfirm {
  email: string;
  name: string;
  role: UserRole;
  signedInAt: string;
}

interface PortalContextType {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  clients: ClientProfile[];
  invoices: Invoice[];
  files: ProjectFile[];
  messages: Message[];
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (conversationId: string | null) => void;
  onlineUserIds: string[];
  typingByConversation: Record<string, TypingParticipant[]>;
  unreadTotalCount: number;
  chatError: string | null;
  clearChatError: () => void;
  incomingChatToast: ChatNotification | null;
  dismissChatToast: () => void;
  ensureProjectConversation: (project: Project) => Promise<Conversation | null>;
  openConversationForProject: (project: Project) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
  sendChatMessage: (
    conversationId: string,
    content: string,
    tag?: MessageTag
  ) => Promise<{ ok: boolean; message?: Message; error?: string }>;
  emitTyping: (conversationId: string) => void;
  emitStopTyping: (conversationId: string) => void;
  activityLogs: ActivityLog[];
  supabaseConfig: SupabaseConfig;
  currency: 'PKR' | 'USD';
  isSupabaseGuideOpen: boolean;
  setIsSupabaseGuideOpen: (open: boolean) => void;
  isGuideVideoOpen: boolean;
  setIsGuideVideoOpen: (open: boolean) => void;
  isDebitModalOpen: boolean;
  setIsDebitModalOpen: (open: boolean) => void;
  selectedPlanForPayment: SubscriptionPlanId;
  setSelectedPlanForPayment: (plan: SubscriptionPlanId) => void;
  setCurrency: (c: 'PKR' | 'USD') => void;
  payoutSettings: PayoutSettings;
  updatePayoutSettings: (newSettings: Partial<PayoutSettings>) => void;
  realtimeTransactions: RealtimePaymentRecord[];
  isDeploymentModalOpen: boolean;
  setIsDeploymentModalOpen: (open: boolean) => void;
  selectedInvoiceForPayment: Invoice | null;
  setSelectedInvoiceForPayment: (invoice: Invoice | null) => void;
  isProductionMode: boolean;
  setIsProductionMode: (isProd: boolean) => void;
  processRealtimePayment: (data: {
    amount: number;
    currency: string;
    targetType: 'invoice' | 'subscription';
    targetId?: string;
    targetTitle: string;
    senderName: string;
    senderEmail: string;
    senderCountry: string;
    paymentChannel: 'visa' | 'mastercard' | 'amex' | 'raast' | 'bank_wire';
    cardholderName?: string;
    cardNumberMasked?: string;
  }) => Promise<{ success: boolean; transactionRef: string; record: RealtimePaymentRecord; message: string }>;
  login: (username: string, password?: string, role?: UserRole) => { success: boolean; message?: string };
  loginAdmin: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; needsClaim?: boolean; message?: string }>;
  claimAdminPassword: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  isAdminAuthenticated: boolean;
  loginWithGoogle: (
    email?: string,
    name?: string,
    rolePreference?: UserRole,
    avatarUrl?: string | null,
    triggerGmailConfirm?: boolean
  ) => { success: boolean; user?: User };
  loginWithApple: (
    email?: string,
    name?: string,
    rolePreference?: UserRole,
    avatarUrl?: string | null
  ) => { success: boolean; user?: User };
  pendingGmailConfirm: PendingGmailConfirm | null;
  setPendingGmailConfirm: (info: PendingGmailConfirm | null) => void;
  registerUser: (userData: { name: string; email: string; username: string; role: UserRole; company?: string; phone?: string }) => { success: boolean; message?: string };
  updateUserProfile: (data: Partial<User>) => void;
  processProPlanPayment: (paymentData: { planId: SubscriptionPlanId; cardholderName: string; cardNumber: string; expiry: string; cvv: string; bankName: string }) => Promise<{ success: boolean; transactionRef: string; message: string; amount: number }>;
  logout: () => void;
  switchRole: (role: UserRole, targetId?: string) => void;
  addProject: (data: Omit<Project, 'id' | 'createdAt'>) => Project;
  updateProjectStatus: (id: string, status: ProjectStatus, progress?: number) => void;
  updateProject: (project: Project) => void;
  toggleTaskCompletion: (projectId: string, taskId: string) => void;
  addInvoice: (data: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>) => Invoice;
  markInvoicePaid: (id: string) => void;
  addFile: (data: Omit<ProjectFile, 'id' | 'uploadedAt'>) => ProjectFile;
  deleteFile: (id: string) => void;
  sendMessage: (
    projectId: string,
    content: string,
    recipientId: string,
    recipientName: string,
    tag?: MessageTag,
    projectName?: string
  ) => Message;
  activeChatProjectId: string | null;
  setActiveChatProjectId: (projectId: string | null) => void;
  openProjectChat: (projectId: string) => void;
  wsStatus: 'connecting' | 'connected' | 'offline';
  roomPresence: Record<string, RoomParticipant[]>;
  roomTyping: Record<string, TypingParticipant[]>;
  joinProjectRoom: (projectId: string) => void;
  leaveProjectRoom: (projectId: string) => void;
  sendTypingState: (projectId: string, isTyping: boolean) => void;
  addClient: (data: Omit<ClientProfile, 'id' | 'createdAt'>) => ClientProfile;
  toggleUserStatus: (userId: string) => void;
  upgradePlan: (plan: SubscriptionPlanId) => void;
  saveSupabaseConfig: (url: string, key: string) => Promise<{ success: boolean; message: string }>;
  directoryFreelancers: FreelancerProfileSummary[];
  startInquiryChatWithFreelancer: (freelancer: FreelancerProfileSummary) => string;
  resetDemoData: () => void;
  resetSandboxData: () => Promise<void>;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER: 'fcp_current_user',
  USERS: 'fcp_users',
  PROJECTS: 'fcp_projects',
  CLIENTS: 'fcp_clients',
  INVOICES: 'fcp_invoices',
  FILES: 'fcp_files',
  MESSAGES: 'fcp_messages',
  LOGS: 'fcp_logs',
  CURRENCY: 'fcp_currency',
  SUPABASE_URL: 'portal_supabase_url',
  SUPABASE_KEY: 'portal_supabase_key',
  PAYOUT_SETTINGS: 'fcp_payout_settings',
  REALTIME_TXS: 'fcp_realtime_transactions',
  PRODUCTION_MODE: 'fcp_env_mode_v2',
};

function loadStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    // If parsed array has old mock users or old dummy projects, purge and use fallback
    if (
      Array.isArray(parsed) &&
      parsed.some(
        (item: any) =>
          item?.id === 'user-free-1' ||
          item?.id === 'user-client-1' ||
          item?.id === 'proj-1' ||
          item?.id === 'cp-1' ||
          item?.username === 'hamza_dev' ||
          item?.username === 'sarah_technova'
      )
    ) {
      localStorage.removeItem(key);
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function saveStored<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => loadStored(STORAGE_KEYS.USERS, INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = loadStored<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (
      stored &&
      (stored.role === 'admin' ||
        stored.id === 'user-free-1' ||
        stored.id === 'user-client-1' ||
        stored.username === 'hamza_dev' ||
        stored.username === 'sarah_technova')
    ) {
      if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      return null;
    }
    return stored;
  });
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const isAdminAuthenticated = Boolean(adminToken && currentUser?.role === 'admin');
  const [projects, setProjects] = useState<Project[]>(() => loadStored(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS));
  const [clients, setClients] = useState<ClientProfile[]>(() => loadStored(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS));
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadStored(STORAGE_KEYS.INVOICES, INITIAL_INVOICES));
  const [files, setFiles] = useState<ProjectFile[]>(() => loadStored(STORAGE_KEYS.FILES, INITIAL_FILES));
  const [messages, setMessages] = useState<Message[]>(() => loadStored(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => loadStored(STORAGE_KEYS.LOGS, INITIAL_ACTIVITY_LOGS));
  const [currency, setCurrencyState] = useState<'PKR' | 'USD'>(() => loadStored(STORAGE_KEYS.CURRENCY, 'PKR'));
  const [isSupabaseGuideOpen, setIsSupabaseGuideOpen] = useState(false);
  const [isGuideVideoOpen, setIsGuideVideoOpen] = useState(false);
  const [isDebitModalOpen, setIsDebitModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<SubscriptionPlanId>('pro');

  // Real-Time Payout & Gateway State (Direct Remittance to Abdullah)
  const [payoutSettings, setPayoutSettings] = useState<PayoutSettings>(() =>
    loadStored(STORAGE_KEYS.PAYOUT_SETTINGS, INITIAL_PAYOUT_SETTINGS)
  );
  const [realtimeTransactions, setRealtimeTransactions] = useState<RealtimePaymentRecord[]>(() =>
    loadStored(STORAGE_KEYS.REALTIME_TXS, INITIAL_REALTIME_TRANSACTIONS)
  );
  const [isProductionMode, setIsProductionModeState] = useState<boolean>(() =>
    loadStored(STORAGE_KEYS.PRODUCTION_MODE, false)
  );
  const [isDeploymentModalOpen, setIsDeploymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [activeChatProjectId, setActiveChatProjectId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [typingByConversation, setTypingByConversation] = useState<Record<string, TypingParticipant[]>>({});
  const [chatError, setChatError] = useState<string | null>(null);
  const [incomingChatToast, setIncomingChatToast] = useState<ChatNotification | null>(null);
  const [chatToken, setChatToken] = useState<string | null>(null);
  const [pendingGmailConfirm, setPendingGmailConfirm] = useState<PendingGmailConfirm | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'offline'>('offline');
  const [roomPresence, setRoomPresence] = useState<Record<string, RoomParticipant[]>>({});
  const [roomTyping, setRoomTyping] = useState<Record<string, TypingParticipant[]>>({});
  const [serverFreelancers, setServerFreelancers] = useState<FreelancerProfileSummary[]>([]);

  useEffect(() => {
    const unsubscribe = initFirebaseAuthListener();
    return () => unsubscribe();
  }, []);

  const socketRef = useRef<Socket | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const joinedConvIdsRef = useRef<Set<string>>(new Set());
  const chatTokenRef = useRef<string | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const activeChatProjectIdRef = useRef<string | null>(null);
  const currentUserRef = useRef<User | null>(currentUser);
  const usersRef = useRef<User[]>(users);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  useEffect(() => {
    usersRef.current = users;
  }, [users]);
  useEffect(() => {
    chatTokenRef.current = chatToken;
  }, [chatToken]);
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);
  useEffect(() => {
    activeChatProjectIdRef.current = activeChatProjectId;
  }, [activeChatProjectId]);

  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => {
    const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
    const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';
    const url = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) : '') || envUrl;
    const anonKey = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) : '') || envKey;
    return {
      url,
      anonKey,
      isConnected: Boolean(url && anonKey),
      tableNamePrefix: 'portal_',
    };
  });

  // Sync state to localStorage (never persist admin sessions or chat tokens to localStorage)
  useEffect(() => saveStored(STORAGE_KEYS.USERS, users), [users]);
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      return;
    }
    saveStored(STORAGE_KEYS.CURRENT_USER, currentUser);
  }, [currentUser]);
  useEffect(() => saveStored(STORAGE_KEYS.PROJECTS, projects), [projects]);
  useEffect(() => saveStored(STORAGE_KEYS.CLIENTS, clients), [clients]);
  useEffect(() => saveStored(STORAGE_KEYS.INVOICES, invoices), [invoices]);
  useEffect(() => saveStored(STORAGE_KEYS.FILES, files), [files]);
  useEffect(() => saveStored(STORAGE_KEYS.MESSAGES, messages), [messages]);
  useEffect(() => saveStored(STORAGE_KEYS.LOGS, activityLogs), [activityLogs]);
  useEffect(() => saveStored(STORAGE_KEYS.CURRENCY, currency), [currency]);
  useEffect(() => saveStored(STORAGE_KEYS.PAYOUT_SETTINGS, payoutSettings), [payoutSettings]);
  useEffect(() => saveStored(STORAGE_KEYS.REALTIME_TXS, realtimeTransactions), [realtimeTransactions]);
  useEffect(() => saveStored(STORAGE_KEYS.PRODUCTION_MODE, isProductionMode), [isProductionMode]);

  const normalizeMessageRecord = useCallback((raw: any): Message => {
    const msgId = String(raw.messageId || raw.id);
    const createdAt = String(raw.createdAt || raw.timestamp || new Date().toISOString());
    const text = String(raw.message ?? raw.content ?? '');
    return {
      ...raw,
      messageId: msgId,
      id: msgId,
      conversationId: String(raw.conversationId || `conv-${raw.projectId || 'general'}`),
      message: text,
      content: text,
      messageType: raw.messageType || raw.tag || 'general',
      tag: raw.tag || raw.messageType || 'general',
      isRead: Boolean(raw.isRead),
      createdAt,
      timestamp: createdAt,
    };
  }, []);

  const mergeIncomingMessages = useCallback(
    (incomingList: Message[]) => {
      if (!Array.isArray(incomingList) || incomingList.length === 0) return;
      const normalized = incomingList.filter((m) => m && (m.messageId || m.id)).map(normalizeMessageRecord);
      if (normalized.length === 0) return;

      setMessages((prev) => {
        const byId = new Map<string, Message>();
        for (const m of prev) {
          const nm = normalizeMessageRecord(m);
          byId.set(nm.messageId, nm);
        }
        let changed = false;
        for (const nm of normalized) {
          const existing = byId.get(nm.messageId);
          if (!existing || existing.isRead !== nm.isRead || existing.conversationId !== nm.conversationId) {
            byId.set(nm.messageId, { ...(existing || {}), ...nm });
            changed = true;
          }
        }
        if (!changed) return prev;
        return Array.from(byId.values()).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
    },
    [normalizeMessageRecord]
  );

  // Cross-tab synchronization for local workspace state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        if (e.key === STORAGE_KEYS.PROJECTS && Array.isArray(parsed)) setProjects(parsed);
        else if (e.key === STORAGE_KEYS.CLIENTS && Array.isArray(parsed)) setClients(parsed);
        else if (e.key === STORAGE_KEYS.INVOICES && Array.isArray(parsed)) setInvoices(parsed);
        else if (e.key === STORAGE_KEYS.FILES && Array.isArray(parsed)) setFiles(parsed);
        else if (e.key === STORAGE_KEYS.USERS && Array.isArray(parsed)) setUsers(parsed);
        else if (e.key === STORAGE_KEYS.MESSAGES && Array.isArray(parsed)) mergeIncomingMessages(parsed);
      } catch {
        // ignore invalid JSON
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [mergeIncomingMessages]);

  // Fetch public freelancers directory on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    fetch('/api/freelancers')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.freelancers)) {
          setServerFreelancers(data.freelancers);
        }
      })
      .catch(() => {
        // Ignore on static host
      });
  }, []);

  // Mint signed server chat session token whenever currentUser changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!currentUser) {
      setChatToken(null);
      setConversations([]);
      setOnlineUserIds([]);
      setWsStatus('offline');
      return;
    }

    if (currentUser.role === 'admin' && !adminToken) {
      setChatToken(null);
      return;
    }

    let cancelled = false;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (currentUser.role === 'admin' && adminToken) {
      headers.Authorization = `Bearer ${adminToken}`;
    }

    fetch('/api/chat/session', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        email: currentUser.email,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.ok && data.token) {
          setChatToken(data.token);
          if (Array.isArray(data.onlineUserIds)) {
            setOnlineUserIds(data.onlineUserIds);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setWsStatus('offline');
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.name, currentUser?.role, currentUser?.email, adminToken]);

  const clearChatError = useCallback(() => setChatError(null), []);
  const dismissChatToast = useCallback(() => setIncomingChatToast(null), []);

  const markConversationRead = useCallback(async (conversationId: string) => {
    if (!conversationId || !currentUserRef.current) return;
    const readerId = currentUserRef.current.id;
    const readAt = new Date().toISOString();

    setMessages((prev) =>
      prev.map((m) =>
        m.conversationId === conversationId && m.senderId !== readerId && !m.isRead
          ? { ...m, isRead: true, readAt }
          : m
      )
    );
    setConversations((prev) =>
      prev.map((c) => (c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c))
    );

    if (socketRef.current?.connected) {
      await emitSocketMessageRead(socketRef.current, conversationId);
    } else if (chatTokenRef.current) {
      fetch(`/api/conversations/${encodeURIComponent(conversationId)}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${chatTokenRef.current}` },
      }).catch(() => {});
    }
  }, []);

  // Connect & maintain authenticated Socket.IO client when chatToken is available
  useEffect(() => {
    if (typeof window === 'undefined' || !chatToken || !currentUser) {
      return;
    }

    let isUnmounted = false;
    setWsStatus('connecting');

    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('fcp_realtime_chat');
      broadcastRef.current = channel;
      channel.onmessage = (evt) => {
        if (evt.data?.type === 'message:created' && evt.data.payload) {
          mergeIncomingMessages([evt.data.payload as Message]);
        }
      };
    }

    const socket = createPortalSocket(chatToken);
    socketRef.current = socket;

    const hydrateConversations = async () => {
      try {
        const res = await fetch('/api/conversations', {
          headers: { Authorization: `Bearer ${chatToken}` },
        });
        if (!res.ok || isUnmounted) return;
        const data = await res.json();
        if (Array.isArray(data?.conversations)) {
          setConversations(data.conversations);
          if (Array.isArray(data.onlineUserIds)) {
            setOnlineUserIds(data.onlineUserIds);
          }
          // Hydrate message history for each authorized conversation
          await Promise.all(
            data.conversations.map(async (conv: Conversation) => {
              joinedConvIdsRef.current.add(conv.conversationId);
              if (socket.connected) {
                const ack = await joinConversationSocket(socket, { conversationId: conv.conversationId });
                if (ack.ok && Array.isArray(ack.messages)) {
                  mergeIncomingMessages(ack.messages);
                }
              } else {
                const msgRes = await fetch(`/api/conversations/${encodeURIComponent(conv.conversationId)}/messages`, {
                  headers: { Authorization: `Bearer ${chatToken}` },
                });
                if (msgRes.ok) {
                  const msgData = await msgRes.json();
                  if (Array.isArray(msgData?.messages)) {
                    mergeIncomingMessages(msgData.messages);
                  }
                }
              }
            })
          );
        }
      } catch {
        // Ignore transient network errors
      }
    };

    socket.on('connect', () => {
      if (isUnmounted) return;
      setWsStatus('connected');
      setChatError(null);
      void hydrateConversations();
      for (const convId of joinedConvIdsRef.current) {
        void joinConversationSocket(socket, { conversationId: convId }).then((ack) => {
          if (ack.ok && Array.isArray(ack.messages)) {
            mergeIncomingMessages(ack.messages);
          }
        });
      }
    });

    socket.on('disconnect', () => {
      if (!isUnmounted) setWsStatus('offline');
    });

    socket.on('connect_error', () => {
      if (!isUnmounted) setWsStatus('offline');
    });

    socket.on('online-users', (payload: { userIds?: string[] }) => {
      if (Array.isArray(payload?.userIds)) {
        setOnlineUserIds(payload.userIds);
      }
    });

    socket.on('user-online', (payload: UserPresenceEventPayload) => {
      if (!payload?.userId) return;
      setOnlineUserIds((prev) => (prev.includes(payload.userId) ? prev : [...prev, payload.userId]));
    });

    socket.on('user-offline', (payload: UserPresenceEventPayload) => {
      if (!payload?.userId) return;
      setOnlineUserIds((prev) => prev.filter((id) => id !== payload.userId));
    });

    socket.on('conversation:updated', (conv: Conversation) => {
      if (!conv?.conversationId) return;
      setConversations((prev) => {
        const exists = prev.some((c) => c.conversationId === conv.conversationId);
        if (exists) {
          return prev.map((c) => (c.conversationId === conv.conversationId ? { ...c, ...conv } : c));
        }
        return [conv, ...prev];
      });
      joinedConvIdsRef.current.add(conv.conversationId);
      void joinConversationSocket(socket, { conversationId: conv.conversationId });
    });

    socket.on('receive-message', (rawMsg: Message) => {
      const msg = normalizeMessageRecord(rawMsg);
      mergeIncomingMessages([msg]);

      const viewerId = currentUserRef.current?.id;
      const isFromPartner = Boolean(viewerId && msg.senderId !== viewerId);
      const isViewingThisConversation =
        activeConversationIdRef.current === msg.conversationId ||
        activeChatProjectIdRef.current === msg.projectId;

      if (isFromPartner && isViewingThisConversation) {
        void emitSocketMessageRead(socket, msg.conversationId, [msg.messageId]);
      }

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.conversationId === msg.conversationId);
        if (idx === -1) {
          const isSenderClient = msg.senderRole === 'client';
          const createdConv: Conversation = {
            conversationId: msg.conversationId,
            clientId: isSenderClient ? msg.senderId : msg.recipientId,
            freelancerId: isSenderClient ? msg.recipientId : msg.senderId,
            projectId: msg.projectId,
            projectName: msg.projectName,
            clientName: isSenderClient ? msg.senderName : msg.recipientName,
            freelancerName: isSenderClient ? msg.recipientName : msg.senderName,
            lastMessage: msg.message,
            lastMessageAt: msg.createdAt,
            unreadCount: isFromPartner && !isViewingThisConversation ? 1 : 0,
            createdAt: msg.createdAt,
            updatedAt: msg.createdAt,
          };
          return [createdConv, ...prev];
        }
        const updated = [...prev];
        const target = updated[idx];
        updated[idx] = {
          ...target,
          lastMessage: msg.message,
          lastMessageAt: msg.createdAt,
          updatedAt: msg.createdAt,
          unreadCount:
            isFromPartner && !isViewingThisConversation ? (target.unreadCount || 0) + 1 : 0,
        };
        return updated.sort(
          (a, b) => new Date(b.lastMessageAt || b.updatedAt).getTime() - new Date(a.lastMessageAt || a.updatedAt).getTime()
        );
      });

      if (isFromPartner && !isViewingThisConversation) {
        setIncomingChatToast({
          id: msg.messageId,
          conversationId: msg.conversationId,
          projectId: msg.projectId,
          projectName: msg.projectName || 'Project Chat',
          senderId: msg.senderId,
          senderName: msg.senderName,
          message: msg.message,
          createdAt: msg.createdAt,
        });
      }
    });

    socket.on('typing', (payload: TypingEventPayload) => {
      if (!payload?.conversationId || !payload.userId) return;
      if (payload.userId === currentUserRef.current?.id) return;

      setTypingByConversation((prev) => {
        const current = prev[payload.conversationId] || [];
        if (current.some((u) => u.userId === payload.userId)) return prev;
        return {
          ...prev,
          [payload.conversationId]: [...current, { userId: payload.userId, userName: payload.userName || 'User' }],
        };
      });

      if (payload.projectId) {
        setRoomTyping((prev) => {
          const current = prev[payload.projectId!] || [];
          if (current.some((u) => u.userId === payload.userId)) return prev;
          return {
            ...prev,
            [payload.projectId!]: [...current, { userId: payload.userId, userName: payload.userName || 'User' }],
          };
        });
      }
    });

    socket.on('stop-typing', (payload: TypingEventPayload) => {
      if (!payload?.conversationId || !payload.userId) return;
      setTypingByConversation((prev) => ({
        ...prev,
        [payload.conversationId]: (prev[payload.conversationId] || []).filter((u) => u.userId !== payload.userId),
      }));
      if (payload.projectId) {
        setRoomTyping((prev) => ({
          ...prev,
          [payload.projectId!]: (prev[payload.projectId!] || []).filter((u) => u.userId !== payload.userId),
        }));
      }
    });

    socket.on('message-read', (payload: ReadReceiptEventPayload) => {
      if (!payload?.conversationId || !Array.isArray(payload.messageIds)) return;
      const readSet = new Set(payload.messageIds);
      setMessages((prev) =>
        prev.map((m) =>
          m.conversationId === payload.conversationId && readSet.has(m.messageId)
            ? { ...m, isRead: true, readAt: payload.readAt }
            : m
        )
      );
      if (payload.readBy === currentUserRef.current?.id) {
        setConversations((prev) =>
          prev.map((c) => (c.conversationId === payload.conversationId ? { ...c, unreadCount: 0 } : c))
        );
      }
    });

    socket.on('chat-error', (payload: ChatErrorEventPayload) => {
      if (payload?.message) {
        setChatError(payload.message);
      }
    });

    socket.on('freelancers:updated', (payload: { freelancers?: FreelancerProfileSummary[] }) => {
      if (Array.isArray(payload?.freelancers)) {
        setServerFreelancers(payload.freelancers);
      }
    });

    socket.on('sandbox:reset', () => {
      setMessages([]);
      setConversations((prev) => prev.map((c) => ({ ...c, lastMessage: undefined, unreadCount: 0 })));
    });

    return () => {
      isUnmounted = true;
      socket.disconnect();
      socketRef.current = null;
      if (broadcastRef.current) {
        broadcastRef.current.close();
        broadcastRef.current = null;
      }
    };
  }, [chatToken, currentUser?.id, mergeIncomingMessages, normalizeMessageRecord]);

  // Sync onlineUserIds -> legacy roomPresence keyed by projectId for smooth UI badges
  useEffect(() => {
    const nextPresence: Record<string, RoomParticipant[]> = {};
    for (const conv of conversations) {
      const activeList: RoomParticipant[] = [];
      if (onlineUserIds.includes(conv.clientId)) {
        activeList.push({ userId: conv.clientId, userName: conv.clientName || 'Client', userRole: 'client' });
      }
      if (onlineUserIds.includes(conv.freelancerId)) {
        activeList.push({ userId: conv.freelancerId, userName: conv.freelancerName || 'Freelancer', userRole: 'freelancer' });
      }
      nextPresence[conv.projectId] = activeList;
    }
    setRoomPresence(nextPresence);
  }, [conversations, onlineUserIds]);

  const ensureProjectConversation = useCallback(
    async (project: Project): Promise<Conversation | null> => {
      const user = currentUserRef.current;
      const token = chatTokenRef.current;
      if (!user || !project) return null;

      // Only participants can create/open a private project conversation
      if (user.id !== project.clientId && user.id !== project.freelancerId) {
        setChatError('Unauthorized: you are not assigned to this project conversation.');
        return null;
      }

      const clientAvatar = usersRef.current.find((u) => u.id === project.clientId)?.avatarUrl;
      const freelancerAvatar = usersRef.current.find((u) => u.id === project.freelancerId)?.avatarUrl;

      if (token) {
        try {
          const res = await fetch('/api/conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              projectId: project.id,
              clientId: project.clientId,
              freelancerId: project.freelancerId,
              projectName: project.name,
              clientName: project.clientName,
              freelancerName: project.freelancerName,
              clientAvatar,
              freelancerAvatar,
            }),
          });
          const data = await res.json().catch(() => null);
          if (res.ok && data?.conversation) {
            const conv = data.conversation as Conversation;
            setConversations((prev) => {
              const exists = prev.some((c) => c.conversationId === conv.conversationId);
              if (exists) return prev.map((c) => (c.conversationId === conv.conversationId ? { ...c, ...conv } : c));
              return [conv, ...prev];
            });
            if (Array.isArray(data.messages)) {
              mergeIncomingMessages(data.messages);
            }
            joinedConvIdsRef.current.add(conv.conversationId);
            if (socketRef.current?.connected) {
              await joinConversationSocket(socketRef.current, { conversationId: conv.conversationId });
            }
            return conv;
          } else if (data?.message) {
            setChatError(data.message);
          }
        } catch {
          // Fallback silently to local conversation placeholder if offline
        }
      }

      const existing = conversations.find(
        (c) =>
          c.projectId === project.id &&
          c.clientId === project.clientId &&
          c.freelancerId === project.freelancerId
      );
      return existing || null;
    },
    [conversations, mergeIncomingMessages]
  );

  // Auto-sync conversations for projects belonging to the signed-in user once chatToken is ready
  useEffect(() => {
    if (!chatToken || !currentUser || projects.length === 0) return;
    const myOwned = projects.filter(
      (p) => p.clientId === currentUser.id || p.freelancerId === currentUser.id
    );
    for (const proj of myOwned) {
      const alreadyLoaded = conversations.some((c) => c.projectId === proj.id);
      if (!alreadyLoaded) {
        void ensureProjectConversation(proj);
      }
    }
  }, [chatToken, currentUser?.id, projects, conversations, ensureProjectConversation]);

  const joinProjectRoom = useCallback(
    (projectId: string) => {
      if (!projectId) return;
      const proj = projects.find((p) => p.id === projectId);
      const conv = conversations.find((c) => c.projectId === projectId);
      if (conv) {
        joinedConvIdsRef.current.add(conv.conversationId);
        if (socketRef.current?.connected) {
          void joinConversationSocket(socketRef.current, { conversationId: conv.conversationId }).then((ack) => {
            if (ack.ok && Array.isArray(ack.messages)) {
              mergeIncomingMessages(ack.messages);
            }
          });
        }
        void markConversationRead(conv.conversationId);
      } else if (proj) {
        void ensureProjectConversation(proj).then((created) => {
          if (created) void markConversationRead(created.conversationId);
        });
      }
    },
    [projects, conversations, mergeIncomingMessages, ensureProjectConversation, markConversationRead]
  );

  const leaveProjectRoom = useCallback((projectId: string) => {
    if (!projectId) return;
    const conv = conversations.find((c) => c.projectId === projectId);
    if (conv && socketRef.current?.connected) {
      emitSocketStopTyping(socketRef.current, conv.conversationId);
    }
  }, [conversations]);

  const emitTyping = useCallback((conversationId: string) => {
    if (!conversationId) return;
    emitSocketTyping(socketRef.current, conversationId);
  }, []);

  const emitStopTyping = useCallback((conversationId: string) => {
    if (!conversationId) return;
    emitSocketStopTyping(socketRef.current, conversationId);
  }, []);

  const sendTypingState = useCallback(
    (projectId: string, isTyping: boolean) => {
      const conv = conversations.find((c) => c.projectId === projectId);
      if (!conv) return;
      if (isTyping) emitSocketTyping(socketRef.current, conv.conversationId);
      else emitSocketStopTyping(socketRef.current, conv.conversationId);
    },
    [conversations]
  );

  const openConversationForProject = useCallback(
    async (project: Project) => {
      const conv = await ensureProjectConversation(project);
      if (conv) {
        setActiveConversationId(conv.conversationId);
        await markConversationRead(conv.conversationId);
      }
      setActiveChatProjectId(project.id);
    },
    [ensureProjectConversation, markConversationRead]
  );

  const openProjectChat = useCallback(
    (projectId: string) => {
      const proj = projects.find((p) => p.id === projectId);
      if (proj) {
        void openConversationForProject(proj);
      } else {
        setActiveChatProjectId(projectId);
      }
    },
    [projects, openConversationForProject]
  );

  const unreadTotalCount = React.useMemo(() => {
    if (!currentUser) return 0;
    return conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  }, [conversations, currentUser]);

  const syncFreelancerDirectoryProfile = useCallback((user: User) => {
    if (user.role !== 'freelancer' && user.role !== 'admin') return;
    fetch('/api/freelancers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
        company: user.company,
        bio: user.bio,
        address: user.address,
        headline: user.headline,
        category: user.category,
        skills: user.skills,
        hourlyRatePkr: user.hourlyRatePkr,
        availability: user.availability || 'available',
        isListedInDirectory: user.isListedInDirectory !== false,
      }),
    }).catch(() => {
      // Ignore if running on static host without API
    });
  }, []);

  const logActivity = (action: string, details: string, category: ActivityLog['category'] = 'system') => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'System Guest',
      userRole: currentUser?.role || 'freelancer',
      action,
      details,
      category,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const setCurrency = (c: 'PKR' | 'USD') => {
    setCurrencyState(c);
    logActivity('Currency Changed', `Switched active display currency to ${c}`, 'system');
  };

  const loginAdmin = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; needsClaim?: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.token) {
        return {
          success: false,
          needsClaim: Boolean(data?.needsClaim),
          message: data?.message || 'Invalid admin email or password.',
        };
      }

      const adminUser: User = {
        ...(users.find((u) => u.id === 'user-admin') || INITIAL_USERS[0]),
        email: data.admin?.email || email.trim().toLowerCase(),
        role: 'admin',
      };
      setAdminToken(data.token);
      setCurrentUser(adminUser);
      logActivity('Admin Logged In', `Verified Admin (${adminUser.email}) authenticated`, 'auth');
      return { success: true };
    } catch {
      return { success: false, message: 'Unable to reach authentication server.' };
    }
  };

  const claimAdminPassword = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/admin/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.token) {
        return {
          success: false,
          message: data?.message || 'Unable to set admin password.',
        };
      }

      const adminUser: User = {
        ...(users.find((u) => u.id === 'user-admin') || INITIAL_USERS[0]),
        email: data.admin?.email || email.trim().toLowerCase(),
        role: 'admin',
      };
      setAdminToken(data.token);
      setCurrentUser(adminUser);
      logActivity('Admin Credentials Claimed', `Verified Admin (${adminUser.email}) configured and signed in`, 'auth');
      return { success: true };
    } catch {
      return { success: false, message: 'Unable to reach authentication server.' };
    }
  };

  const login = (username: string, _password?: string, rolePreference?: UserRole): { success: boolean; message?: string } => {
    const cleanUser = username.trim().toLowerCase();

    // Match non-admin accounts by username or email
    const found = users.find(
      (u) =>
        u.role !== 'admin' &&
        (u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser)
    );

    if (found) {
      if (found.status === 'suspended') {
        return { success: false, message: 'This account has been suspended by the platform administrator.' };
      }
      setAdminToken(null);
      setCurrentUser(found);
      logActivity('User Logged In', `${found.name} (${found.role}) authenticated`, 'auth');
      if (found.email && found.email.includes('@')) {
        setPendingGmailConfirm({
          email: found.email,
          name: found.name,
          role: found.role,
          signedInAt: new Date().toISOString(),
        });
      }
      return { success: true };
    }

    // If new freelancer signup
    if (rolePreference === 'freelancer') {
      const newUser: User = {
        id: `user-${Date.now()}`,
        username: cleanUser.replace(/[^a-z0-9_]/g, '') || 'freelancer_' + Date.now(),
        email: cleanUser.includes('@') ? cleanUser : `${cleanUser}@freelancerportal.pk`,
        name: username,
        role: 'freelancer',
        avatarUrl: avatarFreelancerProImg,
        status: 'active',
        createdAt: new Date().toISOString(),
        plan: 'free',
      };
      setUsers((prev) => [...prev, newUser]);
      setCurrentUser(newUser);
      syncFreelancerDirectoryProfile(newUser);
      logActivity('Freelancer Registered', `New freelancer registered: ${newUser.name}`, 'auth');
      if (newUser.email && newUser.email.includes('@')) {
        setPendingGmailConfirm({
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          signedInAt: new Date().toISOString(),
        });
      }
      return { success: true };
    }

    return { success: false, message: 'User not found. Use Demo Quick Login or register below.' };
  };

  const loginWithGoogle = (
    emailParam?: string,
    nameParam?: string,
    rolePreference: UserRole = 'freelancer',
    avatarUrlParam?: string | null,
    triggerGmailConfirm: boolean = true
  ): { success: boolean; user?: User } => {
    const googleEmail = (emailParam || 'abdullahhgg09@gmail.com').trim().toLowerCase();
    const googleName = nameParam || (googleEmail.includes('abdullah') ? 'Abdullah' : googleEmail.split('@')[0]);

    // Match user with exact email and requested role so users can log in cleanly as Freelancer or Client
    let matchedUser = users.find(
      (u) => u.email.toLowerCase() === googleEmail && u.role === rolePreference
    );

    if (!matchedUser) {
      matchedUser = {
        id: `user-g-${Date.now()}`,
        username: `${googleEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_') || 'google_user'}_${rolePreference === 'client' ? 'c' : 'f'}`,
        email: googleEmail,
        name: googleName,
        role: rolePreference,
        avatarUrl:
          avatarUrlParam ||
          (rolePreference === 'client' ? avatarClientExecImg : avatarFreelancerProImg),
        company: rolePreference === 'client' ? 'Client Workspace' : 'FreelancePort Studio',
        status: 'active',
        createdAt: new Date().toISOString(),
        plan: 'starter',
      };
      setUsers((prev) => [...prev, matchedUser!]);
    } else if (avatarUrlParam && matchedUser.avatarUrl !== avatarUrlParam) {
      matchedUser = { ...matchedUser, avatarUrl: avatarUrlParam };
      setUsers((prev) => prev.map((u) => (u.id === matchedUser!.id ? matchedUser! : u)));
    }

    if (matchedUser.status === 'suspended') {
      return { success: false };
    }

    setCurrentUser(matchedUser);
    syncFreelancerDirectoryProfile(matchedUser);
    logActivity('Google Sign In', `${matchedUser.name} authenticated via Google Account (${matchedUser.email}) as ${matchedUser.role}`, 'auth');

    if (triggerGmailConfirm && matchedUser.email) {
      setPendingGmailConfirm({
        email: matchedUser.email,
        name: matchedUser.name,
        role: matchedUser.role,
        signedInAt: new Date().toISOString(),
      });
    }

    return { success: true, user: matchedUser };
  };

  const loginWithApple = (
    emailParam?: string,
    nameParam?: string,
    rolePreference: UserRole = 'freelancer',
    avatarUrlParam?: string | null
  ): { success: boolean; user?: User } => {
    const appleEmail = (emailParam || `apple_${Date.now()}@privaterelay.appleid.com`).trim().toLowerCase();
    const appleName = nameParam || 'Apple ID User';

    let matchedUser = users.find(
      (u) => u.email.toLowerCase() === appleEmail && u.role === rolePreference
    );

    if (!matchedUser) {
      matchedUser = {
        id: `user-a-${Date.now()}`,
        username: `apple_${appleEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_')}`,
        email: appleEmail,
        name: appleName,
        role: rolePreference,
        avatarUrl:
          avatarUrlParam ||
          (rolePreference === 'client' ? avatarClientExecImg : avatarFreelancerProImg),
        company: rolePreference === 'client' ? 'Client Workspace' : 'Apple Studio Partner',
        status: 'active',
        createdAt: new Date().toISOString(),
        plan: 'starter',
      };
      setUsers((prev) => [...prev, matchedUser!]);
    }

    if (matchedUser.status === 'suspended') {
      return { success: false };
    }

    setCurrentUser(matchedUser);
    syncFreelancerDirectoryProfile(matchedUser);
    logActivity('Apple ID Sign In', `${matchedUser.name} authenticated via Apple ID (${matchedUser.email}) as ${matchedUser.role}`, 'auth');
    if (matchedUser.email) {
      setPendingGmailConfirm({
        email: matchedUser.email,
        name: matchedUser.name,
        role: matchedUser.role,
        signedInAt: new Date().toISOString(),
      });
    }
    return { success: true, user: matchedUser };
  };

  const registerUser = (userData: { name: string; email: string; username: string; role: UserRole; company?: string; phone?: string }): { success: boolean; message?: string } => {
    const cleanUsername = userData.username.trim().toLowerCase();
    const cleanEmail = userData.email.trim().toLowerCase();

    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: 'Username is already taken. Please pick another.' };
    }
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'An account with this email already exists. Please log in.' };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      email: cleanEmail,
      name: userData.name.trim(),
      role: userData.role,
      avatarUrl: userData.role === 'client'
        ? avatarClientExecImg
        : avatarFreelancerProImg,
      company: userData.company?.trim(),
      phone: userData.phone?.trim(),
      status: 'active',
      createdAt: new Date().toISOString(),
      plan: 'free',
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    syncFreelancerDirectoryProfile(newUser);
    logActivity('User Registered', `New ${userData.role} registered: ${newUser.name} (${newUser.email})`, 'auth');
    if (newUser.email && newUser.email.includes('@')) {
      setPendingGmailConfirm({
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        signedInAt: new Date().toISOString(),
      });
    }
    return { success: true };
  };

  const updateUserProfile = (data: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      ...data,
    };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    syncFreelancerDirectoryProfile(updatedUser);
    logActivity('Profile Updated', `${updatedUser.name} updated their profile info and avatar`, 'auth');
  };

  const processProPlanPayment = async (paymentData: {
    planId: SubscriptionPlanId;
    cardholderName: string;
    cardNumber: string;
    expiry: string;
    cvv: string;
    bankName: string;
  }): Promise<{ success: boolean; transactionRef: string; message: string; amount: number }> => {
    const ref = `TXN-DEBIT-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const planCost = paymentData.planId === 'starter' ? 999 : paymentData.planId === 'business' ? 3999 : 1999;

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (currentUser) {
      const updatedUser: User = { ...currentUser, plan: paymentData.planId };
      setCurrentUser(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    }

    const subInvoice: Invoice = {
      id: `inv-sub-${Date.now()}`,
      invoiceNumber: `SUB-${Date.now().toString().slice(-5)}`,
      freelancerId: currentUser?.id || 'user-admin',
      freelancerName: currentUser?.name || 'Portal Subscriber',
      clientId: 'portal-billing-hq',
      clientName: paymentData.cardholderName,
      clientEmail: currentUser?.email,
      projectId: 'saas-subscription',
      projectName: `SaaS ${paymentData.planId.toUpperCase()} Subscription (${paymentData.bankName} Debit Card)`,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      items: [
        {
          id: `item-${Date.now()}`,
          description: `${paymentData.planId.toUpperCase()} Plan Monthly Subscription (${paymentData.bankName} Card ending in ${paymentData.cardNumber.slice(-4)})`,
          quantity: 1,
          rate: planCost,
          amount: planCost,
        },
      ],
      subtotal: planCost,
      taxPercent: 0,
      discount: 0,
      total: planCost,
      status: 'paid',
      currency: 'PKR',
      notes: `Debit Card Payment Received directly via ${paymentData.bankName}. Transaction Ref: ${ref}`,
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setInvoices((prev) => [subInvoice, ...prev]);

    logActivity(
      'Debit Card Payment Received',
      `Direct card payment of Rs. ${planCost.toLocaleString()} received via ${paymentData.bankName} (Ref: ${ref}) for ${paymentData.planId.toUpperCase()} plan`,
      'invoice'
    );

    return {
      success: true,
      transactionRef: ref,
      amount: planCost,
      message: `Debit card transaction successful! Rs. ${planCost.toLocaleString()} received directly via ${paymentData.bankName}. Pro plan activated.`,
    };
  };

  const updatePayoutSettings = (newSettings: Partial<PayoutSettings>) => {
    setPayoutSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      logActivity(
        'Payout Account Updated',
        `Receiving details updated for ${updated.beneficiaryName} (${updated.bankName})`,
        'system'
      );
      return updated;
    });
  };

  const EXCHANGE_RATES_TO_PKR: Record<string, number> = {
    PKR: 1,
    USD: 278,
    EUR: 302,
    GBP: 355,
    AED: 75.8,
    SAR: 74.1,
    CAD: 205,
    AUD: 182,
  };

  const setIsProductionMode = useCallback((isProd: boolean) => {
    setIsProductionModeState(isProd);
    setPayoutSettings((prev) => ({
      ...prev,
      gatewayMode: isProd ? 'live' : 'sandbox',
    }));
  }, []);

  const processRealtimePayment = async (data: {
    amount: number;
    currency: string;
    targetType: 'invoice' | 'subscription';
    targetId?: string;
    targetTitle: string;
    senderName: string;
    senderEmail: string;
    senderCountry: string;
    paymentChannel: 'visa' | 'mastercard' | 'amex' | 'raast' | 'bank_wire';
    cardholderName?: string;
    cardNumberMasked?: string;
  }): Promise<{ success: boolean; transactionRef: string; record: RealtimePaymentRecord; message: string }> => {
    const rate = EXCHANGE_RATES_TO_PKR[data.currency.toUpperCase()] || 1;
    const amountPkr = Math.round(data.amount * rate);
    const refPrefix = isProductionMode ? 'TXN' : 'SBX';
    const txnRef = `${refPrefix}-${data.paymentChannel.toUpperCase()}-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Simulate real-time secure settlement delay
    await new Promise((res) => setTimeout(res, 850));

    const newRecord: RealtimePaymentRecord = {
      id: `tx-${Date.now()}`,
      transactionRef: txnRef,
      senderName: data.senderName,
      senderEmail: data.senderEmail,
      senderCountry: data.senderCountry,
      amountPaid: data.amount,
      currencyPaid: data.currency,
      amountReceivedPkr: amountPkr,
      targetType: data.targetType,
      targetTitle: data.targetTitle,
      beneficiaryName: payoutSettings.beneficiaryName,
      beneficiaryBank: payoutSettings.bankName,
      beneficiaryCardMasked: payoutSettings.cardNumberMasked,
      status: 'settled',
      timestamp: new Date().toISOString(),
      paymentChannel: data.paymentChannel,
    };

    // Append to transactions ledger
    setRealtimeTransactions((prev) => [newRecord, ...prev]);

    // Credit Abdullah's balance
    setPayoutSettings((prev) => ({
      ...prev,
      totalEarningsReceivedPkr: prev.totalEarningsReceivedPkr + amountPkr,
      lastPayoutAt: new Date().toISOString(),
    }));

    // If invoice payment, mark paid
    if (data.targetType === 'invoice' && data.targetId) {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === data.targetId
            ? {
                ...inv,
                status: 'paid',
                paidAt: new Date().toISOString(),
                notes: `Paid in real-time by ${data.senderName} (${data.senderCountry}) via ${data.paymentChannel.toUpperCase()}. Deposited directly to ${payoutSettings.beneficiaryName}'s ${payoutSettings.bankName} account (Ref: ${txnRef}).`,
              }
            : inv
        )
      );
    }

    // If subscription payment, upgrade user plan
    if (data.targetType === 'subscription') {
      const planId = (data.targetId as SubscriptionPlanId) || 'pro';
      if (currentUser) {
        const updatedUser: User = { ...currentUser, plan: planId };
        setCurrentUser(updatedUser);
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      }

      // Add subscription invoice
      const subInv: Invoice = {
        id: `inv-sub-${Date.now()}`,
        invoiceNumber: `SUB-${Date.now().toString().slice(-5)}`,
        freelancerId: currentUser?.id || 'user-admin',
        freelancerName: currentUser?.name || data.senderName,
        clientId: 'portal-billing-hq',
        clientName: data.senderName,
        clientEmail: data.senderEmail,
        projectId: 'saas-subscription',
        projectName: `SaaS ${planId.toUpperCase()} Subscription (${data.paymentChannel.toUpperCase()})`,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        items: [
          {
            id: `item-${Date.now()}`,
            description: `${planId.toUpperCase()} Subscription - Real-Time Remittance to ${payoutSettings.beneficiaryName}`,
            quantity: 1,
            rate: data.amount,
            amount: data.amount,
          },
        ],
        subtotal: data.amount,
        taxPercent: 0,
        discount: 0,
        total: data.amount,
        status: 'paid',
        currency: data.currency,
        notes: `Real-time payment deposited to ${payoutSettings.bankName} (${payoutSettings.cardNumberMasked}). Ref: ${txnRef}`,
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      setInvoices((prev) => [subInv, ...prev]);
    }

    logActivity(
      'Real-Time Payment Received',
      `${data.currency} ${data.amount.toLocaleString()} (Rs. ${amountPkr.toLocaleString()} PKR) received from ${data.senderName} (${data.senderCountry}) -> Deposited to ${payoutSettings.beneficiaryName}'s ${payoutSettings.bankName} card/account. Ref: ${txnRef}`,
      'invoice'
    );

    return {
      success: true,
      transactionRef: txnRef,
      record: newRecord,
      message: `Transaction successful! ${data.currency} ${data.amount.toLocaleString()} received and deposited into ${payoutSettings.beneficiaryName}'s ${payoutSettings.bankName} account.`,
    };
  };

  const logout = () => {
    if (currentUser) {
      logActivity('User Logged Out', `${currentUser.name} signed out`, 'auth');
    }
    setPendingGmailConfirm(null);
    setAdminToken(null);
    setCurrentUser(null);
    void signOutFirebaseAuth();
  };

  const switchRole = useCallback((role: UserRole, targetId?: string) => {
    if (role === 'admin') {
      // Never allow unauthenticated role-switching into Admin Panel
      return;
    }

    if (targetId) {
      const target = users.find((u) => u.id === targetId);
      if (target) {
        setCurrentUser(target);
        logActivity('Role Switched', `Switched session to ${target.name} (${target.role})`, 'auth');
        return;
      }

      // Also support immediate switching right after addClient/addProject in the same render tick
      const clientRec = clients.find((c) => c.userId === targetId);
      const projRec = projects.find((p) => p.clientId === targetId);
      const synthesizedUser: User = {
        id: targetId,
        username: (clientRec?.name || projRec?.clientName || 'client_user').toLowerCase().replace(/[^a-z0-9]/g, '_'),
        email: clientRec?.email || 'client@portal.pk',
        name: clientRec?.name || projRec?.clientName || 'Client Partner',
        role,
        avatarUrl: role === 'client' ? avatarClientExecImg : avatarFreelancerProImg,
        company: clientRec?.company || 'Client Workspace',
        phone: clientRec?.phone,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      setUsers((prev) => (prev.some((u) => u.id === targetId) ? prev : [...prev, synthesizedUser]));
      setCurrentUser(synthesizedUser);
      logActivity('Role Switched', `Switched session to ${synthesizedUser.name} (${synthesizedUser.role})`, 'auth');
      return;
    }

    // Prefer a user matching the requested role who owns an active project
    const match =
      role === 'client'
        ? users.find((u) => u.role === 'client' && projects.some((p) => p.clientId === u.id)) ||
          users.find((u) => u.role === 'client')
        : users.find((u) => u.role === 'freelancer' && projects.some((p) => p.freelancerId === u.id)) ||
          users.find((u) => u.role === role);

    if (match) {
      setCurrentUser(match);
      logActivity('Role Switched', `Switched session to ${match.name} (${match.role})`, 'auth');
      return;
    }

    // Synthesize a clean workspace account for Sandbox/Demo switching if none exists yet
    const fallbackProjectClient = role === 'client' ? projects[0] : undefined;
    const newRoleUser: User = {
      id: role === 'freelancer' ? 'user-free-studio' : (fallbackProjectClient?.clientId || 'user-client-sandbox'),
      username: role === 'freelancer' ? 'studio_freelancer' : 'sandbox_client',
      email: role === 'freelancer' ? 'freelancer@freelanceport.pk' : 'client@freelanceport.pk',
      name: role === 'freelancer' ? 'Studio Freelancer' : (fallbackProjectClient?.clientName || 'Sandbox Client'),
      role,
      avatarUrl: role === 'client' ? avatarClientExecImg : avatarFreelancerProImg,
      company: role === 'freelancer' ? 'FreelancePort Studio' : 'Client Workspace',
      status: 'active',
      createdAt: new Date().toISOString(),
      plan: role === 'freelancer' ? 'pro' : undefined,
    };
    setUsers((prev) => (prev.some((u) => u.id === newRoleUser.id) ? prev : [...prev, newRoleUser]));
    setCurrentUser(newRoleUser);
    logActivity('Role Switched', `Initialized ${newRoleUser.name} (${role}) workspace session`, 'auth');
  }, [users, clients, projects]);

  const addProject = (data: Omit<Project, 'id' | 'createdAt'>): Project => {
    const newProject: Project = {
      ...data,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [newProject, ...prev]);
    if (
      currentUserRef.current &&
      (currentUserRef.current.id === newProject.clientId ||
        currentUserRef.current.id === newProject.freelancerId)
    ) {
      void ensureProjectConversation(newProject);
    }
    logActivity('Project Created', `Created project "${newProject.name}" with budget Rs. ${newProject.budget.toLocaleString()}`, 'project');
    return newProject;
  };

  const updateProjectStatus = (id: string, status: ProjectStatus, progress?: number) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updatedProgress = progress !== undefined ? progress : status === 'completed' ? 100 : p.progress;
          return { ...p, status, progress: updatedProgress };
        }
        return p;
      })
    );
    const target = projects.find((p) => p.id === id);
    logActivity('Project Status Updated', `Updated "${target?.name || id}" to status: ${status}`, 'project');
  };

  const updateProject = (project: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
    logActivity('Project Modified', `Updated details for project "${project.name}"`, 'project');
  };

  const toggleTaskCompletion = (projectId: string, taskId: string) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        const updatedTasks = proj.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        const completedCount = updatedTasks.filter((t) => t.completed).length;
        const progress = Math.round((completedCount / (updatedTasks.length || 1)) * 100);
        const status = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : proj.status;
        return { ...proj, tasks: updatedTasks, progress, status };
      })
    );
    logActivity('Task Toggled', `Toggled milestone task in project ${projectId}`, 'project');
  };

  const addInvoice = (data: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>): Invoice => {
    const nextNumber = `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`;
    const newInvoice: Invoice = {
      ...data,
      id: `inv-${Date.now()}`,
      invoiceNumber: nextNumber,
      createdAt: new Date().toISOString(),
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    logActivity('Invoice Created', `Generated ${newInvoice.invoiceNumber} for ${newInvoice.clientName} (Total: ${newInvoice.currency} ${newInvoice.total.toLocaleString()})`, 'invoice');
    return newInvoice;
  };

  const markInvoicePaid = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? { ...inv, status: 'paid', paidAt: new Date().toISOString() }
          : inv
      )
    );
    const target = invoices.find((i) => i.id === id);
    logActivity('Invoice Paid', `Invoice ${target?.invoiceNumber || id} marked as Paid`, 'invoice');
  };

  const addFile = (data: Omit<ProjectFile, 'id' | 'uploadedAt'>): ProjectFile => {
    const newFile: ProjectFile = {
      ...data,
      id: `file-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };
    setFiles((prev) => [newFile, ...prev]);
    logActivity('File Uploaded', `Uploaded deliverable "${newFile.fileName}" for ${newFile.projectName}`, 'file');
    return newFile;
  };

  const deleteFile = (id: string) => {
    const target = files.find((f) => f.id === id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
    logActivity('File Removed', `Removed file "${target?.fileName || id}"`, 'file');
  };

  const sendChatMessage = useCallback(
    async (
      conversationId: string,
      content: string,
      tag: MessageTag = 'general'
    ): Promise<{ ok: boolean; message?: Message; error?: string }> => {
      const clean = content.trim();
      if (!clean || !conversationId) {
        return { ok: false, error: 'Message cannot be empty.' };
      }
      const user = currentUserRef.current;
      if (!user) {
        return { ok: false, error: 'Please sign in to send messages.' };
      }

      const conv = conversations.find((c) => c.conversationId === conversationId);
      const clientMsgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      if (socketRef.current?.connected) {
        const resp = await sendSocketMessage(socketRef.current, {
          conversationId,
          message: clean,
          messageType: tag,
          messageId: clientMsgId,
        });
        if (!resp.ok) {
          if (resp.error) setChatError(resp.error);
          return { ok: false, error: resp.error || 'Failed to send message.' };
        }
        if (resp.message) {
          const saved = normalizeMessageRecord(resp.message);
          mergeIncomingMessages([saved]);
          return { ok: true, message: saved };
        }
      }

      // Offline / disconnected optimistic fallback
      const now = new Date().toISOString();
      const isClient = conv ? conv.clientId === user.id : user.role === 'client';
      const fallbackMsg: Message = {
        messageId: clientMsgId,
        id: clientMsgId,
        conversationId,
        projectId: conv?.projectId || 'general',
        projectName: conv?.projectName,
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        recipientId: conv ? (isClient ? conv.freelancerId : conv.clientId) : 'partner',
        recipientName: conv ? (isClient ? conv.freelancerName || 'Freelancer' : conv.clientName || 'Client') : 'Partner',
        message: clean,
        content: clean,
        messageType: tag,
        tag,
        isRead: false,
        createdAt: now,
        timestamp: now,
      };
      mergeIncomingMessages([fallbackMsg]);
      return { ok: true, message: fallbackMsg };
    },
    [conversations, mergeIncomingMessages, normalizeMessageRecord]
  );

  const sendMessage = (
    projectId: string,
    content: string,
    recipientId: string,
    recipientName: string,
    tag: MessageTag = 'general',
    projectName?: string
  ): Message => {
    const clean = content.trim();
    const conv = conversations.find((c) => c.projectId === projectId);
    const now = new Date().toISOString();
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newMsg: Message = {
      messageId: msgId,
      id: msgId,
      conversationId: conv?.conversationId || `conv-${projectId}`,
      projectId,
      projectName,
      senderId: currentUser?.id || 'sys',
      senderName: currentUser?.name || 'Portal User',
      senderRole: currentUser?.role || 'freelancer',
      recipientId,
      recipientName,
      message: clean,
      content: clean,
      messageType: tag,
      tag,
      isRead: false,
      createdAt: now,
      timestamp: now,
    };

    if (conv && socketRef.current?.connected) {
      void sendChatMessage(conv.conversationId, clean, tag);
    } else {
      const proj = projects.find((p) => p.id === projectId);
      if (proj) {
        void ensureProjectConversation(proj).then((created) => {
          if (created) {
            void sendChatMessage(created.conversationId, clean, tag);
          }
        });
      }
      setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
    }

    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: 'message:created', payload: newMsg });
    }

    logActivity('Project Message Sent', `Message sent to ${recipientName} in project discussion`, 'project');
    return newMsg;
  };

  const addClient = (data: Omit<ClientProfile, 'id' | 'createdAt'>): ClientProfile => {
    const newClient: ClientProfile = {
      ...data,
      id: `cp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [newClient, ...prev]);

    // Also create matching client user record with exact same userId as data.userId
    const existingUser = users.find(
      (u) => u.id === data.userId || u.email.toLowerCase() === data.email.toLowerCase()
    );
    if (!existingUser) {
      const newClientUser: User = {
        id: data.userId,
        username: data.name.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'client_' + Date.now(),
        email: data.email,
        name: data.name,
        role: 'client',
        avatarUrl: avatarClientExecImg,
        phone: data.phone,
        company: data.company,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      setUsers((prev) => [...prev, newClientUser]);
    }

    logActivity('Client Invited', `Added and invited client: ${newClient.name} (${newClient.company})`, 'project');
    return newClient;
  };

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId && u.role !== 'admin') {
          const nextStatus = u.status === 'active' ? 'suspended' : 'active';
          logActivity('User Status Toggled', `Admin changed ${u.name} status to ${nextStatus}`, 'auth');
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const upgradePlan = (plan: SubscriptionPlanId) => {
    if (!currentUser) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, plan } : u))
    );
    setCurrentUser((prev) => (prev ? { ...prev, plan } : null));
    logActivity('Plan Upgraded', `${currentUser.name} upgraded SaaS subscription to ${plan.toUpperCase()}`, 'subscription');
  };

  const saveSupabaseConfig = async (url: string, anonKey: string): Promise<{ success: boolean; message: string }> => {
    const result = await testSupabaseConnection(url, anonKey);
    if (result.success) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url);
        localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, anonKey);
      }
      setSupabaseConfig({
        url,
        anonKey,
        isConnected: true,
        lastTestedAt: new Date().toISOString(),
        tableNamePrefix: 'portal_',
      });
      logActivity('Supabase Connected', `Connected external Supabase instance (${url.replace(/https:\/\/(.*?)\..*/, '$1')})`, 'system');
    }
    return result;
  };

  const directoryFreelancers: FreelancerProfileSummary[] = React.useMemo(() => {
    const map = new Map<string, FreelancerProfileSummary>();

    const toSummary = (u: Partial<User> & { id: string; name: string }): FreelancerProfileSummary => ({
      id: u.id,
      name: u.name === 'ABBDULLAH (Super Admin)' ? 'ABBDULLAH' : u.name,
      username: u.username || u.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      avatarUrl: u.avatarUrl,
      company: u.company || 'Independent Freelancer Studio',
      bio: u.bio || 'Verified freelancer available for client projects, milestone delivery, and real-time collaboration.',
      address: u.address || 'Remote / Pakistan',
      headline: u.headline || (u.id === 'user-admin' ? 'Full-Stack Web & SaaS Product Architect' : 'Full-Stack Freelancer & Digital Specialist'),
      category: u.category || (u.id === 'user-admin' ? 'SaaS Architecture' : 'Web Development'),
      skills: u.skills && u.skills.length > 0 ? u.skills : ['Web Development', 'UI/UX Design', 'Client Portal'],
      hourlyRatePkr: u.hourlyRatePkr && u.hourlyRatePkr > 0 ? u.hourlyRatePkr : 3500,
      availability: u.availability || 'available',
      completedProjectsCount: projects.filter((p) => p.freelancerId === u.id && p.status === 'completed').length,
    });

    for (const sf of serverFreelancers) {
      map.set(sf.id, toSummary(sf));
    }

    for (const u of users) {
      const eligible =
        (u.role === 'freelancer' || u.id === 'user-admin') &&
        u.status === 'active' &&
        u.isListedInDirectory !== false;
      if (eligible) {
        map.set(u.id, toSummary(u));
      }
    }

    return Array.from(map.values());
  }, [users, serverFreelancers, projects]);

  const startInquiryChatWithFreelancer = useCallback(
    (freelancer: FreelancerProfileSummary): string => {
      let activeClientId = currentUser?.role === 'client' ? currentUser.id : '';
      let activeClientName = currentUser?.role === 'client' ? currentUser.name : '';

      if (!activeClientId) {
        const existingClient = users.find((u) => u.role === 'client');
        if (existingClient) {
          activeClientId = existingClient.id;
          activeClientName = existingClient.name;
          setCurrentUser(existingClient);
        } else {
          activeClientId = 'user-client-sandbox';
          activeClientName = currentUser?.name || 'Guest Client';
          const newClientUser: User = {
            id: activeClientId,
            username: 'client_partner',
            email: currentUser?.email || 'client@freelanceport.pk',
            name: activeClientName,
            role: 'client',
            avatarUrl: avatarClientExecImg,
            company: 'Client Workspace',
            status: 'active',
            createdAt: new Date().toISOString(),
          };
          setUsers((prev) => (prev.some((u) => u.id === activeClientId) ? prev : [...prev, newClientUser]));
          setCurrentUser(newClientUser);
        }
      }

      const existingProj = projects.find(
        (p) => p.freelancerId === freelancer.id && p.clientId === activeClientId
      );
      if (existingProj) {
        openProjectChat(existingProj.id);
        return existingProj.id;
      }

      const inquiryProj: Project = {
        id: `proj-${Date.now()}`,
        name: `Project Inquiry — ${freelancer.name}`,
        freelancerId: freelancer.id,
        freelancerName: freelancer.name,
        clientId: activeClientId,
        clientName: activeClientName,
        budget: freelancer.hourlyRatePkr * 20,
        currency: 'PKR',
        startDate: new Date().toISOString().split('T')[0],
        deadline: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
        description: `Direct inquiry conversation with ${freelancer.name} (${freelancer.headline}).`,
        progress: 0,
        status: 'pending',
        category: freelancer.category,
        tasks: [
          { id: 't-1', title: 'Initial Scope & Requirements Chat', completed: false },
          { id: 't-2', title: 'Milestone Proposal & Budget Agreement', completed: false },
        ],
        createdAt: new Date().toISOString(),
      };
      setProjects((prev) => [inquiryProj, ...prev]);
      logActivity('Freelancer Inquiry Started', `Started direct discussion with ${freelancer.name}`, 'project');
      openProjectChat(inquiryProj.id);
      return inquiryProj.id;
    },
    [currentUser, users, projects, openProjectChat]
  );

  const resetDemoData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setProjects(INITIAL_PROJECTS);
    setClients(INITIAL_CLIENTS);
    setInvoices(INITIAL_INVOICES);
    setFiles(INITIAL_FILES);
    setMessages(INITIAL_MESSAGES);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setCurrencyState('PKR');
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    logActivity('Production Reset', 'Clean production state initialized', 'system');
  };

  const resetSandboxData = async () => {
    setProjects(INITIAL_PROJECTS);
    setClients(INITIAL_CLIENTS);
    setInvoices(INITIAL_INVOICES);
    setFiles(INITIAL_FILES);
    setMessages(INITIAL_MESSAGES);
    setRealtimeTransactions(INITIAL_REALTIME_TRANSACTIONS);
    setActivityLogs([
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'sys',
        userName: currentUser?.name || 'System',
        userRole: currentUser?.role || 'admin',
        action: 'Sandbox Environment Reset',
        details: 'Cleared test projects, invoices, chat history, and simulated transactions while keeping bank payout config intact.',
        category: 'system',
      },
    ]);
    try {
      const authToken = chatTokenRef.current || adminToken;
      if (authToken) {
        await fetch('/api/sandbox/reset', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }
    } catch {
      // ignore if offline
    }
  };

  return (
    <PortalContext.Provider
      value={{
        currentUser,
        users,
        projects,
        clients,
        invoices,
        files,
        messages,
        conversations,
        activeConversationId,
        setActiveConversationId,
        onlineUserIds,
        typingByConversation,
        unreadTotalCount,
        chatError,
        clearChatError,
        incomingChatToast,
        dismissChatToast,
        ensureProjectConversation,
        openConversationForProject,
        markConversationRead,
        sendChatMessage,
        emitTyping,
        emitStopTyping,
        activityLogs,
        supabaseConfig,
        currency,
        isSupabaseGuideOpen,
        setIsSupabaseGuideOpen,
        isGuideVideoOpen,
        setIsGuideVideoOpen,
        isDebitModalOpen,
        setIsDebitModalOpen,
        selectedPlanForPayment,
        setSelectedPlanForPayment,
        setCurrency,
        payoutSettings,
        updatePayoutSettings,
        realtimeTransactions,
        isDeploymentModalOpen,
        setIsDeploymentModalOpen,
        selectedInvoiceForPayment,
        setSelectedInvoiceForPayment,
        isProductionMode,
        setIsProductionMode,
        processRealtimePayment,
        login,
        loginAdmin,
        claimAdminPassword,
        isAdminAuthenticated,
        loginWithGoogle,
        loginWithApple,
        pendingGmailConfirm,
        setPendingGmailConfirm,
        registerUser,
        updateUserProfile,
        processProPlanPayment,
        logout,
        switchRole,
        addProject,
        updateProjectStatus,
        updateProject,
        toggleTaskCompletion,
        addInvoice,
        markInvoicePaid,
        addFile,
        deleteFile,
        sendMessage,
        activeChatProjectId,
        setActiveChatProjectId,
        openProjectChat,
        wsStatus,
        roomPresence,
        roomTyping,
        joinProjectRoom,
        leaveProjectRoom,
        sendTypingState,
        addClient,
        toggleUserStatus,
        upgradePlan,
        saveSupabaseConfig,
        directoryFreelancers,
        startInquiryChatWithFreelancer,
        resetDemoData,
        resetSandboxData,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
};

export const usePortal = () => {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
};
