import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePortal } from '../context/PortalContext';
import { avatarFreelancerProImg } from '../assets/images';
import {
  ShieldCheck,
  Briefcase,
  UserCheck,
  Database,
  LogOut,
  Layers,
  Play,
  User,
  Menu,
  X,
  Rocket,
  LogIn,
  FlaskConical
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
    switchRole,
    currency,
    setCurrency,
    setIsSupabaseGuideOpen,
    setIsGuideVideoOpen,
    setIsDeploymentModalOpen,
    supabaseConfig,
    isProductionMode,
    isAdminAuthenticated,
  } = usePortal();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRoleMeta = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Owner · ABBDULLAH', icon: ShieldCheck };
      case 'freelancer':
        return { label: 'Freelancer', icon: Briefcase };
      case 'client':
        return { label: 'Client', icon: UserCheck };
    }
  };

  const roleMeta = currentUser ? getRoleMeta(currentUser.role) : null;
  const RoleIcon = roleMeta?.icon;

  const navItems: Array<{ id: string; label: string; role?: UserRole }> = [
    { id: 'home', label: 'Overview' },
    { id: 'freelancer', label: 'Freelancer', role: 'freelancer' },
    { id: 'client', label: 'Client Portal', role: 'client' },
    ...(isAdminAuthenticated ? [{ id: 'admin', label: 'Admin Panel', role: 'admin' as UserRole }] : []),
  ];

  const handleNavClick = (item: { id: string; role?: UserRole }) => {
    if (item.role === 'freelancer' || item.role === 'client') {
      switchRole(item.role);
    } else if (item.role === 'admin' && !isAdminAuthenticated) {
      setCurrentView('home');
      setMobileMenuOpen(false);
      return;
    }
    setCurrentView(item.id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4 lg:gap-8">
          {/* Zone 1: Brand */}
          <button
            type="button"
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2.5 text-left group shrink-0 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-600 transition-colors">
              <Layers className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="font-display font-bold text-[17px] text-slate-900 tracking-tight whitespace-nowrap shrink-0">
              FreelancePort<span className="text-indigo-600">.pk</span>
            </span>
          </button>

          {/* Zone 2: Center Primary Navigation */}
          <nav aria-label="Workspace navigation" className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`relative px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer rounded-lg ${
                    isActive
                      ? 'text-slate-900'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-bar"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute left-2.5 right-2.5 -bottom-[11px] h-0.5 bg-indigo-600 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Right Utilities & Profile */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {currentView !== 'home' && (
              <>
                {/* Currency Switcher */}
                <div
                  role="group"
                  aria-label="Select billing currency"
                  className="flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/80 text-[11px] font-medium tabular-nums"
                >
                  <button
                    type="button"
                    onClick={() => setCurrency('PKR')}
                    aria-pressed={currency === 'PKR'}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                      currency === 'PKR'
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    PKR
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    aria-pressed={currency === 'USD'}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                      currency === 'USD'
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    USD
                  </button>
                </div>

                {/* Compact Workspace Utilities */}
                <button
                  type="button"
                  onClick={() => setIsGuideVideoOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0"
                  title="Watch Interactive Guide"
                  aria-label="Watch interactive guide video"
                >
                  <Play className="w-3 h-3 fill-indigo-600 text-indigo-600" aria-hidden="true" />
                  <span>Guide</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDeploymentModalOpen(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                    isProductionMode
                      ? 'border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800'
                      : 'border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900'
                  }`}
                  title={isProductionMode ? 'Production Live Environment' : 'Sandbox Testing Environment Active'}
                  aria-label="Open sandbox and live environment controls"
                >
                  {isProductionMode ? (
                    <>
                      <Rocket className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                      <span>Live</span>
                    </>
                  ) : (
                    <>
                      <FlaskConical className="w-3 h-3 text-amber-700" aria-hidden="true" />
                      <span>Sandbox</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsSupabaseGuideOpen(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer whitespace-nowrap shrink-0 ${
                    supabaseConfig.isConnected
                      ? 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Database Configuration & SQL"
                  aria-label="Connect or view Supabase PostgreSQL database configuration"
                >
                  <Database className="w-3 h-3" aria-hidden="true" />
                  <span className="hidden xl:inline">{supabaseConfig.isConnected ? 'DB Connected' : 'Database'}</span>
                </button>
              </>
            )}

            {/* User Profile or Auth */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <button
                  type="button"
                  onClick={() => setCurrentView('profile')}
                  title="View & Edit Profile"
                  aria-label={`View account profile for ${currentUser.name}`}
                  className={`flex items-center gap-2 px-2 py-1 rounded-lg transition text-left cursor-pointer ${
                    currentView === 'profile' ? 'bg-slate-100' : 'hover:bg-slate-100/80'
                  }`}
                >
                  <img
                    src={currentUser.avatarUrl || avatarFreelancerProImg}
                    alt={`Avatar of ${currentUser.name}`}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  />
                  <div className="hidden lg:block">
                    <div className="text-xs font-semibold text-slate-900 leading-tight max-w-[110px] truncate">
                      {currentUser.name}
                    </div>
                    {roleMeta && RoleIcon && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <RoleIcon className="w-2.5 h-2.5" aria-hidden="true" />
                        <span>{roleMeta.label}</span>
                      </div>
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setCurrentView('home');
                  }}
                  title="Sign out"
                  aria-label="Sign out of account"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white font-semibold text-xs transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sign In / Sign Up</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-1.5">
            {currentView !== 'home' && (
              <button
                type="button"
                onClick={() => setIsGuideVideoOpen(true)}
                className="p-2 text-indigo-700 bg-indigo-50 rounded-lg cursor-pointer"
                title="Guide Video"
                aria-label="Watch interactive guide video"
              >
                <Play className="w-4 h-4 fill-indigo-600" aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden border-t border-slate-200 bg-white overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3">
              {/* Primary Workspace Switcher on Mobile */}
              <div className="grid grid-cols-2 gap-1.5">
                {navItems.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold text-left transition cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {currentView !== 'home' && (
                <>
                  <div className="flex items-center justify-between py-2.5 border-y border-slate-100">
                    <span className="text-xs font-medium text-slate-500">Billing Currency</span>
                    <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setCurrency('PKR')}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                          currency === 'PKR' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                        }`}
                      >
                        PKR
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrency('USD')}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                          currency === 'USD' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                        }`}
                      >
                        USD
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDeploymentModalOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                        isProductionMode
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      {isProductionMode ? (
                        <>
                          <Rocket className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Live URL</span>
                        </>
                      ) : (
                        <>
                          <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Sandbox Mode</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsSupabaseGuideOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="py-2 px-3 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Database SQL</span>
                    </button>
                  </div>
                </>
              )}

              {currentUser ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('profile');
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>My Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setCurrentView('home');
                      setMobileMenuOpen(false);
                    }}
                    className="py-2 px-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-3 rounded-lg bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sign In / Register</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
