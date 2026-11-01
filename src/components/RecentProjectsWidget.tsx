import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  DollarSign,
  ChevronRight,
  Filter,
  ArrowUpRight,
  Check
} from 'lucide-react';
import { Project, ProjectStatus } from '../types';
import { formatCurrency } from '../utils/calculations';

interface RecentProjectsWidgetProps {
  viewMode: 'freelancer' | 'client';
  onNavigateProjects?: () => void;
}

export const RecentProjectsWidget: React.FC<RecentProjectsWidgetProps> = ({
  viewMode,
  onNavigateProjects,
}) => {
  const {
    currentUser,
    projects,
    currency,
    updateProjectStatus,
    toggleTaskCompletion,
  } = usePortal();

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'completed'>('all');

  // Filter projects depending on who is logged in
  const relevantProjects = projects.filter((p) => {
    if (viewMode === 'client') {
      return p.clientId === currentUser?.id;
    }
    // Freelancer or Admin
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

  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-500/20',
          dot: 'bg-indigo-500 animate-pulse',
          icon: Clock,
        };
      case 'review':
        return {
          label: 'In Review',
          badge: 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/20',
          dot: 'bg-purple-500',
          icon: Clock,
        };
      case 'pending':
        return {
          label: 'Pending',
          badge: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20',
          dot: 'bg-amber-500',
          icon: AlertCircle,
        };
    }
  };

  const activeCount = relevantProjects.filter((p) => p.status === 'in_progress' || p.status === 'review').length;
  const pendingCount = relevantProjects.filter((p) => p.status === 'pending').length;
  const completedCount = relevantProjects.filter((p) => p.status === 'completed').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Widget Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              Recent Projects Dashboard
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {relevantProjects.length} Total
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {viewMode === 'freelancer'
                ? 'Overview of your active, pending, and completed client assignments'
                : 'Live tracking of your assigned deliverables and milestones'}
            </p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg transition ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({relevantProjects.length})
          </button>

          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-indigo-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            <span>Active ({activeCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Pending ({pendingCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
              statusFilter === 'completed'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Completed ({completedCount})</span>
          </button>
        </div>
      </div>

      {/* Projects List */}
      <div className="p-5">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 space-y-1">
            <p>No projects match the selected filter ({statusFilter}).</p>
            <button
              onClick={() => setStatusFilter('all')}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Show all projects
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((project) => {
              const status = getStatusConfig(project.status);
              const StatusIcon = status.icon;

              return (
                <div
                  key={project.id}
                  className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition space-y-3.5"
                >
                  {/* Top Bar: Title & Status Indicator */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                        {project.category}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{project.name}</h4>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {viewMode === 'freelancer' ? (
                          <>Client: <strong className="text-slate-700">{project.clientName}</strong></>
                        ) : (
                          <>Freelancer: <strong className="text-slate-700">{project.freelancerName}</strong></>
                        )}
                      </div>
                    </div>

                    {/* Status Indicator Badge */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${status.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                        <span>{status.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar & percentage */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 text-[11px]">Milestones Progress</span>
                      <span className="font-extrabold text-slate-900">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          project.status === 'completed'
                            ? 'bg-emerald-600'
                            : project.status === 'pending'
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Quick Milestone Checkpoints */}
                  {project.tasks && project.tasks.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Key Tasks:</div>
                      {project.tasks.slice(0, 2).map((t) => (
                        <div key={t.id} className="flex items-center gap-2 text-[11px] text-slate-600">
                          <div
                            className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                              t.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                            }`}
                          >
                            {t.completed && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <span className={t.completed ? 'line-through text-slate-400' : 'truncate'}>
                            {t.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bottom details: Budget & Deadline */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Budget</span>
                      <span className="font-extrabold text-slate-900">
                        {formatCurrency(project.budget, project.currency)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block">Deadline</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1 justify-end">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {project.deadline}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Status Changer (for Freelancers) */}
                  {viewMode === 'freelancer' && (
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-[11px] text-slate-500">Update Status:</span>
                      <select
                        value={project.status}
                        onChange={(e) => updateProjectStatus(project.id, e.target.value as ProjectStatus)}
                        className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-300 bg-white focus:outline-hidden"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">In Review</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
