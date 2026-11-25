import {
  Site,
  SiteSupervisorHistoryRecord,
  User,
  UserRole,
  UserSiteAssignmentHistoryRecord,
  getUserAssignedSiteIds,
  getUserSupervisedSites,
  isUserAllSites,
} from '../types';

/**
 * Safely normalizes history arrays (handles both JS Arrays and Firebase RTDB numeric-keyed maps).
 */
export function normalizeHistoryList<T>(raw: unknown): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter(Boolean) as T[];
  }
  if (typeof raw === 'object') {
    return Object.values(raw as Record<string, T>).filter(Boolean);
  }
  return [];
}

/**
 * Returns today's date in local YYYY-MM-DD format for <input type="date">.
 */
export function getTodayLocalDateInputValue(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Converts a YYYY-MM-DD date input (or full ISO string) into a clean ISO timestamp.
 * If dateInput equals today's local date, uses the current exact ISO timestamp.
 * Otherwise uses local noon to prevent timezone day-shift when formatted back.
 */
export function resolveEffectiveAssignmentIso(
  dateInput?: string,
  fallbackIso?: string
): string {
  const clean = (dateInput || '').trim();
  if (!clean) {
    return fallbackIso || new Date().toISOString();
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    if (clean === getTodayLocalDateInputValue()) {
      return fallbackIso || new Date().toISOString();
    }
    const localNoon = new Date(`${clean}T12:00:00`);
    if (!isNaN(localNoon.getTime())) {
      return localNoon.toISOString();
    }
  }
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  return fallbackIso || new Date().toISOString();
}

/**
 * Formats a human-readable duration between startDate and endDate (or current time if active).
 */
export function formatAssignmentDuration(startIso?: string, endIso?: string): string {
  if (!startIso) return '—';
  const startMs = new Date(startIso).getTime();
  const endMs = endIso ? new Date(endIso).getTime() : Date.now();
  if (isNaN(startMs) || isNaN(endMs)) return '—';

  const diffDays = Math.max(0, Math.floor((endMs - startMs) / (1000 * 60 * 60 * 24)));
  if (diffDays === 0) {
    return endIso ? '< 1 day' : 'Today';
  }
  if (diffDays === 1) return '1 day';
  if (diffDays < 30) return `${diffDays} days`;

  const months = Math.floor(diffDays / 30);
  const remDays = diffDays % 30;
  if (months < 12) {
    return remDays > 0 ? `${months} mo${months === 1 ? '' : 's'} ${remDays}d` : `${months} mo${months === 1 ? '' : 's'}`;
  }
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths > 0 ? `${years}y ${remMonths}m` : `${years}y`;
}

function makeHistoryId(prefix: string, seed: string | number): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${seed}`;
}

/**
 * Synthesizes baseline active history records for a user who was created before
 * `siteAssignmentHistory` tracking was enabled.
 */
export function getUserBaselineHistoryRecords(
  user: Pick<User, 'id' | 'fullName' | 'role' | 'username' | 'siteId' | 'siteIds' | 'createdAt'>,
  sites: Site[],
  actorName?: string
): UserSiteAssignmentHistoryRecord[] {
  const startIso = user.createdAt || new Date().toISOString();
  if (isUserAllSites(user)) {
    return [
      {
        id: `uhist-init-${user.id}-all`,
        siteId: 'all',
        siteName: 'All Sites / Central HQ',
        assignmentRole: 'All Sites',
        userRoleAtTime: user.role,
        status: 'Active',
        startDate: startIso,
        assignedBy: actorName || 'System',
        notes: 'Initial All-Sites access assignment',
      },
    ];
  }

  const assignedIds = getUserAssignedSiteIds(user, sites);
  const supervisedIds = new Set(getUserSupervisedSites(user, sites).map((s) => s.id));

  return assignedIds.map((sid) => {
    const siteObj = sites.find((s) => s.id === sid);
    const isSup = supervisedIds.has(sid);
    return {
      id: `uhist-init-${user.id}-${sid}`,
      siteId: sid,
      siteName: siteObj?.name || sid,
      assignmentRole: isSup ? 'Supervisor' : 'Assigned Staff',
      userRoleAtTime: user.role,
      status: 'Active',
      startDate: startIso,
      assignedBy: actorName || 'System',
      notes: isSup ? 'Initial Site Supervisor assignment' : 'Initial site branch assignment',
    };
  });
}

/**
 * Returns a complete chronologically ordered site assignment history for a user
 * (both previous completed/reassigned sites and currently active sites).
 * Automatically enriches live site names and synthesizes baseline records for legacy users.
 */
export function getUserCompleteSiteAssignmentHistory(
  user: Pick<
    User,
    'id' | 'fullName' | 'role' | 'username' | 'siteId' | 'siteIds' | 'createdAt' | 'siteAssignmentHistory'
  >,
  sites: Site[]
): UserSiteAssignmentHistoryRecord[] {
  const rawList = normalizeHistoryList<UserSiteAssignmentHistoryRecord>(user.siteAssignmentHistory);

  if (rawList.length === 0) {
    return getUserBaselineHistoryRecords(user, sites);
  }

  // Enrich site names and reconcile if any currently assigned site wasn't captured yet
  const enriched = rawList.map((rec) => {
    if (rec.siteId === 'all') {
      return {
        ...rec,
        siteName: 'All Sites / Central HQ',
      };
    }
    const matchedSite = sites.find((s) => s.id === rec.siteId);
    return {
      ...rec,
      siteName: matchedSite?.name || rec.siteName || 'Site Branch',
    };
  });

  // Sort chronologically by startDate (then Active records after Completed on identical timestamps)
  return enriched.sort((a, b) => {
    const tA = new Date(a.startDate).getTime() || 0;
    const tB = new Date(b.startDate).getTime() || 0;
    if (tA !== tB) return tA - tB;
    if (a.status !== b.status) {
      return a.status === 'Completed / Reassigned' ? -1 : 1;
    }
    return 0;
  });
}

/**
 * Computes the next `siteAssignmentHistory` array when a user's site assignments or
 * supervisor designations change.
 *
 * - Removed sites: previous Active record is closed with `status: 'Completed / Reassigned'` & `endDate = effectiveIso`.
 * - Role change on the same site (Supervisor <-> Assigned Staff): previous stint is closed and a new stint opens at `effectiveIso`.
 * - Newly assigned sites: new Active record is appended with `startDate = effectiveIso`.
 */
export function computeNextUserSiteAssignmentHistory(params: {
  prevUser?: User;
  nextIsAllSites: boolean;
  nextSpecificSiteIds: string[];
  nextSupervisedSiteIds: Set<string>;
  nextUserRole: UserRole;
  allSites: Site[];
  effectiveIso: string;
  actorName: string;
}): UserSiteAssignmentHistoryRecord[] {
  const {
    prevUser,
    nextIsAllSites,
    nextSpecificSiteIds,
    nextSupervisedSiteIds,
    nextUserRole,
    allSites,
    effectiveIso,
    actorName,
  } = params;

  const baseHistory: UserSiteAssignmentHistoryRecord[] = prevUser
    ? normalizeHistoryList<UserSiteAssignmentHistoryRecord>(prevUser.siteAssignmentHistory).length > 0
      ? normalizeHistoryList<UserSiteAssignmentHistoryRecord>(prevUser.siteAssignmentHistory).map((h) => ({ ...h }))
      : getUserBaselineHistoryRecords(prevUser, allSites, actorName)
    : [];

  type TargetEntry = {
    siteId: string;
    siteName: string;
    assignmentRole: 'Supervisor' | 'Assigned Staff' | 'All Sites';
  };

  const targets: TargetEntry[] = nextIsAllSites
    ? [
        {
          siteId: 'all',
          siteName: 'All Sites / Central HQ',
          assignmentRole: 'All Sites',
        },
      ]
    : Array.from(new Set(nextSpecificSiteIds))
        .filter((sid) => sid && sid !== 'all' && sid !== 'unassigned')
        .map((sid) => {
          const siteObj = allSites.find((s) => s.id === sid);
          const isSup = nextSupervisedSiteIds.has(sid);
          return {
            siteId: sid,
            siteName: siteObj?.name || sid,
            assignmentRole: isSup ? ('Supervisor' as const) : ('Assigned Staff' as const),
          };
        });

  const targetBySiteId = new Map<string, TargetEntry>();
  targets.forEach((t) => targetBySiteId.set(t.siteId, t));

  const stillActiveKeys = new Set<string>();

  // 1. Reconcile existing Active records
  const reconciled = baseHistory.map((rec) => {
    if (rec.status !== 'Active') return rec;

    const matchingTarget = targetBySiteId.get(rec.siteId);
    if (!matchingTarget) {
      return {
        ...rec,
        status: 'Completed / Reassigned' as const,
        endDate: effectiveIso,
        endedBy: actorName,
        notes:
          rec.notes && !rec.notes.includes('Reassigned')
            ? `${rec.notes} · Reassigned / Unassigned`
            : rec.notes || 'Reassigned to another site',
      };
    }

    // If user switched role on the exact same site (e.g. Assigned Staff -> Supervisor), close prior stint
    if (rec.assignmentRole !== matchingTarget.assignmentRole) {
      return {
        ...rec,
        status: 'Completed / Reassigned' as const,
        endDate: effectiveIso,
        endedBy: actorName,
        notes: `Role updated (${rec.assignmentRole} → ${matchingTarget.assignmentRole})`,
      };
    }

    stillActiveKeys.add(rec.siteId);
    return {
      ...rec,
      siteName: matchingTarget.siteName,
    };
  });

  // 2. Append new Active records for newly assigned sites (or new roles on site)
  const hadPriorRecords = reconciled.length > 0;
  const completedSiteNames = reconciled
    .filter((r) => r.status === 'Completed / Reassigned' && r.endDate === effectiveIso)
    .map((r) => r.siteName);

  const additions: UserSiteAssignmentHistoryRecord[] = [];
  targets.forEach((t, idx) => {
    if (stillActiveKeys.has(t.siteId)) return;

    const prevNote =
      completedSiteNames.length > 0
        ? `Assigned ${t.assignmentRole === 'Supervisor' ? 'as Supervisor ' : ''}(Prev: ${completedSiteNames.join(', ')})`
        : hadPriorRecords
        ? `Assigned ${t.assignmentRole === 'Supervisor' ? 'as Site Supervisor' : 'to branch'}`
        : t.assignmentRole === 'All Sites'
        ? 'Initial All-Sites assignment'
        : t.assignmentRole === 'Supervisor'
        ? 'Initial Site Supervisor assignment'
        : 'Initial site branch assignment';

    additions.push({
      id: makeHistoryId('uhist', `${t.siteId}-${idx}`),
      siteId: t.siteId,
      siteName: t.siteName,
      assignmentRole: t.assignmentRole,
      userRoleAtTime: nextUserRole,
      status: 'Active',
      startDate: effectiveIso,
      assignedBy: actorName,
      notes: prevNote,
    });
  });

  return [...reconciled, ...additions];
}

/**
 * Returns complete supervisor assignment history for a Site Branch.
 */
export function getSiteCompleteSupervisorHistory(site: Site): SiteSupervisorHistoryRecord[] {
  const rawList = normalizeHistoryList<SiteSupervisorHistoryRecord>(site.supervisorHistory);
  if (rawList.length === 0) {
    const cleanName = (site.supervisorName || '').trim();
    if (!cleanName || cleanName.toLowerCase() === 'unassigned') {
      return [];
    }
    return [
      {
        id: `shist-init-${site.id}`,
        supervisorName: cleanName,
        supervisorUserId: site.supervisorUserId || '',
        status: 'Active',
        startDate: site.createdAt || new Date().toISOString(),
        assignedBy: 'System',
        notes: 'Initial Branch Supervisor / In-Charge',
      },
    ];
  }

  return [...rawList].sort((a, b) => {
    const tA = new Date(a.startDate).getTime() || 0;
    const tB = new Date(b.startDate).getTime() || 0;
    if (tA !== tB) return tA - tB;
    if (a.status !== b.status) {
      return a.status === 'Completed / Reassigned' ? -1 : 1;
    }
    return 0;
  });
}

/**
 * Computes the next `supervisorHistory` array on a Site whenever its Supervisor changes.
 */
export function computeNextSiteSupervisorHistory(params: {
  oldSite?: Site;
  nextSupervisorName: string;
  nextSupervisorUserId?: string;
  effectiveIso: string;
  actorName: string;
}): SiteSupervisorHistoryRecord[] {
  const { oldSite, nextSupervisorName, nextSupervisorUserId, effectiveIso, actorName } = params;
  const cleanNextName = (nextSupervisorName || '').trim();
  const cleanNextId = (nextSupervisorUserId || '').trim();
  const isUnassignedNext = !cleanNextName || cleanNextName.toLowerCase() === 'unassigned';

  const baseHistory: SiteSupervisorHistoryRecord[] = oldSite
    ? normalizeHistoryList<SiteSupervisorHistoryRecord>(oldSite.supervisorHistory).length > 0
      ? normalizeHistoryList<SiteSupervisorHistoryRecord>(oldSite.supervisorHistory).map((h) => ({ ...h }))
      : getSiteCompleteSupervisorHistory(oldSite)
    : [];

  const activeEntry = baseHistory.find((h) => h.status === 'Active');

  const isSameSupervisor = Boolean(
    activeEntry &&
      !isUnassignedNext &&
      ((cleanNextId && activeEntry.supervisorUserId && activeEntry.supervisorUserId === cleanNextId) ||
        (!cleanNextId &&
          !activeEntry.supervisorUserId &&
          activeEntry.supervisorName.trim().toLowerCase() === cleanNextName.toLowerCase()))
  );

  if (isSameSupervisor && activeEntry) {
    // Same person (maybe name casing or linked userId updated)
    return baseHistory.map((h) =>
      h.id === activeEntry.id
        ? {
            ...h,
            supervisorName: cleanNextName,
            supervisorUserId: cleanNextId || h.supervisorUserId || '',
          }
        : h
    );
  }

  // Close any active supervisor entries
  const closedPrevName = activeEntry?.supervisorName;
  const updatedHistory = baseHistory.map((h) =>
    h.status === 'Active'
      ? {
          ...h,
          status: 'Completed / Reassigned' as const,
          endDate: effectiveIso,
          endedBy: actorName,
          notes: isUnassignedNext
            ? 'Supervisor unassigned from branch'
            : `Handed over to ${cleanNextName}`,
        }
      : h
  );

  if (!isUnassignedNext) {
    updatedHistory.push({
      id: makeHistoryId('shist', oldSite?.id || 'new'),
      supervisorName: cleanNextName,
      supervisorUserId: cleanNextId || '',
      status: 'Active',
      startDate: effectiveIso,
      assignedBy: actorName,
      notes: closedPrevName
        ? `Assigned as Branch Supervisor (Prev: ${closedPrevName})`
        : 'Assigned as Branch Supervisor / In-Charge',
    });
  }

  return updatedHistory;
}

/**
 * Builds a live diff preview when editing a user's assigned sites before saving.
 */
export function buildUserSiteChangePreview(params: {
  savedUser: User;
  draftIsAllSites: boolean;
  draftSiteIds: string[];
  allSites: Site[];
}): {
  hasSiteScopeChange: boolean;
  endingSites: UserSiteAssignmentHistoryRecord[];
  startingSites: Array<{ siteId: string; siteName: string }>;
  continuingSites: UserSiteAssignmentHistoryRecord[];
} {
  const { savedUser, draftIsAllSites, draftSiteIds, allSites } = params;
  const currentHistory = getUserCompleteSiteAssignmentHistory(savedUser, allSites);
  const activeRecords = currentHistory.filter((r) => r.status === 'Active');

  const draftKeys = new Set<string>(
    draftIsAllSites
      ? ['all']
      : draftSiteIds.filter((sid) => sid && sid !== 'all' && sid !== 'unassigned')
  );

  const activeKeys = new Set(activeRecords.map((r) => r.siteId));

  const endingSites = activeRecords.filter((r) => !draftKeys.has(r.siteId));
  const continuingSites = activeRecords.filter((r) => draftKeys.has(r.siteId));

  const startingSites: Array<{ siteId: string; siteName: string }> = [];
  draftKeys.forEach((key) => {
    if (!activeKeys.has(key)) {
      if (key === 'all') {
        startingSites.push({ siteId: 'all', siteName: 'All Sites / Central HQ' });
      } else {
        const sObj = allSites.find((s) => s.id === key);
        startingSites.push({ siteId: key, siteName: sObj?.name || key });
      }
    }
  });

  const hasSiteScopeChange = endingSites.length > 0 || startingSites.length > 0;

  return {
    hasSiteScopeChange,
    endingSites,
    startingSites,
    continuingSites,
  };
}
