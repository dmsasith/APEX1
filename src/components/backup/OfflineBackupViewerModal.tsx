import React, { useState, useMemo } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  FileJson,
  Printer,
  Boxes,
  Building2,
  Users2,
  Truck,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Search,
  HardDrive,
  Database,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FolderGit2,
  Coins,
  ChevronRight,
} from 'lucide-react';
import { StockBackup, Item, Site, Team, MainStockEntry, TeamIssue, TeamReturn, ProjectMaterialUsage, PurchaseOrder } from '../../types';
import { exportBackupToExcel } from '../../utils/excelExportUtils';
import { exportToCsv, formatDateTime, formatNumber } from '../../utils/exportUtils';
import { STORAGE_KEY_PREFIX } from '../../context/StockContext';

interface OfflineBackupViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBackupData?: StockBackup | null;
}

export const OfflineBackupViewerModal: React.FC<OfflineBackupViewerModalProps> = ({
  isOpen,
  onClose,
  initialBackupData,
}) => {
  const [backup, setBackup] = useState<StockBackup | null>(initialBackupData || null);
  const [activeTab, setActiveTab] = useState<'items' | 'receipts' | 'issues' | 'returns' | 'projects' | 'sites_teams' | 'pos' | 'raw'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  // Sync initial data if provided
  React.useEffect(() => {
    if (initialBackupData) {
      setBackup(initialBackupData);
      setParseError(null);
    }
  }, [initialBackupData]);

  if (!isOpen) return null;

  // Handle file drop / upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Normalize if raw snapshot or wrapped
        let normalizedBackup: StockBackup;
        if (parsed.snapshot && (parsed.snapshot.items || parsed.snapshot.config)) {
          normalizedBackup = parsed as StockBackup;
        } else if (parsed.items || parsed.config) {
          normalizedBackup = {
            id: `imported-${Date.now()}`,
            backupNumber: 1,
            name: file.name.replace('.json', ''),
            createdAt: new Date().toISOString(),
            createdBy: 'Imported File',
            reason: 'Offline File Inspection',
            itemCount: parsed.items?.length || 0,
            transactionCount: (parsed.mainStockEntries?.length || 0) + (parsed.teamIssues?.length || 0),
            snapshot: parsed,
          };
        } else {
          throw new Error('Unsupported JSON format. Expected StockBackup JSON structure.');
        }

        setBackup(normalizedBackup);
      } catch (err: unknown) {
        setParseError(err instanceof Error ? err.message : 'Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
  };

  // Try to find auto-saved browser snapshot in localStorage
  const handleLoadAutoSavedBrowserBackup = () => {
    try {
      setParseError(null);
      // Look for daily auto snapshot or any active backups in local storage
      let foundData: StockBackup | null = null;

      // Check all keys matching apex_daily_auto_snapshot_
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('apex_daily_auto_snapshot_') || key.endsWith('_backups') || key === `${STORAGE_KEY_PREFIX}backups`)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].snapshot) {
              foundData = parsed[0];
              break;
            } else if (parsed.snapshot) {
              foundData = parsed;
              break;
            }
          }
        }
      }

      if (foundData) {
        setBackup(foundData);
      } else {
        setParseError('No auto-saved local database snapshots found in this browser cache. Please upload a saved .json backup file.');
      }
    } catch {
      setParseError('Failed to read auto-saved local data from browser storage.');
    }
  };

  const handleExportExcel = () => {
    if (!backup) return;
    exportBackupToExcel(backup);
  };

  const handlePrint = () => {
    window.print();
  };

  const snap = backup?.snapshot;
  const items = snap?.items || [];
  const sites = snap?.sites || [];
  const teams = snap?.teams || [];
  const mainStockEntries = snap?.mainStockEntries || [];
  const teamIssues = snap?.teamIssues || [];
  const teamReturns = snap?.teamReturns || [];
  const projectUsages = snap?.projectUsages || [];
  const purchaseOrders = snap?.purchaseOrders || [];

  // Filtered Items
  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.itemCode.toLowerCase().includes(q) ||
      item.itemName.toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-2 sm:p-4 backdrop-blur-md overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full h-[95vh] flex flex-col border border-slate-200 overflow-hidden text-slate-900">
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  Emergency Offline Backup Viewer & Excel Converter
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  100% Offline
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inspect, print, or convert your system backup files to Excel (.xlsx) even if servers or domains are offline.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {backup && (
              <>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                  title="Export all tables into an organized multi-sheet Excel .xlsx workbook"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Convert to Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Print current table"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBackup(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Load Another File
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2 flex items-center justify-between text-xs text-emerald-950 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Zero Vendor Lock-in:</strong> Use this offline tool to instantly open your <strong>.json backup</strong> file or local browser cache, inspect all stock inventory, transactions, and dispatches, and export everything directly to multi-sheet Excel (.xlsx) spreadsheets.
            </span>
          </div>
          <span className="text-[11px] text-emerald-800 font-mono hidden md:inline">
            Apex Developer Disaster Recovery Tool
          </span>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-6 bg-slate-50">
          {!backup ? (
            /* Upload / Drag-and-drop state */
            <div className="max-w-2xl w-full mx-auto my-auto space-y-6 text-center animate-in fade-in">
              <div className="p-8 sm:p-12 bg-white border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl shadow-sm transition-all flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                  <Upload className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    Upload or Drop Your Stock Backup File (.json)
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Select any JSON backup exported from the system. It will be decoded and rendered right inside your browser without contacting any external servers.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <label className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer">
                    <FileJson className="w-4 h-4 text-emerald-400" />
                    <span>Browse .JSON Backup File</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleLoadAutoSavedBrowserBackup}
                    className="px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                  >
                    <HardDrive className="w-4 h-4 text-emerald-600" />
                    <span>Load Auto-Saved Browser Local Cache</span>
                  </button>
                </div>

                {parseError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 text-left">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{parseError}</span>
                  </div>
                )}
              </div>

              {/* Instructions Pill */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span>1. Reads Any Backup</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Parses all materials, stock transactions, field teams, and usage vouchers.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>2. Genuine Excel Sheets</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    1-Click button generates multi-sheet .xlsx files readable in Microsoft Excel or Google Sheets.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>3. Always Accessible</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Operates client-side in the browser. Never depends on domain renewals or cloud servers.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Parsed Data Viewer State */
            <div className="flex-1 flex flex-col overflow-hidden space-y-4">
              {/* Snapshot Info Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">COMPANY / WORKSPACE</div>
                  <div className="font-extrabold text-slate-900 text-sm truncate mt-0.5">
                    {snap?.config?.companyName || backup.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Backup #{backup.backupNumber}</div>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">DATE CAPTURED</div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">
                    {formatDateTime(backup.createdAt)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">By: {backup.createdBy}</div>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">ITEMS CATALOG</div>
                  <div className="font-black text-emerald-600 text-base mt-0.5">
                    {formatNumber(items.length)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Distinct materials & tools</div>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">TOTAL TRANSACTIONS</div>
                  <div className="font-black text-blue-600 text-base mt-0.5">
                    {formatNumber(mainStockEntries.length + teamIssues.length + teamReturns.length + projectUsages.length)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Historical movements</div>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">SITES & TEAMS</div>
                  <div className="font-black text-purple-600 text-base mt-0.5">
                    {sites.length} Sites · {teams.length} Teams
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Branch operations</div>
                </div>
              </div>

              {/* Navigation Tabs and Search Bar */}
              <div className="bg-white p-2 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto scrollbar-thin pb-1 md:pb-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('items')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      activeTab === 'items'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Boxes className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Items ({items.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('receipts')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      activeTab === 'receipts'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Main Receipts ({mainStockEntries.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('issues')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      activeTab === 'issues'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Dispatches ({teamIssues.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('returns')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      activeTab === 'returns'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
                    <span>Returns ({teamReturns.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('projects')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      activeTab === 'projects'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FolderGit2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Project Usages ({projectUsages.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('sites_teams')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      activeTab === 'sites_teams'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Sites & Teams ({sites.length + teams.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('raw')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      activeTab === 'raw'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FileJson className="w-3.5 h-3.5 text-slate-400" />
                    <span>Raw JSON</span>
                  </button>
                </div>

                {activeTab === 'items' && (
                  <div className="relative w-full md:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search items, codes, categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                )}
              </div>

              {/* Table Data Content Viewport */}
              <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col">
                <div className="overflow-auto flex-1">
                  {/* 1. Items View */}
                  {activeTab === 'items' && (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">Item Code</th>
                          <th className="p-3">Item Name</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Unit</th>
                          <th className="p-3 text-right">Unit Price</th>
                          <th className="p-3 text-right">Low Stock Alert</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredItems.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400">
                              No materials found matching search query.
                            </td>
                          </tr>
                        ) : (
                          filteredItems.map((item, idx) => (
                            <tr key={item.id || idx} className="hover:bg-slate-50">
                              <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                              <td className="p-3 font-mono font-bold text-slate-900">{item.itemCode}</td>
                              <td className="p-3 font-medium text-slate-900">{item.itemName}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {item.category}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-slate-600">{item.unit}</td>
                              <td className="p-3 text-right font-mono text-slate-800">
                                {formatNumber(item.unitPrice || 0)}
                              </td>
                              <td className="p-3 text-right font-mono text-amber-700 font-bold">
                                {formatNumber(item.lowStockThreshold || 0)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* 2. Main Receipts View */}
                  {activeTab === 'receipts' && (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">Timestamp</th>
                          <th className="p-3">Reference / PO #</th>
                          <th className="p-3">Supplier</th>
                          <th className="p-3">Item</th>
                          <th className="p-3 text-right">Quantity</th>
                          <th className="p-3 text-right">Unit Cost</th>
                          <th className="p-3 text-right">Total Cost</th>
                          <th className="p-3">Received By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {mainStockEntries.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-8 text-center text-slate-400">
                              No main stock receipts in this backup.
                            </td>
                          </tr>
                        ) : (
                          mainStockEntries.map((e, idx) => {
                            const itm = items.find((i) => i.id === e.itemId);
                            return (
                              <tr key={e.id || idx} className="hover:bg-slate-50">
                                <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                                <td className="p-3 text-slate-600">{formatDateTime(e.timestamp)}</td>
                                <td className="p-3 font-mono font-bold text-slate-900">{e.referenceNo}</td>
                                <td className="p-3 text-slate-800">{e.supplier}</td>
                                <td className="p-3 font-medium text-slate-900">
                                  {itm?.itemCode ? `${itm.itemCode} - ${itm.itemName}` : e.itemId}
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-emerald-700">
                                  {formatNumber(e.quantity)}
                                </td>
                                <td className="p-3 text-right font-mono text-slate-700">{formatNumber(e.unitCost || 0)}</td>
                                <td className="p-3 text-right font-mono font-bold text-slate-900">
                                  {formatNumber((e.quantity || 0) * (e.unitCost || 0))}
                                </td>
                                <td className="p-3 text-slate-600">{e.receivedBy}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* 3. Dispatches to Teams View */}
                  {activeTab === 'issues' && (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="p-3">Issue Note #</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Field Team</th>
                          <th className="p-3">Branch Site</th>
                          <th className="p-3">Work Order / Ref</th>
                          <th className="p-3">Items Dispatched</th>
                          <th className="p-3">Issued By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {teamIssues.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400">
                              No team dispatches in this backup.
                            </td>
                          </tr>
                        ) : (
                          teamIssues.map((issue) => {
                            const team = teams.find((t) => t.id === issue.teamId);
                            const site = sites.find((s) => s.id === issue.siteId);
                            return (
                              <tr key={issue.id} className="hover:bg-slate-50">
                                <td className="p-3 font-mono font-bold text-slate-900">{issue.issueNoteNumber}</td>
                                <td className="p-3 text-slate-600">{formatDateTime(issue.issueDate)}</td>
                                <td className="p-3 font-bold text-slate-900">{team?.teamName || issue.teamId}</td>
                                <td className="p-3 text-slate-700">{site?.name || issue.siteId}</td>
                                <td className="p-3 font-mono text-slate-600">{issue.workOrderRef}</td>
                                <td className="p-3">
                                  <div className="space-y-1">
                                    {issue.items.map((row, idx) => {
                                      const itm = items.find((i) => i.id === row.itemId);
                                      return (
                                        <div key={idx} className="font-mono text-[11px] text-slate-800">
                                          <strong>{row.quantity}</strong> {itm?.unit || 'units'} of {itm?.itemName || row.itemId}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </td>
                                <td className="p-3 text-slate-600">{issue.issuedBy}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* 4. Team Returns View */}
                  {activeTab === 'returns' && (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="p-3">Voucher #</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Returning Team</th>
                          <th className="p-3">Receiving Site</th>
                          <th className="p-3">Item Description</th>
                          <th className="p-3 text-right">Quantity</th>
                          <th className="p-3">Condition</th>
                          <th className="p-3">Reason / Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {teamReturns.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400">
                              No team returns in this backup.
                            </td>
                          </tr>
                        ) : (
                          teamReturns.map((ret) => {
                            const team = teams.find((t) => t.id === ret.teamId);
                            const site = sites.find((s) => s.id === ret.siteId);
                            const itm = items.find((i) => i.id === ret.itemId);
                            return (
                              <tr key={ret.id} className="hover:bg-slate-50">
                                <td className="p-3 font-mono font-bold text-slate-900">{ret.returnVoucherNumber}</td>
                                <td className="p-3 text-slate-600">{formatDateTime(ret.returnDate)}</td>
                                <td className="p-3 font-bold text-slate-900">{team?.teamName || ret.teamId}</td>
                                <td className="p-3 text-slate-700">{site?.name || ret.siteId}</td>
                                <td className="p-3 font-medium text-slate-900">{itm?.itemName || ret.itemId}</td>
                                <td className="p-3 text-right font-mono font-bold text-slate-900">{ret.quantity}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    ret.condition.includes('Good') ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {ret.condition}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-600">{ret.reason}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* 5. Project Usages View */}
                  {activeTab === 'projects' && (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="p-3">Voucher #</th>
                          <th className="p-3">Usage Date</th>
                          <th className="p-3">Project & Customer</th>
                          <th className="p-3">Field Team & Site</th>
                          <th className="p-3">Materials Installed</th>
                          <th className="p-3">Logged By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {projectUsages.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">
                              No project usages logged in this backup.
                            </td>
                          </tr>
                        ) : (
                          projectUsages.map((usage) => {
                            const site = sites.find((s) => s.id === usage.siteId);
                            const team = teams.find((t) => t.id === usage.teamId);
                            return (
                              <tr key={usage.id} className="hover:bg-slate-50">
                                <td className="p-3 font-mono font-bold text-slate-900">{usage.usageVoucherNumber}</td>
                                <td className="p-3 text-slate-600">{usage.usageDate || usage.date}</td>
                                <td className="p-3">
                                  <div className="font-bold text-slate-900">{usage.projectName}</div>
                                  <div className="text-[11px] text-slate-500">{usage.customerName || usage.projectId}</div>
                                </td>
                                <td className="p-3">
                                  <div className="font-medium text-slate-900">{team?.teamName || usage.teamName}</div>
                                  <div className="text-[11px] text-slate-500">{site?.name || usage.siteId}</div>
                                </td>
                                <td className="p-3">
                                  <div className="space-y-1">
                                    {usage.items.map((row, idx) => {
                                      const itm = items.find((i) => i.id === row.itemId);
                                      return (
                                        <div key={idx} className="font-mono text-[11px] text-slate-800">
                                          <strong>{row.quantity}</strong> {itm?.unit || 'units'} of {itm?.itemName || row.itemId}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </td>
                                <td className="p-3 text-slate-600">{usage.loggedBy}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* 6. Sites & Teams View */}
                  {activeTab === 'sites_teams' && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Sites List */}
                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                        <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                          <Building2 className="w-4 h-4 text-emerald-600" />
                          <span>Warehouses & Branch Sites ({sites.length})</span>
                        </div>
                        <div className="space-y-2">
                          {sites.map((site) => (
                            <div key={site.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <strong className="text-slate-900">{site.name}</strong>
                                {site.isMainWarehouse && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800">
                                    MAIN WAREHOUSE
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-600">Location: {site.location}</div>
                              <div className="text-slate-500 text-[11px]">
                                Manager: {site.supervisorName} · Phone: {site.contactNumber}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Teams List */}
                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                        <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                          <Users2 className="w-4 h-4 text-blue-600" />
                          <span>Field Execution Teams ({teams.length})</span>
                        </div>
                        <div className="space-y-2">
                          {teams.map((team) => {
                            const site = sites.find((s) => s.id === team.assignedSiteId);
                            return (
                              <div key={team.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                  <strong className="text-slate-900">{team.teamName}</strong>
                                  <span className="text-[11px] font-mono font-bold text-slate-700">
                                    Crew: {team.crewSize} tech
                                  </span>
                                </div>
                                <div className="text-slate-600">Leader: {team.teamLeaderName}</div>
                                <div className="text-slate-500 text-[11px]">
                                  Assigned Branch: {site?.name || team.assignedSiteId} · Phone: {team.contactPhone}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 7. Raw JSON View */}
                  {activeTab === 'raw' && (
                    <div className="p-4">
                      <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-[60vh]">
                        {JSON.stringify(backup, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Apex Stock & Site Management System · Emergency Disaster Recovery & Data Portability Engine
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
