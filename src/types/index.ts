export type UserRole = 'admin' | 'freelancer' | 'client';

export type ProjectStatus = 'pending' | 'in_progress' | 'review' | 'completed';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export type SubscriptionPlanId = 'free' | 'starter' | 'pro' | 'business';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  company?: string;
  bio?: string;
  address?: string;
  status: 'active' | 'suspended';
  createdAt: string;
  plan?: SubscriptionPlanId;
}

export interface DebitCardPayment {
  planId: SubscriptionPlanId;
  planName: string;
  amount: number;
  currency: string;
  cardNumberMasked: string;
  cardholderName: string;
  bankName: string;
  transactionRef: string;
  timestamp: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface Project {
  id: string;
  name: string;
  freelancerId: string;
  freelancerName: string;
  clientId: string;
  clientName: string;
  budget: number;
  currency: string;
  startDate: string;
  deadline: string;
  description: string;
  progress: number; // 0 - 100
  status: ProjectStatus;
  category: string;
  tasks: ProjectTask[];
  createdAt: string;
}

export interface ClientProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  freelancerId: string;
  address?: string;
  status: 'active' | 'invited' | 'inactive';
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  freelancerId: string;
  freelancerName: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  projectId: string;
  projectName: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxPercent: number;
  discount: number;
  total: number;
  status: InvoiceStatus;
  currency: string;
  notes?: string;
  paidAt?: string;
  createdAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  projectName: string;
  uploaderId: string;
  uploaderName: string;
  uploaderRole: UserRole;
  fileName: string;
  fileSize: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
  category: 'deliverable' | 'contract' | 'design' | 'asset' | 'brief';
}

export interface Message {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  recipientName: string;
  content: string;
  timestamp: string;
  attachments?: string[];
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  category: 'project' | 'invoice' | 'file' | 'auth' | 'subscription' | 'system';
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  pricePkr: number;
  priceUsd: number;
  maxProjects: number | 'Unlimited';
  maxClients: number | 'Unlimited';
  storageMb: number;
  description: string;
  popular?: boolean;
  features: string[];
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastTestedAt?: string;
  tableNamePrefix?: string;
}
