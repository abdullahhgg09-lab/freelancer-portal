import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import {
  signInWithGoogleAccounts,
  signInWithAppleId,
} from '../services/firebaseAuth';
import { X, Briefcase, UserCheck, Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRole: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccessRole }) => {
  const { login, loginAdmin, claimAdminPassword, loginWithGoogle, loginWithApple } = usePortal();

  const [activeTab, setActiveTab] = useState<'freelancer' | 'client'>('freelancer');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsAdminClaim, setNeedsAdminClaim] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanInput = username.trim().toLowerCase();

    if (cleanInput === 'abdullahhgg09@gmail.com') {
      setIsSubmitting(true);
      try {
        if (needsAdminClaim) {
          const claimRes = await claimAdminPassword(cleanInput, password);
          if (claimRes.success) {
            setNeedsAdminClaim(false);
            onSuccessRole('admin');
            onClose();
          } else {
            setErrorMessage(claimRes.message || 'Unable to set admin password.');
          }
          return;
        }

        const adminRes = await loginAdmin(cleanInput, password);
        if (adminRes.success) {
          onSuccessRole('admin');
          onClose();
        } else if (adminRes.needsClaim) {
          setNeedsAdminClaim(true);
          setErrorMessage(
            'First-time Admin setup: Submit again with your chosen Admin password (min 8 chars) to activate Admin Panel.'
          );
        } else {
          setErrorMessage(adminRes.message || 'Invalid admin email or password.');
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const result = login(username, password, activeTab);
    if (result.success) {
      onSuccessRole(activeTab);
      onClose();
    } else {
      setErrorMessage(result.message || 'Login failed. Please check credentials or use Google/Apple.');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      const googleResult = await signInWithGoogleAccounts();
      const res = loginWithGoogle(
        googleResult.email,
        googleResult.displayName,
        activeTab,
        googleResult.photoURL,
        true
      );
      if (res.success && res.user) {
        onSuccessRole(res.user.role);
        onClose();
      } else {
        setErrorMessage('Google Sign In could not be completed.');
      }
    } catch (err: any) {
      const code = err?.code || '';
      const rawMessage = String(err?.message || '');
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setErrorMessage('Google account picker was closed before completing sign-in.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMessage('Browser popup was blocked. Please allow popups for this site to sign in with Google.');
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMessage(
          `Domain "${window.location.hostname}" needs to be added in Firebase Console -> Authentication -> Settings -> Authorized domains.`
        );
      } else if (
        code === 'auth/operation-not-allowed' ||
        code === 'auth/admin-restricted-operation' ||
        rawMessage.toLowerCase().includes('verification') ||
        rawMessage.toLowerCase().includes('testing')
      ) {
        setErrorMessage(
          'Google OAuth is still in Testing mode on project quaint-osprey-0v9wh. Open Google Cloud Console -> Google Auth Platform -> Audience and click "Publish App" (or add the account under Test users).'
        );
      } else {
        setErrorMessage(rawMessage || 'Google Sign In could not be completed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);
    setErrorMessage(null);
    try {
      const appleResult = await signInWithAppleId();
      const res = loginWithApple(
        appleResult.email,
        appleResult.displayName,
        activeTab,
        appleResult.photoURL
      );
      if (res.success && res.user) {
        onSuccessRole(res.user.role);
        onClose();
      } else {
        setErrorMessage('Apple ID Sign In could not be completed.');
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setErrorMessage('Apple ID sign-in window was closed.');
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMessage(
          `Domain "${window.location.hostname}" needs to be added in Firebase Console -> Authentication -> Settings -> Authorized domains.`
        );
      } else if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') {
        setErrorMessage('Enable the Apple provider inside Firebase Console -> Authentication -> Sign-in method first.');
      } else {
        setErrorMessage(err?.message || 'Apple ID Sign In could not be completed.');
      }
    } finally {
      setIsAppleLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4"
    >
      <div className="min-h-full flex items-center justify-center py-6 sm:py-8">
        <div className="relative bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
          {/* Sticky Header */}
          <div className="sticky top-0 z-30 px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs shrink-0" aria-hidden="true">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 id="auth-modal-title" className="font-bold text-sm">Portal Authentication</h3>
                <p className="text-[11px] text-slate-400">Sign in as Freelancer or Client</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Authentication Modal"
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto">
            {/* Tab Selection */}
            <div role="tablist" aria-label="Choose account role" className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-semibold">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'freelancer'}
                onClick={() => setActiveTab('freelancer')}
                className={`py-3 flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'freelancer'
                    ? 'bg-white text-indigo-700 border-b-2 border-indigo-600 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                <span>Freelancer</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'client'}
                onClick={() => setActiveTab('client')}
                className={`py-3 flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'client'
                    ? 'bg-white text-emerald-700 border-b-2 border-emerald-600 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span>Client</span>
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-3">
              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isAppleLoading}
                className="gsi-material-button w-full py-2.5 px-3 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" aria-hidden="true" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                )}
                <span>
                  {isGoogleLoading ? 'Opening Google Accounts...' : `Sign in with Google (${activeTab === 'freelancer' ? 'Freelancer' : 'Client'})`}
                </span>
              </button>

              {/* Apple Sign In Button */}
              <button
                type="button"
                onClick={handleAppleSignIn}
                disabled={isGoogleLoading || isAppleLoading}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {isAppleLoading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" aria-hidden="true" />
                ) : (
                  <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                )}
                <span>
                  {isAppleLoading ? 'Connecting to Apple ID...' : `Continue with Apple (${activeTab === 'freelancer' ? 'Freelancer' : 'Client'})`}
                </span>
              </button>

              <div className="relative flex items-center justify-center pt-1">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-2 text-[10px] uppercase tracking-wider text-slate-400 font-semibold absolute">
                  or credentials
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div>
                  <label htmlFor="auth-modal-username" className="block font-semibold text-slate-700 mb-1">
                    Username or Email
                  </label>
                  <input
                    id="auth-modal-username"
                    type="text"
                    required
                    placeholder="Enter username or email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="auth-modal-password" className="block font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    id="auth-modal-password"
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {errorMessage && (
                  <div role="alert" className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" aria-hidden="true" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer ${
                    activeTab === 'freelancer'
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  <span>
                    {isSubmitting
                      ? 'Verifying...'
                      : needsAdminClaim
                      ? 'Set Password & Open Admin Panel'
                      : `Sign In as ${activeTab === 'freelancer' ? 'Freelancer' : 'Client'}`}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </form>

              <div className="pt-2 border-t border-slate-100 text-center text-[11px] text-slate-400">
                Secure encrypted access for FreelancePort.pk
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
