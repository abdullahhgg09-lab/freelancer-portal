import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import {
  X,
  Database,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  ShieldAlert,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Code
} from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '../lib/supabase';

export const SupabaseGuideModal: React.FC = () => {
  const { isSupabaseGuideOpen, setIsSupabaseGuideOpen, supabaseConfig, saveSupabaseConfig } = usePortal();
  
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [urlInput, setUrlInput] = useState(supabaseConfig.url || '');
  const [keyInput, setKeyInput] = useState(supabaseConfig.anonKey || '');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'guide' | 'sql' | 'connect'>('guide');

  if (!isSupabaseGuideOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCopyEnv = () => {
    const envSnippet = `VITE_SUPABASE_URL="${urlInput || 'https://your-project-id.supabase.co'}"\nVITE_SUPABASE_ANON_KEY="${keyInput || 'your-supabase-anon-key'}"`;
    navigator.clipboard.writeText(envSnippet);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setStatusMessage(null);

    const result = await saveSupabaseConfig(urlInput.trim(), keyInput.trim());
    setIsTesting(false);
    setStatusMessage({
      text: result.message,
      isError: !result.success,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 md:p-6">
      <div className="min-h-full flex items-center justify-center py-6 sm:py-8">
        <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
          
          {/* Modal Sticky Header */}
          <div className="sticky top-0 z-30 px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 truncate">
                  Supabase Database Setup Guide
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                    PostgreSQL
                  </span>
                </h2>
                <p className="text-xs text-slate-300 truncate">
                  Supabase database connect karne ka aasan aur mukammal tareeqa (Urdu &amp; English)
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsSupabaseGuideOpen(false)}
              aria-label="Close"
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0 ml-3"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Tab Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Step-by-Step Tariqa (Guide)
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            PostgreSQL SQL Schema (Ready to Run)
          </button>
          <button
            onClick={() => setActiveTab('connect')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'connect'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Live Credentials & Test Connection
          </button>
        </div>

        {/* Body content based on tab */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {activeTab === 'guide' && (
            <div className="space-y-4">
              
              {/* Highlight Card */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <span className="font-bold">Portal operates with dual-mode storage:</span>
                  <p className="mt-1">
                    Yeh app abhi bhi bina kisi configuration ke local storage aur sample realistic data ke saath 100% operational hai. Lekin agar aap cloud Supabase database connect karna chahte hain, toh neeche diye gaye 4 aasan steps follow karein:
                  </p>
                </div>
              </div>

              {/* Steps timeline */}
              <div className="space-y-4">
                
                {/* Step 1 */}
                <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      Supabase par Free Account & Project Banayein
                      <a
                        href="https://supabase.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-normal"
                      >
                        Open supabase.com <ExternalLink className="w-3 h-3" />
                      </a>
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      1. <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">supabase.com</code> par sign in ya free account banayein.<br />
                      2. Dashboard mein <strong>"New Project"</strong> par click karein.<br />
                      3. Project ka naam (e.g. <em>Freelancer-Portal</em>) aur secure database password set karein.<br />
                      4. Region mein <em>Singapore</em> ya <em>Frankfurt</em> select karein (Asia/Pakistan ke liye fast latency) aur <strong>Create Project</strong> dabayein.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm">
                      SQL Editor mein Database Schema Run Karein
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      1. Supabase project open hone ke baad left sidebar mein <strong>"SQL Editor"</strong> icon par click karein.<br />
                      2. <strong>"+ New Query"</strong> par click karein.<br />
                      3. Is modal ke dusre tab <strong>"PostgreSQL SQL Schema"</strong> se poora code copy karein.<br />
                      4. Supabase SQL Editor mein paste karein aur green <strong>Run (Ctrl+Enter)</strong> button dabayein. Is se aap ki saari tables (Users, Projects, Invoices, Tasks, Files, Messages, Logs) create ho jayengi.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm">
                      API Credentials (URL & Anon Key) Hasil Karein
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      1. Supabase dashboard ke bottom-left par <strong>Project Settings (Gear icon)</strong> par click karein.<br />
                      2. <strong>"API"</strong> section par click karein.<br />
                      3. Wahan se <strong>Project URL</strong> (e.g. <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">https://xyzcompany.supabase.co</code>) copy karein.<br />
                      4. Aur <strong>Project API Keys</strong> mein se <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">anon / public</code> key copy karein.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm">
                      Credentials Portal Mein Paste Karein
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Neeche diye gaye <strong>"Live Credentials & Test Connection"</strong> tab par jayein aur apna URL aur Anon key daal kar <strong>Save & Test</strong> dabayein!
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">PostgreSQL Schema DDL</h3>
                  <p className="text-[11px] text-slate-500">
                    Copy and run in Supabase SQL editor. Includes all tables, enums, relationships, indexes, and initial admin record.
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Schema'}</span>
                </button>
              </div>

              <div className="relative rounded-xl bg-slate-950 p-4 border border-slate-800 text-slate-200 font-mono text-[11px] max-h-96 overflow-y-auto">
                <pre>{SUPABASE_SQL_SCHEMA}</pre>
              </div>
            </div>
          )}

          {activeTab === 'connect' && (
            <form onSubmit={handleTestAndSave} className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
                Aap ke Supabase credentials local browser storage mein securely save honge aur app live database queries sync karegi.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://your-project-id.supabase.co"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Project Settings &gt; API &gt; Project API Keys &gt; anon public
                </p>
              </div>

              {statusMessage && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    statusMessage.isError
                      ? 'bg-rose-50 border border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  }`}
                >
                  {statusMessage.isError ? (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleCopyEnv}
                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy as .env format</span>
                </button>

                <button
                  type="submit"
                  disabled={isTesting}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm hover:shadow transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isTesting ? (
                    <span>Verifying connection...</span>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Test & Save Connection</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span
              className={`w-2 h-2 rounded-full ${
                supabaseConfig.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            ></span>
            <span>
              Status:{' '}
              <strong>{supabaseConfig.isConnected ? 'Supabase Linked' : 'Running on Interactive Local Engine'}</strong>
            </span>
          </div>

          <button
            onClick={() => setIsSupabaseGuideOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  </div>
  );
};
