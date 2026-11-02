import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import {
  Rocket,
  Globe,
  ExternalLink,
  Copy,
  Check,
  X,
  Server,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  HelpCircle,
  Share2
} from 'lucide-react';

export const LiveDeploymentModal: React.FC = () => {
  const {
    isDeploymentModalOpen,
    setIsDeploymentModalOpen,
    isProductionMode,
    setIsProductionMode,
  } = usePortal();

  const [copiedLink, setCopiedLink] = useState(false);

  if (!isDeploymentModalOpen) return null;

  // The actual worldwide public URL of this application
  const liveSharedUrl = 'https://ais-pre-vodqxjnusr65svetuha5ua-887451232174.asia-east1.run.app';
  const devUrl = 'https://ais-dev-vodqxjnusr65svetuha5ua-887451232174.asia-east1.run.app';

  const handleCopy = () => {
    navigator.clipboard.writeText(liveSharedUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenLive = () => {
    window.open(liveSharedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 md:p-6">
      <div className="min-h-full flex items-center justify-center py-6 sm:py-8">
        <div className="relative bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
          
          {/* Sticky Header with Easy Touch Target Close Button */}
          <div className="sticky top-0 z-30 px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-bold shrink-0">
                <Rocket className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white truncate">
                    Live Production &amp; Sandbox Exit Hub
                  </h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.2 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Worldwide Live
                  </span>
                </div>
                <p className="text-xs text-slate-300 truncate">
                  Aapka project sandbox se bahar live cloud par active hai
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDeploymentModalOpen(false)}
              aria-label="Close"
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0 ml-3"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="overflow-y-auto p-5 sm:p-8 space-y-6 text-xs">
          
          {/* Status Box */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-emerald-950">
                Aapki Website Puri Dunya Mein Live Hai!
              </h4>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Yeh app Google Cloud Run par worldwide live host ho chuki hai. Koi bhi client Pakistan, USA, UK, UAE ya dunya ke kisi bhi konay se baghair kisi sandbox ya developer tool ke directly is public link par click kar ke website open kar sakta hai!
              </p>
            </div>
          </div>

          {/* Public Live URL Card */}
          <div className="space-y-2">
            <label className="block text-slate-700 font-bold text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-600" />
                Official Public Live Link (Share with Clients):
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Cloud Run Global Edge</span>
            </label>

            <div className="flex items-center gap-2">
              <div className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-mono text-[11px] text-slate-800 truncate select-all">
                {liveSharedUrl}
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition shrink-0 shadow-xs"
                title="Copy live link"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleOpenLive}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 shadow-xs"
                title="Open live website in a new window"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Live</span>
              </button>
            </div>
          </div>

          {/* Environment Mode Switcher */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <span>Active Environment Mode:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    isProductionMode
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {isProductionMode ? '🚀 Production Live Mode' : '🧪 Development Sandbox Mode'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isProductionMode
                  ? 'Falto test banners band hain, real-time live payment aur public access active hai.'
                  : 'Testing aur debugging ke liye sandbox markers on hain.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsProductionMode(!isProductionMode)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition border ${
                isProductionMode
                  ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                  : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
              }`}
            >
              {isProductionMode ? 'Switch to Test Mode' : 'Switch to Live Mode'}
            </button>
          </div>

          {/* Custom Domain & Permanent Self-Hosting Guide */}
          <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 bg-white">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              Apna Custom Domain (.com / .pk) Lagane Ka Tariqa:
            </h4>
            <p className="text-[11px] text-slate-500">
              Agar aap is project ko apni kisi private domain (jaise <strong>freelanceport.pk</strong> ya <strong>abdullah.com</strong>) par Vercel, Netlify ya Hostinger par chalana chahte hain:
            </p>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <span>
                  <strong>GitHub Export:</strong> Top menu se GitHub export karein ya repository ko push karein.
                </span>
              </div>

              <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <span>
                  <strong>Vercel / Netlify Deploy:</strong> Vercel par &ldquo;Import Git Repository&rdquo; karein, build command <code className="bg-white px-1 py-0.5 rounded border font-mono">npm run build</code> khud chal jayegi.
                </span>
              </div>

              <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <span>
                  <strong>Custom Domain Connect:</strong> Vercel Settings mein ja kar apna <code className="bg-white px-1 py-0.5 rounded border font-mono">freelanceport.pk</code> ya <code className="bg-white px-1 py-0.5 rounded border font-mono">.com</code> domain add karein aur DNS record update karein!
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              Direct Bank Settlement: <strong>ABBDULLAH</strong> (Meezan Bank)
            </span>
            <button
              onClick={() => setIsDeploymentModalOpen(false)}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
            >
              Close Hub
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
