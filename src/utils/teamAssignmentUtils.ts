import { Team, Site, TeamSiteAssignmentHistoryRecord } from '../types';

/**
 * Strips any existing `(Ref: ...)` suffix or `Temporary Assigned to - ...` badge text
 * to recover the clean base team name.
 */
export function extractBaseTeamName(teamName: string, existingBaseName?: string): string {
  if (existingBaseName && existingBaseName.trim()) {
    return existingBaseName.trim().replace(/\s*\(Ref:\s*[^)]+\)\s*$/i, '').trim();
  }
  return (teamName || '')
    .trim()
    .replace(/\s*\(Ref:\s*[^)]+\)\s*$/i, '')
    .trim();
}

/**
 * Resolves the Team's Initial Base Site (Home Base where the team was originally registered).
 * Checks explicit `team.initialSiteId`, then the earliest record in `siteAssignmentHistory`,
 * then falls back to `team.previousSiteId` or `team.assignedSiteId`.
 */
export function getTeamInitialBaseSite(
  team: Team,
  sites: Site[]
): { siteId: string; siteName: string } {
  if (team.initialSiteId) {
    const matched = sites.find((s) => s.id === team.initialSiteId);
    return {
      siteId: team.initialSiteId,
      siteName: matched?.name || team.initialSiteName || 'Initial Base Site',
    };
  }

  if (Array.isArray(team.siteAssignmentHistory) && team.siteAssignmentHistory.length > 0) {
    const rootEntry =
      team.siteAssignmentHistory.find((h) => !h.previousSiteId) ||
      team.siteAssignmentHistory[0];
    if (rootEntry && rootEntry.siteId) {
      const matched = sites.find((s) => s.id === rootEntry.siteId);
      return {
        siteId: rootEntry.siteId,
        siteName: matched?.name || rootEntry.siteName || 'Initial Base Site',
      };
    }
  }

  if (team.previousSiteId) {
    const matched = sites.find((s) => s.id === team.previousSiteId);
    return {
      siteId: team.previousSiteId,
      siteName: matched?.name || team.previousSiteName || 'Initial Base Site',
    };
  }

  const currentMatched = sites.find((s) => s.id === team.assignedSiteId);
  return {
    siteId: team.assignedSiteId,
    siteName: currentMatched?.name || 'Initial Base Site',
  };
}

/**
 * Returns true if the team is currently assigned to a visiting / non-initial site
 * (i.e. away from its Initial Base Site).
 */
export function isTeamAwayFromInitialBase(team: Team, sites: Site[]): boolean {
  const initialBase = getTeamInitialBaseSite(team, sites);
  return Boolean(
    initialBase.siteId &&
      team.assignedSiteId &&
      team.assignedSiteId !== initialBase.siteId
  );
}

/**
 * Formats the permanent team name with previous site reference when at a transferred site,
 * OR returns the clean base name when the team is at its Initial Base Site:
 * - At Initial Base Site: `[Base Team Name]` (NEVER appends `(Ref: ...)` at home base!)
 * - At Visiting/Transferred Site: `[Base Team Name] (Ref: [Previous Site Name])`
 */
export function formatPermanentTransferredTeamName(
  baseName: string,
  previousSiteName?: string,
  isAtInitialBase: boolean = false
): string {
  const cleanBase = extractBaseTeamName(baseName);
  if (isAtInitialBase || !previousSiteName || !previousSiteName.trim()) {
    return cleanBase;
  }
  return `${cleanBase} (Ref: ${previousSiteName.trim()})`;
}

/**
 * Returns the temporary assignment indicator label for a team on a new site:
 * `"Temporary Assigned to - [New Site Name]"`
 */
export function getTemporaryAssignmentBadgeLabel(
  teamOrSiteName: Team | string,
  sites?: Site[]
): string {
  if (typeof teamOrSiteName === 'string') {
    const cleanSite = teamOrSiteName.trim() || 'New Assigned Site';
    return `Temporary Assigned to - ${cleanSite}`;
  }
  const currentSite = sites?.find((s) => s.id === teamOrSiteName.assignedSiteId);
  const siteName = currentSite?.name || 'New Assigned Site';
  return `Temporary Assigned to - ${siteName}`;
}

