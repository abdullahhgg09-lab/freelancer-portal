import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePortal } from '../context/PortalContext';
import { Project, MessageTag } from '../types';
import { formatCurrency } from '../utils/calculations';
import {
  Send,
  X,
  MessageSquare,
  CheckCircle2,
  Clock,
  FileCode2,
  RefreshCw,
  Wifi,
  WifiOff,
  Calendar,
  Sparkles,
  UserCheck,
  Briefcase
} from 'lucide-react';

interface ProjectChatRoomProps {
  project: Project;
  onClose?: () => void;
  isDrawer?: boolean;
}

const MESSAGE_TAGS: Array<{ id: MessageTag; label: string; color: string }> = [
  { id: 'general', label: 'Discussion', color: 'text-slate-700 bg-slate-100' },
  { id: 'milestone', label: 'Milestone', color: 'text-indigo-700 bg-indigo-50' },
  { id: 'revision', label: 'Revision', color: 'text-amber-800 bg-amber-50' },
  { id: 'deliverable', label: 'Deliverable', color: 'text-emerald-800 bg-emerald-50' },
];

export const ProjectChatRoom: React.FC<ProjectChatRoomProps> = ({
  project,
  onClose,
  isDrawer = false,
}) => {
  const {
    currentUser,
    messages,
    sendMessage,
    wsStatus,
    roomPresence,
    roomTyping,
    joinProjectRoom,
    leaveProjectRoom,
    sendTypingState,
  } = usePortal();

  const [text, setText] = useState('');
  const [selectedTag, setSelectedTag] = useState<MessageTag>('general');
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUserId = currentUser?.id || 'guest';
  const isClientViewer = currentUser?.role === 'client';

  // Join project WebSocket room on mount / project change
  useEffect(() => {
    joinProjectRoom(project.id);
    return () => {
      sendTypingState(project.id, false);
      leaveProjectRoom(project.id);
    };
  }, [project.id, joinProjectRoom, leaveProjectRoom, sendTypingState]);

  const projectMessages = messages.filter((m) => m.projectId === project.id);
  const activeUsersInRoom = roomPresence[project.id] || [];
  const typingUsers = (roomTyping[project.id] || []).filter((u) => u.userId !== currentUserId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [projectMessages.length, typingUsers.length]);

  const handleInputChange = (val: string) => {
    setText(val);
    sendTypingState(project.id, val.trim().length > 0);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingState(project.id, false);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;

    const recipientId = isClientViewer ? project.freelancerId : project.clientId;
    const recipientName = isClientViewer ? project.freelancerName : project.clientName;

    sendMessage(project.id, clean, recipientId, recipientName, selectedTag, project.name);
    setText('');
    sendTypingState(project.id, false);
  };

  const quickPrompts = isClientViewer
    ? [
        { label: 'Progress check', text: 'Assalam-o-Alaikum, project ki latest progress aur milestone update share kar dein.', tag: 'milestone' as MessageTag },
        { label: 'Request revision', text: 'Is section me ek choti si revision chahiye — details share kar raha hoon.', tag: 'revision' as MessageTag },
        { label: 'Approve deliverable', text: 'Deliverable check kar liya hai, bilkul perfect hai! Next step par move karein.', tag: 'deliverable' as MessageTag },
      ]
    : [
        { label: 'Share update', text: 'Update: Current milestone complete ho gaya hai, review ke liye portal me check karein.', tag: 'milestone' as MessageTag },
        { label: 'Deliverable uploaded', text: 'Files aur preview deliverables upload kar di gayi hain. Apna feedback share karein.', tag: 'deliverable' as MessageTag },
        { label: 'Clarify requirement', text: 'Is feature ke design/flow par aap se ek quick confirmation chahiye.', tag: 'general' as MessageTag },
      ];

  const partnerName = isClientViewer ? project.freelancerName : project.clientName;
  const partnerRoleLabel = isClientViewer ? 'Project Maker (Freelancer)' : 'Project Client';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200/80 bg-slate-950 text-white flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <span className="font-medium text-indigo-300">Project Discussion Room</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              {wsStatus === 'connected' ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                  <span className="text-emerald-300">Live Sync</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" aria-hidden="true" />
                  <span className="text-amber-300">Local Sync</span>
                </>
              )}
            </span>
          </div>

          <h3 id="project-chat-title" className="font-display font-bold text-base text-white truncate">
            {project.name}
          </h3>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
            <span className="inline-flex items-center gap-1 text-slate-200 font-medium">
              {isClientViewer ? (
                <Briefcase className="w-3 h-3 text-indigo-400" aria-hidden="true" />
              ) : (
                <UserCheck className="w-3 h-3 text-emerald-400" aria-hidden="true" />
              )}
              {partnerRoleLabel}: {partnerName}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{project.progress}% complete</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums font-mono">{formatCurrency(project.budget, project.currency)}</span>
            {activeUsersInRoom.length > 1 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-300">{activeUsersInRoom.length} active in room</span>
              </>
            )}
          </div>
        </div>

        {isDrawer && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Project Chat"
            className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Project Milestones Summary Strip */}
      <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-4 text-[11px] text-slate-600 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          <span className="truncate">
            Deadline: <strong className="text-slate-900 tabular-nums">{project.deadline}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <span className="font-mono font-semibold text-slate-800 tabular-nums">{project.progress}%</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/40 min-h-[280px]"
        aria-live="polite"
      >
        {projectMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="space-y-1 max-w-xs">
              <h4 className="font-display font-bold text-sm text-slate-900">
                Start Your Project Conversation
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Client aur project creator yahan direct apni project requirements, revisions, files aur milestone updates discuss kar sakte hain.
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {projectMessages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              const tagMeta = MESSAGE_TAGS.find((t) => t.id === (msg.tag || 'general'));
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-md rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isMe
                        ? 'bg-slate-900 text-white rounded-br-xs'
                        : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5 text-[10px]">
                      <span className={`font-semibold ${isMe ? 'text-indigo-200' : 'text-slate-600'}`}>
                        {msg.senderName} · {msg.senderRole === 'client' ? 'Client' : 'Freelancer'}
                      </span>
                      {msg.tag && msg.tag !== 'general' && tagMeta && (
                        <span
                          className={`px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide text-[9px] ${
                            isMe ? 'bg-white/15 text-white' : tagMeta.color
                          }`}
                        >
                          {tagMeta.label}
                        </span>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 tabular-nums px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-[11px] text-slate-500 pl-1"
          >
            <span className="inline-flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:300ms]" />
            </span>
            <span>{typingUsers.map((u) => u.userName).join(', ')} is typing...</span>
          </motion.div>
        )}
      </div>

      {/* Composer Footer */}
      <div className="p-4 border-t border-slate-200/80 bg-white space-y-2.5 shrink-0">
        {/* Topic Selector & Quick Prompts */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]" role="group" aria-label="Message topic">
            {MESSAGE_TAGS.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setSelectedTag(tag.id)}
                className={`px-2 py-1 rounded-md font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedTag === tag.id
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setText(qp.text);
                  setSelectedTag(qp.tag);
                }}
                className="px-2 py-1 rounded-md border border-slate-200 hover:border-indigo-300 bg-slate-50 hover:bg-indigo-50/50 text-[10px] font-medium text-slate-600 hover:text-indigo-700 transition cursor-pointer whitespace-nowrap shrink-0"
              >
                + {qp.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <label htmlFor={`chat-input-${project.id}`} className="sr-only">
            Write a message about {project.name}
          </label>
          <input
            id={`chat-input-${project.id}`}
            type="text"
            placeholder={`Message ${partnerName} about "${project.name}"...`}
            value={text}
            onChange={(e) => handleInputChange(e.target.value)}
            className="flex-1 px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={!text.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 disabled:pointer-events-none text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Send</span>
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export const ProjectChatDrawer: React.FC = () => {
  const { activeChatProjectId, setActiveChatProjectId, projects } = usePortal();

  const activeProject = activeChatProjectId
    ? projects.find((p) => p.id === activeChatProjectId) || null
    : null;

  useEffect(() => {
    if (!activeProject) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveChatProjectId(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeProject, setActiveChatProjectId]);

  return (
    <AnimatePresence>
      {activeProject && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-chat-title"
          className="fixed inset-0 z-50 flex justify-end"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setActiveChatProjectId(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-xl h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col"
          >
            <ProjectChatRoom
              project={activeProject}
              isDrawer={true}
              onClose={() => setActiveChatProjectId(null)}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
