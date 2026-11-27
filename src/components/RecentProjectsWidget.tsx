import React, { useState } from 'react';
import { motion } from 'motion/react';
import { usePortal } from '../context/PortalContext';
import {
  Briefcase,
  Calendar,
  Check,
  MessageSquare
} from 'lucide-react';
import { ProjectStatus } from '../types';
import { formatCurrency } from '../utils/calculations';

interface RecentProjectsWidgetProps {
  viewMode: 'freelancer' | 'client';
  onNavigateProjects?: () => void;
}

export const RecentProjectsWidget: React.FC<RecentProjectsWidgetProps> = ({
  viewMode,
}) => {
  const {
    currentUser,
    projects,
    messages,
    updateProjectStatus,
    openProjectChat,
  } = usePortal();

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'completed'>('all');

  const relevantProjects = projects.filter((p) => {
    if (viewMode === 'client') {
      return p.clientId === currentUser?.id;
    }
    if (currentUser?.role === 'admin') return true;
    return p.freelancerId === currentUser?.id || true;
  });

  const filteredProjects = relevantProjects.filter((p) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return p.status === 'in_progress' || p.status === 'review';
    if (statusFilter === 'pending') return p.status === 'pending';
    if (statusFilter === 'completed') return p.status === 'completed';
    return true;
  });

  const getStatusMeta = (status: ProjectStatus) => {
    switch (status) {
      case 'completed':
        return { label: 'Completed', text: 'text-emerald-700', dot: 'bg-emerald-500' };
      case 'in_progress':
        return { label: 'In Progress', text: 'text-indigo-700', dot: 'bg-indigo-600' };
      case 'review':
        return { label: 'In Review', text: 'text-purple-700', dot: 'bg-purple-600' };
      case 'pending':
        return { label: 'Pending', text: 'text-amber-700', dot: 'bg-amber-500' };
    }
  };

  const activeCount = relevantProjects.filter((p) => p.status === 'in_progress' || p.status === 'review').length;
  const pendingCount = relevantProjects.filter((p) => p.status === 'pending').length;
  const completedCount = relevantProjects.filter((p) => p.status === 'completed').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Briefcase className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-950 text-base flex items-center gap-2">
              <span>Active Projects</span>
              <span className="text-xs font-mono font-medium text-slate-400 tabular-nums">
                ({relevantProjects.length})
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {viewMode === 'freelancer'
                ? 'Overview of client assignments, milestones & direct discussions'
                : 'Live tracking of your deliverables, milestones & freelancer chat'}
            </p>
          </div>
        </div>

        {/* Status Filter Segmented Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium overflow-x-auto">
          {[
            { id: 'all', label: `All (${relevantProjects.length})` },
            { id: 'active', label: `Active (${activeCount})` },
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'completed', label: `Completed (${completedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
              className={`px-3 py-1 rounded-lg transition cursor-pointer whitespace-nowrap tabular-nums ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="p-5">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 space-y-1.5">
            <p>
              {relevantProjects.length === 0
                ? 'No projects assigned yet.'
                : `No projects match "${statusFilter}" filter.`}
            </p>
            {statusFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="text-indigo-600 font-semibold hover:underline cursor-pointer"
              >
                Show all projects
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((project, idx) => {
              const status = getStatusMeta(project.status);
              const projectMsgCount = messages.filter((m) => m.projectId === project.id).length;

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: Math.min(idx * 0.04, 0.2) }}
                  className="p-4 sm:p-5 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:border-indigo-300 transition space-y-3.5"
                >
                  {/* Top Meta & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-indigo-600">{project.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className={`inline-flex items-center gap-1.5 font-semibold ${status.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-slate-950 text-sm mt-1 truncate">
                        {project.name}
                      </h4>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {viewMode === 'freelancer' ? (
                          <>Client: <strong className="text-slate-700 font-medium">{project.clientName}</strong></>
                        ) : (
                          <>Freelancer: <strong className="text-slate-700 font-medium">{project.freelancerName}</strong></>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openProjectChat(project.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white text-[11px] font-semibold inline-flex items-center gap-1.5 transition cursor-pointer shrink-0 tabular-nums"
                      title={viewMode === 'client' ? 'Message your assigned freelancer' : 'Message your assigned client'}
                    >
                      <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        {viewMode === 'client' ? 'Message Freelancer' : 'Message Client'}
                        {projectMsgCount > 0 ? ` (${projectMsgCount})` : ''}
                      </span>
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 text-[11px]">Milestones</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-1.5 rounded-full ${
                          project.status === 'completed'
                            ? 'bg-emerald-600'
                            : project.status === 'pending'
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Key Tasks */}
                  {project.tasks && project.tasks.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                      {project.tasks.slice(0, 2).map((t) => (
                        <div key={t.id} className="flex items-center gap-2 text-[11px] text-slate-600">
                          <div
                            className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                              t.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                            }`}
                          >
                            {t.completed && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <span className={t.completed ? 'line-through text-slate-400 truncate' : 'truncate'}>
                            {t.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer: Budget & Deadline + Status Updater */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Budget</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(project.budget, project.currency)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block">Deadline</span>
                      <span className="font-medium text-slate-700 flex items-center gap-1 justify-end tabular-nums">
                        <Calendar className="w-3 h-3 text-slate-400" aria-hidden="true" />
                        {project.deadline}
                      </span>
                    </div>
                  </div>

                  {viewMode === 'freelancer' && (
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-[11px] text-slate-500">Status</span>
                      <select
                        value={project.status}
                        onChange={(e) => updateProjectStatus(project.id, e.target.value as ProjectStatus)}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 bg-white focus:outline-hidden"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">In Review</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
