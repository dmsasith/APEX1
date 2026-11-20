import React, { useState, useRef, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Upload,
  Download,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  FileSpreadsheet,
  MapPin,
  FileText,
  Building2,
  X,
  Layers,
  Filter,
  Settings,
  Package,
  FolderKanban,
  Users2,
  Info,
  AlertTriangle,
  Phone,
  Hash,
  GitBranch,
  FolderTree,
  Gift,
  CornerDownRight,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  Project,
  ProjectScope,
  ProjectType,
  ProjectTypeTemplateItem,
  SectionIndustryPreset,
  SectionCustomFieldDef,
  SectionCoreFieldLabels,
  isTelecomNewConnectionSection,
} from '../../types';
import { formatNumber } from '../../utils/exportUtils';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  COUNTRY_PHONE_RULES,
  enforceCountryPhoneInput,
  detectActivePhoneCountry,
  analyzeCountryPhone,
  matchCountryByDialPrefix,
} from '../../utils/phoneCountryUtils';
import { PhoneCountryBadge } from '../common/PhoneCountryBadge';
import {
  INDUSTRY_SECTION_PRESETS,
  inferSectionIndustryPreset,
  getEffectiveSectionCoreLabels,
  getEffectiveSectionCustomFields,
} from '../../utils/sectionTemplates';

