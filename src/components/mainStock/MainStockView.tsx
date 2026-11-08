import React, { useState, useMemo } from 'react';
import {
  Boxes,
  PlusCircle,
  Search,
  Download,
  Filter,
  ArrowDownLeft,
  Calendar,
  AlertTriangle,
  Receipt,
  FileCheck,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Lock,
  Printer,
  Wrench,
  ShieldAlert,
  ArrowUpRight,
  Building2,
  Sparkles,
  CheckCheck,
  TrendingUp,
  History,
  ShoppingCart,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { MainStockEntryType, Item, BranchReturn, DamagedStockRestoration, isSuperAdmin } from '../../types';
import { formatNumber, formatDateTime, exportToCsv } from '../../utils/exportUtils';
import { isMachineryItem } from '../../utils/itemTypeUtils';
import { StockBalanceCell } from '../common/LowStockIndicator';
import { ConfirmModal } from '../common/ConfirmModal';
import { SearchableItemSelect } from '../common/SearchableItemSelect';
import { PrintableDocumentModal } from '../common/PrintableDocumentModal';

export const MainStockView: React.FC = () => {
  const {
    config,
    sites,
    items,
    activeItems,
    mainStockEntries,
    branchReturns,
    damagedRestorations,
    restoreDamagedStockToMain,
    getDamagedStock,
    addMainStockEntry,
    deleteMainStockEntry,
    clearMainStockReceipts,
    getMainWarehouseStock,
    currentUser,
  } = useStock();

  const [activeTab, setActiveTab] = useState<'inventory' | 'returned-sites' | 'damaged-returned' | 'history'>('inventory');
  const [showLogModal, setShowLogModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [itemTypeFilter, setItemTypeFilter] = useState<'all' | 'Material' | 'Machinery'>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  // Return voucher print modal
  const [selectedReturnForPrint, setSelectedReturnForPrint] = useState<BranchReturn | null>(null);

  // Returns from site filtering
  const [returnedSiteFilter, setReturnedSiteFilter] = useState('all');

  // Damaged Stock Restoration Modal state
  const [restoreModalItem, setRestoreModalItem] = useState<{
    itemId: string;
    itemCode: string;
    itemName: string;
    unit: string;
    damagedBalance: number;
  } | null>(null);
  const [restoreQty, setRestoreQty] = useState<number | ''>('');
  const [restoreNotes, setRestoreNotes] = useState('');
  const [restoreErrorMsg, setRestoreErrorMsg] = useState('');
  const [restoreSuccessToast, setRestoreSuccessToast] = useState<string | null>(null);

  // Confirmation Modal state
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

  const handleClearInboundHistory = () => {
    setConfirmState({
      isOpen: true,
      title: 'Clear All Inbound History?',
      message: `Are you sure you want to delete all ${mainStockEntries.length} logged purchase/manual entry receipt records?`,
      confirmLabel: 'Clear All Receipts',
      onConfirm: () => {
        clearMainStockReceipts();
      },
    });
  };

  const handleDeleteEntry = (entry: typeof mainStockEntries[0]) => {
    setConfirmState({
      isOpen: true,
      title: `Delete Receipt "${entry.referenceNo}"?`,
      message: `Are you sure you want to delete inbound entry ${entry.referenceNo} (${entry.quantity} units)?`,
      confirmLabel: 'Delete Entry',
      onConfirm: () => {
        deleteMainStockEntry(entry.id);
      },
    });
  };

  // Form State for Incoming Stock Log
  const [entryType, setEntryType] = useState<MainStockEntryType>('Purchase');
  const [selectedItemId, setSelectedItemId] = useState<string>(activeItems[0]?.id || '');
  const [referenceNo, setReferenceNo] = useState(`PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [supplier, setSupplier] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleClearFormFields = () => {
    setQuantity('');
    setUnitCost('');
    setSupplier('');
    setNotes('');
    setErrorMsg('');
  };

  // Auto-fill unit cost when item selected
  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    const itm = activeItems.find((i) => i.id === itemId) || items.find((i) => i.id === itemId);
    if (itm) {
      setUnitCost(itm.unitPrice);
    }
  };

  const handleEntryTypeChange = (type: MainStockEntryType) => {
    setEntryType(type);
    if (type === 'Purchase') {
      setReferenceNo(`PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setSupplier('');
    } else {
      setReferenceNo(`MAN-ADJ-${Math.floor(100 + Math.random() * 900)}`);
      setSupplier('Internal Warehouse Physical Count');
    }
  };

  const selectedItem = activeItems.find((i) => i.id === selectedItemId) || items.find((i) => i.id === selectedItemId);

  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedItemId) {
      setErrorMsg('Please select an item.');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      setErrorMsg('Please enter a valid incoming quantity greater than zero.');
      return;
    }
    if (!referenceNo.trim()) {
      setErrorMsg('Please enter a reference/PO number.');
      return;
    }

    addMainStockEntry({
      entryType,
      referenceNo: referenceNo.trim(),
      supplier: supplier.trim() || (entryType === 'Purchase' ? 'Standard Supplier' : 'Internal Audit'),
      itemId: selectedItemId,
      quantity: Number(quantity),
      unitCost: Number(unitCost) || 0,
      notes: notes.trim(),
    });

    // Reset and close
    setQuantity('');
    setNotes('');
    setShowLogModal(false);
  };

  // Filtered Inventory
  const categories = Array.from(new Set(activeItems.map((i) => i.category)));

  // Available stock count (items with availableBalance > 0)
  const availableStockItemsCount = useMemo(() => {
    return activeItems.filter((item) => getMainWarehouseStock(item.id).availableBalance > 0).length;
  }, [activeItems, getMainWarehouseStock]);

  const materialsCount = useMemo(() => {
    return activeItems.filter((i) => !isMachineryItem(i)).length;
  }, [activeItems]);

  const machineryCount = useMemo(() => {
    return activeItems.filter((i) => isMachineryItem(i)).length;
  }, [activeItems]);

  const lowStockCount = useMemo(() => {
    return activeItems.filter((item) => {
      const s = getMainWarehouseStock(item.id);
      return s.isLowStock && s.availableBalance > 0;
    }).length;
  }, [activeItems, getMainWarehouseStock]);

  const outOfStockCount = useMemo(() => {
    return activeItems.filter((item) => getMainWarehouseStock(item.id).availableBalance <= 0).length;
  }, [activeItems, getMainWarehouseStock]);

  const filteredItems = activeItems.filter((item) => {
    const matchesSearch =
      item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    // Filter by Item Type (Materials vs Machinery/Equipment)
    if (itemTypeFilter === 'Material' && isMachineryItem(item)) {
      return false;
    }
    if (itemTypeFilter === 'Machinery' && !isMachineryItem(item)) {
      return false;
    }

    // Filter to show only stock available items
    const stock = getMainWarehouseStock(item.id);
    if ((onlyAvailable || availabilityFilter === 'in-stock') && stock.availableBalance <= 0) {
      return false;
    }
    if (availabilityFilter === 'low-stock' && (!stock.isLowStock || stock.availableBalance <= 0)) {
      return false;
    }
    if (availabilityFilter === 'out-of-stock' && stock.availableBalance > 0) {
      return false;
    }

    return matchesSearch && matchesCategory;
  });

  // Filtered History
  const filteredHistory = mainStockEntries.filter((entry) => {
    const item = items.find((i) => i.id === entry.itemId);
    const matchesSearch =
      entry.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Good Returns from Branch Sites (Directly restocked into Main Central Yard)
  const goodReturns = useMemo(() => {
    return branchReturns.filter((br) => !br.isDeleted && br.condition === 'Good / Restock');
  }, [branchReturns]);

  // Damaged / Scrap Returns from Branch Sites (Strictly quarantined in Damaged Stock)
  const damagedReturns = useMemo(() => {
    return branchReturns.filter((br) => !br.isDeleted && br.condition === 'Damaged / Scrap');
  }, [branchReturns]);

  // Filtered Good Returns
  const filteredGoodReturns = useMemo(() => {
    return goodReturns.filter((br) => {
      const itm = items.find((i) => i.id === br.itemId);
      const matchesSearch =
        br.branchReturnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (br.siteName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (itm?.itemCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (itm?.itemName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (br.reason || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSite = returnedSiteFilter === 'all' || br.siteId === returnedSiteFilter;
      return matchesSearch && matchesSite;
    });
  }, [goodReturns, items, searchQuery, returnedSiteFilter]);

  // Damaged Stock Catalog Overview
  const damagedStockCatalog = useMemo(() => {
    return activeItems
      .map((item) => {
        const info = getDamagedStock(item.id);
        return {
          item,
          ...info,
        };
      })
      .filter((row) => row.hasActivity);
  }, [activeItems, getDamagedStock]);

  const filteredDamagedCatalog = useMemo(() => {
    return damagedStockCatalog.filter((row) => {
      const matchesSearch =
        row.item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || row.item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [damagedStockCatalog, searchQuery, categoryFilter]);

  // Filtered Damaged Returns
  const filteredDamagedReturns = useMemo(() => {
    return damagedReturns.filter((br) => {
      const itm = items.find((i) => i.id === br.itemId);
      const matchesSearch =
        br.branchReturnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (br.siteName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (itm?.itemCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (itm?.itemName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (br.reason || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSite = returnedSiteFilter === 'all' || br.siteId === returnedSiteFilter;
      return matchesSearch && matchesSite;
    });
  }, [damagedReturns, items, searchQuery, returnedSiteFilter]);

  // Total Damaged Units currently quarantined in yard
  const totalDamagedUnitsInYard = useMemo(() => {
    return damagedStockCatalog.reduce((sum, row) => sum + row.availableBalance, 0);
  }, [damagedStockCatalog]);

  // Total Units Repaired and Restored back to Main
  const totalRestoredUnits = useMemo(() => {
    return damagedRestorations.filter((dr) => !dr.isDeleted).reduce((sum, dr) => sum + Number(dr.quantity), 0);
  }, [damagedRestorations]);

  const handleOpenRestoreModal = (item: Item, damagedBalance: number) => {
    setRestoreModalItem({
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      unit: item.unit,
      damagedBalance,
    });
    setRestoreQty(damagedBalance > 0 ? 1 : '');
    setRestoreNotes('');
    setRestoreErrorMsg('');
  };

  const handleConfirmRestore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreModalItem) return;
    const qty = Number(restoreQty);
    if (isNaN(qty) || qty <= 0) {
      setRestoreErrorMsg('Please enter a valid quantity greater than zero.');
      return;
    }
    if (qty > restoreModalItem.damagedBalance) {
      setRestoreErrorMsg(
        `Cannot restore ${qty} units. Current available damaged stock balance is only ${restoreModalItem.damagedBalance}.`
      );
      return;
    }

    const res = restoreDamagedStockToMain(
      restoreModalItem.itemId,
      qty,
      restoreNotes.trim() || 'Repaired to working order and returned to main usable stock'
    );

    if (res.success) {
      setRestoreSuccessToast(res.message);
      setRestoreModalItem(null);
      setTimeout(() => setRestoreSuccessToast(null), 4000);
    } else {
      setRestoreErrorMsg(res.message);
    }
  };

  const exportGoodReturnsCsv = () => {
    const rows = goodReturns.map((br) => {
      const itm = items.find((i) => i.id === br.itemId);
      return {
        'Slip Number': br.branchReturnNumber,
        Date: formatDateTime(br.returnDate),
        'Branch Site': br.siteName || '',
        'Item Code': itm?.itemCode || '',
        'Item Name': itm?.itemName || '',
        Category: itm?.category || '',
        Quantity: br.quantity,
        Unit: itm?.unit || '',
        Condition: br.condition,
        Reason: br.reason,
        'Returned By': br.returnedBy,
      };
    });
    exportToCsv('Returned_From_Sites_Restocked', rows);
  };

  const exportDamagedStockCsv = () => {
    const rows = damagedStockCatalog.map((row) => ({
      'Item Code': row.item.itemCode,
      'Item Name': row.item.itemName,
      Category: row.item.category,
      Unit: row.item.unit,
      'Total Damaged Received': row.totalDamagedReceived,
      'Total Repaired / Restored': row.totalRestored,
      'Damaged Balance in Yard': row.availableBalance,
    }));
    exportToCsv('Damaged_Stock_Quarantine_Report', rows);
  };

  const exportHistoryCsv = () => {
    const rows = mainStockEntries.map((e) => {
      const itm = items.find((i) => i.id === e.itemId);
      return {
        Timestamp: formatDateTime(e.timestamp),
        'Entry Type': e.entryType,
        'Reference No': e.referenceNo,
        Supplier: e.supplier,
        'Item Code': itm?.itemCode || '',
        'Item Name': itm?.itemName || '',
        Unit: itm?.unit || '',
        Quantity: e.quantity,
        'Unit Cost': e.unitCost,
        'Total Cost': e.quantity * e.unitCost,
        'Received By': e.receivedBy,
        Notes: e.notes,
      };
    });
    exportToCsv('Main_Warehouse_Inbound_History', rows);
  };

  const isCentralAdmin = isSuperAdmin(currentUser.role) || currentUser.username === 'admin';

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {restoreSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-lg border border-emerald-700 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCheck className="w-5 h-5 text-emerald-300 shrink-0" />
          <div className="font-semibold">{restoreSuccessToast}</div>
        </div>
      )}

      {/* Header bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Central Depot</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Main Stock Control</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Main Warehouse Inventory & Inbound Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Central stock inventory, branch site returns, quarantined damaged stock, and complete inbound receipt logs.
          </p>
        </div>

        {isCentralAdmin ? (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'procurement' }));
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer active:scale-95"
              title="Create Material Requisition & Purchase Order to Suppliers"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Material Requisition (Supplier PO)</span>
            </button>

            <button
              onClick={() => {
                const firstItem = items[0];
                if (firstItem) {
                  setSelectedItemId(firstItem.id);
                  setUnitCost(firstItem.unitPrice);
                }
                setShowLogModal(true);
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Log Manual / Spot Inbound</span>
            </button>
          </div>
        ) : (
          <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Central Stock (Read-Only for Sites)</span>
          </div>
        )}
      </div>

      {/* Notice for Site Branch Users */}
      {!isCentralAdmin && (
        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Site Scope Permission:</strong> You have read-only access to view Central Main Stock. Inbound vendor purchases are managed by Central Warehouse HQ.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-blue-700 bg-white border border-blue-200 px-2.5 py-1 rounded-md shrink-0">
            Use "Request Stock to Site" to requisition materials
          </span>
        </div>
      )}

      {/* Nav Tabs & Mobile-Friendly Search Filter */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Main Section Mode Buttons with Dynamic Color Changes */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                activeTab === 'inventory'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Central Stock Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('returned-sites')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                activeTab === 'returned-sites'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Returned From Sites</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === 'returned-sites'
                    ? 'bg-teal-800 text-white'
                    : 'bg-teal-100 text-teal-800'
                }`}
              >
                {goodReturns.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('damaged-returned')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                activeTab === 'damaged-returned'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Damaged Returned From Site (Yard)</span>
              {totalDamagedUnitsInYard > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activeTab === 'damaged-returned'
                      ? 'bg-amber-800 text-white'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {totalDamagedUnitsInYard}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Inbound Receipts History ({mainStockEntries.length})</span>
            </button>
          </div>

          {/* Search Box - 2-inch min width and full width on mobile */}
          <div className="relative w-full sm:w-80 md:w-96 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Item Code, Name, Category, Slip #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200 text-xs font-bold cursor-pointer"
                title="Clear Search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Central Stock Specific Filter Buttons & Machinery Tabs */}
        {activeTab === 'inventory' && (
          <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            {/* Machinery & Equipment vs Materials Button Switcher */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">Classification:</span>
              <button
                type="button"
                onClick={() => setItemTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                  itemTypeFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Items ({activeItems.length})
              </button>
              <button
                type="button"
                onClick={() => setItemTypeFilter('Material')}
                className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  itemTypeFilter === 'Material'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white border-slate-200 text-indigo-700 hover:bg-indigo-50/50'
                }`}
              >
                <span>🧱 Materials & Consumables</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${itemTypeFilter === 'Material' ? 'bg-indigo-800 text-white' : 'bg-indigo-100 text-indigo-800'}`}>
                  {materialsCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setItemTypeFilter('Machinery')}
                className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  itemTypeFilter === 'Machinery'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : 'bg-white border-slate-200 text-amber-700 hover:bg-amber-50/50'
                }`}
              >
                <span>🚜 Machinery & Equipment</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${itemTypeFilter === 'Machinery' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'}`}>
                  {machineryCount}
                </span>
              </button>
            </div>

            {/* Stock Availability Pill Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">Stock Level:</span>
              <button
                type="button"
                onClick={() => {
                  setAvailabilityFilter('all');
                  setOnlyAvailable(false);
                }}
                className={`px-2.5 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer ${
                  availabilityFilter === 'all' && !onlyAvailable
                    ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setAvailabilityFilter('in-stock');
                  setOnlyAvailable(true);
                }}
                className={`px-2.5 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                  availabilityFilter === 'in-stock' || onlyAvailable
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white border-slate-200 text-emerald-700 hover:bg-emerald-50/50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>In Stock ({availableStockItemsCount})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAvailabilityFilter('low-stock');
                  setOnlyAvailable(false);
                }}
                className={`px-2.5 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                  availabilityFilter === 'low-stock'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                    : 'bg-white border-slate-200 text-amber-700 hover:bg-amber-50/50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low ({lowStockCount})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAvailabilityFilter('out-of-stock');
                  setOnlyAvailable(false);
                }}
                className={`px-2.5 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer ${
                  availabilityFilter === 'out-of-stock'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                    : 'bg-white border-slate-200 text-rose-700 hover:bg-rose-50/50'
                }`}
              >
                Out of Stock ({outOfStockCount})
              </button>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="ml-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === 'returned-sites' && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
            <select
              value={returnedSiteFilter}
              onChange={(e) => setReturnedSiteFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none"
            >
              <option value="all">All Branch Sites</option>
              {sites
                .filter((s) => !s.isMainWarehouse && !s.isDeleted)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={exportGoodReturnsCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        )}

        {activeTab === 'damaged-returned' && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={exportDamagedStockCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Report</span>
            </button>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
            <button
              onClick={exportHistoryCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            {mainStockEntries.length > 0 && (
              <button
                type="button"
                onClick={handleClearInboundHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold transition-colors"
                title="Clear all inbound receipt records"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Clear All History</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab 1: Current Main Warehouse Inventory */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-40">Item Code</th>
                  <th className="py-3 px-4 w-96">Item Name</th>
                  <th className="py-3 px-3 w-64">Category</th>
                  <th className="py-3 px-3 text-center w-24">Unit</th>
                  <th className="py-3 px-3 text-right w-32">Total Received</th>
                  <th className="py-3 px-3 text-right w-32">Dispatched to Sites</th>
                  <th className="py-3 px-4 text-right w-40">Main In-Stock Balance</th>
                  <th className="py-3 px-3 text-center w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-slate-300" />
                        <span className="font-semibold text-slate-700">No items match the current filter criteria.</span>
                        {(availabilityFilter !== 'all' || onlyAvailable || categoryFilter !== 'all' || searchQuery) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery('');
                              setCategoryFilter('all');
                              setAvailabilityFilter('all');
                              setOnlyAvailable(false);
                            }}
                            className="mt-1 text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline cursor-pointer"
                          >
                            Reset filters to view all items ({activeItems.length})
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const stock = getMainWarehouseStock(item.id);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {item.itemCode}
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-medium whitespace-normal break-words">
                          {item.itemName}
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-normal break-words font-medium">
                          {item.category}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 font-medium">
                          {item.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {formatNumber(stock.totalReceived)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {formatNumber(stock.dispatched)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {/* Low Stock Red Indicator requirement */}
                          <StockBalanceCell
                            balance={stock.availableBalance}
                            threshold={stock.threshold}
                            unit={item.unit}
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedItemId(item.id);
                              setUnitCost(item.unitPrice);
                              setShowLogModal(true);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-colors"
                          >
                            + Inbound
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Returned From Sites */}
      {activeTab === 'returned-sites' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Good Stock Batches Restocked</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <RotateCcw className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {goodReturns.length}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">
                Directly added to Central Stock balance
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Units Returned from Sites</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {formatNumber(goodReturns.reduce((sum, br) => sum + Number(br.quantity), 0))}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Verified in good/usable condition
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Branch Locations</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {new Set(goodReturns.map((br) => br.siteId)).size}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Participating branch sites
              </div>
            </div>
          </div>

          {/* Table of Good Stock Returned From Sites */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-800">Branch Stock Returns Log (Good / Restock to Central Yard)</span>
                <span>· Showing: <strong className="font-mono text-slate-900">{filteredGoodReturns.length}</strong></span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Slip Number</th>
                    <th className="py-3 px-3">Return Date</th>
                    <th className="py-3 px-3">Originating Branch Site</th>
                    <th className="py-3 px-3">Item Code</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-3 text-right">Returned Qty</th>
                    <th className="py-3 px-3 text-center">Condition</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-3">Returned By</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGoodReturns.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RotateCcw className="w-6 h-6 text-slate-300" />
                          <span className="font-semibold text-slate-700">No branch return records found.</span>
                          <span className="text-[11px] text-slate-500">
                            When sites transfer usable stock back to Central Yard, vouchers and restocked quantities appear here.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredGoodReturns.map((br) => {
                      const itm = items.find((i) => i.id === br.itemId);
                      return (
                        <tr key={br.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                            {br.branchReturnNumber}
                          </td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                            {formatDateTime(br.returnDate)}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{br.siteName || br.fromSiteName || 'Branch Site'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                            {itm?.itemCode || 'CODE'}
                          </td>
                          <td className="py-3 px-4 text-slate-800 font-medium max-w-xs">
                            {itm?.itemName || 'Item'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                            +{formatNumber(br.quantity)} <span className="text-slate-500 text-[10px] font-normal">{itm?.unit}</span>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Good / Restock</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={br.reason}>
                            {br.reason || 'Surplus stock returned to central yard'}
                          </td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap text-[11px]">
                            {br.returnedBy || 'Site Officer'}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedReturnForPrint(br)}
                              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                              title="Print / View Return Voucher"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                              <span>Print Voucher</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Damaged Returned From Site */}
      {activeTab === 'damaged-returned' && (
        <div className="space-y-6">
          {/* Policy Information Banner */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-amber-950">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-900 text-sm">
                  Damaged Stock Quarantine & Recovery Workflow
                </h3>
                <p className="text-amber-800 mt-0.5 leading-relaxed">
                  Materials returned as <strong>"Damaged / Scrap"</strong> are isolated in quarantined Damaged Stock and strictly <strong>excluded from Main Available Stock</strong>. Once a damaged unit is repaired, tested, or reconditioned to working standard, click <strong>"Repair & Restore to Main Stock"</strong> to safely transfer units into Central Usable Inventory.
                </p>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Damaged Units in Yard</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-amber-700 font-mono">
                {formatNumber(totalDamagedUnitsInYard)}
              </div>
              <div className="text-[11px] text-amber-800 font-medium mt-1">
                Quarantined · Excluded from Central Balance
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Damaged Inbound Notes</span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {damagedReturns.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Logged from site returns
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Repaired & Restored to Main</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Wrench className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-600 font-mono">
                {formatNumber(totalRestoredUnits)}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">
                Refurbished back to usable inventory
              </div>
            </div>
          </div>

          {/* Section 1: Damaged Stock Balance by Item & Restore Action */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-slate-900">Current Quarantined Damaged Stock by Material</span>
                <span>· ({filteredDamagedCatalog.length} Items with Damaged Activity)</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Item Code</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-center">Unit</th>
                    <th className="py-3 px-3 text-right">Total Damaged Inbound</th>
                    <th className="py-3 px-3 text-right">Repaired & Restored</th>
                    <th className="py-3 px-4 text-right">Damaged Balance in Yard</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDamagedCatalog.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          <span className="font-semibold text-slate-700">No damaged inventory currently quarantined in yard.</span>
                          <span className="text-[11px] text-slate-500">
                            When sites return damaged materials, they will appear here and can be repaired & restored to Main Stock.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDamagedCatalog.map((row) => (
                      <tr key={row.item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {row.item.itemCode}
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-medium max-w-xs">
                          {row.item.itemName}
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {row.item.category}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 font-medium">
                          {row.item.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {formatNumber(row.totalDamagedReceived)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold">
                          {formatNumber(row.totalRestored)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-xs ${
                              row.availableBalance > 0
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {formatNumber(row.availableBalance)} {row.item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenRestoreModal(row.item, row.availableBalance)}
                            disabled={row.availableBalance <= 0 || !isCentralAdmin}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 mx-auto transition-colors cursor-pointer ${
                              row.availableBalance > 0 && isCentralAdmin
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                            title={
                              !isCentralAdmin
                                ? 'Restoring stock is restricted to Super Admin Central'
                                : row.availableBalance <= 0
                                ? 'No damaged stock remaining to restore'
                                : 'Restore repaired material back to Main Central Inventory'
                            }
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Repair & Restore to Main Stock</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Chronological Damaged Returns from Sites */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span className="font-semibold text-slate-800">Damaged Returns Log from Branch Sites</span>
                <span>· Total Records: <strong className="font-mono text-slate-900">{filteredDamagedReturns.length}</strong></span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Slip Number</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Branch Site</th>
                    <th className="py-3 px-3">Item Code</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-3 text-right">Damaged Qty</th>
                    <th className="py-3 px-3 text-center">Condition</th>
                    <th className="py-3 px-4">Damage Description / Notes</th>
                    <th className="py-3 px-3">Reported By</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDamagedReturns.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No damaged stock return slips logged.
                      </td>
                    </tr>
                  ) : (
                    filteredDamagedReturns.map((br) => {
                      const itm = items.find((i) => i.id === br.itemId);
                      return (
                        <tr key={br.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-amber-800 whitespace-nowrap">
                            {br.branchReturnNumber}
                          </td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                            {formatDateTime(br.returnDate)}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{br.siteName || br.fromSiteName || 'Branch Site'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                            {itm?.itemCode || 'CODE'}
                          </td>
                          <td className="py-3 px-4 text-slate-800 font-medium max-w-xs">
                            {itm?.itemName || 'Item'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                            {formatNumber(br.quantity)} <span className="text-slate-500 text-[10px] font-normal">{itm?.unit}</span>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Damaged / Scrap</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={br.reason}>
                            {br.reason || 'Damaged at project site'}
                          </td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap text-[11px]">
                            {br.returnedBy || 'Site Officer'}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedReturnForPrint(br)}
                              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                              title="Print / View Return Voucher"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                              <span>Print Voucher</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Repaired & Restored to Main Stock Log */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-800">History of Repaired Materials Restored to Main Central Inventory</span>
                <span>· ({damagedRestorations.filter((dr) => !dr.isDeleted).length} Restorations)</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Restoration No</th>
                    <th className="py-3 px-3">Date Restored</th>
                    <th className="py-3 px-3">Item Code</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-3 text-right">Restored Quantity</th>
                    <th className="py-3 px-3">Restored By</th>
                    <th className="py-3 px-4">Repair & Reconditioning Notes</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {damagedRestorations.filter((dr) => !dr.isDeleted).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No damaged stock restorations recorded yet. When damaged materials are repaired and restored, records appear here.
                      </td>
                    </tr>
                  ) : (
                    damagedRestorations
                      .filter((dr) => !dr.isDeleted)
                      .map((dr) => {
                        const itm = items.find((i) => i.id === dr.itemId);
                        return (
                          <tr key={dr.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                              {dr.restorationNumber}
                            </td>
                            <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                              {formatDateTime(dr.restoredDate)}
                            </td>
                            <td className="py-3 px-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                              {itm?.itemCode || 'CODE'}
                            </td>
                            <td className="py-3 px-4 text-slate-800 font-medium max-w-xs">
                              {itm?.itemName || 'Item'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                              +{formatNumber(dr.quantity)} <span className="text-slate-500 text-[10px] font-normal">{itm?.unit}</span>
                            </td>
                            <td className="py-3 px-3 text-slate-600 whitespace-nowrap text-[11px]">
                              {dr.restoredBy}
                            </td>
                            <td className="py-3 px-4 text-slate-600 max-w-xs">
                              {dr.notes || 'Repaired and tested'}
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Restored to Main</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Complete Timestamped Transaction History Log */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-600" />
              <span>Complete Timestamped Inbound Inventory Receipts</span>
              <span>· Total Logged: <strong className="font-mono text-slate-800">{filteredHistory.length}</strong></span>
            </div>

            {isCentralAdmin && mainStockEntries.length > 0 && (
              <button
                type="button"
                onClick={handleClearInboundHistory}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                title="Delete all logged purchase and manual receipt records"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Inbound History ({mainStockEntries.length})</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Reference / PO #</th>
                  <th className="py-3 px-3">Supplier / Origin</th>
                  <th className="py-3 px-3">Item Code</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-3 text-right">Qty Received</th>
                  <th className="py-3 px-3 text-right">Unit Cost</th>
                  <th className="py-3 px-3 text-right">Total Cost</th>
                  <th className="py-3 px-3">Received By</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-slate-400">
                      No inbound transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((entry) => {
                    const itm = items.find((i) => i.id === entry.itemId);
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                          {formatDateTime(entry.timestamp)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              entry.entryType === 'Purchase'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {entry.entryType}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {entry.referenceNo}
                        </td>
                        <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                          {entry.supplier}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-800 whitespace-nowrap font-semibold">
                          {itm?.itemCode}
                        </td>
                        <td className="py-3 px-4 text-slate-800 max-w-xs truncate" title={itm?.itemName}>
                          {itm?.itemName}
                          {entry.notes && (
                            <div className="text-[10px] text-slate-500 italic mt-0.5">{entry.notes}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          +{formatNumber(entry.quantity)} <span className="text-[10px] text-slate-500 font-normal">{itm?.unit}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                          {config.currencySymbol}{Number(entry.unitCost).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {config.currencySymbol}{formatNumber(Math.round(entry.quantity * entry.unitCost))}
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap text-[11px]">
                          {entry.receivedBy}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {isCentralAdmin ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteEntry(entry)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete receipt record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
      )}

      {/* Log Incoming Stock Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 border border-slate-200 my-auto min-h-[580px] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-800" />
                <h3 className="font-semibold text-lg text-slate-900">Log Incoming Stock to Main Warehouse</h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitEntry} className="space-y-4">
              {/* Entry Type Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Incoming Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleEntryTypeChange('Purchase')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                      entryType === 'Purchase'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Supplier Purchase
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEntryTypeChange('Manual Entry')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                      entryType === 'Manual Entry'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Manual Stock / Audit Entry
                  </button>
                </div>
              </div>

              {/* Item Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Assembly Unit / Item *
                </label>
                <SearchableItemSelect
                  selectedItemId={selectedItemId}
                  onSelectItem={(item) => {
                    setSelectedItemId(item.id);
                    if (item.unitPrice) setUnitCost(item.unitPrice);
                  }}
                  required
                />
                {selectedItem && (
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="font-mono font-bold text-slate-900">{selectedItem.itemCode}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Main Balance:{' '}
                        <strong className="text-slate-900">
                          {formatNumber(getMainWarehouseStock(selectedItem.id).availableBalance)} {selectedItem.unit}
                        </strong>
                      </span>
                    </div>
                    {selectedItem.description && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 break-words italic">
                        {selectedItem.description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {entryType === 'Purchase' ? 'PO / Invoice Number *' : 'Audit / Adjustment Ref *'}
                  </label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. PO-2026-9901"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {entryType === 'Purchase' ? 'Supplier Name *' : 'Origin / Reason'}
                  </label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder={entryType === 'Purchase' ? 'e.g. Prysmian Cables' : 'e.g. Physical stock count'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Received Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Cost ({config.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Inspection Comments</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Delivered via flatbed, packaging intact, QC inspected."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex justify-between items-center">
                <span>Total Shipment Valuation:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {config.currencySymbol}
                  {formatNumber(Math.round(Number(quantity || 0) * Number(unitCost || 0)))}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClearFormFields}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Fields</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLogModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                  >
                    Record Inbound Receipt
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repair & Restore Damaged Stock to Main Modal */}
      {restoreModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Repair & Restore Material to Main Stock
                  </h3>
                  <p className="text-xs text-slate-500">
                    Recover repaired units from quarantined damaged inventory back into Central Yard.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestoreModalItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {restoreErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{restoreErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleConfirmRestore} className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Material Item:</span>
                  <span className="font-bold text-slate-900">{restoreModalItem.itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Item Code:</span>
                  <span className="font-mono font-semibold text-slate-800">{restoreModalItem.itemCode}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-amber-800 font-semibold">Available Damaged In Yard:</span>
                  <span className="font-mono font-bold text-amber-900 text-sm">
                    {formatNumber(restoreModalItem.damagedBalance)} {restoreModalItem.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Units Repaired & Restored to Main Stock *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={restoreModalItem.damagedBalance}
                    required
                    value={restoreQty}
                    onChange={(e) => setRestoreQty(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={`1 to ${restoreModalItem.damagedBalance}`}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    {restoreModalItem.unit}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  This quantity will be deducted from Damaged Stock and credited directly to Central Main Stock balance.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Repair & Reconditioning Details / Inspection Notes
                </label>
                <textarea
                  rows={3}
                  value={restoreNotes}
                  onChange={(e) => setRestoreNotes(e.target.value)}
                  placeholder="e.g. Serviced, parts replaced, bench tested, and verified fit for project deployment."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRestoreModalItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Confirm Restore to Main Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Slip Voucher Printable Document Modal */}
      {selectedReturnForPrint && (
        <PrintableDocumentModal
          isOpen={!!selectedReturnForPrint}
          onClose={() => setSelectedReturnForPrint(null)}
          title="INTER-BRANCH RETURN TO CENTRAL YARD NOTE"
          documentNumber={selectedReturnForPrint.branchReturnNumber}
          documentDate={selectedReturnForPrint.returnDate}
          recipientLabel="Receiving Yard"
          recipientName="Main Central Warehouse"
          recipientSubDetails={`Returned from: ${selectedReturnForPrint.siteName || selectedReturnForPrint.fromSiteName} | Processed by: ${selectedReturnForPrint.returnedBy}`}
          notes={`Return Condition: ${selectedReturnForPrint.condition} | Reason: ${selectedReturnForPrint.reason}`}
          items={[
            {
              itemCode: items.find((i) => i.id === selectedReturnForPrint.itemId)?.itemCode || 'CODE',
              itemName: items.find((i) => i.id === selectedReturnForPrint.itemId)?.itemName || 'Material Item',
              category: items.find((i) => i.id === selectedReturnForPrint.itemId)?.category || 'General Equipment',
              quantity: selectedReturnForPrint.quantity,
              unit: items.find((i) => i.id === selectedReturnForPrint.itemId)?.unit || 'Nos',
            },
          ]}
        />
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
