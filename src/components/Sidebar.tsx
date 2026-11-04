import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Boxes,
  Database,
  UserPlus,
  ArrowRightLeft,
  Send,
  RotateCcw,
  Users2,
  Building2,
  FileText,
  AlertTriangle,
  Bell,
  Trash2,
  FolderKanban,
  Layers,
  ArrowUpLeft,
  Award,
  LogOut,
  ShoppingCart,
  Truck,
  Sparkles,
} from 'lucide-react';
import { useStock } from '../context/StockContext';
import { getThemeConfig } from '../utils/themeUtils';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { pendingRequestsCount, totalLowStockAlertsCount, recycleBinCount, currentUser, logout, config, currentTenant } = useStock();
  const currentTheme = getThemeConfig(config?.themeId || config?.logoColor || 'emerald');
  const isCentralAdmin = currentUser?.role === 'Central Warehouse Admin';
  const isMasterOwner = (currentTenant?.id === 'tenant-apex-main' || currentUser?.username === 'admin') && isCentralAdmin;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: totalLowStockAlertsCount > 0 ? `${totalLowStockAlertsCount} Low` : undefined,
      badgeColor: 'bg-red-100 text-red-700',
    },
    ...(isCentralAdmin
      ? [
          {
            id: 'registrations',
            label: 'Master Registrations',
            icon: Database,
            sublabel: 'Sites, Items, Teams (Admin Only)',
            isHighlighted: true,
          },
        ]
      : []),
    {
      id: 'items',
      label: 'Items (Excel Import)',
      icon: FileSpreadsheet,
      sublabel: isCentralAdmin ? 'Import .xlsx, Catalog & Specs' : 'Catalog Specifications (Read-Only)',
    },
    {
      id: 'machinery',
      label: 'Machinery & Equipment',
      icon: Truck,
      sublabel: 'Plant Fleet, Heavy Tools & Equipment',
    },
    {
      id: 'main-stock',
      label: 'Main Stock (Central)',
      icon: Boxes,
      sublabel: isCentralAdmin ? 'Purchase & Manual Entry' : 'Central Balances (Read-Only)',
    },
    ...(isCentralAdmin
      ? [
          {
            id: 'procurement',
            label: 'Supplier Orders (PO)',
            icon: ShoppingCart,
            sublabel: 'Main Stock Requisition & Suppliers',
          },
        ]
      : []),
    {
      id: 'projects',
      label: 'Project Registry (CSV)',
      icon: FolderKanban,
      sublabel: 'Import CSV, District & Ref',
    },
    ...(isCentralAdmin
      ? [
          {
            id: 'manage-users',
            label: 'Manage Users & Roles',
            icon: UserPlus,
            sublabel: 'User Accounts & Site Permissions',
          },
        ]
      : []),
    {
      id: 'requests',
      label: 'Request Stock to Site',
      icon: ArrowRightLeft,
      badge: pendingRequestsCount > 0 ? `${pendingRequestsCount}` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
      sublabel: 'Requisitions & Request Note',
    },
    {
      id: 'dispatch',
      label: 'Issue to Teams',
      icon: Send,
      sublabel: 'Daily Dispatch (+ Items)',
    },
    {
      id: 'project-usage',
      label: 'Project Material Usage',
      icon: Layers,
      sublabel: 'Enter Used Items & Slips',
    },
    {
      id: 'returns',
      label: 'Team Returns (To Branch)',
      icon: RotateCcw,
      sublabel: 'Recovery & Custody Adj.',
    },
    {
      id: 'branch-returns',
      label: 'Branch Return to Main',
      icon: ArrowUpLeft,
      sublabel: 'Site Yard to Central Main',
    },
    {
      id: 'team-stock',
      label: 'Team In-Hand Stock',
      icon: Users2,
      sublabel: 'Dedicated Active Balance',
    },
    {
      id: 'site-stock',
      label: 'Site Branch Stock',
      icon: Building2,
      sublabel: 'Local Yard Balances',
    },
    {
      id: 'audit',
      label: 'Audit Trail & Reports',
      icon: FileText,
      sublabel: 'Transaction History Logs',
    },
    {
      id: 'templates',
      label: 'Letterhead & Templates',
      icon: Award,
      sublabel: 'Signers & Designations',
    },
    {
      id: 'recycle-bin',
      label: 'Recycle Bin',
      icon: Trash2,
      badge: recycleBinCount > 0 ? `${recycleBinCount}` : undefined,
      badgeColor: 'bg-rose-100 text-rose-700',
      sublabel: 'Restore & Soft Delete',
    },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-slate-200 shrink-0">
      <div className="p-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
          Operations Navigation
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors group ${
                  isActive
                    ? `${currentTheme.navActiveBg}`
                    : (item as any).isHighlighted
                    ? 'bg-amber-500/10 border border-amber-500/40 text-amber-900 hover:bg-amber-500/20 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? currentTheme.navActiveIcon : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <div className="truncate text-left">
                    <div className="truncate">{item.label}</div>
                    {item.sublabel && (
                      <div
                        className={`text-[10px] font-normal truncate ${
                          isActive ? 'text-slate-200' : 'text-slate-500'
                        }`}
                      >
                        {item.sublabel}
                      </div>
                    )}
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ml-1.5 ${
                      isActive ? 'bg-black/30 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Card & Sign Out Button */}
        <div className="mt-4 pt-3 border-t border-slate-200">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2.5 min-w-0 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                {currentUser?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U'}
              </div>
              <div className="truncate min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {currentUser?.fullName}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold truncate">
                  {currentUser?.role}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
              }}
              className="w-full py-2 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer group active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5 text-white" />
              <span>Log Out (ඉවත් වන්න)</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
