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
import { Project, ProjectScope, ProjectType, ProjectTypeTemplateItem } from '../../types';
import { formatNumber } from '../../utils/exportUtils';
import { ConfirmModal } from '../common/ConfirmModal';

export const ProjectsManagementView: React.FC = () => {
  const {
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
  } = useStock();

  const [activeTab, setActiveTab] = useState<'projects' | 'sections'>('projects');
  const [searchQuery, setSearchQuery] = useState('');
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
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [siteIdentifier, setSiteIdentifier] = useState('');
  const [projectTypeId, setProjectTypeId] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [district, setDistrict] = useState('');
  const [subArea, setSubArea] = useState('');
  const [formError, setFormError] = useState('');

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

  // Candidate parent projects (all Main Projects + Individual Projects that could become a Main Project)
  const selectableParentProjects = useMemo(
    () =>
      activeProjects.filter(
        (p) =>
          !p.parentProjectId &&
          p.projectScope !== 'sub' &&
          (!editingProject || p.id !== editingProject.id)
      ),
    [activeProjects, editingProject]
  );

  // Distinct districts for filtering
  const districts = Array.from(
    new Set(activeProjects.map((p) => p.district).filter(Boolean))
  ).sort();

  const filteredProjects = useMemo(() => {
    const raw = activeProjects.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.projectId.toLowerCase().includes(q) ||
        p.projectName.toLowerCase().includes(q) ||
        (p.parentProjectName && p.parentProjectName.toLowerCase().includes(q)) ||
        (p.parentProjectCode && p.parentProjectCode.toLowerCase().includes(q)) ||
        (p.customerName && p.customerName.toLowerCase().includes(q)) ||
        (p.customerPhone && p.customerPhone.toLowerCase().includes(q)) ||
        (p.siteIdentifier && p.siteIdentifier.toLowerCase().includes(q)) ||
        (p.projectTypeName && p.projectTypeName.toLowerCase().includes(q)) ||
        (p.referenceNo && p.referenceNo.toLowerCase().includes(q)) ||
        (p.district && p.district.toLowerCase().includes(q)) ||
        (p.subArea && p.subArea.toLowerCase().includes(q));

      const matchesDistrict = districtFilter === 'all' || p.district === districtFilter;
      const matchesSection = sectionFilter === 'all' || p.projectTypeId === sectionFilter;
      const effScope = getEffectiveScope(p);
      const matchesScope = scopeFilter === 'all' || effScope === scopeFilter;
      const matchesParent =
        parentFilterId === 'all' || p.id === parentFilterId || p.parentProjectId === parentFilterId;

      return matchesSearch && matchesDistrict && matchesSection && matchesScope && matchesParent;
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
  }, [activeProjects, searchQuery, districtFilter, sectionFilter, scopeFilter, parentFilterId]);

  // Duplicate / existing project match check in modal
  const existingMatchesInModal = useMemo(() => {
    if (!showAddModal) return [];
    const cleanPhone = customerPhone.trim().toLowerCase();
    const cleanSiteId = siteIdentifier.trim().toLowerCase();
    const cleanProjId = projectId.trim().toLowerCase();
    const cleanName = projectName.trim().toLowerCase();

    if (!cleanPhone && !cleanSiteId && !cleanProjId && !cleanName) return [];

    return activeProjects.filter((p) => {
      if (editingProject && p.id === editingProject.id) return false;
      const matchPhone = cleanPhone && p.customerPhone && p.customerPhone.trim().toLowerCase() === cleanPhone;
      const matchSiteId = cleanSiteId && p.siteIdentifier && p.siteIdentifier.trim().toLowerCase() === cleanSiteId;
      const matchProjId = cleanProjId && p.projectId.trim().toLowerCase() === cleanProjId;
      const matchName = cleanName && p.projectName.trim().toLowerCase() === cleanName;
      return matchPhone || matchSiteId || matchProjId || matchName;
    });
  }, [showAddModal, customerPhone, siteIdentifier, projectId, projectName, activeProjects, editingProject]);

  const handleOpenAddModal = (
    defaultSectionId?: string,
    defaultScope: ProjectScope = 'individual',
    preselectedParent?: Project
  ) => {
    setEditingProject(null);
    setProjectScope(defaultScope);
    setInitialSubProjects([]);

    if (defaultScope === 'sub' && preselectedParent) {
      const existingSubsCount = activeProjects.filter((sp) => sp.parentProjectId === preselectedParent.id).length;
      setParentProjectId(preselectedParent.id);
      setProjectId(`${preselectedParent.projectId}-SUB-${String(existingSubsCount + 1).padStart(2, '0')}`);
      setProjectName('');
      setCustomerName(preselectedParent.customerName || '');
      setCustomerPhone(preselectedParent.customerPhone || '');
      setSiteIdentifier('');
      setProjectTypeId(preselectedParent.projectTypeId || defaultSectionId || activeProjectTypes[0]?.id || '');
      setReferenceNo(preselectedParent.referenceNo || `REF-${Math.floor(1000 + Math.random() * 9000)}`);
      setDistrict(preselectedParent.district || '');
      setSubArea('');
    } else if (defaultScope === 'main') {
      setParentProjectId('');
      setProjectId(`MAJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setProjectName('');
      setCustomerName('');
      setCustomerPhone('');
      setSiteIdentifier('');
      const targetSec = defaultSectionId || (sectionFilter !== 'all' ? sectionFilter : (activeProjectTypes[0]?.id || ''));
      setProjectTypeId(targetSec);
      setReferenceNo(`REF-MAJ-${Math.floor(1000 + Math.random() * 9000)}`);
      setDistrict('');
      setSubArea('');
    } else {
      setParentProjectId(mainProjects[0]?.id || '');
      setProjectId(`PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setProjectName('');
      setCustomerName('');
      setCustomerPhone('');
      setSiteIdentifier('');
      const targetSec = defaultSectionId || (sectionFilter !== 'all' ? sectionFilter : (activeProjectTypes[0]?.id || ''));
      setProjectTypeId(targetSec);
      setReferenceNo(`REF-${Math.floor(1000 + Math.random() * 9000)}`);
      setDistrict('');
      setSubArea('');
    }

    setFormError('');
    setShowAddModal(true);
  };

  const handleParentProjectChange = (newParentId: string) => {
    setParentProjectId(newParentId);
    const parentObj = activeProjects.find((p) => p.id === newParentId);
    if (parentObj && !editingProject) {
      const existingSubsCount = activeProjects.filter((sp) => sp.parentProjectId === parentObj.id).length;
      setProjectId(`${parentObj.projectId}-SUB-${String(existingSubsCount + 1).padStart(2, '0')}`);
      if (parentObj.projectTypeId) setProjectTypeId(parentObj.projectTypeId);
      if (parentObj.customerName) setCustomerName(parentObj.customerName);
      if (parentObj.district) setDistrict(parentObj.district);
      if (parentObj.referenceNo) setReferenceNo(parentObj.referenceNo);
    }
  };

  const handleOpenEditModal = (p: Project) => {
    setEditingProject(p);
    const effScope = getEffectiveScope(p);
    setProjectScope(effScope);
    setParentProjectId(p.parentProjectId || '');
    setProjectId(p.projectId);
    setProjectName(p.projectName);
    setCustomerName(p.customerName || '');
    setCustomerPhone(p.customerPhone || '');
    setSiteIdentifier(p.siteIdentifier || '');
    setProjectTypeId(p.projectTypeId || '');
    setReferenceNo(p.referenceNo || '');
    setDistrict(p.district || '');
    setSubArea(p.subArea || '');
    setInitialSubProjects([]);
    setFormError('');
    setShowAddModal(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!projectId.trim() || !projectName.trim()) {
      setFormError('Project ID and Project Name are required.');
      return;
    }

    if (projectScope === 'sub' && !parentProjectId) {
      setFormError('Please select the Parent Major / Main Project for this Sub-Project.');
      return;
    }

    const selectedTypeObj = activeProjectTypes.find((pt) => pt.id === projectTypeId);
    const pTypeName = selectedTypeObj ? selectedTypeObj.name : '';
    const parentObj =
      projectScope === 'sub' ? activeProjects.find((p) => p.id === parentProjectId) : undefined;

    // If user linked a Sub-Project to an existing Individual project, promote that parent to 'main'
    if (projectScope === 'sub' && parentObj && parentObj.projectScope !== 'main') {
      updateProject(parentObj.id, { projectScope: 'main' });
    }

    if (editingProject) {
      updateProject(editingProject.id, {
        projectId: projectId.trim().toUpperCase(),
        projectName: projectName.trim(),
        projectScope,
        parentProjectId: projectScope === 'sub' ? parentObj?.id : undefined,
        parentProjectCode: projectScope === 'sub' ? parentObj?.projectId : undefined,
        parentProjectName: projectScope === 'sub' ? parentObj?.projectName : undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        siteIdentifier: siteIdentifier.trim().toUpperCase() || undefined,
        projectTypeId: projectTypeId || undefined,
        projectTypeName: pTypeName || undefined,
        referenceNo: referenceNo.trim(),
        district: district.trim(),
        subArea: subArea.trim(),
      });
      showToast(`Project "${projectName}" updated successfully.`);
    } else {
      const createdMainOrProj = addProject({
        projectId: projectId.trim().toUpperCase(),
        projectName: projectName.trim(),
        projectScope,
        parentProjectId: projectScope === 'sub' ? parentObj?.id : undefined,
        parentProjectCode: projectScope === 'sub' ? parentObj?.projectId : undefined,
        parentProjectName: projectScope === 'sub' ? parentObj?.projectName : undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        siteIdentifier: siteIdentifier.trim().toUpperCase() || undefined,
        projectTypeId: projectTypeId || undefined,
        projectTypeName: pTypeName || undefined,
        referenceNo: referenceNo.trim(),
        district: district.trim(),
        subArea: subArea.trim(),
        status: 'Active',
      });

      // If creating a Major / Main Project and user added quick initial Sub-Projects, register them too!
      let createdSubCount = 0;
      if (projectScope === 'main' && initialSubProjects.length > 0) {
        initialSubProjects.forEach((sp, idx) => {
          if (!sp.subName.trim()) return;
          createdSubCount++;
          const subCode = `${createdMainOrProj.projectId}-SUB-${String(idx + 1).padStart(2, '0')}`;
          addProject({
            projectId: subCode,
            projectName: sp.subName.trim(),
            projectScope: 'sub',
            parentProjectId: createdMainOrProj.id,
            parentProjectCode: createdMainOrProj.projectId,
            parentProjectName: createdMainOrProj.projectName,
            customerName: customerName.trim() || undefined,
            customerPhone: customerPhone.trim() || undefined,
            siteIdentifier: sp.siteId.trim().toUpperCase() || undefined,
            projectTypeId: projectTypeId || undefined,
            projectTypeName: pTypeName || undefined,
            referenceNo: referenceNo.trim(),
            district: district.trim(),
            subArea: sp.subArea.trim() || subArea.trim(),
            status: 'Active',
          });
        });
      }

      if (projectScope === 'main' && createdSubCount > 0) {
        showToast(
          `Major Project "${projectName}" and ${createdSubCount} Sub-Project(s) registered successfully!`
        );
      } else if (projectScope === 'sub' && parentObj) {
        showToast(
          `Sub-Project "${projectName}" registered under Main Project "${parentObj.projectName}".`
        );
      } else {
        showToast(`Project "${projectName}" registered successfully.`);
      }
    }

    setShowAddModal(false);
  };

  // Section / Type Handlers
  const handleOpenAddSectionModal = () => {
    setEditingSection(null);
    setSectionName('');
    setSectionCode('');
    setSectionDescription('');
    setSectionColor('emerald');
    setSectionError('');
    setShowSectionModal(true);
  };

  const handleOpenEditSectionModal = (pt: ProjectType) => {
    setEditingSection(pt);
    setSectionName(pt.name);
    setSectionCode(pt.code || '');
    setSectionDescription(pt.description || '');
    setSectionColor(pt.color || 'emerald');
    setSectionError('');
    setShowSectionModal(true);
  };

  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    setSectionError('');

    if (!sectionName.trim()) {
      setSectionError('Please provide a section name.');
      return;
    }

    if (editingSection) {
      updateProjectType(editingSection.id, {
        name: sectionName.trim(),
        code: sectionCode.trim().toUpperCase() || undefined,
        description: sectionDescription.trim() || undefined,
        color: sectionColor,
      });
      showToast(`Project Section "${sectionName}" updated successfully.`);
    } else {
      addProjectType({
        name: sectionName.trim(),
        code: sectionCode.trim().toUpperCase() || undefined,
        description: sectionDescription.trim() || undefined,
        color: sectionColor,
        templateItems: [],
      });
      showToast(`Project Section "${sectionName}" created successfully.`);
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
          itemsMap.set(row.itemId, (itemsMap.get(row.itemId) || 0) + Number(row.quantity));
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
        existing.itemsMap.set(row.itemId, curQty + Number(row.quantity));
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
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Infrastructure Projects</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Main Projects, Sub-Projects & Standalone Registry</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Project Registry & New Section Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Manage <strong>Major / Main Projects</strong> (with shared Client Free Stock pools), linked <strong>Sub-Projects</strong> (for granular field usage tracking), and <strong>Individual Projects</strong> alongside custom BOM templates.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-300 shadow-2xs whitespace-nowrap"
            title="Download CSV Template with sample format"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Sample CSV</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-300 shadow-2xs cursor-pointer whitespace-nowrap"
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
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-300 shadow-2xs whitespace-nowrap"
            title="Export project catalog to CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('sections');
              handleOpenAddSectionModal();
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>+ New Section Registry</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal(undefined, 'main')}
            className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
            title="Register a Major Umbrella Project that holds multiple Sub-Projects and receives bulk Client Free Stock"
          >
            <FolderTree className="w-4 h-4 text-indigo-200" />
            <span>+ Main Project</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal(undefined, 'individual')}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-emerald-200" />
            <span>Register Project</span>
          </button>
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
                      <td colSpan={7} className="py-12 text-center text-slate-400">
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
                              ? 'bg-indigo-50/35 hover:bg-indigo-50/70'
                              : effScope === 'sub'
                              ? 'bg-slate-50/60 hover:bg-teal-50/40'
                              : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            <div className={`flex flex-col gap-1 ${effScope === 'sub' ? 'pl-4 border-l-2 border-teal-400' : ''}`}>
                              <span className="bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-200 w-fit shadow-2xs">
                                {p.projectId}
                              </span>
                              {effScope === 'main' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-600 text-white w-fit">
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
                              {p.siteIdentifier && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-semibold border border-blue-200">
                                  <Hash className="w-2.5 h-2.5" />
                                  <span>Site: {p.siteIdentifier}</span>
                                </span>
                              )}
                              {p.customerPhone && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-mono font-semibold border border-purple-200">
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>Tel: {p.customerPhone}</span>
                                </span>
                              )}
                              {p.customerName && p.customerName !== p.projectName && (
                                <span className="text-slate-600 font-medium text-[11px]">
                                  Client: <strong>{p.customerName}</strong>
                                </span>
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
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">New Section Registry & BOM Material Templates</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Create project sections like <strong>Telecom New Connection</strong> or <strong>Telecom Cable Development</strong>. Attach default material item templates (BOM) so supervisors save time when entering daily usage.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddSectionModal}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create New Section</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeProjectTypes.map((pt) => {
              const assignedProjects = activeProjects.filter((p) => p.projectTypeId === pt.id);
              const templateCount = (pt.templateItems || []).length;

              return (
                <div
                  key={pt.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
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
                          title="Edit section details"
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

                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                      {pt.description || 'Custom telecommunications project work section.'}
                    </p>

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

                  <div className="mt-4 pt-3">
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
              {/* STEP 1: SELECT PROJECT STRUCTURE TYPE */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Select Project Structure Type *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProjectScope('individual');
                      if (!editingProject && projectId.startsWith('MAJ-')) {
                        setProjectId(projectId.replace('MAJ-', 'PRJ-'));
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      projectScope === 'individual'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-emerald-500/40'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className="text-xs font-extrabold flex items-center gap-1.5">
                      <span>📄 Individual Project</span>
                    </div>
                    <div className={`text-[11px] mt-1 leading-snug ${projectScope === 'individual' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Single standalone project with its own direct stock & usage.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProjectScope('main');
                      if (!editingProject && projectId.startsWith('PRJ-')) {
                        setProjectId(projectId.replace('PRJ-', 'MAJ-'));
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      projectScope === 'main'
                        ? 'bg-indigo-950 text-white border-indigo-900 shadow-xs ring-2 ring-indigo-500/40'
                        : 'bg-white hover:bg-indigo-50/50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className="text-xs font-extrabold flex items-center gap-1.5">
                      <span>🏢 Major / Main Project</span>
                    </div>
                    <div className={`text-[11px] mt-1 leading-snug ${projectScope === 'main' ? 'text-indigo-200' : 'text-slate-500'}`}>
                      Umbrella project that receives bulk Free Stock for multiple Sub-Projects.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProjectScope('sub');
                      const defaultParent = selectableParentProjects[0];
                      if (defaultParent && !parentProjectId) {
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
                      <span>↳ Sub-Project</span>
                    </div>
                    <div className={`text-[11px] mt-1 leading-snug ${projectScope === 'sub' ? 'text-teal-200' : 'text-slate-500'}`}>
                      Operates under a Main Project & deducts from the Main Project&apos;s Free Stock.
                    </div>
                  </button>
                </div>

                {/* If Sub-Project is selected, show Parent Main Project selector */}
                {projectScope === 'sub' && (
                  <div className="pt-2 border-t border-slate-200 mt-2">
                    <label className="block text-xs font-bold text-teal-900 mb-1">
                      Select Parent Major / Main Project (Under Main Project) *
                    </label>
                    {selectableParentProjects.length === 0 ? (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                        No Main Project registered yet. Please select <strong>🏢 Major / Main Project</strong> above to register your Main Project first.
                      </div>
                    ) : (
                      <select
                        value={parentProjectId}
                        onChange={(e) => handleParentProjectChange(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-teal-300 rounded-lg text-xs font-bold text-slate-900 bg-teal-50/50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                      >
                        <option value="">-- Choose Parent Main Project --</option>
                        {selectableParentProjects.map((mp) => (
                          <option key={mp.id} value={mp.id}>
                            [{mp.projectId}] {mp.projectName} {mp.customerName ? `— Client: ${mp.customerName}` : ''} ({mp.district || 'General'})
                          </option>
                        ))}
                      </select>
                    )}
                    <p className="text-[11px] text-teal-700 mt-1 font-medium">
                      ✓ Any material usage entered for this Sub-Project will automatically deduct from the selected Main Project&apos;s Free Stock balance while keeping separate Sub-Project records.
                    </p>
                  </div>
                )}
              </div>

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
                    placeholder="e.g. MAJ-2026-001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Contract No</label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. REF-TEL-8812"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer / Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 0771234567"
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

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

              {/* Project Section / Category Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Project Section / Type *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      handleOpenAddSectionModal();
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:underline"
                  >
                    + Add New Section
                  </button>
                </div>
                <select
                  value={projectTypeId}
                  onChange={(e) => setProjectTypeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  <option value="">General Project (No specific section)</option>
                  {activeProjectTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name} {pt.code ? `(${pt.code})` : ''}
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

      {/* CREATE / EDIT PROJECT SECTION MODAL */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-700" />
                <h3 className="font-semibold text-base text-slate-900">
                  {editingSection ? 'Edit Project Section' : 'Create Project Section'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSectionModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section Name * (e.g. Telecom New Connection)
                </label>
                <input
                  type="text"
                  required
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  placeholder="e.g. Telecom New Connection"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Short Code (e.g. TNC)
                  </label>
                  <input
                    type="text"
                    value={sectionCode}
                    onChange={(e) => setSectionCode(e.target.value.toUpperCase())}
                    placeholder="e.g. TNC"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Badge Theme Color
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
                  placeholder="e.g. For subscriber drop wire, rosette, and fiber termination jobs..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
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
                  {editingSection ? 'Save Section' : 'Create Section'}
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
                                return (
                                  <div key={i} className="text-[11px] text-slate-700">
                                    • {itm?.itemName || row.itemId}: <strong>{formatNumber(row.quantity)} {itm?.unit || ''}</strong>
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
