import React from 'react';
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
  CreditCard
} from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../data/mockData';
import { formatCurrency } from '../utils/calculations';

interface LandingPageProps {
  onOpenAuth: () => void;
  setCurrentView: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, setCurrentView }) => {
  const {
    switchRole,
    currency,
    setCurrency,
    setIsSupabaseGuideOpen,
    setIsGuideVideoOpen,
    setIsDebitModalOpen,
    setSelectedPlanForPayment
  } = usePortal();

  return (
    <div className="space-y-20 pb-16">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 sm:pt-20 sm:pb-16 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),white)] opacity-70"></div>

        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
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
            
            {/* Super Admin Quick Launch */}
            <button
              onClick={() => {
                switchRole('admin');
                setCurrentView('admin');
              }}
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition flex items-center gap-2 group"
            >
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Enter Super Admin Panel (abdary)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </button>

            {/* Freelancer Dashboard */}
            <button
              onClick={() => {
                switchRole('freelancer');
                setCurrentView('freelancer');
              }}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-indigo-500/25 transition flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              <span>Open Freelancer Workspace</span>
            </button>

            {/* Client Portal View */}
            <button
              onClick={() => {
                switchRole('client');
                setCurrentView('client');
              }}
              className="px-5 py-3 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-xs sm:text-sm shadow-xs hover:bg-slate-50 transition flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Client Portal Demo</span>
            </button>

            {/* Guide Video Trigger */}
            <button
              onClick={() => setIsGuideVideoOpen(true)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-orange-500/25 transition flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Watch Interactive Guide Video (Urdu/Eng)</span>
            </button>
          </div>

          <div className="pt-2 text-xs text-slate-500 flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> No setup required
            </span>
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-indigo-600" /> Supabase Ready (PostgreSQL)
            </span>
            <span className="flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Pro Plan Debit Card Remittance
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
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold uppercase tracking-wider">
                <Play className="w-3 h-3 fill-amber-300" />
                Animated Product Walkthrough Video
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Website Ka Kaam Kia Hai Aur Yeh Kaise Kaam Karti Hai?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                4-scene interactive animated guide video dekhein: Super Admin (abdary) controls, Freelancer workspace, Client approval portal, aur Supabase database syncing.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 group-hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 fill-white ml-1" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white">Play Video</div>
                <div className="text-[11px] text-slate-400">Duration: 4 Chapters</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Roles Architecture Grid */}
      <section className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
            Role-Based Isolation
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Three Distinct Roles, One Unified Platform
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Admin */}
          <div className="rounded-2xl p-6 bg-white border border-slate-200 hover:border-rose-300 shadow-xs hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-sm">
                Username: abdary
              </span>
              <h3 className="font-bold text-slate-900 text-lg mt-2">Executive Super Admin</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Platform-wide oversight jahan se aap website par hone wali har activity, freelancers, clients, projects, payments aur Supabase database tables ko live monitor kar saken.
              </p>
            </div>
            <button
              onClick={() => {
                switchRole('admin');
                setCurrentView('admin');
              }}
              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
            >
              Access Admin Panel
            </button>
          </div>

          {/* Card 2: Freelancer */}
          <div className="rounded-2xl p-6 bg-white border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm">
                Freelancer Portal
              </span>
              <h3 className="font-bold text-slate-900 text-lg mt-2">Freelancer Command Suite</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Projects create/edit karein, client tasks assign karein, milestone invoices send karein, deliverable files share karein aur real-time messaging manage karein.
              </p>
            </div>
            <button
              onClick={() => {
                switchRole('freelancer');
                setCurrentView('freelancer');
              }}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
            >
              Open Freelancer Dashboard
            </button>
          </div>

          {/* Card 3: Client */}
          <div className="rounded-2xl p-6 bg-white border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                Client Dashboard
              </span>
              <h3 className="font-bold text-slate-900 text-lg mt-2">Client Self-Serve Portal</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Clients sirf apne assigned projects ki progress bar check karein, final design/code deliverables download karein, invoices pay karein aur updates bhejein.
              </p>
            </div>
            <button
              onClick={() => {
                switchRole('client');
                setCurrentView('client');
              }}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              Open Client Portal
            </button>
          </div>

        </div>
      </section>

      {/* SaaS Pricing Section (From Outline Section 6) */}
      <section className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
            SaaS Monetization
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Subscription Pricing Plans
          </h2>
          <p className="text-xs text-slate-500">
            Platform ko subscription-based SaaS banayein. Free se lekar Business tier tak flexible pricing structure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 bg-white border flex flex-col justify-between transition ${
                plan.popular ? 'border-indigo-600 shadow-xl ring-2 ring-indigo-600/10' : 'border-slate-200 shadow-xs'
              }`}
            >
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{plan.name}</h3>
                  <p className="text-xs text-slate-500 min-h-[32px] mt-1">{plan.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-3xl font-extrabold text-slate-900">
                    {currency === 'PKR' ? `Rs. ${plan.pricePkr.toLocaleString()}` : `$${plan.priceUsd}`}
                    <span className="text-xs font-normal text-slate-400">/mo</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
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
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    plan.popular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Choose {plan.name} (Debit Card)</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Supabase Notice Banner */}
        <div className="rounded-2xl p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Supabase Cloud Database Ready</h3>
              <p className="text-xs text-slate-300">
                Aap ko Supabase ki database use karne ka mukammal tareeqa, ready-to-run SQL schema script aur live connection validation provide kiya gaya hai.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSupabaseGuideOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md whitespace-nowrap transition"
          >
            Supabase Setup Tariqa &amp; SQL
          </button>
        </div>
      </section>

    </div>
  );
};
