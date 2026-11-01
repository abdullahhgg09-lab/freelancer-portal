import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import {
  Briefcase,
  FolderOpen,
  FileText,
  MessageSquare,
  CheckCircle2,
  Clock,
  Download,
  CreditCard,
  Send,
  Calendar,
  DollarSign,
  ShieldCheck,
  Check,
  Printer,
  X
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import { Invoice } from '../types';
import { RecentProjectsWidget } from './RecentProjectsWidget';

export const ClientPortal: React.FC = () => {
  const {
    currentUser,
    projects,
    invoices,
    files,
    messages,
    currency,
    markInvoicePaid,
    sendMessage
  } = usePortal();

  const [activeTab, setActiveTab] = useState<'projects' | 'files' | 'invoices' | 'chat'>('projects');
  const [chatMessageText, setChatMessageText] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null);

  const clientId = currentUser?.id || 'user-client-1';

  // Strict Client data isolation: Only projects assigned to this client
  const myProjects = projects.filter((p) => p.clientId === clientId);
  const myInvoices = invoices.filter((i) => i.clientId === clientId);
  const myProjectIds = myProjects.map((p) => p.id);
  const myFiles = files.filter((f) => myProjectIds.includes(f.projectId));

  const totalSpent = myInvoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const pendingDue = myInvoices.filter((i) => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.total, 0);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessageText.trim()) return;
    const targetProj = myProjects[0];
    sendMessage(
      targetProj ? targetProj.id : 'proj-1',
      chatMessageText.trim(),
      targetProj ? targetProj.freelancerId : 'user-free-1',
      targetProj ? targetProj.freelancerName : 'Freelancer'
    );
    setChatMessageText('');
  };

  const handlePayInvoice = (inv: Invoice) => {
    markInvoicePaid(inv.id);
    setPaySuccessMsg(`Payment of ${formatCurrency(inv.total, inv.currency)} completed successfully!`);
    setTimeout(() => setPaySuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Secure Client Portal
              </span>
              <span className="text-xs text-slate-300">{currentUser?.company || 'Enterprise Client'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {currentUser?.name || 'Client'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
              View your project milestones in real-time, download approved deliverable files, review invoices, and collaborate with your freelancer.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur border border-white/10 text-xs">
              <span className="text-slate-300 block text-[10px]">Total Paid To Date:</span>
              <span className="text-base font-extrabold text-emerald-400">
                {formatCurrency(totalSpent, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Client Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-300 text-[11px]">Assigned Projects</span>
            <div className="text-xl font-bold text-white mt-1">{myProjects.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-300 text-[11px]">Ongoing Work</span>
            <div className="text-xl font-bold text-white mt-1">
              {myProjects.filter((p) => p.status === 'in_progress').length}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-300 text-[11px]">Pending Invoices</span>
            <div className="text-xl font-bold text-amber-300 mt-1">
              {formatCurrency(pendingDue, currency)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-300 text-[11px]">Deliverable Files</span>
            <div className="text-xl font-bold text-white mt-1">{myFiles.length} files</div>
          </div>
        </div>
      </div>

      {paySuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{paySuccessMsg}</span>
        </div>
      )}

      {/* Client Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'projects' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          My Projects ({myProjects.length})
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'files' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Deliverables & Files ({myFiles.length})
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'invoices' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Invoices & Payments ({myInvoices.length})
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'chat' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Direct Message Freelancer
        </button>
      </div>

      {/* Tab 1: Projects */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          {/* User Requested Recent Projects Dashboard Widget with Mock Data & Status indicators */}
          <RecentProjectsWidget viewMode="client" />

          {myProjects.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
              No active projects assigned to your account. Your freelancer will invite you once work commences.
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Detailed Deliverables & Milestones</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 hover:border-emerald-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                        {proj.category}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-1">{proj.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Freelancer: <strong className="text-slate-700">{proj.freelancerName}</strong>
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        proj.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : proj.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {proj.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">{proj.description}</p>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Completion Status</span>
                      <span className="font-bold text-emerald-700">{proj.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${proj.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-700">Milestone Checkpoints:</div>
                    <div className="space-y-1">
                      {proj.tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2 text-xs">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              task.completed
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300'
                            }`}
                          >
                            {task.completed && <Check className="w-3 h-3" />}
                          </div>
                          <span className={task.completed ? 'line-through text-slate-400' : 'text-slate-700'}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Project Budget</span>
                      <span className="font-extrabold text-slate-900">{formatCurrency(proj.budget, proj.currency)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">Estimated Delivery</span>
                      <span className="font-semibold text-slate-700">{proj.deadline}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Files */}
      {activeTab === 'files' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Shared Deliverables & Project Files</h3>
            <p className="text-xs text-slate-500">Download the source files, prototypes, designs and agreements shared with you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myFiles.map((file) => (
              <div
                key={file.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{file.fileName}</h4>
                    <p className="text-[11px] text-slate-500">{file.projectName}</p>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {file.fileSize} • Uploaded by {file.uploaderName}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => alert(`Starting download for: ${file.fileName}`)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Invoices & Billing History</h3>
            <p className="text-xs text-slate-500">Review outstanding balances and view receipts</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Payment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{inv.projectName}</td>
                    <td className="py-3.5 px-4 text-slate-500">{inv.dueDate}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      {formatCurrency(inv.total, inv.currency)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>

                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => handlePayInvoice(inv)}
                          className="px-3 py-1 rounded-md text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                        >
                          Pay Now ({formatCurrency(inv.total, inv.currency)})
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

      {/* Tab 4: Chat */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base">Direct Message with Freelancer</h3>
            <p className="text-xs text-slate-500">Communicate about deliverables, feedback and milestones</p>
          </div>

          <div className="space-y-3 min-h-[250px] max-h-[400px] overflow-y-auto p-2">
            {messages.map((m) => {
              const isMe = m.senderId === clientId;
              return (
                <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs ${
                      isMe
                        ? 'bg-emerald-600 text-white rounded-br-none shadow-xs'
                        : 'bg-slate-100 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    <div className="font-bold text-[10px] opacity-85 mb-1">{m.senderName}</div>
                    <p>{m.content}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendChat} className="pt-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              placeholder="Ask a question or request revision..."
              value={chatMessageText}
              onChange={(e) => setChatMessageText(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* Invoice receipt modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-bold text-slate-900 text-sm">Invoice Receipt {selectedInvoice.invoiceNumber}</span>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Project:</span>
                <span className="font-semibold text-slate-800">{selectedInvoice.projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Freelancer:</span>
                <span className="font-semibold text-slate-800">{selectedInvoice.freelancerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold uppercase text-emerald-700">{selectedInvoice.status}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-sm text-slate-900">
                <span>Total Amount:</span>
                <span>{formatCurrency(selectedInvoice.total, selectedInvoice.currency)}</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2 bg-slate-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
