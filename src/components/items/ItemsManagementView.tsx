import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  PlusCircle,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCheck,
  Edit2,
  Package,
  Layers,
  Sparkles,
  Info,
  X,
  ArrowRight,
  Database,
  Lock,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Item, ExcelItemRow, ImportResult } from '../../types';
import {
  downloadSampleExcelTemplate,
  exportItemsToExcel,
  parseExcelItemsFile,
} from '../../utils/excelItemUtils';
import { formatNumber, formatDate } from '../../utils/exportUtils';
import { ConfirmModal } from '../common/ConfirmModal';

export const ItemsManagementView: React.FC = () => {
  const {
    items,
    activeItems,
    addItem,
    updateItem,
    softDeleteItem,
    clearAllItems,
    bulkImportItems,
    getMainWarehouseStock,
    config,
    currentUser,
  } = useStock();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Excel Upload & Modal State
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'sync' | 'append' | 'replace'>('sync');
  const [parsedPreview, setParsedPreview] = useState<{
    rows: ExcelItemRow[];
    errors: string[];
    warnings: string[];
    fileName: string;
  } | null>(null);

  // Manual Item Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Assembly Units (Manholes & Handholes)');
  const [newItemUnit, setNewItemUnit] = useState('Pcs');
  const [newItemPrice, setNewItemPrice] = useState<number | ''>(150);
  const [newItemThreshold, setNewItemThreshold] = useState<number | ''>(config.defaultLowStockThreshold);
  const [newItemDesc, setNewItemDesc] = useState('');

  // Edit Item Modal
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Toast & Notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Confirmation Modal
  const [confirmState, setConfirmState] = useState<{
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Categories list
  const categories = Array.from(new Set(activeItems.map((i) => i.category || 'General Material')));

  // Filtered items for table
  const filteredItems = activeItems.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.itemCode.toLowerCase().includes(q) ||
      item.itemName.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q));

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Handle file selection and parsing
  const handleFileProcess = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      showToast('Please upload a valid Excel spreadsheet (.xlsx or .xls)', 'error');
      return;
    }

    setIsParsing(true);
    const result = await parseExcelItemsFile(file);
    setIsParsing(false);

    if (result.errors.length > 0 && result.rows.length === 0) {
      showToast(result.errors[0], 'error');
      return;
    }

    setParsedPreview({
      rows: result.rows,
      errors: result.errors,
      warnings: result.warnings,
      fileName: file.name,
    });
    setUploadModalOpen(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Commit Import
  const handleCommitImport = () => {
    if (!parsedPreview || parsedPreview.rows.length === 0) return;

    const result = bulkImportItems(parsedPreview.rows, importMode);

    showToast(
      `Excel Import Completed! Added: ${result.added} new item(s), Updated: ${result.updated} existing, Skipped: ${result.skipped}.`,
      'success'
    );

    setUploadModalOpen(false);
    setParsedPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Create single item
  const handleCreateSingleItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemCode.trim() || !newItemName.trim()) return;

    const codeUpper = newItemCode.trim().toUpperCase();
    if (activeItems.some((i) => i.itemCode.toUpperCase() === codeUpper)) {
      showToast(`Item code "${codeUpper}" already exists in the catalog.`, 'error');
      return;
    }

    addItem({
      itemCode: codeUpper,
      itemName: newItemName.trim(),
      category: newItemCategory.trim(),
      unit: newItemUnit.trim() || 'Pcs',
      unitPrice: Number(newItemPrice) || 0,
      lowStockThreshold: Number(newItemThreshold) || config.defaultLowStockThreshold,
      description: newItemDesc.trim() || newItemName.trim(),
    });

    showToast(`Master Item ${codeUpper} created successfully!`);
    setShowCreateModal(false);
    setNewItemCode('');
    setNewItemName('');
    setNewItemDesc('');
  };

  // Update item
  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    updateItem(editingItem.id, editingItem);
    showToast(`Item "${editingItem.itemCode}" updated successfully.`);
    setEditingItem(null);
  };

  // Delete single item
  const handleDeleteItem = (item: Item) => {
    setConfirmState({
      isOpen: true,
      title: `Move Item "${item.itemCode}" to Recycle Bin?`,
      message: `Are you sure you want to move item "${item.itemCode} - ${item.itemName}" to the Recycle Bin? All historical logs remain protected.`,
      confirmLabel: 'Move to Recycle Bin',
      onConfirm: () => {
        softDeleteItem(item.id);
        showToast(`Item "${item.itemCode}" moved to Recycle Bin.`);
      },
    });
  };

  // Clear all items
  const handleClearAll = () => {
    setConfirmState({
      isOpen: true,
      title: 'Move All Items to Recycle Bin?',
      message: `Are you sure you want to move all ${activeItems.length} active master items to the Recycle Bin? You can re-import or restore them at any time.`,
      confirmLabel: 'Clear All Items',
      onConfirm: () => {
        clearAllItems();
        showToast('All active master items moved to Recycle Bin.');
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-75 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner & Action Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                Master Catalog
              </span>
              <span className="text-xs text-slate-500">· Excel Import & Central Registry</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Items Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Import, dynamic-sync, download templates, and manage inventory assembly units.
              All items synchronize across Main Stock and all Site Branch allocations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Download Template Button */}
            <button
              onClick={downloadSampleExcelTemplate}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs"
              title="Download formatted .xlsx sample template matching assembly unit specifications"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Download Sample Template (.xlsx)</span>
            </button>

            {/* Export to Excel */}
            <button
              onClick={() => exportItemsToExcel(activeItems)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Export all current active catalog items to Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-600" />
              <span>Export Catalog ({activeItems.length})</span>
            </button>

            {/* Manual Add Item (Central Admin Only) */}
            {currentUser.role === 'Central Warehouse Admin' ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>+ Add Item</span>
              </button>
            ) : (
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-lg text-xs font-medium flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Catalog Read-Only</span>
              </div>
            )}
          </div>
        </div>

        {/* Drag and Drop Excel Uploader Zone (Central Admin Only) */}
        {currentUser.role === 'Central Warehouse Admin' ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`mt-5 p-6 border-2 border-dashed rounded-xl transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/70 scale-[1.005]'
                : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-400'
            }`}
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <Upload className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Import or Update Items from Excel Spreadsheet
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Drag and drop your <code className="font-mono text-emerald-700 bg-emerald-50 px-1 rounded">.xlsx</code> or <code className="font-mono text-emerald-700 bg-emerald-50 px-1 rounded">.xls</code> file here, or click to browse.
                  Supports <em>Unit Designation</em>, <em>Description of Assembly Unit</em>, and custom columns.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <button
                type="button"
                disabled={isParsing}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                {isParsing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Parsing Excel Sheet...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Select Excel File (.xlsx)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <Package className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                <strong>Central Catalog Information:</strong> Master material items and specifications are managed by Central Warehouse Admin. Site branch users can search items, verify unit dimensions, and export the official catalog.
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-md shrink-0">
              Read-Only for Branch Sites
            </span>
          </div>
        )}
      </div>

      {/* Items Overview Stats & Search / Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 text-xs text-slate-600 pl-1">
          <div className="flex items-center gap-1.5">
            <Package className="w-4 h-4 text-slate-500" />
            <span>Active Master Items: <strong className="font-mono text-slate-900 font-bold">{activeItems.length}</strong></span>
          </div>
          <span>·</span>
          <span>Categories: <strong className="text-slate-800 font-medium">{categories.length}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search code (e.g. MH-HH-1), assembly description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none max-w-xs"
          >
            <option value="all">All Categories ({activeItems.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Clear All Items Button (Central Admin Only) */}
          {currentUser.role === 'Central Warehouse Admin' && activeItems.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Move all active items to Recycle Bin"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Items Catalog Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-600" />
            <h2 className="font-semibold text-slate-900">Registered Assembly Units & Materials</h2>
            <span>· Showing {filteredItems.length} of {activeItems.length} items</span>
          </div>

          <div className="text-[11px] text-slate-500">
            Click <strong>+ Inbound</strong> or <strong>Request</strong> in stock tabs to allocate any item.
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-16 text-center">#</th>
                <th className="py-3 px-3">Unit Designation (Code)</th>
                <th className="py-3 px-4">Description of Assembly Unit</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Unit</th>
                <th className="py-3 px-3 text-right">Standard Price</th>
                <th className="py-3 px-3 text-right">Central Balance</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div>No items found matching your filter.</div>
                    <div className="mt-1 text-slate-400 text-[11px]">
                      Upload an Excel spreadsheet above or click <strong>&ldquo;Download Sample Template&rdquo;</strong> to get started.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => {
                  const stock = getMainWarehouseStock(item.id);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200">
                          {item.itemCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium max-w-md">
                        <div>{item.itemName}</div>
                        {item.description && item.description !== item.itemName && (
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-700">
                        {item.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {config.currencySymbol}{formatNumber(item.unitPrice)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-mono px-2 py-0.5 rounded text-[11px] font-semibold ${
                            stock.availableBalance === 0
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : stock.isLowStock
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {formatNumber(stock.availableBalance)} {item.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {currentUser.role === 'Central Warehouse Admin' ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingItem({ ...item })}
                              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="Edit Item Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Move to Recycle Bin"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Excel Import Preview & Mode Selection Modal */}
      {uploadModalOpen && parsedPreview && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Review Excel Import Preview
                  </h3>
                  <p className="text-xs text-slate-500">
                    File: <strong className="text-slate-700">{parsedPreview.fileName}</strong> · {parsedPreview.rows.length} valid item rows recognized
                  </p>
                </div>
              </div>

              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Import Mode Selector */}
            <div className="my-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Select Import Update Mode:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  className={`p-3 border rounded-xl cursor-pointer flex flex-col justify-between transition-all ${
                    importMode === 'sync'
                      ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="importMode"
                      value="sync"
                      checked={importMode === 'sync'}
                      onChange={() => setImportMode('sync')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <strong className="text-xs text-slate-900">Sync / Overwrite</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Updates existing items matching Item Code with new data; appends new items.
                  </p>
                </label>

                <label
                  className={`p-3 border rounded-xl cursor-pointer flex flex-col justify-between transition-all ${
                    importMode === 'append'
                      ? 'border-blue-600 bg-white ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <strong className="text-xs text-slate-900">Append Only</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Only adds new items. Existing item codes remain unchanged.
                  </p>
                </label>

                <label
                  className={`p-3 border rounded-xl cursor-pointer flex flex-col justify-between transition-all ${
                    importMode === 'replace'
                      ? 'border-rose-600 bg-white ring-2 ring-rose-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <strong className="text-xs text-slate-900">Swap / Replace All</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Archives old catalog and activates only the items in this Excel sheet.
                  </p>
                </label>
              </div>
            </div>

            {/* Warnings or Errors Banner */}
            {parsedPreview.warnings.length > 0 && (
              <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-semibold">Notice regarding duplicate codes in Excel:</div>
                  {parsedPreview.warnings.slice(0, 3).map((w, i) => (
                    <div key={i} className="text-[11px]">{w}</div>
                  ))}
                  {parsedPreview.warnings.length > 3 && (
                    <div className="text-[11px] font-semibold">...and {parsedPreview.warnings.length - 3} more.</div>
                  )}
                </div>
              </div>
            )}

            {/* Preview Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Item Code</th>
                    <th className="py-2.5 px-4">Description of Assembly Unit</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Unit</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedPreview.rows.slice(0, 20).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">
                        {row.itemCode}
                      </td>
                      <td className="py-2 px-4 text-slate-800 font-medium">
                        {row.itemName}
                      </td>
                      <td className="py-2 px-3 text-slate-600 truncate max-w-xs">
                        {row.category}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-700">
                        {row.unit}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        {config.currencySymbol}{formatNumber(row.unitPrice || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedPreview.rows.length > 20 && (
                <div className="p-2 text-center text-[11px] text-slate-500 bg-slate-50 border-t border-slate-200">
                  Showing first 20 rows of {parsedPreview.rows.length} total valid rows from Excel file.
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4">
              <span className="text-xs text-slate-500">
                Total to commit: <strong className="font-mono text-slate-900">{parsedPreview.rows.length}</strong> items
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCommitImport}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Commit Import ({importMode.toUpperCase()})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Single Item Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">Register New Assembly Unit / Item</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSingleItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit Designation / Item Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. MH-HH-1, MH-S-1-IS"
                  value={newItemCode}
                  onChange={(e) => setNewItemCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description of Assembly Unit / Item Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Construction of new hand holes type HH-1"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure *</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  >
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="m">m (Meters)</option>
                    <option value="m3">m3 (Cubic Meters)</option>
                    <option value="kg">kg (Kilograms)</option>
                    <option value="boxes">boxes (Boxes)</option>
                    <option value="sets">sets (Sets)</option>
                    <option value="bags">bags (Bags)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Unit Cost ({config.currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemThreshold}
                    onChange={(e) => setNewItemThreshold(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Technical Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional material specs, enclosure details, dimensions..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Create Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-slate-800" />
                <h3 className="font-bold text-base text-slate-900">
                  Edit Item: {editingItem.itemCode}
                </h3>
              </div>
              <button onClick={() => setEditingItem(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Designation / Code</label>
                <input
                  type="text"
                  value={editingItem.itemCode}
                  onChange={(e) => setEditingItem({ ...editingItem, itemCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase bg-slate-50 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description of Assembly Unit / Item Name</label>
                <input
                  type="text"
                  value={editingItem.itemName}
                  onChange={(e) => setEditingItem({ ...editingItem, itemName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Cost ({config.currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingItem.unitPrice}
                    onChange={(e) => setEditingItem({ ...editingItem, unitPrice: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.lowStockThreshold}
                    onChange={(e) => setEditingItem({ ...editingItem, lowStockThreshold: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={2}
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        onConfirm={confirmState.onConfirm}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
