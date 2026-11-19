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
 * Formats the permanent team name with previous site reference:
 * e.g. `[Team Name] (Ref: [Previous Site Name])`
 */
export function formatPermanentTransferredTeamName(
  baseName: string,
  previousSiteName?: string
): string {
  const cleanBase = extractBaseTeamName(baseName);
  if (!previousSiteName || !previousSiteName.trim()) {
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
        notes: `Previously registered base site (${prevName})`,
      });
    }

    const currentPending =
      team.assignedSiteId && getSitePendingUnits
        ? getSitePendingUnits(team.id, team.assignedSiteId)
        : 0;

    records.push({
      id: `hist-curr-${team.id}`,
      siteId: team.assignedSiteId,
      siteName: currentSiteName,
      assignmentType: team.assignmentStatus === 'Temporary' ? 'Temporary' : 'Permanent',
      status: 'Active',
      previousSiteId: team.previousSiteId,
      previousSiteName: team.previousSiteName,
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
          : team.previousSiteName
          ? `Permanent assignment confirmed (Ref: ${team.previousSiteName})`
          : 'Initial permanent site registration',
    });

    return records;
  }

  // Enrich live stock clearance status on existing history records
  return existingHistory.map((rec) => {
    const liveSite = sites.find((s) => s.id === rec.siteId);
    const pendingUnits =
      rec.siteId && getSitePendingUnits ? getSitePendingUnits(team.id, rec.siteId) : 0;
    return {
      ...rec,
      siteName: liveSite?.name || rec.siteName || 'Site Branch',
      stockCleared: pendingUnits <= 0,
    };
  });
}
