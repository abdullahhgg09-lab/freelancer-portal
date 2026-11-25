import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePortal } from '../context/PortalContext';
import { sendServerLoginConfirmationEmail } from '../services/firebaseAuth';
import { Mail, CheckCircle2, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export const GmailConfirmationModal: React.FC = () => {
  const { pendingGmailConfirm, setPendingGmailConfirm } = usePortal();
  const [isSending, setIsSending] = useState(false);
  const [sentMessageId, setSentMessageId] = useState<string | null>(null);
  const [deliveredVia, setDeliveredVia] = useState<'smtp' | 'in_app' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const lastAutoSentKeyRef = useRef<string | null>(null);

  const dispatchConfirmation = useCallback(async (info: NonNullable<typeof pendingGmailConfirm>) => {
    setIsSending(true);
    setErrorMsg(null);
    try {
      const result = await sendServerLoginConfirmationEmail({
        toEmail: info.email,
        userName: info.name,
        role: info.role,
        portalUrl: window.location.origin,
        signedInAt: info.signedInAt,
      });
      setSentMessageId(result.messageId);
      setDeliveredVia(result.deliveredVia);
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Unable to send automatic confirmation letter right now.'
      );
    } finally {
      setIsSending(false);
    }
  }, []);

  useEffect(() => {
    if (!pendingGmailConfirm) {
      lastAutoSentKeyRef.current = null;
      setSentMessageId(null);
      setDeliveredVia(null);
      setErrorMsg(null);
      setIsSending(false);
      return;
    }

    const key = `${pendingGmailConfirm.email}|${pendingGmailConfirm.signedInAt}`;
    if (lastAutoSentKeyRef.current === key) return;
    lastAutoSentKeyRef.current = key;

    setSentMessageId(null);
    setDeliveredVia(null);
    setErrorMsg(null);
    void dispatchConfirmation(pendingGmailConfirm);
  }, [pendingGmailConfirm, dispatchConfirmation]);

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
                      Automatic Login Confirmation
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Sign-in verification &amp; receipt dispatch
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingGmailConfirm(null)}
                  aria-label="Close confirmation dialog"
                  className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-4 text-xs">
                {isSending && !sentMessageId ? (
                  <div className="text-center py-6 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                      <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-display font-bold text-base text-slate-900">
                        Sending Confirmation Letter...
                      </h4>
                      <p className="text-slate-600">
                        Aap ke email (<strong className="text-slate-900">{pendingGmailConfirm.email}</strong>) par automatic confirmation bheji ja rahi hai.
                      </p>
                    </div>
                  </div>
                ) : sentMessageId ? (
                  <div className="text-center py-3 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-display font-bold text-base text-slate-900">
                        {deliveredVia === 'smtp'
                          ? `Confirmation Sent to ${pendingGmailConfirm.email}!`
                          : `Login Confirmed for ${pendingGmailConfirm.email}!`}
                      </h4>
                      <p className="text-slate-600 leading-relaxed">
                        {deliveredVia === 'smtp' ? (
                          <>
                            Aap ke inbox (<strong className="text-slate-900">{pendingGmailConfirm.email}</strong>) par login confirmation letter automatically bhej diya gaya hai.
                          </>
                        ) : (
                          <>
                            Aap ka sign-in automatically verify aur confirm ho gaya hai. Live inbox email delivery ke liye server Settings &rarr; Secrets mein <code className="px-1 py-0.5 rounded bg-slate-100 font-mono text-[10px]">SMTP_USER</code> aur <code className="px-1 py-0.5 rounded bg-slate-100 font-mono text-[10px]">SMTP_PASS</code> configure karein.
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
                  <div className="space-y-4">
                    {errorMsg && (
                      <div
                        role="alert"
                        className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2"
                      >
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPendingGmailConfirm(null)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={() => dispatchConfirmation(pendingGmailConfirm)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" aria-hidden="true" />
                        <span>Retry Automatic Confirmation</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
