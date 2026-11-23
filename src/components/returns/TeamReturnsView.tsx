import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  Printer,
  AlertTriangle,
  Building,
  Users2,
  Package,
  FileCheck,
  Trash2,
  Lock,
  ScanLine,
  Plus,
  ChevronDown,
  Search,
  Check,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  ReturnCondition,
  TeamReturn,
  isCentralOrAllSiteAdmin,
  isUserAllSites,
  getUserAssignedSiteIds,
  userHasSiteAccess,
  sortSitesHierarchically,
  formatSiteHierarchyLabel,
} from '../../types';
import { formatNumber, formatDateTimeParts } from '../../utils/exportUtils';
import { PrintableDocumentModal } from '../common/PrintableDocumentModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import {
  useUsbBarcodeScanner,
  matchItemByScannedCode,
  playScanBeep,
} from '../../utils/barcodeUtils';
import { getTemporaryAssignmentBadgeLabel } from '../../utils/teamAssignmentUtils';

export const TeamReturnsView: React.FC = () => {
  const {
    sites,
    activeSites,
    teams,
    activeTeams,
    items,
    activeItems,
    teamReturns,
    currentUser,
    getTeamInHandStock,
    getTeamSiteInHandStock,
    getSiteItemStock,
    returnMultipleStockFromTeam,
    clearTeamReturns,
    deleteTeamReturn,
    config,
  } = useStock();

  const [selectedReturnForPrint, setSelectedReturnForPrint] = useState<TeamReturn | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [openDropdownRowIdx, setOpenDropdownRowIdx] = useState<number | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState<string>('');

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

  const isAllSitesUser = isUserAllSites(currentUser) || isCentralOrAllSiteAdmin(currentUser.role);
  const isSiteRestricted = !isAllSitesUser;
  const userAssignedSiteIds = getUserAssignedSiteIds(currentUser, activeSites);

  const branchSites = sortSitesHierarchically(activeSites);
  const allowedSites = isSiteRestricted
    ? branchSites.filter((s) => userAssignedSiteIds.includes(s.id))
    : branchSites;

  const isSingleSiteLocked = isSiteRestricted && allowedSites.length <= 1;
  const userAssignedSite = allowedSites[0] || sites.find((s) => s.id === currentUser.siteId);

  const initialSiteId = allowedSites[0]?.id || activeSites[0]?.id || '';

  const [selectedSiteId, setSelectedSiteId] = useState<string>(initialSiteId);

  // Keep selectedSiteId within allowedSites if currentUser changes
  useEffect(() => {
    if (isSiteRestricted && allowedSites.length > 0 && !allowedSites.some((s) => s.id === selectedSiteId)) {
      const nextId = allowedSites[0].id;
      setSelectedSiteId(nextId);
      const newTeams = teams.filter((t) => t.assignedSiteId === nextId);
      if (newTeams[0]) handleTeamChange(newTeams[0].id);
    }
  }, [isSiteRestricted, allowedSites, selectedSiteId]);

  // Include teams currently assigned to selectedSiteId OR teams that were transferred away and still hold pending stock on selectedSiteId
  const availableTeams = activeTeams.filter(
    (t) =>
      t.assignedSiteId === selectedSiteId ||
      t.pendingClearanceSiteId === selectedSiteId ||
      getTeamSiteInHandStock(t.id, selectedSiteId).totalUnitsHeld > 0
  );

  const [selectedTeamId, setSelectedTeamId] = useState<string>(availableTeams[0]?.id || '');
  const [returnedBy, setReturnedBy] = useState('');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Strictly get in-hand stock for selectedTeamId at selectedSiteId (never mix across sites)
  const selectedSiteObj = activeSites.find((s) => s.id === selectedSiteId);
  const selectedSiteName = selectedSiteObj?.name || 'Selected Site';
  const siteSpecificInHand =
    selectedTeamId && selectedSiteId ? getTeamSiteInHandStock(selectedTeamId, selectedSiteId) : null;
  const globalTeamInHand = selectedTeamId ? getTeamInHandStock(selectedTeamId) : null;
  const teamInHand = siteSpecificInHand;
  const eligibleItems = teamInHand?.items.filter((i) => i.currentInHand > 0) || [];
  const otherSiteBreakdowns = (globalTeamInHand?.siteBreakdowns || []).filter(
    (b) => b.siteId !== selectedSiteId && b.totalUnitsHeld > 0
  );

  // Multi-item return rows state
  const [returnRows, setReturnRows] = useState<
    Array<{ itemId: string; quantity: number | ''; condition: ReturnCondition }>
  >([
    {
      itemId: eligibleItems[0]?.itemId || '',
      quantity: '',
      condition: 'Good / Restock',
    },
  ]);

  useEffect(() => {
    setReturnRows((prev) => {
      if (eligibleItems.length === 0) {
        return [{ itemId: '', quantity: '' as const, condition: 'Good / Restock' }];
      }
      const updated = prev.map((r) => {
        if (r.itemId && eligibleItems.some((e) => e.itemId === r.itemId)) {
          return r;
        }
        return { ...r, itemId: eligibleItems[0].itemId, quantity: '' as const };
      });
      return updated.length > 0
        ? updated
        : [{ itemId: eligibleItems[0].itemId, quantity: '' as const, condition: 'Good / Restock' }];
    });
  }, [selectedSiteId, selectedTeamId, eligibleItems.length]);

  const handleAddOrIncrementScannedItem = (matchedItemId: string, itemCode: string, itemName: string) => {
    const held = eligibleItems.find((e) => e.itemId === matchedItemId);
    if (!held) {
      if (config.barcodeBeepEnabled !== false) playScanBeep(false);
      setErrorMsg(`Item [${itemCode}] ${itemName} has 0 in-hand balance for the selected team at ${selectedSiteName}.`);
      return;
    }
    if (config.barcodeBeepEnabled !== false) playScanBeep(true);
    setReturnRows((prev) => {
      const existingIdx = prev.findIndex((r) => r.itemId === matchedItemId);
      if (existingIdx >= 0) {
        return prev.map((r, i) =>
          i === existingIdx
            ? {
                ...r,
                quantity:
                  typeof r.quantity === 'number'
                    ? Math.min(r.quantity + 1, held.currentInHand)
                    : 1,
              }
            : r
        );
      }
      const emptyIdx = prev.findIndex((r) => !r.itemId || r.quantity === '');
      if (emptyIdx >= 0) {
        return prev.map((r, i) =>
          i === emptyIdx ? { ...r, itemId: matchedItemId, quantity: 1 } : r
        );
      }
      return [...prev, { itemId: matchedItemId, quantity: 1, condition: 'Good / Restock' }];
    });
    setSuccessToast(`Scanned & added for return: [${itemCode}] ${itemName}`);
  };

  useUsbBarcodeScanner({
    enabled: !scannerOpen && config.barcodeEnabled !== false && config.usbScannerEnabled !== false,
    minLength: 3,
    maxInterKeyLatencyMs: config.usbScanMaxLatencyMs || 55,
    ignoreInputs: true,
    onScan: (raw) => {
      const matched = matchItemByScannedCode(activeItems, raw);
      if (matched) {
        handleAddOrIncrementScannedItem(matched.id, matched.itemCode, matched.itemName);
      } else {
        if (config.barcodeBeepEnabled !== false) playScanBeep(false);
        setErrorMsg(`No catalog item matched scanned barcode "${raw}".`);
      }
    },
  });

  // Handle Team Change — strictly scoped to forSiteId
  const handleTeamChange = (newTeamId: string, forSiteId: string = selectedSiteId) => {
    setSelectedTeamId(newTeamId);
    const summary = getTeamSiteInHandStock(newTeamId, forSiteId);
    const firstEligible = summary.items.find((i) => i.currentInHand > 0);
    setReturnRows([
      {
        itemId: firstEligible?.itemId || '',
        quantity: '',
        condition: 'Good / Restock',
      },
    ]);
    const t = activeTeams.find((x) => x.id === newTeamId) || teams.find((x) => x.id === newTeamId);
    if (t) setReturnedBy(t.teamLeaderName);
  };

  const handleAddReturnRow = () => {
    const usedIds = new Set(returnRows.map((r) => r.itemId));
    const nextEligible = eligibleItems.find((e) => !usedIds.has(e.itemId)) || eligibleItems[0];
    setReturnRows((prev) => [
      ...prev,
      {
        itemId: nextEligible?.itemId || '',
        quantity: '',
        condition: 'Good / Restock',
      },
    ]);
  };

  const handleLoadAllHeldItems = () => {
    if (eligibleItems.length === 0) return;
    setReturnRows(
      eligibleItems.map((e) => ({
        itemId: e.itemId,
        quantity: e.currentInHand,
        condition: 'Good / Restock',
      }))
    );
    setErrorMsg('');
  };

  const handleUpdateReturnRow = (
    index: number,
    field: 'itemId' | 'quantity' | 'condition',
    value: string | number
  ) => {
    setReturnRows((prev) =>
      prev.map((row, idx) => {
        if (idx !== index) return row;
        if (field === 'itemId') {
          return { ...row, itemId: String(value), quantity: '' };
        }
        if (field === 'condition') {
          return { ...row, condition: value as ReturnCondition };
        }
        return { ...row, quantity: value === '' ? '' : Number(value) };
      })
    );
  };

  const handleRemoveReturnRow = (index: number) => {
    setReturnRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

  const handleProcessReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedTeamId) {
      setErrorMsg('Please select a returning field team.');
      return;
    }

    const activeRows = returnRows.filter((r) => r.itemId && Number(r.quantity) > 0);
    if (activeRows.length === 0) {
      setErrorMsg('Please select at least one item and enter a return quantity greater than zero.');
      return;
    }

    // Validate Main Yard transfer documentation & maximum in-hand balance per item
    const totalsByItem = new Map<string, number>();
    for (let i = 0; i < returnRows.length; i++) {
      const r = returnRows[i];
      if (!r.itemId) {
        setErrorMsg(`Row #${i + 1}: Please select an item to return.`);
        return;
      }
      if (!r.quantity || Number(r.quantity) <= 0) {
        const itm = eligibleItems.find((x) => x.itemId === r.itemId);
        setErrorMsg(`Row #${i + 1} (${itm?.itemName || 'Item'}): Please enter a return quantity greater than zero.`);
        return;
      }
      const st = getSiteItemStock(selectedSiteId, r.itemId);
      if (st.received <= 0) {
        const itm = eligibleItems.find((x) => x.itemId === r.itemId);
        setErrorMsg(
          `Cannot Return "${itm?.itemName || r.itemId}": Stock has not been documented or transferred from the Main Central Warehouse to ${selectedSiteName} (Received from Main Yard = 0).`
        );
        return;
      }
      totalsByItem.set(r.itemId, (totalsByItem.get(r.itemId) || 0) + Number(r.quantity));
    }

    for (const [itmId, totalQty] of totalsByItem.entries()) {
      const held = eligibleItems.find((x) => x.itemId === itmId);
      const maxHeld = held?.currentInHand || 0;
      if (totalQty > maxHeld) {
        setErrorMsg(
          `Return quantity (${totalQty} ${held?.unit || 'units'}) for "${held?.itemName || itmId}" cannot exceed team's active in-hand balance at ${selectedSiteName} (${maxHeld} ${held?.unit || 'units'}).`
        );
        return;
      }
    }

    try {
      const createdReturns = returnMultipleStockFromTeam({
        siteId: selectedSiteId,
        teamId: selectedTeamId,
        returnedBy,
        reason: reason.trim() || 'Work completed, remaining balance returned to site branch.',
        items: activeRows.map((r) => ({
          itemId: r.itemId,
          quantity: Number(r.quantity),
          condition: r.condition,
        })),
      });

      if (createdReturns.length > 0) {
        const firstVoucher = createdReturns[0];
        setSuccessToast(
          `Return Voucher ${firstVoucher.returnVoucherNumber} generated for ${createdReturns.length} item(s)! Team balance adjusted.`
        );
        setSelectedReturnForPrint(firstVoucher);
      }

      // Reset fields
      setReturnRows([
        {
          itemId: eligibleItems[0]?.itemId || '',
          quantity: '',
          condition: 'Good / Restock',
        },
      ]);
      setReason('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to process return.');
    }
  };

  const visibleReturns = teamReturns.filter((ret) => {
    if (!isSiteRestricted) return true;
    return userHasSiteAccess(currentUser, ret.siteId, activeSites);
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
      <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold tracking-wider uppercase">
            <span>Inward Recovery</span>
            <span aria-hidden="true" className="text-emerald-400/50">·</span>
            <span className="text-emerald-200">Material Reconciliation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Team Returns & In-Hand Stock Adjustment
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Log unused or recovered materials returned by field crews. The system instantly restores items in Good condition back to Site Branch inventory and reduces the team's in-hand custody balance.
          </p>
        </div>
      </div>

      {/* Main Form and Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-2 mb-4 border-b border-slate-100">
            <RotateCcw className="w-4 h-4 text-purple-700" />
            <h2 className="font-semibold text-sm text-slate-900">Log Returned Stock from Field Team</h2>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleProcessReturn} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Receiving Site Branch *</label>
                  {isSiteRestricted && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-amber-700" />
                      <span>{allowedSites.length > 1 ? `${allowedSites.length} Assigned Sites` : 'Assigned Site Only'}</span>
                    </span>
                  )}
                </div>
                <select
                  value={selectedSiteId}
                  disabled={isSingleSiteLocked}
                  onChange={(e) => {
                    const nextSiteId = e.target.value;
                    if (isSiteRestricted && !allowedSites.some((s) => s.id === nextSiteId)) return;
                    setSelectedSiteId(nextSiteId);
                    const newTeams = activeTeams.filter(
                      (t) =>
                        t.assignedSiteId === nextSiteId ||
                        t.pendingClearanceSiteId === nextSiteId ||
                        getTeamSiteInHandStock(t.id, nextSiteId).totalUnitsHeld > 0
                    );
                    if (newTeams[0]) handleTeamChange(newTeams[0].id, nextSiteId);
                    else setSelectedTeamId('');
                  }}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none transition-colors ${
                    isSingleSiteLocked
                      ? 'bg-slate-100 text-slate-800 border-slate-300 cursor-not-allowed select-none opacity-95'
                      : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {allowedSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatSiteHierarchyLabel(s, activeSites)} {isSiteRestricted ? '(Assigned)' : ''}
                    </option>
                  ))}
                </select>
                {isSiteRestricted && (
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <span>
                      Only teams and stock under <strong>{allowedSites.map((s) => s.name).join(', ') || userAssignedSite?.name || 'your assigned site(s)'}</strong> are accessible.
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Returning Team *</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => handleTeamChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
                  required
                >
                  {availableTeams.length === 0 ? (
                    <option value="">No teams at this site</option>
                  ) : (
                    availableTeams.map((t) => {
                      const currentAssignedSiteName =
                        activeSites.find((s) => s.id === t.assignedSiteId)?.name || 'New Site';
                      const isTransferredPendingHere = t.assignedSiteId !== selectedSiteId;
                      const unitsHeldAtThisSite = getTeamSiteInHandStock(t.id, selectedSiteId).totalUnitsHeld;
                      return (
                        <option key={t.id} value={t.id}>
                          {t.teamName}
                          {isTransferredPendingHere
                            ? ` [Stock to Return - ${selectedSiteName}: ${unitsHeldAtThisSite} units · Assigned to ${currentAssignedSiteName}]`
                            : t.assignmentStatus === 'Temporary'
                            ? ` [${getTemporaryAssignmentBadgeLabel(selectedSiteName)} · ${unitsHeldAtThisSite} units]`
                            : ` (${selectedSiteName}: ${unitsHeldAtThisSite} units)`}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>
            </div>

            {/* Multi-Item In-Hand Selector for Selected Team */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Items to Return ({returnRows.length} item{returnRows.length === 1 ? '' : 's'}) *
                  </label>
                  <p className="text-[10px] text-slate-500">
                    Add multiple items to return them all together on a single Return Voucher.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {eligibleItems.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={handleAddReturnRow}
                        className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Item</span>
                      </button>
                      {eligibleItems.length > 1 && (
                        <button
                          type="button"
                          onClick={handleLoadAllHeldItems}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Populate all items currently held by this team at this site"
                        >
                          <span>+ Add All Held ({eligibleItems.length})</span>
                        </button>
                      )}
                    </>
                  )}
                  {config.barcodeEnabled !== false && (
                    <button
                      type="button"
                      onClick={() => setScannerOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    >
                      <ScanLine className="w-3.5 h-3.5" />
                      <span>Scan Barcode</span>
                    </button>
                  )}
                </div>
              </div>

              {eligibleItems.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 italic">
                  This field team currently has 0 items in-hand under <strong>{selectedSiteName}</strong> to return.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {returnRows.map((row, idx) => {
                    const rowItemInHand = eligibleItems.find((i) => i.itemId === row.itemId);
                    const rowSiteStock =
                      selectedSiteId && row.itemId ? getSiteItemStock(selectedSiteId, row.itemId) : null;
                    const isRowDoc = rowSiteStock ? rowSiteStock.received > 0 : false;
                    const maxBalance = rowItemInHand?.currentInHand || 0;

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-800">
                            Return Item #{idx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            {rowItemInHand && (
                              <span className="text-[11px] font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                In-Hand: {formatNumber(maxBalance)} {rowItemInHand.unit}
                              </span>
                            )}
                            {returnRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveReturnRow(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Remove Item Row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="relative">
                          {(() => {
                            const selectedCatalogItem = items.find((c) => c.id === row.itemId);
                            const isDropdownOpen = openDropdownRowIdx === idx;
                            const q = dropdownSearch.trim().toLowerCase();
                            const filteredEligible = q
                              ? eligibleItems.filter(
                                  (e) =>
                                    e.itemCode.toLowerCase().includes(q) ||
                                    e.itemName.toLowerCase().includes(q)
                                )
                              : eligibleItems;

                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isDropdownOpen) {
                                      setOpenDropdownRowIdx(null);
                                    } else {
                                      setOpenDropdownRowIdx(idx);
                                      setDropdownSearch('');
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-slate-300 hover:border-slate-400 rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-700 focus:outline-none flex items-center justify-between gap-2.5 cursor-pointer shadow-2xs text-left"
                                >
                                  {rowItemInHand ? (
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      {selectedCatalogItem?.imageUrl ? (
                                        <img
                                          src={selectedCatalogItem.imageUrl}
                                          alt={rowItemInHand.itemName}
                                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-white shrink-0 shadow-2xs"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                                          <Package className="w-4 h-4" />
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                                            {rowItemInHand.itemCode}
                                          </span>
                                          <span className="font-mono font-bold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 text-[11px]">
                                            In-Hand: {formatNumber(rowItemInHand.currentInHand)} {rowItemInHand.unit}
                                          </span>
                                          {isRowDoc ? (
                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                              ✓ Yard Transferred: {rowSiteStock?.received || 0}
                                            </span>
                                          ) : (
                                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                              ⚠️ No Main Yard Transfer
                                            </span>
                                          )}
                                        </div>
                                        <div className="font-extrabold text-slate-900 text-xs truncate mt-0.5">
                                          {rowItemInHand.itemName}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">Select item to return...</span>
                                  )}
                                  <ChevronDown
                                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                                      isDropdownOpen ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>

                                {isDropdownOpen && (
                                  <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-300 rounded-xl shadow-2xl overflow-hidden">
                                    <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <input
                                        type="text"
                                        value={dropdownSearch}
                                        onChange={(e) => setDropdownSearch(e.target.value)}
                                        placeholder="Search in-hand item code or name..."
                                        className="w-full text-xs bg-transparent focus:outline-none text-slate-800"
                                        autoFocus
                                      />
                                    </div>
                                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                                      {filteredEligible.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-slate-400">
                                          No matching in-hand items found.
                                        </div>
                                      ) : (
                                        filteredEligible.map((item) => {
                                          const st = getSiteItemStock(selectedSiteId, item.itemId);
                                          const isDoc = st.received > 0;
                                          const catItem = items.find((c) => c.id === item.itemId);
                                          const isSelected = item.itemId === row.itemId;
                                          return (
                                            <div
                                              key={item.itemId}
                                              onClick={() => {
                                                handleUpdateReturnRow(idx, 'itemId', item.itemId);
                                                setOpenDropdownRowIdx(null);
                                                setDropdownSearch('');
                                              }}
                                              className={`p-2.5 hover:bg-purple-50/70 cursor-pointer flex items-center justify-between gap-2.5 transition-colors ${
                                                isSelected ? 'bg-purple-50 font-semibold' : ''
                                              }`}
                                            >
                                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                {catItem?.imageUrl ? (
                                                  <img
                                                    src={catItem.imageUrl}
                                                    alt={item.itemName}
                                                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-white shrink-0 shadow-2xs"
                                                  />
                                                ) : (
                                                  <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                                                    <Package className="w-4 h-4" />
                                                  </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-mono font-bold text-[11px] text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                      {item.itemCode}
                                                    </span>
                                                    {isDoc ? (
                                                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                                        ✓ Yard Transferred: {st.received}
                                                      </span>
                                                    ) : (
                                                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                                        ⚠️ No Main Yard Transfer
                                                      </span>
                                                    )}
                                                  </div>
                                                  <div className="text-xs font-extrabold text-slate-900 truncate mt-0.5">
                                                    {item.itemName}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2 shrink-0">
                                                <span className="px-2 py-1 rounded-md font-mono text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                                                  In-Hand: {formatNumber(item.currentInHand)} {item.unit}
                                                </span>
                                                {isSelected && <Check className="w-4 h-4 text-purple-700 shrink-0" />}
                                              </div>
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                          <div className="sm:col-span-5">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-semibold text-slate-700">
                                Return Qty *
                              </label>
                              {maxBalance > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateReturnRow(idx, 'quantity', maxBalance)}
                                  className="text-[10px] font-extrabold text-purple-700 hover:underline cursor-pointer"
                                >
                                  Max ({maxBalance})
                                </button>
                              )}
                            </div>
                            <input
                              type="number"
                              min="0.01"
                              max={maxBalance || 99999}
                              step="any"
                              placeholder={`Max ${maxBalance}`}
                              value={row.quantity}
                              onChange={(e) =>
                                handleUpdateReturnRow(
                                  idx,
                                  'quantity',
                                  e.target.value === '' ? '' : Number(e.target.value)
                                )
                              }
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                              required
                              disabled={!isRowDoc}
                            />
                          </div>

                          <div className="sm:col-span-7">
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Material Condition *
                            </label>
                            <select
                              value={row.condition}
                              onChange={(e) => handleUpdateReturnRow(idx, 'condition', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
                            >
                              <option value="Good / Restock">Good / Restock (Restore to Site Stock)</option>
                              <option value="Damaged / Scrap">Damaged / Scrap (Log to Damaged)</option>
                            </select>
                          </div>
                        </div>

                        {!isRowDoc && (
                          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>
                              Return blocked for this item: 0 units documented from Main Central Warehouse to{' '}
                              {selectedSiteName}.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Surrendered By</label>
                <input
                  type="text"
                  placeholder="Team Representative name"
                  value={returnedBy}
                  onChange={(e) => setReturnedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Job Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Remaining cable drum, job terminated"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={eligibleItems.length === 0}
              className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer ${
                eligibleItems.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-purple-800 hover:bg-purple-900 text-white'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>
                Record Return ({returnRows.filter((r) => r.itemId && Number(r.quantity) > 0).length || returnRows.length}{' '}
                Item{returnRows.length === 1 ? '' : 's'}) &amp; Generate Return Voucher
              </span>
            </button>
          </form>
        </div>

        {/* Right Info: Live Team In-Hand Snapshot — Strictly Site-Separated */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <h2 className="font-semibold text-sm text-slate-900">
                  In-Hand Custody for: {teamInHand?.team.teamName || 'Select Team'}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {teamInHand && teamInHand.team.assignedSiteId !== selectedSiteId ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                      <AlertTriangle className="w-3 h-3 text-amber-700" />
                      <span>Stock to Return - {selectedSiteName}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      <span>{selectedSiteName} — Active Site Stock</span>
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                {selectedSiteName}: {formatNumber(teamInHand?.totalUnitsHeld || 0)} units
              </span>
            </div>

            {eligibleItems.length === 0 ? (
              <div className="py-8 px-4 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
                This team currently holds <strong>0 units</strong> issued from <strong>{selectedSiteName}</strong>.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Item Code</th>
                      <th className="py-2.5 px-3">Material Description</th>
                      <th className="py-2.5 px-3 text-right">
                        {teamInHand && teamInHand.team.assignedSiteId !== selectedSiteId
                          ? `Stock to Return (${selectedSiteName})`
                          : `In-Hand (${selectedSiteName})`}
                      </th>
                      <th className="py-2.5 px-3 text-center">Yard Documented</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {eligibleItems.map((item) => {
                      const st = getSiteItemStock(selectedSiteId, item.itemId);
                      const isDoc = st.received > 0;
                      const catItem = items.find((c) => c.id === item.itemId);
                      return (
                        <tr
                          key={item.itemId}
                          onClick={() => handleAddOrIncrementScannedItem(item.itemId, item.itemCode, item.itemName)}
                          className="hover:bg-purple-50/50 cursor-pointer transition-colors"
                          title="Click to select or increment in return form"
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{item.itemCode}</td>
                          <td className="py-2.5 px-3 text-slate-900 font-bold max-w-[210px]">
                            <div className="flex items-center gap-2 min-w-0">
                              {catItem?.imageUrl ? (
                                <img
                                  src={catItem.imageUrl}
                                  alt={item.itemName}
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 bg-white shrink-0 shadow-2xs"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                                  <Package className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <span className="truncate">{item.itemName}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatNumber(item.currentInHand)} <span className="text-xs text-slate-500">{item.unit}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isDoc ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800" title={`Documented transfer: ${st.received} ${item.unit}`}>
                                ✓ Documented ({st.received})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800" title="No transfer documented from Main Yard">
                                ✕ Blocked (0)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Separate Display for Stock Held Under Other Site(s) — Never Combined */}
            {otherSiteBreakdowns.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-200">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  Separate Stock Held Under Other Site Branch(es) (Not Combinable)
                </div>
                {otherSiteBreakdowns.map((b) => {
                  const canSwitchToSite = allowedSites.some((s) => s.id === b.siteId);
                  return (
                    <div
                      key={b.siteId}
                      className={`p-3 rounded-xl border ${
                        b.isStockToReturn
                          ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                          : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="text-xs font-extrabold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>
                            {b.isStockToReturn
                              ? `Stock to Return - ${b.siteName}`
                              : `${b.siteName} — Active Site Stock`}
                          </span>
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white border border-amber-300">
                            {formatNumber(b.totalUnitsHeld)} units
                          </span>
                        </div>
                        {canSwitchToSite && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSiteId(b.siteId);
                              handleTeamChange(selectedTeamId, b.siteId);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-[10px] font-extrabold transition cursor-pointer"
                          >
                            Switch Site to {b.siteName} to Return
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {b.items
                          .filter((i) => i.currentInHand > 0)
                          .map((itm) => (
                            <span
                              key={`${b.siteId}-${itm.itemId}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-amber-200 text-[11px] font-medium text-slate-800"
                            >
                              <strong className="font-mono">{itm.itemCode}</strong> {itm.itemName}:{' '}
                              <strong className="font-mono text-amber-900">
                                {formatNumber(itm.currentInHand)} {itm.unit}
                              </strong>
                            </span>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <strong>System Rule:</strong> Stock is strictly isolated per site. Items issued under a previous site (
            <strong>Stock to Return - [Site Name]</strong>) must be returned to that specific site and are never mixed with the new site&apos;s stock.
          </div>
        </div>
      </div>

      {/* Return Vouchers Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm text-slate-900">Return Vouchers Archive ({visibleReturns.length})</h2>
            <span className="text-xs text-slate-500 font-mono">· Immutable inward log</span>
          </div>

          {visibleReturns.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setConfirmState({
                  isOpen: true,
                  title: 'Clear All Return Vouchers?',
                  message: `Are you sure you want to permanently clear all ${visibleReturns.length} field return voucher records?`,
                  confirmLabel: 'Clear All Returns',
                  onConfirm: () => {
                    clearTeamReturns();
                    setSuccessToast('All return vouchers cleared.');
                  },
                });
              }}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Clear all team return records"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear All Returns</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-2.5">Voucher #</th>
                <th className="py-3 px-2 w-24">Date & Time</th>
                <th className="py-3 px-2.5">Site Branch</th>
                <th className="py-3 px-2.5">Field Team</th>
                <th className="py-3 px-2.5">Item Code</th>
                <th className="py-3 px-3">Material Description</th>
                <th className="py-3 px-2.5 text-right">Returned Qty</th>
                <th className="py-3 px-2.5">Condition</th>
                <th className="py-3 px-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleReturns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-sm">
                    No return vouchers recorded yet.
                  </td>
                </tr>
              ) : (
                visibleReturns.map((ret) => {
                  const s = sites.find((site) => site.id === ret.siteId);
                  const t = teams.find((team) => team.id === ret.teamId);
                  const itm = items.find((i) => i.id === ret.itemId);
                  const dtParts = formatDateTimeParts(ret.returnDate);

                  return (
                    <tr key={ret.id} className="hover:bg-slate-50">
                      <td className="py-3 px-2.5 font-mono font-bold text-slate-900 whitespace-nowrap align-top">
                        {ret.returnVoucherNumber}
                      </td>
                      <td className="py-3 px-2 text-slate-600 whitespace-nowrap font-mono text-xs align-top leading-tight">
                        <div className="font-semibold text-slate-800">{dtParts.date}</div>
                        {dtParts.time && <div className="text-[11px] text-slate-500 mt-0.5">{dtParts.time}</div>}
                      </td>
                      <td className="py-3 px-2.5 text-slate-800 whitespace-nowrap font-bold align-top">
                        {s?.name}
                      </td>
                      <td className="py-3 px-2.5 whitespace-nowrap align-top">
                        <span className="font-bold text-slate-900">{t?.teamName}</span>
                        <div className="text-xs text-slate-500">By: {ret.returnedBy}</div>
                      </td>
                      <td className="py-3 px-2.5 font-mono font-bold text-slate-900 whitespace-nowrap align-top">
                        {itm?.itemCode}
                      </td>
                      <td className="py-3 px-3 text-slate-900 font-bold max-w-xs align-top" title={itm?.itemName}>
                        {itm?.itemName}
                        {ret.reason && <div className="text-xs text-slate-500 font-normal italic mt-0.5 truncate">{ret.reason}</div>}
                      </td>
                      <td className="py-3 px-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap align-top">
                        {formatNumber(ret.quantity)} <span className="text-xs text-slate-500 font-normal">{itm?.unit}</span>
                      </td>
                      <td className="py-3 px-2.5 whitespace-nowrap align-top">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            ret.condition.includes('Good')
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {ret.condition}
                        </span>
                      </td>
                      <td className="py-3 px-2.5 text-right whitespace-nowrap align-top">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReturnForPrint(ret)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium flex items-center gap-1"
                            title="Print Voucher"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                          </button>
                          <button
                            onClick={() => {
                              setConfirmState({
                                isOpen: true,
                                title: `Delete Return Voucher "${ret.returnVoucherNumber}"?`,
                                message: `Are you sure you want to delete return voucher ${ret.returnVoucherNumber} for item ${itm?.itemCode}?`,
                                confirmLabel: 'Delete Voucher',
                                onConfirm: () => {
                                  deleteTeamReturn(ret.id);
                                  setSuccessToast(`Deleted voucher ${ret.returnVoucherNumber}.`);
                                },
                              });
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Return Voucher"
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

      {/* Printable Modal */}
      {selectedReturnForPrint && (
        <PrintableDocumentModal
          document={{
            type: 'RETURN_VOUCHER',
            data: {
              ...selectedReturnForPrint,
              batchItems:
                selectedReturnForPrint.batchItems && selectedReturnForPrint.batchItems.length > 0
                  ? selectedReturnForPrint.batchItems
                  : teamReturns
                      .filter((r) => r.returnVoucherNumber === selectedReturnForPrint.returnVoucherNumber)
                      .map((r) => ({
                        itemId: r.itemId,
                        quantity: r.quantity,
                        condition: r.condition,
                      })),
            },
          }}
          onClose={() => setSelectedReturnForPrint(null)}
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
        title="Scan Barcode for Team Material Return"
        subtitle="Scan via USB Gun or Mobile Camera to add an item held by the field team"
        onSelectItem={(item) => {
          handleAddOrIncrementScannedItem(item.id, item.itemCode, item.itemName);
        }}
      />
    </div>
  );
};
