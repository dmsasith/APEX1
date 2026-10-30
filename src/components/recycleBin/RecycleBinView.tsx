import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  CheckCircle2,
  Package,
  Building,
  Users,
  Users2,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatDateTime } from '../../utils/exportUtils';
import { RecycleEntityType, RecycleBinItem } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';

export const RecycleBinView: React.FC = () => {
  const {
    recycleBinItems,
    recycleBinCount,
    restoreItem,
    restoreSite,
    restoreUser,
    restoreTeam,
    bulkRestore,
    permanentlyDeleteItem,
    permanentlyDeleteSite,
    permanentlyDeleteUser,
    permanentlyDeleteTeam,
    bulkPermanentlyDelete,
    emptyRecycleBin,
  } = useStock();

  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showEmptyConfirmModal, setShowEmptyConfirmModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // In-app confirmation modal state for permanent delete / purge
  const [confirmModal, setConfirmModal] = useState<{
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredItems = recycleBinItems.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deletedBy.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredItems.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSingleRestore = (item: RecycleBinItem) => {
    if (item.type === 'item') restoreItem(item.id);
    else if (item.type === 'site') restoreSite(item.id);
    else if (item.type === 'user') restoreUser(item.id);
    else if (item.type === 'team') restoreTeam(item.id);
    showToast(`Restored "${item.title}" back to active master records.`);
    setSelectedIds((prev) => prev.filter((id) => id !== item.id));
  };

  const handleSinglePermanentDelete = (item: RecycleBinItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Permanently Purge Record?',
      message: `Are you sure you want to permanently delete "${item.title}"? This record will be completely removed from the database and cannot be recovered.`,
      confirmLabel: 'Permanently Delete',
      onConfirm: () => {
        if (item.type === 'item') permanentlyDeleteItem(item.id);
        else if (item.type === 'site') permanentlyDeleteSite(item.id);
        else if (item.type === 'user') permanentlyDeleteUser(item.id);
        else if (item.type === 'team') permanentlyDeleteTeam(item.id);
        showToast(`Permanently purged "${item.title}" from database.`);
        setSelectedIds((prev) => prev.filter((id) => id !== item.id));
      },
    });
  };

  const handleBulkRestore = () => {
    const selectedRecords = filteredItems
      .filter((i) => selectedIds.includes(i.id))
      .map((i) => ({ id: i.id, type: i.type }));

    bulkRestore(selectedRecords);
    showToast(`Restored ${selectedRecords.length} record(s) back to active master records.`);
    setSelectedIds([]);
  };

  const handleBulkPermanentDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: `Permanently Delete ${selectedIds.length} Records?`,
      message: `Are you sure you want to permanently delete ${selectedIds.length} selected record(s) from the database? This action is irreversible.`,
      confirmLabel: `Permanently Purge (${selectedIds.length})`,
      onConfirm: () => {
        const selectedRecords = filteredItems
          .filter((i) => selectedIds.includes(i.id))
          .map((i) => ({ id: i.id, type: i.type }));

        bulkPermanentlyDelete(selectedRecords);
        showToast(`Permanently deleted ${selectedRecords.length} record(s).`);
        setSelectedIds([]);
      },
    });
  };

  const handleConfirmEmptyTrash = () => {
    emptyRecycleBin();
    setShowEmptyConfirmModal(false);
    setSelectedIds([]);
    showToast('Recycle Bin emptied completely.');
  };

  const getEntityIcon = (type: RecycleEntityType) => {
    switch (type) {
      case 'item':
        return <Package className="w-4 h-4 text-emerald-600" />;
      case 'site':
        return <Building className="w-4 h-4 text-blue-600" />;
      case 'user':
        return <Users className="w-4 h-4 text-purple-600" />;
      case 'team':
        return <Users2 className="w-4 h-4 text-amber-600" />;
    }
  };

  const getEntityBadge = (type: RecycleEntityType) => {
    switch (type) {
      case 'item':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">Item</span>;
      case 'site':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">Site Branch</span>;
      case 'user':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">User</span>;
      case 'team':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">Field Team</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="bg-emerald-800 text-white px-4 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Data Safety & Recovery</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Soft Delete Quarantine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Recycle Bin & Data Restoration
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Deleted items, sites, users, and teams are safely preserved here. Restoring an entity reinstates it into active master lists with all historical stock balances and transaction records completely intact.
          </p>
        </div>

        {/* Global Empty Trash Button */}
        {recycleBinCount > 0 && (
          <button
            onClick={() => setShowEmptyConfirmModal(true)}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
          >
            <Flame className="w-4 h-4 text-rose-600" />
            <span>Empty Recycle Bin</span>
          </button>
        )}
      </div>

      {/* Notice Card */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>Safe Soft Delete Protection:</strong> Deleting an entity from Master Registrations does not destroy audit trails or warehouse records. You can select records below to <strong>Restore</strong> them immediately, or perform a <strong>Permanent Delete</strong> if you are certain they are no longer needed.
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {[
            { id: 'all', label: `All (${recycleBinCount})` },
            { id: 'item', label: 'Items' },
            { id: 'site', label: 'Sites' },
            { id: 'user', label: 'Users' },
            { id: 'team', label: 'Teams' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                filterType === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search deleted records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleBulkRestore}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore ({selectedIds.length})</span>
              </button>
              <button
                onClick={handleBulkPermanentDelete}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purge ({selectedIds.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recycle Bin Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                </th>
                <th className="py-3 px-3">Entity Type</th>
                <th className="py-3 px-4">Record Title & Identifier</th>
                <th className="py-3 px-3">Context / Metadata</th>
                <th className="py-3 px-3">Deleted Date</th>
                <th className="py-3 px-3">Deleted By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Trash2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <div>Recycle Bin is currently empty.</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">No soft-deleted records in quarantine.</div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isChecked = selectedIds.includes(item.id);

                  return (
                    <tr key={`${item.type}-${item.id}`} className={`hover:bg-slate-50/70 transition-colors ${isChecked ? 'bg-slate-50' : ''}`}>
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getEntityIcon(item.type)}
                          {getEntityBadge(item.type)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {item.subtitle}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                        {formatDateTime(item.deletedAt)}
                      </td>
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap font-medium">
                        {item.deletedBy}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSingleRestore(item)}
                            className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Restore back to active master list"
                          >
                            <RotateCcw className="w-3 h-3 text-emerald-700" />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => handleSinglePermanentDelete(item)}
                            className="px-2 py-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 text-xs transition-colors"
                            title="Permanently Delete (Irreversible)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Confirmation Modal for Emptying Entire Recycle Bin */}
      {showEmptyConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Empty Recycle Bin?</h3>
                <p className="text-xs text-slate-500">Irreversible Permanent Purge</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to permanently delete all <strong>{recycleBinCount}</strong> record(s) in the Recycle Bin? Once emptied, these items cannot be restored.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowEmptyConfirmModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEmptyTrash}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Permanently Empty All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Permanent Purging */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
