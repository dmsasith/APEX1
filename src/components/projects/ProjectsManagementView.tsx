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
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Project } from '../../types';
import { formatDateTime } from '../../utils/exportUtils';
import { ConfirmModal } from '../common/ConfirmModal';

export const ProjectsManagementView: React.FC = () => {
  const {
    projects,
    activeProjects,
    addProject,
    bulkImportProjects,
    updateProject,
    softDeleteProject,
  } = useStock();

  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [district, setDistrict] = useState('');
  const [subArea, setSubArea] = useState('');
  const [formError, setFormError] = useState('');

  // Delete confirmation
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<Project | null>(null);

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
      (p.referenceNo && p.referenceNo.toLowerCase().includes(q)) ||
      (p.district && p.district.toLowerCase().includes(q)) ||
      (p.subArea && p.subArea.toLowerCase().includes(q));

    const matchesDistrict = districtFilter === 'all' || p.district === districtFilter;
    return matchesSearch && matchesDistrict;
  });

  const handleOpenAddModal = () => {
    setEditingProject(null);
    setProjectId(`PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setProjectName('');
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

    if (editingProject) {
      updateProject(editingProject.id, {
        projectId: projectId.trim().toUpperCase(),
        projectName: projectName.trim(),
        referenceNo: referenceNo.trim(),
        district: district.trim(),
        subArea: subArea.trim(),
      });
      showToast(`Project "${projectName}" updated successfully.`);
    } else {
      addProject({
        projectId: projectId.trim().toUpperCase(),
        projectName: projectName.trim(),
        referenceNo: referenceNo.trim(),
        district: district.trim(),
        subArea: subArea.trim(),
        status: 'Active',
      });
      showToast(`Project "${projectName}" registered successfully.`);
    }

    setShowAddModal(false);
  };

  // Download Sample CSV Template
  const handleDownloadSampleCsv = () => {
    const csvContent =
      'Project ID,Project Name,Reference No,District,Sub Area\n' +
      'PRJ-2026-101,Fiber Expansion Phase 2,REF-FIB-8812,Colombo,Kollupitiya & Bambalapitiya\n' +
      'PRJ-2026-102,4G Tower Modernization,REF-TWR-3041,Gampaha,Negombo Coastal Link\n' +
      'PRJ-2026-103,Backbone Conduit Installation,REF-BBC-4910,Kandy,Peradeniya Sector 4\n' +
      'PRJ-2026-104,Metro Data Center Underground Power,REF-MDC-9210,Western,Dehiwala Base\n' +
      'PRJ-2026-105,Micro-cell Small Cell Rollout,REF-MSC-1102,Galle,Hikkaduwa South';

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

    const headers = ['Project ID', 'Project Name', 'Reference No', 'District', 'Sub Area', 'Created Date'];
    const rows = activeProjects.map((p) => [
      `"${p.projectId}"`,
      `"${p.projectName.replace(/"/g, '""')}"`,
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

      // Check header
      const headerLine = lines[0].toLowerCase();
      const hasExpectedCols =
        headerLine.includes('project id') || headerLine.includes('project name');

      const parsedRows: Array<Omit<Project, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>> = [];

      const startIndex = hasExpectedCols ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        // Parse CSV line handling quotes
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
        const pRef = (cols[2] || '').replace(/^"|"$/g, '').trim();
        const pDist = (cols[3] || '').replace(/^"|"$/g, '').trim();
        const pSub = (cols[4] || '').replace(/^"|"$/g, '').trim();

        if (pId && pName) {
          parsedRows.push({
            projectId: pId.toUpperCase(),
            projectName: pName,
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
            <span className="text-xs text-slate-500">Master Registry</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Project Management & CSV Import
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Register and manage telecom projects with District, Sub Area, and Reference details. These projects will automatically appear in the <strong>Project Material Usage</strong> tab to track consumption.
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
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Register Project</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, name, ref no, district, sub-area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
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

      {/* Projects Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-slate-700" />
            <h2 className="font-semibold text-sm text-slate-900">
              Active Registered Projects ({filteredProjects.length})
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
                <th className="py-3 px-4">Project Name</th>
                <th className="py-3 px-3">Reference No</th>
                <th className="py-3 px-3">District</th>
                <th className="py-3 px-3">Sub Area</th>
                <th className="py-3 px-3">Registered Date</th>
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
                      Click "Register Project" or "Import CSV" to add telecommunications projects.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        {p.projectId}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {p.projectName}
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
                    <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate" title={p.subArea}>
                      {p.subArea || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {p.createdAt ? formatDateTime(p.createdAt) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                          title="Edit project details"
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PROJECT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Fiber Expansion Metro Phase 2"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
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
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  {editingProject ? 'Save Changes' : 'Register Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
    </div>
  );
};
