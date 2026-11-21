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
  FileSpreadsheet,
  Eye,
  HardDrive,
  FolderDown,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { StockBackup, isSuperAdmin } from '../../types';
import { OfflineBackupViewerModal } from './OfflineBackupViewerModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface SystemBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemBackupModal: React.FC<SystemBackupModalProps> = ({ isOpen, onClose }) => {
  const {
    currentTenant,
    config,
    currentUser,
    backups,
    restoreBackup,
    deleteBackup,
    flushSystemWithBackup,
    items,
    sites,
    teams,
    users,
    projects,
    projectTypes,
    mainStockEntries,
    stockRequests,
    teamIssues,
    teamReturns,
    projectUsages,
    branchReturns,
    suppliers,
    purchaseOrders,
    supplierReturns,
    letterheadTemplates,
    digitalSignatures,
  } = useStock();

  const [activeTab, setActiveTab] = useState<'flush' | 'backups'>('backups');
  const [showOfflineViewer, setShowOfflineViewer] = useState(false);
  const [viewerBackupData, setViewerBackupData] = useState<StockBackup | null>(null);

  // Flush states
  const [adminPassword, setAdminPassword] = useState('');
  const [backupName, setBackupName] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [flushStatus, setFlushStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Selected backup for preview/restore/delete
  const [restoreConfirmBackup, setRestoreConfirmBackup] = useState<StockBackup | null>(null);
  const [deleteConfirmBackup, setDeleteConfirmBackup] = useState<StockBackup | null>(null);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isCentralAdmin = isSuperAdmin(currentUser?.role) || currentUser?.username === 'admin';

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
              Full System Flush and Versioned Backup operations are strictly restricted to the <strong>Super Admin Central</strong>.
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

  const handleExecuteFlush = async (e: React.FormEvent) => {
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
    try {
      const defaultName = backupName.trim() || `Pre-Flush Archive #${backups.length + 1}`;
      const result = await flushSystemWithBackup(adminPassword, defaultName);

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
    } catch (err: unknown) {
      setFlushStatus({
        type: 'error',
        text: err instanceof Error ? err.message : 'An unexpected error occurred during system flush.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmRestore = (b: StockBackup) => {
    try {
      restoreBackup(b);
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

  const handleExportLiveTenantSnapshotJson = () => {
    const liveSnapshot = {
      id: `backup-live-${Date.now()}`,
      backupNumber: backups.length + 1,
      name: `${currentTenant.companyName} Full System Backup`,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.fullName || 'Tenant Admin',
      reason: 'Direct offline tenant safety download',
      itemCount: items.length,
      transactionCount: mainStockEntries.length + stockRequests.length + teamIssues.length + teamReturns.length + projectUsages.length + branchReturns.length,
      snapshot: {
        config,
        items,
        sites,
        teams,
        users,
        projects,
        projectTypes,
        mainStockEntries,
        stockRequests,
        teamIssues,
        teamReturns,
        projectUsages,
        branchReturns,
        suppliers,
        purchaseOrders,
        supplierReturns,
        letterheadTemplates,
        digitalSignatures,
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(liveSnapshot, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentTenant.slug.toUpperCase()}_Full_Offline_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSaveDirectToPcHardDrive = async () => {
    try {
      const liveSnapshot = {
        id: `manual-export-${Date.now()}`,
        backupNumber: backups.length + 1,
        name: `Live: ${currentTenant.companyName} Database`,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.fullName || 'Central Admin',
        reason: 'Direct PC Hard Drive Backup Export',
        itemCount: items.length,
        transactionCount:
          mainStockEntries.length +
          stockRequests.length +
          teamIssues.length +
          teamReturns.length +
          projectUsages.length +
          branchReturns.length,
        snapshot: {
          config,
          items,
          sites,
          teams,
          users,
          projects,
          projectTypes,
          mainStockEntries,
          stockRequests,
          teamIssues,
          teamReturns,
          projectUsages,
          branchReturns,
          suppliers,
          purchaseOrders,
          supplierReturns,
          letterheadTemplates,
          digitalSignatures,
        },
      };

      const jsonStr = JSON.stringify(liveSnapshot, null, 2);
      const filename = `${currentTenant.slug.toUpperCase()}_HardDrive_Backup_${new Date().toISOString().split('T')[0]}.json`;

      // Check if modern File System Access API is supported
      if ('showSaveFilePicker' in window) {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'JSON Database Backup File (.json)',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });
        const writable = await fileHandle.createWritable();
        await writable.write(jsonStr);
        await writable.close();
        setRestoreSuccessMsg(`Saved directly to PC Hard Drive: ${fileHandle.name}!`);
        setTimeout(() => setRestoreSuccessMsg(null), 4000);
      } else {
        handleExportLiveTenantSnapshotJson();
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('File save error:', err);
      }
    }
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
        const importedBackup: StockBackup = {
          id: json.id || `imported-${Date.now()}`,
          backupNumber: json.backupNumber || 1,
          name: json.name || file.name.replace('.json', ''),
          createdAt: json.createdAt || new Date().toISOString(),
          createdBy: json.createdBy || 'Imported JSON File',
          reason: json.reason || `Imported from ${file.name}`,
          itemCount: json.itemCount ?? json.snapshot.items?.length ?? 0,
          transactionCount:
            json.transactionCount ??
            (json.snapshot.mainStockEntries?.length || 0) +
              (json.snapshot.stockRequests?.length || 0) +
              (json.snapshot.teamIssues?.length || 0) +
              (json.snapshot.teamReturns?.length || 0) +
              (json.snapshot.projectUsages?.length || 0) +
              (json.snapshot.branchReturns?.length || 0),
          snapshot: json.snapshot,
        };
        setRestoreConfirmBackup(importedBackup);
      } catch {
        alert('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
            onClick={() => setActiveTab('backups')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'backups'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Pre-Flush Backups & PC Export ({backups.length})</span>
          </button>

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
        </div>

        {/* Cloud Storage Optimization Bar */}
        <div className="bg-slate-900 text-white px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-bold text-emerald-400">Cloud Storage Saver:</span>
            <span className="text-slate-300 text-[11px]">
              Cloud backups are saved only during System Flush (daily auto-backups disabled).
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setViewerBackupData(null);
                setShowOfflineViewer(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
              title="Open Offline Backup Data Viewer to inspect tables and convert to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Offline Viewer & Excel</span>
            </button>
          </div>
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
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Saved Pre-Flush Archives ({backups.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cloud backups are created strictly on System Flush. Use PC exports below for zero-cloud-cost offline backups.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportLiveTenantSnapshotJson}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                    title="Download complete JSON snapshot of your current database directly to your local PC"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Live Backup (.json)</span>
                  </button>

                  <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer" title="Import an offline .json backup file to restore">
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>Import & Restore JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJsonFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* PC Hard Drive Direct Backup Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-4 rounded-xl border border-slate-800 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">
                        Save Offline Copy Directly to PC Hard Drive
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Export a full <code className="text-emerald-300">.json</code> database file to your PC or synced Google Drive / OneDrive folder without consuming Firebase storage.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleSaveDirectToPcHardDrive}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="Choose exact folder on your PC Hard Drive to save backup using File System Access"
                    >
                      <FolderDown className="w-3.5 h-3.5" />
                      <span>Select Folder & Save to PC</span>
                    </button>
                  </div>
                </div>
              </div>

              {backups.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Database className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No Pre-Flush backups saved in Cloud yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    When you perform an Admin System Flush, a Pre-Flush archive will be saved here automatically. For daily copies, export directly to your PC above.
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
                            onClick={() => {
                              setViewerBackupData(b);
                              setShowOfflineViewer(true);
                            }}
                            title="Inspect table records & Convert to Excel (.xlsx)"
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            <span>View / Excel</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExportBackupJson(b)}
                            title="Download JSON Snapshot file"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmBackup(b)}
                            title="Delete this backup archive"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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

      {/* Offline Backup Viewer Modal */}
      <OfflineBackupViewerModal
        isOpen={showOfflineViewer}
        onClose={() => {
          setShowOfflineViewer(false);
          setViewerBackupData(null);
        }}
        initialBackupData={viewerBackupData}
      />

      {/* Delete Backup Confirmation Modal (Requires Admin Password) */}
      <ConfirmModal
        isOpen={!!deleteConfirmBackup}
        title={`Delete Backup #${deleteConfirmBackup?.backupNumber || ''}?`}
        message={`Are you sure you want to permanently delete backup snapshot "${deleteConfirmBackup?.name || ''}"? This action cannot be undone.`}
        confirmLabel="Delete Backup"
        isDestructive={true}
        onConfirm={() => {
          if (deleteConfirmBackup) {
            deleteBackup(deleteConfirmBackup.id);
            setDeleteConfirmBackup(null);
          }
        }}
        onClose={() => setDeleteConfirmBackup(null)}
      />
    </div>
  );
};
