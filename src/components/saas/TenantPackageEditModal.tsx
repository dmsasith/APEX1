import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Zap,
  Sparkles,
  Clock,
  Calendar,
  AlertCircle,
  X,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Tenant, TenantPlan, TenantSubscription } from '../../types';
import { formatDateTime, formatDate } from '../../utils/exportUtils';

interface TenantPackageEditModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSubscription: (
    tenantId: string,
    updates: Partial<TenantSubscription>,
    isQueued: boolean
  ) => void;
  onClearQueuedSubscription: (tenantId: string) => void;
}

export const TenantPackageEditModal: React.FC<TenantPackageEditModalProps> = ({
  tenant,
  isOpen,
  onClose,
  onSaveSubscription,
  onClearQueuedSubscription,
}) => {
  const sub: TenantSubscription = tenant?.subscription || {
    plan: 'pro_monthly',
    status: 'active',
    billingCycle: 'monthly',
    trialStartedAt: new Date().toISOString(),
    trialEndsAt: new Date().toISOString(),
    monthlyPrice: 19.90,
    currency: 'USD',
    nextBillingDate: new Date().toISOString(),
  };
  const currentExpiry = new Date(sub.trialEndsAt || sub.nextBillingDate || Date.now());
  const now = new Date();
  const diffMs = currentExpiry.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  // Selected new plan
  const [selectedPlan, setSelectedPlan] = useState<TenantPlan>(sub?.plan || 'pro_monthly');
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'annual'>(
    sub?.billingCycle || (sub?.plan === 'pro_annual' ? 'annual' : 'monthly')
  );

  // Activation timing option: 'immediate' (Activate Now) vs 'schedule' (Queue for Future)
  const [activationMode, setActivationMode] = useState<'immediate' | 'schedule'>('immediate');

  // Custom trial days if selected free trial
  const [customTrialDays, setCustomTrialDays] = useState<number>(7);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  // Sync defaults when modal opens
  useEffect(() => {
    if (tenant) {
      setSelectedPlan(tenant.subscription.plan);
      setSelectedCycle(
        tenant.subscription.billingCycle ||
          (tenant.subscription.plan === 'pro_annual' ? 'annual' : 'monthly')
      );
      setIsUnlocked(false);
      setAdminNotes('');
      setActivationMode('immediate');
    }
  }, [tenant]);

  if (!isOpen || !tenant) return null;

  const handleSelectPlanOption = (plan: TenantPlan, cycle: 'monthly' | 'annual') => {
    setSelectedPlan(plan);
    setSelectedCycle(cycle);
  };

  const handleQuickActivate = (plan: TenantPlan, cycle: 'monthly' | 'annual') => {
    if (!tenant) return;
    const isAnnual = cycle === 'annual' || plan === 'pro_annual';
    const nextBilling = new Date(
      Date.now() + (isAnnual ? 365 : 30) * 24 * 60 * 60 * 1000
    ).toISOString();

    onSaveSubscription(
      tenant.id,
      {
        plan: isAnnual ? 'pro_annual' : 'pro_monthly',
        status: 'active',
        monthlyPrice: isAnnual ? 15.75 : 19.90,
        annualPrice: isAnnual ? 189.00 : undefined,
        billingCycle: isAnnual ? 'annual' : 'monthly',
        paymentMethodStatus: 'active',
        lastBillingDate: new Date().toISOString(),
        nextBillingDate: nextBilling,
        trialEndsAt: nextBilling,
        queuedSubscription: undefined,
      },
      false
    );
    onClose();
  };

  const handleQuickExtendTrial = (days: number) => {
    if (!tenant) return;
    const currentExp = new Date(sub.trialEndsAt || Date.now());
    const newExpiry = new Date(
      Math.max(Date.now(), currentExp.getTime()) + days * 24 * 60 * 60 * 1000
    ).toISOString();

    onSaveSubscription(
      tenant.id,
      {
        plan: 'free_trial',
        status: 'trialing',
        trialEndsAt: newExpiry,
        monthlyPrice: 19.90,
        billingCycle: 'monthly',
        queuedSubscription: undefined,
      },
      false
    );
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    const isAnnual = selectedCycle === 'annual' || selectedPlan === 'pro_annual';
    const isTrial = selectedPlan === 'free_trial';

    if (activationMode === 'schedule' && !isTrial) {
      // Queue subscription to take effect after current plan expiry
      const scheduledStartDate = sub.trialEndsAt || sub.nextBillingDate || new Date().toISOString();

      onSaveSubscription(
        tenant.id,
        {
          queuedSubscription: {
            plan: isAnnual ? 'pro_annual' : 'pro_monthly',
            billingCycle: isAnnual ? 'annual' : 'monthly',
            scheduledStartDate,
            notes: adminNotes.trim() || `Queued by Master Admin for activation on ${formatDate(scheduledStartDate)}`,
            queuedAt: new Date().toISOString(),
          },
        },
        true
      );
    } else {
      // Immediate upgrade / change
      if (isTrial) {
        const newExpiry = new Date(
          Math.max(Date.now(), currentExpiry.getTime()) + (customTrialDays || 7) * 24 * 60 * 60 * 1000
        ).toISOString();

        onSaveSubscription(
          tenant.id,
          {
            plan: 'free_trial',
            status: 'trialing',
            trialEndsAt: newExpiry,
            monthlyPrice: 19.90,
            billingCycle: 'monthly',
            queuedSubscription: undefined,
          },
          false
        );
      } else {
        const nextBilling = new Date(
          Date.now() + (isAnnual ? 365 : 30) * 24 * 60 * 60 * 1000
        ).toISOString();

        onSaveSubscription(
          tenant.id,
          {
            plan: isAnnual ? 'pro_annual' : 'pro_monthly',
            status: 'active',
            monthlyPrice: isAnnual ? 15.75 : 19.90,
            annualPrice: isAnnual ? 189.00 : undefined,
            billingCycle: isAnnual ? 'annual' : 'monthly',
            paymentMethodStatus: 'active',
            lastBillingDate: new Date().toISOString(),
            nextBillingDate: nextBilling,
            trialEndsAt: nextBilling,
            queuedSubscription: undefined,
          },
          false
        );
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
              {isUnlocked ? <Unlock className="w-5 h-5 text-amber-400" /> : <Lock className="w-5 h-5 text-emerald-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">
                  Manage Workspace Package
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {tenant.companyName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Admin package editing with automatic lock protection & scheduled plan switching.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Active Plan Current Details Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                CURRENT ACTIVE SUBSCRIPTION
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-600" />
                <span>{sub.status.toUpperCase()}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-400 font-semibold">ACTIVE PLAN</div>
                <div className="font-black text-slate-900 text-sm mt-0.5">
                  {sub.plan === 'pro_annual'
                    ? 'Pro Annual ($189/yr)'
                    : sub.plan === 'pro_monthly'
                    ? 'Pro Monthly ($19.90/mo)'
                    : '7-Day Free Trial'}
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-400 font-semibold">REMAINING DURATION</div>
                <div className="font-black text-amber-600 text-sm mt-0.5 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>{daysRemaining} Days Left</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Expires: {formatDate(sub.trialEndsAt || sub.nextBillingDate || '')}
                </div>
              </div>
            </div>

            {/* Currently Queued Package Banner */}
            {sub.queuedSubscription && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-2 animate-in fade-in">
                <div>
                  <div className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Upcoming Queued Package:</span>
                    <strong className="text-amber-950 font-black">
                      {sub.queuedSubscription.plan === 'pro_annual'
                        ? 'Pro Annual ($189/yr)'
                        : 'Pro Monthly ($19.90/mo)'}
                    </strong>
                  </div>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    Scheduled to activate on: <strong>{formatDate(sub.queuedSubscription.scheduledStartDate)}</strong> (after current plan expires).
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onClearQueuedSubscription(tenant.id)}
                  className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                  title="Cancel queued subscription"
                >
                  <Trash2 className="w-3 h-3 text-rose-600" />
                  <span>Cancel Queue</span>
                </button>
              </div>
            )}
          </div>

          {/* ADMIN LOCK PROTECTION TOGGLE */}
          {!isUnlocked ? (
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-sm">
                <Lock className="w-4 h-4" />
                <span>Subscription Packages Locked to Prevent Accidental Changes</span>
              </div>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Package buttons are safely locked by default. Click unlock to change or queue a new package for this tenant.
              </p>
              <button
                type="button"
                onClick={() => setIsUnlocked(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-2 mx-auto shadow-md cursor-pointer active:scale-95"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock & Edit Subscription Package</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Select Package / Instant Activation</span>
                </span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  🔓 Unlocked for Edit
                </span>
              </div>

              {/* Direct Instant Action Buttons */}
              <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2">
                <div className="font-bold text-[11px] text-slate-300 flex items-center justify-between">
                  <span>⚡ Instant Package Action (Click to Activate Immediately):</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickActivate('pro_monthly', 'monthly')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Activate Pro Monthly ($19.90/mo)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickActivate('pro_annual', 'annual')}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Activate Pro Annual ($189.00/yr)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickExtendTrial(7)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>+7 Days Trial</span>
                  </button>
                </div>
              </div>

              {/* Package Cards Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Pro Monthly */}
                <button
                  type="button"
                  onClick={() => handleSelectPlanOption('pro_monthly', 'monthly')}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer relative ${
                    selectedPlan === 'pro_monthly' && selectedCycle === 'monthly'
                      ? 'bg-emerald-50/80 border-2 border-emerald-600 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-slate-900 text-xs">Pro Monthly</span>
                    <Zap className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="font-black text-emerald-700 text-base">$19.90 <span className="text-[10px] font-normal text-slate-500">/month</span></div>
                  <div className="text-[10px] text-slate-500 mt-1">Full multi-site features & support.</div>
                </button>

                {/* 2. Pro Annual */}
                <button
                  type="button"
                  onClick={() => handleSelectPlanOption('pro_annual', 'annual')}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer relative ${
                    selectedPlan === 'pro_annual' || selectedCycle === 'annual'
                      ? 'bg-gradient-to-br from-amber-50 to-amber-100/60 border-2 border-amber-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded font-black text-[9px] bg-amber-500 text-white shadow-2xs">
                    Save 21%
                  </span>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-slate-900 text-xs">Pro Annual</span>
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="font-black text-amber-700 text-base">$189.00 <span className="text-[10px] font-normal text-slate-500">/year</span></div>
                  <div className="text-[10px] text-slate-500 mt-1">$15.75/mo equivalent.</div>
                </button>

                {/* 3. Free Trial Extension */}
                <button
                  type="button"
                  onClick={() => handleSelectPlanOption('free_trial', 'monthly')}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer relative ${
                    selectedPlan === 'free_trial'
                      ? 'bg-blue-50/80 border-2 border-blue-600 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-slate-900 text-xs">7-Day Free Trial</span>
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="font-black text-blue-700 text-base">FREE <span className="text-[10px] font-normal text-slate-500">($0)</span></div>
                  <div className="text-[10px] text-slate-500 mt-1">Extend trial days.</div>
                </button>
              </div>

              {/* Free Trial Extra Days Selector (if Free Trial selected) */}
              {selectedPlan === 'free_trial' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                  <label className="block text-[11px] font-bold text-blue-900">
                    Days to Add / Extend Free Trial:
                  </label>
                  <div className="flex items-center gap-2">
                    {[7, 14, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setCustomTrialDays(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition ${
                          customTrialDays === d
                            ? 'bg-blue-600 text-white border-blue-700'
                            : 'bg-white text-blue-900 border-blue-300 hover:bg-blue-100'
                        }`}
                      >
                        +{d} Days
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTIVATION TIMING STRATEGY (Schedule vs Immediate) */}
              {selectedPlan !== 'free_trial' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <label className="block font-bold text-slate-900 text-xs">
                    Package Activation & Transition Strategy:
                  </label>

                  <div className="space-y-2">
                    <label className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                      activationMode === 'schedule'
                        ? 'bg-white border-emerald-600 shadow-2xs'
                        : 'bg-white/50 border-slate-200 hover:bg-white'
                    }`}>
                      <input
                        type="radio"
                        name="activationMode"
                        value="schedule"
                        checked={activationMode === 'schedule'}
                        onChange={() => setActivationMode('schedule')}
                        className="mt-0.5 accent-emerald-600"
                      />
                      <div>
                        <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>🟢 Schedule After Current Package Expires (Recommended)</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Tenant maintains their existing plan until <strong>{formatDate(sub.trialEndsAt || sub.nextBillingDate || '')}</strong> ({daysRemaining} days remaining). When the active period finishes, the new <strong>{selectedCycle === 'annual' ? 'Pro Annual ($189/yr)' : 'Pro Monthly ($19.90/mo)'}</strong> plan automatically activates.
                        </p>
                      </div>
                    </label>

                    <label className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                      activationMode === 'immediate'
                        ? 'bg-white border-amber-600 shadow-2xs'
                        : 'bg-white/50 border-slate-200 hover:bg-white'
                    }`}>
                      <input
                        type="radio"
                        name="activationMode"
                        value="immediate"
                        checked={activationMode === 'immediate'}
                        onChange={() => setActivationMode('immediate')}
                        className="mt-0.5 accent-amber-600"
                      />
                      <div>
                        <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>⚡ Upgrade & Activate Immediately (Override)</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Immediately activates the new plan starting today and resets billing cycle start date.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Master Admin Reason / Internal Note (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Approved via Lankapay deposit slip or customized agreement"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                >
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>
                    {activationMode === 'schedule' && selectedPlan !== 'free_trial'
                      ? 'Queue Subscription & Lock'
                      : 'Apply Package & Lock'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
