import React, { useState } from 'react';
import {
  Lock,
  Sparkles,
  Zap,
  ShieldCheck,
  CreditCard,
  Building2,
  Upload,
  CheckCircle2,
  Clock,
  HelpCircle,
  FileText,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatDateTime } from '../../utils/exportUtils';

export const TrialExpiredOverlay: React.FC = () => {
  const { currentTenant, updateTenantSubscription } = useStock();
  const [bankSlipRef, setBankSlipRef] = useState('');
  const [showSlipSuccess, setShowSlipSuccess] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');

  if (!currentTenant) return null;

  const sub = currentTenant.subscription;
  const isTrial = sub.plan === 'free_trial' || sub.status === 'trialing';
  const isTrialExpired =
    isTrial && new Date(sub.trialEndsAt) < new Date();

  // If trial is NOT expired and status is active, do not block UI
  if (!isTrialExpired && sub.status !== 'canceled') {
    return null;
  }

  const handleSimulatePayment = () => {
    setIsUpgrading(true);
    setTimeout(() => {
      const isAnnual = selectedPlan === 'annual';
      updateTenantSubscription(currentTenant.id, {
        plan: isAnnual ? 'pro_annual' : 'pro_monthly',
        status: 'active',
        monthlyPrice: isAnnual ? 15.75 : 19.90,
        annualPrice: isAnnual ? 189.00 : undefined,
        billingCycle: selectedPlan,
        paymentMethodStatus: 'active',
        lastBillingDate: new Date().toISOString(),
        nextBillingDate: new Date(Date.now() + (isAnnual ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
      });
      setIsUpgrading(false);
    }, 1000);
  };

  const handleExtendTrialDemo = () => {
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    updateTenantSubscription(currentTenant.id, {
      status: 'trialing',
      trialEndsAt: newExpiry,
    });
  };

  const handleSubmitBankSlip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankSlipRef.trim()) return;
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
            7-Day Free Trial Ended
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2">
            Your Free Test Period Has Expired
          </h2>

          <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
            Workspace: <strong className="text-white">{currentTenant.companyName}</strong> · Expired on {formatDateTime(sub.trialEndsAt)}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Data Protection Guarantee */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white block">Your Records Are 100% Safe:</strong>
              All your sites, items, team issues, and requisition notes are securely preserved. Select a plan below to unlock full commercial access immediately.
            </div>
          </div>

          {/* Pricing Plan Selection: Monthly vs Annual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Monthly Option */}
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
                <div className="text-xl font-black text-white mt-2">$19.90</div>
                <div className="text-[10px] text-slate-400 font-semibold">/ month · Billed monthly</div>
              </div>
            </button>

            {/* Annual Option (Best Value) */}
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
                Save 21%
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Pro Annual (Yearly)</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">
                    Best Value
                  </span>
                </div>
                <div className="text-xl font-black text-amber-400 mt-2">$189.00</div>
                <div className="text-[10px] text-amber-300 font-semibold">
                  / year (~$15.75/mo · 2+ Months Free)
                </div>
              </div>
            </button>
          </div>

          {/* Bank Payment Info or Direct Card Upgrade */}
          {showSlipSuccess ? (
            <div className="p-4 bg-emerald-950/80 border border-emerald-700/80 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Payment Verification Submitted!</strong>
                Thank you! Our platform administrator is verifying your transfer reference (Ref: {bankSlipRef}) for the {selectedPlan === 'annual' ? 'Annual Plan ($189.00)' : 'Monthly Plan ($19.90)'}. Your workspace will be unlocked shortly.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitBankSlip} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Bank Transfer Payment Verification</span>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1 bg-slate-900/80 p-2.5 rounded-lg font-mono">
                <div>Bank: <strong className="text-slate-200">Commercial Bank / Sampath Bank</strong></div>
                <div>Account Name: <strong className="text-slate-200">Sasith Dissanayake (Apex SaaS)</strong></div>
                <div>Account No: <strong className="text-emerald-400 font-bold">800-12345-6789</strong></div>
                <div>
                  Amount to Transfer:{' '}
                  <strong className="text-amber-400 font-bold">
                    {selectedPlan === 'annual' ? '$189.00 / Rs. 58,500' : '$19.90 / Rs. 6,200'}
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  required
                  placeholder="Enter Bank Deposit / Transfer Reference No..."
                  value={bankSlipRef}
                  onChange={(e) => setBankSlipRef(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </form>
          )}

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
            {/* Demo extend button for testing */}
            <button
              type="button"
              onClick={handleExtendTrialDemo}
              className="text-amber-400 hover:text-amber-300 text-xs font-bold underline cursor-pointer"
            >
              ⚡ Extend Trial +7 Days (Testing Demo)
            </button>

            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={isUpgrading}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isUpgrading ? 'Upgrading Workspace...' : 'Activate Pro Subscription Now ($19.90)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
