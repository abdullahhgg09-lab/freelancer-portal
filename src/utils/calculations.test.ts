import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateInvoiceTotals,
  computeFreelancerStats,
  computeAdminStats,
  formatCurrency,
  calculateProjectProgress
} from './calculations';
import { Project, Invoice, User } from '../types';

test('calculateInvoiceTotals calculates subtotal, tax and discount properly', () => {
  const items = [
    { quantity: 2, rate: 5000 }, // 10000
    { quantity: 1, rate: 15000 }, // 15000
  ];
  // subtotal = 25000. 10% tax = 2500. discount = 1000. total = 26500
  const result = calculateInvoiceTotals(items, 10, 1000);
  assert.equal(result.subtotal, 25000);
  assert.equal(result.taxAmount, 2500);
  assert.equal(result.discount, 1000);
  assert.equal(result.total, 26500);
});

test('calculateInvoiceTotals handles 0 tax and 0 discount', () => {
  const items = [{ quantity: 3, rate: 1200 }];
  const result = calculateInvoiceTotals(items, 0, 0);
  assert.equal(result.subtotal, 3600);
  assert.equal(result.taxAmount, 0);
  assert.equal(result.total, 3600);
});

test('computeFreelancerStats filters by freelancerId correctly', () => {
  const sampleProjects: Project[] = [
    {
      id: 'p1',
      name: 'Project 1',
      freelancerId: 'f1',
      freelancerName: 'Freelancer 1',
      clientId: 'c1',
      clientName: 'Client 1',
      budget: 50000,
      currency: 'PKR',
      startDate: '2026-01-01',
      deadline: '2026-02-01',
      description: 'Test',
      progress: 60,
      status: 'in_progress',
      category: 'Design',
      tasks: [],
      createdAt: '2026-01-01',
    },
    {
      id: 'p2',
      name: 'Project 2',
      freelancerId: 'f1',
      freelancerName: 'Freelancer 1',
      clientId: 'c2',
      clientName: 'Client 2',
      budget: 30000,
      currency: 'PKR',
      startDate: '2026-01-01',
      deadline: '2026-02-01',
      description: 'Test',
      progress: 100,
      status: 'completed',
      category: 'Development',
      tasks: [],
      createdAt: '2026-01-01',
    },
    {
      id: 'p3',
      name: 'Other Freelancer Project',
      freelancerId: 'f2',
      freelancerName: 'Freelancer 2',
      clientId: 'c1',
      clientName: 'Client 1',
      budget: 80000,
      currency: 'PKR',
      startDate: '2026-01-01',
      deadline: '2026-02-01',
      description: 'Test',
      progress: 20,
      status: 'in_progress',
      category: 'Mobile',
      tasks: [],
      createdAt: '2026-01-01',
    },
  ];

  const sampleInvoices: Invoice[] = [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-001',
      freelancerId: 'f1',
      freelancerName: 'Freelancer 1',
      clientId: 'c1',
      clientName: 'Client 1',
      projectId: 'p1',
      projectName: 'Project 1',
      issueDate: '2026-01-01',
      dueDate: '2026-01-15',
      items: [],
      subtotal: 25000,
      taxPercent: 0,
      discount: 0,
      total: 25000,
      status: 'paid',
      currency: 'PKR',
      createdAt: '2026-01-01',
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-002',
      freelancerId: 'f1',
      freelancerName: 'Freelancer 1',
      clientId: 'c2',
      clientName: 'Client 2',
      projectId: 'p2',
      projectName: 'Project 2',
      issueDate: '2026-01-05',
      dueDate: '2026-01-20',
      items: [],
      subtotal: 30000,
      taxPercent: 0,
      discount: 0,
      total: 30000,
      status: 'sent',
      currency: 'PKR',
      createdAt: '2026-01-05',
    },
  ];

  const stats = computeFreelancerStats(sampleProjects, sampleInvoices, 'f1');
  assert.equal(stats.totalProjects, 2);
  assert.equal(stats.activeProjects, 1);
  assert.equal(stats.completedProjects, 1);
  assert.equal(stats.totalEarnings, 25000);
  assert.equal(stats.pendingPayments, 30000);
});

test('calculateProjectProgress computes correct task percentages', () => {
  assert.equal(calculateProjectProgress([]), 0);
  assert.equal(
    calculateProjectProgress([
      { completed: true },
      { completed: false },
      { completed: true },
      { completed: true },
    ]),
    75
  );
});

test('formatCurrency formats PKR and USD appropriately', () => {
  assert.equal(formatCurrency(15000, 'PKR'), 'Rs. 15,000');
  assert.equal(formatCurrency(1500, 'USD'), '$1,500');
});
