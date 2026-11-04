import React, { useState } from 'react';
import {
  Sparkles,
  CreditCard,
  Check,
  ShieldCheck,
  Clock,
  Zap,
  Building,
  Calendar,
  X,
  ExternalLink,
  Lock,
  ArrowRight,
  HelpCircle,
  Tag,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatDateTime } from '../../utils/exportUtils';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const { currentTenant, updateTenantSubscription } = useStock();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    currentTenant?.subscription?.billingCycle || 'annual'
  );
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  if (!isOpen || !currentTenant) return null;

  const sub = currentTenant.subscription;
  const isTrial = sub.plan === 'free_trial' || sub.status === 'trialing';

  // Calculate days remaining
  const trialEndDate = new Date(sub.trialEndsAt);
  const now = new Date();
  const diffMs = trialEndDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const handleSimulateUpgrade = () => {
    const isAnnual = billingCycle === 'annual';
    updateTenantSubscription(currentTenant.id, {
      plan: isAnnual ? 'pro_annual' : 'pro_monthly',
      status: 'active',
      monthlyPrice: isAnnual ? 15.75 : 19.90,
      annualPrice: isAnnual ? 189.00 : undefined,
      billingCycle: billingCycle,
      paymentMethodStatus: 'active',
      lastBillingDate: new Date().toISOString(),
      nextBillingDate: new Date(Date.now() + (isAnnual ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
    });
    setShowPaymentSuccess(true);
    setTimeout(() => {
      setShowPaymentSuccess(false);
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-slate-900 text-white p-6 pb-8 border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Workspace Subscription & Plans</span>
            </span>
            <span className="text-xs text-slate-400">Tenant: {currentTenant.companyName}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {isTrial ? '7-Day Free Trial Active' : 'Pro Multi-Site Subscription'}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>
                {isTrial ? (
                  <>
                    <strong className="text-amber-300">{daysRemaining} Day(s) Remaining</strong> in trial
                  </>
                ) : (
                  <>Status: <strong className="text-emerald-400">Active Pro Member</strong></>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Expires / Renews: <strong>{formatDateTime(sub.trialEndsAt)}</strong></span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {showPaymentSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong>Subscription Updated!</strong> Your workspace is now upgraded to Pro ({billingCycle === 'annual' ? '$189.00 / year (Save 21%)' : '$19.90 / month'}).
              </div>
            </div>
          )}

          {/* Billing Cycle Selector Switch */}
          <div className="flex items-center justify-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
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
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annual ($189/yr)</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${billingCycle === 'annual' ? 'bg-amber-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'}`}>
                Save 21%
              </span>
            </button>
          </div>

          {/* Pricing Plan Card */}
          <div className="bg-slate-50 border-2 border-emerald-500/30 rounded-2xl p-5 relative shadow-sm">
            <div className="absolute -top-3 right-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
              {billingCycle === 'annual' ? 'Best Value Annual Pro' : 'Monthly Pro Plan'}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <span>Pro Contractor Workspace</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                    Full Access
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {billingCycle === 'annual'
                    ? 'Billed annually at $189.00/yr (Equivalent to $15.75/mo — Save $50/yr).'
                    : 'Billed monthly at $19.90/mo with 7-day free test period included.'}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">
                    {billingCycle === 'annual' ? '$189.00' : '$19.90'}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    {billingCycle === 'annual' ? '/ year' : '/ month'}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                  {billingCycle === 'annual' ? '⚡ Equals $15.75 / month' : '7-Day Free Test Period Included'}
                </div>
              </div>
            </div>

            {/* Included Features Grid */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
              {[
                'Unlimited Branch Site Yards',
                'Unlimited Field Teams & Supervisors',
                'Real-Time Inter-Branch Requisitions',
                'Fast One-Click Shortage Fast Actions',
                'Supplier Purchase Orders (PO) with GRN',
                'Daily Issue Notes with Auto-Deduction',
                'Excel Catalog Bulk Importer & Exporter',
                'Official Letterhead PDF Templates',
                'Instant Firebase Real-Time Cloud Sync',
                'Full Audit Trail & Deletion Protection',
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Gateway Note */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900">Payment Gateway Integration</div>
              <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                As per system setup, payment accounts (Stripe / Bank Account details) will be wired directly to your admin payout profile. Clients will be able to renew monthly or yearly subscriptions seamlessly via Card or Direct Transfer.
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              Need assistance? Email support: <strong className="text-slate-800">support@comtecsystems.com</strong>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleSimulateUpgrade}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>
                  {billingCycle === 'annual' ? 'Activate Annual Pro ($189/yr)' : 'Activate Monthly Pro ($19.90/mo)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
