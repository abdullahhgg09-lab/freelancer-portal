import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePortal } from '../context/PortalContext';
import { sendServerLoginConfirmationEmail } from '../services/firebaseAuth';
import { Mail, CheckCircle2, X, Loader2, AlertCircle, Send } from 'lucide-react';

export const GmailConfirmationModal: React.FC = () => {
  const { pendingGmailConfirm, setPendingGmailConfirm } = usePortal();
  const [isSending, setIsSending] = useState(false);
  const [sentMessageId, setSentMessageId] = useState<string | null>(null);
  const [deliveredVia, setDeliveredVia] = useState<'smtp' | 'in_app' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setSentMessageId(null);
    setDeliveredVia(null);
    setErrorMsg(null);
    setIsSending(false);
  }, [pendingGmailConfirm?.email, pendingGmailConfirm?.signedInAt]);

  useEffect(() => {
    if (!pendingGmailConfirm) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPendingGmailConfirm(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [pendingGmailConfirm, setPendingGmailConfirm]);

  const handleConfirmSend = async () => {
    if (!pendingGmailConfirm) return;
    setIsSending(true);
    setErrorMsg(null);
    try {
      const result = await sendServerLoginConfirmationEmail({
        toEmail: pendingGmailConfirm.email,
        userName: pendingGmailConfirm.name,
        role: pendingGmailConfirm.role,
        portalUrl: window.location.origin,
        signedInAt: pendingGmailConfirm.signedInAt,
      });
      setSentMessageId(result.messageId);
      setDeliveredVia(result.deliveredVia);
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Unable to process login confirmation right now. Please try again.'
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {pendingGmailConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gmail-confirm-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs p-3 sm:p-4"
        >
          <div className="min-h-full flex items-center justify-center py-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              className="relative bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 id="gmail-confirm-title" className="font-display font-bold text-sm text-white">
                      Gmail Login Confirmation
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Confirm sending receipt for your sign-in
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingGmailConfirm(null)}
                  aria-label="Close Gmail confirmation dialog"
                  className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-4 text-xs">
                {sentMessageId ? (
                  <div className="text-center py-3 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-display font-bold text-base text-slate-900">
                        {deliveredVia === 'smtp'
                          ? `Confirmation Email Sent to ${pendingGmailConfirm.email}!`
                          : `Sign-In Confirmed for ${pendingGmailConfirm.email}!`}
                      </h4>
                      <p className="text-slate-600 leading-relaxed">
                        {deliveredVia === 'smtp' ? (
                          <>
                            Aap ke Gmail inbox (<strong className="text-slate-900">{pendingGmailConfirm.email}</strong>) par login confirmation email bhej diya gaya hai.
                          </>
                        ) : (
                          <>
                            Aap ka workspace sign-in confirmation receipt generate aur verify ho gaya hai. Live inbox email delivery ke liye Settings &rarr; Secrets mein <code className="px-1 py-0.5 rounded bg-slate-100 font-mono text-[10px]">SMTP_USER</code> aur <code className="px-1 py-0.5 rounded bg-slate-100 font-mono text-[10px]">SMTP_PASS</code> add karein.
                          </>
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-600">
                      Confirmation Reference: {sentMessageId}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingGmailConfirm(null)}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-semibold transition cursor-pointer"
                    >
                      Continue to Workspace
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-slate-700 space-y-1.5 leading-relaxed">
                      <p>
                        Aap <strong>{pendingGmailConfirm.name}</strong> ({pendingGmailConfirm.role === 'freelancer' ? 'Freelancer' : 'Client'}) ke taur par sign in ho chuke hain.
                      </p>
                      <p>
                        Kya aap apni Gmail par login confirmation message bhejna chahte hain?
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px]">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Recipient Gmail:</span>
                        <span className="font-mono font-semibold text-slate-900 truncate">
                          {pendingGmailConfirm.email}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Subject:</span>
                        <span className="font-semibold text-slate-800 truncate">
                          Sign-In Confirmed — FreelancePort.pk
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Portal Role:</span>
                        <span className="font-semibold text-indigo-700 capitalize">
                          {pendingGmailConfirm.role}
                        </span>
                      </div>
                    </div>

                    {errorMsg && (
                      <div
                        role="alert"
                        className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2"
                      >
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setPendingGmailConfirm(null)}
                        disabled={isSending}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer"
                      >
                        Skip
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmSend}
                        disabled={isSending}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                            <span>Sending Confirmation...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" aria-hidden="true" />
                            <span>Confirm &amp; Send</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
