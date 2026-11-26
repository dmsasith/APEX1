import React, { useState, useMemo } from 'react';
import {
  Gift,
  Boxes,
  PlusCircle,
  Search,
  Download,
  Filter,
  Calendar,
  Building,
  Building2,
  Trash2,
  Printer,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  FileText,
  Clock,
  Layers,
  ArrowLeft,
  ArrowRight,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Hash,
  Eye,
  Info,
  Briefcase,
  UserPlus,
  Handshake,
  Edit2,
  Phone,
  MapPin,
  Plus,
  X,
  Lock,
  RefreshCw,
  Package,
  PenTool,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Item, ClientFreeIssueEntry, ClientFreeIssueItemRow, Client, isSuperAdmin } from '../../types';
import { formatNumber, formatDate, formatDateTime, exportToCsv } from '../../utils/exportUtils';
import {
  formatIsoToCountryYyyyMmDd,
  getCountryTodayIsoDate,
  pickBestTimestamp,
  resolveTimestampForDateInput,
} from '../../utils/countryTimezoneUtils';
import { printHtmlElement, downloadElementAsPdf } from '../../utils/printUtils';
import { matchDigitalSignature } from '../../utils/signatureUtils';
import { PrintableDocumentModal } from '../common/PrintableDocumentModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { ItemTraceabilitySummaryPanel } from '../common/ItemTraceabilitySummaryPanel';
import { SearchableItemSelect } from '../common/SearchableItemSelect';
import { enforceCountryPhoneInput, detectActivePhoneCountry } from '../../utils/phoneCountryUtils';
import { PhoneCountryBadge } from '../common/PhoneCountryBadge';

interface NewItemRow {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number | '';
  unit: string;
  remarks: string;
}

