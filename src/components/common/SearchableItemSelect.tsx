import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Barcode, Package } from 'lucide-react';
import { Item } from '../../types';
import { useStock } from '../../context/StockContext';
import { formatNumber } from '../../utils/exportUtils';
import { isMachineryItem } from '../../utils/itemTypeUtils';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { matchItemByScannedCode, playScanBeep, useUsbBarcodeScanner } from '../../utils/barcodeUtils';

interface SearchableItemSelectProps {
  selectedItemId: string;
  onSelectItem: (item: Item) => void;
  siteId?: string; // If provided, shows that site's available stock. Otherwise shows main warehouse stock.
  requestingSiteId?: string; // If provided during Stock Requisition, shows BOTH Site Avl: and Main Avl: and sorts Site Low Stock items to the top
  focProjectId?: string; // If provided, shows that project's Central FOC Warehouse available balance
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
  requestingSiteId,
  focProjectId,
  placeholder = 'Search & select item by code, barcode, or assembly description...',
  disabled = false,
  required = false,
  className = '',
  showStockBadge = true,
  defaultClassification = 'all',
  onlyAvailableStock = false,
  onToggleAvailableOnly,
}) => {
  const { activeItems, getMainWarehouseStock, getSiteItemStock, getClientFreeStockBalance, config } = useStock();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'Material' | 'Machinery'>(defaultClassification);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(onlyAvailableStock);
  const [onlySiteLowStock, setOnlySiteLowStock] = useState<boolean>(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const barcodeEnabled = config.barcodeEnabled !== false;
  const hasRequestingSite = Boolean(requestingSiteId && requestingSiteId !== 'all');

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
    const reqSiteStk =
      hasRequestingSite && requestingSiteId ? getSiteItemStock(requestingSiteId, itemId) : null;
    const isSiteLowOrZero = reqSiteStk
      ? reqSiteStk.isLowStock || reqSiteStk.availableBalance <= reqSiteStk.threshold
      : false;

    if (focProjectId) {
      const focStock = getClientFreeStockBalance(focProjectId, itemId);
      return {
        available: focStock.centralWarehouseAvailable,
        totalFocReceived: focStock.totalReceived,
        isLow: focStock.totalReceived > 0 && focStock.centralWarehouseAvailable <= 0,
        label: 'Project FOC HQ Pool',
        isFocMode: true,
        siteAvailable: reqSiteStk ? reqSiteStk.availableBalance : undefined,
        siteThreshold: reqSiteStk ? reqSiteStk.threshold : undefined,
        siteIsLowActive: reqSiteStk ? reqSiteStk.isLowStock : false,
        siteIsLowOrZero: isSiteLowOrZero,
        siteHasActivity: reqSiteStk ? reqSiteStk.hasActivity : false,
      };
    } else if (siteId && siteId !== 'all') {
      const siteStock = getSiteItemStock(siteId, itemId);
      return {
        available: siteStock.availableBalance,
        totalFocReceived: 0,
        isLow: siteStock.isLowStock,
        label: 'Site Yard Stock',
        isFocMode: false,
        siteAvailable: undefined,
        siteThreshold: siteStock.threshold,
        siteIsLowActive: siteStock.isLowStock,
        siteIsLowOrZero: siteStock.isLowStock || siteStock.availableBalance <= siteStock.threshold,
        siteHasActivity: siteStock.hasActivity,
      };
    } else {
      const mainStock = getMainWarehouseStock(itemId);
      return {
        available: mainStock.availableBalance,
        totalFocReceived: 0,
        isLow: mainStock.isLowStock,
        label: 'Central Main Stock',
        isFocMode: false,
        siteAvailable: reqSiteStk ? reqSiteStk.availableBalance : undefined,
        siteThreshold: reqSiteStk ? reqSiteStk.threshold : undefined,
        siteIsLowActive: reqSiteStk ? reqSiteStk.isLowStock : false,
        siteIsLowOrZero: isSiteLowOrZero,
        siteHasActivity: reqSiteStk ? reqSiteStk.hasActivity : false,
      };
    }
  };

  // Filter items based on query (including barcode!), type tab, and stock availability
  // When requestingSiteId is provided, automatically sort Site Low Stock items to the very top!
  const filteredItems = activeItems
    .filter((i) => {
      const isMach = isMachineryItem(i);
      if (selectedType === 'Material' && isMach) return false;
      if (selectedType === 'Machinery' && !isMach) return false;

      const stock = getItemStockInfo(i.id);
      if (onlyAvailable && stock.available <= 0) {
        return false;
      }
      if (hasRequestingSite && onlySiteLowStock && !stock.siteIsLowOrZero) {
        return false;
      }

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        i.itemCode.toLowerCase().includes(q) ||
        (i.barcode && i.barcode.toLowerCase().includes(q)) ||
        i.itemName.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.description && i.description.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const aInfo = getItemStockInfo(a.id);
      const bInfo = getItemStockInfo(b.id);

      // When requesting for a Site Branch, prioritize Site Low Stock items at the top of the list
      if (hasRequestingSite) {
        // Tier 0: Site has prior activity AND is Low Stock (availableBalance <= threshold)
        // Tier 1: Site stock is <= threshold (including 0 stock at site)
        // Tier 2: Site stock is above threshold
        const getUrgencyTier = (info: typeof aInfo) => {
          if (info.siteIsLowActive) return 0;
          if (info.siteIsLowOrZero) return 1;
          return 2;
        };
        const aTier = getUrgencyTier(aInfo);
        const bTier = getUrgencyTier(bInfo);
        if (aTier !== bTier) return aTier - bTier;

        // Within low-stock tiers, prioritize items that actually have Main / FOC stock available to request
        const aHasMain = aInfo.available > 0 ? 1 : 0;
        const bHasMain = bInfo.available > 0 ? 1 : 0;
        if (aHasMain !== bHasMain) return bHasMain - aHasMain;

        // Next, sort by lowest Site Available stock first (0 before 5 before 20)
        const aSiteAvl = aInfo.siteAvailable ?? 0;
        const bSiteAvl = bInfo.siteAvailable ?? 0;
        if (aSiteAvl !== bSiteAvl) return aSiteAvl - bSiteAvl;
      }

      if (focProjectId) {
        if (bInfo.available !== aInfo.available) return bInfo.available - aInfo.available;
        return bInfo.totalFocReceived - aInfo.totalFocReceived;
      }

      return 0;
    });

  // Listen to USB HID scanner when dropdown is open
  useUsbBarcodeScanner({
    enabled: isOpen && barcodeEnabled && config.usbScannerEnabled !== false,
    maxLatencyMs: config.usbScanMaxLatencyMs || 60,
    captureInInputs: true,
    onScan: (code) => {
      const found = matchItemByScannedCode(code, activeItems);
      if (found) {
        playScanBeep('success', config.barcodeBeepEnabled !== false);
        onSelectItem(found);
        setIsOpen(false);
        setSearchQuery('');
      } else {
        playScanBeep('error', config.barcodeBeepEnabled !== false);
      }
    },
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
        className={`w-full min-h-[54px] px-3.5 py-2.5 border rounded-xl text-xs bg-white flex items-center justify-between cursor-pointer transition-all min-w-0 shadow-2xs ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'border-slate-900 ring-2 ring-slate-900/15'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        {selectedItem ? (
          <div className="flex items-center gap-3 pr-2 min-w-0 flex-1">
            {selectedItem.imageUrl ? (
              <img
                src={selectedItem.imageUrl}
                alt={selectedItem.itemName}
                className="w-10 h-10 rounded-lg object-cover border border-slate-300 bg-white shrink-0 shadow-2xs"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                <Package className="w-4 h-4" />
              </div>
            )}
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              {/* Top Row: Item Code, Classification Badge, Unit, and Stock Badges */}
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-xs shrink-0 border border-slate-200">
                  {selectedItem.itemCode}
                </span>
                {isMachineryItem(selectedItem) ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 shrink-0 border border-amber-200">
                    🚜 Machinery
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 shrink-0 border border-emerald-200">
                    📦 Material
                  </span>
                )}
                <span className="text-slate-500 text-[11px] shrink-0 font-semibold">
                  Unit: <strong className="text-slate-700">{selectedItem.unit}</strong>
                </span>

                {showStockBadge && (() => {
                  const stock = getItemStockInfo(selectedItem.id);
                  return (
                    <div className="ml-auto flex items-center gap-1.5 flex-wrap shrink-0">
                      {hasRequestingSite && stock.siteAvailable !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                            stock.siteIsLowActive || stock.siteAvailable === 0
                              ? 'bg-amber-50 text-amber-800 border border-amber-300'
                              : stock.siteIsLowOrZero
                              ? 'bg-amber-50/70 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                          title={`Site Available Stock: ${formatNumber(stock.siteAvailable)} ${selectedItem.unit} (Min Threshold: ${stock.siteThreshold ?? 0})`}
                        >
                          {stock.siteIsLowOrZero ? '⚠️ ' : ''}Site Avl: {formatNumber(stock.siteAvailable)} {selectedItem.unit}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold ${
                          stock.available === 0
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : stock.isFocMode
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : stock.isLow
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                        title={`${stock.label}: ${formatNumber(stock.available)} ${selectedItem.unit}`}
                      >
                        {stock.isFocMode
                          ? `FOC Avl: ${formatNumber(stock.available)} ${selectedItem.unit}`
                          : hasRequestingSite
                          ? `Main Avl: ${formatNumber(stock.available)} ${selectedItem.unit}`
                          : `${formatNumber(stock.available)} ${selectedItem.unit}`}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Bottom Row (Underneath Item Code): Full Item Name clearly visible */}
              <div
                className="text-slate-900 font-extrabold text-xs sm:text-sm leading-snug break-words"
                title={`${selectedItem.itemName}${selectedItem.description ? ` (${selectedItem.description})` : ''}`}
              >
                {selectedItem.itemName}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-slate-400 select-none truncate flex-1 min-w-0 text-xs sm:text-sm">{placeholder}</span>
        )}

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400 ml-2">
          {barcodeEnabled && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                setShowScannerModal(true);
              }}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-emerald-600 text-white text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-2xs"
              title="Scan Barcode via USB Gun or Mobile Phone Camera"
            >
              <Barcode className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Scan</span>
            </button>
          )}
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

      {/* Dropdown Menu - Extra Wide & Tall for Clear Item Name Visibility */}
      {isOpen && (
        <div className="absolute z-50 left-0 w-full min-w-[350px] sm:min-w-[580px] md:min-w-[680px] lg:min-w-[760px] max-w-[94vw] mt-1.5 bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-100 ring-1 ring-slate-900/10">
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
              <span>📦 Materials ({materialsCount})</span>
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

          {/* Quick Filter: Available Stock Only & Site Low Stock Priority */}
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
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
                <span>Available Stock Only</span>
              </button>

              {hasRequestingSite && (
                <button
                  type="button"
                  onClick={() => setOnlySiteLowStock(!onlySiteLowStock)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    onlySiteLowStock
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                  }`}
                  title="Click to filter only low-stock items at the requesting site (by default, low-stock items are already sorted to the top)"
                >
                  <span>⚠️ {onlySiteLowStock ? 'Showing Site Low Stock Only' : 'Site Low Stock Sorted Top'}</span>
                </button>
              )}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Showing {filteredItems.length} items
            </span>
          </div>

          {/* Search & Scan Box */}
          <div className="p-2.5 border-b border-slate-200 bg-white flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              placeholder={`Search or scan ${selectedType === 'Machinery' ? 'machinery' : selectedType === 'Material' ? 'materials' : 'items'} by barcode, code, name...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  const exactMatch = matchItemByScannedCode(searchQuery.trim(), activeItems);
                  if (exactMatch) {
                    e.preventDefault();
                    playScanBeep('success', config.barcodeBeepEnabled !== false);
                    onSelectItem(exactMatch);
                    setIsOpen(false);
                    setSearchQuery('');
                  } else if (filteredItems.length === 1) {
                    e.preventDefault();
                    playScanBeep('success', config.barcodeBeepEnabled !== false);
                    onSelectItem(filteredItems[0]);
                    setIsOpen(false);
                    setSearchQuery('');
                  }
                }
              }}
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
            {barcodeEnabled && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowScannerModal(true);
                }}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                title="Open USB / Mobile Camera Barcode Scanner"
              >
                <Barcode className="w-3.5 h-3.5" />
                <span>Camera / USB</span>
              </button>
            )}
          </div>

          {/* Items List - Deep Scrollable Area */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1 max-h-[420px] min-h-[280px]">
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
                    className={`p-3.5 hover:bg-slate-100/90 cursor-pointer flex items-start justify-between gap-3 transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/70 font-medium'
                        : hasRequestingSite && stock.siteIsLowOrZero
                        ? 'bg-amber-50/35'
                        : ''
                    }`}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.itemName}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 bg-white shrink-0 shadow-2xs mt-0.5"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 text-slate-400 mt-0.5">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Line 1: Item Code & Status/Type Badges */}
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md shrink-0 border border-slate-200">
                          {item.itemCode}
                        </span>
                        {item.barcode && item.barcode !== item.itemCode && (
                          <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0 inline-flex items-center gap-1">
                            <Barcode className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{item.barcode}</span>
                          </span>
                        )}
                        {isMach ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 shrink-0 border border-amber-200">
                            🚜 Machinery
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 shrink-0 border border-emerald-200">
                            📦 Material
                          </span>
                        )}
                        {hasRequestingSite && stock.siteIsLowOrZero && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold shrink-0 border ${
                              stock.siteIsLowActive || (stock.siteAvailable ?? 0) === 0
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            ⚠️ {stock.siteIsLowActive ? 'Low Site Stock' : (stock.siteAvailable ?? 0) === 0 ? 'Site Avl: 0' : 'Low at Site'}
                          </span>
                        )}
                      </div>

                      {/* Line 2 (Directly Underneath Item Code): Full Item Name */}
                      <div
                        className="text-xs sm:text-sm text-slate-900 font-extrabold leading-snug break-words"
                        title={item.itemName}
                      >
                        {item.itemName}
                      </div>

                      {item.description && (
                        <div className="text-xs text-slate-500 break-words leading-snug" title={item.description}>
                          {item.description}
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap pt-0.5 text-xs text-slate-500">
                        <span className="font-medium">{item.category}</span>
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

                    <div className="flex items-center gap-2 shrink-0 pt-0.5">
                      {showStockBadge && (
                        <div className="flex items-center gap-2">
                          {hasRequestingSite && stock.siteAvailable !== undefined && (
                            <div className="text-right">
                              <span
                                className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold inline-block ${
                                  stock.siteIsLowActive || stock.siteAvailable === 0
                                    ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                    : stock.siteIsLowOrZero
                                    ? 'bg-amber-50/70 text-amber-700 border border-amber-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                              >
                                Site Avl: {formatNumber(stock.siteAvailable)} {item.unit}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                Site Stock (Min: {stock.siteThreshold ?? 0})
                              </div>
                            </div>
                          )}

                          <div className="text-right">
                            <span
                              className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold inline-block ${
                                stock.available === 0
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : stock.isFocMode
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : stock.isLow
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {stock.isFocMode
                                ? `FOC Avl: ${formatNumber(stock.available)} ${item.unit}`
                                : hasRequestingSite
                                ? `Main Avl: ${formatNumber(stock.available)} ${item.unit}`
                                : `${formatNumber(stock.available)} ${item.unit}`}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                              {stock.label}
                            </div>
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

      <BarcodeScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        mode="select"
        siteId={siteId}
        onScanItem={(item) => {
          onSelectItem(item);
          setIsOpen(false);
          setSearchQuery('');
        }}
      />
    </div>
  );
};
