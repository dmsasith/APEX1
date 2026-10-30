import React, { useState } from 'react';
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
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { ProjectMaterialUsage, ProjectUsageItemRow } from '../../types';
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
    projectUsages,
    currentUser,
    getTeamInHandStock,
    logProjectMaterialUsage,
    deleteProjectUsage,
    clearProjectUsages,
    activeUsers,
  } = useStock();

  const [selectedUsageForPrint, setSelectedUsageForPrint] = useState<ProjectMaterialUsage | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');

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
  const branchSites = activeSites.filter((s) => !s.isMainWarehouse);
  const initialSiteId =
    currentUser.siteId !== 'all' ? currentUser.siteId : (branchSites[0]?.id || activeSites[0]?.id || '');
  const [selectedSiteId, setSelectedSiteId] = useState<string>(initialSiteId);

  // Teams for selected site
  const availableTeams = activeTeams.filter((t) => t.assignedSiteId === selectedSiteId);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(availableTeams[0]?.id || '');

  // Project selection
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjects[0]?.id || '');

  // Supervisor / Team Leader
  const currentTeam = teams.find((t) => t.id === selectedTeamId) || activeTeams.find((t) => t.id === selectedTeamId);
  const [supervisorName, setSupervisorName] = useState<string>(currentTeam?.teamLeaderName || '');

  // Date and details
  const [usageDate, setUsageDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [workDetails, setWorkDetails] = useState('');

  // Team in-hand stock calculation
  const teamInHand = selectedTeamId ? getTeamInHandStock(selectedTeamId) : null;
  // Items held in-hand with balance > 0
  const eligibleItems = teamInHand?.items.filter((i) => i.currentInHand > 0) || [];

  // Multi-row items table
  const [itemRows, setItemRows] = useState<ItemEntryRow[]>([
    { itemId: eligibleItems[0]?.itemId || '', quantity: '' },
  ]);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle site change
  const handleSiteChange = (newSiteId: string) => {
    setSelectedSiteId(newSiteId);
    const siteTeams = activeTeams.filter((t) => t.assignedSiteId === newSiteId);
    const firstTeam = siteTeams[0]?.id || '';
    setSelectedTeamId(firstTeam);
    const tObj = teams.find((t) => t.id === firstTeam);
    if (tObj) setSupervisorName(tObj.teamLeaderName);
    
    // Refresh eligible items for new team
    if (firstTeam) {
      const summary = getTeamInHandStock(firstTeam);
      const eligible = summary.items.filter((i) => i.currentInHand > 0);
      setItemRows([{ itemId: eligible[0]?.itemId || '', quantity: '' }]);
    } else {
      setItemRows([{ itemId: '', quantity: '' }]);
    }
  };

  // Handle team change
  const handleTeamChange = (newTeamId: string) => {
    setSelectedTeamId(newTeamId);
    const tObj = teams.find((t) => t.id === newTeamId) || activeTeams.find((t) => t.id === newTeamId);
    if (tObj) setSupervisorName(tObj.teamLeaderName);

    const summary = getTeamInHandStock(newTeamId);
    const eligible = summary.items.filter((i) => i.currentInHand > 0);
    setItemRows([{ itemId: eligible[0]?.itemId || '', quantity: '' }]);
  };

  // Row operations
  const handleAddItemRow = () => {
    const unselected = eligibleItems.find((e) => !itemRows.some((r) => r.itemId === e.itemId));
    setItemRows([...itemRows, { itemId: unselected?.itemId || '', quantity: '' }]);
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

    if (!selectedProjectId) {
      setErrorMsg('Please select a project.');
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
      if (!row.itemId) {
        setErrorMsg(`Row #${i + 1}: Please select an item.`);
        return;
      }
      if (usedItemIds.has(row.itemId)) {
        const dupItem = items.find((itm) => itm.id === row.itemId);
        setErrorMsg(`Item "${dupItem?.itemName || row.itemId}" is listed multiple times. Please combine quantities.`);
        return;
      }
      usedItemIds.add(row.itemId);

      const qty = Number(row.quantity);
      if (!qty || qty <= 0) {
        setErrorMsg(`Row #${i + 1}: Please enter a valid quantity greater than 0.`);
        return;
      }

      const inHandItem = eligibleItems.find((e) => e.itemId === row.itemId);
      const maxAllowed = inHandItem?.currentInHand || 0;
      if (qty > maxAllowed) {
        const itemInfo = items.find((itm) => itm.id === row.itemId);
        setErrorMsg(
          `Row #${i + 1}: Quantity for "${itemInfo?.itemName || row.itemId}" (${qty}) exceeds team's in-hand balance (${maxAllowed} ${itemInfo?.unit || 'units'}).`
        );
        return;
      }

      validRows.push({ itemId: row.itemId, quantity: qty });
    }

    if (validRows.length === 0) {
      setErrorMsg('Please add at least one material item.');
      return;
    }

    const targetProject = projects.find((p) => p.id === selectedProjectId) || activeProjects.find((p) => p.id === selectedProjectId);
    const targetTeam = teams.find((t) => t.id === selectedTeamId) || activeTeams.find((t) => t.id === selectedTeamId);

    try {
      const newUsage = logProjectMaterialUsage({
        projectId: selectedProjectId,
        projectName: targetProject?.projectName || 'Project',
        siteId: selectedSiteId,
        teamId: selectedTeamId,
        teamName: targetTeam?.teamName || 'Field Team',
        supervisorOrLeader: supervisorName.trim(),
        supervisorOrLeaderName: supervisorName.trim(),
        date: usageDate,
        workDetails: workDetails.trim() || 'Installed / used during project execution work.',
        items: validRows,
      });

      setSuccessToast(`Project Material Usage Slip ${newUsage.usageVoucherNumber} logged! Team in-hand stock deducted.`);
      setSelectedUsageForPrint(newUsage);

      // Reset form
      setWorkDetails('');
      const updatedSummary = getTeamInHandStock(selectedTeamId);
      const remainingEligible = updatedSummary.items.filter((i) => i.currentInHand > 0);
      setItemRows([{ itemId: remainingEligible[0]?.itemId || '', quantity: '' }]);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to log project material usage.');
    }
  };

  // Filtered usages history
  const filteredUsages = projectUsages.filter((pu) => {
    if (pu.isDeleted) return false;
    if (projectFilter !== 'all' && pu.projectId !== projectFilter) return false;
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
                Project Material Usage
              </h1>
              <p className="text-xs text-slate-500">
                Log materials and equipment consumed on active projects to deduct from team custody
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

      {/* Main Entry Grid: Form on Left, In-Hand Reference on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            Enter Used Items to Relevant Project
          </h2>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitUsage} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Project *
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  {activeProjects.length === 0 ? (
                    <option value="">No Active Projects Found (Add in Projects Tab)</option>
                  ) : (
                    activeProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.projectId}] {p.projectName} ({p.district || 'General'})
                      </option>
                    ))
                  )}
                </select>
                {selectedProjectId && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    {(() => {
                      const p = projects.find((x) => x.id === selectedProjectId);
                      return p ? `Ref: ${p.referenceNo || 'N/A'} · Sub-Area: ${p.subArea || 'N/A'}` : '';
                    })()}
                  </p>
                )}
              </div>

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
                  {branchSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Executing Field Team */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Executing Field Team *
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
                <p className="text-[10px] text-slate-400 mt-1">
                  Select from registered users or type customized field supervisor name.
                </p>
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

              {/* Work Details / Scope */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work / Milestone Description
                </label>
                <input
                  type="text"
                  value={workDetails}
                  onChange={(e) => setWorkDetails(e.target.value)}
                  placeholder="e.g. Tower installation at Site 44, Section B wiring"
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Dynamic Items Table */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Materials & Items Consumed (Deducted from Team Custody)
                </span>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  disabled={eligibleItems.length === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item Row
                </button>
              </div>

              {eligibleItems.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs font-medium text-center">
                  This team currently holds <strong>0 units</strong> of in-hand materials. Issue items to this team first via <em>Issue to Teams</em> before logging project consumption.
                </div>
              ) : (
                <div className="space-y-2">
                  {itemRows.map((row, idx) => {
                    const selectedItemCustody = eligibleItems.find((e) => e.itemId === row.itemId);
                    const itemObj = items.find((i) => i.id === row.itemId);
                    const maxQty = selectedItemCustody?.currentInHand || 0;

                    return (
                      <div
                        key={idx}
                        className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col sm:flex-row items-center gap-2"
                      >
                        {/* Item select */}
                        <div className="flex-1 w-full">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Item (In-Hand Only)
                          </label>
                          <select
                            value={row.itemId}
                            onChange={(e) => handleRowChange(idx, 'itemId', e.target.value)}
                            className="w-full text-xs font-medium px-2 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none"
                            required
                          >
                            <option value="">-- Select In-Hand Item --</option>
                            {eligibleItems.map((e) => {
                              const itm = items.find((x) => x.id === e.itemId);
                              return (
                                <option key={e.itemId} value={e.itemId}>
                                  [{itm?.itemCode}] {itm?.itemName} (Holds: {e.currentInHand} {itm?.unit})
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Available In-Hand Display */}
                        <div className="w-full sm:w-28 text-center sm:text-left">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            In-Hand Balance
                          </label>
                          <div className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-1.5 rounded">
                            {maxQty} {itemObj?.unit || 'units'}
                          </div>
                        </div>

                        {/* Quantity input */}
                        <div className="w-full sm:w-32">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Quantity Used *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={maxQty}
                            value={row.quantity}
                            onChange={(e) =>
                              handleRowChange(idx, 'quantity', e.target.value === '' ? '' : Number(e.target.value))
                            }
                            placeholder="Qty"
                            className="w-full text-xs font-semibold px-2 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none"
                            required
                          />
                        </div>

                        {/* Remove Row Button */}
                        <div className="pt-4 sm:pt-4">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            disabled={itemRows.length <= 1}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded disabled:opacity-30"
                            title="Remove Row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={eligibleItems.length === 0}
                className="px-5 py-2.5 bg-teal-700 text-white rounded-lg text-xs font-bold hover:bg-teal-800 transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
              >
                <FolderKanban className="w-4 h-4" />
                Record Project Usage & Generate Slip
              </button>
            </div>
          </form>
        </div>

        {/* In-Hand Balance Quick Reference (1 Col) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users2 className="w-4 h-4 text-teal-600" />
            {currentTeam?.teamName || 'Team'} In-Hand Custody
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
                    className="p-2.5 border border-slate-100 rounded-lg bg-slate-50 flex items-center justify-between"
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

      {/* History Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800">
              Project Material Usage Log ({filteredUsages.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Project */}
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
            >
              <option value="all">All Projects</option>
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectId} - {p.projectName}
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search voucher, project, lead..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
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
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1.5 border border-rose-200 rounded-lg bg-rose-50"
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
                <th className="py-2.5 px-3">Project</th>
                <th className="py-2.5 px-3">Team & Supervisor</th>
                <th className="py-2.5 px-3">Materials Consumed</th>
                <th className="py-2.5 px-3">Work Scope</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No project material usage records logged yet.
                  </td>
                </tr>
              ) : (
                filteredUsages.map((usage) => {
                  const totalItemsQty = usage.items.reduce((s, i) => s + i.quantity, 0);

                  return (
                    <tr key={usage.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-700">
                        {usage.usageVoucherNumber}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                        {usage.date}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{usage.projectName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {projects.find((p) => p.id === usage.projectId)?.projectId || usage.projectId}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{usage.teamName}</div>
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
                            Voucher
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

      {/* Printable Voucher Modal */}
      {selectedUsageForPrint && (
        <PrintableDocumentModal
          isOpen={!!selectedUsageForPrint}
          onClose={() => setSelectedUsageForPrint(null)}
          title="PROJECT MATERIAL CONSUMPTION VOUCHER"
          documentNumber={selectedUsageForPrint.usageVoucherNumber}
          documentDate={selectedUsageForPrint.date}
          recipientLabel="Project Office"
          recipientName={selectedUsageForPrint.projectName}
          recipientSubDetails={`Supervisor / Lead: ${selectedUsageForPrint.supervisorOrLeader || selectedUsageForPrint.supervisorOrLeaderName} | Team: ${selectedUsageForPrint.teamName}`}
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