export const ProjectsManagementView: React.FC = () => {
  const {
    sites,
    activeSites,
    activeProjects,
    activeProjectTypes,
    items,
    activeItems,
    projectUsages,
    addProject,
    bulkImportProjects,
    updateProject,
    softDeleteProject,
    addProjectType,
    updateProjectType,
    deleteProjectType,
    saveProjectTypeTemplate,
    activeClients,
    getProjectFreeStockList,
    config,
    currentTenant,
  } = useStock();

  const branchSites = useMemo(
    () => activeSites.filter((s) => !s.isMainWarehouse),
    [activeSites]
  );

  // Helper to resolve a project's effective Site Branch (including ALL_AREAS and legacy fallback by parent or district/name)
  const resolveProjectSite = (p?: Project): { siteId: string; siteName: string } => {
    if (!p) return { siteId: '', siteName: '' };
    if (p.siteId === 'ALL_AREAS' || (p.siteName && p.siteName.trim().toUpperCase() === 'ALL AREAS')) {
      return { siteId: 'ALL_AREAS', siteName: 'ALL AREAS' };
    }
    if (p.siteId) {
      const matched = sites.find((s) => s.id === p.siteId);
      return { siteId: p.siteId, siteName: matched?.name || p.siteName || '' };
    }
    if (p.parentProjectId) {
      const parent = activeProjects.find((mp) => mp.id === p.parentProjectId);
      if (parent?.siteId === 'ALL_AREAS' || (parent?.siteName && parent.siteName.trim().toUpperCase() === 'ALL AREAS')) {
        return { siteId: 'ALL_AREAS', siteName: 'ALL AREAS' };
      }
      if (parent?.siteId) {
        const matched = sites.find((s) => s.id === parent.siteId);
        return { siteId: parent.siteId, siteName: matched?.name || parent.siteName || '' };
      }
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
    return { siteId: '', siteName: p.siteName || '' };
  };

  const [activeTab, setActiveTab] = useState<'projects' | 'sections'>('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [siteBranchFilter, setSiteBranchFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'main' | 'sub' | 'individual'>('all');
  const [parentFilterId, setParentFilterId] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for Project
  const [projectScope, setProjectScope] = useState<ProjectScope>('individual');
  const [parentProjectId, setParentProjectId] = useState<string>('');
  const [assignedSiteId, setAssignedSiteId] = useState<string>('');
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<string>(
    () =>
      detectActivePhoneCountry({
        tenantCountry: currentTenant?.country,
        currencySymbol: config?.currencySymbol || currentTenant?.currencySymbol,
      }).name
  );
  const [siteIdentifier, setSiteIdentifier] = useState('');
  // Connection / Utility 6 core specific fields (Telecom NC, Water, Electric, Solar)
  const [ncNumber, setNcNumber] = useState('');
  const [ontSerialNo, setOntSerialNo] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [exchangeArea, setExchangeArea] = useState('');
  const [projectTypeId, setProjectTypeId] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [district, setDistrict] = useState('');
  const [subArea, setSubArea] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [inlineNewFieldLabel, setInlineNewFieldLabel] = useState('');
  const [inlineNewFieldValue, setInlineNewFieldValue] = useState('');
  const [formError, setFormError] = useState('');

  const selectedModalSection = useMemo(
    () => activeProjectTypes.find((pt) => pt.id === projectTypeId),
    [activeProjectTypes, projectTypeId]
  );
  const isModalNewConnection = useMemo(
    () => isTelecomNewConnectionSection(selectedModalSection, editingProject?.projectTypeName),
    [selectedModalSection, editingProject?.projectTypeName]
  );
  const activeModalCoreLabels = useMemo(
    () => getEffectiveSectionCoreLabels(selectedModalSection, editingProject?.projectTypeName),
    [selectedModalSection, editingProject?.projectTypeName]
  );
  const activeModalCustomFields = useMemo(
    () => getEffectiveSectionCustomFields(selectedModalSection, editingProject?.projectTypeName),
    [selectedModalSection, editingProject?.projectTypeName]
  );
  const activeModalPresetMeta = useMemo(
    () =>
      INDUSTRY_SECTION_PRESETS[
        inferSectionIndustryPreset(selectedModalSection, editingProject?.projectTypeName)
      ],
    [selectedModalSection, editingProject?.projectTypeName]
  );

  // Quick-add sub-projects when registering a new Major / Main Project
  const [initialSubProjects, setInitialSubProjects] = useState<
    Array<{ subName: string; siteId: string; subArea: string }>
  >([]);

  // Delete confirmation for Project
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<Project | null>(null);

  // Project Type Modal States
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<ProjectType | null>(null);
  const [sectionName, setSectionName] = useState('');
  const [sectionCode, setSectionCode] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  const [sectionColor, setSectionColor] = useState('emerald');
  const [sectionWorkflowMode, setSectionWorkflowMode] = useState<'standard' | 'new_connection'>('standard');
  const [sectionIndustryPreset, setSectionIndustryPreset] = useState<SectionIndustryPreset>('standard');
  const [sectionCoreLabels, setSectionCoreLabels] = useState<SectionCoreFieldLabels>(
    INDUSTRY_SECTION_PRESETS.telecom_nc.coreFieldLabels
  );
  const [sectionCustomFields, setSectionCustomFields] = useState<SectionCustomFieldDef[]>(
    INDUSTRY_SECTION_PRESETS.standard.defaultCustomFields
  );
  const [newCustomFieldLabel, setNewCustomFieldLabel] = useState('');
  const [newCustomFieldPlaceholder, setNewCustomFieldPlaceholder] = useState('');
  const [newCustomFieldRequired, setNewCustomFieldRequired] = useState(false);
  const [showEditCoreLabelsInSectionModal, setShowEditCoreLabelsInSectionModal] = useState(false);
  const [sectionError, setSectionError] = useState('');
  const [deleteConfirmSection, setDeleteConfirmSection] = useState<ProjectType | null>(null);

  // Material Template Modal States
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateSection, setTemplateSection] = useState<ProjectType | null>(null);
  const [templateRows, setTemplateRows] = useState<Array<{ itemId: string; suggestedQty: number | '' }>>([]);
  const [templateError, setTemplateError] = useState('');

  // Project Usages Details Modal
  const [viewingProjectUsages, setViewingProjectUsages] = useState<Project | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to resolve effective project scope
  const getEffectiveScope = (p: Project): ProjectScope => {
    if (p.parentProjectId || p.projectScope === 'sub') return 'sub';
    if (p.projectScope === 'main' || activeProjects.some((sp) => sp.parentProjectId === p.id)) return 'main';
    return 'individual';
  };

  // Lists of Main, Sub, and Individual Projects
  const mainProjects = useMemo(
    () => activeProjects.filter((p) => getEffectiveScope(p) === 'main'),
    [activeProjects]
  );
  const subProjectsList = useMemo(
    () => activeProjects.filter((p) => getEffectiveScope(p) === 'sub'),
    [activeProjects]
  );
  const individualProjects = useMemo(
    () => activeProjects.filter((p) => getEffectiveScope(p) === 'individual'),
    [activeProjects]
  );

  // Candidate parent projects strictly filtered to the selected section in the modal
  const selectableParentProjects = useMemo(
    () =>
      activeProjects
        .filter((p) => {
          if (p.parentProjectId || p.projectScope === 'sub') return false;
          if (p.ncNumber && getEffectiveScope(p) !== 'main') return false;
          if (editingProject && p.id === editingProject.id) return false;
          if (!projectTypeId) return true;
          if (p.projectTypeId) return p.projectTypeId === projectTypeId;
          const secObj = activeProjectTypes.find((pt) => pt.id === projectTypeId);
          if (p.projectTypeName && secObj) {
            return p.projectTypeName.trim().toLowerCase() === secObj.name.trim().toLowerCase();
          }
          return false;
        })
        .sort((a, b) => {
          const aMain = getEffectiveScope(a) === 'main' ? 1 : 0;
          const bMain = getEffectiveScope(b) === 'main' ? 1 : 0;
          return bMain - aMain;
        }),
    [activeProjects, editingProject, projectTypeId, activeProjectTypes]
  );

  // Distinct districts for filtering
  const districts = Array.from(
    new Set(activeProjects.map((p) => p.district).filter(Boolean))
  ).sort();

  const filteredProjects = useMemo(() => {
    const raw = activeProjects.filter((p) => {
      const q = searchQuery.toLowerCase();
      const resolvedSite = resolveProjectSite(p);
      const customMatches = p.customFieldValues
        ? Object.entries(p.customFieldValues).some(
            ([k, v]) => k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q)
          )
        : false;
      const matchesSearch =
        p.projectId.toLowerCase().includes(q) ||
        p.projectName.toLowerCase().includes(q) ||
        (p.parentProjectName && p.parentProjectName.toLowerCase().includes(q)) ||
        (p.parentProjectCode && p.parentProjectCode.toLowerCase().includes(q)) ||
        (p.customerName && p.customerName.toLowerCase().includes(q)) ||
        (p.customerPhone && p.customerPhone.toLowerCase().includes(q)) ||
        (p.siteIdentifier && p.siteIdentifier.toLowerCase().includes(q)) ||
        (p.ncNumber && p.ncNumber.toLowerCase().includes(q)) ||
        (p.ontSerialNo && p.ontSerialNo.toLowerCase().includes(q)) ||
        (p.customerAddress && p.customerAddress.toLowerCase().includes(q)) ||
        (p.exchangeArea && p.exchangeArea.toLowerCase().includes(q)) ||
        (p.projectTypeName && p.projectTypeName.toLowerCase().includes(q)) ||
        (p.referenceNo && p.referenceNo.toLowerCase().includes(q)) ||
        (p.district && p.district.toLowerCase().includes(q)) ||
        (p.subArea && p.subArea.toLowerCase().includes(q)) ||
        (resolvedSite.siteName && resolvedSite.siteName.toLowerCase().includes(q)) ||
        customMatches;

      const matchesSiteBranch =
        siteBranchFilter === 'all' ||
        resolvedSite.siteId === siteBranchFilter ||
        (siteBranchFilter !== 'ALL_AREAS' && resolvedSite.siteId === 'ALL_AREAS');
      const matchesDistrict = districtFilter === 'all' || p.district === districtFilter;
      const matchesSection =
        sectionFilter === 'all' ||
        p.projectTypeId === sectionFilter ||
        (getEffectiveScope(p) === 'main' &&
          activeProjects.some((c) => c.parentProjectId === p.id && c.projectTypeId === sectionFilter));
      const effScope = getEffectiveScope(p);
      const matchesScope = scopeFilter === 'all' || effScope === scopeFilter;
      const matchesParent =
        parentFilterId === 'all' || p.id === parentFilterId || p.parentProjectId === parentFilterId;

      return (
        matchesSearch &&
        matchesSiteBranch &&
        matchesDistrict &&
        matchesSection &&
        matchesScope &&
        matchesParent
      );
    });

    // Sort so Main Projects appear followed immediately by their Sub-Projects, then Individual Projects
    const result: Project[] = [];
    const visited = new Set<string>();

    // 1. Main projects and their children
    raw.forEach((p) => {
      if (getEffectiveScope(p) === 'main' && !visited.has(p.id)) {
        visited.add(p.id);
        result.push(p);
        raw
          .filter((child) => child.parentProjectId === p.id)
          .forEach((child) => {
            if (!visited.has(child.id)) {
              visited.add(child.id);
              result.push(child);
            }
          });
      }
    });

    // 2. Remaining projects (Individual or filtered Sub-Projects whose parent isn't in raw)
    raw.forEach((p) => {
      if (!visited.has(p.id)) {
        visited.add(p.id);
        result.push(p);
      }
    });

    return result;
  }, [activeProjects, searchQuery, siteBranchFilter, districtFilter, sectionFilter, scopeFilter, parentFilterId, branchSites, sites]);

  // Duplicate / existing project match check in modal
  const existingMatchesInModal = useMemo(() => {
    if (!showAddModal) return [];
    const cleanPhone = customerPhone.trim().toLowerCase();
    const cleanSiteId = (isModalNewConnection ? ncNumber : siteIdentifier).trim().toLowerCase();
    const cleanProjId = (isModalNewConnection ? ncNumber : projectId).trim().toLowerCase();
    const cleanName = (isModalNewConnection ? customerName : projectName).trim().toLowerCase();

    if (!cleanPhone && !cleanSiteId && !cleanProjId && !cleanName) return [];

    return activeProjects.filter((p) => {
      if (editingProject && p.id === editingProject.id) return false;
      const matchPhone = cleanPhone && p.customerPhone && p.customerPhone.trim().toLowerCase() === cleanPhone;
      const matchSiteId =
        cleanSiteId &&
        ((p.siteIdentifier && p.siteIdentifier.trim().toLowerCase() === cleanSiteId) ||
          (p.ncNumber && p.ncNumber.trim().toLowerCase() === cleanSiteId));
      const matchProjId = cleanProjId && p.projectId.trim().toLowerCase() === cleanProjId;
      const matchName = cleanName && p.projectName.trim().toLowerCase() === cleanName;
      return matchPhone || matchSiteId || matchProjId || matchName;
    });
  }, [showAddModal, isModalNewConnection, ncNumber, customerName, customerPhone, siteIdentifier, projectId, projectName, activeProjects, editingProject]);

  const getNextMainProjectSeq = () => {
    const year = new Date().getFullYear();
    const mainCount = activeProjects.filter((p) => getEffectiveScope(p) === 'main').length;
    return {
      projectId: `MAJ-${year}-${String(mainCount + 1).padStart(4, '0')}`,
      referenceNo: `REF-MAJ-${String(mainCount + 1).padStart(4, '0')}`,
    };
  };

  const getNextIndividualProjectSeq = () => {
    const year = new Date().getFullYear();
    const indCount = activeProjects.filter((p) => getEffectiveScope(p) === 'individual').length;
    return {
      projectId: `PRJ-${year}-${String(indCount + 1).padStart(4, '0')}`,
      referenceNo: `REF-${String(activeProjects.length + 1).padStart(4, '0')}`,
    };
  };

  const handleOpenAddModal = (
    defaultSectionId?: string,
    defaultScope: ProjectScope = 'individual',
    preselectedParent?: Project
  ) => {
    setEditingProject(null);
    setProjectScope(defaultScope);
    setInitialSubProjects([]);
    setCustomFieldValues({});
    setInlineNewFieldLabel('');
    setInlineNewFieldValue('');

    const defaultBranchId =
      siteBranchFilter !== 'all' ? siteBranchFilter : (branchSites[0]?.id || '');
    const defaultBranchObj = branchSites.find((b) => b.id === defaultBranchId);

    if (defaultScope === 'sub' && preselectedParent) {
      const existingSubsCount = activeProjects.filter((sp) => sp.parentProjectId === preselectedParent.id).length;
      const resolvedParentSite = resolveProjectSite(preselectedParent);
      const chosenBranchId = resolvedParentSite.siteId || defaultBranchId;
      const chosenBranchObj = branchSites.find((b) => b.id === chosenBranchId);

      setParentProjectId(preselectedParent.id);
      setAssignedSiteId(chosenBranchId);
      setProjectId(`${preselectedParent.projectId}-SUB-${String(existingSubsCount + 1).padStart(4, '0')}`);
      setProjectName('');
      setCustomerName(preselectedParent.customerName || '');
      setCustomerPhone(preselectedParent.customerPhone || '');
      setSiteIdentifier('');
      setProjectTypeId(preselectedParent.projectTypeId || defaultSectionId || activeProjectTypes[0]?.id || '');
      setReferenceNo(preselectedParent.referenceNo || `REF-${String(activeProjects.length + 1).padStart(4, '0')}`);
      setDistrict(preselectedParent.district || chosenBranchObj?.location || chosenBranchObj?.name || '');
      setSubArea('');
      setNcNumber('');
      setOntSerialNo('');
      setCustomerAddress('');
      setExchangeArea('');
      setCustomFieldValues(preselectedParent.customFieldValues ? { ...preselectedParent.customFieldValues } : {});
    } else if (defaultScope === 'main') {
      const nextMain = getNextMainProjectSeq();
      setParentProjectId('');
      setAssignedSiteId(defaultBranchId);
      setProjectId(nextMain.projectId);
      setProjectName('');
      setCustomerName('');
      setCustomerPhone('');
      setSiteIdentifier('');
      setNcNumber('');
      setOntSerialNo('');
      setCustomerAddress('');
      setExchangeArea('');
      const targetSec = defaultSectionId || (sectionFilter !== 'all' ? sectionFilter : (activeProjectTypes[0]?.id || ''));
      setProjectTypeId(targetSec);
      setReferenceNo(nextMain.referenceNo);
      setDistrict(defaultBranchObj?.location || defaultBranchObj?.name || '');
      setSubArea('');
    } else {
      const nextInd = getNextIndividualProjectSeq();
      setParentProjectId(mainProjects[0]?.id || '');
      setAssignedSiteId(defaultBranchId);
      setProjectId(nextInd.projectId);
      setProjectName('');
      setCustomerName('');
      setCustomerPhone('');
      setSiteIdentifier('');
      setNcNumber('');
      setOntSerialNo('');
      setCustomerAddress('');
      setExchangeArea('');
      const targetSec = defaultSectionId || (sectionFilter !== 'all' ? sectionFilter : (activeProjectTypes[0]?.id || ''));
      setProjectTypeId(targetSec);
      setReferenceNo(nextInd.referenceNo);
      setDistrict(defaultBranchObj?.location || defaultBranchObj?.name || '');
      setSubArea('');
    }

    setFormError('');
    setShowAddModal(true);
  };

  const handleParentProjectChange = (newParentId: string) => {
    setParentProjectId(newParentId);
    const parentObj = activeProjects.find((p) => p.id === newParentId);
    if (parentObj) {
      const resolvedParentSite = resolveProjectSite(parentObj);
      if (resolvedParentSite.siteId) {
        setAssignedSiteId(resolvedParentSite.siteId);
      }
      if (!editingProject) {
        const existingSubsCount = activeProjects.filter((sp) => sp.parentProjectId === parentObj.id).length;
        setProjectId(`${parentObj.projectId}-SUB-${String(existingSubsCount + 1).padStart(4, '0')}`);
        const currentTypeObj = activeProjectTypes.find((pt) => pt.id === projectTypeId);
        const currentIsNc = isTelecomNewConnectionSection(currentTypeObj);
        if (parentObj.projectTypeId && !currentIsNc) {
          setProjectTypeId(parentObj.projectTypeId);
        }
        if (parentObj.customerName && !currentIsNc) setCustomerName(parentObj.customerName);
        if (parentObj.district) setDistrict(parentObj.district);
        if (parentObj.referenceNo && !currentIsNc) setReferenceNo(parentObj.referenceNo);
        if (parentObj.customFieldValues && !currentIsNc) setCustomFieldValues({ ...parentObj.customFieldValues });
      }
    }
  };

  const handleOpenEditModal = (p: Project) => {
    setEditingProject(p);
    const effScope = getEffectiveScope(p);
    const resolvedSite = resolveProjectSite(p);
    setProjectScope(effScope);
    setParentProjectId(p.parentProjectId || '');
    setAssignedSiteId(resolvedSite.siteId || branchSites[0]?.id || '');
    setProjectId(p.projectId);
    setProjectName(p.projectName);
    setCustomerName(p.customerName || p.projectName || '');
    setCustomerPhone(p.customerPhone || '');
    setSiteIdentifier(p.siteIdentifier || '');
    setNcNumber(p.ncNumber || p.siteIdentifier || p.projectId || '');
    setOntSerialNo(p.ontSerialNo || p.referenceNo || '');
    setCustomerAddress(p.customerAddress || '');
    setExchangeArea(p.exchangeArea || p.subArea || '');
    setProjectTypeId(p.projectTypeId || '');
    setReferenceNo(p.referenceNo || '');
    setDistrict(p.district || '');
    setSubArea(p.subArea || '');
    setCustomFieldValues(p.customFieldValues ? { ...p.customFieldValues } : {});
    setInlineNewFieldLabel('');
    setInlineNewFieldValue('');
    setInitialSubProjects([]);
    setFormError('');
    setShowAddModal(true);
  };

  const handleAddInlineCustomFieldToSection = () => {
    const cleanLabel = inlineNewFieldLabel.trim();
    if (!cleanLabel) return;
    if (selectedModalSection) {
      const currentFields = getEffectiveSectionCustomFields(selectedModalSection, editingProject?.projectTypeName);
      if (!currentFields.some((f) => f.label.trim().toLowerCase() === cleanLabel.toLowerCase())) {
        const nextField: SectionCustomFieldDef = {
          id: `cf-${Date.now()}`,
          label: cleanLabel,
          placeholder: inlineNewFieldValue.trim() ? `e.g. ${inlineNewFieldValue.trim()}` : `Enter ${cleanLabel}`,
          required: false,
        };
        updateProjectType(selectedModalSection.id, {
          customFields: [...currentFields, nextField],
        });
      }
    }
    if (inlineNewFieldValue.trim()) {
      setCustomFieldValues((prev) => ({
        ...prev,
        [cleanLabel]: inlineNewFieldValue.trim(),
      }));
    } else {
      setCustomFieldValues((prev) => ({
        ...prev,
        [cleanLabel]: prev[cleanLabel] || '',
      }));
    }
    setInlineNewFieldLabel('');
    setInlineNewFieldValue('');
    showToast(`Added field "${cleanLabel}" to section template.`);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const selectedTypeObj = activeProjectTypes.find((pt) => pt.id === projectTypeId);
    const pTypeName = selectedTypeObj ? selectedTypeObj.name : '';
    const isNcMode = isTelecomNewConnectionSection(selectedTypeObj, editingProject?.projectTypeName);
    const isAllAreasBranch = assignedSiteId === 'ALL_AREAS';
    const selectedBranchObj = isAllAreasBranch
      ? undefined
      : sites.find((s) => s.id === assignedSiteId) || branchSites[0];
    const resolvedBranchId = isAllAreasBranch ? 'ALL_AREAS' : selectedBranchObj?.id || undefined;
    const resolvedBranchName = isAllAreasBranch ? 'ALL AREAS' : selectedBranchObj?.name || undefined;
    const effCoreLabels = getEffectiveSectionCoreLabels(selectedTypeObj, editingProject?.projectTypeName);
    const effCustomFields = getEffectiveSectionCustomFields(selectedTypeObj, editingProject?.projectTypeName);

    // Build cleaned customFieldValues map (also include any pending inline field if typed)
    const cleanedCustomValues: Record<string, string> = {};
    Object.entries(customFieldValues).forEach(([k, v]) => {
      if (k.trim() && String(v || '').trim()) {
        cleanedCustomValues[k.trim()] = String(v).trim();
      }
    });
    if (inlineNewFieldLabel.trim() && inlineNewFieldValue.trim()) {
      cleanedCustomValues[inlineNewFieldLabel.trim()] = inlineNewFieldValue.trim();
    }

    // Validate required custom fields
    for (const cf of effCustomFields) {
      if (cf.required && !cleanedCustomValues[cf.label]?.trim()) {
        setFormError(`Please enter a value for required field "${cf.label}".`);
        return;
      }
    }

    const finalCustomFieldValues =
      Object.keys(cleanedCustomValues).length > 0 ? cleanedCustomValues : undefined;

    if (isNcMode && projectScope !== 'main') {
      if (!ncNumber.trim() || !customerName.trim()) {
        setFormError(`${effCoreLabels.primaryIdLabel} and ${effCoreLabels.customerNameLabel} are required.`);
        return;
      }
      if (projectScope === 'sub' && !parentProjectId) {
        setFormError('Please select the Parent Major / Main Project for this New Connection.');
        return;
      }
      if (customerPhone.trim()) {
        const mobileCheck = analyzeCountryPhone(customerPhone, {
          tenantCountry: phoneCountry || currentTenant?.country,
          currencySymbol: config?.currencySymbol || currentTenant?.currencySymbol,
        });
        if (!mobileCheck.isValid) {
          setFormError(
            mobileCheck.error ||
              `${effCoreLabels.mobileLabel} requires ${mobileCheck.expectedTotalDigits} digits for ${mobileCheck.country.name} (${mobileCheck.country.dialCode}).`
          );
          return;
        }
      }
      const cleanNcNo = ncNumber.trim().toUpperCase();
      const cleanCustName = customerName.trim();
      const cleanOnt = ontSerialNo.trim();
      const cleanAddr = customerAddress.trim();
      const cleanMobile = customerPhone.trim();
      const cleanExch = exchangeArea.trim();

      const ncParentObj =
        projectScope === 'sub' ? activeProjects.find((p) => p.id === parentProjectId) : undefined;

      if (projectScope === 'sub' && ncParentObj) {
        const parentUpdates: Partial<Project> = {};
        if (ncParentObj.projectScope !== 'main') {
          parentUpdates.projectScope = 'main';
        }
        if (!ncParentObj.siteId && resolvedBranchId) {
          parentUpdates.siteId = resolvedBranchId;
          parentUpdates.siteName = resolvedBranchName;
        }
        if (Object.keys(parentUpdates).length > 0) {
          updateProject(ncParentObj.id, parentUpdates);
        }
      }

      const finalNcScope: 'individual' | 'sub' = projectScope === 'sub' && ncParentObj ? 'sub' : 'individual';

      if (editingProject) {
        updateProject(editingProject.id, {
          projectId: cleanNcNo,
          projectName: cleanCustName,
          projectScope: finalNcScope,
          parentProjectId: finalNcScope === 'sub' ? ncParentObj?.id : undefined,
          parentProjectCode: finalNcScope === 'sub' ? ncParentObj?.projectId : undefined,
          parentProjectName: finalNcScope === 'sub' ? ncParentObj?.projectName : undefined,
          siteId: resolvedBranchId,
          siteName: resolvedBranchName,
          customerName: cleanCustName,
          customerPhone: cleanMobile || undefined,
          siteIdentifier: cleanNcNo,
          ncNumber: cleanNcNo,
          ontSerialNo: cleanOnt || undefined,
          customerAddress: cleanAddr || undefined,
          exchangeArea: cleanExch || undefined,
          projectTypeId: projectTypeId || undefined,
          projectTypeName: pTypeName || 'Telecom New Connection',
          referenceNo: cleanOnt || referenceNo.trim() || cleanNcNo,
          district:
            (isAllAreasBranch ? cleanExch || district.trim() || 'ALL AREAS' : selectedBranchObj?.location || selectedBranchObj?.name || district.trim() || cleanExch || ''),
          subArea: cleanExch || subArea.trim(),
          customFieldValues: finalCustomFieldValues,
        });
        showToast(
          `${pTypeName || 'Connection'} "${cleanNcNo} — ${cleanCustName}" updated${
            finalNcScope === 'sub' && ncParentObj ? ` under Main Project [${ncParentObj.projectId}]` : ''
          }.`
        );
      } else {
        addProject({
          projectId: cleanNcNo,
          projectName: cleanCustName,
          projectScope: finalNcScope,
          parentProjectId: finalNcScope === 'sub' ? ncParentObj?.id : undefined,
          parentProjectCode: finalNcScope === 'sub' ? ncParentObj?.projectId : undefined,
          parentProjectName: finalNcScope === 'sub' ? ncParentObj?.projectName : undefined,
          siteId: resolvedBranchId,
          siteName: resolvedBranchName,
          customerName: cleanCustName,
          customerPhone: cleanMobile || undefined,
          siteIdentifier: cleanNcNo,
          ncNumber: cleanNcNo,
          ontSerialNo: cleanOnt || undefined,
          customerAddress: cleanAddr || undefined,
          exchangeArea: cleanExch || undefined,
          projectTypeId: projectTypeId || undefined,
          projectTypeName: pTypeName || 'Telecom New Connection',
          referenceNo: cleanOnt || cleanNcNo,
          district:
            (isAllAreasBranch ? cleanExch || 'ALL AREAS' : selectedBranchObj?.location || selectedBranchObj?.name || cleanExch || 'General'),
          subArea: cleanExch || 'Exchange Area',
          customFieldValues: finalCustomFieldValues,
          status: 'Active',
        });
        showToast(
          `${pTypeName || 'Connection'} "${cleanNcNo} — ${cleanCustName}" registered${
            finalNcScope === 'sub' && ncParentObj ? ` under Main Project [${ncParentObj.projectId}]` : ''
          }.`
        );
      }

      setShowAddModal(false);
      return;
    }

    if (!projectId.trim() || !projectName.trim()) {
      setFormError('Project ID and Project Name are required.');
      return;
    }

    if (branchSites.length > 0 && !assignedSiteId) {
      setFormError('Please select the Assigned Site Branch (or ALL AREAS) for this project.');
      return;
    }

    if (projectScope === 'sub' && !parentProjectId) {
      setFormError('Please select the Parent Major / Main Project for this Sub-Project.');
      return;
    }

    if (customerPhone.trim()) {
      const mobileCheck = analyzeCountryPhone(customerPhone, {
        tenantCountry: phoneCountry || currentTenant?.country,
        currencySymbol: config?.currencySymbol || currentTenant?.currencySymbol,
      });
      if (!mobileCheck.isValid) {
        setFormError(
          mobileCheck.error ||
            `Customer Phone requires ${mobileCheck.expectedTotalDigits} digits for ${mobileCheck.country.name} (${mobileCheck.country.dialCode}).`
        );
        return;
      }
    }

    const parentObj =
      projectScope === 'sub' ? activeProjects.find((p) => p.id === parentProjectId) : undefined;

    // If user linked a Sub-Project to an existing Individual project, promote that parent to 'main'
    // Also ensure the parent project has the assignedSiteId if it was missing
    if (projectScope === 'sub' && parentObj) {
      const parentUpdates: Partial<Project> = {};
      if (parentObj.projectScope !== 'main') {
        parentUpdates.projectScope = 'main';
      }
      if (!parentObj.siteId && resolvedBranchId) {
        parentUpdates.siteId = resolvedBranchId;
        parentUpdates.siteName = resolvedBranchName;
      }
      if (Object.keys(parentUpdates).length > 0) {
        updateProject(parentObj.id, parentUpdates);
      }
    }

    if (editingProject) {
      updateProject(editingProject.id, {
        projectId: projectId.trim().toUpperCase(),
        projectName: projectName.trim(),
        projectScope,
        parentProjectId: projectScope === 'sub' ? parentObj?.id : undefined,
        parentProjectCode: projectScope === 'sub' ? parentObj?.projectId : undefined,
        parentProjectName: projectScope === 'sub' ? parentObj?.projectName : undefined,
        siteId: resolvedBranchId,
        siteName: resolvedBranchName,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        siteIdentifier: siteIdentifier.trim().toUpperCase() || undefined,
        projectTypeId: projectTypeId || undefined,
        projectTypeName: pTypeName || undefined,
        referenceNo: referenceNo.trim(),
        district:
          district.trim() ||
          (isAllAreasBranch ? 'ALL AREAS' : selectedBranchObj?.location || selectedBranchObj?.name || ''),
        subArea: subArea.trim(),
        customFieldValues: finalCustomFieldValues,
      });

      // If this is a Main Project, sync the assigned Site Branch to child Sub-Projects (if specific branch, or if child has no branch)
      if (projectScope === 'main' && resolvedBranchId) {
        activeProjects
          .filter((sp) => sp.parentProjectId === editingProject.id)
          .forEach((sp) => {
            if (!isAllAreasBranch || !sp.siteId) {
              updateProject(sp.id, {
                siteId: resolvedBranchId,
                siteName: resolvedBranchName,
              });
            }
          });
      }

      showToast(`Project "${projectName}" updated successfully (Assigned Branch: ${resolvedBranchName || 'Updated'}).`);
    } else {
      const createdMainOrProj = addProject({
        projectId: projectId.trim().toUpperCase(),
        projectName: projectName.trim(),
        projectScope,
        parentProjectId: projectScope === 'sub' ? parentObj?.id : undefined,
        parentProjectCode: projectScope === 'sub' ? parentObj?.projectId : undefined,
        parentProjectName: projectScope === 'sub' ? parentObj?.projectName : undefined,
        siteId: resolvedBranchId,
        siteName: resolvedBranchName,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        siteIdentifier: siteIdentifier.trim().toUpperCase() || undefined,
        projectTypeId: projectTypeId || undefined,
        projectTypeName: pTypeName || undefined,
        referenceNo: referenceNo.trim(),
        district:
          district.trim() ||
          (isAllAreasBranch ? 'ALL AREAS' : selectedBranchObj?.location || selectedBranchObj?.name || ''),
        subArea: subArea.trim(),
        customFieldValues: finalCustomFieldValues,
        status: 'Active',
      });

      // If creating a Major / Main Project and user added quick initial Sub-Projects, register them too!
      let createdSubCount = 0;
      if (projectScope === 'main' && initialSubProjects.length > 0) {
        initialSubProjects.forEach((sp, idx) => {
          if (!sp.subName.trim()) return;
          createdSubCount++;
          const subCode = `${createdMainOrProj.projectId}-SUB-${String(idx + 1).padStart(4, '0')}`;
          addProject({
            projectId: subCode,
            projectName: sp.subName.trim(),
            projectScope: 'sub',
            parentProjectId: createdMainOrProj.id,
            parentProjectCode: createdMainOrProj.projectId,
            parentProjectName: createdMainOrProj.projectName,
            siteId: resolvedBranchId,
            siteName: resolvedBranchName,
            customerName: customerName.trim() || undefined,
            customerPhone: customerPhone.trim() || undefined,
            siteIdentifier: sp.siteId.trim().toUpperCase() || undefined,
            projectTypeId: projectTypeId || undefined,
            projectTypeName: pTypeName || undefined,
            referenceNo: referenceNo.trim(),
            district:
              district.trim() ||
              (isAllAreasBranch ? 'ALL AREAS' : selectedBranchObj?.location || selectedBranchObj?.name || ''),
            subArea: sp.subArea.trim() || subArea.trim(),
            customFieldValues: finalCustomFieldValues,
            status: 'Active',
          });
        });
      }

      if (projectScope === 'main' && createdSubCount > 0) {
        showToast(
          `Major Project "${projectName}" and ${createdSubCount} Sub-Project(s) registered under ${selectedBranchObj?.name || 'Site Branch'}!`
        );
      } else if (projectScope === 'sub' && parentObj) {
        showToast(
          `Sub-Project "${projectName}" registered under Main Project "${parentObj.projectName}" (${selectedBranchObj?.name || 'Site Branch'}).`
        );
      } else {
        showToast(`Project "${projectName}" registered under ${selectedBranchObj?.name || 'Site Branch'} successfully.`);
      }
    }

    setShowAddModal(false);
  };

  // Apply an international industry section preset inside the Create/Edit Section modal
  const applySectionIndustryPreset = (
    presetKey: SectionIndustryPreset,
    preserveExistingIdentity = false
  ) => {
    const preset = INDUSTRY_SECTION_PRESETS[presetKey] || INDUSTRY_SECTION_PRESETS.standard;
    setSectionIndustryPreset(presetKey);
    setSectionWorkflowMode(preset.defaultWorkflowMode);
    setSectionCoreLabels({ ...preset.coreFieldLabels });
    setSectionCustomFields(preset.defaultCustomFields.map((f) => ({ ...f })));
    if (!preserveExistingIdentity) {
      setSectionName(
        presetKey === 'standard' ? '' : preset.defaultSectionName
      );
      setSectionCode(
        presetKey === 'standard'
          ? `SEC-${String(activeProjectTypes.length + 1).padStart(4, '0')}`
          : preset.defaultCode
      );
      setSectionDescription(preset.defaultDescription);
      setSectionColor(preset.defaultColor);
    }
  };

  // Section / Type Handlers
  const handleOpenAddSectionModal = (
    presetMode: SectionIndustryPreset | 'new_connection' = 'standard'
  ) => {
    setEditingSection(null);
    const resolvedPreset: SectionIndustryPreset =
      presetMode === 'new_connection' ? 'telecom_nc' : presetMode;
    applySectionIndustryPreset(resolvedPreset, false);
    setNewCustomFieldLabel('');
    setNewCustomFieldPlaceholder('');
    setNewCustomFieldRequired(false);
    setShowEditCoreLabelsInSectionModal(false);
    setSectionError('');
    setShowSectionModal(true);
  };

  const handleOpenEditSectionModal = (pt: ProjectType) => {
    setEditingSection(pt);
    const inferredPreset = inferSectionIndustryPreset(pt);
    setSectionName(pt.name);
    setSectionCode(pt.code || '');
    setSectionDescription(pt.description || '');
    setSectionColor(pt.color || 'emerald');
    setSectionIndustryPreset(inferredPreset);
    setSectionWorkflowMode(isTelecomNewConnectionSection(pt) ? 'new_connection' : 'standard');
    setSectionCoreLabels({ ...getEffectiveSectionCoreLabels(pt) });
    setSectionCustomFields(getEffectiveSectionCustomFields(pt).map((f) => ({ ...f })));
    setNewCustomFieldLabel('');
    setNewCustomFieldPlaceholder('');
    setNewCustomFieldRequired(false);
    setShowEditCoreLabelsInSectionModal(false);
    setSectionError('');
    setShowSectionModal(true);
  };

  const handleAddFieldToSectionModal = () => {
    const cleanLabel = newCustomFieldLabel.trim();
    if (!cleanLabel) {
      setSectionError('Please enter a Field Name / Label before clicking "+ Add Field".');
      return;
    }
    if (sectionCustomFields.some((f) => f.label.trim().toLowerCase() === cleanLabel.toLowerCase())) {
      setSectionError(`Field "${cleanLabel}" is already in this section's field list.`);
      return;
    }
    setSectionError('');
    const newField: SectionCustomFieldDef = {
      id: `cf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: cleanLabel,
      placeholder: newCustomFieldPlaceholder.trim() || `Enter ${cleanLabel}`,
      required: newCustomFieldRequired,
    };
    setSectionCustomFields((prev) => [...prev, newField]);
    setNewCustomFieldLabel('');
    setNewCustomFieldPlaceholder('');
    setNewCustomFieldRequired(false);
  };

  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    setSectionError('');

    if (!sectionName.trim()) {
      setSectionError('Please provide a section name.');
      return;
    }

    // If user typed a field name into the "+ Add Field" input box and didn't click "+ Add Field" yet, include it automatically
    let finalCustomFields = [...sectionCustomFields];
    if (newCustomFieldLabel.trim()) {
      const cleanLabel = newCustomFieldLabel.trim();
      if (!finalCustomFields.some((f) => f.label.trim().toLowerCase() === cleanLabel.toLowerCase())) {
        finalCustomFields.push({
          id: `cf-${Date.now()}`,
          label: cleanLabel,
          placeholder: newCustomFieldPlaceholder.trim() || `Enter ${cleanLabel}`,
          required: newCustomFieldRequired,
        });
      }
    }

    if (editingSection) {
      updateProjectType(editingSection.id, {
        name: sectionName.trim(),
        code: sectionCode.trim().toUpperCase() || undefined,
        description: sectionDescription.trim() || undefined,
        color: sectionColor,
        workflowMode: sectionWorkflowMode,
        industryPreset: sectionIndustryPreset,
        coreFieldLabels: sectionCoreLabels,
        customFields: finalCustomFields,
      });
      showToast(
        `Project Section "${sectionName}" updated with ${finalCustomFields.length} custom/international field(s).`
      );
    } else {
      addProjectType({
        name: sectionName.trim(),
        code: sectionCode.trim().toUpperCase() || undefined,
        description: sectionDescription.trim() || undefined,
        color: sectionColor,
        workflowMode: sectionWorkflowMode,
        industryPreset: sectionIndustryPreset,
        coreFieldLabels: sectionCoreLabels,
        customFields: finalCustomFields,
        templateItems: [],
      });
      showToast(
        `Project Section "${sectionName}" created with ${finalCustomFields.length} custom/international field(s).`
      );
    }

    setShowSectionModal(false);
  };

  // Material Template Handlers
  const handleOpenTemplateModal = (pt: ProjectType) => {
    setTemplateSection(pt);
    setTemplateError('');
    const existing: Array<{ itemId: string; suggestedQty: number | '' }> = (pt.templateItems || []).map((t) => ({
      itemId: t.itemId,
      suggestedQty: typeof t.suggestedQty === 'number' ? t.suggestedQty : '',
    }));
    setTemplateRows(existing.length > 0 ? existing : [{ itemId: activeItems[0]?.id || '', suggestedQty: '' }]);
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateSection) return;

    const validItems: ProjectTypeTemplateItem[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < templateRows.length; i++) {
      const r = templateRows[i];
      if (!r.itemId) continue;
      if (seen.has(r.itemId)) {
        setTemplateError(`Duplicate items detected in template. Please combine rows.`);
        return;
      }
      seen.add(r.itemId);
      validItems.push({
        itemId: r.itemId,
        suggestedQty: Number(r.suggestedQty) > 0 ? Number(r.suggestedQty) : undefined,
      });
    }

    saveProjectTypeTemplate(templateSection.id, validItems);
    showToast(`Saved ${validItems.length} template item(s) for section "${templateSection.name}".`);
    setShowTemplateModal(false);
  };

  // Download Sample CSV Template
  const handleDownloadSampleCsv = () => {
    const csvContent =
      'Project ID,Project Name,Section Name,Reference No,District,Sub Area,Scope (individual/main/sub),Parent Project ID\n' +
      'MAJ-2026-100,Kandy District Fiber Rollout Phase 1,Telecom Cable Development,REF-MAJ-8800,Kandy,Kandy Metro,main,\n' +
      'MAJ-2026-100-SUB-01,Peradeniya Feeder Sector A,Telecom Cable Development,REF-MAJ-8800,Kandy,Peradeniya,sub,MAJ-2026-100\n' +
      'MAJ-2026-100-SUB-02,Katugastota Spur Sector B,Telecom Cable Development,REF-MAJ-8800,Kandy,Katugastota,sub,MAJ-2026-100\n' +
      'PRJ-2026-104,Dehiwala Standalone Rectification,Maintenance & Fault Rectification,REF-MDC-9210,Colombo,Dehiwala Base,individual,';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Project_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export current projects to CSV
  const handleExportProjectsCsv = () => {
    if (activeProjects.length === 0) {
      showToast('No projects available to export.');
      return;
    }

    const headers = [
      'Project ID',
      'Project Name',
      'Structure Type',
      'Parent Main Project',
      'Section / Type',
      'Reference No',
      'District',
      'Sub Area',
      'Created Date',
    ];
    const rows = activeProjects.map((p) => {
      const effScope = getEffectiveScope(p);
      return [
        `"${p.projectId}"`,
        `"${p.projectName.replace(/"/g, '""')}"`,
        `"${effScope === 'main' ? 'Major / Main Project' : effScope === 'sub' ? 'Sub-Project' : 'Individual Project'}"`,
        `"${(p.parentProjectName || p.parentProjectCode || '').replace(/"/g, '""')}"`,
        `"${(p.projectTypeName || 'Standard').replace(/"/g, '""')}"`,
        `"${(p.referenceNo || '').replace(/"/g, '""')}"`,
        `"${(p.district || '').replace(/"/g, '""')}"`,
        `"${(p.subArea || '').replace(/"/g, '""')}"`,
        `"${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Projects_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import from CSV
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length <= 1) {
        showToast('CSV file appears empty or only contains a header.');
        return;
      }

      const headerLine = lines[0].toLowerCase();
      const hasExpectedCols =
        headerLine.includes('project id') || headerLine.includes('project name');

      const parsedRows: Array<Omit<Project, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>> = [];
      const startIndex = hasExpectedCols ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const rawLine = lines[i];
        const cols: string[] = [];
        let curr = '';
        let inQuotes = false;

        for (let c = 0; c < rawLine.length; c++) {
          const char = rawLine[c];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cols.push(curr.trim());
            curr = '';
          } else {
            curr += char;
          }
        }
        cols.push(curr.trim());

        const pId = (cols[0] || '').replace(/^"|"$/g, '').trim();
        const pName = (cols[1] || '').replace(/^"|"$/g, '').trim();
        const pSectionName = (cols[2] || '').replace(/^"|"$/g, '').trim();
        const pRef = (cols[3] || '').replace(/^"|"$/g, '').trim();
        const pDist = (cols[4] || '').replace(/^"|"$/g, '').trim();
        const pSub = (cols[5] || '').replace(/^"|"$/g, '').trim();
        const pScopeRaw = (cols[6] || '').replace(/^"|"$/g, '').trim().toLowerCase();
        const pParentCode = (cols[7] || '').replace(/^"|"$/g, '').trim().toUpperCase();

        if (pId && pName) {
          const matchType = activeProjectTypes.find(
            (pt) => pt.name.toLowerCase() === pSectionName.toLowerCase()
          );
          const scopeVal: ProjectScope =
            pScopeRaw === 'main' ? 'main' : pScopeRaw === 'sub' ? 'sub' : 'individual';
          const matchedParent = pParentCode
            ? activeProjects.find((ap) => ap.projectId.toUpperCase() === pParentCode)
            : undefined;

          parsedRows.push({
            projectId: pId.toUpperCase(),
            projectName: pName,
            projectScope: scopeVal,
            parentProjectId: matchedParent?.id,
            parentProjectCode: matchedParent?.projectId || (pParentCode || undefined),
            parentProjectName: matchedParent?.projectName,
            projectTypeId: matchType?.id,
            projectTypeName: matchType?.name || (pSectionName || undefined),
            referenceNo: pRef,
            district: pDist,
            subArea: pSub,
            status: 'Active',
          });
        }
      }

      if (parsedRows.length === 0) {
        showToast('Could not find valid project rows. Please check template format.');
        return;
      }

      const result = bulkImportProjects(parsedRows);
      showToast(`Imported ${result.added} new projects, updated ${result.updated} existing.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  const getColorBadge = (color?: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'teal':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'indigo':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Calculate project usage & Sub-Project breakdown for modal
  const viewingEffectiveScope = viewingProjectUsages ? getEffectiveScope(viewingProjectUsages) : 'individual';
  const viewingChildSubProjects = useMemo(() => {
    if (!viewingProjectUsages) return [];
    return activeProjects.filter((sp) => sp.parentProjectId === viewingProjectUsages.id);
  }, [viewingProjectUsages, activeProjects]);

  const projectUsagesForModal = useMemo(() => {
    if (!viewingProjectUsages) return [];
    const familyIds = new Set<string>([
      viewingProjectUsages.id,
      ...viewingChildSubProjects.map((sp) => sp.id),
    ]);
    return projectUsages.filter(
      (pu) => !pu.isDeleted && (familyIds.has(pu.projectId) || pu.parentProjectId === viewingProjectUsages.id)
    );
  }, [viewingProjectUsages, viewingChildSubProjects, projectUsages]);

  const modalFreeStockList = useMemo(() => {
    if (!viewingProjectUsages) return [];
    return getProjectFreeStockList(viewingProjectUsages.id);
  }, [viewingProjectUsages, getProjectFreeStockList]);

  const subProjectSummaryForModal = useMemo(() => {
    if (!viewingProjectUsages || viewingChildSubProjects.length === 0) return [];
    return viewingChildSubProjects.map((sp) => {
      const spUsages = projectUsages.filter((pu) => !pu.isDeleted && pu.projectId === sp.id);
      const itemsMap = new Map<string, number>();
      spUsages.forEach((u) => {
        u.items.forEach((row) => {
          itemsMap.set(
            row.itemId,
            (itemsMap.get(row.itemId) || 0) + Number(row.quantity || 0) + Number(row.wastageQuantity || 0)
          );
        });
      });
      return {
        subProject: sp,
        voucherCount: spUsages.length,
        itemsMap,
      };
    });
  }, [viewingProjectUsages, viewingChildSubProjects, projectUsages]);

  const teamUsageSummary = useMemo(() => {
    if (!viewingProjectUsages) return [];
    const map = new Map<string, { teamName: string; voucherCount: number; itemsMap: Map<string, number> }>();

    projectUsagesForModal.forEach((pu) => {
      const tId = pu.teamId || 'unknown';
      const existing = map.get(tId) || {
        teamName: pu.teamName || 'Unknown Team',
        voucherCount: 0,
        itemsMap: new Map<string, number>(),
      };
      existing.voucherCount++;
      pu.items.forEach((row) => {
        const curQty = existing.itemsMap.get(row.itemId) || 0;
        existing.itemsMap.set(
          row.itemId,
          curQty + Number(row.quantity || 0) + Number(row.wastageQuantity || 0)
        );
      });
      map.set(tId, existing);
    });

    return Array.from(map.values());
  }, [viewingProjectUsages, projectUsagesForModal]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-800 text-white px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-200 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold tracking-wider uppercase">
              <span>Infrastructure Projects</span>
              <span aria-hidden="true" className="text-emerald-400/50">·</span>
              <span className="text-emerald-200">Main Projects, Sub-Projects & Standalone Registry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Project Registry & New Section Registry
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Manage <strong>Major / Main Projects</strong> (with shared Client Free Stock pools), linked <strong>Sub-Projects</strong> (for granular field usage tracking), and <strong>Individual Projects</strong> alongside custom BOM templates.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadSampleCsv}
              className="px-3 py-2.5 bg-slate-800/85 hover:bg-slate-700/90 text-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-600/80 shadow-sm whitespace-nowrap cursor-pointer"
              title="Download CSV Template with sample format"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sample CSV</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/90 shadow-sm cursor-pointer whitespace-nowrap"
              title="Import projects from CSV file"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Import CSV</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv"
              onChange={handleCsvFileUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={handleExportProjectsCsv}
              className="px-3 py-2.5 bg-slate-800/85 hover:bg-slate-700/90 text-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-600/80 shadow-sm whitespace-nowrap cursor-pointer"
              title="Export project catalog to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('sections');
                handleOpenAddSectionModal();
              }}
              className="px-3.5 py-2.5 bg-slate-950/80 hover:bg-slate-800 text-white border border-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>+ New Section Registry</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAddModal(undefined, 'main')}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/25 cursor-pointer whitespace-nowrap"
              title="Register a Major Umbrella Project that holds multiple Sub-Projects and receives bulk Client Free Stock"
            >
              <FolderTree className="w-4 h-4 text-indigo-100" />
              <span>+ Main Project</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAddModal(undefined, 'individual')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/25 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Register Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'projects'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Project Master List ({activeProjects.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'sections'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>New Section Registry & Material Templates ({activeProjectTypes.length})</span>
        </button>
      </div>

      {/* TAB 1: PROJECTS MASTER LIST */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {/* Project Hierarchy & Free Stock Pool Architecture Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              onClick={() => {
                setScopeFilter(scopeFilter === 'main' ? 'all' : 'main');
                setParentFilterId('all');
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                scopeFilter === 'main'
                  ? 'bg-indigo-950 text-white border-indigo-800 shadow-md ring-2 ring-indigo-500/30'
                  : 'bg-white hover:border-indigo-300 text-slate-900 border-slate-200 shadow-2xs'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-600 border border-indigo-300/50">
                    🏢 Major / Main Projects
                  </span>
                </div>
                <div className="text-xl font-black font-mono tabular-nums mt-1">
                  {mainProjects.length}
                </div>
                <p className={`text-[11px] leading-relaxed ${scopeFilter === 'main' ? 'text-indigo-200' : 'text-slate-500'}`}>
                  Umbrella projects where Client Free Stock is received in bulk and shared across linked Sub-Projects.
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenAddModal(undefined, 'main');
                }}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>New Main</span>
              </button>
            </div>

            <div
              onClick={() => {
                setScopeFilter(scopeFilter === 'sub' ? 'all' : 'sub');
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                scopeFilter === 'sub'
                  ? 'bg-teal-950 text-white border-teal-800 shadow-md ring-2 ring-teal-500/30'
                  : 'bg-white hover:border-teal-300 text-slate-900 border-slate-200 shadow-2xs'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/20 text-teal-700 border border-teal-300/50">
                    ↳ Sub-Projects (Under Main)
                  </span>
                </div>
                <div className="text-xl font-black font-mono tabular-nums mt-1">
                  {subProjectsList.length}
                </div>
                <p className={`text-[11px] leading-relaxed ${scopeFilter === 'sub' ? 'text-teal-200' : 'text-slate-500'}`}>
                  Field work orders under a Main Project. Material usage auto-deducts from the Main Project&apos;s stock pool.
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenAddModal(undefined, 'sub', mainProjects[0]);
                }}
                className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-[11px] font-bold shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>New Sub</span>
              </button>
            </div>

            <div
              onClick={() => {
                setScopeFilter(scopeFilter === 'individual' ? 'all' : 'individual');
                setParentFilterId('all');
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                scopeFilter === 'individual'
                  ? 'bg-slate-900 text-white border-slate-800 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-white hover:border-emerald-300 text-slate-900 border-slate-200 shadow-2xs'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-700 border border-emerald-300/50">
                    📄 Individual Projects
                  </span>
                </div>
                <div className="text-xl font-black font-mono tabular-nums mt-1">
                  {individualProjects.length}
                </div>
                <p className={`text-[11px] leading-relaxed ${scopeFilter === 'individual' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Standalone single projects with independent material receipts, team allocations, and reconciliation.
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenAddModal(undefined, 'individual');
                }}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Individual</span>
              </button>
            </div>
          </div>

          {/* Section Directory & Quick Registration Hub */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Project Sections Hub & Directory
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Click a section to filter projects or register directly into that section
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* All Sections Overview Card */}
              <div
                onClick={() => setSectionFilter('all')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  sectionFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 hover:bg-white text-slate-800 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">All Sections</span>
                    <span className={`text-[11px] px-2 py-0.2 rounded-full font-bold ${
                      sectionFilter === 'all' ? 'bg-slate-800 text-emerald-300' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {activeProjects.length}
                    </span>
                  </div>
                  <div className="font-bold text-xs sm:text-sm">Complete Registry</div>
                </div>
                <div className="mt-2 text-[10px] opacity-70">
                  Total {activeProjectTypes.length} operational sections
                </div>
              </div>

              {/* Dynamic Section Cards */}
              {activeProjectTypes.map((pt) => {
                const count = activeProjects.filter((p) => p.projectTypeId === pt.id).length;
                const templateCount = (pt.templateItems || []).length;
                const isSelected = sectionFilter === pt.id;

                return (
                  <div
                    key={pt.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/30'
                        : 'bg-white hover:border-slate-300 text-slate-800 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isSelected ? 'bg-slate-800 text-emerald-300 border-slate-700' : getColorBadge(pt.color)
                        }`}>
                          {pt.code || 'SEC'}
                        </span>
                        <span className={`text-[11px] px-2 py-0.2 rounded-full font-bold ${
                          isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {count}
                        </span>
                      </div>
                      <div
                        onClick={() => setSectionFilter(pt.id)}
                        className="font-bold text-xs sm:text-sm line-clamp-1 cursor-pointer hover:underline"
                        title={pt.name}
                      >
                        {pt.name}
                      </div>
                      <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {templateCount > 0 ? `${templateCount} BOM items` : 'No BOM items'}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/20 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSectionFilter(pt.id)}
                        className={`flex-1 py-1 rounded text-[11px] font-bold transition text-center cursor-pointer ${
                          isSelected ? 'bg-slate-800 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Open'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal(pt.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        title={`Register new project inside ${pt.name}`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3">
            <div className="relative w-full lg:w-80 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ID, Main/Sub project, site ID, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200 text-xs font-bold cursor-pointer"
                  title="Clear Search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              {/* Assigned Site Branch Filter */}
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <select
                  value={siteBranchFilter}
                  onChange={(e) => setSiteBranchFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-emerald-300 rounded-lg text-xs bg-emerald-50/50 text-slate-900 font-bold focus:outline-none"
                >
                  <option value="all">All Site Branches ({branchSites.length})</option>
                  <option value="ALL_AREAS">
                    🌐 ALL AREAS ({activeProjects.filter((p) => resolveProjectSite(p).siteId === 'ALL_AREAS').length})
                  </option>
                  {branchSites.map((bs) => {
                    const count = activeProjects.filter((p) => resolveProjectSite(p).siteId === bs.id).length;
                    return (
                      <option key={bs.id} value={bs.id}>
                        🏢 {bs.name} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Structure Scope Filter */}
              <div className="flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
                <select
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-semibold focus:outline-none"
                >
                  <option value="all">All Project Types ({activeProjects.length})</option>
                  <option value="main">🏢 Major / Main Projects ({mainProjects.length})</option>
                  <option value="sub">↳ Sub-Projects ({subProjectsList.length})</option>
                  <option value="individual">📄 Individual Projects ({individualProjects.length})</option>
                </select>
              </div>

              {/* Filter by Specific Main Project */}
              {mainProjects.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-teal-600" />
                  <select
                    value={parentFilterId}
                    onChange={(e) => setParentFilterId(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-semibold focus:outline-none max-w-[210px]"
                  >
                    <option value="all">All Main Project Families</option>
                    {mainProjects.map((mp) => {
                      const subCount = activeProjects.filter((sp) => sp.parentProjectId === mp.id).length;
                      return (
                        <option key={mp.id} value={mp.id}>
                          🏢 {mp.projectName} ({subCount} Sub)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Project Section Filter */}
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-semibold focus:outline-none"
                >
                  <option value="all">All Sections ({activeProjects.length})</option>
                  {activeProjectTypes.map((pt) => {
                    const count = activeProjects.filter((p) => p.projectTypeId === pt.id).length;
                    return (
                      <option key={pt.id} value={pt.id}>
                        {pt.name} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* District Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-semibold focus:outline-none"
                >
                  <option value="all">All Districts</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Projects Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-slate-700" />
                <h2 className="font-semibold text-sm text-slate-900">
                  Registered Projects Hierarchy ({filteredProjects.length})
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {filteredProjects.length} of {activeProjects.length} projects
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Project ID & Structure</th>
                    <th className="py-3 px-4">Project / Main & Sub-Project Details</th>
                    <th className="py-3 px-3">Assigned Site Branch</th>
                    <th className="py-3 px-3">Section / Type</th>
                    <th className="py-3 px-3">Reference No</th>
                    <th className="py-3 px-3">District & Area</th>
                    <th className="py-3 px-3 text-center">Usages & Free Stock Pool</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <div>No projects match your filter.</div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Click &quot;+ Main Project&quot; or &quot;Register Project&quot; above to add projects.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((p) => {
                      const effScope = getEffectiveScope(p);
                      const childSubs = activeProjects.filter((sp) => sp.parentProjectId === p.id);
                      const parentProj = p.parentProjectId
                        ? activeProjects.find((mp) => mp.id === p.parentProjectId)
                        : undefined;
                      const resolvedSite = resolveProjectSite(p);

                      const directUsagesCount = projectUsages.filter(
                        (pu) => pu.projectId === p.id && !pu.isDeleted
                      ).length;
                      const familyUsagesCount =
                        effScope === 'main'
                          ? projectUsages.filter(
                              (pu) =>
                                !pu.isDeleted &&
                                (pu.projectId === p.id ||
                                  pu.parentProjectId === p.id ||
                                  childSubs.some((cs) => cs.id === pu.projectId))
                            ).length
                          : directUsagesCount;

                      const freeStockPool = getProjectFreeStockList(p.id);
                      const matchedType = activeProjectTypes.find((pt) => pt.id === p.projectTypeId);

                      return (
                        <tr
                          key={p.id}
                          className={`transition-colors ${
                            effScope === 'main'
                              ? 'bg-indigo-100/70 hover:bg-indigo-100 border-l-4 border-l-indigo-700 border-t-2 border-t-indigo-300'
                              : effScope === 'sub'
                              ? 'bg-teal-50/35 hover:bg-teal-50/75 border-l-4 border-l-teal-500'
                              : 'hover:bg-slate-50/70 border-l-4 border-l-slate-300'
                          }`}
                        >
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            <div className={`flex flex-col gap-1 ${effScope === 'sub' ? 'pl-4 border-l-2 border-teal-500' : ''}`}>
                              <span
                                className={`px-2 py-0.5 rounded border w-fit shadow-2xs ${
                                  effScope === 'main'
                                    ? 'bg-indigo-950 text-amber-300 border-indigo-800 font-black'
                                    : 'bg-white text-slate-800 border-slate-200'
                                }`}
                              >
                                {p.projectId}
                              </span>
                              {effScope === 'main' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-indigo-700 text-white w-fit shadow-2xs">
                                  <FolderTree className="w-2.5 h-2.5" />
                                  <span>MAIN PROJECT ({childSubs.length} Sub)</span>
                                </span>
                              )}
                              {effScope === 'sub' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-600 text-white w-fit">
                                  <CornerDownRight className="w-2.5 h-2.5" />
                                  <span>SUB-PROJECT</span>
                                </span>
                              )}
                              {effScope === 'individual' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 w-fit">
                                  <span>INDIVIDUAL</span>
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {effScope === 'sub' && (parentProj || p.parentProjectName) && (
                              <div className="mb-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold">
                                  <FolderTree className="w-2.5 h-2.5 text-indigo-600" />
                                  <span>
                                    Under Main Project: [{parentProj?.projectId || p.parentProjectCode}] {parentProj?.projectName || p.parentProjectName}
                                  </span>
                                </span>
                              </div>
                            )}

                            <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                              <span>{p.projectName}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                              {(p.ncNumber || p.siteIdentifier) && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-semibold border border-blue-200">
                                  <Hash className="w-2.5 h-2.5" />
                                  <span>{p.ncNumber ? `FTTH/NC: ${p.ncNumber}` : `Site: ${p.siteIdentifier}`}</span>
                                </span>
                              )}
                              {p.ontSerialNo && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 font-mono font-semibold border border-teal-200">
                                  <span>ONT S/N: {p.ontSerialNo}</span>
                                </span>
                              )}
                              {p.customerPhone && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-mono font-semibold border border-purple-200">
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>Tel: {p.customerPhone}</span>
                                </span>
                              )}
                              {p.customerAddress && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
                                  <MapPin className="w-2.5 h-2.5 text-slate-500" />
                                  <span>Addr: {p.customerAddress}</span>
                                </span>
                              )}
                              {p.exchangeArea && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                                  <span>Exchange: {p.exchangeArea}</span>
                                </span>
                              )}
                              {p.customerName && p.customerName !== p.projectName && (
                                <span className="text-slate-600 font-medium text-[11px]">
                                  Client: <strong>{p.customerName}</strong>
                                </span>
                              )}
                              {p.customFieldValues &&
                                Object.entries(p.customFieldValues).map(([k, v]) =>
                                  v ? (
                                    <span
                                      key={k}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 font-medium border border-indigo-200 text-[10px]"
                                    >
                                      <span className="text-indigo-500 font-bold">{k}:</span>
                                      <span className="font-mono font-bold">{v}</span>
                                    </span>
                                  ) : null
                                )}
                            </div>

                            {/* If Main Project has sub-projects, list quick pills */}
                            {effScope === 'main' && childSubs.length > 0 && (
                              <div className="mt-2 pt-1.5 border-t border-indigo-100 flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                                  Sub-Projects ({childSubs.length}):
                                </span>
                                {childSubs.map((sp) => (
                                  <button
                                    key={sp.id}
                                    type="button"
                                    onClick={() => setViewingProjectUsages(sp)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 text-[10px] font-semibold transition cursor-pointer shadow-2xs"
                                    title="Click to inspect this Sub-Project's usage details"
                                  >
                                    <CornerDownRight className="w-2.5 h-2.5 text-teal-600" />
                                    <span className="font-mono font-bold">{sp.projectId}:</span>
                                    <span>{sp.projectName}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            {resolvedSite.siteId === 'ALL_AREAS' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-100 text-sky-950 border border-sky-400 text-xs font-extrabold shadow-2xs">
                                <Building2 className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                                <span>🌐 ALL AREAS (All Sites)</span>
                              </span>
                            ) : resolvedSite.siteName ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-extrabold shadow-2xs">
                                <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{resolvedSite.siteName}</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(p)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold cursor-pointer"
                                title="Click to assign a Site Branch to this project"
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>Assign Branch</span>
                              </button>
                            )}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            {matchedType ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getColorBadge(
                                  matchedType.color
                                )}`}
                              >
                                {matchedType.name}
                              </span>
                            ) : p.projectTypeName ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {p.projectTypeName}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">General Project</span>
                            )}
                          </td>

                          <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                            {p.referenceNo || '—'}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            {p.district ? (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center gap-1 text-slate-800 font-semibold">
                                  <MapPin className="w-3 h-3 text-emerald-600" />
                                  <span>{p.district}</span>
                                </span>
                                {p.subArea && (
                                  <span className="text-[11px] text-slate-500 pl-4">{p.subArea}</span>
                                )}
                              </div>
                            ) : (
                              p.subArea || '—'
                            )}
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center gap-1">
                              {familyUsagesCount > 0 || freeStockPool.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setViewingProjectUsages(p)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer border ${
                                    effScope === 'main'
                                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  <Package className="w-3 h-3" />
                                  <span>
                                    {effScope === 'main'
                                      ? `${familyUsagesCount} Total Usages (Reconcile)`
                                      : `${directUsagesCount} Usage Voucher(s)`}
                                  </span>
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[11px]">No usage yet</span>
                              )}

                              {freeStockPool.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                                  <Gift className="w-2.5 h-2.5 text-indigo-600" />
                                  <span>
                                    {effScope === 'sub'
                                      ? `Main Pool: ${freeStockPool.length} FOC items`
                                      : `FOC Stock: ${freeStockPool.length} items`}
                                  </span>
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {(effScope === 'main' || effScope === 'individual') && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddModal(p.projectTypeId, 'sub', p)}
                                  className="px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                  title={`Add a Sub-Project under "${p.projectName}"`}
                                >
                                  <Plus className="w-3 h-3 text-teal-600" />
                                  <span>Sub-Project</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(p)}
                                className="p-1.5 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                                title="Edit project details, scope, or parent Main Project"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmProject(p)}
                                className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Move project to Recycle Bin"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        </div>
      )}

      {/* TAB 2: PROJECT SECTIONS & MATERIAL TEMPLATES */}
      {activeTab === 'sections' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  New Section Registry, International Industry Templates &amp; BOM Material Templates
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Load ready-to-use international industry templates for <strong>Telecom New Connection</strong>, <strong>Water Supply Project</strong>, <strong>Electrical Power Project</strong>, or <strong>Solar PV Project</strong> — and add your own custom fields with <strong>+ Add Field</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenAddSectionModal('standard')}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create New Section / Load Template</span>
              </button>
            </div>

            {/* 1-Click International Section Template Loaders */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Quick-Load International Industry Section Templates (Click to Open &amp; Customize with + Add Field):
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {(
                  [
                    {
                      preset: 'telecom_nc' as SectionIndustryPreset,
                      btnClass: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300',
                      badge: 'ITU-T / FTTH',
                    },
                    {
                      preset: 'water_project' as SectionIndustryPreset,
                      btnClass: 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-300',
                      badge: 'ISO 4064 / AWWA',
                    },
                    {
                      preset: 'electric_project' as SectionIndustryPreset,
                      btnClass: 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300',
                      badge: 'IEC 60364 / IEEE',
                    },
                    {
                      preset: 'solar_project' as SectionIndustryPreset,
                      btnClass: 'bg-purple-50 hover:bg-purple-100 text-purple-950 border-purple-300',
                      badge: 'IEC 62446 / PV',
                    },
                  ] as const
                ).map((item) => {
                  const meta = INDUSTRY_SECTION_PRESETS[item.preset];
                  return (
                    <button
                      key={item.preset}
                      type="button"
                      onClick={() => handleOpenAddSectionModal(item.preset)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 shadow-2xs ${item.btnClass}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold">{meta.defaultSectionName}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white/80 text-[9px] font-bold border border-black/10 shrink-0">
                          {item.badge}
                        </span>
                      </div>
                      <div className="text-[10px] opacity-85 line-clamp-2">
                        6 Core Fields + {meta.defaultCustomFields.length} International Fields (+ Add Field)
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeProjectTypes.map((pt) => {
              const assignedProjects = activeProjects.filter((p) => p.projectTypeId === pt.id);
              const templateCount = (pt.templateItems || []).length;
              const isNcSection = isTelecomNewConnectionSection(pt);
              const effPresetKey = inferSectionIndustryPreset(pt);
              const effPresetMeta = INDUSTRY_SECTION_PRESETS[effPresetKey];
              const effCustomFields = getEffectiveSectionCustomFields(pt);

              return (
                <div
                  key={pt.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getColorBadge(pt.color)}`}>
                          {pt.code || 'SEC'}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">{pt.name}</h3>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSectionModal(pt)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800"
                          title="Edit section template, custom fields (+ Add Field) & workflow format"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmSection(pt)}
                          className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600"
                          title="Delete section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                      {isNcSection ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-sky-50 text-sky-800 border border-sky-200">
                          <Phone className="w-3 h-3 text-sky-600" />
                          <span>{effPresetMeta.shortBadge} • 6-Core + Custom Fields</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                          <Layers className="w-3 h-3 text-slate-500" />
                          <span>Standard Format (Main / Sub / Individual)</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                        <span>{effCustomFields.length} Extra Field(s)</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                      {pt.description || 'Custom engineering & utility project work section.'}
                    </p>

                    {effCustomFields.length > 0 && (
                      <div className="mb-3 flex flex-wrap items-center gap-1">
                        {effCustomFields.slice(0, 4).map((cf) => (
                          <span
                            key={cf.id}
                            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium"
                          >
                            {cf.label}
                          </span>
                        ))}
                        {effCustomFields.length > 4 && (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            +{effCustomFields.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Active Projects:</span>
                        <span className="font-bold text-slate-900">{assignedProjects.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Default Template Items:</span>
                        <span className={`font-bold ${templateCount > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {templateCount} item(s) configured
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditSectionModal(pt)}
                      className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Configure Fields / + Add Field ({effCustomFields.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenTemplateModal(pt)}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{templateCount > 0 ? 'Edit Material Template (BOM)' : 'Configure Material Template'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE / EDIT PROJECT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingProject ? 'Edit Project & Hierarchy Details' : 'Register Project (Individual / Main / Sub-Project)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingProject && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Zero-Data-Loss Guarantee:</span> You can safely change a project&apos;s structure type, link it under a Main Project, or move it to another section. All logged material usages and vouchers remain 100% intact.
                </div>
              </div>
            )}

            {existingMatchesInModal.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Existing Record Notice:</span> Found {existingMatchesInModal.length} existing project(s) with matching Site ID, Phone, or Name:
                  <div className="mt-1 font-semibold text-amber-900">
                    {existingMatchesInModal.map((m) => `"${m.projectName}" (${m.projectId})`).join(' | ')}
                  </div>
                </div>
              </div>
            )}

            {formError && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProject} className="space-y-4">
              {/* PROJECT SECTION / TYPE SELECTOR AT TOP */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    <span>Project Section / Type *</span>
                  </label>
                  <div className="flex items-center gap-3">
                    {selectedModalSection && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddModal(false);
                          handleOpenEditSectionModal(selectedModalSection);
                        }}
                        className="text-[11px] font-bold text-indigo-700 hover:underline cursor-pointer"
                      >
                        Edit Section Fields
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        handleOpenAddSectionModal();
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      + Add New Section
                    </button>
                  </div>
                </div>
                <select
                  value={projectTypeId}
                  onChange={(e) => {
                    const nextSecId = e.target.value;
                    setProjectTypeId(nextSecId);
                    if (projectScope === 'sub') {
                      const nextSecObj = activeProjectTypes.find((pt) => pt.id === nextSecId);
                      const matchingMain = activeProjects.find((p) => {
                        if (p.parentProjectId || p.projectScope === 'sub') return false;
                        if (p.ncNumber && getEffectiveScope(p) !== 'main') return false;
                        if (editingProject && p.id === editingProject.id) return false;
                        if (!nextSecId) return true;
                        if (p.projectTypeId) return p.projectTypeId === nextSecId;
                        if (p.projectTypeName && nextSecObj) {
                          return p.projectTypeName.trim().toLowerCase() === nextSecObj.name.trim().toLowerCase();
                        }
                        return false;
                      });
                      setParentProjectId(matchingMain?.id || '');
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="">General Project (No specific section)</option>
                  {activeProjectTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name} {pt.code ? `(${pt.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* STEP 1: SELECT PROJECT STRUCTURE TYPE (AVAILABLE FOR BOTH NEW CONNECTIONS & STANDARD PROJECTS) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Select Project Structure Type *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProjectScope('individual');
                      if (!editingProject && !isModalNewConnection) {
                        const nextInd = getNextIndividualProjectSeq();
                        setProjectId(nextInd.projectId);
                        setReferenceNo(nextInd.referenceNo);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      projectScope === 'individual'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-emerald-500/40'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className="text-xs font-extrabold flex items-center gap-1.5">
                      <span>{isModalNewConnection ? '📄 Standalone New Connection' : '📄 Individual Project'}</span>
                    </div>
                    <div className={`text-[11px] mt-1 leading-snug ${projectScope === 'individual' ? 'text-slate-300' : 'text-slate-500'}`}>
                      {isModalNewConnection
                        ? 'Single standalone New Connection using normal Company Stock.'
                        : 'Single standalone project with its own direct stock & usage.'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProjectScope('main');
                      if (!editingProject) {
                        const nextMain = getNextMainProjectSeq();
                        setProjectId(nextMain.projectId);
                        setReferenceNo(nextMain.referenceNo);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      projectScope === 'main'
                        ? 'bg-indigo-950 text-white border-indigo-900 shadow-xs ring-2 ring-indigo-500/40'
                        : 'bg-white hover:bg-indigo-50/50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className="text-xs font-extrabold flex items-center gap-1.5">
                      <span>{isModalNewConnection ? '🏢 Main Project (For New Connections)' : '🏢 Major / Main Project'}</span>
                    </div>
                    <div className={`text-[11px] mt-1 leading-snug ${projectScope === 'main' ? 'text-indigo-200' : 'text-slate-500'}`}>
                      {isModalNewConnection
                        ? 'Umbrella Main Project that groups New Connections & receives bulk Client FOC Free Stock.'
                        : 'Umbrella project that receives bulk Free Stock for multiple Sub-Projects.'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProjectScope('sub');
                      const defaultParent =
                        selectableParentProjects.find((p) => p.id === parentProjectId) ||
                        selectableParentProjects.find((p) => p.projectTypeId === projectTypeId) ||
                        selectableParentProjects[0];
                      if (defaultParent) {
                        handleParentProjectChange(defaultParent.id);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      projectScope === 'sub'
                        ? 'bg-teal-950 text-white border-teal-900 shadow-xs ring-2 ring-teal-500/40'
                        : 'bg-white hover:bg-teal-50/50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className="text-xs font-extrabold flex items-center gap-1.5">
                      <span>{isModalNewConnection ? '↳ Under Main Project (New Connection)' : '↳ Sub-Project'}</span>
                    </div>
                    <div className={`text-[11px] mt-1 leading-snug ${projectScope === 'sub' ? 'text-teal-200' : 'text-slate-500'}`}>
                      {isModalNewConnection
                        ? 'Register New Connection under a Main Project (uses Main Project Client FOC if allocated).'
                        : "Operates under a Main Project & deducts from the Main Project's Free Stock."}
                    </div>
                  </button>
                </div>

                {/* If Sub-Project / Under Main Project is selected, show Parent Main Project selector */}
                {projectScope === 'sub' && (
                  <div className="pt-2 border-t border-slate-200 mt-2">
                    <label className="block text-xs font-bold text-teal-900 mb-1">
                      {isModalNewConnection
                        ? 'Select Parent Main Project (Main Project → Under New Connections) *'
                        : 'Select Parent Major / Main Project (Under Main Project) *'}
                    </label>
                    {selectableParentProjects.length === 0 ? (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                        No Main Project registered yet. Please select <strong>🏢 Main Project</strong> above to register your Main Project first.
                      </div>
                    ) : (
                      <select
                        value={parentProjectId}
                        onChange={(e) => handleParentProjectChange(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-teal-300 rounded-lg text-xs font-bold text-slate-900 bg-teal-50/50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                      >
                        <option value="">-- Choose Parent Main Project --</option>
                        {selectableParentProjects.map((mp) => {
                          const mpSite = resolveProjectSite(mp);
                          const mpFocCount = getProjectFreeStockList(mp.id).length;
                          return (
                            <option key={mp.id} value={mp.id}>
                              [{mp.projectId}] {mp.projectName}
                              {mpSite.siteName ? ` — Branch: ${mpSite.siteName}` : ''}
                              {mp.customerName ? ` — Client: ${mp.customerName}` : ''}
                              {mpFocCount > 0 ? ` — 🎁 Client FOC Stock (${mpFocCount} items)` : ''}
                            </option>
                          );
                        })}
                      </select>
                    )}
                    {(() => {
                      const chosenParent = selectableParentProjects.find((mp) => mp.id === parentProjectId);
                      const chosenParentFoc = chosenParent ? getProjectFreeStockList(chosenParent.id) : [];
                      if (chosenParent && chosenParentFoc.length > 0) {
                        return (
                          <p className="text-[11px] text-purple-800 bg-purple-50 border border-purple-200 rounded-lg px-2.5 py-1.5 mt-1.5 font-semibold">
                            🎁 Client FOC Free Stock Available on [{chosenParent.projectId}] ({chosenParentFoc.length} material item{chosenParentFoc.length > 1 ? 's' : ''}). Any FOC usage on this New Connection will automatically deduct from the Main Project&apos;s FOC balance.
                          </p>
                        );
                      }
                      return (
                        <p className="text-[11px] text-teal-700 mt-1 font-medium">
                          ✓ Linked under the selected Main Project so all New Connections under this Main Project are tracked and reconciled together.
                        </p>
                      );
                    })()}
                  </div>
                )}
              </div>

              {isModalNewConnection && projectScope !== 'main' ? (
                /* CONNECTION / UTILITY 6-CORE-FIELD + INTERNATIONAL CUSTOM FIELDS REGISTRATION FORMAT (TELECOM, WATER, ELECTRIC, SOLAR) */
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-[#233e54] via-[#27465f] to-[#2b4d68] border border-[#3c6687] rounded-xl space-y-3.5 shadow-sm">
                    <div className="border-b border-[#3d6889] pb-2 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-sky-300" />
                          <span>{activeModalCoreLabels.bannerTitle}</span>
                        </span>
                        <span className="text-[11px] text-sky-100/85 block mt-0.5">
                          {activeModalCoreLabels.bannerSubtitle}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-400/20 text-sky-200 border border-sky-300/40 shrink-0">
                        {activeModalPresetMeta.shortBadge}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* 1. Primary Connection / Account / Meter ID */}
                      <div>
                        <label className="block text-xs font-bold text-slate-100 mb-1">
                          1. {activeModalCoreLabels.primaryIdLabel} *
                        </label>
                        <input
                          type="text"
                          required
                          value={ncNumber}
                          onChange={(e) => setNcNumber(e.target.value.toUpperCase())}
                          placeholder={activeModalCoreLabels.primaryIdPlaceholder}
                          className="w-full px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-sky-400 focus:outline-none"
                        />
                      </div>

                      {/* 2. Equipment / Meter / ONT / Inverter Serial No */}
                      <div>
                        <label className="block text-xs font-bold text-slate-100 mb-1">
                          2. {activeModalCoreLabels.serialNoLabel}
                        </label>
                        <input
                          type="text"
                          value={ontSerialNo}
                          onChange={(e) => setOntSerialNo(e.target.value.toUpperCase())}
                          placeholder={activeModalCoreLabels.serialNoPlaceholder}
                          className="w-full px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 text-xs font-mono font-semibold uppercase focus:ring-2 focus:ring-sky-400 focus:outline-none"
                        />
                      </div>

                      {/* 3. Customer / Consumer Name */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-100 mb-1">
                          3. {activeModalCoreLabels.customerNameLabel} *
                        </label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder={activeModalCoreLabels.customerNamePlaceholder}
                          className="w-full px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-sky-400 focus:outline-none"
                        />
                      </div>

                      {/* 4. Customer / Installation Address */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-100 mb-1">
                          4. {activeModalCoreLabels.addressLabel}
                        </label>
                        <input
                          type="text"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder={activeModalCoreLabels.addressPlaceholder}
                          className="w-full px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 text-xs font-medium focus:ring-2 focus:ring-sky-400 focus:outline-none"
                        />
                      </div>

                      {/* 5. Customer Mobile No (Country-Aware Digit Counter) */}
                      {(() => {
                        const ncMobileAnalysis = analyzeCountryPhone(customerPhone, {
                          tenantCountry: phoneCountry || currentTenant?.country,
                          currencySymbol: config?.currencySymbol || currentTenant?.currencySymbol,
                        });
                        return (
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <label className="block text-xs font-bold text-slate-100">
                                5. {activeModalCoreLabels.mobileLabel}
                              </label>
                              <PhoneCountryBadge
                                value={customerPhone}
                                countryOverride={phoneCountry}
                                currencyOverride={config?.currencySymbol}
                                dark
                              />
                            </div>
                            <div className="flex items-stretch gap-1.5">
                              <select
                                value={ncMobileAnalysis.country.name}
                                onChange={(e) => {
                                  const chosenCountry = e.target.value;
                                  setPhoneCountry(chosenCountry);
                                  setCustomerPhone((prev) =>
                                    enforceCountryPhoneInput(prev, {
                                      tenantCountry: chosenCountry,
                                      currencySymbol: config?.currencySymbol,
                                    })
                                  );
                                }}
                                title="Select Country for Phone Digit Counting"
                                className="px-2 py-2 border border-white/80 rounded-lg bg-slate-100 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-sky-400 focus:outline-none shrink-0 cursor-pointer"
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
                                  value={customerPhone}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    const dialedRule = matchCountryByDialPrefix(raw);
                                    const activeCountryName = dialedRule ? dialedRule.name : phoneCountry;
                                    if (dialedRule && dialedRule.name !== phoneCountry) {
                                      setPhoneCountry(dialedRule.name);
                                    }
                                    setCustomerPhone(
                                      enforceCountryPhoneInput(raw, {
                                        tenantCountry: activeCountryName || currentTenant?.country,
                                        currencySymbol: config?.currencySymbol || currentTenant?.currencySymbol,
                                      })
                                    );
                                  }}
                                  placeholder={ncMobileAnalysis.country.localPlaceholder}
                                  className={`w-full pl-8 pr-3 py-2 border rounded-lg bg-white text-slate-900 text-xs font-mono focus:ring-2 focus:outline-none ${
                                    !ncMobileAnalysis.isEmpty && !ncMobileAnalysis.isComplete
                                      ? 'border-amber-400 focus:ring-amber-400'
                                      : !ncMobileAnalysis.isEmpty && ncMobileAnalysis.isComplete
                                      ? 'border-emerald-400 focus:ring-emerald-400'
                                      : 'border-white/80 focus:ring-sky-400'
                                  }`}
                                />
                              </div>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[10px] font-semibold">
                              {ncMobileAnalysis.isEmpty ? (
                                <span className="text-sky-200/90">
                                  {ncMobileAnalysis.country.flag} {ncMobileAnalysis.country.name} ({ncMobileAnalysis.country.dialCode}) • {ncMobileAnalysis.expectedTotalDigits} digits
                                </span>
                              ) : ncMobileAnalysis.isComplete ? (
                                <span className="text-emerald-300 font-bold">
                                  ✓ {ncMobileAnalysis.country.flag} {ncMobileAnalysis.enteredTotalDigits}/{ncMobileAnalysis.expectedTotalDigits} digits valid ({ncMobileAnalysis.country.name})
                                </span>
                              ) : (
                                <span className="text-amber-300 font-bold">
                                  {ncMobileAnalysis.country.flag} {ncMobileAnalysis.enteredTotalDigits}/{ncMobileAnalysis.expectedTotalDigits} digits — {Math.max(0, ncMobileAnalysis.expectedTotalDigits - ncMobileAnalysis.enteredTotalDigits)} more needed
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* 6. Exchange Area / WSS Zone / Substation / Grid Zone */}
                      <div>
                        <label className="block text-xs font-bold text-slate-100 mb-1">
                          6. {activeModalCoreLabels.areaLabel} *
                        </label>
                        <input
                          type="text"
                          required
                          value={exchangeArea}
                          onChange={(e) => setExchangeArea(e.target.value)}
                          placeholder={activeModalCoreLabels.areaPlaceholder}
                          className="w-full px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-sky-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* International & Custom Section Fields (e.g. Water, Electric, Solar, Telecom extra parameters) */}
                    <div className="pt-3 border-t border-[#3d6889] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-200">
                          International Technical &amp; Custom Section Fields ({activeModalCustomFields.length})
                        </span>
                      </div>
                      {activeModalCustomFields.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {activeModalCustomFields.map((cf, idx) => (
                            <div key={cf.id}>
                              <label className="block text-xs font-bold text-slate-100 mb-1">
                                {idx + 7}. {cf.label} {cf.required ? '*' : ''}
                              </label>
                              <input
                                type="text"
                                required={Boolean(cf.required)}
                                value={customFieldValues[cf.label] || ''}
                                onChange={(e) =>
                                  setCustomFieldValues((prev) => ({
                                    ...prev,
                                    [cf.label]: e.target.value,
                                  }))
                                }
                                placeholder={cf.placeholder || `Enter ${cf.label}`}
                                className="w-full px-3 py-2 border border-white/80 rounded-lg bg-white text-slate-900 text-xs font-medium focus:ring-2 focus:ring-sky-400 focus:outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick "+ Add Field" directly inside Project Registration */}
                      <div className="p-2.5 bg-[#1b3143] border border-[#3c6687] rounded-xl space-y-2">
                        <div className="text-[11px] font-bold text-sky-200 flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-sky-300" />
                          <span>+ Add Custom Field to This Section Template</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                          <div className="sm:col-span-5">
                            <input
                              type="text"
                              value={inlineNewFieldLabel}
                              onChange={(e) => setInlineNewFieldLabel(e.target.value)}
                              placeholder="New Field Name (e.g. Pole No / GPS / Depth)"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-semibold border border-white/80 focus:outline-none"
                            />
                          </div>
                          <div className="sm:col-span-5">
                            <input
                              type="text"
                              value={inlineNewFieldValue}
                              onChange={(e) => setInlineNewFieldValue(e.target.value)}
                              placeholder="Field Value / Example (Optional)"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white text-slate-900 text-xs border border-white/80 focus:outline-none"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <button
                              type="button"
                              onClick={handleAddInlineCustomFieldToSection}
                              className="w-full py-1.5 px-2.5 bg-sky-400 hover:bg-sky-300 text-slate-950 font-extrabold rounded-lg text-xs cursor-pointer transition flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Field</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Site Branch for NC Line */}
                  {branchSites.length > 0 && (
                    <div className="p-3 bg-emerald-50/80 border border-emerald-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-emerald-700" />
                        <span>Assigned Site Branch:</span>
                      </label>
                      <select
                        value={assignedSiteId}
                        onChange={(e) => setAssignedSiteId(e.target.value)}
                        className="px-3 py-1.5 border border-emerald-400 rounded-lg text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      >
                        <option value="ALL_AREAS">
                          🌐 ALL AREAS (All Site Branches — Open to Any Site)
                        </option>
                        {branchSites.map((bs) => (
                          <option key={bs.id} value={bs.id}>
                            🏢 {bs.name} {bs.location ? `(${bs.location})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                /* STANDARD / MAIN PROJECT FORMAT */
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {projectScope === 'main'
                          ? 'Main Project ID *'
                          : projectScope === 'sub'
                          ? 'Sub-Project ID *'
                          : 'Project ID *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value.toUpperCase())}
                        placeholder="e.g. MAJ-2026-0001"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Contract No</label>
                      <input
                        type="text"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        placeholder="e.g. REF-0001"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {projectScope === 'main'
                        ? 'Major / Main Project Name * (Umbrella Name for Free Stock Issue)'
                        : projectScope === 'sub'
                        ? 'Sub-Project Name / Site Work Order Name *'
                        : 'Project / Customer Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder={
                        projectScope === 'main'
                          ? 'e.g. SLT Western Province FTTH Backbone Rollout Phase 2'
                          : projectScope === 'sub'
                          ? 'e.g. Sub-Project 01 - Maharagama Distribution Sector A'
                          : 'e.g. Metro Fiber Rollout - Customer Site #A-04'
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>

                  {/* MANDATORY ASSIGNED SITE BRANCH SELECTOR (INCLUDES ALL AREAS OPTION) */}
                  <div className="p-3.5 bg-emerald-50/80 border-2 border-emerald-300 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wide">
                        <Building2 className="w-4 h-4 text-emerald-700" />
                        <span>Assigned Site Branch *</span>
                      </label>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-700 text-white uppercase">
                        {assignedSiteId === 'ALL_AREAS' ? '🌐 All Areas (Open to All Sites)' : 'Mandatory Branch Link'}
                      </span>
                    </div>
                    <select
                      required
                      value={assignedSiteId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setAssignedSiteId(nextId);
                        if (nextId === 'ALL_AREAS') {
                          if (!district.trim() || branchSites.some((b) => b.name === district || b.location === district)) {
                            setDistrict('ALL AREAS');
                          }
                          return;
                        }
                        const chosenSite = branchSites.find((b) => b.id === nextId);
                        if (chosenSite && (!district.trim() || district === 'ALL AREAS' || branchSites.some((b) => b.name === district || b.location === district))) {
                          setDistrict(chosenSite.location || chosenSite.name);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 border-2 border-emerald-400 rounded-xl text-xs sm:text-sm font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none shadow-2xs cursor-pointer"
                    >
                      <option value="">-- Select Assigned Site Branch * --</option>
                      <option value="ALL_AREAS">
                        🌐 ALL AREAS (All Site Branches — Any Site Can Request FOC &amp; Log Usage)
                      </option>
                      {branchSites.map((bs) => (
                        <option key={bs.id} value={bs.id}>
                          🏢 {bs.name} {bs.location ? `(${bs.location})` : ''}
                        </option>
                      ))}
                    </select>
                    {assignedSiteId === 'ALL_AREAS' ? (
                      <p className="text-[11px] text-sky-900 bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1.5 font-semibold leading-snug">
                        🌐 <strong>ALL AREAS Active:</strong> This project is not restricted to a single site branch. When Client Free-Issue (FOC) stock is received for this project, <strong>ANY Site Branch</strong> can request that FOC stock from Central Stock and log material usage under this project.
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-800 font-medium leading-snug">
                        ✓ When Client Free-Issue (FOC) stock is logged for this project, it enters <strong>Main Central Warehouse</strong> first and is <strong>automatically allocated exclusively to this Site Branch</strong> (or choose <strong>🌐 ALL AREAS</strong> above to allow all sites to use it).
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      const stdPhoneAnalysis = analyzeCountryPhone(customerPhone, {
                        tenantCountry: phoneCountry || currentTenant?.country,
                        currencySymbol: config?.currencySymbol || currentTenant?.currencySymbol,
                      });
                      return (
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              Customer / Contact Phone
                            </label>
                            <PhoneCountryBadge
                              value={customerPhone}
                              countryOverride={phoneCountry}
                              currencyOverride={config?.currencySymbol}
                            />
                          </div>
                          <div className="flex items-stretch gap-1.5">
                            <select
                              value={stdPhoneAnalysis.country.name}
                              onChange={(e) => {
                                const chosenCountry = e.target.value;
                                setPhoneCountry(chosenCountry);
                                setCustomerPhone((prev) =>
                                  enforceCountryPhoneInput(prev, {
                                    tenantCountry: chosenCountry,
                                    currencySymbol: config?.currencySymbol,
                                  })
                                );
                              }}
                              title="Select Country for Phone Digit Counting"
                              className="px-2 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none shrink-0 cursor-pointer"
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
                                value={customerPhone}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const dialedRule = matchCountryByDialPrefix(raw);
                                  const activeCountryName = dialedRule ? dialedRule.name : phoneCountry;
                                  if (dialedRule && dialedRule.name !== phoneCountry) {
                                    setPhoneCountry(dialedRule.name);
                                  }
                                  setCustomerPhone(
                                    enforceCountryPhoneInput(raw, {
                                      tenantCountry: activeCountryName || currentTenant?.country,
                                      currencySymbol: config?.currencySymbol || currentTenant?.currencySymbol,
                                    })
                                  );
                                }}
                                placeholder={stdPhoneAnalysis.country.localPlaceholder}
                                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Site ID / Connection ID / Order
                      </label>
                      <div className="relative">
                        <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={siteIdentifier}
                          onChange={(e) => setSiteIdentifier(e.target.value)}
                          placeholder="e.g. SITE-0891, SO-4421"
                          className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Registered Client / Principal Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Client / Free-Stock Principal (Optional)
                    </label>
                    <select
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    >
                      <option value="">Custom / Direct Project Owner</option>
                      {activeClients.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} ({c.clientCode} — {c.category || 'Client'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="e.g. Colombo, Kandy, Galle"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Sub Area</label>
                      <input
                        type="text"
                        value={subArea}
                        onChange={(e) => setSubArea(e.target.value)}
                        placeholder="e.g. Kollupitiya, Sector 4"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* International & Custom Section Fields for Standard Format Sections */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Section Technical &amp; Custom Fields ({activeModalCustomFields.length})
                      </span>
                    </div>
                    {activeModalCustomFields.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeModalCustomFields.map((cf) => (
                          <div key={cf.id}>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              {cf.label} {cf.required ? '*' : ''}
                            </label>
                            <input
                              type="text"
                              required={Boolean(cf.required)}
                              value={customFieldValues[cf.label] || ''}
                              onChange={(e) =>
                                setCustomFieldValues((prev) => ({
                                  ...prev,
                                  [cf.label]: e.target.value,
                                }))
                              }
                              placeholder={cf.placeholder || `Enter ${cf.label}`}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick "+ Add Field" directly inside Standard Project Modal */}
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>+ Add Custom Field to This Section Template</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-5">
                          <input
                            type="text"
                            value={inlineNewFieldLabel}
                            onChange={(e) => setInlineNewFieldLabel(e.target.value)}
                            placeholder="New Field Name (e.g. Trench Depth / Permit No)"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-900 text-xs font-semibold border border-slate-300 focus:outline-none"
                          />
                        </div>
                        <div className="sm:col-span-5">
                          <input
                            type="text"
                            value={inlineNewFieldValue}
                            onChange={(e) => setInlineNewFieldValue(e.target.value)}
                            placeholder="Field Value / Example (Optional)"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-900 text-xs border border-slate-300 focus:outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <button
                            type="button"
                            onClick={handleAddInlineCustomFieldToSection}
                            className="w-full py-1.5 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs cursor-pointer transition flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Field</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Optional inline Sub-Project creator when creating a NEW Major / Main Project */}
                  {!editingProject && projectScope === 'main' && (
                    <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                            <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Quick-Add Sub-Projects Under This Main Project (Optional)</span>
                          </span>
                          <p className="text-[11px] text-indigo-800">
                            You can add Sub-Projects right now or anytime later from the table using the <strong>+ Sub-Project</strong> button.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setInitialSubProjects([
                              ...initialSubProjects,
                              { subName: '', siteId: '', subArea: '' },
                            ])
                          }
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Sub-Project Row</span>
                        </button>
                      </div>

                      {initialSubProjects.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {initialSubProjects.map((sp, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-indigo-200">
                              <div className="col-span-5">
                                <input
                                  type="text"
                                  placeholder={`Sub-Project #${idx + 1} Name *`}
                                  value={sp.subName}
                                  onChange={(e) => {
                                    const next = [...initialSubProjects];
                                    next[idx].subName = e.target.value;
                                    setInitialSubProjects(next);
                                  }}
                                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-medium"
                                />
                              </div>
                              <div className="col-span-3">
                                <input
                                  type="text"
                                  placeholder="Site ID / Order"
                                  value={sp.siteId}
                                  onChange={(e) => {
                                    const next = [...initialSubProjects];
                                    next[idx].siteId = e.target.value;
                                    setInitialSubProjects(next);
                                  }}
                                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono uppercase"
                                />
                              </div>
                              <div className="col-span-3">
                                <input
                                  type="text"
                                  placeholder="Sub Area"
                                  value={sp.subArea}
                                  onChange={(e) => {
                                    const next = [...initialSubProjects];
                                    next[idx].subArea = e.target.value;
                                    setInitialSubProjects(next);
                                  }}
                                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                                />
                              </div>
                              <div className="col-span-1 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setInitialSubProjects(initialSubProjects.filter((_, i) => i !== idx))
                                  }
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  {editingProject
                    ? 'Save Changes'
                    : isModalNewConnection
                    ? `Register ${selectedModalSection?.name || 'Connection'}`
                    : projectScope === 'main'
                    ? 'Register Major / Main Project'
                    : projectScope === 'sub'
                    ? 'Register Sub-Project'
                    : 'Register Individual Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PROJECT SECTION MODAL (WITH INTERNATIONAL TEMPLATES & + ADD FIELD BUILDER) */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingSection
                    ? `Edit Project Section & Fields: ${editingSection.name}`
                    : 'Create Project Section & Load Industry Template'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSectionModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sectionError && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-semibold">
                {sectionError}
              </div>
            )}

            <form onSubmit={handleSaveSection} className="space-y-4">
              {/* STEP 1: INTERNATIONAL INDUSTRY TEMPLATE SELECTOR */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    1. Load International Industry Template (Auto-Loads Standard Fields) *
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700">
                    Click any template to load its international fields
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {(
                    ['telecom_nc', 'water_project', 'electric_project', 'solar_project', 'standard'] as SectionIndustryPreset[]
                  ).map((presetKey) => {
                    const meta = INDUSTRY_SECTION_PRESETS[presetKey];
                    const isSelected = sectionIndustryPreset === presetKey;
                    return (
                      <button
                        key={presetKey}
                        type="button"
                        onClick={() => applySectionIndustryPreset(presetKey, Boolean(editingSection))}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#233e54] text-white border-[#3c6687] shadow-xs ring-2 ring-sky-400/50'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                isSelected
                                  ? 'bg-sky-400/20 text-sky-200 border border-sky-300/40'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {meta.shortBadge}
                            </span>
                            <span className="text-[9px] font-mono opacity-75">
                              {meta.standardReference}
                            </span>
                          </div>
                          <div className="text-xs font-extrabold leading-snug">
                            {meta.defaultSectionName}
                          </div>
                        </div>
                        <div
                          className={`text-[10px] mt-1.5 leading-snug ${
                            isSelected ? 'text-sky-100' : 'text-slate-500'
                          }`}
                        >
                          {meta.defaultWorkflowMode === 'new_connection'
                            ? `6 Core Connection Fields + ${meta.defaultCustomFields.length} International Fields`
                            : `Main/Sub Project Format + ${meta.defaultCustomFields.length} Engineering Fields`}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Workflow Mode Switcher (Subscriber/Connection 3-Step vs Standard Project Hierarchy) */}
                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-700">
                    Workflow &amp; Daily Progress Entry Mode:
                  </span>
                  <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setSectionWorkflowMode('new_connection')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                        sectionWorkflowMode === 'new_connection'
                          ? 'bg-[#233e54] text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      6-Core Connection &amp; 1-2-3 Daily Progress Lock
                    </button>
                    <button
                      type="button"
                      onClick={() => setSectionWorkflowMode('standard')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                        sectionWorkflowMode === 'standard'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Main / Sub / Individual Project Hierarchy
                    </button>
                  </div>
                </div>
              </div>

              {/* STEP 2: SECTION IDENTITY */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Section Name * (e.g. Water Supply Project, Solar PV Project)
                  </label>
                  <input
                    type="text"
                    required
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    placeholder="e.g. Water Supply & Utility Connection Project"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Short Code
                  </label>
                  <input
                    type="text"
                    value={sectionCode}
                    onChange={(e) => setSectionCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WSP"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none uppercase"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Theme Color
                  </label>
                  <select
                    value={sectionColor}
                    onChange={(e) => setSectionColor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:outline-none"
                  >
                    <option value="emerald">Emerald Green</option>
                    <option value="blue">Royal Blue</option>
                    <option value="purple">Purple</option>
                    <option value="amber">Amber / Gold</option>
                    <option value="rose">Rose Red</option>
                    <option value="teal">Teal</option>
                    <option value="indigo">Indigo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Operational Scope
                </label>
                <textarea
                  rows={2}
                  value={sectionDescription}
                  onChange={(e) => setSectionDescription(e.target.value)}
                  placeholder="Describe the international standard scope and installation workflow for this section..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              {/* STEP 3: 6 CORE CONNECTION FIELDS PREVIEW & CUSTOMIZER (WHEN IN CONNECTION MODE) */}
              {sectionWorkflowMode === 'new_connection' && (
                <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-sky-950 uppercase tracking-wider">
                        2. Core 6 Connection / Subscriber Fields (Auto-Loaded for Template)
                      </span>
                      <p className="text-[11px] text-sky-800">
                        Just like Customer No, Address, and ONT Serial in Telecom New Connection, these 6 core fields load automatically for this section:
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowEditCoreLabelsInSectionModal((prev) => !prev)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-100 text-sky-900 border border-sky-300 text-[11px] font-bold cursor-pointer shrink-0"
                    >
                      {showEditCoreLabelsInSectionModal ? 'Hide Label Editor' : 'Customize 6 Labels'}
                    </button>
                  </div>

                  {!showEditCoreLabelsInSectionModal ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2 bg-white rounded-lg border border-sky-200">
                        <span className="text-slate-400 font-bold block text-[10px]">Field 1 (Primary ID *)</span>
                        <span className="font-bold text-slate-900">{sectionCoreLabels.primaryIdLabel}</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-sky-200">
                        <span className="text-slate-400 font-bold block text-[10px]">Field 2 (Device / Meter S/N)</span>
                        <span className="font-bold text-slate-900">{sectionCoreLabels.serialNoLabel}</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-sky-200">
                        <span className="text-slate-400 font-bold block text-[10px]">Field 3 (Customer Name *)</span>
                        <span className="font-bold text-slate-900">{sectionCoreLabels.customerNameLabel}</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-sky-200">
                        <span className="text-slate-400 font-bold block text-[10px]">Field 4 (Address)</span>
                        <span className="font-bold text-slate-900">{sectionCoreLabels.addressLabel}</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-sky-200">
                        <span className="text-slate-400 font-bold block text-[10px]">Field 5 (Mobile / Tel)</span>
                        <span className="font-bold text-slate-900">{sectionCoreLabels.mobileLabel}</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-sky-200">
                        <span className="text-slate-400 font-bold block text-[10px]">Field 6 (Zone / Area *)</span>
                        <span className="font-bold text-slate-900">{sectionCoreLabels.areaLabel}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-sky-900 mb-0.5">1. Primary Account / Connection No Label *</label>
                        <input
                          type="text"
                          value={sectionCoreLabels.primaryIdLabel}
                          onChange={(e) => setSectionCoreLabels({ ...sectionCoreLabels, primaryIdLabel: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-sky-300 rounded-lg text-xs font-semibold bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-sky-900 mb-0.5">2. Meter / ONT / Inverter Serial Label</label>
                        <input
                          type="text"
                          value={sectionCoreLabels.serialNoLabel}
                          onChange={(e) => setSectionCoreLabels({ ...sectionCoreLabels, serialNoLabel: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-sky-300 rounded-lg text-xs font-semibold bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-sky-900 mb-0.5">3. Customer / Consumer Name Label *</label>
                        <input
                          type="text"
                          value={sectionCoreLabels.customerNameLabel}
                          onChange={(e) => setSectionCoreLabels({ ...sectionCoreLabels, customerNameLabel: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-sky-300 rounded-lg text-xs font-semibold bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-sky-900 mb-0.5">4. Premises / Service Address Label</label>
                        <input
                          type="text"
                          value={sectionCoreLabels.addressLabel}
                          onChange={(e) => setSectionCoreLabels({ ...sectionCoreLabels, addressLabel: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-sky-300 rounded-lg text-xs font-semibold bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-sky-900 mb-0.5">5. Mobile / Contact Phone Label</label>
                        <input
                          type="text"
                          value={sectionCoreLabels.mobileLabel}
                          onChange={(e) => setSectionCoreLabels({ ...sectionCoreLabels, mobileLabel: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-sky-300 rounded-lg text-xs font-semibold bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-sky-900 mb-0.5">6. Exchange / WSS Zone / Substation Label *</label>
                        <input
                          type="text"
                          value={sectionCoreLabels.areaLabel}
                          onChange={(e) => setSectionCoreLabels({ ...sectionCoreLabels, areaLabel: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-sky-300 rounded-lg text-xs font-semibold bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: INTERNATIONAL TECHNICAL FIELDS & "+ ADD FIELD" DYNAMIC FIELD BUILDER */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                      3. International Technical Fields &amp; + Add Field Builder ({sectionCustomFields.length} Fields)
                    </span>
                    <p className="text-[11px] text-indigo-800">
                      These fields automatically appear whenever registering a project or logging daily progress under this section. Add any new field below:
                    </p>
                  </div>
                </div>

                {/* Existing Fields List */}
                {sectionCustomFields.length === 0 ? (
                  <div className="p-3 bg-white rounded-lg border border-indigo-200 text-xs text-slate-500 text-center">
                    No additional custom fields configured yet. Use <strong>+ Add Field</strong> below or click an international template above.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {sectionCustomFields.map((cf, idx) => (
                      <div
                        key={cf.id}
                        className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-indigo-200 shadow-2xs"
                      >
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={cf.label}
                            onChange={(e) => {
                              const next = [...sectionCustomFields];
                              next[idx] = { ...next[idx], label: e.target.value };
                              setSectionCustomFields(next);
                            }}
                            placeholder="Field Label *"
                            className="w-full px-2.5 py-1 border border-slate-300 rounded text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={cf.placeholder}
                            onChange={(e) => {
                              const next = [...sectionCustomFields];
                              next[idx] = { ...next[idx], placeholder: e.target.value };
                              setSectionCustomFields(next);
                            }}
                            placeholder="Example / Placeholder"
                            className="w-full px-2.5 py-1 border border-slate-300 rounded text-xs text-slate-700"
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600 cursor-pointer" title="Mark field as required">
                            <input
                              type="checkbox"
                              checked={Boolean(cf.required)}
                              onChange={(e) => {
                                const next = [...sectionCustomFields];
                                next[idx] = { ...next[idx], required: e.target.checked };
                                setSectionCustomFields(next);
                              }}
                              className="rounded border-slate-300"
                            />
                            <span>Req</span>
                          </label>
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setSectionCustomFields(sectionCustomFields.filter((_, i) => i !== idx))
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Remove field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* + Add Field Input Bar */}
                <div className="p-3 bg-white border-2 border-indigo-300 rounded-xl space-y-2">
                  <div className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    <span>+ Add New Custom Field to This Section</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={newCustomFieldLabel}
                        onChange={(e) => setNewCustomFieldLabel(e.target.value)}
                        placeholder="Field Name (e.g. Pipe Pressure Bar, Inverter kW, Pole No)"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        value={newCustomFieldPlaceholder}
                        onChange={(e) => setNewCustomFieldPlaceholder(e.target.value)}
                        placeholder="Example / Unit hint (e.g. e.g. 4.2 Bar / PN16)"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-1 flex items-center justify-center">
                      <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newCustomFieldRequired}
                          onChange={(e) => setNewCustomFieldRequired(e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        <span>Req</span>
                      </label>
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddFieldToSectionModal}
                        className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Field</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 sticky bottom-0 bg-white z-10">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  {editingSection ? 'Save Section & Fields' : 'Create Section & Load Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIGURE DEFAULT MATERIAL TEMPLATE MODAL (BOM) */}
      {showTemplateModal && templateSection && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-bold text-base text-slate-900">
                    Default Material Template: {templateSection.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Define the standard materials routinely consumed in this section. When logging material usage on any project in this section, these items will automatically pre-populate.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {templateError && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-semibold">
                {templateError}
              </div>
            )}

            <form onSubmit={handleSaveTemplate} className="space-y-4 flex-1 overflow-y-auto">
              <div className="space-y-2">
                {templateRows.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-mono font-bold text-slate-400 w-6 text-center">
                      #{idx + 1}
                    </span>
                    <div className="flex-1">
                      <select
                        value={row.itemId}
                        onChange={(e) => {
                          const next = [...templateRows];
                          next[idx].itemId = e.target.value;
                          setTemplateRows(next);
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-semibold focus:outline-none"
                      >
                        <option value="">-- Select Material / Item --</option>
                        {activeItems.map((itm) => (
                          <option key={itm.id} value={itm.id}>
                            [{itm.itemCode}] {itm.itemName} ({itm.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-36">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="Suggested Qty"
                        value={row.suggestedQty}
                        onChange={(e) => {
                          const next = [...templateRows];
                          next[idx].suggestedQty = e.target.value ? Number(e.target.value) : '';
                          setTemplateRows(next);
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-center focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (templateRows.length <= 1) return;
                        setTemplateRows(templateRows.filter((_, i) => i !== idx));
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setTemplateRows([...templateRows, { itemId: '', suggestedQty: '' }])}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Add Item to Template</span>
              </button>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Save Material Template ({templateRows.filter((r) => r.itemId).length} items)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT USAGES, SUB-PROJECTS & FREE STOCK RECONCILIATION MODAL */}
      {viewingProjectUsages && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3 mb-4 gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-700" />
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-900 text-white">
                    {viewingEffectiveScope === 'main'
                      ? '🏢 Major / Main Project Reconciliation'
                      : viewingEffectiveScope === 'sub'
                      ? '↳ Sub-Project Details'
                      : '📄 Individual Project Details'}
                  </span>
                  <h3 className="font-bold text-base text-slate-900">
                    {viewingProjectUsages.projectName}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>ID: <strong className="text-slate-800 font-mono">{viewingProjectUsages.projectId}</strong></span>
                  <span>Section: <strong className="text-slate-800">{viewingProjectUsages.projectTypeName || 'General'}</strong></span>
                  <span>District: <strong className="text-slate-800">{viewingProjectUsages.district || '—'}</strong></span>
                  {viewingProjectUsages.parentProjectId && (
                    <button
                      type="button"
                      onClick={() => {
                        const parentObj = activeProjects.find((p) => p.id === viewingProjectUsages.parentProjectId);
                        if (parentObj) setViewingProjectUsages(parentObj);
                      }}
                      className="text-indigo-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <FolderTree className="w-3.5 h-3.5" />
                      <span>View Parent Main Project ({viewingProjectUsages.parentProjectName}) →</span>
                    </button>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingProjectUsages(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {/* 1. Free Stock Pool Reconciliation (Main Project or Shared Pool) */}
              {modalFreeStockList.length > 0 && (
                <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
                        {viewingEffectiveScope === 'sub'
                          ? `Shared Free Stock Pool (Under Main Project: ${modalFreeStockList[0]?.rootProjectName})`
                          : 'Total Main Project Free Stock Reconciliation'}
                      </h4>
                    </div>
                    <span className="text-[11px] text-indigo-300 font-semibold">
                      Auto-deducts as Sub-Projects log usage
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-2">Material</th>
                          <th className="py-2 px-2 text-right">Received Under Main</th>
                          {viewingEffectiveScope === 'sub' && (
                            <th className="py-2 px-2 text-right">Used by THIS Sub-Project</th>
                          )}
                          <th className="py-2 px-2 text-right">Total Used (All Sub-Projects)</th>
                          <th className="py-2 px-2 text-right">Main Pool Remaining</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 font-mono">
                        {modalFreeStockList.map((row) => (
                          <tr key={row.itemId}>
                            <td className="py-2 px-2 font-sans font-semibold text-white">
                              [{row.itemCode}] {row.itemName}
                            </td>
                            <td className="py-2 px-2 text-right text-cyan-300 font-bold">
                              {formatNumber(row.totalReceived)} {row.unit}
                            </td>
                            {viewingEffectiveScope === 'sub' && (
                              <td className="py-2 px-2 text-right text-teal-300 font-bold">
                                {formatNumber(row.directUsed)} {row.unit}
                              </td>
                            )}
                            <td className="py-2 px-2 text-right text-amber-300 font-bold">
                              {formatNumber(row.totalUsed)} {row.unit}
                            </td>
                            <td className="py-2 px-2 text-right text-emerald-400 font-black">
                              {formatNumber(row.remainingBalance)} {row.unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2. Sub-Projects Breakdown (When viewing a Major / Main Project) */}
              {viewingEffectiveScope === 'main' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                      <FolderTree className="w-4 h-4 text-indigo-600" />
                      <span>Sub-Projects Breakdown Under This Main Project ({viewingChildSubProjects.length})</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const parentToUse = viewingProjectUsages;
                        setViewingProjectUsages(null);
                        handleOpenAddModal(parentToUse.projectTypeId, 'sub', parentToUse);
                      }}
                      className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Sub-Project</span>
                    </button>
                  </div>

                  {subProjectSummaryForModal.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                      No Sub-Projects added under this Main Project yet. Click &quot;+ Add Sub-Project&quot; to register sub-projects.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {subProjectSummaryForModal.map(({ subProject, voucherCount, itemsMap }) => (
                        <div
                          key={subProject.id}
                          className="bg-teal-50/40 border border-teal-200 rounded-xl p-3.5 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between border-b border-teal-200/70 pb-2 mb-2">
                              <div>
                                <span className="font-mono text-[10px] font-bold text-teal-800 bg-white px-1.5 py-0.5 rounded border border-teal-200">
                                  {subProject.projectId}
                                </span>
                                <div className="font-bold text-xs text-slate-900 mt-1">
                                  {subProject.projectName}
                                </div>
                              </div>
                              <span className="text-[11px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200">
                                {voucherCount} voucher(s)
                              </span>
                            </div>

                            {itemsMap.size === 0 ? (
                              <div className="text-[11px] text-slate-400 italic py-1">
                                No material usage logged yet on this sub-project.
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {Array.from(itemsMap.entries()).map(([itmId, qty]) => {
                                  const itm = items.find((i) => i.id === itmId);
                                  return (
                                    <div key={itmId} className="flex justify-between text-xs text-slate-700">
                                      <span>{itm?.itemName || itmId}:</span>
                                      <span className="font-mono font-bold text-slate-900">
                                        {formatNumber(qty)} {itm?.unit || 'units'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="mt-3 pt-2 border-t border-teal-200/50 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setViewingProjectUsages(subProject)}
                              className="text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
                            >
                              Inspect Sub-Project Only →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Summary Cards by Team */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <Users2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {viewingEffectiveScope === 'main'
                      ? 'Combined Team Consumption Across All Sub-Projects'
                      : 'Team Allocation & Consumed Quantities'}
                  </span>
                </h4>

                {teamUsageSummary.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl text-xs">
                    No material usage recorded yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {teamUsageSummary.map((t, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-2">
                          <span className="font-bold text-xs text-slate-900">{t.teamName}</span>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {t.voucherCount} voucher(s)
                          </span>
                        </div>
                        <div className="space-y-1">
                          {Array.from(t.itemsMap.entries()).map(([itmId, qty]) => {
                            const itm = items.find((i) => i.id === itmId);
                            return (
                              <div key={itmId} className="flex justify-between text-xs text-slate-600">
                                <span>{itm?.itemName || itmId}:</span>
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
                )}
              </div>

              {/* 4. Vouchers Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Usage Voucher Records ({projectUsagesForModal.length})</span>
                </h4>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Voucher #</th>
                        {viewingEffectiveScope === 'main' && (
                          <th className="py-2.5 px-3">Sub-Project</th>
                        )}
                        <th className="py-2.5 px-3">Team</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Items Consumed</th>
                        <th className="py-2.5 px-3">Supervisor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projectUsagesForModal.map((pu) => (
                        <tr key={pu.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                            {pu.usageVoucherNumber}
                          </td>
                          {viewingEffectiveScope === 'main' && (
                            <td className="py-2.5 px-3 font-semibold text-teal-800">
                              {pu.projectName}
                            </td>
                          )}
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {pu.teamName || 'Team'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                            {pu.usageDate || (pu.date ? new Date(pu.date).toLocaleDateString() : '—')}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="space-y-0.5">
                              {pu.items.map((row, i) => {
                                const itm = items.find((it) => it.id === row.itemId);
                                const wQty = Number(row.wastageQuantity || 0);
                                return (
                                  <div key={i} className="text-[11px] text-slate-700">
                                    • {itm?.itemName || row.itemId}: <strong>{formatNumber(row.quantity)} {itm?.unit || ''}</strong>
                                    {wQty > 0 && (
                                      <span className="text-amber-700 font-semibold ml-1">
                                        (+{formatNumber(wQty)} wastage = {formatNumber(Number(row.quantity || 0) + wQty)} total)
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {pu.supervisorOrLeaderName || pu.supervisorOrLeader || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
              <button
                type="button"
                onClick={() => setViewingProjectUsages(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Project */}
      {deleteConfirmProject && (
        <ConfirmModal
          isOpen={!!deleteConfirmProject}
          title={`Move Project "${deleteConfirmProject.projectName}" to Recycle Bin?`}
          message={`Are you sure you want to move project ${deleteConfirmProject.projectId} (${deleteConfirmProject.projectName}) to the Recycle Bin? It can be restored anytime.`}
          confirmLabel="Move to Recycle Bin"
          isDestructive={true}
          onConfirm={() => {
            softDeleteProject(deleteConfirmProject.id);
            showToast(`Project ${deleteConfirmProject.projectId} moved to Recycle Bin.`);
            setDeleteConfirmProject(null);
          }}
          onClose={() => setDeleteConfirmProject(null)}
        />
      )}

      {/* Delete Confirmation Modal for Project Section */}
      {deleteConfirmSection && (
        <ConfirmModal
          isOpen={!!deleteConfirmSection}
          title={`Delete Project Section "${deleteConfirmSection.name}"?`}
          message={`Are you sure you want to delete this section? Existing projects will remain safe as General Projects.`}
          confirmLabel="Delete Section"
          isDestructive={true}
          onConfirm={() => {
            deleteProjectType(deleteConfirmSection.id);
            showToast(`Project section "${deleteConfirmSection.name}" deleted.`);
            setDeleteConfirmSection(null);
          }}
          onClose={() => setDeleteConfirmSection(null)}
        />
      )}
    </div>
  );
};
