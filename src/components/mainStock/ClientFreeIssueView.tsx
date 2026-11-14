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
  Sparkles,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  FileText,
  Clock,
  Layers,
  ArrowRight,
  TrendingDown,
  ChevronDown,
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
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { ClientFreeIssueEntry, ClientFreeIssueItemRow, Client, isSuperAdmin } from '../../types';
import { formatNumber, formatDate, formatDateTime, exportToCsv } from '../../utils/exportUtils';
import { PrintableDocumentModal } from '../common/PrintableDocumentModal';
import { ConfirmModal } from '../common/ConfirmModal';

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
    currentUser,
    activeItems,
    items,
    projects,
    activeProjects,
    updateProject,
    clientFreeIssues,
    addClientFreeIssue,
    deleteClientFreeIssue,
    clearClientFreeIssues,
    getClientFreeStockBalance,
    getProjectFreeStockList,
    sites,
    activeSites,
    activeClients,
    clients,
    addClient,
    updateClient,
    deleteClient,
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
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToast, setClientToast] = useState<string | null>(null);
  const [viewingVoucher, setViewingVoucher] = useState<ClientFreeIssueEntry | null>(null);
  const [printingVoucher, setPrintingVoucher] = useState<ClientFreeIssueEntry | null>(null);
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

  // Form State for Logging Client Free-Issue Shipment (DN)
  const [formClientName, setFormClientName] = useState(activeClients[0]?.name || '');
  const [formProjectMode, setFormProjectMode] = useState<'main' | 'individual' | 'all'>('main');
  const [formProjectId, setFormProjectId] = useState(activeProjects[0]?.id || '');
  const [formDispatchNoteNo, setFormDispatchNoteNo] = useState('');
  const [formReceivedDate, setFormReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formReceivedBy, setFormReceivedBy] = useState(currentUser?.fullName || 'Logistics Coordinator');
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

    // Calculate total consumed from client stock across each root project family
    let totalUnitsInstalled = 0;
    rootProjectSet.forEach((rootId) => {
      const stockList = getProjectFreeStockList(rootId);
      stockList.forEach((row) => {
        totalUnitsInstalled += row.totalUsed;
      });
    });

    const netRemaining = Math.max(0, totalUnitsReceived - totalUnitsInstalled);

    return {
      totalVouchers: activeVouchers.length,
      totalUnitsReceived,
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

  // Project Balance Overview (Grouped by Root Main Project or Standalone Individual Project)
  const projectSummaries = useMemo(() => {
    const rootProjects = activeProjects.filter((p) => !p.parentProjectId && p.projectScope !== 'sub');

    const list = rootProjects.map((p) => {
      const childSubProjects = activeProjects.filter((sp) => sp.parentProjectId === p.id);
      const isMainProject = p.projectScope === 'main' || childSubProjects.length > 0;
      const freeStockItems = getProjectFreeStockList(p.id);
      const totalRecv = freeStockItems.reduce((acc, it) => acc + it.totalReceived, 0);
      const totalUsed = freeStockItems.reduce((acc, it) => acc + it.totalUsed, 0);
      const totalRem = freeStockItems.reduce((acc, it) => acc + it.remainingBalance, 0);
      return {
        project: p,
        isMainProject,
        childSubProjects,
        items: freeStockItems,
        totalRecv,
        totalUsed,
        totalRem,
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
  }, [activeProjects, getProjectFreeStockList, selectedProjectFilter, searchQuery]);

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

  const handleOpenLogModal = (preselectedClientName?: string) => {
    setFormClientName(preselectedClientName || activeClients[0]?.name || '');
    const mainProjs = activeProjects.filter(
      (p) => p.projectScope === 'main' || activeProjects.some((sp) => sp.parentProjectId === p.id)
    );
    const defaultMode = mainProjs.length > 0 ? 'main' : 'all';
    setFormProjectMode(defaultMode);
    setFormProjectId(mainProjs[0]?.id || activeProjects.find((p) => !p.parentProjectId)?.id || activeProjects[0]?.id || '');
    setFormDispatchNoteNo(`DN-${new Date().getFullYear()}-${String(clientFreeIssues.length + 1).padStart(4, '0')}`);
    setFormReceivedDate(new Date().toISOString().split('T')[0]);
    setFormReceivedBy(currentUser?.fullName || 'Logistics Coordinator');
    setFormStorageLocation(sites[0]?.name || 'Main Central Warehouse');
    setFormNotes('');
    setFormItems([{ itemId: '', itemCode: '', itemName: '', quantity: '', unit: 'm', remarks: '' }]);
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

    // If user explicitly received stock "Under Main Project", ensure targetProj is marked as a Main Project
    if (formProjectMode === 'main' && targetProj && !targetProj.parentProjectId && targetProj.projectScope !== 'main') {
      updateProject(targetProj.id, { projectScope: 'main' });
    }

    addClientFreeIssue({
      clientName: formClientName.trim(),
      projectId: formProjectId,
      projectName: targetProj?.projectName || 'Assigned Project',
      projectScope: formProjectMode === 'main' ? 'main' : (targetProj?.projectScope || 'individual'),
      parentProjectId: targetProj?.parentProjectId,
      parentProjectName: targetProj?.parentProjectName,
      siteIdentifier: targetProj?.siteIdentifier || '',
      dispatchNoteNo: formDispatchNoteNo.trim(),
      receivedDate: formReceivedDate,
      receivedBy: formReceivedBy.trim(),
      storageLocation: formStorageLocation.trim(),
      items: validRows,
      notes: formNotes.trim() || undefined,
    });

    setShowLogModal(false);
    triggerToast(`Client Free-Issue Shipment (${formDispatchNoteNo.trim()}) logged under ${targetProj?.projectName || 'Project'}.`);
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
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
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
              <span>Total Received</span>
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
              <span>Installed on Projects</span>
              <TrendingDown className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
              {formatNumber(kpis.totalUnitsInstalled)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Auto-deducted field installation
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md p-3.5 sm:p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Remaining Balance</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
              {formatNumber(kpis.netRemaining)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Available in warehouse yards
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
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">All Projects</option>
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectName} ({p.projectId})
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
              <div className="space-y-4">
                {projectSummaries
                  .filter((p) => p.items.length > 0)
                  .map(({ project, isMainProject, childSubProjects, items: freeItems, totalRecv, totalUsed, totalRem }) => (
                    <div
                      key={project.id}
                      className="border border-slate-200 rounded-2xl p-5 bg-white shadow-2xs hover:border-indigo-300 transition-all"
                    >
                      {/* Project Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                              {project.projectId}
                            </span>
                            {isMainProject ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                                <span>🏢 Under Main Project ({childSubProjects.length} Sub-Projects)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold uppercase">
                                <span>📄 Individual Project</span>
                              </span>
                            )}
                            <h3 className="text-base font-extrabold text-slate-900">
                              {project.projectName}
                            </h3>
                            {project.siteIdentifier && (
                              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                Site: {project.siteIdentifier}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                            {project.customerName && <span>Customer: <strong className="text-slate-700">{project.customerName}</strong></span>}
                            {project.district && <span>District: <strong className="text-slate-700">{project.district}</strong></span>}
                            <span>Total Free Materials: <strong className="text-slate-700">{freeItems.length} lines</strong></span>
                            {isMainProject && (
                              <span className="text-indigo-700 font-semibold">
                                • Sub-Project usage automatically deducts from this Main Project pool
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Mini Balances Pill */}
                        <div className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <div className="px-2">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">
                              {isMainProject ? 'Main Pool Recv' : 'Received'}
                            </div>
                            <div className="font-mono font-bold text-slate-800">{formatNumber(totalRecv)}</div>
                          </div>
                          <div className="h-6 w-px bg-slate-200" />
                          <div className="px-2">
                            <div className="text-[10px] text-amber-600 font-bold uppercase">
                              {isMainProject ? 'All Subs Used' : 'Installed'}
                            </div>
                            <div className="font-mono font-bold text-amber-700">{formatNumber(totalUsed)}</div>
                          </div>
                          <div className="h-6 w-px bg-slate-200" />
                          <div className="px-2">
                            <div className="text-[10px] text-emerald-600 font-bold uppercase">
                              {isMainProject ? 'Pool Balance' : 'In Hand'}
                            </div>
                            <div className="font-mono font-black text-emerald-700">{formatNumber(totalRem)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Items Table */}
                      <div className="overflow-x-auto mt-3">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                              <th className="py-2.5 px-3">Item Code</th>
                              <th className="py-2.5 px-3">Material Description</th>
                              <th className="py-2.5 px-3 text-right">Received Under Main</th>
                              <th className="py-2.5 px-3 text-right">
                                {isMainProject ? 'Total Used (All Sub-Projects)' : 'Field Installed (Used)'}
                              </th>
                              <th className="py-2.5 px-3 text-right">Remaining Stock</th>
                              <th className="py-2.5 px-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {freeItems.map((it) => {
                              const percentUsed = it.totalReceived > 0 ? (it.totalUsed / it.totalReceived) * 100 : 0;
                              const isDepleted = it.remainingBalance <= 0;
                              return (
                                <tr key={it.itemId} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                    {it.itemCode}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-800 font-semibold">
                                    {it.itemName}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-slate-700 font-bold">
                                    {formatNumber(it.totalReceived)} <span className="text-[11px] text-slate-500 font-normal">{it.unit}</span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-amber-700 font-bold">
                                    {formatNumber(it.totalUsed)} <span className="text-[11px] text-slate-500 font-normal">{it.unit}</span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                                    <span className={isDepleted ? 'text-rose-600' : 'text-emerald-700'}>
                                      {formatNumber(it.remainingBalance)}
                                    </span>{' '}
                                    <span className="text-[11px] text-slate-500 font-normal">{it.unit}</span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {isDepleted ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                                        Fully Consumed (100%)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                        Active Stock ({Math.round(percentUsed)}% Installed)
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Sub-Project Consumption Breakdown (for Major / Main Projects) */}
                      {isMainProject && childSubProjects.length > 0 && (
                        <div className="mt-4 pt-3.5 border-t border-indigo-100 bg-indigo-50/40 rounded-xl p-3.5">
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Sub-Projects Individual Usage Breakdown ({childSubProjects.length} Sub-Projects)</span>
                            </span>
                            <span className="text-[11px] text-indigo-700 font-medium">
                              Automatically deducted from Main Project [{project.projectId}]
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {childSubProjects.map((sp) => {
                              const spItemUsages = freeItems
                                .map((fi) => {
                                  const match = fi.subProjectBreakdown?.find((b) => b.subProjectId === sp.id);
                                  return {
                                    itemCode: fi.itemCode,
                                    itemName: fi.itemName,
                                    unit: fi.unit,
                                    usedQty: match?.usedQty || 0,
                                  };
                                })
                                .filter((x) => x.usedQty > 0);

                              return (
                                <div
                                  key={sp.id}
                                  className="bg-white border border-indigo-200/80 rounded-xl p-3 shadow-2xs flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                                        ↳ {sp.projectId}
                                      </span>
                                      {sp.siteIdentifier && (
                                        <span className="text-[10px] font-mono text-slate-500">
                                          Site: {sp.siteIdentifier}
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-bold text-xs text-slate-900 mb-2">
                                      {sp.projectName}
                                    </div>

                                    {spItemUsages.length === 0 ? (
                                      <div className="text-[11px] text-slate-400 italic">
                                        No free stock consumed on this sub-project yet.
                                      </div>
                                    ) : (
                                      <div className="space-y-1 border-t border-slate-100 pt-1.5">
                                        {spItemUsages.map((u, idx) => (
                                          <div key={idx} className="flex items-center justify-between text-[11px]">
                                            <span className="text-slate-600 truncate pr-2">
                                              [{u.itemCode}] {u.itemName}
                                            </span>
                                            <span className="font-mono font-bold text-amber-700 shrink-0">
                                              -{formatNumber(u.usedQty)} {u.unit}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
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
                          <td className="py-3 px-3.5 text-slate-800 max-w-xs truncate" title={v.projectName}>
                            <div className="font-semibold">{v.projectName}</div>
                            {v.siteIdentifier && (
                              <div className="text-[10px] text-slate-500">Site: {v.siteIdentifier}</div>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                            {formatDate(v.receivedDate)}
                          </td>
                          <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                            {v.storageLocation || 'Main Warehouse'}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="e.g. +94 11 234 5678"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editingClient.phone || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
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

      {/* ------------------ MODAL: LOG NEW CLIENT FREE-ISSUE STOCK ------------------ */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto max-h-[94vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                    Log Client Free-Issue Stock (FOC Materials)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Direct entry of project materials issued free of charge by registered clients or principals
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2 shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmitNewIssue} className="overflow-y-auto pr-1 py-4 space-y-4">
              {/* Row 1: Registered Client Selector + Quick New Client Register & Project Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Registered Client / Principal <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenNewClientModal}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-emerald-600" />
                      <span>New Client Register</span>
                    </button>
                  </div>
                  <select
                    required
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Target Project Mode <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setFormProjectMode('main');
                          const mainProjs = activeProjects.filter(
                            (p) => !p.parentProjectId && p.projectScope !== 'sub'
                          );
                          if (mainProjs.length > 0) setFormProjectId(mainProjs[0].id);
                        }}
                        className={`px-2 py-0.5 rounded transition cursor-pointer ${
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
                          if (indProjs.length > 0) setFormProjectId(indProjs[0].id);
                        }}
                        className={`px-2 py-0.5 rounded transition cursor-pointer ${
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
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        const prefix =
                          formProjectMode === 'main' || p.projectScope === 'main' || subCount > 0
                            ? `🏢 [Under Main Project] `
                            : `📄 `;
                        return (
                          <option key={p.id} value={p.id}>
                            {prefix}{p.projectName} ({p.projectId}){subCount > 0 ? ` — ${subCount} Sub-Projects` : ''}{p.siteIdentifier ? ` — Site: ${p.siteIdentifier}` : ''}
                          </option>
                        );
                      });
                    })()}
                  </select>
                  {formProjectMode === 'main' && (
                    <p className="text-[11px] text-indigo-700 font-medium mt-1">
                      ✓ Stock received under this Main Project will automatically deduct whenever material usage is logged on any of its Sub-Projects.
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Dispatch Note #, Date, Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Client Dispatch Note # / Gate Pass <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DN-2026-0412"
                    value={formDispatchNoteNo}
                    onChange={(e) => setFormDispatchNoteNo(e.target.value)}
                    className="w-full px-3 py-2 font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Received Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formReceivedDate}
                    onChange={(e) => setFormReceivedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Receiving Storage Yard / Site
                  </label>
                  <select
                    value={formStorageLocation}
                    onChange={(e) => setFormStorageLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} {s.isMainWarehouse ? '(Central Yard)' : ''}
                      </option>
                    ))}
                    <option value="Direct to Project Site">Direct to Project Site</option>
                  </select>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Received Material Items (Cables, Hardware, Accessories)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Item Line</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formItems.map((row, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-2.5"
                    >
                      <div className="flex-1 min-w-[200px] w-full">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Select Item *
                        </label>
                        <select
                          value={row.itemId}
                          onChange={(e) => handleItemSelect(idx, e.target.value)}
                          required
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">-- Select Material / Cable --</option>
                          {activeItems.map((itm) => (
                            <option key={itm.id} value={itm.id}>
                              [{itm.itemCode}] {itm.itemName} ({itm.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:w-32">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Quantity ({row.unit || 'units'}) *
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
                          className="w-full px-2.5 py-1.5 font-mono font-bold text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                        />
                      </div>

                      <div className="flex-1 min-w-[140px] w-full">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Drum / Serial / Batch Remarks
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Drum #DR-8821, Batch #B-04"
                          value={row.remarks}
                          onChange={(e) => handleRowChange(idx, 'remarks', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="pt-4 sm:pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={formItems.length <= 1}
                          className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:pointer-events-none rounded-lg cursor-pointer"
                          title="Remove Row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
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
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Client Free-Issue Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------ MODAL: VIEW DETAILS ------------------ */}
      {viewingVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Client Free-Issue Voucher: {viewingVoucher.voucherNumber}
                </h3>
              </div>
              <button onClick={() => setViewingVoucher(null)} className="p-1 text-slate-400 hover:text-slate-700">
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
                <h4 className="font-bold text-slate-900 uppercase text-[10px] mb-1.5">Materials List</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                        <th className="py-2 px-3">Item Code</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-right">Quantity</th>
                        <th className="py-2 px-3">Remarks / Drum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingVoucher.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{it.itemCode}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{it.itemName}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">
                            {formatNumber(it.quantity)} {it.unit}
                          </td>
                          <td className="py-2 px-3 text-slate-500">{it.remarks || '—'}</td>
                        </tr>
                      ))}
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

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
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
