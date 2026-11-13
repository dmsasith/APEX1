import React, { useState, useEffect } from 'react';
import {
  Send,
  Plus,
  Search,
  Trash2,
  Printer,
  CheckCircle2,
  Users2,
  Building,
  AlertTriangle,
  FileText,
  Clock,
  Briefcase,
  Lock,
  ScanLine,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  TeamIssue,
  Item,
  isCentralOrAllSiteAdmin,
  isUserAllSites,
  getUserAssignedSiteIds,
  userHasSiteAccess,
} from '../../types';
import { formatNumber, formatDateTime } from '../../utils/exportUtils';
import { PrintableDocumentModal } from '../common/PrintableDocumentModal';
import { StockBalanceCell } from '../common/LowStockIndicator';
import { ConfirmModal } from '../common/ConfirmModal';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import {
  useUsbBarcodeScanner,
  matchItemByScannedCode,
  playScanBeep,
} from '../../utils/barcodeUtils';

export const IssueToTeamsView: React.FC = () => {
  const {
    sites,
    activeSites,
    teams,
    activeTeams,
    items,
    activeItems,
    teamIssues,
    currentUser,
    getSiteItemStock,
    issueStockToTeam,
    clearTeamIssues,
    deleteTeamIssue,
    config,
  } = useStock();

  const [selectedIssueForPrint, setSelectedIssueForPrint] = useState<TeamIssue | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  // In-app confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Check if current user is restricted to specific site(s)
  const isAllSitesUser = isUserAllSites(currentUser) || isCentralOrAllSiteAdmin(currentUser.role);
  const isSiteRestricted = !isAllSitesUser;
  const userAssignedSiteIds = getUserAssignedSiteIds(currentUser, activeSites);

  // Filter sites for dispatch: If restricted, ONLY their assigned site(s) are available; otherwise all activeSites (including Main Branch).
  const branchSites = activeSites;
  const allowedSites = isSiteRestricted
    ? activeSites.filter((s) => userAssignedSiteIds.includes(s.id))
    : branchSites;

  const isSingleSiteLocked = isSiteRestricted && allowedSites.length <= 1;
  const userAssignedSite = allowedSites[0] || sites.find((s) => s.id === currentUser.siteId);

  const initialSiteId = allowedSites[0]?.id || activeSites[0]?.id || '';

  const [selectedSiteId, setSelectedSiteId] = useState<string>(initialSiteId);

  // Keep selectedSiteId within allowedSites if currentUser or site assignments change
  useEffect(() => {
    if (isSiteRestricted && allowedSites.length > 0 && !allowedSites.some((s) => s.id === selectedSiteId)) {
      const nextId = allowedSites[0].id;
      setSelectedSiteId(nextId);
      const newTeams = activeTeams.filter((t) => t.assignedSiteId === nextId);
      setSelectedTeamId(newTeams[0]?.id || '');
      setDispatchItemsList([]);
    }
  }, [isSiteRestricted, allowedSites, selectedSiteId, activeTeams]);

  const availableTeams = activeTeams.filter((t) => t.assignedSiteId === selectedSiteId);

  const [selectedTeamId, setSelectedTeamId] = useState<string>(availableTeams[0]?.id || '');
  const [workOrderRef, setWorkOrderRef] = useState(`WO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [notes, setNotes] = useState('');

  // Search & Add items with the "+" Plus Button requirement
  const [searchItemQuery, setSearchItemQuery] = useState('');
  const [dispatchItemsList, setDispatchItemsList] = useState<
    Array<{ itemId: string; quantity: number }>
  >([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Whenever selected site changes, update available teams
  const handleSiteChange = (newSiteId: string) => {
    if (isSiteRestricted && !allowedSites.some((s) => s.id === newSiteId)) return;
    setSelectedSiteId(newSiteId);
    const newTeams = activeTeams.filter((t) => t.assignedSiteId === newSiteId);
    setSelectedTeamId(newTeams[0]?.id || '');
    setDispatchItemsList([]);
  };

  // Filter items available at the selected site based on search query - ONLY show stock available items
  const searchableItems = activeItems.filter((i) => {
    const stock = getSiteItemStock(selectedSiteId, i.id);
    if (stock.availableBalance <= 0) return false;
    const query = searchItemQuery.toLowerCase();
    const matches =
      i.itemCode.toLowerCase().includes(query) ||
      (i.barcode && i.barcode.toLowerCase().includes(query)) ||
      i.itemName.toLowerCase().includes(query) ||
      i.category.toLowerCase().includes(query);
    return matches;
  });

  // "+" Plus button or Barcode Scan to add/increment item in dispatch list
  const handleAddItemToDispatch = (item: Item, fromBarcodeScan = false) => {
    setErrorMessage('');
    const siteStock = getSiteItemStock(selectedSiteId, item.id);
    if (siteStock.availableBalance <= 0) {
      setErrorMessage(`Cannot add ${item.itemCode}: zero stock balance at this site branch.`);
      return;
    }

    const existing = dispatchItemsList.find((r) => r.itemId === item.id);
    if (existing) {
      if (fromBarcodeScan) {
        const nextQty = Math.min(existing.quantity + 1, siteStock.availableBalance);
        setDispatchItemsList((prev) =>
          prev.map((r) => (r.itemId === item.id ? { ...r, quantity: nextQty } : r))
        );
        setSuccessToast(`Scanned ${item.itemCode}: Quantity updated to ${nextQty} ${item.unit}.`);
        return;
      }
      setErrorMessage(`Item ${item.itemCode} is already in the dispatch list.`);
      return;
    }

    setDispatchItemsList((prev) => [
      ...prev,
      {
        itemId: item.id,
        quantity: fromBarcodeScan ? 1 : Math.min(10, siteStock.availableBalance),
      },
    ]);
    if (fromBarcodeScan) {
      setSuccessToast(`Scanned & added to dispatch: [${item.itemCode}] ${item.itemName}`);
    }
    setSearchItemQuery('');
  };

  useUsbBarcodeScanner({
    enabled: !scannerOpen && config.barcodeEnabled !== false && config.usbScannerEnabled !== false,
    minLength: 3,
    maxInterKeyLatencyMs: config.usbScanMaxLatencyMs || 55,
    ignoreInputs: true,
    onScan: (raw) => {
      const matched = matchItemByScannedCode(activeItems, raw);
      if (matched) {
        if (config.barcodeBeepEnabled !== false) playScanBeep(true);
        handleAddItemToDispatch(matched, true);
      } else {
        if (config.barcodeBeepEnabled !== false) playScanBeep(false);
        setErrorMessage(`No item matched scanned barcode "${raw}".`);
      }
    },
  });

  const handleRemoveDispatchItem = (itemId: string) => {
    setDispatchItemsList((prev) => prev.filter((r) => r.itemId !== itemId));
  };

  const handleQuantityChange = (itemId: string, qty: number) => {
    setDispatchItemsList((prev) =>
      prev.map((r) => (r.itemId === itemId ? { ...r, quantity: qty } : r))
    );
  };

  const handleProcessDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isSiteRestricted && !userHasSiteAccess(currentUser, selectedSiteId, activeSites)) {
      setErrorMessage(`Access restricted: You can only issue stock to teams within your assigned site(s) (${allowedSites.map((s) => s.name).join(', ') || userAssignedSite?.name || 'none'}).`);
      return;
    }

    if (!selectedTeamId) {
      setErrorMessage('Please select a field team.');
      return;
    }
    if (!dispatchItemsList.length) {
      setErrorMessage('Please add at least one item using the "+" button.');
      return;
    }

    // Validate quantities against site stock
    for (const r of dispatchItemsList) {
      const itm = items.find((i) => i.id === r.itemId);
      const stock = getSiteItemStock(selectedSiteId, r.itemId);

      if (!r.quantity || r.quantity <= 0) {
        setErrorMessage(`Please enter a valid quantity for item ${itm?.itemCode}.`);
        return;
      }
      if (r.quantity > stock.availableBalance) {
        setErrorMessage(
          `Insufficient stock for ${itm?.itemCode}. Available: ${stock.availableBalance} ${itm?.unit}, requested: ${r.quantity}.`
        );
        return;
      }
    }

    // Execute issuance
    const newIssue = issueStockToTeam({
      siteId: selectedSiteId,
      teamId: selectedTeamId,
      workOrderRef: workOrderRef.trim() || 'WO-GENERAL',
      items: dispatchItemsList,
      notes: notes.trim(),
    });

    setSuccessToast(`Stock successfully dispatched! Issue Note ${newIssue.issueNoteNumber} generated.`);
    setSelectedIssueForPrint(newIssue);

    // Reset form
    setDispatchItemsList([]);
    setNotes('');
    setWorkOrderRef(`WO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  };

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const selectedSite = sites.find((s) => s.id === selectedSiteId);

  // History filtered by assigned site(s) if restricted
  const visibleIssues = teamIssues.filter((iss) => {
    if (!isSiteRestricted) return true;
    return userHasSiteAccess(currentUser, iss.siteId, activeSites);
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {successToast && (
        <div className="bg-emerald-800 text-white px-4 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-200 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Field Operations</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Daily Dispatch Workflow</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Issue to Teams (Daily Dispatch)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Select a field team, search site inventory, click the <strong>"+" (Plus)</strong> button to add items, specify quantities, and dispatch stock with an official <strong>Issue Note</strong>. Stock is automatically deducted from Site Branch inventory in real-time.
          </p>
        </div>
      </div>
      {/* Official Head Office Team Registration Notice Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-amber-500/15 border-2 border-amber-500/40 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold">
            <AlertTriangle className="w-5 h-5 text-amber-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded border border-amber-300">
                Official Head Office Notice
              </span>
            </div>
            <h2 className="text-xs sm:text-sm font-black text-amber-950 mt-1">
              All field teams must be registered at the Head Office with an official Team Number.
            </h2>
            <p className="text-[11px] text-amber-900 font-semibold mt-0.5">
              Please ensure executing teams are assigned valid Head Office Team Numbers under Master Registrations before material issuance.
            </p>
          </div>
        </div>

        <div className="shrink-0 self-end sm:self-center">
          <span className="text-[10px] font-extrabold text-amber-900 bg-white border border-amber-300 px-3 py-1.5 rounded-lg shadow-2xs block">
            Head Office Mandatory Requirement
          </span>
        </div>
      </div>

      {/* Main Dispatch Creation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Item Search with "+" Button */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Send className="w-4 h-4 text-blue-700" />
            <h2 className="font-semibold text-sm text-slate-900">Step 1: Select Team & Search Site Inventory</h2>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Site and Team Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Site Branch *</label>
                {isSiteRestricted && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                    <Lock className="w-2.5 h-2.5 text-amber-700" />
                    <span>{allowedSites.length > 1 ? `${allowedSites.length} Assigned Sites` : 'Assigned Site Only'}</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <select
                  value={selectedSiteId}
                  disabled={isSingleSiteLocked}
                  onChange={(e) => handleSiteChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none transition-colors ${
                    isSingleSiteLocked
                      ? 'bg-slate-100 text-slate-800 border-slate-300 cursor-not-allowed select-none opacity-95'
                      : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {allowedSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {isSiteRestricted ? '(Assigned)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              {isSiteRestricted && (
                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                  <span>🔒 You can only issue materials to teams operating under <strong>{userAssignedSite?.name || 'your assigned site'}</strong>.</span>
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Select Field Team *</label>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded shadow-2xs">
                  HO Registered Team No.
                </span>
              </div>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
              >
                {availableTeams.length === 0 ? (
                  <option value="">No teams registered at {selectedSite?.name || 'this site'}</option>
                ) : (
                  availableTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.teamName} (Lead: {t.teamLeaderName})
                    </option>
                  ))
                )}
              </select>
              {availableTeams.length === 0 && (
                <p className="text-[10px] text-amber-700 mt-1">
                  ⚠️ No field teams are currently registered under this site branch. Register a team under Settings / Teams first.
                </p>
              )}
            </div>
          </div>

          {/* Selected Team Profile card */}
          {selectedTeam && (
            <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">{selectedTeam.teamName}</span>
                <div className="text-[11px] text-slate-600">Leader: {selectedTeam.teamLeaderName} · Crew: {selectedTeam.crewSize} · Phone: {selectedTeam.contactPhone}</div>
              </div>
              <Users2 className="w-5 h-5 text-blue-600 shrink-0" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Order Ref *</label>
              <input
                type="text"
                value={workOrderRef}
                onChange={(e) => setWorkOrderRef(e.target.value)}
                placeholder="e.g. WO-2026-441"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Operation Description</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Day shift trench installation"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Search Items in Site Inventory with "+" Button & Barcode Scanner */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-semibold text-slate-800">
                Search or Scan Site Inventory (Click <span className="text-emerald-700 font-bold">+</span> to Add):
              </label>
              {config.barcodeEnabled !== false && (
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                >
                  <ScanLine className="w-3.5 h-3.5" />
                  <span>Scan Barcode (USB / Mobile)</span>
                </button>
              )}
            </div>
            <div className="relative mb-2 w-full min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by code, barcode, or item description..."
                value={searchItemQuery}
                onChange={(e) => setSearchItemQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs focus:outline-none"
              />
              {searchItemQuery && (
                <button
                  type="button"
                  onClick={() => setSearchItemQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200 text-xs font-bold cursor-pointer"
                  title="Clear Search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Live Search Results List */}
            <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {searchableItems.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No items matched your query.
                </div>
              ) : (
                searchableItems.map((item) => {
                  const stock = getSiteItemStock(selectedSiteId, item.id);
                  const isAlreadyAdded = dispatchItemsList.some((r) => r.itemId === item.id);
                  const isOutOfStock = stock.availableBalance <= 0;

                  return (
                    <div
                      key={item.id}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-slate-900 text-xs">{item.itemCode}</span>
                          <span className="text-[11px] text-slate-500">· {item.category}</span>
                        </div>
                        <div className="text-xs text-slate-700 truncate font-medium">{item.itemName}</div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Live Site Stock with Low Stock Bold Red Indicator */}
                        <div className="text-right">
                          <StockBalanceCell
                            balance={stock.availableBalance}
                            threshold={stock.threshold}
                            unit={item.unit}
                            showThresholdHint={false}
                          />
                        </div>

                        {/* The "+" (Plus) Button requirement */}
                        <button
                          type="button"
                          disabled={isAlreadyAdded || isOutOfStock}
                          onClick={() => handleAddItemToDispatch(item)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shadow-xs ${
                            isAlreadyAdded
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : isOutOfStock
                              ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                          title={isAlreadyAdded ? 'Already added' : isOutOfStock ? 'Out of stock at this branch' : 'Add to dispatch list'}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dispatch Manifest List & Immediate Issuance */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <h2 className="font-semibold text-sm text-slate-900">Step 2: Dispatch List & Quantities</h2>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {dispatchItemsList.length} item{dispatchItemsList.length !== 1 ? 's' : ''} added
              </span>
            </div>

            {dispatchItemsList.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg mt-4">
                No items added yet. Search items on the left and click the{' '}
                <strong className="text-slate-700">"+"</strong> button to assemble the daily dispatch manifest.
              </div>
            ) : (
              <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3 text-right">Site Avail.</th>
                      <th className="py-2.5 px-3 text-right">Issue Quantity</th>
                      <th className="py-2.5 px-2 text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dispatchItemsList.map((row) => {
                      const itm = items.find((i) => i.id === row.itemId);
                      const stock = getSiteItemStock(selectedSiteId, row.itemId);
                      const isExceeding = row.quantity > stock.availableBalance;

                      return (
                        <tr key={row.itemId} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-semibold text-slate-900">{itm?.itemCode}</span>
                            <div className="text-[10px] text-slate-500 truncate max-w-[170px]">{itm?.itemName}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            {formatNumber(stock.availableBalance)} {itm?.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                min="1"
                                max={stock.availableBalance}
                                step="any"
                                value={row.quantity}
                                onChange={(e) => handleQuantityChange(row.itemId, Number(e.target.value))}
                                className={`w-24 px-2 py-1 border rounded text-xs font-mono font-bold text-right focus:outline-none ${
                                  isExceeding
                                    ? 'border-red-500 bg-red-50 text-red-700'
                                    : 'border-slate-300 focus:ring-2 focus:ring-slate-900'
                                }`}
                                required
                              />
                              <span className="text-[11px] text-slate-500">{itm?.unit}</span>
                            </div>
                            {isExceeding && (
                              <div className="text-[10px] text-red-600 font-semibold mt-0.5 text-right">
                                Exceeds available stock!
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveDispatchItem(row.itemId)}
                              className="text-slate-400 hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action to Issue and Generate Issue Note */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
              <span>Automatic Action:</span>
              <span className="font-medium text-slate-900">
                Deducts Site Stock in real-time & updates Team In-Hand Balance
              </span>
            </div>

            <button
              type="button"
              disabled={!dispatchItemsList.length || !selectedTeamId}
              onClick={handleProcessDispatch}
              className={`w-full py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs ${
                !dispatchItemsList.length || !selectedTeamId
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-700 hover:bg-blue-800 text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Issue Stock & Generate Official Issue Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dispatched Issue Notes History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm text-slate-900">Official Issue Notes Issued ({visibleIssues.length})</h2>
            <span className="text-xs text-slate-500">· Real-time daily dispatch record</span>
          </div>

          {visibleIssues.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setConfirmState({
                  isOpen: true,
                  title: 'Clear All Dispatch Notes?',
                  message: `Are you sure you want to permanently clear all ${visibleIssues.length} field dispatch issue notes?`,
                  confirmLabel: 'Clear All Dispatches',
                  onConfirm: () => {
                    clearTeamIssues();
                    setSuccessToast('All dispatch records cleared.');
                  },
                });
              }}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Clear all field dispatch notes"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear All Dispatches</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Issue Note #</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Site Branch</th>
                <th className="py-3 px-3">Field Team</th>
                <th className="py-3 px-3">Work Order</th>
                <th className="py-3 px-4">Materials Dispatched</th>
                <th className="py-3 px-3">Issued By</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleIssues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No issues logged yet.
                  </td>
                </tr>
              ) : (
                visibleIssues.map((iss) => {
                  const s = sites.find((site) => site.id === iss.siteId);
                  const t = teams.find((team) => team.id === iss.teamId);

                  return (
                    <tr key={iss.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {iss.issueNoteNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                        {formatDateTime(iss.issueDate)}
                      </td>
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap font-medium">
                        {s?.name}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-semibold text-blue-700">{t?.teamName || 'Team'}</span>
                        <div className="text-[10px] text-slate-500">Lead: {t?.teamLeaderName}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {iss.workOrderRef}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="space-y-0.5">
                          {iss.items.map((row) => {
                            const itm = items.find((i) => i.id === row.itemId);
                            return (
                              <div key={row.itemId} className="text-slate-700 text-xs">
                                <strong className="font-mono text-slate-900">{itm?.itemCode}:</strong> {row.quantity} {itm?.unit}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap text-[11px]">
                        {iss.issuedBy}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedIssueForPrint(iss)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium flex items-center gap-1"
                            title="Print Note"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Note</span>
                          </button>
                          <button
                            onClick={() => {
                              setConfirmState({
                                isOpen: true,
                                title: `Delete Dispatch Note "${iss.issueNoteNumber}"?`,
                                message: `Are you sure you want to delete issue note ${iss.issueNoteNumber} for ${t?.teamName || 'team'}?`,
                                confirmLabel: 'Delete Dispatch',
                                onConfirm: () => {
                                  deleteTeamIssue(iss.id);
                                  setSuccessToast(`Deleted dispatch note ${iss.issueNoteNumber}.`);
                                },
                              });
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Dispatch Note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Official Issue Note Printable Modal */}
      {selectedIssueForPrint && (
        <PrintableDocumentModal
          document={{ type: 'ISSUE_NOTE', data: selectedIssueForPrint }}
          onClose={() => setSelectedIssueForPrint(null)}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        onConfirm={confirmState.onConfirm}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        mode="select"
        siteId={selectedSiteId}
        title="Scan Barcode to Dispatch Item to Team"
        subtitle="Scan via USB Gun or Mobile Camera — adds or increments item in the dispatch manifest"
        onSelectItem={(item) => {
          handleAddItemToDispatch(item, true);
        }}
      />
    </div>
  );
};
