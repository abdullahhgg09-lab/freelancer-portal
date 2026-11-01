import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import {
  Briefcase,
  Users,
  FileText,
  FolderOpen,
  MessageSquare,
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  CreditCard,
  DollarSign,
  Download,
  Trash2,
  Send,
  Upload,
  Calendar,
  Check,
  Printer,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { computeFreelancerStats, formatCurrency, calculateInvoiceTotals } from '../utils/calculations';
import { Project, ProjectStatus, InvoiceItem, Invoice, SubscriptionPlanId } from '../types';
import { SUBSCRIPTION_PLANS } from '../data/mockData';
import { RecentProjectsWidget } from './RecentProjectsWidget';

export const FreelancerPortal: React.FC = () => {
  const {
    currentUser,
    projects,
    clients,
    invoices,
    files,
    messages,
    activityLogs,
    currency,
    addProject,
    updateProjectStatus,
    toggleTaskCompletion,
    addInvoice,
    markInvoicePaid,
    addFile,
    deleteFile,
    sendMessage,
    addClient,
    upgradePlan,
    setIsDebitModalOpen,
    setSelectedPlanForPayment,
    switchRole
  } = usePortal();

  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'clients' | 'invoices' | 'files' | 'messages' | 'plans'>('overview');

  // Modals
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isUploadFileModalOpen, setIsUploadFileModalOpen] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);

  // New Project Form State
  const [projName, setProjName] = useState('');
  const [projClientId, setProjClientId] = useState('');
  const [projBudget, setProjBudget] = useState(50000);
  const [projStartDate, setProjStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [projDeadline, setProjDeadline] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [projDesc, setProjDesc] = useState('');
  const [projCategory, setProjCategory] = useState('UI/UX Design');

  // New Invoice Form State
  const [invProjectId, setInvProjectId] = useState('');
  const [invDueDate, setInvDueDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [invItems, setInvItems] = useState<Array<{ id: string; description: string; quantity: number; rate: number }>>([
    { id: '1', description: 'Milestone 1 Deliverables', quantity: 1, rate: 35000 },
  ]);
  const [invTax, setInvTax] = useState(0);
  const [invDiscount, setInvDiscount] = useState(0);

  // New Client Form State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Upload File State
  const [fileProjId, setFileProjId] = useState('');
  const [fileNameInput, setFileNameInput] = useState('');
  const [fileCategory, setFileCategory] = useState<'deliverable' | 'contract' | 'design' | 'brief'>('deliverable');

  // Chat State
  const [selectedChatClient, setSelectedChatClient] = useState<string>(clients[0]?.userId || '');
  const [chatMessageText, setChatMessageText] = useState('');

  const freelancerId = currentUser?.id || 'user-free-1';
  const stats = computeFreelancerStats(projects, invoices, freelancerId);

  // Filter items owned by this freelancer
  const myProjects = projects.filter((p) => p.freelancerId === freelancerId || currentUser?.role === 'admin');
  const myInvoices = invoices.filter((i) => i.freelancerId === freelancerId || currentUser?.role === 'admin');
  const myClients = clients.filter((c) => c.freelancerId === freelancerId || currentUser?.role === 'admin');
  const myFiles = files;

  // Handlers
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClient = clients.find((c) => c.userId === projClientId) || clients[0];
    addProject({
      name: projName,
      freelancerId,
      freelancerName: currentUser?.name || 'Hamza Tariq',
      clientId: targetClient ? targetClient.userId : 'client-1',
      clientName: targetClient ? `${targetClient.name} (${targetClient.company})` : 'Client Partner',
      budget: Number(projBudget),
      currency,
      startDate: projStartDate,
      deadline: projDeadline,
      description: projDesc,
      progress: 0,
      status: 'pending',
      category: projCategory,
      tasks: [
        { id: `t-${Date.now()}-1`, title: 'Kickoff & Requirements', completed: false },
        { id: `t-${Date.now()}-2`, title: 'Core Deliverables Prototype', completed: false },
        { id: `t-${Date.now()}-3`, title: 'Final Handover & Client Approval', completed: false },
      ],
    });
    setIsNewProjectModalOpen(false);
    setProjName('');
    setProjDesc('');
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProject = projects.find((p) => p.id === invProjectId) || projects[0];
    const totals = calculateInvoiceTotals(invItems, invTax, invDiscount);

    addInvoice({
      freelancerId,
      freelancerName: currentUser?.name || 'Hamza Tariq',
      clientId: targetProject ? targetProject.clientId : 'client-1',
      clientName: targetProject ? targetProject.clientName : 'Client',
      projectId: targetProject ? targetProject.id : 'proj-1',
      projectName: targetProject ? targetProject.name : 'General Project',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: invDueDate,
      items: invItems.map((item) => ({ ...item, amount: item.quantity * item.rate })),
      subtotal: totals.subtotal,
      taxPercent: invTax,
      discount: invDiscount,
      total: totals.total,
      status: 'sent',
      currency,
      notes: 'Payment is due within invoice due date. Direct bank transfer accepted.',
    });
    setIsNewInvoiceModalOpen(false);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    addClient({
      userId: `user-client-${Date.now()}`,
      name: clientName,
      email: clientEmail,
      company: clientCompany,
      phone: clientPhone,
      freelancerId,
      status: 'active',
    });
    setIsNewClientModalOpen(false);
    setClientName('');
    setClientEmail('');
    setClientCompany('');
    setClientPhone('');
  };

  const handleUploadFile = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProj = projects.find((p) => p.id === fileProjId) || projects[0];
    addFile({
      projectId: targetProj ? targetProj.id : 'proj-1',
      projectName: targetProj ? targetProj.name : 'Project Deliverables',
      uploaderId: freelancerId,
      uploaderName: currentUser?.name || 'Hamza Tariq',
      uploaderRole: 'freelancer',
      fileName: fileNameInput,
      fileSize: `${(Math.random() * 8 + 1).toFixed(1)} MB`,
      fileType: fileNameInput.endsWith('.fig') ? 'Figma File' : fileNameInput.endsWith('.pdf') ? 'PDF Document' : 'File Archive',
      fileUrl: '#',
      category: fileCategory,
    });
    setIsUploadFileModalOpen(false);
    setFileNameInput('');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessageText.trim()) return;
    const target = clients.find((c) => c.userId === selectedChatClient) || clients[0];
    sendMessage(
      'proj-1',
      chatMessageText.trim(),
      target ? target.userId : 'user-client-1',
      target ? target.name : 'Sarah Khan'
    );
    setChatMessageText('');
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'review':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome & KPI Banner */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Freelancer Workspace
              </span>
              <span className="text-xs text-slate-400">
                Plan: <strong className="uppercase text-slate-700">{currentUser?.plan || 'pro'}</strong>
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              Welcome back, {currentUser?.name || 'Hamza'}!
            </h1>
            <p className="text-xs text-slate-500">
              Manage your client projects, invoices, files, and incoming messages from a single dashboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>

            <button
              onClick={() => setIsNewInvoiceModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Create Invoice</span>
            </button>
          </div>
        </div>

        {/* 5 KPI Metric Cards (as requested in Section 3 of PDF) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
          
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Projects</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalProjects}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Lifetime projects created</div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80">
            <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">Active Projects</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{stats.activeProjects}</div>
            <div className="text-[10px] text-blue-600 mt-0.5">In Progress or Pending</div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">Completed</div>
            <div className="text-2xl font-bold text-emerald-900 mt-1">{stats.completedProjects}</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">Successfully delivered</div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-300">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">Total Earnings</div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-900 mt-1">
              {formatCurrency(stats.totalEarnings, currency)}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">Paid invoices received</div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 col-span-2 md:col-span-1">
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">Pending Payments</div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-900 mt-1">
              {formatCurrency(stats.pendingPayments, currency)}
            </div>
            <div className="text-[10px] text-amber-700 mt-0.5">Awaiting client payment</div>
          </div>

        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          Dashboard Overview
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'projects' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          Projects ({myProjects.length})
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'clients' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Clients ({myClients.length})
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'invoices' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Invoices & Billing ({myInvoices.length})
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'files' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Files & Deliverables ({myFiles.length})
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'messages' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Client Messages
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'plans' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          SaaS Pricing Plans
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Section 1: User requested Recent Projects Dashboard Widget */}
          <RecentProjectsWidget
            viewMode="freelancer"
            onNavigateProjects={() => setActiveTab('projects')}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Projects List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Detailed Project Workflows</h3>
                  <p className="text-xs text-slate-500">Track milestones and checklist progress for your active clients</p>
                </div>
                <button
                  onClick={() => setActiveTab('projects')}
                  className="text-xs text-indigo-600 font-semibold hover:underline"
                >
                  View all ({myProjects.length})
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
              {myProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 shadow-xs transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{proj.name}</h4>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(proj.status)}`}>
                          {proj.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Client: <strong className="text-slate-700">{proj.clientName}</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-extrabold text-slate-900">
                        {formatCurrency(proj.budget, proj.currency)}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 justify-end">
                        <Calendar className="w-3 h-3" /> Due {proj.deadline}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Milestones Progress</span>
                      <span className="font-bold text-indigo-600">{proj.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${proj.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Milestone checklist */}
                  <div className="border-t border-slate-100 pt-3 space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-600">Tasks & Milestones:</div>
                    <div className="space-y-1">
                      {proj.tasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => toggleTaskCompletion(proj.id, task.id)}
                          className="w-full text-left flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition text-xs group"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                                task.completed
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 group-hover:border-slate-400'
                              }`}
                            >
                              {task.completed && <Check className="w-3 h-3" />}
                            </div>
                            <span className={task.completed ? 'line-through text-slate-400' : 'text-slate-700'}>
                              {task.title}
                            </span>
                          </div>
                          {task.dueDate && (
                            <span className="text-[10px] text-slate-400 font-mono">{task.dueDate}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => switchRole('client', proj.clientId)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                      <span>Preview in Client Portal</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>

                    <select
                      value={proj.status}
                      onChange={(e) => updateProjectStatus(proj.id, e.target.value as ProjectStatus)}
                      className="text-xs font-medium px-2 py-1 rounded-md border border-slate-200 bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar: Recent Activities & Invoices */}
          <div className="space-y-6">
            
            {/* Recent Pending Invoices */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Recent Invoices</h3>
                <button
                  onClick={() => setIsNewInvoiceModalOpen(true)}
                  className="text-xs text-indigo-600 font-semibold hover:underline"
                >
                  + New
                </button>
              </div>

              <div className="space-y-2.5">
                {myInvoices.slice(0, 3).map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-slate-500">{inv.clientName}</div>
                      <div className="text-[10px] text-slate-400">Due {inv.dueDate}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        {formatCurrency(inv.total, inv.currency)}
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-sm ${
                          inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activities (Section 3 of PDF) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Recent Activities</h3>
              
              <div className="space-y-3">
                {activityLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="text-xs space-y-0.5 border-l-2 border-indigo-400 pl-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{log.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
        </div>
      )}

      {/* Tab 2: Projects Manager */}
      {activeTab === 'projects' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">All Projects</h3>
              <p className="text-xs text-slate-500">Create, edit, assign and manage client deliverables</p>
            </div>
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myProjects.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm">
                      {p.category}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base mt-1">{p.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{p.clientName}</p>
                  </div>
                  <select
                    value={p.status}
                    onChange={(e) => updateProjectStatus(p.id, e.target.value as ProjectStatus)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${getStatusColor(p.status)}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">{p.description}</p>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-bold text-indigo-600">{p.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${p.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Budget</div>
                    <div className="font-bold text-slate-900">{formatCurrency(p.budget, p.currency)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase">Deadline</div>
                    <div className="font-medium text-slate-700">{p.deadline}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Clients */}
      {activeTab === 'clients' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Clients Directory</h3>
              <p className="text-xs text-slate-500">Manage client profiles, contact relationships, and invitations</p>
            </div>
            <button
              onClick={() => setIsNewClientModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Invite New Client</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myClients.map((client) => {
              const clientProjs = projects.filter((p) => p.clientId === client.userId);
              const clientInvs = invoices.filter((i) => i.clientId === client.userId && i.status === 'paid');
              const totalSpent = clientInvs.reduce((sum, i) => sum + i.total, 0);

              return (
                <div
                  key={client.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 shadow-xs transition space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{client.name}</h4>
                      <p className="text-xs text-slate-500">{client.company}</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <div>📧 {client.email}</div>
                    <div>📞 {client.phone}</div>
                    {client.address && <div>📍 {client.address}</div>}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50">
                      <div className="text-[10px] text-slate-400">Projects</div>
                      <div className="font-bold text-slate-900">{clientProjs.length}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50">
                      <div className="text-[10px] text-slate-400">Total Paid</div>
                      <div className="font-bold text-emerald-700">{formatCurrency(totalSpent, currency)}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => switchRole('client', client.userId)}
                    className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    <span>Open Client's Portal View</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Invoices & Payment Tracking</h3>
              <p className="text-xs text-slate-500">Create, send, print PDF slips and track paid/overdue status</p>
            </div>
            <button
              onClick={() => setIsNewInvoiceModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{inv.clientName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{inv.projectName}</td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{inv.issueDate}</td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{inv.dueDate}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      {formatCurrency(inv.total, inv.currency)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'sent'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => setSelectedInvoiceForPrint(inv)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print / PDF</span>
                      </button>
                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => markInvoicePaid(inv.id)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Files */}
      {activeTab === 'files' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Project Documents & Deliverables</h3>
              <p className="text-xs text-slate-500">Securely upload and share designs, source code, contracts with clients</p>
            </div>
            <button
              onClick={() => setIsUploadFileModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>Share Deliverable File</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myFiles.map((file) => (
              <div
                key={file.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{file.fileName}</h4>
                    <p className="text-[11px] text-slate-500">{file.projectName}</p>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {file.fileSize} • Uploaded by {file.uploaderName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alert(`Simulating secure download for: ${file.fileName}`)}
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteFile(file.id)}
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Messages */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-3 min-h-[500px]">
          
          {/* Client chat list */}
          <div className="border-r border-slate-200 p-4 space-y-3 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Client Conversations</h3>
            <div className="space-y-1">
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChatClient(c.userId)}
                  className={`w-full p-3 rounded-xl text-left transition flex items-center gap-3 ${
                    selectedChatClient === c.userId
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      selectedChatClient === c.userId ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-xs">{c.name}</div>
                    <div className={`text-[10px] ${selectedChatClient === c.userId ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {c.company}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat thread */}
          <div className="md:col-span-2 flex flex-col justify-between p-4 bg-white">
            <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {clients.find((c) => c.userId === selectedChatClient)?.name || 'Client Chat'}
                </h4>
                <p className="text-[11px] text-slate-400">Direct secure client messaging</p>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Online
              </span>
            </div>

            {/* Messages box */}
            <div className="flex-1 overflow-y-auto space-y-3 p-2 max-h-[350px]">
              {messages.map((m) => {
                const isMe = m.senderId === freelancerId;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-xs'
                          : 'bg-slate-100 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      <div className="font-bold text-[10px] opacity-80 mb-1">{m.senderName}</div>
                      <p>{m.content}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Chat input */}
            <form onSubmit={handleSendChat} className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                placeholder="Type your message to client..."
                value={chatMessageText}
                onChange={(e) => setChatMessageText(e.target.value)}
                className="flex-1 px-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Tab 7: SaaS Subscription Plans (Section 6 of PDF) */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-wider font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              SaaS Subscription Plans
            </span>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Grow Your Freelance SaaS Business
            </h3>
            <p className="text-xs text-slate-500">
              Pick the tier that fits your client roster. All plans include client portal access, project progress bars, and invoice generation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isCurrent = currentUser?.plan === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-6 bg-white border transition flex flex-col justify-between ${
                    plan.popular
                      ? 'border-indigo-600 shadow-xl ring-2 ring-indigo-600/20'
                      : 'border-slate-200 shadow-xs'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{plan.name}</h4>
                      <p className="text-xs text-slate-500 min-h-[32px] mt-1">{plan.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-3xl font-extrabold text-slate-900">
                        {currency === 'PKR' ? `Rs. ${plan.pricePkr.toLocaleString()}` : `$${plan.priceUsd}`}
                        <span className="text-xs font-normal text-slate-400">/month</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => {
                        setSelectedPlanForPayment(plan.id);
                        setIsDebitModalOpen(true);
                      }}
                      disabled={isCurrent}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 ${
                        isCurrent
                          ? 'bg-slate-100 text-slate-400 cursor-default'
                          : plan.popular
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{isCurrent ? 'Current Active Plan' : `Upgrade to ${plan.name} (Debit Card)`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Revenue Projection Example from PDF Section 6 */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold">SaaS Earning Projection (From Project Outline):</strong>
              <p className="mt-1">
                Agar aap 20 customers ko Rs. 1,999/month ka Pro plan provide karein, toh gross recurring revenue Rs. 39,980/month hoga.
                Portal automated invoices and instant client access streamlines billing friction to increase customer retention.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* Modal 1: New Project Modal (Section 4 of PDF) */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Create New Project</h3>
              <button onClick={() => setIsNewProjectModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fintech Mobile App Redesign"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client Name / Assigned Client</label>
                <select
                  value={projClientId}
                  onChange={(e) => setProjClientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Select a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.userId}>
                      {c.name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Budget ({currency})</label>
                  <input
                    type="number"
                    required
                    value={projBudget}
                    onChange={(e) => setProjBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={projCategory}
                    onChange={(e) => setProjCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="Branding">Branding</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={projStartDate}
                    onChange={(e) => setProjStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deadline</label>
                  <input
                    type="date"
                    required
                    value={projDeadline}
                    onChange={(e) => setProjDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Description</label>
                <textarea
                  rows={3}
                  placeholder="Outline key project deliverables and goals..."
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Invoice Modal */}
      {isNewInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Generate Invoice</h3>
              <button onClick={() => setIsNewInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Project</label>
                <select
                  value={invProjectId}
                  onChange={(e) => setInvProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Select project...</option>
                  {myProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.clientName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Due Date</label>
                <input
                  type="date"
                  required
                  value={invDueDate}
                  onChange={(e) => setInvDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-2">
                <div className="font-semibold text-slate-700">Line Items:</div>
                {invItems.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2">
                    <input
                      type="text"
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => {
                        const copy = [...invItems];
                        copy[idx].description = e.target.value;
                        setInvItems(copy);
                      }}
                      className="col-span-6 px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => {
                        const copy = [...invItems];
                        copy[idx].quantity = Number(e.target.value);
                        setInvItems(copy);
                      }}
                      className="col-span-2 px-2 py-1.5 border border-slate-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => {
                        const copy = [...invItems];
                        copy[idx].rate = Number(e.target.value);
                        setInvItems(copy);
                      }}
                      className="col-span-4 px-2 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tax (%)</label>
                  <input
                    type="number"
                    value={invTax}
                    onChange={(e) => setInvTax(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount ({currency})</label>
                  <input
                    type="number"
                    value={invDiscount}
                    onChange={(e) => setInvDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex justify-between font-bold text-sm text-slate-900">
                <span>Calculated Total:</span>
                <span>{formatCurrency(calculateInvoiceTotals(invItems, invTax, invDiscount).total, currency)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Send to Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Invite Client Modal */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Invite Client to Portal</h3>
              <button onClick={() => setIsNewClientModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="tariq@clientcompany.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Organization</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+92 300 0000000"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save & Invite Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Upload File Modal */}
      {isUploadFileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Share Deliverable / Document</h3>
              <button onClick={() => setIsUploadFileModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadFile} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Project</label>
                <select
                  value={fileProjId}
                  onChange={(e) => setFileProjId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Select project...</option>
                  {myProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">File Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Final_Prototype_Design_v1.fig"
                  value={fileNameInput}
                  onChange={(e) => setFileNameInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">File Category</label>
                <select
                  value={fileCategory}
                  onChange={(e) => setFileCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="deliverable">Deliverable</option>
                  <option value="design">Design Asset</option>
                  <option value="contract">Contract / NDA</option>
                  <option value="brief">Project Brief</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadFileModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Upload & Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Printable Invoice View */}
      {selectedInvoiceForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  FP
                </div>
                <span className="font-extrabold text-slate-900 text-base">FreelancePort Portal Invoice</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
                <button onClick={() => setSelectedInvoiceForPrint(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-start text-xs">
              <div>
                <div className="text-slate-400 font-semibold uppercase">From:</div>
                <div className="font-bold text-slate-900 text-sm mt-1">{selectedInvoiceForPrint.freelancerName}</div>
                <div className="text-slate-500">Verified Freelancer Portal Partner</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 font-semibold uppercase">Billed To:</div>
                <div className="font-bold text-slate-900 text-sm mt-1">{selectedInvoiceForPrint.clientName}</div>
                <div className="text-slate-500">{selectedInvoiceForPrint.clientEmail || 'Client Account'}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Invoice Number:</span>
                <div className="font-mono font-bold text-indigo-600">{selectedInvoiceForPrint.invoiceNumber}</div>
              </div>
              <div>
                <span className="text-slate-400">Issue Date:</span>
                <div className="font-semibold text-slate-800">{selectedInvoiceForPrint.issueDate}</div>
              </div>
              <div>
                <span className="text-slate-400">Due Date:</span>
                <div className="font-semibold text-slate-800">{selectedInvoiceForPrint.dueDate}</div>
              </div>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Rate</th>
                  <th className="p-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedInvoiceForPrint.items.map((item, i) => (
                  <tr key={i}>
                    <td className="p-2.5 font-medium text-slate-800">{item.description}</td>
                    <td className="p-2.5 text-center">{item.quantity}</td>
                    <td className="p-2.5 text-right">{formatCurrency(item.rate, selectedInvoiceForPrint.currency)}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">
                      {formatCurrency(item.amount, selectedInvoiceForPrint.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 text-xs text-right">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedInvoiceForPrint.subtotal, selectedInvoiceForPrint.currency)}</span>
                </div>
                {selectedInvoiceForPrint.taxPercent > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax ({selectedInvoiceForPrint.taxPercent}%):</span>
                    <span>
                      {formatCurrency(
                        (selectedInvoiceForPrint.subtotal * selectedInvoiceForPrint.taxPercent) / 100,
                        selectedInvoiceForPrint.currency
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-base text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-indigo-600">
                    {formatCurrency(selectedInvoiceForPrint.total, selectedInvoiceForPrint.currency)}
                  </span>
                </div>
              </div>
            </div>

            {selectedInvoiceForPrint.notes && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
                <span className="font-bold text-slate-800">Payment Notes:</span> {selectedInvoiceForPrint.notes}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
