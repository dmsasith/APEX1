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
    <div className="space-y-6">
      {/* Top Banner / Hero Welcome */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Enterprise Overview</span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Operations & Inventory Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Real-time control covering Central Main Stock, branch requisitions, daily field team issuance, and in-hand balances.
          </p>
        </div>

        {/* Fast Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('items')}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Import assembly units from Excel or manage catalog"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Items (Excel Import)</span>
          </button>
          <button
            onClick={() => onNavigate('main-stock')}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Receive Stock (Main)</span>
          </button>
          <button
            onClick={() => onNavigate('requests')}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Stock Requisition</span>
          </button>
          <button
            onClick={() => onNavigate('dispatch')}
            className="px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Issue to Team</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid - Interactive click-throughs to catalog, main-stock, site-stock, and low stock */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Master Item Catalog */}
        <button
          type="button"
          onClick={() => onNavigate('items')}
          className="text-left bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md p-4 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">
              Master Item Catalog
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 group-hover:text-emerald-700 tabular-nums transition-colors">
            {formatNumber(activeItems.length)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Registered Catalog Items</span>
            <span className="text-emerald-600 font-semibold group-hover:translate-x-0.5 transition-transform">
              View Catalog →
            </span>
          </div>
        </button>

        {/* Card 2: Central Stock Units */}
        <button
          type="button"
          onClick={() => onNavigate('main-stock')}
          className="text-left bg-white rounded-xl border border-slate-200 hover:border-slate-800 hover:shadow-md p-4 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
              Central Stock Units
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {formatNumber(totalMainStockUnits)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span className="font-mono text-slate-600">
              {config.currencySymbol}{formatNumber(Math.round(totalMainStockValue))} Est.
            </span>
            <span className="text-slate-900 font-semibold group-hover:translate-x-0.5 transition-transform">
              Main Stock →
            </span>
          </div>
        </button>

        {/* Card 3: Active Branches / Sites */}
        <button
          type="button"
          onClick={() => onNavigate('site-stock')}
          className="text-left bg-white rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md p-4 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">
              Active Branches
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700 tabular-nums">
            {activeSites.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Branch Sites & Yards</span>
            <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
              Site Stocks →
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
          className={`text-left bg-white rounded-xl border p-4 shadow-xs transition-all cursor-pointer group ${
            totalLowStockAlertsCount > 0
              ? 'border-red-300 ring-1 ring-red-200 hover:border-red-500 hover:shadow-md'
              : 'border-slate-200 hover:border-emerald-400 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className={`text-xs font-semibold ${totalLowStockAlertsCount > 0 ? 'text-red-700' : 'text-slate-700'}`}>
              Low Stock Alerts
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                totalLowStockAlertsCount > 0
                  ? 'bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white'
                  : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums ${
              totalLowStockAlertsCount > 0 ? 'text-red-600 font-bold' : 'text-slate-900'
            }`}
          >
            {totalLowStockAlertsCount}
          </div>
          <div className="text-xs mt-1 flex items-center justify-between">
            {totalLowStockAlertsCount > 0 ? (
              <span className="text-red-600 font-medium">Under Threshold</span>
            ) : (
              <span className="text-emerald-700 font-medium">All Stocks Healthy</span>
            )}
            <span className="text-red-600 font-semibold group-hover:translate-x-0.5 transition-transform">
              View Alerts ↓
            </span>
          </div>
        </button>
      </div>

      {/* Main Grid: Low Stock Indicator List + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Low Stock Critical Alert Table (Prominent Bold Red) */}
        <div id="low-stock-alert-section" className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col scroll-mt-20">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <h2 className="font-semibold text-slate-900 text-sm">Low Stock Alert Dashboard (Bold Red Threshold)</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
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
                    <tr key={`${alert.locationName}-${alert.itemCode}-${idx}`} className="hover:bg-red-50/30">
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
                        <span className="text-red-600 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded text-xs font-mono inline-flex items-center gap-1">
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
                            className="text-xs text-slate-900 hover:text-emerald-700 font-semibold underline"
                          >
                            Receive Stock
                          </button>
                        ) : (
                          <button
                            onClick={() => onNavigate('requests')}
                            className="text-xs text-blue-700 hover:text-blue-900 font-semibold underline"
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

        {/* Right Column: Live Audit Trail & Quick Stream */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">Recent System Transactions</h2>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs text-slate-700 hover:text-slate-900 font-medium flex items-center gap-0.5"
            >
              <span>View Audit Trail</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-3 space-y-3 overflow-y-auto max-h-[380px] divide-y divide-slate-100">
            {auditLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="pt-2.5 first:pt-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-slate-900">{log.referenceNo}</span>
                  <span className="text-[11px] text-slate-500">{formatDateTime(log.timestamp)}</span>
                </div>
                <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{log.details}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                  <span>{log.siteName}</span>
                  <span aria-hidden="true">·</span>
                  <span>By: <strong className="text-slate-600 font-medium">{log.performedBy}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
