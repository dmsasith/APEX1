import React, { useState, useMemo } from 'react';
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
  Search,
  Sparkles,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  StockTransferRequest,
  RequestPriority,
  Item,
  isCentralOrAllSiteAdmin,
  isUserAllSites,
  getUserAssignedSiteIds,
  userHasSiteAccess,
  ClientFreeIssueEntry,
  ClientFreeIssueItemRow,
} from '../../types';
import { formatNumber, formatDateTime } from '../../utils/exportUtils';
import { isMachineryItem } from '../../utils/itemTypeUtils';
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
    clientFreeIssues,
    getClientFreeStockBalance,
  } = useStock();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedRequestForPrint, setSelectedRequestForPrint] = useState<StockTransferRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-transit' | 'accepted' | 'rejected'>('all');
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [activeViewTab, setActiveViewTab] = useState<'requests' | 'foc-materials'>('requests');

  const userAssignedIds = getUserAssignedSiteIds(currentUser, activeSites);

  const isCentralAdmin =
    isCentralOrAllSiteAdmin(currentUser.role) ||
    isUserAllSites(currentUser) ||
    userAssignedIds.some((sid) => activeSites.find((s) => s.id === sid)?.isMainWarehouse === true);

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');

  // Filter client FOC materials by selected branch / user assigned site(s)
  const filteredClientFocMaterials = useMemo(() => {
    return (clientFreeIssues || []).filter((v) => {
      if (v.isDeleted) return false;
      if (isCentralAdmin) {
        if (selectedBranchFilter !== 'all') {
          const targetSite = sites.find((s) => s.id === selectedBranchFilter);
          if (!targetSite) return true;
          const matchLoc = v.storageLocation && v.storageLocation.trim().toLowerCase() === targetSite.name.trim().toLowerCase();
          return matchLoc;
        }
        return true;
      } else {
        const userSiteNames = userAssignedIds
          .map((sid) => sites.find((s) => s.id === sid)?.name.trim().toLowerCase())
          .filter((n): n is string => Boolean(n));
        if (userSiteNames.length === 0) return false;
        const locLower = (v.storageLocation || '').trim().toLowerCase();
        return userSiteNames.includes(locLower);
      }
    });
  }, [clientFreeIssues, isCentralAdmin, selectedBranchFilter, userAssignedIds, sites]);

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

  // Requisition Form State (scoped to user's assigned sites if not Central/All-Sites)
  const branchSites = activeSites.filter((s) => !s.isMainWarehouse);
  const allowedRequisitionSites = isCentralAdmin
    ? branchSites
    : branchSites.filter((s) => userHasSiteAccess(currentUser, s.id, activeSites));
  const defaultSite =
    allowedRequisitionSites[0]?.id || branchSites[0]?.id || activeSites[0]?.id || '';

  // Separate active items by classification
  const activeMaterialItems = activeItems.filter((i) => !isMachineryItem(i));
  const activeMachineryItems = activeItems.filter((i) => isMachineryItem(i));

  const [formSiteId, setFormSiteId] = useState(defaultSite);
  const [purpose, setPurpose] = useState('');
  const [priority, setPriority] = useState<RequestPriority>('Normal');
  const [reqModalTab, setReqModalTab] = useState<'Material' | 'Machinery' | 'all'>('Material');
  const [onlyAvailableInModal, setOnlyAvailableInModal] = useState<boolean>(false);
  const [rows, setRows] = useState<Array<{ itemId: string; requestedQty: number }>>([
    { itemId: activeMaterialItems[0]?.id || activeItems[0]?.id || '', requestedQty: 50 },
  ]);
  const [formError, setFormError] = useState('');

  // Form indexed rows separated by category
  const materialRowsWithIndex = rows
    .map((r, index) => ({ row: r, index, item: items.find((i) => i.id === r.itemId) }))
    .filter((entry) => !entry.item || !isMachineryItem(entry.item));

  const machineryRowsWithIndex = rows
    .map((r, index) => ({ row: r, index, item: items.find((i) => i.id === r.itemId) }))
    .filter((entry) => entry.item && isMachineryItem(entry.item));

  const displayedRows =
    reqModalTab === 'Material'
      ? materialRowsWithIndex
      : reqModalTab === 'Machinery'
      ? machineryRowsWithIndex
      : rows.map((r, index) => ({ row: r, index, item: items.find((i) => i.id === r.itemId) }));

  const handleClearFormFields = () => {
    setPurpose('');
    setPriority('Normal');
    setReqModalTab('Material');
    setRows([{ itemId: activeMaterialItems[0]?.id || activeItems[0]?.id || '', requestedQty: 10 }]);
    setFormError('');
  };

  const handleClearAllRequests = () => {
    if (!isCentralAdmin) return;
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
    if (!isCentralAdmin) return;
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

  const handleAddMaterialRow = () => {
    const nextItem =
      activeMaterialItems.find((i) => !rows.some((r) => r.itemId === i.id)) ||
      activeMaterialItems[0] ||
      activeItems[0];
    if (nextItem) {
      setRows((prev) => [...prev, { itemId: nextItem.id, requestedQty: 10 }]);
      setReqModalTab('Material');
    }
  };

  const handleAddMachineryRow = () => {
    const nextItem =
      activeMachineryItems.find((i) => !rows.some((r) => r.itemId === i.id)) ||
      activeMachineryItems[0] ||
      activeItems[0];
    if (nextItem) {
      setRows((prev) => [...prev, { itemId: nextItem.id, requestedQty: 1 }]);
      setReqModalTab('Machinery');
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

  // 1-Click: Send only available stock (caps approvedQty to warehouse balance, 0 if out of stock)
  const handleSetAllToAvailable = () => {
    if (!reviewingRequest) return;
    setApprovalItems((prev) =>
      prev.map((item) => {
        const avail = getMainWarehouseStock(item.itemId).availableBalance;
        const originalReq = reviewingRequest.items.find((r) => r.itemId === item.itemId);
        const reqQty = originalReq ? originalReq.requestedQty : item.approvedQty;
        const capped = Math.max(0, Math.min(reqQty, avail));
        return { ...item, approvedQty: capped };
      })
    );
  };

  // 1-Click: Remove all items that have 0 stock from the requisition note
  const handleRemoveAllOutOfStock = () => {
    if (!reviewingRequest) return;
    const outOfStockItems = reviewingRequest.items.filter((r) => {
      const avail = getMainWarehouseStock(r.itemId).availableBalance;
      return avail <= 0;
    });

    if (outOfStockItems.length === 0) return;

    outOfStockItems.forEach((r) => {
      removeStockRequestItem(reviewingRequest.id, r.itemId);
    });

    const remaining = reviewingRequest.items.filter((r) => {
      const avail = getMainWarehouseStock(r.itemId).availableBalance;
      return avail > 0;
    });

    if (remaining.length === 0) {
      rejectStockRequest(reviewingRequest.id, 'All requested items are completely out of stock at Central Warehouse');
      setReviewingRequest(null);
    } else {
      setReviewingRequest({
        ...reviewingRequest,
        items: remaining,
      });
      setApprovalItems((prev) => prev.filter((item) => remaining.some((r) => r.itemId === item.itemId)));
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

  // Filter requests based on user role, assigned site(s), branch filter, and search query
  const visibleRequests = stockRequests.filter((req) => {
    if (isCentralAdmin) {
      if (selectedBranchFilter !== 'all' && req.siteId !== selectedBranchFilter) return false;
    } else {
      if (!userHasSiteAccess(currentUser, req.siteId, activeSites)) return false;
      if (selectedBranchFilter !== 'all' && req.siteId !== selectedBranchFilter) return false;
    }

    if (tableSearchQuery.trim()) {
      const q = tableSearchQuery.toLowerCase().trim();
      const site = sites.find((s) => s.id === req.siteId);
      const matchesMeta =
        req.requestNoteNumber.toLowerCase().includes(q) ||
        (site && site.name.toLowerCase().includes(q)) ||
        (req.purpose && req.purpose.toLowerCase().includes(q)) ||
        (req.requestedBy && req.requestedBy.toLowerCase().includes(q)) ||
        req.priority.toLowerCase().includes(q) ||
        req.status.toLowerCase().includes(q);

      if (matchesMeta) return true;

      const matchesItem = req.items.some((row) => {
        const itm = items.find((i) => i.id === row.itemId);
        if (!itm) return false;
        return (
          itm.itemCode.toLowerCase().includes(q) ||
          itm.itemName.toLowerCase().includes(q) ||
          itm.category.toLowerCase().includes(q) ||
          (isMachineryItem(itm) && (q === 'machinery' || q === 'machine' || q === 'equipment'))
        );
      });
      return matchesItem;
    }

    return true;
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
          {isCentralAdmin && stockRequests.length > 0 && (
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

      {/* Main View Tabs: Requisitions vs Client FOC Materials */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveViewTab('requests')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeViewTab === 'requests'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
            <span>Stock Transfer Requisitions ({stockRequests.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveViewTab('foc-materials')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeViewTab === 'foc-materials'
                ? 'bg-white text-indigo-950 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="text-indigo-600">🎁</span>
            <span>Client FOC Materials ({clientFreeIssues?.filter(e => !e.isDeleted).length || 0})</span>
          </button>
        </div>
      </div>

      {activeViewTab === 'foc-materials' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                🎁
              </div>
              <div>
                <h3 className="font-bold text-sm text-indigo-950">
                  Client Free-Issue (FOC) Materials Shipments
                </h3>
                <p className="text-xs text-indigo-800">
                  Client-supplied materials registered for branch sites. Maintained completely separate from standard warehouse inventory transfer requisitions.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white text-indigo-900 border border-indigo-300 rounded-lg text-xs font-bold font-mono">
              {filteredClientFocMaterials.length} Shipment(s)
            </span>
          </div>

          {filteredClientFocMaterials.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center mx-auto mb-3 text-xl">
                🎁
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                No Client FOC Materials Found
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No client free-issue material entries match your branch filter. Register FOC shipments from Main Stock &gt; Client FOC Materials.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClientFocMaterials.map((foc: ClientFreeIssueEntry) => (
                <div key={foc.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-indigo-900 text-white px-2.5 py-1 rounded">
                        {foc.voucherNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        Client: <span className="text-indigo-700">{foc.clientName}</span>
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-xs text-slate-600">Project: {foc.projectName}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-xs font-semibold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        Site / Location: {foc.storageLocation}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {formatDateTime(foc.receivedDate || foc.createdAt)}
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Item Code</th>
                          <th className="py-2.5 px-3">Material Description</th>
                          <th className="py-2.5 px-3 text-center">Unit</th>
                          <th className="py-2.5 px-3 text-right">FOC Received Qty</th>
                          <th className="py-2.5 px-3 text-right">Remaining Bal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {foc.items.map((row: ClientFreeIssueItemRow, idx: number) => {
                          const itm = items.find((i) => i.id === row.itemId);
                          const bal = getClientFreeStockBalance(foc.projectId, row.itemId);
                          return (
                            <tr key={idx} className="bg-white">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                                {itm?.itemCode || 'ITEM'}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-800">
                                {itm?.itemName || 'Material Item'}
                              </td>
                              <td className="py-2.5 px-3 text-center text-slate-600">{itm?.unit || 'units'}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                                {formatNumber(row.quantity)} {itm?.unit}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-700">
                                {formatNumber(bal.remainingBalance)} {itm?.unit}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {foc.notes && (
                    <div className="text-xs text-slate-500 italic">
                      Notes: &ldquo;{foc.notes}&rdquo;
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeViewTab === 'requests' && (
        <div className="space-y-6">
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
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
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
              (
              {
                visibleRequests.filter((req) => {
                  if (statusFilter === 'pending') return req.status === 'Pending Approval';
                  if (statusFilter === 'in-transit') return req.status === 'Approved / In-Transit';
                  if (statusFilter === 'accepted') return req.status === 'Accepted';
                  if (statusFilter === 'rejected') return req.status === 'Rejected';
                  return true;
                }).length
              }{' '}
              notes)
            </span>
          </div>

          {/* Search Box - 2 inch / mobile friendly */}
          <div className="relative w-full sm:w-80 md:w-96 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search requisition #, branch, item, machinery..."
              value={tableSearchQuery}
              onChange={(e) => setTableSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 focus:border-slate-900 rounded-lg text-xs font-medium focus:ring-1 focus:ring-slate-900 focus:outline-none transition-colors placeholder:text-slate-400 shadow-2xs"
            />
            {tableSearchQuery && (
              <button
                type="button"
                onClick={() => setTableSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
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
                  const isSiteReceiver = isCentralAdmin || userHasSiteAccess(currentUser, req.siteId, activeSites);

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
                      <td className="py-3 px-4 max-w-sm">
                        <div className="space-y-1">
                          {req.items.map((row) => {
                            const itm = items.find((i) => i.id === row.itemId);
                            const isMach = itm ? isMachineryItem(itm) : false;
                            return (
                              <div key={row.itemId} className="flex items-center gap-1.5 text-slate-700 flex-wrap">
                                <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-1 py-0.2 rounded text-[10px] border border-slate-200">
                                  {itm?.itemCode || 'ITEM'}:
                                </span>
                                {isMach ? (
                                  <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                    🚜 Machinery
                                  </span>
                                ) : (
                                  <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                    🧱 Material
                                  </span>
                                )}
                                <span className="font-semibold text-slate-800">{row.requestedQty} {itm?.unit}</span>
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

                          {/* Delete Requisition Note (Main Admin only) */}
                          {isCentralAdmin && (
                            <button
                              onClick={() => handleDeleteRequest(req)}
                              className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete / cancel this requisition note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

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
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl xl:max-w-6xl w-full p-6 sm:p-8 border border-slate-200 my-auto min-h-[620px] max-h-[92vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900">Submit Stock Requirement Form to Main Branch</h3>
                  <p className="text-xs sm:text-sm text-slate-500">Official site requisition for construction materials or heavy machinery & equipment</p>
                </div>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close Window"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5 flex-1 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Requesting Site Branch *
                  </label>
                  <select
                    value={formSiteId}
                    onChange={(e) => setFormSiteId(e.target.value)}
                    disabled={!isCentralAdmin && allowedRequisitionSites.length <= 1}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium shadow-2xs disabled:bg-slate-100"
                    required
                  >
                    {(allowedRequisitionSites.length > 0 ? allowedRequisitionSites : branchSites).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.location || 'Site Branch'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Requisition Priority *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as RequestPriority)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium shadow-2xs"
                  >
                    <option value="Normal">🟢 Normal (Regular project restocking)</option>
                    <option value="Urgent">🟠 Urgent (Critical upcoming project milestone)</option>
                    <option value="Emergency">🔴 Emergency (Imminent site stoppage risk)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Purpose / Work Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Substation conduit ducting, transformer foundation pile caps, fiber optic trenching"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium shadow-2xs placeholder:text-slate-400"
                />
              </div>

              {/* Dynamic Items Table with Material & Machinery Dedicated Tabs */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-4 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <label className="text-sm font-bold text-slate-900 block">Requested Items & Equipment</label>
                    <span className="text-xs text-slate-500">
                      Select items with clear dropdown visibility — switch tabs to separate Materials and Machinery
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Available Stock Only Toggle requested by user */}
                    <button
                      type="button"
                      onClick={() => setOnlyAvailableInModal(!onlyAvailableInModal)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border ${
                        onlyAvailableInModal
                          ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-500/20'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                      title="Filter dropdown to show only items with available stock in Central Main Warehouse"
                    >
                      <CheckCircle className={`w-3.5 h-3.5 ${onlyAvailableInModal ? 'text-white' : 'text-slate-400'}`} />
                      <span>Available Stock Only</span>
                    </button>

                    {/* 2-Tab Switcher */}
                    <div className="flex items-center bg-slate-200/90 p-1 rounded-xl text-xs font-bold shrink-0 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setReqModalTab('Material')}
                        className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                          reqModalTab === 'Material'
                            ? 'bg-emerald-700 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span className="text-sm">🧱 Materials</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                            reqModalTab === 'Material'
                              ? 'bg-emerald-800 text-emerald-100'
                              : 'bg-slate-300 text-slate-700'
                          }`}
                        >
                          {materialRowsWithIndex.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReqModalTab('Machinery')}
                        className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                          reqModalTab === 'Machinery'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span className="text-sm">🚜 Machinery</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                            reqModalTab === 'Machinery'
                              ? 'bg-amber-700 text-amber-100'
                              : 'bg-slate-300 text-slate-700'
                          }`}
                        >
                          {machineryRowsWithIndex.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReqModalTab('all')}
                        className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                          reqModalTab === 'all'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>All ({rows.length})</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Available Stock Active Banner */}
                {onlyAvailableInModal && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-emerald-800 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Available Stock Filter Active:</strong> Only items with positive stock in Central Warehouse are shown in dropdowns.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOnlyAvailableInModal(false)}
                      className="text-[11px] font-bold text-emerald-700 hover:underline shrink-0"
                    >
                      Show All Items
                    </button>
                  </div>
                )}

                {/* Tab Context Helper & Add Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm">
                    {reqModalTab === 'Material' && (
                      <span className="text-emerald-800 font-semibold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Consumables, raw materials, pipes, cables & fitting supplies
                      </span>
                    )}
                    {reqModalTab === 'Machinery' && (
                      <span className="text-amber-800 font-semibold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Excavators, compactors, generators, welding plants, power tools & heavy machinery
                      </span>
                    )}
                    {reqModalTab === 'all' && (
                      <span className="text-slate-600 font-medium">
                        Combined requisition: {materialRowsWithIndex.length} materials, {machineryRowsWithIndex.length} machinery
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(reqModalTab === 'Material' || reqModalTab === 'all') && (
                      <button
                        type="button"
                        onClick={handleAddMaterialRow}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Plus className="w-4 h-4 text-emerald-200" />
                        <span>+ Add Material Item</span>
                      </button>
                    )}

                    {(reqModalTab === 'Machinery' || reqModalTab === 'all') && (
                      <button
                        type="button"
                        onClick={handleAddMachineryRow}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Plus className="w-4 h-4 text-amber-200" />
                        <span>+ Add Machinery / Plant / Tool</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Table of items with comfortable height to let dropdown unfold fully */}
                <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white min-h-[440px] pb-52 shadow-2xs">
                  <table className="w-full text-xs text-left min-w-[760px]">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4 min-w-[360px] sm:min-w-[460px] md:min-w-[520px]">
                          Item Description & Classification
                        </th>
                        <th className="py-3 px-3 text-center w-20">Unit</th>
                        <th className="py-3 px-4 text-right w-28">Main Avail.</th>
                        <th className="py-3 px-4 text-right w-36 font-bold text-slate-900">Required Qty *</th>
                        <th className="py-3 px-3 text-center w-14">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-16 text-center">
                            {reqModalTab === 'Material' ? (
                              <div className="space-y-3">
                                <p className="text-sm font-medium text-slate-500">No material items added to this requisition yet.</p>
                                <button
                                  type="button"
                                  onClick={handleAddMaterialRow}
                                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Add First Material Item</span>
                                </button>
                              </div>
                            ) : reqModalTab === 'Machinery' ? (
                              <div className="space-y-3">
                                <p className="text-sm font-medium text-slate-500">No machinery or equipment added to this requisition yet.</p>
                                <button
                                  type="button"
                                  onClick={handleAddMachineryRow}
                                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Add First Machinery Item</span>
                                </button>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500">No items in requisition.</p>
                            )}
                          </td>
                        </tr>
                      ) : (
                        displayedRows.map(({ row, index: originalIndex, item }) => {
                          const isMach = item ? isMachineryItem(item) : false;
                          const mainStock = item ? getMainWarehouseStock(item.id) : null;
                          return (
                            <tr
                              key={originalIndex}
                              className="hover:bg-slate-50/70 transition-colors relative"
                              style={{ zIndex: 40 - originalIndex }}
                            >
                              <td className="py-3 px-4 min-w-[360px] sm:min-w-[460px] md:min-w-[520px]">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {isMach ? (
                                      <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                                        🚜 Machinery / Plant
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs">
                                        🧱 Material / Consumable
                                      </span>
                                    )}
                                    {item && (
                                      <span className="text-xs text-slate-500 font-semibold">
                                        Category: <strong className="text-slate-700 font-medium">{item.category}</strong>
                                      </span>
                                    )}
                                  </div>
                                  <SearchableItemSelect
                                    selectedItemId={row.itemId}
                                    onSelectItem={(selected) => handleRowChange(originalIndex, 'itemId', selected.id)}
                                    showStockBadge={true}
                                    defaultClassification={reqModalTab === 'Machinery' ? 'Machinery' : 'Material'}
                                    onlyAvailableStock={onlyAvailableInModal}
                                    placeholder={
                                      reqModalTab === 'Machinery'
                                        ? 'Search & select machinery / equipment...'
                                        : 'Search & select material item...'
                                    }
                                  />
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center text-slate-800 font-bold whitespace-nowrap text-xs sm:text-sm">
                                {item?.unit || 'Nos'}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-700 font-bold whitespace-nowrap text-xs sm:text-sm">
                                <span className={mainStock && mainStock.availableBalance <= 0 ? 'text-rose-600' : 'text-slate-900'}>
                                  {mainStock ? formatNumber(mainStock.availableBalance) : 0}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <input
                                  type="number"
                                  min="1"
                                  step="any"
                                  value={row.requestedQty}
                                  onChange={(e) => handleRowChange(originalIndex, 'requestedQty', e.target.value)}
                                  className="w-28 px-3 py-2 border border-slate-300 focus:border-slate-900 rounded-xl text-xs sm:text-sm font-mono font-bold text-right focus:ring-2 focus:ring-slate-900 bg-white shadow-2xs"
                                  required
                                />
                              </td>
                              <td className="py-3 px-3 text-center">
                                {rows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRow(originalIndex)}
                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Remove item line"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary Badges in Form */}
                <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm text-slate-600 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-3 font-medium">
                    <span>
                      Total Lines: <strong className="text-slate-900 font-bold">{rows.length}</strong>
                    </span>
                    <span>·</span>
                    <span className="text-emerald-700 font-bold">
                      Materials: {materialRowsWithIndex.length}
                    </span>
                    <span>·</span>
                    <span className="text-amber-800 font-bold">
                      Machinery: {machineryRowsWithIndex.length}
                    </span>
                  </div>
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
      {reviewingRequest && (() => {
        const shortageSummary = reviewingRequest.items.reduce(
          (acc, row) => {
            const avail = getMainWarehouseStock(row.itemId).availableBalance;
            if (avail <= 0) acc.outOfStockCount++;
            else if (avail < row.requestedQty) acc.partialStockCount++;
            else acc.inStockCount++;
            return acc;
          },
          { outOfStockCount: 0, partialStockCount: 0, inStockCount: 0 }
        );
        const hasShortage = shortageSummary.outOfStockCount > 0 || shortageSummary.partialStockCount > 0;

        return (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl xl:max-w-5xl w-full p-4 sm:p-5 border border-slate-200 max-h-[94vh] flex flex-col my-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-2.5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-slate-900">
                        Review & Set Approved Quantity
                      </h3>
                      <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                        {reviewingRequest.requestNoteNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>Requesting Site: <strong className="text-slate-800">{sites.find((s) => s.id === reviewingRequest.siteId)?.name}</strong></span>
                      <span>·</span>
                      <span>Requester: <strong className="text-slate-800">{reviewingRequest.requestedBy}</strong></span>
                      <span>·</span>
                      <span>Priority: <strong className={reviewingRequest.priority === 'Emergency' ? 'text-red-700' : 'text-slate-700'}>{reviewingRequest.priority}</strong></span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setReviewingRequest(null);
                    setShowRejectInline(false);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* COMPACT STOCK SHORTAGE NOTICE & FAST ACTIONS (Slim & Space-Saving) */}
              {hasShortage ? (
                <div className="bg-amber-50/90 border border-amber-300 rounded-xl px-3 py-2 mb-2.5 shadow-2xs shrink-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-950 bg-amber-200/90 px-2 py-0.5 rounded-md border border-amber-300">
                        <AlertTriangle className="w-3 h-3 text-amber-700" />
                        <span>Central Stock Shortage</span>
                      </span>
                      {shortageSummary.outOfStockCount > 0 && (
                        <span className="inline-flex items-center text-[11px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded border border-rose-200">
                          🔴 {shortageSummary.outOfStockCount} Out of Stock
                        </span>
                      )}
                      {shortageSummary.partialStockCount > 0 && (
                        <span className="inline-flex items-center text-[11px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200">
                          🟠 {shortageSummary.partialStockCount} Partial Stock
                        </span>
                      )}
                    </div>

                    {/* Compact 1-Click Fast Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={handleSetAllToAvailable}
                        className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                        title="Auto-cap all approved quantities to available stock"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                        <span>⚡ Send Available Only</span>
                      </button>

                      {shortageSummary.outOfStockCount > 0 && (
                        <button
                          type="button"
                          onClick={handleRemoveAllOutOfStock}
                          className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-lg text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                          title="Remove all items with 0 stock from this requisition note"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>🗑️ Remove Out-of-Stock</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShowRejectInline(true);
                          setRejectionReason('Requested items currently unavailable or out of stock at Central Warehouse');
                        }}
                        className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                        title="Reject this requisition"
                      >
                        <XCircle className="w-3.5 h-3.5 text-white" />
                        <span>❌ Reject Request</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 mb-2.5 flex items-center justify-between text-xs text-emerald-800 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>All requested items are <strong>fully in stock</strong> at Central Warehouse.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setApprovalItems((prev) =>
                        prev.map((item) => {
                          const req = reviewingRequest.items.find((r) => r.itemId === item.itemId);
                          return { ...item, approvedQty: req ? req.requestedQty : item.approvedQty };
                        })
                      );
                    }}
                    className="text-[10px] font-bold text-emerald-800 hover:underline px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 cursor-pointer"
                  >
                    Set All Full
                  </button>
                </div>
              )}

              {/* REJECTION FORM BANNER (When activated) */}
              {showRejectInline && (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 mb-2.5 space-y-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Confirm Rejection of Requisition Note: {reviewingRequest.requestNoteNumber}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRejectInline(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                    >
                      Close ✕
                    </button>
                  </div>

                  {/* 1-Click Reason chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-rose-900 mr-1">Quick Reasons:</span>
                    {[
                      'Requested items out of stock at Central Warehouse',
                      'Insufficient inventory - pending supplier replenishment',
                      'Duplicate requisition note',
                      'Project on hold / cancelled by management',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setRejectionReason(chip)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                          rejectionReason === chip
                            ? 'bg-rose-700 text-white border-rose-800 font-semibold shadow-2xs'
                            : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Items currently unavailable in Central Yard or duplicate requisition"
                      className="flex-1 px-3 py-1.5 border border-rose-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleExecuteReject}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <XCircle className="w-3.5 h-3.5 text-white" />
                      <span>Confirm & Reject</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Items Table Container: Spacious to display at least 5 rows comfortably without vertical cramped box */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto overflow-y-auto min-h-[300px] max-h-[460px] flex-1 mb-2.5 bg-white shadow-2xs">
                <table className="w-full text-xs text-left min-w-[640px]">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-3">Item Specs</th>
                      <th className="py-2 px-3 text-right">Main Warehouse Avail.</th>
                      <th className="py-2 px-3 text-right">Site Requested</th>
                      <th className="py-2 px-3 text-right w-48 font-bold text-slate-900">Approved Qty to Dispatch</th>
                      <th className="py-2 px-3 text-center w-28">Item Action</th>
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
                      const isZeroStock = avail <= 0;
                      const isPartialStock = !isZeroStock && avail < row.requestedQty;

                      return (
                        <tr
                          key={row.itemId}
                          className={`transition-colors ${
                            isZeroStock
                              ? 'bg-rose-50/50 hover:bg-rose-50 border-l-4 border-l-rose-500'
                              : isPartialStock
                              ? 'bg-amber-50/40 hover:bg-amber-50 border-l-4 border-l-amber-500'
                              : 'hover:bg-slate-50/50 border-l-4 border-l-transparent'
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                                {itm?.itemCode}
                              </span>
                              {itm && isMachineryItem(itm) ? (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  🚜 Machinery
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  🧱 Material
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-semibold text-slate-800 mt-0.5">{itm?.itemName}</div>
                            {itm?.description && (
                              <div className="text-[10px] text-slate-500 italic line-clamp-1 max-w-[240px]">{itm.description}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                            <div className="flex flex-col items-end">
                              <span className={`font-bold ${isZeroStock ? 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200' : isPartialStock ? 'text-amber-600' : 'text-emerald-700'}`}>
                                {formatNumber(avail)} {itm?.unit}
                              </span>
                              {isZeroStock ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 mt-0.5">
                                  🔴 OUT OF STOCK
                                </span>
                              ) : isPartialStock ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 mt-0.5">
                                  🟠 Partial Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-semibold mt-0.5">
                                  <CheckCircle className="w-2.5 h-2.5" /> In Stock
                                </span>
                              )}
                            </div>
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
                                  className={`w-24 px-2 py-1.5 border rounded-lg text-xs font-mono font-bold text-right focus:outline-none transition-all ${
                                    isExceeding
                                      ? 'border-amber-500 bg-amber-50 text-amber-900 focus:ring-2 focus:ring-amber-500'
                                      : approvedVal === 0
                                      ? 'border-rose-300 bg-rose-50/60 text-rose-800 focus:ring-2 focus:ring-rose-500'
                                      : 'border-slate-300 focus:ring-2 focus:ring-slate-900 bg-white'
                                  }`}
                                  title="Enter the approved quantity to dispatch"
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
                                {avail > 0 && avail !== row.requestedQty && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setApprovalItems((prev) =>
                                        prev.map((item) =>
                                          item.itemId === row.itemId ? { ...item, approvedQty: avail } : item
                                        )
                                      );
                                    }}
                                    className="px-1.5 py-0.5 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold transition-colors cursor-pointer border border-amber-200"
                                    title="Approve max available stock in warehouse"
                                  >
                                    Avail ({avail})
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
                                  className={`px-1.5 py-0.5 text-[10px] rounded transition-colors cursor-pointer ${
                                    approvedVal === 0
                                      ? 'bg-rose-200 text-rose-900 font-bold'
                                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                                  }`}
                                  title="Set 0 (Cannot supply this item)"
                                >
                                  0
                                </button>
                              </div>

                              {isExceeding && (
                                <span className="text-[10px] text-amber-700 font-semibold">
                                  ⚠️ Exceeds stock ({avail} avail)
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Remove from Request button */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemFromRequest(row.itemId)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer mx-auto shadow-2xs hover:border-rose-300 active:scale-95"
                              title="Remove item completely from this requisition note"
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

              {/* Dispatch Notes */}
              <div className="mb-2 shrink-0">
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Dispatch Notes / Remarks</label>
                <input
                  type="text"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="e.g. Dispatched via convoy Flatbed Truck T-08. ETA tomorrow morning."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Bottom Action Bar */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                {!showRejectInline ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectInline(true);
                      setRejectionReason(approvalNotes || 'Requested items unavailable at Central Warehouse');
                    }}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Reject this requisition with reason"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Reject Entire Request</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center justify-end gap-2 w-full sm:w-auto ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewingRequest(null);
                      setShowRejectInline(false);
                    }}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmApproval}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-200" />
                    <span>Approve & Issue Request Note</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded text-[11px] border border-slate-200">
                              {itm?.itemCode}
                            </span>
                            {itm && isMachineryItem(itm) ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                🚜 Machinery
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                🧱 Material
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-800 truncate max-w-[200px] mt-0.5">{itm?.itemName}</div>
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
      )}
    </div>
  );
};
