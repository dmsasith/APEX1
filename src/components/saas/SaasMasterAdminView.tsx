import React, { useState } from 'react';
import {
  Building2,
  Users2,
  DollarSign,
  Calendar,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  Search,
  Lock,
  Globe,
  RefreshCw,
  Eye,
  Ban,
  ShieldCheck,
  CreditCard,
  FileText,
  Trash2,
  QrCode,
  Upload,
  Check,
  X,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Tenant, TenantSubscription } from '../../types';
import { formatDateTime } from '../../utils/exportUtils';
import { ConfirmModal } from '../common/ConfirmModal';
import { TenantWorkspaceInspectorModal } from './TenantWorkspaceInspectorModal';
import { TenantPackageEditModal } from './TenantPackageEditModal';

export const SaasMasterAdminView: React.FC = () => {
  const { tenants, currentTenant, switchTenant, switchToMasterStock, updateTenantSubscription, deleteTenant, config, updateConfig } = useStock();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'trialing' | 'active' | 'expired'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmDeleteTenant, setConfirmDeleteTenant] = useState<Tenant | null>(null);
  const [inspectingTenant, setInspectingTenant] = useState<Tenant | null>(null);
  const [editingPackageTenant, setEditingPackageTenant] = useState<Tenant | null>(null);
  const [showBankSetupModal, setShowBankSetupModal] = useState(false);

  const masterBankConfig = (() => {
    try {
      const raw = localStorage.getItem('apex_master_bank_config_v1');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [bankName, setBankName] = useState(
    config.bankName || masterBankConfig?.bankName || 'Commercial Bank PLC / Sampath Bank'
  );
  const [bankAccountName, setBankAccountName] = useState(
    config.bankAccountName || masterBankConfig?.bankAccountName || 'Apex Developer (Pvt) Ltd'
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(
    config.bankAccountNumber || masterBankConfig?.bankAccountNumber || '1000 4829 5012'
  );
  const [bankBranchSwift, setBankBranchSwift] = useState(
    config.bankBranchSwift || masterBankConfig?.bankBranchSwift || 'Mulleriyawa Branch / CCBLLKLX'
  );
  const [bankQrImage, setBankQrImage] = useState(
    config.bankQrImage || masterBankConfig?.bankQrImage || ''
  );
  const [usdToLkrRate, setUsdToLkrRate] = useState<number>(
    config.usdToLkrRate || masterBankConfig?.usdToLkrRate || 332.64
  );
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveSubscription = (
    tenantId: string,
    updates: Partial<TenantSubscription>,
    isQueued: boolean
  ) => {
    const targetTenant = tenants.find((t) => t.id === tenantId);
    updateTenantSubscription(tenantId, updates);
    if (isQueued) {
      showNotification(
        `Scheduled upcoming package for ${targetTenant?.companyName || 'tenant'}. Will activate automatically when current plan finishes!`
      );
    } else {
      showNotification(`Subscription package updated and locked for ${targetTenant?.companyName || 'tenant'}!`);
    }
  };

  const handleClearQueuedSubscription = (tenantId: string) => {
    const targetTenant = tenants.find((t) => t.id === tenantId);
    updateTenantSubscription(tenantId, { queuedSubscription: undefined });
    showNotification(`Cancelled scheduled queued package for ${targetTenant?.companyName || 'tenant'}.`);
  };

  // KPI Calculations
  const totalTenants = tenants.length;
  const activePaidTenants = tenants.filter((t) => t.subscription.status === 'active');
  const activeMonthlyTenants = activePaidTenants.filter((t) => t.subscription.plan !== 'pro_annual');
  const activeAnnualTenants = activePaidTenants.filter((t) => t.subscription.plan === 'pro_annual');
  const activeTrialTenants = tenants.filter(
    (t) =>
      t.subscription.status === 'trialing' &&
      new Date(t.subscription.trialEndsAt) >= new Date()
  );
  const expiredTenants = tenants.filter(
    (t) =>
      t.subscription.status === 'trialing' &&
      new Date(t.subscription.trialEndsAt) < new Date()
  );

  const mrr = activePaidTenants.reduce((sum, t) => {
    if (t.subscription.plan === 'pro_annual') {
      return sum + (189.00 / 12);
    }
    return sum + (t.subscription.monthlyPrice || 19.90);
  }, 0);

  const arr = mrr * 12;

  const filteredTenants = tenants.filter((t) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      t.companyName.toLowerCase().includes(query) ||
      t.contactEmail.toLowerCase().includes(query) ||
      t.slug.toLowerCase().includes(query);

    const isTrialExpired =
      t.subscription.status === 'trialing' &&
      new Date(t.subscription.trialEndsAt) < new Date();

    if (filterStatus === 'trialing') {
      return matchesSearch && t.subscription.status === 'trialing' && !isTrialExpired;
    }
    if (filterStatus === 'active') {
      return matchesSearch && t.subscription.status === 'active';
    }
    if (filterStatus === 'expired') {
      return matchesSearch && isTrialExpired;
    }
    return matchesSearch;
  });

  const handleExtendTrial = (tenant: Tenant) => {
    const currentExpiry = new Date(tenant.subscription.trialEndsAt);
    // Add 7 days to trial expiry
    const newExpiry = new Date(
      Math.max(Date.now(), currentExpiry.getTime()) + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    updateTenantSubscription(tenant.id, {
      status: 'trialing',
      trialEndsAt: newExpiry,
    });
    showNotification(`Extended 7-Day Free Trial for ${tenant.companyName}.`);
  };

  const handleActivatePro = (tenant: Tenant) => {
    updateTenantSubscription(tenant.id, {
      plan: 'pro_monthly',
      status: 'active',
      monthlyPrice: 19.90,
      billingCycle: 'monthly',
      paymentMethodStatus: 'active',
      lastBillingDate: new Date().toISOString(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    showNotification(`Activated Monthly Pro Subscription ($19.90/mo) for ${tenant.companyName}!`);
  };

  const handleActivateAnnual = (tenant: Tenant) => {
    updateTenantSubscription(tenant.id, {
      plan: 'pro_annual',
      status: 'active',
      monthlyPrice: 15.75,
      annualPrice: 189.00,
      billingCycle: 'annual',
      paymentMethodStatus: 'active',
      lastBillingDate: new Date().toISOString(),
      nextBillingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });
    showNotification(`Activated Annual Pro Subscription ($189.00/yr) for ${tenant.companyName}!`);
  };

  const handleToggleActive = (tenant: Tenant) => {
    updateTenantSubscription(tenant.id, {
      status: tenant.subscription.status === 'canceled' ? 'active' : 'canceled',
    });
    showNotification(
      `Workspace for ${tenant.companyName} has been ${
        tenant.subscription.status === 'canceled' ? 'Re-activated' : 'Suspended'
      }.`
    );
  };

  const pendingBankSlipsTenants = tenants.filter(
    (t) => t.subscription.pendingBankPayment && t.subscription.pendingBankPayment.status === 'pending'
  );

  const handleApproveBankSlip = (tenant: Tenant) => {
    const pending = tenant.subscription.pendingBankPayment;
    if (!pending) return;

    const isAnnual = pending.planRequested === 'pro_annual' || pending.billingCycle === 'annual';
    const plan = isAnnual ? 'pro_annual' : 'pro_monthly';

    updateTenantSubscription(tenant.id, {
      plan,
      status: 'active',
      monthlyPrice: isAnnual ? 15.75 : 19.90,
      annualPrice: isAnnual ? 189.00 : undefined,
      billingCycle: isAnnual ? 'annual' : 'monthly',
      paymentMethodStatus: 'active',
      lastBillingDate: new Date().toISOString(),
      nextBillingDate: new Date(
        Date.now() + (isAnnual ? 365 : 30) * 24 * 60 * 60 * 1000
      ).toISOString(),
      pendingBankPayment: {
        ...pending,
        status: 'approved',
        approvedAt: new Date().toISOString(),
      },
    });

    showNotification(
      `Approved Bank Deposit Slip for ${tenant.companyName}! ${
        isAnnual ? 'Pro Annual ($189.00/yr)' : 'Pro Monthly ($19.90/mo)'
      } subscription activated.`
    );
  };

  const handleRejectBankSlip = (tenant: Tenant) => {
    updateTenantSubscription(tenant.id, {
      pendingBankPayment: undefined,
    });
    showNotification(`Bank slip request rejected for ${tenant.companyName}.`);
  };

  const fetchLiveRate = async () => {
    setIsFetchingRate(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data?.result === 'success' && data?.rates?.LKR) {
        const rate = parseFloat(data.rates.LKR.toFixed(2));
        setUsdToLkrRate(rate);
        showNotification(`Auto-fetched live exchange rate: $1 USD = Rs. ${rate}`);
      }
    } catch (err) {
      console.warn('Failed to fetch live rate:', err);
    } finally {
      setIsFetchingRate(false);
    }
  };

  React.useEffect(() => {
    fetchLiveRate();
  }, []);

  const handleSaveBankSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const bankData = {
      bankName: bankName.trim(),
      bankAccountName: bankAccountName.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      bankBranchSwift: bankBranchSwift.trim(),
      bankQrImage: bankQrImage.trim(),
      usdToLkrRate: Number(usdToLkrRate) || 332.64,
    };

    // Save to global key accessible by all tenant workspaces
    try {
      localStorage.setItem('apex_master_bank_config_v1', JSON.stringify(bankData));
    } catch (err) {
      console.warn('Failed to save master bank config globally:', err);
    }

    updateConfig(bankData);
    setShowBankSetupModal(false);
    showNotification('SaaS Payment QR & Bank Transfer Details updated and synced across all tenant workspaces!');
  };

  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Selected image exceeds 2MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) setBankQrImage(base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Platform Owner Control Panel</span>
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              SaaS Multi-Tenant Master Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Monitor registered company workspaces, verify bank payment slips, manage 7-Day trials, activate subscriptions, and track MRR.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowBankSetupModal(true)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs transition border border-amber-500/30 flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              title="Configure Bank Account Details & Scan QR Image"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Configure Bank & QR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                switchToMasterStock();
                window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'dashboard' }));
                showNotification('Switched directly to Apex Developer Master Stock.');
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              title="Go directly to Apex Developer Master Stock Manager"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Open My Apex Stock</span>
            </button>

            <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-right">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Current Active Workspace
              </div>
              <div className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>{currentTenant.companyName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-700/80 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Workspaces */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Total Workspaces</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totalTenants}</div>
          <p className="text-[11px] text-slate-500 mt-1">Registered tenant companies</p>
        </div>

        {/* Active Pro Members */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Paid Pro Clients</span>
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">{activePaidTenants.length}</div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            {activeMonthlyTenants.length} Monthly ($19.90) · {activeAnnualTenants.length} Annual ($189)
          </p>
        </div>

        {/* Active 7-Day Trials */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Active 7-Day Trials</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600">{activeTrialTenants.length}</div>
          <p className="text-[11px] text-amber-700 font-semibold mt-1">Testing platform features</p>
        </div>

        {/* Estimated MRR & ARR */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>Monthly Revenue (MRR)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">${mrr.toFixed(2)}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            ARR: <strong className="text-white">${arr.toFixed(0)}/yr</strong> · Cashflow Optimized
          </p>
        </div>
      </div>

      {/* PENDING BANK PAYMENT SLIPS APPROVAL QUEUE */}
      {pendingBankSlipsTenants.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-50/80 to-amber-100/50 border-2 border-amber-400 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <span>Pending Bank Deposit Slip Verification Queue</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                    {pendingBankSlipsTenants.length} Action Required
                  </span>
                </h3>
                <p className="text-xs text-slate-600">
                  Tenants have deposited funds via Lankapay / Bank Transfer and uploaded slip references. Verify slip details to activate Pro subscriptions.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingBankSlipsTenants.map((t) => {
              const p = t.subscription.pendingBankPayment!;
              const isAnnual = p.planRequested === 'pro_annual' || p.billingCycle === 'annual';

              return (
                <div key={t.id} className="bg-white border border-amber-200 rounded-xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">{t.companyName}</div>
                      <div className="text-xs text-slate-500">{t.contactEmail}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {isAnnual ? 'Annual Pro ($189.00/yr)' : 'Monthly Pro ($19.90/mo)'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bank Name:</span>
                      <strong className="text-slate-800">{p.bankName || 'Commercial Bank / Sampath Bank'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Deposit Slip Reference:</span>
                      <strong className="text-slate-900 font-mono bg-amber-100 px-1.5 py-0.5 rounded">{p.referenceNo}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Receipt Image / File:</span>
                      <strong className="text-indigo-700 font-semibold">{p.slipFileName || p.slipName || 'Deposit_Receipt.png'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Submitted At:</span>
                      <span className="text-slate-600 font-medium">{formatDateTime(p.submittedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleApproveBankSlip(t)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Activate Pro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectBankSlip(t)}
                      className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* REVENUE & TENANT DISTRIBUTION CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Plan Revenue Breakdown */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Revenue Distribution & Plan Composition</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Monthly Total: ${mrr.toFixed(2)}</span>
          </div>

          <div className="space-y-3">
            {/* Pro Monthly Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-slate-700 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  Pro Monthly ($19.90/mo)
                </span>
                <span className="text-slate-900 font-bold">
                  {activeMonthlyTenants.length} clients (${(activeMonthlyTenants.length * 19.9).toFixed(2)}/mo)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      totalTenants > 0 ? (activeMonthlyTenants.length / totalTenants) * 100 : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Pro Annual Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-slate-700 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  Pro Annual ($189.00/yr)
                </span>
                <span className="text-slate-900 font-bold">
                  {activeAnnualTenants.length} clients (${(activeAnnualTenants.length * 15.75).toFixed(2)}/mo equiv)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      totalTenants > 0 ? (activeAnnualTenants.length / totalTenants) * 100 : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Free Trial Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-slate-700 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                  Active 7-Day Free Trial
                </span>
                <span className="text-slate-900 font-bold">{activeTrialTenants.length} clients</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      totalTenants > 0 ? (activeTrialTenants.length / totalTenants) * 100 : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Expired / Canceled Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-slate-700 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span>
                  Expired Trials / Suspended
                </span>
                <span className="text-slate-900 font-bold">{expiredTenants.length} clients</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-rose-400 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      totalTenants > 0 ? (expiredTenants.length / totalTenants) * 100 : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Quick Summary Box */}
        <div className="lg:col-span-5 bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                SaaS Revenue Metrics
              </span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Monthly Recurring Revenue (MRR):</span>
                <span className="text-lg font-black text-emerald-400">${mrr.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Annual Run Rate (ARR):</span>
                <span className="text-lg font-black text-white">${arr.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Paid Conversion Rate:</span>
                <span className="text-sm font-bold text-amber-400">
                  {totalTenants > 0
                    ? ((activePaidTenants.length / totalTenants) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Bank Transfer Payment Slips:</span>
                <span className="text-sm font-bold text-teal-300">
                  {pendingBankSlipsTenants.length} pending
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Platform Developer Engine</span>
            <strong className="text-emerald-400 font-mono">Apex Developer v3.5</strong>
          </div>
        </div>
      </div>

      {/* Tenants Management Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users2 className="w-4 h-4 text-teal-600" />
              <span>Client Workspaces Directory</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage subscriptions, grant free trial extensions, and switch workspaces.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search company or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white font-semibold focus:outline-none"
            >
              <option value="all">All Workspaces ({tenants.length})</option>
              <option value="active">Pro Active (${activePaidTenants.length})</option>
              <option value="trialing">Testing Free Trial ({activeTrialTenants.length})</option>
              <option value="expired">Trial Expired ({expiredTenants.length})</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Company / Workspace</th>
                <th className="p-3">Admin Email & Phone</th>
                <th className="p-3">Plan Status</th>
                <th className="p-3">Registered Date</th>
                <th className="p-3">Trial Expiry / Billing</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    No matching client workspaces found.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => {
                  const isCurrent = tenant.id === currentTenant.id;
                  const isTrialExpired =
                    tenant.subscription.status === 'trialing' &&
                    new Date(tenant.subscription.trialEndsAt) < new Date();

                  const trialEnds = new Date(tenant.subscription.trialEndsAt);
                  const daysLeft = Math.max(
                    0,
                    Math.ceil((trialEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  );

                  return (
                    <tr
                      key={tenant.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCurrent ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      {/* Company Name */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {tenant.companyName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{tenant.companyName}</span>
                              {isCurrent && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                                  Current Workspace
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                🔗 {window.location.origin}/?workspace={tenant.slug}
                              </span>
                              <button
                                onClick={() => {
                                  const link = `${window.location.origin}/?workspace=${tenant.slug}`;
                                  navigator.clipboard.writeText(link);
                                  showNotification(`Copied workspace login link for ${tenant.companyName}!`);
                                }}
                                className="text-[10px] bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold px-2 py-0.5 rounded transition cursor-pointer"
                                title="Copy direct login link for this tenant"
                              >
                                Copy Link
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Admin Email */}
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{tenant.contactEmail}</div>
                        <div className="text-[10px] text-slate-500">
                          {tenant.contactPhone || 'No phone recorded'}
                        </div>
                      </td>

                      {/* Plan Status */}
                      <td className="p-3">
                        {tenant.subscription.plan === 'pro_annual' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1 shadow-2xs">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>Pro Annual ($189/yr)</span>
                          </span>
                        ) : tenant.subscription.status === 'active' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                            <Zap className="w-3 h-3 text-emerald-600" />
                            <span>Pro Monthly ($19.90/mo)</span>
                          </span>
                        ) : isTrialExpired ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>Trial Expired</span>
                          </span>
                        ) : tenant.subscription.status === 'canceled' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300 inline-flex items-center gap-1">
                            <Ban className="w-3 h-3 text-slate-500" />
                            <span>Suspended</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>7-Day Trial ({daysLeft} Days Left)</span>
                          </span>
                        )}
                      </td>

                      {/* Registration Date */}
                      <td className="p-3 text-slate-600 text-[11px]">
                        {formatDateTime(tenant.createdAt)}
                      </td>

                      {/* Expiry Date */}
                      <td className="p-3 text-slate-600 text-[11px]">
                        {formatDateTime(tenant.subscription.trialEndsAt)}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Locked Package Edit Button */}
                          <button
                            type="button"
                            onClick={() => setEditingPackageTenant(tenant)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                              tenant.subscription.queuedSubscription
                                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-400 animate-pulse'
                                : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700'
                            }`}
                            title="Package locked to prevent accidental single-click changes. Click to edit or schedule package."
                          >
                            <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>
                              {tenant.subscription.queuedSubscription ? '✨ Queued (Edit)' : 'Edit Package'}
                            </span>
                          </button>

                          {/* Inspect Client Workspace Modal */}
                          <button
                            onClick={() => setInspectingTenant(tenant)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Inspect workspace items, sites, users, and transactions"
                          >
                            <Eye className="w-3 h-3 text-emerald-400" />
                            <span>Inspect</span>
                          </button>

                          {/* Delete Tenant */}
                          {tenant.id !== 'tenant-apex-main' && (
                            <button
                              onClick={() => setConfirmDeleteTenant(tenant)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Delete workspace permanently"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenant Workspace Inspector Modal (Isolated from Gateway) */}
      <TenantWorkspaceInspectorModal
        tenant={inspectingTenant}
        isOpen={!!inspectingTenant}
        onClose={() => setInspectingTenant(null)}
        onExtendTrial={handleExtendTrial}
        onActivateProMonthly={handleActivatePro}
        onActivateProAnnual={handleActivateAnnual}
        onToggleActive={handleToggleActive}
      />

      {/* Delete Tenant Confirmation Modal */}
      {confirmDeleteTenant && (
        <ConfirmModal
          isOpen={!!confirmDeleteTenant}
          title={`Delete Workspace: ${confirmDeleteTenant.companyName}?`}
          message={`Are you sure you want to permanently delete the workspace "${confirmDeleteTenant.companyName}" (app/${confirmDeleteTenant.slug}) and all its associated items, teams, and stock records? This action cannot be undone.`}
          confirmLabel="Permanently Delete Workspace"
          isDestructive={true}
          onConfirm={() => {
            const name = confirmDeleteTenant.companyName;
            deleteTenant(confirmDeleteTenant.id);
            setConfirmDeleteTenant(null);
            showNotification(`Workspace "${name}" was permanently deleted.`);
          }}
          onClose={() => setConfirmDeleteTenant(null)}
        />
      )}

      {/* Configure Bank & QR Payment Modal */}
      {showBankSetupModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden relative my-auto">
            <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">
                  Configure Master Owner Bank & QR Payment Details
                </h3>
              </div>
              <button
                onClick={() => setShowBankSetupModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBankSettings} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial Bank PLC / Sampath Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Developer (Pvt) Ltd"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1000 4829 5012"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Branch / SWIFT Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mulleriyawa / CCBLLKLX"
                    value={bankBranchSwift}
                    onChange={(e) => setBankBranchSwift(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800">
                    USD to LKR Exchange Rate (Rs. per $1.00 USD) *
                  </label>
                  <button
                    type="button"
                    onClick={fetchLiveRate}
                    disabled={isFetchingRate}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFetchingRate ? 'animate-spin' : ''}`} />
                    <span>Auto-Fetch Live Rate</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">$1 USD = Rs.</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="332.64"
                    value={usdToLkrRate}
                    onChange={(e) => setUsdToLkrRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Live market rate: <strong className="text-slate-800">Rs. {usdToLkrRate.toFixed(2)}</strong>. Pro Monthly ($19.90) ≈ <strong>Rs. {Math.round(19.90 * (usdToLkrRate || 332.64)).toLocaleString()}</strong> | Pro Annual ($189.00) ≈ <strong>Rs. {Math.round(189 * (usdToLkrRate || 332.64)).toLocaleString()}</strong>
                </p>
              </div>

              {/* Upload QR Image */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">
                    Upload Bank QR Image (LANKAPAY / Custom QR)
                  </label>
                  {bankQrImage && (
                    <button
                      type="button"
                      onClick={() => setBankQrImage('')}
                      className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      Clear QR Image
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                />

                {bankQrImage && (
                  <div className="mt-2 text-center p-2 bg-white rounded-lg border border-slate-200">
                    <img src={bankQrImage} alt="QR Preview" className="w-28 h-28 object-contain mx-auto" />
                    <span className="text-[10px] text-emerald-700 font-bold mt-1 block">Custom Bank QR Loaded ✓</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBankSetupModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Bank & QR Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tenant Package Lock & Edit Modal */}
      <TenantPackageEditModal
        tenant={editingPackageTenant}
        isOpen={!!editingPackageTenant}
        onClose={() => setEditingPackageTenant(null)}
        onSaveSubscription={handleSaveSubscription}
        onClearQueuedSubscription={handleClearQueuedSubscription}
      />
    </div>
  );
};
