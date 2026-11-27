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
import { ChatNotificationToast } from './components/ChatNotificationToast';
import { GmailConfirmationModal } from './components/GmailConfirmationModal';
import { FindFreelancersView } from './components/FindFreelancersView';
import { Layers } from 'lucide-react';
import { UserRole } from './types';

function MainAppContent() {
  const {
    currentUser,
    switchRole,
    isGuideVideoOpen,
    setIsGuideVideoOpen,
    openProjectChat,
    projects,
    isAdminAuthenticated,
  } = usePortal();

  const [currentView, setCurrentView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (viewParam === 'client' || viewParam === 'freelancer' || viewParam === 'home') {
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

            {currentView === 'freelancers' && (
              <FindFreelancersView
                onOpenAuth={() => setCurrentView('auth')}
                onNavigateView={setCurrentView}
              />
            )}

            {currentView === 'admin' && isAdminAuthenticated && <AdminPanel />}
            {currentView === 'admin' && !isAdminAuthenticated && (
              <LandingPage
                onOpenAuth={() => setCurrentView('auth')}
                setCurrentView={setCurrentView}
              />
            )}

            {currentView === 'freelancer' && <FreelancerPortal />}

            {currentView === 'client' && <ClientPortal />}

            {currentView === 'profile' && (
              <UserProfilePage
                onBack={() => {
                  if (currentUser?.role === 'admin' && isAdminAuthenticated) setCurrentView('admin');
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
      <ChatNotificationToast
        onOpenChatView={() => {
          if (currentUser?.role === 'client') setCurrentView('client');
          else if (currentUser?.role === 'freelancer' || currentUser?.role === 'admin') {
            setCurrentView('freelancer');
          }
        }}
      />

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
