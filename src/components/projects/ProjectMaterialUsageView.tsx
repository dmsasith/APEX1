import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Trash2,
  Printer,
  Download,
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
  Compass,
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
  ScanLine,
  MapPin,
  PenTool,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  ProjectMaterialUsage,
  ProjectUsageItemRow,
  ProjectType,
  Item,
  isSuperAdmin,
  isCentralOrAllSiteAdmin,
  isUserAllSites,
  getUserAssignedSiteIds,
  userHasSiteAccess,
  isTelecomNewConnectionSection,
} from '../../types';
import { formatNumber, formatDateTime, exportToCsv } from '../../utils/exportUtils';
import { printHtmlElement, downloadElementAsPdf } from '../../utils/printUtils';
import { matchDigitalSignature } from '../../utils/signatureUtils';
import { PrintableDocumentModal } from '../common/PrintableDocumentModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import {
  useUsbBarcodeScanner,
  matchItemByScannedCode,
  playScanBeep,
} from '../../utils/barcodeUtils';
import {
  COUNTRY_PHONE_RULES,
  enforceCountryPhoneInput,
  detectActivePhoneCountry,
  analyzeCountryPhone,
  matchCountryByDialPrefix,
} from '../../utils/phoneCountryUtils';
import { PhoneCountryBadge } from '../common/PhoneCountryBadge';
import { getTemporaryAssignmentBadgeLabel } from '../../utils/teamAssignmentUtils';
import {
  getEffectiveSectionCoreLabels,
  getEffectiveSectionCustomFields,
} from '../../utils/sectionTemplates';

