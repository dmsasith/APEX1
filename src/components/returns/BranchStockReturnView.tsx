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
import { formatNumber, formatDateTime } from '../../utils/exportUtils';
import { PrintableDocumentModal } from '../common/PrintableDocumentModal';
import { ConfirmModal } from '../common/ConfirmModal';

export const BranchStockReturnView: React.FC = () => {
  const {
    sites,
    activeSites,
    items,
    activeItems,
    branchReturns,
    currentUser,
    getSiteItemStock,
    returnStockFromBranchToMain,
    clearBranchReturns,
    deleteBranchReturn,
  } = useStock();

  const isCentralAdmin = isSuperAdmin(currentUser?.role) || currentUser?.username === 'admin';

  const [selectedReturnForPrint, setSelectedReturnForPrint] = useState<BranchReturn | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
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
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [returnQty, setReturnQty] = useState<number | ''>('');
  const [condition, setCondition] = useState<ReturnCondition>('Good / Restock');
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

  // Auto-select first available item if current selection isn't valid
  const currentSelectedItemEntry = availableStockItems.find((e) => e.item.id === selectedItemId);
  const activeSelectedItem = currentSelectedItemEntry || availableStockItems[0];
  const activeItemId = selectedItemId || activeSelectedItem?.item.id || '';

  const handleSiteChange = (newSiteId: string) => {
    setSelectedSiteId(newSiteId);
    setSelectedItemId('');
    setReturnQty('');
  };

  const handleProcessReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedSiteId) {
      setErrorMsg('Please select a source site branch.');
      return;
    }
    if (!activeItemId || !activeSelectedItem) {
      setErrorMsg('Please select an item with available branch inventory.');
      return;
    }
    if (!returnQty || Number(returnQty) <= 0) {
      setErrorMsg('Please enter a valid return quantity greater than zero.');
      return;
    }
    if (Number(returnQty) > activeSelectedItem.availableBalance) {
      setErrorMsg(
        `Return quantity (${returnQty}) exceeds current branch yard stock (${activeSelectedItem.availableBalance} ${activeSelectedItem.item.unit}).`
      );
      return;
    }

    const currentBranch = sites.find((s) => s.id === selectedSiteId);

    try {
      const newBranchReturn = returnStockFromBranchToMain({
        siteId: selectedSiteId,
        siteName: currentBranch?.name || 'Site Branch',
        fromSiteId: selectedSiteId,
        fromSiteName: currentBranch?.name || 'Site Branch',
        itemId: activeItemId,
        quantity: Number(returnQty),
        condition,
        reason: reason.trim() || 'Excess/surplus stock returned to Main Central Warehouse.',
      });

      setSuccessToast(
        `Branch Return Note ${newBranchReturn.branchReturnNumber} generated! Returned to Central Yard.`
      );
      setSelectedReturnForPrint(newBranchReturn);

      // Reset fields
      setReturnQty('');
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
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shadow-xs">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Branch Stock Return (To Main Yard)
              </h1>
              <p className="text-xs text-slate-500">
                Return surplus, completed project balance, or scrap materials from Site Branches directly back to Central Main Warehouse
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <Building className="w-4 h-4 text-indigo-600" />
          <span>
            Operating Site: <strong>{isCentralAdmin ? 'All Branches (Central Admin)' : currentBranchObj?.name}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span>Returns Logged: <strong>{branchReturns.length}</strong></span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Item Selection (ONLY ITEMS WITH AVAILABLE STOCK > 0) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item to Return (Available Stock Only) *
                </label>
                <select
                  value={activeItemId}
                  onChange={(e) => {
                    setSelectedItemId(e.target.value);
                    setReturnQty('');
                  }}
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {availableStockItems.length === 0 ? (
                    <option value="">No Items with Stock &gt; 0 in this Branch</option>
                  ) : (
                    availableStockItems.map(({ item, availableBalance }) => (
                      <option key={item.id} value={item.id}>
                        [{item.itemCode}] {item.itemName} — In Stock: {availableBalance} {item.unit}
                      </option>
                    ))
                  )}
                </select>
                {availableStockItems.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1 font-medium">
                    This branch yard currently has 0 available items in stock to return.
                  </p>
                )}
              </div>

              {/* Return Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Return Quantity *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={activeSelectedItem?.availableBalance || 1}
                    value={returnQty}
                    onChange={(e) => setReturnQty(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={`Max: ${activeSelectedItem?.availableBalance || 0}`}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  {activeSelectedItem && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {activeSelectedItem.item.unit}
                    </span>
                  )}
                </div>
              </div>

              {/* Return Condition */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Condition *
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ReturnCondition)}
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Good / Restock">Good / Restock (Added back to Central Available Stock)</option>
                  <option value="Damaged / Scrap">Damaged / Scrap (Requires Central Quarantine/Scrap)</option>
                </select>
              </div>
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
                className="px-5 py-2.5 bg-indigo-700 text-white rounded-lg text-xs font-bold hover:bg-indigo-800 transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Process Return to Main Yard & Print Note
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
            Only items with positive branch balance are eligible for return to Central Main Yard.
          </p>

          <div className="flex-1 overflow-y-auto max-h-[360px] space-y-2 pr-1">
            {availableStockItems.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No positive stock balance available in this branch.
              </div>
            ) : (
              availableStockItems.map(({ item, availableBalance }) => {
                const isSelected = item.id === activeItemId;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedItemId(item.id);
                      setReturnQty('');
                    }}
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
                      <div className="text-[10px] text-slate-400">Available</div>
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
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Return Note #</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Source Branch</th>
                <th className="py-2.5 px-3">Item Details</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">Condition</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No branch stock return records logged yet.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => {
                  const itm = items.find((i) => i.id === ret.itemId);

                  return (
                    <tr key={ret.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                        {ret.branchReturnNumber}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                        {formatDateTime(ret.returnDate)}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {ret.siteName || ret.fromSiteName || 'Site Branch'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{itm?.itemName || 'Item'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{itm?.itemCode || 'CODE'}</div>
                      </td>
                      <td className="py-2.5 px-3 font-black text-indigo-800">
                        {formatNumber(ret.quantity)} {itm?.unit || 'Nos'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ret.condition === 'Good / Restock'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {ret.condition}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate text-slate-600">
                        {ret.reason}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReturnForPrint(ret)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200"
                            title="Print Transfer Return Note"
                          >
                            <Printer className="w-3 h-3" />
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
          notes={`Return Condition: ${selectedReturnForPrint.condition} | Reason: ${selectedReturnForPrint.reason}`}
          items={[
            {
              itemCode: items.find((i) => i.id === selectedReturnForPrint.itemId)?.itemCode || 'CODE',
              itemName: items.find((i) => i.id === selectedReturnForPrint.itemId)?.itemName || 'Material Item',
              category: items.find((i) => i.id === selectedReturnForPrint.itemId)?.category || 'Telecom Equipment',
              quantity: selectedReturnForPrint.quantity,
              unit: items.find((i) => i.id === selectedReturnForPrint.itemId)?.unit || 'Nos',
            },
          ]}
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
    </div>
  );
};
