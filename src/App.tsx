/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import { useStock } from './context/StockContext';
import { getThemeConfig } from './utils/themeUtils';

function MainAppContent() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const { config } = useStock();
  const theme = getThemeConfig(config?.themeId || config?.logoColor);

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'items':
      case 'items-management':
        return <ItemsManagementView />;
      case 'main-stock':
        return <MainStockView />;
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
      default:
        return <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <div className={`min-h-screen ${theme.pageBg} flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Layout Header with Dynamic Company & System Name */}
      <Header
        onOpenPendingRequests={() => setCurrentTab('requests')}
        onOpenRecycleBin={() => setCurrentTab('recycle-bin')}
      />

      {/* Mobile Horizontal Sub-Navigation */}
      <div className="lg:hidden bg-white border-b border-slate-200 overflow-x-auto no-print px-3 py-2 flex items-center gap-1.5 scrollbar-thin">
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'items', label: 'Items (Excel)' },
          { id: 'main-stock', label: 'Main Stock' },
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

export default function App() {
  return (
    <StockProvider>
      <MainAppContent />
    </StockProvider>
  );
}
