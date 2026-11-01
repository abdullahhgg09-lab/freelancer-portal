import { Invoice, InvoiceItem, Project, User } from '../types';

export function calculateInvoiceTotals(
  items: Array<{ quantity: number; rate: number }>,
  taxPercent: number = 0,
  discount: number = 0
) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const taxAmount = (subtotal * Math.max(0, taxPercent)) / 100;
  const safeDiscount = Math.max(0, discount);
  const total = Math.max(0, Math.round((subtotal + taxAmount - safeDiscount) * 100) / 100);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    discount: safeDiscount,
    total,
  };
}

export function computeFreelancerStats(projects: Project[], invoices: Invoice[], freelancerId: string) {
  const freelancerProjects = projects.filter((p) => p.freelancerId === freelancerId);
  const totalProjects = freelancerProjects.length;
  const activeProjects = freelancerProjects.filter((p) => p.status === 'in_progress' || p.status === 'pending').length;
  const completedProjects = freelancerProjects.filter((p) => p.status === 'completed').length;
  const inReviewProjects = freelancerProjects.filter((p) => p.status === 'review').length;

  const freelancerInvoices = invoices.filter((i) => i.freelancerId === freelancerId);
  const totalEarnings = freelancerInvoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.total, 0);

  const pendingPayments = freelancerInvoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.total, 0);

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    inReviewProjects,
    totalEarnings,
    pendingPayments,
    totalInvoices: freelancerInvoices.length,
  };
}

export function computeAdminStats(users: User[], projects: Project[], invoices: Invoice[]) {
  const totalUsers = users.length;
  const totalFreelancers = users.filter((u) => u.role === 'freelancer').length;
  const totalClients = users.filter((u) => u.role === 'client').length;
  const activeUsers = users.filter((u) => u.status === 'active').length;

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === 'in_progress').length;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;

  const totalPlatformVolume = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.total, 0);

  const totalPendingInvoices = invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.total, 0);

  return {
    totalUsers,
    totalFreelancers,
    totalClients,
    activeUsers,
    totalProjects,
    activeProjects,
    completedProjects,
    totalPlatformVolume,
    totalPendingInvoices,
  };
}

export function formatCurrency(amount: number, currency: string = 'PKR'): string {
  if (currency === 'PKR') {
    return `Rs. ${Number(amount).toLocaleString('en-PK')}`;
  }
  return `$${Number(amount).toLocaleString('en-US')}`;
}

export function calculateProjectProgress(tasks: Array<{ completed: boolean }>): number {
  if (!tasks || tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
}
