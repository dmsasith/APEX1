import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  Download,
  Mail,
  Building2,
  Phone,
  MapPin,
  Calendar,
  Truck,
  RotateCcw,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { SupplierReturn } from '../../types';
import { useStock } from '../../context/StockContext';
import { formatNumber, formatDate, formatDateTime } from '../../utils/exportUtils';
import { exportElementToPdf, printHtmlElement } from '../../utils/printUtils';

interface DebitNoteModalProps {
  supplierReturn: SupplierReturn | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DebitNoteModal: React.FC<DebitNoteModalProps> = ({
  supplierReturn,
  isOpen,
  onClose,
}) => {
  const { config, activeTemplate } = useStock();
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !supplierReturn) return null;

  const handlePrint = () => {
    if (!printAreaRef.current) return;
    printHtmlElement(printAreaRef.current, `Debit_Note_${supplierReturn.rtvNumber}`);
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsExporting(true);
    try {
      await exportElementToPdf(printAreaRef.current, `Debit_Note_${supplierReturn.rtvNumber}`);
    } catch (e) {
      console.error('PDF generation error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  // Open default mail client with prefilled debit note details
  const handleSendEmail = () => {
    const to = supplierReturn.supplierEmail || '';
    const subject = encodeURIComponent(
      `DEBIT NOTE & RETURN TO VENDOR: ${supplierReturn.rtvNumber} - ${config.companyName || 'Comtec Systems'}`
    );
    const bodyLines = [
      `Dear ${supplierReturn.supplierContactPerson || supplierReturn.supplierName},`,
      '',
      `Please find our official Return to Vendor (RTV) & Debit Note details below:`,
      '',
      `Document No: ${supplierReturn.rtvNumber}`,
      `Date: ${formatDate(supplierReturn.returnDate)}`,
      `Supplier: ${supplierReturn.supplierName}`,
      `Original PO Ref: ${supplierReturn.poReference || 'N/A'}`,
      `Settlement Type: ${supplierReturn.settlementType}`,
      `Total Debit Claim: ${config.currencySymbol} ${supplierReturn.grandTotal.toLocaleString()}`,
      '',
      '--- RETURNED ITEMS ---',
      ...supplierReturn.items.map(
        (it, idx) =>
          `${idx + 1}. [${it.itemCode}] ${it.itemName} - ${it.quantity} ${it.unit} @ ${config.currencySymbol} ${it.unitCost} = ${config.currencySymbol} ${it.totalCost.toLocaleString()} (Reason: ${it.reasonCategory}${it.defectRemarks ? ' - ' + it.defectRemarks : ''})`
      ),
      '',
      supplierReturn.transporterName ? `Transporter: ${supplierReturn.transporterName} (Vehicle: ${supplierReturn.vehicleNo || 'N/A'}, Gate Pass: ${supplierReturn.gatePassNo || 'N/A'})` : '',
      supplierReturn.notes ? `Notes: ${supplierReturn.notes}` : '',
      '',
      'Please acknowledge receipt and issue credit note or dispatch replacement items accordingly.',
      '',
      `Sincerely,`,
      `${supplierReturn.preparedBy || 'Central Logistics & Procurement Dept'}`,
      `${config.companyName || 'Comtec Systems'}`,
      `${config.phone || ''} | ${config.email || ''}`
    ].filter(Boolean);

    const body = encodeURIComponent(bodyLines.join('\n'));
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  const getStatusBadge = () => {
    switch (supplierReturn.status) {
      case 'Draft':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-300">DRAFT RETURN</span>;
      case 'Dispatched to Supplier':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-100 text-blue-800 border border-blue-300">DISPATCHED TO SUPPLIER</span>;
      case 'Debit Note Settled':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">DEBIT NOTE SETTLED (CREDITED)</span>;
      case 'Replacement Stock Received':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-teal-100 text-teal-800 border border-teal-300">REPLACEMENT RECEIVED</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-rose-100 text-rose-800 border border-rose-300">CANCELLED</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold tracking-tight">Return to Vendor (RTV) & Official Debit Note</h2>
              <p className="text-[11px] text-slate-300 font-medium">Voucher #{supplierReturn.rtvNumber} · {supplierReturn.supplierName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendEmail}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
              title="Open email draft with supplier"
            >
              <Mail className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Email Supplier</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isExporting ? 'Generating...' : 'PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center">
          <div
            ref={printAreaRef}
            className="bg-white border border-slate-300 shadow-md p-6 sm:p-10 max-w-3xl w-full text-slate-900 font-sans print:shadow-none print:border-none print:p-0"
            style={{ minHeight: '1000px' }}
          >
            {/* Letterhead Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950">
                    {activeTemplate?.companyName || config.companyName || 'COMTEC SYSTEMS (PVT) LTD.'}
                  </h1>
                  <p className="text-[11px] text-slate-600 leading-tight mt-1 max-w-xl">
                    {activeTemplate?.subtitle ||
                      'Civil Contractors, Telecommunication Engineers, Transport Services, Heavy Equipment & Logistics Operations'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {activeTemplate?.address || config.address || 'Central Logistics Yard & Operations Hub'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 mt-0.5">
                    <span><strong>Tel:</strong> {activeTemplate?.tel || config.phone || '+94 11 2549590'}</span>
                    <span><strong>Email:</strong> {activeTemplate?.email || config.email || 'apexdevinfo@gmail.com'}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="inline-block bg-slate-950 text-white font-black text-sm uppercase px-3 py-1.5 rounded tracking-wider">
                    DEBIT NOTE
                  </div>
                  <div className="text-[11px] font-bold text-amber-700 mt-1 uppercase">
                    RETURN TO VENDOR (RTV)
                  </div>
                  <div className="mt-2 text-right">
                    {getStatusBadge()}
                  </div>
                </div>
              </div>
            </div>

            {/* Document Info & Supplier Details Box */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
              {/* Supplier Info */}
              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/60">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                  DEBIT TO (SUPPLIER / VENDOR)
                </div>
                <div className="font-bold text-slate-900 text-sm">{supplierReturn.supplierName}</div>
                {supplierReturn.supplierContactPerson && (
                  <div className="text-slate-600 mt-0.5">Attn: {supplierReturn.supplierContactPerson}</div>
                )}
                {supplierReturn.supplierAddress && (
                  <div className="text-slate-500 mt-0.5">{supplierReturn.supplierAddress}</div>
                )}
                <div className="text-slate-500 mt-1 flex flex-wrap gap-2 text-[11px]">
                  {supplierReturn.supplierPhone && <span>Tel: {supplierReturn.supplierPhone}</span>}
                  {supplierReturn.supplierEmail && <span>Email: {supplierReturn.supplierEmail}</span>}
                  {supplierReturn.supplierTaxNo && <span>Tax / VAT Reg: {supplierReturn.supplierTaxNo}</span>}
                </div>
              </div>

              {/* RTV Meta Details */}
              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/60 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Debit Note / RTV Ref:</span>
                  <span className="font-mono font-bold text-slate-900">{supplierReturn.rtvNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Return Date:</span>
                  <span className="font-bold text-slate-800">{formatDate(supplierReturn.returnDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Origin Location:</span>
                  <span className="font-semibold text-slate-800">
                    {supplierReturn.locationType === 'Main Stock' ? 'Main Central Warehouse' : supplierReturn.siteName || 'Site Yard'}
                  </span>
                </div>
                {supplierReturn.poReference && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Against Purchase Order:</span>
                    <span className="font-mono font-bold text-slate-800">{supplierReturn.poReference}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Settlement Claim:</span>
                  <span className="font-semibold text-blue-800">{supplierReturn.settlementType}</span>
                </div>
                {supplierReturn.expectedSettlementDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Expected Settlement:</span>
                    <span className="text-slate-700">{formatDate(supplierReturn.expectedSettlementDate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 font-semibold text-center w-10">#</th>
                    <th className="py-2.5 px-3 font-semibold w-24">Item Code</th>
                    <th className="py-2.5 px-3 font-semibold">Description & Defect Reason</th>
                    <th className="py-2.5 px-3 font-semibold text-right w-20">Quantity</th>
                    <th className="py-2.5 px-3 font-semibold text-right w-24">Rate ({config.currencySymbol})</th>
                    <th className="py-2.5 px-3 font-semibold text-right w-28">Debit Amount ({config.currencySymbol})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 border-x border-b border-slate-200">
                  {supplierReturn.items.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 text-[11px]">{row.itemCode}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{row.itemName}</div>
                        <div className="text-[11px] text-amber-800 font-medium mt-0.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Reason: <strong>{row.reasonCategory}</strong></span>
                        </div>
                        {row.defectRemarks && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">Remarks: {row.defectRemarks}</div>
                        )}
                        {row.batchNo && (
                          <div className="text-[10px] text-slate-400">Batch / Heat No: {row.batchNo}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {row.quantity} <span className="text-[10px] font-normal text-slate-500">{row.unit}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatNumber(row.unitCost)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatNumber(row.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div className="flex justify-end mt-3">
                <div className="w-72 border border-slate-200 rounded-lg p-3 bg-slate-50/70 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">{config.currencySymbol} {formatNumber(supplierReturn.subtotal)}</span>
                  </div>
                  {supplierReturn.taxAmount ? (
                    <div className="flex justify-between text-slate-600">
                      <span>VAT / Tax Claim:</span>
                      <span className="font-mono">{config.currencySymbol} {formatNumber(supplierReturn.taxAmount)}</span>
                    </div>
                  ) : null}
                  <div className="border-t border-slate-300 pt-1.5 flex justify-between font-bold text-slate-900 text-sm">
                    <span>Total Debit Claim:</span>
                    <span className="font-mono text-emerald-800">{config.currencySymbol} {formatNumber(supplierReturn.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transporter / Gate Pass Outward Info */}
            {(supplierReturn.gatePassNo || supplierReturn.transporterName || supplierReturn.vehicleNo || supplierReturn.notes) && (
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 mb-6 text-xs">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Outward Logistics & Dispatch Details</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 mt-1">
                  {supplierReturn.gatePassNo && (
                    <div><span className="text-slate-500">Gate Pass:</span> <strong>{supplierReturn.gatePassNo}</strong></div>
                  )}
                  {supplierReturn.transporterName && (
                    <div><span className="text-slate-500">Carrier:</span> <strong>{supplierReturn.transporterName}</strong></div>
                  )}
                  {supplierReturn.vehicleNo && (
                    <div><span className="text-slate-500">Vehicle No:</span> <strong>{supplierReturn.vehicleNo}</strong></div>
                  )}
                  {supplierReturn.driverContact && (
                    <div><span className="text-slate-500">Driver Phone:</span> {supplierReturn.driverContact}</div>
                  )}
                </div>
                {supplierReturn.notes && (
                  <div className="mt-2 text-slate-600 pt-1 border-t border-slate-200 text-[11px]">
                    <strong>Instructions / Remarks:</strong> {supplierReturn.notes}
                  </div>
                )}
              </div>
            )}

            {/* Settlement Status Record (if settled) */}
            {(supplierReturn.settledDate || supplierReturn.settlementRef) && (
              <div className="border border-emerald-200 bg-emerald-50/60 rounded-lg p-3 mb-6 text-xs text-emerald-900">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Settlement Fulfilled ({supplierReturn.status})</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5 text-[11px]">
                  <div>Settled Date: <strong>{formatDate(supplierReturn.settledDate || '')}</strong></div>
                  <div>Settlement Ref / Credit Note: <strong>{supplierReturn.settlementRef || 'N/A'}</strong></div>
                  <div>Settled By: <strong>{supplierReturn.settledBy || 'Finance Dept'}</strong></div>
                </div>
                {supplierReturn.settlementNotes && (
                  <div className="text-[10px] text-emerald-700 mt-1 italic">Remarks: {supplierReturn.settlementNotes}</div>
                )}
              </div>
            )}

            {/* Official Signature Blocks */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-300 mt-8 text-center text-xs">
              <div>
                <div className="h-12 border-b border-dashed border-slate-400 mb-1 flex items-end justify-center pb-1 text-slate-800 font-semibold text-[11px]">
                  {supplierReturn.preparedBy || 'Storekeeper'}
                </div>
                <div className="font-bold text-slate-800">Prepared By</div>
                <div className="text-[10px] text-slate-500">Storekeeper / Yard In-Charge</div>
              </div>

              <div>
                <div className="h-12 border-b border-dashed border-slate-400 mb-1 flex items-end justify-center pb-1 text-slate-800 font-semibold text-[11px]">
                  {supplierReturn.approvedBy || activeTemplate?.approvedBy || 'Operations Head'}
                </div>
                <div className="font-bold text-slate-800">Authorized By</div>
                <div className="text-[10px] text-slate-500">Procurement / Logistics Manager</div>
              </div>

              <div>
                <div className="h-12 border-b border-dashed border-slate-400 mb-1 flex items-end justify-center pb-1 text-slate-400 text-[10px] italic">
                  Signature & Company Rubber Stamp
                </div>
                <div className="font-bold text-slate-800">Supplier Acknowledgment</div>
                <div className="text-[10px] text-slate-500">Receiver Name, Date & Seal</div>
              </div>
            </div>

            {/* Footer Disclaimer */}
            <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
              This Debit Note serves as an official accounting claim against delivered stock. Goods returned remain the property of the vendor pending credit note issuance or authorized replacement. Generated by {config.systemName || 'Apex Stock Management System'}.
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500">
            Status: <strong className="text-slate-800">{supplierReturn.status}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Debit Note</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
