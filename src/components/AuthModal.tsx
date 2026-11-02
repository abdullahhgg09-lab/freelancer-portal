import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import { X, Briefcase, UserCheck, Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { ADMIN_CREDENTIALS } from '../data/mockData';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRole: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccessRole }) => {
  const { login, loginWithGoogle } = usePortal();

  // Public roles: freelancer or client
  const [activeTab, setActiveTab] = useState<'freelancer' | 'client'>('freelancer');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // If entering owner admin credentials
    if (
      username.trim().toLowerCase() === ADMIN_CREDENTIALS.username.toLowerCase() &&
      password === ADMIN_CREDENTIALS.password
    ) {
      const result = login(username, password, 'admin');
      if (result.success) {
        onSuccessRole('admin');
        onClose();
        return;
      }
    }

    const result = login(username, password, activeTab);
    if (result.success) {
      if (username.trim().toLowerCase() === ADMIN_CREDENTIALS.username.toLowerCase()) {
        onSuccessRole('admin');
      } else {
        onSuccessRole(activeTab);
      }
      onClose();
    } else {
      setErrorMessage(result.message || 'Login failed. Please check credentials or use Google.');
    }
  };

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      const res = loginWithGoogle('abdullahhgg09@gmail.com', 'Abdullah', activeTab);
      setIsGoogleLoading(false);
      if (res.success && res.user) {
        onSuccessRole(res.user.role);
        onClose();
      } else {
        setErrorMessage('Google Sign In could not be completed.');
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4">
      <div className="min-h-full flex items-center justify-center py-6 sm:py-8">
        <div className="relative bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
          
          {/* Sticky Header */}
          <div className="sticky top-0 z-30 px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Portal Authentication</h3>
                <p className="text-[11px] text-slate-400">Sign in as Freelancer or Client</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto">

        {/* Tab Selection - Freelancer and Client Only */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('freelancer')}
            className={`py-3 flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'freelancer'
                ? 'bg-white text-indigo-700 border-b-2 border-indigo-600 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
            <span>Freelancer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('client')}
            className={`py-3 flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'client'
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-600 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Client</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          
          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition flex items-center justify-center gap-2.5 cursor-pointer"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {isGoogleLoading ? 'Connecting to Google...' : `Continue with Google (${activeTab === 'freelancer' ? 'Freelancer' : 'Client'})`}
            </span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-2 text-[10px] uppercase tracking-wider text-slate-400 font-semibold absolute">
              or credentials
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Username or Email
              </label>
              <input
                type="text"
                required
                placeholder="Enter username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'freelancer'
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              <span>Sign In as {activeTab === 'freelancer' ? 'Freelancer' : 'Client'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
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
