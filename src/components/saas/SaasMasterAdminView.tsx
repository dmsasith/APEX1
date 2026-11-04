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
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Tenant } from '../../types';
import { formatDateTime } from '../../utils/exportUtils';
import { ConfirmModal } from '../common/ConfirmModal';
import { TenantWorkspaceInspectorModal } from './TenantWorkspaceInspectorModal';

export const SaasMasterAdminView: React.FC = () => {
  const { tenants, currentTenant, switchTenant, switchToMasterStock, updateTenantSubscription, deleteTenant } = useStock();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'trialing' | 'active' | 'expired'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmDeleteTenant, setConfirmDeleteTenant] = useState<Tenant | null>(null);
  const [inspectingTenant, setInspectingTenant] = useState<Tenant | null>(null);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
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
              Monitor registered company workspaces, manage 7-Day trials, activate $19.90/mo subscriptions, and track MRR.
            </p>
          </div>

          <div className="flex items-center gap-3">
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
                          {/* Extend Trial */}
                          <button
                            onClick={() => handleExtendTrial(tenant)}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Add 7 days free trial extension"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+7 Days</span>
                          </button>

                          {/* Activate Pro Monthly */}
                          <button
                            onClick={() => handleActivatePro(tenant)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Set Monthly Pro ($19.90/month)"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Pro ($19.90)</span>
                          </button>

                          {/* Activate Pro Annual ($189/yr) */}
                          <button
                            onClick={() => handleActivateAnnual(tenant)}
                            className="px-2 py-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Set Annual Pro Plan ($189/year — Save 21%)"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Annual ($189)</span>
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
    </div>
  );
};
