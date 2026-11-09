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
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { ClientFreeIssueEntry, ClientFreeIssueItemRow, isSuperAdmin } from '../../types';
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
    clientFreeIssues,
    addClientFreeIssue,
    deleteClientFreeIssue,
    clearClientFreeIssues,
    getClientFreeStockBalance,
    getProjectFreeStockList,
    sites,
    activeSites,
    activeClients,
  } = useStock();

  const isCentralAdmin = isSuperAdmin(currentUser?.role) || currentUser?.username === 'admin';

  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'project-balances' | 'inbound-vouchers' | 'item-summary'>('project-balances');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [selectedClientFilter, setSelectedClientFilter] = useState('all');

  // Modals
  const [showLogModal, setShowLogModal] = useState(false);
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

  // Form State
  const [formClientName, setFormClientName] = useState('Client / Project Principal');
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

  // Client suggestions (Worldwide generic categories)
  const clientOptions = [
    'Telecom Operator & Network Owner',
    'Power & Energy Utility Board',
    'Civil Infrastructure Authority',
    'Main EPC Contractor / Developer',
    'Commercial Project Owner',
    'Government & Municipal Body',
    'Other Principal / Client',
  ];

  // Helper to get active voucher count & statistics
  const activeVouchers = useMemo(() => {
    return clientFreeIssues.filter((e) => !e.isDeleted);
  }, [clientFreeIssues]);

  // Overall KPIs
  const kpis = useMemo(() => {
    let totalUnitsReceived = 0;
    const projectSet = new Set<string>();

    activeVouchers.forEach((v) => {
      if (v.projectId) projectSet.add(v.projectId);
      v.items.forEach((it) => {
        totalUnitsReceived += Number(it.quantity) || 0;
      });
    });

    // Calculate total consumed from client stock
    let totalUnitsInstalled = 0;
    projectSet.forEach((projId) => {
      const stockList = getProjectFreeStockList(projId);
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
      assignedProjectsCount: projectSet.size,
    };
  }, [activeVouchers, getProjectFreeStockList]);

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

  // Project Balance Overview
  const projectSummaries = useMemo(() => {
    const list = activeProjects.map((p) => {
      const freeStockItems = getProjectFreeStockList(p.id);
      const totalRecv = freeStockItems.reduce((acc, it) => acc + it.totalReceived, 0);
      const totalUsed = freeStockItems.reduce((acc, it) => acc + it.totalUsed, 0);
      const totalRem = freeStockItems.reduce((acc, it) => acc + it.remainingBalance, 0);
      return {
        project: p,
        items: freeStockItems,
        totalRecv,
        totalUsed,
        totalRem,
      };
    });

    // Filter by project dropdown & search
    return list.filter((item) => {
      if (selectedProjectFilter !== 'all' && item.project.id !== selectedProjectFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchProj =
          item.project.projectName.toLowerCase().includes(q) ||
          item.project.projectId.toLowerCase().includes(q) ||
          (item.project.siteIdentifier || '').toLowerCase().includes(q) ||
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

  const handleOpenLogModal = () => {
    setFormClientName('Client / Project Principal');
    setFormProjectId(activeProjects[0]?.id || '');
    setFormDispatchNoteNo('');
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
      setFormError('Please enter or select the Client / Principal name.');
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

    addClientFreeIssue({
      clientName: formClientName.trim(),
      projectId: formProjectId,
      projectName: targetProj?.projectName || 'Assigned Project',
      siteIdentifier: targetProj?.siteIdentifier || '',
      dispatchNoteNo: formDispatchNoteNo.trim(),
      receivedDate: formReceivedDate,
      receivedBy: formReceivedBy.trim(),
      storageLocation: formStorageLocation.trim(),
      items: validRows,
      notes: formNotes.trim() || undefined,
    });

    setShowLogModal(false);
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
      {/* Executive Header Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold tracking-wider uppercase">
              <Gift className="w-3.5 h-3.5 text-indigo-400" />
              <span>Client-Supplied Materials (FOC / Free of Cost)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Client Free-Issue Stock
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Client / Principal Allocation
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Track fiber cables, equipment, hardware, and project materials supplied free of cost (FOC) by project clients, main contractors, or utility owners. Usage on assigned projects automatically draws down this client stock first.
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
              onClick={handleOpenLogModal}
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
          <div className="flex items-center p-1 bg-slate-100 rounded-xl w-fit">
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
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search dispatch, project, item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Project Filter */}
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

            {/* Client Filter */}
            <select
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Clients / Principals</option>
              {Array.from(new Set(activeVouchers.map((v) => v.clientName))).map((cName) => (
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
                  When a project client or principal issues free materials under a dispatch note or gate pass, click "Log Client Shipment" above to record them.
                </p>
                <button
                  onClick={handleOpenLogModal}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Log First Client Shipment</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {projectSummaries
                  .filter((p) => p.items.length > 0)
                  .map(({ project, items: freeItems, totalRecv, totalUsed, totalRem }) => (
                    <div
                      key={project.id}
                      className="border border-slate-200 rounded-2xl p-5 bg-white shadow-2xs hover:border-indigo-300 transition-all"
                    >
                      {/* Project Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                              {project.projectId}
                            </span>
                            <h3 className="text-base font-extrabold text-slate-900">
                              {project.projectName}
                            </h3>
                            {project.siteIdentifier && (
                              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                Site: {project.siteIdentifier}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-3">
                            {project.customerName && <span>Customer: <strong className="text-slate-700">{project.customerName}</strong></span>}
                            {project.district && <span>District: <strong className="text-slate-700">{project.district}</strong></span>}
                            <span>Total Free Materials: <strong className="text-slate-700">{freeItems.length} lines</strong></span>
                          </div>
                        </div>

                        {/* Mini Balances Pill */}
                        <div className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <div className="px-2">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Received</div>
                            <div className="font-mono font-bold text-slate-800">{formatNumber(totalRecv)}</div>
                          </div>
                          <div className="h-6 w-px bg-slate-200" />
                          <div className="px-2">
                            <div className="text-[10px] text-amber-600 font-bold uppercase">Installed</div>
                            <div className="font-mono font-bold text-amber-700">{formatNumber(totalUsed)}</div>
                          </div>
                          <div className="h-6 w-px bg-slate-200" />
                          <div className="px-2">
                            <div className="text-[10px] text-emerald-600 font-bold uppercase">In Hand</div>
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
                              <th className="py-2.5 px-3 text-right">Received from Client</th>
                              <th className="py-2.5 px-3 text-right">Field Installed (Used)</th>
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
                            {v.clientName}
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
      </div>

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
                    Direct entry of project materials issued free of charge by clients or main contractors
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
              {/* Row 1: Client Name & Project Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Client / Principal Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="clientSuggestions"
                      required
                      value={formClientName}
                      onChange={(e) => setFormClientName(e.target.value)}
                      placeholder="e.g. Apex Infrastructure / Telecom Principal"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <datalist id="clientSuggestions">
                      {activeClients.map((clt) => (
                        <option key={clt.id} value={clt.name} label={`${clt.clientCode} - ${clt.category || 'Client'}`} />
                      ))}
                      {clientOptions.map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Project <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {activeProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.projectName} ({p.projectId}) {p.siteIdentifier ? `— Site: ${p.siteIdentifier}` : ''}
                      </option>
                    ))}
                  </select>
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
