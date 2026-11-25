import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { avatarFreelancerProImg, avatarClientExecImg } from '../assets/images';
import {
  User,
  Project,
  Invoice,
  ProjectFile,
  Message,
  MessageTag,
  RoomParticipant,
  TypingParticipant,
  ActivityLog,
  ClientProfile,
  UserRole,
  SubscriptionPlanId,
  SupabaseConfig,
  ProjectStatus,
  PayoutSettings,
  RealtimePaymentRecord
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
  const [pendingGmailConfirm, setPendingGmailConfirm] = useState<PendingGmailConfirm | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [roomPresence, setRoomPresence] = useState<Record<string, RoomParticipant[]>>({});
  const [roomTyping, setRoomTyping] = useState<Record<string, TypingParticipant[]>>({});

  useEffect(() => {
    const unsubscribe = initFirebaseAuthListener();
    return () => unsubscribe();
  }, []);

  const wsRef = useRef<WebSocket | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const joinedRoomsRef = useRef<Set<string>>(new Set());
  const currentUserRef = useRef<User | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

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

  // Sync state to localStorage (never persist admin sessions to localStorage)
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

  const mergeIncomingMessages = useCallback((incomingList: Message[]) => {
    if (!Array.isArray(incomingList) || incomingList.length === 0) return;
    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const newOnes = incomingList.filter((m) => m && m.id && !existingIds.has(m.id));
      if (newOnes.length === 0) return prev;
      return [...prev, ...newOnes].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });
  }, []);

  // Cross-tab synchronization so Client and Freelancer open in two tabs share created projects/invoices/files immediately
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

  // Real-time WebSocket + BroadcastChannel connection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Secondary multi-tab BroadcastChannel sync
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('fcp_realtime_chat');
      broadcastRef.current = channel;
      channel.onmessage = (evt) => {
        if (evt.data?.type === 'message:created' && evt.data.payload) {
          mergeIncomingMessages([evt.data.payload as Message]);
        }
      };
    }

    // Initial REST hydration
    fetch('/api/messages')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.messages) {
          mergeIncomingMessages(data.messages);
        }
      })
      .catch(() => {
        // Fallback smoothly if running on static host
      });

    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let isUnmounted = false;
    let attempt = 0;

    const connectWs = () => {
      if (isUnmounted) return;
      setWsStatus('connecting');
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${wsProto}//${window.location.host}/ws`);
      wsRef.current = socket;

      socket.onopen = () => {
        attempt = 0;
        setWsStatus('connected');
        // Re-join any active rooms using latest currentUserRef
        const activeUser = currentUserRef.current;
        for (const roomId of joinedRoomsRef.current) {
          socket.send(
            JSON.stringify({
              type: 'room:join',
              projectId: roomId,
              userId: activeUser?.id || 'guest',
              userName: activeUser?.name || 'Portal User',
              userRole: activeUser?.role || 'client',
            })
          );
        }
      };

      socket.onmessage = (evt) => {
        try {
          const event = JSON.parse(evt.data);
          if (event.type === 'init:messages' && Array.isArray(event.payload)) {
            mergeIncomingMessages(event.payload);
          } else if (event.type === 'message:created' && event.payload) {
            mergeIncomingMessages([event.payload as Message]);
          } else if (event.type === 'presence:update' && event.projectId) {
            setRoomPresence((prev) => ({
              ...prev,
              [event.projectId]: Array.isArray(event.users) ? event.users : [],
            }));
          } else if (event.type === 'typing:update' && event.projectId && event.userId) {
            setRoomTyping((prev) => {
              const current = prev[event.projectId] || [];
              if (event.isTyping) {
                if (current.some((u) => u.userId === event.userId)) return prev;
                return {
                  ...prev,
                  [event.projectId]: [...current, { userId: event.userId, userName: event.userName || 'User' }],
                };
              } else {
                return {
                  ...prev,
                  [event.projectId]: current.filter((u) => u.userId !== event.userId),
                };
              }
            });
          } else if (event.type === 'sandbox:reset') {
            setMessages([]);
          }
        } catch {
          // Ignore malformed WS payloads
        }
      };

      socket.onclose = () => {
        setWsStatus('offline');
        if (!isUnmounted) {
          const delay = Math.min(8000, 1000 * Math.pow(1.5, attempt++));
          retryTimer = setTimeout(connectWs, delay);
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connectWs();

    return () => {
      isUnmounted = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (broadcastRef.current) {
        broadcastRef.current.close();
      }
    };
  }, [mergeIncomingMessages]);

  const joinProjectRoom = useCallback(
    (projectId: string) => {
      if (!projectId) return;
      joinedRoomsRef.current.add(projectId);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'room:join',
            projectId,
            userId: currentUser?.id || 'guest',
            userName: currentUser?.name || 'Portal User',
            userRole: currentUser?.role || 'client',
          })
        );
      }
    },
    [currentUser?.id, currentUser?.name, currentUser?.role]
  );

  const leaveProjectRoom = useCallback((projectId: string) => {
    if (!projectId) return;
    joinedRoomsRef.current.delete(projectId);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'room:leave',
          projectId,
        })
      );
    }
  }, []);

  const sendTypingState = useCallback(
    (projectId: string, isTyping: boolean) => {
      if (!projectId || wsRef.current?.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(
        JSON.stringify({
          type: 'typing:state',
          projectId,
          userId: currentUser?.id || 'guest',
          userName: currentUser?.name || 'Portal User',
          isTyping,
        })
      );
    },
    [currentUser?.id, currentUser?.name]
  );

  const openProjectChat = useCallback((projectId: string) => {
    setActiveChatProjectId(projectId);
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
      logActivity('Freelancer Registered', `New freelancer registered: ${newUser.name}`, 'auth');
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
    logActivity('Apple ID Sign In', `${matchedUser.name} authenticated via Apple ID (${matchedUser.email}) as ${matchedUser.role}`, 'auth');
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
    logActivity('User Registered', `New ${userData.role} registered: ${newUser.name} (${newUser.email})`, 'auth');
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

    // Prefer a user matching the requested role (if client, prefer one owning an active project)
    const match =
      role === 'client'
        ? users.find((u) => u.role === 'client' && projects.some((p) => p.clientId === u.id)) ||
          users.find((u) => u.role === 'client')
        : users.find((u) => u.role === role);

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

  const sendMessage = (
    projectId: string,
    content: string,
    recipientId: string,
    recipientName: string,
    tag: MessageTag = 'general',
    projectName?: string
  ): Message => {
    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      projectId,
      projectName,
      senderId: currentUser?.id || 'sys',
      senderName: currentUser?.name || 'Portal User',
      senderRole: currentUser?.role || 'freelancer',
      recipientId,
      recipientName,
      content,
      tag,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));

    // Broadcast over real-time WebSocket if connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'message:send',
          payload: newMsg,
        })
      );
    } else {
      // REST fallback
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg),
      }).catch(() => {
        // Offline / static host mode uses localStorage + BroadcastChannel
      });
    }

    // Secondary BroadcastChannel push for multi-tab instant sync
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
      await fetch('/api/sandbox/reset', { method: 'POST' });
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
