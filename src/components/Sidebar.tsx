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
  IdCard,
  Gift,
} from 'lucide-react';
import { useStock } from '../context/StockContext';
import { getThemeConfig } from '../utils/themeUtils';
import { isSuperAdmin } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { pendingRequestsCount, totalLowStockAlertsCount, recycleBinCount, currentUser, logout, config, currentTenant } = useStock();
  const currentTheme = getThemeConfig(config?.themeId || config?.logoColor || 'emerald');
  const isCentralAdmin = isSuperAdmin(currentUser?.role) || currentUser?.username === 'admin';
  const isMasterOwner = (currentTenant?.id === 'tenant-apex-main' || currentUser?.username === 'admin') && isCentralAdmin;

  // Grouped Navigation Items in Logical Operations Workflow Flow
  const navSections: Array<{ title?: string; items: any[] }> = [
    {
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Overview',
          icon: LayoutDashboard,
          badge: totalLowStockAlertsCount > 0 ? `${totalLowStockAlertsCount}` : undefined,
          badgeColor: 'bg-red-500 text-white',
        },
        ...(isCentralAdmin
          ? [
              {
                id: 'registrations',
                label: 'Master Registrations',
                icon: Database,
              },
            ]
          : []),
      ],
    },
    {
      title: 'Procurement & Main Stock',
      items: [
        {
          id: 'main-stock',
          label: 'Main Central Stock',
          icon: Boxes,
        },
        {
          id: 'client-free-stock',
          label: 'Client Free Stock (FOC)',
          icon: Gift,
        },
        ...(isCentralAdmin
          ? [
              {
                id: 'procurement',
                label: 'Supplier Orders (PO)',
                icon: ShoppingCart,
              },
            ]
          : []),
        {
          id: 'items',
          label: 'Item Catalog',
          icon: FileSpreadsheet,
        },
      ],
    },
    {
      title: 'Site Operations',
      items: [
        {
          id: 'requests',
          label: 'Stock Requisitions',
          icon: ArrowRightLeft,
          badge: pendingRequestsCount > 0 ? `${pendingRequestsCount}` : undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'site-stock',
          label: 'Site Branch Stock',
          icon: Building2,
        },
        {
          id: 'dispatch',
          label: 'Issue to Teams',
          icon: Send,
        },
        {
          id: 'branch-directory',
          label: 'Branch Staff & Teams',
          icon: IdCard,
        },
        {
          id: 'team-stock',
          label: 'Team In-Hand Stock',
          icon: Users2,
        },
      ],
    },
    {
      title: 'Projects & Returns',
      items: [
        {
          id: 'projects',
          label: 'Project Registry',
          icon: FolderKanban,
        },
        {
          id: 'project-usage',
          label: 'Material Usage',
          icon: Layers,
        },
        {
          id: 'returns',
          label: 'Team Returns',
          icon: RotateCcw,
        },
        {
          id: 'branch-returns',
          label: 'Branch Returns',
          icon: ArrowUpLeft,
        },
      ],
    },
    {
      title: 'System Management',
      items: [
        {
          id: 'machinery',
          label: 'Plant & Equipment',
          icon: Truck,
        },
        ...(isCentralAdmin
          ? [
              {
                id: 'manage-users',
                label: 'User Management',
                icon: UserPlus,
              },
            ]
          : []),
        {
          id: 'audit',
          label: 'Audit Trail',
          icon: FileText,
        },
        {
          id: 'templates',
          label: 'Document Templates',
          icon: Award,
        },
        {
          id: 'recycle-bin',
          label: 'Recycle Bin',
          icon: Trash2,
          badge: recycleBinCount > 0 ? `${recycleBinCount}` : undefined,
          badgeColor: 'bg-slate-500 text-white',
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 shrink-0 flex flex-col h-full">
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 px-3 py-1.5 bg-slate-200/70 border border-slate-300/80 rounded-md mb-3 flex items-center justify-between">
          <span>Navigation Menu</span>
        </div>

        <nav className="space-y-5">
          {navSections.map((section, sIdx) => {
            if (!section.items || section.items.length === 0) return null;
            return (
              <div key={sIdx}>
                {section.title && (
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 px-3 py-1 bg-slate-200/60 border border-slate-300/60 rounded-md mb-2 flex items-center justify-between">
                    <span>{section.title}</span>
                  </div>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectTab(item.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium flex items-center justify-between transition-colors ${
                          isActive
                            ? 'bg-slate-200 text-slate-900'
                            : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.badgeColor
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Profile Card & Sign Out Button */}
        <div className="mt-8 pt-4 border-t border-slate-200">
          <div className="px-3 mb-3">
            <div className="text-[13px] font-bold text-slate-900 truncate">
              {currentUser?.fullName}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {currentUser?.role}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
            }}
            className="w-full py-2 px-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