export const ClientFreeIssueView: React.FC = () => {
  const {
    config,
    currentTenant,
    currentUser,
    actorDisplayName,
    activeItems,
    items,
    projects,
    activeProjects,
    updateProject,
    clientFreeIssues,
    addClientFreeIssue,
    updateClientFreeIssue,
    deleteClientFreeIssue,
    clearClientFreeIssues,
    getClientFreeStockBalance,
    getProjectFreeStockList,
    getSiteItemStock,
    sites,
    activeSites,
    activeClients,
    clients,
    addClient,
    updateClient,
    deleteClient,
    stockRequests,
    teamIssues,
    teamReturns,
    teams,
    projectUsages,
    digitalSignatures,
    activeTemplate,
  } = useStock();

  const isCentralAdmin = isSuperAdmin(currentUser?.role) || currentUser?.username === 'admin';

  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'project-balances' | 'inbound-vouchers' | 'client-register'>('project-balances');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [selectedClientFilter, setSelectedClientFilter] = useState('all');

  // Modals
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<ClientFreeIssueEntry | null>(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToast, setClientToast] = useState<string | null>(null);
  const [viewingVoucher, setViewingVoucher] = useState<ClientFreeIssueEntry | null>(null);
  const [printingVoucher, setPrintingVoucher] = useState<ClientFreeIssueEntry | null>(null);
  const [expandedTraceKey, setExpandedTraceKey] = useState<string | null>(null);
  const [voucherModalTraceItemId, setVoucherModalTraceItemId] = useState<string | null>(null);
  const [projectReportModalId, setProjectReportModalId] = useState<string | null>(null);
  const [singleItemReportModal, setSingleItemReportModal] = useState<{
    projectId: string;
    itemId: string;
  } | null>(null);
  const [subProjectReportModal, setSubProjectReportModal] = useState<{
    parentProjectId: string;
    subProjectId: string;
  } | null>(null);
  const [selectedSubProjectByParent, setSelectedSubProjectByParent] = useState<Record<string, string>>({});
  const [isExportingReportPdf, setIsExportingReportPdf] = useState(false);
  const [offDigitalSignature, setOffDigitalSignature] = useState<boolean>(
    Boolean(config?.offDigitalSignature)
  );

  const resolveCatalogItem = (
    itemId: string,
    itemCode?: string,
    itemName?: string,
    unit?: string
  ): Item => {
    const found =
      activeItems.find((i) => i.id === itemId || (itemCode && i.itemCode === itemCode)) ||
      items.find((i) => i.id === itemId || (itemCode && i.itemCode === itemCode));
    if (found) return found;
    return {
      id: itemId,
      itemCode: itemCode || 'FOC-ITEM',
      itemName: itemName || 'Client Free-Issue Material',
      category: 'Client Free-Issue (FOC)',
      unit: unit || 'units',
      unitPrice: 0,
      lowStockThreshold: 0,
      createdAt: new Date().toISOString(),
    };
  };
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // New Client Register Form State (Synced with Master Registry -> Client Register)
  const [newClientCode, setNewClientCode] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientCategory, setNewClientCategory] = useState('Telecommunications & Fiber Network');
  const [newClientContactPerson, setNewClientContactPerson] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientTaxNo, setNewClientTaxNo] = useState('');
  const [newClientNotes, setNewClientNotes] = useState('');

  const branchSites = useMemo(
    () => sites.filter((s) => !s.isMainWarehouse && !s.isDeleted),
    [sites]
  );
  const mainWarehouseName = useMemo(
    () => sites.find((s) => s.isMainWarehouse)?.name || 'Main Central Warehouse',
    [sites]
  );

  // Helper to resolve which Site Branch a project is assigned to (supports ALL_AREAS)
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
    const voucherWithBranch = clientFreeIssues.find(
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
    if (p.siteName) {
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
    const reqForProject = stockRequests.find(
      (r) =>
        r.siteId &&
        (r.focProjectId === p.id || (p.parentProjectId && r.focProjectId === p.parentProjectId))
    );
    if (reqForProject?.siteId) {
      const matched = sites.find((s) => s.id === reqForProject.siteId);
      return { siteId: reqForProject.siteId, siteName: matched?.name || '' };
    }
    const usageForProject = projectUsages.find(
      (u) => !u.isDeleted && u.siteId && (u.projectId === p.id || (p.parentProjectId && u.projectId === p.parentProjectId))
    );
    if (usageForProject?.siteId) {
      const matched = sites.find((s) => s.id === usageForProject.siteId);
      return { siteId: usageForProject.siteId, siteName: matched?.name || '' };
    }
    if (branchSites.length > 0) {
      return { siteId: branchSites[0].id, siteName: branchSites[0].name };
    }
    return { siteId: '', siteName: p.siteName || '' };
  };

  // Form State for Logging Client Free-Issue Shipment (DN)
  const [formClientName, setFormClientName] = useState(activeClients[0]?.name || '');
  const [formProjectMode, setFormProjectMode] = useState<'main' | 'individual' | 'all'>('main');
  const [formProjectId, setFormProjectId] = useState(activeProjects[0]?.id || '');
  const [formAssignedSiteId, setFormAssignedSiteId] = useState('');
  const [formDispatchNoteNo, setFormDispatchNoteNo] = useState('');
  const [formReceivedDate, setFormReceivedDate] = useState(() => getCountryTodayIsoDate());
  const [formReceivedBy, setFormReceivedBy] = useState(actorDisplayName || 'Logistics Coordinator');
  const [formStorageLocation, setFormStorageLocation] = useState('Main Central Warehouse');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Line items in form
  const [formItems, setFormItems] = useState<NewItemRow[]>([
    { itemId: '', itemCode: '', itemName: '', quantity: '', unit: 'm', remarks: '' },
  ]);

  // Standard industry categories synced with Master Registry
  const STANDARD_CLIENT_CATEGORIES = [
    'Telecom Operator & Network Owner',
    'Power & Energy Utility Board',
    'Civil Infrastructure Authority',
    'Main EPC Contractor / Developer',
    'Commercial Project Owner',
    'Government & Municipal Body',
    'Water & Sewage Utility',
    'Transportation & Ports Authority',
    'Telecommunications & Fiber Network',
    'Renewable Energy & Solar EPC',
  ];

  const [customClientCategories, setCustomClientCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_client_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showAddCategoryInline, setShowAddCategoryInline] = useState(false);
  const [newCustomCategoryInput, setNewCustomCategoryInput] = useState('');

  const clientCategoryOptions = useMemo(() => {
    return Array.from(
      new Set([
        ...STANDARD_CLIENT_CATEGORIES,
        ...customClientCategories,
        ...activeClients.filter((c) => c.category).map((c) => c.category!.trim()),
      ])
    );
  }, [customClientCategories, activeClients]);

  const triggerToast = (msg: string) => {
    setClientToast(msg);
    setTimeout(() => setClientToast(null), 3500);
  };

  const handleAddCustomCategory = (e?: React.FormEvent | React.KeyboardEvent, isEditingModal = false) => {
    if (e) e.preventDefault();
    const trimmed = newCustomCategoryInput.trim();
    if (!trimmed) return;

    if (clientCategoryOptions.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      triggerToast(`Industry Category "${trimmed}" already exists.`);
      if (isEditingModal && editingClient) {
        setEditingClient({ ...editingClient, category: trimmed });
      } else {
        setNewClientCategory(trimmed);
      }
      setNewCustomCategoryInput('');
      setShowAddCategoryInline(false);
      return;
    }

    const updated = [...customClientCategories, trimmed];
    setCustomClientCategories(updated);
    try {
      localStorage.setItem('custom_client_categories', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    if (isEditingModal && editingClient) {
      setEditingClient({ ...editingClient, category: trimmed });
    } else {
      setNewClientCategory(trimmed);
    }
    triggerToast(`New Industry Category "${trimmed}" added & selected!`);
    setNewCustomCategoryInput('');
    setShowAddCategoryInline(false);
  };

  const handleRemoveCustomCategory = (catToRemove: string) => {
    const updated = customClientCategories.filter((c) => c !== catToRemove);
    setCustomClientCategories(updated);
    try {
      localStorage.setItem('custom_client_categories', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    if (newClientCategory === catToRemove) {
      setNewClientCategory(STANDARD_CLIENT_CATEGORIES[0]);
    }
    triggerToast(`Custom category "${catToRemove}" removed.`);
  };

  // Open New Client Register Modal
  const handleOpenNewClientModal = () => {
    setNewClientCode(`CLT-${String(clients.length + 1).padStart(4, '0')}`);
    setNewClientName('');
    setNewClientCategory(STANDARD_CLIENT_CATEGORIES[0]);
    setNewClientContactPerson('');
    setNewClientPhone('');
    setNewClientEmail('');
    setNewClientAddress('');
    setNewClientTaxNo('');
    setNewClientNotes('');
    setShowAddCategoryInline(false);
    setNewCustomCategoryInput('');
    setShowNewClientModal(true);
  };

  // Save New Client to Master Registry & Auto-select in FOC Shipment Form
  const handleCreateNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const finalCode = newClientCode.trim() || `CLT-${String(clients.length + 1).padStart(4, '0')}`;
    const trimmedName = newClientName.trim();

    addClient({
      clientCode: finalCode.toUpperCase(),
      name: trimmedName,
      category: newClientCategory,
      contactPerson: newClientContactPerson.trim(),
      phone: newClientPhone.trim(),
      email: newClientEmail.trim(),
      address: newClientAddress.trim(),
      taxRegistrationNo: newClientTaxNo.trim(),
      notes: newClientNotes.trim(),
    });

    // Automatically select this newly registered client in the FOC shipment form
    setFormClientName(trimmedName);
    setShowNewClientModal(false);
    triggerToast(`Client "${trimmedName}" (${finalCode.toUpperCase()}) registered and synced with Master Client Register!`);
  };

  const handleSaveEditClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editingClient.name.trim()) return;
    updateClient(editingClient.id, editingClient);
    setEditingClient(null);
    triggerToast(`Client "${editingClient.name}" updated in Master Client Register.`);
  };

  const handleDeleteRegisteredClient = (client: Client) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Client from Master Register?',
      message: `Are you sure you want to remove "${client.name}" (${client.clientCode}) from the Client Register?`,
      onConfirm: () => {
        deleteClient(client.id);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        triggerToast(`Client "${client.name}" moved to Recycle Bin.`);
      },
    });
  };

  // Helper to get active voucher count & statistics
  const activeVouchers = useMemo(() => {
    return clientFreeIssues.filter((e) => !e.isDeleted);
  }, [clientFreeIssues]);

  // All selectable client names for filter (combines registered clients + any historical voucher clients)
  const allClientFilterNames = useMemo(() => {
    const names = new Set<string>();
    activeClients.forEach((c) => names.add(c.name));
    activeVouchers.forEach((v) => {
      if (v.clientName) names.add(v.clientName);
    });
    return Array.from(names);
  }, [activeClients, activeVouchers]);

  // Overall KPIs (deduplicated by Root/Main Project so Sub-Projects don't double-count)
  const kpis = useMemo(() => {
    let totalUnitsReceived = 0;
    const rootProjectSet = new Set<string>();

    activeVouchers.forEach((v) => {
      if (v.projectId) {
        const proj = projects.find((p) => p.id === v.projectId);
        const rootId = proj?.parentProjectId || v.projectId;
        rootProjectSet.add(rootId);
      }
      v.items.forEach((it) => {
        totalUnitsReceived += Number(it.quantity) || 0;
      });
    });

    // Calculate total dispatched to site branches and total consumed from client stock across each root project family
    let totalUnitsDispatchedToSites = 0;
    let totalUnitsInstalled = 0;
    let totalCentralAvailable = 0;
    rootProjectSet.forEach((rootId) => {
      const stockList = getProjectFreeStockList(rootId);
      stockList.forEach((row) => {
        totalUnitsDispatchedToSites += row.dispatchedToSites;
        totalUnitsInstalled += row.totalUsed;
        totalCentralAvailable += row.centralWarehouseAvailable;
      });
    });

    const netRemaining =
      rootProjectSet.size > 0
        ? totalCentralAvailable
        : Math.max(0, totalUnitsReceived - Math.max(totalUnitsDispatchedToSites, totalUnitsInstalled));

    return {
      totalVouchers: activeVouchers.length,
      totalUnitsReceived,
      totalUnitsDispatchedToSites,
      totalUnitsInstalled,
      netRemaining,
      assignedProjectsCount: rootProjectSet.size,
    };
  }, [activeVouchers, projects, getProjectFreeStockList]);

  // Filtered Vouchers List
  const filteredVouchers = useMemo(() => {
    return activeVouchers.filter((v) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        v.voucherNumber.toLowerCase().includes(q) ||
        (v.dispatchNoteNo || '').toLowerCase().includes(q) ||
        v.clientName.toLowerCase().includes(q) ||
        v.projectName.toLowerCase().includes(q) ||
        (v.siteIdentifier || '').toLowerCase().includes(q) ||
        v.items.some((it) => (it.itemName || '').toLowerCase().includes(q) || (it.itemCode || '').toLowerCase().includes(q));

      const matchProject = selectedProjectFilter === 'all' || v.projectId === selectedProjectFilter;
      const matchClient = selectedClientFilter === 'all' || v.clientName === selectedClientFilter;

      return matchSearch && matchProject && matchClient;
    });
  }, [activeVouchers, searchQuery, selectedProjectFilter, selectedClientFilter]);

  // Filtered Registered Clients for the Client Register tab
  const filteredRegisteredClients = useMemo(() => {
    return activeClients.filter((c) => {
      if (selectedClientFilter !== 'all' && c.name !== selectedClientFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.clientCode.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q) ||
        (c.contactPerson || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q)
      );
    });
  }, [activeClients, selectedClientFilter, searchQuery]);

  // Project Balance Overview (Grouped by Root Main Project or Standalone Individual Project, with 5-Stage Reconciliation Metrics)
  const projectSummaries = useMemo(() => {
    const rootProjects = activeProjects.filter((p) => !p.parentProjectId && p.projectScope !== 'sub');

    const list = rootProjects.map((p) => {
      const childSubProjects = activeProjects.filter(
        (sp) =>
          sp.id !== p.id &&
          (sp.parentProjectId === p.id ||
            (projectUsages || []).some(
              (u) => !u.isDeleted && u.projectId === sp.id && u.parentProjectId === p.id
            ))
      );
      const isMainProject = p.projectScope === 'main' || childSubProjects.length > 0;
      const resolvedBranch = resolveProjectBranch(p);
      const familyIds = new Set<string>([p.id, ...childSubProjects.map((sp) => sp.id)]);
      const familyNamesLower = new Set<string>(
        [
          p.projectName,
          p.projectId,
          ...childSubProjects.flatMap((sp) => [sp.projectName, sp.projectId]),
        ]
          .filter(Boolean)
          .map((s) => String(s).trim().toLowerCase())
      );

      const rawFreeStockItems = getProjectFreeStockList(p.id);

      const freeStockItems = rawFreeStockItems.map((it) => {
        // Stage 1: Initial FOC Receipt Vouchers at Central Stock
        const initialFocVouchers = activeVouchers
          .filter(
            (v) =>
              (familyIds.has(v.projectId) || (v.parentProjectId && familyIds.has(v.parentProjectId))) &&
              v.items.some((vi) => vi.itemId === it.itemId && Number(vi.quantity) > 0)
          )
          .map((v) => {
            const row = v.items.find((vi) => vi.itemId === it.itemId)!;
            return {
              id: v.id,
              voucherNumber: v.voucherNumber,
              dispatchNoteNo: v.dispatchNoteNo || 'N/A',
              clientName: v.clientName,
              receivedDate: pickBestTimestamp(v.receivedDate, v.createdAt) || v.createdAt,
              receivedBy: v.receivedBy || 'Central Store',
              storageLocation: v.storageLocation || 'Main Central Warehouse',
              qty: Number(row.quantity) || 0,
              remarks: row.remarks || v.notes || '',
            };
          });

        // Stage 2: Site Issue Requisitions (Central -> Site Branch)
        const siteIssueRequisitions = (stockRequests || [])
          .filter((req) => {
            if (req.status !== 'Approved / In-Transit' && req.status !== 'Accepted') return false;
            const hasItem = req.items.some((ri) => ri.itemId === it.itemId);
            if (!hasItem) return false;
            if (req.focProjectId) {
              return familyIds.has(req.focProjectId);
            }
            if (req.purpose) {
              const pLow = req.purpose.trim().toLowerCase();
              for (const pName of familyNamesLower) {
                if (pName.length >= 3 && pLow.includes(pName)) return true;
              }
            }
            if (
              req.requestCategory === 'foc' &&
              (!resolvedBranch.siteId ||
                resolvedBranch.siteId === 'ALL_AREAS' ||
                req.siteId === resolvedBranch.siteId)
            ) {
              return true;
            }
            return false;
          })
          .map((req) => {
            const row = req.items.find((ri) => ri.itemId === it.itemId)!;
            const qty =
              req.status === 'Accepted'
                ? Number(row.receivedQty ?? row.approvedQty ?? row.requestedQty ?? 0)
                : Number(row.approvedQty ?? row.requestedQty ?? 0);
            const sName = sites.find((s) => s.id === req.siteId)?.name || resolvedBranch.siteName || 'Site Branch';
            return {
              id: req.id,
              requestNoteNumber: req.requestNoteNumber,
              date: req.acceptanceDate || req.approvalDate || req.requestedDate,
              siteName: sName,
              status: req.status,
              byUser: req.acceptedBy || req.approvedBy || req.requestedBy,
              qty,
            };
          })
          .filter((r) => r.qty > 0);

        // Stage 3: Team Issue & Team Returns at the Allocated Site Branch (or across all sites when ALL_AREAS)
        const targetSiteId = resolvedBranch.siteId === 'ALL_AREAS' ? '' : resolvedBranch.siteId;
        const teamIssueRecords = (teamIssues || [])
          .filter((ti) => (!targetSiteId || ti.siteId === targetSiteId) && (ti.items || []).some((r) => r.itemId === it.itemId))
          .map((ti) => {
            const row = ti.items.find((r) => r.itemId === it.itemId)!;
            const teamObj = (teams || []).find((t) => t.id === ti.teamId);
            return {
              id: ti.id,
              issueNoteNumber: ti.issueNoteNumber,
              date: ti.issueDate,
              teamName: teamObj?.teamName || 'Field Team',
              teamLeader: teamObj?.teamLeaderName || ti.issuedBy || 'Team Leader',
              qty: Number(row.quantity) || 0,
            };
          })
          .filter((r) => r.qty > 0);

        const rawSiteTeamIssued = teamIssueRecords.reduce((s, r) => s + r.qty, 0);
        const rawSiteTeamReturnedGood = (teamReturns || [])
          .filter(
            (ret) =>
              (!targetSiteId || ret.siteId === targetSiteId) &&
              ret.itemId === it.itemId &&
              ret.condition === 'Good / Restock'
          )
          .reduce((s, r) => s + (Number(r.quantity) || 0), 0);

        // Stage 4: Usage & Wastage on this Project Family
        const usageRecords = (projectUsages || [])
          .filter(
            (u) =>
              !u.isDeleted &&
              (familyIds.has(u.projectId) || (u.parentProjectId && familyIds.has(u.parentProjectId))) &&
              (u.items || []).some((ui) => ui.itemId === it.itemId)
          )
          .map((u) => {
            const row = u.items.find((ui) => ui.itemId === it.itemId)!;
            const usedQty = Number(row.quantity) || 0;
            const wastedQty = Number(row.wastageQuantity) || 0;
            const projObj = projects.find((pr) => pr.id === u.projectId);
            return {
              id: u.id,
              usageVoucherNumber: u.usageVoucherNumber,
              date: pickBestTimestamp(u.date, u.createdAt, u.usageDate) || u.date,
              subProjectId: u.projectId,
              siteId: u.siteId,
              projectCode: projObj?.projectId || p.projectId,
              projectName: u.projectName || projObj?.projectName || p.projectName,
              teamName: u.teamName || (teams || []).find((t) => t.id === u.teamId)?.teamName || 'Field Team',
              usedQty,
              wastedQty,
              totalConsumed: usedQty + wastedQty,
            };
          })
          .filter((r) => r.totalConsumed > 0);

        const stage1CentralFocReceipt = it.totalReceived;
        const stage2SiteIssue = it.dispatchedToSites;
        const centralFocPoolRem = it.centralWarehouseAvailable;

        const stage4TotalConsumed = it.totalUsed;
        const stage4Wastage = it.totalWastage || 0;
        const stage4InstalledUsage = Math.max(0, stage4TotalConsumed - stage4Wastage);

        const stage3TeamIssued =
          rawSiteTeamIssued > 0
            ? rawSiteTeamIssued
            : stage4TotalConsumed;
        const stage3TeamReturnedGood = rawSiteTeamReturnedGood;
        const stage3TeamInHand = Math.max(
          0,
          stage3TeamIssued - stage3TeamReturnedGood - stage4TotalConsumed
        );

        // Stage 5: Balance / Returnable Stock on Project Completion
        const effectiveSiteFocPool = stage2SiteIssue > 0 ? stage2SiteIssue : stage4TotalConsumed;
        const stage5SiteReturnableBalance = Math.max(0, effectiveSiteFocPool - stage4TotalConsumed);
        const stage5TotalClientReturnableBalance = Math.max(
          0,
          stage1CentralFocReceipt - stage4TotalConsumed
        );

        return {
          ...it,
          stage1CentralFocReceipt,
          stage2SiteIssue,
          centralFocPoolRem,
          stage3TeamIssued,
          stage3TeamReturnedGood,
          stage3TeamInHand,
          stage4InstalledUsage,
          stage4Wastage,
          stage4TotalConsumed,
          stage5SiteReturnableBalance,
          stage5TotalClientReturnableBalance,
          initialFocVouchers,
          siteIssueRequisitions,
          teamIssueRecords,
          usageRecords,
        };
      });

      // Build Sub-Project-wise 5-Stage Flow Breakdown (for Main Projects with Sub-Projects)
      // Each Sub-Project (e.g. Site Area Sub-Project or KT-RGL-0505, KT-ABK-0506) gets its own sequential flow & cumulative pool balance
      const itemCumulativeDeductionMap = new Map<string, number>();
      const subProjectFlows = childSubProjects.map((sp, spIndex) => {
        const spItems = freeStockItems.map((fi) => {
          const spUsageLogs = fi.usageRecords.filter(
            (u) =>
              u.subProjectId === sp.id ||
              (u.subProjectId === p.id &&
                Boolean(sp.siteId && sp.siteId !== 'ALL_AREAS' && u.siteId === sp.siteId))
          );
          const spInstalledUsed = spUsageLogs.reduce((s, u) => s + u.usedQty, 0);
          const spWastage = spUsageLogs.reduce((s, u) => s + u.wastedQty, 0);
          const spTotalConsumed = spInstalledUsed + spWastage;

          const effectiveSitePool = fi.stage2SiteIssue > 0 ? fi.stage2SiteIssue : fi.stage1CentralFocReceipt;
          const priorSubProjectsConsumed = itemCumulativeDeductionMap.get(fi.itemId) || 0;
          const openingSitePoolBeforeSp = Math.max(0, effectiveSitePool - priorSubProjectsConsumed);
          const closingSitePoolAfterSp = Math.max(0, openingSitePoolBeforeSp - spTotalConsumed);
          const closingTotalClientPoolAfterSp = Math.max(
            0,
            fi.stage1CentralFocReceipt - (priorSubProjectsConsumed + spTotalConsumed)
          );
          itemCumulativeDeductionMap.set(fi.itemId, priorSubProjectsConsumed + spTotalConsumed);

          return {
            itemId: fi.itemId,
            itemCode: fi.itemCode,
            itemName: fi.itemName,
            unit: fi.unit,
            stage1MainCentralFoc: fi.stage1CentralFocReceipt,
            stage2MainSiteIssue: fi.stage2SiteIssue,
            stage3MainTeamIssue: fi.stage3TeamIssued,
            openingSitePoolBeforeSp,
            spInstalledUsed,
            spWastage,
            spTotalConsumed,
            closingSitePoolAfterSp,
            closingTotalClientPoolAfterSp,
            finalMainSiteReturnable: fi.stage5SiteReturnableBalance,
            finalMainClientReturnable: fi.stage5TotalClientReturnableBalance,
            spUsageLogs,
          };
        });

        const spTotalInstalled = spItems.reduce((s, x) => s + x.spInstalledUsed, 0);
        const spTotalWastage = spItems.reduce((s, x) => s + x.spWastage, 0);
        const spTotalConsumed = spItems.reduce((s, x) => s + x.spTotalConsumed, 0);
        const spTotalLogsCount = spItems.reduce((s, x) => s + x.spUsageLogs.length, 0);

        return {
          subProject: sp,
          orderIndex: spIndex + 1,
          items: spItems,
          spTotalInstalled,
          spTotalWastage,
          spTotalConsumed,
          spTotalLogsCount,
        };
      });

      const totalRecv = freeStockItems.reduce((acc, it) => acc + it.stage1CentralFocReceipt, 0);
      const totalDispatched = freeStockItems.reduce((acc, it) => acc + it.stage2SiteIssue, 0);
      const totalTeamIssued = freeStockItems.reduce((acc, it) => acc + it.stage3TeamIssued, 0);
      const totalInstalled = freeStockItems.reduce((acc, it) => acc + it.stage4InstalledUsage, 0);
      const totalWastage = freeStockItems.reduce((acc, it) => acc + it.stage4Wastage, 0);
      const totalUsed = freeStockItems.reduce((acc, it) => acc + it.stage4TotalConsumed, 0);
      const totalRem = freeStockItems.reduce((acc, it) => acc + it.centralFocPoolRem, 0);
      const totalSiteReturnable = freeStockItems.reduce(
        (acc, it) => acc + it.stage5SiteReturnableBalance,
        0
      );
      const totalClientReturnable = freeStockItems.reduce(
        (acc, it) => acc + it.stage5TotalClientReturnableBalance,
        0
      );

      const primaryClientName =
        p.customerName ||
        activeVouchers.find((v) => familyIds.has(v.projectId))?.clientName ||
        'Registered Client';

      return {
        project: p,
        primaryClientName,
        resolvedBranch,
        isMainProject,
        childSubProjects,
        subProjectFlows,
        items: freeStockItems,
        totalRecv,
        totalDispatched,
        totalTeamIssued,
        totalInstalled,
        totalWastage,
        totalUsed,
        totalRem,
        totalSiteReturnable,
        totalClientReturnable,
      };
    });

    // Filter by project dropdown (matches either root project or one of its child sub-projects) & search
    return list.filter((item) => {
      if (
        selectedProjectFilter !== 'all' &&
        item.project.id !== selectedProjectFilter &&
        !item.childSubProjects.some((sp) => sp.id === selectedProjectFilter)
      ) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchProj =
          item.project.projectName.toLowerCase().includes(q) ||
          item.project.projectId.toLowerCase().includes(q) ||
          (item.project.siteIdentifier || '').toLowerCase().includes(q) ||
          item.childSubProjects.some(
            (sp) => sp.projectName.toLowerCase().includes(q) || sp.projectId.toLowerCase().includes(q)
          ) ||
          item.items.some((it) => it.itemName.toLowerCase().includes(q) || it.itemCode.toLowerCase().includes(q));
        if (!matchProj) return false;
      }
      return true;
    });
  }, [
    activeProjects,
    getProjectFreeStockList,
    selectedProjectFilter,
    searchQuery,
    activeVouchers,
    stockRequests,
    teamIssues,
    teamReturns,
    teams,
    projectUsages,
    projects,
    sites,
  ]);

  // Form Row management
  const handleItemSelect = (index: number, itemId: string) => {
    const selected = activeItems.find((i) => i.id === itemId) || items.find((i) => i.id === itemId);
    setFormItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        itemId,
        itemCode: selected?.itemCode || '',
        itemName: selected?.itemName || '',
        unit: selected?.unit || 'units',
      };
      return updated;
    });
  };

  const handleRowChange = (index: number, field: keyof NewItemRow, value: any) => {
    setFormItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleAddRow = () => {
    setFormItems((prev) => [
      ...prev,
      { itemId: '', itemCode: '', itemName: '', quantity: '', unit: 'm', remarks: '' },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (formItems.length <= 1) return;
    setFormItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProjectSelectionChange = (nextProjectId: string) => {
    setFormProjectId(nextProjectId);
    const proj = activeProjects.find((p) => p.id === nextProjectId) || projects.find((p) => p.id === nextProjectId);
    const resolved = resolveProjectBranch(proj);
    if (resolved.siteId) {
      setFormAssignedSiteId(resolved.siteId);
    } else if (!formAssignedSiteId && branchSites[0]?.id) {
      setFormAssignedSiteId(branchSites[0].id);
    }
    if (proj?.customerName && activeClients.some((c) => c.name === proj.customerName)) {
      setFormClientName(proj.customerName);
    }
  };

  const handleOpenLogModal = (preselectedClientName?: string) => {
    setEditingVoucher(null);
    setFormClientName(preselectedClientName || activeClients[0]?.name || '');
    const mainProjs = activeProjects.filter(
      (p) => p.projectScope === 'main' || activeProjects.some((sp) => sp.parentProjectId === p.id)
    );
    const defaultMode = mainProjs.length > 0 ? 'main' : 'all';
    setFormProjectMode(defaultMode);
    const initialProj =
      mainProjs[0] || activeProjects.find((p) => !p.parentProjectId) || activeProjects[0];
    setFormProjectId(initialProj?.id || '');
    const resolvedBranch = resolveProjectBranch(initialProj);
    setFormAssignedSiteId(resolvedBranch.siteId || branchSites[0]?.id || '');
    setFormDispatchNoteNo(`DN-${new Date().getFullYear()}-${String(clientFreeIssues.length + 1).padStart(4, '0')}`);
    setFormReceivedDate(getCountryTodayIsoDate());
    setFormReceivedBy(actorDisplayName || 'Logistics Coordinator');
    setFormStorageLocation(mainWarehouseName);
    setFormNotes('');
    setFormItems([{ itemId: '', itemCode: '', itemName: '', quantity: '', unit: 'm', remarks: '' }]);
    setFormError(null);
    setShowLogModal(true);
  };

  // Open Admin Correction / Edit Modal for an existing Client FOC Voucher
  const handleOpenEditVoucherModal = (entry: ClientFreeIssueEntry) => {
    setEditingVoucher(entry);
    setViewingVoucher(null);
    setFormClientName(entry.clientName || activeClients[0]?.name || '');

    const targetProj =
      activeProjects.find((p) => p.id === entry.projectId) ||
      projects.find((p) => p.id === entry.projectId);
    const isMain =
      entry.projectScope === 'main' ||
      targetProj?.projectScope === 'main' ||
      activeProjects.some((sp) => sp.parentProjectId === entry.projectId);

    setFormProjectMode(isMain ? 'main' : 'individual');
    setFormProjectId(entry.projectId);

    const resolvedBranch = resolveProjectBranch(targetProj);
    setFormAssignedSiteId(entry.assignedSiteId || resolvedBranch.siteId || branchSites[0]?.id || '');
    setFormDispatchNoteNo(entry.dispatchNoteNo || '');
    setFormReceivedDate(
      entry.receivedDate ? formatIsoToCountryYyyyMmDd(entry.receivedDate) : getCountryTodayIsoDate()
    );
    setFormReceivedBy(entry.receivedBy || actorDisplayName || 'Logistics Coordinator');
    setFormStorageLocation(mainWarehouseName);
    setFormNotes(entry.notes || '');
    setFormItems(
      entry.items && entry.items.length > 0
        ? entry.items.map((it) => ({
            itemId: it.itemId,
            itemCode: it.itemCode || '',
            itemName: it.itemName || '',
            quantity: it.quantity,
            unit: it.unit || 'units',
            remarks: it.remarks || '',
          }))
        : [{ itemId: '', itemCode: '', itemName: '', quantity: '', unit: 'm', remarks: '' }]
    );
    setFormError(null);
    setShowLogModal(true);
  };

  const handleSubmitNewIssue = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formClientName.trim()) {
      setFormError('Please select a Registered Client or register a new client.');
      return;
    }
    if (!formProjectId) {
      setFormError('Please select the Target Assigned Project.');
      return;
    }
    if (branchSites.length > 0 && !formAssignedSiteId) {
      setFormError('Please select the Allocated Site Branch for this project.');
      return;
    }
    if (!formDispatchNoteNo.trim()) {
      setFormError('Client Dispatch Note or Gate Pass number is required.');
      return;
    }

    const validRows: ClientFreeIssueItemRow[] = [];
    for (let i = 0; i < formItems.length; i++) {
      const row = formItems[i];
      if (!row.itemId) {
        setFormError(`Row #${i + 1}: Please select a material item.`);
        return;
      }
      const qty = Number(row.quantity);
      if (!qty || qty <= 0) {
        setFormError(`Row #${i + 1}: Please enter a valid quantity greater than zero.`);
        return;
      }
      validRows.push({
        itemId: row.itemId,
        itemCode: row.itemCode,
        itemName: row.itemName,
        quantity: qty,
        unit: row.unit,
        remarks: row.remarks?.trim() || undefined,
      });
    }

    const targetProj = activeProjects.find((p) => p.id === formProjectId) || projects.find((p) => p.id === formProjectId);
    const resolvedProjBranch = resolveProjectBranch(targetProj);
    const finalBranchId = resolvedProjBranch.siteId || formAssignedSiteId;
    const isAllAreasAlloc = finalBranchId === 'ALL_AREAS';
    const allocatedBranch = isAllAreasAlloc ? undefined : sites.find((s) => s.id === finalBranchId);
    const resolvedAllocId = isAllAreasAlloc ? 'ALL_AREAS' : allocatedBranch?.id;
    const resolvedAllocName = isAllAreasAlloc ? 'ALL AREAS' : allocatedBranch?.name;

    // Sync project scope and Assigned Site Branch onto the target project (and its sub-projects)
    if (targetProj) {
      const projUpdates: Partial<typeof targetProj> = {};
      if (formProjectMode === 'main' && !targetProj.parentProjectId && targetProj.projectScope !== 'main') {
        projUpdates.projectScope = 'main';
      }
      if (resolvedAllocId && !targetProj.siteId) {
        projUpdates.siteId = resolvedAllocId;
        projUpdates.siteName = resolvedAllocName;
      }
      if (Object.keys(projUpdates).length > 0) {
        updateProject(targetProj.id, projUpdates);
      }
      if (resolvedAllocId) {
        activeProjects
          .filter((sp) => sp.parentProjectId === targetProj.id)
          .forEach((sp) => {
            if (!sp.siteId) {
              updateProject(sp.id, {
                siteId: resolvedAllocId,
                siteName: resolvedAllocName,
              });
            }
          });
      }
    }

    const payload = {
      clientName: formClientName.trim(),
      projectId: formProjectId,
      projectName: targetProj?.projectName || 'Assigned Project',
      projectScope: (formProjectMode === 'main' ? 'main' : (targetProj?.projectScope || 'individual')) as 'individual' | 'main' | 'sub',
      parentProjectId: targetProj?.parentProjectId,
      parentProjectName: targetProj?.parentProjectName,
      assignedSiteId: resolvedAllocId || targetProj?.siteId,
      assignedSiteName: resolvedAllocName || targetProj?.siteName,
      siteIdentifier: targetProj?.siteIdentifier || '',
      dispatchNoteNo: formDispatchNoteNo.trim(),
      receivedDate: resolveTimestampForDateInput(formReceivedDate, editingVoucher?.receivedDate),
      receivedBy: formReceivedBy.trim(),
      storageLocation: mainWarehouseName,
      items: validRows,
      notes: formNotes.trim() || undefined,
    };

    if (editingVoucher) {
      updateClientFreeIssue(editingVoucher.id, payload);
      setEditingVoucher(null);
      setShowLogModal(false);
      triggerToast(
        `FOC Voucher ${editingVoucher.voucherNumber} corrected & reassigned to Project "${targetProj?.projectName || 'Project'}" (Branch: ${resolvedAllocName || 'Site Branch'})!`
      );
      return;
    }

    addClientFreeIssue(payload);

    setShowLogModal(false);
    triggerToast(
      `Client FOC Shipment (${formDispatchNoteNo.trim()}) received into ${mainWarehouseName} & allocated exclusively to ${allocatedBranch?.name || 'Site Branch'} (${targetProj?.projectName || 'Project'}).`
    );
  };

  const handleDeleteEntry = (entry: ClientFreeIssueEntry) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Client Free-Issue Stock Voucher?',
      message: `Are you sure you want to delete voucher ${entry.voucherNumber} from "${entry.clientName}" for Project "${entry.projectName}"?`,
      onConfirm: () => {
        deleteClientFreeIssue(entry.id);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleExportCsv = () => {
    const data = filteredVouchers.flatMap((v) =>
      v.items.map((it) => ({
        'Voucher No': v.voucherNumber,
        'Client / Principal': v.clientName,
        'Dispatch Note No': v.dispatchNoteNo,
        'Project Name': v.projectName,
        'Site / WBS Identifier': v.siteIdentifier || 'N/A',
        'Received Date': formatDate(v.receivedDate),
        'Item Code': it.itemCode,
        'Item Name': it.itemName,
        'Quantity Received': it.quantity,
        'Unit': it.unit,
        'Storage Location': v.storageLocation || 'Main Central Warehouse',
        'Received By': v.receivedBy,
        'Notes': v.notes || '',
      }))
    );
    exportToCsv('Client_Free_Issue_Stock', data as any);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {clientToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-500/40 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{clientToast}</span>
        </div>
      )}

      {/* Executive Header Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold tracking-wider uppercase">
              <Gift className="w-3.5 h-3.5 text-indigo-400" />
              <span>Client-Supplied Materials (FOC) • Synced with Master Client Register</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex flex-wrap items-center gap-3">
              <span>Client Free-Issue Stock</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Registered Clients: {activeClients.length}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Track fiber cables, equipment, hardware, and project materials supplied free of cost (FOC) by registered clients and project principals. Directly connected to the Master Registry&apos;s <strong>Client Register</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleOpenNewClientModal}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/25"
            >
              <Plus className="w-4 h-4" />
              <span>New Client Register</span>
            </button>
            <button
              onClick={() => handleOpenLogModal()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Client Shipment (DN)</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 backdrop-blur-md p-3.5 sm:p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Client Dispatches</span>
              <FileCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {kpis.totalVouchers}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Across {kpis.assignedProjectsCount} assigned projects
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md p-3.5 sm:p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Total Received (FOC)</span>
              <Boxes className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {formatNumber(kpis.totalUnitsReceived)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Free-of-cost (Rs. 0.00 liability)
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md p-3.5 sm:p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Dispatched to Sites</span>
              <TrendingDown className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-sky-300 font-mono">
              {formatNumber(kpis.totalUnitsDispatchedToSites)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Approved & sent to site branches
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md p-3.5 sm:p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Installed on Projects</span>
              <TrendingDown className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
              {formatNumber(kpis.totalUnitsInstalled)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Logged field installation
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md p-3.5 sm:p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Central Pool Balance</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
              {formatNumber(kpis.netRemaining)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Available in Main Warehouse Pool
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Segmented Tab Buttons */}
          <div className="flex flex-wrap items-center p-1 bg-slate-100 rounded-xl w-fit gap-1">
            <button
              onClick={() => setActiveTab('project-balances')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'project-balances'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
              <span>Project Free Stock Balances ({projectSummaries.filter((p) => p.items.length > 0).length})</span>
            </button>
            <button
              onClick={() => setActiveTab('inbound-vouchers')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'inbound-vouchers'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Dispatch Vouchers & History ({filteredVouchers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('client-register')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'client-register'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              <span>Client Register ({activeClients.length})</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search client, dispatch, project, item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Project Filter */}
            {activeTab !== 'client-register' && (
              <select
                value={selectedProjectFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedProjectFilter(val);
                  const chosen = activeProjects.find((p) => p.id === val);
                  if (chosen?.parentProjectId) {
                    setSelectedSubProjectByParent((prev) => ({
                      ...prev,
                      [chosen.parentProjectId!]: chosen.id,
                    }));
                  } else if (chosen) {
                    setSelectedSubProjectByParent((prev) => ({
                      ...prev,
                      [chosen.id]: 'all',
                    }));
                  }
                }}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">All Projects</option>
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.parentProjectId ? `↳ [${p.projectId}] ${p.projectName}` : `[${p.projectId}] ${p.projectName}`}
                  </option>
                ))}
              </select>
            )}

            {/* Client Filter */}
            <select
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Registered Clients ({allClientFilterNames.length})</option>
              {allClientFilterNames.map((cName) => (
                <option key={cName} value={cName}>
                  {cName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab 1: Live Project Free Stock Allocation & Consumption Balances */}
        {activeTab === 'project-balances' && (
          <div className="space-y-4 pt-2">
            {projectSummaries.filter((p) => p.items.length > 0).length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Gift className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">No Client Free-Issue Stock Logged Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  When a registered client or principal issues free materials under a dispatch note or gate pass, click &quot;Log Client Shipment (DN)&quot; above to record them.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    onClick={handleOpenNewClientModal}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Client Register</span>
                  </button>
                  <button
                    onClick={() => handleOpenLogModal()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Log First Client Shipment</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-7">
                {/* Compact Flow Guide Bar */}
                <div className="px-4 py-2.5 bg-slate-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-extrabold uppercase">
                      <Gift className="w-3 h-3" />
                      Central FOC Flow
                    </span>
                    <span className="text-slate-200 font-medium">
                      1. Central FOC → 2. Site Issue → 3. Team Issue → 4. Used &amp; Wastage (by Sub-Project) → 5. Returnable Balance
                    </span>
                  </div>
                  {expandedTraceKey && (
                    <button
                      type="button"
                      onClick={() => setExpandedTraceKey(null)}
                      className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/20 font-bold text-[11px] cursor-pointer"
                    >
                      Close Open Item Flow
                    </button>
                  )}
                </div>

                {projectSummaries
                  .filter((p) => p.items.length > 0)
                  .map(
                    (
                      {
                        project,
                        primaryClientName,
                        resolvedBranch,
                        isMainProject,
                        childSubProjects,
                        subProjectFlows,
                        items: freeItems,
                        totalRecv,
                        totalDispatched,
                        totalTeamIssued,
                        totalUsed,
                        totalClientReturnable,
                      },
                      cardIdx
                    ) => {
                      // Distinct, bold high-contrast color themes per Main Project card so each Main Project stands out clearly
                      const PROJECT_CARD_THEMES = [
                        {
                          frame: 'border-2 border-indigo-700 ring-4 ring-indigo-600/15',
                          headerBg: 'bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900',
                          badgeBg: 'bg-indigo-500 text-white border-indigo-300/40',
                          scopeBar: 'bg-indigo-100/80 border-b-2 border-indigo-300',
                          activeMainBtn: 'bg-indigo-800 text-white shadow-sm ring-2 ring-indigo-400',
                        },
                        {
                          frame: 'border-2 border-teal-700 ring-4 ring-teal-600/15',
                          headerBg: 'bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900',
                          badgeBg: 'bg-teal-500 text-white border-teal-300/40',
                          scopeBar: 'bg-teal-100/80 border-b-2 border-teal-300',
                          activeMainBtn: 'bg-teal-800 text-white shadow-sm ring-2 ring-teal-400',
                        },
                        {
                          frame: 'border-2 border-purple-700 ring-4 ring-purple-600/15',
                          headerBg: 'bg-gradient-to-r from-purple-950 via-purple-900 to-slate-900',
                          badgeBg: 'bg-purple-500 text-white border-purple-300/40',
                          scopeBar: 'bg-purple-100/80 border-b-2 border-purple-300',
                          activeMainBtn: 'bg-purple-800 text-white shadow-sm ring-2 ring-purple-400',
                        },
                        {
                          frame: 'border-2 border-blue-700 ring-4 ring-blue-600/15',
                          headerBg: 'bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900',
                          badgeBg: 'bg-blue-500 text-white border-blue-300/40',
                          scopeBar: 'bg-blue-100/80 border-b-2 border-blue-300',
                          activeMainBtn: 'bg-blue-800 text-white shadow-sm ring-2 ring-blue-400',
                        },
                      ];
                      const theme = PROJECT_CARD_THEMES[cardIdx % PROJECT_CARD_THEMES.length];

                      const selectedSpId =
                        selectedProjectFilter !== 'all' &&
                        childSubProjects.some((sp) => sp.id === selectedProjectFilter)
                          ? selectedProjectFilter
                          : selectedSubProjectByParent[project.id] || 'all';

                      const activeSubFlow =
                        selectedSpId !== 'all'
                          ? subProjectFlows.find((spf) => spf.subProject.id === selectedSpId) || null
                          : null;

                      const selectScope = (nextSpId: string) => {
                        setSelectedSubProjectByParent((prev) => ({
                          ...prev,
                          [project.id]: nextSpId,
                        }));
                        if (
                          selectedProjectFilter !== 'all' &&
                          childSubProjects.some((sp) => sp.id === selectedProjectFilter)
                        ) {
                          setSelectedProjectFilter(nextSpId === 'all' ? project.id : nextSpId);
                        }
                      };

                      const childIds = new Set(childSubProjects.map((sp) => sp.id));
                      const projectVouchers = activeVouchers.filter(
                        (v) =>
                          v.projectId === project.id ||
                          v.parentProjectId === project.id ||
                          childIds.has(v.projectId)
                      );

                      return (
                        <div
                          key={project.id}
                          className={`rounded-2xl bg-white shadow-lg overflow-hidden ${theme.frame}`}
                        >
                          {/* Bold, High-Contrast Main Project Header Banner */}
                          <div
                            className={`p-4 sm:p-5 ${theme.headerBg} text-white flex flex-col xl:flex-row xl:items-center justify-between gap-4`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wider ${theme.badgeBg}`}
                                >
                                  <FolderKanban className="w-3 h-3" />
                                  {isMainProject
                                    ? `MAIN PROJECT #${cardIdx + 1}`
                                    : `PROJECT #${cardIdx + 1}`}
                                </span>
                                <span className="font-mono text-xs font-black text-slate-950 bg-amber-400 border border-amber-300 px-2.5 py-0.5 rounded-md shadow-2xs">
                                  {project.projectId}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/15 border border-white/25 text-white text-[10px] font-extrabold uppercase">
                                  <Gift className="w-3 h-3 text-amber-300" />
                                  Central FOC
                                </span>
                                {resolvedBranch.siteName && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 text-[11px] font-extrabold">
                                    <Building2 className="w-3 h-3 text-emerald-300" />
                                    {resolvedBranch.siteName}
                                  </span>
                                )}
                              </div>

                              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                                {project.projectName}
                              </h3>

                              <div className="text-xs text-slate-200 flex flex-wrap items-center gap-3 pt-0.5">
                                <span className="bg-white/10 px-2.5 py-0.5 rounded-md border border-white/15">
                                  Client: <strong className="text-white">{primaryClientName}</strong>
                                </span>
                                <span className="bg-white/10 px-2.5 py-0.5 rounded-md border border-white/15">
                                  FOC Items: <strong className="text-amber-300">{freeItems.length}</strong>
                                </span>
                                {isMainProject && subProjectFlows.length > 0 && (
                                  <span className="bg-teal-500/25 text-teal-100 px-2.5 py-0.5 rounded-md border border-teal-400/40 font-bold">
                                    Linked Sub-Projects: <strong className="text-white">{subProjectFlows.length}</strong>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Right Side: High-Contrast 5-Stage Numbers + Full Project Report Button */}
                            <div className="flex flex-wrap items-center gap-2.5">
                              <div className="flex flex-wrap items-center gap-1.5 text-xs bg-slate-950/60 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/20">
                                <div className="px-1.5">
                                  <div className="text-[10px] text-indigo-300 font-extrabold uppercase">1. Central</div>
                                  <div className="font-mono font-black text-white text-sm">{formatNumber(totalRecv)}</div>
                                </div>
                                <div className="h-6 w-px bg-white/15" />
                                <div className="px-1.5">
                                  <div className="text-[10px] text-sky-300 font-extrabold uppercase">2. Site</div>
                                  <div className="font-mono font-bold text-sky-200 text-sm">{formatNumber(totalDispatched)}</div>
                                </div>
                                <div className="h-6 w-px bg-white/15" />
                                <div className="px-1.5">
                                  <div className="text-[10px] text-blue-300 font-extrabold uppercase">3. Team</div>
                                  <div className="font-mono font-bold text-blue-200 text-sm">{formatNumber(totalTeamIssued)}</div>
                                </div>
                                <div className="h-6 w-px bg-white/15" />
                                <div className="px-1.5">
                                  <div className="text-[10px] text-amber-300 font-extrabold uppercase">4. Used</div>
                                  <div className="font-mono font-bold text-amber-200 text-sm">{formatNumber(totalUsed)}</div>
                                </div>
                                <div className="h-6 w-px bg-white/15" />
                                <div className="px-1.5">
                                  <div className="text-[10px] text-emerald-300 font-extrabold uppercase">5. Returnable</div>
                                  <div className="font-mono font-black text-emerald-300 text-sm">{formatNumber(totalClientReturnable)}</div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setProjectReportModalId(project.id)}
                                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 text-xs font-black shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                                title="Open Full Main Project + Sub-Projects A4/PDF Report"
                              >
                                <Printer className="w-4 h-4" />
                                <span>Full Project Report</span>
                              </button>
                            </div>
                          </div>

                          {/* Bold Scope Switcher Strip (Main Project vs Individual Sub-Projects) */}
                          {isMainProject && subProjectFlows.length > 0 && (
                            <div
                              className={`px-4 sm:px-5 py-3 ${theme.scopeBar} flex flex-wrap items-center gap-2`}
                            >
                              <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 mr-1">
                                View Scope:
                              </span>
                              <button
                                type="button"
                                onClick={() => selectScope('all')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                                  !activeSubFlow
                                    ? theme.activeMainBtn
                                    : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                Main Project Overview (All)
                              </button>
                              {subProjectFlows.map((spf) => {
                                const isActive = activeSubFlow?.subProject.id === spf.subProject.id;
                                return (
                                  <button
                                    key={spf.subProject.id}
                                    type="button"
                                    onClick={() => selectScope(isActive ? 'all' : spf.subProject.id)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-extrabold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                      isActive
                                        ? 'bg-teal-800 text-white shadow-sm ring-2 ring-teal-400'
                                        : 'bg-white text-teal-950 border-2 border-teal-600/60 hover:bg-teal-50'
                                    }`}
                                  >
                                    <span>↳ {spf.subProject.projectId}</span>
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[10px] font-sans font-black ${
                                        isActive
                                          ? 'bg-teal-950/70 text-teal-100'
                                          : 'bg-teal-100 text-teal-900'
                                      }`}
                                    >
                                      {formatNumber(spf.spTotalConsumed)}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* VIEW MODE A: MAIN PROJECT OVERVIEW (SINGLE CLEAN TABLE — NO DUPLICATION) */}
                          {!activeSubFlow ? (
                            <div className="p-4 sm:p-5 space-y-4">
                              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-800 font-extrabold uppercase text-[10px]">
                                      <th className="py-2.5 px-3">Item</th>
                                      <th className="py-2.5 px-3 text-right bg-indigo-100/70 text-indigo-950">
                                        1. Central FOC
                                      </th>
                                      <th className="py-2.5 px-3 text-right">2. Site Issue</th>
                                      <th className="py-2.5 px-3 text-right">3. Team Issue</th>
                                      <th className="py-2.5 px-3 text-right">
                                        4. Used &amp; Wastage (Where It Went)
                                      </th>
                                      <th className="py-2.5 px-3 text-right bg-emerald-100/70 text-emerald-950">
                                        5. Returnable Bal
                                      </th>
                                      <th className="py-2.5 px-3 text-center">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200">
                                    {freeItems.map((it) => {
                                      const rowTraceKey = `${project.id}:${it.itemId}`;
                                      const isExpanded = expandedTraceKey === rowTraceKey;
                                      const catalogItem = resolveCatalogItem(
                                        it.itemId,
                                        it.itemCode,
                                        it.itemName,
                                        it.unit
                                      );

                                      // Build compact distribution chips per sub-project (and direct main project if any)
                                      const subBreakdownChips = subProjectFlows
                                        .map((spf) => {
                                          const spItem = spf.items.find((x) => x.itemId === it.itemId);
                                          return {
                                            spId: spf.subProject.id,
                                            code: spf.subProject.projectId,
                                            consumed: spItem?.spTotalConsumed || 0,
                                          };
                                        })
                                        .filter((c) => c.consumed > 0);

                                      const directMainConsumed = it.usageRecords
                                        .filter((u) => u.subProjectId === project.id)
                                        .reduce((s, u) => s + u.totalConsumed, 0);

                                      return (
                                        <React.Fragment key={it.itemId}>
                                          <tr
                                            onClick={() =>
                                              setExpandedTraceKey((prev) =>
                                                prev === rowTraceKey ? null : rowTraceKey
                                              )
                                            }
                                            className={`transition-colors cursor-pointer ${
                                              isExpanded
                                                ? 'bg-emerald-50/80 border-l-4 border-l-emerald-600'
                                                : 'hover:bg-indigo-50/40 border-l-4 border-l-indigo-600'
                                            }`}
                                          >
                                            {/* Item with Thumbnail */}
                                            <td className="py-3 px-3">
                                              <div className="flex items-center gap-2.5">
                                                {isExpanded ? (
                                                  <ChevronUp className="w-4 h-4 text-emerald-700 shrink-0" />
                                                ) : (
                                                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                                )}
                                                {catalogItem.imageUrl ? (
                                                  <img
                                                    src={catalogItem.imageUrl}
                                                    alt={it.itemName}
                                                    className="w-9 h-9 rounded-lg object-cover border border-slate-200 bg-white shrink-0 shadow-2xs"
                                                  />
                                                ) : (
                                                  <div className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                                                    <Package className="w-4 h-4" />
                                                  </div>
                                                )}
                                                <div>
                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-mono font-bold text-slate-900">
                                                      {it.itemCode}
                                                    </span>
                                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-600 text-white uppercase">
                                                      Central FOC
                                                    </span>
                                                  </div>
                                                  <div className="font-bold text-slate-800 mt-0.5">
                                                    {it.itemName}
                                                  </div>
                                                </div>
                                              </div>
                                            </td>

                                            {/* 1. Central FOC */}
                                            <td className="py-3 px-3 text-right font-mono bg-indigo-50/30 whitespace-nowrap">
                                              <div className="text-sm font-black text-indigo-950">
                                                {formatNumber(it.stage1CentralFocReceipt)}{' '}
                                                <span className="text-[11px] font-normal text-indigo-700">
                                                  {it.unit}
                                                </span>
                                              </div>
                                              <div className="text-[10px] font-sans text-indigo-700">
                                                Central Left: <strong>{formatNumber(it.centralFocPoolRem)}</strong>
                                              </div>
                                            </td>

                                            {/* 2. Site Issue */}
                                            <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                                              <div className="text-sm font-bold text-sky-800">
                                                {formatNumber(it.stage2SiteIssue)}{' '}
                                                <span className="text-[11px] font-normal text-slate-500">
                                                  {it.unit}
                                                </span>
                                              </div>
                                              <div className="text-[10px] font-sans text-slate-500">
                                                {resolvedBranch.siteName || 'Site Branch'}
                                              </div>
                                            </td>

                                            {/* 3. Team Issue */}
                                            <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                                              <div className="text-sm font-bold text-blue-800">
                                                {formatNumber(it.stage3TeamIssued)}{' '}
                                                <span className="text-[11px] font-normal text-slate-500">
                                                  {it.unit}
                                                </span>
                                              </div>
                                              {it.stage3TeamReturnedGood > 0 && (
                                                <div className="text-[10px] font-sans font-semibold text-emerald-700">
                                                  Ret: +{formatNumber(it.stage3TeamReturnedGood)}
                                                </div>
                                              )}
                                            </td>

                                            {/* 4. Used & Wastage + Where It Went (Sub-Project Pills) */}
                                            <td className="py-3 px-3 text-right">
                                              <div className="font-mono text-sm font-black text-slate-900 whitespace-nowrap">
                                                {formatNumber(it.stage4TotalConsumed)}{' '}
                                                <span className="text-[11px] font-normal text-slate-500">
                                                  {it.unit}
                                                </span>
                                              </div>
                                              <div className="text-[10px] whitespace-nowrap">
                                                <span className="text-teal-700 font-bold">
                                                  Used: {formatNumber(it.stage4InstalledUsage)}
                                                </span>
                                                {' · '}
                                                <span className="text-rose-600 font-bold">
                                                  Waste: {formatNumber(it.stage4Wastage)}
                                                </span>
                                              </div>
                                              {(subBreakdownChips.length > 0 || directMainConsumed > 0) && (
                                                <div
                                                  className="mt-1.5 flex flex-wrap justify-end gap-1"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  {subBreakdownChips.map((chip) => (
                                                    <button
                                                      key={chip.spId}
                                                      type="button"
                                                      onClick={() => selectScope(chip.spId)}
                                                      className="px-1.5 py-0.5 rounded bg-teal-50 hover:bg-teal-600 text-teal-800 hover:text-white border border-teal-200 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                                                      title={`Click to view ${chip.code} Sub-Project Flow`}
                                                    >
                                                      {chip.code}: {formatNumber(chip.consumed)}
                                                    </button>
                                                  ))}
                                                  {directMainConsumed > 0 && (
                                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px] font-bold">
                                                      Main: {formatNumber(directMainConsumed)}
                                                    </span>
                                                  )}
                                                </div>
                                              )}
                                            </td>

                                            {/* 5. Returnable Balance */}
                                            <td className="py-3 px-3 text-right font-mono bg-emerald-50/40 whitespace-nowrap">
                                              <div className="text-sm font-black text-emerald-800">
                                                {formatNumber(it.stage5TotalClientReturnableBalance)}{' '}
                                                <span className="text-[11px] font-normal text-emerald-700">
                                                  {it.unit}
                                                </span>
                                              </div>
                                              <div className="text-[10px] font-sans font-semibold text-indigo-700">
                                                Site Bal: {formatNumber(it.stage5SiteReturnableBalance)} {it.unit}
                                              </div>
                                            </td>

                                            {/* Actions */}
                                            <td
                                              className="py-3 px-3 text-center whitespace-nowrap"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <div className="inline-flex items-center gap-1.5">
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    setExpandedTraceKey((prev) =>
                                                      prev === rowTraceKey ? null : rowTraceKey
                                                    )
                                                  }
                                                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                                    isExpanded
                                                      ? 'bg-emerald-700 text-white border-emerald-800'
                                                      : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
                                                  }`}
                                                  title="Expand complete step-by-step Item Flow (Central → Site → Team → Sub-Projects → Balance)"
                                                >
                                                  <Layers className="w-3.5 h-3.5" />
                                                  <span>{isExpanded ? 'Hide Flow' : 'Item Flow'}</span>
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    setSingleItemReportModal({
                                                      projectId: project.id,
                                                      itemId: it.itemId,
                                                    })
                                                  }
                                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer"
                                                  title="Open & Print Official A4 Report for this Individual Item"
                                                >
                                                  <Printer className="w-3.5 h-3.5" />
                                                  <span>Item Report</span>
                                                </button>
                                              </div>
                                            </td>
                                          </tr>

                                          {isExpanded && (
                                            <tr className="bg-slate-100/70">
                                              <td colSpan={7} className="p-2 sm:p-3">
                                                <ItemTraceabilitySummaryPanel
                                                  item={catalogItem}
                                                  mode={resolvedBranch.siteId ? 'site' : 'central'}
                                                  siteId={resolvedBranch.siteId || undefined}
                                                  focProjectId={project.id}
                                                  onClose={() => setExpandedTraceKey(null)}
                                                />
                                              </td>
                                            </tr>
                                          )}
                                        </React.Fragment>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>

                              {/* Compact Clickable Sub-Projects Summary Row (No Giant Duplicate Tables!) */}
                              {isMainProject && subProjectFlows.length > 0 && (
                                <div className="pt-3 border-t border-slate-100 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                                      Linked Sub-Projects ({subProjectFlows.length}) — Click any Sub-Project to view its Flow or Report
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    {subProjectFlows.map((spf) => (
                                      <div
                                        key={spf.subProject.id}
                                        onClick={() => selectScope(spf.subProject.id)}
                                        className="p-3 rounded-xl border-2 border-teal-500/80 bg-teal-50/70 hover:bg-teal-100/70 hover:border-teal-600 transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs"
                                      >
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-mono text-xs font-extrabold text-teal-900">
                                              ↳ {spf.subProject.projectId}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white border border-teal-300 text-teal-800 font-bold">
                                              {spf.spTotalLogsCount} log(s)
                                            </span>
                                          </div>
                                          <div className="text-xs font-bold text-slate-800 truncate mt-0.5">
                                            {spf.subProject.projectName}
                                          </div>
                                          <div className="text-[11px] text-slate-600 font-mono mt-1">
                                            Used: <strong className="text-teal-800">{formatNumber(spf.spTotalInstalled)}</strong>
                                            {' · '}
                                            Waste: <strong className="text-rose-600">{formatNumber(spf.spTotalWastage)}</strong>
                                          </div>
                                        </div>
                                        <div
                                          className="flex flex-col gap-1 shrink-0"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <button
                                            type="button"
                                            onClick={() => selectScope(spf.subProject.id)}
                                            className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                                          >
                                            <span>View Flow</span>
                                            <ArrowRight className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setSubProjectReportModal({
                                                parentProjectId: project.id,
                                                subProjectId: spf.subProject.id,
                                              })
                                            }
                                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                                          >
                                            <Printer className="w-3 h-3" />
                                            <span>Report</span>
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Logged FOC Vouchers Bar (Preserves Admin Correction / Reassign Action) */}
                              {projectVouchers.length > 0 && (
                                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/80 px-3.5 py-2.5 rounded-xl border border-slate-200/70">
                                  <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                                    <FileCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <span>Central FOC Vouchers ({projectVouchers.length}):</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {projectVouchers.map((pv) => (
                                      <div
                                        key={pv.id}
                                        className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                                      >
                                        <span className="font-mono font-bold text-indigo-700">{pv.voucherNumber}</span>
                                        <span className="text-slate-400">•</span>
                                        <span className="font-mono text-[11px] font-semibold text-slate-700">
                                          {pv.dispatchNoteNo}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setViewingVoucher(pv)}
                                          className="text-slate-400 hover:text-indigo-600 p-0.5 cursor-pointer"
                                          title="View Voucher Details"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        {isCentralAdmin && (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenEditVoucherModal(pv)}
                                            className="ml-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-300 text-[10px] font-extrabold transition-colors cursor-pointer"
                                            title="Admin Correction: Change Project or Edit FOC Items"
                                          >
                                            <RefreshCw className="w-3 h-3" />
                                            <span>Edit / Reassign</span>
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* VIEW MODE B: CLEAN DEDICATED SUB-PROJECT FLOW VIEW */
                            <div className="p-4 sm:p-5 space-y-4">
                              {/* Sub-Project Flow Banner */}
                              <div className="p-3.5 rounded-xl bg-teal-950 text-white flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-teal-500/30 border border-teal-400/40 font-mono text-[11px] font-extrabold text-teal-100">
                                      SUB-PROJECT #{activeSubFlow.orderIndex}: {activeSubFlow.subProject.projectId}
                                    </span>
                                    <h4 className="text-sm font-extrabold text-white">
                                      {activeSubFlow.subProject.projectName}
                                    </h4>
                                    {activeSubFlow.subProject.siteIdentifier && (
                                      <span className="text-[11px] text-teal-200 bg-white/10 px-2 py-0.5 rounded font-mono">
                                        Site: {activeSubFlow.subProject.siteIdentifier}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-teal-200 mt-1">
                                    Showing dedicated material usage, wastage, and field vouchers for{' '}
                                    <strong>{activeSubFlow.subProject.projectId}</strong> under Main Project{' '}
                                    <strong>[{project.projectId}]</strong>.
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => selectScope('all')}
                                    className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Back to Main Project</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSubProjectReportModal({
                                        parentProjectId: project.id,
                                        subProjectId: activeSubFlow.subProject.id,
                                      })
                                    }
                                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Sub-Project Report</span>
                                  </button>
                                </div>
                              </div>

                              {/* Clean 4-Card Sub-Project Summary Strip */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                                <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200">
                                  <div className="text-[10px] font-bold uppercase text-teal-800">
                                    Used on {activeSubFlow.subProject.projectId}
                                  </div>
                                  <div className="text-lg font-black font-mono text-teal-900 mt-0.5">
                                    {formatNumber(activeSubFlow.spTotalInstalled)}
                                  </div>
                                </div>
                                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
                                  <div className="text-[10px] font-bold uppercase text-rose-800">
                                    Wastage on {activeSubFlow.subProject.projectId}
                                  </div>
                                  <div className="text-lg font-black font-mono text-rose-700 mt-0.5">
                                    {formatNumber(activeSubFlow.spTotalWastage)}
                                  </div>
                                </div>
                                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                                  <div className="text-[10px] font-bold uppercase text-amber-800">
                                    Sub-Project Total Consumed
                                  </div>
                                  <div className="text-lg font-black font-mono text-amber-900 mt-0.5">
                                    {formatNumber(activeSubFlow.spTotalConsumed)}
                                  </div>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                  <div className="text-[10px] font-bold uppercase text-slate-600">
                                    Field Usage Vouchers
                                  </div>
                                  <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
                                    {activeSubFlow.spTotalLogsCount}
                                  </div>
                                </div>
                              </div>

                              {/* Clean 6-Column Sub-Project Materials Table */}
                              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px]">
                                      <th className="py-2.5 px-3">Item</th>
                                      <th className="py-2.5 px-3 text-right">Main Project FOC Stock</th>
                                      <th className="py-2.5 px-3 text-right bg-teal-50/70 text-teal-950">
                                        Used on [{activeSubFlow.subProject.projectId}]
                                      </th>
                                      <th className="py-2.5 px-3 text-right bg-rose-50/60 text-rose-950">
                                        Wastage
                                      </th>
                                      <th className="py-2.5 px-3 text-right bg-amber-50/60 text-amber-950">
                                        Sub-Project Total
                                      </th>
                                      <th className="py-2.5 px-3 text-right bg-emerald-50/70 text-emerald-950">
                                        Remaining Main Project Bal
                                      </th>
                                      <th className="py-2.5 px-3 text-center">Item Report</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {activeSubFlow.items.map((spIt) => {
                                      const spCatItem = resolveCatalogItem(
                                        spIt.itemId,
                                        spIt.itemCode,
                                        spIt.itemName,
                                        spIt.unit
                                      );
                                      return (
                                      <tr
                                        key={spIt.itemId}
                                        className={
                                          spIt.spTotalConsumed > 0
                                            ? 'bg-white hover:bg-teal-50/30'
                                            : 'bg-slate-50/40 text-slate-400'
                                        }
                                      >
                                        <td className="py-2.5 px-3">
                                          <div className="flex items-center gap-2.5">
                                            {spCatItem.imageUrl ? (
                                              <img
                                                src={spCatItem.imageUrl}
                                                alt={spIt.itemName}
                                                className="w-8 h-8 rounded-lg object-cover border border-slate-200 bg-white shrink-0 shadow-2xs"
                                              />
                                            ) : (
                                              <div className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                                                <Package className="w-3.5 h-3.5" />
                                              </div>
                                            )}
                                            <div>
                                              <div className="flex items-center gap-1.5">
                                                <span className="font-mono font-bold text-slate-900">
                                                  {spIt.itemCode}
                                                </span>
                                                <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white text-[9px] font-extrabold uppercase">
                                                  Central FOC
                                                </span>
                                              </div>
                                              <div className="font-semibold text-slate-800">{spIt.itemName}</div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                                          <div className="font-bold text-indigo-800">
                                            Central: {formatNumber(spIt.stage1MainCentralFoc)} {spIt.unit}
                                          </div>
                                          <div className="text-[10px] text-sky-700">
                                            Site Issue: {formatNumber(spIt.stage2MainSiteIssue)} {spIt.unit}
                                          </div>
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-teal-800 bg-teal-50/20 whitespace-nowrap">
                                          {formatNumber(spIt.spInstalledUsed)} {spIt.unit}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 bg-rose-50/20 whitespace-nowrap">
                                          {formatNumber(spIt.spWastage)} {spIt.unit}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 bg-amber-50/30 whitespace-nowrap">
                                          {formatNumber(spIt.spTotalConsumed)} {spIt.unit}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono bg-emerald-50/35 whitespace-nowrap">
                                          <div className="font-black text-emerald-800">
                                            {formatNumber(spIt.finalMainClientReturnable)} {spIt.unit}
                                          </div>
                                          <div className="text-[10px] text-indigo-700 font-sans">
                                            Site Bal: {formatNumber(spIt.finalMainSiteReturnable)} {spIt.unit}
                                          </div>
                                        </td>
                                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setSingleItemReportModal({
                                                projectId: project.id,
                                                itemId: spIt.itemId,
                                              })
                                            }
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 text-[11px] font-bold transition-colors cursor-pointer"
                                          >
                                            <Printer className="w-3 h-3" />
                                            <span>Report</span>
                                          </button>
                                        </td>
                                      </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>

                              {/* Clean Field Usage Vouchers Table for this Sub-Project */}
                              <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-700">
                                  Field Usage Vouchers Logged on [{activeSubFlow.subProject.projectId}] ({activeSubFlow.spTotalLogsCount})
                                </div>
                                {activeSubFlow.spTotalLogsCount === 0 ? (
                                  <div className="p-5 text-center text-xs text-slate-500">
                                    No usage vouchers logged under {activeSubFlow.subProject.projectId} yet.
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr className="bg-white border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                                          <th className="py-2 px-3">Voucher #</th>
                                          <th className="py-2 px-3">Date</th>
                                          <th className="py-2 px-3">Field Team</th>
                                          <th className="py-2 px-3">Material</th>
                                          <th className="py-2 px-3 text-right">Used</th>
                                          <th className="py-2 px-3 text-right">Wastage</th>
                                          <th className="py-2 px-3 text-right">Total</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {activeSubFlow.items.flatMap((spIt) =>
                                          spIt.spUsageLogs.map((uLog) => (
                                            <tr key={`${spIt.itemId}-${uLog.id}`} className="hover:bg-slate-50/70">
                                              <td className="py-2 px-3 font-mono font-bold text-teal-800">
                                                {uLog.usageVoucherNumber}
                                              </td>
                                              <td className="py-2 px-3 text-slate-600">{formatDateTime(uLog.date)}</td>
                                              <td className="py-2 px-3 font-semibold text-slate-800">
                                                {uLog.teamName}
                                              </td>
                                              <td className="py-2 px-3 text-slate-800">
                                                <span className="font-mono font-bold mr-1">{spIt.itemCode}</span>
                                                {spIt.itemName}
                                              </td>
                                              <td className="py-2 px-3 text-right font-mono font-bold text-teal-700">
                                                {formatNumber(uLog.usedQty)} {spIt.unit}
                                              </td>
                                              <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                                                {formatNumber(uLog.wastedQty)} {spIt.unit}
                                              </td>
                                              <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                                                {formatNumber(uLog.totalConsumed)} {spIt.unit}
                                              </td>
                                            </tr>
                                          ))
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Dispatch Notes & Received Vouchers Log */}
        {activeTab === 'inbound-vouchers' && (
          <div className="space-y-4 pt-2">
            {filteredVouchers.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">No Dispatch Vouchers Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  No client material receipts matched your search or filter query.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3.5">Voucher #</th>
                      <th className="py-3 px-3.5">Client Dispatch Note #</th>
                      <th className="py-3 px-3.5">Client / Principal</th>
                      <th className="py-3 px-3.5">Assigned Project</th>
                      <th className="py-3 px-3.5">Received Date</th>
                      <th className="py-3 px-3.5">Storage Location</th>
                      <th className="py-3 px-3.5 text-right">Items / Total Units</th>
                      <th className="py-3 px-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredVouchers.map((v) => {
                      const totalUnits = v.items.reduce((acc, it) => acc + it.quantity, 0);
                      const registeredClient = activeClients.find(
                        (c) => c.name.trim().toLowerCase() === v.clientName.trim().toLowerCase()
                      );
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3.5 font-mono font-bold text-indigo-700 whitespace-nowrap">
                            {v.voucherNumber}
                          </td>
                          <td className="py-3 px-3.5 font-mono font-semibold text-slate-900 whitespace-nowrap">
                            <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                              {v.dispatchNoteNo}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-slate-900 font-semibold whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {registeredClient && (
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400">
                                  {registeredClient.clientCode}
                                </span>
                              )}
                              <span>{v.clientName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-slate-800 max-w-xs" title={v.projectName}>
                            <div className="font-semibold truncate">{v.projectName}</div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              {(() => {
                                const projObj = projects.find((p) => p.id === v.projectId);
                                const branchName = v.assignedSiteName || resolveProjectBranch(projObj).siteName;
                                return branchName ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                    <Building2 className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>Branch: {branchName}</span>
                                  </span>
                                ) : null;
                              })()}
                              {v.siteIdentifier && (
                                <span className="text-[10px] text-slate-500">Site: {v.siteIdentifier}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                            {formatDate(v.receivedDate)}
                          </td>
                          <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                            <span className="font-semibold text-slate-800">{v.storageLocation || 'Main Central Warehouse'}</span>
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            <span>{v.items.length} items</span>{' '}
                            <span className="text-[11px] text-slate-500 font-normal">({formatNumber(totalUnits)} units)</span>
                          </td>
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setViewingVoucher(v)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {isCentralAdmin && (
                                <button
                                  onClick={() => handleOpenEditVoucherModal(v)}
                                  className="px-2 py-1 text-amber-800 bg-amber-50 hover:bg-amber-600 hover:text-white border border-amber-300 rounded-lg text-[10px] font-extrabold transition-colors cursor-pointer inline-flex items-center gap-1"
                                  title="Admin Correction: Reassign Project or Edit FOC Items"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Correct / Edit</span>
                                </button>
                              )}
                              <button
                                onClick={() => setPrintingVoucher(v)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Print Receipt Note"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              {isCentralAdmin && (
                                <button
                                  onClick={() => handleDeleteEntry(v)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Synced Client Register (Master Client Registry) */}
        {activeTab === 'client-register' && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-emerald-50/40 to-indigo-50/30 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-sm">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900">Master Client Register</h3>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      2-Way Synced with Master Registry
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Clients registered here are immediately saved in <strong>Master Registrations &rarr; Client Register</strong> and available for FOC Stock Dispatches.
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenNewClientModal}
                className="px-4 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>New Client Register</span>
              </button>
            </div>

            {filteredRegisteredClients.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Handshake className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">No Registered Clients Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Register your project clients and principals to link them with FOC Material Dispatches and Master Registrations.
                </p>
                <button
                  onClick={handleOpenNewClientModal}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register First Client</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRegisteredClients.map((client) => {
                  const clientVouchers = activeVouchers.filter(
                    (v) => v.clientName.trim().toLowerCase() === client.name.trim().toLowerCase()
                  );
                  const totalUnitsFromClient = clientVouchers.reduce(
                    (sum, v) => sum + v.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0),
                    0
                  );

                  return (
                    <div
                      key={client.id}
                      className="group relative overflow-hidden rounded-[22px] p-5 bg-white border border-slate-200/90 shadow-[0_8px_28px_-10px_rgba(15,23,42,0.07)] hover:shadow-[0_14px_34px_-10px_rgba(16,185,129,0.14)] hover:border-emerald-300 transition-all flex flex-col justify-between"
                    >
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-teal-400 opacity-85" />

                      <div>
                        {/* Header Row */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-slate-900 text-emerald-400 tracking-wider">
                              {client.clientCode}
                            </span>
                            {client.category && (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 truncate max-w-[150px]">
                                {client.category}
                              </span>
                            )}
                          </div>

                          {isCentralAdmin && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setEditingClient(client)}
                                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                title="Edit Client"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRegisteredClient(client)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                title="Delete Client"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Client Title */}
                        <div className="flex items-start gap-3 mb-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black text-slate-900 text-sm tracking-tight leading-snug truncate" title={client.name}>
                              {client.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                              {client.contactPerson ? `Contact: ${client.contactPerson}` : 'Registered Project Principal'}
                            </p>
                          </div>
                        </div>

                        {/* Metadata Box */}
                        <div className="rounded-xl bg-slate-50/90 border border-slate-200/70 p-3 space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Phone</span>
                              <span className="font-mono font-semibold text-slate-700 truncate block">
                                {client.phone || 'Not specified'}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">FOC Received</span>
                              <span className="font-mono font-extrabold text-indigo-700 truncate block">
                                {clientVouchers.length} DNs ({formatNumber(totalUnitsFromClient)} units)
                              </span>
                            </div>
                          </div>
                          {(client.email || client.address) && (
                            <div className="pt-1.5 border-t border-slate-200/70 text-[11px] text-slate-600 space-y-0.5">
                              {client.email && <div className="truncate"><span className="text-slate-400 font-semibold">Email:</span> {client.email}</div>}
                              {client.address && <div className="truncate"><span className="text-slate-400 font-semibold">Address:</span> {client.address}</div>}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer with Quick FOC Dispatch Action */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold border border-emerald-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Master Synced
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenLogModal(client.name)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200/80 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Log FOC Shipment</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------ MODAL: NEW CLIENT REGISTER (SYNCED WITH MASTER REGISTRY) ------------------ */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-700 text-white flex items-center justify-center shadow-md">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">New Client Register</h3>
                  <p className="text-[11px] text-slate-500">
                    Directly saves to Master Registrations &rarr; Client Register
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewClientModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewClient} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Client Code</label>
                  <input
                    type="text"
                    value={newClientCode}
                    onChange={(e) => setNewClientCode(e.target.value)}
                    placeholder={`e.g. CLT-${String(clients.length + 1).padStart(4, '0')}`}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Industry Category *</label>
                    <button
                      type="button"
                      onClick={() => setShowAddCategoryInline(!showAddCategoryInline)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-emerald-600" />
                      <span>Add Category</span>
                    </button>
                  </div>

                  {showAddCategoryInline && (
                    <div className="mb-2 p-2.5 bg-emerald-50/90 border border-emerald-300 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
                        <span>Add New Industry Category</span>
                        <button
                          type="button"
                          onClick={() => setShowAddCategoryInline(false)}
                          className="text-emerald-700 hover:text-emerald-950 p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="e.g. Solar & Renewable Energy"
                          value={newCustomCategoryInput}
                          onChange={(e) => setNewCustomCategoryInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomCategory(e, false);
                            }
                          }}
                          className="flex-1 px-2.5 py-1.5 border border-emerald-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={(e) => handleAddCustomCategory(e, false)}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs shadow-2xs cursor-pointer active:scale-95"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  <select
                    value={newClientCategory}
                    onChange={(e) => setNewClientCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {clientCategoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat} {customClientCategories.includes(cat) ? '(Custom)' : ''}
                      </option>
                    ))}
                  </select>

                  {customClientCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {customClientCategories.map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                        >
                          <span>{cat}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomCategory(cat)}
                            className="text-emerald-500 hover:text-rose-600 cursor-pointer ml-0.5"
                            title={`Delete custom category "${cat}"`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Client / Principal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Sri Lanka Telecom PLC / National Grid"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Contact Person</label>
                  <input
                    type="text"
                    value={newClientContactPerson}
                    onChange={(e) => setNewClientContactPerson(e.target.value)}
                    placeholder="e.g. Eng. Perera"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tax / Reg Number</label>
                  <input
                    type="text"
                    value={newClientTaxNo}
                    onChange={(e) => setNewClientTaxNo(e.target.value)}
                    placeholder="e.g. VAT-99201-X"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label className="block text-xs font-bold text-slate-700">Contact Phone</label>
                    <PhoneCountryBadge value={newClientPhone} />
                  </div>
                  <input
                    type="tel"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(enforceCountryPhoneInput(e.target.value))}
                    placeholder={detectActivePhoneCountry({ phoneValue: newClientPhone }).localPlaceholder}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="e.g. foc@client.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Office Address</label>
                <input
                  type="text"
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  placeholder="Head office or central depot address"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / FOC Terms</label>
                <textarea
                  rows={2}
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                  placeholder="Specific FOC material dispatch guidelines or contract terms..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save to Client Register</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------ MODAL: EDIT REGISTERED CLIENT ------------------ */}
      {editingClient && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Edit Registered Client</h3>
                  <p className="text-[11px] text-slate-500">Updates Master Client Register</p>
                </div>
              </div>
              <button onClick={() => setEditingClient(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditClient} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Code *</label>
                  <input
                    type="text"
                    required
                    value={editingClient.clientCode}
                    onChange={(e) => setEditingClient({ ...editingClient, clientCode: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-slate-50"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Industry Category</label>
                    <button
                      type="button"
                      onClick={() => setShowAddCategoryInline(!showAddCategoryInline)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-emerald-600" />
                      <span>Add Category</span>
                    </button>
                  </div>

                  {showAddCategoryInline && (
                    <div className="mb-2 p-2.5 bg-emerald-50/90 border border-emerald-300 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
                        <span>Add New Industry Category</span>
                        <button
                          type="button"
                          onClick={() => setShowAddCategoryInline(false)}
                          className="text-emerald-700 hover:text-emerald-950 p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="e.g. Solar & Renewable Energy"
                          value={newCustomCategoryInput}
                          onChange={(e) => setNewCustomCategoryInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomCategory(e, true);
                            }
                          }}
                          className="flex-1 px-2.5 py-1.5 border border-emerald-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={(e) => handleAddCustomCategory(e, true)}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs shadow-2xs cursor-pointer active:scale-95"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  <select
                    value={editingClient.category || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white"
                  >
                    {clientCategoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat} {customClientCategories.includes(cat) ? '(Custom)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client / Principal Name *</label>
                <input
                  type="text"
                  required
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Contact Person</label>
                  <input
                    type="text"
                    value={editingClient.contactPerson || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax / Reg Number</label>
                  <input
                    type="text"
                    value={editingClient.taxRegistrationNo || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, taxRegistrationNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Contact Phone</label>
                    <PhoneCountryBadge value={editingClient.phone || ''} />
                  </div>
                  <input
                    type="tel"
                    value={editingClient.phone || ''}
                    placeholder={detectActivePhoneCountry({ phoneValue: editingClient.phone || '' }).localPlaceholder}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        phone: enforceCountryPhoneInput(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={editingClient.email || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Office Address</label>
                <input
                  type="text"
                  value={editingClient.address || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------ MODAL: LOG / ADMIN CORRECT CLIENT FREE-ISSUE STOCK ------------------ */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto max-h-[94vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${
                    editingVoucher
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  }`}
                >
                  {editingVoucher ? <RefreshCw className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                      {editingVoucher
                        ? `Admin Correction: Edit / Reassign Client FOC Voucher (${editingVoucher.voucherNumber})`
                        : 'Log Client Free-Issue Stock (FOC Materials)'}
                    </h3>
                    {editingVoucher && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                        Admin Correction Mode
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingVoucher
                      ? 'Reassign this FOC shipment to the correct Project or update material quantities — all project balances & branch allocations update automatically.'
                      : 'Direct entry of project materials issued free of charge by registered clients or principals'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingVoucher(null);
                  setShowLogModal(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Admin Correction Helper Banner */}
            {editingVoucher && (
              <div className="mt-3 p-3 bg-amber-50/90 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5 shrink-0">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold">Correcting Logged FOC Shipment ({editingVoucher.voucherNumber}): </span>
                  <span>
                    Currently assigned to <strong>{editingVoucher.projectName}</strong>. If this shipment was accidentally logged under the wrong project, select the correct <strong>Target Project</strong> below — its <strong>Allocated Site Branch</strong> will automatically lock to that project&apos;s branch.
                  </span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2 shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmitNewIssue} className="overflow-y-auto pr-1 py-4 space-y-4">
              {/* STEP 1: CLIENT & TARGET PROJECT SELECTION */}
              <div className="p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-600 text-white inline-flex items-center justify-center text-[10px] font-black">
                      1
                    </span>
                    <span>Client & Target Project Selection</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Select the Client Principal and Target Project
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  {/* Column 1: Registered Client / Principal */}
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between h-7 mb-1.5">
                      <label className="block text-xs font-extrabold text-slate-800">
                        Registered Client / Principal <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleOpenNewClientModal}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-emerald-600" />
                        <span>New Client Register</span>
                      </button>
                    </div>
                    <select
                      required
                      value={formClientName}
                      onChange={(e) => setFormClientName(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    >
                      <option value="">-- Select Registered Client / Principal --</option>
                      {activeClients.map((clt) => (
                        <option key={clt.id} value={clt.name}>
                          [{clt.clientCode}] {clt.name} {clt.category ? `— ${clt.category}` : ''}
                        </option>
                      ))}
                      {formClientName && !activeClients.some((c) => c.name === formClientName) && (
                        <option value={formClientName}>{formClientName}</option>
                      )}
                    </select>
                  </div>

                  {/* Column 2: Target Project Mode & Project Dropdown */}
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between h-7 mb-1.5">
                      <label className="block text-xs font-extrabold text-slate-800">
                        Target Project <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg border border-slate-300/80 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            setFormProjectMode('main');
                            const mainProjs = activeProjects.filter(
                              (p) => !p.parentProjectId && p.projectScope !== 'sub'
                            );
                            if (mainProjs.length > 0) handleProjectSelectionChange(mainProjs[0].id);
                          }}
                          className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                            formProjectMode === 'main'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          🏢 Under Main Project
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormProjectMode('individual');
                            const indProjs = activeProjects.filter(
                              (p) =>
                                !p.parentProjectId &&
                                p.projectScope !== 'main' &&
                                !activeProjects.some((sp) => sp.parentProjectId === p.id)
                            );
                            if (indProjs.length > 0) handleProjectSelectionChange(indProjs[0].id);
                          }}
                          className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                            formProjectMode === 'individual'
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          📄 Individual Project
                        </button>
                      </div>
                    </div>
                    <select
                      required
                      value={formProjectId}
                      onChange={(e) => handleProjectSelectionChange(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    >
                      {(() => {
                        const candidateProjects =
                          formProjectMode === 'main'
                            ? activeProjects.filter((p) => !p.parentProjectId && p.projectScope !== 'sub')
                            : formProjectMode === 'individual'
                            ? activeProjects.filter(
                                (p) =>
                                  !p.parentProjectId &&
                                  p.projectScope !== 'main' &&
                                  !activeProjects.some((sp) => sp.parentProjectId === p.id)
                              )
                            : activeProjects;

                        if (candidateProjects.length === 0) {
                          return <option value="">-- No Matching Projects Found --</option>;
                        }

                        return candidateProjects.map((p) => {
                          const subCount = activeProjects.filter((sp) => sp.parentProjectId === p.id).length;
                          const resolvedBranch = resolveProjectBranch(p);
                          const prefix =
                            formProjectMode === 'main' || p.projectScope === 'main' || subCount > 0
                              ? `🏢 [Main Project] `
                              : `📄 `;
                          const secBadge = p.projectTypeName ? ` — [${p.projectTypeName}]` : '';
                          return (
                            <option key={p.id} value={p.id}>
                              {prefix}{p.projectName} ({p.projectId}){secBadge}{resolvedBranch.siteName ? ` — Branch: ${resolvedBranch.siteName}` : ''}{subCount > 0 ? ` (${subCount} Sub-Projects)` : ''}
                            </option>
                          );
                        });
                      })()}
                    </select>
                  </div>
                </div>

                {formProjectMode === 'main' && (
                  <div className="px-3 py-2 rounded-xl bg-indigo-50/90 border border-indigo-200/80 text-[11px] text-indigo-900 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>
                      Stock received under this Main Project automatically deducts whenever material usage or site requisitions are logged on this Main Project or any of its Sub-Projects.
                    </span>
                  </div>
                )}
              </div>

              {/* STEP 2: DISPATCH DETAILS, INBOUND YARD & LOCKED SITE BRANCH ALLOCATION */}
              <div className="p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-600 text-white inline-flex items-center justify-center text-[10px] font-black">
                      2
                    </span>
                    <span>Dispatch Voucher, Inbound Yard & Locked Site Branch Allocation</span>
                  </span>
                  <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Branch Auto-Locked to Selected Project</span>
                  </span>
                </div>

                {/* Clean 2x2 Grid so labels never wrap unevenly */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Top-Left: Client Dispatch Note # / Gate Pass */}
                  <div>
                    <div className="flex items-center justify-between h-6 mb-1">
                      <label className="block text-xs font-extrabold text-slate-800">
                        Client Dispatch Note # / Gate Pass <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">Document Ref</span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DN-2026-0412"
                      value={formDispatchNoteNo}
                      onChange={(e) => setFormDispatchNoteNo(e.target.value)}
                      className="w-full h-10 px-3.5 font-mono font-bold bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                  </div>

                  {/* Top-Right: Received Date */}
                  <div>
                    <div className="flex items-center justify-between h-6 mb-1">
                      <label className="block text-xs font-extrabold text-slate-800">
                        Received Date <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">Inbound Date</span>
                    </div>
                    <input
                      type="date"
                      required
                      value={formReceivedDate}
                      onChange={(e) => setFormReceivedDate(e.target.value)}
                      className="w-full h-10 px-3.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                  </div>

                  {/* Bottom-Left: Receiving Storage Yard (Locked to Default Central Main Warehouse) */}
                  <div>
                    <div className="flex items-center justify-between h-6 mb-1">
                      <label className="block text-xs font-extrabold text-indigo-950">
                        Receiving Storage Yard (Inbound)
                      </label>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Default HQ</span>
                      </span>
                    </div>
                    <div
                      className="w-full h-10 px-3.5 bg-indigo-50/90 border border-indigo-300 rounded-xl text-xs font-extrabold text-indigo-950 flex items-center justify-between select-none"
                      title="Client FOC materials always enter Main Central Warehouse first"
                    >
                      <span className="truncate">🏢 {mainWarehouseName} (Central Yard)</span>
                      <Lock className="w-3.5 h-3.5 text-indigo-500 shrink-0 ml-2" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      All Client FOC materials enter Central Main Stock first.
                    </p>
                  </div>

                  {/* Bottom-Right: Allocated Site Branch (Auto-Linked & Locked to Project's Registered Branch) */}
                  <div>
                    {(() => {
                      const selectedProjObj =
                        activeProjects.find((p) => p.id === formProjectId) ||
                        projects.find((p) => p.id === formProjectId);
                      const resolvedProjBranch = resolveProjectBranch(selectedProjObj);
                      const isBranchLocked = Boolean(resolvedProjBranch.siteId);
                      const isAllAreasLocked = resolvedProjBranch.siteId === 'ALL_AREAS';
                      const lockedSiteObj = isAllAreasLocked
                        ? undefined
                        : sites.find((s) => s.id === (resolvedProjBranch.siteId || formAssignedSiteId));
                      const lockedBranchDisplay = isAllAreasLocked
                        ? 'ALL AREAS (Open to All Site Branches)'
                        : lockedSiteObj
                        ? `${lockedSiteObj.name}${lockedSiteObj.location ? ` (${lockedSiteObj.location})` : ''}`
                        : resolvedProjBranch.siteName || 'Assigned Site Branch';

                      return (
                        <>
                          <div className="flex items-center justify-between h-6 mb-1">
                            <label className="block text-xs font-extrabold text-emerald-950">
                              Allocated Site Branch <span className="text-rose-500">*</span>
                            </label>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-700 text-white uppercase shadow-2xs">
                              <Lock className="w-2.5 h-2.5" />
                              <span>{isBranchLocked ? (isAllAreasLocked ? 'All Areas' : 'Locked to Project') : 'Select Branch'}</span>
                            </span>
                          </div>

                          {isBranchLocked ? (
                            <div
                              className={`w-full h-10 px-3.5 rounded-xl text-xs font-extrabold flex items-center justify-between select-none cursor-not-allowed shadow-2xs ${
                                isAllAreasLocked
                                  ? 'bg-sky-50 border-2 border-sky-500 text-sky-950'
                                  : 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950'
                              }`}
                              title={
                                isAllAreasLocked
                                  ? 'This project is registered for ALL AREAS — any Site Branch can request and use this FOC stock'
                                  : 'Locked to the Site Branch registered for this Project so stock cannot be accidentally issued to another branch'
                              }
                            >
                              <span className="truncate">
                                {isAllAreasLocked ? '🌐 ' : '🏢 '}
                                {lockedBranchDisplay}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ml-2 ${
                                  isAllAreasLocked
                                    ? 'text-sky-900 bg-sky-200/80'
                                    : 'text-emerald-800 bg-emerald-200/80'
                                }`}
                              >
                                <Lock className="w-3 h-3" />
                                <span>{isAllAreasLocked ? 'All Sites' : 'Auto-Locked'}</span>
                              </span>
                            </div>
                          ) : (
                            <select
                              required
                              value={formAssignedSiteId}
                              onChange={(e) => setFormAssignedSiteId(e.target.value)}
                              className="w-full h-10 px-3 bg-emerald-50 border-2 border-emerald-400 rounded-xl text-xs font-extrabold text-emerald-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                            >
                              <option value="">-- Select Site Branch --</option>
                              <option value="ALL_AREAS">
                                🌐 ALL AREAS (All Site Branches — Open to Any Site)
                              </option>
                              {branchSites.map((bs) => (
                                <option key={bs.id} value={bs.id}>
                                  🏢 {bs.name} {bs.location ? `(${bs.location})` : ''}
                                </option>
                              ))}
                            </select>
                          )}

                          <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                            {isAllAreasLocked || formAssignedSiteId === 'ALL_AREAS'
                              ? '🌐 Open to ALL AREAS — any Site Branch can request and use this project’s FOC stock.'
                              : '🔒 Locked to this project’s branch — prevents accidental issue to other sites.'}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* STEP 3: RECEIVED MATERIAL ITEMS TABLE */}
              <div className="p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-600 text-white inline-flex items-center justify-center text-[10px] font-black">
                      3
                    </span>
                    <span>Received Material Items (Cables, Hardware, Accessories)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Item Line</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formItems.map((row, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200/90 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-end shadow-2xs"
                    >
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                          {idx + 1}. Material / Cable Item <span className="text-rose-500">*</span>
                        </label>
                        <SearchableItemSelect
                          selectedItemId={row.itemId}
                          onSelectItem={(selected) => handleItemSelect(idx, selected.id)}
                          placeholder="-- Search & Select Material / Cable --"
                          showStockBadge={true}
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                          Quantity ({row.unit || 'units'}) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          required
                          placeholder="0"
                          value={row.quantity}
                          onChange={(e) =>
                            handleRowChange(idx, 'quantity', e.target.value === '' ? '' : Number(e.target.value))
                          }
                          className="w-full h-9 px-3 font-mono font-bold text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                          Drum / Serial / Batch Remarks
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Drum #DR-8821, Batch #B-04"
                          value={row.remarks}
                          onChange={(e) => handleRowChange(idx, 'remarks', e.target.value)}
                          className="w-full h-9 px-2.5 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={formItems.length <= 1}
                          className="h-9 w-9 inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 disabled:opacity-30 disabled:pointer-events-none rounded-lg cursor-pointer transition-colors"
                          title="Remove Item Line"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Delivery Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  General Delivery / Inspection Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Delivered via logistics carrier truck #TRK-8842. QC inspected and verified."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingVoucher(null);
                    setShowLogModal(false);
                  }}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                    editingVoucher
                      ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 shadow-amber-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-indigo-600/30'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {editingVoucher
                      ? 'Save Corrected Project & FOC Voucher'
                      : 'Save Client Free-Issue Stock'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------ MODAL: VIEW DETAILS ------------------ */}
      {viewingVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className={`bg-white rounded-2xl ${
              voucherModalTraceItemId ? 'max-w-5xl' : 'max-w-2xl'
            } w-full p-6 shadow-2xl border border-slate-200 my-auto transition-all`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Client Free-Issue Voucher: {viewingVoucher.voucherNumber}
                </h3>
              </div>
              <button
                onClick={() => {
                  setVoucherModalTraceItemId(null);
                  setViewingVoucher(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Client / Principal</span>
                  <span className="font-bold text-slate-900 text-sm">{viewingVoucher.clientName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Dispatch Note #</span>
                  <span className="font-mono font-bold text-indigo-700">{viewingVoucher.dispatchNoteNo}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Assigned Project</span>
                  <span className="font-bold text-slate-900">{viewingVoucher.projectName}</span>
                  {viewingVoucher.assignedSiteName && (
                    <span className="block text-[10px] font-bold text-emerald-700 mt-0.5">
                      🏢 Allocated Branch: {viewingVoucher.assignedSiteName}
                    </span>
                  )}
                  {viewingVoucher.siteIdentifier && (
                    <span className="block text-[10px] text-slate-500">Site: {viewingVoucher.siteIdentifier}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Received Date</span>
                  <span className="font-semibold text-slate-800">{formatDate(viewingVoucher.receivedDate)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Storage Location</span>
                  <span className="font-semibold text-slate-800">{viewingVoucher.storageLocation || 'Main Warehouse'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Received By</span>
                  <span className="font-semibold text-slate-800">{viewingVoucher.receivedBy}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-bold text-slate-900 uppercase text-[10px]">
                    Materials List (Click &ldquo;Summary&rdquo; to view Full Item Traceability)
                  </h4>
                  {voucherModalTraceItemId && (
                    <button
                      type="button"
                      onClick={() => setVoucherModalTraceItemId(null)}
                      className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Hide Item Summary
                    </button>
                  )}
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                        <th className="py-2 px-3">Item Code</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-right">Quantity</th>
                        <th className="py-2 px-3">Remarks / Drum</th>
                        <th className="py-2 px-3 text-center">Full Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingVoucher.items.map((it, idx) => {
                        const catalogItem = resolveCatalogItem(it.itemId, it.itemCode, it.itemName, it.unit);
                        const isTraceOpen = voucherModalTraceItemId === catalogItem.id;
                        return (
                          <React.Fragment key={idx}>
                            <tr
                              onClick={() =>
                                setVoucherModalTraceItemId((prev) =>
                                  prev === catalogItem.id ? null : catalogItem.id
                                )
                              }
                              className={`cursor-pointer transition-colors ${
                                isTraceOpen ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-2 px-3 font-mono font-bold text-slate-900">{it.itemCode}</td>
                              <td className="py-2 px-3 font-semibold text-slate-800">{it.itemName}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">
                                {formatNumber(it.quantity)} {it.unit}
                              </td>
                              <td className="py-2 px-3 text-slate-500">{it.remarks || '—'}</td>
                              <td
                                className="py-2 px-3 text-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVoucherModalTraceItemId((prev) =>
                                      prev === catalogItem.id ? null : catalogItem.id
                                    )
                                  }
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-colors ${
                                    isTraceOpen
                                      ? 'bg-emerald-700 text-white border-emerald-800'
                                      : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
                                  }`}
                                >
                                  <Layers className="w-3 h-3" />
                                  <span>{isTraceOpen ? 'Hide Trace' : 'Summary'}</span>
                                </button>
                              </td>
                            </tr>
                            {isTraceOpen && (
                              <tr className="bg-slate-100/80">
                                <td colSpan={5} className="p-2">
                                  {(() => {
                                    const voucherSiteId =
                                      viewingVoucher.assignedSiteId ||
                                      resolveProjectBranch(
                                        projects.find((p) => p.id === viewingVoucher.projectId)
                                      ).siteId;
                                    return (
                                      <ItemTraceabilitySummaryPanel
                                        item={catalogItem}
                                        mode={voucherSiteId ? 'site' : 'central'}
                                        siteId={voucherSiteId || undefined}
                                        focProjectId={viewingVoucher.projectId}
                                        onClose={() => setVoucherModalTraceItemId(null)}
                                      />
                                    );
                                  })()}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {viewingVoucher.notes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900">
                  <span className="font-bold text-[10px] uppercase block mb-0.5">Notes</span>
                  <p className="italic">{viewingVoucher.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-wrap justify-end gap-2">
              {isCentralAdmin && (
                <button
                  onClick={() => handleOpenEditVoucherModal(viewingVoucher)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Correct / Reassign Project</span>
                </button>
              )}
              <button
                onClick={() => {
                  setPrintingVoucher(viewingVoucher);
                  setViewingVoucher(null);
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
              <button
                onClick={() => setViewingVoucher(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ PRINTABLE DOCUMENT MODAL ------------------ */}
      {printingVoucher && (
        <PrintableDocumentModal
          title={`Client Free-Issue Receipt - ${printingVoucher.voucherNumber}`}
          isOpen={!!printingVoucher}
          onClose={() => setPrintingVoucher(null)}
          documentNumber={printingVoucher.voucherNumber}
          documentDate={printingVoucher.receivedDate}
          recipientLabel="Assigned Project"
          recipientName={`${printingVoucher.projectName} [Client: ${printingVoucher.clientName}]`}
          recipientSubDetails={`DN: ${printingVoucher.dispatchNoteNo || 'N/A'} | Yard: ${printingVoucher.storageLocation || 'Main Warehouse'} | Received By: ${printingVoucher.receivedBy}`}
          notes={`CLIENT-SUPPLIED PROJECT STOCK (FOC). Free of cost materials received from ${printingVoucher.clientName} under Dispatch Note ${printingVoucher.dispatchNoteNo || 'N/A'}. Allocated specifically for project "${printingVoucher.projectName}". Usage on this project draws down this client stock first.`}
          items={printingVoucher.items.map((it) => ({
            itemCode: it.itemCode || 'ITEM',
            itemName: `${it.itemName || 'Material'}${it.remarks ? ` [${it.remarks}]` : ''}`,
            quantity: it.quantity,
            unit: it.unit || 'units',
          }))}
        />
      )}

      {/* ------------------ MODAL 1: INDIVIDUAL ISSUED ITEM FOC REPORT (CLEAN & CLEAR) ------------------ */}
      {singleItemReportModal && (() => {
        const proj = projectSummaries.find((p) => p.project.id === singleItemReportModal.projectId);
        const it = proj?.items.find((item) => item.itemId === singleItemReportModal.itemId);
        if (!proj || !it) return null;
        const singleReportElementId = `foc-single-item-report-${proj.project.id}-${it.itemId}`;
        const projCode = proj.project.projectId || '';
        const projName = proj.project.projectName || 'Project';
        const clientName = proj.primaryClientName || 'Client';
        const branchName = proj.resolvedBranch.siteName || 'Central Warehouse';

        // Build clean distribution rows across Sub-Projects (plus Direct Main Project if used directly)
        const directMainLogs = it.usageRecords.filter((u) => u.subProjectId === proj.project.id);
        const directMainUsed = directMainLogs.reduce((s, u) => s + u.usedQty, 0);
        const directMainWaste = directMainLogs.reduce((s, u) => s + u.wastedQty, 0);
        const directMainTotal = directMainUsed + directMainWaste;

        const distributionRows = [
          ...proj.subProjectFlows.map((spf) => {
            const spMatch = spf.items.find((x) => x.itemId === it.itemId);
            return {
              key: spf.subProject.id,
              code: spf.subProject.projectId,
              name: spf.subProject.projectName,
              vouchers: spMatch?.spUsageLogs.length || 0,
              used: spMatch?.spInstalledUsed || 0,
              waste: spMatch?.spWastage || 0,
              total: spMatch?.spTotalConsumed || 0,
            };
          }),
          ...(directMainTotal > 0 || proj.subProjectFlows.length === 0
            ? [
                {
                  key: proj.project.id,
                  code: projCode || 'MAIN',
                  name: `${projName}${proj.subProjectFlows.length > 0 ? ' (Direct Usage)' : ''}`,
                  vouchers: directMainLogs.length,
                  used: directMainUsed,
                  waste: directMainWaste,
                  total: directMainTotal,
                },
              ]
            : []),
        ];

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 my-auto overflow-hidden">
              {/* Top Action Header */}
              <div className="bg-slate-900 px-5 py-3.5 text-white flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[11px] font-extrabold uppercase">
                      Central FOC · Item Report
                    </span>
                    <h3 className="text-base font-extrabold">
                      {it.itemCode} — {it.itemName}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Project: {projCode ? `[${projCode}] ` : ''}{projName} · Client: {clientName}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer select-none transition-colors ${
                      offDigitalSignature
                        ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                        : 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-200'
                    }`}
                    title="Hide digital signatures and leave blank space for manual hand signing"
                  >
                    <input
                      type="checkbox"
                      checked={offDigitalSignature}
                      onChange={(e) => setOffDigitalSignature(e.target.checked)}
                      className="rounded border-slate-400 text-rose-500 focus:ring-rose-500"
                    />
                    <PenTool className="w-3.5 h-3.5 shrink-0" />
                    <span>Off Digital Signature</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      printHtmlElement(
                        singleReportElementId,
                        `Central_FOC_Item_Report_${it.itemCode}_${projCode || projName}`
                      )
                    }
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print A4</span>
                  </button>
                  <button
                    type="button"
                    disabled={isExportingReportPdf}
                    onClick={async () => {
                      setIsExportingReportPdf(true);
                      try {
                        const docName = `Central_FOC_Item_Report_${it.itemCode}_${projCode || 'Project'}`;
                        const ok = await downloadElementAsPdf(singleReportElementId, docName);
                        if (!ok) {
                          await printHtmlElement(singleReportElementId, docName);
                        }
                      } finally {
                        setIsExportingReportPdf(false);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExportingReportPdf ? 'Saving...' : 'Download PDF'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSingleItemReportModal(null)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
                    aria-label="Close report"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Printable A4 Content */}
              <div className="p-5 max-h-[82vh] overflow-y-auto bg-slate-100">
                <div
                  id={singleReportElementId}
                  className="bg-white p-6 rounded-xl border border-slate-200 text-slate-900 space-y-5"
                >
                  {/* Document Header */}
                  <div className="border-b-2 border-slate-900 pb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">
                        CLIENT FREE-ISSUE (CENTRAL FOC) — INDIVIDUAL ITEM RECONCILIATION REPORT
                      </div>
                      <h1 className="text-lg font-black text-slate-900 mt-0.5">
                        {it.itemCode} — {it.itemName} ({it.unit})
                      </h1>
                      <p className="text-[13px] text-slate-600 mt-0.5">
                        Project: <strong>{projCode ? `[${projCode}] ` : ''}{projName}</strong> · Client: <strong>{clientName}</strong> · Site Branch: <strong>{branchName}</strong>
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="inline-block px-2.5 py-1 rounded bg-indigo-900 text-white font-extrabold text-[11px] uppercase">
                        Central FOC Stock
                      </span>
                      <div className="text-xs text-slate-500 mt-1">
                        Date: <strong>{new Date().toLocaleDateString()}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 5-Step Story KPI Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl border-2 border-indigo-200 bg-indigo-50/60">
                      <div className="text-[11px] font-extrabold uppercase text-indigo-800">1. Central FOC</div>
                      <div className="text-lg font-black font-mono text-indigo-900 mt-0.5">
                        {formatNumber(it.stage1CentralFocReceipt)} {it.unit}
                      </div>
                      <div className="text-[11px] text-indigo-700 mt-0.5">
                        Central Left: <strong>{formatNumber(it.centralFocPoolRem)} {it.unit}</strong>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-sky-200 bg-sky-50/60">
                      <div className="text-[11px] font-extrabold uppercase text-sky-900">2. Site Issue</div>
                      <div className="text-lg font-black font-mono text-sky-800 mt-0.5">
                        {formatNumber(it.stage2SiteIssue)} {it.unit}
                      </div>
                      <div className="text-[11px] text-sky-800 mt-0.5">{branchName}</div>
                    </div>
                    <div className="p-3 rounded-xl border border-violet-200 bg-violet-50/60">
                      <div className="text-[11px] font-extrabold uppercase text-violet-900">3. Team Issue</div>
                      <div className="text-lg font-black font-mono text-violet-800 mt-0.5">
                        {formatNumber(it.stage3TeamIssued)} {it.unit}
                      </div>
                      <div className="text-[11px] text-violet-800 mt-0.5">
                        Ret: +{formatNumber(it.stage3TeamReturnedGood)} · Hand: {formatNumber(it.stage3TeamInHand)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60">
                      <div className="text-[11px] font-extrabold uppercase text-amber-900">4. Used &amp; Waste</div>
                      <div className="text-lg font-black font-mono text-amber-900 mt-0.5">
                        {formatNumber(it.stage4TotalConsumed)} {it.unit}
                      </div>
                      <div className="text-[11px] text-amber-900 mt-0.5">
                        Used: {formatNumber(it.stage4InstalledUsage)} · Waste: {formatNumber(it.stage4Wastage)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border-2 border-emerald-300 bg-emerald-50/70">
                      <div className="text-[11px] font-extrabold uppercase text-emerald-900">5. Returnable Bal</div>
                      <div className="text-lg font-black font-mono text-emerald-800 mt-0.5">
                        {formatNumber(it.stage5TotalClientReturnableBalance)} {it.unit}
                      </div>
                      <div className="text-[11px] font-bold text-indigo-800 mt-0.5">
                        Site Bal: {formatNumber(it.stage5SiteReturnableBalance)} {it.unit}
                      </div>
                    </div>
                  </div>

                  {/* Step 1: Central FOC Receipts */}
                  <div>
                    <h4 className="text-[13px] font-extrabold uppercase text-indigo-950 mb-1.5">
                      Step 1 — Central FOC Stock Received from Client
                    </h4>
                    <table className="w-full text-left border-collapse text-[13px] border border-slate-200">
                      <thead>
                        <tr className="bg-indigo-50 text-indigo-950 text-xs font-extrabold uppercase border-b border-indigo-200">
                          <th className="py-2 px-3">FOC Voucher #</th>
                          <th className="py-2 px-3">Dispatch Note #</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Received By</th>
                          <th className="py-2 px-3 text-right">Qty ({it.unit})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {it.initialFocVouchers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-2.5 px-3 text-center text-slate-400">
                              No Central FOC vouchers recorded.
                            </td>
                          </tr>
                        ) : (
                          it.initialFocVouchers.map((v, i) => (
                            <tr key={i}>
                              <td className="py-2 px-3 font-mono font-bold text-indigo-700">{v.voucherNumber}</td>
                              <td className="py-2 px-3 font-mono text-slate-700">{v.dispatchNoteNo}</td>
                              <td className="py-2 px-3 text-slate-600">{formatDateTime(v.receivedDate)}</td>
                              <td className="py-2 px-3 text-slate-700">{v.receivedBy}</td>
                              <td className="py-2 px-3 text-right font-mono font-extrabold text-indigo-800">
                                +{formatNumber(v.qty)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Step 2 & 3 Side-by-Side (Clean Compact Tables) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-[13px] font-extrabold uppercase text-sky-950 mb-1.5">
                        Step 2 — Site Issues (Central → {branchName})
                      </h4>
                      <table className="w-full text-left border-collapse text-[13px] border border-slate-200">
                        <thead>
                          <tr className="bg-sky-50 text-sky-950 text-xs font-extrabold uppercase border-b border-sky-200">
                            <th className="py-2 px-2.5">Requisition #</th>
                            <th className="py-2 px-2.5">Site &amp; Date</th>
                            <th className="py-2 px-2.5 text-right">Qty ({it.unit})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {it.siteIssueRequisitions.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="py-2.5 px-2.5 text-center text-slate-400">
                                No site issues yet.
                              </td>
                            </tr>
                          ) : (
                            it.siteIssueRequisitions.map((r, i) => (
                              <tr key={i}>
                                <td className="py-2 px-2.5 font-mono font-bold text-sky-800">{r.requestNoteNumber}</td>
                                <td className="py-2 px-2.5 text-slate-700">
                                  {r.siteName} · {formatDateTime(r.date)}
                                </td>
                                <td className="py-2 px-2.5 text-right font-mono font-extrabold text-sky-800">
                                  {formatNumber(r.qty)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <h4 className="text-[13px] font-extrabold uppercase text-violet-950 mb-1.5">
                        Step 3 — Team Issues (Site → Field Teams)
                      </h4>
                      <table className="w-full text-left border-collapse text-[13px] border border-slate-200">
                        <thead>
                          <tr className="bg-violet-50 text-violet-950 text-xs font-extrabold uppercase border-b border-violet-200">
                            <th className="py-2 px-2.5">Issue #</th>
                            <th className="py-2 px-2.5">Team &amp; Date</th>
                            <th className="py-2 px-2.5 text-right">Qty ({it.unit})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {it.teamIssueRecords.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="py-2.5 px-2.5 text-center text-slate-400">
                                No team issues yet.
                              </td>
                            </tr>
                          ) : (
                            it.teamIssueRecords.map((t, i) => (
                              <tr key={i}>
                                <td className="py-2 px-2.5 font-mono font-bold text-violet-800">{t.issueNoteNumber}</td>
                                <td className="py-2 px-2.5 text-slate-700">
                                  {t.teamName} · {formatDateTime(t.date)}
                                </td>
                                <td className="py-2 px-2.5 text-right font-mono font-extrabold text-violet-800">
                                  {formatNumber(t.qty)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Step 4: Clean Sub-Project Usage Distribution Table + Usage Vouchers */}
                  <div className="space-y-3">
                    <h4 className="text-[13px] font-extrabold uppercase text-teal-950">
                      Step 4 — Where This Item Was Used (Main &amp; Sub-Project Breakdown)
                    </h4>

                    <table className="w-full text-left border-collapse text-[13px] border border-slate-200">
                      <thead>
                        <tr className="bg-teal-50 text-teal-950 text-xs font-extrabold uppercase border-b border-teal-200">
                          <th className="py-2 px-3">Project / Sub-Project</th>
                          <th className="py-2 px-3 text-center">Vouchers</th>
                          <th className="py-2 px-3 text-right">Used ({it.unit})</th>
                          <th className="py-2 px-3 text-right">Wastage ({it.unit})</th>
                          <th className="py-2 px-3 text-right">Total Consumed ({it.unit})</th>
                          <th className="py-2 px-3 text-right">Share %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {distributionRows.map((row) => {
                          const sharePct =
                            it.stage4TotalConsumed > 0
                              ? Math.round((row.total / it.stage4TotalConsumed) * 100)
                              : 0;
                          return (
                            <tr key={row.key}>
                              <td className="py-2 px-3 font-semibold text-slate-900">
                                <span className="font-mono font-bold text-teal-800 mr-1.5">[{row.code}]</span>
                                {row.name}
                              </td>
                              <td className="py-2 px-3 text-center font-mono text-slate-600">{row.vouchers}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-teal-700">
                                {formatNumber(row.used)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                                {formatNumber(row.waste)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                                {formatNumber(row.total)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-600">
                                {sharePct}%
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-slate-50 font-black border-t-2 border-slate-300">
                          <td className="py-2 px-3 text-slate-900 uppercase text-xs">Total Consumed</td>
                          <td className="py-2 px-3 text-center font-mono">{it.usageRecords.length}</td>
                          <td className="py-2 px-3 text-right font-mono text-teal-800">
                            {formatNumber(it.stage4InstalledUsage)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-rose-700">
                            {formatNumber(it.stage4Wastage)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-900">
                            {formatNumber(it.stage4TotalConsumed)} {it.unit}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">100%</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Individual Field Usage Vouchers */}
                    <table className="w-full text-left border-collapse text-[13px] border border-slate-200">
                      <thead>
                        <tr className="bg-amber-50 text-amber-950 text-xs font-extrabold uppercase border-b border-amber-200">
                          <th className="py-2 px-3">Usage Voucher #</th>
                          <th className="py-2 px-3">Project / Sub-Project</th>
                          <th className="py-2 px-3">Field Team</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3 text-right">Used ({it.unit})</th>
                          <th className="py-2 px-3 text-right">Wastage ({it.unit})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {it.usageRecords.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-2.5 px-3 text-center text-slate-400">
                              No usage vouchers logged for this item yet.
                            </td>
                          </tr>
                        ) : (
                          it.usageRecords.map((u, i) => (
                            <tr key={i}>
                              <td className="py-2 px-3 font-mono font-bold text-slate-800">{u.usageVoucherNumber}</td>
                              <td className="py-2 px-3 text-slate-800">
                                <span className="font-mono font-bold text-teal-800 mr-1">[{u.projectCode}]</span>
                                {u.projectName}
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-700">{u.teamName}</td>
                              <td className="py-2 px-3 text-slate-600">{formatDateTime(u.date)}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-teal-700">
                                {formatNumber(u.usedQty)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                                {formatNumber(u.wastedQty)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Step 5: Final Completion Statement & Signatures */}
                  <div className="p-4 rounded-xl bg-emerald-50/70 border-2 border-emerald-300 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-extrabold uppercase text-emerald-900">
                        Step 5 — Final Returnable Stock on Project Completion
                      </div>
                      <p className="text-[13px] text-slate-700 mt-0.5">
                        Central FOC Left: <strong>{formatNumber(it.centralFocPoolRem)} {it.unit}</strong> + Site Branch Balance:{' '}
                        <strong>{formatNumber(it.stage5SiteReturnableBalance)} {it.unit}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold uppercase text-indigo-800 block">
                        Final Client Returnable Balance
                      </span>
                      <span className="text-xl font-black font-mono text-emerald-800">
                        {formatNumber(it.stage5TotalClientReturnableBalance)} {it.unit}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 pt-5 border-t border-slate-200 text-[13px] text-slate-600">
                    <div>
                      {!offDigitalSignature &&
                      matchDigitalSignature(digitalSignatures, activeTemplate?.preparedBy || currentUser?.fullName, 'prepared') ? (
                        <div className="h-14 flex items-end pb-1 border-b border-slate-400 mb-1.5">
                          <img
                            src={
                              matchDigitalSignature(digitalSignatures, activeTemplate?.preparedBy || currentUser?.fullName, 'prepared')!
                                .signatureDataUrl
                            }
                            alt="Prepared Digital Signature"
                            className="max-h-12 max-w-[150px] object-contain mix-blend-multiply"
                          />
                        </div>
                      ) : (
                        <div className="h-16 flex flex-col justify-end border-b border-dashed border-slate-400 mb-1.5 pb-1">
                          <span className="text-[10px] text-slate-400 italic">Hand Signature</span>
                        </div>
                      )}
                      <div className="font-bold text-slate-800">Central Store / FOC Controller</div>
                      <div className="text-[11px]">Signature &amp; Date</div>
                    </div>
                    <div>
                      {!offDigitalSignature &&
                      matchDigitalSignature(digitalSignatures, activeTemplate?.approvedBy || currentUser?.fullName, 'approved') ? (
                        <div className="h-14 flex items-end pb-1 border-b border-slate-400 mb-1.5">
                          <img
                            src={
                              matchDigitalSignature(digitalSignatures, activeTemplate?.approvedBy || currentUser?.fullName, 'approved')!
                                .signatureDataUrl
                            }
                            alt="Site Manager Digital Signature"
                            className="max-h-12 max-w-[150px] object-contain mix-blend-multiply"
                          />
                        </div>
                      ) : (
                        <div className="h-16 flex flex-col justify-end border-b border-dashed border-slate-400 mb-1.5 pb-1">
                          <span className="text-[10px] text-slate-400 italic">Hand Signature</span>
                        </div>
                      )}
                      <div className="font-bold text-slate-800">Site Manager ({branchName})</div>
                      <div className="text-[11px]">Signature &amp; Date</div>
                    </div>
                    <div>
                      <div className="h-16 flex flex-col justify-end border-b border-dashed border-slate-400 mb-1.5 pb-1">
                        <span className="text-[10px] text-slate-400 italic">Client Sign &amp; Stamp</span>
                      </div>
                      <div className="font-bold text-slate-800">Client Representative ({clientName})</div>
                      <div className="text-[11px]">Verification &amp; Sign-Off</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ------------------ MODAL 2: FULL MAIN PROJECT REPORT (PART 1 RECEIPTS → PART 2 SUB-PROJECTS → PART 3 FINAL BALANCE) ------------------ */}
      {projectReportModalId && (() => {
        const proj = projectSummaries.find((p) => p.project.id === projectReportModalId);
        if (!proj) return null;
        const masterReportElementId = `foc-project-master-report-${proj.project.id}`;
        const projCode = proj.project.projectId || '';
        const projName = proj.project.projectName || 'Project';
        const clientName = proj.primaryClientName || 'Client';
        const branchName = proj.resolvedBranch.siteName || 'Central Warehouse';

        // Check if any usage was logged directly on the Main Project (outside Sub-Projects)
        const directMainUsageRows = proj.items
          .map((it) => {
            const directLogs = it.usageRecords.filter((u) => u.subProjectId === proj.project.id);
            const used = directLogs.reduce((s, u) => s + u.usedQty, 0);
            const waste = directLogs.reduce((s, u) => s + u.wastedQty, 0);
            return {
              itemId: it.itemId,
              itemCode: it.itemCode,
              itemName: it.itemName,
              unit: it.unit,
              used,
              waste,
              total: used + waste,
              vouchers: directLogs.map((l) => l.usageVoucherNumber),
            };
          })
          .filter((r) => r.total > 0);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl border border-slate-200 my-auto overflow-hidden">
              {/* Top Action Header */}
              <div className="bg-slate-950 px-5 py-3.5 text-white flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-extrabold uppercase">
                      Full Project Report
                    </span>
                    <h3 className="text-base font-extrabold">
                      {projCode ? `[${projCode}] ` : ''}{projName}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Client: {clientName} · Branch: {branchName} · {proj.items.length} Item(s) · {proj.subProjectFlows.length} Sub-Project(s)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer select-none transition-colors ${
                      offDigitalSignature
                        ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                        : 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-200'
                    }`}
                    title="Hide digital signatures and leave blank space for manual hand signing"
                  >
                    <input
                      type="checkbox"
                      checked={offDigitalSignature}
                      onChange={(e) => setOffDigitalSignature(e.target.checked)}
                      className="rounded border-slate-400 text-rose-500 focus:ring-rose-500"
                    />
                    <PenTool className="w-3.5 h-3.5 shrink-0" />
                    <span>Off Digital Signature</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      printHtmlElement(
                        masterReportElementId,
                        `Full_Project_FOC_Report_${projCode || projName}`
                      )
                    }
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Full Project A4</span>
                  </button>
                  <button
                    type="button"
                    disabled={isExportingReportPdf}
                    onClick={async () => {
                      setIsExportingReportPdf(true);
                      try {
                        const docName = `Full_Project_FOC_Report_${projCode || 'Project'}`;
                        const ok = await downloadElementAsPdf(masterReportElementId, docName);
                        if (!ok) {
                          await printHtmlElement(masterReportElementId, docName);
                        }
                      } finally {
                        setIsExportingReportPdf(false);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExportingReportPdf ? 'Saving...' : 'Download Full PDF'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectReportModalId(null)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
                    aria-label="Close report"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Printable A4 Body */}
              <div className="p-5 max-h-[82vh] overflow-y-auto bg-slate-100">
                <div
                  id={masterReportElementId}
                  className="bg-white p-6 rounded-xl border border-slate-200 text-slate-900 space-y-6"
                >
                  {/* Corporate Header */}
                  <div className="border-b-2 border-slate-900 pb-3.5 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">
                        CENTRAL STOCK &amp; PROJECT MATERIAL CONTROL — FULL FOC RECONCILIATION REPORT
                      </div>
                      <h1 className="text-lg font-black text-slate-900 mt-0.5">
                        MAIN PROJECT: {projCode ? `[${projCode}] ` : ''}{projName}
                      </h1>
                      <p className="text-[13px] text-slate-600 mt-0.5">
                        Client: <strong>{clientName}</strong> · Allocated Site Branch: <strong>{branchName}</strong>
                        {proj.subProjectFlows.length > 0 && (
                          <span>
                            {' '}· Sub-Projects:{' '}
                            <strong>{proj.subProjectFlows.map((s) => s.subProject.projectId).join(', ')}</strong>
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="inline-block px-2.5 py-1 rounded bg-indigo-900 text-white font-extrabold text-[11px] uppercase">
                        Central FOC Master Report
                      </span>
                      <div className="text-xs text-slate-500 mt-1">
                        Generated: <strong>{new Date().toLocaleDateString()}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Clean 5-Step Project Overview Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl border-2 border-indigo-200 bg-indigo-50/60">
                      <div className="text-[11px] font-extrabold uppercase text-indigo-800">1. Central FOC</div>
                      <div className="text-lg font-black font-mono text-indigo-900 mt-0.5">
                        {formatNumber(proj.totalRecv)}
                      </div>
                      <div className="text-[11px] text-indigo-700">Central Left: {formatNumber(proj.totalRem)}</div>
                    </div>
                    <div className="p-3 rounded-xl border border-sky-200 bg-sky-50/60">
                      <div className="text-[11px] font-extrabold uppercase text-sky-900">2. Site Issue</div>
                      <div className="text-lg font-black font-mono text-sky-800 mt-0.5">
                        {formatNumber(proj.totalDispatched)}
                      </div>
                      <div className="text-[11px] text-sky-800">{branchName}</div>
                    </div>
                    <div className="p-3 rounded-xl border border-violet-200 bg-violet-50/60">
                      <div className="text-[11px] font-extrabold uppercase text-violet-900">3. Team Issue</div>
                      <div className="text-lg font-black font-mono text-violet-800 mt-0.5">
                        {formatNumber(proj.totalTeamIssued)}
                      </div>
                      <div className="text-[11px] text-violet-800">{proj.items.length} Material(s)</div>
                    </div>
                    <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60">
                      <div className="text-[11px] font-extrabold uppercase text-amber-900">4. Total Used &amp; Waste</div>
                      <div className="text-lg font-black font-mono text-amber-900 mt-0.5">
                        {formatNumber(proj.totalUsed)}
                      </div>
                      <div className="text-[11px] text-amber-900">
                        Used: {formatNumber(proj.totalInstalled)} · Waste: {formatNumber(proj.totalWastage)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border-2 border-emerald-300 bg-emerald-50/70">
                      <div className="text-[11px] font-extrabold uppercase text-emerald-900">5. Client Returnable</div>
                      <div className="text-lg font-black font-mono text-emerald-800 mt-0.5">
                        {formatNumber(proj.totalClientReturnable)}
                      </div>
                      <div className="text-[11px] font-bold text-indigo-800">
                        Site Bal: {formatNumber(proj.totalSiteReturnable)}
                      </div>
                    </div>
                  </div>

                  {/* PART 1: MAIN PROJECT STOCK RECEIVED & ISSUED */}
                  <div>
                    <h4 className="text-[13px] font-black uppercase text-indigo-950 border-b-2 border-indigo-900 pb-1 mb-2">
                      Part 1 — Main Project Stock Received &amp; Issued (Central FOC → Site → Teams)
                    </h4>
                    <table className="w-full text-left border-collapse text-[13px] border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 text-xs font-extrabold uppercase border-b border-slate-300">
                          <th className="py-2 px-2.5">#</th>
                          <th className="py-2 px-2.5">Item Code &amp; Material</th>
                          <th className="py-2 px-2 text-center">Unit</th>
                          <th className="py-2 px-2.5 text-right">1. Central FOC Receipt</th>
                          <th className="py-2 px-2.5 text-right">2. Site Issue ({branchName})</th>
                          <th className="py-2 px-2.5 text-right">Central Left</th>
                          <th className="py-2 px-2.5 text-right">3. Team Issue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {proj.items.map((it, idx) => (
                          <tr key={it.itemId}>
                            <td className="py-2 px-2.5 font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-2 px-2.5">
                              <span className="font-mono font-bold text-slate-900 mr-1.5">{it.itemCode}</span>
                              <span className="font-semibold text-slate-800">{it.itemName}</span>
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10.5px] font-extrabold uppercase">
                                Central FOC
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-slate-600">{it.unit}</td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-indigo-900">
                              {formatNumber(it.stage1CentralFocReceipt)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-sky-800">
                              {formatNumber(it.stage2SiteIssue)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono text-slate-700">
                              {formatNumber(it.centralFocPoolRem)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-violet-800">
                              {formatNumber(it.stage3TeamIssued)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* PART 2: SUB-PROJECT-BY-SUB-PROJECT USAGE FLOW (SIMPLE & CLEAR) */}
                  {proj.subProjectFlows.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[13px] font-black uppercase text-teal-950 border-b-2 border-teal-800 pb-1">
                        Part 2 — Sub-Project-by-Sub-Project Usage Flow ({proj.subProjectFlows.length} Sub-Projects)
                      </h4>

                      {proj.subProjectFlows.map((spf) => {
                        const usedItems = spf.items.filter((spIt) => spIt.spTotalConsumed > 0);
                        return (
                          <div
                            key={spf.subProject.id}
                            className="border border-teal-300 rounded-xl overflow-hidden"
                          >
                            <div className="px-3.5 py-2 bg-teal-950 text-white flex flex-wrap items-center justify-between gap-2 text-[13px]">
                              <div>
                                <span className="font-mono font-extrabold text-teal-200 mr-2">
                                  Sub-Project #{spf.orderIndex}: [{spf.subProject.projectId}]
                                </span>
                                <strong>{spf.subProject.projectName}</strong>
                              </div>
                              <div className="font-mono text-xs">
                                Used: <strong>{formatNumber(spf.spTotalInstalled)}</strong> · Wastage:{' '}
                                <strong>{formatNumber(spf.spTotalWastage)}</strong> · Total:{' '}
                                <strong>{formatNumber(spf.spTotalConsumed)}</strong>
                              </div>
                            </div>

                            {usedItems.length === 0 ? (
                              <div className="p-3 text-[13px] text-slate-500 bg-slate-50">
                                No material consumption logged under [{spf.subProject.projectId}] yet.
                              </div>
                            ) : (
                              <table className="w-full text-left border-collapse text-[13px]">
                                <thead>
                                  <tr className="bg-teal-50 text-teal-950 text-xs font-extrabold uppercase border-b border-teal-200">
                                    <th className="py-1.5 px-3">Item Code &amp; Material</th>
                                    <th className="py-1.5 px-2 text-center">Unit</th>
                                    <th className="py-1.5 px-3 text-right">Used</th>
                                    <th className="py-1.5 px-3 text-right">Wastage</th>
                                    <th className="py-1.5 px-3 text-right">Sub-Project Total</th>
                                    <th className="py-1.5 px-3">Voucher Ref(s)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                  {usedItems.map((spIt) => (
                                    <tr key={spIt.itemId}>
                                      <td className="py-1.5 px-3 font-semibold text-slate-900">
                                        <span className="font-mono font-bold text-slate-800 mr-1.5">
                                          {spIt.itemCode}
                                        </span>
                                        {spIt.itemName}
                                      </td>
                                      <td className="py-1.5 px-2 text-center font-mono text-slate-600">{spIt.unit}</td>
                                      <td className="py-1.5 px-3 text-right font-mono font-bold text-teal-700">
                                        {formatNumber(spIt.spInstalledUsed)}
                                      </td>
                                      <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-600">
                                        {formatNumber(spIt.spWastage)}
                                      </td>
                                      <td className="py-1.5 px-3 text-right font-mono font-black text-slate-900">
                                        {formatNumber(spIt.spTotalConsumed)}
                                      </td>
                                      <td className="py-1.5 px-3 font-mono text-xs text-slate-600">
                                        {spIt.spUsageLogs.map((u) => u.usageVoucherNumber).join(', ')}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        );
                      })}

                      {/* Direct Main Project Usage (if any usage was logged directly on parent Main Project) */}
                      {directMainUsageRows.length > 0 && (
                        <div className="border border-slate-300 rounded-xl overflow-hidden">
                          <div className="px-3.5 py-2 bg-slate-800 text-white text-[13px] font-bold">
                            Direct Usage Logged on Main Project [{projCode}]
                          </div>
                          <table className="w-full text-left border-collapse text-[13px]">
                            <thead>
                              <tr className="bg-slate-50 text-slate-700 text-xs font-extrabold uppercase border-b border-slate-200">
                                <th className="py-1.5 px-3">Item Code &amp; Material</th>
                                <th className="py-1.5 px-2 text-center">Unit</th>
                                <th className="py-1.5 px-3 text-right">Used</th>
                                <th className="py-1.5 px-3 text-right">Wastage</th>
                                <th className="py-1.5 px-3 text-right">Total</th>
                                <th className="py-1.5 px-3">Voucher Ref(s)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {directMainUsageRows.map((row) => (
                                <tr key={row.itemId}>
                                  <td className="py-1.5 px-3 font-semibold text-slate-900">
                                    <span className="font-mono font-bold mr-1.5">{row.itemCode}</span>
                                    {row.itemName}
                                  </td>
                                  <td className="py-1.5 px-2 text-center font-mono text-slate-600">{row.unit}</td>
                                  <td className="py-1.5 px-3 text-right font-mono font-bold text-teal-700">
                                    {formatNumber(row.used)}
                                  </td>
                                  <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-600">
                                    {formatNumber(row.waste)}
                                  </td>
                                  <td className="py-1.5 px-3 text-right font-mono font-black text-slate-900">
                                    {formatNumber(row.total)}
                                  </td>
                                  <td className="py-1.5 px-3 font-mono text-xs text-slate-600">
                                    {row.vouchers.join(', ')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PART 3 (BOTTOM): FINAL FULL PROJECT USAGE & CLIENT RETURNABLE BALANCE SUMMARY */}
                  <div>
                    <div className="border-b-2 border-emerald-800 pb-1 mb-2 flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-[13px] font-black uppercase text-emerald-950">
                        {proj.subProjectFlows.length > 0
                          ? `Part 3 (Final Summary) — Full Main Project [${projCode}] Total Usage & Client Returnable Balance`
                          : `Final Full Project Usage & Client Returnable Balance Summary`}
                      </h4>
                      <span className="text-xs font-extrabold text-emerald-800">
                        Balance to Return to Client on Project Completion
                      </span>
                    </div>

                    <table className="w-full text-left border-collapse text-[12.5px] border border-slate-300">
                      <thead>
                        <tr className="bg-slate-900 text-white text-[11px] font-extrabold uppercase">
                          <th className="py-2.5 px-2">#</th>
                          <th className="py-2.5 px-2.5">Item Code &amp; Description</th>
                          <th className="py-2.5 px-2 text-center">Unit</th>
                          <th className="py-2.5 px-2.5 text-right bg-indigo-950">1. Central FOC</th>
                          <th className="py-2.5 px-2.5 text-right bg-sky-950">2. Site Issue</th>
                          <th className="py-2.5 px-2.5 text-right bg-violet-950">3. Team Issue</th>
                          <th className="py-2.5 px-2.5 text-right bg-amber-950">4. Total Used + Waste</th>
                          <th className="py-2.5 px-2.5 text-right bg-emerald-950">5a. Site Returnable</th>
                          <th className="py-2.5 px-2.5 text-right bg-emerald-900">5b. Final Client Returnable</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {proj.items.map((it, idx) => (
                          <tr key={it.itemId}>
                            <td className="py-2 px-2 font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-2 px-2.5">
                              <span className="font-mono font-bold text-slate-900 mr-1.5">{it.itemCode}</span>
                              <span className="font-semibold text-slate-800">{it.itemName}</span>
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-slate-600">{it.unit}</td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-indigo-800 bg-indigo-50/30">
                              {formatNumber(it.stage1CentralFocReceipt)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-sky-800">
                              {formatNumber(it.stage2SiteIssue)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-violet-800">
                              {formatNumber(it.stage3TeamIssued)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono bg-amber-50/30">
                              <div className="font-black text-slate-900">
                                {formatNumber(it.stage4TotalConsumed)}
                              </div>
                              <div className="text-[11px] text-slate-600">
                                {formatNumber(it.stage4InstalledUsage)}U + {formatNumber(it.stage4Wastage)}W
                              </div>
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-extrabold text-indigo-800 bg-indigo-50/30">
                              {formatNumber(it.stage5SiteReturnableBalance)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-black text-emerald-800 bg-emerald-50/60">
                              {formatNumber(it.stage5TotalClientReturnableBalance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Official 3-Column Sign-Off */}
                  <div className="grid grid-cols-3 gap-6 pt-5 border-t-2 border-slate-300 text-[13px] text-slate-600">
                    <div>
                      {!offDigitalSignature &&
                      matchDigitalSignature(digitalSignatures, activeTemplate?.preparedBy || currentUser?.fullName, 'prepared') ? (
                        <div className="h-14 flex items-end pb-1 border-b border-slate-400 mb-1.5">
                          <img
                            src={
                              matchDigitalSignature(digitalSignatures, activeTemplate?.preparedBy || currentUser?.fullName, 'prepared')!
                                .signatureDataUrl
                            }
                            alt="Prepared Digital Signature"
                            className="max-h-12 max-w-[150px] object-contain mix-blend-multiply"
                          />
                        </div>
                      ) : (
                        <div className="h-16 flex flex-col justify-end border-b border-dashed border-slate-400 mb-1.5 pb-1">
                          <span className="text-[10px] text-slate-400 italic">Hand Signature</span>
                        </div>
                      )}
                      <div className="font-bold text-slate-800">Central Store / FOC Controller</div>
                      <div className="text-[11px]">Prepared By · Signature &amp; Date</div>
                    </div>
                    <div>
                      {!offDigitalSignature &&
                      matchDigitalSignature(digitalSignatures, activeTemplate?.approvedBy || currentUser?.fullName, 'approved') ? (
                        <div className="h-14 flex items-end pb-1 border-b border-slate-400 mb-1.5">
                          <img
                            src={
                              matchDigitalSignature(digitalSignatures, activeTemplate?.approvedBy || currentUser?.fullName, 'approved')!
                                .signatureDataUrl
                            }
                            alt="Verified Digital Signature"
                            className="max-h-12 max-w-[150px] object-contain mix-blend-multiply"
                          />
                        </div>
                      ) : (
                        <div className="h-16 flex flex-col justify-end border-b border-dashed border-slate-400 mb-1.5 pb-1">
                          <span className="text-[10px] text-slate-400 italic">Hand Signature</span>
                        </div>
                      )}
                      <div className="font-bold text-slate-800">Site Manager ({branchName})</div>
                      <div className="text-[11px]">Verified By · Signature &amp; Date</div>
                    </div>
                    <div>
                      <div className="h-16 flex flex-col justify-end border-b border-dashed border-slate-400 mb-1.5 pb-1">
                        <span className="text-[10px] text-slate-400 italic">Client Sign &amp; Stamp</span>
                      </div>
                      <div className="font-bold text-slate-800">Client Representative ({clientName})</div>
                      <div className="text-[11px]">Final Completion Approval</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ------------------ MODAL 3: DEDICATED SUB-PROJECT FLOW REPORT ------------------ */}
      {subProjectReportModal && (() => {
        const proj = projectSummaries.find((p) => p.project.id === subProjectReportModal.parentProjectId);
        const spf = proj?.subProjectFlows.find((s) => s.subProject.id === subProjectReportModal.subProjectId);
        if (!proj || !spf) return null;

        const spReportElementId = `foc-subproject-report-${spf.subProject.id}`;
        const spCode = spf.subProject.projectId;
        const spName = spf.subProject.projectName;
        const parentCode = proj.project.projectId;
        const parentName = proj.project.projectName;
        const clientName = proj.primaryClientName || 'Client';
        const branchName = proj.resolvedBranch.siteName || 'Central Warehouse';

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 my-auto overflow-hidden">
              {/* Top Header */}
              <div className="bg-teal-950 px-5 py-3.5 text-white flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-teal-600 text-white text-[11px] font-extrabold uppercase">
                      Sub-Project Flow Report
                    </span>
                    <h3 className="text-base font-extrabold">
                      [{spCode}] {spName}
                    </h3>
                  </div>
                  <p className="text-xs text-teal-200 mt-0.5">
                    Main Project: [{parentCode}] {parentName} · Client: {clientName} · Branch: {branchName}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer select-none transition-colors ${
                      offDigitalSignature
                        ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                        : 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-200'
                    }`}
                    title="Hide digital signatures and leave blank space for manual hand signing"
                  >
                    <input
                      type="checkbox"
                      checked={offDigitalSignature}
                      onChange={(e) => setOffDigitalSignature(e.target.checked)}
                      className="rounded border-slate-400 text-rose-500 focus:ring-rose-500"
                    />
                    <PenTool className="w-3.5 h-3.5 shrink-0" />
                    <span>Off Digital Signature</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      printHtmlElement(spReportElementId, `SubProject_FOC_Report_${spCode}`)
                    }
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Sub-Project A4</span>
                  </button>
                  <button
                    type="button"
                    disabled={isExportingReportPdf}
                    onClick={async () => {
                      setIsExportingReportPdf(true);
                      try {
                        const docName = `SubProject_FOC_Report_${spCode}`;
                        const ok = await downloadElementAsPdf(spReportElementId, docName);
                        if (!ok) {
                          await printHtmlElement(spReportElementId, docName);
                        }
                      } finally {
                        setIsExportingReportPdf(false);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExportingReportPdf ? 'Saving...' : 'Download PDF'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubProjectReportModal(null)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
                    aria-label="Close report"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Printable A4 Body */}
              <div className="p-5 max-h-[82vh] overflow-y-auto bg-slate-100">
                <div
                  id={spReportElementId}
                  className="bg-white p-6 rounded-xl border border-slate-200 text-slate-900 space-y-5"
                >
                  {/* Document Header */}
                  <div className="border-b-2 border-slate-900 pb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-wider text-teal-800">
                        CLIENT FOC — DEDICATED SUB-PROJECT USAGE FLOW REPORT
                      </div>
                      <h1 className="text-lg font-black text-slate-900 mt-0.5">
                        SUB-PROJECT: [{spCode}] {spName}
                      </h1>
                      <p className="text-[13px] text-slate-600 mt-0.5">
                        Main Project: <strong>[{parentCode}] {parentName}</strong> · Client: <strong>{clientName}</strong> · Site Branch: <strong>{branchName}</strong>
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="inline-block px-2.5 py-1 rounded bg-teal-900 text-white font-extrabold text-[11px] uppercase">
                        Sub-Project #{spf.orderIndex}
                      </span>
                      <div className="text-xs text-slate-500 mt-1">
                        Date: <strong>{new Date().toLocaleDateString()}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 4 KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/60">
                      <div className="text-[11px] font-extrabold uppercase text-teal-900">Used on [{spCode}]</div>
                      <div className="text-lg font-black font-mono text-teal-900 mt-0.5">
                        {formatNumber(spf.spTotalInstalled)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/60">
                      <div className="text-[11px] font-extrabold uppercase text-rose-900">Wastage</div>
                      <div className="text-lg font-black font-mono text-rose-700 mt-0.5">
                        {formatNumber(spf.spTotalWastage)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60">
                      <div className="text-[11px] font-extrabold uppercase text-amber-900">Total Consumed</div>
                      <div className="text-lg font-black font-mono text-amber-900 mt-0.5">
                        {formatNumber(spf.spTotalConsumed)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="text-[11px] font-extrabold uppercase text-slate-600">Usage Vouchers</div>
                      <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
                        {spf.spTotalLogsCount}
                      </div>
                    </div>
                  </div>

                  {/* Part 1: Sub-Project Materials Summary */}
                  <div>
                    <h4 className="text-[13px] font-extrabold uppercase text-teal-950 mb-1.5">
                      Part 1 — Material Usage on [{spCode}] &amp; Main Project Remaining Balance
                    </h4>
                    <table className="w-full text-left border-collapse text-[13px] border border-slate-300">
                      <thead>
                        <tr className="bg-teal-950 text-white text-xs font-extrabold uppercase">
                          <th className="py-2 px-2.5">#</th>
                          <th className="py-2 px-2.5">Item Code &amp; Material</th>
                          <th className="py-2 px-2 text-center">Unit</th>
                          <th className="py-2 px-2.5 text-right">Main FOC (Central / Site)</th>
                          <th className="py-2 px-2.5 text-right">Used on [{spCode}]</th>
                          <th className="py-2 px-2.5 text-right">Wastage</th>
                          <th className="py-2 px-2.5 text-right">Sub-Project Total</th>
                          <th className="py-2 px-2.5 text-right">Main Project Remaining Bal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {spf.items.map((spIt, idx) => (
                          <tr key={spIt.itemId}>
                            <td className="py-2 px-2.5 font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-2 px-2.5">
                              <span className="font-mono font-bold text-slate-900 mr-1.5">{spIt.itemCode}</span>
                              <span className="font-semibold text-slate-800">{spIt.itemName}</span>
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-slate-600">{spIt.unit}</td>
                            <td className="py-2 px-2.5 text-right font-mono text-slate-700">
                              {formatNumber(spIt.stage1MainCentralFoc)} / {formatNumber(spIt.stage2MainSiteIssue)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-teal-700">
                              {formatNumber(spIt.spInstalledUsed)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-rose-600">
                              {formatNumber(spIt.spWastage)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-black text-slate-900">
                              {formatNumber(spIt.spTotalConsumed)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-extrabold text-emerald-800 bg-emerald-50/40">
                              {formatNumber(spIt.finalMainClientReturnable)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Part 2: Field Usage Vouchers for this Sub-Project */}
                  <div>
                    <h4 className="text-[13px] font-extrabold uppercase text-slate-800 mb-1.5">
                      Part 2 — Field Usage Vouchers Logged on [{spCode}]
                    </h4>
                    <table className="w-full text-left border-collapse text-[13px] border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 text-xs font-extrabold uppercase border-b border-slate-300">
                          <th className="py-2 px-2.5">Voucher #</th>
                          <th className="py-2 px-2.5">Date</th>
                          <th className="py-2 px-2.5">Field Team</th>
                          <th className="py-2 px-2.5">Material</th>
                          <th className="py-2 px-2.5 text-right">Used</th>
                          <th className="py-2 px-2.5 text-right">Wastage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {spf.spTotalLogsCount === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-3 px-3 text-center text-slate-400">
                              No field usage vouchers logged under [{spCode}] yet.
                            </td>
                          </tr>
                        ) : (
                          spf.items.flatMap((spIt) =>
                            spIt.spUsageLogs.map((uLog) => (
                              <tr key={`${spIt.itemId}-${uLog.id}`}>
                                <td className="py-2 px-2.5 font-mono font-bold text-teal-800">
                                  {uLog.usageVoucherNumber}
                                </td>
                                <td className="py-2 px-2.5 text-slate-600">{formatDateTime(uLog.date)}</td>
                                <td className="py-2 px-2.5 font-semibold text-slate-800">{uLog.teamName}</td>
                                <td className="py-2 px-2.5 text-slate-800">
                                  <span className="font-mono font-bold mr-1">{spIt.itemCode}</span>
                                  {spIt.itemName}
                                </td>
                                <td className="py-2 px-2.5 text-right font-mono font-bold text-teal-700">
                                  {formatNumber(uLog.usedQty)} {spIt.unit}
                                </td>
                                <td className="py-2 px-2.5 text-right font-mono font-bold text-rose-600">
                                  {formatNumber(uLog.wastedQty)} {spIt.unit}
                                </td>
                              </tr>
                            ))
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Sign-Off Block */}
                  <div className="grid grid-cols-3 gap-6 pt-5 border-t border-slate-200 text-[13px] text-slate-600">
                    <div>
                      {!offDigitalSignature &&
                      matchDigitalSignature(digitalSignatures, activeTemplate?.preparedBy || currentUser?.fullName, 'prepared') ? (
                        <div className="h-14 flex items-end pb-1 border-b border-slate-400 mb-1.5">
                          <img
                            src={
                              matchDigitalSignature(digitalSignatures, activeTemplate?.preparedBy || currentUser?.fullName, 'prepared')!
                                .signatureDataUrl
                            }
                            alt="Prepared Digital Signature"
                            className="max-h-12 max-w-[150px] object-contain mix-blend-multiply"
                          />
                        </div>
                      ) : (
                        <div className="h-16 flex flex-col justify-end border-b border-dashed border-slate-400 mb-1.5 pb-1">
                          <span className="text-[10px] text-slate-400 italic">Hand Signature</span>
                        </div>
                      )}
                      <div className="font-bold text-slate-800">Prepared By (Site Store)</div>
                      <div className="text-[11px]">Signature &amp; Date</div>
                    </div>
                    <div>
                      {!offDigitalSignature &&
                      matchDigitalSignature(digitalSignatures, activeTemplate?.approvedBy || currentUser?.fullName, 'approved') ? (
                        <div className="h-14 flex items-end pb-1 border-b border-slate-400 mb-1.5">
                          <img
                            src={
                              matchDigitalSignature(digitalSignatures, activeTemplate?.approvedBy || currentUser?.fullName, 'approved')!
                                .signatureDataUrl
                            }
                            alt="Site Manager Digital Signature"
                            className="max-h-12 max-w-[150px] object-contain mix-blend-multiply"
                          />
                        </div>
                      ) : (
                        <div className="h-16 flex flex-col justify-end border-b border-dashed border-slate-400 mb-1.5 pb-1">
                          <span className="text-[10px] text-slate-400 italic">Hand Signature</span>
                        </div>
                      )}
                      <div className="font-bold text-slate-800">Site Manager ({branchName})</div>
                      <div className="text-[11px]">Signature &amp; Date</div>
                    </div>
                    <div>
                      <div className="h-16 flex flex-col justify-end border-b border-dashed border-slate-400 mb-1.5 pb-1">
                        <span className="text-[10px] text-slate-400 italic">Client Sign &amp; Stamp</span>
                      </div>
                      <div className="font-bold text-slate-800">Client / Project Inspector</div>
                      <div className="text-[11px]">Sub-Project Sign-Off</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ------------------ CONFIRM MODAL ------------------ */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
