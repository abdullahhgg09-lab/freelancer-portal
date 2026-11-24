import React, { useState, useEffect } from 'react';
import { MotionConfig, AnimatePresence, motion } from 'motion/react';
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
import { RealTimePaymentModal } from './components/RealTimePaymentModal';
import { LiveDeploymentModal } from './components/LiveDeploymentModal';
import { ProjectChatDrawer } from './components/ProjectChatRoom';
import { GmailConfirmationModal } from './components/GmailConfirmationModal';
import { Layers, ShieldCheck, Database, FlaskConical, RotateCcw } from 'lucide-react';
import { UserRole } from './types';

function MainAppContent() {
  const {
    currentUser,
    switchRole,
    setIsSupabaseGuideOpen,
    supabaseConfig,
    isGuideVideoOpen,
    setIsGuideVideoOpen,
    openProjectChat,
    isProductionMode,
    setIsDeploymentModalOpen,
    resetSandboxData,
    projects,
  } = usePortal();

  const [sandboxResetDone, setSandboxResetDone] = useState(false);

  const [currentView, setCurrentView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (viewParam === 'client' || viewParam === 'freelancer' || viewParam === 'home' || viewParam === 'admin') {
        return viewParam;
      }
    }
    return 'home';
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Handle shared magic portal links (?view=client&projId=... or ?clientId=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const clientIdParam = params.get('clientId');
    const projIdParam = params.get('projId');

    if (viewParam === 'client') {
      const linkedProj = projIdParam ? projects.find((p) => p.id === projIdParam) : undefined;
      switchRole('client', clientIdParam || linkedProj?.clientId || undefined);
      setCurrentView('client');
      if (projIdParam) {
        openProjectChat(projIdParam);
      }
    }
  }, [switchRole, openProjectChat, projects]);

  const handleAuthSuccess = (role: UserRole) => {
    if (role === 'admin') setCurrentView('admin');
    else if (role === 'freelancer') setCurrentView('freelancer');
    else setCurrentView('client');
  };

  const handleResetSandbox = async () => {
    await resetSandboxData();
    setSandboxResetDone(true);
    setTimeout(() => setSandboxResetDone(false), 3000);
  };

  if (currentView === 'auth') {
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
    <div className="min-h-screen flex flex-col bg-[#fafafb] text-slate-900">
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[9999] px-4 py-2.5 bg-indigo-600 text-white rounded-xl shadow-xl font-bold text-xs ring-2 ring-white transition"
      >
        Skip to main content
      </a>

      {/* Sandbox Testing Environment Bar */}
      {!isProductionMode && (
        <div className="bg-amber-50 border-b border-amber-200/80 text-amber-950 text-[11px] font-medium py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />
              <span>
                <strong>Sandbox Mode Active</strong> · Safe testing environment for project briefs, chat &amp; simulated SBX payments
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetSandbox}
                className="inline-flex items-center gap-1 font-semibold text-amber-900 hover:text-amber-700 underline underline-offset-2 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>{sandboxResetDone ? 'Sandbox Reset Done' : 'Reset Test Data'}</span>
              </button>
              <span aria-hidden="true" className="text-amber-300">·</span>
              <button
                type="button"
                onClick={() => setIsDeploymentModalOpen(true)}
                className="font-semibold text-amber-900 hover:text-amber-700 underline underline-offset-2 cursor-pointer"
              >
                Environment Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slim Database Reminder */}
      {!supabaseConfig.isConnected && (
        <div className="bg-slate-900 text-slate-200 text-[11px] font-medium py-1.5 px-4 text-center flex items-center justify-center gap-2 border-b border-slate-800">
          <span>Supabase Database optional sync ready</span>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => setIsSupabaseGuideOpen(true)}
            className="text-indigo-300 hover:text-white underline underline-offset-2 font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Open SQL Setup</span>
            <Database className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Clean 3-Zone Top Bar */}
      <Navbar
        onOpenAuth={() => setCurrentView('auth')}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      {/* Main Content Area with Smooth Transitions */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 focus:outline-hidden"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
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
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Modals & Real-Time Project Chat Drawer */}
      <ProjectChatDrawer />
      <SupabaseGuideModal />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccessRole={handleAuthSuccess}
      />

      {isGuideVideoOpen && (
        <AnimatedGuideVideo
          isModal={true}
          onClose={() => setIsGuideVideoOpen(false)}
        />
      )}

      <RealTimePaymentModal />
      <LiveDeploymentModal />
      <GmailConfirmationModal />

      {/* Minimal SaaS Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-7 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <span className="font-display font-bold text-slate-900">FreelancePort.pk</span>
            <span aria-hidden="true">·</span>
            <span>Client Portal, Project Chat &amp; Remittance Architecture</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSupabaseGuideOpen(true)}
              className="hover:text-indigo-600 transition flex items-center gap-1.5 font-medium cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              <span>Supabase Setup</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => {
                switchRole('admin');
                setCurrentView('admin');
              }}
              className="hover:text-slate-900 transition flex items-center gap-1.5 font-medium cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
              <span>Owner Bank Console</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <PortalProvider>
        <MainAppContent />
      </PortalProvider>
    </MotionConfig>
  );
}
