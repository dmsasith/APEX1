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
  Clock,
  History,
  ArrowRightLeft,
  AlertTriangle,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatNumber, exportToCsv, formatDateTime } from '../../utils/exportUtils';
import { printHtmlElement } from '../../utils/printUtils';
import {
  Site,
  Team,
  User as AppUser,
  isUserAssignedToSite,
  isSuperAdmin,
  isCentralOrAllSiteAdmin,
  normalizeRole,
} from '../../types';
import { TeamTransferAndDetailsModal } from '../common/TeamTransferAndDetailsModal';
import {
  getTemporaryAssignmentBadgeLabel,
  getTeamCompleteAssignmentHistory,
} from '../../utils/teamAssignmentUtils';

interface BranchDirectoryViewProps {
  onNavigate?: (tabId: string) => void;
}

export const BranchDirectoryView: React.FC<BranchDirectoryViewProps> = ({ onNavigate }) => {
  const {
    config,
    currentUser,
    activeSites,
    activeTeams,
    activeUsers,
    currentTenant,
    getTeamSiteInHandStock,
    promoteTeamAssignmentToPermanent,
  } = useStock();

  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [teamModalState, setTeamModalState] = useState<{
    teamId: string;
    tab: 'details' | 'transfer';
  } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const canManageTeamAssignment =
    isSuperAdmin(currentUser.role) ||
    isCentralOrAllSiteAdmin(currentUser.role) ||
    normalizeRole(currentUser.role) === 'Branch Admin' ||
    currentUser.username === 'admin';

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

      // Users assigned to this site (supports single site, multiple sites, and linked supervisors)
      const siteUsers = activeUsers.filter((u) => isUserAssignedToSite(u, site, activeSites));

      const rawSup = (site.supervisorName || '').trim();
      const matchedSupUser = activeUsers.find(
        (u) =>
          (site.supervisorUserId && u.id === site.supervisorUserId) ||
          (rawSup &&
            rawSup.toLowerCase() !== 'arthur vance' &&
            rawSup.toLowerCase() !== 'unassigned' &&
            u.fullName.trim().toLowerCase() === rawSup.toLowerCase())
      );
      const displaySupervisorName =
        matchedSupUser?.fullName ||
        siteUsers[0]?.fullName ||
        (rawSup && rawSup.toLowerCase() !== 'arthur vance' && rawSup.toLowerCase() !== 'unassigned'
          ? rawSup
          : 'Unassigned');

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
          displaySupervisorName.toLowerCase().includes(searchLower) ||
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
        displaySupervisorName,
        teams: matchingTeams,
        allSiteTeamsCount: siteTeams.length,
        totalPersonnel: totalTeamPersonnel,
      };
    }).filter((data) => {
      if (!searchLower) return true;
      const siteMatches =
        data.site.name.toLowerCase().includes(searchLower) ||
        data.displaySupervisorName.toLowerCase().includes(searchLower) ||
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

    branchData.forEach(({ site, teams, siteUsers, displaySupervisorName }) => {
      if (teams.length === 0) {
        rows.push({
          'Branch Name': site.name,
          'Branch Location': site.location,
          'Branch Type': site.isMainWarehouse ? 'Main Warehouse / HQ' : 'Site Branch Yard',
          'Supervisor / Manager': displaySupervisorName,
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
            'Supervisor / Manager': displaySupervisorName,
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
                'Supervisor / Manager': displaySupervisorName,
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

  const handlePrint = async () => {
    const filename = `Branch_Directory_Report_${selectedSiteId === 'all' ? 'All_Branches' : 'Branch'}`;
    await printHtmlElement('branch-directory-printable-area', filename);
  };

  const selectedSite = activeSites.find((s) => s.id === selectedSiteId);

  return (
    <div id="branch-directory-printable-area" className="space-y-6">
      {/* Top Banner / Header (Screen View) */}
      <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl border border-slate-800 shadow-sm p-6 sm:p-7 overflow-hidden no-print">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold tracking-wider uppercase">
              <span>Organization Hierarchy & Workforce</span>
              <span aria-hidden="true" className="text-emerald-400/50">·</span>
              <span className="text-emerald-200 font-semibold">Branch Supervisors, Teams & Member NICs</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>Branch Staff & Field Teams Directory</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Inspect registered company branches, assigned branch managers and supervisors, field teams, and complete team members with verified ID/NIC numbers. Select any branch below to view its full personnel and print official reports.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-white hover:bg-emerald-50 text-slate-900 border border-white/90 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Members (Excel)</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-600/25 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Print Directory Report</span>
            </button>
          </div>
        </div>

        {/* Global KPI Strip */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3.5 rounded-xl bg-slate-950/60 backdrop-blur-md border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Registered Branches & Yards</div>
              <div className="text-xl font-black text-white font-mono tabular-nums">
                {formatNumber(totalBranchesCount)} <span className="text-xs font-normal text-slate-400">Locations</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 backdrop-blur-md border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Active Field Work Teams</div>
              <div className="text-xl font-black text-sky-300 font-mono tabular-nums">
                {formatNumber(totalTeamsCount)} <span className="text-xs font-normal text-slate-400">Teams</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 backdrop-blur-md border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <IdCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Total Field Workforce</div>
              <div className="text-xl font-black text-amber-300 font-mono tabular-nums">
                {formatNumber(totalWorkforceCount)} <span className="text-xs font-normal text-slate-400">Personnel</span>
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
              <option value="all">🏢 All Branches & Yards (All Members)</option>
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
          {branchData.map(({ site, siteUsers, displaySupervisorName, teams, allSiteTeamsCount, totalPersonnel }) => (
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
                      <span>{displaySupervisorName}</span>
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
                  <span>Branch Management & Assigned System Personnel ({siteUsers.length})</span>
                </div>
                {siteUsers.length === 0 ? (
                  <div className="text-slate-400 text-[11px] italic py-1">
                    No registered system users assigned to this branch yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {/* Registered System Users assigned to this branch */}
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
                )}
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
                      const isTemp = team.assignmentStatus === 'Temporary';
                      const prevSiteId = team.pendingClearanceSiteId || team.previousSiteId;
                      const prevSiteObj = prevSiteId ? activeSites.find((st) => st.id === prevSiteId) : undefined;
                      const prevSiteName =
                        team.pendingClearanceSiteName || team.previousSiteName || prevSiteObj?.name;
                      const prevSitePendingUnits = prevSiteId
                        ? getTeamSiteInHandStock(team.id, prevSiteId).totalUnitsHeld
                        : 0;
                      const completeHistory = getTeamCompleteAssignmentHistory(team, activeSites);

                      return (
                        <div
                          key={team.id}
                          className={`rounded-xl border bg-white overflow-hidden shadow-2xs hover:shadow-xs transition-all ${
                            isTemp ? 'border-amber-400 ring-1 ring-amber-400/40' : 'border-slate-200'
                          }`}
                        >
                          {/* Team Summary Bar */}
                          <div
                            className={`p-4 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                              isTemp
                                ? 'bg-amber-50/70 border-amber-200'
                                : 'bg-slate-50/80 border-slate-200'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 text-sm">{team.teamName}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 font-mono">
                                  {actualCrewCount} Personnel Total
                                </span>
                                {isTemp ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-500/20 text-amber-950 border border-amber-500/50">
                                    <Clock className="w-3 h-3 text-amber-700" />
                                    {getTemporaryAssignmentBadgeLabel(site.name)}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Permanent Assignment
                                    {team.previousSiteName ? ` · Ref: ${team.previousSiteName}` : ''}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span>
                                  Phone:{' '}
                                  <strong className="text-slate-700 font-mono">{team.contactPhone || 'N/A'}</strong>
                                </span>
                                <span className="text-slate-300">·</span>
                                <span>
                                  Current Base:{' '}
                                  <strong className="text-slate-700">
                                    {isTemp ? getTemporaryAssignmentBadgeLabel(site.name) : site.name}
                                  </strong>
                                </span>
                                {prevSiteName && (
                                  <>
                                    <span className="text-slate-300">·</span>
                                    <span>
                                      Previous Site: <strong className="text-slate-800">{prevSiteName}</strong>
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* All Assigned Sites History Pills */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mr-1">
                                  <History className="w-3 h-3 text-emerald-600" />
                                  Assigned Sites ({completeHistory.length}):
                                </span>
                                {completeHistory.map((h) => {
                                  const isCurrent = h.status === 'Active';
                                  return (
                                    <span
                                      key={h.id}
                                      onClick={() => setTeamModalState({ teamId: team.id, tab: 'details' })}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer ${
                                        isCurrent
                                          ? h.assignmentType === 'Temporary'
                                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                          : 'bg-white text-slate-600 border-slate-200'
                                      }`}
                                    >
                                      <span>{h.siteName}</span>
                                      <span className="opacity-75">
                                        ({h.assignmentType}
                                        {isCurrent ? ' • Active' : ''})
                                      </span>
                                    </span>
                                  );
                                })}
                              </div>

                              {/* Pending Stock Alert or Permanent Promotion Action for Temporary Teams */}
                              {isTemp && (
                                <div className="pt-1 no-print">
                                  {prevSitePendingUnits > 0 ? (
                                    <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                      <span>
                                        {formatNumber(prevSitePendingUnits)} Units pending clearance on{' '}
                                        <strong>{prevSiteName || 'Previous Site'}</strong> before permanent promotion.
                                      </span>
                                    </div>
                                  ) : (
                                    canManageTeamAssignment && (
                                      <div className="inline-flex flex-wrap items-center gap-2 bg-white/90 border border-amber-300 px-2.5 py-1.5 rounded-lg">
                                        <span className="text-[11px] font-semibold text-amber-900">
                                          {prevSiteName
                                            ? `0 Pending Stock on ${prevSiteName} — Ready for Permanent Confirmation`
                                            : 'Ready for Permanent Confirmation'}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const res = promoteTeamAssignmentToPermanent(team.id);
                                            setToastMsg(res.message);
                                            setTimeout(() => setToastMsg(null), 4000);
                                          }}
                                          className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold transition flex items-center gap-1 cursor-pointer"
                                        >
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>
                                            Confirm Permanent{prevSiteName ? ` (Ref: ${prevSiteName})` : ''}
                                          </span>
                                        </button>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                              {/* Action Buttons */}
                              <div className="flex items-center gap-1.5 no-print">
                                <button
                                  type="button"
                                  onClick={() => setTeamModalState({ teamId: team.id, tab: 'details' })}
                                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <History className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Site History & Details</span>
                                </button>
                                {canManageTeamAssignment && (
                                  <button
                                    type="button"
                                    onClick={() => setTeamModalState({ teamId: team.id, tab: 'transfer' })}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-extrabold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                  >
                                    <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" />
                                    <span>Transfer Site</span>
                                  </button>
                                )}
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

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-500/40 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Team Site Transfer & Complete Assigned Sites History Modal */}
      {teamModalState && (() => {
        const liveTeam = activeTeams.find((t) => t.id === teamModalState.teamId) || null;
        return (
          <TeamTransferAndDetailsModal
            isOpen={Boolean(liveTeam)}
            team={liveTeam}
            initialTab={teamModalState.tab}
            onClose={() => setTeamModalState(null)}
          />
        );
      })()}
    </div>
  );
};
