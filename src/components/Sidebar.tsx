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
    <aside className="w-72 pl-4 sm:pl-6 py-6 shrink-0 flex flex-col">
      <div className="liquid-glass-panel rounded-[28px] p-4 flex-1 flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-700 px-3.5 py-2 bg-white/70 border border-white/95 rounded-2xl mb-4 flex items-center justify-between shadow-[0_4px_12px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)]">
            <span>Workspace Navigation</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          </div>

          <nav className="space-y-4">
            {navSections.map((section, sIdx) => {
              if (!section.items || section.items.length === 0) return null;
              return (
                <div key={sIdx} className="bg-white/35 border border-white/70 rounded-2xl p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                  {section.title && (
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-2.5 py-1 mb-1 flex items-center justify-between">
                      <span>{section.title}</span>
                    </div>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => onSelectTab(item.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-between cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                            isActive
                              ? `${currentTheme.navActiveBg} scale-[1.01]`
                              : 'text-slate-700 hover:bg-white/80 hover:text-slate-950 hover:translate-x-1 hover:shadow-[0_4px_12px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] border border-transparent hover:border-white/90'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isActive
                                  ? 'bg-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]'
                                  : 'bg-white/75 text-slate-600 border border-white/90 shadow-2xs'
                              }`}
                            >
                              <Icon className="w-4 h-4 shrink-0" />
                            </div>
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-xs ${
                                isActive ? 'bg-white text-slate-900' : item.badgeColor
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
        </div>

        {/* User Profile Card & Sign Out Button */}
        <div className="mt-6 pt-4 border-t border-white/75">
          <div className="bg-white/65 border border-white/90 rounded-2xl p-3 mb-2.5 shadow-[0_4px_14px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.95)]">
            <div className="text-[13px] font-extrabold text-slate-900 truncate">
              {currentUser?.fullName}
            </div>
            <div className="text-[11px] font-medium text-emerald-700 truncate mt-0.5">
              {currentUser?.role}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
            }}
            className="w-full py-2.5 px-3.5 rounded-2xl bg-white/80 hover:bg-rose-50/90 text-slate-800 hover:text-rose-700 border border-white/95 hover:border-rose-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_12px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,1)]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Workspace</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
