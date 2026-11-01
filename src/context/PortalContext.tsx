import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Project,
  Invoice,
  ProjectFile,
  Message,
  ActivityLog,
  ClientProfile,
  UserRole,
  SubscriptionPlanId,
  SupabaseConfig,
  ProjectStatus
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CLIENTS,
  INITIAL_PROJECTS,
  INITIAL_INVOICES,
  INITIAL_FILES,
  INITIAL_MESSAGES,
  INITIAL_ACTIVITY_LOGS,
  ADMIN_CREDENTIALS,
} from '../data/mockData';
import { getSupabaseClient, testSupabaseConnection } from '../lib/supabase';

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
  login: (username: string, password?: string, role?: UserRole) => { success: boolean; message?: string };
  loginWithGoogle: (email?: string, name?: string, rolePreference?: UserRole) => { success: boolean; user?: User };
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
  sendMessage: (projectId: string, content: string, recipientId: string, recipientName: string) => Message;
  addClient: (data: Omit<ClientProfile, 'id' | 'createdAt'>) => ClientProfile;
  toggleUserStatus: (userId: string) => void;
  upgradePlan: (plan: SubscriptionPlanId) => void;
  saveSupabaseConfig: (url: string, key: string) => Promise<{ success: boolean; message: string }>;
  resetDemoData: () => void;
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
};

function loadStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
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
    return loadStored<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  });
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

  // Sync state to localStorage
  useEffect(() => saveStored(STORAGE_KEYS.USERS, users), [users]);
  useEffect(() => saveStored(STORAGE_KEYS.CURRENT_USER, currentUser), [currentUser]);
  useEffect(() => saveStored(STORAGE_KEYS.PROJECTS, projects), [projects]);
  useEffect(() => saveStored(STORAGE_KEYS.CLIENTS, clients), [clients]);
  useEffect(() => saveStored(STORAGE_KEYS.INVOICES, invoices), [invoices]);
  useEffect(() => saveStored(STORAGE_KEYS.FILES, files), [files]);
  useEffect(() => saveStored(STORAGE_KEYS.MESSAGES, messages), [messages]);
  useEffect(() => saveStored(STORAGE_KEYS.LOGS, activityLogs), [activityLogs]);
  useEffect(() => saveStored(STORAGE_KEYS.CURRENCY, currency), [currency]);

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

  const login = (username: string, password?: string, rolePreference?: UserRole): { success: boolean; message?: string } => {
    const cleanUser = username.trim().toLowerCase();

    // Check exact Admin credentials specified by user: abdary / abdary123!@#
    if (cleanUser === ADMIN_CREDENTIALS.username.toLowerCase()) {
      if (password && password !== ADMIN_CREDENTIALS.password) {
        return { success: false, message: 'Invalid Admin Password. Expected: abdary123!@#' };
      }
      const adminUser = users.find((u) => u.username === 'abdary') || INITIAL_USERS[0];
      setCurrentUser(adminUser);
      logActivity('Admin Logged In', 'Super Admin (abdary) authenticated to control center', 'auth');
      return { success: true };
    }

    // Match by username or email
    const found = users.find(
      (u) => u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser
    );

    if (found) {
      if (found.status === 'suspended') {
        return { success: false, message: 'This account has been suspended by the platform administrator.' };
      }
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
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
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

  const loginWithGoogle = (emailParam?: string, nameParam?: string, rolePreference: UserRole = 'freelancer'): { success: boolean; user?: User } => {
    const googleEmail = (emailParam || 'abdullahhgg09@gmail.com').trim().toLowerCase();
    const googleName = nameParam || (googleEmail.includes('abdullah') ? 'Abdullah (Google User)' : 'Google Partner User');

    // Check if existing user with this email
    let matchedUser = users.find((u) => u.email.toLowerCase() === googleEmail);

    if (!matchedUser) {
      matchedUser = {
        id: `user-g-${Date.now()}`,
        username: googleEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_') || 'google_user',
        email: googleEmail,
        name: googleName,
        role: rolePreference,
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        company: 'Google Workspace Client',
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
    logActivity('Google Sign In', `${matchedUser.name} authenticated via Google Account (${matchedUser.email})`, 'auth');
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
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
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

  const logout = () => {
    if (currentUser) {
      logActivity('User Logged Out', `${currentUser.name} signed out`, 'auth');
    }
    setCurrentUser(null);
  };

  const switchRole = (role: UserRole, targetId?: string) => {
    if (role === 'admin') {
      const adminUser = users.find((u) => u.role === 'admin') || INITIAL_USERS[0];
      setCurrentUser(adminUser);
      logActivity('Role Switched', 'Switched session to Super Admin (abdary)', 'auth');
      return;
    }

    if (targetId) {
      const target = users.find((u) => u.id === targetId);
      if (target) {
        setCurrentUser(target);
        logActivity('Role Switched', `Switched session to ${target.name} (${target.role})`, 'auth');
        return;
      }
    }

    const match = users.find((u) => u.role === role);
    if (match) {
      setCurrentUser(match);
      logActivity('Role Switched', `Switched session to ${match.name} (${match.role})`, 'auth');
    }
  };

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
    recipientName: string
  ): Message => {
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      projectId,
      senderId: currentUser?.id || 'sys',
      senderName: currentUser?.name || 'Portal User',
      senderRole: currentUser?.role || 'freelancer',
      recipientId,
      recipientName,
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    logActivity('Message Sent', `Message sent to ${recipientName}`, 'project');
    return newMsg;
  };

  const addClient = (data: Omit<ClientProfile, 'id' | 'createdAt'>): ClientProfile => {
    const newClient: ClientProfile = {
      ...data,
      id: `cp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [newClient, ...prev]);

    // Also create matching client user record if not present
    const existingUser = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (!existingUser) {
      const newClientUser: User = {
        id: `user-${Date.now()}`,
        username: data.name.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'client_' + Date.now(),
        email: data.email,
        name: data.name,
        role: 'client',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
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
    setCurrentUser(INITIAL_USERS[1]);
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
    logActivity('Demo Data Reset', 'Platform restored to initial sample state', 'system');
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
        login,
        loginWithGoogle,
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
        addClient,
        toggleUserStatus,
        upgradePlan,
        saveSupabaseConfig,
        resetDemoData,
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
