import React, { useState } from 'react';
import {
  Users2,
  Printer,
  Download,
  Search,
  ChevronDown,
  ChevronRight,
  Building,
  Package,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatNumber, formatDate, exportToCsv } from '../../utils/exportUtils';
import { TeamInHandSummary } from '../../types';
import { PrintableDocumentModal } from '../common/PrintableDocumentModal';

export const TeamInHandDashboard: React.FC = () => {
  const {
    sites,
    activeSites,
    teams,
    activeTeams,
    allTeamsInHandStock,
    currentUser,
  } = useStock();

  const [siteFilter, setSiteFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [printDoc, setPrintDoc] = useState<TeamInHandSummary | null>(null);

  // Filtered summaries
  const filteredSummaries = allTeamsInHandStock.filter((summary) => {
    const matchesSite = siteFilter === 'all' || summary.site.id === siteFilter;
    const matchesSearch =
      summary.team.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      summary.team.teamLeaderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      summary.site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      summary.items.some((i) =>
        i.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.itemName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesSite && matchesSearch;
  });

  // KPI calculations
  const totalAssignedAll = allTeamsInHandStock.reduce(
    (sum, t) => sum + t.items.reduce((iSum, item) => iSum + item.totalIssued, 0),
    0
  );
  const totalReturnedAll = allTeamsInHandStock.reduce(
    (sum, t) => sum + t.items.reduce((iSum, item) => iSum + item.totalReturned, 0),
    0
  );
  const totalInHandAll = allTeamsInHandStock.reduce(
    (sum, t) => sum + t.totalUnitsHeld,
    0
  );

  // Requirement: Excel/CSV Export
  const handleExportCsv = () => {
    const rows: Record<string, unknown>[] = [];
    filteredSummaries.forEach((summary) => {
      if (summary.items.length === 0) {
        rows.push({
          'Site Branch': summary.site.name,
          'Team Name': summary.team.teamName,
          'Team Leader': summary.team.teamLeaderName,
          'Item Code': 'NONE',
          'Item Description': 'No materials currently held',
          Unit: '—',
          'Total Assigned': 0,
          'Total Returned': 0,
          'Current Active In-Hand': 0,
          'Last Issued Date': '—',
        });
      } else {
        summary.items.forEach((item) => {
          rows.push({
            'Site Branch': summary.site.name,
            'Team Name': summary.team.teamName,
            'Team Leader': summary.team.teamLeaderName,
            'Item Code': item.itemCode,
            'Item Description': item.itemName,
            Unit: item.unit,
            'Total Assigned': item.totalIssued,
            'Total Returned': item.totalReturned,
            'Current Active In-Hand': item.currentInHand,
            'Last Issued Date': formatDate(item.lastIssuedDate),
          });
        });
      }
    });

    exportToCsv('All_Teams_In_Hand_Stock_Report', rows);
  };

  // Requirement: Print All Report
  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Field Logistics Audit</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Live Team Custody</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Team In-Hand Stock Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Live balance held across all field crews. Audits total stock assigned, items used/returned, and active balances with instant print and Excel/CSV export.
          </p>
        </div>

        {/* Global Export & Print Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export to Excel / CSV</span>
          </button>
          <button
            onClick={handlePrintAll}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Stock Assigned to Field</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {formatNumber(totalAssignedAll)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Cumulative dispatched across all work orders</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Items Returned & Restocked</span>
            <Users2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {formatNumber(totalReturnedAll)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Recovered via official Return Vouchers</div>
        </div>

        <div className="bg-white rounded-xl border border-blue-200 bg-blue-50/20 p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-xs font-bold">Current Active In-Hand Balance</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700 tabular-nums">
            {formatNumber(totalInHandAll)}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Active units currently held by <strong className="text-slate-900 font-mono">{teams.length}</strong> field crews
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by team, leader, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Filter Site:</span>
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none"
          >
            <option value="all">All Operational Sites</option>
            {activeSites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Teams Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-slate-900">All Field Teams Active Custody</h2>
          <span className="text-xs text-slate-500 font-mono">{filteredSummaries.length} crews</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-8"></th>
                <th className="py-3 px-3">Team Name</th>
                <th className="py-3 px-3">Team Leader</th>
                <th className="py-3 px-3">Assigned Site Base</th>
                <th className="py-3 px-3 text-right">Total Assigned</th>
                <th className="py-3 px-3 text-right">Total Returned</th>
                <th className="py-3 px-4 text-right">Active In-Hand Balance</th>
                <th className="py-3 px-3 text-center">Items Held</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No teams match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((summary) => {
                  const isExpanded = expandedTeamId === summary.team.id;

                  return (
                    <React.Fragment key={summary.team.id}>
                      <tr
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-slate-50/70' : ''
                        }`}
                        onClick={() => setExpandedTeamId(isExpanded ? null : summary.team.id)}
                      >
                        <td className="py-3 px-3 text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-700" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-bold text-slate-900 text-sm">{summary.team.teamName}</span>
                          <div className="text-[10px] text-slate-500">Crew: {summary.team.crewSize} members</div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-800 font-medium">
                          {summary.team.teamLeaderName}
                          <div className="text-[10px] text-slate-500">{summary.team.contactPhone}</div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                          {summary.site.name}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {formatNumber(
                            summary.items.reduce((s, i) => s + i.totalIssued, 0)
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {formatNumber(
                            summary.items.reduce((s, i) => s + i.totalReturned, 0)
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span
                            className={`font-mono font-bold text-sm px-2.5 py-1 rounded inline-block ${
                              summary.totalUnitsHeld > 0
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'text-slate-500'
                            }`}
                          >
                            {formatNumber(summary.totalUnitsHeld)} units
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="text-slate-700 font-medium">
                            {summary.distinctItemsCount} material{summary.distinctItemsCount !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setPrintDoc(summary)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium inline-flex items-center gap-1"
                            title="Print Formal Team Statement"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Statement</span>
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Drilldown Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-t border-slate-200">
                          <td colSpan={9} className="p-4 sm:p-6">
                            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
                              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                                  Itemized Custody Breakdown: {summary.team.teamName}
                                </h3>
                                <span className="text-xs text-slate-500">
                                  Leader: <strong>{summary.team.teamLeaderName}</strong>
                                </span>
                              </div>

                              {summary.items.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-2">
                                  No items currently issued or held by this team.
                                </p>
                              ) : (
                                <table className="w-full text-xs text-left">
                                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                    <tr>
                                      <th className="py-2 px-3">Item Code</th>
                                      <th className="py-2 px-3">Item Name</th>
                                      <th className="py-2 px-3 text-center">Unit</th>
                                      <th className="py-2 px-3 text-right">Total Assigned</th>
                                      <th className="py-2 px-3 text-right">Total Returned</th>
                                      <th className="py-2 px-3 text-right">Current In-Hand</th>
                                      <th className="py-2 px-3 text-right">Last Dispatched</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {summary.items.map((item) => (
                                      <tr key={item.itemId} className="hover:bg-slate-50">
                                        <td className="py-2 px-3 font-mono font-semibold text-slate-900">{item.itemCode}</td>
                                        <td className="py-2 px-3 text-slate-800 font-medium">{item.itemName}</td>
                                        <td className="py-2 px-3 text-center text-slate-600">{item.unit}</td>
                                        <td className="py-2 px-3 text-right font-mono text-slate-600">{formatNumber(item.totalIssued)}</td>
                                        <td className="py-2 px-3 text-right font-mono text-slate-600">{formatNumber(item.totalReturned)}</td>
                                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                          {formatNumber(item.currentInHand)}
                                        </td>
                                        <td className="py-2 px-3 text-right text-slate-500 font-mono text-[11px]">
                                          {formatDate(item.lastIssuedDate)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Modal for Single Team Report */}
      {printDoc && (
        <PrintableDocumentModal
          document={{ type: 'TEAM_STOCK_REPORT', data: printDoc }}
          onClose={() => setPrintDoc(null)}
        />
      )}
    </div>
  );
};
