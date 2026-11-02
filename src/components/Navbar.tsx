import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import {
  ShieldCheck,
  Briefcase,
  UserCheck,
  Database,
  LogOut,
  Layers,
  Sparkles,
  Play,
  User,
  Menu,
  X,
  Rocket,
  CreditCard
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  onOpenAuth: () => void;
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, currentView, setCurrentView }) => {
  const {
    currentUser,
    logout,
    currency,
    setCurrency,
    setIsSupabaseGuideOpen,
    setIsGuideVideoOpen,
    setIsDeploymentModalOpen,
    setIsDebitModalOpen,
    supabaseConfig,
    payoutSettings
  } = usePortal();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Super Admin',
          bg: 'bg-rose-500/10 text-rose-600 border-rose-200',
          icon: ShieldCheck,
        };
      case 'freelancer':
        return {
          label: 'Freelancer',
          bg: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
          icon: Briefcase,
        };
      case 'client':
        return {
          label: 'Client Portal',
          bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
          icon: UserCheck,
        };
    }
  };

  const badge = currentUser ? getRoleBadge(currentUser.role) : null;
  const BadgeIcon = badge?.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                  FreelancePort<span className="text-indigo-600">.pk</span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm">
                    SaaS
                  </span>
                </span>
                <p className="text-[11px] text-slate-500 hidden sm:block">Freelancer &amp; Client Management Portal</p>
              </div>
            </button>
          </div>

          {/* Quick Actions & Navigation Desktop */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Guide Video Trigger */}
            <button
              onClick={() => setIsGuideVideoOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold shadow-xs transition"
              title="Watch How the Website Works (Guide Video)"
            >
              <Play className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
              <span>Guide Video</span>
            </button>

            {/* Live App Hub Trigger */}
            <button
              onClick={() => setIsDeploymentModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold shadow-xs transition"
              title="Cloud Run Live Public Link & Sandbox Exit"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <Rocket className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live App</span>
            </button>

            {/* Supabase Integration Button */}
            <button
              onClick={() => setIsSupabaseGuideOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                supabaseConfig.isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
              title="Supabase Database Configuration & SQL Script"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{supabaseConfig.isConnected ? 'Supabase Connected' : 'Connect Supabase DB'}</span>
              <span className="px-1.5 py-0.2 bg-white/80 rounded-sm text-[10px] font-mono">SQL</span>
            </button>

            {/* Currency Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                onClick={() => setCurrency('PKR')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  currency === 'PKR' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                PKR (Rs.)
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  currency === 'USD' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                USD ($)
              </button>
            </div>

            {/* Current User Session or Login */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <button
                  onClick={() => setCurrentView('profile')}
                  title="View & Edit Profile / Picture"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition text-left group"
                >
                  <img
                    src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-xs group-hover:ring-2 group-hover:ring-indigo-500 transition"
                  />
                  <div className="hidden lg:block">
                    <div className="text-xs font-semibold text-slate-900 leading-tight">
                      {currentUser.name}
                    </div>
                    {badge && BadgeIcon && (
                      <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                        <BadgeIcon className="w-2.5 h-2.5" />
                        <span>{badge.label}</span>
                      </div>
                    )}
                  </div>
                </button>

                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm hover:shadow transition"
                >
                  Sign In / Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsGuideVideoOpen(true)}
              className="p-1.5 text-indigo-700 bg-indigo-50 rounded-lg"
              title="Guide Video"
            >
              <Play className="w-4 h-4 fill-indigo-600" />
            </button>

            <button
              onClick={() => setIsSupabaseGuideOpen(true)}
              className="p-1.5 text-slate-600 bg-slate-100 rounded-lg"
              title="Supabase"
            >
              <Database className="w-4 h-4" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="text-xs font-medium text-slate-500">Currency:</div>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrency('PKR')}
                className={`px-2 py-0.5 rounded text-xs ${currency === 'PKR' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100'}`}
              >
                PKR
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2 py-0.5 rounded text-xs ${currency === 'USD' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100'}`}
              >
                USD
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                setIsGuideVideoOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 px-3 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-indigo-600" />
              Watch Guide Video (How it Works)
            </button>

            {currentUser && (
              <button
                onClick={() => {
                  setCurrentView('profile');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4 text-slate-600" />
                My Profile &amp; Photo
              </button>
            )}

            <button
              onClick={() => {
                setIsSupabaseGuideOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-center gap-2"
            >
              <Database className="w-4 h-4 text-emerald-700" />
              Supabase Database SQL
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
