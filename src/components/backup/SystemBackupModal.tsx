import React, { useState } from 'react';
import {
  ShieldAlert,
  Database,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  History,
  X,
  FileArchive,
  Calendar,
  Layers,
  ArrowDownCircle,
  PlusCircle,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { StockBackup } from '../../types';

interface SystemBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemBackupModal: React.FC<SystemBackupModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    backups,
    createBackup,
    restoreBackup,
    deleteBackup,
    flushSystemWithBackup,
    items,
    sites,
    teams,
    projects,
    mainStockEntries,
    stockRequests,
    teamIssues,
    teamReturns,
    projectUsages,
    branchReturns,
  } = useStock();

  const [activeTab, setActiveTab] = useState<'flush' | 'backups' | 'manual'>('flush');

  // Flush states
  const [adminPassword, setAdminPassword] = useState('');
  const [backupName, setBackupName] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [flushStatus, setFlushStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual Backup states
  const [manualName, setManualName] = useState('');
  const [manualNote, setManualNote] = useState('');

  // Selected backup for preview/restore
  const [restoreConfirmBackup, setRestoreConfirmBackup] = useState<StockBackup | null>(null);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isCentralAdmin = currentUser?.role === 'Central Warehouse Admin';

  if (!isCentralAdmin) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 border border-rose-200">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Access Restricted</h3>
            <p className="text-xs text-slate-600 mt-1">
              Full System Flush and Versioned Backup operations are strictly restricted to the <strong>Central Warehouse Admin</strong>.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalCurrentRecords =
    items.length +
    sites.length +
    teams.length +
    projects.length +
    mainStockEntries.length +
    stockRequests.length +
    teamIssues.length +
    teamReturns.length +
    projectUsages.length +
    branchReturns.length;

  const handleExecuteFlush = (e: React.FormEvent) => {
    e.preventDefault();
    setFlushStatus(null);

    if (confirmText.trim().toUpperCase() !== 'FLUSH ALL DATA') {
      setFlushStatus({
        type: 'error',
        text: 'Confirmation text does not match. Please type "FLUSH ALL DATA" exactly.',
      });
      return;
    }

    if (!adminPassword.trim()) {
      setFlushStatus({
        type: 'error',
        text: 'Admin password is required to authorize full system flush.',
      });
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const defaultName = backupName.trim() || `Pre-Flush Archive #${backups.length + 1}`;
      const result = flushSystemWithBackup(adminPassword, defaultName);

      setIsProcessing(false);
      if (result.success) {
        setFlushStatus({
          type: 'success',
          text: result.message,
        });
        setAdminPassword('');
        setConfirmText('');
        setBackupName('');
      } else {
        setFlushStatus({
          type: 'error',
          text: result.message,
        });
      }
    }, 400);
  };

  const handleCreateManualBackup = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = manualName.trim() || `Manual Snapshot #${backups.length + 1}`;
    createBackup(finalName, manualNote.trim() || 'Manual user-triggered snapshot');
    setManualName('');
    setManualNote('');
    setActiveTab('backups');
    setRestoreSuccessMsg(`Snapshot "${finalName}" saved successfully.`);
    setTimeout(() => setRestoreSuccessMsg(null), 4000);
  };

  const handleConfirmRestore = (b: StockBackup) => {
    try {
      restoreBackup(b.id);
      setRestoreConfirmBackup(null);
      setRestoreSuccessMsg(`System restored successfully to "${b.name}" (Backup #${b.backupNumber}).`);
      setTimeout(() => setRestoreSuccessMsg(null), 5000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Restore failed');
    }
  };

  const handleExportBackupJson = (b: StockBackup) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(b, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `StockBackup_${b.backupNumber}_${b.name.replace(/[^a-z0-9]/gi, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.snapshot || !json.snapshot.items) {
          alert('Invalid backup file format. Expected StockBackup JSON structure.');
          return;
        }
        createBackup(
          `Imported: ${json.name || file.name.replace('.json', '')}`,
          `Imported from external file on ${new Date().toLocaleDateString()}`
        );
        setActiveTab('backups');
        setRestoreSuccessMsg('External backup file imported and saved to your backup library.');
        setTimeout(() => setRestoreSuccessMsg(null), 4000);
      } catch {
        alert('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">System Flush & Versioned Backups</h2>
              <p className="text-xs text-slate-400">
                Authorized Admin Database Flush with Unlimited Version History
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 border-b border-slate-200 shrink-0 px-6">
          <button
            onClick={() => setActiveTab('flush')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'flush'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Admin System Flush</span>
          </button>

          <button
            onClick={() => setActiveTab('backups')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'backups'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Backup History ({backups.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Snapshot Current</span>
          </button>
        </div>

        {/* Messages */}
        {restoreSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center gap-2 text-xs text-emerald-800 font-semibold shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{restoreSuccessMsg}</span>
          </div>
        )}

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: SYSTEM FLUSH WITH AUTO BACKUP */}
          {activeTab === 'flush' && (
            <form onSubmit={handleExecuteFlush} className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-950 space-y-1">
                    <p className="font-bold text-sm text-rose-900">
                      High-Security Full Database Flush
                    </p>
                    <p>
                      This operation will wipe all current items, warehouse stock receipts, transfer notes, field dispatches, team returns, and project records to start completely fresh.
                    </p>
                    <div className="p-2.5 bg-white/80 rounded-lg border border-rose-200 text-slate-800 font-medium mt-2">
                      <div className="text-emerald-700 font-bold flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Automatic Backup Guarantee (Backup #{backups.length + 1})</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Before clearing anything, the system will automatically freeze and archive your complete current stock snapshot ({totalCurrentRecords} records) with your custom name, exact date, and time. You can restore it anytime in 1-click!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {flushStatus && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    flushStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {flushStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{flushStatus.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Backup Label / Name for this Snapshot
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                    placeholder={`e.g. Pre-Audit Reset (Default: Backup #${backups.length + 1})`}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Saved with current timestamp ({new Date().toLocaleDateString()}) and version number.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Admin Authorization Password *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter system admin password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none pl-9"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter authorized administrator password to confirm.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Safety Confirmation Phrase
                </label>
                <input
                  type="text"
                  required
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type 'FLUSH ALL DATA' to confirm"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold tracking-wider focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors disabled:opacity-50"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>
                    {isProcessing ? 'Creating Backup & Flushing...' : `Save Backup #${backups.length + 1} & Flush System Now`}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: BACKUP HISTORY & RESTORATION */}
          {activeTab === 'backups' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Saved System Snapshots ({backups.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Unlimited versioned archives. Click restore anytime to revert data state.
                  </p>
                </div>
                <div>
                  <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>Import JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJsonFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {backups.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Database className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No prior backups saved yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    When you perform a Full System Flush or take a manual snapshot, versioned archives will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {backups.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-xs font-bold">
                            #{b.backupNumber}
                          </span>
                          <div>
                            <div className="font-bold text-xs text-slate-900">{b.name}</div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>{new Date(b.createdAt).toLocaleString()}</span>
                              <span>·</span>
                              <span>By: {b.createdBy}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleExportBackupJson(b)}
                            title="Download JSON Snapshot file"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteBackup(b.id)}
                            title="Delete this backup archive"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRestoreConfirmBackup(b)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg font-mono">
                        <div>
                          Items: <strong className="text-slate-900">{b.itemCount}</strong>
                        </div>
                        <div>
                          Transactions: <strong className="text-slate-900">{b.transactionCount}</strong>
                        </div>
                        {b.reason && (
                          <div className="truncate text-slate-500 font-sans">
                            {b.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MANUAL SNAPSHOT */}
          {activeTab === 'manual' && (
            <form onSubmit={handleCreateManualBackup} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 space-y-1">
                <p className="font-bold text-sm text-emerald-900">
                  Create Instant System Snapshot (Backup #{backups.length + 1})
                </p>
                <p>
                  Freezes your current database state (items, central warehouse stock, branches, teams, projects, transactions) into a permanent named version without clearing any live data.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Snapshot Name / Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g. End of Month Stock Count / Pre-Audit Check"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes / Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="e.g. Saved before importing 200 new telecommunication equipment parts."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center justify-between font-mono">
                <span>Active records captured:</span>
                <span className="font-bold text-slate-900">{totalCurrentRecords} entities</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <FileArchive className="w-4 h-4" />
                <span>Save Version #{backups.length + 1} Now</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Logged in as: <strong className="text-slate-700">{currentUser?.fullName}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Restoration */}
      {restoreConfirmBackup && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-300 text-slate-900">
            <div className="flex items-center gap-3 text-emerald-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Restore Backup #{restoreConfirmBackup.backupNumber}?
                </h3>
                <p className="text-xs text-slate-500">{restoreConfirmBackup.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed mb-4">
              Restoring will replace the current active inventory, transfers, and records with this exact snapshot taken on{' '}
              <strong>{new Date(restoreConfirmBackup.createdAt).toLocaleString()}</strong>.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1 mb-5 font-mono text-slate-700">
              <div>Items to restore: {restoreConfirmBackup.itemCount}</div>
              <div>Transactions: {restoreConfirmBackup.transactionCount}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRestoreConfirmBackup(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmRestore(restoreConfirmBackup)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Restore This Version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
