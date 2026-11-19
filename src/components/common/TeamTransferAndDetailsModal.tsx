import React, { useState, useMemo } from 'react';
import {
  Users2,
  MapPin,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Package,
  X,
  History,
  Building2,
  UserCheck,
  Phone,
  IdCard,
  ArrowRight,
} from 'lucide-react';
import { Team, isSuperAdmin, isCentralOrAllSiteAdmin, isUserAssignedToSite } from '../../types';
import { useStock } from '../../context/StockContext';
import {
  extractBaseTeamName,
  formatPermanentTransferredTeamName,
  getTemporaryAssignmentBadgeLabel,
  getTeamCompleteAssignmentHistory,
} from '../../utils/teamAssignmentUtils';
import { formatDateTime, formatNumber } from '../../utils/exportUtils';

interface TeamTransferAndDetailsModalProps {
  team: Team | null;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'details' | 'transfer';
  onSuccessToast?: (msg: string) => void;
}

export const TeamTransferAndDetailsModal: React.FC<TeamTransferAndDetailsModalProps> = ({
  team: initialTeamProp,
  isOpen,
  onClose,
  initialTab = 'details',
  onSuccessToast,
}) => {
  const {
    teams,
    activeSites,
    currentUser,
    transferTeamToSite,
    promoteTeamAssignmentToPermanent,
    getTeamInHandStock,
    getTeamSiteInHandStock,
  } = useStock();

  // Always read the live team state from context
  const team = useMemo(
    () => (initialTeamProp ? teams.find((t) => t.id === initialTeamProp.id) || initialTeamProp : null),
    [teams, initialTeamProp]
  );

  const [activeTab, setActiveTab] = useState<'details' | 'transfer'>(initialTab);
  const [targetSiteId, setTargetSiteId] = useState<string>('');
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  React.useEffect(() => {
    if (isOpen && team) {
      setActiveTab(initialTab);
      const otherSites = activeSites.filter((s) => s.id !== team.assignedSiteId);
      setTargetSiteId(otherSites[0]?.id || '');
      setTransferNotes('');
      setFeedbackBanner(null);
    }
  }, [isOpen, initialTab, team?.id]);

  if (!isOpen || !team) return null;

  const currentSite = activeSites.find((s) => s.id === team.assignedSiteId);
  const currentSiteName = currentSite?.name || 'Assigned Site';
  const prevSiteId = team.pendingClearanceSiteId || team.previousSiteId;
  const prevSite = activeSites.find((s) => s.id === prevSiteId);
  const prevSiteName =
    team.previousSiteName || team.pendingClearanceSiteName || prevSite?.name || '';

  // Calculate stock held on current site and previous site(s) separately — never summed together
  const currentSiteStock = getTeamSiteInHandStock(team.id, team.assignedSiteId);
  const prevSiteStock = prevSiteId ? getTeamSiteInHandStock(team.id, prevSiteId) : null;
  const totalInHandStock = getTeamInHandStock(team.id);
  const previousSitesStockToReturn = totalInHandStock.previousSitesStockToReturn || [];

  // Units pending on current site when preparing to transfer to a new site
  const unitsOnCurrentSiteForTransfer = currentSiteStock.totalUnitsHeld;

  // Units pending on previous site(s) while currently in Temporary status
  const pendingUnitsOnPreviousSite =
    (totalInHandStock.totalUnitsToReturnFromPreviousSites || 0) > 0
      ? totalInHandStock.totalUnitsToReturnFromPreviousSites || 0
      : prevSiteStock
      ? prevSiteStock.totalUnitsHeld
      : 0;

  const isTemporary = team.assignmentStatus === 'Temporary';
  const tempBadgeLabel = getTemporaryAssignmentBadgeLabel(team, activeSites);
  const cleanBaseName = extractBaseTeamName(team.teamName, team.baseTeamName);
  const previewPermanentName = formatPermanentTransferredTeamName(
    cleanBaseName,
    prevSiteName || currentSiteName
  );

  // Check if current user is System Admin or Branch Admin for this site
  const canManageTeamAssignment =
    isSuperAdmin(currentUser.role) ||
    isCentralOrAllSiteAdmin(currentUser.role) ||
    currentUser.role === 'Branch Admin' ||
    (currentSite ? isUserAssignedToSite(currentUser, currentSite, activeSites) : true);

  const assignmentHistory = getTeamCompleteAssignmentHistory(
    team,
    activeSites,
    (tId, sId) => getTeamSiteInHandStock(tId, sId).totalUnitsHeld
  );

  const otherAvailableSites = activeSites.filter((s) => s.id !== team.assignedSiteId);
  const selectedNewSite = activeSites.find((s) => s.id === targetSiteId);

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSiteId) {
      setFeedbackBanner({
        type: 'error',
        message: 'Please select a destination site branch to transfer this team.',
      });
      return;
    }

    const res = transferTeamToSite(team.id, targetSiteId, transferNotes);
    if (res.success) {
      setFeedbackBanner({
        type: res.pendingStockUnitsOnPrevSite > 0 ? 'warning' : 'success',
        message: res.message,
      });
      if (onSuccessToast) onSuccessToast(res.message);
      setActiveTab('details');
    } else {
      setFeedbackBanner({
        type: 'error',
        message: res.message,
      });
    }
  };

  const handlePromoteToPermanent = () => {
    const res = promoteTeamAssignmentToPermanent(team.id, false);
    if (res.success) {
      setFeedbackBanner({
        type: 'success',
        message: res.message,
      });
      if (onSuccessToast) onSuccessToast(res.message);
    } else {
      setFeedbackBanner({
        type: 'error',
        message: res.message,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white px-6 py-4 flex items-start sm:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
              <Users2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  Field Team Profile &amp; Site Assignment Ledger
                </span>
                {isTemporary ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/25 text-amber-200 border border-amber-400/40">
                    <Clock className="w-3 h-3 text-amber-300" />
                    <span>{tempBadgeLabel}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/25 text-emerald-200 border border-emerald-400/40">
                    <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                    <span>Permanent Assigned — {currentSiteName}</span>
                  </span>
                )}
              </div>
              <h2 className="text-lg font-extrabold text-white tracking-tight mt-0.5 break-words">
                {team.teamName}
              </h2>
              <p className="text-xs text-slate-300">
                Leader: <strong className="text-white">{team.teamLeaderName}</strong>
                {team.teamLeaderIdNumber ? ` (ID: ${team.teamLeaderIdNumber})` : ''} · Crew Strength:{' '}
                <strong className="text-white font-mono">{team.crewSize}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Assigned Sites History &amp; Profile ({assignmentHistory.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('transfer')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'transfer'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transfer Team to Another Site</span>
            </button>
          </div>

          {isTemporary && canManageTeamAssignment && (
            <button
              type="button"
              onClick={handlePromoteToPermanent}
              disabled={pendingUnitsOnPreviousSite > 0}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                pendingUnitsOnPreviousSite > 0
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer'
              }`}
              title={
                pendingUnitsOnPreviousSite > 0
                  ? `Clear ${pendingUnitsOnPreviousSite} unit(s) on ${prevSiteName} first`
                  : `Promote to Permanent with (Ref: ${prevSiteName})`
              }
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Confirm Permanent Assignment</span>
            </button>
          )}
        </div>

        {/* Feedback Alert Banner */}
        {feedbackBanner && (
          <div
            className={`px-6 py-3 text-xs font-semibold flex items-center justify-between gap-3 border-b ${
              feedbackBanner.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : feedbackBanner.type === 'warning'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{feedbackBanner.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'details' ? (
            <>
              {/* Current Site Assignment Status & Clearance Banner */}
              <div
                className={`p-4 rounded-2xl border ${
                  isTemporary
                    ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wide ${
                          isTemporary
                            ? 'bg-amber-600 text-white'
                            : 'bg-emerald-700 text-white'
                        }`}
                      >
                        {isTemporary
                          ? `Temporary Assigned to - ${currentSiteName}`
                          : `Permanent Assignment — ${currentSiteName}`}
                      </span>
                      {prevSiteName && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white/90 border border-slate-300 text-slate-800">
                          Previous Site Ref: <strong>{prevSiteName}</strong>
                        </span>
                      )}
                    </div>

                    {isTemporary ? (
                      pendingUnitsOnPreviousSite > 0 ? (
                        <p className="text-xs text-amber-900 leading-relaxed mt-1">
                          <strong>Pending Stock Accountability on {prevSiteName}:</strong> This team still holds{' '}
                          <strong className="font-mono underline">
                            {formatNumber(pendingUnitsOnPreviousSite)} unit(s)
                          </strong>{' '}
                          of uncleared stock on <strong>{prevSiteName}</strong>. Until that stock is returned or logged as project usage, the team remains displayed as{' '}
                          <strong>&ldquo;Temporary Assigned to - {currentSiteName}&rdquo;</strong>. Once cleared, it will automatically promote to{' '}
                          <strong>Permanent</strong> as{' '}
                          <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">
                            {formatPermanentTransferredTeamName(cleanBaseName, prevSiteName)}
                          </code>
                          .
                        </p>
                      ) : (
                        <p className="text-xs text-amber-900 leading-relaxed mt-1">
                          <strong>Ready for Permanent Confirmation:</strong> All stock on the previous site (
                          <strong>{prevSiteName || 'Previous Site'}</strong>) is cleared (0 pending units). A{' '}
                          <strong>Branch Admin</strong> or <strong>System Admin</strong> can now confirm this assignment as{' '}
                          <strong>Permanent</strong>, which will update the team designation to{' '}
                          <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">
                            {formatPermanentTransferredTeamName(cleanBaseName, prevSiteName)}
                          </code>
                          .
                        </p>
                      )
                    ) : (
                      <p className="text-xs text-emerald-900 leading-relaxed mt-1">
                        This team is permanently assigned to <strong>{currentSiteName}</strong>
                        {prevSiteName
                          ? ` with verified prior-site reference (Ref: ${prevSiteName}).`
                          : '.'}
                      </p>
                    )}
                  </div>

                  {isTemporary && canManageTeamAssignment && pendingUnitsOnPreviousSite <= 0 && (
                    <button
                      type="button"
                      onClick={handlePromoteToPermanent}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Promote to Permanent (Ref: {prevSiteName})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Complete Assigned Sites Ledger (Past & Current) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                      All Assigned Sites History (Temporary &amp; Permanent)
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    {assignmentHistory.length} Site Record{assignmentHistory.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3">Assigned Site Branch</th>
                        <th className="py-2.5 px-3">Assignment Type</th>
                        <th className="py-2.5 px-3">Prior Site Ref</th>
                        <th className="py-2.5 px-3">Stock Clearance</th>
                        <th className="py-2.5 px-3">Assigned / Promoted Date</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {assignmentHistory.map((rec, index) => {
                        const siteInHand = getTeamSiteInHandStock(team.id, rec.siteId).totalUnitsHeld;
                        const isCurrentActive = rec.status === 'Active';

                        return (
                          <tr
                            key={rec.id || index}
                            className={isCurrentActive ? 'bg-emerald-50/30 font-medium' : 'hover:bg-slate-50'}
                          >
                            <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                              {index + 1}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{rec.siteName}</span>
                              </div>
                              {rec.notes && (
                                <div className="text-[10px] text-slate-500 mt-0.5">{rec.notes}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {rec.assignmentType === 'Temporary' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>Temporary Assigned to - {rec.siteName}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                  <span>Permanent</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {rec.previousSiteName ? (
                                <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                                  Ref: {rec.previousSiteName}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Initial Base</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {siteInHand > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                                  <Package className="w-3 h-3 text-amber-600" />
                                  <span>{formatNumber(siteInHand)} Units In-Hand</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Stock Cleared (0)</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                              <div>{formatDateTime(rec.assignedAt)}</div>
                              {rec.promotedToPermanentAt && (
                                <div className="text-[10px] text-emerald-700 font-bold">
                                  Perm: {formatDateTime(rec.promotedToPermanentAt)}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {isCurrentActive ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-600 text-white">
                                  Current Active
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                  Prior Site
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Team Members & Stock Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Crew Roster */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <IdCard className="w-4 h-4 text-emerald-600" />
                      <span>Leader &amp; Crew Members ({team.crewSize})</span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {team.contactPhone || 'N/A'}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    <div className="p-2.5 rounded-xl bg-white border border-emerald-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900">{team.teamLeaderName}</div>
                          <div className="text-[10px] text-emerald-700 font-semibold">Team Leader</div>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-700">
                        {team.teamLeaderIdNumber || 'Leader'}
                      </span>
                    </div>

                    {team.members && team.members.length > 0 ? (
                      team.members.map((m, idx) => (
                        <div
                          key={m.id || idx}
                          className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono text-slate-400 mr-1.5">{idx + 1}.</span>
                            <span className="font-semibold text-slate-800">{m.name}</span>
                            {m.role && (
                              <span className="ml-1.5 text-[10px] text-slate-500">({m.role})</span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] font-bold text-emerald-700">
                            {m.idNumber}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-slate-400 italic py-2 text-center">
                        No additional crew members listed.
                      </div>
                    )}
                  </div>
                </div>

                {/* Active In-Hand Stock Custody — Strictly Separated by Site */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-indigo-600" />
                      <span>Site-Separated Stock Custody</span>
                    </h4>
                    <span className="text-[10px] font-bold text-slate-500">
                      Never combined across sites
                    </span>
                  </div>

                  {/* 1. Stock to Return - [Previous Site Name] */}
                  {previousSitesStockToReturn.map((prevGrp) => {
                    const heldItems = prevGrp.items.filter((i) => i.currentInHand > 0);
                    if (heldItems.length === 0) return null;
                    return (
                      <div
                        key={prevGrp.siteId}
                        className="p-3 rounded-xl bg-amber-50/90 border-2 border-amber-300 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[11px] font-extrabold text-amber-950 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>Stock to Return - {prevGrp.siteName}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-amber-700 text-white font-mono text-[10px] font-extrabold">
                            {formatNumber(prevGrp.totalUnitsHeld)} Units
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-900 font-medium">
                          Must be returned to <strong>{prevGrp.siteName}</strong> · Cannot be used at{' '}
                          <strong>{currentSiteName}</strong>
                        </p>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {heldItems.map((item) => (
                            <div
                              key={`${prevGrp.siteId}-${item.itemId}`}
                              className="p-2 rounded-lg bg-white border border-amber-200 flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-mono font-bold text-slate-900 text-[11px]">
                                  {item.itemCode}
                                </div>
                                <div className="text-slate-700 truncate">{item.itemName}</div>
                              </div>
                              <span className="font-mono font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded shrink-0">
                                {formatNumber(item.currentInHand)} {item.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* 2. Current Assigned Site Active Usable Stock */}
                  <div className="p-3 rounded-xl bg-white border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[11px] font-extrabold text-emerald-950 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{currentSiteName} — Active Site Stock</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-700 text-white font-mono text-[10px] font-extrabold">
                        {formatNumber(currentSiteStock.totalUnitsHeld)} Units
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Usable solely on <strong>{currentSiteName}</strong> projects
                    </p>

                    {currentSiteStock.items.filter((i) => i.currentInHand > 0).length === 0 ? (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center text-[11px] text-slate-500">
                        0 active units held under <strong>{currentSiteName}</strong>.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {currentSiteStock.items
                          .filter((i) => i.currentInHand > 0)
                          .map((item) => (
                            <div
                              key={item.itemId}
                              className="p-2 rounded-lg bg-emerald-50/40 border border-emerald-200 flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-mono font-bold text-slate-900 text-[11px]">
                                  {item.itemCode}
                                </div>
                                <div className="text-slate-700 truncate">{item.itemName}</div>
                              </div>
                              <span className="font-mono font-extrabold text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded shrink-0">
                                {formatNumber(item.currentInHand)} {item.unit}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* TAB 2: TRANSFER TEAM TO ANOTHER SITE WORKFLOW */
            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Current Registered Site
                    </span>
                    <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>{currentSiteName}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Current Site Stock Status
                    </span>
                    <div className="mt-0.5">
                      {unitsOnCurrentSiteForTransfer > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                          <span>{formatNumber(unitsOnCurrentSiteForTransfer)} Units Not Cleared</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>0 Pending Stock (Cleared)</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rule Explanation Box */}
                {unitsOnCurrentSiteForTransfer > 0 ? (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1">
                    <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                      <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>
                        Rule 1 Active: Unreturned Stock on {currentSiteName} ({formatNumber(unitsOnCurrentSiteForTransfer)} Units)
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      Because stock on <strong>{currentSiteName}</strong> is not cleared yet, transferring this team will display them on the new site as:{' '}
                      <strong className="underline">
                        &ldquo;Temporary Assigned to - {selectedNewSite?.name || '[New Site Name]'}&rdquo;
                      </strong>
                      . Once the pending stock on <strong>{currentSiteName}</strong> is cleared/settled, the assignment will automatically promote to <strong>Permanent</strong> and update the team name to{' '}
                      <strong className="font-mono">
                        {formatPermanentTransferredTeamName(cleanBaseName, currentSiteName)}
                      </strong>
                      .
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-1">
                    <div className="font-extrabold flex items-center gap-1.5 text-blue-900">
                      <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                      <span>
                        Rule 2 Active: Zero Pending Stock on {currentSiteName}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-900 leading-relaxed">
                      Even with zero pending stock on <strong>{currentSiteName}</strong>, the transfer starts in a{' '}
                      <strong>Temporary</strong> state first (
                      <strong>
                        &ldquo;Temporary Assigned to - {selectedNewSite?.name || '[New Site Name]'}&rdquo;
                      </strong>
                      ). Immediately after transfer, the <strong>Branch Admin</strong> or <strong>System Admin</strong> can confirm/promote the assignment to <strong>Permanent</strong> with previous site reference:{' '}
                      <strong className="font-mono">
                        {formatPermanentTransferredTeamName(cleanBaseName, currentSiteName)}
                      </strong>
                      .
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select New Destination Site Branch *
                </label>
                <select
                  value={targetSiteId}
                  onChange={(e) => setTargetSiteId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  required
                >
                  {otherAvailableSites.length === 0 ? (
                    <option value="">No other active sites available</option>
                  ) : (
                    otherAvailableSites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.location})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {selectedNewSite && (
                <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Assignment Lifecycle Preview
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-[11px] text-amber-300 font-bold">
                        Step 1 (Initial Transfer State):
                      </div>
                      <div className="font-mono font-bold text-white mt-0.5">
                        {cleanBaseName}{' '}
                        <span className="px-2 py-0.5 rounded bg-amber-500/25 text-amber-200 border border-amber-400/40 text-[10px]">
                          Temporary Assigned to - {selectedNewSite.name}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block shrink-0" />
                    <div>
                      <div className="text-[11px] text-emerald-300 font-bold">
                        Step 2 (Permanent After Clearance / Admin Confirmation):
                      </div>
                      <div className="font-mono font-bold text-emerald-200 mt-0.5">
                        {previewPermanentName}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Transfer Reason / Handover Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="e.g. Dispatched to support urgent fiber stringing / project installation at new branch..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!targetSiteId || otherAvailableSites.length === 0}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-300 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>
                    Transfer as Temporary Assigned to - {selectedNewSite?.name || 'New Site'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
