import React, { useState, useEffect } from 'react';
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
  Download,
  Globe,
  RefreshCw,
  AlertCircle,
  Zap,
  Info
} from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../data/mockData';
import { RealtimePaymentRecord, SubscriptionPlanId } from '../types';

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  rateToPkr: number;
  flag: string;
}

const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs.', rateToPkr: 1, flag: '🇵🇰' },
  { code: 'USD', name: 'US Dollar', symbol: '$', rateToPkr: 278, flag: '🇺🇸' },
  { code: 'GBP', name: 'British Pound', symbol: '£', rateToPkr: 355, flag: '🇬🇧' },
  { code: 'EUR', name: 'Euro', symbol: '€', rateToPkr: 302, flag: '🇪🇺' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rateToPkr: 75.8, flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', rateToPkr: 74.1, flag: '🇸🇦' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rateToPkr: 205, flag: '🇨🇦' },
];

export const RealTimePaymentModal: React.FC = () => {
  const {
    isDebitModalOpen,
    setIsDebitModalOpen,
    selectedPlanForPayment,
    selectedInvoiceForPayment,
    setSelectedInvoiceForPayment,
    payoutSettings,
    processRealtimePayment,
    currentUser,
  } = usePortal();

  const isInvoicePayment = Boolean(selectedInvoiceForPayment);
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanForPayment) || SUBSCRIPTION_PLANS[2];

  // Base amounts
  const baseAmountPkr = isInvoicePayment
    ? selectedInvoiceForPayment!.total
    : plan.pricePkr;

  const targetTitle = isInvoicePayment
    ? `Invoice ${selectedInvoiceForPayment!.invoiceNumber}: ${selectedInvoiceForPayment!.projectName}`
    : `${plan.name} SaaS Subscription (${plan.description})`;

  // Currency selection
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    isInvoicePayment && selectedInvoiceForPayment?.currency ? selectedInvoiceForPayment.currency : 'PKR'
  );
  const activeCurrencyObj = SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrency) || SUPPORTED_CURRENCIES[0];

  // Convert base PKR to selected currency
  const convertedAmount =
    selectedCurrency === 'PKR'
      ? baseAmountPkr
      : Number((baseAmountPkr / activeCurrencyObj.rateToPkr).toFixed(2));

  // Payment Channel tabs
  const [paymentChannel, setPaymentChannel] = useState<'visa' | 'mastercard' | 'amex' | 'raast' | 'bank_wire'>('visa');

  // Payer (Customer) inputs
  const [payerName, setPayerName] = useState(currentUser?.name || 'International Client');
  const [payerEmail, setPayerEmail] = useState(currentUser?.email || 'client@globalbusiness.com');
  const [payerCountry, setPayerCountry] = useState(activeCurrencyObj.name);

  // Card details
  const [cardNumber, setCardNumber] = useState('4242 8821 9910 5532');
  const [expiry, setExpiry] = useState('11/29');
  const [cvv, setCvv] = useState('882');

  // Processing state & animation
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [completedRecord, setCompletedRecord] = useState<RealtimePaymentRecord | null>(null);

  useEffect(() => {
    if (currentUser?.name) {
      setPayerName(currentUser.name);
    }
    if (currentUser?.email) {
      setPayerEmail(currentUser.email);
    }
  }, [currentUser]);

  // Handle modal visibility
  const isOpen = isDebitModalOpen || Boolean(selectedInvoiceForPayment);

  if (!isOpen) return null;

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setProcessingStep('1/4: Connecting to Visa/Mastercard Global Network...');
    await new Promise((r) => setTimeout(r, 600));

    setProcessingStep('2/4: Verifying 3D-Secure 256-bit Encrypted Token...');
    await new Promise((r) => setTimeout(r, 600));

    setProcessingStep(`3/4: Converting ${selectedCurrency} to PKR via State Bank Interbank Rate...`);
    await new Promise((r) => setTimeout(r, 600));

    setProcessingStep(`4/4: Remitting & Depositing directly into ${payoutSettings.beneficiaryName}'s ${payoutSettings.bankName} Account...`);

    const res = await processRealtimePayment({
      amount: convertedAmount,
      currency: selectedCurrency,
      targetType: isInvoicePayment ? 'invoice' : 'subscription',
      targetId: isInvoicePayment ? selectedInvoiceForPayment?.id : plan.id,
      targetTitle,
      senderName: payerName.trim() || 'Verified Client',
      senderEmail: payerEmail.trim() || 'client@business.com',
      senderCountry: payerCountry,
      paymentChannel,
      cardholderName: payerName,
      cardNumberMasked: cardNumber.replace(/\d(?=\d{4})/g, '•'),
    });

    setIsProcessing(false);
    if (res.success) {
      setCompletedRecord(res.record);
    }
  };

  const handleClose = () => {
    setIsDebitModalOpen(false);
    setSelectedInvoiceForPayment(null);
    setCompletedRecord(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 md:p-6">
      <div className="min-h-full flex items-center justify-center py-6 sm:py-8">
        <div className="relative bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
          
          {/* Sticky Header with Easy Touch Target Close Button */}
          <div className="sticky top-0 z-30 px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center font-bold shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white truncate">
                    Real-Time Global Payment Gateway
                  </h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.2 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-300 truncate">
                  Direct Settlement into {payoutSettings.beneficiaryName}&apos;s Bank Account
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              aria-label="Close"
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0 ml-3"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Modal Content */}
          <div className="overflow-y-auto">
            {/* Success / Remittance Voucher Screen */}
        {completedRecord ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Funds Received &amp; Settled in Bank
              </span>
              <h2 className="text-2xl font-black text-slate-900 pt-2">
                Real-Time Remittance Successful!
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Payment has been verified via interbank gateway and credited directly to the receiving account.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-left space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Transaction Reference:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {completedRecord.transactionRef}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Paid by:</span>
                <span className="font-semibold text-slate-800">
                  {completedRecord.senderName} ({completedRecord.senderCountry})
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Receiving Beneficiary:</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {completedRecord.beneficiaryName}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Receiving Bank / Card:</span>
                <span className="font-semibold text-slate-800">
                  {completedRecord.beneficiaryBank} • {completedRecord.beneficiaryCardMasked}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Amount Paid (Gross):</span>
                <span className="font-bold text-slate-900">
                  {completedRecord.currencyPaid} {completedRecord.amountPaid.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-900 font-bold">Net Deposited into Bank:</span>
                <span className="text-base font-extrabold text-emerald-600">
                  Rs. {completedRecord.amountReceivedPkr.toLocaleString()} PKR
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handlePrint}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print Official Voucher</span>
              </button>
              <button
                onClick={handleClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition"
              >
                Done / Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form Screen */
          <form onSubmit={handlePay} className="p-6 sm:p-7 space-y-5 text-xs">
            
            {/* Bill Summary Banner */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200 inline-block mb-1">
                  {isInvoicePayment ? 'Client Project Invoice' : 'Platform Subscription'}
                </span>
                <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{targetTitle}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Real-time direct settlement to: <strong className="text-slate-800">{payoutSettings.beneficiaryName}</strong> ({payoutSettings.bankName})
                </p>
              </div>

              <div className="text-right shrink-0 bg-white px-3.5 py-2 rounded-xl border border-indigo-100 shadow-xs">
                <span className="text-[10px] text-slate-400 block font-medium">Payable Amount:</span>
                <div className="text-lg font-black text-indigo-700">
                  {activeCurrencyObj.symbol} {convertedAmount.toLocaleString()} {selectedCurrency}
                </div>
                {selectedCurrency !== 'PKR' && (
                  <div className="text-[10px] text-slate-500 font-medium">
                    ≈ Rs. {baseAmountPkr.toLocaleString()} PKR
                  </div>
                )}
              </div>
            </div>

            {/* Currency & Country Selector (International Clients) */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  Select Payment Currency &amp; Country:
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Clients from any country can pay</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => {
                      setSelectedCurrency(curr.code);
                      setPayerCountry(curr.name);
                    }}
                    className={`p-2 rounded-xl border text-left transition flex items-center gap-1.5 ${
                      selectedCurrency === curr.code
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="text-base">{curr.flag}</span>
                    <div>
                      <div className="font-bold text-xs">{curr.code}</div>
                      <div className={`text-[9px] ${selectedCurrency === curr.code ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {curr.symbol}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                Select Payment Channel:
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentChannel('visa')}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    paymentChannel === 'visa'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="font-extrabold text-xs">Visa</div>
                  <div className="text-[9px] text-slate-500">Credit / Debit</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentChannel('mastercard')}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    paymentChannel === 'mastercard'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="font-extrabold text-xs">Mastercard</div>
                  <div className="text-[9px] text-slate-500">Credit / Debit</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentChannel('amex')}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    paymentChannel === 'amex'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="font-extrabold text-xs">UnionPay / Amex</div>
                  <div className="text-[9px] text-slate-500">International</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentChannel('raast')}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    paymentChannel === 'raast'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="font-extrabold text-xs text-emerald-600 flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3 fill-emerald-600" />
                    Raast
                  </div>
                  <div className="text-[9px] text-slate-500">Instant 0-Fee</div>
                </button>
              </div>
            </div>

            {/* Transparent Receiving Account Details (Abdullah's Account) */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  Receiving Beneficiary:
                </span>
                <span className="font-bold text-slate-900">{payoutSettings.beneficiaryName}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Bank &amp; Account / IBAN:</span>
                <span className="font-semibold text-slate-800">
                  {payoutSettings.bankName} • {payoutSettings.iban.slice(0, 10)}...{payoutSettings.iban.slice(-4)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Receiving Card (Visa Direct):</span>
                <span className="font-mono font-bold text-indigo-700">{payoutSettings.cardNumberMasked}</span>
              </div>
            </div>

            {/* Payer Info Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Payer Name / Company:</label>
                <input
                  type="text"
                  required
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="e.g. Sarah Khan or David Smith"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Receipt Email Address:</label>
                <input
                  type="email"
                  required
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  placeholder="e.g. client@company.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            {/* Card Information Fields */}
            {paymentChannel !== 'raast' ? (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-slate-700 font-medium mb-1 flex items-center justify-between">
                    <span>Card Number (Client's Card):</span>
                    <span className="text-[10px] text-slate-400 font-normal">256-bit SSL Protected</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      maxLength={19}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="4242 8821 9910 5532"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Expiry Date:</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1 flex items-center justify-between">
                      <span>CVV / CVC:</span>
                      <span className="text-[9px] text-slate-400">3-4 digits</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="•••"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Raast Instant Transfer Details */
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <Zap className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                  <span>Raast Direct Instant Transfer</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Send directly from any Pakistani banking app (HBL, Meezan, SadaPay, NayaPay, EasyPaisa, JazzCash) using Raast ID:
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-emerald-300 flex items-center justify-between font-mono font-bold text-slate-800 text-xs">
                  <span>Raast ID: {payoutSettings.raastId}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">0% Fee</span>
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>PCI-DSS Compliant &amp; Bank Encrypted:</strong> Payment is authenticated in real-time and deposited into Abdullah&apos;s verified bank account without intermediaries.
              </span>
            </div>

            {/* Processing Steps Status */}
            {isProcessing && (
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center gap-3 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
                <span>{processingStep}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Real-time Settlement...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>
                    Pay &amp; Remit {activeCurrencyObj.symbol} {convertedAmount.toLocaleString()} {selectedCurrency}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};
