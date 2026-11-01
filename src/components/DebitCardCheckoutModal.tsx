import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import {
  CreditCard,
  Lock,
  CheckCircle2,
  Building,
  ShieldCheck,
  X,
  Sparkles,
  ArrowRight,
  Printer,
  Download
} from 'lucide-react';
import { SubscriptionPlanId } from '../types';
import { SUBSCRIPTION_PLANS } from '../data/mockData';

export const DebitCardCheckoutModal: React.FC = () => {
  const {
    isDebitModalOpen,
    setIsDebitModalOpen,
    selectedPlanForPayment,
    processProPlanPayment,
    currentUser,
    currency
  } = usePortal();

  const [cardholderName, setCardholderName] = useState(currentUser?.name || 'Abdary (Admin)');
  const [cardNumber, setCardNumber] = useState('4242 8821 9910 5532');
  const [expiry, setExpiry] = useState('08/29');
  const [cvv, setCvv] = useState('721');
  const [bankName, setBankName] = useState('Meezan Bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<{
    transactionRef: string;
    amount: number;
    message: string;
  } | null>(null);

  if (!isDebitModalOpen) return null;

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanForPayment) || SUBSCRIPTION_PLANS[2];
  const price = plan.pricePkr;

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const result = await processProPlanPayment({
      planId: plan.id,
      cardholderName: cardholderName || 'Verified Cardholder',
      cardNumber: cardNumber || '4242 4242 4242 8821',
      expiry: expiry || '12/28',
      cvv: cvv || '882',
      bankName,
    });

    setIsProcessing(false);
    if (result.success) {
      setPaymentSuccess(result);
    }
  };

  const handleClose = () => {
    setPaymentSuccess(null);
    setIsDebitModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base flex items-center gap-2">
                Debit Card Direct Bank Remittance
              </h3>
              <p className="text-xs text-slate-300">
                Subscribe to {plan.name} Plan • Rs. {price.toLocaleString()} /mo
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation Screen */}
        {paymentSuccess ? (
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Payment Received in Bank
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 pt-1">
                Transaction Successful!
              </h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Rs. {price.toLocaleString()} has been received directly in your bank account via Debit Card. Pro plan features are now active!
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Ref:</span>
                <span className="font-mono font-bold text-indigo-600">{paymentSuccess.transactionRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank Destination:</span>
                <span className="font-semibold text-slate-800">{bankName} (Direct Debit)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cardholder:</span>
                <span className="font-semibold text-slate-800">{cardholderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subscription Plan:</span>
                <span className="font-bold text-indigo-700 uppercase">{plan.name} Plan</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
                <span>Amount Paid:</span>
                <span className="text-emerald-700">Rs. {price.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
              >
                Back to Workspace
              </button>
            </div>
          </div>
        ) : (
          /* Payment Input Form */
          <form onSubmit={handlePay} className="p-6 space-y-4 text-xs">
            
            {/* Bank Remittance Notice Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 flex items-start gap-2.5">
              <Building className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold">Direct Bank Remittance Notice:</span>
                <p className="mt-0.5">
                  Aap ka debit card payment direct aap ke Pakistani / International bank account mein receive ho ga. All Pakistani bank debit cards (Meezan, HBL, Allied, UBL, Alfalah, Standard Chartered) aur Visa/Mastercard accepted hain.
                </p>
              </div>
            </div>

            {/* Receiving Bank Select */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Receiving Bank
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Meezan Bank">Meezan Bank Ltd (Islamic Banking)</option>
                <option value="Habib Bank Limited (HBL)">Habib Bank Limited (HBL)</option>
                <option value="Allied Bank Limited (ABL)">Allied Bank Limited (ABL)</option>
                <option value="Bank Alfalah">Bank Alfalah</option>
                <option value="Standard Chartered">Standard Chartered Bank</option>
                <option value="International Visa/Mastercard">International Visa / Mastercard</option>
              </select>
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Cardholder Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Name printed on debit card"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Card Number */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Debit Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={19}
                  placeholder="4242 •••• •••• 8821"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500 tracking-wider"
                />
                <div className="absolute right-3 top-2.5 flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1 rounded">DEBIT</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-center focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  CVV / CVC
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  placeholder="•••"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-center focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Plan Price Summary */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500">Plan Selected:</span>
                <div className="font-bold text-slate-900">{plan.name} Tier Subscription</div>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px]">Monthly Charge:</span>
                <div className="text-base font-extrabold text-emerald-700">
                  Rs. {price.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                256-bit Bank Grade Encryption
              </span>
              <span>Instant Bank Confirmation</span>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg hover:shadow-indigo-500/25 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isProcessing ? (
                <span>Authorizing Debit Card with {bankName}...</span>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Authorize &amp; Pay Rs. {price.toLocaleString()}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
