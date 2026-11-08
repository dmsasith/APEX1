import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users2,
  UserCheck,
  Printer,
  FileSpreadsheet,
  Search,
  Phone,
  MapPin,
  ShieldCheck,
  ChevronRight,
  IdCard,
  User,
  Briefcase,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatNumber, exportToCsv, formatDateTime } from '../../utils/exportUtils';
import { Site, Team, User as AppUser } from '../../types';

interface BranchDirectoryViewProps {
  onNavigate?: (tabId: string) => void;
}

export const BranchDirectoryView: React.FC<BranchDirectoryViewProps> = ({ onNavigate }) => {
  const { config, activeSites, activeTeams, activeUsers, currentTenant } = useStock();

  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Filtered branches
  const filteredSites = useMemo(() => {
    if (selectedSiteId === 'all') return activeSites;
    return activeSites.filter((s) => s.id === selectedSiteId);
  }, [activeSites, selectedSiteId]);

  // Search matching logic across Branch, Supervisor, Teams, Leader, and Members
  const searchLower = searchQuery.trim().toLowerCase();

  const branchData = useMemo(() => {
    return filteredSites.map((site) => {
      // Teams assigned to this site
      const siteTeams = activeTeams.filter((t) => t.assignedSiteId === site.id);

      // Users assigned to this specific site (or 'all' for central management)
      const siteUsers = activeUsers.filter(
        (u) => !u.isDeleted && (u.siteId === site.id || (site.isMainWarehouse && u.siteId === 'all'))
      );

      // Filter teams by search query
      const matchingTeams = siteTeams.filter((team) => {
        if (!searchLower) return true;
        const matchesTeam =
          team.teamName.toLowerCase().includes(searchLower) ||
          team.teamLeaderName.toLowerCase().includes(searchLower) ||
          (team.teamLeaderIdNumber && team.teamLeaderIdNumber.toLowerCase().includes(searchLower)) ||
          team.contactPhone.toLowerCase().includes(searchLower);

        const matchesMember = team.members?.some(
          (m) =>
            m.name.toLowerCase().includes(searchLower) ||
            m.idNumber.toLowerCase().includes(searchLower) ||
            (m.role && m.role.toLowerCase().includes(searchLower))
        );

        const matchesSite =
          site.name.toLowerCase().includes(searchLower) ||
          site.supervisorName.toLowerCase().includes(searchLower) ||
          site.location.toLowerCase().includes(searchLower);

        return matchesTeam || matchesMember || matchesSite;
      });

      // Total personnel in this site
      const totalTeamPersonnel = siteTeams.reduce((sum, t) => {
        const memberCount = t.members && t.members.length > 0 ? t.members.length + 1 : t.crewSize;
        return sum + memberCount;
      }, 0);

      return {
        site,
        siteUsers,
        teams: matchingTeams,
        allSiteTeamsCount: siteTeams.length,
        totalPersonnel: totalTeamPersonnel,
      };
    }).filter((data) => {
      if (!searchLower) return true;
      const siteMatches =
        data.site.name.toLowerCase().includes(searchLower) ||
        data.site.supervisorName.toLowerCase().includes(searchLower) ||
        data.site.location.toLowerCase().includes(searchLower);
      return siteMatches || data.teams.length > 0;
    });
  }, [filteredSites, activeTeams, activeUsers, searchLower]);

  // Overall aggregate metrics
  const totalBranchesCount = activeSites.length;
  const totalTeamsCount = activeTeams.length;
  const totalWorkforceCount = activeTeams.reduce((sum, t) => {
    const memberCount = t.members && t.members.length > 0 ? t.members.length + 1 : t.crewSize;
    return sum + memberCount;
  }, 0);

  // CSV Export Handler
  const handleExportCsv = () => {
    const rows: Record<string, unknown>[] = [];

    branchData.forEach(({ site, teams, siteUsers }) => {
      if (teams.length === 0) {
        rows.push({
          'Branch Name': site.name,
          'Branch Location': site.location,
          'Branch Type': site.isMainWarehouse ? 'Main Warehouse / HQ' : 'Site Branch Yard',
          'Supervisor / Manager': site.supervisorName,
          'Supervisor Phone': site.contactNumber,
          'Assigned Staff Admins': siteUsers.map((u) => `${u.fullName} (${u.role})`).join('; ') || 'None',
          'Team Name': 'No Teams Assigned',
          'Team Leader': '—',
          'Leader ID/NIC': '—',
          'Member Name': '—',
          'Member ID/NIC': '—',
          'Member Role': '—',
        });
      } else {
        teams.forEach((team) => {
          // Team Leader row
          rows.push({
            'Branch Name': site.name,
            'Branch Location': site.location,
            'Branch Type': site.isMainWarehouse ? 'Main Warehouse / HQ' : 'Site Branch Yard',
            'Supervisor / Manager': site.supervisorName,
            'Supervisor Phone': site.contactNumber,
            'Assigned Staff Admins': siteUsers.map((u) => `${u.fullName} (${u.role})`).join('; ') || 'None',
            'Team Name': team.teamName,
            'Team Leader': team.teamLeaderName,
            'Leader ID/NIC': team.teamLeaderIdNumber || 'N/A',
            'Member Name': `${team.teamLeaderName} (Team Leader)`,
            'Member ID/NIC': team.teamLeaderIdNumber || 'N/A',
            'Member Role': 'Team Leader / Crew Head',
          });

          // Members rows
          if (team.members && team.members.length > 0) {
            team.members.forEach((m) => {
              rows.push({
                'Branch Name': site.name,
                'Branch Location': site.location,
                'Branch Type': site.isMainWarehouse ? 'Main Warehouse / HQ' : 'Site Branch Yard',
                'Supervisor / Manager': site.supervisorName,
                'Supervisor Phone': site.contactNumber,
                'Assigned Staff Admins': siteUsers.map((u) => `${u.fullName} (${u.role})`).join('; ') || 'None',
                'Team Name': team.teamName,
                'Team Leader': team.teamLeaderName,
                'Leader ID/NIC': team.teamLeaderIdNumber || 'N/A',
                'Member Name': m.name,
                'Member ID/NIC': m.idNumber,
                'Member Role': m.role || 'Field Crew Member',
              });
            });
          }
        });
      }
    });

    const filename = `Branch_and_Teams_Roster_${selectedSiteId === 'all' ? 'All_Branches' : 'Branch'}`;
    exportToCsv(filename, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedSite = activeSites.find((s) => s.id === selectedSiteId);

  return (
    <div className="space-y-6">
      {/* Top Banner / Header (Screen View) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 no-print">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-md">
                Organization Hierarchy & Workforce
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">Branch Supervisors, Teams & Member NICs</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-emerald-600" />
              <span>Branch Staff & Field Teams Directory</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Inspect registered company branches, assigned branch managers and supervisors, field teams, and complete member rosters with verified ID/NIC numbers. Select any branch below to view its full personnel and print official reports.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Roster (Excel)</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print Directory Report</span>
            </button>
          </div>
        </div>

        {/* Global KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5 pt-5 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Registered Branches & Yards</div>
              <div className="text-xl font-black text-slate-900 font-mono tabular-nums">
                {formatNumber(totalBranchesCount)} <span className="text-xs font-normal text-slate-500">Locations</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-700 flex items-center justify-center shrink-0">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Active Field Work Teams</div>
              <div className="text-xl font-black text-blue-700 font-mono tabular-nums">
                {formatNumber(totalTeamsCount)} <span className="text-xs font-normal text-slate-500">Teams</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
              <IdCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Field Workforce</div>
              <div className="text-xl font-black text-amber-700 font-mono tabular-nums">
                {formatNumber(totalWorkforceCount)} <span className="text-xs font-normal text-slate-500">Personnel</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Branch Selector Toolbar & Live Search Filter (Screen View) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3.5 no-print">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Branch Select Dropdown / Quick Switcher */}
          <div className="flex items-center gap-2.5 flex-1">
            <label className="text-xs font-bold text-slate-700 shrink-0 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span>Select Branch Yard:</span>
            </label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="px-3 py-2 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent flex-1 max-w-md transition-all shadow-2xs"
            >
              <option value="all">🏢 All Branches & Yards (Full Company Roster)</option>
              {activeSites.map((site) => {
                const teamCount = activeTeams.filter((t) => t.assignedSiteId === site.id).length;
                return (
                  <option key={site.id} value={site.id}>
                    {site.isMainWarehouse ? '⭐ ' : '📍 '}
                    {site.name} ({site.location}) — {teamCount} team{teamCount !== 1 ? 's' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search branch, supervisor, team or NIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold p-0.5 cursor-pointer"
                title="Clear Search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Quick Branch Pills for fast navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setSelectedSiteId('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
              selectedSiteId === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Branches ({activeSites.length})
          </button>
          {activeSites.map((site) => {
            const isSel = selectedSiteId === site.id;
            const teamsAtSite = activeTeams.filter((t) => t.assignedSiteId === site.id).length;
            return (
              <button
                key={site.id}
                type="button"
                onClick={() => setSelectedSiteId(site.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{site.name}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${isSel ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-200 text-slate-700'}`}>
                  {teamsAtSite}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Printable Report Header (Shown only during Print) */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-800 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              {config.companyName || 'Company Workspace'}
            </h1>
            <div className="text-xs text-slate-600 font-semibold mt-0.5">
              Official Branch Organization Hierarchy & Field Personnel Directory
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {config.address && <span>{config.address} · </span>}
              {config.phone && <span>Tel: {config.phone} · </span>}
              {config.email && <span>Email: {config.email}</span>}
            </div>
          </div>
          <div className="text-right text-xs text-slate-600 font-mono">
            <div>Report Date: {formatDateTime(new Date().toISOString())}</div>
            <div className="font-bold text-slate-900 mt-0.5">
              Scope: {selectedSiteId === 'all' ? 'All Registered Branches' : selectedSite?.name}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Branches List */}
      {branchData.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching branch or team records found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery
              ? `No branch, supervisor, team leader, or crew member matched "${searchQuery}". Try a different keyword.`
              : 'No branches or teams are currently registered in this workspace.'}
          </p>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('registrations')}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Open Master Registrations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {branchData.map(({ site, siteUsers, teams, allSiteTeamsCount, totalPersonnel }) => (
            <div
              key={site.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden break-inside-avoid"
            >
              {/* Branch Header Banner */}
              <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <span>{site.name}</span>
                    </span>
                    {site.isMainWarehouse ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Central Main Yard (HQ)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
                        Operational Branch Yard
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{site.location || 'Central Facility'}</span>
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{site.contactNumber || 'No Direct Phone'}</span>
                    </span>
                  </div>
                </div>

                {/* Supervisor & Personnel Summary Pill */}
                <div className="flex items-center gap-4 text-xs shrink-0 bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 shadow-2xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">Branch Supervisor</div>
                    <div className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{site.supervisorName || 'Unassigned'}</span>
                    </div>
                  </div>
                  <div className="h-7 w-px bg-slate-200" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">Teams / Personnel</div>
                    <div className="font-bold text-slate-900 font-mono mt-0.5">
                      {allSiteTeamsCount} teams · <span className="text-emerald-700">{totalPersonnel} crew</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Branch Management & Assigned System Staff */}
              <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-2 mb-2 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Branch Management & Assigned System Personnel ({siteUsers.length + 1})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {/* Supervisor Card */}
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{site.supervisorName || 'Site Supervisor'}</div>
                      <div className="text-[10px] text-emerald-700 font-semibold">Designated Branch Manager</div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500">{site.contactNumber}</span>
                  </div>

                  {/* System Users assigned to this branch */}
                  {siteUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-between"
                    >
                      <div className="truncate mr-2">
                        <div className="font-bold text-slate-900 truncate">{user.fullName}</div>
                        <div className="text-[10px] text-slate-500 font-medium truncate">@{user.username}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                        {user.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teams & Complete Member Rosters */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users2 className="w-4 h-4 text-slate-700" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      Assigned Field Teams ({teams.length})
                    </h3>
                  </div>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('teams')}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold transition no-print cursor-pointer"
                    >
                      + Manage Teams in Registrations →
                    </button>
                  )}
                </div>

                {teams.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs">
                    No active teams currently based at {site.name}.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teams.map((team) => {
                      const membersList = team.members || [];
                      const actualCrewCount = membersList.length > 0 ? membersList.length + 1 : team.crewSize;

                      return (
                        <div
                          key={team.id}
                          className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:shadow-xs transition-all"
                        >
                          {/* Team Summary Bar */}
                          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 text-sm">{team.teamName}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 font-mono">
                                  {actualCrewCount} Personnel Total
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                                <span>Phone: <strong className="text-slate-700 font-mono">{team.contactPhone || 'N/A'}</strong></span>
                                <span className="text-slate-300">·</span>
                                <span>Base: <strong className="text-slate-700">{site.name}</strong></span>
                              </div>
                            </div>

                            {/* Team Leader Profile Pill */}
                            <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 flex items-center gap-3 shadow-2xs">
                              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {team.teamLeaderName.charAt(0).toUpperCase()}
                              </div>
                              <div className="text-xs">
                                <div className="text-[10px] uppercase font-bold text-slate-500">Team Leader</div>
                                <div className="font-bold text-slate-900">{team.teamLeaderName}</div>
                                <div className="text-[11px] font-mono text-emerald-700 font-semibold">
                                  ID / NIC: {team.teamLeaderIdNumber || 'Not Specified'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Member Roster Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                                <tr>
                                  <th className="py-2 px-3 w-10 text-center">#</th>
                                  <th className="py-2 px-3">Personnel Name</th>
                                  <th className="py-2 px-3">NIC / Worker ID Number</th>
                                  <th className="py-2 px-3">Role / Designation</th>
                                  <th className="py-2 px-3">Contact Phone</th>
                                  <th className="py-2 px-3 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {/* Leader Row */}
                                <tr className="bg-emerald-50/30 font-semibold">
                                  <td className="py-2 px-3 text-center font-mono text-slate-500">1</td>
                                  <td className="py-2 px-3 text-slate-900 flex items-center gap-1.5">
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>{team.teamLeaderName}</span>
                                    <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                                      Leader
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 font-mono font-bold text-slate-900">
                                    {team.teamLeaderIdNumber || (
                                      <span className="text-slate-400 font-normal italic">Pending ID</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-emerald-800 font-bold">Team Leader / Head of Crew</td>
                                  <td className="py-2 px-3 font-mono text-slate-600">{team.contactPhone || '—'}</td>
                                  <td className="py-2 px-3 text-right">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      Active In-Duty
                                    </span>
                                  </td>
                                </tr>

                                {/* Member Rows */}
                                {membersList.length > 0 ? (
                                  membersList.map((member, mIdx) => (
                                    <tr key={member.id || mIdx} className="hover:bg-slate-50/60">
                                      <td className="py-2 px-3 text-center font-mono text-slate-400">{mIdx + 2}</td>
                                      <td className="py-2 px-3 text-slate-900 font-medium">
                                        <div className="flex items-center gap-1.5">
                                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                          <span>{member.name}</span>
                                        </div>
                                      </td>
                                      <td className="py-2 px-3 font-mono font-bold text-slate-900">
                                        {member.idNumber || '—'}
                                      </td>
                                      <td className="py-2 px-3 text-slate-600">
                                        {member.role || 'Field Technician'}
                                      </td>
                                      <td className="py-2 px-3 font-mono text-slate-500">
                                        {member.phone || team.contactPhone || '—'}
                                      </td>
                                      <td className="py-2 px-3 text-right">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                          Verified Member
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={6} className="py-3 px-3 text-center text-slate-500 bg-slate-50/30">
                                      <div className="flex items-center justify-center gap-1.5 text-slate-600">
                                        <span>Total crew size: <strong>{team.crewSize} members</strong>.</span>
                                        <span className="text-slate-400">·</span>
                                        <span className="text-slate-500">Individual member names & ID numbers can be registered in <strong>Master Registrations → Teams</strong>.</span>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
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

      {/* Official Sign-Off Section (Printed on Report Bottom) */}
      <div className="hidden print:block mt-12 pt-8 border-t-2 border-slate-300 break-inside-avoid">
        <div className="grid grid-cols-3 gap-8 text-center text-xs">
          <div>
            <div className="h-14 border-b border-slate-400" />
            <div className="font-bold text-slate-900 mt-2">Prepared By</div>
            <div className="text-[11px] text-slate-500">Branch Operations Officer</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Date: ________________</div>
          </div>
          <div>
            <div className="h-14 border-b border-slate-400" />
            <div className="font-bold text-slate-900 mt-2">Branch Manager / Supervisor</div>
            <div className="text-[11px] text-slate-500">Site Branch Verification</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Date: ________________</div>
          </div>
          <div>
            <div className="h-14 border-b border-slate-400" />
            <div className="font-bold text-slate-900 mt-2">Central Operations Super Admin</div>
            <div className="text-[11px] text-slate-500">Headquarters Audit Approval</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Date: ________________</div>
          </div>
        </div>
      </div>
    </div>
  );
};
