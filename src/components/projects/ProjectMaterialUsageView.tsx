import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  Users2,
  Building,
  Building2,
  Boxes,
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
  Target,
  Lock,
  Shield,
  Gift,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  ProjectMaterialUsage,
  ProjectUsageItemRow,
  ProjectType,
  isSuperAdmin,
  isCentralOrAllSiteAdmin,
  isUserAllSites,
  getUserAssignedSiteIds,
  userHasSiteAccess,
} from '../../types';
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
    addAuditLog,
    crossProjectRequests,
    createCrossProjectOverrideRequest,
    acceptCrossProjectOverrideRequest,
    rejectCrossProjectOverrideRequest,
    clientFreeIssues,
    getClientFreeStockBalance,
    getProjectFreeStockList,
    activeClients,
  } = useStock();

  const isCentralAdmin = isSuperAdmin(currentUser?.role) || currentUser?.username === 'admin';
  const [adminCrossProjectOverride, setAdminCrossProjectOverride] = useState(false);

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

  // Site selection (supports All Sites, Single Site, and Multiple Assigned Sites)
  const isAllSitesUser = isUserAllSites(currentUser) || isCentralOrAllSiteAdmin(currentUser.role);
  const isSiteRestricted = !isAllSitesUser;
  const userAssignedSiteIds = getUserAssignedSiteIds(currentUser, activeSites);
  const branchSites = activeSites.filter((s) => !s.isMainWarehouse);
  const allowedSites = isSiteRestricted
    ? activeSites.filter((s) => userAssignedSiteIds.includes(s.id))
    : branchSites;
  const isSingleSiteLocked = isSiteRestricted && allowedSites.length <= 1;
  const initialSiteId = allowedSites[0]?.id || activeSites[0]?.id || '';
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
  const [existingProjectFocClientId, setExistingProjectFocClientId] = useState('');

  // Existing Project selection (filtered by section when possible)
  const sectionProjects = activeProjects.filter((p) => !selectedSectionId || p.projectTypeId === selectedSectionId);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    sectionProjects[0]?.id || activeProjects[0]?.id || ''
  );
  const targetProject = projects.find((p) => p.id === selectedProjectId) || activeProjects.find((p) => p.id === selectedProjectId);
  const currentTargetProjId = projectEntryMode === 'existing' ? selectedProjectId : '';
  const projectFreeMaterials = currentTargetProjId ? getProjectFreeStockList(currentTargetProjId) : [];

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

    if (field === 'itemId' && typeof value === 'string' && value) {
      const selectedItem = items.find((i) => i.id === value);
      if (selectedItem && selectedItem.isProjectReserved && selectedItem.reservedProjectId) {
        setProjectEntryMode('existing');
        setSelectedProjectId(selectedItem.reservedProjectId);
        setSuccessToast(`🎯 Auto-selected project "${selectedItem.reservedProjectName || 'Reserved Project'}" because item "${selectedItem.itemName}" is reserved for it.`);
      }
    }
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
      } else {
        if (existingProjectFocClientId) {
          finalCustomerName = existingProjectFocClientId;
        }
      }

      // Check project reservation restrictions
      const reservedConflicts: { item: typeof items[0]; reservedFor: string }[] = [];
      for (const row of validRows) {
        const itm = items.find((i) => i.id === row.itemId);
        if (itm && itm.isProjectReserved && itm.reservedProjectId) {
          if (projectEntryMode === 'existing' && itm.reservedProjectId === finalProjectId) {
            // Valid reserved item usage for its assigned project
            continue;
          } else {
            reservedConflicts.push({
              item: itm,
              reservedFor: itm.reservedProjectName || 'another project',
            });
          }
        }
      }

      if (reservedConflicts.length > 0) {
        const conflictNames = reservedConflicts
          .map((c) => `"${c.item.itemName}" (${c.item.itemCode} - Reserved for: ${c.reservedFor})`)
          .join(', ');

        if (!isCentralAdmin) {
          setErrorMsg(
            `Access Denied: The following item(s) are strictly reserved for specific projects: ${conflictNames}. Non-admin users cannot log reserved items to a different project.`
          );
          return;
        }

        if (!adminCrossProjectOverride) {
          setErrorMsg(
            `Warning: The following item(s) are reserved for other projects: ${conflictNames}. Super Admin authorization required! Please check "Authorize Admin Cross-Project Stock Override" in section 4.`
          );
          return;
        }
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

      // Audit Log for Admin Cross-Project Stock Override
      if (reservedConflicts.length > 0 && adminCrossProjectOverride) {
        const conflictDetails = reservedConflicts
          .map((c) => `${c.item.itemCode} (${c.item.itemName} reserved for ${c.reservedFor})`)
          .join('; ');

        addAuditLog(
          'RESERVED_ITEM_CROSS_PROJECT_OVERRIDE',
          newUsage.usageVoucherNumber,
          sites.find((s) => s.id === selectedSiteId)?.name || 'Main Base',
          `Admin Cross-Project Stock Override Authorized by ${currentUser?.fullName} (@${currentUser?.username}): Issued project-reserved item(s) to project "${finalProjectName}". Override details: [${conflictDetails}]`
        );
      }

      setAdminCrossProjectOverride(false);

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
    if (isSiteRestricted && !userHasSiteAccess(currentUser, pu.siteId, activeSites)) return false;
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

      {/* Global Operational Workflow Guide Card */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border border-teal-500/30 rounded-2xl p-5 text-white shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-teal-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white tracking-tight">
                Standard Operational Workflow & Stock Governance Guide
              </h3>
              <p className="text-[11px] text-teal-200">
                End-to-end asset tracking from warehouse receipt to field team installation and FOC client drawdown.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-full">
            Global Best Practice
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-teal-800/50 space-y-1">
            <div className="font-bold text-teal-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px] font-black">1</span>
              <span>Inbound & FOC Logistics</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Receive company stock via Purchase Orders (Main Stock) or record Client Free-Issue shipments (FOC) under Client Free-Issue registry.
            </p>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-teal-800/50 space-y-1">
            <div className="font-bold text-teal-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px] font-black">2</span>
              <span>Issue to Teams (Dispatch)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Dispatch stock from Site Branch inventory yards to Field Teams via <strong>Issue to Teams</strong> so teams hold verified in-hand custody.
            </p>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-teal-800/50 space-y-1">
            <div className="font-bold text-teal-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px] font-black">3</span>
              <span>Project Usage & FOC Priority</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Log project installations. The system automatically deducts from team custody and prioritizes FOC client stock drawdown.
            </p>
          </div>
        </div>
      </div>

      {/* Central Admin Pending Cross-Project Override Review Banner */}
      {isCentralAdmin && crossProjectRequests.filter((r) => r.status === 'Pending Admin Review').length > 0 && (
        <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-slate-900 border border-amber-600/50 rounded-2xl p-5 text-white shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-amber-800/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white tracking-tight">
                  Pending Cross-Project Override Requests ({crossProjectRequests.filter((r) => r.status === 'Pending Admin Review').length})
                </h3>
                <p className="text-[11px] text-amber-200">
                  Field teams have requested to use project-reserved stock on different projects. Review & Accept to approve and post usage.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {crossProjectRequests
              .filter((r) => r.status === 'Pending Admin Review')
              .map((req) => (
                <div key={req.id} className="bg-slate-900/90 border border-amber-800/60 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">{req.requestNumber}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-white">Project: {req.projectName}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-300">Team: {req.teamName}</span>
                    </div>
                    <div className="text-[11px] text-amber-200">
                      Requested by: <strong>{req.requestedBy}</strong> ({new Date(req.requestedDate).toLocaleString()})
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Items: {req.items.map((i) => {
                        const itm = items.find((x) => x.id === i.itemId);
                        return `${i.quantity}x ${itm?.itemCode || itm?.itemName || 'Item'}`;
                      }).join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        acceptCrossProjectOverrideRequest(req.id, 'Approved via Admin Review Panel');
                        setSuccessToast(`Cross-Project Override Request ${req.requestNumber} accepted and material usage logged!`);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      ✓ Review & Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        rejectCrossProjectOverrideRequest(req.id, 'Rejected by Central Admin');
                        setSuccessToast(`Cross-Project Override Request ${req.requestNumber} rejected.`);
                      }}
                      className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

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
          <div className="lg:col-span-2 bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-sm">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-teal-900 via-slate-800 to-slate-900 text-white rounded-xl p-4 shadow-sm mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-teal-300">
                  <FileText className="w-4.5 h-4.5 text-teal-400" />
                  <span>Enter Used Materials to Project</span>
                </h2>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Record materials consumed on-site, assign executing teams, and auto-deduct in-hand balances.
                </p>
              </div>

              {targetSection && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-200 border border-teal-500/40 shrink-0 self-start sm:self-auto flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                  <span>Section: {targetSection.name}</span>
                </span>
              )}
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 1 Card: Select Project Section / Type */}
            <div className="mb-4 p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>1. Select Project Section / Type *</span>
                </label>
                {targetSection && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-white border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>{(targetSection.templateItems || []).length} BOM Template item(s)</span>
                  </span>
                )}
              </div>

              {/* Visual Section Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {activeProjectTypes.map((pt) => {
                  const isSelected = selectedSectionId === pt.id;
                  const bomCount = (pt.templateItems || []).length;
                  return (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => handleSelectSection(pt.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-emerald-500/50'
                          : 'bg-white hover:bg-emerald-100/50 text-slate-800 border-emerald-200/80 shadow-2xs'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-75 mb-0.5">{pt.code || 'SEC'}</div>
                        <div className="text-xs font-bold leading-snug whitespace-normal break-words">{pt.name}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 mt-0.5 ${
                          isSelected ? 'bg-slate-800 text-emerald-300' : 'bg-slate-100 text-slate-700'
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
              {/* Step 2 Card: Project & Customer Details */}
              <div className="p-4 bg-teal-50/70 border border-teal-200/90 rounded-xl shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-200/60 pb-2.5">
                  <span className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                    <FolderPlus className="w-4 h-4 text-teal-600" />
                    <span>2. Project & Customer Identification</span>
                  </span>

                  {/* Mode Switcher */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-teal-200 text-[11px] font-semibold self-start sm:self-auto shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setProjectEntryMode('new')}
                      className={`px-3 py-1 rounded-md transition cursor-pointer ${
                        projectEntryMode === 'new'
                          ? 'bg-teal-700 text-white shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      + Enter Customer / New Site
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectEntryMode('existing')}
                      className={`px-3 py-1 rounded-md transition cursor-pointer ${
                        projectEntryMode === 'existing'
                          ? 'bg-teal-700 text-white shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      Select Registered Project ({sectionProjects.length})
                    </button>
                  </div>
                </div>

                {projectEntryMode === 'new' ? (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          FOC Client / Principal Name *
                        </label>
                        <select
                          value={entryCustomerName}
                          onChange={(e) => setEntryCustomerName(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          required
                        >
                          <option value="">-- Select Registered Client / Principal --</option>
                          {activeClients.map((clt) => (
                            <option key={clt.id} value={clt.name}>
                              {clt.name} ({clt.clientCode} — {clt.category || 'Client'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Customer Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={entryCustomerPhone}
                            onChange={(e) => setEntryCustomerPhone(e.target.value)}
                            placeholder="e.g. 0771234567 / 071xxxxxxx"
                            className="w-full pl-8 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Site ID / Work Order / Ref No
                        </label>
                        <div className="relative">
                          <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={entrySiteId}
                            onChange={(e) => setEntrySiteId(e.target.value)}
                            placeholder="e.g. SITE-0891, SO-4421"
                            className="w-full pl-8 pr-3 py-2 text-xs font-mono uppercase border border-slate-300 rounded-lg bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          District
                        </label>
                        <input
                          type="text"
                          value={entryDistrict}
                          onChange={(e) => setEntryDistrict(e.target.value)}
                          placeholder="e.g. Colombo, Kandy"
                          className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Sub Area / Location
                        </label>
                        <input
                          type="text"
                          value={entrySubArea}
                          onChange={(e) => setEntrySubArea(e.target.value)}
                          placeholder="e.g. Maharagama, Sector 4"
                          className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                    </div>

                    {/* Duplicate Detection Alert Banner */}
                    {duplicateMatches.length > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
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
                  <div className="pt-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Choose Project in Section "{targetSection?.name || 'Current'}" *
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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

                    <div className="mt-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Associated FOC Client / Principal (Optional)
                      </label>
                      <select
                        value={existingProjectFocClientId}
                        onChange={(e) => setExistingProjectFocClientId(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      >
                        <option value="">-- Select Registered Client / Principal --</option>
                        {activeClients.map((clt) => (
                          <option key={clt.id} value={clt.name}>
                            {clt.name} ({clt.clientCode} — {clt.category || 'Client'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {targetProject && (
                      <div className="mt-2 p-2.5 bg-white border border-teal-200 rounded-lg text-[11px] text-slate-700 flex flex-wrap items-center gap-3 shadow-2xs">
                        <span><strong>Site ID:</strong> {targetProject.siteIdentifier || targetProject.projectId}</span>
                        <span><strong>Phone:</strong> {targetProject.customerPhone || 'N/A'}</span>
                        <span><strong>District:</strong> {targetProject.district || 'General'}</span>
                        <span><strong>Ref:</strong> {targetProject.referenceNo || '—'}</span>
                      </div>
                    )}

                    {projectFreeMaterials.length > 0 && (
                      <div className="mt-2.5 p-3.5 bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-2 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-indigo-950 font-bold border-b border-indigo-100/80 pb-2">
                          <span className="flex items-center gap-1.5 text-xs">
                            <Gift className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>
                              Client / Principal FOC Free Stock Allocated
                              {(() => {
                                const names = Array.from(
                                  new Set(
                                    clientFreeIssues
                                      .filter((v) => !v.isDeleted && v.projectId === currentTargetProjId)
                                      .map((v) => v.clientName)
                                  )
                                );
                                const displayName = names.length > 0 ? names.join(', ') : targetProject?.customerName;
                                return displayName ? ` (${displayName})` : '';
                              })()}
                            </span>
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-600 text-white shadow-2xs self-start sm:self-auto">
                            Auto-Deducted Priority
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Material usage entered below automatically draws down this client's FOC free stock balance first before consuming team custody inventory:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                          {projectFreeMaterials.map((fm) => (
                            <div key={fm.itemId} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-indigo-100 font-mono text-[11px] shadow-2xs">
                              <span className="text-slate-900 font-bold truncate pr-2">[{fm.itemCode}] {fm.itemName}</span>
                              <span className="shrink-0 font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                {formatNumber(fm.remainingBalance)} {fm.unit} FOC left
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 3 Card: Site Branch, Field Team & Execution Details */}
              <div className="p-4 bg-sky-50/70 border border-sky-200/90 rounded-xl shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-sky-200/60 pb-2">
                  <span className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-sky-600" />
                    <span>3. Site Branch & Field Team Execution</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Site Branch */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Site Branch *
                    </label>
                    <select
                      value={selectedSiteId}
                      onChange={(e) => handleSiteChange(e.target.value)}
                      disabled={isSingleSiteLocked}
                      className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-75"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Executing Field Team * (Stock Deducted)
                    </label>
                    <select
                      value={selectedTeamId}
                      onChange={(e) => handleTeamChange(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Supervisor or Team Leader *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={supervisorName}
                        onChange={(e) => setSupervisorName(e.target.value)}
                        placeholder="e.g. John Doe / Team Leader"
                        list="supervisor-presets"
                        className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Usage Date *
                    </label>
                    <input
                      type="date"
                      value={usageDate}
                      onChange={(e) => setUsageDate(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                {/* Work Details / Scope */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Work Details / Scope of Installation
                  </label>
                  <input
                    type="text"
                    value={workDetails}
                    onChange={(e) => setWorkDetails(e.target.value)}
                    placeholder="e.g. Fibre Drop Installation, Rosette termination & testing"
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Step 4 Card: Materials Consumed Table */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200/90 rounded-xl shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200/60 pb-2.5 mb-3">
                  <div>
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-indigo-600" />
                      <span>4. Materials Consumed (Deducted from {currentTeam?.teamName || 'Team'} Custody)</span>
                    </span>
                    <span className="text-[11px] text-slate-600 block mt-0.5">
                      Standard section template items pre-loaded below. Enter actual quantities used or add extra items.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 transition cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Extra Item</span>
                  </button>
                </div>

                {eligibleItems.length === 0 && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-center gap-2 shadow-2xs">
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
                        className={`bg-white border rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3 transition-colors shadow-2xs ${
                          isOverLimit ? 'border-rose-300 bg-rose-50/40' : 'border-indigo-100/90 hover:border-indigo-300'
                        }`}
                      >
                        {/* Item select */}
                        <div className="flex-1 w-full">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Material Item #{idx + 1} *
                          </label>
                          <select
                            value={row.itemId}
                            onChange={(e) => handleRowChange(idx, 'itemId', e.target.value)}
                            className="w-full text-xs font-semibold px-2.5 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                          >
                            <option value="">-- Select Material Item --</option>
                            {activeItems.map((itm) => {
                              const custody = teamInHand?.items.find((x) => x.itemId === itm.id);
                              const balance = custody?.currentInHand || 0;
                              const currentTargetProjId = projectEntryMode === 'existing' ? selectedProjectId : '';
                              const focBal = currentTargetProjId ? getClientFreeStockBalance(currentTargetProjId, itm.id) : { remainingBalance: 0 };
                              const focTag = focBal.remainingBalance > 0 ? ` [🎁 Client Free: ${formatNumber(focBal.remainingBalance)} ${itm.unit}]` : '';
                              let resTag = '';
                              if (itm.isProjectReserved && itm.reservedProjectId) {
                                if (itm.reservedProjectId === currentTargetProjId) {
                                  resTag = ` [🎯 Reserved for THIS Project]`;
                                } else {
                                  resTag = ` [🔒 Reserved for: ${itm.reservedProjectName || 'Project'}]`;
                                }
                              }
                              return (
                                <option key={itm.id} value={itm.id}>
                                  [{itm.itemCode}] {itm.itemName}{resTag}{focTag} ({balance > 0 ? `Holds: ${balance} ${itm.unit}` : '0 in custody'})
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Available In-Hand Display */}
                        <div className="w-full sm:w-32 text-center sm:text-left">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Team In-Hand
                          </label>
                          <div
                            className={`text-xs font-bold px-2.5 py-2 rounded-lg border text-center ${
                              inHandBalance > 0
                                ? 'text-teal-800 bg-teal-50 border-teal-200'
                                : 'text-slate-500 bg-slate-100 border-slate-200'
                            }`}
                          >
                            {inHandBalance} {itemObj?.unit || 'units'}
                          </div>
                        </div>

                        {/* Quantity input */}
                        <div className="w-full sm:w-32">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Qty Used *
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
                            className={`w-full text-xs font-bold px-2.5 py-2 border rounded-lg bg-white focus:outline-none text-center font-mono ${
                              isOverLimit ? 'border-rose-400 ring-2 ring-rose-200 text-rose-900' : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
                            }`}
                            required
                          />
                        </div>

                        {/* Remove Row Button */}
                        <div className="pt-2 sm:pt-5">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            disabled={itemRows.length <= 1}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg disabled:opacity-30 cursor-pointer transition-colors"
                            title="Remove Row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Admin Cross-Project Reserved Stock Override Section */}
                {itemRows.some((row) => {
                  if (!row.itemId) return false;
                  const itm = items.find((i) => i.id === row.itemId);
                  if (!itm || !itm.isProjectReserved || !itm.reservedProjectId) return false;
                  const currentTargetProjId = projectEntryMode === 'existing' ? selectedProjectId : '';
                  return itm.reservedProjectId !== currentTargetProjId;
                }) && (
                  <div className="mt-3 p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 font-extrabold text-xs text-amber-950">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Project-Reserved Stock Warning</span>
                    </div>
                    <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                      One or more selected items are marked as <strong>Project Reserved</strong> for a different project. Standard field users cannot log reserved items onto other projects.
                    </p>
                    {isCentralAdmin ? (
                      <label className="flex items-center gap-2 font-bold text-xs text-amber-950 bg-white p-2.5 rounded-lg border border-amber-300 cursor-pointer shadow-2xs hover:bg-amber-100/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={adminCrossProjectOverride}
                          onChange={(e) => setAdminCrossProjectOverride(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <span className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-amber-600" />
                          <span>Authorize Admin Cross-Project Stock Override (Will record system audit log)</span>
                        </span>
                      </label>
                    ) : (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 font-bold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Non-Admin User: You are restricted from using stock reserved for other projects.</span>
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const validRowsToSubmit = itemRows.filter((r) => r.itemId && Number(r.quantity) > 0);
                          if (validRowsToSubmit.length === 0) {
                            setErrorMsg('Please select items and valid quantities first.');
                            return;
                          }
                          const targetTeam = teams.find((t) => t.id === selectedTeamId) || activeTeams.find((t) => t.id === selectedTeamId);
                          const activeSec = activeProjectTypes.find((pt) => pt.id === selectedSectionId);

                          let finalProjId = selectedProjectId;
                          let finalProjName = targetProject?.projectName || 'Project';
                          if (projectEntryMode === 'new') {
                            if (!entryCustomerName.trim()) {
                              setErrorMsg('Please enter Customer/Project Name before submitting review request.');
                              return;
                            }
                            finalProjName = entryCustomerName.trim();
                            finalProjId = `PRJ-TEMP-${Math.floor(100 + Math.random() * 900)}`;
                          }

                          createCrossProjectOverrideRequest({
                            projectId: finalProjId,
                            projectName: finalProjName,
                            teamId: selectedTeamId,
                            teamName: targetTeam?.teamName || 'Field Team',
                            siteId: selectedSiteId,
                            items: validRowsToSubmit.map((r) => ({ itemId: r.itemId, quantity: Number(r.quantity) })),
                            reason: workDetails || 'Cross-project reserved item usage request',
                            usagePayload: {
                              projectId: finalProjId,
                              projectName: finalProjName,
                              customerName: targetProject?.customerName || entryCustomerName.trim(),
                              customerPhone: targetProject?.customerPhone || entryCustomerPhone.trim(),
                              siteIdentifier: targetProject?.siteIdentifier || entrySiteId.trim(),
                              projectTypeId: selectedSectionId,
                              projectTypeName: activeSec?.name,
                              siteId: selectedSiteId,
                              teamId: selectedTeamId,
                              teamName: targetTeam?.teamName || 'Field Team',
                              supervisorOrLeader: supervisorName.trim(),
                              supervisorOrLeaderName: supervisorName.trim(),
                              date: usageDate,
                              workDetails: workDetails.trim() || `Installed materials on project ${finalProjName}`,
                              items: validRowsToSubmit.map((r) => ({ itemId: r.itemId, quantity: Number(r.quantity) })),
                            },
                          });

                          setSuccessToast('📤 Review & Acceptance Request sent to Central Admin successfully!');
                          setWorkDetails('');
                        }}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                      >
                        <span>📤 Send Review & Acceptance Request to Central Admin</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Action Submit Button */}
              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={eligibleItems.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  <FolderKanban className="w-4 h-4 text-emerald-300" />
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

              {(isSuperAdmin(currentUser.role) || currentUser.username === 'admin') && projectUsages.length > 0 && (
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

                            {(isSuperAdmin(currentUser.role) || currentUser.username === 'admin') && (
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

              {/* Client Free-Issue Stock Reconciliation (Client/Principal Statement) */}
              {(() => {
                const projectFocList = getProjectFreeStockList(reconcileProjectId);
                if (projectFocList.length === 0) return null;
                return (
                  <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-xs border border-indigo-900">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-indigo-800/60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
                          <Gift className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                            <span>Client Free-Issue Stock Reconciliation (Client / Principal FOC)</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                              Official Statement
                            </span>
                          </h4>
                          <p className="text-[11px] text-indigo-300/80">
                            Materials supplied free by principal for this project vs installed in field vs remaining balance
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-indigo-800/80 text-indigo-300 font-bold uppercase text-[10px]">
                            <th className="py-2 px-3">Item Code</th>
                            <th className="py-2 px-3">Material Description</th>
                            <th className="py-2 px-3 text-right">Received from Client</th>
                            <th className="py-2 px-3 text-right">Field Installed</th>
                            <th className="py-2 px-3 text-right">Remaining Balance</th>
                            <th className="py-2 px-3 text-center">Reconciliation Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-900/60 font-medium">
                          {projectFocList.map((foc) => {
                            const isDepleted = foc.remainingBalance <= 0;
                            return (
                              <tr key={foc.itemId} className="hover:bg-indigo-900/30 transition-colors">
                                <td className="py-2.5 px-3 font-mono font-bold text-white">{foc.itemCode}</td>
                                <td className="py-2.5 px-3 text-slate-200 font-semibold">{foc.itemName}</td>
                                <td className="py-2.5 px-3 text-right font-mono text-cyan-300 font-bold">
                                  {formatNumber(foc.totalReceived)} <span className="text-[10px] text-indigo-300">{foc.unit}</span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-amber-300 font-bold">
                                  {formatNumber(foc.totalUsed)} <span className="text-[10px] text-indigo-300">{foc.unit}</span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-300">
                                  {formatNumber(foc.remainingBalance)} <span className="text-[10px] text-indigo-300">{foc.unit}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {isDepleted ? (
                                    <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-md">
                                      100% Installed
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                                      Balance in Hand ({formatNumber(foc.remainingBalance)} {foc.unit})
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
                );
              })()}

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
