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
import { getThemeConfig } from '../../utils/themeUtils';

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

  const theme = getThemeConfig(config?.themeId || config?.logoColor);

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
      <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-sm overflow-hidden">
        <div
          className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: theme.accentHex }}
        />
        <div
          className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-15"
          style={{ backgroundColor: theme.secondaryHex }}
        />

        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5">
          <div className="min-w-0 space-y-1.5">
            <div className={`flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide ${theme.accentText}`}>
              <span>Enterprise Operations Overview</span>
              <span className="opacity-50" aria-hidden="true">·</span>
              <span className={`${theme.subAccentText} tabular-nums`}>
                {activeTeams.length} Active Crew{activeTeams.length !== 1 ? 's' : ''} ({formatNumber(totalInHandUnitsHeldByTeams)} Units In-Hand)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Operations &amp; Inventory Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time control covering Central Main Stock, branch requisitions, daily field team issuance, and in-hand balances.
            </p>
          </div>

          {/* Fast Action Toolbar */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 w-full xl:w-auto justify-start xl:justify-end">
            <button
              type="button"
              onClick={() => onNavigate('items')}
              className="h-10 px-4 bg-white hover:bg-emerald-50 text-slate-900 border border-white/80 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              title="Import assembly units from Excel or manage catalog"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Items (Excel Import)</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('main-stock')}
              className="h-10 px-4 bg-indigo-600/90 hover:bg-indigo-500 text-white border border-indigo-400/40 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-indigo-100 shrink-0" />
              <span>Receive Stock (Main)</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('requests')}
              className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/50 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 inline-flex items-center gap-2 transition-all shadow-md shadow-emerald-600/25 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4 shrink-0" />
              <span>Stock Requisition</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('dispatch')}
              className="h-10 px-4 bg-sky-600 hover:bg-sky-500 text-white border border-sky-400/50 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 inline-flex items-center gap-2 transition-all shadow-md shadow-sky-600/25 cursor-pointer"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>Issue to Team</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Vibrant Executive KPI Cards — Strictly Aligned Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Master Item Catalog (Emerald & Teal Gradient) */}
        <button
          type="button"
          onClick={() => onNavigate('items')}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-2xl border border-emerald-500/40 hover:from-emerald-500 hover:via-emerald-600 hover:to-teal-700 p-5 flex flex-col justify-between min-h-[172px] text-left transition-all duration-200 shadow-md shadow-emerald-950/10 cursor-pointer group"
        >
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between gap-3 w-full">
            <div>
              <p className="text-xs font-semibold text-emerald-100/90 tracking-wide">
                Catalog Registry
              </p>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                Master Item Catalog
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 text-white flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-emerald-700 transition-colors duration-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10 my-3">
            <div className="text-[36px] leading-none font-extrabold tracking-tight text-white tabular-nums">
              {formatNumber(activeItems.length)}
            </div>
          </div>

          <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between gap-2 w-full text-xs">
            <span className="text-emerald-100 font-medium truncate">
              Registered Catalog Items
            </span>
            <span className="text-white font-bold whitespace-nowrap inline-flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
              <span>View Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </button>

        {/* Card 2: Central Stock Units (Indigo & Royal Blue Gradient) */}
        <button
          type="button"
          onClick={() => onNavigate('main-stock')}
          className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-900 text-white rounded-2xl border border-indigo-400/40 hover:from-indigo-500 hover:via-indigo-600 hover:to-blue-800 p-5 flex flex-col justify-between min-h-[172px] text-left transition-all duration-200 shadow-md shadow-indigo-950/10 cursor-pointer group"
        >
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between gap-3 w-full">
            <div>
              <p className="text-xs font-semibold text-indigo-100/90 tracking-wide">
                Main Warehouse
              </p>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                Central Stock Units
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 text-white flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-indigo-700 transition-colors duration-200">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10 my-3">
            <div className="text-[36px] leading-none font-extrabold tracking-tight text-white tabular-nums">
              {formatNumber(totalMainStockUnits)}
            </div>
          </div>

          <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between gap-2 w-full text-xs">
            <span className="font-mono text-indigo-100 font-semibold tabular-nums truncate">
              {config.currencySymbol}{formatNumber(Math.round(totalMainStockValue))} Est.
            </span>
            <span className="text-white font-bold whitespace-nowrap inline-flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
              <span>Main Stock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </button>

        {/* Card 3: Active Branches (Sky & Cyan-Blue Gradient) */}
        <button
          type="button"
          onClick={() => onNavigate('site-stock')}
          className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-blue-600 to-cyan-800 text-white rounded-2xl border border-sky-400/40 hover:from-sky-500 hover:via-blue-500 hover:to-cyan-700 p-5 flex flex-col justify-between min-h-[172px] text-left transition-all duration-200 shadow-md shadow-sky-950/10 cursor-pointer group"
        >
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between gap-3 w-full">
            <div>
              <p className="text-xs font-semibold text-sky-100/90 tracking-wide">
                Regional Network
              </p>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                Active Branches
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 text-white flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-sky-700 transition-colors duration-200">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10 my-3 flex items-baseline gap-2.5">
            <div className="text-[36px] leading-none font-extrabold tracking-tight text-white tabular-nums">
              {formatNumber(activeSites.length)}
            </div>
            {pendingRequestsCount > 0 && (
              <span className="text-xs font-semibold text-amber-200 tabular-nums">
                · {pendingRequestsCount} Pending Req.
              </span>
            )}
          </div>

          <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between gap-2 w-full text-xs">
            <span className="text-sky-100 font-medium truncate">
              Branch Sites &amp; Yards
            </span>
            <span className="text-white font-bold whitespace-nowrap inline-flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
              <span>Site Stocks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </button>

        {/* Card 4: Low Stock Alerts (Neutral Gray when 0, Warm Amber-Orange Warning Gradient when > 0) */}
        <button
          type="button"
          onClick={() => {
            const tableElem = document.getElementById('low-stock-alert-section');
            if (tableElem) {
              tableElem.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className={`relative overflow-hidden text-white rounded-2xl border p-5 flex flex-col justify-between min-h-[172px] text-left transition-all duration-200 shadow-md cursor-pointer group ${
            totalLowStockAlertsCount > 0
              ? 'bg-gradient-to-br from-amber-600 via-orange-700 to-stone-800 hover:from-amber-500 hover:via-orange-600 hover:to-stone-700 border-amber-400/40 shadow-amber-950/10'
              : 'bg-gradient-to-br from-slate-500 via-slate-600 to-slate-800 hover:from-slate-500 hover:via-slate-600 hover:to-slate-700 border-slate-400/40 shadow-slate-950/10'
          }`}
        >
          <div
            className={`absolute -right-6 -top-6 w-28 h-28 rounded-full blur-2xl pointer-events-none ${
              totalLowStockAlertsCount > 0 ? 'bg-amber-300/10' : 'bg-white/10'
            }`}
          />
          <div className="relative z-10 flex items-start justify-between gap-3 w-full">
            <div>
              <p
                className={`text-xs font-semibold tracking-wide ${
                  totalLowStockAlertsCount > 0 ? 'text-amber-100/90' : 'text-slate-200/90'
                }`}
              >
                Safety Threshold
              </p>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                Low Stock Alerts
              </h3>
            </div>
            <div
              className={`w-11 h-11 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors duration-200 ${
                totalLowStockAlertsCount > 0
                  ? 'text-amber-100 group-hover:text-amber-700'
                  : 'text-slate-100 group-hover:text-slate-700'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10 my-3 flex items-baseline gap-2">
            <div className="text-[36px] leading-none font-extrabold tracking-tight text-white tabular-nums">
              {formatNumber(totalLowStockAlertsCount)}
            </div>
            {totalLowStockAlertsCount > 0 && (
              <span className="text-xs font-semibold text-amber-100/90">
                · Needs Restock
              </span>
            )}
          </div>

          <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between gap-2 w-full text-xs">
            {totalLowStockAlertsCount > 0 ? (
              <span className="text-amber-100 font-semibold truncate">Under Min. Level</span>
            ) : (
              <span className="text-slate-200 font-medium truncate">All Stocks Healthy</span>
            )}
            <span className="text-white font-bold whitespace-nowrap inline-flex items-center gap-1 shrink-0 group-hover:translate-y-0.5 transition-transform">
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
          className="lg:col-span-7 bg-white rounded-2xl border border-amber-200/80 flex flex-col scroll-mt-20 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-amber-200/70 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-stone-50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="font-extrabold text-slate-900 text-sm tracking-tight">
                  Low Stock Alert Dashboard
                </h2>
                <p className="text-[11.5px] text-slate-600 mt-0.5">
                  Real-time minimum threshold monitor across Central Warehouse &amp; Site Yards
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`text-xs font-mono font-bold tabular-nums ${
                  lowStockItemsList.length > 0 ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {lowStockItemsList.length} Alert{lowStockItemsList.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/90 text-slate-700 font-bold text-[11px] border-b border-slate-200/80">
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
                      <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-100/80 border border-emerald-300/70 text-emerald-700 mb-2.5">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
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
                      className="hover:bg-amber-50/40 transition-colors"
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
                        <span className="text-amber-700 font-bold text-xs font-mono inline-flex items-center gap-1 tabular-nums">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            {formatNumber(alert.balance)} {alert.unit}
                          </span>
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 tabular-nums">
                          Min: {alert.threshold}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {alert.locationType === 'Main Warehouse' ? (
                          <button
                            type="button"
                            onClick={() => onNavigate('main-stock')}
                            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
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
        <div className="lg:col-span-5 bg-white rounded-2xl border border-indigo-200/80 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-indigo-200/70 bg-gradient-to-r from-indigo-50 via-blue-50/70 to-emerald-50/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-400/40 text-indigo-700 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="font-extrabold text-slate-900 text-sm tracking-tight">
                  Recent System Transactions
                </h2>
                <p className="text-[11.5px] text-slate-600 mt-0.5">
                  Live operational ledger &amp; configuration activity
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('audit')}
              className="text-xs text-indigo-700 hover:text-indigo-900 font-bold whitespace-nowrap inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <span>View Audit Trail</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-5 py-3 overflow-y-auto max-h-[380px] divide-y divide-slate-100 flex-1">
            {auditLogs.length === 0 ? (
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200/70 text-indigo-600 mb-2.5">
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
                    <span className="text-[11px] text-indigo-700 font-mono font-semibold tabular-nums whitespace-nowrap shrink-0">
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
