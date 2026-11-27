import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePortal } from '../context/PortalContext';
import { Conversation, MessageTag, Project } from '../types';
import {
  Send,
  Search,
  MessageSquare,
  Check,
  CheckCheck,
  Wifi,
  WifiOff,
  ChevronLeft,
  AlertCircle,
  X,
  Briefcase,
  UserCheck,
  ExternalLink,
} from 'lucide-react';

interface ChatWorkspaceProps {
  role: 'client' | 'freelancer';
  initialProjectId?: string | null;
  onOpenProjectDetails?: (project: Project) => void;
}

const MESSAGE_TAGS: Array<{ id: MessageTag; label: string; badgeClass: string }> = [
  { id: 'general', label: 'Discussion', badgeClass: 'text-slate-700 bg-slate-100' },
  { id: 'milestone', label: 'Milestone', badgeClass: 'text-indigo-700 bg-indigo-50' },
  { id: 'revision', label: 'Revision', badgeClass: 'text-amber-800 bg-amber-50' },
  { id: 'deliverable', label: 'Deliverable', badgeClass: 'text-emerald-800 bg-emerald-50' },
];

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  role,
  initialProjectId,
  onOpenProjectDetails,
}) => {
  const {
    currentUser,
    users,
    projects,
    messages,
    conversations,
    activeConversationId,
    setActiveConversationId,
    onlineUserIds,
    typingByConversation,
    wsStatus,
    chatError,
    clearChatError,
    ensureProjectConversation,
    markConversationRead,
    sendChatMessage,
    emitTyping,
    emitStopTyping,
  } = usePortal();

  const [searchQuery, setSearchQuery] = useState('');
  const [text, setText] = useState('');
  const [selectedTag, setSelectedTag] = useState<MessageTag>('general');
  const [isSending, setIsSending] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUserId = currentUser?.id || '';

  // Projects this user participates in
  const myProjects = useMemo(
    () =>
      projects.filter((p) =>
        role === 'client' ? p.clientId === currentUserId : p.freelancerId === currentUserId
      ),
    [projects, role, currentUserId]
  );

  // Merge server conversations with any locally created projects that need a conversation record
  const authorizedConversations = useMemo(() => {
    const byId = new Map<string, Conversation>();
    for (const c of conversations) {
      if (c.clientId === currentUserId || c.freelancerId === currentUserId) {
        byId.set(c.conversationId, c);
      }
    }
    return Array.from(byId.values()).sort(
      (a, b) =>
        new Date(b.lastMessageAt || b.updatedAt).getTime() -
        new Date(a.lastMessageAt || a.updatedAt).getTime()
    );
  }, [conversations, currentUserId]);

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return authorizedConversations;
    return authorizedConversations.filter((c) => {
      const partner = role === 'client' ? c.freelancerName : c.clientName;
      return (
        (partner || '').toLowerCase().includes(q) ||
        (c.projectName || '').toLowerCase().includes(q) ||
        (c.lastMessage || '').toLowerCase().includes(q)
      );
    });
  }, [authorizedConversations, searchQuery, role]);

  // Select initial conversation from prop or first available
  useEffect(() => {
    if (initialProjectId) {
      const proj = myProjects.find((p) => p.id === initialProjectId);
      const matchingConv = authorizedConversations.find((c) => c.projectId === initialProjectId);
      if (matchingConv) {
        setActiveConversationId(matchingConv.conversationId);
        setMobileShowThread(true);
        void markConversationRead(matchingConv.conversationId);
        return;
      } else if (proj) {
        void ensureProjectConversation(proj).then((conv) => {
          if (conv) {
            setActiveConversationId(conv.conversationId);
            setMobileShowThread(true);
            void markConversationRead(conv.conversationId);
          }
        });
        return;
      }
    }

    if (
      authorizedConversations.length > 0 &&
      (!activeConversationId || !authorizedConversations.some((c) => c.conversationId === activeConversationId))
    ) {
      setActiveConversationId(authorizedConversations[0].conversationId);
    }
  }, [
    initialProjectId,
    myProjects,
    authorizedConversations,
    activeConversationId,
    setActiveConversationId,
    ensureProjectConversation,
    markConversationRead,
  ]);

  const activeConversation = useMemo(
    () =>
      authorizedConversations.find((c) => c.conversationId === activeConversationId) ||
      authorizedConversations[0] ||
      null,
    [authorizedConversations, activeConversationId]
  );

  const activeProject = useMemo(
    () => (activeConversation ? projects.find((p) => p.id === activeConversation.projectId) || null : null),
    [activeConversation, projects]
  );

  // Mark incoming unread messages read when viewing active conversation
  useEffect(() => {
    if (!activeConversation) return;
    const hasUnread = messages.some(
      (m) =>
        m.conversationId === activeConversation.conversationId &&
        m.senderId !== currentUserId &&
        !m.isRead
    );
    if (hasUnread || (activeConversation.unreadCount || 0) > 0) {
      void markConversationRead(activeConversation.conversationId);
    }
  }, [activeConversation, messages, currentUserId, markConversationRead]);

  const conversationMessages = useMemo(() => {
    if (!activeConversation) return [];
    return messages
      .filter((m) => m.conversationId === activeConversation.conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, activeConversation]);

  const typingPartners = activeConversation
    ? (typingByConversation[activeConversation.conversationId] || []).filter(
        (u) => u.userId !== currentUserId
      )
    : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationMessages.length, typingPartners.length]);

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversationId(conv.conversationId);
    setMobileShowThread(true);
    clearChatError();
    void markConversationRead(conv.conversationId);
  };

  const handleInputChange = (val: string) => {
    setText(val);
    if (!activeConversation) return;
    if (val.trim().length > 0) {
      emitTyping(activeConversation.conversationId);
    } else {
      emitStopTyping(activeConversation.conversationId);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (activeConversation) emitStopTyping(activeConversation.conversationId);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || isSending) return;
    const clean = text.trim();
    if (!clean) return;

    setIsSending(true);
    clearChatError();
    emitStopTyping(activeConversation.conversationId);
    const result = await sendChatMessage(activeConversation.conversationId, clean, selectedTag);
    setIsSending(false);
    if (result.ok) {
      setText('');
    }
  };

  const getPartnerDetails = (conv: Conversation) => {
    const isClient = currentUserId === conv.clientId;
    const partnerId = isClient ? conv.freelancerId : conv.clientId;
    const partnerName = isClient
      ? conv.freelancerName || 'Assigned Freelancer'
      : conv.clientName || 'Project Client';
    const userRecord = users.find((u) => u.id === partnerId);
    const partnerAvatar = isClient
      ? conv.freelancerAvatar || userRecord?.avatarUrl
      : conv.clientAvatar || userRecord?.avatarUrl;
    const isOnline = onlineUserIds.includes(partnerId);
    return { partnerId, partnerName, partnerAvatar, isOnline, partnerRole: isClient ? 'Freelancer' : 'Client' };
  };

  const activePartner = activeConversation ? getPartnerDetails(activeConversation) : null;

  const quickPrompts =
    role === 'client'
      ? [
          {
            label: 'Progress update',
            text: 'Hi! Could you please share the latest progress update on this project?',
            tag: 'milestone' as MessageTag,
          },
          {
            label: 'Request revision',
            text: 'I reviewed the preview and would like a small revision on the layout.',
            tag: 'revision' as MessageTag,
          },
          {
            label: 'Approve milestone',
            text: 'Looks great! Approved this deliverable — please proceed to the next step.',
            tag: 'deliverable' as MessageTag,
          },
        ]
      : [
          {
            label: 'Milestone complete',
            text: 'Update: Current milestone is complete and ready for your review.',
            tag: 'milestone' as MessageTag,
          },
          {
            label: 'Files uploaded',
            text: 'I have uploaded the latest deliverables to your project portal. Let me know your feedback.',
            tag: 'deliverable' as MessageTag,
          },
          {
            label: 'Quick question',
            text: 'Could you confirm your preference on the next deliverable scope?',
            tag: 'general' as MessageTag,
          },
        ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[620px] max-h-[78vh]">
      {/* Left Sidebar: Conversations List */}
      <div
        className={`md:col-span-4 lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/50 h-full overflow-hidden ${
          mobileShowThread ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-slate-200/80 bg-white space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display font-bold text-slate-950 text-sm">Messages</h3>
              <p className="text-[11px] text-slate-500">
                Private 1-to-1 project conversations
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg tabular-nums ${
                wsStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {wsStatus === 'connected' ? (
                <>
                  <Wifi className="w-3 h-3" aria-hidden="true" />
                  <span>Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" aria-hidden="true" />
                  <span>{wsStatus === 'connecting' ? 'Connecting' : 'Offline'}</span>
                </>
              )}
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people or projects..."
              aria-label="Search conversations"
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {filteredConversations.length === 0 ? (
            <div className="p-5 text-center space-y-2 text-xs text-slate-500">
              <MessageSquare className="w-7 h-7 text-slate-300 mx-auto" aria-hidden="true" />
              <div className="font-semibold text-slate-700">
                {authorizedConversations.length === 0 ? 'No Conversations Yet' : 'No Matching Chats'}
              </div>
              <p className="text-[11px] leading-relaxed">
                {role === 'client'
                  ? 'Open any assigned project and click "Message Freelancer" to start a private conversation.'
                  : 'Select a project and click "Message Client" to start collaborating in real time.'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const partner = getPartnerDetails(conv);
              const isSelected = activeConversation?.conversationId === conv.conversationId;
              const unread = conv.unreadCount || 0;
              const lastTime = conv.lastMessageAt || conv.updatedAt;
              const isTyping = (typingByConversation[conv.conversationId] || []).some(
                (u) => u.userId !== currentUserId
              );

              return (
                <button
                  key={conv.conversationId}
                  type="button"
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full p-3 rounded-xl text-left transition flex items-start gap-3 cursor-pointer min-h-[64px] ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : unread > 0
                      ? 'bg-indigo-50/80 hover:bg-indigo-100/70 text-slate-900 border border-indigo-200/80'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/80'
                  }`}
                >
                  {/* Partner Avatar + Online Status Dot */}
                  <div className="relative shrink-0">
                    {partner.partnerAvatar ? (
                      <img
                        src={partner.partnerAvatar}
                        alt={partner.partnerName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center ${
                          isSelected ? 'bg-white/15 text-white' : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {partner.partnerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span
                      title={partner.isOnline ? 'Online' : 'Offline'}
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
                        isSelected ? 'border-slate-900' : 'border-white'
                      } ${partner.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    />
                  </div>

                  {/* Conversation Preview */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs truncate">{partner.partnerName}</span>
                      <span
                        className={`text-[10px] font-mono tabular-nums shrink-0 ${
                          isSelected ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {lastTime
                          ? new Date(lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                    </div>

                    <div
                      className={`text-[11px] font-medium truncate ${
                        isSelected ? 'text-indigo-300' : 'text-indigo-600'
                      }`}
                    >
                      {conv.projectName || 'Project Discussion'}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] truncate ${
                          isTyping
                            ? isSelected
                              ? 'text-emerald-300 font-medium'
                              : 'text-emerald-600 font-medium'
                            : isSelected
                            ? 'text-slate-300'
                            : unread > 0
                            ? 'text-slate-900 font-semibold'
                            : 'text-slate-500'
                        }`}
                      >
                        {isTyping ? 'Typing...' : conv.lastMessage || 'No messages yet — say salam!'}
                      </span>

                      {unread > 0 && !isSelected && (
                        <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold tabular-nums shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane: Active Message Thread */}
      <div
        className={`md:col-span-8 lg:col-span-8 flex flex-col h-full overflow-hidden bg-white ${
          mobileShowThread ? 'flex' : 'hidden md:flex'
        }`}
      >
        {activeConversation && activePartner ? (
          <>
            {/* Thread Header */}
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200/80 bg-slate-950 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileShowThread(false)}
                  aria-label="Back to conversations"
                  className="md:hidden p-2 -ml-1 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="relative shrink-0">
                  {activePartner.partnerAvatar ? (
                    <img
                      src={activePartner.partnerAvatar}
                      alt={activePartner.partnerName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                      {activePartner.partnerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                      activePartner.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-bold text-sm text-white truncate">
                      {activePartner.partnerName}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium inline-flex items-center gap-1 shrink-0">
                      {role === 'client' ? (
                        <Briefcase className="w-3 h-3 text-indigo-400" aria-hidden="true" />
                      ) : (
                        <UserCheck className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                      )}
                      {activePartner.partnerRole}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-300 truncate">
                    <span className={activePartner.isOnline ? 'text-emerald-300 font-medium' : 'text-slate-400'}>
                      {activePartner.isOnline ? 'Online now' : 'Offline'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate text-slate-300">
                      {activeConversation.projectName || 'Project Chat'}
                    </span>
                  </div>
                </div>
              </div>

              {activeProject && onOpenProjectDetails && (
                <button
                  type="button"
                  onClick={() => onOpenProjectDetails(activeProject)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <span>Project Details</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Error Banner (rate limit / unauthorized) */}
            <AnimatePresence>
              {chatError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2 shrink-0"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
                    <span className="font-medium">{chatError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearChatError}
                    aria-label="Dismiss error"
                    className="p-1 rounded hover:bg-rose-100 text-rose-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Feed */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/50"
              aria-live="polite"
            >
              {conversationMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4 space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h4 className="font-display font-bold text-sm text-slate-900">
                    Private Project Channel Ready
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    All messages with {activePartner.partnerName} are authenticated, private, and saved automatically for your project record.
                  </p>
                </div>
              ) : (
                conversationMessages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;
                  const tagMeta = MESSAGE_TAGS.find((t) => t.id === (msg.tag || msg.messageType));
                  const bodyText = msg.message || msg.content;
                  const timestamp = msg.createdAt || msg.timestamp;

                  return (
                    <motion.div
                      key={msg.messageId || msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.14 }}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                          isMe
                            ? 'bg-slate-900 text-white rounded-br-xs'
                            : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1 text-[10px]">
                          <span className={`font-semibold ${isMe ? 'text-indigo-200' : 'text-slate-600'}`}>
                            {msg.senderName}
                          </span>
                          {tagMeta && tagMeta.id !== 'general' && (
                            <span
                              className={`px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide text-[9px] ${
                                isMe ? 'bg-white/15 text-white' : tagMeta.badgeClass
                              }`}
                            >
                              {tagMeta.label}
                            </span>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap break-words">{bodyText}</p>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-400 tabular-nums">
                        <span>
                          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          <span className="inline-flex items-center" title={msg.isRead ? 'Read' : 'Delivered'}>
                            {msg.isRead ? (
                              <CheckCheck className="w-3.5 h-3.5 text-indigo-600" aria-label="Read" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-slate-400" aria-label="Sent" />
                            )}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}

              {typingPartners.length > 0 && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500 pl-1 pt-1">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:300ms]" />
                  </span>
                  <span>{typingPartners.map((u) => u.userName).join(', ')} is typing...</span>
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200/80 bg-white space-y-2.5 shrink-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]" role="group" aria-label="Message topic">
                  {MESSAGE_TAGS.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => setSelectedTag(tag.id)}
                      className={`px-2 py-1 rounded-md font-medium transition cursor-pointer whitespace-nowrap ${
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
                      className="px-2 py-1 rounded-md border border-slate-200 hover:border-indigo-300 bg-slate-50 hover:bg-indigo-50/50 text-[10px] font-medium text-slate-600 hover:text-indigo-700 transition cursor-pointer whitespace-nowrap"
                    >
                      + {qp.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <label htmlFor="workspace-chat-input" className="sr-only">
                  Write a message to {activePartner.partnerName}
                </label>
                <input
                  id="workspace-chat-input"
                  type="text"
                  placeholder={`Message ${activePartner.partnerName}...`}
                  value={text}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition min-h-[42px]"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || isSending}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 disabled:pointer-events-none text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 min-h-[42px]"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isSending ? 'Sending' : 'Send'}</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2.5 text-slate-500 text-xs">
            <MessageSquare className="w-9 h-9 text-slate-300" aria-hidden="true" />
            <div className="font-display font-bold text-slate-800 text-base">
              Select a Conversation
            </div>
            <p className="max-w-xs leading-relaxed">
              Choose an authorized project thread from the sidebar or click{' '}
              {role === 'client' ? '"Message Freelancer"' : '"Message Client"'} on any project card.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
