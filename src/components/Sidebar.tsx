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

  // Grouped Navigation Items in Logical Operations Workflow Flow
  const navSections: Array<{ title?: string; titleClass?: string; items: any[] }> = [
    {
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Overview',
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
                sublabel: 'Sites, Items, Teams (Admin Setup)',
                isHighlighted: true,
              },
            ]
          : []),
      ],
    },
    {
      title: 'Central Yard & Procurement',
      titleClass: 'text-emerald-900 bg-emerald-100/80 border border-emerald-300/80',
      items: [
        {
          id: 'main-stock',
          label: 'Main Stock (Central)',
          icon: Boxes,
          sublabel: isCentralAdmin ? 'Purchases, Yard Balances & Entry' : 'Central Balances (Read-Only)',
        },
        ...(isCentralAdmin
          ? [
              {
                id: 'procurement',
                label: 'Supplier Orders (PO)',
                icon: ShoppingCart,
                sublabel: 'Supplier Requisitions & Delivery Notes',
              },
            ]
          : []),
        {
          id: 'items',
          label: 'Items (Excel Import)',
          icon: FileSpreadsheet,
          sublabel: isCentralAdmin ? 'Import .xlsx, Catalog & Specs' : 'Catalog Specifications (Read-Only)',
        },
      ],
    },
    {
      title: 'Branch Requisition & Yard',
      titleClass: 'text-amber-900 bg-amber-100/80 border border-amber-300/80',
      items: [
        {
          id: 'requests',
          label: 'Request Stock to Site',
          icon: ArrowRightLeft,
          badge: pendingRequestsCount > 0 ? `${pendingRequestsCount}` : undefined,
          badgeColor: 'bg-amber-200 text-amber-900',
          sublabel: 'Requisitions & Request Note (Gate Pass)',
        },
        {
          id: 'site-stock',
          label: 'Site Branch Stock',
          icon: Building2,
          sublabel: 'Local Branch Yard Balances',
        },
      ],
    },
    {
      title: 'Field Teams & Custody',
      titleClass: 'text-blue-900 bg-blue-100/80 border border-blue-300/80',
      items: [
        {
          id: 'dispatch',
          label: 'Issue to Teams',
          icon: Send,
          sublabel: 'Daily Field Dispatch (+ Items)',
        },
        {
          id: 'team-stock',
          label: 'Team In-Hand Stock',
          icon: Users2,
          sublabel: 'Active Balance in Team Custody',
        },
      ],
    },
    {
      title: 'Projects & Material Usage',
      titleClass: 'text-teal-900 bg-teal-100/80 border border-teal-300/80',
      items: [
        {
          id: 'projects',
          label: 'Project Registry (CSV)',
          icon: FolderKanban,
          sublabel: 'Sections, BOM Templates & Import CSV',
        },
        {
          id: 'project-usage',
          label: 'Project Material Usage',
          icon: Layers,
          sublabel: 'Enter Used Slips, BOM & Multi-Team',
        },
      ],
    },
    {
      title: 'Field Returns & Transfers',
      titleClass: 'text-rose-900 bg-rose-100/80 border border-rose-300/80',
      items: [
        {
          id: 'returns',
          label: 'Team Returns (To Branch)',
          icon: RotateCcw,
          sublabel: 'Recovery & Custody Adjustments',
        },
        {
          id: 'branch-returns',
          label: 'Branch Return to Main',
          icon: ArrowUpLeft,
          sublabel: 'Site Yard to Central Main Yard',
        },
      ],
    },
    {
      title: 'Plant & Fleet',
      titleClass: 'text-purple-900 bg-purple-100/80 border border-purple-300/80',
      items: [
        {
          id: 'machinery',
          label: 'Machinery & Equipment',
          icon: Truck,
          sublabel: 'Plant Fleet, Heavy Tools & Equipment',
        },
      ],
    },
    {
      title: 'Governance & Setup',
      titleClass: 'text-slate-900 bg-slate-200/90 border border-slate-300',
      items: [
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
          id: 'audit',
          label: 'Audit Trail & Reports',
          icon: FileText,
          sublabel: 'Transaction History & Activity Logs',
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
      ],
    },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-slate-200 shrink-0 flex flex-col h-full">
      <div className="p-3 flex-1 overflow-y-auto scrollbar-thin">
        <div className="text-xs font-black uppercase tracking-wider text-slate-700 px-2.5 mb-2.5 flex items-center justify-between">
          <span>Operations Navigation</span>
          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 shadow-2xs">
            Workflow
          </span>
        </div>

        <nav className="space-y-3.5">
          {navSections.map((section, sIdx) => {
            if (!section.items || section.items.length === 0) return null;
            return (
              <div key={sIdx} className={sIdx > 0 ? 'pt-1.5' : ''}>
                {section.title && (
                  <div
                    className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md mb-1.5 flex items-center justify-between shadow-2xs ${
                      section.titleClass || 'text-slate-800 bg-slate-100'
                    }`}
                  >
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
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-between transition-all group ${
                          isActive
                            ? `${currentTheme.navActiveBg} shadow-xs`
                            : (item as any).isHighlighted
                            ? 'bg-amber-500/15 border border-amber-500/50 text-amber-950 hover:bg-amber-500/25 shadow-2xs'
                            : 'text-slate-800 hover:bg-slate-100/90 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4.5 h-4.5 shrink-0 ${
                              isActive ? currentTheme.navActiveIcon : 'text-slate-500 group-hover:text-slate-800'
                            }`}
                          />
                          <div className="truncate text-left">
                            <div className="truncate text-[13px] font-bold leading-snug">{item.label}</div>
                            {item.sublabel && (
                              <div
                                className={`text-[11px] font-medium truncate mt-0.5 ${
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
                            className={`px-2 py-0.5 rounded-md text-[11px] font-black shrink-0 ml-1.5 shadow-2xs ${
                              isActive ? 'bg-black/40 text-white' : item.badgeColor
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
