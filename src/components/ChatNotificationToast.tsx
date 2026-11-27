import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePortal } from '../context/PortalContext';
import { MessageSquare, X, ArrowRight } from 'lucide-react';

interface ChatNotificationToastProps {
  onOpenChatView: () => void;
}

export const ChatNotificationToast: React.FC<ChatNotificationToastProps> = ({ onOpenChatView }) => {
  const {
    incomingChatToast,
    dismissChatToast,
    setActiveConversationId,
    setActiveChatProjectId,
    markConversationRead,
  } = usePortal();

  useEffect(() => {
    if (!incomingChatToast) return;
    const timer = setTimeout(() => {
      dismissChatToast();
    }, 6500);
    return () => clearTimeout(timer);
  }, [incomingChatToast, dismissChatToast]);

  const handleOpenReply = () => {
    if (!incomingChatToast) return;
    setActiveConversationId(incomingChatToast.conversationId);
    setActiveChatProjectId(incomingChatToast.projectId);
    void markConversationRead(incomingChatToast.conversationId);
    dismissChatToast();
    onOpenChatView();
  };

  return (
    <AnimatePresence>
      {incomingChatToast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-[60] max-w-sm w-[calc(100vw-2rem)] bg-slate-950 text-white rounded-2xl shadow-2xl border border-slate-800 p-4 space-y-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {incomingChatToast.senderName}
                </div>
                <div className="text-[11px] text-indigo-300 truncate">
                  {incomingChatToast.projectName}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissChatToast}
              aria-label="Dismiss notification"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
            {incomingChatToast.message}
          </p>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleOpenReply}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Reply now</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
