import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import {
  ShieldCheck,
  CreditCard,
  Building,
  CheckCircle,
  Copy,
  Check,
  Lock,
  Globe,
  ArrowUpRight,
  Zap,
  TrendingUp,
  AlertCircle,
  Share2,
  ExternalLink
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const {
    currentUser,
    payoutSettings,
    updatePayoutSettings,
    realtimeTransactions,
    isProductionMode,
    setIsProductionMode,
    setIsDeploymentModalOpen
  } = usePortal();

  // Payout editable form state
  const [editBeneficiary, setEditBeneficiary] = useState(payoutSettings.beneficiaryName || 'ABBDULLAH');
  const [editAccountTitle, setEditAccountTitle] = useState(payoutSettings.accountTitle || 'ABBDULLAH');
  const [editBank, setEditBank] = useState(payoutSettings.bankName || 'Meezan Bank Limited');
  const [editCardDigits, setEditCardDigits] = useState(payoutSettings.rawCardDigits || '8821');
  const [editIban, setEditIban] = useState(payoutSettings.iban || 'PK36MEZN0001000992819201');
  const [editSwift, setEditSwift] = useState(payoutSettings.swiftBic || 'MEZNPKKA');
  const [editRaast, setEditRaast] = useState(payoutSettings.raastId || '+92 300 8821990');
  const [payoutSaveMsg, setPayoutSaveMsg] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const productionUrl = 'https://ais-pre-vodqxjnusr65svetuha5ua-887451232174.asia-east1.run.app';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(productionUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleSavePayoutSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = editCardDigits.replace(/\D/g, '').slice(-4) || '8821';
    updatePayoutSettings({
      beneficiaryName: editBeneficiary.trim() || 'ABBDULLAH',
      accountTitle: editAccountTitle.trim() || 'ABBDULLAH',
      bankName: editBank.trim() || 'Meezan Bank Limited',
      rawCardDigits: cleanDigits,
      cardNumberMasked: `4242 •••• •••• ${cleanDigits}`,
      iban: editIban.trim() || 'PK36MEZN0001000992819201',
      swiftBic: editSwift.trim() || 'MEZNPKKA',
      raastId: editRaast.trim() || '+92 300 8821990',
    });
    setPayoutSaveMsg('Aap ki Bank aur Debit Card payout details kamyabi se save ho gayi hain!');
    setTimeout(() => setPayoutSaveMsg(null), 4000);
  };

  const totalSettledPkr = realtimeTransactions.reduce((acc, t) => acc + (t.amountReceivedPkr || 0), 0) + (payoutSettings.totalEarningsReceivedPkr || 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-10 shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-emerald-500/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Executive Financial Gateway
              </span>
              <span className="text-xs text-slate-400">Account Owner: <strong className="text-white">ABBDULLAH</strong></span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Bank &amp; Debit Card Settlement Center
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Tamam website clients, international payments aur Pro plan subscriptions direct aap ke Meezan / Pakistani bank account aur debit card par receive hongi.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleCopyUrl}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
              title="Copy Cloud Run Live Link"
            >
              {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
              <span>{copiedUrl ? 'Copied Live URL!' : 'Share Live URL'}</span>
            </button>

            <button
              onClick={() => setIsDeploymentModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-900/30"
            >
              <Globe className="w-4 h-4" />
              <span>Production Live Hub</span>
            </button>
          </div>
        </div>

        {/* Global Financial Quick Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-slate-400 font-medium block">Total Remitted to Abdullah</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
              Rs. {totalSettledPkr.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct Bank Settlement</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-slate-400 font-medium block">Beneficiary &amp; Receiving Card</span>
            <div className="text-lg font-bold text-white mt-1 truncate">
              {payoutSettings.beneficiaryName}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {payoutSettings.cardNumberMasked}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-slate-400 font-medium block">Receiving Bank &amp; Currency</span>
            <div className="text-lg font-bold text-white mt-1 truncate">
              {payoutSettings.bankName}
            </div>
            <div className="text-[11px] text-indigo-300 mt-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-indigo-400" />
              <span>Auto-Deposit: Instant PKR</span>
            </div>
          </div>

        </div>

      </div>

      {/* Main Grid: Card Visual Preview & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Visual Platinum Debit Card Display */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                Receiving Debit Card (Virtual Replica)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                Live
              </span>
            </div>

            {/* Realistic Physical Debit Card */}
            <div className="w-full aspect-[1.586] rounded-2xl p-6 text-white bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-900 shadow-xl border border-slate-700/80 relative flex flex-col justify-between overflow-hidden">
              
              {/* Card glossy highlights */}
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>

              {/* Top row: Bank Name & Contactless */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-400" />
                  <span className="font-bold tracking-wider text-xs sm:text-sm uppercase text-slate-100">
                    {payoutSettings.bankName}
                  </span>
                </div>
                
                {/* Contactless symbol */}
                <div className="flex items-center gap-1 text-slate-400">
                  <svg className="w-5 h-5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                    <path d="M12 19a8.5 8.5 0 0 0 0-14" />
                    <path d="M15.5 21.5a12 12 0 0 0 0-19" />
                  </svg>
                </div>
              </div>

              {/* Middle row: Golden EMV Chip */}
              <div className="z-10 my-1">
                <div className="w-11 h-8 rounded-md bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 border border-amber-600/40 shadow-xs relative overflow-hidden">
                  <div className="absolute inset-x-0 top-1/2 h-px bg-amber-700/50"></div>
                  <div className="absolute inset-y-0 left-1/3 w-px bg-amber-700/50"></div>
                  <div className="absolute inset-y-0 right-1/3 w-px bg-amber-700/50"></div>
                </div>
              </div>

              {/* Card Number */}
              <div className="z-10">
                <div className="font-mono text-base sm:text-lg tracking-widest text-slate-100 font-bold drop-shadow-sm">
                  4242 •••• •••• {payoutSettings.rawCardDigits || '8821'}
                </div>
                <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono mt-1">
                  <span>VALID THRU: <strong>10/29</strong></span>
                  <span>STATUS: <strong className="text-emerald-400">DIRECT REMITTANCE</strong></span>
                </div>
              </div>

              {/* Bottom row: Cardholder Name & Brand Logo */}
              <div className="flex items-end justify-between z-10 pt-1">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">
                    Cardholder Name
                  </span>
                  <span className="font-extrabold tracking-wider text-sm sm:text-base uppercase text-white font-mono">
                    {payoutSettings.beneficiaryName}
                  </span>
                </div>

                {/* Visa & Mastercard dual emblem */}
                <div className="flex items-center -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-rose-500 opacity-90"></div>
                  <div className="w-7 h-7 rounded-full bg-amber-400 opacity-90"></div>
                </div>
              </div>

            </div>

            {/* Bank Security Notice Box */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Secure Payout Protection</span>
              </div>
              <p className="text-emerald-800 text-[11px] leading-relaxed">
                Paise receive karne ke liye sirf <strong>Bank Name, Account Title aur Card / IBAN Number</strong> ki zaroorat hoti hai. <strong>CVC / CVV code aur ATM PIN</strong> kabhi kisi ko na dein.
              </p>
            </div>

            {/* Quick Stats on Settlement */}
            <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Direct Auto-Deposit:</span>
                <span className="font-bold text-emerald-600">Enabled (Instant)</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Settlement Currency:</span>
                <span className="font-bold text-slate-900">Pakistani Rupee (PKR)</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>International Remittance:</span>
                <span className="font-bold text-slate-900">Supported (USD, EUR, GBP, AED)</span>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Card & Bank Configuration Form */}
        <div className="lg:col-span-7">
          
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Configure Receiving Bank &amp; Debit Card
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                In details ko update karein. Jo bi client website par invoice pay karega ya Pro Plan khareedega, wo direct is account me deposit hoga.
              </p>
            </div>

            {payoutSaveMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{payoutSaveMsg}</span>
              </div>
            )}

            <form onSubmit={handleSavePayoutSettings} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Beneficiary Name (Account Title)
                  </label>
                  <input
                    type="text"
                    required
                    value={editBeneficiary}
                    onChange={(e) => {
                      setEditBeneficiary(e.target.value);
                      setEditAccountTitle(e.target.value);
                    }}
                    placeholder="e.g. ABBDULLAH"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Card / Account par jo naam darj hai</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Receiving Bank Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editBank}
                    onChange={(e) => setEditBank(e.target.value)}
                    placeholder="e.g. Meezan Bank Limited, HBL, SadaPay"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Meezan, HBL, SadaPay, NayaPay, etc.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Debit Card (Front 16 Digits)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={editCardDigits}
                      onChange={(e) => setEditCardDigits(e.target.value)}
                      placeholder="e.g. 4242 8821 9920 8821"
                      className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Card ke samne likha 16-digit number</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Raast ID / Registered Mobile Number
                  </label>
                  <input
                    type="text"
                    value={editRaast}
                    onChange={(e) => setEditRaast(e.target.value)}
                    placeholder="e.g. +92 300 8821990"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Instant Raast settlement ke liye</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bank IBAN (24 Characters)
                </label>
                <input
                  type="text"
                  required
                  value={editIban}
                  onChange={(e) => setEditIban(e.target.value)}
                  placeholder="e.g. PK36MEZN0001000992819201"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-slate-900 uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Cheque book ya bank app par likha 24-character IBAN</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  SWIFT / BIC Code (For Overseas Clients)
                </label>
                <input
                  type="text"
                  value={editSwift}
                  onChange={(e) => setEditSwift(e.target.value)}
                  placeholder="e.g. MEZNPKKA"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-slate-900 uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">International client wire transfers ke liye</span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Save Receiving Card &amp; Bank Settings</span>
                </button>
              </div>

            </form>

          </div>

        </div>

      </div>

      {/* Live Payment Receipts & Remittance History */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Live Direct Card Deposit Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Jo payments clients card ya debit method se send karte hain wo yahan record hoti hain
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 self-start sm:self-auto">
            {realtimeTransactions.length} Settled Transactions
          </span>
        </div>

        {realtimeTransactions.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <CreditCard className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">No Payments Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Website live hai! Jaise hi koi client invoice pay karega ya koi user Pro Plan khareedega, uski payment direct aapke bank me transfer ho kar yahan show hogi.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">Sender Details</th>
                  <th className="py-3 px-4">Target Purpose</th>
                  <th className="py-3 px-4">Amount Deposited</th>
                  <th className="py-3 px-4">Settlement Beneficiary</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {realtimeTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {tx.transactionRef}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{tx.senderName}</div>
                      <div className="text-[11px] text-slate-400">{tx.senderEmail} ({tx.senderCountry})</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {tx.targetTitle}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-emerald-600">
                        Rs. {tx.amountReceivedPkr.toLocaleString()}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {tx.currencyPaid} {tx.amountPaid}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{tx.beneficiaryName}</div>
                      <div className="text-[11px] text-slate-500">{tx.beneficiaryBank}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Settled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Production & Cloud Run Deployment Card */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Cloud Run Production Live
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">Live Website URL</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono break-all">
              {productionUrl}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyUrl}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Copied' : 'Copy Link'}</span>
            </button>
            <a
              href={productionUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>Visit Live</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

    </div>
  );
};
