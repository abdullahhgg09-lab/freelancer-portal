import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import {
  Layers,
  ShieldCheck,
  Briefcase,
  UserCheck,
  CheckCircle2,
  FileText,
  MessageSquare,
  FolderOpen,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Database,
  Lock,
  Zap,
  Globe,
  Play,
  CreditCard,
  Send,
  X,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../data/mockData';
import { formatCurrency } from '../utils/calculations';

interface LandingPageProps {
  onOpenAuth: () => void;
  setCurrentView: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, setCurrentView }) => {
  const {
    currentUser,
    switchRole,
    currency,
    setCurrency,
    setIsSupabaseGuideOpen,
    setIsGuideVideoOpen,
    setIsDebitModalOpen,
    setSelectedPlanForPayment,
    addProject,
    addClient,
    login
  } = usePortal();

  // Hire & Project Brief Modal state
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [clientFullName, setClientFullName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectCategory, setProjectCategory] = useState('Web Development');
  const [projectBudget, setProjectBudget] = useState(150000);
  const [projectBrief, setProjectBrief] = useState('');
  const [submittedLink, setSubmittedLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleHireSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const clientUserId = `user-client-${Date.now()}`;
    const cleanEmail = clientEmail.trim().toLowerCase();

    // 1. Add Client profile
    addClient({
      userId: clientUserId,
      name: clientFullName.trim(),
      email: cleanEmail,
      company: clientCompany.trim() || 'Direct Client',
      phone: clientPhone.trim(),
      freelancerId: 'user-admin',
      status: 'active',
    });

    // 2. Add Project
    const newProj = addProject({
      name: projectTitle.trim(),
      freelancerId: 'user-admin',
      freelancerName: 'ABBDULLAH',
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

    // 3. Generate direct access link
    const magicLink = `${window.location.origin}/?view=client&projId=${newProj.id}`;
    setSubmittedLink(magicLink);

    // Switch role to client
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
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 sm:pt-20 sm:pb-16 overflow-hidden">
        <div className="text-center space-y-6 max-w-4xl mx-auto px-4">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Complete SaaS Freelancer Client Management Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Freelancer &amp; Client Portal <br />
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Built for High-Growth SaaS
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Freelancers apne clients, projects, payments, invoices aur deliverable files manage karein. 
            Clients secure login karke apne projects ki live progress aur invoices dekh saken.
          </p>

          {/* Quick interactive action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            
            {/* Direct Hire / Project Brief Button */}
            <button
              onClick={() => {
                setSubmittedLink(null);
                setIsHireModalOpen(true);
              }}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-900/20 transition flex items-center gap-2 cursor-pointer group"
            >
              <Send className="w-4 h-4 text-emerald-200 group-hover:translate-x-0.5 transition" />
              <span>Hire a Freelancer / Post Project Brief</span>
            </button>

            {/* Freelancer Dashboard */}
            <button
              onClick={() => {
                switchRole('freelancer');
                setCurrentView('freelancer');
              }}
              className="px-5 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-indigo-500/25 transition flex items-center gap-2 cursor-pointer"
            >
              <Briefcase className="w-4 h-4" />
              <span>Freelancer Workspace</span>
            </button>

            {/* Client Portal View */}
            <button
              onClick={() => {
                switchRole('client');
                setCurrentView('client');
              }}
              className="px-5 py-3.5 rounded-2xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-xs sm:text-sm shadow-xs hover:bg-slate-50 transition flex items-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Client Portal</span>
            </button>

            {/* Guide Video Trigger */}
            <button
              onClick={() => setIsGuideVideoOpen(true)}
              className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-orange-500/25 transition flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Interactive Guide Video</span>
            </button>
          </div>

          <div className="pt-2 text-xs text-slate-500 flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 1-Click Client Onboarding
            </span>
            <span className="flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Direct Debit Card Remittance
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-600" /> Role-Based Access Control
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Guide Video Preview Showcase */}
      <section className="max-w-5xl mx-auto px-4 -mt-10">
        <div
          onClick={() => setIsGuideVideoOpen(true)}
          className="group cursor-pointer rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl border border-indigo-800 hover:border-indigo-500 transition relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Visual Architecture Showcase
              </span>
              <h2 className="text-xl sm:text-2xl font-bold">
                Watch: How Freelancers &amp; Clients Collaborate
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                See real-time milestones, file sharing, debit card payments, and live portal synchronization.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-indigo-600 group-hover:scale-110 flex items-center justify-center text-white transition-all shadow-lg shrink-0">
                <Play className="w-5 h-5 fill-white text-white ml-0.5" />
              </div>
              <span className="text-xs font-semibold text-slate-200">Play Video (2 Min)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars Architecture Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs uppercase font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            System Capabilities
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Engineered for Modern Freelance Workflows
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Pillar 1: Freelancer */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">Freelancer Command Suite</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Create client projects, define milestone checklists, upload deliverable files, and issue branded PDF invoices with tax and discounts.
            </p>
            <ul className="text-xs space-y-2 text-slate-700 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Milestone progress bars (0-100%)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> File manager with deliverables tagging
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Direct client chat stream
              </li>
            </ul>
          </div>

          {/* Pillar 2: Client */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">Self-Service Client Portal</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Clients log in to an isolated workspace to inspect deliverables, view payment receipts, and submit feedback without technical friction.
            </p>
            <ul className="text-xs space-y-2 text-slate-700 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Secure authenticated client session
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Deliverables &amp; file downloads
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 1-Click invoice payment
              </li>
            </ul>
          </div>

          {/* Pillar 3: Card Payouts */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">Direct Bank &amp; Debit Remittance</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Accept multi-currency client payments worldwide and settle directly into Abdullah&apos;s Meezan Bank account with automated ledger entries.
            </p>
            <ul className="text-xs space-y-2 text-slate-700 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Real-time State Bank interbank conversion
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Instant remittance ledger
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Zero CVC/PIN exposure policy
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs uppercase font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Transparent Pricing
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">
            SaaS Subscription Plans for Every Scale
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Pick the plan that fits your freelance roster. Upgrade at any time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 bg-white border transition flex flex-col justify-between ${
                plan.popular
                  ? 'border-indigo-600 shadow-xl ring-2 ring-indigo-600/20'
                  : 'border-slate-200 shadow-xs'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-lg">{plan.name}</h4>
                  {plan.popular && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase">
                      Popular
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500">{plan.description}</p>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-3xl font-extrabold text-slate-900">
                    {currency === 'PKR' ? `Rs. ${plan.pricePkr.toLocaleString()}` : `$${plan.priceUsd}`}
                    <span className="text-xs font-normal text-slate-400">/mo</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => {
                    setSelectedPlanForPayment(plan.id);
                    setIsDebitModalOpen(true);
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                    plan.popular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Choose {plan.name} Plan</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hire & Project Brief Responsive Modal */}
      {isHireModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 md:p-6">
          <div className="min-h-full flex items-center justify-center py-6 sm:py-8">
            <div className="relative bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
              
              {/* Sticky Header with Easy Touch Target Close Button */}
              <div className="sticky top-0 z-30 px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-bold">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-white">
                      Hire a Freelancer &amp; Post Project Brief
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Submit project details to receive custom proposals &amp; portal access
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsHireModalOpen(false)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0 ml-3"
                  aria-label="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
                
                {submittedLink ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-lg font-extrabold text-slate-900">Project Brief Submitted Successfully!</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Aap ka project create ho chuka hai aur aap ko Client Portal access grant kar diya gaya hai.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-left">
                      <div className="text-[11px] font-bold text-slate-600">Your Private Client Portal Link:</div>
                      <div className="p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800 break-all select-all">
                        {submittedLink}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedLink ? 'Copied to Clipboard!' : 'Copy Portal Link'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsHireModalOpen(false);
                            setCurrentView('client');
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <span>Open My Client Portal</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleHireSubmit} className="space-y-4">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Your Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Asad Malik"
                          value={clientFullName}
                          onChange={(e) => setClientFullName(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Company / Brand Name</label>
                        <input
                          type="text"
                          placeholder="e.g. PeakStudio Media"
                          value={clientCompany}
                          onChange={(e) => setClientCompany(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          placeholder="client@company.com"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">WhatsApp / Phone Number</label>
                        <input
                          type="text"
                          placeholder="+92 300 1234567"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Project Title *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. E-Commerce Website Redesign"
                          value={projectTitle}
                          onChange={(e) => setProjectTitle(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Category</label>
                        <select
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

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Estimated Budget (PKR) *</label>
                      <input
                        type="number"
                        required
                        value={projectBudget}
                        onChange={(e) => setProjectBudget(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Project Brief &amp; Key Requirements *</label>
                      <textarea
                        rows={4}
                        required
                        placeholder="Describe your goals, desired features, deadlines, design preferences or reference websites..."
                        value={projectBrief}
                        onChange={(e) => setProjectBrief(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Submit Project Brief &amp; Open Client Workspace</span>
                      </button>
                    </div>

                  </form>
                )}

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
