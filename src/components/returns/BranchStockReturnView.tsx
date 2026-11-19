import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  Printer,
  AlertTriangle,
  Building,
  Package,
  FileCheck,
  Trash2,
  Search,
  Clock,
  ArrowRight,
  Boxes,
  ScanLine,
  Plus,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  BranchReturn,
  ReturnCondition,
  isSuperAdmin,
  isCentralOrAllSiteAdmin,
  isUserAllSites,
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

export const BranchStockReturnView: React.FC = () => {
  const {
    sites,
    activeSites,
    items,
    activeItems,
    branchReturns,
    currentUser,
    getSiteItemStock,
    returnMultipleStockFromBranchToMain,
    clearBranchReturns,
    deleteBranchReturn,
    config,
  } = useStock();

  const isCentralAdmin = isSuperAdmin(currentUser?.role) || currentUser?.username === 'admin';

  const [selectedReturnForPrint, setSelectedReturnForPrint] = useState<BranchReturn | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [filterBranchId, setFilterBranchId] = useState('all');

  // Confirmation modal
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

  const isAllSitesAdmin =
    isCentralAdmin || isCentralOrAllSiteAdmin(currentUser?.role) || isUserAllSites(currentUser);

  // Eligible branch sites (excluding main warehouse), scoped to assigned sites when restricted
  const branchSites = activeSites.filter((s) => !s.isMainWarehouse);
  const allowedBranchSites = isAllSitesAdmin
    ? branchSites
    : branchSites.filter((s) => userHasSiteAccess(currentUser, s.id, activeSites));
  const initialSiteId = allowedBranchSites[0]?.id || branchSites[0]?.id || activeSites[0]?.id || '';

  const [selectedSiteId, setSelectedSiteId] = useState<string>(initialSiteId);
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate items with stock > 0 in this branch
  const availableStockItems = activeItems
    .map((item) => {
      const siteStock = getSiteItemStock(selectedSiteId, item.id);
      return {
        item,
        availableBalance: siteStock.availableBalance,
        received: siteStock.received,
      };
    })
    .filter((entry) => entry.availableBalance > 0);

  // Multi-item return rows state
  const [returnRows, setReturnRows] = useState<
    Array<{ itemId: string; quantity: number | ''; condition: ReturnCondition }>
  >([
    {
      itemId: availableStockItems[0]?.item.id || '',
      quantity: '',
      condition: 'Good / Restock',
    },
  ]);

  React.useEffect(() => {
    setReturnRows((prev) => {
      if (availableStockItems.length === 0) {
        return [{ itemId: '', quantity: '' as const, condition: 'Good / Restock' }];
      }
      const updated = prev.map((r) => {
        if (r.itemId && availableStockItems.some((e) => e.item.id === r.itemId)) {
          return r;
        }
        return { ...r, itemId: availableStockItems[0].item.id, quantity: '' as const };
      });
      return updated.length > 0
        ? updated
        : [{ itemId: availableStockItems[0].item.id, quantity: '' as const, condition: 'Good / Restock' }];
    });
  }, [selectedSiteId, availableStockItems.length]);

  const handleAddOrIncrementBranchItem = (matchedItemId: string, itemCode: string, itemName: string) => {
    const entry = availableStockItems.find((e) => e.item.id === matchedItemId);
    if (!entry) {
      if (config.barcodeBeepEnabled !== false) playScanBeep(false);
      setErrorMsg(`Item [${itemCode}] ${itemName} has 0 available balance at this branch.`);
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
                    ? Math.min(r.quantity + 1, entry.availableBalance)
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
    setSuccessToast(`Added for branch return: [${itemCode}] ${itemName}`);
  };

  useUsbBarcodeScanner({
    enabled: !scannerOpen && config.barcodeEnabled !== false && config.usbScannerEnabled !== false,
    minLength: 3,
    maxInterKeyLatencyMs: config.usbScanMaxLatencyMs || 55,
    ignoreInputs: true,
    onScan: (raw) => {
      const matched = matchItemByScannedCode(activeItems, raw);
      if (matched) {
        handleAddOrIncrementBranchItem(matched.id, matched.itemCode, matched.itemName);
      } else {
        if (config.barcodeBeepEnabled !== false) playScanBeep(false);
        setErrorMsg(`No catalog item matched scanned barcode "${raw}".`);
      }
    },
  });

  const handleSiteChange = (newSiteId: string) => {
    setSelectedSiteId(newSiteId);
    const nextAvail = activeItems.filter((itm) => getSiteItemStock(newSiteId, itm.id).availableBalance > 0);
    setReturnRows([
      {
        itemId: nextAvail[0]?.id || '',
        quantity: '',
        condition: 'Good / Restock',
      },
    ]);
  };

  const handleAddReturnRow = () => {
    const usedIds = new Set(returnRows.map((r) => r.itemId));
    const nextAvail = availableStockItems.find((e) => !usedIds.has(e.item.id)) || availableStockItems[0];
    setReturnRows((prev) => [
      ...prev,
      {
        itemId: nextAvail?.item.id || '',
        quantity: '',
        condition: 'Good / Restock',
      },
    ]);
  };

  const handleLoadAllAvailableItems = () => {
    if (availableStockItems.length === 0) return;
    setReturnRows(
      availableStockItems.map((e) => ({
        itemId: e.item.id,
        quantity: e.availableBalance,
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

    if (!selectedSiteId) {
      setErrorMsg('Please select a source site branch.');
      return;
    }

    const activeRows = returnRows.filter((r) => r.itemId && Number(r.quantity) > 0);
    if (activeRows.length === 0) {
      setErrorMsg('Please select at least one item and enter a valid return quantity greater than zero.');
      return;
    }

    const totalsByItem = new Map<string, number>();
    for (let i = 0; i < returnRows.length; i++) {
      const r = returnRows[i];
      if (!r.itemId) {
        setErrorMsg(`Row #${i + 1}: Please select an item with available branch inventory.`);
        return;
      }
      if (!r.quantity || Number(r.quantity) <= 0) {
        const entry = availableStockItems.find((e) => e.item.id === r.itemId);
        setErrorMsg(`Row #${i + 1} (${entry?.item.itemName || 'Item'}): Please enter a return quantity greater than zero.`);
        return;
      }
      totalsByItem.set(r.itemId, (totalsByItem.get(r.itemId) || 0) + Number(r.quantity));
    }

    for (const [itmId, totalQty] of totalsByItem.entries()) {
      const entry = availableStockItems.find((e) => e.item.id === itmId);
      const maxAvail = entry?.availableBalance || 0;
      if (totalQty > maxAvail) {
        setErrorMsg(
          `Return quantity (${totalQty} ${entry?.item.unit || 'units'}) for "${entry?.item.itemName || itmId}" exceeds current branch yard stock (${maxAvail} ${entry?.item.unit || 'units'}).`
        );
        return;
      }
    }

    const currentBranch = sites.find((s) => s.id === selectedSiteId);

    try {
      const createdReturns = returnMultipleStockFromBranchToMain({
        siteId: selectedSiteId,
        siteName: currentBranch?.name || 'Site Branch',
        fromSiteId: selectedSiteId,
        fromSiteName: currentBranch?.name || 'Site Branch',
        reason: reason.trim() || 'Excess/surplus stock returned to Main Central Warehouse.',
        items: activeRows.map((r) => ({
          itemId: r.itemId,
          quantity: Number(r.quantity),
          condition: r.condition,
        })),
      });

      if (createdReturns.length > 0) {
        const firstNote = createdReturns[0];
        setSuccessToast(
          `Branch Return Note ${firstNote.branchReturnNumber} generated for ${createdReturns.length} item(s)! Returned to Central Yard.`
        );
        setSelectedReturnForPrint(firstNote);
      }

      // Reset fields
      setReturnRows([
        {
          itemId: availableStockItems[0]?.item.id || '',
          quantity: '',
          condition: 'Good / Restock',
        },
      ]);
      setReason('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to return stock to Central Warehouse.');
    }
  };

  const currentBranchObj = sites.find((s) => s.id === selectedSiteId);

  // Filtered return list
  const filteredReturns = branchReturns.filter((br) => {
    if (br.isDeleted) return false;
    const bId = br.fromSiteId || br.siteId;
    if (filterBranchId !== 'all' && bId !== filterBranchId) return false;
    if (!isAllSitesAdmin && !userHasSiteAccess(currentUser, bId, activeSites)) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchNum = br.branchReturnNumber.toLowerCase().includes(q);
      const matchSite = (br.siteName || br.fromSiteName || '').toLowerCase().includes(q);
      const item = items.find((i) => i.id === br.itemId);
      const matchItem =
        (item?.itemName || '').toLowerCase().includes(q) || (item?.itemCode || '').toLowerCase().includes(q);
      const matchReason = (br.reason || '').toLowerCase().includes(q);
      return matchNum || matchSite || matchItem || matchReason;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold tracking-wider uppercase">
              <Boxes className="w-3.5 h-3.5 text-emerald-400" />
              <span>Site-to-Central Return Logistics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Branch Stock Return (To Main Yard)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Return surplus, completed project balance, or scrap materials from Site Branches directly back to Central Main Warehouse
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-medium text-slate-200 bg-slate-950/60 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 shrink-0">
            <Building className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Operating Site: <strong className="text-white">{isCentralAdmin ? 'All Branches (Central Admin)' : currentBranchObj?.name}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span>Returns Logged: <strong className="text-emerald-300">{branchReturns.length}</strong></span>
          </div>
        </div>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Entry Grid: Form on Left, Available Stock on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-indigo-600" />
              Transfer Branch Stock to Central Main Yard
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
              <span>{currentBranchObj?.name || 'Branch'}</span>
              <ArrowRight className="w-3 h-3" />
              <span>Main Central Yard</span>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleProcessReturn} className="space-y-4">
            <div>
              {/* Site Branch Selection: Central Admin can select any branch; Branch user locked to their own */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Source Site Branch *
                </label>
                <select
                  value={selectedSiteId}
                  onChange={(e) => handleSiteChange(e.target.value)}
                  disabled={!isAllSitesAdmin && allowedBranchSites.length <= 1}
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-80"
                  required
                >
                  {!isAllSitesAdmin && allowedBranchSites.length === 0 ? (
                    <option value={currentBranchObj?.id}>{currentBranchObj?.name} ({currentBranchObj?.location})</option>
                  ) : (
                    (isAllSitesAdmin ? branchSites : allowedBranchSites).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.location})
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isAllSitesAdmin
                    ? 'As Central Admin, you can select and return stock from any site branch.'
                    : allowedBranchSites.length > 1
                    ? `You can select any of your ${allowedBranchSites.length} assigned site branches.`
                    : 'Branch users can only return items from their assigned branch.'}
                </p>
              </div>
            </div>

            {/* Multi-Item Selection List (ONLY ITEMS WITH AVAILABLE STOCK > 0) */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Items to Return to Central Main Yard ({returnRows.length} item{returnRows.length === 1 ? '' : 's'}) *
                  </label>
                  <p className="text-[10px] text-slate-500">
                    Add multiple items to return them all together on a single Branch Return Note.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {availableStockItems.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={handleAddReturnRow}
                        className="px-2.5 py-1 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Item</span>
                      </button>
                      {availableStockItems.length > 1 && (
                        <button
                          type="button"
                          onClick={handleLoadAllAvailableItems}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Populate all items currently available at this branch"
                        >
                          <span>+ Add All Available ({availableStockItems.length})</span>
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
                      <ScanLine className="w-3 h-3" />
                      <span>Scan Barcode</span>
                    </button>
                  )}
                </div>
              </div>

              {availableStockItems.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium">
                  This branch yard currently has 0 available items in stock to return.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {returnRows.map((row, idx) => {
                    const rowEntry = availableStockItems.find((e) => e.item.id === row.itemId);
                    const maxAvail = rowEntry?.availableBalance || 0;

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-800">
                            Return Item #{idx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            {rowEntry && (
                              <span className="text-[11px] font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                                Available: {formatNumber(maxAvail)} {rowEntry.item.unit}
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

                        <div>
                          <select
                            value={row.itemId}
                            onChange={(e) => handleUpdateReturnRow(idx, 'itemId', e.target.value)}
                            className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                          >
                            {availableStockItems.map(({ item, availableBalance }) => (
                              <option key={item.id} value={item.id}>
                                [{item.itemCode}] {item.itemName} — In Stock: {availableBalance} {item.unit}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                          <div className="sm:col-span-5">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-semibold text-slate-700">
                                Return Quantity *
                              </label>
                              {maxAvail > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateReturnRow(idx, 'quantity', maxAvail)}
                                  className="text-[10px] font-extrabold text-indigo-700 hover:underline cursor-pointer"
                                >
                                  Max ({maxAvail})
                                </button>
                              )}
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                min="0.01"
                                max={maxAvail || 1}
                                step="any"
                                value={row.quantity}
                                onChange={(e) =>
                                  handleUpdateReturnRow(
                                    idx,
                                    'quantity',
                                    e.target.value === '' ? '' : Number(e.target.value)
                                  )
                                }
                                placeholder={`Max: ${maxAvail}`}
                                className="w-full text-xs font-mono font-bold px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                              />
                              {rowEntry && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                                  {rowEntry.item.unit}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="sm:col-span-7">
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Item Condition *
                            </label>
                            <select
                              value={row.condition}
                              onChange={(e) => handleUpdateReturnRow(idx, 'condition', e.target.value)}
                              className="w-full text-xs font-medium px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="Good / Restock">Good / Restock (Restore to Central Stock)</option>
                              <option value="Damaged / Scrap">Damaged / Scrap (Central Quarantine/Scrap)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reason / Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Return to Central Yard *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="e.g. Project finished, surplus stock recalled to main warehouse, decommissioned equipment."
                className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={availableStockItems.length === 0}
                className="px-5 py-2.5 bg-indigo-700 text-white rounded-lg text-xs font-bold hover:bg-indigo-800 transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>
                  Process Return ({returnRows.filter((r) => r.itemId && Number(r.quantity) > 0).length || returnRows.length}{' '}
                  Item{returnRows.length === 1 ? '' : 's'}) to Main Yard &amp; Print Note
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Branch Available Stock Reference Card (1 Col) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-indigo-600" />
            {currentBranchObj?.name || 'Branch'} Available Yard Inventory
          </h2>
          <p className="text-[11px] text-slate-500 mb-3">
            Click any item below to add it to the return list. Only items with positive branch balance are eligible.
          </p>

          <div className="flex-1 overflow-y-auto max-h-[360px] space-y-2 pr-1">
            {availableStockItems.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No positive stock balance available in this branch.
              </div>
            ) : (
              availableStockItems.map(({ item, availableBalance }) => {
                const isSelected = returnRows.some((r) => r.itemId === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleAddOrIncrementBranchItem(item.id, item.itemCode, item.itemName)}
                    className={`p-2.5 border rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50'
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-slate-800 truncate">{item.itemName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {item.itemCode} · {item.category}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-indigo-700">
                        {formatNumber(availableBalance)} {item.unit}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isSelected ? '✓ Added to Return' : '+ Click to Add'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* History Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800">
              Branch Stock Returns to Main Yard ({filteredReturns.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isCentralAdmin && (
              <select
                value={filterBranchId}
                onChange={(e) => setFilterBranchId(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
              >
                <option value="all">All Branches</option>
                {branchSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search note, site, item..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
              />
            </div>

            {isCentralAdmin && branchReturns.length > 0 && (
              <button
                onClick={() =>
                  setConfirmState({
                    isOpen: true,
                    title: 'Clear Branch Return Records',
                    message:
                      'Are you sure you want to permanently clear all branch return records? Stock balances will be preserved.',
                    confirmLabel: 'Clear All',
                    onConfirm: () => {
                      clearBranchReturns();
                      setConfirmState((prev) => ({ ...prev, isOpen: false }));
                    },
                  })
                }
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1.5 border border-rose-200 rounded-lg bg-rose-50"
              >
                Clear Log
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
              <tr>
                <th className="py-3 px-2.5">Return Note #</th>
                <th className="py-3 px-2 w-24">Date & Time</th>
                <th className="py-3 px-2.5">Source Branch</th>
                <th className="py-3 px-2.5">Material Description & Code</th>
                <th className="py-3 px-2.5">Quantity</th>
                <th className="py-3 px-2.5">Condition</th>
                <th className="py-3 px-2.5">Reason</th>
                <th className="py-3 px-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">
                    No branch stock return records logged yet.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => {
                  const itm = items.find((i) => i.id === ret.itemId);
                  const dtParts = formatDateTimeParts(ret.returnDate);

                  return (
                    <tr key={ret.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2.5 font-mono font-bold text-indigo-700 whitespace-nowrap align-top">
                        {ret.branchReturnNumber}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap text-slate-600 text-xs font-mono align-top leading-tight">
                        <div className="font-semibold text-slate-800">{dtParts.date}</div>
                        {dtParts.time && <div className="text-[11px] text-slate-500 mt-0.5">{dtParts.time}</div>}
                      </td>
                      <td className="py-3 px-2.5 font-bold text-slate-900 align-top">
                        {ret.siteName || ret.fromSiteName || 'Site Branch'}
                      </td>
                      <td className="py-3 px-2.5 align-top">
                        <div className="font-bold text-slate-900 text-sm">{itm?.itemName || 'Item'}</div>
                        <div className="text-xs text-slate-500 font-mono">{itm?.itemCode || 'CODE'}</div>
                      </td>
                      <td className="py-3 px-2.5 font-mono font-extrabold text-indigo-800 align-top">
                        {formatNumber(ret.quantity)} {itm?.unit || 'Nos'}
                      </td>
                      <td className="py-3 px-2.5 align-top">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            ret.condition === 'Good / Restock'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {ret.condition}
                        </span>
                      </td>
                      <td className="py-3 px-2.5 max-w-xs truncate text-slate-600 align-top">
                        {ret.reason}
                      </td>
                      <td className="py-3 px-2.5 text-right whitespace-nowrap align-top">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReturnForPrint(ret)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200"
                            title="Print Transfer Return Note"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Note
                          </button>
                          {isCentralAdmin && (
                            <button
                              onClick={() =>
                                setConfirmState({
                                  isOpen: true,
                                  title: 'Delete Branch Return Record',
                                  message: `Are you sure you want to delete ${ret.branchReturnNumber}?`,
                                  confirmLabel: 'Delete Record',
                                  onConfirm: () => {
                                    deleteBranchReturn(ret.id);
                                    setConfirmState((prev) => ({ ...prev, isOpen: false }));
                                  },
                                })
                              }
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Printable Voucher Modal */}
      {selectedReturnForPrint && (
        <PrintableDocumentModal
          isOpen={!!selectedReturnForPrint}
          onClose={() => setSelectedReturnForPrint(null)}
          title="INTER-BRANCH RETURN TO CENTRAL YARD NOTE"
          documentNumber={selectedReturnForPrint.branchReturnNumber}
          documentDate={selectedReturnForPrint.returnDate}
          recipientLabel="Receiving Yard"
          recipientName="Main Central Warehouse"
          recipientSubDetails={`Returned from: ${selectedReturnForPrint.siteName || selectedReturnForPrint.fromSiteName} | Processed by: ${selectedReturnForPrint.returnedBy}`}
          notes={`Reason: ${selectedReturnForPrint.reason}`}
          items={(selectedReturnForPrint.batchItems && selectedReturnForPrint.batchItems.length > 0
            ? selectedReturnForPrint.batchItems
            : branchReturns
                .filter((r) => r.branchReturnNumber === selectedReturnForPrint.branchReturnNumber && !r.isDeleted)
                .map((r) => ({ itemId: r.itemId, quantity: r.quantity, condition: r.condition }))
          ).map((row) => {
            const itm = items.find((i) => i.id === row.itemId);
            return {
              itemCode: itm?.itemCode || 'CODE',
              itemName: `${itm?.itemName || 'Material Item'} (${row.condition})`,
              category: itm?.category || 'Telecom Equipment',
              quantity: row.quantity,
              unit: itm?.unit || 'Nos',
            };
          })}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        mode="select"
        siteId={selectedSiteId}
        title="Scan Barcode for Branch Stock Return"
        subtitle="Scan via USB Gun or Mobile Camera to add an item from branch inventory"
        onSelectItem={(item) => {
          handleAddOrIncrementBranchItem(item.id, item.itemCode, item.itemName);
        }}
      />
    </div>
  );
};
