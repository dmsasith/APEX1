import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Filter,
  ArrowRightLeft,
  Send,
  RotateCcw,
  AlertTriangle,
  Download,
  Truck,
  CheckCircle2,
  Edit2,
  FileCheck2,
  Check,
  FileText,
  Clock,
  Printer,
  Users2,
  Phone,
  Hash,
  Layers,
  Calendar,
  Sparkles,
  Boxes,
  UserCheck,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatNumber, exportToCsv, formatDateTime } from '../../utils/exportUtils';
import { StockBalanceCell } from '../common/LowStockIndicator';
import {
  StockTransferRequest,
  ProjectMaterialUsage,
  isCentralOrAllSiteAdmin,
  isUserAllSites,
  userHasSiteAccess,
} from '../../types';
import { PrintableDocumentModal } from '../common/PrintableDocumentModal';

export const SiteInventoriesView: React.FC = () => {
  const {
    sites,
    activeSites,
    items,
    activeItems,
    getSiteItemStock,
    currentUser,
    stockRequests,
    acceptStockRequest,
    projectUsages,
    teams,
    clientFreeIssues,
    getClientFreeStockBalance,
  } = useStock();

  const allBranchSites = activeSites.filter((s) => !s.isMainWarehouse);
  const canViewAllBranches = isCentralOrAllSiteAdmin(currentUser.role) || isUserAllSites(currentUser);
  const branchSites = canViewAllBranches
    ? allBranchSites
    : allBranchSites.filter((s) => userHasSiteAccess(currentUser, s.id, activeSites));
  const defaultSiteId = branchSites[0]?.id || allBranchSites[0]?.id || activeSites[0]?.id || '';

  const [selectedSiteId, setSelectedSiteId] = useState<string>(defaultSiteId);

  React.useEffect(() => {
    if (branchSites.length > 0 && !branchSites.some((s) => s.id === selectedSiteId)) {
      setSelectedSiteId(branchSites[0].id);
    }
  }, [branchSites, selectedSiteId]);
  const [activeSection, setActiveSection] = useState<'inventory' | 'foc-materials' | 'history'>('inventory');

  const selectedSite = activeSites.find((s) => s.id === selectedSiteId) || sites.find((s) => s.id === selectedSiteId);

  // Site-Specific FOC Client Materials
  const siteFocMaterials = useMemo(() => {
    if (!selectedSite) return [];
    return (clientFreeIssues || []).filter((v) => {
      if (v.isDeleted) return false;
      const matchLocation = v.storageLocation && v.storageLocation.trim().toLowerCase() === selectedSite.name.trim().toLowerCase();
      return matchLocation;
    });
  }, [clientFreeIssues, selectedSite]);
  
  // Inventory filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockScopeFilter, setStockScopeFilter] = useState<'allocated' | 'all' | 'low-stock'>('allocated');

  // History voucher filter states
  const [historySearch, setHistorySearch] = useState('');
  const [historyTeamFilter, setHistoryTeamFilter] = useState('all');
  const [selectedUsageForPrint, setSelectedUsageForPrint] = useState<ProjectMaterialUsage | null>(null);

  // Receiving state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [acceptingShipment, setAcceptingShipment] = useState<StockTransferRequest | null>(null);
  const [receivedItems, setReceivedItems] = useState<Array<{ itemId: string; receivedQty: number }>>([]);
  const [receivingNotes, setReceivingNotes] = useState('');

  // Incoming shipments for selected site branch in transit
  const incomingShipments = stockRequests.filter(
    (req) => req.siteId === selectedSiteId && req.status === 'Approved / In-Transit'
  );

  // Site-Specific Material Usage Vouchers History
  const siteUsages = useMemo(() => {
    if (!selectedSiteId) return [];
    return (projectUsages || []).filter((pu) => pu.siteId === selectedSiteId && !pu.isDeleted);
  }, [selectedSiteId, projectUsages]);

  // Filtered Site Usage Vouchers
  const filteredSiteUsages = useMemo(() => {
    return siteUsages.filter((pu) => {
      if (historyTeamFilter !== 'all' && pu.teamId !== historyTeamFilter) return false;
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const matchVoucher = pu.usageVoucherNumber.toLowerCase().includes(q);
        const matchProject = pu.projectName.toLowerCase().includes(q);
        const matchCustomer = (pu.customerName || '').toLowerCase().includes(q);
        const matchSite = (pu.siteIdentifier || '').toLowerCase().includes(q);
        const matchPhone = (pu.customerPhone || '').toLowerCase().includes(q);
        const matchTeam = (pu.teamName || '').toLowerCase().includes(q);
        const matchSupervisor = (pu.supervisorOrLeaderName || pu.supervisorOrLeader || '').toLowerCase().includes(q);
        const matchWork = (pu.workDetails || '').toLowerCase().includes(q);
        return (
          matchVoucher ||
          matchProject ||
          matchCustomer ||
          matchSite ||
          matchPhone ||
          matchTeam ||
          matchSupervisor ||
          matchWork
        );
      }
      return true;
    });
  }, [siteUsages, historyTeamFilter, historySearch]);

  // Calculate Site History KPI Stats
  const siteTotalVouchersCount = siteUsages.length;
  const siteTotalItemsConsumedCount = useMemo(() => {
    return siteUsages.reduce((acc, pu) => {
      return acc + pu.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    }, 0);
  }, [siteUsages]);

  const siteActiveTeamsCount = useMemo(() => {
    const set = new Set(siteUsages.map((pu) => pu.teamId));
    return set.size;
  }, [siteUsages]);

  // Teams active at this site
  const siteActiveTeamsList = useMemo(() => {
    return (teams || []).filter((t) => t.assignedSiteId === selectedSiteId && !t.isDeleted);
  }, [teams, selectedSiteId]);

  const handleDirectReceive = (req: StockTransferRequest) => {
    const fullItems = req.items.map((r) => ({
      itemId: r.itemId,
      receivedQty: r.approvedQty ?? r.requestedQty,
    }));
    acceptStockRequest(req.id, fullItems, 'Direct received into site yard.');
    setToastMessage(`Shipment ${req.requestNoteNumber} received! Site inventory updated.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenEditReceive = (req: StockTransferRequest) => {
    setAcceptingShipment(req);
    setReceivedItems(
      req.items.map((r) => ({
        itemId: r.itemId,
        receivedQty: r.receivedQty ?? (r.approvedQty ?? r.requestedQty),
      }))
    );
    setReceivingNotes('');
  };

  const handleConfirmEditReceive = () => {
    if (!acceptingShipment) return;
    acceptStockRequest(
      acceptingShipment.id,
      receivedItems,
      receivingNotes.trim() || 'Verified and counted shipment at site yard.'
    );
    setToastMessage(`Shipment ${acceptingShipment.requestNoteNumber} received and updated.`);
    setAcceptingShipment(null);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const categories = Array.from(new Set(activeItems.map((i) => i.category)));

  // Count items with activity or balance at this site
  const siteAllocatedCount = useMemo(() => {
    if (!selectedSiteId) return 0;
    return activeItems.filter((i) => {
      const s = getSiteItemStock(selectedSiteId, i.id);
      return s.hasActivity || s.availableBalance > 0;
    }).length;
  }, [selectedSiteId, activeItems, getSiteItemStock]);

  const siteLowStockCount = useMemo(() => {
    if (!selectedSiteId) return 0;
    return activeItems.filter((i) => {
      const s = getSiteItemStock(selectedSiteId, i.id);
      return s.isLowStock;
    }).length;
  }, [selectedSiteId, activeItems, getSiteItemStock]);

  const filteredItems = activeItems.filter((item) => {
    const matchesSearch =
      item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    if (!matchesSearch || !matchesCategory) return false;

    const stock = getSiteItemStock(selectedSiteId, item.id);
    if (stockScopeFilter === 'allocated' && !stock.hasActivity && stock.availableBalance <= 0) {
      return false;
    }
    if (stockScopeFilter === 'low-stock' && !stock.isLowStock) {
      return false;
    }

    return true;
  });

  const exportSiteInventoryCsv = () => {
    if (!selectedSite) return;
    const rows = filteredItems.map((item) => {
      const stock = getSiteItemStock(selectedSite.id, item.id);
      return {
        'Site Name': selectedSite.name,
        Supervisor: selectedSite.supervisorName,
        'Item Code': item.itemCode,
        'Item Name': item.itemName,
        Category: item.category,
        Unit: item.unit,
        'Total Received (Transfers)': stock.received,
        'Total Returned (Restocked)': stock.returned,
        'Total Issued (Field Teams)': stock.issued,
        'Available Balance': stock.availableBalance,
        'Min Threshold': stock.threshold,
        'Low Stock Status': stock.isLowStock ? 'LOW STOCK' : 'Adequate',
      };
    });
    exportToCsv(`${selectedSite.name.replace(/\s+/g, '_')}_Inventory`, rows);
  };

  const exportSiteUsageHistoryCsv = () => {
    if (!selectedSite) return;
    const rows: any[] = [];
    filteredSiteUsages.forEach((pu) => {
      pu.items.forEach((row) => {
        const itm = items.find((i) => i.id === row.itemId);
        rows.push({
          'Site Name': selectedSite.name,
          'Voucher No': pu.usageVoucherNumber,
          Date: pu.usageDate || pu.date,
          'Project Name': pu.projectName,
          'Customer Name': pu.customerName || '',
          'Customer Phone': pu.customerPhone || '',
          'Site ID / Ref': pu.siteIdentifier || '',
          'Project Section': pu.projectTypeName || '',
          'Executing Team': pu.teamName || '',
          'Supervisor / Lead': pu.supervisorOrLeaderName || pu.supervisorOrLeader || '',
          'Work Scope': pu.workDetails || '',
          'Item Code': itm?.itemCode || '',
          'Item Name': itm?.itemName || '',
          Category: itm?.category || '',
          'Quantity Used': row.quantity,
          Unit: itm?.unit || '',
          'Logged By': pu.loggedBy,
        });
      });
    });
    exportToCsv(`${selectedSite.name.replace(/\s+/g, '_')}_Material_Usage_History`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Branch Custody & Audit</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Site Yard Balances & Usage Vouchers</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Site Branch Stock & Material Usage History
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Live inventory ledger per site branch: view active yard balances and track site-specific material consumption vouchers logged by field teams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSection === 'inventory' ? (
            <button
              onClick={exportSiteInventoryCsv}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export Site Inventory (CSV)</span>
            </button>
          ) : (
            <button
              onClick={exportSiteUsageHistoryCsv}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export Site Usage Vouchers (CSV)</span>
            </button>
          )}
        </div>
      </div>

      {/* Site Selector Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
        <div className="flex flex-wrap gap-2">
          {branchSites.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSiteId(s.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                selectedSiteId === s.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-900/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{s.name}</span>
            </button>
          ))}
        </div>

        {/* View Section Tabs (Live Stock vs Usage History) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSection('inventory')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'inventory'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4 text-emerald-600" />
            <span>Live Yard Stock</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('foc-materials')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'foc-materials'
                ? 'bg-white text-indigo-950 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="text-indigo-600">🎁</span>
            <span>Client FOC Materials ({siteFocMaterials.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('history')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'history'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-teal-600" />
            <span>Site Material Usage Vouchers ({siteTotalVouchersCount})</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-800 text-white px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-200 hover:text-white">✕</button>
        </div>
      )}

      {/* Selected Site Details Banner */}
      {selectedSite && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700 shadow-2xs">
          <div>
            <span className="font-bold text-slate-900 text-sm">{selectedSite.name}</span>
            <div className="mt-0.5 text-slate-600">Location: {selectedSite.location} · Supervisor: <strong className="text-slate-800">{selectedSite.supervisorName}</strong></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-slate-600">
              Active Field Teams: <strong className="text-slate-900 font-mono">{siteActiveTeamsList.length}</strong>
            </div>
            <div className="font-mono text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200">
              Tel: {selectedSite.contactNumber}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: LIVE YARD STOCK */}
      {activeSection === 'inventory' && (
        <div className="space-y-6">
          {/* Incoming Approved Shipments in Transit for this site */}
          {incomingShipments.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Incoming Approved Shipments from Main Warehouse ({incomingShipments.length} in transit)
                    </h3>
                    <p className="text-xs text-slate-600">
                      Shipments approved and dispatched to <strong>{selectedSite?.name}</strong>. Verify physical items and click &quot;Receive Stock&quot; to update this site yard ledger.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 text-xs font-bold border border-blue-300">
                  Ready to Receive
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {incomingShipments.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {req.requestNoteNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {formatDateTime(req.approvalDate || req.requestedDate)}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1">
                        <div className="text-xs font-semibold text-slate-700">Dispatched Materials:</div>
                        <div className="space-y-1 bg-slate-50 p-2 rounded border border-slate-100">
                          {req.items.map((row) => {
                            const itm = items.find((i) => i.id === row.itemId);
                            const apprv = row.approvedQty ?? row.requestedQty;
                            return (
                              <div key={row.itemId} className="flex items-center justify-between text-xs text-slate-800">
                                <span className="truncate max-w-[200px]" title={itm?.itemName}>
                                  <strong className="font-mono">{itm?.itemCode}</strong> · {itm?.itemName}
                                </span>
                                <span className="font-mono font-bold text-emerald-700 shrink-0 ml-2">
                                  +{apprv} {itm?.unit}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {req.approvalNotes && (
                        <div className="text-[11px] text-slate-500 italic mt-1.5 truncate" title={req.approvalNotes}>
                          Dispatch Note: &ldquo;{req.approvalNotes}&rdquo;
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleOpenEditReceive(req)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Inspect physical count and adjust received quantity if damaged"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Count / Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDirectReceive(req)}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                        title="Confirm full shipment received into site stock"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Receive into Site Yard</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter and Search Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Scope Filter Buttons */}
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                <button
                  onClick={() => setStockScopeFilter('allocated')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    stockScopeFilter === 'allocated'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Site Allocated ({siteAllocatedCount})</span>
                </button>
                <button
                  onClick={() => setStockScopeFilter('low-stock')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    stockScopeFilter === 'low-stock'
                      ? 'bg-rose-50 text-rose-700 shadow-2xs font-bold border border-rose-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  <span>Low Stock ({siteLowStockCount})</span>
                </button>
                <button
                  onClick={() => setStockScopeFilter('all')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    stockScopeFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Full Master Catalog ({activeItems.length})</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative w-full sm:w-80 md:w-96 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search code or description..."
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

              <div className="flex items-center gap-1.5">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Site Branch Stock Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-600">
              <div>
                Showing <strong className="font-mono text-slate-900">{filteredItems.length}</strong> items{' '}
                {stockScopeFilter === 'allocated' ? (
                  <span>allocated to <strong>{selectedSite?.name}</strong></span>
                ) : stockScopeFilter === 'low-stock' ? (
                  <span>with low stock warning at this site</span>
                ) : (
                  <span>from full master catalog</span>
                )}
              </div>
              <span className="font-mono text-[11px] text-slate-500">
                Central Catalog: {activeItems.length} items total
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Item Code</th>
                    <th className="py-3 px-4">Material Description</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-center">Unit</th>
                    <th className="py-3 px-3 text-right">Received (HQ)</th>
                    <th className="py-3 px-3 text-right">Returned (Teams)</th>
                    <th className="py-3 px-3 text-right">Issued (Teams)</th>
                    <th className="py-3 px-4 text-right">Available Site Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 px-4 text-center">
                        <div className="max-w-md mx-auto flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className="text-sm font-semibold text-slate-800">
                            {stockScopeFilter === 'allocated'
                              ? `No materials currently allocated to ${selectedSite?.name || 'this site branch'}`
                              : stockScopeFilter === 'low-stock'
                              ? `No low stock warnings for this site branch`
                              : 'No items match your search criteria'}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 max-w-sm">
                            {stockScopeFilter === 'allocated'
                              ? 'This site has not requisitioned or received any materials from Central Warehouse yet. Items will automatically appear here once stock transfer requests are accepted.'
                              : 'Try adjusting your search query, clearing filters, or switching to view the full catalog.'}
                          </p>
                          {stockScopeFilter === 'allocated' && (
                            <div className="flex items-center gap-2 mt-4">
                              <button
                                onClick={() => setStockScopeFilter('all')}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Browse Full Catalog ({activeItems.length})
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const stock = getSiteItemStock(selectedSiteId, item.id);
                      const isUnallocated = !stock.hasActivity && stock.availableBalance <= 0;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                            {item.itemCode}
                          </td>
                          <td className="py-3 px-4 text-slate-800 font-medium max-w-xs">
                            {item.itemName}
                          </td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{item.category}</td>
                          <td className="py-3 px-3 text-center text-slate-600 font-medium">{item.unit}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            {formatNumber(stock.received)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-emerald-700 font-medium">
                            +{formatNumber(stock.returned)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            -{formatNumber(stock.issued)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <StockBalanceCell
                              balance={stock.availableBalance}
                              threshold={stock.threshold}
                              unit={item.unit}
                              unallocated={isUnallocated}
                              isLow={stock.isLowStock}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLIENT FOC MATERIALS ALLOCATED TO SITE YARD */}
      {activeSection === 'foc-materials' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                🎁
              </div>
              <div>
                <h3 className="font-bold text-sm text-indigo-950">
                  Client Free-Issue (FOC) Materials at {selectedSite?.name}
                </h3>
                <p className="text-xs text-indigo-800">
                  Client-supplied free-issue materials stored at this site yard. Maintained separately from standard company warehouse stock.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white text-indigo-900 border border-indigo-300 rounded-lg text-xs font-bold font-mono">
              {siteFocMaterials.length} Entry(ies)
            </span>
          </div>

          {siteFocMaterials.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center mx-auto mb-3 text-xl">
                🎁
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                No Client FOC Materials Assigned to {selectedSite?.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No client free-issue material shipments have been registered to this site yard location yet. Register FOC shipments from Main Stock &gt; Client FOC Materials.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {siteFocMaterials.map((foc) => (
                <div key={foc.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-indigo-900 text-white px-2.5 py-1 rounded">
                        {foc.voucherNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        Client: <span className="text-indigo-700">{foc.clientName}</span>
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-xs text-slate-600">Project: {foc.projectName}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {formatDateTime(foc.receivedDate || foc.createdAt)}
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Item Code</th>
                          <th className="py-2.5 px-3">Material Description</th>
                          <th className="py-2.5 px-3 text-center">Unit</th>
                          <th className="py-2.5 px-3 text-right">FOC Received Qty</th>
                          <th className="py-2.5 px-3 text-right">Remaining Bal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {foc.items.map((row, idx) => {
                          const itm = items.find((i) => i.id === row.itemId);
                          const bal = getClientFreeStockBalance(foc.projectId, row.itemId);
                          return (
                            <tr key={idx} className="bg-white">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                                {itm?.itemCode || 'ITEM'}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-800">
                                {itm?.itemName || 'Material Item'}
                              </td>
                              <td className="py-2.5 px-3 text-center text-slate-600">{itm?.unit || 'units'}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                                {formatNumber(row.quantity)} {itm?.unit}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-700">
                                {formatNumber(bal.remainingBalance)} {itm?.unit}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {foc.notes && (
                    <div className="text-xs text-slate-500 italic">
                      Notes: &ldquo;{foc.notes}&rdquo;
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SITE MATERIAL USAGE HISTORY VOUCHERS */}
      {activeSection === 'history' && (
        <div className="space-y-5">
          {/* Site Material Usage KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Site Usage Vouchers Logged
                </div>
                <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                  {siteTotalVouchersCount} <span className="text-xs font-medium text-slate-500">vouchers</span>
                </div>
                <div className="text-[11px] text-teal-700 font-medium mt-0.5">
                  Logged at {selectedSite?.name}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Material Qty Consumed
                </div>
                <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                  {formatNumber(siteTotalItemsConsumedCount)} <span className="text-xs font-medium text-slate-500">units</span>
                </div>
                <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  Issued to site projects
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
                <Users2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Active Executing Teams
                </div>
                <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                  {siteActiveTeamsCount} <span className="text-xs font-medium text-slate-500">crews</span>
                </div>
                <div className="text-[11px] text-sky-700 font-medium mt-0.5">
                  Consuming materials on-site
                </div>
              </div>
            </div>
          </div>

          {/* History Search & Team Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search voucher #, project, customer, phone, site ID, team or work..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs focus:outline-none"
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => setHistorySearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200 text-xs font-bold cursor-pointer"
                  title="Clear Search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Team:</span>
              </label>
              <select
                value={historyTeamFilter}
                onChange={(e) => setHistoryTeamFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 bg-white focus:outline-none shadow-2xs min-w-[160px]"
              >
                <option value="all">All Executing Teams ({siteUsages.length})</option>
                {siteActiveTeamsList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.teamName} ({t.teamLeaderName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vouchers List / Cards */}
          {filteredSiteUsages.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                No Material Usage Vouchers Found for {selectedSite?.name || 'this Site'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {historySearch || historyTeamFilter !== 'all'
                  ? 'No vouchers match your search criteria or team filter. Try clearing your search.'
                  : `No project material usages have been logged for ${selectedSite?.name || 'this site branch'} yet. Logged usages from Project Material Usage will automatically appear here.`}
              </p>
              {(historySearch || historyTeamFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setHistorySearch('');
                    setHistoryTeamFilter('all');
                  }}
                  className="mt-3 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSiteUsages.map((pu) => {
                const totalRowQty = pu.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

                return (
                  <div
                    key={pu.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
                  >
                    {/* Voucher Top Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-teal-400" />
                          <span>{pu.usageVoucherNumber}</span>
                        </span>

                        {pu.projectTypeName && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                            {pu.projectTypeName}
                          </span>
                        )}

                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateTime(pu.usageDate || pu.date)}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setSelectedUsageForPrint(pu)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-teal-600" />
                          <span>Print Voucher</span>
                        </button>
                      </div>
                    </div>

                    {/* Voucher Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Project & Customer Details
                        </div>
                        <div className="font-bold text-slate-900 text-sm mt-0.5 truncate" title={pu.projectName}>
                          {pu.projectName}
                        </div>
                        {pu.customerName && (
                          <div className="text-slate-600 font-semibold truncate mt-0.5">
                            Customer: {pu.customerName}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                          {pu.siteIdentifier && (
                            <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-0.5">
                              <Hash className="w-3 h-3 text-slate-400" />
                              <span>Site ID: {pu.siteIdentifier}</span>
                            </span>
                          )}
                          {pu.customerPhone && (
                            <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{pu.customerPhone}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Executing Field Crew & Leader
                        </div>
                        <div className="font-bold text-slate-900 text-xs mt-0.5 flex items-center gap-1">
                          <Users2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{pu.teamName || 'Assigned Crew'}</span>
                        </div>
                        <div className="text-slate-600 font-medium mt-1 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Supervisor: <strong>{pu.supervisorOrLeaderName || pu.supervisorOrLeader || 'N/A'}</strong></span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Logged By: {pu.loggedBy}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Work Scope & Consumed Items Summary
                        </div>
                        <div className="text-slate-800 font-medium mt-0.5 line-clamp-2" title={pu.workDetails}>
                          {pu.workDetails || 'General site material installation work'}
                        </div>
                        <div className="mt-1.5 font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-block">
                          {pu.items.length} Item Line(s) · {formatNumber(totalRowQty)} Total Units
                        </div>
                      </div>
                    </div>

                    {/* Consumed Materials Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3">Item Code</th>
                            <th className="py-2 px-3">Material Description</th>
                            <th className="py-2 px-3">Category</th>
                            <th className="py-2 px-3 text-center">Unit</th>
                            <th className="py-2 px-3 text-right font-bold text-slate-900">Qty Consumed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {pu.items.map((row, iIdx) => {
                            const itm = items.find((i) => i.id === row.itemId);
                            return (
                              <tr key={iIdx} className="hover:bg-slate-50/80">
                                <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                                  {itm?.itemCode || 'ITEM'}
                                </td>
                                <td className="py-2 px-3 font-medium text-slate-800">
                                  {itm?.itemName || 'Material Item'}
                                </td>
                                <td className="py-2 px-3 text-slate-500">{itm?.category || 'General'}</td>
                                <td className="py-2 px-3 text-center text-slate-600">{itm?.unit || 'units'}</td>
                                <td className="py-2 px-3 text-right font-mono font-extrabold text-teal-800">
                                  {formatNumber(row.quantity)} {itm?.unit}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Verification / Count Modal for Site Receiving */}
      {acceptingShipment && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="font-semibold text-base text-slate-900">
                    Verify & Receive Incoming Shipment ({acceptingShipment.requestNoteNumber})
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    Destination: <strong className="text-slate-800">{selectedSite?.name}</strong>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAcceptingShipment(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Verify actual materials delivered to site gate. If all items match what was dispatched, keep the default quantities. If any items arrived damaged or short, enter the actual count.
            </p>

            <div className="border border-slate-200 rounded-lg overflow-x-auto mb-4">
              <table className="w-full text-xs text-left min-w-[460px]">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Item Specs</th>
                    <th className="py-2.5 px-3 text-center">Unit</th>
                    <th className="py-2.5 px-3 text-right">Dispatched Qty</th>
                    <th className="py-2.5 px-3 text-right w-36 font-bold text-slate-900">Counted / Recv Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {acceptingShipment.items.map((row) => {
                    const itm = items.find((i) => i.id === row.itemId);
                    const apprv = row.approvedQty ?? row.requestedQty;
                    const currentRecv =
                      receivedItems.find((r) => r.itemId === row.itemId)?.receivedQty ?? apprv;

                    return (
                      <tr key={row.itemId}>
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                            {itm?.itemCode}
                          </span>
                          <div className="text-xs font-semibold text-slate-800 mt-0.5">{itm?.itemName}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{itm?.unit}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">
                          {formatNumber(apprv)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={currentRecv}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Number(e.target.value);
                              setReceivedItems((prev) =>
                                prev.map((item) =>
                                  item.itemId === row.itemId ? { ...item, receivedQty: val } : item
                                )
                              );
                            }}
                            className="w-24 px-2 py-1.5 border border-emerald-400 bg-emerald-50/40 rounded text-xs font-mono font-bold text-right focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                            required
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receiving Verification Notes
              </label>
              <textarea
                value={receivingNotes}
                onChange={(e) => setReceivingNotes(e.target.value)}
                placeholder="e.g. Received at site gate, packaging inspected and verified."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setAcceptingShipment(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEditReceive}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Confirm & Restock Site Yard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Voucher Modal */}
      {selectedUsageForPrint && (
        <PrintableDocumentModal
          isOpen={!!selectedUsageForPrint}
          onClose={() => setSelectedUsageForPrint(null)}
          title="SITE MATERIAL USAGE VOUCHER"
          documentNumber={selectedUsageForPrint.usageVoucherNumber}
          documentDate={selectedUsageForPrint.usageDate || selectedUsageForPrint.date}
          recipientLabel="Site / Project Office"
          recipientName={selectedUsageForPrint.projectName}
          recipientSubDetails={`Supervisor / Lead: ${selectedUsageForPrint.supervisorOrLeaderName || selectedUsageForPrint.supervisorOrLeader} | Executing Team: ${selectedUsageForPrint.teamName} | Section: ${selectedUsageForPrint.projectTypeName || 'General'}${selectedUsageForPrint.siteIdentifier ? ` | Site ID: ${selectedUsageForPrint.siteIdentifier}` : ''}${selectedUsageForPrint.customerPhone ? ` | Tel: ${selectedUsageForPrint.customerPhone}` : ''}`}
          notes={`Work Scope / Details: ${selectedUsageForPrint.workDetails || 'General site material consumption'}`}
          items={selectedUsageForPrint.items.map((row) => {
            const itm = items.find((i) => i.id === row.itemId);
            return {
              itemCode: itm?.itemCode || 'ITEM',
              itemName: itm?.itemName || 'Material Item',
              category: itm?.category || 'General',
              quantity: row.quantity,
              unit: itm?.unit || 'units',
            };
          })}
        />
      )}
    </div>
  );
};
