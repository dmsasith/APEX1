import React, { useState, useMemo } from 'react';
import {
  X,
  RotateCcw,
  Plus,
  Trash2,
  AlertTriangle,
  Building2,
  Calendar,
  Truck,
  CheckCircle2,
  DollarSign,
  Search,
  Package,
} from 'lucide-react';
import {
  SupplierReturn,
  SupplierReturnItem,
  ReturnReasonCategory,
  SettlementType,
  Supplier,
  Item,
} from '../../types';
import { useStock } from '../../context/StockContext';
import { formatNumber } from '../../utils/exportUtils';
import { SearchableItemSelect } from '../common/SearchableItemSelect';

interface SupplierReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingReturn?: SupplierReturn | null;
  onSuccess: (msg: string) => void;
}

const REASON_CATEGORIES: ReturnReasonCategory[] = [
  'Sub-standard / Quality Failure',
  'Damaged Goods / In Transit',
  'Incorrect Specification / Wrong Grade',
  'Expired / Hardened Material',
  'Excess Delivered',
  'Defective / Failed Lab Test',
  'Other',
];

export const SupplierReturnModal: React.FC<SupplierReturnModalProps> = ({
  isOpen,
  onClose,
  editingReturn,
  onSuccess,
}) => {
  const {
    config,
    activeSuppliers,
    activeSites,
    activeItems,
    items,
    activePurchaseOrders,
    supplierReturns,
    getMainWarehouseStock,
    getSiteItemStock,
    addSupplierReturn,
    updateSupplierReturn,
    currentUser,
  } = useStock();

  // Form states
  const [selectedSupplierId, setSelectedSupplierId] = useState(
    editingReturn?.supplierId || activeSuppliers[0]?.id || ''
  );
  const [locationType, setLocationType] = useState<'Main Stock' | 'Site Stock'>(
    editingReturn?.locationType || 'Main Stock'
  );
  const [selectedSiteId, setSelectedSiteId] = useState<string>(
    editingReturn?.siteId || activeSites[0]?.id || ''
  );
  const [poReference, setPoReference] = useState(editingReturn?.poReference || '');
  const [returnDate, setReturnDate] = useState(
    editingReturn?.returnDate || new Date().toISOString().split('T')[0]
  );
  const [expectedSettlementDate, setExpectedSettlementDate] = useState(
    editingReturn?.expectedSettlementDate || ''
  );
  const [settlementType, setSettlementType] = useState<SettlementType>(
    editingReturn?.settlementType || 'Debit Note / Refund Credit'
  );

  // Items rows
  const [returnItems, setReturnItems] = useState<
    Array<{
      itemId: string;
      itemCode: string;
      itemName: string;
      unit: string;
      quantity: number;
      unitCost: number;
      reasonCategory: ReturnReasonCategory;
      defectRemarks: string;
      batchNo: string;
    }>
  >(() => {
    if (editingReturn && editingReturn.items?.length > 0) {
      return editingReturn.items.map((i) => ({
        itemId: i.itemId,
        itemCode: i.itemCode,
        itemName: i.itemName,
        unit: i.unit,
        quantity: i.quantity,
        unitCost: i.unitCost,
        reasonCategory: i.reasonCategory,
        defectRemarks: i.defectRemarks || '',
        batchNo: i.batchNo || '',
      }));
    }
    return [];
  });

  // Outward logistics
  const [gatePassNo, setGatePassNo] = useState(
    editingReturn?.gatePassNo ||
      `GP-${new Date().getFullYear()}-${String((supplierReturns?.length || 0) + 1).padStart(4, '0')}`
  );
  const [transporterName, setTransporterName] = useState(editingReturn?.transporterName || '');
  const [vehicleNo, setVehicleNo] = useState(editingReturn?.vehicleNo || '');
  const [driverContact, setDriverContact] = useState(editingReturn?.driverContact || '');
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [notes, setNotes] = useState(editingReturn?.notes || '');
  const [dispatchNow, setDispatchNow] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const currentSupplier: Supplier | undefined = activeSuppliers.find((s) => s.id === selectedSupplierId);

  // Available stock helper for current location
  const getAvailableStockForItem = (itemId: string): number => {
    if (locationType === 'Main Stock') {
      return getMainWarehouseStock(itemId).availableBalance;
    } else {
      return getSiteItemStock(selectedSiteId, itemId).availableBalance;
    }
  };

  // Add line item
  const handleAddItem = (item: Item) => {
    // Check if already in list
    if (returnItems.some((r) => r.itemId === item.id)) {
      setErrorMessage(`Item "${item.itemName}" is already in the return list.`);
      return;
    }
    setErrorMessage('');
    const available = getAvailableStockForItem(item.id);
    const initialQty = available > 0 ? 1 : 1;

    setReturnItems((prev) => [
      ...prev,
      {
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.itemName,
        unit: item.unit,
        quantity: initialQty,
        unitCost: item.unitPrice || 0,
        reasonCategory: 'Sub-standard / Quality Failure',
        defectRemarks: '',
        batchNo: '',
      },
    ]);
  };

  const handleUpdateItem = (index: number, updates: Partial<(typeof returnItems)[0]>) => {
    setReturnItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setReturnItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = returnItems.reduce((sum, it) => sum + it.quantity * it.unitCost, 0);
  const taxAmount = taxPercent > 0 ? (subtotal * taxPercent) / 100 : 0;
  const grandTotal = subtotal + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedSupplierId || !currentSupplier) {
      setErrorMessage('Please select a valid supplier.');
      return;
    }

    if (returnItems.length === 0) {
      setErrorMessage('Please add at least one item to return to the supplier.');
      return;
    }

    // Validate quantities and stock availability
    for (const it of returnItems) {
      if (it.quantity <= 0) {
        setErrorMessage(`Quantity for item "${it.itemName}" must be greater than zero.`);
        return;
      }
      const available = getAvailableStockForItem(it.itemId);
      if (it.quantity > available) {
        setErrorMessage(
          `Cannot return ${it.quantity} ${it.unit} of "${it.itemName}". Available stock in ${
            locationType === 'Main Stock' ? 'Main Warehouse' : 'Selected Site'
          } is only ${available} ${it.unit}.`
        );
        return;
      }
    }

    const formattedItems: SupplierReturnItem[] = returnItems.map((r) => ({
      itemId: r.itemId,
      itemCode: r.itemCode,
      itemName: r.itemName,
      unit: r.unit,
      quantity: Number(r.quantity),
      unitCost: Number(r.unitCost),
      totalCost: Number(r.quantity) * Number(r.unitCost),
      reasonCategory: r.reasonCategory,
      defectRemarks: r.defectRemarks?.trim() || undefined,
      batchNo: r.batchNo?.trim() || undefined,
    }));

    const siteObj = locationType === 'Site Stock' ? activeSites.find((s) => s.id === selectedSiteId) : undefined;

    if (editingReturn) {
      updateSupplierReturn(editingReturn.id, {
        supplierId: currentSupplier.id,
        supplierName: currentSupplier.name,
        supplierContactPerson: currentSupplier.contactPerson,
        supplierEmail: currentSupplier.email,
        supplierPhone: currentSupplier.phone,
        supplierAddress: currentSupplier.address,
        supplierTaxNo: currentSupplier.businessRegNo,
        locationType,
        siteId: locationType === 'Site Stock' ? selectedSiteId : undefined,
        siteName: siteObj?.name,
        poReference: poReference.trim() || undefined,
        returnDate,
        expectedSettlementDate: expectedSettlementDate || undefined,
        settlementType,
        items: formattedItems,
        subtotal,
        taxAmount,
        grandTotal,
        gatePassNo: gatePassNo.trim() || undefined,
        transporterName: transporterName.trim() || undefined,
        vehicleNo: vehicleNo.trim() || undefined,
        driverContact: driverContact.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onSuccess(`Supplier Return #${editingReturn.rtvNumber} updated successfully!`);
    } else {
      const initialStatus = dispatchNow ? 'Dispatched to Supplier' : 'Draft';

      const newReturn = addSupplierReturn({
        rtvNumber: '',
        supplierId: currentSupplier.id,
        supplierName: currentSupplier.name,
        supplierContactPerson: currentSupplier.contactPerson,
        supplierEmail: currentSupplier.email,
        supplierPhone: currentSupplier.phone,
        supplierAddress: currentSupplier.address,
        supplierTaxNo: currentSupplier.businessRegNo,
        locationType,
        siteId: locationType === 'Site Stock' ? selectedSiteId : undefined,
        siteName: siteObj?.name,
        poReference: poReference.trim() || undefined,
        returnDate,
        expectedSettlementDate: expectedSettlementDate || undefined,
        status: initialStatus,
        settlementType,
        items: formattedItems,
        subtotal,
        taxAmount,
        grandTotal,
        gatePassNo: gatePassNo.trim() || undefined,
        transporterName: transporterName.trim() || undefined,
        vehicleNo: vehicleNo.trim() || undefined,
        driverContact: driverContact.trim() || undefined,
        notes: notes.trim() || undefined,
        preparedBy: currentUser?.fullName || 'Super Admin Central',
        dispatchedDate: dispatchNow ? new Date().toISOString() : undefined,
        dispatchedBy: dispatchNow ? currentUser?.fullName || 'Central Storekeeper' : undefined,
      });

      onSuccess(
        `Supplier Return #${newReturn.rtvNumber} created (${
          dispatchNow ? 'Dispatched - stock deducted' : 'Saved as Draft'
        })!`
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl xl:max-w-6xl w-full max-h-[96vh] flex flex-col border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {editingReturn ? `Edit Supplier Return #${editingReturn.rtvNumber}` : 'Create Return to Supplier (RTV & Debit Note)'}
              </h2>
              <p className="text-xs text-slate-400">
                Initiate vendor return for defective, damaged, or excess goods & claim debit note credit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Supplier & Location Information */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
            <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>1. Supplier & Origin Stock Yard</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Supplier Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Supplier <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">-- Choose Supplier --</option>
                  {activeSuppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.contactPerson ? `(${s.contactPerson})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Origin Location Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stock Origin Location <span className="text-rose-500">*</span>
                </label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value as 'Main Stock' | 'Site Stock')}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Main Stock">Main Central Warehouse (Depot)</option>
                  <option value="Site Stock">Branch Site Yard</option>
                </select>
              </div>

              {/* Branch Site Selector if location is Site Stock */}
              {locationType === 'Site Stock' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Branch Site <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedSiteId}
                    onChange={(e) => setSelectedSiteId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {activeSites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* PO Reference */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Original PO Reference
                </label>
                <input
                  type="text"
                  value={poReference}
                  onChange={(e) => setPoReference(e.target.value)}
                  placeholder="e.g. PO-2026-4821"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Supplier Contact Preview */}
            {currentSupplier && (
              <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 flex flex-wrap gap-4">
                <span><strong>Contact:</strong> {currentSupplier.contactPerson || 'N/A'}</span>
                <span><strong>Phone:</strong> {currentSupplier.phone || 'N/A'}</span>
                <span><strong>Email:</strong> {currentSupplier.email || 'N/A'}</span>
                {currentSupplier.businessRegNo && (
                  <span><strong>Tax No:</strong> {currentSupplier.businessRegNo}</span>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Dates & Settlement Claim Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Return Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Settlement Claim Preference <span className="text-rose-500">*</span>
              </label>
              <select
                value={settlementType}
                onChange={(e) => setSettlementType(e.target.value as SettlementType)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Debit Note / Refund Credit">Debit Note / Account Credit Refund</option>
                <option value="Replacement Material">Replacement Stock / Free Replacement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected Settlement Date
              </label>
              <input
                type="date"
                value={expectedSettlementDate}
                onChange={(e) => setExpectedSettlementDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Section 3: Line Items to Return */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-600" />
                <span>2. Items Being Returned to Vendor ({returnItems.length})</span>
              </h3>
              <div className="w-full sm:w-80 md:w-96 min-w-[220px]">
                <SearchableItemSelect
                  selectedItemId=""
                  onSelectItem={(item: Item) => handleAddItem(item)}
                  siteId={locationType === 'Main Stock' ? undefined : selectedSiteId}
                  placeholder="+ Search & Add Item to Return..."
                />
              </div>
            </div>

            {returnItems.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-xs">
                <p className="font-semibold text-slate-600">No items added to return yet.</p>
                <p className="mt-1">Use the search box above to choose catalog items to return to the supplier.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3 text-center">Avail. Stock</th>
                        <th className="py-2.5 px-3 w-28">Return Qty</th>
                        <th className="py-2.5 px-3 w-28">Unit Rate ({config.currencySymbol})</th>
                        <th className="py-2.5 px-3 w-44">Reason Category</th>
                        <th className="py-2.5 px-3">Defect Remarks & Batch #</th>
                        <th className="py-2.5 px-3 text-right">Debit Total</th>
                        <th className="py-2.5 px-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {returnItems.map((row, idx) => {
                        const available = getAvailableStockForItem(row.itemId);
                        const isOverStock = row.quantity > available;
                        const lineTotal = row.quantity * row.unitCost;

                        return (
                          <tr key={row.itemId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{row.itemName}</div>
                              <div className="text-[11px] font-mono text-slate-500">{row.itemCode} · {row.unit}</div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  available > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {available} {row.unit}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min={1}
                                max={available}
                                value={row.quantity}
                                onChange={(e) =>
                                  handleUpdateItem(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })
                                }
                                className={`w-full px-2 py-1.5 border rounded text-xs font-bold ${
                                  isOverStock
                                    ? 'border-rose-500 bg-rose-50 text-rose-900'
                                    : 'border-slate-300 focus:border-emerald-500'
                                }`}
                              />
                              {isOverStock && (
                                <span className="text-[10px] text-rose-600 block mt-0.5">Exceeds available stock!</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min={0}
                                step="any"
                                value={row.unitCost}
                                onChange={(e) =>
                                  handleUpdateItem(idx, { unitCost: Math.max(0, Number(e.target.value) || 0) })
                                }
                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono text-right focus:border-emerald-500"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <select
                                value={row.reasonCategory}
                                onChange={(e) =>
                                  handleUpdateItem(idx, {
                                    reasonCategory: e.target.value as ReturnReasonCategory,
                                  })
                                }
                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-[11px] font-semibold bg-white focus:border-emerald-500"
                              >
                                {REASON_CATEGORIES.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2.5 px-3 space-y-1">
                              <input
                                type="text"
                                placeholder="Defect details..."
                                value={row.defectRemarks}
                                onChange={(e) => handleUpdateItem(idx, { defectRemarks: e.target.value })}
                                className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] placeholder:text-slate-400"
                              />
                              <input
                                type="text"
                                placeholder="Batch / Heat #"
                                value={row.batchNo}
                                onChange={(e) => handleUpdateItem(idx, { batchNo: e.target.value })}
                                className="w-full px-2 py-1 border border-slate-200 rounded text-[10px] font-mono placeholder:text-slate-400"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {config.currencySymbol} {formatNumber(lineTotal)}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                title="Remove line"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal & Totals Footer */}
                <div className="bg-slate-50 border-t border-slate-200 p-3 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Tax / VAT % (optional):</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(Math.max(0, Number(e.target.value) || 0))}
                      className="w-16 px-2 py-1 border border-slate-300 rounded text-center text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-slate-500">Subtotal: </span>
                      <strong className="font-mono text-slate-800">
                        {config.currencySymbol} {formatNumber(subtotal)}
                      </strong>
                    </div>
                    {taxAmount > 0 && (
                      <div>
                        <span className="text-slate-500">Tax: </span>
                        <strong className="font-mono text-slate-800">
                          {config.currencySymbol} {formatNumber(taxAmount)}
                        </strong>
                      </div>
                    )}
                    <div className="text-sm font-black text-emerald-800 border-l border-slate-300 pl-3">
                      Total Debit Claim: {config.currencySymbol} {formatNumber(grandTotal)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Outward Logistics & Gate Pass Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
            <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>3. Outward Logistics & Gate Pass Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gate Pass Ref</label>
                <input
                  type="text"
                  value={gatePassNo}
                  onChange={(e) => setGatePassNo(e.target.value)}
                  placeholder="e.g. GP-2026-0042"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transporter / Carrier</label>
                <input
                  type="text"
                  value={transporterName}
                  onChange={(e) => setTransporterName(e.target.value)}
                  placeholder="e.g. Comtec Transport / Vendor Pickup"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle No</label>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  placeholder="e.g. WP-DA-4821"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Driver Contact</label>
                <input
                  type="text"
                  value={driverContact}
                  onChange={(e) => setDriverContact(e.target.value)}
                  placeholder="+94 77 000 0000"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dispatch Instructions / Special Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Return instructions, packing notes, supplier credit authorization..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Quick Dispatch Option for new returns */}
            {!editingReturn && (
              <label className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={dispatchNow}
                  onChange={(e) => setDispatchNow(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-emerald-900">
                  Dispatch to supplier immediately (Deducts returned items from available inventory right away)
                </span>
              </label>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingReturn ? 'Save Changes' : dispatchNow ? 'Create & Dispatch Return' : 'Save as Draft Return'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