interface ItemEntryRow {
  itemId: string;
  quantity: number | '';
  wastageQuantity?: number | '';
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
    actorDisplayName,
    getTeamInHandStock,
    getTeamSiteInHandStock,
    logProjectMaterialUsage,
    updateProjectUsage,
    deleteProjectUsage,
    clearProjectUsages,
    activeUsers,
    addProject,
    updateProject,
    addAuditLog,
    crossProjectRequests,
    createCrossProjectOverrideRequest,
    acceptCrossProjectOverrideRequest,
    rejectCrossProjectOverrideRequest,
    clientFreeIssues,
    getClientFreeStockBalance,
    getProjectFreeStockList,
    activeClients,
    config,
    currentTenant,
    digitalSignatures,
    activeTemplate,
  } = useStock();

  const isCentralAdmin = isSuperAdmin(currentUser?.role) || currentUser?.username === 'admin';
  const [adminCrossProjectOverride, setAdminCrossProjectOverride] = useState(false);

  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'reconciliation'>('log');
  const [selectedUsageForPrint, setSelectedUsageForPrint] = useState<ProjectMaterialUsage | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [fullSiteReportProjectId, setFullSiteReportProjectId] = useState<string | null>(null);
  const [isPrintingFullReport, setIsPrintingFullReport] = useState(false);
  const [fullReportPrintNotice, setFullReportPrintNotice] = useState<string | null>(null);
  const [offDigitalSignature, setOffDigitalSignature] = useState<boolean>(
    Boolean(config?.offDigitalSignature)
  );

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
  const isAllSitesUser = isUserAllSites(currentUser);
  const isSiteRestricted = !isAllSitesUser;
  const userAssignedSiteIds = getUserAssignedSiteIds(currentUser, activeSites);
  const branchSites = activeSites;
  const allowedSites = isSiteRestricted
    ? activeSites.filter((s) => userAssignedSiteIds.includes(s.id))
    : branchSites;
  const isSingleSiteLocked = isSiteRestricted && allowedSites.length <= 1;
  const initialSiteId =
    allowedSites.find((s) => !s.isMainWarehouse)?.id ||
    allowedSites[0]?.id ||
    activeSites[0]?.id ||
    '';
  const [selectedSiteId, setSelectedSiteId] = useState<string>(initialSiteId);

  // Keep selectedSiteId synced when active user switches
  useEffect(() => {
    if (allowedSites.length > 0 && !allowedSites.some((s) => s.id === selectedSiteId)) {
      const nextSite = allowedSites.find((s) => !s.isMainWarehouse) || allowedSites[0];
      if (nextSite) {
        setSelectedSiteId(nextSite.id);
        const siteTeams = activeTeams.filter((t) => t.assignedSiteId === nextSite.id);
        const firstTeam = siteTeams[0]?.id || '';
        setSelectedTeamId(firstTeam);
        const tObj = teams.find((t) => t.id === firstTeam);
        if (tObj) setSupervisorName(tObj.teamLeaderName);
      }
    }
  }, [currentUser?.id, allowedSites, selectedSiteId, activeTeams, teams]);

  // Teams assigned to selected site (strictly teams assigned to this site can use this site's stock)
  const availableTeams = activeTeams.filter((t) => t.assignedSiteId === selectedSiteId);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(availableTeams[0]?.id || '');

  useEffect(() => {
    if (availableTeams.length > 0 && !availableTeams.some((t) => t.id === selectedTeamId)) {
      const nextTeam = availableTeams[0];
      setSelectedTeamId(nextTeam.id);
      setSupervisorName(nextTeam.teamLeaderName);
    } else if (availableTeams.length === 0 && selectedTeamId !== '') {
      setSelectedTeamId('');
    }
  }, [selectedSiteId, availableTeams, selectedTeamId]);

  // Section / Project Type Selection (Step 1)
  const [selectedSectionId, setSelectedSectionId] = useState<string>(activeProjectTypes[0]?.id || '');
  const targetSection = activeProjectTypes.find((pt) => pt.id === selectedSectionId);
  const isNewConnectionSection = isTelecomNewConnectionSection(targetSection);
  const activeSectionCoreLabels = React.useMemo(
    () => getEffectiveSectionCoreLabels(targetSection),
    [targetSection]
  );
  const activeSectionCustomFields = React.useMemo(
    () => getEffectiveSectionCustomFields(targetSection),
    [targetSection]
  );
  const [entryCustomFieldValues, setEntryCustomFieldValues] = useState<Record<string, string>>({});

  // Telecom New Connection / Utility Connection Daily Progress Session Lock & 6-Field States
  const [isNcTeamAreaLocked, setIsNcTeamAreaLocked] = useState<boolean>(false);
  const [ncSessionArea, setNcSessionArea] = useState<string>(
    () => sites.find((s) => s.id === initialSiteId)?.location || sites.find((s) => s.id === initialSiteId)?.name || ''
  );
  const [ncSearchQuery, setNcSearchQuery] = useState<string>('');
  const [ncEntryNumber, setNcEntryNumber] = useState<string>('');
  const [ncEntryOntSerial, setNcEntryOntSerial] = useState<string>('');
  const [ncEntryCustomerName, setNcEntryCustomerName] = useState<string>('');
  const [ncEntryCustomerAddress, setNcEntryCustomerAddress] = useState<string>('');
  const [ncEntryCustomerMobile, setNcEntryCustomerMobile] = useState<string>('');
  const [ncEntryExchangeArea, setNcEntryExchangeArea] = useState<string>('');
  const [ncPhoneCountry, setNcPhoneCountry] = useState<string>(
    () =>
      detectActivePhoneCountry({
        tenantCountry: currentTenant?.country,
        currencySymbol: config?.currencySymbol || currentTenant?.currencySymbol,
      }).name
  );

  // Main Project selection for New Connections (Main Project -> Under New Connections)
  const [ncParentMainProjectId, setNcParentMainProjectId] = useState<string>('');

  // Project Entry Mode ('new' on-the-fly or 'existing')
  const [projectEntryMode, setProjectEntryMode] = useState<'new' | 'existing'>('existing');
  const [newProjectScope, setNewProjectScope] = useState<'individual' | 'sub'>('sub');
  const [newParentProjectId, setNewParentProjectId] = useState<string>('');
  const [entrySubProjectName, setEntrySubProjectName] = useState('');
  const [entryCustomerName, setEntryCustomerName] = useState('');
  const [entryCustomerPhone, setEntryCustomerPhone] = useState('');
  const [entrySiteId, setEntrySiteId] = useState('');
  const [entryDistrict, setEntryDistrict] = useState('');
  const [entrySubArea, setEntrySubArea] = useState('');
  const [existingProjectFocClientId, setExistingProjectFocClientId] = useState('');
  const [existingScopeFilter, setExistingScopeFilter] = useState<'all' | 'sub' | 'main' | 'individual'>('all');
  const [existingMainParentFilter, setExistingMainParentFilter] = useState<string>('all');

  // Strict helper to check if a project belongs to the selected Project Section / Type
  const doesProjectMatchSection = React.useCallback(
    (p: (typeof activeProjects)[number], secId: string) => {
      if (!secId) return true;
      if (p.projectTypeId) {
        return p.projectTypeId === secId;
      }
      if (p.parentProjectId) {
        const parentObj = activeProjects.find((mp) => mp.id === p.parentProjectId);
        if (parentObj?.projectTypeId) {
          return parentObj.projectTypeId === secId;
        }
      }
      const secObj = activeProjectTypes.find((pt) => pt.id === secId);
      if (p.projectTypeName && secObj) {
        return p.projectTypeName.trim().toLowerCase() === secObj.name.trim().toLowerCase();
      }
      return false;
    },
    [activeProjects, activeProjectTypes]
  );

  // Helper to classify Main Projects strictly within the selected Project Section / Type
  const mainProjectsList = React.useMemo(
    () =>
      activeProjects.filter(
        (p) =>
          doesProjectMatchSection(p, selectedSectionId) &&
          (p.projectScope === 'main' ||
            activeProjects.some(
              (sub) => sub.parentProjectId === p.id && doesProjectMatchSection(sub, selectedSectionId)
            ))
      ),
    [activeProjects, selectedSectionId, doesProjectMatchSection]
  );

  // Candidate Main Projects strictly registered under the currently selected New Connection Section (Telecom, Water, Electrical, Solar)
  const ncCandidateMainProjects = React.useMemo(() => {
    return activeProjects
      .filter((p) => {
        if (p.parentProjectId || p.projectScope === 'sub') return false;
        // STRICT SECTION ISOLATION: Only include Main Projects registered specifically for THIS selected section
        if (!doesProjectMatchSection(p, selectedSectionId)) return false;
        const isUmbrellaMain =
          p.projectScope === 'main' || activeProjects.some((sub) => sub.parentProjectId === p.id);
        const hasFocStock = getProjectFreeStockList(p.id).length > 0;
        // Exclude standalone subscriber NC lines that are neither a Main Project nor a FOC stock holder
        if (p.ncNumber && !isUmbrellaMain && !hasFocStock) return false;
        return isUmbrellaMain || hasFocStock;
      })
      .sort((a, b) => {
        const aFoc = getProjectFreeStockList(a.id).length > 0 ? 1 : 0;
        const bFoc = getProjectFreeStockList(b.id).length > 0 ? 1 : 0;
        return bFoc - aFoc;
      });
  }, [activeProjects, selectedSectionId, doesProjectMatchSection, getProjectFreeStockList]);

  // Subset of Main Projects registered under THIS New Connection section that ACTUALLY have Client FOC (Free Stock) received
  const ncFocMainProjects = React.useMemo(
    () => ncCandidateMainProjects.filter((p) => getProjectFreeStockList(p.id).length > 0),
    [ncCandidateMainProjects, getProjectFreeStockList]
  );

  // Existing Project selection (strictly filtered by selected Project Section / Type)
  const sectionProjects = React.useMemo(() => {
    return activeProjects.filter((p) => {
      if (!doesProjectMatchSection(p, selectedSectionId)) return false;
      const isMain = p.projectScope === 'main' || activeProjects.some((sub) => sub.parentProjectId === p.id);
      const isSub = p.projectScope === 'sub' || Boolean(p.parentProjectId);
      const isIndiv = !isMain && !isSub;

      if (existingScopeFilter === 'sub' && !isSub) return false;
      if (existingScopeFilter === 'main' && !isMain) return false;
      if (existingScopeFilter === 'individual' && !isIndiv) return false;
      if (existingMainParentFilter !== 'all') {
        if (p.id !== existingMainParentFilter && p.parentProjectId !== existingMainParentFilter) return false;
      }
      return true;
    });
  }, [activeProjects, selectedSectionId, existingScopeFilter, existingMainParentFilter, doesProjectMatchSection]);

  // Filtered NC Lines for Telecom / Water / Electric / Solar New Connection search
  // Strictly scoped to the selected New Connection section & excludes umbrella Main Projects
  const filteredNcLines = React.useMemo(() => {
    const ncList = activeProjects
      .filter((p) => {
        if (!doesProjectMatchSection(p, selectedSectionId)) return false;
        const isUmbrellaMain =
          (p.projectScope === 'main' || activeProjects.some((sub) => sub.parentProjectId === p.id)) &&
          !p.ncNumber;
        if (isUmbrellaMain) return false;
        return true;
      })
      .sort((a, b) => {
        if (ncParentMainProjectId) {
          const aUnderMain = a.parentProjectId === ncParentMainProjectId ? 1 : 0;
          const bUnderMain = b.parentProjectId === ncParentMainProjectId ? 1 : 0;
          if (aUnderMain !== bUnderMain) return bUnderMain - aUnderMain;
        }
        return 0;
      });
    const q = ncSearchQuery.trim().toLowerCase();
    if (!q) return ncList;
    return ncList.filter((p) => {
      const matchNc =
        (p.ncNumber && p.ncNumber.toLowerCase().includes(q)) ||
        p.projectId.toLowerCase().includes(q) ||
        (p.siteIdentifier && p.siteIdentifier.toLowerCase().includes(q));
      const matchName =
        p.projectName.toLowerCase().includes(q) ||
        (p.customerName && p.customerName.toLowerCase().includes(q));
      const matchOnt =
        (p.ontSerialNo && p.ontSerialNo.toLowerCase().includes(q)) ||
        (p.referenceNo && p.referenceNo.toLowerCase().includes(q));
      const matchMobile = p.customerPhone && p.customerPhone.toLowerCase().includes(q);
      const matchAddr = p.customerAddress && p.customerAddress.toLowerCase().includes(q);
      const matchArea =
        (p.exchangeArea && p.exchangeArea.toLowerCase().includes(q)) ||
        (p.subArea && p.subArea.toLowerCase().includes(q));
      const matchParent =
        (p.parentProjectCode && p.parentProjectCode.toLowerCase().includes(q)) ||
        (p.parentProjectName && p.parentProjectName.toLowerCase().includes(q));
      return Boolean(matchNc || matchName || matchOnt || matchMobile || matchAddr || matchArea || matchParent);
    });
  }, [activeProjects, selectedSectionId, ncSearchQuery, ncParentMainProjectId, doesProjectMatchSection]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    sectionProjects[0]?.id || ''
  );
  const [showQuickAddNcMainModal, setShowQuickAddNcMainModal] = useState<boolean>(false);
  const [quickNcMainName, setQuickNcMainName] = useState<string>('');
  const [quickNcMainSiteId, setQuickNcMainSiteId] = useState<string>('ALL_AREAS');

  const targetProject = projects.find((p) => p.id === selectedProjectId) || activeProjects.find((p) => p.id === selectedProjectId);

  const rawCandidateMainId = isNewConnectionSection
    ? ncParentMainProjectId ||
      (targetProject?.parentProjectId ? targetProject.parentProjectId : '') ||
      (targetProject?.projectScope === 'main' ? targetProject.id : '') ||
      ncFocMainProjects[0]?.id ||
      ncCandidateMainProjects[0]?.id ||
      ''
    : '';
  // Ensure the active Main Project strictly belongs to the selected New Connection section
  const effectiveNcMainProjectId =
    rawCandidateMainId && ncCandidateMainProjects.some((mp) => mp.id === rawCandidateMainId)
      ? rawCandidateMainId
      : ncFocMainProjects[0]?.id || ncCandidateMainProjects[0]?.id || '';
  const effectiveNcMainProjectObj = effectiveNcMainProjectId
    ? ncCandidateMainProjects.find((p) => p.id === effectiveNcMainProjectId)
    : undefined;

  // Auto-resolve the Site Area Sub-Project under the active Main Project for the user's selected Site Branch
  const activeSiteObjForNc = sites.find((s) => s.id === selectedSiteId);
  const activeSiteAreaDisplayName = activeSiteObjForNc?.name || 'Selected Area';
  const cleanSiteAreaCodeTag = React.useMemo(
    () =>
      activeSiteAreaDisplayName
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 14) || 'AREA',
    [activeSiteAreaDisplayName]
  );

  const expectedAreaSubProjectCode = effectiveNcMainProjectObj
    ? `${effectiveNcMainProjectObj.projectId}-${cleanSiteAreaCodeTag}`
    : `NC-${cleanSiteAreaCodeTag}`;

  const expectedAreaSubProjectName = effectiveNcMainProjectObj
    ? `${activeSiteAreaDisplayName} — ${effectiveNcMainProjectObj.projectName}`
    : `${activeSiteAreaDisplayName} — ${targetSection?.name || 'New Connections'}`;

  // Look up existing Site Area Sub-Project registered under the active Main Project for selectedSiteId
  const existingAreaSubProject = React.useMemo(() => {
    if (!isNewConnectionSection || !selectedSiteId) return undefined;
    if (effectiveNcMainProjectObj) {
      return activeProjects.find(
        (p) =>
          p.parentProjectId === effectiveNcMainProjectObj.id &&
          (p.siteId === selectedSiteId ||
            (p.siteName &&
              p.siteName.trim().toLowerCase() === activeSiteAreaDisplayName.trim().toLowerCase()) ||
            p.projectId.trim().toUpperCase() === expectedAreaSubProjectCode.trim().toUpperCase())
      );
    }
    return activeProjects.find(
      (p) =>
        doesProjectMatchSection(p, selectedSectionId) &&
        p.siteId === selectedSiteId &&
        p.projectScope !== 'main'
    );
  }, [
    isNewConnectionSection,
    selectedSiteId,
    activeSiteAreaDisplayName,
    effectiveNcMainProjectObj,
    activeProjects,
    expectedAreaSubProjectCode,
    doesProjectMatchSection,
    selectedSectionId,
  ]);

  const currentTargetProjId = isNewConnectionSection
    ? existingAreaSubProject?.id || effectiveNcMainProjectId || selectedProjectId
    : projectEntryMode === 'existing'
    ? selectedProjectId
    : newProjectScope === 'sub' && newParentProjectId
    ? newParentProjectId
    : '';

  // For FOC lookup: look up FOC via the Main Project (or the sub-project's parent Main Project)
  const effectiveFocLookupProjectId = isNewConnectionSection
    ? effectiveNcMainProjectId || existingAreaSubProject?.parentProjectId || currentTargetProjId
    : currentTargetProjId;

  const activeTargetProject = isNewConnectionSection
    ? existingAreaSubProject || effectiveNcMainProjectObj || targetProject
    : projectEntryMode === 'existing'
    ? targetProject
    : newProjectScope === 'sub' && newParentProjectId
    ? projects.find((p) => p.id === newParentProjectId) || activeProjects.find((p) => p.id === newParentProjectId)
    : undefined;
  const projectFreeMaterials = effectiveFocLookupProjectId ? getProjectFreeStockList(effectiveFocLookupProjectId) : [];

  // Resolve which Site Branch a Project (or its Parent Main Project) belongs to
  const resolveProjectBranch = React.useCallback(
    (p?: (typeof activeProjects)[number]): { siteId: string; siteName: string } => {
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
      const voucherWithBranch = (clientFreeIssues || []).find(
        (v) =>
          !v.isDeleted &&
          (v.projectId === p.id ||
            v.parentProjectId === p.id ||
            (p.parentProjectId && v.projectId === p.parentProjectId)) &&
          v.assignedSiteId
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
      const candidateName =
        p.siteName || (p.parentProjectId ? projects.find((mp) => mp.id === p.parentProjectId)?.siteName : '');
      if (candidateName) {
        if (candidateName.trim().toUpperCase() === 'ALL AREAS') {
          return { siteId: 'ALL_AREAS', siteName: 'ALL AREAS' };
        }
        const byName = activeSites.find(
          (s) => !s.isMainWarehouse && s.name.trim().toLowerCase() === candidateName.trim().toLowerCase()
        );
        if (byName) return { siteId: byName.id, siteName: byName.name };
      }
      const candidateDist =
        p.district || (p.parentProjectId ? projects.find((mp) => mp.id === p.parentProjectId)?.district : '');
      if (candidateDist) {
        if (candidateDist.trim().toUpperCase() === 'ALL AREAS') {
          return { siteId: 'ALL_AREAS', siteName: 'ALL AREAS' };
        }
        const dLow = candidateDist.trim().toLowerCase();
        const byDist = activeSites.find(
          (s) =>
            !s.isMainWarehouse &&
            (s.name.trim().toLowerCase().includes(dLow) ||
              dLow.includes(s.name.trim().toLowerCase()) ||
              (s.location && s.location.trim().toLowerCase().includes(dLow)))
        );
        if (byDist) return { siteId: byDist.id, siteName: byDist.name };
      }
      return { siteId: '', siteName: candidateName || '' };
    },
    [sites, activeSites, projects, clientFreeIssues]
  );

  const selectedProjectBranch = React.useMemo(
    () => resolveProjectBranch(activeTargetProject),
    [activeTargetProject, resolveProjectBranch]
  );

  const parentOfActiveTarget = React.useMemo(() => {
    if (activeTargetProject?.parentProjectId) {
      return projects.find((mp) => mp.id === activeTargetProject.parentProjectId);
    }
    return effectiveNcMainProjectObj;
  }, [activeTargetProject, projects, effectiveNcMainProjectObj]);

  const isAllAreasProject =
    selectedProjectBranch.siteId === 'ALL_AREAS' ||
    parentOfActiveTarget?.siteId === 'ALL_AREAS' ||
    (parentOfActiveTarget?.siteName && parentOfActiveTarget.siteName.trim().toUpperCase() === 'ALL AREAS') ||
    effectiveNcMainProjectObj?.siteId === 'ALL_AREAS';

  const userOwnsProjectSite =
    !selectedProjectBranch.siteId ||
    isAllAreasProject ||
    userHasSiteAccess(currentUser, selectedProjectBranch.siteId, activeSites);

  const matchesActiveSiteSelection =
    !selectedProjectBranch.siteId ||
    isAllAreasProject ||
    !selectedSiteId ||
    selectedProjectBranch.siteId === selectedSiteId;

  const isProjectSiteLocked = Boolean(
    activeTargetProject &&
      selectedProjectBranch.siteId &&
      !isAllAreasProject &&
      (!userOwnsProjectSite || !matchesActiveSiteSelection)
  );

  const userSiteLabel = isSiteRestricted
    ? allowedSites.map((s) => s.name).join(', ') || 'Unassigned Site'
    : sites.find((s) => s.id === selectedSiteId)?.name || 'Selected Site';

  // Supervisor / Team Leader
  const currentTeam = teams.find((t) => t.id === selectedTeamId) || activeTeams.find((t) => t.id === selectedTeamId);
  const [supervisorName, setSupervisorName] = useState<string>(currentTeam?.teamLeaderName || '');

  // Date and details
  const [usageDate, setUsageDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [workDetails, setWorkDetails] = useState('');

  // Team in-hand stock calculation — STRICTLY isolated to selectedSiteId (never combined across sites)
  const selectedSiteName = sites.find((s) => s.id === selectedSiteId)?.name || 'Selected Site';
  const teamInHand =
    selectedTeamId && selectedSiteId ? getTeamSiteInHandStock(selectedTeamId, selectedSiteId) : null;
  const fullTeamInHandSummary = selectedTeamId ? getTeamInHandStock(selectedTeamId) : null;
  const previousSitesStockToReturn = (fullTeamInHandSummary?.previousSitesStockToReturn || []).filter(
    (grp) => grp.siteId !== selectedSiteId && grp.totalUnitsHeld > 0
  );
  const eligibleItems = teamInHand?.items.filter((i) => i.currentInHand > 0) || [];

  // Multi-row items table
  const [itemRows, setItemRows] = useState<ItemEntryRow[]>([
    { itemId: activeItems[0]?.id || '', quantity: '', wastageQuantity: '' },
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

  // Auto-load section template items & strictly reset project filters when selectedSectionId changes
  const handleSelectSection = (secId: string) => {
    setSelectedSectionId(secId);
    setExistingMainParentFilter('all');
    const sec = activeProjectTypes.find((pt) => pt.id === secId);
    if (sec && (sec.templateItems || []).length > 0) {
      const templateRows: ItemEntryRow[] = sec.templateItems.map((t) => ({
        itemId: t.itemId,
        quantity: typeof t.suggestedQty === 'number' ? t.suggestedQty : '',
        wastageQuantity: '',
      }));
      setItemRows(templateRows);
      setSuccessToast(`Loaded BOM template for "${sec.name}" (${templateRows.length} items). Please verify quantities.`);
    } else {
      // STRICT ISOLATION: Reset items so previous section's template is never retained
      setItemRows([{ itemId: activeItems[0]?.id || '', quantity: '', wastageQuantity: '' }]);
      if (sec) {
        setSuccessToast(`Section "${sec.name}" selected. Showing projects registered under "${sec.name}".`);
      }
    }

    // Update existing project dropdown & new parent project dropdown to strictly match the selected section
    const matchingProjs = activeProjects.filter((p) => doesProjectMatchSection(p, secId));
    if (matchingProjs.length > 0) {
      setSelectedProjectId(matchingProjs[0].id);
    } else {
      setSelectedProjectId('');
    }

    const matchingMainProjs = matchingProjs.filter(
      (p) => p.projectScope === 'main' || matchingProjs.some((sub) => sub.parentProjectId === p.id)
    );
    setNewParentProjectId(matchingMainProjs[0]?.id || '');
    const bestMainForNc =
      matchingMainProjs.find((mp) => getProjectFreeStockList(mp.id).length > 0) ||
      matchingMainProjs[0];
    if (bestMainForNc) {
      setNcParentMainProjectId(bestMainForNc.id);
      const areaSub = matchingProjs.find(
        (p) => p.parentProjectId === bestMainForNc.id && p.siteId === selectedSiteId
      );
      setSelectedProjectId(areaSub?.id || bestMainForNc.id);
    } else {
      setNcParentMainProjectId('');
    }
  };

  // Keep selectedProjectId, ncParentMainProjectId, and existingMainParentFilter strictly synchronized with the active section
  useEffect(() => {
    if (isNewConnectionSection) {
      if (
        !ncParentMainProjectId ||
        !ncCandidateMainProjects.some((mp) => mp.id === ncParentMainProjectId)
      ) {
        const autoMain = ncFocMainProjects[0] || ncCandidateMainProjects[0];
        if (autoMain && ncParentMainProjectId !== autoMain.id) {
          setNcParentMainProjectId(autoMain.id);
        } else if (!autoMain && ncParentMainProjectId !== '') {
          setNcParentMainProjectId('');
        }
      }
    } else if (
      ncParentMainProjectId !== '' &&
      !ncCandidateMainProjects.some((mp) => mp.id === ncParentMainProjectId)
    ) {
      setNcParentMainProjectId('');
    }
  }, [isNewConnectionSection, ncParentMainProjectId, ncCandidateMainProjects, ncFocMainProjects]);

  useEffect(() => {
    if (
      existingMainParentFilter !== 'all' &&
      !mainProjectsList.some((mp) => mp.id === existingMainParentFilter)
    ) {
      setExistingMainParentFilter('all');
    }
  }, [existingMainParentFilter, mainProjectsList]);

  useEffect(() => {
    if (isNewConnectionSection) {
      const targetId = existingAreaSubProject?.id || effectiveNcMainProjectId || '';
      if (targetId && selectedProjectId !== targetId) {
        setSelectedProjectId(targetId);
      }
      return;
    }
    const validList = sectionProjects;
    if (validList.length === 0) {
      if (selectedProjectId !== '') setSelectedProjectId('');
    } else if (!validList.some((p) => p.id === selectedProjectId)) {
      setSelectedProjectId(validList[0].id);
    }
  }, [
    isNewConnectionSection,
    existingAreaSubProject,
    effectiveNcMainProjectId,
    sectionProjects,
    selectedProjectId,
  ]);

  // Quick-add a New Connection Main Project with ONLY Main Project Name + ALL AREAS / Site Area (No Customer or DP fields!)
  const handleQuickCreateNcMainProject = () => {
    setErrorMsg('');
    const cleanMainName = quickNcMainName.trim();
    if (!cleanMainName) {
      setErrorMsg('Please enter the Main Project Name.');
      return;
    }
    const activeSec = activeProjectTypes.find((pt) => pt.id === selectedSectionId);
    const isAllAreasMain = quickNcMainSiteId === 'ALL_AREAS';
    const assignedBranchObj = isAllAreasMain
      ? undefined
      : activeSites.find((s) => s.id === quickNcMainSiteId);
    const assignedSiteName = isAllAreasMain ? 'ALL AREAS' : assignedBranchObj?.name || activeSiteAreaDisplayName;

    const mainCount = projects.filter((p) => p.projectScope === 'main').length;
    const generatedMainCode = `MAJ-${new Date().getFullYear()}-${String(mainCount + 1).padStart(4, '0')}`;

    const createdMain = addProject({
      projectId: generatedMainCode,
      projectName: cleanMainName,
      projectScope: 'main',
      siteId: isAllAreasMain ? 'ALL_AREAS' : assignedBranchObj?.id || selectedSiteId,
      siteName: assignedSiteName,
      customerName: cleanMainName,
      projectTypeId: selectedSectionId || undefined,
      projectTypeName: activeSec?.name || 'Telecom New Connection',
      referenceNo: `REF-MAJ-${String(mainCount + 1).padStart(4, '0')}`,
      district: isAllAreasMain ? 'ALL AREAS' : assignedBranchObj?.location || assignedSiteName,
      subArea: assignedSiteName,
      status: 'Active',
    });

    // Also auto-create the Sub-Project for the user's current Site Area under this new Main Project
    const selectedSiteObj = sites.find((s) => s.id === selectedSiteId);
    const subAreaDisplay = selectedSiteObj?.name || activeSiteAreaDisplayName;
    const subCode = `${createdMain.projectId}-${cleanSiteAreaCodeTag}`;
    const subName = `${subAreaDisplay} — ${createdMain.projectName}`;

    const createdAreaSub = addProject({
      projectId: subCode,
      projectName: subName,
      projectScope: 'sub',
      parentProjectId: createdMain.id,
      parentProjectCode: createdMain.projectId,
      parentProjectName: createdMain.projectName,
      siteId: selectedSiteObj?.id || selectedSiteId,
      siteName: subAreaDisplay,
      customerName: createdMain.projectName,
      siteIdentifier: subCode,
      exchangeArea: subAreaDisplay,
      projectTypeId: selectedSectionId || undefined,
      projectTypeName: activeSec?.name || 'Telecom New Connection',
      referenceNo: subCode,
      district: selectedSiteObj?.location || subAreaDisplay,
      subArea: subAreaDisplay,
      status: 'Active',
    });

    setNcParentMainProjectId(createdMain.id);
    setSelectedProjectId(createdAreaSub.id);
    setQuickNcMainName('');
    setShowQuickAddNcMainModal(false);
    setSuccessToast(
      `Main Project [${createdMain.projectId}] "${createdMain.projectName}" (${assignedSiteName}) registered & Site Area Sub-Project [${createdAreaSub.projectId}] "${subAreaDisplay}" auto-selected!`
    );
  };

  // Initial load of first section's template on component mount
  useEffect(() => {
    if (activeProjectTypes.length > 0) {
      const firstSec = activeProjectTypes[0];
      if (firstSec && (firstSec.templateItems || []).length > 0) {
        const initialRows: ItemEntryRow[] = firstSec.templateItems.map((t) => ({
          itemId: t.itemId,
          quantity: typeof t.suggestedQty === 'number' ? t.suggestedQty : '',
          wastageQuantity: '',
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
    if (isNewConnectionSection && isNcTeamAreaLocked) return;
    setSelectedSiteId(newSiteId);
    const sObj = sites.find((s) => s.id === newSiteId);
    if (sObj && !isNcTeamAreaLocked) {
      setNcSessionArea(sObj.location || sObj.name || '');
    }
    const siteTeams = activeTeams.filter((t) => t.assignedSiteId === newSiteId);
    const firstTeam = siteTeams[0]?.id || '';
    setSelectedTeamId(firstTeam);
    const tObj = teams.find((t) => t.id === firstTeam);
    if (tObj) setSupervisorName(tObj.teamLeaderName);
  };

  // Handle team change
  const handleTeamChange = (newTeamId: string) => {
    if (isNewConnectionSection && isNcTeamAreaLocked) return;
    setSelectedTeamId(newTeamId);
    const tObj = teams.find((t) => t.id === newTeamId) || activeTeams.find((t) => t.id === newTeamId);
    if (tObj) setSupervisorName(tObj.teamLeaderName);
  };

  // Row operations
  const handleAddItemRow = () => {
    const unselected = activeItems.find((itm) => !itemRows.some((r) => r.itemId === itm.id));
    setItemRows([...itemRows, { itemId: unselected?.id || activeItems[0]?.id || '', quantity: '', wastageQuantity: '' }]);
  };

  const handleBarcodeScannedUsageItem = (item: Item) => {
    setErrorMsg('');
    setItemRows((prev) => {
      const existingIdx = prev.findIndex((r) => r.itemId === item.id);
      if (existingIdx !== -1) {
        const next = [...prev];
        const curQty = Number(next[existingIdx].quantity) || 0;
        next[existingIdx] = { ...next[existingIdx], quantity: curQty + 1 };
        return next;
      }
      if (prev.length === 1 && (!prev[0].itemId || prev[0].quantity === '')) {
        return [{ itemId: item.id, quantity: 1, wastageQuantity: '' }];
      }
      return [...prev, { itemId: item.id, quantity: 1, wastageQuantity: '' }];
    });
    if (item.isProjectReserved && item.reservedProjectId) {
      setProjectEntryMode('existing');
      setSelectedProjectId(item.reservedProjectId);
    }
    setSuccessToast(`Scanned & added to Project Usage: [${item.itemCode}] ${item.itemName}`);
  };

  useUsbBarcodeScanner({
    enabled: activeTab === 'log' && !scannerOpen && config.barcodeEnabled !== false && config.usbScannerEnabled !== false,
    minLength: 3,
    maxInterKeyLatencyMs: config.usbScanMaxLatencyMs || 55,
    ignoreInputs: true,
    onScan: (raw) => {
      const matched = matchItemByScannedCode(activeItems, raw);
      if (matched) {
        if (config.barcodeBeepEnabled !== false) playScanBeep(true);
        handleBarcodeScannedUsageItem(matched);
      } else {
        if (config.barcodeBeepEnabled !== false) playScanBeep(false);
        setErrorMsg(`No catalog item matched scanned barcode "${raw}".`);
      }
    },
  });

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

    const cleanedCustomValues: Record<string, string> = {};
    Object.entries(entryCustomFieldValues).forEach(([k, v]) => {
      if (k.trim() && String(v || '').trim()) {
        cleanedCustomValues[k.trim()] = String(v).trim();
      }
    });
    const finalCustomValues =
      !isNewConnectionSection && Object.keys(cleanedCustomValues).length > 0 ? cleanedCustomValues : undefined;

    if (!isNewConnectionSection && projectEntryMode === 'new') {
      for (const cf of activeSectionCustomFields) {
        if (cf.required && !cleanedCustomValues[cf.label]?.trim()) {
          setErrorMsg(`Please enter a value for required field "${cf.label}" in Step 2.`);
          return;
        }
      }
    }

    if (isNewConnectionSection) {
      if (!selectedSiteId) {
        setErrorMsg('Please select your Site Branch / Area in Step 1.');
        return;
      }
    } else if (projectEntryMode === 'new') {
      if (newProjectScope === 'sub') {
        if (!newParentProjectId) {
          setErrorMsg('Please select the Parent Major / Main Project for this Sub-Project.');
          return;
        }
        if (!entrySubProjectName.trim()) {
          setErrorMsg('Please enter the Sub-Project Name / Work Area.');
          return;
        }
      } else if (!entryCustomerName.trim()) {
        setErrorMsg('Please enter the Project or Customer Name.');
        return;
      }
      if (entryCustomerPhone.trim()) {
        const phoneCheck = analyzeCountryPhone(entryCustomerPhone, {
          tenantCountry: ncPhoneCountry || currentTenant?.country,
          currencySymbol: config?.currencySymbol || currentTenant?.currencySymbol,
        });
        if (!phoneCheck.isValid) {
          setErrorMsg(
            phoneCheck.error ||
              `Customer Phone Number requires ${phoneCheck.expectedTotalDigits} digits for ${phoneCheck.country.name} (${phoneCheck.country.dialCode}).`
          );
          return;
        }
      }
    } else {
      if (!selectedProjectId) {
        setErrorMsg('Please select a project from the list.');
        return;
      }
    }

    if (isProjectSiteLocked) {
      setErrorMsg(
        `Access Locked: Selected project "${activeTargetProject?.projectName || ''}" belongs to "${selectedProjectBranch.siteName}" site and is not under ${currentUser?.fullName || 'current user'}'s site (${userSiteLabel}).`
      );
      return;
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

      const qty = Number(row.quantity) || 0;
      const wastageQty = Number(row.wastageQuantity) || 0;
      if (wastageQty < 0) {
        const itemInfo = items.find((itm) => itm.id === row.itemId);
        setErrorMsg(`Item "${itemInfo?.itemName || row.itemId}": Wastage quantity cannot be negative.`);
        return;
      }
      if (qty <= 0 && wastageQty <= 0) {
        const itemInfo = items.find((itm) => itm.id === row.itemId);
        setErrorMsg(`Item "${itemInfo?.itemName || row.itemId}": Please enter a valid quantity greater than 0.`);
        return;
      }

      const totalRowDeducted = qty + wastageQty;
      const inHandItem = teamInHand?.items.find((e) => e.itemId === row.itemId);
      const maxAllowed = inHandItem?.currentInHand || 0;
      if (totalRowDeducted > maxAllowed) {
        const itemInfo = items.find((itm) => itm.id === row.itemId);
        const lockedInPrevSites = previousSitesStockToReturn
          .map((grp) => {
            const found = grp.items.find((i) => i.itemId === row.itemId && i.currentInHand > 0);
            return found ? `${found.currentInHand} ${itemInfo?.unit || 'units'} under "Stock to Return - ${grp.siteName}"` : null;
          })
          .filter(Boolean);

        setErrorMsg(
          lockedInPrevSites.length > 0
            ? `Cannot use "${itemInfo?.itemName || row.itemId}" at ${selectedSiteName}: ${currentTeam?.teamName || 'Team'} only holds ${maxAllowed} ${itemInfo?.unit || 'units'} issued under ${selectedSiteName} (requested ${totalRowDeducted}). Note: ${lockedInPrevSites.join(', ')} belongs to their previous site and must be returned to that site — only stock issued at ${selectedSiteName} can be used at ${selectedSiteName}.`
            : `Total consumed + wastage for "${itemInfo?.itemName || row.itemId}" (${qty} used + ${wastageQty} wastage = ${totalRowDeducted}) exceeds ${currentTeam?.teamName || 'team'}'s usable in-hand balance at ${selectedSiteName} (${maxAllowed} ${itemInfo?.unit || 'units'}). Issue stock to team under ${selectedSiteName} first.`
        );
        return;
      }

      validRows.push({
        itemId: row.itemId,
        quantity: qty,
        ...(wastageQty > 0 ? { wastageQuantity: wastageQty } : {}),
      });
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
      let finalParentProjectId = targetProject?.parentProjectId;
      let finalNcNumber = targetProject?.ncNumber || targetProject?.siteIdentifier || '';
      let finalOntSerialNo = targetProject?.ontSerialNo || '';
      let finalCustomerAddress = targetProject?.customerAddress || '';
      let finalExchangeArea = targetProject?.exchangeArea || targetProject?.subArea || ncSessionArea.trim();

      if (isNewConnectionSection) {
        const selectedSiteObj = sites.find((s) => s.id === selectedSiteId);
        const siteAreaDisplay = selectedSiteObj?.name || activeSiteAreaDisplayName;
        const ncParentObj = effectiveNcMainProjectObj;

        if (ncParentObj && ncParentObj.projectScope !== 'main') {
          updateProject(ncParentObj.id, { projectScope: 'main' });
        }

        // Resolve or auto-create the Site Area Sub-Project under the Main Project (no customer or DP details needed)
        let resolvedAreaSub = existingAreaSubProject;
        if (!resolvedAreaSub) {
          resolvedAreaSub = addProject({
            projectId: expectedAreaSubProjectCode,
            projectName: expectedAreaSubProjectName,
            projectScope: ncParentObj ? 'sub' : 'individual',
            parentProjectId: ncParentObj?.id,
            parentProjectCode: ncParentObj?.projectId,
            parentProjectName: ncParentObj?.projectName,
            siteId: selectedSiteObj?.id || selectedSiteId,
            siteName: siteAreaDisplay,
            customerName: ncParentObj?.customerName || expectedAreaSubProjectName,
            siteIdentifier: expectedAreaSubProjectCode,
            exchangeArea: siteAreaDisplay,
            projectTypeId: selectedSectionId || undefined,
            projectTypeName: activeSec?.name || 'Telecom New Connection',
            referenceNo: ncParentObj?.referenceNo || expectedAreaSubProjectCode,
            district: selectedSiteObj?.location || siteAreaDisplay,
            subArea: siteAreaDisplay,
            status: 'Active',
          });
        } else if (ncParentObj && resolvedAreaSub.parentProjectId !== ncParentObj.id) {
          updateProject(resolvedAreaSub.id, {
            projectScope: 'sub',
            parentProjectId: ncParentObj.id,
            parentProjectCode: ncParentObj.projectId,
            parentProjectName: ncParentObj.projectName,
          });
        }

        finalProjectId = resolvedAreaSub.id;
        finalProjectName = resolvedAreaSub.projectName;
        finalSiteIdentifier = resolvedAreaSub.projectId;
        finalCustomerPhone = '';
        finalCustomerName = ncParentObj?.customerName || resolvedAreaSub.projectName;
        finalParentProjectId = ncParentObj?.id || resolvedAreaSub.parentProjectId;
        finalNcNumber = resolvedAreaSub.projectId;
        finalOntSerialNo = '';
        finalCustomerAddress = '';
        finalExchangeArea = siteAreaDisplay;
      } else if (projectEntryMode === 'new') {
        const selectedSiteObj = sites.find((s) => s.id === selectedSiteId);
        const parentMainObj =
          newProjectScope === 'sub' && newParentProjectId
            ? projects.find((p) => p.id === newParentProjectId)
            : undefined;

        const existingSubsUnderParent = parentMainObj
          ? projects.filter((p) => p.parentProjectId === parentMainObj.id).length
          : 0;

        const generatedProjId = entrySiteId.trim()
          ? entrySiteId.trim().toUpperCase()
          : parentMainObj
          ? `${parentMainObj.projectId}-SUB-${String(existingSubsUnderParent + 1).padStart(4, '0')}`
          : `PRJ-${new Date().getFullYear()}-${String(projects.length + 1).padStart(4, '0')}`;

        const resolvedProjectName =
          newProjectScope === 'sub' ? entrySubProjectName.trim() : entryCustomerName.trim();
        const resolvedCustomerName =
          entryCustomerName.trim() || parentMainObj?.customerName || resolvedProjectName;

        const registeredProject = addProject({
          projectId: generatedProjId,
          projectName: resolvedProjectName,
          projectScope: newProjectScope === 'sub' ? 'sub' : 'individual',
          parentProjectId: parentMainObj?.id,
          parentProjectCode: parentMainObj?.projectId,
          parentProjectName: parentMainObj?.projectName,
          siteId: selectedSiteObj?.id || parentMainObj?.siteId,
          siteName: selectedSiteObj?.name || parentMainObj?.siteName,
          customerName: resolvedCustomerName,
          customerPhone: entryCustomerPhone.trim() || parentMainObj?.customerPhone || undefined,
          siteIdentifier: entrySiteId.trim().toUpperCase() || undefined,
          projectTypeId: selectedSectionId || parentMainObj?.projectTypeId || undefined,
          projectTypeName: activeSec?.name || parentMainObj?.projectTypeName,
          referenceNo: parentMainObj?.referenceNo || `REF-${String(projects.length + 1).padStart(4, '0')}`,
          district:
            entryDistrict.trim() ||
            parentMainObj?.district ||
            (selectedSiteObj?.location || selectedSiteObj?.name || 'General'),
          subArea: entrySubArea.trim() || 'Field Site',
          customFieldValues: finalCustomValues,
          status: 'Active',
        });

        finalProjectId = registeredProject.id;
        finalProjectName = registeredProject.projectName;
        finalSiteIdentifier = registeredProject.siteIdentifier || '';
        finalCustomerPhone = registeredProject.customerPhone || '';
        finalCustomerName = registeredProject.customerName || '';
        finalParentProjectId = registeredProject.parentProjectId;
      } else {
        if (existingProjectFocClientId && !isNewConnectionSection) {
          finalCustomerName = existingProjectFocClientId;
        }
      }

      // Check project reservation restrictions (allow Sub-Projects to use stock reserved for their Parent Main Project)
      const reservedConflicts: { item: typeof items[0]; reservedFor: string }[] = [];
      for (const row of validRows) {
        const itm = items.find((i) => i.id === row.itemId);
        if (itm && itm.isProjectReserved && itm.reservedProjectId) {
          const isSameOrParentMatch =
            itm.reservedProjectId === finalProjectId ||
            (finalParentProjectId && itm.reservedProjectId === finalParentProjectId);
          if (isSameOrParentMatch) {
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
            `Warning: The following item(s) are reserved for other projects: ${conflictNames}. Super Admin authorization required! Please check "Authorize Admin Cross-Project Stock Override".`
          );
          return;
        }
      }

      const finalParentObj = finalParentProjectId
        ? projects.find((p) => p.id === finalParentProjectId) ||
          activeProjects.find((p) => p.id === finalParentProjectId)
        : undefined;

      // Log material consumption under the team's custody
      const newUsage = logProjectMaterialUsage({
        projectId: finalProjectId,
        projectName: finalProjectName,
        parentProjectId: finalParentProjectId,
        parentProjectName: finalParentObj?.projectName || targetProject?.parentProjectName,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        siteIdentifier: finalSiteIdentifier,
        ncNumber: finalNcNumber || undefined,
        ontSerialNo: finalOntSerialNo || undefined,
        customerAddress: finalCustomerAddress || undefined,
        exchangeArea: finalExchangeArea || undefined,
        projectTypeId: selectedSectionId,
        projectTypeName: activeSec?.name,
        customFieldValues: finalCustomValues || targetProject?.customFieldValues || undefined,
        siteId: selectedSiteId,
        teamId: selectedTeamId,
        teamName: targetTeam?.teamName || 'Field Team',
        supervisorOrLeader: supervisorName.trim(),
        supervisorOrLeaderName: supervisorName.trim(),
        date: usageDate,
        workDetails:
          workDetails.trim() ||
          (isNewConnectionSection
            ? `[${finalSiteIdentifier}] ${finalProjectName} — ${activeSiteAreaDisplayName} Area Usage`
            : `Installed materials on project ${finalProjectName}`),
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
          `Admin Cross-Project Stock Override Authorized by ${actorDisplayName} (@${currentUser?.username}): Issued project-reserved item(s) to project "${finalProjectName}". Override details: [${conflictDetails}]`
        );
      }

      setAdminCrossProjectOverride(false);

      // Lock Step 1 (Team & Area) when in Connection mode so the user can continuously enter the next connections without re-selecting Team/Area!
      if (isNewConnectionSection) {
        setIsNcTeamAreaLocked(true);
      }

      setSuccessToast(
        isNewConnectionSection
          ? `Voucher ${newUsage.usageVoucherNumber} logged under Main Project [${finalParentObj?.projectId || 'MAIN'}] → Site Area Sub-Project [${finalSiteIdentifier}] (${activeSiteAreaDisplayName})!`
          : projectEntryMode === 'new'
          ? `Material usage voucher ${newUsage.usageVoucherNumber} logged! Project "${finalProjectName}" has been added to the Project Master List.`
          : `Material usage voucher ${newUsage.usageVoucherNumber} logged for project "${finalProjectName}". Stock deducted from ${targetTeam?.teamName}.`
      );

      setSelectedUsageForPrint(newUsage);

      // Reset form fields for next line (keeping Team & Area untouched!)
      setWorkDetails('');
      setEntrySubProjectName('');
      setEntryCustomerName('');
      setEntryCustomerPhone('');
      setEntrySiteId('');
      setNcEntryNumber('');
      setEntryCustomFieldValues({});
      setNcEntryOntSerial('');
      setNcEntryCustomerName('');
      setNcEntryCustomerAddress('');
      setNcEntryCustomerMobile('');
      setNcEntryExchangeArea('');
      if (isNewConnectionSection) {
        setProjectEntryMode('existing');
      }

      // Reload section template for next entry
      if (activeSec && (activeSec.templateItems || []).length > 0) {
        setItemRows(
          activeSec.templateItems.map((t) => ({
            itemId: t.itemId,
            quantity: typeof t.suggestedQty === 'number' ? t.suggestedQty : '',
            wastageQuantity: '',
          }))
        );
      } else {
        setItemRows([{ itemId: activeItems[0]?.id || '', quantity: '', wastageQuantity: '' }]);
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
    setEditItemRows(
      usage.items.map((i) => ({
        itemId: i.itemId,
        quantity: i.quantity,
        wastageQuantity: i.wastageQuantity ?? '',
      }))
    );
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
      const q = Number(r.quantity) || 0;
      const wq = Number(r.wastageQuantity) || 0;
      if (wq < 0) {
        setEditError(`Row #${i + 1}: Wastage quantity cannot be negative.`);
        return;
      }
      if (q <= 0 && wq <= 0) {
        setEditError(`Row #${i + 1}: Please enter a valid quantity greater than 0.`);
        return;
      }
      validRows.push({
        itemId: r.itemId,
        quantity: q,
        ...(wq > 0 ? { wastageQuantity: wq } : {}),
      });
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

  // Filtered usages history (supports filtering by a Main Project to show all its Sub-Projects too!)
  const filteredUsages = projectUsages.filter((pu) => {
    if (pu.isDeleted) return false;
    if (projectFilter !== 'all') {
      const childSubIds = new Set(
        projects.filter((p) => p.parentProjectId === projectFilter).map((p) => p.id)
      );
      const matchesProjectOrChild =
        pu.projectId === projectFilter ||
        pu.parentProjectId === projectFilter ||
        childSubIds.has(pu.projectId);
      if (!matchesProjectOrChild) return false;
    }
    if (teamFilter !== 'all' && pu.teamId !== teamFilter) return false;
    if (sectionFilter !== 'all' && pu.projectTypeId !== sectionFilter) return false;
    if (isSiteRestricted && !userHasSiteAccess(currentUser, pu.siteId, activeSites)) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchVoucher = pu.usageVoucherNumber.toLowerCase().includes(q);
      const matchProj = (pu.projectName || '').toLowerCase().includes(q);
      const matchParent = (pu.parentProjectName || '').toLowerCase().includes(q);
      const matchTeam = (pu.teamName || '').toLowerCase().includes(q);
      const matchLead = (pu.supervisorOrLeader || pu.supervisorOrLeaderName || '').toLowerCase().includes(q);
      const matchDetails = (pu.workDetails || '').toLowerCase().includes(q);
      return matchVoucher || matchProj || matchParent || matchTeam || matchLead || matchDetails;
    }
    return true;
  });

  // Reconcile project calculations (supports Major / Main Project family aggregation + Sub-Project breakdown)
  const reconcileProject = projects.find((p) => p.id === reconcileProjectId) || activeProjects[0];
  const reconcileChildSubProjects = React.useMemo(
    () =>
      reconcileProject
        ? activeProjects.filter((p) => p.parentProjectId === reconcileProject.id)
        : [],
    [reconcileProject, activeProjects]
  );
  const isReconcileMainProject =
    reconcileProject?.projectScope === 'main' || reconcileChildSubProjects.length > 0;
  const reconcileParentMainProject = reconcileProject?.parentProjectId
    ? projects.find((p) => p.id === reconcileProject.parentProjectId)
    : undefined;

  const reconcileUsages = React.useMemo(() => {
    if (!reconcileProject) return [];
    const childSubIdSet = new Set(reconcileChildSubProjects.map((s) => s.id));
    return projectUsages.filter(
      (pu) =>
        !pu.isDeleted &&
        (pu.projectId === reconcileProject.id ||
          pu.parentProjectId === reconcileProject.id ||
          childSubIdSet.has(pu.projectId))
    );
  }, [reconcileProject, reconcileChildSubProjects, projectUsages]);

  const reconcileSubProjectCards = React.useMemo(() => {
    if (!reconcileProject || reconcileChildSubProjects.length === 0) return [];
    return reconcileChildSubProjects.map((sub) => {
      const subVouchers = projectUsages.filter((pu) => !pu.isDeleted && pu.projectId === sub.id);
      const itemsMap = new Map<string, { installed: number; wastage: number; total: number }>();
      const teamsSet = new Set<string>();
      subVouchers.forEach((v) => {
        if (v.teamName) teamsSet.add(v.teamName);
        v.items.forEach((r) => {
          const cur = itemsMap.get(r.itemId) || { installed: 0, wastage: 0, total: 0 };
          const inst = Number(r.quantity || 0);
          const wast = Number(r.wastageQuantity || 0);
          cur.installed += inst;
          cur.wastage += wast;
          cur.total += inst + wast;
          itemsMap.set(r.itemId, cur);
        });
      });
      return {
        subProject: sub,
        vouchersCount: subVouchers.length,
        teamsCount: teamsSet.size,
        teamNames: Array.from(teamsSet),
        items: Array.from(itemsMap.entries()),
      };
    });
  }, [reconcileProject, reconcileChildSubProjects, projectUsages]);

  const reconcileTeamBreakdown = React.useMemo(() => {
    const map = new Map<
      string,
      {
        teamName: string;
        vouchersCount: number;
        itemsMap: Map<string, { installed: number; wastage: number; total: number }>;
      }
    >();
    const totalProjectItemsMap = new Map<string, { installed: number; wastage: number; total: number }>();

    reconcileUsages.forEach((pu) => {
      const tId = pu.teamId || 'unknown';
      const existing = map.get(tId) || {
        teamName: pu.teamName || 'Unknown Team',
        vouchersCount: 0,
        itemsMap: new Map<string, { installed: number; wastage: number; total: number }>(),
      };
      existing.vouchersCount++;

      pu.items.forEach((row) => {
        const inst = Number(row.quantity || 0);
        const wast = Number(row.wastageQuantity || 0);
        const cur = existing.itemsMap.get(row.itemId) || { installed: 0, wastage: 0, total: 0 };
        cur.installed += inst;
        cur.wastage += wast;
        cur.total += inst + wast;
        existing.itemsMap.set(row.itemId, cur);

        const grand = totalProjectItemsMap.get(row.itemId) || { installed: 0, wastage: 0, total: 0 };
        grand.installed += inst;
        grand.wastage += wast;
        grand.total += inst + wast;
        totalProjectItemsMap.set(row.itemId, grand);
      });
      map.set(tId, existing);
    });

    return {
      teams: Array.from(map.values()),
      totalItems: Array.from(totalProjectItemsMap.entries()),
    };
  }, [reconcileUsages]);

  // Full Report for This Site (Project) calculation (used in Usage Vouchers History tab modal)
  const fullSiteReportData = React.useMemo(() => {
    const targetProjId = fullSiteReportProjectId || (projectFilter !== 'all' ? projectFilter : '');
    if (!targetProjId) return null;
    const targetProj = projects.find((p) => p.id === targetProjId);
    if (!targetProj) return null;

    const childSubs = projects.filter((p) => !p.isDeleted && p.parentProjectId === targetProj.id);
    const childSubIds = new Set(childSubs.map((s) => s.id));
    const isMainUmbrella = targetProj.projectScope === 'main' || childSubs.length > 0;
    const branchInfo = resolveProjectBranch(targetProj);

    const matchingUsages = projectUsages
      .filter((pu) => {
        if (pu.isDeleted) return false;
        return (
          pu.projectId === targetProj.id ||
          pu.parentProjectId === targetProj.id ||
          childSubIds.has(pu.projectId)
        );
      })
      .sort((a, b) => {
        const da = a.usageDate || a.date || '';
        const db = b.usageDate || b.date || '';
        return db.localeCompare(da);
      });

    interface TeamItemAgg {
      itemId: string;
      itemCode: string;
      itemName: string;
      category: string;
      unit: string;
      unitCost: number;
      installedQty: number;
      wastageQty: number;
      totalConsumedQty: number;
      totalCost: number;
    }

    interface TeamVoucherLine {
      voucherId: string;
      voucherNumber: string;
      date: string;
      subProjectName: string;
      supervisor: string;
      workDetails: string;
      itemId: string;
      itemCode: string;
      itemName: string;
      unit: string;
      unitCost: number;
      installedQty: number;
      wastageQty: number;
      totalConsumedQty: number;
      lineCost: number;
    }

    interface TeamReportGroup {
      teamId: string;
      teamName: string;
      leaderName: string;
      siteName: string;
      vouchersCount: number;
      voucherLines: TeamVoucherLine[];
      materialsSummary: TeamItemAgg[];
      teamTotalInstalled: number;
      teamTotalWastage: number;
      teamTotalConsumed: number;
      teamTotalCost: number;
    }

    const teamsMap = new Map<
      string,
      {
        teamId: string;
        teamName: string;
        leaderName: string;
        siteName: string;
        voucherIds: Set<string>;
        voucherLines: TeamVoucherLine[];
        materialsMap: Map<string, TeamItemAgg>;
        teamTotalInstalled: number;
        teamTotalWastage: number;
        teamTotalConsumed: number;
        teamTotalCost: number;
      }
    >();

    const allMaterialsMap = new Map<
      string,
      TeamItemAgg & { teamsInvolved: Set<string> }
    >();

    let grandTotalInstalled = 0;
    let grandTotalWastage = 0;
    let grandTotalConsumed = 0;
    let grandTotalCost = 0;

    matchingUsages.forEach((pu) => {
      const tId = pu.teamId || pu.teamName || 'unknown-team';
      const tMaster = teams.find((t) => t.id === pu.teamId);
      const tSite = sites.find((s) => s.id === (tMaster?.assignedSiteId || pu.siteId));
      const tName = pu.teamName || tMaster?.teamName || 'Field Team';
      const lName =
        pu.supervisorOrLeaderName ||
        pu.supervisorOrLeader ||
        tMaster?.teamLeaderName ||
        '—';

      let teamEntry = teamsMap.get(tId);
      if (!teamEntry) {
        teamEntry = {
          teamId: tId,
          teamName: tName,
          leaderName: lName,
          siteName: tSite?.name || branchInfo.siteName || '—',
          voucherIds: new Set<string>(),
          voucherLines: [],
          materialsMap: new Map<string, TeamItemAgg>(),
          teamTotalInstalled: 0,
          teamTotalWastage: 0,
          teamTotalConsumed: 0,
          teamTotalCost: 0,
        };
        teamsMap.set(tId, teamEntry);
      }
      teamEntry.voucherIds.add(pu.id);

      pu.items.forEach((row) => {
        const itm = items.find((i) => i.id === row.itemId);
        const unitCost = Number(itm?.unitPrice || 0);
        const installedQty = Number(row.quantity || 0);
        const wastageQty = Number(row.wastageQuantity || 0);
        const totalConsumedQty = installedQty + wastageQty;
        const lineCost = totalConsumedQty * unitCost;

        teamEntry!.voucherLines.push({
          voucherId: pu.id,
          voucherNumber: pu.usageVoucherNumber,
          date: pu.usageDate || (pu.date ? pu.date.split('T')[0] : '—'),
          subProjectName: pu.projectName || targetProj.projectName,
          supervisor: lName,
          workDetails: pu.workDetails || '—',
          itemId: row.itemId,
          itemCode: itm?.itemCode || 'ITEM',
          itemName: itm?.itemName || 'Material Item',
          unit: itm?.unit || 'Nos',
          unitCost,
          installedQty,
          wastageQty,
          totalConsumedQty,
          lineCost,
        });

        const curMat = teamEntry!.materialsMap.get(row.itemId) || {
          itemId: row.itemId,
          itemCode: itm?.itemCode || 'ITEM',
          itemName: itm?.itemName || 'Material Item',
          category: itm?.category || 'General',
          unit: itm?.unit || 'Nos',
          unitCost,
          installedQty: 0,
          wastageQty: 0,
          totalConsumedQty: 0,
          totalCost: 0,
        };
        curMat.installedQty += installedQty;
        curMat.wastageQty += wastageQty;
        curMat.totalConsumedQty += totalConsumedQty;
        curMat.totalCost += lineCost;
        teamEntry!.materialsMap.set(row.itemId, curMat);

        teamEntry!.teamTotalInstalled += installedQty;
        teamEntry!.teamTotalWastage += wastageQty;
        teamEntry!.teamTotalConsumed += totalConsumedQty;
        teamEntry!.teamTotalCost += lineCost;

        const grandMat = allMaterialsMap.get(row.itemId) || {
          itemId: row.itemId,
          itemCode: itm?.itemCode || 'ITEM',
          itemName: itm?.itemName || 'Material Item',
          category: itm?.category || 'General',
          unit: itm?.unit || 'Nos',
          unitCost,
          installedQty: 0,
          wastageQty: 0,
          totalConsumedQty: 0,
          totalCost: 0,
          teamsInvolved: new Set<string>(),
        };
        grandMat.installedQty += installedQty;
        grandMat.wastageQty += wastageQty;
        grandMat.totalConsumedQty += totalConsumedQty;
        grandMat.totalCost += lineCost;
        grandMat.teamsInvolved.add(tName);
        allMaterialsMap.set(row.itemId, grandMat);

        grandTotalInstalled += installedQty;
        grandTotalWastage += wastageQty;
        grandTotalConsumed += totalConsumedQty;
        grandTotalCost += lineCost;
      });
    });

    const teamsBreakdown: TeamReportGroup[] = Array.from(teamsMap.values()).map((t) => ({
      teamId: t.teamId,
      teamName: t.teamName,
      leaderName: t.leaderName,
      siteName: t.siteName,
      vouchersCount: t.voucherIds.size,
      voucherLines: t.voucherLines,
      materialsSummary: Array.from(t.materialsMap.values()),
      teamTotalInstalled: t.teamTotalInstalled,
      teamTotalWastage: t.teamTotalWastage,
      teamTotalConsumed: t.teamTotalConsumed,
      teamTotalCost: t.teamTotalCost,
    }));

    const consolidatedMaterials = Array.from(allMaterialsMap.values()).map((m) => ({
      ...m,
      teamsList: Array.from(m.teamsInvolved),
    }));

    return {
      project: targetProj,
      branchName: branchInfo.siteName || targetProj.district || 'General Site',
      isMainUmbrella,
      childSubsCount: childSubs.length,
      vouchersCount: matchingUsages.length,
      teamsBreakdown,
      consolidatedMaterials,
      grandTotalInstalled,
      grandTotalWastage,
      grandTotalConsumed,
      grandTotalCost,
    };
  }, [
    fullSiteReportProjectId,
    projectFilter,
    projects,
    projectUsages,
    teams,
    sites,
    items,
    resolveProjectBranch,
  ]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold tracking-wider uppercase">
              <FolderKanban className="w-3.5 h-3.5 text-emerald-400" />
              <span>Field Consumption &amp; Reconciliation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Project Material Usage & Multi-Team Tracking
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Log items consumed on projects, load section templates, and reconcile multi-team material consumption
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-medium text-slate-200 bg-slate-950/60 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 shrink-0">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Active Projects: <strong className="text-white">{activeProjects.length}</strong></span>
            <span className="text-slate-600">|</span>
            <span>Logged Usages: <strong className="text-emerald-300">{projectUsages.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Global Operational Workflow Guide Card */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border border-teal-500/30 rounded-2xl p-5 text-white shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-teal-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold">
              <Compass className="w-4 h-4" />
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
          <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-sm">
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
                  <Layers className="w-3.5 h-3.5 text-teal-300" />
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

            {/* Project Section / Type Selector Bar */}
            <div className="mb-4 p-4 bg-gradient-to-br from-[#233e54] via-[#27465f] to-[#2b4d68] border border-[#3c6687] rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-2.5 border-b border-[#3d6889] pb-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-sky-300" />
                  <span>{isNewConnectionSection ? 'Select Project Section / Type *' : '1. Select Project Section / Type *'}</span>
                </label>
                {targetSection && (
                  <span className="text-[11px] font-bold text-slate-800 bg-white/95 border border-white/80 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <CheckCircle2 className="w-3 h-3 text-teal-600" />
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
                          ? 'bg-[#0e2233] text-white border-sky-400 shadow-md ring-2 ring-sky-300/60'
                          : 'bg-white/95 hover:bg-white text-slate-900 border-white/80 shadow-xs'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isSelected ? 'text-sky-300' : 'text-slate-500'}`}>{pt.code || 'SEC'}</div>
                        <div className="text-xs font-bold leading-snug whitespace-normal break-words">{pt.name}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 mt-0.5 ${
                          isSelected ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40' : 'bg-slate-100 text-slate-700'
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
              {isNewConnectionSection ? (
                /* ============================================================================
                 * STREAMLINED TELECOM NEW CONNECTION (NC) 3-STEP WORKFLOW (1 -> 2 -> 3)
                 * ============================================================================ */
                <>
                  {/* STEP 1 (NC): TEAM & AREA SELECTION (TOP-MOST, LOCKS UNTIL PAGE REFRESH) */}
                  <div className="p-4 bg-gradient-to-br from-[#233e54] via-[#27465f] to-[#2b4d68] border border-[#3c6687] rounded-xl shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3d6889] pb-2.5">
                      <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Users2 className="w-4 h-4 text-sky-300" />
                          <span>1. Team & Area Selection (Field Team & Exchange Area)</span>
                        </span>
                        <span className="text-[11px] text-sky-100/85 block mt-0.5">
                          {isNcTeamAreaLocked
                            ? 'Team & Area are locked for this session so you can continuously enter NC lines without re-selecting. Refresh page to change.'
                            : 'Select the executing Field Team and Area once — after locking or submitting, it stays fixed until you refresh the page.'}
                        </span>
                      </div>

                      {isNcTeamAreaLocked ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/50 text-[11px] font-extrabold uppercase tracking-wider shrink-0 self-start sm:self-auto">
                          <Lock className="w-3.5 h-3.5 text-amber-300" />
                          <span>Locked Until Page Refresh</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (!selectedTeamId || !supervisorName.trim()) {
                              setErrorMsg('Please select the Field Team and Supervisor before locking.');
                              return;
                            }
                            setErrorMsg('');
                            setIsNcTeamAreaLocked(true);
                            setSuccessToast(
                              `Team "${currentTeam?.teamName || 'Team'}" & Area "${ncSessionArea || 'Selected Area'}" locked for continuous NC Line entry!`
                            );
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-extrabold transition cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm & Lock Team / Area</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* Site Branch */}
                      <div>
                        <label className="block text-xs font-bold text-slate-100 mb-1">
                          Site Branch *
                        </label>
                        <select
                          value={selectedSiteId}
                          onChange={(e) => handleSiteChange(e.target.value)}
                          disabled={isSingleSiteLocked || isNcTeamAreaLocked}
                          className="w-full text-xs font-semibold px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-slate-200/90 disabled:text-slate-700 disabled:cursor-not-allowed"
                        >
                          {allowedSites.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.location})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Exchange Area / Work Area */}
                      <div>
                        <label className="block text-xs font-bold text-slate-100 mb-1">
                          Exchange Area / Work Area *
                        </label>
                        <input
                          type="text"
                          value={ncSessionArea}
                          disabled={isNcTeamAreaLocked}
                          onChange={(e) => setNcSessionArea(e.target.value)}
                          placeholder="e.g. Kalutara (KLL), Maharagama"
                          className="w-full text-xs font-semibold px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-slate-200/90 disabled:text-slate-700 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Executing Field Team */}
                      <div>
                        <label className="block text-xs font-bold text-slate-100 mb-1">
                          Executing Field Team * (Stock Deducted)
                        </label>
                        <select
                          value={selectedTeamId}
                          onChange={(e) => handleTeamChange(e.target.value)}
                          disabled={isNcTeamAreaLocked}
                          className="w-full text-xs font-semibold px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-slate-200/90 disabled:text-slate-700 disabled:cursor-not-allowed"
                          required
                        >
                          {availableTeams.length === 0 ? (
                            <option value="">No Teams Assigned to this Site</option>
                          ) : (
                            availableTeams.map((t) => {
                              const selSiteName =
                                activeSites.find((s) => s.id === selectedSiteId)?.name || 'Site';
                              const isPendingFromPrev = t.assignedSiteId !== selectedSiteId;
                              return (
                                <option key={t.id} value={t.id}>
                                  {t.teamName}
                                  {isPendingFromPrev
                                    ? ` [Clearing Pending Stock on ${selSiteName}]`
                                    : t.assignmentStatus === 'Temporary'
                                    ? ` [${getTemporaryAssignmentBadgeLabel(selSiteName)}]`
                                    : ''}{' '}
                                  (Lead: {t.teamLeaderName})
                                </option>
                              );
                            })
                          )}
                        </select>
                      </div>

                      {/* Supervisor / Team Leader */}
                      <div>
                        <label className="block text-xs font-bold text-slate-100 mb-1">
                          Supervisor or Team Leader *
                        </label>
                        <input
                          type="text"
                          value={supervisorName}
                          disabled={isNcTeamAreaLocked}
                          onChange={(e) => setSupervisorName(e.target.value)}
                          placeholder="e.g. Team Leader Name"
                          list="supervisor-presets-nc"
                          className="w-full text-xs font-semibold px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-slate-200/90 disabled:text-slate-700 disabled:cursor-not-allowed"
                          required
                        />
                        <datalist id="supervisor-presets-nc">
                          {currentTeam && <option value={currentTeam.teamLeaderName} />}
                          {activeUsers.map((u) => (
                            <option key={u.id} value={u.fullName}>
                              {u.fullName} ({u.role})
                            </option>
                          ))}
                        </datalist>
                      </div>

                      {/* Usage Date */}
                      <div>
                        <label className="block text-xs font-bold text-slate-100 mb-1">
                          Usage Date *
                        </label>
                        <input
                          type="date"
                          value={usageDate}
                          disabled={isNcTeamAreaLocked}
                          onChange={(e) => setUsageDate(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-slate-200/90 disabled:text-slate-700 disabled:cursor-not-allowed"
                          required
                        />
                      </div>

                      {/* Optional Installation Note */}
                      <div>
                        <label className="block text-xs font-bold text-slate-100 mb-1">
                          Work Remarks (Optional)
                        </label>
                        <input
                          type="text"
                          value={workDetails}
                          onChange={(e) => setWorkDetails(e.target.value)}
                          placeholder="e.g. FTTH New Connection Drop & ONT"
                          className="w-full text-xs font-medium px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* STEP 2 (NC / WATER / ELECTRIC / SOLAR): MAIN PROJECT & AUTO-SELECTED SITE AREA SUB-PROJECT FLOW */}
                  <div className="p-4 bg-gradient-to-br from-[#233e54] via-[#27465f] to-[#2b4d68] border border-[#3c6687] rounded-xl shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3d6889] pb-2.5">
                      <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <FolderPlus className="w-4 h-4 text-sky-300" />
                          <span>
                            2. Main Project &amp; Auto-Selected Site Area Sub-Project ({targetSection?.name || 'New Connections'})
                          </span>
                        </span>
                        <span className="text-[11px] text-sky-100/85 block mt-0.5">
                          Select the Main Project — your active Site Area (<strong>{activeSiteAreaDisplayName}</strong>) is automatically selected as the Sub-Project to build the usage &amp; FOC reconciliation flow. No customer or DP details required.
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowQuickAddNcMainModal((prev) => !prev);
                          if (!quickNcMainSiteId) setQuickNcMainSiteId('ALL_AREAS');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-xs cursor-pointer transition shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{showQuickAddNcMainModal ? 'Close Quick Add' : '+ Add Main Project'}</span>
                      </button>
                    </div>

                    {/* Quick Add Main Project (Only Main Project Name + ALL AREAS or Relevant Area — No Customer/DP Details) */}
                    {(showQuickAddNcMainModal || ncCandidateMainProjects.length === 0) && (
                      <div className="p-3.5 bg-slate-900/95 border-2 border-sky-400/80 rounded-xl space-y-3 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="text-xs font-extrabold text-sky-300 uppercase tracking-wider block">
                              🏢 Quick Add Main Project ({targetSection?.name || 'New Connections'})
                            </span>
                            <span className="text-[11px] text-slate-300 block">
                              Enter only the Main Project Name and choose <strong>🌐 ALL AREAS</strong> (or a specific Site Area). Your current Site Area (<strong>{activeSiteAreaDisplayName}</strong>) will auto-link as a Sub-Project.
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                          <div className="sm:col-span-6">
                            <label className="block text-[11px] font-bold text-slate-200 mb-1">
                              Main Project Name *
                            </label>
                            <input
                              type="text"
                              value={quickNcMainName}
                              onChange={(e) => setQuickNcMainName(e.target.value)}
                              placeholder={`e.g. ${targetSection?.code || 'FTTH'} NEW CONNECTION PROJECT - ALL AREA`}
                              className="w-full px-3 py-2 text-xs font-bold border border-white/80 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </div>

                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-bold text-slate-200 mb-1">
                              Assigned Area *
                            </label>
                            <select
                              value={quickNcMainSiteId}
                              onChange={(e) => setQuickNcMainSiteId(e.target.value)}
                              className="w-full px-3 py-2 text-xs font-extrabold border border-emerald-400 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            >
                              <option value="ALL_AREAS">
                                🌐 ALL AREAS (All Site Branches Can Use)
                              </option>
                              {activeSites
                                .filter((s) => !s.isMainWarehouse)
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    🏢 {s.name} {s.location ? `(${s.location})` : ''}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <button
                              type="button"
                              onClick={handleQuickCreateNcMainProject}
                              className="w-full px-3 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Add Main</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 1. MAIN PROJECT SELECTOR */}
                    <div className="p-3.5 bg-gradient-to-r from-indigo-950/90 via-purple-950/90 to-indigo-950/90 border-2 border-purple-400/70 rounded-xl space-y-3 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-purple-500/30 border border-purple-300/50 flex items-center justify-center text-purple-200 shrink-0">
                            <Building2 className="w-4 h-4" />
                          </span>
                          <div>
                            <span className="text-xs font-extrabold text-white uppercase tracking-wider block">
                              1. Select Main Project ({targetSection?.name || 'New Connections'})
                            </span>
                            <span className="text-[11px] text-purple-200/90 block">
                              Choose the Umbrella Main Project. Each Site Area automatically becomes a Sub-Project under this Main Project.
                            </span>
                          </div>
                        </div>
                        {projectFreeMaterials.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const focRows: ItemEntryRow[] = projectFreeMaterials
                                .filter((fm) => fm.remainingBalance > 0)
                                .map((fm) => ({
                                  itemId: fm.itemId,
                                  quantity: '',
                                  wastageQuantity: '',
                                }));
                              if (focRows.length > 0) {
                                setItemRows(focRows);
                                setSuccessToast(
                                  `Loaded ${focRows.length} Client FOC material item(s) from Main Project [${effectiveNcMainProjectObj?.projectId || 'Pool'}] into Step 3.`
                                );
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-purple-400 hover:bg-purple-300 text-slate-950 font-extrabold text-[11px] flex items-center gap-1.5 shrink-0 cursor-pointer transition shadow-xs"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            <span>Load FOC Materials ({projectFreeMaterials.filter((f) => f.remainingBalance > 0).length})</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <select
                          value={effectiveNcMainProjectId}
                          onChange={(e) => {
                            const chosenMainId = e.target.value;
                            setNcParentMainProjectId(chosenMainId);
                          }}
                          className="w-full px-3 py-2.5 border border-purple-300 rounded-lg text-xs font-extrabold text-slate-900 bg-white focus:ring-2 focus:ring-purple-400 focus:outline-none"
                        >
                          {ncCandidateMainProjects.length === 0 ? (
                            <option value="">
                              -- No Main Project Registered Yet for {targetSection?.name || 'This Section'} (Use Quick Add Above) --
                            </option>
                          ) : (
                            <>
                              {ncCandidateMainProjects.map((mp) => {
                                const focItems = getProjectFreeStockList(mp.id);
                                const areaSubsCount = activeProjects.filter((c) => c.parentProjectId === mp.id).length;
                                const areaBadge =
                                  mp.siteId === 'ALL_AREAS' || mp.siteName === 'ALL AREAS'
                                    ? '🌐 ALL AREAS'
                                    : `🏢 ${mp.siteName || 'Assigned Area'}`;
                                return (
                                  <option key={mp.id} value={mp.id}>
                                    🏢 [{mp.projectId}] {mp.projectName} ({areaBadge})
                                    {focItems.length > 0
                                      ? ` — 🎁 ${focItems.length} FOC Material(s) Available`
                                      : ' — Normal Company Stock'}
                                    {areaSubsCount > 0 ? ` · (${areaSubsCount} Site Area Sub-Project(s))` : ''}
                                  </option>
                                );
                              })}
                              <option value="">-- Normal Company Stock Without Main Project --</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* 2. AUTO-SELECTED SUB-PROJECT (SITE AREA FLOW) */}
                      <div className="p-3 bg-emerald-950/90 border-2 border-emerald-400/80 rounded-xl space-y-2 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                              ↳ 2. Auto-Selected Sub-Project (Site Area)
                            </span>
                            <span className="text-emerald-200 font-bold text-[11px]">
                              Automatically linked from your Step 1 Site Branch (<strong>{activeSiteAreaDisplayName}</strong>)
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 font-extrabold text-[10px]">
                            {existingAreaSubProject
                              ? '✓ Site Area Sub-Project Active'
                              : '⚡ Auto-Creates & Links on Usage Post'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white/95 p-2.5 rounded-lg border border-emerald-200 text-slate-900">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                              Main Project (Umbrella)
                            </span>
                            <span className="font-extrabold text-indigo-950 text-xs block truncate">
                              {effectiveNcMainProjectObj
                                ? `[${effectiveNcMainProjectObj.projectId}] ${effectiveNcMainProjectObj.projectName}`
                                : 'Direct Area Usage (No Main Project)'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-emerald-700 block">
                              ↳ Sub-Project (Your Site Area)
                            </span>
                            <span className="font-mono font-black text-emerald-900 text-xs block truncate">
                              [{existingAreaSubProject?.projectId || expectedAreaSubProjectCode}]{' '}
                              {existingAreaSubProject?.projectName || expectedAreaSubProjectName}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                              Site Area &amp; Reconciliation Flow
                            </span>
                            <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>
                                🏢 {activeSiteAreaDisplayName} → Main Project Full Balance Report
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Show all Site Area Sub-Projects linked under this Main Project */}
                        {effectiveNcMainProjectObj && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] font-bold text-emerald-200/90 uppercase">
                              Site Area Sub-Projects Under [{effectiveNcMainProjectObj.projectId}]:
                            </span>
                            {activeProjects
                              .filter((sp) => sp.parentProjectId === effectiveNcMainProjectObj.id)
                              .map((sp) => {
                                const isCurrentArea = sp.id === existingAreaSubProject?.id || sp.siteId === selectedSiteId;
                                return (
                                  <span
                                    key={sp.id}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                                      isCurrentArea
                                        ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-2xs'
                                        : 'bg-slate-800/90 text-slate-200 border-slate-600'
                                    }`}
                                  >
                                    ↳ [{sp.projectId}] {sp.siteName || sp.projectName}
                                    {isCurrentArea ? ' (Active Area)' : ''}
                                  </span>
                                );
                              })}
                            {!existingAreaSubProject && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-400 text-slate-950 border border-emerald-300">
                                ↳ [{expectedAreaSubProjectCode}] {activeSiteAreaDisplayName} (Auto-Selected Area)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 3. Shared Main Project Client FOC Stock Pool Summary */}
                      {projectFreeMaterials.length > 0 && (
                        <div className="p-3 bg-white/95 border border-purple-200 rounded-xl text-xs space-y-2 shadow-2xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-purple-950 font-bold border-b border-purple-100 pb-1.5">
                            <span className="flex items-center gap-1.5 text-xs">
                              <Gift className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                              <span>
                                Main Project Client FOC Pool:{' '}
                                <strong className="font-black">
                                  [{effectiveNcMainProjectObj?.projectId || targetProject?.projectId}]{' '}
                                  {effectiveNcMainProjectObj?.projectName || targetProject?.projectName}
                                </strong>
                              </span>
                            </span>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-700 text-white self-start sm:self-auto">
                              Auto-Deducts for {activeSiteAreaDisplayName} Sub-Project
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {projectFreeMaterials.map((fm) => (
                              <div
                                key={fm.itemId}
                                className="flex flex-col justify-between bg-purple-50/60 px-2.5 py-2 rounded-lg border border-purple-200/80 font-mono text-[11px] gap-1"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-slate-900 font-bold truncate">
                                    [{fm.itemCode}] {fm.itemName}
                                  </span>
                                  <span className="shrink-0 font-extrabold text-purple-800 bg-white px-2 py-0.5 rounded border border-purple-300">
                                    {formatNumber(fm.remainingBalance)} {fm.unit} Left
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-600">
                                  <span>FOC Received: {formatNumber(fm.totalReceived)} {fm.unit}</span>
                                  <span>Total Main Project Used: {formatNumber(fm.totalUsed)} {fm.unit}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* ============================================================================
                 * STANDARD SECTIONS WORKFLOW (STEPS 2 & 3 FOR OTHER SECTIONS)
                 * ============================================================================ */
                <>
                  {/* Step 2 Card: Project, Sub-Project & Customer Details */}
                  <div className="p-4 bg-gradient-to-br from-[#233e54] via-[#27465f] to-[#2b4d68] border border-[#3c6687] rounded-xl shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3d6889] pb-2.5">
                      <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <FolderPlus className="w-4 h-4 text-sky-300" />
                          <span>2. Project / Sub-Project & Customer Identification</span>
                        </span>
                        <span className="text-[11px] text-sky-100/85 block mt-0.5">
                          Select a Sub-Project under a Major Project (auto-deducts from Main Project Free Stock) or an Individual Project.
                        </span>
                      </div>

                      {/* Mode Switcher */}
                      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-[11px] font-semibold self-start sm:self-auto shadow-2xs">
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
                        <button
                          type="button"
                          onClick={() => {
                            setProjectEntryMode('new');
                            if (!newParentProjectId && mainProjectsList.length > 0) {
                              setNewParentProjectId(mainProjectsList[0].id);
                            }
                          }}
                          className={`px-3 py-1 rounded-md transition cursor-pointer ${
                            projectEntryMode === 'new'
                              ? 'bg-teal-700 text-white shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          + Register New Sub-Project / Site
                        </button>
                      </div>
                    </div>

                    {projectEntryMode === 'new' ? (
                      <div className="space-y-3 pt-1">
                        {/* Choose whether registering a Sub-Project under a Main Project or a Standalone Individual Project */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setNewProjectScope('sub');
                              if (!newParentProjectId && mainProjectsList.length > 0) {
                                setNewParentProjectId(mainProjectsList[0].id);
                              }
                            }}
                            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                              newProjectScope === 'sub'
                                ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-200'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="text-xs font-extrabold text-amber-950 flex items-center justify-between">
                              <span>↳ New Sub-Project (Under Main Project)</span>
                              {newProjectScope === 'sub' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-600 text-white">Active</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              Create a Sub-Project under an existing Major Project and draw from its shared Free Stock pool.
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setNewProjectScope('individual')}
                            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                              newProjectScope === 'individual'
                                ? 'bg-teal-50/90 border-teal-500 ring-2 ring-teal-200'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="text-xs font-extrabold text-teal-950 flex items-center justify-between">
                              <span>📄 New Individual Project (Standalone)</span>
                              {newProjectScope === 'individual' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-700 text-white">Active</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              Register a standalone single project or direct customer job with its own ledger.
                            </p>
                          </button>
                        </div>

                        {newProjectScope === 'sub' && (
                          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-amber-950 mb-1">
                                  Select Parent Major / Main Project *
                                </label>
                                <select
                                  value={newParentProjectId}
                                  onChange={(e) => {
                                    setNewParentProjectId(e.target.value);
                                    const parentObj = projects.find((p) => p.id === e.target.value);
                                    if (parentObj?.customerName) setEntryCustomerName(parentObj.customerName);
                                    if (parentObj?.district) setEntryDistrict(parentObj.district);
                                  }}
                                  className="w-full text-xs font-bold px-3 py-2 border border-amber-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                  required={newProjectScope === 'sub'}
                                >
                                  <option value="">
                                    {mainProjectsList.length > 0
                                      ? `-- Choose Major / Main Project (${targetSection?.code || 'Section'}) --`
                                      : `-- No Major / Main Projects in ${targetSection?.name || 'this Section'} --`}
                                  </option>
                                  {mainProjectsList.map((mp) => (
                                    <option key={mp.id} value={mp.id}>
                                      🏢 [{mp.projectId}] {mp.projectName} {mp.customerName ? `(${mp.customerName})` : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-amber-950 mb-1">
                                  New Sub-Project Name / Site Section *
                                </label>
                                <input
                                  type="text"
                                  value={entrySubProjectName}
                                  onChange={(e) => setEntrySubProjectName(e.target.value)}
                                  placeholder="e.g. Homagama Phase 2, Tower B Sector 3"
                                  className="w-full text-xs font-bold px-3 py-2 border border-amber-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                  required={newProjectScope === 'sub'}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-100 mb-1">
                              FOC Client / Principal Name {newProjectScope === 'individual' ? '*' : '(Inherited if blank)'}
                            </label>
                            <select
                              value={entryCustomerName}
                              onChange={(e) => setEntryCustomerName(e.target.value)}
                              className="w-full text-xs font-semibold px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                              required={newProjectScope === 'individual'}
                            >
                              <option value="">-- Select Registered Client / Principal --</option>
                              {activeClients.map((clt) => (
                                <option key={clt.id} value={clt.name}>
                                  {clt.name} ({clt.clientCode} — {clt.category || 'Client'})
                                </option>
                              ))}
                            </select>
                          </div>

                          {(() => {
                            const stdPhoneAnalysis = analyzeCountryPhone(entryCustomerPhone, {
                              tenantCountry: ncPhoneCountry || currentTenant?.country,
                              currencySymbol: config?.currencySymbol || currentTenant?.currencySymbol,
                            });
                            return (
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <label className="block text-xs font-bold text-slate-100">
                                    Customer Phone Number
                                  </label>
                                  <PhoneCountryBadge
                                    value={entryCustomerPhone}
                                    countryOverride={ncPhoneCountry}
                                    currencyOverride={config?.currencySymbol}
                                    dark
                                  />
                                </div>
                                <div className="flex items-stretch gap-1.5">
                                  <select
                                    value={stdPhoneAnalysis.country.name}
                                    onChange={(e) => {
                                      const chosenCountry = e.target.value;
                                      setNcPhoneCountry(chosenCountry);
                                      setEntryCustomerPhone((prev) =>
                                        enforceCountryPhoneInput(prev, {
                                          tenantCountry: chosenCountry,
                                          currencySymbol: config?.currencySymbol,
                                        })
                                      );
                                    }}
                                    title="Select Country for Phone Digit Counting"
                                    className="px-2 py-2 text-xs font-bold border border-white/80 rounded-lg bg-slate-100 text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 shrink-0 cursor-pointer"
                                  >
                                    {COUNTRY_PHONE_RULES.map((rule) => (
                                      <option key={rule.code} value={rule.name}>
                                        {rule.flag} {rule.dialCode} ({rule.code})
                                      </option>
                                    ))}
                                  </select>
                                  <div className="relative flex-1">
                                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                    <input
                                      type="tel"
                                      value={entryCustomerPhone}
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        const dialedRule = matchCountryByDialPrefix(raw);
                                        const activeCountryName = dialedRule ? dialedRule.name : ncPhoneCountry;
                                        if (dialedRule && dialedRule.name !== ncPhoneCountry) {
                                          setNcPhoneCountry(dialedRule.name);
                                        }
                                        setEntryCustomerPhone(
                                          enforceCountryPhoneInput(raw, {
                                            tenantCountry: activeCountryName || currentTenant?.country,
                                            currencySymbol: config?.currencySymbol || currentTenant?.currencySymbol,
                                          })
                                        );
                                      }}
                                      placeholder={stdPhoneAnalysis.country.localPlaceholder}
                                      className="w-full pl-8 pr-3 py-2 text-xs font-mono border border-white/80 rounded-lg bg-white text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-100 mb-1">
                              Site ID / Sub-Project Code
                            </label>
                            <div className="relative">
                              <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={entrySiteId}
                                onChange={(e) => setEntrySiteId(e.target.value)}
                                placeholder="e.g. SUB-01, SITE-0891"
                                className="w-full pl-8 pr-3 py-2 text-xs font-mono uppercase border border-white/80 rounded-lg bg-white text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-100 mb-1">
                              District
                            </label>
                            <input
                              type="text"
                              value={entryDistrict}
                              onChange={(e) => setEntryDistrict(e.target.value)}
                              placeholder="e.g. Colombo, Kandy"
                              className="w-full text-xs font-medium px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-100 mb-1">
                              Sub Area / Location
                            </label>
                            <input
                              type="text"
                              value={entrySubArea}
                              onChange={(e) => setEntrySubArea(e.target.value)}
                              placeholder="e.g. Maharagama, Sector 4"
                              className="w-full text-xs font-medium px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
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
                      <div className="pt-1 space-y-2.5">
                        {/* Quick Scope Filter + Main Project Family Filter */}
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-200/90">
                          <div className="flex flex-wrap items-center gap-1">
                            {(
                              [
                                { id: 'all', label: 'All Projects' },
                                { id: 'sub', label: '↳ Sub-Projects (Under Main)' },
                                { id: 'main', label: '🏢 Major / Main Projects' },
                                { id: 'individual', label: '📄 Individual Projects' },
                              ] as const
                            ).map((tab) => (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                  setExistingScopeFilter(tab.id);
                                  const nextList = activeProjects.filter((p) => {
                                    if (!doesProjectMatchSection(p, selectedSectionId)) return false;
                                    const isMain = p.projectScope === 'main' || activeProjects.some((sub) => sub.parentProjectId === p.id);
                                    const isSub = p.projectScope === 'sub' || Boolean(p.parentProjectId);
                                    const isIndiv = !isMain && !isSub;
                                    if (tab.id === 'sub') return isSub;
                                    if (tab.id === 'main') return isMain;
                                    if (tab.id === 'individual') return isIndiv;
                                    return true;
                                  });
                                  setSelectedProjectId(nextList[0]?.id || '');
                                }}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                                  existingScopeFilter === tab.id
                                    ? 'bg-teal-700 text-white shadow-2xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          <select
                            value={existingMainParentFilter}
                            onChange={(e) => {
                              const val = e.target.value;
                              setExistingMainParentFilter(val);
                              if (val !== 'all') {
                                const firstSub = activeProjects.find(
                                  (p) => p.parentProjectId === val && doesProjectMatchSection(p, selectedSectionId)
                                );
                                setSelectedProjectId(firstSub ? firstSub.id : val);
                              } else {
                                const firstInSec = activeProjects.find((p) => doesProjectMatchSection(p, selectedSectionId));
                                setSelectedProjectId(firstInSec ? firstInSec.id : '');
                              }
                            }}
                            className="text-[11px] font-bold px-2.5 py-1 border border-purple-200 rounded-md bg-purple-50 text-purple-900 focus:outline-none"
                          >
                            <option value="all">
                              {mainProjectsList.length > 0
                                ? `🏢 Filter by Main Project (${targetSection?.code || 'Section'}): All (${mainProjectsList.length})`
                                : `🏢 Filter by Main Project (${targetSection?.code || 'Section'}): None Registered`}
                            </option>
                            {mainProjectsList.map((mp) => (
                              <option key={mp.id} value={mp.id}>
                                🏢 [{mp.projectId}] {mp.projectName}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-100 mb-1">
                            Choose Sub-Project / Project for Material Usage *
                          </label>
                          <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="w-full text-xs font-semibold px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                            required
                          >
                            {sectionProjects.length === 0 ? (
                              <option value="">No matching projects (Change filter or click &quot;+ Register New Sub-Project&quot;)</option>
                            ) : (
                              sectionProjects.map((p) => {
                                const isMain = p.projectScope === 'main' || activeProjects.some((sub) => sub.parentProjectId === p.id);
                                const isSub = p.projectScope === 'sub' || Boolean(p.parentProjectId);
                                const prefix = isSub
                                  ? `↳ [SUB of ${p.parentProjectCode || p.parentProjectName || 'Main'}]`
                                  : isMain
                                  ? '🏢 [MAIN PROJECT]'
                                  : '📄 [INDIVIDUAL]';
                                const pBranch = resolveProjectBranch(p);
                                return (
                                  <option key={p.id} value={p.id}>
                                    {prefix} [{p.projectId}] {p.projectName}{pBranch.siteName ? ` — [Site: ${pBranch.siteName}]` : ''} {p.subArea ? `· ${p.subArea}` : ''}
                                  </option>
                                );
                              })
                            )}
                          </select>
                        </div>

                        {/* If a Major / Main Project is selected, show its Sub-Projects for 1-click selection */}
                        {targetProject &&
                          (targetProject.projectScope === 'main' ||
                            activeProjects.some((sub) => sub.parentProjectId === targetProject.id)) && (
                            <div className="p-3 bg-purple-50/90 border border-purple-200 rounded-xl space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                                  <span>🏢 Major / Main Project Selected:</span>
                                  <span className="font-mono bg-purple-100 px-1.5 py-0.5 rounded border border-purple-300">
                                    {targetProject.projectName}
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProjectEntryMode('new');
                                    setNewProjectScope('sub');
                                    setNewParentProjectId(targetProject.id);
                                    if (targetProject.customerName) setEntryCustomerName(targetProject.customerName);
                                    if (targetProject.district) setEntryDistrict(targetProject.district);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs"
                                >
                                  + Create New Sub-Project Under This Main Project
                                </button>
                              </div>
                              {(() => {
                                const childSubs = activeProjects.filter((s) => s.parentProjectId === targetProject.id);
                                if (childSubs.length === 0) {
                                  return (
                                    <p className="text-[11px] text-purple-800">
                                      No Sub-Projects registered under this Main Project yet. Click the button above to add a Sub-Project or log directly onto the Main Project.
                                    </p>
                                  );
                                }
                                return (
                                  <div>
                                    <div className="text-[11px] text-purple-800 font-semibold mb-1.5">
                                      Click a Sub-Project below to log field usage under that specific Sub-Project (automatically deducts from this Main Project&apos;s Free Stock):
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {childSubs.map((sub) => (
                                        <button
                                          key={sub.id}
                                          type="button"
                                          onClick={() => setSelectedProjectId(sub.id)}
                                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-amber-950 border border-amber-300 text-[11px] font-bold transition cursor-pointer shadow-2xs"
                                        >
                                          ↳ [{sub.projectId}] {sub.projectName}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                        {/* If a Sub-Project is selected, show its Parent Main Project banner */}
                        {targetProject && targetProject.parentProjectId && (
                          <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-extrabold text-[10px] uppercase">
                                ↳ Sub-Project
                              </span>
                              <span>
                                Linked under Main Project:{' '}
                                <strong className="text-purple-900">
                                  [{targetProject.parentProjectCode || 'MAIN'}] {targetProject.parentProjectName}
                                </strong>
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              ✓ Deducts from Main Project Free Stock Pool
                            </span>
                          </div>
                        )}

                        {projectFreeMaterials.length > 0 && (
                          <div className="mt-2">
                            <label className="block text-xs font-bold text-slate-100 mb-1">
                              Associated FOC Client / Principal (Optional)
                            </label>
                            <select
                              value={existingProjectFocClientId}
                              onChange={(e) => setExistingProjectFocClientId(e.target.value)}
                              className="w-full text-xs font-semibold px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                            >
                              <option value="">-- Select Registered Client / Principal --</option>
                              {activeClients.map((clt) => (
                                <option key={clt.id} value={clt.name}>
                                  {clt.name} ({clt.clientCode} — {clt.category || 'Client'})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {targetProject && (
                          <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 flex flex-wrap items-center gap-3 shadow-2xs">
                            <span><strong>Project Code:</strong> {targetProject.projectId}</span>
                            {targetProject.parentProjectName && (
                              <span><strong>Parent Main Project:</strong> {targetProject.parentProjectName}</span>
                            )}
                            <span><strong>Phone:</strong> {targetProject.customerPhone || 'N/A'}</span>
                            <span><strong>District:</strong> {targetProject.district || 'General'}</span>
                            <span><strong>Sub-Area:</strong> {targetProject.subArea || '—'}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Shared Main Project / Individual Project Free Stock Pool Banner */}
                    {projectFreeMaterials.length > 0 && (
                      <div className="mt-2.5 p-3.5 bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-2 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-indigo-950 font-bold border-b border-indigo-100/80 pb-2">
                          <span className="flex items-center gap-1.5 text-xs">
                            <Gift className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>
                              {targetProject?.parentProjectId || (projectEntryMode === 'new' && newProjectScope === 'sub')
                                ? `Shared Main Project Free Stock Pool (${targetProject?.parentProjectName || projects.find((p) => p.id === newParentProjectId)?.projectName || 'Main Project'})`
                                : 'Client / Principal FOC Free Stock Allocated'}
                            </span>
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-600 text-white shadow-2xs self-start sm:self-auto">
                            Auto-Deducted from Main Pool
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Material usage logged on this {targetProject?.parentProjectId ? 'Sub-Project' : 'project'} automatically deducts from the Client Free Stock balance below while tracking this Sub-Project&apos;s individual consumption separately:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                          {projectFreeMaterials.map((fm) => (
                            <div key={fm.itemId} className="flex flex-col justify-between bg-white px-3 py-2 rounded-lg border border-indigo-100 font-mono text-[11px] shadow-2xs gap-1">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-900 font-bold truncate pr-2">[{fm.itemCode}] {fm.itemName}</span>
                                <span className="shrink-0 font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                  {formatNumber(fm.remainingBalance)} {fm.unit} Left in Pool
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-500">
                                <span>Pool Received: {formatNumber(fm.totalReceived)} {fm.unit}</span>
                                {targetProject?.parentProjectId && (
                                  <span className="text-amber-700 font-bold">
                                    This Sub-Project Used: {formatNumber(fm.directUsed || 0)} {fm.unit}
                                  </span>
                                )}
                                <span>Total Pool Used: {formatNumber(fm.totalUsed)} {fm.unit}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 3 Card: Site Branch, Field Team & Execution Details */}
                  <div className="p-4 bg-gradient-to-br from-[#233e54] via-[#27465f] to-[#2b4d68] border border-[#3c6687] rounded-xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-[#3d6889] pb-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-sky-300" />
                        <span>3. Site Branch & Field Team Execution</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Site Branch */}
                      <div>
                        <label className="block text-xs font-bold text-slate-100 mb-1">
                          Site Branch *
                        </label>
                        <select
                          value={selectedSiteId}
                          onChange={(e) => handleSiteChange(e.target.value)}
                          disabled={isSingleSiteLocked}
                          className="w-full text-xs font-semibold px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 disabled:opacity-75"
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
                        <label className="block text-xs font-bold text-slate-100 mb-1">
                          Executing Field Team * (Stock Deducted)
                        </label>
                        <select
                          value={selectedTeamId}
                          onChange={(e) => handleTeamChange(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                          required
                        >
                          {availableTeams.length === 0 ? (
                            <option value="">No Teams Assigned to this Site</option>
                          ) : (
                            availableTeams.map((t) => {
                              const selSiteName =
                                activeSites.find((s) => s.id === selectedSiteId)?.name || 'Site';
                              const isPendingFromPrev = t.assignedSiteId !== selectedSiteId;
                              return (
                                <option key={t.id} value={t.id}>
                                  {t.teamName}
                                  {isPendingFromPrev
                                    ? ` [Clearing Pending Stock on ${selSiteName}]`
                                    : t.assignmentStatus === 'Temporary'
                                    ? ` [${getTemporaryAssignmentBadgeLabel(selSiteName)}]`
                                    : ''}{' '}
                                  (Lead: {t.teamLeaderName})
                                </option>
                              );
                            })
                          )}
                        </select>
                      </div>

                      {/* Supervisor / Team Leader */}
                      <div>
                        <label className="block text-xs font-bold text-slate-100 mb-1">
                          Supervisor or Team Leader *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={supervisorName}
                            onChange={(e) => setSupervisorName(e.target.value)}
                            placeholder="e.g. John Doe / Team Leader"
                            list="supervisor-presets"
                            className="w-full text-xs font-semibold px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
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
                        <label className="block text-xs font-bold text-slate-100 mb-1">
                          Usage Date *
                        </label>
                        <input
                          type="date"
                          value={usageDate}
                          onChange={(e) => setUsageDate(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                          required
                        />
                      </div>
                    </div>

                    {/* Work Details / Scope */}
                    <div>
                      <label className="block text-xs font-bold text-slate-100 mb-1">
                        Work Details / Scope of Installation
                      </label>
                      <input
                        type="text"
                        value={workDetails}
                        onChange={(e) => setWorkDetails(e.target.value)}
                        placeholder="e.g. Fibre Drop Installation, Rosette termination & testing"
                        className="w-full text-xs font-medium px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 3 (in NC mode) / Step 4 (in Standard mode): Materials Consumed Table */}
              <div
                className={`p-4 rounded-xl shadow-sm border transition-colors ${
                  isProjectSiteLocked
                    ? 'bg-rose-50/90 border-rose-400 ring-2 ring-rose-200/80'
                    : 'bg-gradient-to-br from-[#1d4840] via-[#215249] to-[#265d53] border-[#367c6f]'
                }`}
              >
                <div
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5 mb-3 ${
                    isProjectSiteLocked ? 'border-rose-200' : 'border-[#388274]'
                  }`}
                >
                  <div>
                    <span
                      className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        isProjectSiteLocked ? 'text-rose-950' : 'text-white'
                      }`}
                    >
                      {isProjectSiteLocked ? (
                        <Lock className="w-4 h-4 text-rose-600" />
                      ) : (
                        <Boxes className="w-4 h-4 text-emerald-300" />
                      )}
                      <span>
                        {isNewConnectionSection
                          ? `3. Material Usage for Selected NC Line (Deducted from ${currentTeam?.teamName || 'Team'} Custody)`
                          : `4. Materials Consumed (Deducted from ${currentTeam?.teamName || 'Team'} Custody)`}
                      </span>
                      {isProjectSiteLocked && (
                        <span className="ml-1 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                          LOCKED
                        </span>
                      )}
                    </span>
                    <span
                      className={`text-[11px] block mt-0.5 ${
                        isProjectSiteLocked ? 'text-slate-700' : 'text-emerald-100/90'
                      }`}
                    >
                      {isProjectSiteLocked
                        ? `Material usage entry is disabled because the selected project belongs to another site branch.`
                        : isNewConnectionSection
                        ? `Enter the materials used on this NC Line and submit. Step 1 (Team & Area) will remain locked so you can immediately enter the next NC Line.`
                        : `Standard section template items pre-loaded below. Enter actual quantities used or add extra items.`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    {config.barcodeEnabled !== false && (
                      <button
                        type="button"
                        disabled={isProjectSiteLocked}
                        onClick={() => setScannerOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold bg-emerald-400 text-emerald-950 rounded-lg hover:bg-emerald-300 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
                      >
                        <ScanLine className="w-3.5 h-3.5" />
                        <span>Scan Barcode (USB / Mobile)</span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isProjectSiteLocked}
                      onClick={handleAddItemRow}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-extrabold bg-white text-emerald-950 border border-emerald-200 rounded-lg hover:bg-emerald-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Extra Item</span>
                    </button>
                  </div>
                </div>

                {/* Prominent Site Mismatch Lock Banner */}
                {isProjectSiteLocked && (
                  <div className="mb-3.5 p-4 bg-white border-2 border-rose-500 rounded-xl shadow-md space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center shrink-0 text-rose-600">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="text-sm font-black text-rose-900 leading-snug">
                          Selected project is not under &ldquo;{currentUser?.fullName || 'Current User'}&rdquo;&apos;s site ({userSiteLabel})!
                        </div>
                        <p className="text-xs font-semibold text-rose-800 leading-relaxed">
                          The selected project{' '}
                          <span className="font-mono font-black bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-rose-950">
                            [{activeTargetProject?.projectId}] {activeTargetProject?.projectName}
                          </span>{' '}
                          is registered under{' '}
                          <strong className="underline">{selectedProjectBranch.siteName || 'Another Site'}</strong>{' '}
                          Site Branch — not under{' '}
                          <strong>{currentUser?.fullName}&apos;s site ({userSiteLabel})</strong>. Material usage entry is locked.
                        </p>
                        <p className="text-[11px] font-bold text-slate-600">
                          තෝරාගත් ව්‍යාපෘතිය අයත් වන්නේ &ldquo;{selectedProjectBranch.siteName}&rdquo; ශාඛාවට බැවින්, {currentUser?.fullName} ({userSiteLabel}) යටතේ මෙම ව්‍යාපෘතියට Material Usage ඇතුළත් කළ නොහැක.
                        </p>
                        {userOwnsProjectSite &&
                          allowedSites.some((s) => s.id === selectedProjectBranch.siteId) && (
                            <div className="pt-1.5">
                              <button
                                type="button"
                                onClick={() => handleSiteChange(selectedProjectBranch.siteId)}
                                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-xs cursor-pointer transition"
                              >
                                Switch Step 3 Site Branch to &ldquo;{selectedProjectBranch.siteName}&rdquo;
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className={
                    isProjectSiteLocked
                      ? 'opacity-40 pointer-events-none select-none space-y-2'
                      : 'space-y-2'
                  }
                >
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
                      const usedQtyNum = Number(row.quantity) || 0;
                      const wastageQtyNum = Number(row.wastageQuantity) || 0;
                      const totalRowDeducted = usedQtyNum + wastageQtyNum;
                      const isOverLimit = totalRowDeducted > inHandBalance && (row.quantity !== '' || (row.wastageQuantity !== '' && row.wastageQuantity !== undefined));

                      return (
                        <div
                          key={idx}
                          className={`bg-white border rounded-xl p-3 flex flex-col lg:flex-row items-center gap-3 transition-colors shadow-xs ${
                            isOverLimit ? 'border-rose-400 bg-rose-50' : 'border-white/90 hover:border-emerald-300'
                          }`}
                        >
                          {/* Item select */}
                          <div className="flex-1 w-full">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Material Item #{idx + 1} *
                            </label>
                            <div className="flex items-center gap-2">
                              {itemObj?.imageUrl ? (
                                <img
                                  src={itemObj.imageUrl}
                                  alt={itemObj.itemName}
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                  <Boxes className="w-4 h-4" />
                                </div>
                              )}
                              <select
                                value={row.itemId}
                                disabled={isProjectSiteLocked}
                                onChange={(e) => handleRowChange(idx, 'itemId', e.target.value)}
                                className="w-full text-xs font-semibold px-2.5 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100"
                                required
                              >
                                <option value="">-- Select Material Item --</option>
                                {activeItems.map((itm) => {
                                  const custody = teamInHand?.items.find((x) => x.itemId === itm.id);
                                  const balance = custody?.currentInHand || 0;
                                  const prevSiteLocks = previousSitesStockToReturn
                                    .map((grp) => {
                                      const found = grp.items.find((x) => x.itemId === itm.id && x.currentInHand > 0);
                                      return found ? `Stock to Return - ${grp.siteName}: ${found.currentInHand} ${itm.unit}` : null;
                                    })
                                    .filter(Boolean);
                                  const prevLockLabel =
                                    prevSiteLocks.length > 0 ? ` [⚠️ ${prevSiteLocks.join(' | ')} — Cannot Use Here]` : '';
                                  const focBal = effectiveFocLookupProjectId
                                    ? getClientFreeStockBalance(effectiveFocLookupProjectId, itm.id)
                                    : { remainingBalance: 0, totalReceived: 0 };
                                  const focTag =
                                    focBal.totalReceived > 0 && focBal.remainingBalance > 0
                                      ? ` [🎁 Client FOC: ${formatNumber(focBal.remainingBalance)} ${itm.unit} Left]`
                                      : '';
                                  let resTag = '';
                                  if (itm.isProjectReserved && itm.reservedProjectId) {
                                    if (
                                      itm.reservedProjectId === currentTargetProjId ||
                                      itm.reservedProjectId === effectiveFocLookupProjectId
                                    ) {
                                      resTag = ` [🎯 Reserved for THIS Project]`;
                                    } else {
                                      resTag = ` [🔒 Reserved for: ${itm.reservedProjectName || 'Project'}]`;
                                    }
                                  }
                                  return (
                                    <option key={itm.id} value={itm.id}>
                                      [{itm.itemCode}] {itm.itemName}{resTag}{focTag} ({balance > 0 ? `${selectedSiteName}: ${balance} ${itm.unit}` : `0 at ${selectedSiteName}`})
                                      {prevLockLabel}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          </div>

                          {/* Available In-Hand Display */}
                          <div className="w-full sm:w-28 text-center sm:text-left">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Team In-Hand
                            </label>
                            <div
                              className={`text-xs font-bold px-2.5 py-2 rounded-lg border text-center font-mono ${
                                inHandBalance > 0
                                  ? 'text-teal-800 bg-teal-50 border-teal-200'
                                  : 'text-slate-500 bg-slate-100 border-slate-200'
                              }`}
                            >
                              {formatNumber(inHandBalance)} {itemObj?.unit || 'units'}
                            </div>
                          </div>

                          {/* Quantity Used (Installed) input */}
                          <div className="w-full sm:w-28">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-teal-700 mb-1">
                              Qty Used *
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              disabled={isProjectSiteLocked}
                              value={row.quantity}
                              onChange={(e) =>
                                handleRowChange(idx, 'quantity', e.target.value === '' ? '' : Number(e.target.value))
                              }
                              placeholder="Used Qty"
                              className={`w-full text-xs font-bold px-2.5 py-2 border rounded-lg bg-white focus:outline-none text-center font-mono ${
                                isOverLimit ? 'border-rose-400 ring-2 ring-rose-200 text-rose-900' : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
                              }`}
                            />
                          </div>

                          {/* Wastage Quantity input */}
                          <div className="w-full sm:w-28">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">
                              Wastage Qty
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              disabled={isProjectSiteLocked}
                              value={row.wastageQuantity ?? ''}
                              onChange={(e) =>
                                handleRowChange(idx, 'wastageQuantity', e.target.value === '' ? '' : Number(e.target.value))
                              }
                              placeholder="0 (Opt)"
                              className={`w-full text-xs font-bold px-2.5 py-2 border rounded-lg bg-amber-50/40 focus:bg-white focus:outline-none text-center font-mono ${
                                isOverLimit
                                  ? 'border-rose-400 ring-2 ring-rose-200 text-rose-900'
                                  : 'border-amber-300 focus:ring-2 focus:ring-amber-500 text-amber-900'
                              }`}
                            />
                          </div>

                          {/* Total Deducted (Used + Wastage) */}
                          <div className="w-full sm:w-28 text-center">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Total Deduct
                            </label>
                            <div
                              className={`text-xs font-black px-2 py-2 rounded-lg border text-center font-mono ${
                                isOverLimit
                                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                                  : totalRowDeducted > 0
                                  ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                                  : 'bg-slate-50 text-slate-400 border-slate-200'
                              }`}
                            >
                              {formatNumber(totalRowDeducted)} {itemObj?.unit || ''}
                            </div>
                          </div>

                          {/* Remove Row Button */}
                          <div className="pt-2 lg:pt-5">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              disabled={itemRows.length <= 1 || isProjectSiteLocked}
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
                </div>

                {/* Admin Cross-Project Reserved Stock Override Section */}
                {!isProjectSiteLocked && itemRows.some((row) => {
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
                  disabled={eligibleItems.length === 0 || isProjectSiteLocked}
                  className={`px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer active:scale-95 ${
                    isProjectSiteLocked
                      ? 'bg-rose-700 text-white'
                      : 'bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white'
                  }`}
                >
                  {isProjectSiteLocked ? (
                    <>
                      <Lock className="w-4 h-4 text-rose-200" />
                      <span>
                        Locked — Selected project not under {currentUser?.fullName || 'User'}&apos;s site ({userSiteLabel})
                      </span>
                    </>
                  ) : (
                    <>
                      <FolderKanban className="w-4 h-4 text-emerald-300" />
                      <span>Record Material Usage & Deduct In-Hand Stock</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* In-Hand Balance Quick Reference (1 Col) — Strictly Site-Separated */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Users2 className="w-4 h-4 text-teal-600" />
              <span>{currentTeam?.teamName || 'Team'} In-Hand Custody</span>
            </h2>
            <p className="text-[11px] text-slate-500 mb-3">
              Stock is strictly separated by site. Only stock issued under <strong>{selectedSiteName}</strong> can be used on this site.
            </p>

            <div className="flex-1 overflow-y-auto max-h-[440px] space-y-3 pr-1">
              {/* Section 1: Active Usable Stock at Selected Site */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 overflow-hidden">
                <div className="px-3 py-2 bg-emerald-100/80 border-b border-emerald-200 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-extrabold text-emerald-950 uppercase tracking-wide">
                      {selectedSiteName} — Usable Site Stock
                    </div>
                    <div className="text-[10px] text-emerald-800 font-medium">
                      Available to use on {selectedSiteName} projects
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white font-mono text-[10px] font-extrabold shrink-0">
                    {formatNumber(teamInHand?.totalUnitsHeld || 0)} Units
                  </span>
                </div>

                <div className="p-2.5 space-y-2">
                  {eligibleItems.length === 0 ? (
                    <div className="text-center py-5 text-xs text-slate-400">
                      No active in-hand items issued under <strong>{selectedSiteName}</strong> for {currentTeam?.teamName || 'this team'}.
                    </div>
                  ) : (
                    eligibleItems.map((e) => {
                      const itm = items.find((x) => x.id === e.itemId);
                      return (
                        <div
                          key={e.itemId}
                          className="p-2.5 border border-emerald-200/80 rounded-xl bg-white flex items-center justify-between shadow-2xs"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-bold text-slate-800 truncate">{itm?.itemName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {itm?.itemCode} · Site: {selectedSiteName}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-black text-teal-700 font-mono">
                              {formatNumber(e.currentInHand)} {itm?.unit}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-semibold">Usable Here</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Section 2: Unreturned Stock from Previous Site(s) — Locked / Cannot Use Here */}
              {previousSitesStockToReturn.map((prevGroup) => {
                const heldItems = prevGroup.items.filter((i) => i.currentInHand > 0);
                if (heldItems.length === 0) return null;
                return (
                  <div
                    key={prevGroup.siteId}
                    className="rounded-xl border-2 border-amber-300 bg-amber-50/60 overflow-hidden"
                  >
                    <div className="px-3 py-2 bg-amber-100 border-b border-amber-300 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-extrabold text-amber-950 uppercase tracking-wide flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Stock to Return - {prevGroup.siteName}</span>
                        </div>
                        <div className="text-[10px] text-amber-900 font-semibold">
                          Unreturned stock from {prevGroup.siteName} · Cannot be used at {selectedSiteName}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-700 text-white font-mono text-[10px] font-extrabold shrink-0">
                        {formatNumber(prevGroup.totalUnitsHeld)} Units
                      </span>
                    </div>

                    <div className="p-2.5 space-y-1.5">
                      {heldItems.map((e) => {
                        const itm = items.find((x) => x.id === e.itemId);
                        return (
                          <div
                            key={`${prevGroup.siteId}-${e.itemId}`}
                            className="p-2 border border-amber-200 rounded-lg bg-white flex items-center justify-between"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-bold text-slate-800 truncate">{itm?.itemName || e.itemName}</div>
                              <div className="text-[10px] text-amber-800 font-mono font-semibold">
                                {e.itemCode} · Stock to Return - {prevGroup.siteName}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-black text-amber-800 font-mono">
                                {formatNumber(e.currentInHand)} {e.unit}
                              </div>
                              <div className="text-[9px] text-rose-700 font-bold uppercase">
                                Return to {prevGroup.siteName}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Project Material Usage Log ({filteredUsages.length})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select a specific project below to view its consolidated multi-team & wastage report via <strong>Full Report for This Site (Project)</strong>.
                </p>
              </div>
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
                className="text-xs font-bold px-2.5 py-1.5 border-2 border-teal-500/70 rounded-lg bg-teal-50/40 text-slate-900 focus:outline-none"
              >
                <option value="all">All Projects (Select Project for Full Site Report)</option>
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.projectId}] {p.projectName}
                  </option>
                ))}
              </select>

              {/* Full Report for This Site (Project) Button */}
              <button
                type="button"
                onClick={() => {
                  const targetId =
                    projectFilter !== 'all'
                      ? projectFilter
                      : filteredUsages[0]?.projectId || activeProjects[0]?.id || '';
                  if (targetId) {
                    setFullSiteReportProjectId(targetId);
                  }
                }}
                disabled={activeProjects.length === 0}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer transition disabled:opacity-40"
                title="Open Full Multi-Team Material Usage & Wastage Report for Selected Site (Project)"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-200" />
                <span>Full Report for This Site (Project)</span>
              </button>

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
              <div className="relative w-full sm:w-60 min-w-[170px]">
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

          {/* Highlighted Banner when a specific Project is selected in Usage Vouchers History */}
          {projectFilter !== 'all' && (() => {
            const selProj = projects.find((p) => p.id === projectFilter);
            if (!selProj) return null;
            const totalInst = filteredUsages.reduce(
              (sum, u) => sum + u.items.reduce((s, r) => s + Number(r.quantity || 0), 0),
              0
            );
            const totalWast = filteredUsages.reduce(
              (sum, u) => sum + u.items.reduce((s, r) => s + Number(r.wastageQuantity || 0), 0),
              0
            );
            const uniqueTeams = new Set(filteredUsages.map((u) => u.teamId || u.teamName)).size;
            return (
              <div className="px-4 py-3 bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 text-white border-b border-teal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 border border-teal-400/30 text-teal-300 font-mono text-xs font-bold">
                    {selProj.projectId}
                  </span>
                  <span className="font-extrabold text-sm text-white">
                    {selProj.projectName}
                  </span>
                  <span className="text-xs text-teal-200 font-semibold">
                    · {uniqueTeams} Team(s) · {filteredUsages.length} Voucher(s) · Installed: <strong>{formatNumber(totalInst)}</strong> · Wastage: <strong className="text-amber-300">{formatNumber(totalWast)}</strong> · Full Total: <strong className="text-emerald-300">{formatNumber(totalInst + totalWast)}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFullSiteReportProjectId(selProj.id)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition shrink-0"
                >
                  <FileText className="w-4 h-4" />
                  <span>Full Report for This Site (Project) →</span>
                </button>
              </div>
            );
          })()}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">Voucher #</th>
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5">Project & Section</th>
                  <th className="py-3 px-3.5">Team & Supervisor</th>
                  <th className="py-3 px-4 min-w-[320px]">Materials Consumed & Wastage</th>
                  <th className="py-3 px-3.5">Work Scope</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                      No project material usage records match your search filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsages.map((usage) => {
                    const totalInstalledQty = usage.items.reduce((s, i) => s + Number(i.quantity || 0), 0);
                    const totalWastageQty = usage.items.reduce((s, i) => s + Number(i.wastageQuantity || 0), 0);
                    const totalCombinedQty = totalInstalledQty + totalWastageQty;

                    return (
                      <tr key={usage.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-bold text-teal-700 whitespace-nowrap">
                          {usage.usageVoucherNumber}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 font-mono text-xs">
                          {usage.usageDate || usage.date}
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900 text-sm">{usage.projectName}</div>
                          {(usage.parentProjectName || projects.find((p) => p.id === usage.projectId)?.parentProjectName) && (
                            <div className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded inline-block mt-0.5">
                              ↳ Under Main: {usage.parentProjectName || projects.find((p) => p.id === usage.projectId)?.parentProjectName}
                            </div>
                          )}
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            {usage.projectTypeName && (
                              <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                                {usage.projectTypeName}
                              </span>
                            )}
                            <span className="font-mono text-slate-500">
                              ID: {projects.find((p) => p.id === usage.projectId)?.projectId || usage.projectId}
                            </span>
                            <button
                              type="button"
                              onClick={() => setFullSiteReportProjectId(usage.parentProjectId || usage.projectId)}
                              className="text-xs font-bold text-teal-700 hover:text-teal-900 underline ml-1 cursor-pointer"
                            >
                              Full Site Report
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900">{usage.teamName}</div>
                          <div className="text-xs text-slate-500">
                            Lead: {usage.supervisorOrLeader || usage.supervisorOrLeaderName}
                          </div>
                        </td>
                        <td className="py-3 px-4 min-w-[320px]">
                          <div className="text-xs font-bold text-slate-500 mb-1 flex flex-wrap items-center gap-1.5">
                            <span>Installed: <strong>{formatNumber(totalInstalledQty)}</strong></span>
                            {totalWastageQty > 0 && (
                              <span className="text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                + Wastage: <strong>{formatNumber(totalWastageQty)}</strong>
                              </span>
                            )}
                            <span className="text-slate-400">
                              (Total Deducted: <strong>{formatNumber(totalCombinedQty)}</strong> across {usage.items.length} item{usage.items.length === 1 ? '' : 's'})
                            </span>
                          </div>
                          <div className="space-y-1">
                            {usage.items.map((row) => {
                              const itm = items.find((i) => i.id === row.itemId);
                              const wQty = Number(row.wastageQuantity || 0);
                              return (
                                <div
                                  key={row.itemId}
                                  className="flex items-center gap-1.5 flex-wrap bg-slate-50 px-2 py-1 rounded border border-slate-200/80 text-xs"
                                >
                                  <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                    {itm?.itemCode || 'ITEM'}
                                  </span>
                                  <span className="font-bold text-slate-900 text-sm">
                                    {itm?.itemName || 'Material Item'}
                                  </span>
                                  <span className="text-slate-300">·</span>
                                  <span className="font-mono font-extrabold text-teal-800 text-sm">
                                    Used: {formatNumber(row.quantity)} {itm?.unit}
                                  </span>
                                  {wQty > 0 && (
                                    <span className="font-mono font-bold text-amber-800 bg-amber-100/80 border border-amber-300 px-1.5 py-0.5 rounded text-xs">
                                      + Wastage: {formatNumber(wQty)} {itm?.unit} (Total: {formatNumber(Number(row.quantity || 0) + wQty)})
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-3.5 max-w-xs truncate text-slate-600">
                          {usage.workDetails || 'N/A'}
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedUsageForPrint(usage)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200"
                              title="Print Usage Voucher"
                            >
                              <Printer className="w-3.5 h-3.5" />
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

      {/* TAB 3: PROJECT MULTI-TEAM & SUB-PROJECT RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          {/* Project Selector Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Major Project, Sub-Project & Multi-Team Reconciliation
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                Project Material Consumption & Free Stock Reconciliation
              </h2>
              <p className="text-xs text-slate-500">
                Select a Major / Main Project to reconcile total Free Stock against all its Sub-Projects, or select a specific Sub-Project / Individual Project.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-600">Select Project / Sub-Project:</span>
              <select
                value={reconcileProjectId}
                onChange={(e) => setReconcileProjectId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-900 focus:outline-none min-w-[280px]"
              >
                {mainProjectsList.length > 0 && (
                  <optgroup label="🏢 Major / Main Projects (Total Umbrella Reconciliation)">
                    {mainProjectsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        🏢 [MAIN: {p.projectId}] {p.projectName}
                      </option>
                    ))}
                  </optgroup>
                )}
                {activeProjects.some((p) => p.projectScope === 'sub' || Boolean(p.parentProjectId)) && (
                  <optgroup label="↳ Sub-Projects (Individual Sub-Project Details)">
                    {activeProjects
                      .filter((p) => p.projectScope === 'sub' || Boolean(p.parentProjectId))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          ↳ [{p.projectId}] {p.projectName} (Under: {p.parentProjectName || p.parentProjectCode})
                        </option>
                      ))}
                  </optgroup>
                )}
                <optgroup label="📄 Individual / Standalone Projects">
                  {activeProjects
                    .filter(
                      (p) =>
                        p.projectScope !== 'main' &&
                        p.projectScope !== 'sub' &&
                        !p.parentProjectId &&
                        !activeProjects.some((sub) => sub.parentProjectId === p.id)
                    )
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        📄 [{p.projectId}] {p.projectName}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>
          </div>

          {reconcileProject ? (
            <div className="space-y-6">
              {/* Project Card Header */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                      {reconcileProject.projectId}
                    </span>
                    {isReconcileMainProject ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-extrabold">
                        🏢 Major / Main Project ({reconcileChildSubProjects.length} Sub-Projects)
                      </span>
                    ) : reconcileProject.parentProjectId ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-extrabold">
                        ↳ Sub-Project Under Main: {reconcileProject.parentProjectName || reconcileParentMainProject?.projectName}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-extrabold">
                        📄 Individual Project
                      </span>
                    )}
                    {reconcileProject.projectTypeName && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold">
                        {reconcileProject.projectTypeName}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold">{reconcileProject.projectName}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>District: {reconcileProject.district || '—'}</span>
                    <span>·</span>
                    <span>Ref: {reconcileProject.referenceNo || '—'}</span>
                    <span>·</span>
                    <span>
                      Total Vouchers {isReconcileMainProject ? '(Main + All Sub-Projects)' : ''}: {reconcileUsages.length}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  {reconcileParentMainProject && (
                    <button
                      type="button"
                      onClick={() => setReconcileProjectId(reconcileParentMainProject.id)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                    >
                      ← View Full Main Project ({reconcileParentMainProject.projectName}) Reconciliation
                    </button>
                  )}
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-400">
                      {reconcileTeamBreakdown.teams.length} Team(s)
                    </div>
                    <div className="text-xs text-slate-400">Participated in this Scope</div>
                  </div>
                </div>
              </div>

              {/* Client Free-Issue Stock Reconciliation (Client/Principal Statement) */}
              {(() => {
                const projectFocList = getProjectFreeStockList(reconcileProject.id);
                if (projectFocList.length === 0) return null;
                return (
                  <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-xs border border-indigo-900">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-indigo-800/60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
                          <Gift className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-white flex flex-wrap items-center gap-2">
                            <span>
                              {isReconcileMainProject
                                ? 'Major / Main Project Total Free-Issue Stock Reconciliation (All Sub-Projects Combined)'
                                : reconcileProject.parentProjectId
                                ? `Sub-Project Free Stock Usage vs. Main Project Pool (${reconcileProject.parentProjectName})`
                                : 'Client Free-Issue Stock Reconciliation (Client / Principal FOC)'}
                            </span>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                              Official Statement
                            </span>
                          </h4>
                          <p className="text-xs text-indigo-300/80">
                            {isReconcileMainProject
                              ? 'Total materials received under this Main Project vs. combined usage across all Sub-Projects vs. net remaining balance'
                              : reconcileProject.parentProjectId
                              ? 'Shows materials consumed specifically by this Sub-Project alongside the shared Main Project pool balance'
                              : 'Materials supplied free by principal for this project vs installed in field vs remaining balance'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[13px]">
                        <thead>
                          <tr className="border-b border-indigo-800/80 text-indigo-300 font-bold uppercase text-xs">
                            <th className="py-2 px-3">Item Code</th>
                            <th className="py-2 px-3">Material Description</th>
                            <th className="py-2 px-3 text-right">Received in Main Pool</th>
                            {reconcileProject.parentProjectId && (
                              <th className="py-2 px-3 text-right">Used by THIS Sub-Project</th>
                            )}
                            <th className="py-2 px-3 text-right">
                              {isReconcileMainProject || reconcileProject.parentProjectId
                                ? 'Total Used (All Sub-Projects)'
                                : 'Field Installed'}
                            </th>
                            <th className="py-2 px-3 text-right">Net Remaining Balance</th>
                            <th className="py-2 px-3 text-center">Reconciliation Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-900/60 font-medium">
                          {projectFocList.map((foc) => {
                            const isDepleted = foc.remainingBalance <= 0;
                            return (
                              <tr key={foc.itemId} className="hover:bg-indigo-900/30 transition-colors">
                                <td className="py-2.5 px-3 font-mono font-bold text-white">{foc.itemCode}</td>
                                <td className="py-2.5 px-3 text-slate-200 font-semibold">
                                  <div>{foc.itemName}</div>
                                  {isReconcileMainProject && foc.subProjectBreakdown && foc.subProjectBreakdown.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {foc.subProjectBreakdown.map((sb) => (
                                        <span
                                          key={sb.subProjectId}
                                          className="text-[11.5px] font-mono px-1.5 py-0.5 rounded bg-indigo-900/80 text-amber-200 border border-indigo-700"
                                        >
                                          ↳ {sb.subProjectName}: {formatNumber(sb.usedQty)} {foc.unit}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-cyan-300 font-bold">
                                  {formatNumber(foc.totalReceived)} <span className="text-xs text-indigo-300">{foc.unit}</span>
                                </td>
                                {reconcileProject.parentProjectId && (
                                  <td className="py-2.5 px-3 text-right font-mono text-amber-300 font-black">
                                    {formatNumber(foc.directUsed || 0)} <span className="text-xs text-indigo-300">{foc.unit}</span>
                                  </td>
                                )}
                                <td className="py-2.5 px-3 text-right font-mono text-amber-200 font-bold">
                                  <div>
                                    {formatNumber(foc.totalUsed)} <span className="text-xs text-indigo-300">{foc.unit}</span>
                                  </div>
                                  {(foc.totalWastage || 0) > 0 && (
                                    <div className="text-[11.5px] text-amber-300/90">
                                      (Incl. {formatNumber(foc.totalWastage || 0)} wastage)
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-300">
                                  {formatNumber(foc.remainingBalance)} <span className="text-xs text-indigo-300">{foc.unit}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {isDepleted ? (
                                    <span className="text-[11.5px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-md">
                                      100% Consumed
                                    </span>
                                  ) : (
                                    <span className="text-[11.5px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-md">
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

              {/* Sub-Projects Individual Breakdown Section (When viewing a Major / Main Project) */}
              {isReconcileMainProject && (
                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-950 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-600" />
                        <span>Sub-Projects Individual Material Usage Breakdown ({reconcileSubProjectCards.length})</span>
                      </h4>
                      <p className="text-[11px] text-amber-900/80 mt-0.5">
                        Separate material consumption recorded under each Sub-Project belonging to <strong>{reconcileProject.projectName}</strong>. Click any Sub-Project to inspect its standalone reconciliation.
                      </p>
                    </div>
                  </div>

                  {reconcileSubProjectCards.length === 0 ? (
                    <div className="p-6 text-center text-amber-800 bg-white/80 border border-dashed border-amber-300 rounded-xl text-xs">
                      No Sub-Projects have been linked under this Major Project yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reconcileSubProjectCards.map((card) => (
                        <div
                          key={card.subProject.id}
                          className="bg-white border border-amber-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold text-[10px]">
                                    ↳ {card.subProject.projectId}
                                  </span>
                                  <span className="text-xs font-extrabold text-slate-900">
                                    {card.subProject.projectName}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {card.subProject.district || 'General'} · {card.subProject.subArea || 'Sub-Site'} ·{' '}
                                  <strong>{card.vouchersCount}</strong> Voucher(s) · <strong>{card.teamsCount}</strong> Team(s)
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setReconcileProjectId(card.subProject.id)}
                                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition cursor-pointer shrink-0 shadow-2xs"
                              >
                                View Sub-Project →
                              </button>
                            </div>

                            {card.items.length === 0 ? (
                              <div className="text-[11px] text-slate-400 italic py-2">
                                No material usage vouchers logged for this Sub-Project yet.
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {card.items.map(([itmId, stat]) => {
                                  const itm = items.find((i) => i.id === itmId);
                                  return (
                                    <div
                                      key={itmId}
                                      className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-50 border border-slate-100"
                                    >
                                      <span className="text-slate-700 font-semibold truncate pr-2">
                                        [{itm?.itemCode}] {itm?.itemName || itmId}
                                      </span>
                                      <span className="font-mono font-black text-amber-800 shrink-0">
                                        {formatNumber(stat.total)} {itm?.unit || 'units'}
                                        {stat.wastage > 0 && (
                                          <span className="text-[10px] text-rose-700 ml-1">
                                            (Used: {formatNumber(stat.installed)} + Wastage: {formatNumber(stat.wastage)})
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Grand Total Project Consumed Materials */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>
                      {isReconcileMainProject
                        ? 'Total Main Project Materials Consumed (Combined Across All Sub-Projects & Teams)'
                        : 'Total Project Materials Consumed (Across All Teams)'}
                    </span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setFullSiteReportProjectId(reconcileProject.id)}
                    className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Open Full Report for This Site (Project)</span>
                  </button>
                </div>

                {reconcileTeamBreakdown.totalItems.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl text-xs">
                    No material usages recorded yet for this project.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {reconcileTeamBreakdown.totalItems.map(([itmId, stat]) => {
                      const itm = items.find((i) => i.id === itmId);
                      return (
                        <div key={itmId} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <div className="text-[11px] text-slate-500 font-mono">{itm?.itemCode || 'ITEM'}</div>
                          <div className="text-xs font-bold text-slate-900 truncate">{itm?.itemName}</div>
                          <div className="text-base font-black text-emerald-700 mt-1">
                            {formatNumber(stat.total)} <span className="text-xs font-normal text-slate-500">{itm?.unit}</span>
                          </div>
                          <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                            Used: {formatNumber(stat.installed)} {stat.wastage > 0 ? `| Wastage: ${formatNumber(stat.wastage)}` : ''}
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
                        {Array.from(t.itemsMap.entries()).map(([itmId, stat]) => {
                          const itm = items.find((i) => i.id === itmId);
                          return (
                            <div key={itmId} className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                              <span className="text-slate-700 font-medium">{itm?.itemName || itmId}</span>
                              <div className="text-right font-mono">
                                <span className="font-bold text-slate-900">
                                  {formatNumber(stat.total)} {itm?.unit || 'units'}
                                </span>
                                {stat.wastage > 0 && (
                                  <span className="block text-[10px] text-amber-700 font-semibold">
                                    Used: {formatNumber(stat.installed)} | Wastage: {formatNumber(stat.wastage)}
                                  </span>
                                )}
                              </div>
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] flex flex-col">
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
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-600 uppercase px-2">
                  <div className="col-span-6">Material Item</div>
                  <div className="col-span-3 text-center text-teal-700">Qty Used</div>
                  <div className="col-span-3 text-center text-amber-700">Wastage Qty</div>
                </div>
                {editItemRows.map((r, i) => {
                  const itm = items.find((x) => x.id === r.itemId);
                  return (
                    <div key={i} className="grid grid-cols-12 items-center gap-2 bg-white p-2 border border-slate-200 rounded-lg">
                      <div className="col-span-6 text-xs font-semibold text-slate-800">
                        [{itm?.itemCode}] {itm?.itemName || r.itemId} ({itm?.unit || 'units'})
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={r.quantity}
                          onChange={(e) => {
                            const next = [...editItemRows];
                            next[i].quantity = e.target.value !== '' ? Number(e.target.value) : '';
                            setEditItemRows(next);
                          }}
                          placeholder="Used"
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono text-center font-bold"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={r.wastageQuantity ?? ''}
                          onChange={(e) => {
                            const next = [...editItemRows];
                            next[i].wastageQuantity = e.target.value !== '' ? Number(e.target.value) : '';
                            setEditItemRows(next);
                          }}
                          placeholder="0"
                          className="w-full px-2 py-1 border border-amber-300 bg-amber-50/40 rounded text-xs font-mono text-center font-bold text-amber-900"
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

      {/* FULL REPORT FOR THIS SITE (PROJECT) MODAL */}
      {fullSiteReportProjectId && fullSiteReportData && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden">
            {/* Modal Top Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-teal-800">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-black uppercase tracking-wider">
                    Full Report for This Site (Project)
                  </span>
                  <span className="font-mono text-xs text-teal-300 font-bold">
                    [{fullSiteReportData.project.projectId}]
                  </span>
                  {fullSiteReportData.isMainUmbrella && (
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-400/30 text-purple-200 text-[11px] font-bold">
                      Includes Main + {fullSiteReportData.childSubsCount} Sub-Project(s)
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight mt-1">
                  {fullSiteReportData.project.projectName} — Multi-Team Usage &amp; Wastage Report
                </h2>
                <p className="text-[13px] text-teal-200/90 mt-0.5">
                  Site Branch: <strong>{fullSiteReportData.branchName}</strong> · Section:{' '}
                  <strong>{fullSiteReportData.project.projectTypeName || 'General'}</strong> · Customer/Principal:{' '}
                  <strong>{fullSiteReportData.project.customerName || '—'}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Switch Project inside Report */}
                <select
                  value={fullSiteReportData.project.id}
                  onChange={(e) => setFullSiteReportProjectId(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-teal-600 text-white text-xs font-bold focus:outline-none max-w-[230px]"
                >
                  {activeProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.projectId}] {p.projectName}
                    </option>
                  ))}
                </select>

                {/* Export CSV Button */}
                <button
                  type="button"
                  onClick={() => {
                    const csvRows: Record<string, unknown>[] = [];
                    fullSiteReportData.teamsBreakdown.forEach((teamGrp) => {
                      teamGrp.voucherLines.forEach((line) => {
                        csvRows.push({
                          'Report Section': `TEAM DETAIL: ${teamGrp.teamName}`,
                          'Project Code': fullSiteReportData.project.projectId,
                          'Project Name': fullSiteReportData.project.projectName,
                          'Site Branch': fullSiteReportData.branchName,
                          'Team Name': teamGrp.teamName,
                          'Team Leader / Supervisor': line.supervisor,
                          'Voucher #': line.voucherNumber,
                          'Date': line.date,
                          'Scope / Sub-Project': line.subProjectName,
                          'Item Code': line.itemCode,
                          'Item Description': line.itemName,
                          'Unit': line.unit,
                          'Installed Qty': line.installedQty,
                          'Wastage Qty': line.wastageQty,
                          'Total Consumed (Installed + Wastage)': line.totalConsumedQty,
                          'Unit Cost': line.unitCost,
                          'Total Cost': line.lineCost,
                        });
                      });
                      csvRows.push({
                        'Report Section': `>>> TEAM SUBTOTAL: ${teamGrp.teamName} <<<`,
                        'Project Code': fullSiteReportData.project.projectId,
                        'Project Name': fullSiteReportData.project.projectName,
                        'Site Branch': fullSiteReportData.branchName,
                        'Team Name': teamGrp.teamName,
                        'Team Leader / Supervisor': teamGrp.leaderName,
                        'Voucher #': `${teamGrp.vouchersCount} Voucher(s)`,
                        'Date': 'SUBTOTAL',
                        'Scope / Sub-Project': 'ALL TEAM ITEMS',
                        'Item Code': 'TEAM-TOTAL',
                        'Item Description': `Subtotal for ${teamGrp.teamName}`,
                        'Unit': 'All Units',
                        'Installed Qty': teamGrp.teamTotalInstalled,
                        'Wastage Qty': teamGrp.teamTotalWastage,
                        'Total Consumed (Installed + Wastage)': teamGrp.teamTotalConsumed,
                        'Unit Cost': '',
                        'Total Cost': teamGrp.teamTotalCost,
                      });
                    });

                    fullSiteReportData.consolidatedMaterials.forEach((mat) => {
                      csvRows.push({
                        'Report Section': 'ALL TEAMS MATERIAL SUMMARY',
                        'Project Code': fullSiteReportData.project.projectId,
                        'Project Name': fullSiteReportData.project.projectName,
                        'Site Branch': fullSiteReportData.branchName,
                        'Team Name': mat.teamsList.join(', '),
                        'Team Leader / Supervisor': 'All Teams',
                        'Voucher #': 'CONSOLIDATED',
                        'Date': '—',
                        'Scope / Sub-Project': 'Full Site / Project',
                        'Item Code': mat.itemCode,
                        'Item Description': mat.itemName,
                        'Unit': mat.unit,
                        'Installed Qty': mat.installedQty,
                        'Wastage Qty': mat.wastageQty,
                        'Total Consumed (Installed + Wastage)': mat.totalConsumedQty,
                        'Unit Cost': mat.unitCost,
                        'Total Cost': mat.totalCost,
                      });
                    });

                    csvRows.push({
                      'Report Section': '=== FULL SITE (PROJECT) GRAND TOTAL ===',
                      'Project Code': fullSiteReportData.project.projectId,
                      'Project Name': fullSiteReportData.project.projectName,
                      'Site Branch': fullSiteReportData.branchName,
                      'Team Name': `${fullSiteReportData.teamsBreakdown.length} Team(s)`,
                      'Team Leader / Supervisor': 'GRAND TOTAL',
                      'Voucher #': `${fullSiteReportData.vouchersCount} Voucher(s)`,
                      'Date': new Date().toISOString().split('T')[0],
                      'Scope / Sub-Project': 'FULL PROJECT TOTAL',
                      'Item Code': 'GRAND-TOTAL',
                      'Item Description': 'Full Project Combined Total (All Teams)',
                      'Unit': 'All Units',
                      'Installed Qty': fullSiteReportData.grandTotalInstalled,
                      'Wastage Qty': fullSiteReportData.grandTotalWastage,
                      'Total Consumed (Installed + Wastage)': fullSiteReportData.grandTotalConsumed,
                      'Unit Cost': '',
                      'Total Cost': fullSiteReportData.grandTotalCost,
                    });

                    exportToCsv(
                      `Full_Site_Report_${fullSiteReportData.project.projectId}`,
                      csvRows
                    );
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export Excel / CSV</span>
                </button>

                <label
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer select-none transition-colors ${
                    offDigitalSignature
                      ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
                  }`}
                  title="Hide digital signatures and leave blank space for manual hand signing"
                >
                  <input
                    type="checkbox"
                    checked={offDigitalSignature}
                    onChange={(e) => setOffDigitalSignature(e.target.checked)}
                    className="rounded border-slate-500 text-rose-500 focus:ring-rose-500"
                  />
                  <PenTool className="w-3.5 h-3.5 shrink-0" />
                  <span>Off Digital Signature</span>
                </label>

                {/* Print Report Button */}
                <button
                  type="button"
                  disabled={isPrintingFullReport}
                  onClick={async () => {
                    setIsPrintingFullReport(true);
                    setFullReportPrintNotice('Opening isolated A4 report print preview...');
                    const docTitle = `Full_Site_Report_${fullSiteReportData.project.projectId}`;
                    try {
                      await printHtmlElement('full-site-report-printable-area', docTitle);
                      setFullReportPrintNotice('✓ Isolated A4 Site Report print dialog opened!');
                    } catch {
                      try {
                        await downloadElementAsPdf('full-site-report-printable-area', docTitle);
                        setFullReportPrintNotice('✓ Full Site Report A4 PDF downloaded successfully!');
                      } catch (err) {
                        console.error('Report print/PDF error:', err);
                      }
                    } finally {
                      setTimeout(() => {
                        setIsPrintingFullReport(false);
                        setTimeout(() => setFullReportPrintNotice(null), 3500);
                      }, 700);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-700" />
                  <span>{isPrintingFullReport ? 'Preparing Print...' : 'Print Report'}</span>
                </button>

                {/* Save PDF Button */}
                <button
                  type="button"
                  disabled={isPrintingFullReport}
                  onClick={async () => {
                    setIsPrintingFullReport(true);
                    setFullReportPrintNotice('Generating high-resolution A4 PDF...');
                    const docTitle = `Full_Site_Report_${fullSiteReportData.project.projectId}`;
                    try {
                      const ok = await downloadElementAsPdf('full-site-report-printable-area', docTitle);
                      setFullReportPrintNotice(
                        ok
                          ? '✓ Full Site Report A4 PDF downloaded successfully!'
                          : 'PDF download encountered an issue. Please use Print Report -> Save as PDF.'
                      );
                    } catch (err) {
                      console.error('Report PDF download error:', err);
                      setFullReportPrintNotice('PDF download encountered an issue. Please use Print Report.');
                    } finally {
                      setTimeout(() => {
                        setIsPrintingFullReport(false);
                        setTimeout(() => setFullReportPrintNotice(null), 3500);
                      }, 700);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFullSiteReportProjectId(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Close Report"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {fullReportPrintNotice && (
              <div className="no-print bg-emerald-950 text-emerald-200 px-5 py-2 text-xs font-bold border-b border-emerald-800 flex items-center justify-between">
                <span>{fullReportPrintNotice}</span>
              </div>
            )}

            {/* Report Body */}
            <div
              id="full-site-report-printable-area"
              className="printable-voucher-sheet p-4 sm:p-6 overflow-y-auto space-y-6 bg-white flex-1"
            >
              {/* Official Document Header (Included in Print / PDF) */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-teal-700">
                    {config.companyName || 'APEX STOCK ENTERPRISE'} — OFFICIAL PROJECT CONSUMPTION &amp; WASTAGE REPORT
                  </div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-950 mt-0.5">
                    FULL REPORT FOR THIS SITE (PROJECT): [{fullSiteReportData.project.projectId}] {fullSiteReportData.project.projectName}
                  </h1>
                  <div className="text-[13px] text-slate-700 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>
                      Site Branch: <strong>{fullSiteReportData.branchName}</strong>
                    </span>
                    <span>
                      Section: <strong>{fullSiteReportData.project.projectTypeName || 'General'}</strong>
                    </span>
                    <span>
                      Customer / Client: <strong>{fullSiteReportData.project.customerName || '—'}</strong>
                    </span>
                    {fullSiteReportData.isMainUmbrella && (
                      <span className="font-bold text-purple-800">
                        Scope: Main Project + {fullSiteReportData.childSubsCount} Sub-Project(s)
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right text-xs font-mono text-slate-600 shrink-0">
                  <div className="font-bold text-slate-900">Report Date: {new Date().toISOString().split('T')[0]}</div>
                  <div>Teams Count: {fullSiteReportData.teamsBreakdown.length} Team(s)</div>
                  <div>Usage Vouchers: {fullSiteReportData.vouchersCount} Slip(s)</div>
                </div>
              </div>
              {/* Top KPI Summary Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <div className="text-[11px] font-bold uppercase text-slate-500">Teams Involved</div>
                  <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                    {fullSiteReportData.teamsBreakdown.length}
                  </div>
                  <div className="text-[11px] text-slate-500">Separate Team Breakdowns</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <div className="text-[11px] font-bold uppercase text-slate-500">Total Vouchers</div>
                  <div className="text-xl font-black text-teal-700 font-mono mt-0.5">
                    {fullSiteReportData.vouchersCount}
                  </div>
                  <div className="text-[11px] text-slate-500">Logged Usage Slips</div>
                </div>

                <div className="bg-white border border-teal-200 rounded-xl p-3.5 shadow-2xs">
                  <div className="text-[11px] font-bold uppercase text-teal-700">Full Installed Qty</div>
                  <div className="text-xl font-black text-teal-800 font-mono mt-0.5">
                    {formatNumber(fullSiteReportData.grandTotalInstalled)}
                  </div>
                  <div className="text-[11px] text-teal-600">Net Used on Site</div>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 shadow-2xs">
                  <div className="text-[11px] font-bold uppercase text-amber-800">Full Wastage Qty</div>
                  <div className="text-xl font-black text-amber-700 font-mono mt-0.5">
                    {formatNumber(fullSiteReportData.grandTotalWastage)}
                  </div>
                  <div className="text-[11px] text-amber-700">Recorded Material Wastage</div>
                </div>

                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 shadow-2xs">
                  <div className="text-[11px] font-bold uppercase text-indigo-800">Full Total Consumed</div>
                  <div className="text-xl font-black text-indigo-900 font-mono mt-0.5">
                    {formatNumber(fullSiteReportData.grandTotalConsumed)}
                  </div>
                  <div className="text-[11px] text-indigo-700">Installed + Wastage</div>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 shadow-2xs">
                  <div className="text-[11px] font-bold uppercase text-emerald-800">Full Material Value</div>
                  <div className="text-lg font-black text-emerald-900 font-mono mt-0.5">
                    {config.currencySymbol || 'Rs.'} {formatNumber(fullSiteReportData.grandTotalCost)}
                  </div>
                  <div className="text-[11px] text-emerald-700">Combined Project Cost</div>
                </div>
              </div>

              {fullSiteReportData.teamsBreakdown.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-sm">
                  No material usage vouchers have been logged for this project yet.
                </div>
              ) : (
                <>
                  {/* SECTION 1: TEAM-BY-TEAM SEPARATE BREAKDOWN & TEAM TOTALS */}
                  <div className="space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                          <Users2 className="w-4 h-4 text-teal-700" />
                          <span>
                            Part 1: Team-by-Team Material Usage &amp; Individual Team Totals ({fullSiteReportData.teamsBreakdown.length} Teams)
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Each team&apos;s material usage is shown separately below along with that specific team&apos;s subtotal (Installed, Wastage, and Total Consumed).
                        </p>
                      </div>
                    </div>

                    {fullSiteReportData.teamsBreakdown.map((teamGrp, tIdx) => (
                      <div
                        key={teamGrp.teamId}
                        className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-xs"
                      >
                        {/* Team Card Header */}
                        <div className="bg-slate-900 text-white px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center font-mono font-black text-xs">
                              T{tIdx + 1}
                            </span>
                            <div>
                              <div className="font-black text-sm text-white flex items-center gap-2">
                                <span>{teamGrp.teamName}</span>
                                <span className="text-[11px] font-normal text-slate-300">
                                  (Leader: <strong>{teamGrp.leaderName}</strong> · Site: {teamGrp.siteName})
                                </span>
                              </div>
                              <div className="text-[11px] text-teal-300">
                                {teamGrp.vouchersCount} Usage Voucher(s) · {teamGrp.materialsSummary.length} Distinct Material(s)
                              </div>
                            </div>
                          </div>

                          {/* Team Quick Subtotal Badges */}
                          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                            <span className="px-2.5 py-1 rounded-lg bg-teal-950 border border-teal-700 text-teal-200 font-bold">
                              Team Installed: {formatNumber(teamGrp.teamTotalInstalled)}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-amber-950 border border-amber-700 text-amber-300 font-bold">
                              Team Wastage: {formatNumber(teamGrp.teamTotalWastage)}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black">
                              Team Total: {formatNumber(teamGrp.teamTotalConsumed)}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 space-y-4">
                          {/* Team Itemized Summary Table (Team Total per Material) */}
                          <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-teal-800 mb-2">
                              {teamGrp.teamName} — Material Summary &amp; Team Subtotal
                            </div>
                            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                              <table className="w-full text-left text-[13px]">
                                <thead className="bg-slate-100 text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
                                  <tr>
                                    <th className="py-2 px-3">#</th>
                                    <th className="py-2 px-3">Item Code</th>
                                    <th className="py-2 px-3">Material Description</th>
                                    <th className="py-2 px-3 text-center">Unit</th>
                                    <th className="py-2 px-3 text-right text-teal-800">Team Installed Qty</th>
                                    <th className="py-2 px-3 text-right text-amber-800">Team Wastage Qty</th>
                                    <th className="py-2 px-3 text-right text-indigo-900">Team Total Consumed</th>
                                    <th className="py-2 px-3 text-right">Total Value</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {teamGrp.materialsSummary.map((m, mIdx) => (
                                    <tr key={m.itemId} className="hover:bg-slate-50">
                                      <td className="py-2 px-3 font-mono text-slate-400">{mIdx + 1}</td>
                                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{m.itemCode}</td>
                                      <td className="py-2 px-3 font-semibold text-slate-800">{m.itemName}</td>
                                      <td className="py-2 px-3 text-center font-mono text-slate-600">{m.unit}</td>
                                      <td className="py-2 px-3 text-right font-mono font-bold text-teal-700">
                                        {formatNumber(m.installedQty)}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono font-bold text-amber-700">
                                        {formatNumber(m.wastageQty)}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono font-black text-indigo-900 bg-indigo-50/40">
                                        {formatNumber(m.totalConsumedQty)}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-700">
                                        {config.currencySymbol || 'Rs.'} {formatNumber(m.totalCost)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-800">
                                  <tr>
                                    <td colSpan={4} className="py-2.5 px-3 text-right uppercase tracking-wider text-xs text-teal-300">
                                      Subtotal for {teamGrp.teamName}:
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono text-teal-300">
                                      {formatNumber(teamGrp.teamTotalInstalled)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono text-amber-300">
                                      {formatNumber(teamGrp.teamTotalWastage)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-300 text-sm">
                                      {formatNumber(teamGrp.teamTotalConsumed)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono text-white">
                                      {config.currencySymbol || 'Rs.'} {formatNumber(teamGrp.teamTotalCost)}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>

                          {/* Voucher-by-Voucher Detailed Log for this Team */}
                          <details className="group border border-slate-200 rounded-xl bg-slate-50/60">
                            <summary className="px-3.5 py-2 text-xs font-bold text-slate-700 cursor-pointer flex items-center justify-between">
                              <span>
                                View Voucher-by-Voucher Log for {teamGrp.teamName} ({teamGrp.voucherLines.length} item entries)
                              </span>
                              <span className="text-xs text-teal-700 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="p-3 pt-0 overflow-x-auto">
                              <table className="w-full text-left text-[13px] bg-white border border-slate-200 rounded-lg">
                                <thead className="bg-slate-100 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                                  <tr>
                                    <th className="py-1.5 px-2.5">Date</th>
                                    <th className="py-1.5 px-2.5">Voucher #</th>
                                    <th className="py-1.5 px-2.5">Scope / Sub-Project</th>
                                    <th className="py-1.5 px-2.5">Item</th>
                                    <th className="py-1.5 px-2.5 text-right">Installed</th>
                                    <th className="py-1.5 px-2.5 text-right">Wastage</th>
                                    <th className="py-1.5 px-2.5 text-right">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {teamGrp.voucherLines.map((vl, vIdx) => (
                                    <tr key={`${vl.voucherId}-${vl.itemId}-${vIdx}`}>
                                      <td className="py-1.5 px-2.5 font-mono text-slate-600">{vl.date}</td>
                                      <td className="py-1.5 px-2.5 font-mono font-bold text-teal-700">{vl.voucherNumber}</td>
                                      <td className="py-1.5 px-2.5 text-slate-700">{vl.subProjectName}</td>
                                      <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                                        [{vl.itemCode}] {vl.itemName} ({vl.unit})
                                      </td>
                                      <td className="py-1.5 px-2.5 text-right font-mono font-bold text-teal-700">
                                        {formatNumber(vl.installedQty)}
                                      </td>
                                      <td className="py-1.5 px-2.5 text-right font-mono font-bold text-amber-700">
                                        {formatNumber(vl.wastageQty)}
                                      </td>
                                      <td className="py-1.5 px-2.5 text-right font-mono font-black text-slate-900">
                                        {formatNumber(vl.totalConsumedQty)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </details>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SECTION 2: FULL SITE (PROJECT) CONSOLIDATED GRAND TOTAL TABLE */}
                  <div className="bg-white border-2 border-emerald-600 rounded-2xl overflow-hidden shadow-md">
                    <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-emerald-400" />
                          <span>
                            Part 2: Full Site (Project) Consolidated Grand Total — All Teams Combined
                          </span>
                        </h3>
                        <p className="text-xs text-teal-100 mt-0.5">
                          Combined material consumption and wastage across all {fullSiteReportData.teamsBreakdown.length} team(s) for{' '}
                          <strong>{fullSiteReportData.project.projectName}</strong>.
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-mono font-black text-xs">
                        Full Total Consumed: {formatNumber(fullSiteReportData.grandTotalConsumed)} Units
                      </span>
                    </div>

                    <div className="p-4 overflow-x-auto">
                      <table className="w-full text-left text-[13px]">
                        <thead className="bg-slate-100 text-slate-800 text-xs font-extrabold uppercase border-b-2 border-slate-300">
                          <tr>
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Item Code</th>
                            <th className="py-2.5 px-3">Material Description</th>
                            <th className="py-2.5 px-3">Teams Involved</th>
                            <th className="py-2.5 px-3 text-center">Unit</th>
                            <th className="py-2.5 px-3 text-right text-teal-800">Full Installed Qty</th>
                            <th className="py-2.5 px-3 text-right text-amber-800">Full Wastage Qty</th>
                            <th className="py-2.5 px-3 text-right text-indigo-950">Full Total Consumed</th>
                            <th className="py-2.5 px-3 text-right">Full Total Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {fullSiteReportData.consolidatedMaterials.map((mat, idx) => (
                            <tr key={mat.itemId} className="hover:bg-emerald-50/30">
                              <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{mat.itemCode}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-900">{mat.itemName}</td>
                              <td className="py-2.5 px-3">
                                <div className="flex flex-wrap gap-1">
                                  {mat.teamsList.map((tn) => (
                                    <span
                                      key={tn}
                                      className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[11px] font-bold text-slate-700"
                                    >
                                      {tn}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-slate-600">{mat.unit}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-800">
                                {formatNumber(mat.installedQty)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                                {formatNumber(mat.wastageQty)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-950 bg-indigo-50/60 text-sm">
                                {formatNumber(mat.totalConsumedQty)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                {config.currencySymbol || 'Rs.'} {formatNumber(mat.totalCost)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-emerald-950 text-white font-black border-t-2 border-emerald-700 text-sm">
                          <tr>
                            <td colSpan={5} className="py-3 px-3 text-right uppercase tracking-wider text-xs text-emerald-300">
                              FULL SITE (PROJECT) GRAND TOTAL (ALL TEAMS):
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-teal-300">
                              {formatNumber(fullSiteReportData.grandTotalInstalled)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-amber-300">
                              {formatNumber(fullSiteReportData.grandTotalWastage)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-emerald-300 text-base">
                              {formatNumber(fullSiteReportData.grandTotalConsumed)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-white">
                              {config.currencySymbol || 'Rs.'} {formatNumber(fullSiteReportData.grandTotalCost)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Official Sign-Off Footer for Printed / Saved PDF Report */}
                  <div className="pt-5 mt-5 border-t-2 border-slate-300 grid grid-cols-3 gap-6 text-[13px] text-slate-800">
                    <div className="text-center">
                      {!offDigitalSignature &&
                      matchDigitalSignature(digitalSignatures, activeTemplate?.preparedBy || currentUser?.fullName, 'prepared') ? (
                        <div className="h-14 flex items-end justify-center pb-1 border-b border-slate-400 mb-1.5">
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
                          <span className="text-[10px] text-slate-400 italic">Hand Signature &amp; Date</span>
                        </div>
                      )}
                      <div className="font-bold text-slate-900">Prepared By</div>
                      <div className="text-xs text-slate-500">Site Storekeeper / Supervisor</div>
                    </div>
                    <div className="text-center">
                      {!offDigitalSignature &&
                      matchDigitalSignature(digitalSignatures, activeTemplate?.reviewedBy || currentUser?.fullName, 'reviewed') ? (
                        <div className="h-14 flex items-end justify-center pb-1 border-b border-slate-400 mb-1.5">
                          <img
                            src={
                              matchDigitalSignature(digitalSignatures, activeTemplate?.reviewedBy || currentUser?.fullName, 'reviewed')!
                                .signatureDataUrl
                            }
                            alt="Verified Digital Signature"
                            className="max-h-12 max-w-[150px] object-contain mix-blend-multiply"
                          />
                        </div>
                      ) : (
                        <div className="h-16 flex flex-col justify-end border-b border-dashed border-slate-400 mb-1.5 pb-1">
                          <span className="text-[10px] text-slate-400 italic">Hand Signature &amp; Date</span>
                        </div>
                      )}
                      <div className="font-bold text-slate-900">Checked &amp; Verified By</div>
                      <div className="text-xs text-slate-500">Project Engineer / Branch Manager</div>
                    </div>
                    <div className="text-center">
                      {!offDigitalSignature &&
                      matchDigitalSignature(digitalSignatures, activeTemplate?.approvedBy || currentUser?.fullName, 'approved') ? (
                        <div className="h-14 flex items-end justify-center pb-1 border-b border-slate-400 mb-1.5">
                          <img
                            src={
                              matchDigitalSignature(digitalSignatures, activeTemplate?.approvedBy || currentUser?.fullName, 'approved')!
                                .signatureDataUrl
                            }
                            alt="Approved Digital Signature"
                            className="max-h-12 max-w-[150px] object-contain mix-blend-multiply"
                          />
                        </div>
                      ) : (
                        <div className="h-16 flex flex-col justify-end border-b border-dashed border-slate-400 mb-1.5 pb-1">
                          <span className="text-[10px] text-slate-400 italic">Hand Signature &amp; Stamp</span>
                        </div>
                      )}
                      <div className="font-bold text-slate-900">Approved By</div>
                      <div className="text-xs text-slate-500">Central Logistics / Management</div>
                    </div>
                  </div>
                </>
              )}
            </div>
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
            const instQty = Number(row.quantity || 0);
            const wastQty = Number(row.wastageQuantity || 0);
            return {
              itemCode: itm?.itemCode || 'CODE',
              itemName: itm?.itemName || 'Material Item',
              category: itm?.category || 'Telecom Equipment',
              quantity: instQty + wastQty,
              unit: itm?.unit || 'Nos',
              remarks:
                wastQty > 0
                  ? `Installed: ${formatNumber(instQty)} | Wastage: ${formatNumber(wastQty)} (Total: ${formatNumber(instQty + wastQty)})`
                  : `Installed: ${formatNumber(instQty)}`,
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

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        mode="select"
        siteId={selectedSiteId}
        title="Scan Barcode to Log Project Material Usage"
        subtitle="Scan via USB Gun or Mobile Camera — adds or increments item in Step 4"
        onSelectItem={(item) => {
          handleBarcodeScannedUsageItem(item);
        }}
      />
    </div>
  );
};
