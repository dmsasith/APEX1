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
  Trash2,
  FolderKanban,
  Layers,
  ArrowUpLeft,
  Award,
  LogOut,
  ShoppingCart,
  Truck,
  Compass,
  IdCard,
  Gift,
} from 'lucide-react';
import { useStock } from '../context/StockContext';
import { getThemeConfig } from '../utils/themeUtils';
import { isSuperAdmin, isCentralOrAllSiteAdmin } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({ currentTab, onSelectTab }) => {
  const { config, pendingRequestsCount, totalLowStockAlertsCount, recycleBinCount, currentUser, logout } = useStock();
  const theme = getThemeConfig(config?.glassTone);
  const isCentralAdmin = isSuperAdmin(currentUser?.role) || currentUser?.username === 'admin';
  const canAccessProcurement = isCentralOrAllSiteAdmin(currentUser?.role) || currentUser?.username === 'admin';

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
        {
          id: 'registrations',
          label: 'Master Registrations',
          icon: Database,
        },
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
        ...(canAccessProcurement
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
          label: 'Project & New Section Registry',
          icon: FolderKanban,
        },
        {
          id: 'project-usage',
          label: 'Material Usage / Daily Progress Entry',
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
    <aside className="w-68 xl:w-72 shrink-0 flex flex-col">
      <div className={`relative overflow-hidden rounded-[28px] ${theme.navContainerBg} border border-white/15 shadow-[0_22px_50px_-14px_rgba(3,7,18,0.55),inset_0_1px_0_rgba(255,255,255,0.22)] flex-1 flex flex-col justify-between transition-colors duration-200`}>
        {/* Top Specular Crystal Rule matching Active Glass Tone */}
        <div className={`h-[2px] w-full ${theme.topRuleBg} shrink-0`} />

        {/* Subtle Ambient Glass Refraction Glows */}
        <div className={`pointer-events-none absolute -top-20 -left-16 w-48 h-48 rounded-full ${theme.navGlowPrimary} blur-3xl`} />
        <div className={`pointer-events-none absolute bottom-12 -right-16 w-44 h-44 rounded-full ${theme.navGlowSecondary} blur-3xl`} />

        <div className="relative z-10 p-4 flex-1 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className={`text-[11px] font-extrabold uppercase tracking-widest ${theme.navTitleBox} border rounded-2xl px-3.5 py-2.5 mb-4 flex items-center justify-between shadow-[0_8px_20px_-8px_rgba(2,6,18,0.6),inset_0_1px_0_rgba(255,255,255,0.16)]`}>
              <span>Workspace Navigation</span>
              <Compass className={`w-3.5 h-3.5 ${theme.accentText}`} />
            </div>

            <nav className="space-y-3.5">
              {navSections.map((section, sIdx) => {
                if (!section.items || section.items.length === 0) return null;
                return (
                  <div
                    key={sIdx}
                    className="bg-white/[0.04] border border-white/[0.09] rounded-2xl p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  >
                    {section.title && (
                      <div className={`text-[10px] font-extrabold uppercase tracking-wider ${theme.navSectionLabel} px-2.5 py-1 mb-1 flex items-center justify-between`}>
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
                            className={`group w-full text-left px-3 py-2.5 rounded-xl text-[13px] flex items-center justify-between cursor-pointer transition-colors duration-100 ${
                              isActive
                                ? theme.navActiveBg
                                : 'font-semibold text-slate-200 hover:bg-white/[0.08] hover:text-white border border-transparent hover:border-white/12'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-colors duration-100 ${
                                  isActive ? theme.navActiveIconWell : theme.navIconInactive
                                }`}
                              >
                                <Icon className="w-4 h-4 shrink-0" />
                              </div>
                              <span className="leading-snug">{item.label}</span>
                            </div>

                            {item.badge && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums shadow-xs ${
                                  isActive ? theme.navActiveBadge : item.badgeColor
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
          <div className="mt-5 pt-4 border-t border-white/12">
            <div className={`${theme.headerPillBg} border rounded-2xl p-3 mb-2.5 shadow-[0_8px_20px_-10px_rgba(2,6,18,0.65),inset_0_1px_0_rgba(255,255,255,0.14)]`}>
              <div className="text-[13px] font-extrabold text-white truncate">
                {currentUser?.fullName}
              </div>
              <div className={`text-[11px] font-semibold ${theme.accentText} truncate mt-0.5`}>
                {currentUser?.role}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
              }}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-white/[0.07] hover:bg-rose-500/20 text-slate-100 hover:text-rose-200 border border-white/15 hover:border-rose-400/40 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-[0_6px_16px_-6px_rgba(2,6,18,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Workspace</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
});