/**
 * Returns a complete, chronologically ordered list of site assignments for a team
 * (including past transferred sites and the current active assignment),
 * even if the team was registered before `siteAssignmentHistory` existed.
 */
export function getTeamCompleteAssignmentHistory(
  team: Team,
  sites: Site[],
  getSitePendingUnits?: (teamId: string, siteId: string) => number
): TeamSiteAssignmentHistoryRecord[] {
  const currentSite = sites.find((s) => s.id === team.assignedSiteId);
  const currentSiteName = currentSite?.name || 'Assigned Site';
  const initialBase = getTeamInitialBaseSite(team, sites);
  const existingHistory = Array.isArray(team.siteAssignmentHistory)
    ? [...team.siteAssignmentHistory]
    : [];

  if (existingHistory.length === 0) {
    const records: TeamSiteAssignmentHistoryRecord[] = [];
    if (team.previousSiteId || team.previousSiteName) {
      const prevSite = sites.find((s) => s.id === team.previousSiteId);
      const prevName = team.previousSiteName || prevSite?.name || 'Previous Site';
      const pendingPrev =
        team.previousSiteId && getSitePendingUnits
          ? getSitePendingUnits(team.id, team.previousSiteId)
          : 0;
      records.push({
        id: `hist-prev-${team.id}`,
        siteId: team.previousSiteId || 'prev-site',
        siteName: prevName,
        assignmentType: 'Permanent',
        status: 'Completed / Transferred',
        pendingStockUnitsAtTransfer: pendingPrev,
        stockCleared: pendingPrev <= 0,
        assignedAt: team.createdAt,
        endedAt: team.temporaryAssignedAt || team.permanentConfirmedAt || team.createdAt,
        notes: `Initial Base Site registration (${prevName})`,
      });
    }

    const currentPending =
      team.assignedSiteId && getSitePendingUnits
        ? getSitePendingUnits(team.id, team.assignedSiteId)
        : 0;
    const isAtHome = team.assignedSiteId === initialBase.siteId;

    records.push({
      id: `hist-curr-${team.id}`,
      siteId: team.assignedSiteId,
      siteName: currentSiteName,
      assignmentType: team.assignmentStatus === 'Temporary' ? 'Temporary' : 'Permanent',
      status: 'Active',
      previousSiteId: isAtHome && team.assignmentStatus !== 'Temporary' ? undefined : team.previousSiteId,
      previousSiteName: isAtHome && team.assignmentStatus !== 'Temporary' ? undefined : team.previousSiteName,
      isReturnedToInitialBase: isAtHome && records.length > 0,
      pendingStockUnitsAtTransfer: currentPending,
      stockCleared:
        team.pendingClearanceSiteId && getSitePendingUnits
          ? getSitePendingUnits(team.id, team.pendingClearanceSiteId) <= 0
          : true,
      assignedAt: team.temporaryAssignedAt || team.createdAt,
      promotedToPermanentAt: team.permanentConfirmedAt,
      promotedBy: team.permanentConfirmedBy,
      notes:
        team.assignmentStatus === 'Temporary'
          ? `Temporary Assigned to - ${currentSiteName}${
              team.previousSiteName ? ` (Transferred from ${team.previousSiteName})` : ''
            }`
          : isAtHome && records.length > 0
          ? `Returned to Initial Base Site (${currentSiteName}) — Original team name restored`
          : team.previousSiteName
          ? `Permanent assignment confirmed (Ref: ${team.previousSiteName})`
          : 'Initial permanent site registration',
    });

    return records;
  }

  // Enrich live stock clearance status on existing history records
  return existingHistory.map((rec, index) => {
    const liveSite = sites.find((s) => s.id === rec.siteId);
    const pendingUnits =
      rec.siteId && getSitePendingUnits ? getSitePendingUnits(team.id, rec.siteId) : 0;
    const isReturnedHome =
      rec.isReturnedToInitialBase ||
      (index > 0 && rec.siteId === initialBase.siteId);
    return {
      ...rec,
      siteName: liveSite?.name || rec.siteName || 'Site Branch',
      isReturnedToInitialBase: isReturnedHome,
      stockCleared: pendingUnits <= 0,
    };
  });
}
