import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Package, X, AlertTriangle } from 'lucide-react';
import { Item } from '../../types';
import { useStock } from '../../context/StockContext';
import { formatNumber } from '../../utils/exportUtils';

interface SearchableItemSelectProps {
  selectedItemId: string;
  onSelectItem: (item: Item) => void;
  siteId?: string; // If provided, shows that site's available stock. Otherwise shows main warehouse stock.
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  showStockBadge?: boolean;
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
}) => {
  const { activeItems, getMainWarehouseStock, getSiteItemStock, config } = useStock();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedItem = activeItems.find((i) => i.id === selectedItemId);

  // Filter items based on query
  const filteredItems = activeItems.filter((i) => {
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

  return (
    <div className={`relative min-w-0 ${className}`} ref={containerRef}>
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
        className={`w-full min-h-[38px] px-3 py-1.5 border rounded-lg text-xs bg-white flex items-center justify-between cursor-pointer transition-colors min-w-0 ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'border-slate-900 ring-2 ring-slate-900/10'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        {selectedItem ? (
          <div className="flex items-center gap-2 pr-2 min-w-0 flex-1 overflow-hidden">
            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] shrink-0 border border-slate-200">
              {selectedItem.itemCode}
            </span>
            <span
              className="text-slate-800 font-medium truncate min-w-0 flex-1"
              title={`${selectedItem.itemName}${selectedItem.description ? ` (${selectedItem.description})` : ''}`}
            >
              {selectedItem.itemName}
            </span>
            <span className="text-slate-400 text-[10px] shrink-0">
              ({selectedItem.unit})
            </span>
            {showStockBadge && (() => {
              const stock = getItemStockInfo(selectedItem.id);
              return (
                <span
                  className={`ml-auto shrink-0 px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold ${
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
          <span className="text-slate-400 select-none truncate flex-1 min-w-0">{placeholder}</span>
        )}

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {selectedItem && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                // Pick empty or first item
                if (activeItems[0]) onSelectItem(activeItems[0]);
              }}
              className="p-0.5 hover:text-slate-700 rounded"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180 text-slate-700' : ''}`}
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-72 flex flex-col animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Filter by code, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Items List */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {filteredItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching items found for &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.id === selectedItemId;
                const stock = getItemStockInfo(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectItem(item);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                      isSelected ? 'bg-slate-50/80 font-medium' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 border border-slate-200">
                          {item.itemCode}
                        </span>
                        <span className="text-xs text-slate-800 truncate font-semibold min-w-0 flex-1" title={item.itemName}>
                          {item.itemName}
                        </span>
                      </div>

                      {item.description && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5 min-w-0" title={item.description}>
                          {item.description}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="truncate">{item.category}</span>
                        <span>·</span>
                        <span>Unit: <strong>{item.unit}</strong></span>
                        {item.unitPrice > 0 && (
                          <>
                            <span>·</span>
                            <span>{config.currencySymbol}{formatNumber(item.unitPrice)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {showStockBadge && (
                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold ${
                              stock.available === 0
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : stock.isLow
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {formatNumber(stock.available)} {item.unit}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {stock.label}
                          </div>
                        </div>
                      )}

                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
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
