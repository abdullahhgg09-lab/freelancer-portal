import {
  User,
  Project,
  Invoice,
  ProjectFile,
  Message,
  ActivityLog,
  SubscriptionPlan,
  ClientProfile
} from '../types';

export const ADMIN_CREDENTIALS = {
  username: 'abdary',
  password: 'abdary123!@#',
};

// Clean production setup: Only Super Admin, no mock users
export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    username: 'abdary',
    email: 'abdullahhgg09@gmail.com',
    name: 'ABBDULLAH (Super Admin)',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+92 300 1234567',
    company: 'FreelancePort.pk Master HQ',
    status: 'active',
    createdAt: '2026-01-01T08:00:00Z',
  },
];

// Clean client list for production launch
export const INITIAL_CLIENTS: ClientProfile[] = [];

// Clean project list for production launch
export const INITIAL_PROJECTS: Project[] = [];

// Clean invoice list for production launch
export const INITIAL_INVOICES: Invoice[] = [];

// Clean files repository for production launch
export const INITIAL_FILES: ProjectFile[] = [];

// Clean message threads for production launch
export const INITIAL_MESSAGES: Message[] = [];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'act-live-init',
    timestamp: new Date().toISOString(),
    userId: 'user-admin',
    userName: 'ABBDULLAH',
    userRole: 'admin',
    action: 'Platform Live Deployment',
    details: 'Demo users purged. Production gateway active with direct debit card settlement for ABBDULLAH.',
    category: 'system',
  },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    pricePkr: 0,
    priceUsd: 0,
    maxProjects: 1,
    maxClients: 2,
    storageMb: 100,
    description: 'Limited active projects aur basic features to get started.',
    features: [
      '1 Active Project',
      'Up to 2 Invited Clients',
      '100 MB File Storage',
      'Basic Invoice Generator',
      'Standard Portal Support',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    pricePkr: 999,
    priceUsd: 4,
    maxProjects: 5,
    maxClients: 10,
    storageMb: 1024,
    description: 'Solo freelancers ke liye perfect pack.',
    features: [
      '5 Active Projects',
      'Up to 10 Clients',
      '1 GB Fast File Storage',
      'PDF Invoices with Branding',
      'Direct Freelancer-Client Chat',
      'Payment Reminders',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    pricePkr: 1999,
    priceUsd: 8,
    maxProjects: 25,
    maxClients: 50,
    storageMb: 10240,
    popular: true,
    description: 'Zyada projects, clients aur advanced business tools.',
    features: [
      '25 Active Projects',
      'Up to 50 Clients',
      '10 GB Cloud Storage',
      'Custom Brand Colors & Domain',
      'Priority Real-time Chat',
      'Automated Tax & Milestone Invoices',
      'Direct Bank Debit Remittance',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    pricePkr: 3999,
    priceUsd: 15,
    maxProjects: 'Unlimited',
    maxClients: 'Unlimited',
    storageMb: 51200,
    description: 'Small teams, boutique agencies aur expanded usage.',
    features: [
      'Unlimited Projects & Clients',
      '50 GB High-Speed Storage',
      'Multi-Freelancer Team Seats',
      'White-label Client Portal',
      'Custom Supabase / PostgreSQL Tables',
      'Dedicated 24/7 Priority Support',
    ],
  },
];

export const INITIAL_PAYOUT_SETTINGS = {
  beneficiaryName: 'ABBDULLAH',
  accountTitle: 'ABBDULLAH',
  bankName: 'Meezan Bank Limited',
  cardNumberMasked: '4242 •••• •••• 8821',
  rawCardDigits: '8821',
  iban: 'PK36MEZN0001000992819201',
  swiftBic: 'MEZNPKKA',
  raastId: '+92 300 8821990',
  settlementCurrency: 'PKR' as const,
  isProductionLive: true,
  gatewayMode: 'live' as const,
  gatewayProvider: 'direct_card' as const,
  autoDepositEnabled: true,
  totalEarningsReceivedPkr: 0,
  lastPayoutAt: new Date().toISOString(),
};

export const INITIAL_REALTIME_TRANSACTIONS: any[] = [];
