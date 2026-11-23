import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePortal } from '../context/PortalContext';
import {
  Briefcase,
  FolderOpen,
  FileText,
  MessageSquare,
  CheckCircle2,
  Download,
  Check,
  Printer,
  X
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import { Invoice } from '../types';
import { RecentProjectsWidget } from './RecentProjectsWidget';
import { ProjectChatRoom } from './ProjectChatRoom';

export const ClientPortal: React.FC = () => {
  const {
    currentUser,
    projects,
    invoices,
    files,
    messages,
    currency,
    setSelectedInvoiceForPayment,
    openProjectChat,
  } = usePortal();

  const [activeTab, setActiveTab] = useState<'projects' | 'files' | 'invoices' | 'chat'>('projects');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [selectedChatProjId, setSelectedChatProjId] = useState<string>('');

  const clientId = currentUser?.id || 'user-client-1';

  // Strict Client data isolation: Only projects assigned to this client
  const myProjects = projects.filter((p) => p.clientId === clientId);
  const myInvoices = invoices.filter((i) => i.clientId === clientId);
  const myProjectIds = myProjects.map((p) => p.id);
  const myFiles = files.filter((f) => myProjectIds.includes(f.projectId));

  useEffect(() => {
    if (myProjects.length > 0 && !myProjects.some((p) => p.id === selectedChatProjId)) {
      setSelectedChatProjId(myProjects[0].id);
    }
  }, [myProjects, selectedChatProjId]);

  useEffect(() => {
    if (!selectedInvoice) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedInvoice(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedInvoice]);

  const totalSpent = myInvoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const pendingDue = myInvoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.total, 0);

  const selectedChatProject = myProjects.find((p) => p.id === selectedChatProjId) || myProjects[0] || null;

  const handlePayInvoice = (inv: Invoice) => {
    setSelectedInvoiceForPayment(inv);
  };

  const handleDownloadFile = (fileName: string) => {
    setDownloadNotice(`Preparing secure download: ${fileName}`);
    setTimeout(() => setDownloadNotice(null), 3200);
  };

  const tabs: Array<{ id: 'projects' | 'files' | 'invoices' | 'chat'; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'projects', label: `My Projects (${myProjects.length})`, icon: Briefcase },
    { id: 'files', label: `Deliverables & Files (${myFiles.length})`, icon: FolderOpen },
    { id: 'invoices', label: `Invoices (${myInvoices.length})`, icon: FileText },
    { id: 'chat', label: 'Project Discussion', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Header Summary Card */}
      <div className="rounded-2xl bg-slate-950 text-white p-6 sm:p-8 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-emerald-400 uppercase tracking-wider">Client Portal</span>
              <span aria-hidden="true">·</span>
              <span>{currentUser?.company || 'Client Workspace'}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome, {currentUser?.name || 'Client'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Track project milestones, inspect deliverable files, settle invoices, and chat directly with your freelancer inside each project room.
            </p>
          </div>

          <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs shrink-0">
            <span className="text-slate-400 block text-[11px]">Total Paid To Date</span>
            <span className="font-mono text-lg font-bold text-emerald-400 tabular-nums">
              {formatCurrency(totalSpent, currency)}
            </span>
          </div>
        </div>

        {/* 4 Client Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-400 text-[11px]">Assigned Projects</span>
            <div className="font-display text-xl font-bold text-white mt-1 tabular-nums">{myProjects.length}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-400 text-[11px]">Ongoing Work</span>
            <div className="font-display text-xl font-bold text-white mt-1 tabular-nums">
              {myProjects.filter((p) => p.status === 'in_progress').length}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-400 text-[11px]">Pending Invoices</span>
            <div className="font-mono text-xl font-bold text-amber-300 mt-1 tabular-nums">
              {formatCurrency(pendingDue, currency)}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-400 text-[11px]">Deliverable Files</span>
            <div className="font-display text-xl font-bold text-white mt-1 tabular-nums">{myFiles.length}</div>
          </div>
        </div>
      </div>

      {/* Non-blocking Download Toast */}
      <AnimatePresence>
        {downloadNotice && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>{downloadNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client Nav Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2.5 text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isActive ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{tab.label}</span>
              {isActive && (
                <motion.span
                  layoutId="client-portal-tab"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-600 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Projects */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <RecentProjectsWidget viewMode="client" />

          {myProjects.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
              No active projects assigned to your account yet. Your freelancer will invite you or you can submit a brief from the overview page.
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-slate-900 text-sm">Detailed Deliverables &amp; Milestones</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myProjects.map((proj) => {
                  const msgCount = messages.filter((m) => m.projectId === proj.id).length;
                  return (
                    <div
                      key={proj.id}
                      className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4 hover:border-emerald-300 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-semibold text-emerald-700">{proj.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="uppercase font-medium text-slate-600">
                              {proj.status.replace('_', ' ')}
                            </span>
                          </div>
                          <h3 className="font-display font-bold text-slate-950 text-base mt-1 truncate">
                            {proj.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Freelancer: <strong className="text-slate-800 font-medium">{proj.freelancerName}</strong>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => openProjectChat(proj.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 tabular-nums"
                        >
                          <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Chat{msgCount > 0 ? ` (${msgCount})` : ''}</span>
                        </button>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Completion</span>
                          <span className="font-mono font-bold text-emerald-700 tabular-nums">{proj.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Tasks List */}
                      <div className="border-t border-slate-100 pt-3 space-y-2">
                        <div className="text-[11px] font-semibold text-slate-700">Milestone Checkpoints</div>
                        <div className="space-y-1.5">
                          {proj.tasks.map((task) => (
                            <div key={task.id} className="flex items-center gap-2 text-xs">
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
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
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            {formatCurrency(proj.budget, proj.currency)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase">Estimated Delivery</span>
                          <span className="font-medium text-slate-700 tabular-nums">{proj.deadline}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Files */}
      {activeTab === 'files' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div>
            <h3 className="font-display font-bold text-slate-950 text-base">Shared Deliverables &amp; Project Files</h3>
            <p className="text-xs text-slate-500">Download approved source files, prototypes, designs, and agreements</p>
          </div>

          {myFiles.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
              No files uploaded for your projects yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <FolderOpen className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-900 truncate">{file.fileName}</h4>
                      <p className="text-[11px] text-slate-500 truncate">{file.projectName}</p>
                      <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                        {file.fileSize} · Uploaded by {file.uploaderName}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadFile(file.fileName)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div>
            <h3 className="font-display font-bold text-slate-950 text-base">Invoices &amp; Billing History</h3>
            <p className="text-xs text-slate-500">Review outstanding balances and inspect payment receipts</p>
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
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No invoices generated for your account yet.
                    </td>
                  </tr>
                ) : (
                  myInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{inv.invoiceNumber}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{inv.projectName}</td>
                      <td className="py-3.5 px-4 text-slate-500 tabular-nums">{inv.dueDate}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(inv.total, inv.currency)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase ${
                            inv.status === 'paid' ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3" aria-hidden="true" />
                          <span>Receipt</span>
                        </button>

                        {inv.status !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => handlePayInvoice(inv)}
                            className="px-3 py-1 rounded-md text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                          >
                            Pay {formatCurrency(inv.total, inv.currency)}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Project-Scoped Real-Time Discussion */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-3 min-h-[540px]">
          <div className="border-b md:border-b-0 md:border-r border-slate-200 p-4 space-y-3 bg-slate-50/50">
            <div>
              <h3 className="font-display font-bold text-slate-950 text-xs uppercase tracking-wider">
                Your Project Rooms
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Har project ka alag real-time discussion room
              </p>
            </div>

            {myProjects.length === 0 ? (
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-500">
                Koi project assigned nahi hai. Jab aap project submit karenge ya freelancer add karega, yahan room open ho jayega.
              </div>
            ) : (
              <div className="space-y-1.5">
                {myProjects.map((proj) => {
                  const isSelected = selectedChatProject?.id === proj.id;
                  const count = messages.filter((m) => m.projectId === proj.id).length;
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => setSelectedChatProjId(proj.id)}
                      className={`w-full p-3 rounded-xl text-left transition flex items-start justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-xs truncate">{proj.name}</div>
                        <div className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          Freelancer: {proj.freelancerName} · {proj.progress}%
                        </div>
                      </div>
                      {count > 0 && (
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold tabular-nums shrink-0 ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="md:col-span-2 flex flex-col min-h-[480px]">
            {selectedChatProject ? (
              <ProjectChatRoom project={selectedChatProject} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2 text-slate-500 text-xs">
                <MessageSquare className="w-8 h-8 text-slate-300" aria-hidden="true" />
                <div className="font-semibold text-slate-800 text-sm">No Project Room Selected</div>
                <p className="max-w-xs">
                  Select a project from the list to chat directly with your freelancer.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice receipt modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs p-3 sm:p-4">
            <div className="min-h-full flex items-center justify-center py-6 sm:py-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.16 }}
                role="dialog"
                aria-modal="true"
                className="relative bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
              >
                <div className="sticky top-0 z-30 px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
                  <div>
                    <h3 className="font-display font-bold text-slate-100 text-base">
                      Invoice Receipt {selectedInvoice.invoiceNumber}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Billing payment proof &amp; receipt summary</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    aria-label="Close receipt"
                    className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0 ml-3"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                  <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Project</span>
                      <span className="font-semibold text-slate-800">{selectedInvoice.projectName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Freelancer</span>
                      <span className="font-semibold text-slate-800">{selectedInvoice.freelancerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>
                      <span className="font-bold uppercase text-emerald-700">{selectedInvoice.status}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-slate-900">
                      <span>Total Amount</span>
                      <span className="font-mono text-emerald-700 tabular-nums">
                        {formatCurrency(selectedInvoice.total, selectedInvoice.currency)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Print / Save PDF Receipt</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
