/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Boxes,
  ArrowRightLeft,
  Building2,
  Layers,
  LayoutGrid,
  X,
  Database,
  Gift,
  ShoppingCart,
  FileSpreadsheet,
  Send,
  IdCard,
  Users2,
  FolderKanban,
  RotateCcw,
  ArrowUpLeft,
  Truck,
  UserPlus,
  FileText,
  Award,
  Trash2,
} from 'lucide-react';
import { StockProvider } from './context/StockContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { MainStockView } from './components/mainStock/MainStockView';
import { ClientFreeIssueView } from './components/mainStock/ClientFreeIssueView';
import { MasterRegistrationsView } from './components/registrations/MasterRegistrationsView';
import { StockRequestsView } from './components/requests/StockRequestsView';
import { IssueToTeamsView } from './components/dispatch/IssueToTeamsView';
import { TeamReturnsView } from './components/returns/TeamReturnsView';
import { BranchStockReturnView } from './components/returns/BranchStockReturnView';
import { TeamInHandDashboard } from './components/teamStock/TeamInHandDashboard';
import { SiteInventoriesView } from './components/siteStock/SiteInventoriesView';
import { AuditTrailReportsView } from './components/audit/AuditTrailReportsView';
import { RecycleBinView } from './components/recycleBin/RecycleBinView';
import { ItemsManagementView } from './components/items/ItemsManagementView';
import { ProjectsManagementView } from './components/projects/ProjectsManagementView';
import { ProjectMaterialUsageView } from './components/projects/ProjectMaterialUsageView';
import { LetterheadTemplatesView } from './components/templates/LetterheadTemplatesView';
import { ProcurementView } from './components/procurement/ProcurementView';
import { LoginScreen } from './components/auth/LoginScreen';
import { LandingPage } from './components/landing/LandingPage';
import { SaasMasterAdminView } from './components/saas/SaasMasterAdminView';
import { TrialExpiredOverlay } from './components/saas/TrialExpiredOverlay';
import { AdminPreviewBanner } from './components/common/AdminPreviewBanner';
import { TenantPreviewBanner } from './components/common/TenantPreviewBanner';
import { DeveloperPortalGateway } from './components/saas/DeveloperPortalGateway';
import { BranchDirectoryView } from './components/directory/BranchDirectoryView';
import { useStock } from './context/StockContext';
import { getThemeConfig } from './utils/themeUtils';
import { isSuperAdmin } from './types';

