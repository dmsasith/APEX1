import React from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  MapPin,
  Shield,
  UserCheck,
  X,
} from 'lucide-react';
import {
  Site,
  User,
  UserSiteAssignmentHistoryRecord,
  formatSiteHierarchyLabel,
  getUserAssignedSiteIds,
  isUserAllSites,
} from '../../types';
import { formatDate, formatDateTimeParts } from '../../utils/exportUtils';
import {
  formatAssignmentDuration,
  getSiteCompleteSupervisorHistory,
  getUserCompleteSiteAssignmentHistory,
} from '../../utils/userAssignmentUtils';

interface UserSiteHistoryTableProps {
  records: UserSiteAssignmentHistoryRecord[];
  sites: Site[];
  compact?: boolean;
  emptyMessage?: string;
}

export const UserSiteHistoryTable: React.FC<UserSiteHistoryTableProps> = ({
  records,
  sites,
  compact = false,
  emptyMessage = 'No site assignment history recorded yet.',
}) => {
  if (records.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th className={`${compact ? 'py-2 px-2.5' : 'py-2.5 px-3'} w-8 text-center`}>#</th>
            <th className={compact ? 'py-2 px-2.5' : 'py-2.5 px-3'}>Site Branch</th>
            <th className={compact ? 'py-2 px-2.5' : 'py-2.5 px-3'}>Role on Site</th>
            <th className={compact ? 'py-2 px-2.5' : 'py-2.5 px-3'}>Start Date</th>
            <th className={compact ? 'py-2 px-2.5' : 'py-2.5 px-3'}>End Date</th>
            <th className={compact ? 'py-2 px-2.5' : 'py-2.5 px-3'}>Duration</th>
            <th className={`${compact ? 'py-2 px-2.5' : 'py-2.5 px-3'} text-right`}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {records.map((rec, index) => {
            const isActive = rec.status === 'Active';
            const siteObj = rec.siteId !== 'all' ? sites.find((s) => s.id === rec.siteId) : undefined;
            const displaySiteLabel =
              rec.siteId === 'all'
                ? 'All Sites / Central HQ'
                : siteObj
                ? formatSiteHierarchyLabel(siteObj, sites)
                : rec.siteName;
            const startParts = formatDateTimeParts(rec.startDate);
            const endParts = rec.endDate ? formatDateTimeParts(rec.endDate) : null;
            const duration = formatAssignmentDuration(rec.startDate, rec.endDate);

            return (
              <tr
                key={rec.id || `${rec.siteId}-${index}`}
                className={
                  isActive
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                }
              >
                <td className={`${compact ? 'py-2 px-2.5' : 'py-2.5 px-3'} text-center font-mono tabular-nums text-slate-400`}>
                  {index + 1}
                </td>
                <td className={compact ? 'py-2 px-2.5' : 'py-2.5 px-3'}>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                    <span>{displaySiteLabel}</span>
                  </div>
                  {!compact && rec.notes && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 pl-5">
                      {rec.notes}
                    </div>
                  )}
                </td>
                <td className={compact ? 'py-2 px-2.5' : 'py-2.5 px-3'}>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                      rec.assignmentRole === 'Supervisor'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : rec.assignmentRole === 'All Sites'
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {rec.assignmentRole === 'Supervisor' && <Shield className="w-3 h-3 shrink-0" />}
                    <span>{rec.assignmentRole}</span>
                  </span>
                </td>
                <td className={`${compact ? 'py-2 px-2.5' : 'py-2.5 px-3'} whitespace-nowrap`}>
                  <div className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                    {startParts.date}
                  </div>
                  {!compact && startParts.time && (
                    <div className="text-[10px] font-mono tabular-nums text-slate-400">
                      {startParts.time}
                    </div>
                  )}
                </td>
                <td className={`${compact ? 'py-2 px-2.5' : 'py-2.5 px-3'} whitespace-nowrap`}>
                  {endParts ? (
                    <>
                      <div className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                        {endParts.date}
                      </div>
                      {!compact && endParts.time && (
                        <div className="text-[10px] font-mono tabular-nums text-slate-400">
                          {endParts.time}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      Present (Active)
                    </span>
                  )}
                </td>
                <td className={`${compact ? 'py-2 px-2.5' : 'py-2.5 px-3'} font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap`}>
                  {duration}
                </td>
                <td className={`${compact ? 'py-2 px-2.5' : 'py-2.5 px-3'} text-right whitespace-nowrap`}>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>Previous</span>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

interface UserSiteHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'user' | 'site';
  user?: User | null;
  site?: Site | null;
  sites: Site[];
  users: User[];
}

export const UserSiteHistoryModal: React.FC<UserSiteHistoryModalProps> = ({
  isOpen,
  onClose,
  mode,
  user,
  site,
  sites,
  users,
}) => {
  if (!isOpen) return null;

  if (mode === 'user' && user) {
    const history = getUserCompleteSiteAssignmentHistory(user, sites);
    const activeRecords = history.filter((r) => r.status === 'Active');
    const previousRecords = history.filter((r) => r.status !== 'Active');
    const assignedIds = getUserAssignedSiteIds(user, sites);
    const currentSitesLabel = isUserAllSites(user)
      ? 'All Sites / Central HQ'
      : assignedIds
          .map((sid) => sites.find((s) => s.id === sid)?.name)
          .filter(Boolean)
          .join(', ') || 'Unassigned';

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  User &amp; Supervisor Site Assignment Ledger
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                  {user.fullName}{' '}
                  <span className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400">
                    (@{user.username})
                  </span>
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
              aria-label="Close site assignment history modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Summary Strip */}
          <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-white dark:bg-slate-900 shrink-0">
            <div>
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Current Active Site(s)
              </div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5 break-words">
                {currentSitesLabel}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Previous Site Stints
              </div>
              <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-0.5">
                {previousRecords.length} previous · {activeRecords.length} active
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Account Role &amp; Registered
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {user.role} · <span className="font-mono tabular-nums text-slate-500">{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Body Table */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-white">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Complete Site Assignment Timeline (Start &amp; End Dates)</span>
                </div>
                <span className="text-[11px] font-mono tabular-nums font-bold text-slate-500">
                  {history.length} record{history.length === 1 ? '' : 's'}
                </span>
              </div>
              <UserSiteHistoryTable records={history} sites={sites} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'site' && site) {
    const supHistory = getSiteCompleteSupervisorHistory(site);
    const activeUsers = users.filter((u) => !u.isDeleted);

    // Gather all user assignment history records tied to this site
    const sitePersonnelHistory: Array<{
      user: User;
      record: UserSiteAssignmentHistoryRecord;
    }> = [];

    activeUsers.forEach((u) => {
      const uHistory = getUserCompleteSiteAssignmentHistory(u, sites);
      uHistory
        .filter((rec) => rec.siteId === site.id)
        .forEach((rec) => {
          sitePersonnelHistory.push({ user: u, record: rec });
        });
    });

    sitePersonnelHistory.sort((a, b) => {
      if (a.record.status !== b.record.status) {
        return a.record.status === 'Active' ? -1 : 1;
      }
      return (new Date(b.record.startDate).getTime() || 0) - (new Date(a.record.startDate).getTime() || 0);
    });

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Branch Supervisor &amp; Staff Assignment History
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                  {formatSiteHierarchyLabel(site, sites)}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
              aria-label="Close branch history modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Section 1: Site Supervisor History */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-white">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Branch Supervisor / In-Charge Timeline</span>
                </div>
                <span className="text-[11px] font-mono tabular-nums font-bold text-slate-500">
                  {supHistory.length} record{supHistory.length === 1 ? '' : 's'}
                </span>
              </div>

              {supHistory.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  No supervisor history recorded for this branch yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3 w-8 text-center">#</th>
                        <th className="py-2.5 px-3">Supervisor / In-Charge</th>
                        <th className="py-2.5 px-3">Start Date</th>
                        <th className="py-2.5 px-3">End Date</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {supHistory.map((rec, idx) => {
                        const isActive = rec.status === 'Active';
                        const startParts = formatDateTimeParts(rec.startDate);
                        const endParts = rec.endDate ? formatDateTimeParts(rec.endDate) : null;
                        return (
                          <tr
                            key={rec.id || idx}
                            className={
                              isActive
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                                : 'bg-white dark:bg-slate-900 hover:bg-slate-50/80'
                            }
                          >
                            <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <UserCheck className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>{rec.supervisorName}</span>
                              </div>
                              {rec.notes && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 pl-5">
                                  {rec.notes}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                                {startParts.date}
                              </div>
                              {startParts.time && (
                                <div className="text-[10px] font-mono tabular-nums text-slate-400">
                                  {startParts.time}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {endParts ? (
                                <>
                                  <div className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                                    {endParts.date}
                                  </div>
                                  {endParts.time && (
                                    <div className="text-[10px] font-mono tabular-nums text-slate-400">
                                      {endParts.time}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                  Present (Active)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {formatAssignmentDuration(rec.startDate, rec.endDate)}
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Active</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                  <Clock className="w-3 h-3" />
                                  <span>Previous</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Section 2: Assigned System Users History at this Branch */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-white">
                  <History className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span>Assigned System Staff History at This Branch</span>
                </div>
                <span className="text-[11px] font-mono tabular-nums font-bold text-slate-500">
                  {sitePersonnelHistory.length} stint{sitePersonnelHistory.length === 1 ? '' : 's'}
                </span>
              </div>

              {sitePersonnelHistory.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  No registered system user assignments recorded at this branch yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Staff / User</th>
                        <th className="py-2.5 px-3">Role on Site</th>
                        <th className="py-2.5 px-3">Start Date</th>
                        <th className="py-2.5 px-3">End Date</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {sitePersonnelHistory.map(({ user: u, record }) => {
                        const isActive = record.status === 'Active';
                        const startParts = formatDateTimeParts(record.startDate);
                        const endParts = record.endDate ? formatDateTimeParts(record.endDate) : null;
                        return (
                          <tr
                            key={`${u.id}-${record.id}`}
                            className={
                              isActive
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                                : 'bg-white dark:bg-slate-900 hover:bg-slate-50/80'
                            }
                          >
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900 dark:text-white">{u.fullName}</div>
                              <div className="text-[10px] font-mono text-slate-500">@{u.username}</div>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                              {record.assignmentRole}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap font-mono tabular-nums text-slate-800 dark:text-slate-200">
                              {startParts.date}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap font-mono tabular-nums">
                              {endParts ? (
                                <span className="text-slate-700 dark:text-slate-300">{endParts.date}</span>
                              ) : (
                                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                  Present (Active)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap font-mono tabular-nums text-slate-600 dark:text-slate-400">
                              {formatAssignmentDuration(record.startDate, record.endDate)}
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Active</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                  <Clock className="w-3 h-3" />
                                  <span>Previous</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
