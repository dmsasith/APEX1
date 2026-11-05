import React, { useState, useRef } from 'react';
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
  AlertCircle,
  Users2,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  Phone,
  Hash,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Project, ProjectType, ProjectTypeTemplateItem } from '../../types';
import { formatDateTime, formatNumber } from '../../utils/exportUtils';
import { ConfirmModal } from '../common/ConfirmModal';

export const ProjectsManagementView: React.FC = () => {
  const {
    projects,
    activeProjects,
    projectTypes,
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
  } = useStock();

  const [activeTab, setActiveTab] = useState<'projects' | 'sections'>('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for Project
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

  // Distinct districts for filtering
  const districts = Array.from(
    new Set(activeProjects.map((p) => p.district).filter(Boolean))
  ).sort();

  const filteredProjects = activeProjects.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.projectId.toLowerCase().includes(q) ||
      p.projectName.toLowerCase().includes(q) ||
      (p.customerName && p.customerName.toLowerCase().includes(q)) ||
      (p.customerPhone && p.customerPhone.toLowerCase().includes(q)) ||
      (p.siteIdentifier && p.siteIdentifier.toLowerCase().includes(q)) ||
      (p.projectTypeName && p.projectTypeName.toLowerCase().includes(q)) ||
      (p.referenceNo && p.referenceNo.toLowerCase().includes(q)) ||
      (p.district && p.district.toLowerCase().includes(q)) ||
      (p.subArea && p.subArea.toLowerCase().includes(q));

    const matchesDistrict = districtFilter === 'all' || p.district === districtFilter;
    const matchesSection = sectionFilter === 'all' || p.projectTypeId === sectionFilter;
    return matchesSearch && matchesDistrict && matchesSection;
  });

  // Duplicate / existing project match check in modal
  const existingMatchesInModal = React.useMemo(() => {
    if (!showAddModal) return [];
    const cleanPhone = customerPhone.trim().toLowerCase();
    const cleanSiteId = siteIdentifier.trim().toLowerCase();
    const cleanProjId = projectId.trim().toLowerCase();
    const cleanName = (customerName || projectName).trim().toLowerCase();

    if (!cleanPhone && !cleanSiteId && !cleanProjId && !cleanName) return [];

    return activeProjects.filter((p) => {
      if (editingProject && p.id === editingProject.id) return false;
      const matchPhone = cleanPhone && p.customerPhone && p.customerPhone.trim().toLowerCase() === cleanPhone;
      const matchSiteId = cleanSiteId && p.siteIdentifier && p.siteIdentifier.trim().toLowerCase() === cleanSiteId;
      const matchProjId = cleanProjId && p.projectId.trim().toLowerCase() === cleanProjId;
      const matchName = cleanName && p.projectName.trim().toLowerCase() === cleanName;
      return matchPhone || matchSiteId || matchProjId || matchName;
    });
  }, [showAddModal, customerPhone, siteIdentifier, projectId, customerName, projectName, activeProjects, editingProject]);

  const handleOpenAddModal = (defaultSectionId?: string) => {
    setEditingProject(null);
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
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (p: Project) => {
    setEditingProject(p);
    setProjectId(p.projectId);
    setProjectName(p.projectName);
    setCustomerName(p.customerName || '');
    setCustomerPhone(p.customerPhone || '');
    setSiteIdentifier(p.siteIdentifier || '');
    setProjectTypeId(p.projectTypeId || '');
    setReferenceNo(p.referenceNo || '');
    setDistrict(p.district || '');
    setSubArea(p.subArea || '');
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

    const selectedTypeObj = activeProjectTypes.find((pt) => pt.id === projectTypeId);
    const pTypeName = selectedTypeObj ? selectedTypeObj.name : '';

    if (editingProject) {
      updateProject(editingProject.id, {
        projectId: projectId.trim().toUpperCase(),
        projectName: projectName.trim(),
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
      addProject({
        projectId: projectId.trim().toUpperCase(),
        projectName: projectName.trim(),
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
      showToast(`Project "${projectName}" registered successfully.`);
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
      'Project ID,Project Name,Section Name,Reference No,District,Sub Area\n' +
      'PRJ-2026-101,Fiber Expansion Phase 2,Telecom Cable Development,REF-FIB-8812,Colombo,Kollupitiya & Bambalapitiya\n' +
      'PRJ-2026-102,FTTH Subscriber Connections Matale,Telecom New Connection,REF-TWR-3041,Matale,Sector 3 Urban\n' +
      'PRJ-2026-103,Backbone Conduit Installation,Telecom Cable Development,REF-BBC-4910,Kandy,Peradeniya Sector 4\n' +
      'PRJ-2026-104,Distribution Cable Rectification,Maintenance & Fault Rectification,REF-MDC-9210,Western,Dehiwala Base';

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
      alert('No projects available to export.');
      return;
    }

    const headers = ['Project ID', 'Project Name', 'Section / Type', 'Reference No', 'District', 'Sub Area', 'Created Date'];
    const rows = activeProjects.map((p) => [
      `"${p.projectId}"`,
      `"${p.projectName.replace(/"/g, '""')}"`,
      `"${(p.projectTypeName || 'Standard').replace(/"/g, '""')}"`,
      `"${(p.referenceNo || '').replace(/"/g, '""')}"`,
      `"${(p.district || '').replace(/"/g, '""')}"`,
      `"${(p.subArea || '').replace(/"/g, '""')}"`,
      `"${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}"`,
    ]);

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
        alert('CSV file appears empty or only contains a header.');
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

        if (pId && pName) {
          // match section name
          const matchType = activeProjectTypes.find(
            (pt) => pt.name.toLowerCase() === pSectionName.toLowerCase()
          );
          parsedRows.push({
            projectId: pId.toUpperCase(),
            projectName: pName,
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
        alert('Could not find valid project rows. Please check template format.');
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

  // Calculate project usage breakdown for modal
  const projectUsagesForModal = viewingProjectUsages
    ? projectUsages.filter((pu) => pu.projectId === viewingProjectUsages.id && !pu.isDeleted)
    : [];

  const teamUsageSummary = React.useMemo(() => {
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
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Infrastructure Projects</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Master Registry & Sections</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Project Registry & Custom Sections
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Organize projects by custom sections (e.g. <em>Telecom New Connection</em>, <em>Telecom Cable Development</em>), set default material templates, and track multi-team material usage without data loss.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-300 shadow-2xs"
            title="Download CSV Template with sample format"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Sample CSV</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-300 shadow-2xs cursor-pointer"
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
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-300 shadow-2xs"
            title="Export project catalog to CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
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
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'sections'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Project Sections & Material Templates ({activeProjectTypes.length})</span>
        </button>
      </div>

      {/* TAB 1: PROJECTS MASTER LIST */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
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
                Click a section to open projects or register directly into that section
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
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">All Projects</span>
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

          {/* Active Section Filter Notice Banner */}
          {sectionFilter !== 'all' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-950">Active Section:</span>{' '}
                  <span className="font-semibold text-emerald-900">
                    {activeProjectTypes.find((pt) => pt.id === sectionFilter)?.name}
                  </span>{' '}
                  <span className="text-emerald-700">
                    ({filteredProjects.length} project(s) registered)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(sectionFilter)}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Register Project in this Section</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSectionFilter('all')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-emerald-300 rounded-lg transition cursor-pointer"
                >
                  View All Sections
                </button>
              </div>
            </div>
          )}

          {/* Search & Filter Toolbar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by ID, name, site ID, phone, section..."
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

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Project Section Filter */}
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs text-slate-600 font-medium">Section:</span>
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
                <span className="text-xs text-slate-600 font-medium">District:</span>
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-semibold focus:outline-none"
                >
                  <option value="all">All Districts ({activeProjects.length})</option>
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
                  Registered Projects ({filteredProjects.length})
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
                    <th className="py-3 px-3">Project ID</th>
                    <th className="py-3 px-4">Project / Customer Details</th>
                    <th className="py-3 px-3">Section / Type</th>
                    <th className="py-3 px-3">Reference No</th>
                    <th className="py-3 px-3">District</th>
                    <th className="py-3 px-3">Sub Area</th>
                    <th className="py-3 px-3 text-center">Usages & Teams</th>
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
                          Click "Register Project" or select a section card to add telecom projects.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((p) => {
                      const usagesCount = projectUsages.filter(
                        (pu) => pu.projectId === p.id && !pu.isDeleted
                      ).length;
                      const matchedType = activeProjectTypes.find((pt) => pt.id === p.projectTypeId);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                              {p.projectId}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                              {p.projectName}
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
                                <span className="text-slate-500 text-[11px]">
                                  Cust: {p.customerName}
                                </span>
                              )}
                            </div>
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
                              <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                <MapPin className="w-3 h-3 text-emerald-600" />
                                <span>{p.district}</span>
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600 max-w-[180px] truncate" title={p.subArea}>
                            {p.subArea || '—'}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {usagesCount > 0 ? (
                              <button
                                type="button"
                                onClick={() => setViewingProjectUsages(p)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[11px] transition cursor-pointer"
                              >
                                <Package className="w-3 h-3" />
                                <span>{usagesCount} usage entry(s)</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">No usage yet</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(p)}
                                className="p-1.5 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                                title="Edit project details or change section"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmProject(p)}
                                className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
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
              <h2 className="text-base font-bold text-slate-900">Custom Project Sections & BOM Templates</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Create sections like <strong>Telecom New Connection</strong> or <strong>Telecom Cable Development</strong>. Attach default material item templates so supervisors save time when entering daily usage.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddSectionModal}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Section</span>
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
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-700" />
                <h3 className="font-semibold text-base text-slate-900">
                  {editingProject ? 'Edit Project Details' : 'Register New Project'}
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

            {/* Zero-Data-Loss Safety Notice when editing */}
            {editingProject && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Zero-Data-Loss Guarantee:</span> If this project was accidentally registered under the wrong section, you can safely select the correct section below. All previously used materials, team logs, and vouchers will remain 100% intact.
                </div>
              </div>
            )}

            {/* Real-time Duplicate / Existing Project Detection Banner */}
            {existingMatchesInModal.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Existing Record Notice:</span> Found {existingMatchesInModal.length} existing project(s) with matching Site ID, Phone, or Name:
                  <div className="mt-1 font-semibold text-amber-900">
                    {existingMatchesInModal.map((m) => `"${m.projectName}" (${m.siteIdentifier ? `Site: ${m.siteIdentifier}, ` : ''}${m.customerPhone ? `Tel: ${m.customerPhone}` : m.projectId})`).join(' | ')}
                  </div>
                  <div className="mt-1 text-[11px] text-amber-800">
                    Note: Multiple visits or duplicate entries with the same site ID/phone number are fully permitted in the system. You can proceed to save.
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project ID *</label>
                  <input
                    type="text"
                    required
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value.toUpperCase())}
                    placeholder="e.g. PRJ-2026-001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reference No</label>
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
                  Project / Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Dialog Fibre Conn - Nimal Perera"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Phone Number
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
                <p className="text-[11px] text-slate-500 mt-1">
                  Projects in this section will automatically load the section's standard BOM template when logging material usages.
                </p>
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
                  {editingProject ? 'Save Changes' : 'Register Project'}
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
                {templateRows.map((row, idx) => {
                  const itemObj = items.find((itm) => itm.id === row.itemId);
                  return (
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
                  );
                })}
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

      {/* PROJECT USAGES & MULTI-TEAM RECONCILIATION MODAL */}
      {viewingProjectUsages && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-bold text-base text-slate-900">
                    Project Usages & Team Breakdown: {viewingProjectUsages.projectName}
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>ID: <strong className="text-slate-800 font-mono">{viewingProjectUsages.projectId}</strong></span>
                  <span>Section: <strong className="text-slate-800">{viewingProjectUsages.projectTypeName || 'General'}</strong></span>
                  <span>District: <strong className="text-slate-800">{viewingProjectUsages.district || '—'}</strong></span>
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

            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Summary Cards by Team */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <Users2 className="w-4 h-4 text-emerald-600" />
                  <span>Team Allocation & Consumed Quantities</span>
                </h4>

                {teamUsageSummary.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No material usage recorded yet for this project.
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

              {/* Vouchers Table */}
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
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
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
