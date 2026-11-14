import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Package,
  RotateCcw,
} from 'lucide-react';
import { SupplierReturn, SettlementType } from '../../types';
import { useStock } from '../../context/StockContext';
import { formatNumber, formatDate } from '../../utils/exportUtils';

interface SettleReturnModalProps {
  supplierReturn: SupplierReturn | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const SettleReturnModal: React.FC<SettleReturnModalProps> = ({
  supplierReturn,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { config, settleSupplierReturn, currentUser, supplierReturns } = useStock();

  const [settlementType, setSettlementType] = useState<SettlementType>(
    supplierReturn?.settlementType || 'Debit Note / Refund Credit'
  );
  const settledCount = (supplierReturns || []).filter((r) => Boolean(r.settlementRef)).length;
  const [settlementRef, setSettlementRef] = useState(
    `CN-${new Date().getFullYear()}-${String(settledCount + 1).padStart(4, '0')}`
  );
  const [settlementNotes, setSettlementNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !supplierReturn) return null;

  const handleSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementRef.trim()) {
      setErrorMessage('Please enter the Supplier Credit Note Reference or Replacement Receipt Number.');
      return;
    }

    const res = settleSupplierReturn(supplierReturn.id, {
      settledBy: currentUser?.fullName || 'Central Finance & Procurement Admin',
      settlementRef: settlementRef.trim(),
      settlementType,
      settlementNotes: settlementNotes.trim() || undefined,
    });

    if (res.success) {
      onSuccess(res.message);
      onClose();
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold">Fulfill & Settle Supplier Return</h2>
              <p className="text-[11px] text-slate-300 font-medium">RTV #{supplierReturn.rtvNumber} · {supplierReturn.supplierName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSettle} className="p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Return Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Supplier:</span>
              <strong className="text-slate-800">{supplierReturn.supplierName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Return Items:</span>
              <span className="font-semibold text-slate-700">
                {supplierReturn.items.reduce((s, i) => s + i.quantity, 0)} units ({supplierReturn.items.length} line items)
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
              <span className="text-slate-700">Total Debit Claim:</span>
              <span className="font-mono text-emerald-800 text-sm">
                {config.currencySymbol} {formatNumber(supplierReturn.grandTotal)}
              </span>
            </div>
          </div>

          {/* Settlement Form Fields */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Settlement Mode / Settlement Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettlementType('Debit Note / Refund Credit')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  settlementType === 'Debit Note / Refund Credit'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Debit Note / Credit</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Vendor issued credit note or refunded invoice value
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSettlementType('Replacement Material')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  settlementType === 'Replacement Material'
                    ? 'border-teal-600 bg-teal-50/80 text-teal-950 ring-1 ring-teal-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Package className="w-4 h-4 text-teal-600" />
                  <span>Replacement Stock</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  New defect-free stock received and restocked into inventory
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {settlementType === 'Debit Note / Refund Credit'
                ? 'Vendor Credit Note / Refund Voucher Number'
                : 'Replacement Delivery Note / GRN Reference'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={settlementRef}
              onChange={(e) => setSettlementRef(e.target.value)}
              placeholder="e.g. CN-VENDOR-9821 or GRN-RPL-104"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Settlement Remarks / Documentation Notes
            </label>
            <textarea
              rows={3}
              value={settlementNotes}
              onChange={(e) => setSettlementNotes(e.target.value)}
              placeholder="Enter details on credit adjustment, invoice deduction, or replacement inspection clearance..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Mark Settled</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
