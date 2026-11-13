import React from 'react';
import {
  Boxes,
  FileSpreadsheet,
  Building2,
  Users2,
  AlertTriangle,
  ArrowRightLeft,
  Send,
  PlusCircle,
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatNumber, formatDateTime } from '../../utils/exportUtils';

interface DashboardViewProps {
  onNavigate: (tabId: string) => void;
}

const HUMAN_READABLE_REF_MAP: Record<string, string> = {
  REQUISITION_ISSUE_USAGE: 'Format Setup · Requisition & Usage',
  RECEIPT_RETURN_FOC: 'Format Setup · GRN, Return & FOC',
  PROCUREMENT_PO_INVOICE: 'Format Setup · PO & Supplier Invoice',
  VALUATION_BILLING_DEBIT: 'Format Setup · Debit Note & Valuation',
  MASTER_CLEAR: 'System Reset · Master Data Cleared',
};

function formatTransactionReference(refNo?: string, actionType?: string): string {
  if (!refNo) return actionType ? actionType.replace(/_/g, ' ') : 'System Entry';
  if (HUMAN_READABLE_REF_MAP[refNo]) {
    return HUMAN_READABLE_REF_MAP[refNo];
  }
  if (refNo.includes('_') && refNo === refNo.toUpperCase()) {
    return refNo
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }
  return refNo;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    config,
    activeItems,
    activeSites,
    activeTeams,
    auditLogs,
    getMainWarehouseStock,
    getSiteItemStock,
    allTeamsInHandStock,
    totalLowStockAlertsCount,
    pendingRequestsCount,
  } = useStock();

  // Aggregate low stock alerts across Main and Branches
  const lowStockItemsList: Array<{
    locationName: string;
    locationType: 'Main Warehouse' | 'Site Branch';
    itemCode: string;
    itemName: string;
    unit: string;
    balance: number;
    threshold: number;
  }> = [];

  // 1. Check Main Warehouse
  activeItems.forEach((item) => {
    const mainStk = getMainWarehouseStock(item.id);
    if (mainStk.isLowStock && (mainStk.totalReceived > 0 || mainStk.availableBalance > 0)) {
      lowStockItemsList.push({
        locationName: 'Main Central Warehouse',
        locationType: 'Main Warehouse',
        itemCode: item.itemCode,
        itemName: item.itemName,
        unit: item.unit,
        balance: mainStk.availableBalance,
        threshold: mainStk.threshold,
      });
    }
  });

  // 2. Check Site Branches
  activeSites
    .filter((s) => !s.isMainWarehouse)
    .forEach((site) => {
      activeItems.forEach((item) => {
        const siteStk = getSiteItemStock(site.id, item.id);
        if (siteStk.isLowStock && (siteStk.received > 0 || siteStk.availableBalance > 0)) {
          lowStockItemsList.push({
            locationName: site.name,
            locationType: 'Site Branch',
            itemCode: item.itemCode,
            itemName: item.itemName,
            unit: item.unit,
            balance: siteStk.availableBalance,
            threshold: siteStk.threshold,
          });
        }
      });
    });

  // Summary Metrics
  const totalMainStockUnits = activeItems.reduce(
    (sum, item) => sum + getMainWarehouseStock(item.id).availableBalance,
    0
  );

  const totalMainStockValue = activeItems.reduce(
    (sum, item) =>
      sum + getMainWarehouseStock(item.id).availableBalance * (item.unitPrice || 0),
    0
  );

  const totalInHandUnitsHeldByTeams = allTeamsInHandStock.reduce(
    (sum, t) => sum + t.totalUnitsHeld,
    0
  );

  return (
    <div className="space-y-5">
      {/* Top Executive Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-white/95 via-white/90 to-emerald-50/85 rounded-[26px] border border-white/95 p-5 sm:p-6 shadow-[0_14px_38px_-12px_rgba(15,23,42,0.08),inset_0_1.5px_0_rgba(255,255,255,1)] text-slate-900">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-700 uppercase tracking-[0.14em]">
              <span>Enterprise Operations Overview</span>
              <span className="text-slate-300" aria-hidden="true">•</span>
              <span className="text-slate-500 font-semibold">
                {activeTeams.length} Active Crew{activeTeams.length !== 1 ? 's' : ''} ({formatNumber(totalInHandUnitsHeldByTeams)} Units In-Hand)
              </span>
            </div>
            <h1 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight mt-1.5 leading-tight">
              Operations &amp; Inventory Hub
            </h1>
            <p className="text-xs sm:text-[13.5px] text-slate-600 mt-1 max-w-2xl font-medium leading-relaxed">
              Real-time control covering Central Main Stock, branch requisitions, daily field team issuance, and in-hand balances.
            </p>
          </div>

          {/* Fast Action Toolbar */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 w-full xl:w-auto justify-start xl:justify-end">
            <button
              type="button"
              onClick={() => onNavigate('items')}
              className="h-10 px-4 bg-white hover:bg-emerald-50/90 text-slate-800 hover:text-emerald-900 border border-slate-200/90 hover:border-emerald-300 rounded-xl text-xs font-bold whitespace-nowrap inline-flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
              title="Import assembly units from Excel or manage catalog"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Items (Excel Import)</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('main-stock')}
              className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 rounded-xl text-xs font-bold whitespace-nowrap inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Receive Stock (Main)</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('requests')}
              className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold whitespace-nowrap inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4 shrink-0" />
              <span>Stock Requisition</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('dispatch')}
              className="h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold whitespace-nowrap inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>Issue to Team</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Executive KPI Cards — Strictly Aligned Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Master Item Catalog */}
        <button
          type="button"
          onClick={() => onNavigate('items')}
          className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/80 p-5 flex flex-col justify-between min-h-[168px] text-left transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-start justify-between gap-3 w-full">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Catalog Registry
              </p>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors mt-0.5">
                Master Item Catalog
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-200">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="text-[34px] leading-none font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-700 tabular-nums transition-colors">
              {formatNumber(activeItems.length)}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 w-full text-xs">
            <span className="text-slate-500 font-medium truncate">
              Registered Catalog Items
            </span>
            <span className="text-emerald-700 font-bold whitespace-nowrap inline-flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
              <span>View Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </button>

        {/* Card 2: Central Stock Units */}
        <button
          type="button"
          onClick={() => onNavigate('main-stock')}
          className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 hover:border-slate-800 p-5 flex flex-col justify-between min-h-[168px] text-left transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-start justify-between gap-3 w-full">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Main Warehouse
              </p>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-slate-950 transition-colors mt-0.5">
                Central Stock Units
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/90 text-slate-800 flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-200">
              <Boxes className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="text-[34px] leading-none font-extrabold tracking-tight text-slate-900 tabular-nums">
              {formatNumber(totalMainStockUnits)}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 w-full text-xs">
            <span className="font-mono text-slate-600 font-semibold tabular-nums truncate">
              {config.currencySymbol}{formatNumber(Math.round(totalMainStockValue))} Est.
            </span>
            <span className="text-slate-900 font-bold whitespace-nowrap inline-flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
              <span>Main Stock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </button>

        {/* Card 3: Active Branches */}
        <button
          type="button"
          onClick={() => onNavigate('site-stock')}
          className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 hover:border-blue-500/80 p-5 flex flex-col justify-between min-h-[168px] text-left transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-start justify-between gap-3 w-full">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Regional Network
              </p>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors mt-0.5">
                Active Branches
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-200">
              <Building2 className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3 flex items-baseline gap-2.5">
            <div className="text-[34px] leading-none font-extrabold tracking-tight text-blue-600 tabular-nums">
              {formatNumber(activeSites.length)}
            </div>
            {pendingRequestsCount > 0 && (
              <span className="text-[11px] font-semibold text-amber-700 tabular-nums">
                · {pendingRequestsCount} Pending Req.
              </span>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 w-full text-xs">
            <span className="text-slate-500 font-medium truncate">
              Branch Sites &amp; Yards
            </span>
            <span className="text-blue-600 font-bold whitespace-nowrap inline-flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
              <span>Site Stocks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </button>

        {/* Card 4: Low Stock Alerts */}
        <button
          type="button"
          onClick={() => {
            const tableElem = document.getElementById('low-stock-alert-section');
            if (tableElem) {
              tableElem.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className={`relative overflow-hidden bg-white rounded-2xl border p-5 flex flex-col justify-between min-h-[168px] text-left transition-all duration-200 cursor-pointer group ${
            totalLowStockAlertsCount > 0
              ? 'border-red-300 hover:border-red-500 ring-1 ring-red-100'
              : 'border-slate-200/90 hover:border-emerald-500/80'
          }`}
        >
          <div className="flex items-start justify-between gap-3 w-full">
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-[0.08em] ${
                totalLowStockAlertsCount > 0 ? 'text-red-500' : 'text-slate-400'
              }`}>
                Safety Threshold
              </p>
              <h3 className={`text-sm font-bold mt-0.5 ${
                totalLowStockAlertsCount > 0 ? 'text-red-700' : 'text-slate-800'
              }`}>
                Low Stock Alerts
              </h3>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                totalLowStockAlertsCount > 0
                  ? 'bg-red-50 border border-red-200 text-red-600 group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600'
                  : 'bg-emerald-50 border border-emerald-200/80 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div
              className={`text-[34px] leading-none font-extrabold tracking-tight tabular-nums ${
                totalLowStockAlertsCount > 0 ? 'text-red-600' : 'text-slate-900'
              }`}
            >
              {formatNumber(totalLowStockAlertsCount)}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 w-full text-xs">
            {totalLowStockAlertsCount > 0 ? (
              <span className="text-red-600 font-bold truncate">Under Min. Level</span>
            ) : (
              <span className="text-emerald-700 font-semibold truncate">All Stocks Healthy</span>
            )}
            <span
              className={`font-bold whitespace-nowrap inline-flex items-center gap-1 shrink-0 group-hover:translate-y-0.5 transition-transform ${
                totalLowStockAlertsCount > 0 ? 'text-red-600' : 'text-slate-600 group-hover:text-emerald-700'
              }`}
            >
              <span>View Alerts</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </span>
          </div>
        </button>
      </div>

      {/* Main Grid: Low Stock Threshold Monitor + Recent System Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Low Stock Threshold Monitor */}
        <div
          id="low-stock-alert-section"
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 flex flex-col scroll-mt-20 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-extrabold text-slate-900 text-sm tracking-tight">
                Low Stock Alert Dashboard
              </h2>
              <p className="text-[11.5px] text-slate-500 mt-0.5">
                Real-time minimum threshold monitor across Central Warehouse &amp; Site Yards
              </p>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`text-xs font-mono font-bold tabular-nums ${
                  lowStockItemsList.length > 0 ? 'text-red-600' : 'text-slate-500'
                }`}
              >
                {lowStockItemsList.length} Alert{lowStockItemsList.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-3">Item Code</th>
                  <th className="py-3 px-3">Item Name</th>
                  <th className="py-3 px-3 text-right">In-Stock Balance</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockItemsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 px-4 text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-600 mb-2.5">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        All warehouse and branch balances are healthy
                      </p>
                      <p className="text-[11.5px] text-slate-500 mt-0.5">
                        No inventory items are currently below their configured minimum safety threshold.
                      </p>
                    </td>
                  </tr>
                ) : (
                  lowStockItemsList.map((alert, idx) => (
                    <tr
                      key={`${alert.locationName}-${alert.itemCode}-${idx}`}
                      className="hover:bg-red-50/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                        <span className="text-slate-900 font-bold">{alert.locationName}</span>
                        <div className="text-[10.5px] text-slate-500">{alert.locationType}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                        {alert.itemCode}
                      </td>
                      <td
                        className="py-3 px-3 text-slate-700 font-medium max-w-[200px] truncate"
                        title={alert.itemName}
                      >
                        {alert.itemName}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className="text-red-600 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded text-xs font-mono inline-flex items-center gap-1 tabular-nums">
                          <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                          <span>
                            {formatNumber(alert.balance)} {alert.unit}
                          </span>
                        </span>
                        <div className="text-[10px] text-red-500 font-mono mt-0.5 tabular-nums">
                          Min: {alert.threshold}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {alert.locationType === 'Main Warehouse' ? (
                          <button
                            type="button"
                            onClick={() => onNavigate('main-stock')}
                            className="text-xs text-slate-900 hover:text-emerald-700 font-bold underline cursor-pointer"
                          >
                            Receive Stock
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onNavigate('requests')}
                            className="text-xs text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                          >
                            Request Note
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Recent System Transactions */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm tracking-tight">
                Recent System Transactions
              </h2>
              <p className="text-[11.5px] text-slate-500 mt-0.5">
                Live operational ledger &amp; configuration activity
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('audit')}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold whitespace-nowrap inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <span>View Audit Trail</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-5 py-3 overflow-y-auto max-h-[380px] divide-y divide-slate-100 flex-1">
            {auditLogs.length === 0 ? (
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-500 mb-2.5">
                  <Clock className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">No recent transactions recorded</p>
                <p className="text-[11.5px] text-slate-500 mt-0.5">
                  Stock receipts, requisitions, and team issues will appear here in real time.
                </p>
              </div>
            ) : (
              auditLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="py-3 first:pt-1 last:pb-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-900 tracking-tight truncate">
                      {formatTransactionReference(log.referenceNo, log.action)}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono tabular-nums whitespace-nowrap shrink-0">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {log.details}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1.5">
                    <span className="font-medium text-slate-600">{log.siteName}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      By: <strong className="text-slate-800 font-semibold">{log.performedBy}</strong>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
