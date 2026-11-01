import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import { X, ShieldCheck, Briefcase, UserCheck, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { ADMIN_CREDENTIALS } from '../data/mockData';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRole: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccessRole }) => {
  const { login } = usePortal();

  const [activeTab, setActiveTab] = useState<'admin' | 'freelancer' | 'client'>('admin');
  const [username, setUsername] = useState(ADMIN_CREDENTIALS.username);
  const [password, setPassword] = useState(ADMIN_CREDENTIALS.password);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = login(username, password, activeTab);
    if (result.success) {
      onSuccessRole(activeTab);
      onClose();
    } else {
      setErrorMessage(result.message || 'Login failed. Please check credentials.');
    }
  };

  const handlePreFillAdmin = () => {
    setActiveTab('admin');
    setUsername(ADMIN_CREDENTIALS.username);
    setPassword(ADMIN_CREDENTIALS.password);
    setErrorMessage(null);
  };

  const handlePreFillFreelancer = () => {
    setActiveTab('freelancer');
    setUsername('hamza_dev');
    setPassword('freelancer123');
    setErrorMessage(null);
  };

  const handlePreFillClient = () => {
    setActiveTab('client');
    setUsername('sarah_technova');
    setPassword('client123');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Portal Authentication</h3>
              <p className="text-[11px] text-slate-400">Secure role-based sign-in</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={handlePreFillAdmin}
            className={`py-3 flex items-center justify-center gap-1.5 transition ${
              activeTab === 'admin'
                ? 'bg-white text-rose-700 border-b-2 border-rose-600 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
            <span>Super Admin</span>
          </button>

          <button
            onClick={handlePreFillFreelancer}
            className={`py-3 flex items-center justify-center gap-1.5 transition ${
              activeTab === 'freelancer'
                ? 'bg-white text-indigo-700 border-b-2 border-indigo-600 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
            <span>Freelancer</span>
          </button>

          <button
            onClick={handlePreFillClient}
            className={`py-3 flex items-center justify-center gap-1.5 transition ${
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
          
          {activeTab === 'admin' && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
              <div className="font-bold flex items-center gap-1 text-rose-950">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                Requested Admin Credentials:
              </div>
              <div>Username: <strong className="font-mono text-rose-950">abdary</strong></div>
              <div>Password: <strong className="font-mono text-rose-950">abdary123!@#</strong></div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Username or Email
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
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
              className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition ${
                activeTab === 'admin'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : activeTab === 'freelancer'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              Sign In to {activeTab === 'admin' ? 'Super Admin (abdary)' : activeTab === 'freelancer' ? 'Freelancer Workspace' : 'Client Portal'}
            </button>
          </form>

          {/* Quick Demo Pre-fill helper */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Quick fill:</span>
            <div className="flex gap-2">
              <button onClick={handlePreFillAdmin} className="text-rose-600 hover:underline font-semibold">
                abdary
              </button>
              •
              <button onClick={handlePreFillFreelancer} className="text-indigo-600 hover:underline font-semibold">
                hamza
              </button>
              •
              <button onClick={handlePreFillClient} className="text-emerald-600 hover:underline font-semibold">
                sarah
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