function MainAppContent({ onReturnToGateway }: { onReturnToGateway?: () => void } = {}) {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [showMobileGlassMenu, setShowMobileGlassMenu] = useState(false);
  const { config, currentUser, currentTenant, pendingRequestsCount } = useStock();
  const theme = getThemeConfig(config?.themeId || config?.logoColor);
  const isCentralAdmin = isSuperAdmin(currentUser?.role) || currentUser?.username === 'admin';
  const isMasterOwner = (currentTenant?.id === 'tenant-apex-main' || currentUser?.username === 'admin') && isCentralAdmin;

  useEffect(() => {
    const handleNav = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setCurrentTab(customEvent.detail);
        setShowMobileGlassMenu(false);
      }
    };
    window.addEventListener('app-navigate', handleNav);
    return () => window.removeEventListener('app-navigate', handleNav);
  }, []);

  const allMobileModules = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(isCentralAdmin ? [{ id: 'registrations', label: 'Master Setup', icon: Database }] : []),
    { id: 'main-stock', label: '1. Main Stock', icon: Boxes },
    { id: 'client-free-stock', label: 'Client Free Stock', icon: Gift },
    ...(isCentralAdmin ? [{ id: 'procurement', label: 'Supplier PO', icon: ShoppingCart }] : []),
    { id: 'items', label: 'Items & Catalog', icon: FileSpreadsheet },
    { id: 'requests', label: '2. Site Requests', icon: ArrowRightLeft },
    { id: 'site-stock', label: 'Branch Stock', icon: Building2 },
    { id: 'branch-directory', label: 'Branch Staff & Teams', icon: IdCard },
    { id: 'dispatch', label: '3. Issue to Teams', icon: Send },
    { id: 'team-stock', label: 'Team In-Hand', icon: Users2 },
    { id: 'projects', label: '4. Project Registry', icon: FolderKanban },
    { id: 'project-usage', label: '5. Material Usage', icon: Layers },
    { id: 'returns', label: '6. Team Returns', icon: RotateCcw },
    { id: 'branch-returns', label: '7. Branch Return', icon: ArrowUpLeft },
    { id: 'machinery', label: 'Machinery & Tools', icon: Truck },
    ...(isCentralAdmin ? [{ id: 'manage-users', label: 'Manage Users', icon: UserPlus }] : []),
    { id: 'audit', label: 'Audit Trail', icon: FileText },
    { id: 'templates', label: 'Templates', icon: Award },
    { id: 'recycle-bin', label: 'Recycle Bin', icon: Trash2 },
  ];

  const primaryBottomDockItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'main-stock', label: 'Main Stock', icon: Boxes },
    {
      id: 'requests',
      label: 'Requests',
      icon: ArrowRightLeft,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
    },
    { id: 'site-stock', label: 'Site Stock', icon: Building2 },
    { id: 'project-usage', label: 'Usage', icon: Layers },
  ];

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'items':
      case 'items-management':
        return <ItemsManagementView initialType="all" />;
      case 'machinery':
      case 'machinery-equipment':
        return <ItemsManagementView initialType="Machinery" />;
      case 'main-stock':
        return <MainStockView />;
      case 'client-free-stock':
      case 'client-free-issue':
      case 'foc-stock':
        return <ClientFreeIssueView />;
      case 'procurement':
      case 'purchase-orders':
        return <ProcurementView />;
      case 'projects':
      case 'project-management':
        return <ProjectsManagementView />;
      case 'project-usage':
        return <ProjectMaterialUsageView />;
      case 'registrations':
      case 'master-registrations':
        return <MasterRegistrationsView initialTab="items" />;
      case 'manage-users':
      case 'users':
        return <MasterRegistrationsView initialTab="users" />;
      case 'sites':
        return <MasterRegistrationsView initialTab="sites" />;
      case 'teams':
        return <MasterRegistrationsView initialTab="teams" />;
      case 'requests':
        return <StockRequestsView />;
      case 'dispatch':
        return <IssueToTeamsView />;
      case 'returns':
        return <TeamReturnsView />;
      case 'branch-returns':
        return <BranchStockReturnView />;
      case 'team-stock':
        return <TeamInHandDashboard />;
      case 'site-stock':
        return <SiteInventoriesView />;
      case 'branch-directory':
      case 'branch-staff-teams':
        return <BranchDirectoryView onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'audit':
        return <AuditTrailReportsView />;
      case 'templates':
      case 'letterhead':
        return <LetterheadTemplatesView />;
      case 'recycle-bin':
        return <RecycleBinView />;
      case 'saas-owner':
      case 'saas-master':
        return <SaasMasterAdminView />;
      default:
        return <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <div className={`min-h-screen liquid-glass-shell liquid-glass-canvas ${theme.pageBg} flex flex-col font-sans transition-colors duration-200`}>
      {/* Admin View-As Preview Banner */}
      <AdminPreviewBanner />

      {/* SaaS Tenant Preview Banner */}
      <TenantPreviewBanner />

      {/* Trial Expired Lock Overlay (Blocks app when trial ends until upgraded) */}
      <TrialExpiredOverlay />

      {/* Top Layout Header with Dynamic Company & System Name */}
      <Header
        onOpenPendingRequests={() => setCurrentTab('requests')}
        onOpenRecycleBin={() => setCurrentTab('recycle-bin')}
        onReturnToGateway={onReturnToGateway}
      />

      {/* Mobile Horizontal Frosted Glass Sub-Navigation Pill Strip */}
      <div className="lg:hidden bg-white/55 backdrop-blur-xl border-b border-white/80 overflow-x-auto no-print px-3 py-2 flex items-center gap-1.5 scrollbar-thin">
        {allMobileModules.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentTab === tab.id
                ? `${theme.primaryBtn}`
                : 'text-slate-700 bg-white/70 hover:bg-white/95 border border-white/90 shadow-2xs'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Body with Sleek Glass Desktop Sidebar */}
      <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
        <div className="hidden lg:block no-print">
          <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />
        </div>

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 pb-28 lg:pb-10 overflow-y-auto min-w-0">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Apple Liquid Glass Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-3 left-3 right-3 z-40 no-print liquid-glass-dock rounded-[26px] px-2 py-1.5 flex items-center justify-around"
      >
        {primaryBottomDockItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id && !showMobileGlassMenu;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setCurrentTab(item.id);
                setShowMobileGlassMenu(false);
              }}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600/90 text-white shadow-[0_6px_16px_-3px_rgba(16,185,129,0.5),inset_0_1px_0_rgba(255,255,255,0.6)] scale-105'
                  : 'text-slate-700 hover:bg-white/70'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-bold mt-0.5 whitespace-nowrap">{item.label}</span>
              {item.badge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-extrabold flex items-center justify-center shadow-xs">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowMobileGlassMenu((prev) => !prev)}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            showMobileGlassMenu
              ? 'bg-slate-900 text-white shadow-md scale-105'
              : 'text-slate-700 hover:bg-white/70'
          }`}
        >
          {showMobileGlassMenu ? <X className="w-4 h-4 shrink-0" /> : <LayoutGrid className="w-4 h-4 shrink-0" />}
          <span className="text-[10px] font-bold mt-0.5 whitespace-nowrap">All Apps</span>
        </button>
      </nav>

      {/* Mobile Liquid Glass Full Module Launcher Drawer */}
      {showMobileGlassMenu && (
        <div className="lg:hidden fixed inset-0 z-30 bg-slate-900/35 backdrop-blur-md flex flex-col justify-end p-3 pb-24 no-print">
          <div className="liquid-glass-panel rounded-[28px] p-4 max-h-[72vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/80">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">All Workspace Modules</h3>
                <p className="text-[11px] text-slate-600">Select any module to open</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileGlassMenu(false)}
                className="p-1.5 rounded-xl bg-white/80 text-slate-700 border border-white/95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allMobileModules.map((mod) => {
                const Icon = mod.icon;
                const active = currentTab === mod.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => {
                      setCurrentTab(mod.id);
                      setShowMobileGlassMenu(false);
                    }}
                    className={`p-3 rounded-2xl text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-600 text-white shadow-md border border-white/40'
                        : 'bg-white/75 hover:bg-white text-slate-800 border border-white/95 shadow-2xs'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-emerald-600'}`} />
                    <span className="text-xs font-bold truncate">{mod.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AppRoot() {
  const { isAuthenticated, authUser, currentUser, currentTenant, exitTenantPreview, exitViewAsMode, switchToMasterStock } = useStock();
  const [unauthView, setUnauthView] = useState<'landing' | 'login'>('landing');
  const [developerPortalChoice, setDeveloperPortalChoice] = useState<'pending' | 'saas' | 'stock'>('pending');

  const isMasterDeveloper =
    authUser?.username === 'admin' ||
    currentUser?.username === 'admin' ||
    currentTenant?.id === 'tenant-apex-main';

  // Only reset gateway choice if user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setDeveloperPortalChoice('pending');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    if (unauthView === 'landing') {
      return <LandingPage onOpenLogin={() => setUnauthView('login')} />;
    }
    return <LoginScreen onBackToLanding={() => setUnauthView('landing')} />;
  }

  // Developer Portal Gateway: Strictly for choosing between SaaS Owner and Apex Developer Stock
  if (isMasterDeveloper && developerPortalChoice === 'pending') {
    return (
      <DeveloperPortalGateway
        onSelectSaasOwner={() => {
          exitTenantPreview();
          exitViewAsMode();
          setDeveloperPortalChoice('saas');
        }}
        onSelectStockManager={() => {
          switchToMasterStock();
          setDeveloperPortalChoice('stock');
        }}
      />
    );
  }

  if (isMasterDeveloper && developerPortalChoice === 'saas') {
    return (
      <div className="min-h-screen liquid-glass-shell liquid-glass-canvas flex flex-col">
        <div className="bg-white/75 backdrop-blur-2xl border-b border-white/85 px-6 py-3 flex items-center justify-between text-xs shadow-sm">
          <div className="font-extrabold text-emerald-700 flex items-center gap-2">
            <span>👑 SaaS Platform Master Owner Panel</span>
          </div>
          <button
            type="button"
            onClick={() => setDeveloperPortalChoice('pending')}
            className="px-3.5 py-1.5 bg-white/85 hover:bg-white text-slate-800 border border-white/95 rounded-xl font-bold shadow-xs transition cursor-pointer"
          >
            ← Back to Portal Gateway Choice
          </button>
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <SaasMasterAdminView />
        </main>
      </div>
    );
  }

  return (
    <MainAppContent
      onReturnToGateway={isMasterDeveloper ? () => setDeveloperPortalChoice('pending') : undefined}
    />
  );
}

export default function App() {
  return (
    <StockProvider>
      <AppRoot />
    </StockProvider>
  );
}
