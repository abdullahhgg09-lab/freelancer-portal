import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePortal } from '../context/PortalContext';
import { heroWorkspaceImg, bentoClientCollabImg } from '../assets/images';
import {
  Briefcase,
  UserCheck,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  Play,
  CreditCard,
  Send,
  X,
  Copy,
  Check,
  Wifi,
  LogIn,
  Search
} from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../data/mockData';

interface LandingPageProps {
  onOpenAuth: () => void;
  setCurrentView: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, setCurrentView }) => {
  const {
    currentUser,
    switchRole,
    currency,
    setIsGuideVideoOpen,
    setIsDebitModalOpen,
    setSelectedPlanForPayment,
    addProject,
    addClient,
    openProjectChat,
    directoryFreelancers,
  } = usePortal();

  // Hire & Project Brief Modal state
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<string>(
    directoryFreelancers[0]?.id || 'user-admin'
  );
  const [clientFullName, setClientFullName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectCategory, setProjectCategory] = useState('Web Development');
  const [projectBudget, setProjectBudget] = useState(150000);
  const [projectBrief, setProjectBrief] = useState('');
  const [submittedLink, setSubmittedLink] = useState<string | null>(null);
  const [createdProjId, setCreatedProjId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isHireModalOpen) {
        setIsHireModalOpen(false);
      }
    };
    if (isHireModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHireModalOpen]);

  const handleHireSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const clientUserId = `user-client-${Date.now()}`;
    const cleanEmail = clientEmail.trim().toLowerCase();

    const chosenFreelancer =
      directoryFreelancers.find((f) => f.id === selectedFreelancerId) || directoryFreelancers[0];
    const targetFreelancerId = chosenFreelancer?.id || 'user-admin';
    const targetFreelancerName = chosenFreelancer?.name || 'ABBDULLAH';

    addClient({
      userId: clientUserId,
      name: clientFullName.trim(),
      email: cleanEmail,
      company: clientCompany.trim() || 'Direct Client',
      phone: clientPhone.trim(),
      freelancerId: targetFreelancerId,
      status: 'active',
    });

    const newProj = addProject({
      name: projectTitle.trim(),
      freelancerId: targetFreelancerId,
      freelancerName: targetFreelancerName,
      clientId: clientUserId,
      clientName: `${clientFullName.trim()} (${clientCompany.trim() || 'Direct Client'})`,
      budget: Number(projectBudget),
      currency: 'PKR',
      startDate: new Date().toISOString().split('T')[0],
      deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      description: projectBrief.trim(),
      progress: 10,
      status: 'pending',
      category: projectCategory,
      tasks: [
        { id: `t-1`, title: 'Project Brief Review & Scope Finalization', completed: true },
        { id: `t-2`, title: 'Design & Architecture Wireframes', completed: false },
        { id: `t-3`, title: 'Core Deliverables Milestone', completed: false },
        { id: `t-4`, title: 'Final Handover & Client Approval', completed: false },
      ],
    });

    const magicLink = `${window.location.origin}/?view=client&projId=${newProj.id}`;
    setSubmittedLink(magicLink);
    setCreatedProjId(newProj.id);
    switchRole('client', clientUserId);
  };

  const handleCopyLink = () => {
    if (submittedLink) {
      navigator.clipboard.writeText(submittedLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section: Architectural 2-Column Split */}
      <section className="relative pt-4 sm:pt-8">
        <div className="bg-arch-grid rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 lg:p-12 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Left Copy & Primary Action */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex flex-col justify-center space-y-6"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                Freelancer &amp; Client Operating System
              </div>

              <h1 className="font-display text-[clamp(2.15rem,4vw,3.4rem)] font-bold text-slate-950 tracking-tight leading-[1.08] text-balance">
                Client Projects, Live Chat &amp; Payouts in One Workspace.
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                Freelancers manage milestones, deliverables, and invoices while clients review progress, discuss revisions live inside dedicated project rooms, and settle invoices securely.
              </p>

              {/* Action Row */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setSubmittedLink(null);
                    setCreatedProjId(null);
                    setIsHireModalOpen(true);
                  }}
                  className="px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-semibold text-xs sm:text-sm shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  <span>Hire &amp; Post Project Brief</span>
                </motion.button>

                <button
                  type="button"
                  onClick={() => setCurrentView('freelancers')}
                  className="px-4 py-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4" aria-hidden="true" />
                  <span>Find Freelancers</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    switchRole('freelancer');
                    setCurrentView('freelancer');
                  }}
                  className="px-4 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <Briefcase className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                  <span>Freelancer Workspace</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    switchRole('client');
                    setCurrentView('client');
                  }}
                  className="px-4 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  <span>Client Portal</span>
                </button>

                {!currentUser && (
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="px-4 py-3.5 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/60 text-indigo-700 font-semibold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" aria-hidden="true" />
                    <span>Sign In (Google / Apple)</span>
                  </button>
                )}
              </div>

              {/* Clean Unboxed Trust Metadata */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
                <span>1-Click Client Link</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>Real-Time Project Rooms</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>Direct Bank Settlement</span>
              </div>
            </motion.div>

            {/* Right Visual Container with Live Discussion Preview Overlay */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[320px] lg:min-h-[420px] flex flex-col justify-end"
            >
              <img
                src={heroWorkspaceImg}
                alt="Architectural freelance studio desk showcasing organized project workflows"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-slate-950/15" />

              <div className="relative z-10 p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-300">
                    <Wifi className="w-3.5 h-3.5" aria-hidden="true" />
                    Live Project Room Sync
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsGuideVideoOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-semibold backdrop-blur-xs transition cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-white" aria-hidden="true" />
                    <span>Watch Interactive Guide</span>
                  </button>
                </div>

                {/* Mock Live Thread Card */}
                <div className="rounded-xl bg-white/95 backdrop-blur-md p-4 border border-white/40 shadow-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="font-display font-bold text-slate-900">E-Commerce Redesign · Room #04</span>
                    <span className="font-mono text-[11px] font-semibold text-indigo-600 tabular-nums">75% Complete</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-900 shrink-0">Client:</span>
                      <span className="text-slate-600">Checkout layout look crisp! Ready to review milestone 3 deliverables.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-indigo-700 shrink-0">Freelancer:</span>
                      <span className="text-slate-600">Updated prototype files uploaded in portal — please verify &amp; approve.</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Asymmetric Bento Showcase: Capabilities */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
              Platform Architecture
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
              Designed Around Real Client Delivery
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsGuideVideoOpen(true)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Play className="w-3.5 h-3.5 fill-indigo-600" aria-hidden="true" />
            <span>Explore Workflow Tour</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Featured Large Bento Card: Real-Time Project Discussion */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18 }}
            className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
          >
            <div className="relative h-56 sm:h-64 overflow-hidden bg-slate-900">
              <img
                src={bentoClientCollabImg}
                alt="Client and freelancer reviewing project milestones together in real-time workspace"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-white">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <MessageSquare className="w-4 h-4 text-indigo-300" aria-hidden="true" />
                  <span>Direct Project Discussion Rooms</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-300">WebSocket Real-Time</span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <h3 className="font-display font-bold text-xl text-slate-950">
                Talk Directly Inside Every Project
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Clients aur freelancers har project ke andar dedicated discussion room open karke requirements clear kar sakte hain, revisions tag kar sakte hain, aur deliverable approval real-time sync ke sath handle kar sakte hain.
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  Topic tags: Milestone, Revision, Deliverable
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  Live typing &amp; presence awareness
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right Editorial Numbered Stack */}
          <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18 }}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-600">01</span>
                <Briefcase className="w-4 h-4 text-slate-400" aria-hidden="true" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-950">Freelancer Command Suite</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Create projects, update milestone checklists, share magic client portal links, upload files, and send tax-ready invoices.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18 }}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-600">02</span>
                <UserCheck className="w-4 h-4 text-slate-400" aria-hidden="true" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-950">Isolated Client Self-Service</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clients track milestone bars, inspect shared files, print receipts, and chat directly with their assigned freelancer.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18 }}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-700">03</span>
                <CreditCard className="w-4 h-4 text-slate-400" aria-hidden="true" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-950">Direct Bank &amp; Card Settlement</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Accept global card payments with interbank currency conversion and automated settlement ledger visibility for ABBDULLAH.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
              Transparent Billing
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
              SaaS Subscription Tiers
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-sm">
            Pick the tier that fits your freelance client volume. Upgrade or change at any time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.18 }}
              className={`rounded-2xl p-6 bg-white border flex flex-col justify-between transition-shadow ${
                plan.popular
                  ? 'border-indigo-600 shadow-md'
                  : 'border-slate-200 shadow-xs'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display font-bold text-slate-950 text-lg">{plan.name}</h3>
                  {plan.popular && (
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                      Recommended
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 min-h-[32px]">{plan.description}</p>

                <div className="pt-3 border-t border-slate-100">
                  <div className="font-display text-3xl font-bold text-slate-950 tabular-nums">
                    {currency === 'PKR' ? `Rs. ${plan.pricePkr.toLocaleString()}` : `$${plan.priceUsd}`}
                    <span className="text-xs font-sans font-normal text-slate-400"> / mo</span>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlanForPayment(plan.id);
                    setIsDebitModalOpen(true);
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    plan.popular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Select {plan.name}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Hire & Project Brief Modal */}
      <AnimatePresence>
        {isHireModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs p-3 sm:p-4 md:p-6">
            <div className="min-h-full flex items-center justify-center py-6 sm:py-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ duration: 0.18 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="hire-modal-title"
                className="relative bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
              >
                <div className="sticky top-0 z-30 px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center">
                      <Send className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 id="hire-modal-title" className="font-display font-bold text-sm sm:text-base text-white">
                        Hire a Freelancer &amp; Post Project Brief
                      </h3>
                      <p className="text-[11px] text-slate-300">
                        Submit project details to unlock live workspace &amp; project discussion
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsHireModalOpen(false)}
                    className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0 ml-3"
                    aria-label="Close Hire Modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
                  {submittedLink ? (
                    <div className="text-center py-4 space-y-4">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
                      </div>
                      <div>
                        <h4 className="font-display text-lg font-bold text-slate-900">Project Brief Submitted!</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Aap ka project create ho chuka hai. Ab aap portal access kar sakte hain ya direct freelancer se baat shuru kar sakte hain.
                        </p>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-left">
                        <div className="text-[11px] font-semibold text-slate-600">Private Client Portal Link:</div>
                        <div className="p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800 break-all select-all">
                          {submittedLink}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleCopyLink}
                            className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                          </button>
                          {createdProjId && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsHireModalOpen(false);
                                setCurrentView('client');
                                openProjectChat(createdProjId);
                              }}
                              className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>Start Project Chat</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setIsHireModalOpen(false);
                              setCurrentView('client');
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <span>Open Portal</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleHireSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="hire-client-name" className="block font-semibold text-slate-700 mb-1">Your Full Name *</label>
                          <input
                            id="hire-client-name"
                            type="text"
                            required
                            placeholder="e.g. Asad Malik"
                            value={clientFullName}
                            onChange={(e) => setClientFullName(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="hire-client-company" className="block font-semibold text-slate-700 mb-1">Company / Brand</label>
                          <input
                            id="hire-client-company"
                            type="text"
                            placeholder="e.g. PeakStudio Media"
                            value={clientCompany}
                            onChange={(e) => setClientCompany(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="hire-client-email" className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                          <input
                            id="hire-client-email"
                            type="email"
                            required
                            placeholder="client@company.com"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="hire-client-phone" className="block font-semibold text-slate-700 mb-1">WhatsApp / Phone</label>
                          <input
                            id="hire-client-phone"
                            type="text"
                            placeholder="+92 300 1234567"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="hire-project-title" className="block font-semibold text-slate-700 mb-1">Project Title *</label>
                          <input
                            id="hire-project-title"
                            type="text"
                            required
                            placeholder="e.g. E-Commerce Website Redesign"
                            value={projectTitle}
                            onChange={(e) => setProjectTitle(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="hire-project-category" className="block font-semibold text-slate-700 mb-1">Category</label>
                          <select
                            id="hire-project-category"
                            value={projectCategory}
                            onChange={(e) => setProjectCategory(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white"
                          >
                            <option value="Web Development">Full-Stack Web Development</option>
                            <option value="Mobile App">Mobile App (iOS/Android)</option>
                            <option value="UI/UX Design">Figma UI/UX &amp; Prototyping</option>
                            <option value="Branding">Brand Identity &amp; Graphics</option>
                            <option value="SaaS Architecture">SaaS Architecture &amp; Database</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="hire-freelancer-select" className="block font-semibold text-slate-700 mb-1">Choose Freelancer *</label>
                          <select
                            id="hire-freelancer-select"
                            value={selectedFreelancerId}
                            onChange={(e) => setSelectedFreelancerId(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white font-medium"
                          >
                            {directoryFreelancers.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name} — {f.category}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="hire-project-budget" className="block font-semibold text-slate-700 mb-1">Estimated Budget (PKR) *</label>
                          <input
                            id="hire-project-budget"
                            type="number"
                            required
                            value={projectBudget}
                            onChange={(e) => setProjectBudget(Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono tabular-nums"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="hire-project-brief" className="block font-semibold text-slate-700 mb-1">Project Brief &amp; Requirements *</label>
                        <textarea
                          id="hire-project-brief"
                          rows={4}
                          required
                          placeholder="Describe your goals, desired features, deadlines, or reference links..."
                          value={projectBrief}
                          onChange={(e) => setProjectBrief(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Send className="w-4 h-4" aria-hidden="true" />
                          <span>Submit Project Brief &amp; Open Workspace</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
