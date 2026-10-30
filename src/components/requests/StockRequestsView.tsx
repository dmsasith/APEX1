import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Printer,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Building,
  FileCheck2,
  Edit2,
  AlertTriangle,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { StockTransferRequest, RequestPriority, Item } from '../../types';
import { formatNumber, formatDateTime } from '../../utils/exportUtils';
import { PrintableDocumentModal } from '../common/PrintableDocumentModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { SearchableItemSelect } from '../common/SearchableItemSelect';

export const StockRequestsView: React.FC = () => {
  const {
    sites,
    activeSites,
    items,
    activeItems,
    currentUser,
    stockRequests,
    createStockRequest,
    approveStockRequest,
    rejectStockRequest,
    removeStockRequestItem,
    acceptStockRequest,
    deleteStockRequest,
    clearStockRequests,
    getMainWarehouseStock,
  } = useStock();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedRequestForPrint, setSelectedRequestForPrint] = useState<StockTransferRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-transit' | 'accepted' | 'rejected'>('all');

  // Confirmation Modal state
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

  // Approval Modal State
  const [reviewingRequest, setReviewingRequest] = useState<StockTransferRequest | null>(null);
  const [approvalItems, setApprovalItems] = useState<Array<{ itemId: string; approvedQty: number }>>([]);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showRejectInline, setShowRejectInline] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Site Acceptance Modal State (Edit Received Amount or Direct Accept)
  const [acceptingRequest, setAcceptingRequest] = useState<StockTransferRequest | null>(null);
  const [receivedItems, setReceivedItems] = useState<Array<{ itemId: string; receivedQty: number }>>([]);
  const [acceptanceNotes, setAcceptanceNotes] = useState('');

  // Requisition Form State
  const branchSites = activeSites.filter((s) => !s.isMainWarehouse);
  const defaultSite =
    currentUser.siteId !== 'all' ? currentUser.siteId : (branchSites[0]?.id || activeSites[0]?.id || '');

  const [formSiteId, setFormSiteId] = useState(defaultSite);
  const [purpose, setPurpose] = useState('');
  const [priority, setPriority] = useState<RequestPriority>('Normal');
  const [rows, setRows] = useState<Array<{ itemId: string; requestedQty: number }>>([
    { itemId: activeItems[0]?.id || '', requestedQty: 50 },
  ]);
  const [formError, setFormError] = useState('');

  const handleClearFormFields = () => {
    setPurpose('');
    setPriority('Normal');
    setRows([{ itemId: activeItems[0]?.id || '', requestedQty: 10 }]);
    setFormError('');
  };

  const handleClearAllRequests = () => {
    setConfirmState({
      isOpen: true,
      title: 'Clear All Stock Requisitions?',
      message: `Are you sure you want to delete all ${stockRequests.length} material requisition notes across all sites?`,
      confirmLabel: 'Clear All Requests',
      onConfirm: () => {
        clearStockRequests();
      },
    });
  };

  const handleDeleteRequest = (req: StockTransferRequest) => {
    setConfirmState({
      isOpen: true,
      title: `Delete Requisition "${req.requestNoteNumber}"?`,
      message: `Are you sure you want to delete ${req.requestNoteNumber} (${req.status})? This will remove the request permanently.`,
      confirmLabel: 'Delete Requisition',
      onConfirm: () => {
        deleteStockRequest(req.id);
      },
    });
  };

  const handleAddRow = () => {
    const nextItem = activeItems.find((i) => !rows.some((r) => r.itemId === i.id)) || activeItems[0];
    if (nextItem) {
      setRows((prev) => [...prev, { itemId: nextItem.id, requestedQty: 10 }]);
    }
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: 'itemId' | 'requestedQty', value: unknown) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        return {
          ...r,
          [field]: field === 'requestedQty' ? Number(value) : value,
        };
      })
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!rows.length) {
      setFormError('Please add at least one item line to request.');
      return;
    }

    for (const r of rows) {
      if (!r.requestedQty || r.requestedQty <= 0) {
        setFormError('Please enter positive quantities for all items.');
        return;
      }
    }

    createStockRequest({
      siteId: formSiteId,
      priority,
      purpose: purpose.trim() || 'General site requisition',
      items: rows.map((r) => ({
        itemId: r.itemId,
        requestedQty: r.requestedQty,
      })),
    });

    setShowSubmitModal(false);
    setPurpose('');
    setRows([{ itemId: items[0]?.id || '', requestedQty: 50 }]);
  };

  // Open Approval Dialog
  const handleOpenApproveModal = (req: StockTransferRequest) => {
    setReviewingRequest(req);
    setApprovalItems(
      req.items.map((row) => ({
        itemId: row.itemId,
        approvedQty: row.approvedQty ?? row.requestedQty,
      }))
    );
    setApprovalNotes('');
  };

  const handleConfirmApproval = () => {
    if (!reviewingRequest) return;
    approveStockRequest(reviewingRequest.id, approvalItems, approvalNotes.trim());
    setReviewingRequest(null);
  };

  const handleRemoveItemFromRequest = (itemId: string) => {
    if (!reviewingRequest) return;
    removeStockRequestItem(reviewingRequest.id, itemId);
    const remaining = reviewingRequest.items.filter((i) => i.itemId !== itemId);
    if (remaining.length === 0) {
      setReviewingRequest(null);
    } else {
      setReviewingRequest({
        ...reviewingRequest,
        items: remaining,
      });
      setApprovalItems((prev) => prev.filter((i) => i.itemId !== itemId));
    }
  };

  const handleExecuteReject = () => {
    if (!reviewingRequest) return;
    rejectStockRequest(reviewingRequest.id, rejectionReason.trim() || 'Rejected by Central Logistics');
    setReviewingRequest(null);
    setShowRejectInline(false);
    setRejectionReason('');
  };

  // Direct Accept Handler
  const handleDirectAccept = (req: StockTransferRequest) => {
    const fullApprovedItems = req.items.map((r) => ({
      itemId: r.itemId,
      receivedQty: r.approvedQty ?? r.requestedQty,
    }));
    acceptStockRequest(req.id, fullApprovedItems, 'Directly accepted full dispatched quantity.');
  };

  // Open Edit Received Amount & Accept Dialog
  const handleOpenEditAcceptModal = (req: StockTransferRequest) => {
    setAcceptingRequest(req);
    setReceivedItems(
      req.items.map((r) => ({
        itemId: r.itemId,
        receivedQty: r.receivedQty ?? (r.approvedQty ?? r.requestedQty),
      }))
    );
    setAcceptanceNotes('');
  };

  const handleConfirmAcceptance = () => {
    if (!acceptingRequest) return;
    acceptStockRequest(acceptingRequest.id, receivedItems, acceptanceNotes.trim() || 'Received with verification notes.');
    setAcceptingRequest(null);
  };

  // Role access helpers
  const isCentralAdmin =
    currentUser.role === 'Central Warehouse Admin' ||
    currentUser.role === 'Auditor' ||
    currentUser.siteId === 'all' ||
    activeSites.find((s) => s.id === currentUser.siteId)?.isMainWarehouse === true;

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');

  // Filter requests based on user role and branch filter
  const visibleRequests = stockRequests.filter((req) => {
    if (isCentralAdmin) {
      if (selectedBranchFilter === 'all') return true;
      return req.siteId === selectedBranchFilter;
    }
    // Site Admin sees their own site branch
    return req.siteId === currentUser.siteId;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Inter-Branch Requisitions</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Official Material Transfer Workflow</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Request Stock to Site & Request Notes
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Site Admins requisition required materials from the Main Warehouse. Central Logistics approves quantities, generates the official Request Note, and sites verify/accept incoming shipments.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {stockRequests.length > 0 && (
            <button
              onClick={handleClearAllRequests}
              className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Clear all material transfer requisitions"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Requests</span>
            </button>
          )}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>New Stock Requirement Form</span>
          </button>
        </div>
      </div>

      {/* Workflow Tabs: Dedicated Pending Approval Routing + Branch Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Requisitions ({visibleRequests.length})
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending Approval Queue ({visibleRequests.filter((r) => r.status === 'Pending Approval').length})</span>
          </button>

          <button
            onClick={() => setStatusFilter('in-transit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              statusFilter === 'in-transit'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 border border-blue-200 text-blue-900 hover:bg-blue-100'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
            <span>Dispatched / In-Transit ({visibleRequests.filter((r) => r.status === 'Approved / In-Transit').length})</span>
          </button>

          <button
            onClick={() => setStatusFilter('accepted')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              statusFilter === 'accepted'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Completed & Accepted ({visibleRequests.filter((r) => r.status === 'Accepted').length})</span>
          </button>

          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 border border-rose-200 text-rose-900 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Rejected Requests ({visibleRequests.filter((r) => r.status === 'Rejected').length})</span>
          </button>
        </div>

        {/* Central Admin Branch Filter */}
        {isCentralAdmin && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-600">Branch:</span>
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">All Branches ({stockRequests.length} total)</option>
              {branchSites.map((b) => {
                const count = stockRequests.filter((r) => r.siteId === b.id).length;
                return (
                  <option key={b.id} value={b.id}>
                    {b.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Active Notifications Banner if any request is ready for Site Acceptance */}
      {stockRequests.some((r) => r.status === 'Approved / In-Transit') && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 flex-1">
            <strong className="text-sm font-bold block mb-0.5">
              Request Notes Notification: Approved Shipments In-Transit
            </strong>
            Shipments have been dispatched by Main Warehouse Logistics. The destination Site Admin should click <strong>"Accept Directly"</strong> or <strong>"Edit Received Amount"</strong> to update site inventory.
          </div>
        </div>
      )}

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-slate-900">
            {statusFilter === 'pending'
              ? 'Pending Approval Queue'
              : statusFilter === 'in-transit'
              ? 'Dispatched & In-Transit Shipments'
              : statusFilter === 'accepted'
              ? 'Accepted Transfer Records'
              : statusFilter === 'rejected'
              ? 'Rejected Requisitions'
              : 'All Material Transfer Requisitions'}
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {
              visibleRequests.filter((req) => {
                if (statusFilter === 'pending') return req.status === 'Pending Approval';
                if (statusFilter === 'in-transit') return req.status === 'Approved / In-Transit';
                if (statusFilter === 'accepted') return req.status === 'Accepted';
                if (statusFilter === 'rejected') return req.status === 'Rejected';
                return true;
              }).length
            }{' '}
            notes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Request Note #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Site Branch</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRequests.filter((req) => {
                if (statusFilter === 'pending') return req.status === 'Pending Approval';
                if (statusFilter === 'in-transit') return req.status === 'Approved / In-Transit';
                if (statusFilter === 'accepted') return req.status === 'Accepted';
                if (statusFilter === 'rejected') return req.status === 'Rejected';
                return true;
              }).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No stock transfer requisitions match this filter.
                  </td>
                </tr>
              ) : (
                visibleRequests
                  .filter((req) => {
                    if (statusFilter === 'pending') return req.status === 'Pending Approval';
                    if (statusFilter === 'in-transit') return req.status === 'Approved / In-Transit';
                    if (statusFilter === 'accepted') return req.status === 'Accepted';
                    if (statusFilter === 'rejected') return req.status === 'Rejected';
                    return true;
                  })
                  .map((req) => {
                  const site = sites.find((s) => s.id === req.siteId);
                  const isSiteReceiver = isCentralAdmin || currentUser.siteId === req.siteId;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {req.requestNoteNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                        {formatDateTime(req.requestedDate)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{site?.name}</span>
                        <div className="text-[10px] text-slate-500">By: {req.requestedBy}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            req.priority === 'Emergency'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : req.priority === 'Urgent'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {req.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="space-y-1">
                          {req.items.map((row) => {
                            const itm = items.find((i) => i.id === row.itemId);
                            return (
                              <div key={row.itemId} className="flex items-center gap-1.5 text-slate-700">
                                <span className="font-mono font-semibold text-slate-900">{itm?.itemCode}:</span>
                                <span>{row.requestedQty} {itm?.unit}</span>
                                {row.approvedQty !== undefined && (
                                  <span className="text-slate-500 text-[10px]">
                                    (Apprv: <strong>{row.approvedQty}</strong>)
                                  </span>
                                )}
                                {row.receivedQty !== undefined && (
                                  <span className="text-emerald-700 text-[10px] font-bold">
                                    (Recv: {row.receivedQty})
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {req.purpose && (
                          <div className="text-[10px] text-slate-500 italic mt-1 truncate">
                            Purpose: {req.purpose}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold ${
                            req.status === 'Accepted'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : req.status === 'Approved / In-Transit'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : req.status === 'Pending Approval'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {req.status === 'Accepted' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                          {req.status === 'Approved / In-Transit' && <Clock className="w-3 h-3 text-blue-600" />}
                          <span>{req.status}</span>
                        </span>
                      </td>

                      {/* Workflow Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. Print Official Request Note */}
                          <button
                            onClick={() => setSelectedRequestForPrint(req)}
                            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                            title="View / Print Official Request Note"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Requisition Note */}
                          <button
                            onClick={() => handleDeleteRequest(req)}
                            className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete / cancel this requisition note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Central Admin Review & Approve or Reject */}
                          {req.status === 'Pending Approval' && isCentralAdmin && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenApproveModal(req)}
                                className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                                title="Set approved quantities to give and issue transfer note"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Review & Allocate</span>
                              </button>
                              <button
                                onClick={() => {
                                  setReviewingRequest(req);
                                  setShowRejectInline(true);
                                }}
                                className="px-2.5 py-1.5 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                                title="Reject this requisition request"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Reject</span>
                              </button>
                            </div>
                          )}

                          {/* 3. Site Admin Acceptance Actions (Accept directly OR Edit Received Amount) */}
                          {req.status === 'Approved / In-Transit' && isSiteReceiver && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleDirectAccept(req)}
                                className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                                title="Confirm full shipment received into site inventory"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Mark Received</span>
                              </button>
                              <button
                                onClick={() => handleOpenEditAcceptModal(req)}
                                className="px-2.5 py-1.5 rounded bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-300 transition-colors flex items-center gap-1 shadow-2xs"
                                title="Edit Received Amount before accepting (in case of damages or shortage)"
                              >
                                <Edit2 className="w-3 h-3 text-slate-600" />
                                <span>Count & Receive</span>
                              </button>
                            </div>
                          )}

                          {req.status === 'Accepted' && (
                            <span className="text-[11px] text-emerald-700 font-semibold px-2 py-0.5">
                              Stock Received
                            </span>
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

      {/* CREATE REQUISITION FORM MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-slate-800" />
                <h3 className="font-semibold text-lg text-slate-900">Submit Stock Requirement Form to Main Branch</h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Requesting Site Branch *</label>
                  <select
                    value={formSiteId}
                    onChange={(e) => setFormSiteId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    required
                  >
                    {branchSites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Requisition Priority *</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as RequestPriority)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  >
                    <option value="Normal">Normal (Regular restocking)</option>
                    <option value="Urgent">Urgent (Upcoming milestone)</option>
                    <option value="Emergency">Emergency (Site stoppage risk)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose / Work Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Substation conduit ducting, transformer foundation pile caps"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              {/* Dynamic Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">Requested Items & Quantities</label>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item Row</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[560px]">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 min-w-[220px]">Item Description</th>
                        <th className="py-2.5 px-2 text-center w-16">Unit</th>
                        <th className="py-2.5 px-3 text-right w-24">Main Avail.</th>
                        <th className="py-2.5 px-3 text-right w-32 font-bold text-slate-900">Required Qty *</th>
                        <th className="py-2.5 px-2 text-center w-12">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row, idx) => {
                        const itm = items.find((i) => i.id === row.itemId);
                        const mainStock = itm ? getMainWarehouseStock(itm.id) : null;
                        return (
                          <tr key={idx}>
                            <td className="py-2 px-3 min-w-[220px]">
                              <SearchableItemSelect
                                selectedItemId={row.itemId}
                                onSelectItem={(selected) => handleRowChange(idx, 'itemId', selected.id)}
                                showStockBadge={false}
                                placeholder="Select item..."
                              />
                            </td>
                            <td className="py-2 px-2 text-center text-slate-500 font-medium whitespace-nowrap">
                              {itm?.unit}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                              {mainStock ? formatNumber(mainStock.availableBalance) : 0}
                            </td>
                            <td className="py-2 px-3 text-right whitespace-nowrap">
                              <input
                                type="number"
                                min="1"
                                step="any"
                                value={row.requestedQty}
                                onChange={(e) => handleRowChange(idx, 'requestedQty', e.target.value)}
                                className="w-24 px-2 py-1.5 border border-slate-300 rounded text-xs font-mono font-bold text-right focus:ring-2 focus:ring-slate-900 bg-white"
                                required
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              {rows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRow(idx)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClearFormFields}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Fields</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                  >
                    Transmit Requisition
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVE REQUISITION MODAL (Main Branch Admin) */}
      {reviewingRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="font-semibold text-base text-slate-900">
                    Review & Set Approved Quantity ({reviewingRequest.requestNoteNumber})
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    Requesting Site: <strong className="text-slate-800">{sites.find((s) => s.id === reviewingRequest.siteId)?.name}</strong> · Requester: {reviewingRequest.requestedBy}
                  </div>
                </div>
              </div>
              <button onClick={() => setReviewingRequest(null)} className="p-1 text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Enter the exact quantity the Main Warehouse can allocate and dispatch for this requisition. You can adjust the approved quantity to match stock availability or partial shipments.
            </p>

            <div className="border border-slate-200 rounded-lg overflow-x-auto mb-4">
              <table className="w-full text-xs text-left min-w-[580px]">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Item Specs</th>
                    <th className="py-2.5 px-3 text-right">Main Warehouse Avail.</th>
                    <th className="py-2.5 px-3 text-right">Site Requested</th>
                    <th className="py-2.5 px-3 text-right w-44 font-bold text-slate-900">Approved Qty</th>
                    <th className="py-2.5 px-2 text-center w-28">Item Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reviewingRequest.items.map((row) => {
                    const itm = items.find((i) => i.id === row.itemId);
                    const mainStock = itm ? getMainWarehouseStock(itm.id) : null;
                    const approvedVal =
                      approvalItems.find((a) => a.itemId === row.itemId)?.approvedQty ?? row.requestedQty;
                    const avail = mainStock?.availableBalance || 0;
                    const isExceeding = approvedVal > avail;

                    return (
                      <tr key={row.itemId} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                            {itm?.itemCode}
                          </span>
                          <div className="text-xs font-semibold text-slate-800 mt-0.5">{itm?.itemName}</div>
                          {itm?.description && (
                            <div className="text-[10px] text-slate-500 italic line-clamp-1 max-w-[200px]">{itm.description}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                          <span className={`font-bold ${avail <= 0 ? 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200' : avail < row.requestedQty ? 'text-amber-600' : 'text-emerald-700'}`}>
                            {formatNumber(avail)} {itm?.unit}
                          </span>
                          {avail <= 0 ? (
                            <div className="text-[10px] text-rose-600 font-bold mt-0.5">OUT OF STOCK</div>
                          ) : avail < row.requestedQty ? (
                            <div className="text-[10px] text-amber-600 font-medium">Partial Stock</div>
                          ) : null}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700 whitespace-nowrap">
                          {formatNumber(row.requestedQty)} <span className="text-[10px] text-slate-400 font-normal">{itm?.unit}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5 justify-end">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={approvedVal}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                                  setApprovalItems((prev) =>
                                    prev.map((item) =>
                                      item.itemId === row.itemId ? { ...item, approvedQty: val } : item
                                    )
                                  );
                                }}
                                className={`w-20 px-2 py-1.5 border rounded text-xs font-mono font-bold text-right focus:outline-none ${
                                  isExceeding
                                    ? 'border-amber-500 bg-amber-50/70 text-amber-900 focus:ring-2 focus:ring-amber-500'
                                    : 'border-slate-300 focus:ring-2 focus:ring-slate-900 bg-white'
                                }`}
                                title="Enter the quantity you can provide"
                              />
                              <span className="text-[11px] text-slate-500">{itm?.unit}</span>
                            </div>

                            {/* Quick Presets */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setApprovalItems((prev) =>
                                    prev.map((item) =>
                                      item.itemId === row.itemId ? { ...item, approvedQty: row.requestedQty } : item
                                    )
                                  );
                                }}
                                className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors cursor-pointer"
                                title="Approve full requested quantity"
                              >
                                Full
                              </button>
                              {avail < row.requestedQty && avail > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setApprovalItems((prev) =>
                                      prev.map((item) =>
                                        item.itemId === row.itemId ? { ...item, approvedQty: avail } : item
                                      )
                                    );
                                  }}
                                  className="px-1.5 py-0.5 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-medium transition-colors cursor-pointer"
                                  title="Approve max available stock in warehouse"
                                >
                                  Max ({avail})
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setApprovalItems((prev) =>
                                    prev.map((item) =>
                                      item.itemId === row.itemId ? { ...item, approvedQty: 0 } : item
                                    )
                                  );
                                }}
                                className="px-1.5 py-0.5 text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 rounded transition-colors cursor-pointer"
                                title="Set 0 (Cannot supply)"
                              >
                                0
                              </button>
                            </div>

                            {isExceeding && (
                              <span className="text-[10px] text-amber-700 font-semibold">
                                Exceeds stock ({avail} avail)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Remove from Request button */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromRequest(row.itemId)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer mx-auto shadow-2xs"
                            title="Remove out-of-stock item from this requisition note"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>Remove</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dispatch Notes / Remarks</label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="e.g. Dispatched via convoy Flatbed Truck T-08. ETA tomorrow morning."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none"
              />
            </div>

            {/* Direct In-Modal Rejection or Standard Action Buttons (No Modal Trap) */}
            <div className="pt-3 border-t border-slate-200">
              {showRejectInline ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Confirm Rejection of Requisition Note: {reviewingRequest.requestNoteNumber}</span>
                  </div>
                  <p className="text-[11px] text-rose-800">
                    Enter the official reason for rejecting this requisition (this will be logged and visible to the requesting branch site):
                  </p>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Items currently unavailable in Central Yard or duplicate requisition"
                    className="w-full px-3 py-2 border border-rose-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowRejectInline(false)}
                      className="px-3.5 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteReject}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                    >
                      Confirm & Reject Request
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectInline(true);
                      setRejectionReason(approvalNotes || 'Requested items unavailable at Central Warehouse');
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Reject this requisition with reason"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Reject Request</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewingRequest(null)}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmApproval}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                    >
                      Approve & Issue Request Note
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT RECEIVED AMOUNT & ACCEPT MODAL (Site Admin) */}
      {acceptingRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-700" />
                <h3 className="font-semibold text-base text-slate-900">
                  Verify & Edit Received Amount ({acceptingRequest.requestNoteNumber})
                </h3>
              </div>
              <button onClick={() => setAcceptingRequest(null)} className="p-1 text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Site Admin Receiving Verification: Check physical count delivered to the site gate. If there is a delivery discrepancy (e.g. damaged in-transit or shortage), input the actual counted quantity.
            </p>

            <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Unit</th>
                    <th className="py-2.5 px-3 text-right">Dispatched Qty</th>
                    <th className="py-2.5 px-3 text-right">Actually Received Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {acceptingRequest.items.map((row) => {
                    const itm = items.find((i) => i.id === row.itemId);
                    const recvVal =
                      receivedItems.find((r) => r.itemId === row.itemId)?.receivedQty ?? (row.approvedQty ?? row.requestedQty);

                    return (
                      <tr key={row.itemId}>
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-semibold text-slate-900">{itm?.itemCode}</span>
                          <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{itm?.itemName}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{itm?.unit}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          {formatNumber(row.approvedQty ?? row.requestedQty)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={recvVal}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setReceivedItems((prev) =>
                                prev.map((item) =>
                                  item.itemId === row.itemId ? { ...item, receivedQty: val } : item
                                )
                              );
                            }}
                            className="w-24 px-2 py-1 border border-emerald-400 bg-emerald-50/40 rounded text-xs font-mono font-bold text-right focus:ring-2 focus:ring-emerald-600 focus:outline-none"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Receiving Remarks / Notes</label>
              <textarea
                value={acceptanceNotes}
                onChange={(e) => setAcceptanceNotes(e.target.value)}
                placeholder="e.g. Unloaded and verified at Gate 3. Packaging intact."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setAcceptingRequest(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAcceptance}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Accept & Update Site Inventory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE OFFICIAL REQUEST NOTE MODAL */}
      {selectedRequestForPrint && (
        <PrintableDocumentModal
          document={{ type: 'REQUEST_NOTE', data: selectedRequestForPrint }}
          onClose={() => setSelectedRequestForPrint(null)}
        />
      )}

      {/* Reusable In-App Confirmation Modal */}
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
