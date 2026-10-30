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
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatNumber, exportToCsv, formatDateTime } from '../../utils/exportUtils';
import { StockBalanceCell } from '../common/LowStockIndicator';
import { StockTransferRequest } from '../../types';

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
  } = useStock();

  const branchSites = activeSites.filter((s) => !s.isMainWarehouse);
  const defaultSiteId =
    currentUser.siteId !== 'all' ? currentUser.siteId : (branchSites[0]?.id || activeSites[0]?.id || '');

  const [selectedSiteId, setSelectedSiteId] = useState<string>(defaultSiteId);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockScopeFilter, setStockScopeFilter] = useState<'allocated' | 'all' | 'low-stock'>('allocated');

  // Receiving state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [acceptingShipment, setAcceptingShipment] = useState<StockTransferRequest | null>(null);
  const [receivedItems, setReceivedItems] = useState<Array<{ itemId: string; receivedQty: number }>>([]);
  const [receivingNotes, setReceivingNotes] = useState('');

  const selectedSite = activeSites.find((s) => s.id === selectedSiteId) || sites.find((s) => s.id === selectedSiteId);

  // Incoming shipments for selected site branch in transit
  const incomingShipments = stockRequests.filter(
    (req) => req.siteId === selectedSiteId && req.status === 'Approved / In-Transit'
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Branch Custody</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Local Yard Balances</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Site Branch Inventories
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Live inventory ledger per site branch: tracking receipts from Main Warehouse transfers, returns from field crews, and daily dispatches.
          </p>
        </div>

        <button
          onClick={exportSiteInventoryCsv}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Export Site Sheet (CSV)</span>
        </button>
      </div>

      {/* Site Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {branchSites.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSiteId(s.id)}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-colors flex items-center gap-2 ${
              selectedSiteId === s.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{s.name}</span>
          </button>
        ))}
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
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
          <div>
            <span className="font-bold text-slate-900 text-sm">{selectedSite.name}</span>
            <div className="mt-0.5 text-slate-600">Location: {selectedSite.location} · Supervisor: <strong className="text-slate-800">{selectedSite.supervisorName}</strong></div>
          </div>
          <div className="font-mono text-slate-500">
            Contact: {selectedSite.contactNumber}
          </div>
        </div>
      )}

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
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Inspect physical count and adjust received quantity if damaged"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Count / Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectReceive(req)}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
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
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                stockScopeFilter === 'allocated'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Site Allocated ({siteAllocatedCount})</span>
            </button>
            <button
              onClick={() => setStockScopeFilter('low-stock')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
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
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search code or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
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
              <span>from full master catalog (500 items)</span>
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
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
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
                className="p-1 text-slate-400 hover:text-slate-700"
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
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEditReceive}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Confirm & Restock Site Yard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
