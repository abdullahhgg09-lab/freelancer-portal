import React, { useState } from 'react';
import { PortalProvider, usePortal } from './context/PortalContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AdminPanel } from './components/AdminPanel';
import { FreelancerPortal } from './components/FreelancerPortal';
import { ClientPortal } from './components/ClientPortal';
import { SupabaseGuideModal } from './components/SupabaseGuideModal';
import { AuthModal } from './components/AuthModal';
import { AuthPage } from './components/AuthPage';
import { UserProfilePage } from './components/UserProfilePage';
import { AnimatedGuideVideo } from './components/AnimatedGuideVideo';
import { DebitCardCheckoutModal } from './components/DebitCardCheckoutModal';
import { Layers, ShieldCheck, Database, LogIn, User, Play } from 'lucide-react';
import { UserRole } from './types';

function MainAppContent() {
  const {
    currentUser,
    switchRole,
    setIsSupabaseGuideOpen,
    supabaseConfig,
    isGuideVideoOpen,
    setIsGuideVideoOpen
  } = usePortal();
  
  // When website is opened: if no session, open on 'auth' gate as requested by user;
  // otherwise open according to their active role
  const [currentView, setCurrentView] = useState<string>(() => {
    if (currentUser?.role === 'admin') return 'admin';
    if (currentUser?.role === 'freelancer') return 'freelancer';
    if (currentUser?.role === 'client') return 'client';
    return 'auth'; // Default entry gate: Login / Register / Google Auth
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleAuthSuccess = (role: UserRole) => {
    if (role === 'admin') setCurrentView('admin');
    else if (role === 'freelancer') setCurrentView('freelancer');
    else setCurrentView('client');
  };

  // If user is on the dedicated Auth Page
  if (!currentUser && currentView === 'auth') {
    return (
      <>
        <AuthPage
          onSuccess={handleAuthSuccess}
          onBrowseLanding={() => setCurrentView('home')}
        />
        <SupabaseGuideModal />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      
      {/* Top Banner for Supabase reminder */}
      {!supabaseConfig.isConnected && (
        <div className="bg-gradient-to-r from-amber-500 via-emerald-600 to-indigo-600 text-white text-[11px] font-medium py-1 px-4 text-center flex items-center justify-center gap-2 shadow-xs">
          <span>⚡ Supabase Database Connect karne ke liye:</span>
          <button
            onClick={() => setIsSupabaseGuideOpen(true)}
            className="underline font-bold hover:text-amber-100 flex items-center gap-1"
          >
            Guide &amp; SQL Schema Dekhein <Database className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Navigation */}
      <Navbar
        onOpenAuth={() => setCurrentView('auth')}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      {/* View Switcher / Quick Navigation Sub-bar */}
      <div className="bg-white border-b border-slate-200 py-2 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <span className="text-slate-400 font-medium">Active View:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg flex-wrap">
              <button
                onClick={() => setCurrentView('home')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  currentView === 'home' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Landing Page
              </button>
              <button
                onClick={() => {
                  switchRole('freelancer');
                  setCurrentView('freelancer');
                }}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  currentView === 'freelancer' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-700'
                }`}
              >
                Freelancer
              </button>
              <button
                onClick={() => {
                  switchRole('client');
                  setCurrentView('client');
                }}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  currentView === 'client' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                Client
              </button>
              {currentUser && (
                <button
                  onClick={() => setCurrentView('profile')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                    currentView === 'profile' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-700'
                  }`}
                  title="Customize Avatar and Account Profile"
                >
                  <User className="w-3 h-3" />
                  My Profile
                </button>
              )}
              <button
                onClick={() => setIsGuideVideoOpen(true)}
                className="px-2.5 py-1 rounded-md font-semibold transition text-amber-800 bg-amber-50 hover:bg-amber-100 flex items-center gap-1"
                title="Watch How the Platform Works"
              >
                <Play className="w-3 h-3 fill-amber-700 text-amber-700" />
                Guide Video
              </button>
              <button
                onClick={() => setCurrentView('auth')}
                className="px-2.5 py-1 rounded-md font-semibold transition text-slate-500 hover:text-slate-800 flex items-center gap-1"
                title="Go to Auth Page"
              >
                <LogIn className="w-3 h-3" />
                Sign In / Out
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span>: <code className="bg-slate-100 px-2 py-0.5 rounded text-indigo-700 font-bold font-mono tracking-wide">ABBDULLAH</code></span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentView === 'home' && (
          <LandingPage
            onOpenAuth={() => setCurrentView('auth')}
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'admin' && <AdminPanel />}

        {currentView === 'freelancer' && <FreelancerPortal />}

        {currentView === 'client' && <ClientPortal />}

        {currentView === 'profile' && (
          <UserProfilePage
            onBack={() => {
              if (currentUser?.role === 'admin') setCurrentView('admin');
              else if (currentUser?.role === 'client') setCurrentView('client');
              else setCurrentView('freelancer');
            }}
          />
        )}
      </main>

      {/* Global Modals */}
      <SupabaseGuideModal />
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccessRole={handleAuthSuccess}
      />

      {/* User Requested Interactive Animated Guide Video */}
      {isGuideVideoOpen && (
        <AnimatedGuideVideo
          isModal={true}
          onClose={() => setIsGuideVideoOpen(false)}
        />
      )}

      {/* User Requested Pro Plan Debit Card / Bank Remittance Modal */}
      <DebitCardCheckoutModal />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900">FreelancePort.pk</span>
            <span>— Complete Freelancer Client Portal SaaS with Admin Control</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSupabaseGuideOpen(true)}
              className="hover:text-indigo-600 transition flex items-center gap-1 font-medium"
            >
              <Database className="w-3 h-3 text-emerald-600" />
              Supabase Setup
            </button>
            <span>•</span>
            <button
              onClick={() => {
                switchRole('admin');
                setCurrentView('admin');
              }}
              className="hover:text-rose-600 transition flex items-center gap-1 font-medium"
            >
              <ShieldCheck className="w-3 h-3 text-rose-600" />
              Admin Portal
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <PortalProvider>
      <MainAppContent />
    </PortalProvider>
  );
}
