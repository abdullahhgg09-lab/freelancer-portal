import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  CheckCircle2,
  Sparkles,
  Briefcase,
  UserCheck,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Database,
  Layers,
  X
} from 'lucide-react';

interface AnimatedGuideVideoProps {
  isModal?: boolean;
  onClose?: () => void;
}

export const AnimatedGuideVideo: React.FC<AnimatedGuideVideoProps> = ({ isModal = false, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);

  const steps = [
    {
      id: 0,
      title: 'Step 1: Freelancer Project Creation',
      tag: 'Freelancer Suite',
      urdu: 'Freelancer apna project create karta hai, budget, deadline aur milestones define karta hai.',
      english: 'Freelancer creates a new project with custom budget, deadline and milestone checkpoints.',
      icon: Briefcase,
      color: 'from-indigo-600 to-blue-600',
    },
    {
      id: 1,
      title: 'Step 2: Client Portal & File Access',
      tag: 'Client Experience',
      urdu: 'Client secure portal login karke live progress bar dekhta hai aur deliverables download karta hai.',
      english: 'Client accesses their isolated portal to inspect progress and download shared deliverable files.',
      icon: UserCheck,
      color: 'from-emerald-600 to-teal-600',
    },
    {
      id: 2,
      title: 'Step 3: Direct Debit Card & Bank Billing',
      tag: 'Instant Payments',
      urdu: 'Automated invoices bante hain aur client direct Debit Card / Bank se payment karta hai.',
      english: 'Professional invoice generation with instant direct debit card & bank remittance.',
      icon: CreditCard,
      color: 'from-amber-600 to-orange-600',
    },
    {
      id: 3,
      title: 'Step 4: Super Admin & Supabase Control',
      tag: 'Master Oversight',
      urdu: 'Super Admin (abdary) website ki tamaam activities aur Supabase PostgreSQL database ko live monitor karta hai.',
      english: 'Executive Super Admin controls all users, activities and syncs with cloud Supabase database.',
      icon: ShieldCheck,
      color: 'from-rose-600 to-purple-600',
    },
  ];

  // Automatic timeline playback
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) {
          setCurrentStep((s) => (s + 1) % steps.length);
          return 0;
        }
        return prev + 2.5; // ~4 seconds per step
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, steps.length]);

  const activeStepData = steps[currentStep];
  const StepIcon = activeStepData.icon;

  const content = (
    <div className="bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl text-white">
      
      {/* Top Video Header Bar (macOS style window) */}
      <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
          </div>
          <span className="text-xs font-mono text-slate-400 border-l border-slate-700 pl-3">
            guide-walkthrough.mp4 (Interactive SaaS Architecture)
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold text-[10px]">
            1080p HD
          </span>
          {isModal && onClose && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Animated Display Area */}
      <div className="relative aspect-video max-h-[460px] w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-between p-6 sm:p-10 overflow-hidden">
        
        {/* Animated Glow in background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Scene Indicator Top */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Live Walkthrough Demo
            </span>
          </div>

          <div className="flex gap-1.5">
            {steps.map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setCurrentStep(st.id);
                  setProgressPercent(0);
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
                  currentStep === st.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                Scene {st.id + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Animated Scene Content */}
        <div className="my-auto z-10 space-y-4">
          
          {/* Scene 1: Freelancer Project Creation */}
          {currentStep === 0 && (
            <div className="animate-in fade-in zoom-in-95 duration-300 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-3">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Freelancer Command Suite
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Create &amp; Assign Projects Seamlessly
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Project ka budget (Rs. 185,000), milestone deadlines, aur tasks assign karein. Client ko automatic access link mil jata hai.
                </p>
              </div>

              <div className="md:col-span-5 bg-slate-900/90 rounded-2xl p-4 border border-indigo-500/30 shadow-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">TechNova Fintech Mobile App</span>
                  <span className="text-emerald-400 font-mono font-bold">Rs. 185,000</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full transition-all duration-700" style={{ width: '75%' }}></div>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Milestones: 4 of 5 Finished</span>
                  <span className="text-indigo-400 font-bold">75% Complete</span>
                </div>
              </div>
            </div>
          )}

          {/* Scene 2: Client Portal */}
          {currentStep === 1 && (
            <div className="animate-in fade-in zoom-in-95 duration-300 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-3">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Client Self-Service Dashboard
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Isolated Portal &amp; Direct Deliverable Files
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Clients ko sirf unke apne projects nazar aate hain. Figma designs, PDFs aur source code 1-click download kar sakte hain.
                </p>
              </div>

              <div className="md:col-span-5 bg-slate-900/90 rounded-2xl p-4 border border-emerald-500/30 shadow-xl space-y-2.5">
                <div className="p-2.5 rounded-xl bg-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">FIG</span>
                    <span className="text-slate-200 text-[11px]">Final_UI_System_v2.fig</span>
                  </div>
                  <span className="text-emerald-400 text-[10px] font-bold">Download Ready</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px] font-bold">PDF</span>
                    <span className="text-slate-200 text-[11px]">Milestone_Agreement_Signed.pdf</span>
                  </div>
                  <span className="text-emerald-400 text-[10px] font-bold">Verified</span>
                </div>
              </div>
            </div>
          )}

          {/* Scene 3: Debit Card / Direct Bank Remittance */}
          {currentStep === 2 && (
            <div className="animate-in fade-in zoom-in-95 duration-300 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-3">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Instant Payment Gateway
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Direct Debit Card &amp; Bank Remittance
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Pro SaaS plans aur invoices par client direct debit card se pay karta hai aur paise seedha bank account mein receive hote hain.
                </p>
              </div>

              <div className="md:col-span-5 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-4 border border-amber-500/30 shadow-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">Debit Card Checkout</span>
                  <span className="text-amber-400 font-bold">Rs. 1,999 /mo</span>
                </div>
                <div className="p-2 rounded-lg bg-black/40 font-mono text-[11px] text-slate-300 flex justify-between">
                  <span>**** **** **** 8821</span>
                  <span>10/28</span>
                </div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Direct Bank Credit Confirmed
                </div>
              </div>
            </div>
          )}

          {/* Scene 4: Super Admin & Supabase */}
          {currentStep === 3 && (
            <div className="animate-in fade-in zoom-in-95 duration-300 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-3">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Super Admin abdary
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Website Master Oversight &amp; Supabase
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Super Admin panel se har project, freelancer, client, invoice audit aur cloud PostgreSQL database live control hoti hai.
                </p>
              </div>

              <div className="md:col-span-5 bg-slate-900/90 rounded-2xl p-4 border border-rose-500/30 shadow-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Admin Account:</span>
                  <span className="font-mono font-bold text-rose-400">abdary</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Database Engine:</span>
                  <span className="font-semibold text-emerald-400">Supabase (Active &amp; Linked)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">System Audit:</span>
                  <span className="font-semibold text-indigo-400">All Systems Operational</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Urdu & English Subtitle Bar */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 border border-slate-800 text-center z-10 space-y-0.5">
          <p className="text-xs sm:text-sm font-semibold text-white">
            {activeStepData.urdu}
          </p>
          <p className="text-[11px] text-slate-400">
            {activeStepData.english}
          </p>
        </div>

      </div>

      {/* Video Player Controls Bar */}
      <div className="px-5 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition shadow-md"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={() => {
              setCurrentStep(0);
              setProgressPercent(0);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Replay Video"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Video Scrubber & Timeline */}
        <div className="flex-1 flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400">
            0:0{currentStep + 1}
          </span>
          <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-100"
              style={{ width: `${((currentStep * 25) + (progressPercent * 0.25))}%` }}
            ></div>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            0:04
          </span>
        </div>

      </div>

    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-3 sm:p-6">
        <div className="min-h-full flex items-center justify-center py-6 sm:py-8">
          <div className="w-full max-w-4xl my-auto animate-in fade-in zoom-in-95 duration-150">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return content;
};
