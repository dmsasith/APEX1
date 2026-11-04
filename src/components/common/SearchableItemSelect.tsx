import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Package, X, AlertTriangle } from 'lucide-react';
import { Item } from '../../types';
import { useStock } from '../../context/StockContext';
import { formatNumber } from '../../utils/exportUtils';
import { isMachineryItem } from '../../utils/itemTypeUtils';

interface SearchableItemSelectProps {
  selectedItemId: string;
  onSelectItem: (item: Item) => void;
  siteId?: string; // If provided, shows that site's available stock. Otherwise shows main warehouse stock.
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  showStockBadge?: boolean;
  defaultClassification?: 'all' | 'Material' | 'Machinery';
  onlyAvailableStock?: boolean;
  onToggleAvailableOnly?: (val: boolean) => void;
}

export const SearchableItemSelect: React.FC<SearchableItemSelectProps> = ({
  selectedItemId,
  onSelectItem,
  siteId,
  placeholder = 'Search & select item by code or assembly description...',
  disabled = false,
  required = false,
  className = '',
  showStockBadge = true,
  defaultClassification = 'all',
  onlyAvailableStock = false,
  onToggleAvailableOnly,
}) => {
  const { activeItems, getMainWarehouseStock, getSiteItemStock, config } = useStock();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'Material' | 'Machinery'>(defaultClassification);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(onlyAvailableStock);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultClassification) {
      setSelectedType(defaultClassification);
    }
  }, [defaultClassification]);

  useEffect(() => {
    if (onlyAvailableStock !== undefined) {
      setOnlyAvailable(onlyAvailableStock);
    }
  }, [onlyAvailableStock]);

  const selectedItem = activeItems.find((i) => i.id === selectedItemId);

  const materialsCount = activeItems.filter((i) => !isMachineryItem(i)).length;
  const machineryCount = activeItems.filter((i) => isMachineryItem(i)).length;

  const getItemStockInfo = (itemId: string) => {
    if (siteId && siteId !== 'all') {
      const siteStock = getSiteItemStock(siteId, itemId);
      return {
        available: siteStock.availableBalance,
        isLow: siteStock.isLowStock,
        label: 'Site Yard Stock',
      };
    } else {
      const mainStock = getMainWarehouseStock(itemId);
      return {
        available: mainStock.availableBalance,
        isLow: mainStock.isLowStock,
        label: 'Central Main Stock',
      };
    }
  };

  // Filter items based on query, type tab, and stock availability
  const filteredItems = activeItems.filter((i) => {
    const isMach = isMachineryItem(i);
    if (selectedType === 'Material' && isMach) return false;
    if (selectedType === 'Machinery' && !isMach) return false;

    if (onlyAvailable) {
      const stock = getItemStockInfo(i.id);
      if (stock.available <= 0) return false;
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      i.itemCode.toLowerCase().includes(q) ||
      i.itemName.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      (i.description && i.description.toLowerCase().includes(q))
    );
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative min-w-0 ${isOpen ? 'z-50' : 'z-10'} ${className}`} ref={containerRef}>
      {/* Selected Box / Input Trigger */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }
        }}
        className={`w-full min-h-[42px] px-3.5 py-2 border rounded-xl text-xs bg-white flex items-center justify-between cursor-pointer transition-all min-w-0 shadow-2xs ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'border-slate-900 ring-2 ring-slate-900/15'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        {selectedItem ? (
          <div className="flex items-center gap-2 pr-2 min-w-0 flex-1 overflow-hidden">
            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-xs shrink-0 border border-slate-200">
              {selectedItem.itemCode}
            </span>
            {isMachineryItem(selectedItem) ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 shrink-0 border border-amber-200">
                🚜 Machinery
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 shrink-0 border border-emerald-200">
                🧱 Material
              </span>
            )}
            <span
              className="text-slate-900 font-semibold truncate min-w-0 flex-1 text-xs sm:text-sm"
              title={`${selectedItem.itemName}${selectedItem.description ? ` (${selectedItem.description})` : ''}`}
            >
              {selectedItem.itemName}
            </span>
            <span className="text-slate-500 text-xs shrink-0 font-medium">
              ({selectedItem.unit})
            </span>
            {showStockBadge && (() => {
              const stock = getItemStockInfo(selectedItem.id);
              return (
                <span
                  className={`ml-auto shrink-0 px-2 py-0.5 rounded-md font-mono text-xs font-bold ${
                    stock.available === 0
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : stock.isLow
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                  title={`${stock.label}: ${formatNumber(stock.available)} ${selectedItem.unit}`}
                >
                  {formatNumber(stock.available)} {selectedItem.unit}
                </span>
              );
            })()}
          </div>
        ) : (
          <span className="text-slate-400 select-none truncate flex-1 min-w-0 text-xs sm:text-sm">{placeholder}</span>
        )}

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400 ml-2">
          {selectedItem && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (activeItems[0]) onSelectItem(activeItems[0]);
              }}
              className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180 text-slate-900' : ''}`}
          />
        </div>
      </div>

      {/* Hidden input for HTML form validation */}
      {required && (
        <input
          type="text"
          value={selectedItemId || ''}
          onChange={() => {}}
          required
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Dropdown Menu - Spacious and Unconstrained */}
      {isOpen && (
        <div className="absolute z-50 left-0 w-full min-w-[340px] sm:min-w-[480px] md:min-w-[560px] max-w-[92vw] mt-1.5 bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-100 ring-1 ring-slate-900/10">
          {/* Classification Selection Tabs */}
          <div className="p-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedType('Material')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedType === 'Material'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>🧱 Materials ({materialsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('Machinery')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedType === 'Machinery'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>🚜 Machinery ({machineryCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('all')}
              className={`py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({activeItems.length})
            </button>
          </div>

          {/* Quick Filter: Available Stock Only */}
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                const nextVal = !onlyAvailable;
                setOnlyAvailable(nextVal);
                if (onToggleAvailableOnly) onToggleAvailableOnly(nextVal);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                onlyAvailable
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Check className={`w-3.5 h-3.5 ${onlyAvailable ? 'text-white' : 'text-slate-400'}`} />
              <span>Available Stock Only (තොග ඇති පමණක්)</span>
            </button>
            <span className="text-[11px] text-slate-500 font-medium">
              Showing {filteredItems.length} items
            </span>
          </div>

          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-200 bg-white flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              placeholder={`Filter ${selectedType === 'Machinery' ? 'machinery & equipment' : selectedType === 'Material' ? 'materials' : 'items'} by code, name, category...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-700 text-xs px-2 py-1 font-bold cursor-pointer rounded"
              >
                ✕
              </button>
            )}
          </div>

          {/* Items List - Deep Scrollable Area */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1 max-h-80 min-h-[220px]">
            {filteredItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching {selectedType === 'Machinery' ? 'machinery' : selectedType === 'Material' ? 'materials' : 'items'} found for &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.id === selectedItemId;
                const stock = getItemStockInfo(item.id);
                const isMach = isMachineryItem(item);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectItem(item);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`p-3 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                      isSelected ? 'bg-slate-100 font-medium' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md shrink-0 border border-slate-200">
                          {item.itemCode}
                        </span>
                        {isMach ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 shrink-0 border border-amber-200">
                            🚜 Machinery
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 shrink-0 border border-emerald-200">
                            🧱 Material
                          </span>
                        )}
                        <span className="text-xs sm:text-sm text-slate-900 truncate font-bold min-w-0 flex-1" title={item.itemName}>
                          {item.itemName}
                        </span>
                      </div>

                      {item.description && (
                        <div className="text-xs text-slate-500 truncate mt-1 min-w-0" title={item.description}>
                          {item.description}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                        <span className="truncate font-medium">{item.category}</span>
                        <span>·</span>
                        <span>Unit: <strong className="text-slate-700">{item.unit}</strong></span>
                        {item.unitPrice > 0 && (
                          <>
                            <span>·</span>
                            <span className="font-mono">{config.currencySymbol}{formatNumber(item.unitPrice)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {showStockBadge && (
                        <div className="text-right">
                          <span
                            className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold inline-block ${
                              stock.available === 0
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : stock.isLow
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {formatNumber(stock.available)} {item.unit}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            {stock.label}
                          </div>
                        </div>
                      )}

                      {isSelected && (
                        <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
