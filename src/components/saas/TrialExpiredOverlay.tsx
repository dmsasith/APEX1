import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Clock,
  LogOut,
  Copy,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { computePlatformPricingMetrics, getSubscriptionStatusSummary } from '../../types';
import { formatDateTime } from '../../utils/exportUtils';

export const TrialExpiredOverlay: React.FC = () => {
  const { currentTenant, updateTenantSubscription, platformPricing, config, logout } = useStock();
  const pricingMetrics = computePlatformPricingMetrics(platformPricing);

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
  const usdRate = config?.usdToLkrRate || masterBankConfig?.usdToLkrRate || 332.64;

  const [bankSlipRef, setBankSlipRef] = useState('');
  const [bankNotes, setBankNotes] = useState('');
  const [showSlipSuccess, setShowSlipSuccess] = useState(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>(
    currentTenant?.subscription?.billingCycle || 'annual'
  );

  if (!currentTenant || currentTenant.id === 'tenant-apex-main') return null;

  const sub = currentTenant.subscription;
  const subSummary = getSubscriptionStatusSummary(sub);
  const isTrialExpired = subSummary.isTrial && subSummary.isExpired;

  // If trial is NOT expired and status is active/trialing, do not block UI
  if (!isTrialExpired && sub.status !== 'canceled' && sub.status !== 'past_due') {
    return null;
  }

  const isAnnual = selectedPlan === 'annual';
  const selectedUsdAmount = isAnnual ? pricingMetrics.annualPrice : pricingMetrics.monthlyPrice;
  const selectedUsdFormatted = isAnnual ? pricingMetrics.annualPriceFormatted : pricingMetrics.monthlyPriceFormatted;
  const selectedLkrAmount = Math.round(selectedUsdAmount * usdRate);
  const existingPending = sub.pendingBankPayment?.status === 'pending' ? sub.pendingBankPayment : null;

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyNotice(`${label} copied`);
    setTimeout(() => setCopyNotice(null), 2000);
  };

  const handleSubmitBankSlip = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedRef = bankSlipRef.trim();
    if (!cleanedRef) return;

    updateTenantSubscription(currentTenant.id, {
      billingCycle: selectedPlan,
      pendingBankPayment: {
        submittedAt: new Date().toISOString(),
        referenceNo: cleanedRef,
        amount: selectedUsdAmount,
        billingCycle: selectedPlan,
        notes: bankNotes.trim() || 'Submitted from Workspace Lock Screen',
        slipName: 'Bank_Transfer_Reference',
        status: 'pending',
      },
    });

    setShowSlipSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 p-6 text-center border-b border-amber-800/40 relative">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center shadow-lg mb-3 text-amber-400">
            <Lock className="w-7 h-7" />
          </div>

          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {sub.status === 'canceled'
              ? 'Workspace Subscription Inactive'
              : `${pricingMetrics.trialDays}-Day Free Trial Ended`}
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2">
            Subscription Renewal Required
          </h2>

          <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
            Workspace: <strong className="text-white">{currentTenant.companyName}</strong> · Expired on{' '}
            {formatDateTime(subSummary.expiryDateIso || sub.trialEndsAt)}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Data Protection Guarantee */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white block">Your Records Are 100% Safe:</strong>
              All your sites, items, team issues, and requisition notes are securely preserved. Select a plan and submit your bank transfer reference below to reactivate commercial access.
            </div>
          </div>

          {/* Pricing Plan Selection: Monthly vs Annual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedPlan('monthly')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                selectedPlan === 'monthly'
                  ? 'bg-slate-950 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Pro Monthly</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    Flexible
                  </span>
                </div>
                <div className="text-xl font-black text-white mt-2">${pricingMetrics.monthlyPriceFormatted}</div>
                <div className="text-[10px] text-slate-400 font-semibold">/ month · Billed monthly</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPlan('annual')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between relative ${
                selectedPlan === 'annual'
                  ? 'bg-slate-950 border-amber-500 shadow-md ring-2 ring-amber-500/30'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 opacity-75'
              }`}
            >
              <div className="absolute -top-2.5 right-3 bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow">
                Save {pricingMetrics.annualSavingsPercent}%
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Pro Annual (Yearly)</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">
                    Best Value
                  </span>
                </div>
                <div className="text-xl font-black text-amber-400 mt-2">${pricingMetrics.annualPriceFormatted}</div>
                <div className="text-[10px] text-amber-300 font-semibold">
                  / year (~${pricingMetrics.annualMonthlyEquivalentFormatted}/mo · Save ${pricingMetrics.annualSavingsFormatted}/yr)
                </div>
              </div>
            </button>
          </div>

          {/* Pending Verification Status or Bank Transfer Submission Form */}
          {showSlipSuccess || existingPending ? (
            <div className="p-4 bg-emerald-950/70 border border-emerald-700/80 rounded-xl text-xs text-emerald-200 space-y-2">
              <div className="flex items-start gap-2.5">
                {showSlipSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <strong className="text-white block">
                    {showSlipSuccess
                      ? 'Payment Reference Submitted for Verification'
                      : 'Pending Master Admin Verification'}
                  </strong>
                  <p className="mt-1 text-emerald-200/90 leading-relaxed">
                    Reference No:{' '}
                    <strong className="text-white font-mono">
                      {existingPending?.referenceNo || bankSlipRef}
                    </strong>{' '}
                    · Plan Amount:{' '}
                    <strong className="text-amber-300">
                      ${(existingPending?.amount ?? selectedUsdAmount).toFixed(2)}
                    </strong>
                    {existingPending?.submittedAt && (
                      <span className="block text-[11px] text-slate-300 mt-0.5">
                        Submitted: {formatDateTime(existingPending.submittedAt)}
                      </span>
                    )}
                  </p>
                  <p className="mt-1.5 text-[11px] text-slate-300">
                    Once the platform administrator approves this transfer, your workspace will unlock automatically.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitBankSlip} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Bank Transfer / LankaQR Payment Verification</span>
                </div>
                {copyNotice && (
                  <span className="text-[10px] font-bold text-emerald-400">{copyNotice}</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-start bg-slate-900/80 p-3 rounded-lg">
                <div className="flex-1 text-[11px] text-slate-300 space-y-1 font-mono">
                  <div>
                    Bank: <strong className="text-slate-100">{activeBankName}</strong>
                  </div>
                  <div>
                    Account Name: <strong className="text-slate-100">{activeBankAccountName}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Account No:</span>
                    <strong className="text-emerald-400 font-bold">{activeBankAccountNumber}</strong>
                    <button
                      type="button"
                      onClick={() => handleCopyText(activeBankAccountNumber, 'Account No')}
                      className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                      title="Copy Account Number"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    Branch / SWIFT: <strong className="text-slate-200">{activeBankBranchSwift}</strong>
                  </div>
                  <div>
                    Amount to Transfer:{' '}
                    <strong className="text-amber-400 font-bold">
                      ${selectedUsdFormatted} / Rs. {selectedLkrAmount.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {activeBankQrImage && (
                  <div className="shrink-0 bg-white p-1.5 rounded-lg border border-slate-700 self-center">
                    <img
                      src={activeBankQrImage}
                      alt="Bank Payment QR"
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  required
                  placeholder="Enter Bank Deposit / Transfer Reference No..."
                  value={bankSlipRef}
                  onChange={(e) => setBankSlipRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Optional note (Bank branch, depositor name)..."
                    value={bankNotes}
                    onChange={(e) => setBankNotes(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shrink-0"
                  >
                    Submit Reference
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
            <span className="text-[11px] text-slate-400">
              Need assistance? Contact platform billing support with your reference number.
            </span>

            <button
              type="button"
              onClick={logout}
              className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
