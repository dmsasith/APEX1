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
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  ReturnCondition,
  TeamReturn,
  isCentralOrAllSiteAdmin,
  isUserAllSites,
  getUserAssignedSiteIds,
  userHasSiteAccess,
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
    returnStockFromTeam,
    clearTeamReturns,
    deleteTeamReturn,
    config,
  } = useStock();

  const [selectedReturnForPrint, setSelectedReturnForPrint] = useState<TeamReturn | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
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

  const isAllSitesUser = isUserAllSites(currentUser) || isCentralOrAllSiteAdmin(currentUser.role);
  const isSiteRestricted = !isAllSitesUser;
  const userAssignedSiteIds = getUserAssignedSiteIds(currentUser, activeSites);

  const branchSites = activeSites;
  const allowedSites = isSiteRestricted
    ? activeSites.filter((s) => userAssignedSiteIds.includes(s.id))
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
  const [condition, setCondition] = useState<ReturnCondition>('Good / Restock');
  const [reason, setReason] = useState('');
  const [returnQty, setReturnQty] = useState<number | ''>('');
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

  const [selectedItemId, setSelectedItemId] = useState<string>(eligibleItems[0]?.itemId || '');

  useEffect(() => {
    if (eligibleItems.length > 0 && !eligibleItems.some((i) => i.itemId === selectedItemId)) {
      setSelectedItemId(eligibleItems[0].itemId);
    } else if (eligibleItems.length === 0 && selectedItemId !== '') {
      setSelectedItemId('');
    }
  }, [selectedSiteId, selectedTeamId, eligibleItems, selectedItemId]);

  useUsbBarcodeScanner({
    enabled: !scannerOpen && config.barcodeEnabled !== false && config.usbScannerEnabled !== false,
    minLength: 3,
    maxInterKeyLatencyMs: config.usbScanMaxLatencyMs || 55,
    ignoreInputs: true,
    onScan: (raw) => {
      const matched = matchItemByScannedCode(activeItems, raw);
      if (matched) {
        const held = eligibleItems.find((e) => e.itemId === matched.id);
        if (held) {
          if (config.barcodeBeepEnabled !== false) playScanBeep(true);
          setSelectedItemId(matched.id);
          setReturnQty((prev) => (typeof prev === 'number' ? Math.min(prev + 1, held.currentInHand) : 1));
          setSuccessToast(`Scanned & selected for return: [${matched.itemCode}] ${matched.itemName}`);
        } else {
          if (config.barcodeBeepEnabled !== false) playScanBeep(false);
          setErrorMsg(`Item [${matched.itemCode}] ${matched.itemName} has 0 in-hand balance for the selected team.`);
        }
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
    setSelectedItemId(firstEligible?.itemId || '');
    const t = activeTeams.find((x) => x.id === newTeamId) || teams.find((x) => x.id === newTeamId);
    if (t) setReturnedBy(t.teamLeaderName);
  };

  const currentSelectedItemInHand = eligibleItems.find((i) => i.itemId === selectedItemId);

  // Check whether selected item was officially documented and transferred from the Main Central Warehouse
  const currentItemSiteStock = selectedSiteId && selectedItemId
    ? getSiteItemStock(selectedSiteId, selectedItemId)
    : null;
  const isDocumentedFromMainYard = currentItemSiteStock ? currentItemSiteStock.received > 0 : false;

  const handleProcessReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedTeamId) {
      setErrorMsg('Please select a team.');
      return;
    }
    if (!selectedItemId || !currentSelectedItemInHand) {
      setErrorMsg('Please select an item currently held in-hand by the team.');
      return;
    }
    // Main Yard documentation validation check
    if (!isDocumentedFromMainYard) {
      setErrorMsg(
        `Cannot Return: Stock has not been documented or transferred from the Main Central Warehouse to this site branch (Received from Main Yard = 0). Under company inventory policy, items cannot be returned unless officially documented and transferred from Main Yard first.`
      );
      return;
    }
    if (!returnQty || Number(returnQty) <= 0) {
      setErrorMsg('Please enter a return quantity greater than zero.');
      return;
    }
    if (Number(returnQty) > currentSelectedItemInHand.currentInHand) {
      setErrorMsg(
        `Return quantity (${returnQty}) cannot exceed team in-hand active balance (${currentSelectedItemInHand.currentInHand}).`
      );
      return;
    }

    try {
      const newReturn = returnStockFromTeam({
        siteId: selectedSiteId,
        teamId: selectedTeamId,
        itemId: selectedItemId,
        quantity: Number(returnQty),
        condition,
        reason: reason.trim() || 'Work completed, remaining balance returned to site branch.',
      });

      setSuccessToast(`Return Voucher ${newReturn.returnVoucherNumber} generated! Team balance adjusted.`);
      setSelectedReturnForPrint(newReturn);

      // Reset fields
      setReturnQty('');
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
                      {s.name} {isSiteRestricted ? '(Assigned)' : ''}
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

            {/* In-Hand Items Selector for Selected Team */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Select Item to Return (Only items held by team) *
                </label>
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
              {eligibleItems.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 italic">
                  This field team currently has 0 items in-hand to return.
                </div>
              ) : (
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
                  required
                >
                  {eligibleItems.map((item) => {
                    const st = getSiteItemStock(selectedSiteId, item.itemId);
                    const isDoc = st.received > 0;
                    return (
                      <option key={item.itemId} value={item.itemId}>
                        [{item.itemCode}] {item.itemName} — In-Hand: {item.currentInHand} {item.unit} {isDoc ? `✓ (Yard Transferred: ${st.received})` : '⚠️ (No Main Yard Transfer - Blocked)'}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {currentSelectedItemInHand && (
              <div className="space-y-2">
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-xs text-purple-900 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{currentSelectedItemInHand.itemName}</span>
                    <div className="text-[11px] text-purple-800 mt-0.5">
                      Team active custody: <strong className="font-mono text-slate-900">{currentSelectedItemInHand.currentInHand} {currentSelectedItemInHand.unit}</strong>
                    </div>
                  </div>
                  <Package className="w-5 h-5 text-purple-600 shrink-0" />
                </div>

                {/* Main Yard Documented Stock Verification Status */}
                {isDocumentedFromMainYard ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-emerald-900">Main Yard Documentation Verified</span>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Documented transfer received: <strong>{currentItemSiteStock?.received} {currentSelectedItemInHand.unit}</strong> from Main Central Warehouse. Return to Site Branch yard is authorized.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-900">Return Blocked: No Main Yard Transfer Documentation</span>
                      <p className="text-[11px] text-rose-700 mt-1 leading-relaxed">
                        This item has <strong>0 units</strong> documented or issued from the Main Central Warehouse to this site branch. Under warehouse policy, items cannot be returned unless officially documented and transferred from the Main Yard.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Return Quantity *</label>
                <input
                  type="number"
                  min="1"
                  max={currentSelectedItemInHand?.currentInHand || 99999}
                  step="any"
                  placeholder="0"
                  value={returnQty}
                  onChange={(e) => setReturnQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                  disabled={eligibleItems.length === 0 || !isDocumentedFromMainYard}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Material Condition *</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ReturnCondition)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  <option value="Good / Restock">Good / Restock (Added back to site inventory)</option>
                  <option value="Damaged / Scrap">Damaged / Scrap (Not added to available site stock)</option>
                </select>
              </div>
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
              disabled={eligibleItems.length === 0 || !isDocumentedFromMainYard}
              className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs ${
                eligibleItems.length === 0 || !isDocumentedFromMainYard
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-purple-800 hover:bg-purple-900 text-white'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isDocumentedFromMainYard ? 'Record Return & Generate Return Voucher' : 'Return Blocked (Undocumented from Main Yard)'}</span>
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
                      return (
                        <tr key={item.itemId} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{item.itemCode}</td>
                          <td className="py-2.5 px-3 text-slate-900 font-bold max-w-[180px] truncate">{item.itemName}</td>
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
          document={{ type: 'RETURN_VOUCHER', data: selectedReturnForPrint }}
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
        subtitle="Scan via USB Gun or Mobile Camera to select an item held by the field team"
        onSelectItem={(item) => {
          const held = eligibleItems.find((e) => e.itemId === item.id);
          if (held) {
            setSelectedItemId(item.id);
            setReturnQty((prev) => (typeof prev === 'number' ? Math.min(prev + 1, held.currentInHand) : 1));
            setSuccessToast(`Scanned & selected for return: [${item.itemCode}] ${item.itemName}`);
          } else {
            setErrorMsg(`Item [${item.itemCode}] ${item.itemName} has 0 in-hand balance for the selected team.`);
          }
        }}
      />
    </div>
  );
};
