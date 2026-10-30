import React, { useState } from 'react';
import {
  FileText,
  Search,
  Download,
  Printer,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  Send,
  RotateCcw,
  Boxes,
  Trash2,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatDateTime, exportToCsv } from '../../utils/exportUtils';
import { AuditAction } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';

export const AuditTrailReportsView: React.FC = () => {
  const { auditLogs, sites, config, clearAuditLogs, deleteAuditLog } = useStock();

  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterSite, setFilterSite] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Confirmation modal state
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesAction = filterAction === 'all' || log.action.includes(filterAction);
    const matchesSite = filterSite === 'all' || log.siteName.toLowerCase().includes(filterSite.toLowerCase());
    const matchesSearch =
      log.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.itemCode && log.itemCode.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesAction && matchesSite && matchesSearch;
  });

  const exportAuditCsv = () => {
    const rows = filteredLogs.map((log) => ({
      Timestamp: formatDateTime(log.timestamp),
      'Action Type': log.action,
      'Reference No': log.referenceNo,
      'Site / Location': log.siteName,
      'Performed By': log.performedBy,
      'Item Code': log.itemCode || '—',
      'Quantity Delta': log.quantityChanged !== undefined ? log.quantityChanged : '—',
      Details: log.details,
    }));
    exportToCsv('System_Audit_Trail_Report', rows);
  };

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'MAIN_STOCK_RECEIPT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Main Stock Receipt</span>;
      case 'SITE_REQUEST_CREATED':
      case 'SITE_REQUEST_APPROVED':
      case 'SITE_REQUEST_ACCEPTED':
      case 'SITE_REQUEST_REJECTED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Branch Request</span>;
      case 'TEAM_ISSUE_DISPATCHED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Team Issue</span>;
      case 'TEAM_RETURN_LOGGED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Team Return</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">Master Record</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Compliance & Traceability</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Universal Log Ledger</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Audit Trail & Transaction Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Complete, timestamped system logs for all operational activities: Main Warehouse receipts, branch transfer notes, field team dispatches, and returns.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportAuditCsv}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search ref #, actor, item, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none"
          >
            <option value="all">All Transaction Types</option>
            <option value="MAIN_STOCK">Main Stock Receipts</option>
            <option value="REQUEST">Branch Transfer Requests</option>
            <option value="ISSUE">Team Dispatches</option>
            <option value="RETURN">Team Returns</option>
            <option value="MASTER">Master Setup</option>
          </select>

          <select
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none"
          >
            <option value="all">All Sites & Hubs</option>
            {sites.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm text-slate-900">Recorded Audit Entries ({filteredLogs.length})</h2>
            <span className="text-xs text-slate-500 font-mono">· Immutable system audit trail</span>
          </div>

          {auditLogs.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setConfirmState({
                  isOpen: true,
                  title: 'Clear Audit Trail Logs?',
                  message: `Are you sure you want to clear all ${auditLogs.length} audit trail logs? A fresh reset log entry will be created.`,
                  confirmLabel: 'Clear Audit Logs',
                  onConfirm: () => {
                    clearAuditLogs();
                    showToast('Audit trail history cleared.');
                  },
                });
              }}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Clear all audit logs"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear Audit Log</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Reference #</th>
                <th className="py-3 px-3">Site / Location</th>
                <th className="py-3 px-3">User / Actor</th>
                <th className="py-3 px-3">Item Code</th>
                <th className="py-3 px-4">Event Description</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No audit records match your filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {log.referenceNo}
                    </td>
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap font-medium">
                      {log.siteName}
                    </td>
                    <td className="py-3 px-3 text-slate-800 whitespace-nowrap">
                      {log.performedBy}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-900 whitespace-nowrap font-semibold">
                      {log.itemCode || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 leading-relaxed max-w-md">
                      {log.details}
                      {log.quantityChanged !== undefined && (
                        <span className="font-mono font-bold text-slate-900 ml-1.5">
                          [Δ {log.quantityChanged > 0 ? `+${log.quantityChanged}` : log.quantityChanged}]
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setConfirmState({
                            isOpen: true,
                            title: `Delete Log Entry "${log.referenceNo}"?`,
                            message: `Are you sure you want to delete this specific audit log entry?`,
                            confirmLabel: 'Delete Entry',
                            onConfirm: () => {
                              deleteAuditLog(log.id);
                              showToast('Audit log entry deleted.');
                            },
                          });
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete this audit record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
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
    </div>
  );
};
