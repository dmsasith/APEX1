import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Check,
  ShieldCheck,
  Clock,
  Zap,
  Building,
  Calendar,
  X,
  QrCode,
  Building2,
  Upload,
  CheckCircle2,
  Copy,
  RefreshCw,
  Printer,
  FileText,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatDateTime, formatDate } from '../../utils/exportUtils';
import { EmailVerificationModal } from '../auth/EmailVerificationModal';
import { PrintableDocumentModal } from '../common/PrintableDocumentModal';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const { currentTenant, updateTenantSubscription, config } = useStock();

  // Retrieve global master owner bank config (synced across all tenants)
  const masterBankConfig = (() => {
    try {
      const raw = localStorage.getItem('apex_master_bank_config_v1');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const activeBankName = config?.bankName || masterBankConfig?.bankName || 'Commercial Bank PLC / Sampath Bank';
  const activeBankAccountName = config?.bankAccountName || masterBankConfig?.bankAccountName || 'Apex Developer (Pvt) Ltd';
  const activeBankAccountNumber = config?.bankAccountNumber || masterBankConfig?.bankAccountNumber || '1000 4829 5012';
  const activeBankBranchSwift = config?.bankBranchSwift || masterBankConfig?.bankBranchSwift || 'Mulleriyawa Branch / CCBLLKLX';
  const activeBankQrImage = config?.bankQrImage || masterBankConfig?.bankQrImage || '';

  const [usdRate, setUsdRate] = useState<number>(
    config?.usdToLkrRate || masterBankConfig?.usdToLkrRate || 332.64
  );
  const [isLiveRate, setIsLiveRate] = useState<boolean>(false);

  // Auto-fetch real-time USD to LKR Exchange Rate
  useEffect(() => {
    let isMounted = true;
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.result === 'success' && data?.rates?.LKR) {
          const fetchedRate = parseFloat(data.rates.LKR.toFixed(2));
          setUsdRate(fetchedRate);
          setIsLiveRate(true);
          try {
            const raw = localStorage.getItem('apex_master_bank_config_v1');
            const existing = raw ? JSON.parse(raw) : {};
            localStorage.setItem(
              'apex_master_bank_config_v1',
              JSON.stringify({ ...existing, usdToLkrRate: fetchedRate })
            );
          } catch (e) {
            console.warn('Failed to store live rate in localStorage:', e);
          }
        }
      })
      .catch((err) => {
        console.warn('Auto USD/LKR exchange rate fetch failed, using stored rate:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const monthlyLkr = Math.round(19.90 * usdRate);
  const annualLkr = Math.round(189.00 * usdRate);

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    currentTenant?.subscription?.billingCycle || 'annual'
  );
  const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);
  const [showPrintableInvoice, setShowPrintableInvoice] = useState(false);

  // Bank Transfer Form State
  const [txnRef, setTxnRef] = useState('');
  const [bankNotes, setBankNotes] = useState('');
  const [slipFileName, setSlipFileName] = useState('');
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [submittedBankSlip, setSubmittedBankSlip] = useState(false);

  if (!isOpen || !currentTenant) return null;

  const sub = currentTenant.subscription;
  const isTrial = sub.plan === 'free_trial' || sub.status === 'trialing';

  // Calculate days remaining
  const trialEndDate = new Date(sub.trialEndsAt);
  const now = new Date();
  const diffMs = trialEndDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const isAnnual = billingCycle === 'annual';

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyNotice(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopyNotice(null), 2500);
  };

  const handleSubmitBankPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txnRef.trim()) return;

    updateTenantSubscription(currentTenant.id, {
      pendingBankPayment: {
        submittedAt: new Date().toISOString(),
        referenceNo: txnRef.trim(),
        amount: isAnnual ? 189.00 : 19.90,
        billingCycle: billingCycle,
        notes: bankNotes.trim(),
        slipName: slipFileName || 'Bank_Transfer_Slip.pdf',
        status: 'pending',
      },
    });

    setSubmittedBankSlip(true);
    setTimeout(() => {
      setSubmittedBankSlip(false);
      onClose();
    }, 2500);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="relative bg-slate-900 text-white p-4 pb-4 border-b border-slate-800 shrink-0">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 uppercase tracking-wider">
                <Zap className="w-2.5 h-2.5 text-emerald-400" />
                <span>SaaS Pro</span>
              </span>
              <span className="text-[10px] text-slate-400">Workspace: {currentTenant.companyName}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-black tracking-tight text-white">
                {isTrial ? 'Pro Trial Active' : 'Pro Multi-Site'}
              </h2>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrintableInvoice(true)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer text-[10px]"
                  title="Print Official SaaS Subscription Invoice & Tax Receipt"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Invoice & Receipt</span>
                </button>

                {currentTenant.emailVerified ? (
                  <span className="px-2 py-0.5 bg-emerald-900/50 text-emerald-300 border border-emerald-700/50 rounded-lg font-bold flex items-center gap-1 text-[10px]">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Verified ✓
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowEmailVerifyModal(true)}
                    className="px-2 py-0.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/60 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer text-[10px]"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Verify Email
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
              {isTrial && (
                <span className="bg-slate-800 rounded px-1.5 py-0.5">
                  <strong className="text-amber-400">{daysRemaining}d</strong> trial remaining
                </span>
              )}
              <span className="bg-slate-800 rounded px-1.5 py-0.5">
                Renews: {formatDateTime(sub.trialEndsAt)}
              </span>
            </div>
          </div>

          {/* Body Container */}
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {/* Active Subscription Status Card & Queued Package Banner */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400">ACTIVE SUBSCRIPTION STATUS</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 uppercase">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>{sub.status === 'active' ? 'ACTIVE PRO' : 'TRIAL ACTIVE'}</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800">
                <div>
                  <div className="text-base font-black text-white">
                    {sub.plan === 'pro_annual'
                      ? 'Pro Annual Plan ($189.00/yr)'
                      : sub.plan === 'pro_monthly'
                      ? 'Pro Monthly Plan ($19.90/mo)'
                      : '7-Day Free Trial'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Tenant Workspace: <span className="font-mono text-emerald-400 font-bold">{currentTenant.companyName} ({currentTenant.slug.toUpperCase()})</span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="text-sm font-black text-amber-400 flex items-center sm:justify-end gap-1">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>{daysRemaining} Days Remaining</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Plan Expiry Date: {formatDate(sub.trialEndsAt || sub.nextBillingDate || '')}
                  </div>
                </div>
              </div>

              {sub.queuedSubscription && (
                <div className="mt-3 p-3 bg-slate-800/90 border border-amber-500/40 rounded-xl flex items-center gap-2 text-xs text-amber-200 animate-in fade-in">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <strong className="text-amber-300 font-bold">Upcoming Package Queued:</strong>{' '}
                    <strong className="text-white">
                      {sub.queuedSubscription.plan === 'pro_annual' ? 'Pro Annual Plan ($189.00/yr)' : 'Pro Monthly Plan ($19.90/mo)'}
                    </strong>{' '}
                    will automatically activate on{' '}
                    <strong className="text-emerald-300">{formatDate(sub.queuedSubscription.scheduledStartDate)}</strong> when current package finishes.
                  </div>
                </div>
              )}
            </div>
            {submittedBankSlip && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong>Bank Payment Slip Submitted!</strong> Master Admin will review your transaction ref <strong className="font-mono">{txnRef}</strong> and activate your subscription shortly.
                </div>
              </div>
            )}

            {copyNotice && (
              <div className="p-2.5 bg-slate-900 text-white rounded-xl text-xs text-center font-semibold animate-in fade-in">
                {copyNotice}
              </div>
            )}

            {/* Billing Cycle Selector Switch */}
            <div className="flex items-center justify-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly ($19.90/mo)
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  billingCycle === 'annual'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual ($189/yr)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${billingCycle === 'annual' ? 'bg-amber-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'}`}>
                  Save 21%
                </span>
              </button>
            </div>

            {/* BANK QR CODE & DIRECT TRANSFER SECTION */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                {/* Left Column: Bank QR Display */}
                <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Scan Bank QR Code</span>
                  </div>

                  {/* Clean Rendered Bank QR Box */}
                  <div className="p-2 bg-white border-2 border-slate-900 rounded-2xl shadow-sm relative group my-1 flex items-center justify-center">
                    {activeBankQrImage ? (
                      <img
                        src={activeBankQrImage}
                        alt="Bank Payment QR Code"
                        className="w-36 h-36 object-contain rounded-xl"
                      />
                    ) : (
                      <svg
                        className="w-36 h-36 mx-auto text-slate-900"
                        viewBox="0 0 100 100"
                        fill="currentColor"
                      >
                        {/* QR Code Frame */}
                        <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10z" />
                        <path d="M35 5h10v10H35zM50 0h10v20H50zM10 35h15v10H10zM30 30h10v15H30zM45 25h10v10H45zM60 20h10v10H60zM75 35h20v10H75zM35 50h15v15H35zM55 45h15v10H55zM10 50h15v10H10zM75 50h20v15H75zM0 60h10v10H0zM40 70h15v15H40zM60 65h15v10H60zM80 70h15v15H80zM35 85h10v15H35zM50 85h25v10H50z" />
                      </svg>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-xl opacity-0 group-hover:opacity-100 transition text-white text-[11px] font-bold p-2 text-center">
                      Scan with LANKAPAY / Bank App
                    </div>
                  </div>

                  <div className="mt-2 text-xs font-bold text-slate-900">
                    LANKAPAY / Universal Bank QR
                  </div>
                  <div className="text-[11px] text-slate-700 font-bold mt-1">
                    Amount: <span className="text-emerald-700 font-mono">{isAnnual ? `$189.00 (Rs. ${annualLkr.toLocaleString()})` : `$19.90 (Rs. ${monthlyLkr.toLocaleString()})`}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                    <span>Rate: $1 USD = Rs. {usdRate.toFixed(2)}</span>
                    {isLiveRate && <span className="text-emerald-600 font-bold">⚡ Live</span>}
                  </div>
                </div>

                {/* Right Column: Bank Account Details */}
                <div className="md:col-span-7 space-y-2.5 text-xs">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Bank Wire Transfer Details</span>
                  </div>

                  <div className="space-y-1.5 text-slate-700">
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold">BANK NAME</div>
                        <div className="font-bold text-slate-900">{activeBankName}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(activeBankName, 'Bank Name')}
                        className="p-1 text-slate-400 hover:text-slate-800"
                        title="Copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold">ACCOUNT NAME</div>
                        <div className="font-bold text-slate-900">{activeBankAccountName}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(activeBankAccountName, 'Account Name')}
                        className="p-1 text-slate-400 hover:text-slate-800"
                        title="Copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold">ACCOUNT NUMBER</div>
                          <div className="font-bold font-mono text-slate-900">{activeBankAccountNumber}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText(activeBankAccountNumber, 'Account Number')}
                          className="p-1 text-slate-400 hover:text-slate-800"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold">BRANCH / SWIFT</div>
                          <div className="font-bold font-mono text-slate-900">{activeBankBranchSwift}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText(activeBankBranchSwift, 'Swift Code')}
                          className="p-1 text-slate-400 hover:text-slate-800"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                      <strong>Important:</strong> Mention reference <strong className="font-mono">{currentTenant.slug.toUpperCase()}</strong> in your transfer note.
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Slip Upload / Reference Entry Form */}
              <form onSubmit={handleSubmitBankPayment} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Submit Bank Deposit / Transfer Slip Reference</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Transaction Reference / Deposit Slip No *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TXN-2026-88192 or Bank Slip Ref"
                      value={txnRef}
                      onChange={(e) => setTxnRef(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Bank Slip File Name / Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Commercial_Bank_Slip.pdf or Notes"
                      value={slipFileName}
                      onChange={(e) => setSlipFileName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-500">
                    Amount: <strong className="text-slate-900 font-mono">{isAnnual ? `$189.00 (Rs. ${annualLkr.toLocaleString()})` : `$19.90 (Rs. ${monthlyLkr.toLocaleString()})`}</strong> · Auto-notifies Master Admin
                  </div>

                  <button
                    type="submit"
                    disabled={!txnRef.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Submit Slip for Approval</span>
                  </button>
                </div>
              </form>
            </div>
          </div>


          {/* Action Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500">
              Need assistance? Email support: <a href="mailto:apexdevinfo@gmail.com" className="font-bold text-slate-800 underline hover:text-emerald-700">apexdevinfo@gmail.com</a>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPrintableInvoice(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>View & Print Official Invoice</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-white transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showEmailVerifyModal}
        onClose={() => setShowEmailVerifyModal(false)}
        emailToVerify={currentTenant.contactEmail}
      />

      {/* Printable Invoice Modal */}
      {showPrintableInvoice && (
        <PrintableDocumentModal
          isOpen={showPrintableInvoice}
          onClose={() => setShowPrintableInvoice(false)}
          title="OFFICIAL SAAS SUBSCRIPTION INVOICE & TAX RECEIPT"
          documentNumber={`INV-2026-${currentTenant.slug.toUpperCase().slice(0, 8)}-${currentTenant.id.slice(-4).toUpperCase()}`}
          documentDate={currentTenant.subscription.trialStartedAt || new Date().toISOString()}
          recipientLabel="BILLED TENANT ACCOUNT"
          recipientName={currentTenant.companyName}
          recipientSubDetails={`Registered Contact: ${currentTenant.contactEmail} | Tel: ${currentTenant.contactPhone} | Country: ${currentTenant.country} | Tenant Ref: ${currentTenant.slug.toUpperCase()}`}
          notes={`Official SaaS Software Subscription Tax Invoice & Payment Receipt. Billing dispatched to registered email (${currentTenant.contactEmail}). Subscription Status: ${(sub.status || 'trialing').toUpperCase()} | Billing Cycle: ${(sub.billingCycle || 'annual').toUpperCase()}`}
          items={[
            {
              itemCode: 'SAAS-PRO-SUB',
              itemName: `Apex Stock & Site Management System - Pro Plan (${sub.billingCycle === 'annual' ? 'Annual Subscription $189.00/yr' : 'Monthly Subscription $19.90/mo'})`,
              category: 'Software License & Cloud Infrastructure',
              quantity: 1,
              unit: 'License',
            },
          ]}
        />
      )}
    </>
  );
};
