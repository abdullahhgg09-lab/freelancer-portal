import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePortal } from '../context/PortalContext';
import { Project } from '../types';
import { formatCurrency } from '../utils/calculations';
import {
  X,
  Calendar,
  Check,
  MessageSquare,
  FolderOpen,
  Briefcase,
  UserCheck,
} from 'lucide-react';

interface ProjectDetailsModalProps {
  project: Project | null;
  viewerRole: 'client' | 'freelancer';
  onClose: () => void;
  onMessagePartner: (project: Project) => void;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  project,
  viewerRole,
  onClose,
  onMessagePartner,
}) => {
  const { files, onlineUserIds, toggleTaskCompletion, messages } = usePortal();

  useEffect(() => {
    if (!project) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [project, onClose]);

  if (!project) return null;

  const projectFiles = files.filter((f) => f.projectId === project.id);
  const projectMessageCount = messages.filter((m) => m.projectId === project.id).length;
  const partnerId = viewerRole === 'client' ? project.freelancerId : project.clientId;
  const partnerName = viewerRole === 'client' ? project.freelancerName : project.clientName;
  const isPartnerOnline = onlineUserIds.includes(partnerId);

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-details-modal-title"
        className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs p-3 sm:p-4"
      >
        <div className="min-h-full flex items-center justify-center py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="relative bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 px-5 sm:px-6 py-4 bg-slate-950 text-white flex items-start justify-between gap-3 border-b border-slate-800 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="font-semibold text-indigo-300 uppercase tracking-wider">
                    {project.category}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="uppercase">{project.status.replace('_', ' ')}</span>
                </div>
                <h3
                  id="project-details-modal-title"
                  className="font-display font-bold text-lg text-white mt-0.5 truncate"
                >
                  {project.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close project details"
                className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
              {/* Partner + Direct Messaging CTA */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                    {viewerRole === 'client' ? (
                      <Briefcase className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <UserCheck className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        isPartnerOnline ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-500">
                      {viewerRole === 'client' ? 'Assigned Freelancer' : 'Assigned Client'}
                    </div>
                    <div className="font-bold text-slate-900 text-sm truncate">{partnerName}</div>
                    <div className={`text-[11px] font-medium ${isPartnerOnline ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {isPartnerOnline ? 'Online now' : 'Offline'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onMessagePartner(project);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 transition cursor-pointer shrink-0 tabular-nums"
                >
                  <MessageSquare className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {viewerRole === 'client' ? 'Message Freelancer' : 'Message Client'}
                    {projectMessageCount > 0 ? ` (${projectMessageCount})` : ''}
                  </span>
                </button>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="font-semibold text-slate-900">Project Scope</div>
                <p className="text-slate-600 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/80">
                  {project.description || 'No detailed project brief provided yet.'}
                </p>
              </div>

              {/* Budget, Timeline, Progress */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Budget</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block tabular-nums">
                    {formatCurrency(project.budget, project.currency)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Deadline</span>
                  <span className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1 tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                    {project.deadline}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Completion</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm mt-0.5 block tabular-nums">
                    {project.progress}%
                  </span>
                </div>
              </div>

              {/* Milestones Checklist */}
              <div className="space-y-2">
                <div className="font-semibold text-slate-900">Milestones &amp; Checkpoints</div>
                <div className="space-y-1.5">
                  {project.tasks.map((task) => {
                    const interactive = viewerRole === 'freelancer';
                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          if (interactive) toggleTaskCompletion(project.id, task.id);
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 ${
                          interactive ? 'cursor-pointer hover:bg-slate-50' : 'bg-slate-50/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              task.completed
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300'
                            }`}
                          >
                            {task.completed && <Check className="w-3 h-3" />}
                          </div>
                          <span className={task.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}>
                            {task.title}
                          </span>
                        </div>
                        {task.dueDate && (
                          <span className="text-[11px] font-mono text-slate-400 tabular-nums">{task.dueDate}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Deliverables Summary */}
              <div className="space-y-2">
                <div className="font-semibold text-slate-900">
                  Shared Deliverables ({projectFiles.length})
                </div>
                {projectFiles.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-500">
                    No deliverable files uploaded for this project yet.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {projectFiles.map((f) => (
                      <div
                        key={f.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FolderOpen className="w-4 h-4 text-indigo-600 shrink-0" aria-hidden="true" />
                          <span className="font-medium text-slate-800 truncate">{f.fileName}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">{f.fileSize}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
