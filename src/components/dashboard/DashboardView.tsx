import React from 'react';
import {
  Boxes,
  FileSpreadsheet,
  Building2,
  Users2,
  AlertTriangle,
  ArrowRightLeft,
  Send,
  RotateCcw,
  PlusCircle,
  FileCheck,
  TrendingDown,
  ArrowUpRight,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatNumber, formatDateTime } from '../../utils/exportUtils';
import { StockBalanceCell } from '../common/LowStockIndicator';

interface DashboardViewProps {
  onNavigate: (tabId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    config,
    activeItems,
    activeSites,
    activeTeams,
    stockRequests,
    teamIssues,
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
        // Only report if this branch has held this item or has balance <= threshold
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
      {/* Top Banner / Hero Welcome - Balanced Apple Liquid Glass Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-white/95 via-white/90 to-emerald-50/85 rounded-[28px] border border-white/95 p-5 sm:p-6 shadow-[0_14px_38px_-12px_rgba(15,23,42,0.08),inset_0_1.5px_0_rgba(255,255,255,1)] text-slate-900 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-800 uppercase tracking-widest bg-emerald-100/80 border border-emerald-200/90 px-3 py-0.5 rounded-full">
            <span>Enterprise Overview</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
            Operations & Inventory Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl font-medium">
            Real-time control covering Central Main Stock, branch requisitions, daily field team issuance, and in-hand balances.
          </p>
        </div>

        {/* Fast Action Buttons - Aligned on a single balanced row */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 w-full xl:w-auto justify-start xl:justify-end">
          <button
            onClick={() => onNavigate('items')}
            className="h-9 px-3.5 bg-white hover:bg-emerald-50/80 text-emerald-800 border border-emerald-200/90 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title="Import assembly units from Excel or manage catalog"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Items (Excel Import)</span>
          </button>
          <button
            onClick={() => onNavigate('main-stock')}
            className="h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Receive Stock (Main)</span>
          </button>
          <button
            onClick={() => onNavigate('requests')}
            className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
            <span>Stock Requisition</span>
          </button>
          <button
            onClick={() => onNavigate('dispatch')}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
            <span>Issue to Team</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid with Outer Glow Effects */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Master Item Catalog */}
        <button
          type="button"
          onClick={() => onNavigate('items')}
          className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/30 rounded-2xl border border-slate-200/90 hover:border-emerald-500/70 shadow-md shadow-emerald-500/5 hover:shadow-xl hover:shadow-emerald-500/15 transition-all duration-300 p-4 sm:p-5 cursor-pointer group text-left"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl group-hover:bg-emerald-400/20 transition-all duration-500 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-500 mb-2 relative z-10">
            <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
              Master Item Catalog
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/15 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-emerald-600/30 transition-all duration-300">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-900 group-hover:text-emerald-700 tabular-nums transition-colors relative z-10">
            {formatNumber(activeItems.length)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between relative z-10">
            <span>Registered Catalog Items</span>
            <span className="text-emerald-600 font-bold group-hover:translate-x-1 transition-transform">
              View Catalog →
            </span>
          </div>
        </button>

        {/* Card 2: Central Stock Units */}
        <button
          type="button"
          onClick={() => onNavigate('main-stock')}
          className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-slate-100/50 rounded-2xl border border-slate-200/90 hover:border-slate-800 shadow-md shadow-slate-500/5 hover:shadow-xl hover:shadow-slate-800/15 transition-all duration-300 p-4 sm:p-5 cursor-pointer group text-left"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-400/10 rounded-full blur-2xl group-hover:bg-slate-500/20 transition-all duration-500 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-500 mb-2 relative z-10">
            <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
              Central Stock Units
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-900/10 border border-slate-900/20 text-slate-800 flex items-center justify-center shadow-md shadow-slate-900/10 group-hover:bg-slate-900 group-hover:text-white group-hover:shadow-slate-900/30 transition-all duration-300">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums relative z-10">
            {formatNumber(totalMainStockUnits)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between relative z-10">
            <span className="font-mono text-slate-600 font-semibold">
              {config.currencySymbol}{formatNumber(Math.round(totalMainStockValue))} Est.
            </span>
            <span className="text-slate-900 font-bold group-hover:translate-x-1 transition-transform">
              Main Stock →
            </span>
          </div>
        </button>

        {/* Card 3: Active Branches / Sites */}
        <button
          type="button"
          onClick={() => onNavigate('site-stock')}
          className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 rounded-2xl border border-slate-200/90 hover:border-blue-500/70 shadow-md shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/15 transition-all duration-300 p-4 sm:p-5 cursor-pointer group text-left"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl group-hover:bg-blue-400/20 transition-all duration-500 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-500 mb-2 relative z-10">
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
              Active Branches
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-600 flex items-center justify-center shadow-md shadow-blue-500/15 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-blue-600/30 transition-all duration-300">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-blue-700 tabular-nums relative z-10">
            {activeSites.length}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between relative z-10">
            <span>Branch Sites & Yards</span>
            <span className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform">
              Site Stocks →
            </span>
          </div>
        </button>

        {/* Card 4: Low Stock Alerts with Dynamic Red Glow */}
        <button
          type="button"
          onClick={() => {
            const tableElem = document.getElementById('low-stock-alert-section');
            if (tableElem) {
              tableElem.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className={`relative overflow-hidden text-left rounded-2xl border p-4 sm:p-5 transition-all duration-300 cursor-pointer group ${
            totalLowStockAlertsCount > 0
              ? 'bg-gradient-to-br from-white via-red-50/20 to-red-100/40 border-red-300 hover:border-red-500 shadow-md shadow-red-500/10 hover:shadow-xl hover:shadow-red-500/20 ring-1 ring-red-200'
              : 'bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/30 border-slate-200/90 hover:border-emerald-500/70 shadow-md shadow-emerald-500/5 hover:shadow-xl hover:shadow-emerald-500/15'
          }`}
        >
          <div
            className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl transition-all duration-500 pointer-events-none ${
              totalLowStockAlertsCount > 0
                ? 'bg-red-500/15 group-hover:bg-red-500/25'
                : 'bg-emerald-400/10 group-hover:bg-emerald-400/20'
            }`}
          />
          <div className="flex items-center justify-between text-slate-500 mb-2 relative z-10">
            <span className={`text-xs font-bold ${totalLowStockAlertsCount > 0 ? 'text-red-700' : 'text-slate-700'}`}>
              Low Stock Alerts
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                totalLowStockAlertsCount > 0
                  ? 'bg-red-500/15 border border-red-500/30 text-red-600 shadow-md shadow-red-500/20 group-hover:bg-red-600 group-hover:text-white group-hover:shadow-red-600/40'
                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 shadow-md shadow-emerald-500/15 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-emerald-600/30'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-3xl font-extrabold font-mono tabular-nums relative z-10 ${
              totalLowStockAlertsCount > 0 ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {totalLowStockAlertsCount}
          </div>
          <div className="text-xs mt-2 flex items-center justify-between relative z-10">
            {totalLowStockAlertsCount > 0 ? (
              <span className="text-red-600 font-bold">Under Threshold</span>
            ) : (
              <span className="text-emerald-700 font-bold">All Stocks Healthy</span>
            )}
            <span className="text-red-600 font-bold group-hover:translate-y-0.5 transition-transform">
              View Alerts ↓
            </span>
          </div>
        </button>
      </div>

      {/* Main Grid: Low Stock Indicator List + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Low Stock Critical Alert Table Card with Soft Outer Glow */}
        <div id="low-stock-alert-section" className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-md shadow-slate-900/5 hover:shadow-lg hover:shadow-slate-900/10 transition-all duration-300 flex flex-col scroll-mt-20 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <h2 className="font-bold text-slate-900 text-sm">Low Stock Alert Dashboard (Bold Red Threshold)</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono font-bold bg-slate-200/60 px-2 py-0.5 rounded-md">
              {lowStockItemsList.length} alert{lowStockItemsList.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Item Code</th>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3 text-right">In-Stock Balance</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockItemsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No inventory items currently below threshold.
                    </td>
                  </tr>
                ) : (
                  lowStockItemsList.map((alert, idx) => (
                    <tr key={`${alert.locationName}-${alert.itemCode}-${idx}`} className="hover:bg-red-50/30 transition-colors">
                      <td className="py-2.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                        <span className="text-slate-900 font-semibold">{alert.locationName}</span>
                        <div className="text-[10px] text-slate-500">{alert.locationType}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {alert.itemCode}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-[200px] truncate" title={alert.itemName}>
                        {alert.itemName}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {/* Prompt Requirement: Highlight item balances in Bold Red across all tables and dashboards */}
                        <span className="text-red-600 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded text-xs font-mono inline-flex items-center gap-1 shadow-2xs">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span>{formatNumber(alert.balance)} {alert.unit}</span>
                        </span>
                        <div className="text-[10px] text-red-500 font-mono mt-0.5">
                          Min: {alert.threshold}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {alert.locationType === 'Main Warehouse' ? (
                          <button
                            onClick={() => onNavigate('main-stock')}
                            className="text-xs text-slate-900 hover:text-emerald-700 font-bold underline cursor-pointer"
                          >
                            Receive Stock
                          </button>
                        ) : (
                          <button
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

        {/* Right Column: Live Audit Trail Card with Soft Outer Glow */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-md shadow-slate-900/5 hover:shadow-lg hover:shadow-slate-900/10 transition-all duration-300 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm">Recent System Transactions</h2>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <span>View Audit Trail</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3 space-y-3 overflow-y-auto max-h-[380px] divide-y divide-slate-100">
            {auditLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="pt-2.5 first:pt-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-900">{log.referenceNo}</span>
                  <span className="text-[11px] text-slate-500 font-medium">{formatDateTime(log.timestamp)}</span>
                </div>
                <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{log.details}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                  <span>{log.siteName}</span>
                  <span aria-hidden="true">·</span>
                  <span>By: <strong className="text-slate-700 font-semibold">{log.performedBy}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
