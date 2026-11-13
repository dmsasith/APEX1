import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  AlertTriangle,
  Package,
  Layers,
  Boxes,
  ArrowRight,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  ShoppingCart,
  CornerDownLeft,
  ScanLine,
} from 'lucide-react';
import { Item } from '../../types';
import { useStock } from '../../context/StockContext';
import { formatNumber } from '../../utils/exportUtils';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import {
  useUsbBarcodeScanner,
  matchItemByScannedCode,
  playScanBeep,
} from '../../utils/barcodeUtils';

export interface SelectedItemEntry {
  item: Item;
  quantity: number;
  unitCost?: number;
}

export interface ItemPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selected: SelectedItemEntry[]) => void;
  mode?: 'multiple' | 'single';
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
  siteId?: string; // Optional context: shows this site's current inventory alongside central main stock
  initialSelected?: Array<{ itemId: string; quantity: number; unitCost?: number }>;
  defaultQuantity?: number;
  actionTheme?: 'slate' | 'emerald' | 'blue';
}

export const ItemPickerModal: React.FC<ItemPickerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  mode = 'multiple',
  title = 'Expansive Item Catalog Picker',
  subtitle = 'Search, inspect balances, and bulk-select items with custom quantities.',
  confirmLabel = 'Add Selected Items',
  siteId,
  initialSelected = [],
  defaultQuantity = 10,
  actionTheme = 'slate',
}) => {
  const { activeItems, getMainWarehouseStock, getSiteItemStock, sites, config } = useStock();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [sortField, setSortField] = useState<'code' | 'name' | 'stock' | 'price'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Keyboard navigation active index
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Selected Items Map: itemId -> { item, quantity, unitCost }
  const [selectionMap, setSelectionMap] = useState<Map<string, { item: Item; quantity: number; unitCost: number }>>(
    new Map()
  );
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanToast, setScanToast] = useState<string | null>(null);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const handleBarcodeMatchedItem = (matched: Item) => {
    setSelectionMap((prev) => {
      const next = new Map(prev);
      if (mode === 'single') {
        next.clear();
        next.set(matched.id, {
          item: matched,
          quantity: defaultQuantity,
          unitCost: matched.unitPrice || 0,
        });
        return next;
      }

      const existing = next.get(matched.id);
      if (existing) {
        next.set(matched.id, {
          ...existing,
          quantity: existing.quantity + 1,
        });
      } else {
        next.set(matched.id, {
          item: matched,
          quantity: defaultQuantity,
          unitCost: matched.unitPrice || 0,
        });
      }
      return next;
    });
    setScanToast(`Scanned & selected: [${matched.itemCode}] ${matched.itemName}`);
    setTimeout(() => setScanToast(null), 3200);
  };

  useUsbBarcodeScanner({
    enabled: isOpen && !scannerOpen && config.barcodeEnabled !== false && config.usbScannerEnabled !== false,
    minLength: 3,
    maxInterKeyLatencyMs: config.usbScanMaxLatencyMs || 55,
    ignoreInputs: false,
    onScan: (raw) => {
      const matched = matchItemByScannedCode(activeItems, raw);
      if (matched) {
        if (config.barcodeBeepEnabled !== false) playScanBeep(true);
        handleBarcodeMatchedItem(matched);
      } else {
        if (config.barcodeBeepEnabled !== false) playScanBeep(false);
        setSearchQuery(raw);
      }
    },
  });

  // Target site details if provided
  const targetSite = useMemo(() => {
    if (!siteId || siteId === 'all') return null;
    return sites.find((s) => s.id === siteId) || null;
  }, [siteId, sites]);

  // Categories list with counts
  const categoriesWithCounts = useMemo(() => {
    const map = new Map<string, number>();
    activeItems.forEach((i) => {
      map.set(i.category, (map.get(i.category) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [activeItems]);

  // Initialize or reset selections when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialMap = new Map<string, { item: Item; quantity: number; unitCost: number }>();
      initialSelected.forEach((entry) => {
        const found = activeItems.find((i) => i.id === entry.itemId);
        if (found) {
          initialMap.set(entry.itemId, {
            item: found,
            quantity: entry.quantity > 0 ? entry.quantity : defaultQuantity,
            unitCost: entry.unitCost !== undefined ? entry.unitCost : found.unitPrice || 0,
          });
        }
      });
      setSelectionMap(initialMap);
      setSearchQuery('');
      setSelectedCategory('all');
      setStockFilter('all');
      setHighlightedIndex(0);

      // Auto-focus search input
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 80);
    }
  }, [isOpen, initialSelected, activeItems, defaultQuantity]);

  // Filtered and Sorted Items
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return activeItems
      .filter((item) => {
        // Query search
        if (q) {
          const matchCode = item.itemCode.toLowerCase().includes(q);
          const matchBarcode = item.barcode?.toLowerCase().includes(q);
          const matchName = item.itemName.toLowerCase().includes(q);
          const matchCat = item.category.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          if (!matchCode && !matchBarcode && !matchName && !matchCat && !matchDesc) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }

        // Stock status filter
        const mainStock = getMainWarehouseStock(item.id);
        if (stockFilter === 'in-stock' && mainStock.availableBalance <= 0) return false;
        if (stockFilter === 'low-stock' && (!mainStock.isLowStock || mainStock.availableBalance <= 0)) return false;
        if (stockFilter === 'out-of-stock' && mainStock.availableBalance > 0) return false;

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'code') {
          diff = a.itemCode.localeCompare(b.itemCode);
        } else if (sortField === 'name') {
          diff = a.itemName.localeCompare(b.itemName);
        } else if (sortField === 'price') {
          diff = (a.unitPrice || 0) - (b.unitPrice || 0);
        } else if (sortField === 'stock') {
          const stockA = getMainWarehouseStock(a.id).availableBalance;
          const stockB = getMainWarehouseStock(b.id).availableBalance;
          diff = stockA - stockB;
        }
        return sortAsc ? diff : -diff;
      });
  }, [activeItems, searchQuery, selectedCategory, stockFilter, sortField, sortAsc, getMainWarehouseStock]);

  // Keep highlighted index in bounds
  useEffect(() => {
    if (highlightedIndex >= filteredItems.length) {
      setHighlightedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems.length, highlightedIndex]);

  // Toggle Item Selection
  const toggleItem = (item: Item, explicitQty?: number) => {
    setSelectionMap((prev) => {
      const next = new Map(prev);
      if (mode === 'single') {
        next.clear();
        next.set(item.id, {
          item,
          quantity: explicitQty ?? defaultQuantity,
          unitCost: item.unitPrice || 0,
        });
        return next;
      }

      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.set(item.id, {
          item,
          quantity: explicitQty ?? defaultQuantity,
          unitCost: item.unitPrice || 0,
        });
      }
      return next;
    });
  };

  // Update Item Quantity in Selection
  const updateQuantity = (itemId: string, qty: number) => {
    setSelectionMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(itemId);
      if (existing) {
        if (qty <= 0) {
          next.delete(itemId);
        } else {
          next.set(itemId, { ...existing, quantity: qty });
        }
      } else {
        const found = activeItems.find((i) => i.id === itemId);
        if (found && qty > 0) {
          next.set(itemId, {
            item: found,
            quantity: qty,
            unitCost: found.unitPrice || 0,
          });
        }
      }
      return next;
    });
  };

  // Batch Select Visible
  const handleSelectAllVisible = () => {
    setSelectionMap((prev) => {
      const next = new Map(prev);
      const allSelected = filteredItems.every((item) => next.has(item.id));

      if (allSelected) {
        filteredItems.forEach((item) => next.delete(item.id));
      } else {
        filteredItems.forEach((item) => {
          if (!next.has(item.id)) {
            next.set(item.id, {
              item,
              quantity: defaultQuantity,
              unitCost: item.unitPrice || 0,
            });
          }
        });
      }
      return next;
    });
  };

  // Confirm and Pass Selected Data
  const handleConfirm = () => {
    const list: SelectedItemEntry[] = Array.from(selectionMap.values()).filter((e) => e.quantity > 0);
    onConfirm(list);
    onClose();
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
      scrollHighlightedRowIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      scrollHighlightedRowIntoView();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'INPUT') {
      e.preventDefault();
      const current = filteredItems[highlightedIndex];
      if (current) toggleItem(current);
    }
  };

  const scrollHighlightedRowIntoView = () => {
    if (!tableContainerRef.current) return;
    const rowEl = tableContainerRef.current.querySelector(`[data-row-index="${highlightedIndex}"]`);
    if (rowEl) {
      rowEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  if (!isOpen) return null;

  const totalSelectedCount = selectionMap.size;
  const totalSelectedUnits = Array.from(selectionMap.values()).reduce((sum, e) => sum + (e.quantity || 0), 0);
  const totalEstimatedCost = Array.from(selectionMap.values()).reduce(
    (sum, e) => sum + (e.quantity || 0) * (e.unitCost || 0),
    0
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white w-full max-w-6xl h-[92vh] max-h-[850px] rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Boxes className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700">
                  {filteredItems.length} of {activeItems.length} items
                </span>
                {mode === 'single' && (
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Single-Select Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {subtitle} {targetSite && <span className="font-semibold text-slate-700">· Active Context: {targetSite.name}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {scanToast && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{scanToast}</span>
              </span>
            )}
            {config.barcodeEnabled !== false && (
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Scan Barcode via USB Gun or Mobile Camera"
              >
                <ScanLine className="w-4 h-4" />
                <span>Scan Barcode</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* EXPANSIVE SEARCH & FILTER CONTROLS */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 shrink-0 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Main Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Instant search by item code (e.g. CBL, CON), name, category, or specs..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all placeholder:text-slate-400 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="md:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setHighlightedIndex(0);
                }}
                className="w-full py-2.5 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-slate-900 focus:outline-none shadow-xs"
              >
                <option value="all">All Categories ({activeItems.length})</option>
                {categoriesWithCounts.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name} ({cat.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Availability Filter Buttons */}
            <div className="md:col-span-3 flex items-center gap-1 bg-white p-1 border border-slate-200 rounded-xl shadow-xs">
              <button
                type="button"
                onClick={() => setStockFilter('all')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors text-center ${
                  stockFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('in-stock')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors text-center ${
                  stockFilter === 'in-stock'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                In Stock
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('low-stock')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors text-center ${
                  stockFilter === 'low-stock'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Low
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('out-of-stock')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors text-center ${
                  stockFilter === 'out-of-stock'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Zero
              </button>
            </div>
          </div>

          {/* Quick Filter Pill Chips for Rapid Toggling */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 text-[11px] font-medium mr-1">Quick Categories:</span>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Items
              </button>
              {categoriesWithCounts.slice(0, 4).map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedCategory(c.name)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors truncate max-w-[200px] ${
                    selectedCategory === c.name
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  title={c.name}
                >
                  {c.name} ({c.count})
                </button>
              ))}
            </div>

            {mode === 'multiple' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllVisible}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Toggle All Filtered ({filteredItems.length})</span>
                </button>
                {selectionMap.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectionMap(new Map())}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 underline"
                  >
                    Clear All ({selectionMap.size})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SPACIOUS DATA TABLE VIEW */}
        <div ref={tableContainerRef} className="flex-1 overflow-y-auto overflow-x-auto min-h-0 bg-white divide-y divide-slate-100">
          <table className="w-full text-left text-xs border-collapse min-w-[680px]">
            <thead className="bg-slate-100/90 text-slate-700 sticky top-0 z-10 border-b border-slate-200 font-semibold shadow-2xs backdrop-blur-xs">
              <tr>
                {mode === 'multiple' && (
                  <th className="py-3 px-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={filteredItems.length > 0 && filteredItems.every((item) => selectionMap.has(item.id))}
                      onChange={handleSelectAllVisible}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                  </th>
                )}
                <th
                  onClick={() => {
                    if (sortField === 'code') setSortAsc(!sortAsc);
                    else {
                      setSortField('code');
                      setSortAsc(true);
                    }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none w-36"
                >
                  <div className="flex items-center gap-1">
                    <span>Item Code</span>
                    {sortField === 'code' && <span>{sortAsc ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortField === 'name') setSortAsc(!sortAsc);
                    else {
                      setSortField('name');
                      setSortAsc(true);
                    }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none min-w-[240px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Item Name & Specifications</span>
                    {sortField === 'name' && <span>{sortAsc ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th className="py-3 px-3 w-40">Category</th>
                <th className="py-3 px-3 text-center w-20">Unit</th>
                <th
                  onClick={() => {
                    if (sortField === 'stock') setSortAsc(!sortAsc);
                    else {
                      setSortField('stock');
                      setSortAsc(false);
                    }
                  }}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 select-none w-36"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Central Main Stock</span>
                    {sortField === 'stock' && <span>{sortAsc ? '↑' : '↓'}</span>}
                  </div>
                </th>
                {targetSite && (
                  <th className="py-3 px-4 text-right w-36 bg-blue-50/50 text-blue-900">
                    <span>{targetSite.name} Stock</span>
                  </th>
                )}
                <th
                  onClick={() => {
                    if (sortField === 'price') setSortAsc(!sortAsc);
                    else {
                      setSortField('price');
                      setSortAsc(true);
                    }
                  }}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 select-none w-28"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Est. Unit Price</span>
                    {sortField === 'price' && <span>{sortAsc ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th className="py-3 px-4 text-center w-48 font-bold">
                  {mode === 'single' ? 'Select' : 'Quantity to Add'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={targetSite ? 9 : 8} className="py-16 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <Package className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                      <p className="text-sm font-semibold text-slate-700">No matching items found</p>
                      <p className="text-xs text-slate-500">
                        Try modifying your search query or reset the category/stock filters.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                          setStockFilter('all');
                        }}
                        className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset All Filters</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => {
                  const isSelected = selectionMap.has(item.id);
                  const selectedEntry = selectionMap.get(item.id);
                  const isHighlighted = index === highlightedIndex;
                  const mainStock = getMainWarehouseStock(item.id);
                  const siteStock = targetSite ? getSiteItemStock(targetSite.id, item.id) : null;

                  return (
                    <tr
                      key={item.id}
                      data-row-index={index}
                      onClick={() => {
                        setHighlightedIndex(index);
                        if (mode === 'single') {
                          toggleItem(item);
                        }
                      }}
                      className={`transition-colors cursor-pointer group ${
                        isSelected
                          ? 'bg-emerald-50/60 hover:bg-emerald-50'
                          : isHighlighted
                          ? 'bg-slate-50 hover:bg-slate-100/70'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Checkbox */}
                      {mode === 'multiple' && (
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItem(item)}
                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                          />
                        </td>
                      )}

                      {/* Item Code */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200 group-hover:border-slate-300">
                          {item.itemCode}
                        </span>
                        {item.barcode && (
                          <div className="text-[10px] font-mono text-emerald-700 mt-1 flex items-center gap-1">
                            <ScanLine className="w-2.5 h-2.5 shrink-0" />
                            <span>{item.barcode}</span>
                          </div>
                        )}
                      </td>

                      {/* Item Name & Specs */}
                      <td className="py-3 px-4 min-w-[200px] max-w-[280px]">
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm group-hover:text-emerald-950 truncate" title={item.itemName}>
                          {item.itemName}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-slate-500 truncate mt-0.5" title={item.description}>{item.description}</div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-slate-600 text-xs truncate max-w-[160px]" title={item.category}>
                        {item.category}
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-3 text-center font-mono text-slate-500 font-medium text-xs">
                        {item.unit}
                      </td>

                      {/* Central Stock Balance */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-xs text-slate-900">
                          {formatNumber(mainStock.availableBalance)} {item.unit}
                        </div>
                        <div>
                          {mainStock.availableBalance <= 0 ? (
                            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              Out of Stock
                            </span>
                          ) : mainStock.isLowStock ? (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Low (≤ {mainStock.threshold})
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-700">Healthy</span>
                          )}
                        </div>
                      </td>

                      {/* Site Yard Stock Context (if site provided) */}
                      {targetSite && siteStock && (
                        <td className="py-3 px-4 text-right bg-blue-50/20 whitespace-nowrap">
                          <div className="font-mono font-bold text-xs text-blue-950">
                            {formatNumber(siteStock.availableBalance)} {item.unit}
                          </div>
                          <span className="text-[10px] text-blue-700">In Site Yard</span>
                        </td>
                      )}

                      {/* Unit Price */}
                      <td className="py-3 px-3 text-right font-mono text-xs text-slate-700 whitespace-nowrap">
                        {config.currencySymbol}
                        {formatNumber(item.unitPrice || 0)}
                      </td>

                      {/* Action / Quantity Controls */}
                      <td className="py-2.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {mode === 'single' ? (
                          <button
                            type="button"
                            onClick={() => {
                              toggleItem(item);
                              handleConfirm();
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 w-full ${
                              isSelected
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isSelected ? 'Selected' : 'Select Item'}</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            {isSelected ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, (selectedEntry?.quantity || 1) - 1)}
                                  className="w-7 h-7 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors"
                                  title="Decrease quantity by 1"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  step="any"
                                  value={selectedEntry?.quantity ?? defaultQuantity}
                                  onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                                  className="w-16 px-1.5 py-1 text-center font-mono font-bold text-xs border border-emerald-500 rounded-lg bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, (selectedEntry?.quantity || 0) + 1)}
                                  className="w-7 h-7 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors"
                                  title="Increase quantity by 1"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                {/* Quick Presets */}
                                <div className="hidden sm:flex items-center gap-0.5 ml-1">
                                  {[10, 50, 100].map((preset) => (
                                    <button
                                      key={preset}
                                      type="button"
                                      onClick={() => updateQuantity(item.id, (selectedEntry?.quantity || 0) + preset)}
                                      className="px-1.5 py-1 text-[10px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                                      title={`Add +${preset}`}
                                    >
                                      +{preset}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleItem(item, defaultQuantity)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* STICKY BOTTOM CONFIRMATION TRAY & SUMMARY */}
        <div className="p-4 bg-slate-900 text-white border-t border-slate-800 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">Selected Items:</span>
              <strong className="text-white font-mono text-sm">{totalSelectedCount}</strong>
            </div>

            <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
              <span className="text-slate-300">Total Quantity:</span>
              <strong className="text-emerald-400 font-mono text-sm">{formatNumber(totalSelectedUnits)} units</strong>
            </div>

            {totalEstimatedCost > 0 && (
              <div className="flex items-center gap-2 border-l border-slate-700 pl-3 hidden md:flex">
                <span className="text-slate-300">Est. Total Value:</span>
                <strong className="text-white font-mono text-xs">
                  {config.currencySymbol}
                  {formatNumber(totalEstimatedCost)}
                </strong>
              </div>
            )}

            {/* Keyboard Shortcuts Hint */}
            <div className="hidden lg:flex items-center gap-2 border-l border-slate-700 pl-3 text-[11px] text-slate-400 font-mono">
              <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">↑/↓</span> Navigate
              <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Space</span> Select
              <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Esc</span> Close
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={totalSelectedCount === 0}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                totalSelectedCount === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold active:scale-98'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>
                {confirmLabel} ({totalSelectedCount})
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        mode="select"
        siteId={siteId}
        title="Scan Barcode to Select Item"
        subtitle="Scan with a USB Barcode Gun or Mobile Phone Camera to add/select in the catalog picker"
        onSelectItem={(item) => {
          handleBarcodeMatchedItem(item);
          if (mode === 'single' && config.barcodeAutoSelect !== false) {
            onConfirm([
              {
                item,
                quantity: defaultQuantity,
                unitCost: item.unitPrice || 0,
              },
            ]);
            setScannerOpen(false);
            onClose();
          }
        }}
      />
    </div>
  );
};
