import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  Users2,
  Building,
  AlertTriangle,
  FileText,
  Clock,
  Layers,
  Search,
  Calendar,
  UserCheck,
  Sparkles,
  Edit2,
  ArrowRight,
  Filter,
  Check,
  Package,
  X,
  FileSpreadsheet,
  Info,
  Phone,
  Hash,
  FolderPlus,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { ProjectMaterialUsage, ProjectUsageItemRow, ProjectType } from '../../types';
import { formatNumber, formatDateTime } from '../../utils/exportUtils';
import { PrintableDocumentModal } from '../common/PrintableDocumentModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface ItemEntryRow {
  itemId: string;
  quantity: number | '';
}

export const ProjectMaterialUsageView: React.FC = () => {
  const {
    sites,
    activeSites,
    teams,
    activeTeams,
    items,
    activeItems,
    activeProjects,
    projects,
    projectTypes,
    activeProjectTypes,
    projectUsages,
    currentUser,
    getTeamInHandStock,
    logProjectMaterialUsage,
    updateProjectUsage,
    deleteProjectUsage,
    clearProjectUsages,
    activeUsers,
    addProject,
  } = useStock();

  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'reconciliation'>('log');
  const [selectedUsageForPrint, setSelectedUsageForPrint] = useState<ProjectMaterialUsage | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');

  // Confirmation modal
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

  // Site selection
  const isSiteRestricted = currentUser.siteId !== 'all';
  const branchSites = activeSites.filter((s) => !s.isMainWarehouse);
  const allowedSites = isSiteRestricted
    ? (activeSites.filter((s) => s.id === currentUser.siteId).length > 0
        ? activeSites.filter((s) => s.id === currentUser.siteId)
        : sites.filter((s) => s.id === currentUser.siteId))
    : branchSites;
  const initialSiteId =
    currentUser.siteId !== 'all' ? currentUser.siteId : (allowedSites[0]?.id || activeSites[0]?.id || '');
  const [selectedSiteId, setSelectedSiteId] = useState<string>(initialSiteId);

  // Teams for selected site
  const availableTeams = activeTeams.filter((t) => t.assignedSiteId === selectedSiteId);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(availableTeams[0]?.id || '');

  // Section / Project Type Selection (Step 1)
  const [selectedSectionId, setSelectedSectionId] = useState<string>(activeProjectTypes[0]?.id || '');
  const targetSection = activeProjectTypes.find((pt) => pt.id === selectedSectionId);

  // Project Entry Mode ('new' on-the-fly or 'existing')
  const [projectEntryMode, setProjectEntryMode] = useState<'new' | 'existing'>('new');
  const [entryCustomerName, setEntryCustomerName] = useState('');
  const [entryCustomerPhone, setEntryCustomerPhone] = useState('');
  const [entrySiteId, setEntrySiteId] = useState('');
  const [entryDistrict, setEntryDistrict] = useState('');
  const [entrySubArea, setEntrySubArea] = useState('');

  // Existing Project selection (filtered by section when possible)
  const sectionProjects = activeProjects.filter((p) => !selectedSectionId || p.projectTypeId === selectedSectionId);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    sectionProjects[0]?.id || activeProjects[0]?.id || ''
  );
  const targetProject = projects.find((p) => p.id === selectedProjectId) || activeProjects.find((p) => p.id === selectedProjectId);

  // Supervisor / Team Leader
  const currentTeam = teams.find((t) => t.id === selectedTeamId) || activeTeams.find((t) => t.id === selectedTeamId);
  const [supervisorName, setSupervisorName] = useState<string>(currentTeam?.teamLeaderName || '');

  // Date and details
  const [usageDate, setUsageDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [workDetails, setWorkDetails] = useState('');

  // Team in-hand stock calculation
  const teamInHand = selectedTeamId ? getTeamInHandStock(selectedTeamId) : null;
  const eligibleItems = teamInHand?.items.filter((i) => i.currentInHand > 0) || [];

  // Multi-row items table
  const [itemRows, setItemRows] = useState<ItemEntryRow[]>([
    { itemId: activeItems[0]?.id || '', quantity: '' },
  ]);
  const [errorMsg, setErrorMsg] = useState('');

  // Editing existing voucher
  const [editingVoucher, setEditingVoucher] = useState<ProjectMaterialUsage | null>(null);
  const [editTeamId, setEditTeamId] = useState('');
  const [editSupervisor, setEditSupervisor] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editWorkDetails, setEditWorkDetails] = useState('');
  const [editItemRows, setEditItemRows] = useState<ItemEntryRow[]>([]);
  const [editError, setEditError] = useState('');

  // Reconciliation selected project
  const [reconcileProjectId, setReconcileProjectId] = useState<string>(activeProjects[0]?.id || '');

  // Auto-load section template items when selectedSectionId changes (Strict Section Isolation)
  const handleSelectSection = (secId: string) => {
    setSelectedSectionId(secId);
    const sec = activeProjectTypes.find((pt) => pt.id === secId);
    if (sec && (sec.templateItems || []).length > 0) {
      const templateRows: ItemEntryRow[] = sec.templateItems.map((t) => ({
        itemId: t.itemId,
        quantity: typeof t.suggestedQty === 'number' ? t.suggestedQty : '',
      }));
      setItemRows(templateRows);
      setSuccessToast(`Loaded BOM template for "${sec.name}" (${templateRows.length} items). Please verify quantities.`);
    } else {
      // STRICT ISOLATION: Reset items so previous section's template is never retained
      setItemRows([{ itemId: activeItems[0]?.id || '', quantity: '' }]);
      if (sec) {
        setSuccessToast(`Section "${sec.name}" selected. (No template configured for this section).`);
      }
    }

    // Also update existing project dropdown if in existing mode
    const matchingProjs = activeProjects.filter((p) => p.projectTypeId === secId);
    if (matchingProjs.length > 0) {
      setSelectedProjectId(matchingProjs[0].id);
    } else {
      setSelectedProjectId('');
    }
  };

  // Initial load of first section's template on component mount
  useEffect(() => {
    if (activeProjectTypes.length > 0) {
      const firstSec = activeProjectTypes[0];
      if (firstSec && (firstSec.templateItems || []).length > 0) {
        const initialRows: ItemEntryRow[] = firstSec.templateItems.map((t) => ({
          itemId: t.itemId,
          quantity: typeof t.suggestedQty === 'number' ? t.suggestedQty : '',
        }));
        setItemRows(initialRows);
      }
    }
  }, []);

  // Real-time Duplicate and Existing Project Detection
  const duplicateMatches = React.useMemo(() => {
    if (projectEntryMode !== 'new') return [];
    const cleanPhone = entryCustomerPhone.trim().toLowerCase();
    const cleanSiteId = entrySiteId.trim().toLowerCase();
    const cleanName = entryCustomerName.trim().toLowerCase();

    if (!cleanPhone && !cleanSiteId && !cleanName) return [];

    return activeProjects.filter((p) => {
      const matchPhone = cleanPhone && p.customerPhone && p.customerPhone.trim().toLowerCase() === cleanPhone;
      const matchSiteId = cleanSiteId && p.siteIdentifier && p.siteIdentifier.trim().toLowerCase() === cleanSiteId;
      const matchName = cleanName && p.projectName.trim().toLowerCase() === cleanName;
      return matchPhone || matchSiteId || matchName;
    });
  }, [projectEntryMode, entryCustomerPhone, entrySiteId, entryCustomerName, activeProjects]);

  // Handle site change
  const handleSiteChange = (newSiteId: string) => {
    setSelectedSiteId(newSiteId);
    const siteTeams = activeTeams.filter((t) => t.assignedSiteId === newSiteId);
    const firstTeam = siteTeams[0]?.id || '';
    setSelectedTeamId(firstTeam);
    const tObj = teams.find((t) => t.id === firstTeam);
    if (tObj) setSupervisorName(tObj.teamLeaderName);
  };

  // Handle team change
  const handleTeamChange = (newTeamId: string) => {
    setSelectedTeamId(newTeamId);
    const tObj = teams.find((t) => t.id === newTeamId) || activeTeams.find((t) => t.id === newTeamId);
    if (tObj) setSupervisorName(tObj.teamLeaderName);
  };

  // Row operations
  const handleAddItemRow = () => {
    const unselected = activeItems.find((itm) => !itemRows.some((r) => r.itemId === itm.id));
    setItemRows([...itemRows, { itemId: unselected?.id || activeItems[0]?.id || '', quantity: '' }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (itemRows.length <= 1) return;
    setItemRows(itemRows.filter((_, i) => i !== idx));
  };

  const handleRowChange = (idx: number, field: keyof ItemEntryRow, value: string | number) => {
    setItemRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  // Submission
  const handleSubmitUsage = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (projectEntryMode === 'new') {
      if (!entryCustomerName.trim()) {
        setErrorMsg('Please enter the Project or Customer Name.');
        return;
      }
    } else {
      if (!selectedProjectId) {
        setErrorMsg('Please select a project from the list.');
        return;
      }
    }

    if (!selectedTeamId) {
      setErrorMsg('Please select the field team.');
      return;
    }
    if (!supervisorName.trim()) {
      setErrorMsg('Please enter or select the Supervisor / Team Leader name.');
      return;
    }

    // Validate item rows
    const validRows: ProjectUsageItemRow[] = [];
    const usedItemIds = new Set<string>();

    for (let i = 0; i < itemRows.length; i++) {
      const row = itemRows[i];
      if (!row.itemId) continue; // skip blank row

      if (usedItemIds.has(row.itemId)) {
        const dupItem = items.find((itm) => itm.id === row.itemId);
        setErrorMsg(`Item "${dupItem?.itemName || row.itemId}" is listed multiple times. Please combine quantities.`);
        return;
      }
      usedItemIds.add(row.itemId);

      const qty = Number(row.quantity);
      if (!qty || qty <= 0) {
        const itemInfo = items.find((itm) => itm.id === row.itemId);
        setErrorMsg(`Item "${itemInfo?.itemName || row.itemId}": Please enter a valid quantity greater than 0.`);
        return;
      }

      const inHandItem = teamInHand?.items.find((e) => e.itemId === row.itemId);
      const maxAllowed = inHandItem?.currentInHand || 0;
      if (qty > maxAllowed) {
        const itemInfo = items.find((itm) => itm.id === row.itemId);
        setErrorMsg(
          `Quantity for "${itemInfo?.itemName || row.itemId}" (${qty}) exceeds ${currentTeam?.teamName || 'team'}'s in-hand balance (${maxAllowed} ${itemInfo?.unit || 'units'}). Issue stock to team first.`
        );
        return;
      }

      validRows.push({ itemId: row.itemId, quantity: qty });
    }

    if (validRows.length === 0) {
      setErrorMsg('Please enter quantities for at least one material item.');
      return;
    }

    const targetTeam = teams.find((t) => t.id === selectedTeamId) || activeTeams.find((t) => t.id === selectedTeamId);
    const activeSec = activeProjectTypes.find((pt) => pt.id === selectedSectionId);

    try {
      let finalProjectId = selectedProjectId;
      let finalProjectName = targetProject?.projectName || 'Project';
      let finalSiteIdentifier = targetProject?.siteIdentifier || '';
      let finalCustomerPhone = targetProject?.customerPhone || '';
      let finalCustomerName = targetProject?.customerName || '';

      // If in 'new' mode, dynamically register the project into the Project Registry!
      if (projectEntryMode === 'new') {
        const generatedProjId = entrySiteId.trim()
          ? entrySiteId.trim().toUpperCase()
          : `PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

        const registeredProject = addProject({
          projectId: generatedProjId,
          projectName: entryCustomerName.trim(),
          customerName: entryCustomerName.trim(),
          customerPhone: entryCustomerPhone.trim() || undefined,
          siteIdentifier: entrySiteId.trim().toUpperCase() || undefined,
          projectTypeId: selectedSectionId || undefined,
          projectTypeName: activeSec?.name,
          referenceNo: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
          district: entryDistrict.trim() || (sites.find((s) => s.id === selectedSiteId)?.location || 'General'),
          subArea: entrySubArea.trim() || 'Field Site',
          status: 'Active',
        });

        finalProjectId = registeredProject.id;
        finalProjectName = registeredProject.projectName;
        finalSiteIdentifier = registeredProject.siteIdentifier || '';
        finalCustomerPhone = registeredProject.customerPhone || '';
        finalCustomerName = registeredProject.customerName || '';
      }

      // Log material consumption under the team's custody
      const newUsage = logProjectMaterialUsage({
        projectId: finalProjectId,
        projectName: finalProjectName,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        siteIdentifier: finalSiteIdentifier,
        projectTypeId: selectedSectionId,
        projectTypeName: activeSec?.name,
        siteId: selectedSiteId,
        teamId: selectedTeamId,
        teamName: targetTeam?.teamName || 'Field Team',
        supervisorOrLeader: supervisorName.trim(),
        supervisorOrLeaderName: supervisorName.trim(),
        date: usageDate,
        workDetails: workDetails.trim() || `Installed materials on project ${finalProjectName}`,
        items: validRows,
      });

      if (projectEntryMode === 'new') {
        setSuccessToast(
          `Material usage voucher ${newUsage.usageVoucherNumber} logged! Project "${finalProjectName}" has been added to the Project Master List.`
        );
      } else {
        setSuccessToast(
          `Material usage voucher ${newUsage.usageVoucherNumber} logged for project "${finalProjectName}". Stock deducted from ${targetTeam?.teamName}.`
        );
      }

      setSelectedUsageForPrint(newUsage);

      // Reset form fields
      setWorkDetails('');
      setEntryCustomerName('');
      setEntryCustomerPhone('');
      setEntrySiteId('');

      // Reload section template for next entry
      if (activeSec && (activeSec.templateItems || []).length > 0) {
        setItemRows(
          activeSec.templateItems.map((t) => ({
            itemId: t.itemId,
            quantity: typeof t.suggestedQty === 'number' ? t.suggestedQty : '',
          }))
        );
      } else {
        setItemRows([{ itemId: activeItems[0]?.id || '', quantity: '' }]);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to log project material usage.');
    }
  };

  // Open Edit Voucher Modal
  const handleOpenEditVoucher = (usage: ProjectMaterialUsage) => {
    setEditingVoucher(usage);
    setEditTeamId(usage.teamId);
    setEditSupervisor(usage.supervisorOrLeaderName || usage.supervisorOrLeader || '');
    setEditDate(usage.usageDate || (usage.date ? usage.date.split('T')[0] : ''));
    setEditWorkDetails(usage.workDetails || '');
    setEditItemRows(usage.items.map((i) => ({ itemId: i.itemId, quantity: i.quantity })));
    setEditError('');
  };

  const handleSaveVoucherEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVoucher) return;
    setEditError('');

    const validRows: ProjectUsageItemRow[] = [];
    for (let i = 0; i < editItemRows.length; i++) {
      const r = editItemRows[i];
      if (!r.itemId) continue;
      const q = Number(r.quantity);
      if (!q || q <= 0) {
        setEditError(`Row #${i + 1}: Please enter a valid quantity.`);
        return;
      }
      validRows.push({ itemId: r.itemId, quantity: q });
    }

    if (validRows.length === 0) {
      setEditError('Voucher must contain at least one item.');
      return;
    }

    const tObj = teams.find((t) => t.id === editTeamId);
    updateProjectUsage(editingVoucher.id, {
      teamId: editTeamId,
      teamName: tObj?.teamName || editingVoucher.teamName,
      supervisorOrLeader: editSupervisor.trim(),
      supervisorOrLeaderName: editSupervisor.trim(),
      usageDate: editDate,
      workDetails: editWorkDetails.trim(),
      items: validRows,
    });

    setSuccessToast(`Usage Voucher ${editingVoucher.usageVoucherNumber} updated successfully. Team in-hand balances recalculated.`);
    setEditingVoucher(null);
  };

  // Filtered usages history
  const filteredUsages = projectUsages.filter((pu) => {
    if (pu.isDeleted) return false;
    if (projectFilter !== 'all' && pu.projectId !== projectFilter) return false;
    if (teamFilter !== 'all' && pu.teamId !== teamFilter) return false;
    if (sectionFilter !== 'all' && pu.projectTypeId !== sectionFilter) return false;
    if (currentUser.siteId !== 'all' && pu.siteId !== currentUser.siteId) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchVoucher = pu.usageVoucherNumber.toLowerCase().includes(q);
      const matchProj = (pu.projectName || '').toLowerCase().includes(q);
      const matchTeam = (pu.teamName || '').toLowerCase().includes(q);
      const matchLead = (pu.supervisorOrLeader || pu.supervisorOrLeaderName || '').toLowerCase().includes(q);
      const matchDetails = (pu.workDetails || '').toLowerCase().includes(q);
      return matchVoucher || matchProj || matchTeam || matchLead || matchDetails;
    }
    return true;
  });

  // Reconcile project calculations
  const reconcileProject = projects.find((p) => p.id === reconcileProjectId) || activeProjects[0];
  const reconcileUsages = reconcileProject
    ? projectUsages.filter((pu) => pu.projectId === reconcileProject.id && !pu.isDeleted)
    : [];

  const reconcileTeamBreakdown = React.useMemo(() => {
    const map = new Map<string, { teamName: string; vouchersCount: number; itemsMap: Map<string, number> }>();
    const totalProjectItemsMap = new Map<string, number>();

    reconcileUsages.forEach((pu) => {
      const tId = pu.teamId || 'unknown';
      const existing = map.get(tId) || {
        teamName: pu.teamName || 'Unknown Team',
        vouchersCount: 0,
        itemsMap: new Map<string, number>(),
      };
      existing.vouchersCount++;

      pu.items.forEach((row) => {
        const cur = existing.itemsMap.get(row.itemId) || 0;
        existing.itemsMap.set(row.itemId, cur + Number(row.quantity));

        const grand = totalProjectItemsMap.get(row.itemId) || 0;
        totalProjectItemsMap.set(row.itemId, grand + Number(row.quantity));
      });
      map.set(tId, existing);
    });

    return {
      teams: Array.from(map.values()),
      totalItems: Array.from(totalProjectItemsMap.entries()),
    };
  }, [reconcileUsages]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Project Material Usage & Multi-Team Tracking
              </h1>
              <p className="text-xs text-slate-500">
                Log items consumed on projects, load section templates, and reconcile multi-team material consumption
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <Layers className="w-4 h-4 text-teal-600" />
          <span>Active Projects: <strong>{activeProjects.length}</strong></span>
          <span className="text-slate-300">|</span>
          <span>Logged Usages: <strong>{projectUsages.length}</strong></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('log')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'log'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4 text-teal-400" />
          <span>Log Material Usage</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Usage Vouchers History ({filteredUsages.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reconciliation')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'reconciliation'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users2 className="w-4 h-4 text-emerald-400" />
          <span>Project & Multi-Team Reconciliation</span>
        </button>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: LOG MATERIAL USAGE */}
      {activeTab === 'log' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Card (2 Cols) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Enter Used Materials to Project</span>
              </h2>

              {targetSection && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  Section: {targetSection.name}
                </span>
              )}
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Select Project Section / Type */}
            <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>1. Select Project Section / Type *</span>
                </label>
                {targetSection && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>{(targetSection.templateItems || []).length} BOM Template item(s) pre-loaded</span>
                  </span>
                )}
              </div>

              {/* Visual Section Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {activeProjectTypes.map((pt) => {
                  const isSelected = selectedSectionId === pt.id;
                  const bomCount = (pt.templateItems || []).length;
                  return (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => handleSelectSection(pt.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-emerald-500/40'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase opacity-75">{pt.code || 'SEC'}</div>
                        <div className="text-xs font-bold truncate">{pt.name}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          isSelected ? 'bg-slate-800 text-emerald-300' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {bomCount} BOM
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmitUsage} className="space-y-4">
              {/* Step 2: Project / Customer Details */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FolderPlus className="w-4 h-4 text-teal-600" />
                    <span>2. Project & Customer Identification</span>
                  </span>

                  {/* Mode Switcher */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setProjectEntryMode('new')}
                      className={`px-3 py-1 rounded-md transition cursor-pointer ${
                        projectEntryMode === 'new'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      + Enter Customer / New Site
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectEntryMode('existing')}
                      className={`px-3 py-1 rounded-md transition cursor-pointer ${
                        projectEntryMode === 'existing'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Select Registered Project ({sectionProjects.length})
                    </button>
                  </div>
                </div>

                {projectEntryMode === 'new' ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Customer / Project Name *
                        </label>
                        <input
                          type="text"
                          value={entryCustomerName}
                          onChange={(e) => setEntryCustomerName(e.target.value)}
                          placeholder="e.g. SLT Fibre Conn - Sunil Fernando"
                          className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Customer Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={entryCustomerPhone}
                            onChange={(e) => setEntryCustomerPhone(e.target.value)}
                            placeholder="e.g. 0771234567 / 071xxxxxxx"
                            className="w-full pl-8 pr-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Site ID / Work Order / Ref No
                        </label>
                        <div className="relative">
                          <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={entrySiteId}
                            onChange={(e) => setEntrySiteId(e.target.value)}
                            placeholder="e.g. SITE-0891, SO-4421"
                            className="w-full pl-8 pr-3 py-2 text-xs font-mono uppercase border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          District
                        </label>
                        <input
                          type="text"
                          value={entryDistrict}
                          onChange={(e) => setEntryDistrict(e.target.value)}
                          placeholder="e.g. Colombo, Kandy"
                          className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Sub Area / Location
                        </label>
                        <input
                          type="text"
                          value={entrySubArea}
                          onChange={(e) => setEntrySubArea(e.target.value)}
                          placeholder="e.g. Maharagama, Sector 4"
                          className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    {/* Duplicate Detection Alert Banner */}
                    {duplicateMatches.length > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Existing Match Found:</span> Found {duplicateMatches.length} registered project(s) matching this Phone or Site ID:
                            <div className="font-semibold text-amber-900 mt-0.5">
                              {duplicateMatches.map((m) => `"${m.projectName}" (${m.siteIdentifier ? `Site: ${m.siteIdentifier}, ` : ''}${m.customerPhone ? `Tel: ${m.customerPhone}` : m.projectId})`).join(' | ')}
                            </div>
                            <div className="text-[11px] text-amber-800 mt-0.5">
                              You can link this usage to the existing project (e.g. 2nd team or revisit), or save as a separate duplicate entry.
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setProjectEntryMode('existing');
                              setSelectedProjectId(duplicateMatches[0].id);
                              setSuccessToast(`Switched to existing project "${duplicateMatches[0].projectName}". Material usage will attach to this project.`);
                            }}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-2xs cursor-pointer"
                          >
                            Link to Existing Project
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Choose Project in Section "{targetSection?.name || 'Current'}" *
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    >
                      {sectionProjects.length === 0 ? (
                        <option value="">No registered projects in this section (Click "+ Enter Customer" above)</option>
                      ) : (
                        sectionProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.projectId}] {p.projectName} {p.siteIdentifier ? `· Site: ${p.siteIdentifier}` : ''} {p.customerPhone ? `· Tel: ${p.customerPhone}` : ''}
                          </option>
                        ))
                      )}
                    </select>

                    {targetProject && (
                      <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex flex-wrap items-center gap-3">
                        <span><strong>Site ID:</strong> {targetProject.siteIdentifier || targetProject.projectId}</span>
                        <span><strong>Phone:</strong> {targetProject.customerPhone || 'N/A'}</span>
                        <span><strong>District:</strong> {targetProject.district || 'General'}</span>
                        <span><strong>Ref:</strong> {targetProject.referenceNo || '—'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 3: Site, Field Team & Execution Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Site Branch */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Site Branch *
                  </label>
                  <select
                    value={selectedSiteId}
                    onChange={(e) => handleSiteChange(e.target.value)}
                    disabled={currentUser.siteId !== 'all'}
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-75"
                  >
                    {allowedSites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.location})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Executing Field Team */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Executing Field Team * (Stock Deducted from this Team)
                  </label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => handleTeamChange(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    {availableTeams.length === 0 ? (
                      <option value="">No Teams Assigned to this Site</option>
                    ) : (
                      availableTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.teamName} (Lead: {t.teamLeaderName})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Supervisor / Team Leader */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supervisor or Team Leader *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={supervisorName}
                      onChange={(e) => setSupervisorName(e.target.value)}
                      placeholder="e.g. John Doe / Team Leader"
                      list="supervisor-presets"
                      className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                    <datalist id="supervisor-presets">
                      {currentTeam && <option value={currentTeam.teamLeaderName} />}
                      {activeUsers.map((u) => (
                        <option key={u.id} value={u.fullName}>
                          {u.fullName} ({u.role})
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Usage Date *
                  </label>
                  <input
                    type="date"
                    value={usageDate}
                    onChange={(e) => setUsageDate(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              {/* Work Details / Scope */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Details / Scope
                </label>
                <input
                  type="text"
                  value={workDetails}
                  onChange={(e) => setWorkDetails(e.target.value)}
                  placeholder="e.g. Fibre Drop Installation, Rosette termination & test"
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Dynamic Items Table with Pre-loaded Section Template */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      3. Materials Consumed (Deducted from {currentTeam?.teamName || 'Team'} Custody)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Standard section template items auto-loaded below. Enter actual quantities used or add extra items.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Extra Item</span>
                  </button>
                </div>

                {eligibleItems.length === 0 && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Notice: <strong>{currentTeam?.teamName || 'Selected team'}</strong> currently holds 0 units in custody. Items can be entered, but ensure materials are issued to this team via <em>Issue to Teams</em> to permit deduction.
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  {itemRows.map((row, idx) => {
                    const selectedItemCustody = teamInHand?.items.find((e) => e.itemId === row.itemId);
                    const itemObj = items.find((i) => i.id === row.itemId);
                    const inHandBalance = selectedItemCustody?.currentInHand || 0;
                    const isOverLimit = typeof row.quantity === 'number' && row.quantity > inHandBalance;

                    return (
                      <div
                        key={idx}
                        className={`bg-white border rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3 transition-colors ${
                          isOverLimit ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                        }`}
                      >
                        {/* Item select */}
                        <div className="flex-1 w-full">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Item #{idx + 1}
                          </label>
                          <select
                            value={row.itemId}
                            onChange={(e) => handleRowChange(idx, 'itemId', e.target.value)}
                            className="w-full text-xs font-semibold px-2.5 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none"
                            required
                          >
                            <option value="">-- Select Material Item --</option>
                            {activeItems.map((itm) => {
                              const custody = teamInHand?.items.find((x) => x.itemId === itm.id);
                              const balance = custody?.currentInHand || 0;
                              return (
                                <option key={itm.id} value={itm.id}>
                                  [{itm.itemCode}] {itm.itemName} ({balance > 0 ? `Holds: ${balance} ${itm.unit}` : '0 in custody'})
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Available In-Hand Display */}
                        <div className="w-full sm:w-32 text-center sm:text-left">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Team In-Hand
                          </label>
                          <div
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border ${
                              inHandBalance > 0
                                ? 'text-teal-700 bg-teal-50 border-teal-200'
                                : 'text-slate-500 bg-slate-100 border-slate-200'
                            }`}
                          >
                            {inHandBalance} {itemObj?.unit || 'units'}
                          </div>
                        </div>

                        {/* Quantity input */}
                        <div className="w-full sm:w-32">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Quantity Used *
                          </label>
                          <input
                            type="number"
                            min="0.001"
                            step="any"
                            value={row.quantity}
                            onChange={(e) =>
                              handleRowChange(idx, 'quantity', e.target.value === '' ? '' : Number(e.target.value))
                            }
                            placeholder="Qty"
                            className={`w-full text-xs font-semibold px-2.5 py-1.5 border rounded-lg bg-slate-50 focus:bg-white focus:outline-none text-center font-mono ${
                              isOverLimit ? 'border-rose-400 ring-2 ring-rose-200' : 'border-slate-200'
                            }`}
                            required
                          />
                        </div>

                        {/* Remove Row Button */}
                        <div className="pt-2 sm:pt-4">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            disabled={itemRows.length <= 1}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg disabled:opacity-30 cursor-pointer"
                            title="Remove Row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={eligibleItems.length === 0}
                  className="px-6 py-2.5 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800 transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <FolderKanban className="w-4 h-4" />
                  <span>Record Material Usage & Deduct In-Hand Stock</span>
                </button>
              </div>
            </form>
          </div>

          {/* In-Hand Balance Quick Reference (1 Col) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users2 className="w-4 h-4 text-teal-600" />
              <span>{currentTeam?.teamName || 'Team'} In-Hand Custody</span>
            </h2>
            <p className="text-[11px] text-slate-500 mb-3">
              Real-time material custody held by this team before deduction.
            </p>

            <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2 pr-1">
              {eligibleItems.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No active in-hand items currently held by {currentTeam?.teamName || 'this team'}.
                </div>
              ) : (
                eligibleItems.map((e) => {
                  const itm = items.find((x) => x.id === e.itemId);
                  return (
                    <div
                      key={e.itemId}
                      className="p-2.5 border border-slate-100 rounded-xl bg-slate-50 flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-800 truncate">{itm?.itemName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {itm?.itemCode} · Category: {itm?.category}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-teal-700">
                          {formatNumber(e.currentInHand)} {itm?.unit}
                        </div>
                        <div className="text-[10px] text-slate-400">In Custody</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VOUCHERS HISTORY TABLE WITH EDIT CAPABILITY */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-800">
                Project Material Usage Log ({filteredUsages.length})
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter by Section */}
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
              >
                <option value="all">All Sections</option>
                {activeProjectTypes.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name}
                  </option>
                ))}
              </select>

              {/* Filter by Project */}
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
              >
                <option value="all">All Projects</option>
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.projectId}] {p.projectName}
                  </option>
                ))}
              </select>

              {/* Filter by Team */}
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
              >
                <option value="all">All Teams</option>
                {activeTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.teamName}
                  </option>
                ))}
              </select>

              {/* Search */}
              <div className="relative w-full sm:w-64 min-w-[180px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search voucher, project..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-7 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>

              {currentUser.role === 'Central Warehouse Admin' && projectUsages.length > 0 && (
                <button
                  onClick={() =>
                    setConfirmState({
                      isOpen: true,
                      title: 'Clear All Project Usages',
                      message:
                        'Are you sure you want to permanently clear all project material usage records? This will reset all project consumption logs.',
                      confirmLabel: 'Clear All Usages',
                      onConfirm: () => {
                        clearProjectUsages();
                        setConfirmState((prev) => ({ ...prev, isOpen: false }));
                      },
                    })
                  }
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1.5 border border-rose-200 rounded-lg bg-rose-50 cursor-pointer"
                >
                  Clear Log
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Voucher #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Project & Section</th>
                  <th className="py-2.5 px-3">Team & Supervisor</th>
                  <th className="py-2.5 px-3">Materials Consumed</th>
                  <th className="py-2.5 px-3">Work Scope</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No project material usage records match your search filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsages.map((usage) => {
                    const totalItemsQty = usage.items.reduce((s, i) => s + i.quantity, 0);

                    return (
                      <tr key={usage.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-teal-700 whitespace-nowrap">
                          {usage.usageVoucherNumber}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                          {usage.usageDate || usage.date}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{usage.projectName}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            {usage.projectTypeName && (
                              <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200 font-bold">
                                {usage.projectTypeName}
                              </span>
                            )}
                            <span className="font-mono text-slate-400">
                              ID: {projects.find((p) => p.id === usage.projectId)?.projectId || usage.projectId}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{usage.teamName}</div>
                          <div className="text-[10px] text-slate-500">
                            Lead: {usage.supervisorOrLeader || usage.supervisorOrLeaderName}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">
                            {totalItemsQty} units ({usage.items.length} line items)
                          </div>
                          <div className="text-[10px] text-slate-500 line-clamp-1">
                            {usage.items
                              .map((row) => {
                                const itm = items.find((i) => i.id === row.itemId);
                                return `${row.quantity}x ${itm?.itemCode || itm?.itemName || 'Item'}`;
                              })
                              .join(', ')}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 max-w-xs truncate text-slate-600">
                          {usage.workDetails || 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedUsageForPrint(usage)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200"
                              title="Print Usage Voucher"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Voucher</span>
                            </button>

                            <button
                              onClick={() => handleOpenEditVoucher(usage)}
                              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                              title="Edit Voucher details or quantities"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {currentUser.role === 'Central Warehouse Admin' && (
                              <button
                                onClick={() =>
                                  setConfirmState({
                                    isOpen: true,
                                    title: 'Delete Material Usage Record',
                                    message: `Are you sure you want to delete ${usage.usageVoucherNumber}?`,
                                    confirmLabel: 'Delete Record',
                                    onConfirm: () => {
                                      deleteProjectUsage(usage.id);
                                      setConfirmState((prev) => ({ ...prev, isOpen: false }));
                                    },
                                  })
                                }
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
      )}

      {/* TAB 3: PROJECT MULTI-TEAM RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          {/* Project Selector Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Multi-Team Reconciliation</span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">Project Material Consumption Breakdown</h2>
              <p className="text-xs text-slate-500">
                Track how materials for each project were allocated and consumed across distinct field teams.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">Select Project:</span>
              <select
                value={reconcileProjectId}
                onChange={(e) => setReconcileProjectId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-900 focus:outline-none min-w-[240px]"
              >
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.projectId}] {p.projectName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {reconcileProject ? (
            <div className="space-y-6">
              {/* Project Card Header */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                      {reconcileProject.projectId}
                    </span>
                    {reconcileProject.projectTypeName && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold">
                        {reconcileProject.projectTypeName}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold">{reconcileProject.projectName}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>District: {reconcileProject.district || '—'}</span>
                    <span>·</span>
                    <span>Ref: {reconcileProject.referenceNo || '—'}</span>
                    <span>·</span>
                    <span>Total Vouchers: {reconcileUsages.length}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-400">
                    {reconcileTeamBreakdown.teams.length} Team(s)
                  </div>
                  <div className="text-xs text-slate-400">Participated in this Project</div>
                </div>
              </div>

              {/* Grand Total Project Consumed Materials */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>Total Project Materials Consumed (Across All Teams)</span>
                </h4>

                {reconcileTeamBreakdown.totalItems.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl text-xs">
                    No material usages recorded yet for this project.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {reconcileTeamBreakdown.totalItems.map(([itmId, qty]) => {
                      const itm = items.find((i) => i.id === itmId);
                      return (
                        <div key={itmId} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <div className="text-[11px] text-slate-500 font-mono">{itm?.itemCode || 'ITEM'}</div>
                          <div className="text-xs font-bold text-slate-900 truncate">{itm?.itemName}</div>
                          <div className="text-base font-black text-emerald-700 mt-1">
                            {formatNumber(qty)} <span className="text-xs font-normal text-slate-500">{itm?.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Multi-Team Breakdown Cards */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                  <Users2 className="w-4 h-4 text-emerald-600" />
                  <span>Individual Team Consumption Breakdown</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reconcileTeamBreakdown.teams.map((t, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                            #{idx + 1}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">{t.teamName}</span>
                            <span className="text-[11px] text-slate-500">{t.vouchersCount} logged voucher slip(s)</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {Array.from(t.itemsMap.entries()).map(([itmId, qty]) => {
                          const itm = items.find((i) => i.id === itmId);
                          return (
                            <div key={itmId} className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                              <span className="text-slate-700 font-medium">{itm?.itemName || itmId}</span>
                              <span className="font-mono font-bold text-slate-900">
                                {formatNumber(qty)} {itm?.unit || 'units'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* EDIT VOUCHER MODAL */}
      {editingVoucher && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Edit Material Usage Voucher: {editingVoucher.usageVoucherNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Project: <strong>{editingVoucher.projectName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingVoucher(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveVoucherEdit} className="space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Field Team *
                  </label>
                  <select
                    value={editTeamId}
                    onChange={(e) => setEditTeamId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
                  >
                    {activeTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.teamName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supervisor / Leader Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editSupervisor}
                    onChange={(e) => setEditSupervisor(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Usage Date *</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Work Details</label>
                  <input
                    type="text"
                    value={editWorkDetails}
                    onChange={(e) => setEditWorkDetails(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Items in Voucher */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase block mb-1">Items & Quantities</span>
                {editItemRows.map((r, i) => {
                  const itm = items.find((x) => x.id === r.itemId);
                  return (
                    <div key={i} className="flex items-center gap-2 bg-white p-2 border border-slate-200 rounded-lg">
                      <div className="flex-1 text-xs font-semibold text-slate-800">
                        {itm?.itemName || r.itemId} ({itm?.unit || 'units'})
                      </div>
                      <div className="w-28">
                        <input
                          type="number"
                          step="any"
                          min="0.001"
                          value={r.quantity}
                          onChange={(e) => {
                            const next = [...editItemRows];
                            next[i].quantity = e.target.value ? Number(e.target.value) : '';
                            setEditItemRows(next);
                          }}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono text-center font-bold"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingVoucher(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                >
                  Save Changes & Recalculate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Voucher Modal */}
      {selectedUsageForPrint && (
        <PrintableDocumentModal
          isOpen={!!selectedUsageForPrint}
          onClose={() => setSelectedUsageForPrint(null)}
          title="PROJECT MATERIAL CONSUMPTION VOUCHER"
          documentNumber={selectedUsageForPrint.usageVoucherNumber}
          documentDate={selectedUsageForPrint.usageDate || selectedUsageForPrint.date}
          recipientLabel="Project Office"
          recipientName={selectedUsageForPrint.projectName}
          recipientSubDetails={`Supervisor / Lead: ${selectedUsageForPrint.supervisorOrLeader || selectedUsageForPrint.supervisorOrLeaderName} | Team: ${selectedUsageForPrint.teamName} | Section: ${selectedUsageForPrint.projectTypeName || 'General'}${selectedUsageForPrint.siteIdentifier ? ` | Site ID: ${selectedUsageForPrint.siteIdentifier}` : ''}${selectedUsageForPrint.customerPhone ? ` | Tel: ${selectedUsageForPrint.customerPhone}` : ''}`}
          notes={`Work Scope: ${selectedUsageForPrint.workDetails || 'General project construction / installation'}`}
          items={selectedUsageForPrint.items.map((row) => {
            const itm = items.find((i) => i.id === row.itemId);
            return {
              itemCode: itm?.itemCode || 'CODE',
              itemName: itm?.itemName || 'Material Item',
              category: itm?.category || 'Telecom Equipment',
              quantity: row.quantity,
              unit: itm?.unit || 'Nos',
            };
          })}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
