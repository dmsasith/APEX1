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
  PauseCircle,
  XCircle,
  Search,
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
  isSubSite,
  getParentSite,
  formatSiteHierarchyLabel,
  sortSitesHierarchically,
  canUserManageSourceSite,
} from '../../types';
import { formatNumber, formatDateTime, formatDateTimeParts } from '../../utils/exportUtils';
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
    projects,
    activeProjects,
    updateProject,
    currentUser,
    stockRequests,
    createStockRequest,
    approveStockRequest,
    rejectStockRequest,
    acceptStockRequest,
    deleteStockRequest,
    clearStockRequests,
    getMainWarehouseStock,
    getSiteItemStock,
    clientFreeIssues,
    getClientFreeStockBalance,
    getProjectFreeStockList,
  } = useStock();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedRequestForPrint, setSelectedRequestForPrint] = useState<StockTransferRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-transit' | 'accepted' | 'rejected'>('all');
  const [requestTypeFilter, setRequestTypeFilter] = useState<'all' | 'normal' | 'foc'>('all');
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [activeViewTab, setActiveViewTab] = useState<'requests' | 'foc-materials'>('requests');

  const userAssignedIds = getUserAssignedSiteIds(currentUser, activeSites);

  const isCentralAdmin =
    isCentralOrAllSiteAdmin(currentUser.role) ||
    isUserAllSites(currentUser) ||
    userAssignedIds.some((sid) => activeSites.find((s) => s.id === sid)?.isMainWarehouse === true);

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');

  // Requisition Form State (scoped to user's assigned sites if not Central/All-Sites)
  const branchSites = sortSitesHierarchically(activeSites.filter((s) => !s.isMainWarehouse));

  // Helper to resolve which Site Branch a Project (and its FOC pool) belongs to
  const resolveProjectBranch = (p?: typeof activeProjects[0]): { siteId: string; siteName: string } => {
    if (!p) return { siteId: '', siteName: '' };
    if (p.siteId === 'ALL_AREAS' || (p.siteName && p.siteName.trim().toUpperCase() === 'ALL AREAS')) {
      return { siteId: 'ALL_AREAS', siteName: 'ALL AREAS' };
    }
    if (p.siteId) {
      const matched = sites.find((s) => s.id === p.siteId);
      return { siteId: p.siteId, siteName: matched?.name || p.siteName || '' };
    }
    if (p.parentProjectId) {
      const parent = projects.find((mp) => mp.id === p.parentProjectId);
      if (parent?.siteId === 'ALL_AREAS' || (parent?.siteName && parent.siteName.trim().toUpperCase() === 'ALL AREAS')) {
        return { siteId: 'ALL_AREAS', siteName: 'ALL AREAS' };
      }
      if (parent?.siteId) {
        const matched = sites.find((s) => s.id === parent.siteId);
        return { siteId: parent.siteId, siteName: matched?.name || parent.siteName || '' };
      }
    }
    // Check if any FOC voucher for this project has assignedSiteId
    const voucherWithBranch = (clientFreeIssues || []).find(
      (v) => !v.isDeleted && (v.projectId === p.id || v.parentProjectId === p.id) && v.assignedSiteId
    );
    if (voucherWithBranch?.assignedSiteId === 'ALL_AREAS') {
      return { siteId: 'ALL_AREAS', siteName: 'ALL AREAS' };
    }
    if (voucherWithBranch?.assignedSiteId) {
      const matched = sites.find((s) => s.id === voucherWithBranch.assignedSiteId);
      return {
        siteId: voucherWithBranch.assignedSiteId,
        siteName: matched?.name || voucherWithBranch.assignedSiteName || '',
      };
    }
    // Check if an Approved or Accepted FOC Stock Request exists for this project
    const approvedFocReq = stockRequests.find(
      (r) =>
        (r.status === 'Approved / In-Transit' || r.status === 'Accepted') &&
        r.focProjectId === p.id &&
        r.siteId
    );
    if (approvedFocReq?.siteId) {
      const matched = sites.find((s) => s.id === approvedFocReq.siteId);
      if (matched && !matched.isMainWarehouse) {
        return { siteId: matched.id, siteName: matched.name };
      }
    }
    if (p.siteName) {
      if (p.siteName.trim().toUpperCase() === 'ALL AREAS') {
        return { siteId: 'ALL_AREAS', siteName: 'ALL AREAS' };
      }
      const byName = branchSites.find(
        (s) => s.name.trim().toLowerCase() === p.siteName!.trim().toLowerCase()
      );
      if (byName) return { siteId: byName.id, siteName: byName.name };
    }
    if (p.district) {
      if (p.district.trim().toUpperCase() === 'ALL AREAS') {
        return { siteId: 'ALL_AREAS', siteName: 'ALL AREAS' };
      }
      const dLow = p.district.trim().toLowerCase();
      const byDist = branchSites.find(
        (s) =>
          s.name.trim().toLowerCase().includes(dLow) ||
          dLow.includes(s.name.trim().toLowerCase()) ||
          (s.location && s.location.trim().toLowerCase().includes(dLow))
      );
      if (byDist) return { siteId: byDist.id, siteName: byDist.name };
    }
    return { siteId: '', siteName: p.siteName || '' };
  };

  // Filter client FOC materials by selected branch / user assigned site(s) (ALL_AREAS is open to all branches)
  const filteredClientFocMaterials = useMemo(() => {
    return (clientFreeIssues || []).filter((v) => {
      if (v.isDeleted) return false;
      const projObj = projects.find((p) => p.id === v.projectId);
      const resolvedBranch = resolveProjectBranch(projObj);
      const effectiveSiteId = v.assignedSiteId || resolvedBranch.siteId;

      if (effectiveSiteId === 'ALL_AREAS') {
        return true;
      }

      if (isCentralAdmin) {
        if (selectedBranchFilter !== 'all') {
          if (effectiveSiteId) {
            return effectiveSiteId === selectedBranchFilter;
          }
          const targetSite = sites.find((s) => s.id === selectedBranchFilter);
          if (!targetSite) return true;
          const matchLoc =
            v.storageLocation &&
            v.storageLocation.trim().toLowerCase() === targetSite.name.trim().toLowerCase();
          return matchLoc;
        }
        return true;
      } else {
        if (effectiveSiteId) {
          return userAssignedIds.includes(effectiveSiteId);
        }
        const userSiteNames = userAssignedIds
          .map((sid) => sites.find((s) => s.id === sid)?.name.trim().toLowerCase())
          .filter((n): n is string => Boolean(n));
        if (userSiteNames.length === 0) return false;
        const locLower = (v.storageLocation || '').trim().toLowerCase();
        return userSiteNames.includes(locLower);
      }
    });
  }, [clientFreeIssues, isCentralAdmin, selectedBranchFilter, userAssignedIds, sites, projects, stockRequests]);

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
  const [approvalItems, setApprovalItems] = useState<
    Array<{ itemId: string; approvedQty: number | ''; willNotIssue: boolean; previousApprovedQty?: number }>
  >([]);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalError, setApprovalError] = useState('');
  const [showRejectInline, setShowRejectInline] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Site Acceptance Modal State (Edit Received Amount or Direct Accept)
  const [acceptingRequest, setAcceptingRequest] = useState<StockTransferRequest | null>(null);
  const [receivedItems, setReceivedItems] = useState<Array<{ itemId: string; receivedQty: number | '' }>>([]);
  const [acceptanceNotes, setAcceptanceNotes] = useState('');

  const allowedRequisitionSites = isCentralAdmin
    ? branchSites
    : branchSites.filter((s) => userHasSiteAccess(currentUser, s.id, activeSites));
  const defaultSite =
    allowedRequisitionSites[0]?.id || branchSites[0]?.id || activeSites[0]?.id || '';

  // Separate active items by classification
  const activeMaterialItems = activeItems.filter((i) => !isMachineryItem(i));
  const activeMachineryItems = activeItems.filter((i) => isMachineryItem(i));

  const [formSiteId, setFormSiteId] = useState(defaultSite);
  const formTargetSite = activeSites.find((s) => s.id === formSiteId);
  const formParentSite =
    formTargetSite && isSubSite(formTargetSite) ? getParentSite(formTargetSite, activeSites) : undefined;
  const [formRequestCategory, setFormRequestCategory] = useState<'normal' | 'foc'>('normal');
  const [focScopeFilter, setFocScopeFilter] = useState<'all' | 'main' | 'individual'>('all');
  const [selectedFocProjectId, setSelectedFocProjectId] = useState<string>('');
  const [purpose, setPurpose] = useState('');
  const [priority, setPriority] = useState<RequestPriority>('Normal');
  const [reqModalTab, setReqModalTab] = useState<'Material' | 'Machinery' | 'all'>('Material');
  const [onlyAvailableInModal, setOnlyAvailableInModal] = useState<boolean>(false);

  // Helper to sort items for the currently selected requesting site so Low Stock items come first
  const sortItemsForRequestingSite = (itemList: Item[], siteIdToCheck: string) => {
    if (!siteIdToCheck || siteIdToCheck === 'all') return itemList;
    return [...itemList].sort((a, b) => {
      const aSite = getSiteItemStock(siteIdToCheck, a.id);
      const bSite = getSiteItemStock(siteIdToCheck, b.id);
      const aMain = getMainWarehouseStock(a.id);
      const bMain = getMainWarehouseStock(b.id);

      const getTier = (sStk: typeof aSite) => {
        if (sStk.isLowStock) return 0;
        if (sStk.availableBalance <= sStk.threshold) return 1;
        return 2;
      };
      const aTier = getTier(aSite);
      const bTier = getTier(bSite);
      if (aTier !== bTier) return aTier - bTier;

      const aHasMain = aMain.availableBalance > 0 ? 1 : 0;
      const bHasMain = bMain.availableBalance > 0 ? 1 : 0;
      if (aHasMain !== bHasMain) return bHasMain - aHasMain;

      if (aSite.availableBalance !== bSite.availableBalance) {
        return aSite.availableBalance - bSite.availableBalance;
      }
      return bMain.availableBalance - aMain.availableBalance;
    });
  };

  const sortedMaterialItemsForSite = useMemo(
    () => sortItemsForRequestingSite(activeMaterialItems, formSiteId),
    [activeMaterialItems, formSiteId, getSiteItemStock, getMainWarehouseStock]
  );

  const sortedMachineryItemsForSite = useMemo(
    () => sortItemsForRequestingSite(activeMachineryItems, formSiteId),
    [activeMachineryItems, formSiteId, getSiteItemStock, getMainWarehouseStock]
  );

  // Low stock items at the currently selected requesting site
  const siteLowStockItemsForForm = useMemo(() => {
    if (!formSiteId || formSiteId === 'all') return [];
    return sortItemsForRequestingSite(activeItems, formSiteId).filter((itm) => {
      const sStk = getSiteItemStock(formSiteId, itm.id);
      return sStk.isLowStock || sStk.availableBalance <= sStk.threshold;
    });
  }, [activeItems, formSiteId, getSiteItemStock, getMainWarehouseStock]);

  const [rows, setRows] = useState<Array<{ itemId: string; requestedQty: number }>>([
    { itemId: sortedMaterialItemsForSite[0]?.id || activeMaterialItems[0]?.id || activeItems[0]?.id || '', requestedQty: 50 },
  ]);
  const [formError, setFormError] = useState('');

  // Build structured list of all Root Projects (Major / Main Projects & Individual Projects) with their Resolved Site Branch
  const allFocRootProjectsWithMeta = useMemo(() => {
    const rootProjs = activeProjects.filter((p) => !p.parentProjectId && p.projectScope !== 'sub');
    return rootProjs
      .map((p) => {
        const subProjects = activeProjects.filter((sp) => sp.parentProjectId === p.id);
        const effectiveScope: 'main' | 'individual' =
          p.projectScope === 'main' || subProjects.length > 0 ? 'main' : 'individual';
        const focList = getProjectFreeStockList(p.id);
        const totalFocReceived = focList.reduce((acc, it) => acc + it.totalReceived, 0);
        const totalHqAvail = focList.reduce((acc, it) => acc + it.centralWarehouseAvailable, 0);
        const matchingVoucher = (clientFreeIssues || []).find(
          (v) => !v.isDeleted && (v.projectId === p.id || v.parentProjectId === p.id)
        );
        const clientName = p.customerName || matchingVoucher?.clientName || '';
        const resolvedBranch = resolveProjectBranch(p);
        return {
          project: p,
          effectiveScope,
          subProjects,
          focList,
          totalFocReceived,
          totalHqAvail,
          clientName,
          resolvedSiteId: resolvedBranch.siteId,
          resolvedSiteName: resolvedBranch.siteName,
        };
      })
      .sort((a, b) => {
        if (b.totalHqAvail !== a.totalHqAvail) return b.totalHqAvail - a.totalHqAvail;
        return b.totalFocReceived - a.totalFocReceived;
      });
  }, [activeProjects, getProjectFreeStockList, clientFreeIssues, sites, projects, stockRequests]);

  // Filter FOC Root Projects to those allocated to the currently selected Requesting Site Branch (or its Parent Regional Branch) OR ALL AREAS ('ALL_AREAS')
  const focRootProjectsWithMeta = useMemo(() => {
    if (!formSiteId) return allFocRootProjectsWithMeta;
    return allFocRootProjectsWithMeta.filter(
      (entry) =>
        entry.resolvedSiteId === formSiteId ||
        (Boolean(formParentSite) && entry.resolvedSiteId === formParentSite!.id) ||
        entry.resolvedSiteId === 'ALL_AREAS'
    );
  }, [allFocRootProjectsWithMeta, formSiteId, formParentSite]);

  // Any legacy projects that do not yet have a Site Branch assigned
  const unassignedFocProjects = useMemo(() => {
    return allFocRootProjectsWithMeta.filter((entry) => !entry.resolvedSiteId);
  }, [allFocRootProjectsWithMeta]);

  const filteredFocProjects = useMemo(() => {
    if (focScopeFilter === 'all') return focRootProjectsWithMeta;
    return focRootProjectsWithMeta.filter((entry) => entry.effectiveScope === focScopeFilter);
  }, [focRootProjectsWithMeta, focScopeFilter]);

  const selectedFocProjectMeta = useMemo(() => {
    return (
      filteredFocProjects.find((entry) => entry.project.id === selectedFocProjectId) ||
      focRootProjectsWithMeta.find((entry) => entry.project.id === selectedFocProjectId) ||
      filteredFocProjects[0] ||
      focRootProjectsWithMeta[0] ||
      null
    );
  }, [focRootProjectsWithMeta, filteredFocProjects, selectedFocProjectId]);

  const applyFocProjectSelection = (projId: string, sourceList = allFocRootProjectsWithMeta) => {
    setSelectedFocProjectId(projId);
    const meta = sourceList.find((e) => e.project.id === projId);
    if (meta) {
      const scopeTag = meta.effectiveScope === 'main' ? 'Main Project' : 'Individual Project';
      setPurpose(`Client FOC Transfer (${scopeTag}): [${meta.project.projectId}] ${meta.project.projectName}`);
      if (meta.focList.length > 0) {
        setRows(
          meta.focList.map((focItm) => ({
            itemId: focItm.itemId,
            requestedQty:
              focItm.centralWarehouseAvailable > 0
                ? Math.min(50, focItm.centralWarehouseAvailable)
                : Math.min(10, focItm.totalReceived || 10),
          }))
        );
        setReqModalTab('Material');
      }
    }
  };

  const handleSwitchFormCategory = (cat: 'normal' | 'foc') => {
    setFormRequestCategory(cat);
    setFormError('');
    if (cat === 'foc') {
      const targetMeta = selectedFocProjectMeta || focRootProjectsWithMeta[0];
      if (targetMeta) {
        applyFocProjectSelection(targetMeta.project.id);
      } else {
        setSelectedFocProjectId('');
        setPurpose('');
      }
    } else {
      if (purpose.startsWith('Client FOC Transfer')) {
        setPurpose('');
      }
    }
  };

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
    setRows([
      {
        itemId: sortedMaterialItemsForSite[0]?.id || activeMaterialItems[0]?.id || activeItems[0]?.id || '',
        requestedQty: 10,
      },
    ]);
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
      sortedMaterialItemsForSite.find((i) => !rows.some((r) => r.itemId === i.id)) ||
      sortedMaterialItemsForSite[0] ||
      activeMaterialItems[0] ||
      activeItems[0];
    if (nextItem) {
      setRows((prev) => [...prev, { itemId: nextItem.id, requestedQty: 10 }]);
      setReqModalTab('Material');
    }
  };

  const handleAddMachineryRow = () => {
    const nextItem =
      sortedMachineryItemsForSite.find((i) => !rows.some((r) => r.itemId === i.id)) ||
      sortedMachineryItemsForSite[0] ||
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

    if (formRequestCategory === 'foc' && !selectedFocProjectMeta) {
      setFormError('Please select the Assigned Project (Major / Main Project or Individual Project) for this Client Free Stock request.');
      return;
    }

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

    const activeFocProj = formRequestCategory === 'foc' ? selectedFocProjectMeta : null;

    createStockRequest({
      siteId: formSiteId,
      priority,
      purpose:
        purpose.trim() ||
        (activeFocProj
          ? `Client FOC Transfer: [${activeFocProj.project.projectId}] ${activeFocProj.project.projectName}`
          : 'General site requisition'),
      requestCategory: formRequestCategory,
      focProjectId: activeFocProj ? activeFocProj.project.id : undefined,
      focProjectCode: activeFocProj ? activeFocProj.project.projectId : undefined,
      focProjectName: activeFocProj ? activeFocProj.project.projectName : undefined,
      focProjectScope: activeFocProj ? activeFocProj.effectiveScope : undefined,
      focClientName: activeFocProj ? activeFocProj.clientName || undefined : undefined,
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
      req.items.map((row) => {
        const isIdle = Boolean(row.willNotIssue) || row.approvedQty === 0;
        const qty = isIdle ? 0 : (row.approvedQty ?? row.requestedQty);
        return {
          itemId: row.itemId,
          approvedQty: qty,
          willNotIssue: isIdle,
          previousApprovedQty: row.requestedQty,
        };
      })
    );
    setApprovalNotes('');
    setApprovalError('');
    setShowRejectInline(false);
  };

  const handleConfirmApproval = () => {
    if (!reviewingRequest) return;
    setApprovalError('');
    const normalizedApproval = approvalItems.map((item) => {
      const qty = item.willNotIssue ? 0 : Math.max(0, Number(item.approvedQty || 0));
      const isWillNotIssue = item.willNotIssue || qty <= 0;
      return {
        itemId: item.itemId,
        approvedQty: qty,
        willNotIssue: isWillNotIssue,
      };
    });

    const hasIssuedItem = normalizedApproval.some((item) => !item.willNotIssue && item.approvedQty > 0);
    if (!hasIssuedItem) {
      setApprovalError(
        'All items are currently set to "Will Not Issue" (0). Restore at least one item with a positive quantity, or click "Reject Entire Request".'
      );
      return;
    }

    approveStockRequest(reviewingRequest.id, normalizedApproval, approvalNotes.trim());
    setReviewingRequest(null);
  };

  // Toggle an item between idle "Will Not Issue" (keeps row in Request Note at 0) and active/restored
  const handleToggleWillNotIssue = (itemId: string) => {
    if (!reviewingRequest) return;
    setApprovalError('');
    const origRow = reviewingRequest.items.find((i) => i.itemId === itemId);
    const fallbackQty = origRow ? origRow.requestedQty : 1;
    setApprovalItems((prev) =>
      prev.map((item) => {
        if (item.itemId !== itemId) return item;
        if (!item.willNotIssue) {
          const currentNum = Number(item.approvedQty || 0);
          return {
            ...item,
            previousApprovedQty: currentNum > 0 ? currentNum : (item.previousApprovedQty || fallbackQty),
            approvedQty: 0,
            willNotIssue: true,
          };
        }
        const avail = getRequestItemAvailableBalance(reviewingRequest, itemId);
        const restored =
          item.previousApprovedQty && item.previousApprovedQty > 0
            ? item.previousApprovedQty
            : avail > 0
            ? Math.min(fallbackQty, avail)
            : fallbackQty;
        return {
          ...item,
          approvedQty: restored,
          willNotIssue: false,
        };
      })
    );
  };

  // Helper to get available balance for a request item (supports Main Stock, Parent Regional Branch Stock for Sub-Sites, and Project FOC Pool)
  const getRequestItemAvailableBalance = (req: StockTransferRequest, itemId: string): number => {
    const sourceSite = req.sourceSiteId ? sites.find((s) => s.id === req.sourceSiteId) : undefined;
    if (req.sourceSiteId && sourceSite && !sourceSite.isMainWarehouse) {
      return getSiteItemStock(req.sourceSiteId, itemId).availableBalance;
    }
    if (req.requestCategory === 'foc' && req.focProjectId) {
      return getClientFreeStockBalance(req.focProjectId, itemId).centralWarehouseAvailable;
    }
    return getMainWarehouseStock(itemId).availableBalance;
  };

  // 1-Click: Send only available stock (caps approvedQty to warehouse/FOC balance, marks 0-stock items as idle Will Not Issue)
  const handleSetAllToAvailable = () => {
    if (!reviewingRequest) return;
    setApprovalError('');
    setApprovalItems((prev) =>
      prev.map((item) => {
        const avail = getRequestItemAvailableBalance(reviewingRequest, item.itemId);
        const originalReq = reviewingRequest.items.find((r) => r.itemId === item.itemId);
        const reqQty = originalReq ? originalReq.requestedQty : Number(item.approvedQty || 0);
        const capped = Math.max(0, Math.min(reqQty, avail));
        return {
          ...item,
          approvedQty: capped,
          willNotIssue: capped <= 0,
          previousApprovedQty: capped > 0 ? capped : (item.previousApprovedQty || reqQty),
        };
      })
    );
  };

  // 1-Click: Put all 0-stock items into idle "Will Not Issue" state without removing them from Request Note
  const handleMarkOutOfStockWillNotIssue = () => {
    if (!reviewingRequest) return;
    setApprovalError('');
    setApprovalItems((prev) =>
      prev.map((item) => {
        const avail = getRequestItemAvailableBalance(reviewingRequest, item.itemId);
        if (avail > 0) return item;
        const originalReq = reviewingRequest.items.find((r) => r.itemId === item.itemId);
        const currentNum = Number(item.approvedQty || 0);
        return {
          ...item,
          previousApprovedQty:
            currentNum > 0 ? currentNum : (item.previousApprovedQty || originalReq?.requestedQty || 1),
          approvedQty: 0,
          willNotIssue: true,
        };
      })
    );
  };

  const handleExecuteReject = () => {
    if (!reviewingRequest) return;
    const srcSite = reviewingRequest.sourceSiteId ? sites.find((s) => s.id === reviewingRequest.sourceSiteId) : undefined;
    const defaultRejectMsg =
      srcSite && !srcSite.isMainWarehouse ? `Rejected by Parent Branch (${srcSite.name})` : 'Rejected by Central Logistics';
    rejectStockRequest(reviewingRequest.id, rejectionReason.trim() || defaultRejectMsg);
    setReviewingRequest(null);
    setShowRejectInline(false);
    setRejectionReason('');
  };

  // Direct Accept Handler (only issues positive approved items; unissued rows stay at 0)
  const handleDirectAccept = (req: StockTransferRequest) => {
    const fullApprovedItems = req.items.map((r) => {
      const isNotIssued = Boolean(r.willNotIssue) || (r.approvedQty !== undefined && Number(r.approvedQty) <= 0);
      return {
        itemId: r.itemId,
        receivedQty: isNotIssued ? 0 : (r.approvedQty ?? r.requestedQty),
      };
    });
    acceptStockRequest(req.id, fullApprovedItems, 'Directly accepted full dispatched quantity.');
  };

  // Open Edit Received Amount & Accept Dialog (excludes "Will Not Issue" items from physical gate count)
  const handleOpenEditAcceptModal = (req: StockTransferRequest) => {
    setAcceptingRequest(req);
    setReceivedItems(
      req.items.map((r) => {
        const isNotIssued = Boolean(r.willNotIssue) || (r.approvedQty !== undefined && Number(r.approvedQty) <= 0);
        return {
          itemId: r.itemId,
          receivedQty: isNotIssued ? 0 : (r.receivedQty ?? (r.approvedQty ?? r.requestedQty)),
        };
      })
    );
    setAcceptanceNotes('');
  };

  const handleConfirmAcceptance = () => {
    if (!acceptingRequest) return;
    const normalizedReceived = acceptingRequest.items.map((origRow) => {
      const isNotIssued =
        Boolean(origRow.willNotIssue) || (origRow.approvedQty !== undefined && Number(origRow.approvedQty) <= 0);
      if (isNotIssued) {
        return { itemId: origRow.itemId, receivedQty: 0 };
      }
      const match = receivedItems.find((item) => item.itemId === origRow.itemId);
      return {
        itemId: origRow.itemId,
        receivedQty: Math.max(0, Number(match?.receivedQty || 0)),
      };
    });
    acceptStockRequest(
      acceptingRequest.id,
      normalizedReceived,
      acceptanceNotes.trim() || 'Received with verification notes.'
    );
    setAcceptingRequest(null);
  };

  // Filter requests based on user role, assigned site(s) (both requesting site & parent source branch), branch filter, request category, and search query
  const visibleRequests = stockRequests.filter((req) => {
    if (isCentralAdmin) {
      if (
        selectedBranchFilter !== 'all' &&
        req.siteId !== selectedBranchFilter &&
        req.sourceSiteId !== selectedBranchFilter
      ) {
        return false;
      }
    } else {
      const hasDestAccess = userHasSiteAccess(currentUser, req.siteId, activeSites);
      const hasSourceAccess = Boolean(
        req.sourceSiteId && userHasSiteAccess(currentUser, req.sourceSiteId, activeSites)
      );
      if (!hasDestAccess && !hasSourceAccess) return false;
      if (
        selectedBranchFilter !== 'all' &&
        req.siteId !== selectedBranchFilter &&
        req.sourceSiteId !== selectedBranchFilter
      ) {
        return false;
      }
    }

    if (requestTypeFilter === 'foc' && req.requestCategory !== 'foc') return false;
    if (requestTypeFilter === 'normal' && req.requestCategory === 'foc') return false;

    if (tableSearchQuery.trim()) {
      const q = tableSearchQuery.toLowerCase().trim();
      const site = sites.find((s) => s.id === req.siteId);
      const matchesMeta =
        req.requestNoteNumber.toLowerCase().includes(q) ||
        (site && site.name.toLowerCase().includes(q)) ||
        (req.purpose && req.purpose.toLowerCase().includes(q)) ||
        (req.focProjectName && req.focProjectName.toLowerCase().includes(q)) ||
        (req.focProjectCode && req.focProjectCode.toLowerCase().includes(q)) ||
        (req.focClientName && req.focClientName.toLowerCase().includes(q)) ||
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
      <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold tracking-wider uppercase">
              <span>Inter-Branch Requisitions</span>
              <span aria-hidden="true" className="text-emerald-400/50">·</span>
              <span className="text-emerald-200">Official Material Transfer Workflow</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Request Stock to Site & Request Notes
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Site Admins requisition required materials from the Main Warehouse. Central Logistics approves quantities, generates the official Request Note, and sites verify/accept incoming shipments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isCentralAdmin && stockRequests.length > 0 && (
              <button
                onClick={handleClearAllRequests}
                className="px-3.5 py-2.5 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 border border-rose-400/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                title="Clear all material transfer requisitions"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Requests</span>
              </button>
            )}
            <button
              onClick={() => {
                const targetSite = formSiteId || defaultSite;
                const sortedMat = sortItemsForRequestingSite(activeMaterialItems, targetSite);
                if (sortedMat[0]) {
                  setRows([{ itemId: sortedMat[0].id, requestedQty: 50 }]);
                }
                setShowSubmitModal(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/25 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>New Stock Requirement Form</span>
            </button>
          </div>
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
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-3.5">Item Code</th>
                          <th className="py-3 px-3.5">Material Description</th>
                          <th className="py-3 px-3.5 text-center">Unit</th>
                          <th className="py-3 px-3.5 text-right">FOC Received Qty</th>
                          <th className="py-3 px-3.5 text-right">Dispatched to Sites</th>
                          <th className="py-3 px-3.5 text-right">Central Pool Bal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {foc.items.map((row: ClientFreeIssueItemRow, idx: number) => {
                          const itm = items.find((i) => i.id === row.itemId);
                          const bal = getClientFreeStockBalance(foc.projectId, row.itemId);
                          return (
                            <tr key={idx} className="bg-white hover:bg-slate-50/80">
                              <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                                {itm?.itemCode || 'ITEM'}
                              </td>
                              <td className="py-3 px-3.5 font-bold text-slate-900">
                                {itm?.itemName || 'Material Item'}
                              </td>
                              <td className="py-3 px-3.5 text-center font-medium text-slate-600">{itm?.unit || 'units'}</td>
                              <td className="py-3 px-3.5 text-right font-mono font-bold text-indigo-700">
                                {formatNumber(row.quantity)} {itm?.unit}
                              </td>
                              <td className="py-3 px-3.5 text-right font-mono font-bold text-sky-700">
                                {bal.dispatchedToSites > 0 ? `-${formatNumber(bal.dispatchedToSites)}` : '0'} {itm?.unit}
                              </td>
                              <td className="py-3 px-3.5 text-right font-mono font-extrabold text-emerald-700">
                                {formatNumber(bal.centralWarehouseAvailable)} {itm?.unit}
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

          <div className="flex flex-wrap items-center gap-2">
            {/* Request Category Filter (Normal vs Client FOC) */}
            <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-semibold shadow-2xs">
              <button
                type="button"
                onClick={() => setRequestTypeFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  requestTypeFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Types
              </button>
              <button
                type="button"
                onClick={() => setRequestTypeFilter('normal')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  requestTypeFilter === 'normal'
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📦 Normal Stock
              </button>
              <button
                type="button"
                onClick={() => setRequestTypeFilter('foc')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  requestTypeFilter === 'foc'
                    ? 'bg-indigo-700 text-white'
                    : 'text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                🎁 Client FOC Stock
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
                    const count = stockRequests.filter((r) => r.siteId === b.id || r.sourceSiteId === b.id).length;
                    return (
                      <option key={b.id} value={b.id}>
                        {formatSiteHierarchyLabel(b, activeSites)} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
      </div>

      {/* Active Notifications Banner if any request is Approved / Dispatched */}
      {stockRequests.some((r) => r.status === 'Approved / In-Transit') && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950 flex-1">
            <strong className="text-sm font-bold block mb-0.5">
              Approved Shipments Allocated to Site Branches (Deducted from Central Stock)
            </strong>
            Approved quantities have already been <strong>deducted from Main Stock / Client FOC Central Pool</strong> and are <strong>live in Site Branch Stock</strong>. Destination Site Admins can click <strong>&quot;Mark Received&quot;</strong> or <strong>&quot;Count &amp; Receive&quot;</strong> to log final physical verification.
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
              placeholder="Search requisition #, branch, project, item, machinery..."
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
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-2 whitespace-nowrap">Request Note #</th>
                <th className="py-3 px-1.5 whitespace-nowrap">Date &amp; Time</th>
                <th className="py-3 px-2 whitespace-nowrap">Site Branch</th>
                <th className="py-3 px-1.5 whitespace-nowrap">Priority</th>
                <th className="py-3 px-2 min-w-[240px]">Items &amp; Material Description Summary</th>
                <th className="py-3 px-2 whitespace-nowrap">Status</th>
                <th className="py-3 px-2 text-right whitespace-nowrap">Workflow Actions</th>
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
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
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
                  const dtParts = formatDateTimeParts(req.requestedDate);

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-2 font-mono font-bold text-slate-900 whitespace-nowrap align-top">
                        <div className="text-[13px] leading-tight">{req.requestNoteNumber}</div>
                        {req.requestCategory === 'foc' ? (
                          <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10.5px] font-sans font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                            🎁 Client FOC
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10.5px] font-sans font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            📦 Normal Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-1.5 text-slate-700 font-mono text-[11.5px] whitespace-nowrap align-top leading-tight">
                        <div className="font-semibold text-slate-800">{dtParts.date}</div>
                        {dtParts.time && (
                          <div className="text-[10.5px] text-slate-500 mt-0.5">{dtParts.time}</div>
                        )}
                      </td>
                      <td className="py-3 px-2 align-top max-w-[140px]">
                        <div className="font-bold text-slate-900 text-[13px] leading-tight truncate" title={site?.name}>
                          {site && isSubSite(site) ? `↳ ${site.name}` : site?.name}
                        </div>
                        <div className="text-[10.5px] text-sky-700 font-semibold mt-0.5 truncate" title={req.sourceSiteName || 'Main Central Warehouse'}>
                          From: {req.sourceSiteName || 'Main Warehouse'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate" title={req.requestedBy}>
                          By: {req.requestedBy}
                        </div>
                      </td>
                      <td className="py-3 px-1.5 whitespace-nowrap align-top">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
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
                      <td className="py-3 px-2 align-top">
                        {req.requestCategory === 'foc' && (req.focProjectName || req.focProjectCode) && (
                          <div className="mb-2 px-2.5 py-1.5 rounded-xl bg-indigo-50/85 border border-indigo-200/90 text-xs text-indigo-950 shadow-2xs">
                            <div className="flex items-center gap-1.5 flex-wrap font-bold">
                              <span className="px-1.5 py-0.5 rounded-md bg-indigo-700 text-white text-[10px] uppercase tracking-wider shrink-0">
                                {req.focProjectScope === 'main' ? '🏢 Main Project' : '📄 Individual Project'}
                              </span>
                              <span className="font-mono text-indigo-800">{req.focProjectCode}</span>
                              <span className="text-indigo-400">·</span>
                              <span className="truncate">{req.focProjectName}</span>
                            </div>
                            {req.focClientName && (
                              <div className="text-[11px] text-indigo-700 mt-0.5">
                                Client Free Pool: <strong>{req.focClientName}</strong>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Clean ERP-style Aligned Line-Item Breakdown */}
                        <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
                          <div className="grid grid-cols-[minmax(0,1fr)_136px] items-center gap-1.5 px-2.5 py-1.5 bg-slate-50/95 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                            <span className="truncate">
                              Item Description ({req.items.length} {req.items.length === 1 ? 'Item' : 'Items'})
                            </span>
                            <div className="grid grid-cols-3 gap-1 text-right">
                              <span>Req</span>
                              <span className="text-sky-700">Apprv</span>
                              <span className="text-emerald-700">Recv</span>
                            </div>
                          </div>

                          <div className="divide-y divide-slate-100">
                            {req.items.map((row, idx) => {
                              const itm = items.find((i) => i.id === row.itemId);
                              const isMach = itm ? isMachineryItem(itm) : false;
                              const isNotIssued =
                                (req.status === 'Approved / In-Transit' || req.status === 'Accepted') &&
                                (Boolean(row.willNotIssue) || row.approvedQty === 0);
                              const isPartialRecv =
                                !isNotIssued &&
                                row.receivedQty !== undefined &&
                                row.approvedQty !== undefined &&
                                row.receivedQty < row.approvedQty;

                              return (
                                <div
                                  key={row.itemId}
                                  className={`grid grid-cols-[minmax(0,1fr)_136px] items-center gap-1.5 px-2.5 py-1.5 transition-colors ${
                                    isNotIssued ? 'bg-slate-50/80 opacity-80' : 'hover:bg-slate-50/70'
                                  }`}
                                >
                                  {/* Left: Clean Item Name + Code / Type Subtitle */}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="text-[10px] font-bold text-slate-400 font-mono tabular-nums shrink-0">
                                        {idx + 1}.
                                      </span>
                                      <span
                                        className={`font-bold text-xs leading-snug truncate ${
                                          isNotIssued ? 'text-slate-500' : 'text-slate-900'
                                        }`}
                                        title={itm?.itemName || 'Material Item'}
                                      >
                                        {itm?.itemName || 'Material Item'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5 pl-4 flex-wrap">
                                      <span className="font-mono font-bold text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80">
                                        {itm?.itemCode || 'ITEM'}
                                      </span>
                                      {isMach ? (
                                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80">
                                          Machinery
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50/80 px-1.5 py-0.5 rounded border border-emerald-200/70">
                                          Material
                                        </span>
                                      )}
                                      {itm?.unit && (
                                        <span className="text-[10px] font-semibold text-slate-400">
                                          Unit: {itm.unit}
                                        </span>
                                      )}
                                      {isNotIssued && (
                                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                          Will Not Issue
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Right: Fixed Aligned Qty Columns (Req / Apprv / Recv) */}
                                  <div className="grid grid-cols-3 gap-1 items-center text-right font-mono tabular-nums text-[11.5px] shrink-0">
                                    <span className="font-extrabold text-slate-900 bg-slate-100/90 px-1 py-0.5 rounded border border-slate-200/80 truncate">
                                      {formatNumber(row.requestedQty)}
                                    </span>
                                    <span
                                      className={`px-1 py-0.5 rounded font-bold truncate ${
                                        isNotIssued
                                          ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                          : row.approvedQty !== undefined
                                          ? 'bg-sky-50 text-sky-900 border border-sky-200/80'
                                          : 'text-slate-300 font-normal'
                                      }`}
                                      title={isNotIssued ? 'Marked Will Not Issue (kept on Request Note)' : undefined}
                                    >
                                      {row.approvedQty !== undefined ? formatNumber(row.approvedQty) : '—'}
                                    </span>
                                    <span
                                      className={`px-1 py-0.5 rounded font-extrabold truncate ${
                                        isNotIssued
                                          ? 'bg-slate-100 text-slate-400 border border-slate-200 font-semibold'
                                          : row.receivedQty !== undefined
                                          ? isPartialRecv
                                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200/90'
                                          : 'text-slate-300 font-normal'
                                      }`}
                                    >
                                      {row.receivedQty !== undefined ? formatNumber(row.receivedQty) : '—'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {req.purpose && (
                          <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-slate-50/90 border border-slate-200/70 text-[11px] text-slate-600 flex items-baseline gap-1.5">
                            <span className="font-extrabold uppercase tracking-wider text-[9.5px] text-slate-400 shrink-0">
                              Purpose:
                            </span>
                            <span className="truncate" title={req.purpose}>
                              {req.purpose}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap align-top">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11.5px] font-bold ${
                            req.status === 'Accepted'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : req.status === 'Approved / In-Transit'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : req.status === 'Pending Approval'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {req.status === 'Accepted' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                          {req.status === 'Approved / In-Transit' && <Clock className="w-3.5 h-3.5 text-blue-600" />}
                          <span>{req.status}</span>
                        </span>
                      </td>

                      {/* Workflow Actions */}
                      <td className="py-3 px-2 text-right whitespace-nowrap align-top">
                        <div className="flex items-center justify-end gap-1">
                          {/* 1. Print Official Request Note */}
                          <button
                            onClick={() => setSelectedRequestForPrint(req)}
                            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                            title="View / Print Official Request Note"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Delete Requisition Note (Main Admin only) */}
                          {isCentralAdmin && (
                            <button
                              onClick={() => handleDeleteRequest(req)}
                              className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete / cancel this requisition note"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* 2. Central Admin OR Parent Regional Branch Admin Review & Approve or Reject */}
                          {req.status === 'Pending Approval' &&
                            canUserManageSourceSite(currentUser, req.sourceSiteId, activeSites) && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenApproveModal(req)}
                                className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
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
                                className="px-2 py-1.5 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                                title="Reject this requisition request"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Reject</span>
                              </button>
                            </div>
                          )}

                          {/* 3. Site Admin Acceptance Actions (Accept directly OR Edit Received Amount) */}
                          {req.status === 'Approved / In-Transit' && isSiteReceiver && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDirectAccept(req)}
                                className="px-2.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                                title="Confirm full shipment received into site inventory"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Mark Received</span>
                              </button>
                              <button
                                onClick={() => handleOpenEditAcceptModal(req)}
                                className="px-2 py-1.5 rounded bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-300 transition-colors flex items-center gap-1 shadow-2xs"
                                title="Edit Received Amount before accepting (in case of damages or shortage)"
                              >
                                <Edit2 className="w-3 h-3 text-slate-600" />
                                <span>Count & Receive</span>
                              </button>
                            </div>
                          )}

                          {req.status === 'Accepted' && (
                            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/80 rounded-md px-2 py-1">
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
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-sm ${
                  formRequestCategory === 'foc' ? 'bg-indigo-700' : 'bg-slate-900'
                }`}>
                  <ArrowRightLeft className={`w-5 h-5 ${formRequestCategory === 'foc' ? 'text-indigo-200' : 'text-emerald-400'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900">
                    {formParentSite
                      ? `Submit Stock Requirement Form to Parent Branch (${formParentSite.name})`
                      : 'Submit Stock Requirement Form to Main Branch'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {formParentSite
                      ? `Sub-Site requisition routed to Parent Regional Site Branch (${formParentSite.name}) for stock allocation`
                      : formRequestCategory === 'foc'
                      ? 'Request Client Free-Issue (FOC) stock from Central Warehouse Pool for an Assigned Main or Individual Project'
                      : 'Official site requisition for standard company-owned construction materials or heavy machinery & equipment'}
                  </p>
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

            {/* 2-TAB REQUISITION SOURCE MODE SWITCHER (Normal Stock Request vs Client Free Stock for Assigned Project Request) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 p-1.5 bg-slate-100/90 border border-slate-200/90 rounded-2xl">
              <button
                type="button"
                onClick={() => handleSwitchFormCategory('normal')}
                className={`flex items-start gap-3.5 p-3.5 rounded-xl text-left transition-all cursor-pointer border ${
                  formRequestCategory === 'normal'
                    ? 'bg-white border-emerald-500/80 shadow-md ring-2 ring-emerald-500/15'
                    : 'bg-transparent border-transparent hover:bg-white/60 text-slate-600'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg ${
                    formRequestCategory === 'normal'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  📦
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-bold text-sm ${formRequestCategory === 'normal' ? 'text-slate-900' : 'text-slate-700'}`}>
                      1. Normal Stock Request
                    </span>
                    {formRequestCategory === 'normal' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                        Active Mode
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {formParentSite
                      ? `Request materials & machinery from Parent Site Branch (${formParentSite.name}).`
                      : 'Request general company-owned materials & machinery from Central Main Warehouse (GRN Stock).'}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchFormCategory('foc')}
                className={`flex items-start gap-3.5 p-3.5 rounded-xl text-left transition-all cursor-pointer border ${
                  formRequestCategory === 'foc'
                    ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/15'
                    : 'bg-transparent border-transparent hover:bg-white/60 text-slate-600'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg ${
                    formRequestCategory === 'foc'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  🎁
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-bold text-sm ${formRequestCategory === 'foc' ? 'text-indigo-950' : 'text-slate-700'}`}>
                      2. Client Free Stock for Assigned Project Request
                    </span>
                    {formRequestCategory === 'foc' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-300 uppercase">
                        Active Mode
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Request Client Free-Issue (FOC) items by <strong>Major / Main Project</strong> or <strong>Individual Project</strong>. Deducts from Central FOC Pool to Site.
                  </p>
                </div>
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5 flex-1 flex flex-col">
              {/* STEP 1: REQUESTING SITE BRANCH & PRIORITY (Controls Exclusive Branch Project Filtering) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Requesting Site Branch *
                  </label>
                  <select
                    value={formSiteId}
                    onChange={(e) => {
                      const nextSiteId = e.target.value;
                      setFormSiteId(nextSiteId);
                      setFormError('');
                      if (formRequestCategory === 'normal' && rows.length === 1) {
                        const sortedMat = sortItemsForRequestingSite(activeMaterialItems, nextSiteId);
                        if (sortedMat[0]) {
                          setRows([{ itemId: sortedMat[0].id, requestedQty: rows[0].requestedQty || 50 }]);
                        }
                      } else if (formRequestCategory === 'foc') {
                        const siteProjects = allFocRootProjectsWithMeta.filter(
                          (entry) => entry.resolvedSiteId === nextSiteId && (focScopeFilter === 'all' || entry.effectiveScope === focScopeFilter)
                        );
                        const fallbackAllScope = allFocRootProjectsWithMeta.filter(
                          (entry) => entry.resolvedSiteId === nextSiteId
                        );
                        const targetMeta = siteProjects[0] || fallbackAllScope[0];
                        if (targetMeta) {
                          if (!siteProjects[0] && fallbackAllScope[0]) {
                            setFocScopeFilter('all');
                          }
                          applyFocProjectSelection(targetMeta.project.id);
                        } else {
                          setSelectedFocProjectId('');
                          setPurpose('');
                        }
                      }
                    }}
                    disabled={!isCentralAdmin && allowedRequisitionSites.length <= 1}
                    className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none font-bold text-slate-900 shadow-2xs disabled:bg-slate-100 cursor-pointer"
                    required
                  >
                    {(allowedRequisitionSites.length > 0 ? allowedRequisitionSites : branchSites).map((s) => (
                      <option key={s.id} value={s.id}>
                        {isSubSite(s) ? '📍 ' : '🏢 '}
                        {formatSiteHierarchyLabel(s, activeSites, true)}
                      </option>
                    ))}
                  </select>
                  {formParentSite && (
                    <div className="mt-1.5 text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg">
                      Supplied by Parent Site Branch: <strong>{formParentSite.name}</strong>
                    </div>
                  )}
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

              {/* DEDICATED CLIENT FREE STOCK (FOC) PROJECT SELECTION PANEL */}
              {formRequestCategory === 'foc' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/70 border-2 border-indigo-200 shadow-xs space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-indigo-200/80 pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-700 text-white uppercase tracking-wider">
                          🎁 Client Free Stock (FOC) Allocation
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          🏢 Exclusive Branch Filter: {branchSites.find((s) => s.id === formSiteId)?.name || 'Selected Site Branch'} ({focRootProjectsWithMeta.length} Assigned Projects)
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Only projects allocated to <strong>{branchSites.find((s) => s.id === formSiteId)?.name || 'this Site Branch'}</strong> are shown below so client free stock never mixes between branches. Materials are dispatched from <strong>Main Central Warehouse (HQ FOC Pool)</strong> to your branch.
                      </p>
                    </div>

                    {/* Scope Filter Pills: All / Major (Main) Projects / Individual Projects */}
                    <div className="inline-flex items-center bg-indigo-100/90 p-1 rounded-xl border border-indigo-200 shrink-0 self-start">
                      <button
                        type="button"
                        onClick={() => {
                          setFocScopeFilter('all');
                          const nextList = focRootProjectsWithMeta;
                          if (nextList.length > 0 && !nextList.some((m) => m.project.id === selectedFocProjectId)) {
                            applyFocProjectSelection(nextList[0].project.id);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          focScopeFilter === 'all'
                            ? 'bg-indigo-900 text-white shadow-2xs'
                            : 'text-indigo-900 hover:bg-white/60'
                        }`}
                      >
                        All ({focRootProjectsWithMeta.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFocScopeFilter('main');
                          const nextList = focRootProjectsWithMeta.filter((m) => m.effectiveScope === 'main');
                          if (nextList.length > 0 && !nextList.some((m) => m.project.id === selectedFocProjectId)) {
                            applyFocProjectSelection(nextList[0].project.id);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          focScopeFilter === 'main'
                            ? 'bg-indigo-700 text-white shadow-2xs'
                            : 'text-indigo-900 hover:bg-white/60'
                        }`}
                      >
                        <span>🏢 Major / Main Projects</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-800/20">
                          {focRootProjectsWithMeta.filter((m) => m.effectiveScope === 'main').length}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFocScopeFilter('individual');
                          const nextList = focRootProjectsWithMeta.filter((m) => m.effectiveScope === 'individual');
                          if (nextList.length > 0 && !nextList.some((m) => m.project.id === selectedFocProjectId)) {
                            applyFocProjectSelection(nextList[0].project.id);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          focScopeFilter === 'individual'
                            ? 'bg-teal-700 text-white shadow-2xs'
                            : 'text-indigo-900 hover:bg-white/60'
                        }`}
                      >
                        <span>📄 Individual Projects</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-800/20">
                          {focRootProjectsWithMeta.filter((m) => m.effectiveScope === 'individual').length}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Assigned Project Selector + Active Project FOC Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    <div className="lg:col-span-6">
                      <label className="block text-xs font-bold text-indigo-950 mb-1.5 uppercase tracking-wide">
                        Assigned Project for {branchSites.find((s) => s.id === formSiteId)?.name || 'Selected Branch'} *
                      </label>
                      {filteredFocProjects.length === 0 ? (
                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                          <div className="font-bold">
                            ⚠️ No {focScopeFilter === 'main' ? 'Major / Main ' : focScopeFilter === 'individual' ? 'Individual ' : ''}Projects are currently assigned to <span className="underline">{branchSites.find((s) => s.id === formSiteId)?.name || 'this Site Branch'}</span>.
                          </div>
                          <div className="text-[11px] text-amber-800">
                            Projects belonging to other branches are hidden to prevent cross-branch stock mix-ups. Register or assign a project to <strong>{branchSites.find((s) => s.id === formSiteId)?.name}</strong> in <strong>7. Project Registry</strong>.
                          </div>
                          {unassignedFocProjects.length > 0 && (
                            <div className="pt-2 border-t border-amber-200/80 space-y-1.5">
                              <div className="text-[11px] font-bold text-indigo-950">
                                🔗 Quick-Assign an Unassigned Project to {branchSites.find((s) => s.id === formSiteId)?.name}:
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {unassignedFocProjects.map((uMeta) => (
                                  <button
                                    key={uMeta.project.id}
                                    type="button"
                                    onClick={async () => {
                                      const targetBranch = branchSites.find((s) => s.id === formSiteId);
                                      if (!targetBranch) return;
                                      await updateProject(uMeta.project.id, {
                                        siteId: targetBranch.id,
                                        siteName: targetBranch.name,
                                      });
                                      setFocScopeFilter('all');
                                      applyFocProjectSelection(uMeta.project.id);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                                  >
                                    + Assign {uMeta.project.projectId} ({uMeta.project.projectName}) to {branchSites.find((s) => s.id === formSiteId)?.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <select
                          value={selectedFocProjectMeta?.project.id || ''}
                          onChange={(e) => applyFocProjectSelection(e.target.value)}
                          className="w-full px-3.5 py-2.5 border-2 border-indigo-300 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-indigo-700 focus:outline-none font-bold text-slate-900 shadow-2xs cursor-pointer"
                          required={formRequestCategory === 'foc'}
                        >
                          {filteredFocProjects.map((meta) => (
                            <option key={meta.project.id} value={meta.project.id}>
                              {meta.effectiveScope === 'main' ? '🏢 [MAIN PROJECT] ' : '📄 [INDIVIDUAL] '}
                              {meta.project.projectId} — {meta.project.projectName}
                              {meta.clientName ? ` (Client: ${meta.clientName})` : ''} • {meta.focList.length} FOC items avail.
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Selected Project Pool Details Card */}
                    <div className="lg:col-span-6">
                      {selectedFocProjectMeta ? (
                        <div className="p-3.5 rounded-xl bg-white border border-indigo-200 shadow-2xs space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                                  selectedFocProjectMeta.effectiveScope === 'main'
                                    ? 'bg-indigo-700 text-white'
                                    : 'bg-teal-700 text-white'
                                }`}
                              >
                                {selectedFocProjectMeta.effectiveScope === 'main'
                                  ? `🏢 Major / Main Project (${selectedFocProjectMeta.subProjects.length} Sub-Projects)`
                                  : '📄 Individual Standalone Project'}
                              </span>
                              <span className="font-mono text-xs font-bold text-indigo-800">
                                {selectedFocProjectMeta.project.projectId}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                🏢 Branch: {selectedFocProjectMeta.resolvedSiteName}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              {selectedFocProjectMeta.focList.length} FOC Item Types in Central HQ Pool
                            </span>
                          </div>

                          <div className="text-xs text-slate-700 flex flex-wrap items-center gap-x-4 gap-y-1">
                            {selectedFocProjectMeta.clientName && (
                              <span>
                                Client: <strong className="text-slate-900">{selectedFocProjectMeta.clientName}</strong>
                              </span>
                            )}
                            <span>
                              Central Main Stock (HQ FOC Pool):{' '}
                              <strong className="text-indigo-800 font-mono">
                                {formatNumber(selectedFocProjectMeta.totalHqAvail)} units available
                              </strong>
                            </span>
                          </div>

                          {/* Sub-projects list if Main Project */}
                          {selectedFocProjectMeta.effectiveScope === 'main' && selectedFocProjectMeta.subProjects.length > 0 && (
                            <div className="pt-1.5 border-t border-slate-100">
                              <div className="text-[11px] font-bold text-indigo-900 mb-1">
                                Linked Sub-Projects (Use received stock under any of these in 5. Material Usage):
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedFocProjectMeta.subProjects.map((sub) => (
                                  <span
                                    key={sub.id}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200"
                                  >
                                    ↳ {sub.projectId}: {sub.projectName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Quick Load All Project FOC Items button */}
                          {selectedFocProjectMeta.focList.length > 0 ? (
                            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Pool Items:</span>
                                {selectedFocProjectMeta.focList.slice(0, 5).map((entry) => {
                                  const itm = items.find((i) => i.id === entry.itemId);
                                  if (!itm) return null;
                                  return (
                                    <button
                                      key={entry.itemId}
                                      type="button"
                                      onClick={() => {
                                        const exists = rows.some((r) => r.itemId === entry.itemId);
                                        if (!exists) {
                                          setRows((prev) => [
                                            ...prev,
                                            {
                                              itemId: entry.itemId,
                                              requestedQty: Math.max(1, Math.min(10, entry.centralWarehouseAvailable || 1)),
                                            },
                                          ]);
                                        }
                                      }}
                                      className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 cursor-pointer transition-colors text-left"
                                      title="Click to add this FOC item to request lines"
                                    >
                                      <span className="font-mono font-extrabold">+ [{itm.itemCode}]</span>{' '}
                                      <span>{itm.itemName}</span>{' '}
                                      <span className="text-emerald-700 font-mono">
                                        ({formatNumber(entry.centralWarehouseAvailable)} {itm.unit} avail)
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                              <button
                                type="button"
                                onClick={() => applyFocProjectSelection(selectedFocProjectMeta.project.id)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold cursor-pointer transition-colors shadow-2xs shrink-0"
                              >
                                ⚡ Load All Project FOC Items
                              </button>
                            </div>
                          ) : (
                            <div className="pt-1.5 border-t border-slate-100 text-[11px] text-amber-800 font-medium">
                              ⚠️ No Client Free Stock (FOC) has been received for this project in <strong>6. Client Free Stock</strong> yet.
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Purpose / Work Reference
                </label>
                <input
                  type="text"
                  placeholder={
                    formRequestCategory === 'foc'
                      ? 'e.g. Client FOC draw-down for main project / sub-project site installation'
                      : 'e.g. Substation conduit ducting, transformer foundation pile caps, fiber optic trenching'
                  }
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium shadow-2xs placeholder:text-slate-400"
                />
              </div>

              {/* Dynamic Items Table with Material & Machinery Dedicated Tabs */}
              <div className={`border rounded-2xl p-4 space-y-4 flex-1 ${
                formRequestCategory === 'foc'
                  ? 'border-indigo-200 bg-indigo-50/30'
                  : 'border-slate-200 bg-slate-50/70'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <label className="text-sm font-bold text-slate-900 block">
                      {formRequestCategory === 'foc'
                        ? `Requested Client FOC Items (${selectedFocProjectMeta ? selectedFocProjectMeta.project.projectId : 'Select Project'})`
                        : 'Requested Items & Equipment'}
                    </label>
                    <span className="text-xs text-slate-500">
                      {formRequestCategory === 'foc'
                        ? 'Showing Client Free Stock (FOC) Central Pool availability for the selected Main or Individual Project'
                        : 'Select items with clear dropdown visibility — switch tabs to separate Materials and Machinery'}
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
                      title={
                        formRequestCategory === 'foc'
                          ? 'Filter dropdown to show only items available in this Project’s Central FOC Pool'
                          : 'Filter dropdown to show only items with available stock in Central Main Warehouse'
                      }
                    >
                      <CheckCircle className={`w-3.5 h-3.5 ${onlyAvailableInModal ? 'text-white' : 'text-slate-400'}`} />
                      <span>{formRequestCategory === 'foc' ? 'Available Project FOC Only' : 'Available Stock Only'}</span>
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
                        <span className="text-sm">📦 Materials</span>
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
                        {formRequestCategory === 'foc' ? (
                          <>
                            <strong>Project FOC Pool Filter Active:</strong> Only items with available Client Free Stock for{' '}
                            <strong>{selectedFocProjectMeta?.project.projectName || 'the selected project'}</strong> are shown in dropdowns.
                          </>
                        ) : (
                          <>
                            <strong>Available Stock Filter Active:</strong> Only items with positive stock in Central Warehouse are shown in dropdowns.
                          </>
                        )}
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
                    {siteLowStockItemsForForm.length > 0 && formRequestCategory === 'normal' && (
                      <button
                        type="button"
                        onClick={() => {
                          setRows(
                            siteLowStockItemsForForm.map((itm) => {
                              const sStk = getSiteItemStock(formSiteId, itm.id);
                              const sourceAvail = formParentSite
                                ? getSiteItemStock(formParentSite.id, itm.id).availableBalance
                                : getMainWarehouseStock(itm.id).availableBalance;
                              const needed = Math.max(10, (sStk.threshold || 10) * 2 - sStk.availableBalance);
                              return {
                                itemId: itm.id,
                                requestedQty:
                                  sourceAvail > 0
                                    ? Math.min(needed, sourceAvail)
                                    : needed,
                              };
                            })
                          );
                          setReqModalTab('all');
                        }}
                        className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        title="Automatically load all items that are currently Low Stock or 0 Stock at this Site Branch"
                      >
                        <span>⚠️ Load Site Low Stock ({siteLowStockItemsForForm.length})</span>
                      </button>
                    )}

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
                <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white min-h-[500px] pb-64 shadow-2xs">
                  <table className="w-full text-xs text-left min-w-[700px]">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-3 sm:px-4">
                          Item Description & Classification
                        </th>
                        <th className="py-3 px-2 text-center w-16 whitespace-nowrap">Unit</th>
                        <th className="py-3 px-2 text-right w-24 whitespace-nowrap">Site Avl.</th>
                        <th className="py-3 px-2 text-right w-24 whitespace-nowrap">
                          {formRequestCategory === 'foc'
                            ? 'FOC Main'
                            : formParentSite
                            ? 'Parent Avail.'
                            : 'Main Avail.'}
                        </th>
                        <th className="py-3 px-2 text-right w-28 font-bold text-slate-900 whitespace-nowrap">Required Qty *</th>
                        <th className="py-3 px-2 text-center w-12 whitespace-nowrap">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center">
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
                          const availBalance = item
                            ? formParentSite
                              ? getSiteItemStock(formParentSite.id, item.id).availableBalance
                              : formRequestCategory === 'foc' && selectedFocProjectMeta
                              ? getClientFreeStockBalance(selectedFocProjectMeta.project.id, item.id).centralWarehouseAvailable
                              : getMainWarehouseStock(item.id).availableBalance
                            : 0;
                          const siteStk = item && formSiteId ? getSiteItemStock(formSiteId, item.id) : null;
                          const isSiteLow = siteStk
                            ? siteStk.isLowStock || siteStk.availableBalance <= siteStk.threshold
                            : false;

                          return (
                            <tr
                              key={originalIndex}
                              className="hover:bg-slate-50/70 transition-colors relative"
                              style={{ zIndex: 40 - originalIndex }}
                            >
                              <td className="py-3 px-3 sm:px-4 min-w-[290px]">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {isMach ? (
                                      <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                                        🚜 Machinery / Plant
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs">
                                        📦 Material / Consumable
                                      </span>
                                    )}
                                    {isSiteLow && (
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                        ⚠️ {siteStk?.isLowStock ? 'Low Site Stock' : 'Site Avl: 0 / Low'}
                                      </span>
                                    )}
                                    {formRequestCategory === 'foc' && (
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                        🎁 Client FOC Pool
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
                                    requestingSiteId={formSiteId}
                                    sourceSiteId={formParentSite?.id}
                                    sourceSiteName={formParentSite?.name}
                                    showStockBadge={true}
                                    defaultClassification={reqModalTab === 'Machinery' ? 'Machinery' : 'Material'}
                                    onlyAvailableStock={onlyAvailableInModal}
                                    focProjectId={formRequestCategory === 'foc' ? selectedFocProjectMeta?.project.id : undefined}
                                    placeholder={
                                      formRequestCategory === 'foc'
                                        ? 'Search & select project Client Free (FOC) item...'
                                        : reqModalTab === 'Machinery'
                                        ? 'Search & select machinery / equipment...'
                                        : 'Search & select material item...'
                                    }
                                  />
                                  {item && (
                                    <div className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/90 flex flex-wrap items-center justify-between gap-2 text-xs">
                                      <div className="min-w-0 flex-1">
                                        <span className="font-mono font-bold text-slate-700 mr-1.5">[{item.itemCode}]</span>
                                        <span className="font-extrabold text-slate-900 break-words">{item.itemName}</span>
                                        {item.description && (
                                          <span className="text-slate-500 ml-1.5 text-[11px]">— {item.description}</span>
                                        )}
                                      </div>
                                      <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                                        Unit: <strong className="text-slate-800">{item.unit}</strong>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-2 text-center text-slate-800 font-bold whitespace-nowrap text-xs sm:text-sm">
                                {item?.unit || 'Nos'}
                              </td>
                              <td className="py-3 px-2 text-right font-mono whitespace-nowrap text-xs sm:text-sm">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-bold inline-block ${
                                    isSiteLow
                                      ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}
                                >
                                  Site Avl: {formatNumber(siteStk?.availableBalance ?? 0)}
                                </span>
                                {siteStk && (
                                  <div className="text-[10px] font-sans text-slate-400 font-medium mt-0.5">
                                    Min: {siteStk.threshold}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-2 text-right font-mono text-slate-700 font-bold whitespace-nowrap text-xs sm:text-sm">
                                <span
                                  className={
                                    availBalance <= 0
                                      ? 'text-rose-600'
                                      : formRequestCategory === 'foc'
                                      ? 'text-indigo-700 font-extrabold'
                                      : 'text-slate-900'
                                  }
                                >
                                  {formatNumber(availBalance)}
                                </span>
                                {formParentSite ? (
                                  <div className="text-[10px] font-sans font-semibold text-sky-700 mt-0.5">
                                    Parent: {formParentSite.name}
                                  </div>
                                ) : formRequestCategory === 'foc' ? (
                                  <div className="text-[10px] font-sans font-semibold text-indigo-600">
                                    Project FOC Pool
                                  </div>
                                ) : (
                                  <div className="text-[10px] font-sans text-slate-400 font-medium mt-0.5">
                                    Main Stock
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-2 text-right whitespace-nowrap">
                                <input
                                  type="number"
                                  min="1"
                                  step="any"
                                  value={row.requestedQty}
                                  onChange={(e) => handleRowChange(originalIndex, 'requestedQty', e.target.value)}
                                  className="w-24 px-2.5 py-2 border border-slate-300 focus:border-slate-900 rounded-xl text-xs sm:text-sm font-mono font-bold text-right focus:ring-2 focus:ring-slate-900 bg-white shadow-2xs"
                                  required
                                />
                              </td>
                              <td className="py-3 px-2 text-center w-12">
                                {rows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRow(originalIndex)}
                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
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
                    className={`px-4 py-2 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer ${
                      formRequestCategory === 'foc'
                        ? 'bg-indigo-700 hover:bg-indigo-800'
                        : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    {formRequestCategory === 'foc'
                      ? 'Transmit Client FOC Requisition'
                      : 'Transmit Requisition'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVE REQUISITION MODAL (Main Branch Admin or Parent Regional Branch Admin) */}
      {reviewingRequest && (() => {
        const reviewSourceSite = reviewingRequest.sourceSiteId
          ? sites.find((s) => s.id === reviewingRequest.sourceSiteId)
          : undefined;
        const isParentBranchSupply = Boolean(reviewSourceSite && !reviewSourceSite.isMainWarehouse);
        const sourceWarehouseLabel =
          reviewSourceSite?.name || reviewingRequest.sourceSiteName || 'Central Main Warehouse';

        const shortageSummary = reviewingRequest.items.reduce(
          (acc, row) => {
            const avail = getRequestItemAvailableBalance(reviewingRequest, row.itemId);
            if (avail <= 0) acc.outOfStockCount++;
            else if (avail < row.requestedQty) acc.partialStockCount++;
            else acc.inStockCount++;
            return acc;
          },
          { outOfStockCount: 0, partialStockCount: 0, inStockCount: 0 }
        );
        const hasShortage = shortageSummary.outOfStockCount > 0 || shortageSummary.partialStockCount > 0;

        const issuingCount = approvalItems.filter(
          (item) => !item.willNotIssue && Number(item.approvedQty || 0) > 0
        ).length;
        const idleCount = approvalItems.filter(
          (item) => item.willNotIssue || Number(item.approvedQty || 0) <= 0
        ).length;

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
                      {reviewingRequest.requestCategory === 'foc' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                          🎁 Client Free Stock (FOC) Request
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>Requesting Site: <strong className="text-slate-800">{sites.find((s) => s.id === reviewingRequest.siteId)?.name}</strong></span>
                      <span>·</span>
                      <span>Supply Source: <strong className="text-sky-800">{sourceWarehouseLabel}</strong></span>
                      <span>·</span>
                      <span>Requester: <strong className="text-slate-800">{reviewingRequest.requestedBy}</strong></span>
                      <span>·</span>
                      <span>Priority: <strong className={reviewingRequest.priority === 'Emergency' ? 'text-red-700' : 'text-slate-700'}>{reviewingRequest.priority}</strong></span>
                      {reviewingRequest.requestCategory === 'foc' && reviewingRequest.focProjectName && (
                        <>
                          <span>·</span>
                          <span className="text-indigo-800 font-bold">
                            {reviewingRequest.focProjectScope === 'main' ? '🏢 Main Project:' : '📄 Individual Project:'} {reviewingRequest.focProjectCode} — {reviewingRequest.focProjectName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setReviewingRequest(null);
                    setShowRejectInline(false);
                    setApprovalError('');
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
                        <span>
                          {isParentBranchSupply
                            ? `${sourceWarehouseLabel} Stock Shortage`
                            : reviewingRequest.requestCategory === 'foc'
                            ? 'Project FOC Pool Shortage'
                            : 'Central Stock Shortage'}
                        </span>
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
                        title="Auto-cap approved quantities to available stock and hold 0-stock items as Will Not Issue"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-amber-200" />
                        <span>⚡ Send Available Only</span>
                      </button>

                      {shortageSummary.outOfStockCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkOutOfStockWillNotIssue}
                          className="px-2.5 py-1.5 bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                          title="Hold all 0-stock items as Will Not Issue (kept on Request Note for audit trail, excluded from site dispatch)"
                        >
                          <PauseCircle className="w-3.5 h-3.5 text-amber-700" />
                          <span>Hold Out-of-Stock (Will Not Issue)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShowRejectInline(true);
                          setRejectionReason(`Requested items currently unavailable or out of stock at ${sourceWarehouseLabel}`);
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
                    <span>
                      All requested items are <strong>fully in stock</strong> at{' '}
                      {isParentBranchSupply
                        ? sourceWarehouseLabel
                        : reviewingRequest.requestCategory === 'foc'
                        ? `Project FOC Central Pool (${reviewingRequest.focProjectCode || reviewingRequest.focProjectName})`
                        : 'Central Warehouse'}.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setApprovalError('');
                      setApprovalItems((prev) =>
                        prev.map((item) => {
                          const req = reviewingRequest.items.find((r) => r.itemId === item.itemId);
                          const fullQty = req ? req.requestedQty : item.approvedQty;
                          return {
                            ...item,
                            approvedQty: fullQty,
                            willNotIssue: false,
                            previousApprovedQty: Number(fullQty) || item.previousApprovedQty,
                          };
                        })
                      );
                    }}
                    className="text-[10px] font-bold text-emerald-800 hover:underline px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 cursor-pointer"
                  >
                    Set All Full
                  </button>
                </div>
              )}

              {/* Audit Trail & Dispatch Status Strip */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 mb-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800">
                    Dispatch Summary: <span className="text-emerald-700">{issuingCount} Issuing to Site</span>
                  </span>
                  {idleCount > 0 && (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      <PauseCircle className="w-3 h-3" />
                      {idleCount} Will Not Issue (Idle · Kept on Request Note)
                    </span>
                  )}
                </div>
                <span className="text-[10.5px] text-slate-500">
                  Items marked <strong>Will Not Issue</strong> remain on the Request Note ({reviewingRequest.requestNoteNumber}) as proof of site request, while only issued items go to Site Dispatch.
                </span>
              </div>

              {approvalError && (
                <div className="bg-rose-50 border border-rose-300 text-rose-800 rounded-xl px-3 py-2 mb-2.5 text-xs font-semibold flex items-center gap-2 shrink-0">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{approvalError}</span>
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
                      `Requested items out of stock at ${sourceWarehouseLabel}`,
                      'Insufficient inventory - pending replenishment',
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
                      placeholder="e.g. Items currently unavailable or duplicate requisition"
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

              {/* Items Table Container */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto overflow-y-auto min-h-[300px] max-h-[460px] flex-1 mb-2.5 bg-white shadow-2xs">
                <table className="w-full text-sm text-left min-w-[640px]">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold text-xs uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3.5">Item Code & Material Description</th>
                      <th className="py-2.5 px-3.5 text-right">
                        {isParentBranchSupply
                          ? 'Parent Branch Avail.'
                          : reviewingRequest.requestCategory === 'foc'
                          ? 'Project FOC Pool Avail.'
                          : 'Main Warehouse Avail.'}
                      </th>
                      <th className="py-2.5 px-3.5 text-right">Site Requested</th>
                      <th className="py-2.5 px-3.5 text-right w-52 font-bold text-slate-900">Approved Qty to Dispatch</th>
                      <th className="py-2.5 px-3.5 text-center w-36">Item Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reviewingRequest.items.map((row) => {
                      const itm = items.find((i) => i.id === row.itemId);
                      const entry = approvalItems.find((a) => a.itemId === row.itemId);
                      const isIdle = Boolean(entry?.willNotIssue);
                      const approvedVal = isIdle ? 0 : (entry?.approvedQty ?? row.requestedQty);
                      const approvedNum = Number(approvedVal || 0);
                      const avail = getRequestItemAvailableBalance(reviewingRequest, row.itemId);
                      const isExceeding = !isIdle && approvedNum > avail;
                      const isZeroStock = avail <= 0;
                      const isPartialStock = !isZeroStock && avail < row.requestedQty;

                      return (
                        <tr
                          key={row.itemId}
                          className={`transition-colors ${
                            isIdle
                              ? 'bg-slate-100/80 hover:bg-slate-100 border-l-4 border-l-slate-400'
                              : isZeroStock
                              ? 'bg-rose-50/50 hover:bg-rose-50 border-l-4 border-l-rose-500'
                              : isPartialStock
                              ? 'bg-amber-50/40 hover:bg-amber-50 border-l-4 border-l-amber-500'
                              : 'hover:bg-slate-50/50 border-l-4 border-l-transparent'
                          }`}
                        >
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-xs border border-slate-200">
                                {itm?.itemCode}
                              </span>
                              {itm && isMachineryItem(itm) ? (
                                <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  🚜 Machinery
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  📦 Material
                                </span>
                              )}
                              {isIdle && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <PauseCircle className="w-3 h-3 text-amber-700" />
                                  Will Not Issue (Idle)
                                </span>
                              )}
                            </div>
                            <div className={`text-sm font-bold mt-1 ${isIdle ? 'text-slate-500' : 'text-slate-900'}`}>
                              {itm?.itemName}
                            </div>
                            {itm?.description && (
                              <div className="text-xs text-slate-500 italic line-clamp-1 max-w-[260px]">{itm.description}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                            <div className={`flex flex-col items-end ${isIdle ? 'opacity-65' : ''}`}>
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
                            {isIdle ? (
                              <div className="flex flex-col items-end gap-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200/80 border border-slate-300 text-slate-600 text-xs font-mono font-bold">
                                  0 {itm?.unit} · Not Issuing
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Stays on Request Note · Excluded from dispatch
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1.5 justify-end">
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={approvedVal}
                                    onChange={(e) => {
                                      setApprovalError('');
                                      const val = e.target.value === '' ? '' : Number(e.target.value);
                                      setApprovalItems((prev) =>
                                        prev.map((item) =>
                                          item.itemId === row.itemId
                                            ? {
                                                ...item,
                                                approvedQty: val,
                                                willNotIssue: false,
                                                previousApprovedQty:
                                                  typeof val === 'number' && val > 0 ? val : item.previousApprovedQty,
                                              }
                                            : item
                                        )
                                      );
                                    }}
                                    placeholder="0"
                                    className={`w-24 px-2 py-1.5 border rounded-lg text-xs font-mono font-bold text-right focus:outline-none transition-all ${
                                      isExceeding
                                        ? 'border-amber-500 bg-amber-50 text-amber-900 focus:ring-2 focus:ring-amber-500'
                                        : approvedNum === 0
                                        ? 'border-amber-300 bg-amber-50/60 text-amber-800 focus:ring-2 focus:ring-amber-500'
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
                                      setApprovalError('');
                                      setApprovalItems((prev) =>
                                        prev.map((item) =>
                                          item.itemId === row.itemId
                                            ? {
                                                ...item,
                                                approvedQty: row.requestedQty,
                                                willNotIssue: false,
                                                previousApprovedQty: row.requestedQty,
                                              }
                                            : item
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
                                        setApprovalError('');
                                        setApprovalItems((prev) =>
                                          prev.map((item) =>
                                            item.itemId === row.itemId
                                              ? {
                                                  ...item,
                                                  approvedQty: avail,
                                                  willNotIssue: false,
                                                  previousApprovedQty: avail,
                                                }
                                              : item
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
                                    onClick={() => handleToggleWillNotIssue(row.itemId)}
                                    className="px-1.5 py-0.5 text-[10px] rounded transition-colors cursor-pointer bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900"
                                    title="Set 0 & hold as Will Not Issue"
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
                            )}
                          </td>

                          {/* Reversible Will Not Issue / Restore Item Action */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            {isIdle ? (
                              <button
                                type="button"
                                onClick={() => handleToggleWillNotIssue(row.itemId)}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer mx-auto shadow-2xs active:scale-95"
                                title="Restore this item so it can be approved and issued to site"
                              >
                                <RotateCcw className="w-3 h-3 text-emerald-700" />
                                <span>Restore</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleWillNotIssue(row.itemId)}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer mx-auto shadow-2xs active:scale-95"
                                title="Hold this item as Will Not Issue (keeps item on Request Note at 0 without deleting)"
                              >
                                <PauseCircle className="w-3 h-3 text-amber-700" />
                                <span>Will Not Issue</span>
                              </button>
                            )}
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
                      setApprovalError('');
                    }}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmApproval}
                    disabled={issuingCount === 0}
                    className={`px-5 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 ${
                      issuingCount === 0
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
                    }`}
                    title={
                      issuingCount === 0
                        ? 'Restore at least one item or click Reject Entire Request'
                        : 'Approve issued items and record Request Note'
                    }
                  >
                    <CheckCircle className={`w-4 h-4 ${issuingCount === 0 ? 'text-slate-400' : 'text-emerald-200'}`} />
                    <span>Approve & Issue Request Note</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* EDIT RECEIVED AMOUNT & ACCEPT MODAL (Site Admin) */}
      {acceptingRequest && (() => {
        const issuedRows = acceptingRequest.items.filter(
          (r) => !r.willNotIssue && (r.approvedQty ?? r.requestedQty) > 0
        );
        const heldRowsCount = acceptingRequest.items.length - issuedRows.length;

        return (
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

              <p className="text-xs text-slate-600 mb-3">
                Site Admin Receiving Verification: Check physical count delivered to the site gate. If there is a delivery discrepancy (e.g. damaged in-transit or shortage), input the actual counted quantity.
              </p>

              {heldRowsCount > 0 && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
                  Note: <strong>{heldRowsCount}</strong> item(s) on {acceptingRequest.requestNoteNumber} were marked <strong>Will Not Issue</strong> during approval and are excluded from this site delivery.
                </div>
              )}

              <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3.5">Material Description</th>
                      <th className="py-2.5 px-3.5 text-center">Unit</th>
                      <th className="py-2.5 px-3.5 text-right">Dispatched Qty</th>
                      <th className="py-2.5 px-3.5 text-right">Actually Received Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {issuedRows.map((row) => {
                      const itm = items.find((i) => i.id === row.itemId);
                      const recvVal =
                        receivedItems.find((r) => r.itemId === row.itemId)?.receivedQty ?? (row.approvedQty ?? row.requestedQty);

                      return (
                        <tr key={row.itemId}>
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-xs border border-slate-200">
                                {itm?.itemCode}
                              </span>
                              {itm && isMachineryItem(itm) ? (
                                <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  🚜 Machinery
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  📦 Material
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-bold text-slate-900 mt-1">{itm?.itemName}</div>
                          </td>
                          <td className="py-3 px-3.5 text-center font-medium text-slate-600">{itm?.unit}</td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-600">
                            {formatNumber(row.approvedQty ?? row.requestedQty)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={recvVal}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : Number(e.target.value);
                                setReceivedItems((prev) =>
                                  prev.map((item) =>
                                    item.itemId === row.itemId ? { ...item, receivedQty: val } : item
                                  )
                                );
                              }}
                              placeholder="0"
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
        );
      })()}

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
