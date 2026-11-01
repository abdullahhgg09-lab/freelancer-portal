import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import {
  ShieldCheck,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  Activity,
  Database,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  UserX,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Server,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { computeAdminStats, formatCurrency } from '../utils/calculations';
import { ProjectStatus, UserRole } from '../types';
import { SUPABASE_SQL_SCHEMA } from '../lib/supabase';

export const AdminPanel: React.FC = () => {
  const {
    currentUser,
    users,
    projects,
    clients,
    invoices,
    files,
    activityLogs,
    currency,
    supabaseConfig,
    toggleUserStatus,
    updateProjectStatus,
    markInvoicePaid,
    switchRole,
    setIsSupabaseGuideOpen,
    saveSupabaseConfig
  } = usePortal();

  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'users' | 'invoices' | 'supabase' | 'logs'>('overview');
  const [projectSearch, setProjectSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Supabase test inputs in admin panel
  const [dbUrl, setDbUrl] = useState(supabaseConfig.url || '');
  const [dbKey, setDbKey] = useState(supabaseConfig.anonKey || '');
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  const [isDbTesting, setIsDbTesting] = useState(false);

  const stats = computeAdminStats(users, projects, invoices);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.clientName.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.freelancerName.toLowerCase().includes(projectSearch.toLowerCase());
    const matchesFilter = projectFilter === 'all' || p.status === projectFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const handleTestSupabaseFromAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDbTesting(true);
    setDbStatus(null);
    const res = await saveSupabaseConfig(dbUrl, dbKey);
    setIsDbTesting(false);
    setDbStatus(res.message);
  };

  const getStatusBadge = (status: ProjectStatus) => {
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
      
      {/* Admin Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/15 via-rose-500/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Super Admin Master Mode
              </span>
              <span className="text-xs text-slate-400">Username: <strong>abdary</strong></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Website Master Control Center
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Yahan se aap website ke tamaam freelancers, clients, projects, payments, activity logs aur Supabase database ko live dekh aur control kar sakte hain.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsSupabaseGuideOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition flex items-center gap-2"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Supabase Guide & SQL</span>
            </button>
            <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/10 text-xs flex items-center gap-2 text-slate-200">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>Status: <strong>Operational (100%)</strong></span>
            </div>
          </div>
        </div>

        {/* Global KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          
          <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Total Registered Users</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold mt-2 text-white">{stats.totalUsers}</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">{stats.totalFreelancers} Freelancers</span> • 
              <span className="text-cyan-400 font-medium">{stats.totalClients} Clients</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Platform Projects</span>
              <Briefcase className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold mt-2 text-white">{stats.totalProjects}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              <span className="text-amber-400 font-medium">{stats.activeProjects} active</span>, {stats.completedProjects} completed
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Total Paid Volume</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold mt-2 text-white">
              {formatCurrency(stats.totalPlatformVolume, currency)}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">Processed across platform</div>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Pending Invoices</span>
              <FileText className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold mt-2 text-white">
              {formatCurrency(stats.totalPendingInvoices, currency)}
            </div>
            <div className="text-[11px] text-rose-300 mt-1">Awaiting client payment</div>
          </div>

        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Platform Overview
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'projects'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          All Projects ({projects.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Users Directory ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'invoices'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Global Invoices ({invoices.length})
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'supabase'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Supabase Database Engine
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Live Audit Logs ({activityLogs.length})
        </button>
      </div>

      {/* Tab 1: Platform Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Projects Highlights */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Active Platform Projects</h3>
                <p className="text-xs text-slate-500">Highest value ongoing freelancer client work</p>
              </div>
              <button
                onClick={() => setActiveTab('projects')}
                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
              >
                View all ({projects.length}) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {projects.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">{p.name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(p.status)}`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>Freelancer: <strong>{p.freelancerName}</strong></span> • 
                      <span>Client: <strong>{p.clientName}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        {formatCurrency(p.budget, p.currency)}
                      </div>
                      <div className="text-[11px] text-slate-500">{p.progress}% progress</div>
                    </div>
                    <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${p.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick System & Supabase Status Box */}
          <div className="space-y-6">
            
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                Supabase Cloud Database
              </h3>
              
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Connection Status:</span>
                  <span className="font-semibold text-emerald-700">
                    {supabaseConfig.isConnected ? 'Active & Linked' : 'Local Storage Mode'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PostgreSQL Schema:</span>
                  <span className="font-semibold text-slate-700">10 Tables Configured</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">RLS Security Rules:</span>
                  <span className="font-semibold text-indigo-700">Role-Enforced</span>
                </div>
              </div>

              <button
                onClick={() => setIsSupabaseGuideOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2"
              >
                <span>View Supabase Setup & SQL</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Audit Feed */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Live Activity Audit
                </h3>
                <button
                  onClick={() => setActiveTab('logs')}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  More
                </button>
              </div>

              <div className="space-y-3">
                {activityLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="text-xs border-l-2 border-indigo-500 pl-3 py-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{log.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{log.details}</p>
                    <div className="text-[10px] text-slate-400">By {log.userName} ({log.userRole})</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Tab 2: All Projects */}
      {activeTab === 'projects' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">All Projects Across Platform</h3>
              <p className="text-xs text-slate-500">Monitor deadlines, progress, budgets and status of all projects</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search project or client..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Freelancer</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-400">{p.category}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{p.freelancerName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{p.clientName}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCurrency(p.budget, p.currency)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${p.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{p.deadline}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={p.status}
                        onChange={(e) => updateProjectStatus(p.id, e.target.value as ProjectStatus)}
                        className={`text-[11px] font-semibold px-2 py-1 rounded-md border ${getStatusBadge(p.status)} focus:outline-hidden`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          switchRole('client', p.clientId);
                        }}
                        title="View as Client"
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded-sm hover:bg-indigo-50"
                      >
                        Client View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Users Directory & Moderation */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Users Directory & Moderation</h3>
              <p className="text-xs text-slate-500">Platform members, active plans, suspension controls</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="all">All Roles</option>
                <option value="freelancer">Freelancers</option>
                <option value="client">Clients</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200 text-[10px]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Company / Studio</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <img
                        src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">{u.username}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          u.role === 'admin'
                            ? 'bg-rose-100 text-rose-800'
                            : u.role === 'freelancer'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{u.company || '—'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{u.phone || '—'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.status === 'active' ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Active
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Suspended
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                            u.status === 'active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Reactivate'}
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

      {/* Tab 4: Global Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Global Invoices & Billing</h3>
              <p className="text-xs text-slate-500">All invoices generated across freelancers and clients</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Freelancer</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{inv.freelancerName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{inv.clientName}</td>
                    <td className="py-3.5 px-4 text-slate-500">{inv.projectName}</td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">{inv.dueDate}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
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
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => markInvoicePaid(inv.id)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
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

      {/* Tab 5: Supabase Database Engine */}
      {activeTab === 'supabase' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Supabase Connect Form */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Supabase PostgreSQL Connection</h3>
                <p className="text-xs text-slate-500">Connect your Supabase cloud database instance</p>
              </div>
            </div>

            <form onSubmit={handleTestSupabaseFromAdmin} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyz.supabase.co"
                  value={dbUrl}
                  onChange={(e) => setDbUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  value={dbKey}
                  onChange={(e) => setDbKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              {dbStatus && (
                <div className="p-3 bg-slate-100 rounded-lg text-xs font-medium text-slate-800 border border-slate-200">
                  {dbStatus}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsSupabaseGuideOpen(true)}
                  className="text-xs text-emerald-700 font-semibold hover:underline"
                >
                  Step-by-Step Guide Dekhein
                </button>

                <button
                  type="submit"
                  disabled={isDbTesting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition"
                >
                  {isDbTesting ? 'Connecting...' : 'Save & Verify Connection'}
                </button>
              </div>
            </form>

            <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600">
              <div className="font-bold text-slate-800">Database Tables Status:</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-50 rounded-md border border-slate-100">
                  <span className="font-semibold text-slate-700">portal_users</span>: {users.length} records
                </div>
                <div className="p-2 bg-slate-50 rounded-md border border-slate-100">
                  <span className="font-semibold text-slate-700">portal_projects</span>: {projects.length} records
                </div>
                <div className="p-2 bg-slate-50 rounded-md border border-slate-100">
                  <span className="font-semibold text-slate-700">portal_invoices</span>: {invoices.length} records
                </div>
                <div className="p-2 bg-slate-50 rounded-md border border-slate-100">
                  <span className="font-semibold text-slate-700">portal_activity_logs</span>: {activityLogs.length} records
                </div>
              </div>
            </div>
          </div>

          {/* SQL Schema Copy Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Supabase SQL Editor Script</h3>
                <p className="text-xs text-slate-500">Run this once in Supabase SQL editor</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                  setCopiedSchema(true);
                  setTimeout(() => setCopiedSchema(false), 2000);
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchema ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>

            <div className="bg-slate-950 text-slate-300 font-mono text-[11px] p-3 rounded-xl max-h-80 overflow-y-auto border border-slate-800">
              <pre>{SUPABASE_SQL_SCHEMA.slice(0, 1200)}... (truncated view, click copy for complete)</pre>
            </div>
          </div>

        </div>
      )}

      {/* Tab 6: Live Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Live Activity Audit Trail</h3>
              <p className="text-xs text-slate-500">Complete immutable record of all website actions</p>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded-md">
              {activityLogs.length} total entries
            </span>
          </div>

          <div className="space-y-2">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-sm ${
                        log.category === 'invoice'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.category === 'project'
                          ? 'bg-blue-100 text-blue-800'
                          : log.category === 'auth'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {log.category}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{log.details}</p>
                  <div className="text-[10px] text-slate-400">
                    Initiated by: <span className="font-medium text-slate-600">{log.userName}</span> ({log.userRole})
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
