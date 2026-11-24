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
  FlaskConical,
  RotateCcw
} from 'lucide-react';

export const LiveDeploymentModal: React.FC = () => {
  const {
    isDeploymentModalOpen,
    setIsDeploymentModalOpen,
    isProductionMode,
    setIsProductionMode,
    resetSandboxData,
  } = usePortal();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDevLink, setCopiedDevLink] = useState(false);
  const [copiedHtaccess, setCopiedHtaccess] = useState(false);
  const [sandboxCleared, setSandboxCleared] = useState(false);
  const [activeTab, setActiveTab] = useState<'infinity-redirect' | 'infinity-upload' | 'custom-domain'>('infinity-redirect');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDeploymentModalOpen) {
        setIsDeploymentModalOpen(false);
      }
    };
    if (isDeploymentModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDeploymentModalOpen, setIsDeploymentModalOpen]);

  if (!isDeploymentModalOpen) return null;

  // The actual worldwide public URL of this application
  const liveSharedUrl = 'https://ais-pre-vodqxjnusr65svetuha5ua-887451232174.asia-east1.run.app';
  const devUrl = 'https://ais-dev-vodqxjnusr65svetuha5ua-887451232174.asia-east1.run.app';

  const htaccessCode = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(liveSharedUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyHtaccess = () => {
    navigator.clipboard.writeText(htaccessCode);
    setCopiedHtaccess(true);
    setTimeout(() => setCopiedHtaccess(false), 2500);
  };

  const handleCopyDev = () => {
    navigator.clipboard.writeText(devUrl);
    setCopiedDevLink(true);
    setTimeout(() => setCopiedDevLink(false), 2500);
  };

  const handleOpenLive = () => {
    window.open(isProductionMode ? liveSharedUrl : devUrl, '_blank', 'noopener,noreferrer');
  };

  const handleResetSandbox = async () => {
    await resetSandboxData();
    setSandboxCleared(true);
    setTimeout(() => setSandboxCleared(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 md:p-6">
      <div className="min-h-full flex items-center justify-center py-6 sm:py-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="deployment-modal-title"
          className="relative bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Sticky Header */}
          <div className="sticky top-0 z-30 px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                isProductionMode
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
              }`}>
                {isProductionMode ? <Rocket className="w-5 h-5" /> : <FlaskConical className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 id="deployment-modal-title" className="font-display font-bold text-sm sm:text-base tracking-tight text-white truncate">
                    {isProductionMode ? 'Live Production Environment' : 'Sandbox Testing Environment'}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 truncate">
                  {isProductionMode
                    ? 'Live cloud mode active for client access'
                    : 'Isolated sandbox mode active — safe testing without live charges'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsDeploymentModalOpen(false)}
              aria-label="Close Environment Modal"
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0 ml-3"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="overflow-y-auto p-5 sm:p-8 space-y-6 text-xs">
            {/* Environment Status Box */}
            <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
              isProductionMode
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              {isProductionMode ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <FlaskConical className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h4 className="font-display font-bold text-sm">
                  {isProductionMode
                    ? 'Aapki Website Production Live Mode Mein Hai'
                    : 'Aapki Website Ab Sandbox Mode Mein Hai!'}
                </h4>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {isProductionMode
                    ? 'Clients live URL par ja kar projects, real-time chat aur payouts use kar sakte hain.'
                    : 'Sandbox mode mein aap client briefs, project chat rooms aur simulated debit card payments (SBX-* reference) bilkul safely test kar sakte hain aur ek click par test data reset kar sakte hain.'}
                </p>
              </div>
            </div>

            {/* Sandbox URL + Public URL */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-amber-600" />
                    Development Sandbox URL (Safe Testing):
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Isolated Dev Container</span>
                </label>

                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-mono text-[11px] text-slate-800 truncate select-all">
                    {devUrl}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyDev}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                  >
                    {copiedDevLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDevLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    Shared Public URL (For Clients):
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
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                    title="Copy public link"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-300" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenLive}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                    title="Open in a new window"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Environment Mode Switcher & Sandbox Reset */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <span>Active Environment Mode:</span>
                  <span className={`font-semibold ${isProductionMode ? 'text-emerald-700' : 'text-amber-800'}`}>
                    {isProductionMode ? 'Production Live' : 'Development Sandbox'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isProductionMode
                    ? 'Live transactions active (TXN-*) for production clients.'
                    : 'Sandbox transactions active (SBX-*) with safe test card & reset button.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {!isProductionMode && (
                  <button
                    type="button"
                    onClick={handleResetSandbox}
                    className="px-3 py-1.5 rounded-xl font-semibold text-xs border border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-900 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{sandboxCleared ? 'Reset Done!' : 'Reset Test Data'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsProductionMode(!isProductionMode)}
                  className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs transition border cursor-pointer ${
                    isProductionMode
                      ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                      : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isProductionMode ? 'Enter Sandbox Mode' : 'Switch to Live Mode'}
                </button>
              </div>
            </div>

          {/* InfinityFree & Custom Domain Integration Hub */}
          <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 bg-white shadow-xs">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  InfinityFree Domain &amp; Hosting Connection Center
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  InfinityFree se li hui domain ko is website ke sath connect karne ke 2 aasaan tareeqay:
                </p>
              </div>

              {/* Method Switcher Tabs */}
              <div role="tablist" aria-label="Domain connection methods" className="flex bg-slate-100 p-1 rounded-xl text-[11px] font-semibold shrink-0">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'infinity-redirect'}
                  onClick={() => setActiveTab('infinity-redirect')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    activeTab === 'infinity-redirect'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⚡ Method 1: 1-Click Redirect (Fastest)
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'infinity-upload'}
                  onClick={() => setActiveTab('infinity-upload')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    activeTab === 'infinity-upload'
                      ? 'bg-white text-emerald-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📁 Method 2: htdocs Upload
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'custom-domain'}
                  onClick={() => setActiveTab('custom-domain')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    activeTab === 'custom-domain'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌐 Custom .PK/.COM
                </button>
              </div>
            </div>

            {/* TAB 1: 1-Click Redirect (Recommended) */}
            {activeTab === 'infinity-redirect' && (
              <div className="space-y-3 animate-in fade-in text-[11px]">
                <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-900">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-xs">
                    <Rocket className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Sub se Aasaan aur Best Tareeqa (Recommended):</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-indigo-800">
                    Kyun ke aapki website pehle se hi high-speed Google Cloud Run par live chal rahi hai, aap InfinityFree ke Control Panel me sirf 1 click me <strong>Redirect</strong> set kar sakte hain. Koi files upload karne ki zaroorat nahi paregi aur Google ki super-fast speed milegi!
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <div className="space-y-0.5">
                      <strong className="text-slate-800">InfinityFree cPanel me Login karein:</strong>
                      <p className="text-slate-600">
                        Apne InfinityFree account me jayein aur <strong>Control Panel (vPanel)</strong> open karein.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <div className="space-y-0.5">
                      <strong className="text-slate-800">&ldquo;Redirects&rdquo; Option par Click karein:</strong>
                      <p className="text-slate-600">
                        cPanel ke <strong>&ldquo;Domains&rdquo;</strong> section me jayein aur <strong>&ldquo;Redirects&rdquo;</strong> icon par click karein.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      3
                    </span>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <strong className="text-slate-800">Yeh Cloud Run Live Link Paste karein:</strong>
                      <p className="text-slate-600">
                        Dropdown me apni InfinityFree domain choose karein aur <strong>&ldquo;Redirects To&rdquo;</strong> box me yeh link paste karein:
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-[10px] truncate flex-1 select-all">
                          {liveSharedUrl}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          {copiedLink ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      4
                    </span>
                    <div className="space-y-0.5">
                      <strong className="text-slate-800">&ldquo;Add&rdquo; Button Dabayen:</strong>
                      <p className="text-slate-600">
                        Jaise hi aap Add dabayein ge, jab bhi koi aap ki InfinityFree domain kholega, wo foran is Google Cloud Run website par open ho jayegi!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Upload to htdocs */}
            {activeTab === 'infinity-upload' && (
              <div className="space-y-3 animate-in fade-in text-[11px]">
                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-xs">
                    <Server className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Direct Files Upload (Agar InfinityFree Hosting par rakhna hai):</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-800">
                    Aap is website ki compiled files (<code className="bg-white px-1 py-0.5 rounded border font-mono">dist</code> folder) ko direct InfinityFree ke <strong>htdocs</strong> folder me upload kar ke host kar sakte hain.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <div className="space-y-0.5">
                      <strong className="text-slate-800">Production Build Ready:</strong>
                      <p className="text-slate-600">
                        Project me <code className="font-mono bg-white px-1 border rounded">dist/index.html</code>, <code className="font-mono bg-white px-1 border rounded">dist/assets</code> aur <code className="font-mono bg-white px-1 border rounded">dist/.htaccess</code> pehle se generate ho chuki hain.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <div className="space-y-0.5">
                      <strong className="text-slate-800">InfinityFree &ldquo;Online File Manager&rdquo; Kholein:</strong>
                      <p className="text-slate-600">
                        InfinityFree cPanel me ja kar <strong>File Manager</strong> open karein aur <strong>htdocs</strong> folder ke andar jayein. Default sample files (<code className="font-mono text-slate-500">index2.html</code>) delete kar dein.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      3
                    </span>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <strong className="text-slate-800">Apache .htaccess File (For Single Page App Routing):</strong>
                      <p className="text-slate-600">
                        React apps ke liye page refresh 404 error se bachne ke liye <code className="font-mono bg-white px-1 border rounded">.htaccess</code> zaroori hota hai:
                      </p>
                      <div className="relative">
                        <pre className="p-2.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-[10px] overflow-x-auto leading-relaxed">
                          {htaccessCode}
                        </pre>
                        <button
                          type="button"
                          onClick={handleCopyHtaccess}
                          className="absolute right-2 top-2 px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          {copiedHtaccess ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedHtaccess ? 'Copied!' : 'Copy Code'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      4
                    </span>
                    <div className="space-y-0.5">
                      <strong className="text-slate-800">Upload &amp; Enjoy:</strong>
                      <p className="text-slate-600">
                        Files upload hone ke baad aapki InfinityFree domain foran live chal paregi!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Custom Domain .COM / .PK */}
            {activeTab === 'custom-domain' && (
              <div className="space-y-3 animate-in fade-in text-[11px]">
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-900">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Professional Custom Domain (.com / .pk / freelanceport.pk):</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Agar aapne PKNIC ya GoDaddy/Namecheap se apni private domain khareedi hai, to aap use Cloudflare ya Vercel par connect kar sakte hain:
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <span>
                      <strong>Vercel / Cloudflare:</strong> Free Vercel ya Cloudflare account me apni domain add karein.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <span>
                      <strong>DNS CNAME Record:</strong> Apne registrar me CNAME point karein. Free SSL certificate khud ba khud activate ho jata hai!
                    </span>
                  </div>
                </div>
              </div>
            )}

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
