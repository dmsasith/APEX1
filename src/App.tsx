/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StockProvider } from './context/StockContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { MainStockView } from './components/mainStock/MainStockView';
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
import { useStock } from './context/StockContext';
import { getThemeConfig } from './utils/themeUtils';

function MainAppContent({ onReturnToGateway }: { onReturnToGateway?: () => void } = {}) {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const { config, currentUser, currentTenant } = useStock();
  const theme = getThemeConfig(config?.themeId || config?.logoColor);
  const isCentralAdmin = currentUser?.role === 'Central Warehouse Admin';
  const isMasterOwner = (currentTenant?.id === 'tenant-apex-main' || currentUser?.username === 'admin') && isCentralAdmin;

  useEffect(() => {
    const handleNav = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setCurrentTab(customEvent.detail);
      }
    };
    window.addEventListener('app-navigate', handleNav);
    return () => window.removeEventListener('app-navigate', handleNav);
  }, []);

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
    <div className={`min-h-screen ${theme.pageBg} flex flex-col font-sans transition-colors duration-200`}>
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

      {/* Mobile Horizontal Sub-Navigation */}
      <div className="lg:hidden bg-white border-b border-slate-200 overflow-x-auto no-print px-3 py-2 flex items-center gap-1.5 scrollbar-thin">
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'items', label: 'Items (Excel)' },
          { id: 'machinery', label: 'Machinery & Tools' },
          { id: 'main-stock', label: 'Main Stock' },
          ...(isCentralAdmin ? [{ id: 'procurement', label: 'Supplier Orders (PO)' }] : []),
          { id: 'projects', label: 'Projects (CSV)' },
          { id: 'registrations', label: 'Master Setup' },
          { id: 'manage-users', label: 'Manage Users' },
          { id: 'requests', label: 'Site Requests' },
          { id: 'dispatch', label: 'Issue to Teams' },
          { id: 'project-usage', label: 'Used in Projects' },
          { id: 'returns', label: 'Team Returns' },
          { id: 'branch-returns', label: 'Branch Return' },
          { id: 'team-stock', label: 'Team In-Hand' },
          { id: 'site-stock', label: 'Site Inventories' },
          { id: 'audit', label: 'Audit Trail' },
          { id: 'templates', label: 'Templates & Signers' },
          { id: 'recycle-bin', label: 'Recycle Bin' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              currentTab === tab.id
                ? `${theme.primaryBtn} shadow-xs`
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Body with Desktop Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <div className="hidden lg:block no-print">
          <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />
        </div>

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          {renderActiveView()}
        </main>
      </div>
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
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between text-xs">
          <div className="font-bold text-emerald-400 flex items-center gap-2">
            <span>👑 SaaS Platform Master Owner Panel</span>
          </div>
          <button
            type="button"
            onClick={() => setDeveloperPortalChoice('pending')}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition cursor-pointer"
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
