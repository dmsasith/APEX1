import React, { useState } from 'react';
import {
  Building2,
  Users2,
  Package,
  FileText,
  Warehouse,
  ShieldCheck,
  Calendar,
  Clock,
  Sparkles,
  Zap,
  Plus,
  Ban,
  CheckCircle2,
  X,
  CreditCard,
  Mail,
  Phone,
  Globe,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { Tenant, Site, Item, User, Team, StockTransferRequest } from '../../types';
import { loadTenantData } from '../../context/StockContext';
import { formatDateTime } from '../../utils/exportUtils';

interface TenantWorkspaceInspectorModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onExtendTrial: (tenant: Tenant) => void;
  onActivateProMonthly: (tenant: Tenant) => void;
  onActivateProAnnual: (tenant: Tenant) => void;
  onToggleActive: (tenant: Tenant) => void;
}

export const TenantWorkspaceInspectorModal: React.FC<TenantWorkspaceInspectorModalProps> = ({
  tenant,
  isOpen,
  onClose,
  onExtendTrial,
  onActivateProMonthly,
  onActivateProAnnual,
  onToggleActive,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'sites' | 'requests' | 'users'>('overview');

  if (!isOpen || !tenant) return null;

  // Load tenant-isolated data on demand without mutating the global active tenant state
  const sites = loadTenantData<Site[]>(tenant.id, 'sites', []);
  const items = loadTenantData<Item[]>(tenant.id, 'items', []);
  const users = loadTenantData<User[]>(tenant.id, 'users', []);
  const teams = loadTenantData<Team[]>(tenant.id, 'teams', []);
  const requests = loadTenantData<StockTransferRequest[]>(tenant.id, 'stockRequests', []);

  const sub = tenant.subscription;
  const isTrial = sub.plan === 'free_trial' || sub.status === 'trialing';
  const trialExpired = isTrial && new Date(sub.trialEndsAt) < new Date();
  const msRemaining = new Date(sub.trialEndsAt).getTime() - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto no-print">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Top Header Banner */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white tracking-tight truncate">
                  {tenant.companyName}
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  app/{tenant.slug}
                </span>

                {/* Plan Badge */}
                {sub.plan === 'pro_annual' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Pro Annual ($189/yr)</span>
                  </span>
                ) : sub.status === 'active' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>Pro Monthly ($19.90/mo)</span>
                  </span>
                ) : trialExpired ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Trial Expired</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{daysRemaining} Days Trial Left</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-emerald-400" />
                  {tenant.contactEmail}
                </span>
                {tenant.contactPhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-teal-400" />
                    {tenant.contactPhone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-blue-400" />
                  {tenant.country || 'Sri Lanka'} ({tenant.currencySymbol || 'Rs.'})
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition cursor-pointer"
            title="Close Inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Bar for Master Developer */}
        <div className="bg-slate-950/70 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Master Management Actions:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onExtendTrial(tenant)}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+7 Days Free Trial</span>
            </button>

            <button
              type="button"
              onClick={() => onActivateProMonthly(tenant)}
              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Activate Monthly ($19.90/mo)</span>
            </button>

            <button
              type="button"
              onClick={() => onActivateProAnnual(tenant)}
              className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Activate Annual ($189/yr)</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleActive(tenant)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                sub.status === 'canceled'
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800'
                  : 'bg-rose-950/40 text-rose-400 border-rose-800'
              }`}
            >
              <Ban className="w-3 h-3" />
              <span>{sub.status === 'canceled' ? 'Re-activate' : 'Suspend'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 pt-3 flex items-center gap-2 shrink-0">
          {[
            { id: 'overview', label: 'Workspace Overview', count: undefined },
            { id: 'sites', label: 'Sites & Yards', count: sites.length },
            { id: 'items', label: 'Item Catalog', count: items.length },
            { id: 'requests', label: 'Transfer Requests', count: requests.length },
            { id: 'users', label: 'Users & Roles', count: users.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-emerald-400 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] font-bold text-slate-400">Total Items in Catalog</div>
                  <div className="text-2xl font-black text-white mt-1">{items.length}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Custom items saved</div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] font-bold text-slate-400">Site Warehouses</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{sites.length}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Central &amp; site yards</div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] font-bold text-slate-400">Field Teams</div>
                  <div className="text-2xl font-black text-teal-400 mt-1">{teams.length}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Active operational crews</div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] font-bold text-slate-400">Requisition Notes</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">{requests.length}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Logged transfer requests</div>
                </div>
              </div>

              {/* Subscription & Database Diagnostics Card */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-3 font-mono text-xs">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Firebase RTDB Isolated Scope</span>
                  <span className="text-emerald-400 font-normal">Active &amp; Multi-Tenant Isolated</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-500">Tenant ID:</span> {tenant.id}
                  </div>
                  <div>
                    <span className="text-slate-500">Workspace Slug:</span> {tenant.slug}
                  </div>
                  <div>
                    <span className="text-slate-500">Subscription Plan:</span> {sub.plan}
                  </div>
                  <div>
                    <span className="text-slate-500">Trial Period Ends:</span> {formatDateTime(sub.trialEndsAt)}
                  </div>
                  <div>
                    <span className="text-slate-500">Created Timestamp:</span> {formatDateTime(tenant.createdAt)}
                  </div>
                  <div>
                    <span className="text-slate-500">Monthly Value:</span> ${sub.monthlyPrice || 19.90} / month
                  </div>
                </div>
              </div>

              {/* Price Plans Explainer */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Commercial Pricing Options for this Client:</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Clients can choose between standard <strong>$19.90 / month</strong> or discounted <strong>$189.00 / year</strong> (save ~$50/yr).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onActivateProMonthly(tenant)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Set Monthly ($19.90)
                  </button>
                  <button
                    type="button"
                    onClick={() => onActivateProAnnual(tenant)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Set Annual ($189)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SITES & YARDS */}
          {activeTab === 'sites' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Registered Site Branches &amp; Yards ({sites.length})
              </h3>
              {sites.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-500 text-xs">
                  No branch sites registered yet for this workspace.
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 text-[11px] font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Site / Yard Name</th>
                        <th className="p-3">Supervisor</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                      {sites.map((s) => (
                        <tr key={s.id}>
                          <td className="p-3 font-bold text-white flex items-center gap-2">
                            <Warehouse className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{s.name}</span>
                          </td>
                          <td className="p-3 text-slate-300">{s.supervisorName || '—'}</td>
                          <td className="p-3 text-slate-400">{s.location || '—'}</td>
                          <td className="p-3 text-slate-400 font-mono">{s.contactNumber || '—'}</td>
                          <td className="p-3">
                            {s.isMainWarehouse ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Main Central Yard
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                                Branch Site
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ITEMS CATALOG */}
          {activeTab === 'items' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Material &amp; Machinery Catalog ({items.length})
              </h3>
              {items.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-500 text-xs">
                  No items imported yet for this company.
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 text-[11px] font-bold border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="p-3">Item Code</th>
                        <th className="p-3">Item Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Unit</th>
                        <th className="p-3 text-right">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-mono font-bold text-emerald-400">{item.itemCode}</td>
                          <td className="p-3 font-semibold text-white">{item.itemName}</td>
                          <td className="p-3 text-slate-400">{item.category}</td>
                          <td className="p-3 text-slate-300 font-mono">{item.unit}</td>
                          <td className="p-3 text-right text-slate-200 font-mono">
                            {tenant.currencySymbol || 'Rs.'} {item.unitPrice.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TRANSFER REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Stock Requisitions &amp; Transfers ({requests.length})
              </h3>
              {requests.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-500 text-xs">
                  No stock transfer requisitions logged yet.
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 text-[11px] font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3">RN Number</th>
                        <th className="p-3">Requested By</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                      {requests.map((r) => (
                        <tr key={r.id}>
                          <td className="p-3 font-mono font-bold text-emerald-400">{r.requestNoteNumber}</td>
                          <td className="p-3 text-white font-medium">{r.requestedBy}</td>
                          <td className="p-3 text-slate-400">{formatDateTime(r.requestedDate)}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                              {r.priority}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: USERS & ROLES */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Staff Accounts &amp; Credentials ({users.length})
              </h3>
              {users.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-500 text-xs">
                  No users found in this workspace.
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 text-[11px] font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Username</th>
                        <th className="p-3">Full Name</th>
                        <th className="p-3">Assigned Role</th>
                        <th className="p-3">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td className="p-3 font-mono font-bold text-emerald-400">{u.username}</td>
                          <td className="p-3 text-white font-medium">{u.fullName}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{formatDateTime(u.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0 text-xs text-slate-400">
          <span>Inspection session isolated from developer portal gateway.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Close Inspection Panel
          </button>
        </div>
      </div>
    </div>
  );
};
