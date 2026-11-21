import React, { useState } from 'react';
import {
  Users2,
  Printer,
  Search,
  ChevronDown,
  ChevronRight,
  Package,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  RotateCcw,
  CheckCircle2,
  MapPin,
  Download,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatNumber, formatDate, exportToCsv } from '../../utils/exportUtils';
import { printHtmlElement, downloadElementAsPdf } from '../../utils/printUtils';
import { TeamInHandSummary } from '../../types';
import { PrintableDocumentModal } from '../common/PrintableDocumentModal';
import { getTemporaryAssignmentBadgeLabel } from '../../utils/teamAssignmentUtils';

export const TeamInHandDashboard: React.FC = () => {
  const {
    activeSites,
    teams,
    allTeamsInHandStock,
  } = useStock();

  const [siteFilter, setSiteFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [printDoc, setPrintDoc] = useState<TeamInHandSummary | null>(null);

  // Filtered summaries (includes teams currently assigned to siteFilter OR transferred teams holding "Stock to Return" for siteFilter)
  const filteredSummaries = allTeamsInHandStock.filter((summary) => {
    const prevReturnGroups = summary.previousSitesStockToReturn || [];
    const matchesSite =
      siteFilter === 'all' ||
      summary.site.id === siteFilter ||
      prevReturnGroups.some((g) => g.siteId === siteFilter);

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      summary.team.teamName.toLowerCase().includes(q) ||
      summary.team.teamLeaderName.toLowerCase().includes(q) ||
      summary.site.name.toLowerCase().includes(q) ||
      summary.items.some(
        (i) => i.itemCode.toLowerCase().includes(q) || i.itemName.toLowerCase().includes(q)
      ) ||
      prevReturnGroups.some(
        (g) =>
          g.siteName.toLowerCase().includes(q) ||
          g.sectionLabel.toLowerCase().includes(q) ||
          g.items.some((i) => i.itemCode.toLowerCase().includes(q) || i.itemName.toLowerCase().includes(q))
      );
    return matchesSite && matchesSearch;
  });

  // KPI calculations (kept strictly separated between Active Assigned Site Stock and Stock to Return to Previous Sites)
  const totalAssignedCurrentSites = allTeamsInHandStock.reduce(
    (sum, t) => sum + t.items.reduce((iSum, item) => iSum + item.totalIssued, 0),
    0
  );
  const totalReturnedCurrentSites = allTeamsInHandStock.reduce(
    (sum, t) => sum + t.items.reduce((iSum, item) => iSum + item.totalReturned, 0),
    0
  );
  const totalUsableInHandCurrentSites = allTeamsInHandStock.reduce(
    (sum, t) => sum + t.totalUnitsHeld,
    0
  );
  const totalStockToReturnPreviousSites = allTeamsInHandStock.reduce(
    (sum, t) => sum + (t.totalUnitsToReturnFromPreviousSites || 0),
    0
  );

  // Excel/CSV Export (strictly separates current site usable stock from "Stock to Return - [Previous Site Name]")
  const handleExportCsv = () => {
    const rows: Record<string, unknown>[] = [];
    filteredSummaries.forEach((summary) => {
      const prevGroups = summary.previousSitesStockToReturn || [];

      // 1. Export any "Stock to Return - [Previous Site Name]" rows first, clearly attributed to that previous site
      prevGroups.forEach((group) => {
        group.items.forEach((item) => {
          rows.push({
            'Custody Classification': `Stock to Return - ${group.siteName}`,
            'Stock Owner Site Branch': group.siteName,
            'Current Team Assigned Site': summary.site.name,
            'Team Name': summary.team.teamName,
            'Team Leader': summary.team.teamLeaderName,
            'Item Code': item.itemCode,
            'Item Description': item.itemName,
            Unit: item.unit,
            'Total Assigned at Site': item.totalIssued,
            'Used in Projects at Site': item.totalUsedInProjects || 0,
            'Wastage at Site': item.totalWastageInProjects || 0,
            'Total Returned to Site': item.totalReturned,
            'Site Balance (Action Required)': `${item.currentInHand} (Stock to Return - ${group.siteName})`,
            'Last Issued Date': formatDate(item.lastIssuedDate),
          });
        });
      });

      // 2. Export Current Assigned Site Stock under the current site's name
      if (summary.items.length === 0 && prevGroups.length === 0) {
        rows.push({
          'Custody Classification': `Active Site Stock - ${summary.site.name}`,
          'Stock Owner Site Branch': summary.site.name,
          'Current Team Assigned Site': summary.site.name,
          'Team Name': summary.team.teamName,
          'Team Leader': summary.team.teamLeaderName,
          'Item Code': 'NONE',
          'Item Description': `No materials currently held under ${summary.site.name}`,
          Unit: '—',
          'Total Assigned at Site': 0,
          'Used in Projects at Site': 0,
          'Wastage at Site': 0,
          'Total Returned to Site': 0,
          'Site Balance (Action Required)': 0,
          'Last Issued Date': '—',
        });
      } else {
        summary.items.forEach((item) => {
          rows.push({
            'Custody Classification': `Active Site Stock - ${summary.site.name} (Usable only at ${summary.site.name})`,
            'Stock Owner Site Branch': summary.site.name,
            'Current Team Assigned Site': summary.site.name,
            'Team Name': summary.team.teamName,
            'Team Leader': summary.team.teamLeaderName,
            'Item Code': item.itemCode,
            'Item Description': item.itemName,
            Unit: item.unit,
            'Total Assigned at Site': item.totalIssued,
            'Used in Projects at Site': item.totalUsedInProjects || 0,
            'Wastage at Site': item.totalWastageInProjects || 0,
            'Total Returned to Site': item.totalReturned,
            'Site Balance (Action Required)': `${item.currentInHand} (Usable at ${summary.site.name})`,
            'Last Issued Date': formatDate(item.lastIssuedDate),
          });
        });
      }
    });

    exportToCsv('All_Teams_Site_Separated_In_Hand_Stock_Report', rows);
  };

  // Print All Report
  const handlePrintAll = async () => {
    await printHtmlElement('team-in-hand-printable-area', 'All_Teams_In_Hand_Stock_Report');
  };

  const handleDownloadPdfAll = async () => {
    await downloadElementAsPdf('team-in-hand-printable-area', 'All_Teams_In_Hand_Stock_Report');
  };

  return (
    <div id="team-in-hand-printable-area" className="space-y-6">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold tracking-wider uppercase">
              <span>Field Logistics Audit</span>
              <span aria-hidden="true" className="text-emerald-400/50">·</span>
              <span className="text-emerald-200">Site-Isolated Team Custody</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Team In-Hand Stock Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Site-isolated material custody across all field crews. Transferred teams display unreturned items from their previous site separately under <strong>&ldquo;Stock to Return - [Site Name]&rdquo;</strong>, while newly assigned site stock is listed under the new site&apos;s name and usable only on that site.
            </p>
          </div>

          {/* Global Export & Print Buttons */}
          <div className="no-print flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-slate-900 border border-white/90 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export to Excel / CSV</span>
            </button>
            <button
              onClick={handlePrintAll}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/25 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Print Report</span>
            </button>
            <button
              onClick={handleDownloadPdfAll}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Grid (Strictly Separated: Current Site Usable vs. Stock to Return to Previous Sites) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-slate-100/40 rounded-2xl border border-slate-200/90 shadow-md shadow-slate-900/5 p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-700">Assigned at Current Sites</span>
            <div className="w-8 h-8 rounded-xl bg-slate-900/10 border border-slate-900/20 text-slate-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
            {formatNumber(totalAssignedCurrentSites)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Dispatched under current assigned sites</div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/40 rounded-2xl border border-slate-200/90 shadow-md shadow-emerald-500/5 p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-700">Returned at Current Sites</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 flex items-center justify-center">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 tabular-nums">
            {formatNumber(totalReturnedCurrentSites)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Recovered via Return Vouchers</div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-blue-100/30 rounded-2xl border border-blue-300/80 shadow-md shadow-blue-500/10 p-4 sm:p-5">
          <div className="flex items-center justify-between text-blue-800 mb-1">
            <span className="text-xs font-black uppercase tracking-wider">Active Site Usable In-Hand</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-blue-700 tabular-nums">
            {formatNumber(totalUsableInHandCurrentSites)}
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            Usable on current sites across <strong className="text-slate-900 font-mono">{teams.length}</strong> crews
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/80 via-white to-rose-50/50 rounded-2xl border-2 border-amber-400/80 shadow-md shadow-amber-500/10 p-4 sm:p-5">
          <div className="flex items-center justify-between text-amber-900 mb-1">
            <span className="text-xs font-black uppercase tracking-wider">Stock to Return (Prev. Sites)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-700 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-800 tabular-nums">
            {formatNumber(totalStockToReturnPreviousSites)}
          </div>
          <div className="text-[11px] text-amber-900/80 font-medium mt-1">
            Must be returned to previous sites (not mixed with new site)
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="no-print bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80 md:w-96 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by team, leader, site, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200 text-xs font-bold cursor-pointer"
              title="Clear Search"
            >
              ✕
            </button>
          )}
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
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-sm text-slate-900">
              All Field Teams Site-Separated Active Custody
            </h2>
            <p className="text-[11px] text-slate-500">
              Click any team row to view their <strong>Active Site Stock</strong> (under their current site name) and any unreturned <strong>Stock to Return - [Previous Site Name]</strong> separately.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">{filteredSummaries.length} crews</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-8"></th>
                <th className="py-3 px-3">Team Name</th>
                <th className="py-3 px-3">Team Leader</th>
                <th className="py-3 px-3">Current Assigned Site</th>
                <th className="py-3 px-3 text-right">Current Site Stock (Usable)</th>
                <th className="py-3 px-4 text-right">Previous Site Stock to Return (Separate)</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No teams match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((summary) => {
                  const isExpanded = expandedTeamId === summary.team.id;
                  const isTemp = summary.team.assignmentStatus === 'Temporary';
                  const prevReturnGroups = summary.previousSitesStockToReturn || [];
                  const hasPrevStockToReturn = prevReturnGroups.length > 0;

                  return (
                    <React.Fragment key={summary.team.id}>
                      <tr
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                          isExpanded
                            ? 'bg-slate-50/80'
                            : hasPrevStockToReturn
                            ? 'bg-amber-50/30'
                            : ''
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
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm">{summary.team.teamName}</span>
                            {isTemp && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                <Clock className="w-2.5 h-2.5 text-amber-700" />
                                {getTemporaryAssignmentBadgeLabel(summary.site.name)}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Crew: {summary.team.crewSize} members
                            {summary.team.previousSiteName ? ` · Previous Site: ${summary.team.previousSiteName}` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-800 font-medium">
                          {summary.team.teamLeaderName}
                          <div className="text-[10px] text-slate-500">{summary.team.contactPhone}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{summary.site.name}</span>
                          </div>
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            {isTemp ? 'Temporary Assigned Base' : 'Permanent Assigned Base'}
                          </div>
                        </td>

                        {/* Current Assigned Site Usable Stock (Strictly under Current Site Name) */}
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex flex-col items-end">
                            <span
                              className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg border ${
                                summary.totalUnitsHeld > 0
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-slate-50 text-slate-500 border-slate-200'
                              }`}
                            >
                              {summary.site.name}: {formatNumber(summary.totalUnitsHeld)} units
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5">
                              {summary.distinctItemsCount} usable item{summary.distinctItemsCount !== 1 ? 's' : ''} at {summary.site.name}
                            </span>
                          </div>
                        </td>

                        {/* Previous Site(s) Stock to Return — Displayed Strictly Separately! */}
                        <td className="py-3 px-4 text-right">
                          {!hasPrevStockToReturn ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>No Pending Return to Previous Sites</span>
                            </span>
                          ) : (
                            <div className="flex flex-col items-end gap-1">
                              {prevReturnGroups.map((grp) => (
                                <div
                                  key={grp.siteId}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100/90 text-amber-950 border border-amber-400 text-xs font-extrabold shadow-2xs"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                  <span>
                                    Stock to Return - {grp.siteName}:{' '}
                                    <strong className="font-mono text-rose-800">
                                      {formatNumber(grp.totalUnitsHeld)} units
                                    </strong>{' '}
                                    ({grp.distinctItemsCount} item{grp.distinctItemsCount !== 1 ? 's' : ''})
                                  </span>
                                </div>
                              ))}
                              <span className="text-[10px] text-rose-700 font-semibold">
                                Must return to previous site (cannot use at {summary.site.name})
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setPrintDoc(summary)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                            title="Print Formal Team Statement"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Statement</span>
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Drilldown Row — Separated by Site! */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-t border-slate-200">
                          <td colSpan={7} className="p-4 sm:p-6 space-y-5">
                            {/* SECTION 1: PREVIOUS SITE(S) "STOCK TO RETURN - [SITE NAME]" */}
                            {hasPrevStockToReturn &&
                              prevReturnGroups.map((prevGroup) => (
                                <div
                                  key={prevGroup.siteId}
                                  className="bg-amber-50/80 rounded-xl border-2 border-amber-400 p-4 shadow-xs space-y-3"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-amber-300/80">
                                    <div className="flex items-start gap-2.5">
                                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                                        <RotateCcw className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h3 className="font-extrabold text-sm text-amber-950 uppercase tracking-tight">
                                            Stock to Return - {prevGroup.siteName}
                                          </h3>
                                          <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-extrabold uppercase">
                                            Belongs to {prevGroup.siteName} · Cannot Use at {summary.site.name}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-amber-900 font-medium mt-0.5">
                                          These items were taken by <strong>{summary.team.teamName}</strong> while at{' '}
                                          <strong>{prevGroup.siteName}</strong> and have not been returned yet. They are kept separate from{' '}
                                          <strong>{summary.site.name}</strong> stock and must be returned to{' '}
                                          <strong>{prevGroup.siteName}</strong>.
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right bg-white px-3 py-1.5 rounded-xl border border-amber-300">
                                      <div className="text-[10px] font-bold uppercase text-amber-800">
                                        Stock to Return - {prevGroup.siteName}
                                      </div>
                                      <div className="text-sm font-black font-mono text-rose-700">
                                        {formatNumber(prevGroup.totalUnitsHeld)} Units ({prevGroup.distinctItemsCount} Items)
                                      </div>
                                    </div>
                                  </div>

                                  <div className="overflow-x-auto bg-white rounded-lg border border-amber-200">
                                    <table className="w-full text-xs text-left">
                                      <thead className="bg-amber-100/70 text-amber-950 font-bold border-b border-amber-200">
                                        <tr>
                                          <th className="py-2 px-3">Item Code</th>
                                          <th className="py-2 px-3">Item Name</th>
                                          <th className="py-2 px-3">Site Tag</th>
                                          <th className="py-2 px-3 text-center">Unit</th>
                                          <th className="py-2 px-3 text-right">Assigned ({prevGroup.siteName})</th>
                                          <th className="py-2 px-3 text-right text-teal-700">Used ({prevGroup.siteName})</th>
                                          <th className="py-2 px-3 text-right text-amber-700">Wastage</th>
                                          <th className="py-2 px-3 text-right">Returned ({prevGroup.siteName})</th>
                                          <th className="py-2 px-3 text-right text-rose-800">
                                            Stock to Return - {prevGroup.siteName}
                                          </th>
                                          <th className="py-2 px-3 text-right">Last Dispatched</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-amber-100">
                                        {prevGroup.items.map((item) => (
                                          <tr key={`${prevGroup.siteId}-${item.itemId}`} className="hover:bg-amber-50/40">
                                            <td className="py-2 px-3 font-mono font-bold text-slate-900">{item.itemCode}</td>
                                            <td className="py-2 px-3 text-slate-900 font-semibold">{item.itemName}</td>
                                            <td className="py-2 px-3">
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-950 border border-amber-300">
                                                Stock to Return - {prevGroup.siteName}
                                              </span>
                                            </td>
                                            <td className="py-2 px-3 text-center text-slate-600">{item.unit}</td>
                                            <td className="py-2 px-3 text-right font-mono text-slate-600">
                                              {formatNumber(item.totalIssued)}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-semibold text-teal-700">
                                              {formatNumber(item.totalUsedInProjects || 0)}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-semibold text-amber-700">
                                              {formatNumber(item.totalWastageInProjects || 0)}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono text-slate-600">
                                              {formatNumber(item.totalReturned)}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-black text-rose-700 bg-rose-50/60">
                                              {formatNumber(item.currentInHand)} {item.unit}
                                            </td>
                                            <td className="py-2 px-3 text-right text-slate-500 font-mono text-[11px]">
                                              {formatDate(item.lastIssuedDate)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ))}

                            {/* SECTION 2: CURRENT ASSIGNED SITE STOCK (USABLE ONLY AT CURRENT ASSIGNED SITE) */}
                            <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-xs space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                                <div className="flex items-start gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                                    <Package className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">
                                        {summary.site.name} — Active Site Stock ({summary.team.teamName})
                                      </h3>
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold uppercase">
                                        Usable Only at {summary.site.name}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      Materials dispatched to <strong>{summary.team.teamName}</strong> under{' '}
                                      <strong>{summary.site.name}</strong>. Only these items can be consumed on projects at{' '}
                                      <strong>{summary.site.name}</strong>.
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right bg-blue-50/70 px-3 py-1.5 rounded-xl border border-blue-200">
                                  <div className="text-[10px] font-bold uppercase text-blue-800">
                                    {summary.site.name} Usable In-Hand
                                  </div>
                                  <div className="text-sm font-black font-mono text-blue-700">
                                    {formatNumber(summary.totalUnitsHeld)} Units ({summary.distinctItemsCount} Items)
                                  </div>
                                </div>
                              </div>

                              {summary.items.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-2">
                                  No items currently issued or held by <strong>{summary.team.teamName}</strong> under{' '}
                                  <strong>{summary.site.name}</strong>.
                                </p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                      <tr>
                                        <th className="py-2 px-3">Item Code</th>
                                        <th className="py-2 px-3">Item Name</th>
                                        <th className="py-2 px-3">Assigned Site</th>
                                        <th className="py-2 px-3 text-center">Unit</th>
                                        <th className="py-2 px-3 text-right">Assigned ({summary.site.name})</th>
                                        <th className="py-2 px-3 text-right text-teal-700">Used ({summary.site.name})</th>
                                        <th className="py-2 px-3 text-right text-amber-700">Wastage</th>
                                        <th className="py-2 px-3 text-right">Returned ({summary.site.name})</th>
                                        <th className="py-2 px-3 text-right text-blue-800">
                                          Usable In-Hand ({summary.site.name})
                                        </th>
                                        <th className="py-2 px-3 text-right">Last Dispatched</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {summary.items.map((item) => (
                                        <tr key={`${summary.site.id}-${item.itemId}`} className="hover:bg-slate-50">
                                          <td className="py-2 px-3 font-mono font-semibold text-slate-900">{item.itemCode}</td>
                                          <td className="py-2 px-3 text-slate-800 font-medium">{item.itemName}</td>
                                          <td className="py-2 px-3">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                              {summary.site.name}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 text-center text-slate-600">{item.unit}</td>
                                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                                            {formatNumber(item.totalIssued)}
                                          </td>
                                          <td className="py-2 px-3 text-right font-mono font-semibold text-teal-700">
                                            {formatNumber(item.totalUsedInProjects || 0)}
                                          </td>
                                          <td className="py-2 px-3 text-right font-mono font-semibold text-amber-700">
                                            {formatNumber(item.totalWastageInProjects || 0)}
                                          </td>
                                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                                            {formatNumber(item.totalReturned)}
                                          </td>
                                          <td className="py-2 px-3 text-right font-mono font-bold text-blue-800 bg-blue-50/40">
                                            {formatNumber(item.currentInHand)} {item.unit}
                                          </td>
                                          <td className="py-2 px-3 text-right text-slate-500 font-mono text-[11px]">
                                            {formatDate(item.lastIssuedDate)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
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

