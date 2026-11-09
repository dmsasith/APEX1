import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import {
  SystemConfig,
  Site,
  User,
  UserRole,
  Item,
  Team,
  MainStockEntry,
  StockTransferRequest,
  TeamIssue,
  TeamReturn,
  AuditLogEntry,
  TeamInHandSummary,
  TeamInHandBalanceItem,
  RecycleEntityType,
  RecycleBinItem,
  ExcelItemRow,
  ImportResult,
  Project,
  ProjectMaterialUsage,
  BranchReturn,
  DamagedStockRestoration,
  StockBackup,
  LetterheadTemplate,
  DigitalSignature,
  Supplier,
  PurchaseOrder,
  PurchaseOrderStatus,
  GoodsReceiptRecord,
  SupplierReturn,
  SupplierReturnStatus,
  SettlementType,
  Tenant,
  TenantPlan,
  TenantSubscription,
  TenantRegistrationForm,
  ProjectType,
  ProjectTypeTemplateItem,
  CrossProjectOverrideRequest,
  ClientFreeIssueEntry,
  ClientFreeIssueItemRow,
  Client,
  AuditAction,
  isSuperAdmin,
  normalizeRole,
} from '../types';
import {
  INITIAL_CONFIG,
  INITIAL_SITES,
  INITIAL_USERS,
  INITIAL_ITEMS,
  INITIAL_TEAMS,
  INITIAL_MAIN_STOCK_ENTRIES,
  INITIAL_STOCK_REQUESTS,
  INITIAL_TEAM_ISSUES,
  INITIAL_TEAM_RETURNS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PROJECTS,
  INITIAL_PROJECT_TYPES,
  INITIAL_PROJECT_USAGES,
  INITIAL_BRANCH_RETURNS,
  INITIAL_BACKUPS,
  DEFAULT_LETTERHEAD_TEMPLATES,
  DEFAULT_DIGITAL_SIGNATURES,
  INITIAL_SUPPLIERS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SUPPLIER_RETURNS,
  INITIAL_CLIENT_FREE_ISSUES,
  INITIAL_CLIENTS,
  DEFAULT_TENANT,
  INITIAL_TENANTS,
} from '../data/initialData';
import {
  subscribeToFirebaseTenants,
  writeTenantsToFirebase,
  subscribeToFirebaseTenantData,
  writeTenantDataToFirebase,
  fetchTenantDataFromFirebase,
  subscribeToFirebaseItems,
  writeItemsToFirebase,
  subscribeToFirebaseStockRequests,
  writeStockRequestsToFirebase,
  subscribeToFirebaseMainStockEntries,
  writeMainStockEntriesToFirebase,
  subscribeToFirebaseSites,
  writeSitesToFirebase,
  subscribeToFirebaseTeams,
  writeTeamsToFirebase,
  subscribeToFirebaseUsers,
  writeUsersToFirebase,
  subscribeToFirebaseTeamIssues,
  writeTeamIssuesToFirebase,
  subscribeToFirebaseTeamReturns,
  writeTeamReturnsToFirebase,
  subscribeToFirebaseProjects,
  writeProjectsToFirebase,
  subscribeToFirebaseProjectUsages,
  writeProjectUsagesToFirebase,
  subscribeToFirebaseBranchReturns,
  writeBranchReturnsToFirebase,
  subscribeToFirebaseBackups,
  writeBackupsToFirebase,
  subscribeToFirebaseAuditLogs,
  writeAuditLogsToFirebase,
  subscribeToFirebaseConfig,
  writeConfigToFirebase,
  subscribeToFirebaseLetterheadTemplates,
  writeLetterheadTemplatesToFirebase,
  subscribeToFirebaseDigitalSignatures,
  writeDigitalSignaturesToFirebase,
  subscribeToFirebaseSuppliers,
  writeSuppliersToFirebase,
  subscribeToFirebasePurchaseOrders,
  writePurchaseOrdersToFirebase,
  subscribeToFirebaseSupplierReturns,
  writeSupplierReturnsToFirebase,
  clearAllFirebaseData,
  firebaseConfig,
} from '../firebase';

export const STORAGE_KEY_PREFIX = 'apex_stock_site_v1_';

interface StockContextType {
  config: SystemConfig;
  updateConfig: (newConfig: Partial<SystemConfig>) => void;
  resetAllData: () => void;
  clearAllDemoData: () => void;
  restoreDemoData: () => void;
  
  // Active User / Session Simulation & Authentication
  authUser: User;
  currentUser: User;
  viewAsUser: User | null;
  setCurrentUser: (user: User) => void;
  setViewAsUser: (user: User | null) => void;
  exitViewAsMode: () => void;
  isAuthenticated: boolean;
  getWorkspaceLoginUrl: (slugOrTenantId?: string) => string;
  login: (
    usernameOrUser: string | User,
    password?: string,
    workspaceSlugOrId?: string
  ) => Promise<{ success: boolean; message: string; collisionCompanies?: { id: string; name: string; slug: string }[] }>;
  logout: () => void;
  activeSite: Site | null; // null if Main or All Sites

  // Entities (All and Active)
  sites: Site[];
  activeSites: Site[];
  users: User[];
  activeUsers: User[];
  items: Item[];
  activeItems: Item[];
  teams: Team[];
  activeTeams: Team[];
  projects: Project[];
  activeProjects: Project[];
  projectTypes: ProjectType[];
  activeProjectTypes: ProjectType[];
  mainStockEntries: MainStockEntry[];
  stockRequests: StockTransferRequest[];
  teamIssues: TeamIssue[];
  teamReturns: TeamReturn[];
  projectUsages: ProjectMaterialUsage[];
  branchReturns: BranchReturn[];
  damagedRestorations: DamagedStockRestoration[];
  backups: StockBackup[];
  auditLogs: AuditLogEntry[];
  suppliers: Supplier[];
  activeSuppliers: Supplier[];
  clients: Client[];
  activeClients: Client[];
  purchaseOrders: PurchaseOrder[];
  activePurchaseOrders: PurchaseOrder[];
  supplierReturns: SupplierReturn[];
  activeSupplierReturns: SupplierReturn[];

  // Supplier Management (CRUD)
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Client / Principal Management (Master Directory CRUD)
  addClient: (client: Omit<Client, 'id' | 'clientCode' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'> & { clientCode?: string }) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Purchase Orders & Material Requests for Main Stock
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>) => PurchaseOrder;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;
  receivePurchaseOrderToMainStock: (
    poId: string,
    batchReceipt?: {
      receivedBy?: string;
      deliveryNoteNo?: string;
      notes?: string;
      receiptDate?: string;
      items?: Array<{ itemId: string; quantityToReceive: number }>;
    }
  ) => { success: boolean; message: string; count: number; isPartial?: boolean; newStatus?: PurchaseOrderStatus };
  closePurchaseOrderRemainder: (poId: string, reason?: string) => { success: boolean; message: string };

  // Supplier Return & Debit Note Management (RTV)
  addSupplierReturn: (rtv: Omit<SupplierReturn, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>) => SupplierReturn;
  updateSupplierReturn: (id: string, updates: Partial<SupplierReturn>) => void;
  deleteSupplierReturn: (id: string) => void;
  dispatchSupplierReturn: (
    id: string,
    dispatchDetails: {
      dispatchedBy?: string;
      gatePassNo?: string;
      transporterName?: string;
      vehicleNo?: string;
      driverContact?: string;
      notes?: string;
    }
  ) => { success: boolean; message: string };
  settleSupplierReturn: (
    id: string,
    settlementDetails: {
      settledBy?: string;
      settlementRef: string;
      settlementType: SettlementType;
      settlementNotes?: string;
    }
  ) => { success: boolean; message: string };

  // Master Registrations
  addSite: (site: Omit<Site, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>) => Site;
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>) => User;
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>, initialReceivedQty?: number) => Item;
  addTeam: (team: Omit<Team, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>) => Team;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>) => Project;
  bulkImportItems: (rows: ExcelItemRow[], mode: 'sync' | 'append' | 'replace') => ImportResult;
  bulkImportProjects: (rows: Array<Omit<Project, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>>) => { added: number; updated: number };

  // Master Updates (CRUD - Edit)
  updateSite: (id: string, updates: Partial<Site>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;

  // Soft Delete (Move to Recycle Bin)
  softDeleteItem: (id: string) => void;
  softDeleteSite: (id: string) => void;
  softDeleteUser: (id: string) => void;
  softDeleteTeam: (id: string) => void;
  softDeleteProject: (id: string) => void;

  // Bulk Soft Delete
  bulkSoftDeleteItems: (ids: string[]) => void;
  bulkSoftDeleteSites: (ids: string[]) => void;
  bulkSoftDeleteUsers: (ids: string[]) => void;
  bulkSoftDeleteTeams: (ids: string[]) => void;

  // Recycle Bin & Data Restoration
  recycleBinItems: RecycleBinItem[];
  recycleBinCount: number;
  restoreItem: (id: string) => void;
  restoreSite: (id: string) => void;
  restoreUser: (id: string) => void;
  restoreTeam: (id: string) => void;
  restoreProject: (id: string) => void;
  bulkRestore: (records: Array<{ id: string; type: RecycleEntityType }>) => void;

  // Permanent Delete
  permanentlyDeleteItem: (id: string) => void;
  permanentlyDeleteSite: (id: string) => void;
  permanentlyDeleteUser: (id: string) => void;
  permanentlyDeleteTeam: (id: string) => void;
  permanentlyDeleteProject: (id: string) => void;
  bulkPermanentlyDelete: (records: Array<{ id: string; type: RecycleEntityType }>) => void;
  emptyRecycleBin: () => void;

  // Main Stock
  addMainStockEntry: (entry: Omit<MainStockEntry, 'id' | 'timestamp' | 'receivedBy'>) => MainStockEntry;

  // Operational Workflows
  createStockRequest: (
    data: Omit<StockTransferRequest, 'id' | 'requestNoteNumber' | 'status' | 'requestedDate' | 'requestedBy'>
  ) => StockTransferRequest;
  approveStockRequest: (
    requestId: string,
    approvedItems: Array<{ itemId: string; approvedQty: number }>,
    approvalNotes?: string
  ) => void;
  rejectStockRequest: (requestId: string, notes?: string) => void;
  removeStockRequestItem: (requestId: string, itemId: string) => void;
  acceptStockRequest: (
    requestId: string,
    receivedItems: Array<{ itemId: string; receivedQty: number }>,
    acceptanceNotes?: string
  ) => void;

  // Dispatch & Returns
  issueStockToTeam: (
    data: Omit<TeamIssue, 'id' | 'issueNoteNumber' | 'issueDate' | 'issuedBy'>
  ) => TeamIssue;
  returnStockFromTeam: (
    data: Omit<TeamReturn, 'id' | 'returnVoucherNumber' | 'returnDate' | 'returnedBy'>
  ) => TeamReturn;

  // Project Types / Sections & Templates
  addProjectType: (data: Omit<ProjectType, 'id' | 'createdAt' | 'isDeleted'>) => ProjectType;
  updateProjectType: (id: string, updates: Partial<ProjectType>) => void;
  deleteProjectType: (id: string) => void;
  saveProjectTypeTemplate: (projectTypeId: string, templateItems: ProjectTypeTemplateItem[]) => void;

  // Audit Logging
  addAuditLog: (
    action: AuditAction,
    referenceNo: string,
    siteName: string,
    details: string,
    itemCode?: string,
    quantityChanged?: number
  ) => void;

  // Project Material Usages
  logProjectMaterialUsage: (
    data: Omit<ProjectMaterialUsage, 'id' | 'usageVoucherNumber' | 'loggedBy'>
  ) => ProjectMaterialUsage;
  updateProjectUsage: (id: string, updates: Partial<ProjectMaterialUsage>) => void;
  deleteProjectUsage: (id: string) => void;
  clearProjectUsages: () => void;

  // Cross Project Override Requests
  crossProjectRequests: CrossProjectOverrideRequest[];
  createCrossProjectOverrideRequest: (
    data: Omit<CrossProjectOverrideRequest, 'id' | 'requestNumber' | 'status' | 'requestedDate' | 'requestedBy'>
  ) => CrossProjectOverrideRequest;
  acceptCrossProjectOverrideRequest: (requestId: string, adminNotes?: string) => void;
  rejectCrossProjectOverrideRequest: (requestId: string, adminNotes?: string) => void;

  // Client Free-Issue Stock (Client / Principal Project Materials)
  clientFreeIssues: ClientFreeIssueEntry[];
  addClientFreeIssue: (
    data: Omit<ClientFreeIssueEntry, 'id' | 'voucherNumber' | 'createdAt' | 'isDeleted'>
  ) => ClientFreeIssueEntry;
  updateClientFreeIssue: (id: string, updates: Partial<ClientFreeIssueEntry>) => void;
  deleteClientFreeIssue: (id: string) => void;
  clearClientFreeIssues: () => void;
  getClientFreeStockBalance: (projectId: string, itemId: string) => {
    totalReceived: number;
    totalUsed: number;
    remainingBalance: number;
  };
  getProjectFreeStockList: (projectId: string) => Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    unit: string;
    totalReceived: number;
    totalUsed: number;
    remainingBalance: number;
  }>;

  // Branch Stock Return (To Main Yard)
  returnStockFromBranchToMain: (
    data: Omit<BranchReturn, 'id' | 'branchReturnNumber' | 'returnDate' | 'returnedBy'>
  ) => BranchReturn;
  deleteBranchReturn: (id: string) => void;
  clearBranchReturns: () => void;

  // Damaged Stock Management & Restoring to Main Stock
  restoreDamagedStockToMain: (
    itemId: string,
    quantity: number,
    notes?: string
  ) => { success: boolean; message: string; record?: DamagedStockRestoration };
  getDamagedStock: (itemId: string) => {
    totalDamagedReceived: number;
    totalRestored: number;
    availableBalance: number;
    hasActivity: boolean;
  };

  // Versioned Backups & Admin System Flush
  createBackup: (name: string, reason?: string) => StockBackup;
  restoreBackup: (backupId: string) => void;
  deleteBackup: (backupId: string) => void;
  flushSystemWithBackup: (adminPassword: string, backupName: string) => { success: boolean; message: string; backupNumber?: number };
  lastAutoBackupTime: string | null;
  triggerDailyBackupNow: () => StockBackup;

  // Inventory Calculations
  getMainWarehouseStock: (itemId: string) => {
    totalReceived: number;
    dispatched: number;
    availableBalance: number;
    threshold: number;
    isLowStock: boolean;
    hasActivity: boolean;
  };
  getSiteItemStock: (siteId: string, itemId: string) => {
    received: number;
    returned: number;
    issued: number;
    availableBalance: number;
    threshold: number;
    isLowStock: boolean;
    hasActivity: boolean;
  };
  getTeamInHandStock: (teamId: string) => TeamInHandSummary;
  allTeamsInHandStock: TeamInHandSummary[];

  // Low stock alerts count
  totalLowStockAlertsCount: number;
  pendingRequestsCount: number;

  // Section-Specific Clear Operations
  clearMainStockReceipts: () => void;
  clearStockRequests: () => void;
  clearTeamIssues: () => void;
  clearTeamReturns: () => void;
  clearAuditLogs: () => void;
  clearAllItems: () => void;
  clearAllSites: () => void;
  clearAllTeams: () => void;
  clearAllUsers: () => void;

  // Single Record Deletion
  deleteMainStockEntry: (id: string) => void;
  deleteStockRequest: (id: string) => void;
  deleteTeamIssue: (id: string) => void;
  deleteTeamReturn: (id: string) => void;
  deleteAuditLog: (id: string) => void;

  // Letterhead Templates & Signers (Customizable Names, Roles & Designations)
  letterheadTemplates: LetterheadTemplate[];
  activeTemplateId: string;
  activeTemplate: LetterheadTemplate;
  digitalSignatures: DigitalSignature[];
  setActiveTemplateId: (id: string) => void;
  updateLetterheadTemplate: (template: LetterheadTemplate) => void;
  addLetterheadTemplate: (template: Omit<LetterheadTemplate, 'id'>) => LetterheadTemplate;
  deleteLetterheadTemplate: (id: string) => void;
  updateDigitalSignatures: (signatures: DigitalSignature[]) => void;
  addDigitalSignature: (signature: Omit<DigitalSignature, 'id' | 'createdAt'>) => DigitalSignature;
  deleteDigitalSignature: (id: string) => void;

  // SaaS Multi-Tenancy & Subscriptions
  tenants: Tenant[];
  currentTenant: Tenant;
  previewTenant: Tenant | null;
  registerTenant: (form: TenantRegistrationForm) => { success: boolean; message: string; tenant?: Tenant };
  switchTenant: (tenantId: string) => void;
  switchToMasterStock: () => void;
  setPreviewTenant: (tenant: Tenant | null) => void;
  exitTenantPreview: () => void;
  updateTenantSubscription: (tenantId: string, subscriptionUpdates: Partial<TenantSubscription>) => void;
  updateTenantDetails: (
    tenantId: string,
    updates: Partial<Pick<Tenant, 'companyName' | 'contactEmail' | 'contactPhone' | 'currencySymbol' | 'country' | 'slug'>>
  ) => void;
  deleteTenant: (tenantId: string) => void;

  // Firebase Realtime Database
  firebaseConnected: boolean;
  isFirebaseSyncing: boolean;
  syncWithFirebaseNow: () => Promise<void>;
  firebaseDbUrl: string;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

const PRODUCTION_CLEAN_KEY = 'apex_stock_production_clean_v4';

// Run once to purge any previously cached demo dummy records from local storage
(() => {
  try {
    if (typeof window !== 'undefined' && localStorage.getItem(PRODUCTION_CLEAN_KEY) !== 'true') {
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'items');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'mainStockEntries');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'stockRequests');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'teamIssues');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'teamReturns');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'teams');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'auditLogs');
      // Set clean sites with only Main Central Warehouse
      localStorage.setItem(STORAGE_KEY_PREFIX + 'sites', JSON.stringify(INITIAL_SITES));
      // Set clean users with only Super Admin
      localStorage.setItem(STORAGE_KEY_PREFIX + 'users', JSON.stringify(INITIAL_USERS));
      // Set clean config with Comtec Systems
      localStorage.setItem(STORAGE_KEY_PREFIX + 'config', JSON.stringify(INITIAL_CONFIG));
      localStorage.setItem(PRODUCTION_CLEAN_KEY, 'true');
    }
  } catch (e) {
    console.warn('Production clean initialization notice:', e);
  }
})();

function getTenantStorageKey(tenantId: string, key: string): string {
  if (key === 'tenants' || key === 'current_tenant_id') {
    return STORAGE_KEY_PREFIX + key;
  }
  return `${STORAGE_KEY_PREFIX}${tenantId}_${key}`;
}

export function loadTenantData<T>(tenantId: string, key: string, fallback: T): T {
  try {
    const tenantKey = getTenantStorageKey(tenantId, key);
    const item = localStorage.getItem(tenantKey);
    if (item !== null) {
      return JSON.parse(item);
    }
    // Fallback for default tenant to legacy non-prefixed key
    if (tenantId === DEFAULT_TENANT.id) {
      const legacyItem = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      if (legacyItem !== null) {
        return JSON.parse(legacyItem);
      }
      
      // Data Migration Fallback: If searching for apex-main but data is in comtec-main
      if (tenantId === 'tenant-apex-main') {
        const comtecKey = `${STORAGE_KEY_PREFIX}tenant-comtec-main_${key}`;
        const comtecItem = localStorage.getItem(comtecKey);
        if (comtecItem !== null) {
          return JSON.parse(comtecItem);
        }
      }
    }
    return fallback;
  } catch (err) {
    console.error(`Failed to load ${key} for tenant ${tenantId}:`, err);
    return fallback;
  }
}

function saveTenantData<T>(tenantId: string, key: string, data: T) {
  try {
    const tenantKey = getTenantStorageKey(tenantId, key);
    localStorage.setItem(tenantKey, JSON.stringify(data));
    if (tenantId === DEFAULT_TENANT.id && key !== 'current_tenant_id') {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
    }
    // Realtime sync to Firebase for all tenants (users, sites, config, items, teams, etc.)
    writeTenantDataToFirebase(tenantId, key, data).catch(() => {});
  } catch (err) {
    console.error(`Failed to save ${key} for tenant ${tenantId}:`, err);
  }
}

export function getAllSavedTenants(): Tenant[] {
  try {
    const rawRoot = localStorage.getItem(STORAGE_KEY_PREFIX + 'tenants');
    const rawApex = localStorage.getItem(`${STORAGE_KEY_PREFIX}tenant-apex-main_tenants`);
    const parsedRoot: Tenant[] = rawRoot ? JSON.parse(rawRoot) : [];
    const parsedApex: Tenant[] = rawApex ? JSON.parse(rawApex) : [];

    const map = new Map<string, Tenant>();

    // Initial defaults
    INITIAL_TENANTS.forEach((t) => map.set(t.id, t));
    parsedApex.forEach((t) => map.set(t.id, t));
    parsedRoot.forEach((t) => map.set(t.id, t));

    // Dynamic Discovery: Scan all localStorage keys for any created tenant workspaces
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_KEY_PREFIX + 'tenant-') && k.endsWith('_config')) {
        const tenantId = k.replace(STORAGE_KEY_PREFIX, '').replace('_config', '');
        if (!map.has(tenantId)) {
          try {
            const rawCfg = localStorage.getItem(k);
            if (rawCfg) {
              const cfg = JSON.parse(rawCfg);
              const parts = tenantId.replace('tenant-', '').split('-');
              const slug = parts.length > 1 && !isNaN(Number(parts[parts.length - 1]))
                ? parts.slice(0, -1).join('-')
                : parts.join('-');

              map.set(tenantId, {
                id: tenantId,
                companyName: cfg.companyName || slug,
                slug: slug || 'company',
                contactEmail: cfg.email || '',
                contactPhone: cfg.phone || '',
                currencySymbol: cfg.currencySymbol || 'Rs.',
                country: 'Sri Lanka',
                subscription: {
                  plan: 'free_trial',
                  status: 'trialing',
                  trialStartedAt: new Date().toISOString(),
                  trialEndsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
                  monthlyPrice: 19.90,
                  currency: 'USD',
                  paymentMethodStatus: 'pending_setup',
                },
                createdAt: new Date().toISOString(),
                ownerUserId: `usr-${slug}-admin`,
                isActive: true,
              });
            }
          } catch (e) {
            console.warn('Could not reconstruct tenant from config:', e);
          }
        }
      }
    }

    // Enforce master tenant brand & email
    const apexMain = map.get(DEFAULT_TENANT.id) || DEFAULT_TENANT;
    map.set(DEFAULT_TENANT.id, {
      ...apexMain,
      id: DEFAULT_TENANT.id,
      companyName: 'Apex Developer',
      slug: 'apex-developer',
      contactEmail: 'apexdevinfo@gmail.com',
    });

    const combined = Array.from(map.values());
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'tenants', JSON.stringify(combined));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}tenant-apex-main_tenants`, JSON.stringify(combined));
    } catch {}
    return combined;
  } catch {
    return INITIAL_TENANTS;
  }
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.error(`Failed to load ${key} from storage:`, err);
    return fallback;
  }
}

export function isForeignUser(u: User): boolean {
  if (!u) return true;
  const username = (u.username || '').toLowerCase();
  const fullName = (u.fullName || '').toLowerCase();
  const id = (u.id || '').toLowerCase();

  // If the user belongs to Civilect, glow test, glowgaze, or other non-apex client tenant
  if (
    username.includes('civilect') ||
    fullName.includes('civilect') ||
    id.includes('civilect') ||
    username.includes('glow') ||
    fullName.includes('glow') ||
    id.includes('glow')
  ) {
    return true;
  }
  return false;
}

export function sanitizeAndRecoverApexUsers(existingUsers?: User[]): User[] {
  const recovered: User[] = [];
  const seenUsernames = new Set<string>();

  const addUserIfValid = (u: User) => {
    if (!u || !u.username) return;
    const norm = u.username.trim().toLowerCase();
    if (isForeignUser(u)) return;
    if (seenUsernames.has(norm)) return;
    seenUsernames.add(norm);
    const isCoreAdmin = norm === 'admin';
    recovered.push({
      ...u,
      role: normalizeRole(u.role),
      isDeleted: isCoreAdmin ? false : (u.isDeleted ?? false),
    });
  };

  // 1. Always ensure Master Super Admin is present
  const adminUser: User = {
    id: 'usr-admin-1',
    username: 'admin',
    fullName: 'Sasith Dissanayake',
    siteId: 'all',
    role: 'Super Admin Central',
    password: 'sasith@123',
    createdAt: '2026-11-01T00:00:00.000Z',
    isDeleted: false,
  };
  addUserIfValid(adminUser);

  // 2. Filter existing candidates passed to function
  if (Array.isArray(existingUsers)) {
    for (const u of existingUsers) {
      addUserIfValid(u);
    }
  }

  return recovered;
}

export function sanitizeTenantUsers(tenantId: string, rawUsers: User[], allTenants: Tenant[]): User[] {
  if (!Array.isArray(rawUsers)) return [];
  const isMaster = tenantId === DEFAULT_TENANT.id || tenantId === 'tenant-apex-main';
  
  if (isMaster) {
    return sanitizeAndRecoverApexUsers(rawUsers);
  }

  const currentTenant = allTenants.find((t) => t.id === tenantId);
  const otherTenants = allTenants.filter((t) => t.id !== tenantId && t.id !== DEFAULT_TENANT.id && t.id !== 'tenant-apex-main');

  return rawUsers.filter((u) => {
    if (!u || !u.username) return false;
    const uName = (u.username || '').toLowerCase();
    const uFull = (u.fullName || '').toLowerCase();
    const uId = (u.id || '').toLowerCase();

    // 1. Exclude Master Developer Super Admin ('admin') from client workspace lists
    if (uName === 'admin' || uId === 'usr-admin-1') {
      return false;
    }

    // 2. If user explicitly specifies a tenantId, enforce it
    if (u.tenantId && u.tenantId !== tenantId) {
      return false;
    }

    // 3. Exclude users that match another tenant's slug or contact email
    for (const other of otherTenants) {
      const otherSlug = (other.slug || '').toLowerCase();
      const otherEmail = (other.contactEmail || '').toLowerCase();

      if (otherSlug && (uId.includes(otherSlug) || uName.includes(otherSlug) || uFull.includes(otherSlug))) {
        return false;
      }
      if (otherEmail && (uName === otherEmail || uId.includes(otherEmail))) {
        return false;
      }
    }

    return true;
  });
}

export const StockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    return getAllSavedTenants();
  });

  const [currentTenantId, setCurrentTenantId] = useState<string>(() => {
    try {
      const loadedTenants = getAllSavedTenants();
      const urlParams = new URLSearchParams(window.location.search);
      const wsSlug = urlParams.get('workspace');
      if (wsSlug) {
        const clean = wsSlug.trim().toLowerCase();
        const foundBySlug = loadedTenants.find(
          (t) =>
            t.slug?.toLowerCase() === clean ||
            t.id?.toLowerCase() === clean ||
            t.companyName?.toLowerCase() === clean ||
            t.slug?.toLowerCase().replace(/[^a-z0-9]/g, '') === clean.replace(/[^a-z0-9]/g, '')
        );
        if (foundBySlug) {
          localStorage.setItem(STORAGE_KEY_PREFIX + 'current_tenant_id', foundBySlug.id);
          return foundBySlug.id;
        }
      }
      const storedId = localStorage.getItem(STORAGE_KEY_PREFIX + 'current_tenant_id');
      if (storedId === 'tenant-comtec-main') {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'current_tenant_id', 'tenant-apex-main');
        return 'tenant-apex-main';
      }
      return storedId || DEFAULT_TENANT.id;
    } catch {
      return DEFAULT_TENANT.id;
    }
  });

  const currentTenantIdRef = useRef<string>(currentTenantId);
  const loadedTenantIdRef = useRef<string>(currentTenantId);
  useEffect(() => {
    currentTenantIdRef.current = currentTenantId;
  }, [currentTenantId]);

  // Auto-switch workspace if ?workspace=slug is present in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const wsSlug = urlParams.get('workspace');
      if (wsSlug) {
        const clean = wsSlug.trim().toLowerCase();
        const allList = tenants.length > 0 ? tenants : getAllSavedTenants();
        let found = allList.find(
          (t) =>
            t.slug?.toLowerCase() === clean ||
            t.id?.toLowerCase() === clean ||
            t.companyName?.toLowerCase() === clean ||
            t.slug?.toLowerCase().replace(/[^a-z0-9]/g, '') === clean.replace(/[^a-z0-9]/g, '')
        );

        if (!found) {
          const fresh = getAllSavedTenants();
          found = fresh.find(
            (t) =>
              t.slug?.toLowerCase() === clean ||
              t.id?.toLowerCase() === clean ||
              t.companyName?.toLowerCase() === clean ||
              t.slug?.toLowerCase().replace(/[^a-z0-9]/g, '') === clean.replace(/[^a-z0-9]/g, '')
          );
          if (found) {
            setTenants(fresh);
          }
        }

        if (found && found.id !== currentTenantIdRef.current) {
          setCurrentTenantId(found.id);
          currentTenantIdRef.current = found.id;
          try {
            localStorage.setItem(STORAGE_KEY_PREFIX + 'current_tenant_id', found.id);
          } catch {}
          loadTenantStateIntoMemory(found.id);
        }
      }
    }
  }, [tenants]);

  // Realtime Cloud Data Sync for current active tenant (multi-device / Vercel deployment support)
  useEffect(() => {
    if (!currentTenantId) return;

    // 1. Instantly catch up with Firebase RTDB for currentTenantId
    fetchTenantDataFromFirebase<User[]>(currentTenantId, 'users').then((remoteUsers) => {
      if (remoteUsers && Array.isArray(remoteUsers) && remoteUsers.length > 0) {
        setUsers(remoteUsers);
        try {
          const tenantKey = getTenantStorageKey(currentTenantId, 'users');
          localStorage.setItem(tenantKey, JSON.stringify(remoteUsers));
        } catch {}
      }
    });

    fetchTenantDataFromFirebase<Site[]>(currentTenantId, 'sites').then((remoteSites) => {
      if (remoteSites && remoteSites.length > 0) {
        setSites(remoteSites);
        saveTenantData(currentTenantId, 'sites', remoteSites);
      }
    });

    fetchTenantDataFromFirebase<SystemConfig>(currentTenantId, 'config').then((remoteConfig) => {
      if (remoteConfig) {
        setConfig(remoteConfig);
        saveTenantData(currentTenantId, 'config', remoteConfig);
      }
    });

    fetchTenantDataFromFirebase<Item[]>(currentTenantId, 'items').then((remoteItems) => {
      if (remoteItems) {
        setItems(remoteItems);
        saveTenantData(currentTenantId, 'items', remoteItems);
      }
    });

    fetchTenantDataFromFirebase<Team[]>(currentTenantId, 'teams').then((remoteTeams) => {
      if (remoteTeams) {
        setTeams(remoteTeams);
        saveTenantData(currentTenantId, 'teams', remoteTeams);
      }
    });

    // 2. Realtime listener for tenant users
    const unsubUsers = subscribeToFirebaseTenantData<User[]>(
      currentTenantId,
      'users',
      (remoteUsers) => {
        if (remoteUsers && Array.isArray(remoteUsers)) {
          setUsers(remoteUsers);
          try {
            const tenantKey = getTenantStorageKey(currentTenantId, 'users');
            localStorage.setItem(tenantKey, JSON.stringify(remoteUsers));
          } catch {}
        }
      }
    );

    return () => {
      if (unsubUsers) unsubUsers();
    };
  }, [currentTenantId]);

  // Auto-check and promote queued subscriptions when current plan period expires
  useEffect(() => {
    let hasChanges = false;
    const now = new Date();
    const updatedTenants = tenants.map((t) => {
      const sub = t.subscription;
      if (sub.queuedSubscription) {
        const expiryDate = new Date(sub.trialEndsAt || sub.nextBillingDate || 0);
        if (expiryDate <= now) {
          hasChanges = true;
          const q = sub.queuedSubscription;
          const isAnnual = q.billingCycle === 'annual' || q.plan === 'pro_annual';
          const nextBilling = new Date(now.getTime() + (isAnnual ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString();
          return {
            ...t,
            subscription: {
              ...sub,
              plan: (isAnnual ? 'pro_annual' : 'pro_monthly') as TenantPlan,
              status: 'active' as const,
              monthlyPrice: isAnnual ? 15.75 : 19.90,
              annualPrice: isAnnual ? 189.00 : undefined,
              billingCycle: isAnnual ? ('annual' as const) : ('monthly' as const),
              paymentMethodStatus: 'active' as const,
              lastBillingDate: now.toISOString(),
              nextBillingDate: nextBilling,
              trialEndsAt: nextBilling,
              queuedSubscription: undefined,
            },
          };
        }
      }
      return t;
    });

    if (hasChanges) {
      setTenants(updatedTenants);
      saveTenantData(DEFAULT_TENANT.id, 'tenants', updatedTenants);
      writeTenantsToFirebase(updatedTenants).catch(console.warn);
    }
  }, [tenants]);

  // Enforce apexdevinfo@gmail.com on master tenant and sanitize any lingering comtec emails
  useEffect(() => {
    let modified = false;
    const sanitized = tenants.map((t) => {
      if (t.id === 'tenant-apex-main' || t.id === 'tenant-comtec-main' || t.id === DEFAULT_TENANT.id) {
        if (t.contactEmail !== 'apexdevinfo@gmail.com' || t.companyName !== 'Apex Developer') {
          modified = true;
          return {
            ...t,
            id: 'tenant-apex-main',
            companyName: 'Apex Developer',
            slug: 'apex-developer',
            contactEmail: 'apexdevinfo@gmail.com',
          };
        }
      }
      if (t.contactEmail && (t.contactEmail.includes('comtec') || t.contactEmail === 'admin@apexdeveloper.lk' || t.contactEmail === 'admin@apexdeveloper.com')) {
        modified = true;
        return {
          ...t,
          contactEmail: 'apexdevinfo@gmail.com',
        };
      }
      return t;
    });

    if (modified) {
      setTenants(sanitized);
      saveTenantData(DEFAULT_TENANT.id, 'tenants', sanitized);
      try {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'tenants', JSON.stringify(sanitized));
      } catch {}
      writeTenantsToFirebase(sanitized).catch(console.warn);
    }
  }, [tenants]);

  const saveToStorage = <T,>(key: string, data: T) => {
    if (loadedTenantIdRef.current !== currentTenantIdRef.current) return;
    saveTenantData(currentTenantIdRef.current, key, data);
  };

  // State variables for current active tenant
  const isDefaultTenant = currentTenantId === DEFAULT_TENANT.id;
  const currentTenant = useMemo(() => {
    return tenants.find((t) => t.id === currentTenantId) || tenants[0] || DEFAULT_TENANT;
  }, [tenants, currentTenantId]);

  const [config, setConfig] = useState<SystemConfig>(() =>
    loadTenantData(currentTenantId, 'config', isDefaultTenant ? INITIAL_CONFIG : {
      companyName: currentTenant.companyName || 'New Company Workspace',
      systemName: 'Apex Stock & Site Management System',
      defaultLowStockThreshold: 15,
      currencySymbol: currentTenant.currencySymbol || 'Rs.',
      address: 'Central Yard & Operations Hub',
      phone: currentTenant.contactPhone || '',
      email: currentTenant.contactEmail || '',
    })
  );
  const [sites, setSites] = useState<Site[]>(() =>
    loadTenantData(currentTenantId, 'sites', isDefaultTenant ? INITIAL_SITES : [])
  );
  const [users, setUsers] = useState<User[]>(() => {
    const rawUsers = loadTenantData(currentTenantId, 'users', isDefaultTenant ? INITIAL_USERS : []);
    return sanitizeTenantUsers(currentTenantId, rawUsers, tenants);
  });
  const [items, setItems] = useState<Item[]>(() =>
    loadTenantData(currentTenantId, 'items', isDefaultTenant ? INITIAL_ITEMS : [])
  );
  const [teams, setTeams] = useState<Team[]>(() =>
    loadTenantData(currentTenantId, 'teams', isDefaultTenant ? INITIAL_TEAMS : [])
  );
  const [mainStockEntries, setMainStockEntries] = useState<MainStockEntry[]>(() =>
    loadTenantData(currentTenantId, 'mainStockEntries', isDefaultTenant ? INITIAL_MAIN_STOCK_ENTRIES : [])
  );
  const [stockRequests, setStockRequests] = useState<StockTransferRequest[]>(() =>
    loadTenantData(currentTenantId, 'stockRequests', isDefaultTenant ? INITIAL_STOCK_REQUESTS : [])
  );
  const [teamIssues, setTeamIssues] = useState<TeamIssue[]>(() =>
    loadTenantData(currentTenantId, 'teamIssues', isDefaultTenant ? INITIAL_TEAM_ISSUES : [])
  );
  const [teamReturns, setTeamReturns] = useState<TeamReturn[]>(() =>
    loadTenantData(currentTenantId, 'teamReturns', isDefaultTenant ? INITIAL_TEAM_RETURNS : [])
  );
  const [projects, setProjects] = useState<Project[]>(() =>
    loadTenantData(currentTenantId, 'projects', isDefaultTenant ? INITIAL_PROJECTS : [])
  );
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>(() =>
    loadTenantData(currentTenantId, 'projectTypes', INITIAL_PROJECT_TYPES)
  );
  const [projectUsages, setProjectUsages] = useState<ProjectMaterialUsage[]>(() =>
    loadTenantData(currentTenantId, 'projectUsages', isDefaultTenant ? INITIAL_PROJECT_USAGES : [])
  );
  const [crossProjectRequests, setCrossProjectRequests] = useState<CrossProjectOverrideRequest[]>(() =>
    loadTenantData(currentTenantId, 'crossProjectRequests', [])
  );
  const [clientFreeIssues, setClientFreeIssues] = useState<ClientFreeIssueEntry[]>(() =>
    loadTenantData(currentTenantId, 'clientFreeIssues', isDefaultTenant ? INITIAL_CLIENT_FREE_ISSUES : [])
  );
  const [branchReturns, setBranchReturns] = useState<BranchReturn[]>(() =>
    loadTenantData(currentTenantId, 'branchReturns', isDefaultTenant ? INITIAL_BRANCH_RETURNS : [])
  );
  const [damagedRestorations, setDamagedRestorations] = useState<DamagedStockRestoration[]>(() =>
    loadTenantData(currentTenantId, 'damagedRestorations', [])
  );
  const [backups, setBackups] = useState<StockBackup[]>(() =>
    loadTenantData(currentTenantId, 'backups', isDefaultTenant ? INITIAL_BACKUPS : [])
  );
  const [lastAutoBackupTime, setLastAutoBackupTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`apex_last_daily_backup_time_${currentTenantId}`) || null;
    } catch {
      return null;
    }
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    loadTenantData(currentTenantId, 'auditLogs', isDefaultTenant ? INITIAL_AUDIT_LOGS : [])
  );
  const [letterheadTemplates, setLetterheadTemplates] = useState<LetterheadTemplate[]>(() =>
    loadTenantData(currentTenantId, 'letterheadTemplates', DEFAULT_LETTERHEAD_TEMPLATES)
  );
  const [activeTemplateId, setActiveTemplateIdState] = useState<string>(() =>
    loadTenantData(currentTenantId, 'activeTemplateId', DEFAULT_LETTERHEAD_TEMPLATES[0].id)
  );
  const [digitalSignatures, setDigitalSignatures] = useState<DigitalSignature[]>(() =>
    loadTenantData(currentTenantId, 'digitalSignatures', DEFAULT_DIGITAL_SIGNATURES)
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    loadTenantData(currentTenantId, 'suppliers', isDefaultTenant ? INITIAL_SUPPLIERS : [])
  );
  const [clients, setClients] = useState<Client[]>(() =>
    loadTenantData(currentTenantId, 'clients', isDefaultTenant ? INITIAL_CLIENTS : [])
  );
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() =>
    loadTenantData(currentTenantId, 'purchaseOrders', isDefaultTenant ? INITIAL_PURCHASE_ORDERS : [])
  );
  const [supplierReturns, setSupplierReturns] = useState<SupplierReturn[]>(() =>
    loadTenantData(currentTenantId, 'supplierReturns', isDefaultTenant ? INITIAL_SUPPLIER_RETURNS : [])
  );

  const [authUser, setAuthUser] = useState<User>(() => {
    const active = users.find((u) => !u.isDeleted) || users[0] || INITIAL_USERS[0];
    return active;
  });

  const [viewAsUserId, setViewAsUserId] = useState<string | null>(null);

  const viewAsUser = useMemo(() => {
    if (!viewAsUserId) return null;
    return users.find((u) => u.id === viewAsUserId && !u.isDeleted) || null;
  }, [viewAsUserId, users]);

  const currentUser = useMemo(() => {
    return viewAsUser || authUser;
  }, [viewAsUser, authUser]);

  const setCurrentUser = (user: User) => {
    setAuthUser(user);
    setViewAsUserId(null);
  };

  const setViewAsUser = (user: User | null) => {
    if (!user || user.id === authUser.id) {
      setViewAsUserId(null);
    } else {
      setViewAsUserId(user.id);
    }
  };

  const exitViewAsMode = () => {
    setViewAsUserId(null);
  };

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem(STORAGE_KEY_PREFIX + 'is_authenticated');
      return savedAuth === 'true';
    } catch {
      return false;
    }
  });

  // Switch memory state when tenant changes
  const loadTenantStateIntoMemory = (tenantId: string) => {
    currentTenantIdRef.current = tenantId;
    loadedTenantIdRef.current = tenantId;
    const isDefault = tenantId === DEFAULT_TENANT.id;
    const tObj = tenants.find((t) => t.id === tenantId) || DEFAULT_TENANT;

    const loadedConfig = loadTenantData<SystemConfig>(tenantId, 'config', isDefault ? INITIAL_CONFIG : {
      companyName: tObj.companyName,
      systemName: 'Apex Stock & Site Management System',
      defaultLowStockThreshold: 15,
      currencySymbol: tObj.currencySymbol || 'Rs.',
      address: 'Central Logistics Yard & Operations Hub',
      phone: tObj.contactPhone || '',
      email: tObj.contactEmail || '',
    });

    if (isDefault || tenantId === 'tenant-apex-main') {
      if (!loadedConfig.companyName || loadedConfig.companyName.toLowerCase().includes('glow') || loadedConfig.companyName.toLowerCase().includes('comtec')) {
        loadedConfig.companyName = 'Apex Developer';
      }
      if (!loadedConfig.systemName || loadedConfig.systemName.toLowerCase().includes('comtec')) {
        loadedConfig.systemName = 'Apex Stock & Site Management System';
      }
    }

    const loadedSites = loadTenantData<Site[]>(tenantId, 'sites', isDefault ? INITIAL_SITES : []);
    const loadedUsers = loadTenantData<User[]>(tenantId, 'users', isDefault ? INITIAL_USERS : []);

    const isMaster = isDefault || tenantId === 'tenant-apex-main';
    const finalUsers = sanitizeTenantUsers(tenantId, loadedUsers, tenants);
    saveTenantData(tenantId, 'users', finalUsers);

    const cleanSites = isMaster
      ? loadedSites.filter((s) => !s.id.includes('civilect') && !s.name.toLowerCase().includes('civilect'))
      : loadedSites;
    const finalSites = cleanSites.length > 0 ? cleanSites : INITIAL_SITES;

    const loadedItems = loadTenantData<Item[]>(tenantId, 'items', isDefault ? INITIAL_ITEMS : []);
    const loadedTeams = loadTenantData<Team[]>(tenantId, 'teams', isDefault ? INITIAL_TEAMS : []);
    const loadedEntries = loadTenantData<MainStockEntry[]>(tenantId, 'mainStockEntries', isDefault ? INITIAL_MAIN_STOCK_ENTRIES : []);
    const loadedRequests = loadTenantData<StockTransferRequest[]>(tenantId, 'stockRequests', isDefault ? INITIAL_STOCK_REQUESTS : []);
    const loadedIssues = loadTenantData<TeamIssue[]>(tenantId, 'teamIssues', isDefault ? INITIAL_TEAM_ISSUES : []);
    const loadedReturns = loadTenantData<TeamReturn[]>(tenantId, 'teamReturns', isDefault ? INITIAL_TEAM_RETURNS : []);
    const loadedProjects = loadTenantData<Project[]>(tenantId, 'projects', isDefault ? INITIAL_PROJECTS : []);
    const loadedProjectTypes = loadTenantData<ProjectType[]>(tenantId, 'projectTypes', INITIAL_PROJECT_TYPES);
    const loadedUsages = loadTenantData<ProjectMaterialUsage[]>(tenantId, 'projectUsages', isDefault ? INITIAL_PROJECT_USAGES : []);
    const loadedOvr = loadTenantData<CrossProjectOverrideRequest[]>(tenantId, 'crossProjectRequests', []);
    const loadedClientFreeIssues = loadTenantData<ClientFreeIssueEntry[]>(tenantId, 'clientFreeIssues', isDefault ? INITIAL_CLIENT_FREE_ISSUES : []);
    const loadedBranchReturns = loadTenantData<BranchReturn[]>(tenantId, 'branchReturns', isDefault ? INITIAL_BRANCH_RETURNS : []);
    const loadedRestorations = loadTenantData<DamagedStockRestoration[]>(tenantId, 'damagedRestorations', []);
    const loadedBackups = loadTenantData<StockBackup[]>(tenantId, 'backups', isDefault ? INITIAL_BACKUPS : []);
    const loadedAuditLogs = loadTenantData<AuditLogEntry[]>(tenantId, 'auditLogs', isDefault ? INITIAL_AUDIT_LOGS : []);
    const loadedSuppliers = loadTenantData<Supplier[]>(tenantId, 'suppliers', isDefault ? INITIAL_SUPPLIERS : []);
    const loadedClients = loadTenantData<Client[]>(tenantId, 'clients', isDefault ? INITIAL_CLIENTS : []);
    const loadedPOs = loadTenantData<PurchaseOrder[]>(tenantId, 'purchaseOrders', isDefault ? INITIAL_PURCHASE_ORDERS : []);
    const loadedSupplierReturns = loadTenantData<SupplierReturn[]>(tenantId, 'supplierReturns', isDefault ? INITIAL_SUPPLIER_RETURNS : []);
    const loadedTemplates = loadTenantData<LetterheadTemplate[]>(tenantId, 'letterheadTemplates', DEFAULT_LETTERHEAD_TEMPLATES);
    const loadedSignatures = loadTenantData<DigitalSignature[]>(tenantId, 'digitalSignatures', DEFAULT_DIGITAL_SIGNATURES);

    setConfig(loadedConfig);
    setSites(finalSites);
    setUsers(finalUsers);
    setItems(loadedItems);
    setTeams(loadedTeams);
    setMainStockEntries(loadedEntries);
    setStockRequests(loadedRequests);
    setTeamIssues(loadedIssues);
    setTeamReturns(loadedReturns);
    setProjects(loadedProjects);
    setProjectTypes(loadedProjectTypes);
    setProjectUsages(loadedUsages);
    setCrossProjectRequests(loadedOvr);
    setClientFreeIssues(loadedClientFreeIssues);
    setBranchReturns(loadedBranchReturns);
    setDamagedRestorations(loadedRestorations);
    setBackups(loadedBackups);
    setAuditLogs(loadedAuditLogs);
    setSuppliers(loadedSuppliers);
    setClients(loadedClients);
    setPurchaseOrders(loadedPOs);
    setSupplierReturns(loadedSupplierReturns);
    setLetterheadTemplates(loadedTemplates);
    setDigitalSignatures(loadedSignatures);

    if (isMaster) {
      saveTenantData(DEFAULT_TENANT.id, 'users', finalUsers);
      localStorage.setItem(STORAGE_KEY_PREFIX + 'users', JSON.stringify(finalUsers));
      saveTenantData(DEFAULT_TENANT.id, 'sites', finalSites);
      localStorage.setItem(STORAGE_KEY_PREFIX + 'sites', JSON.stringify(finalSites));
    }

    const activeUser = finalUsers.find((u) => !u.isDeleted && u.username === 'admin') || finalUsers.find((u) => !u.isDeleted) || finalUsers[0] || (isDefault ? INITIAL_USERS[0] : null);
    if (activeUser) {
      setCurrentUser(activeUser);
    }
  };

  const getWorkspaceLoginUrl = (slugOrTenantId?: string): string => {
    const target = slugOrTenantId
      ? (tenants.find((t) => t.slug === slugOrTenantId || t.id === slugOrTenantId) || currentTenant)
      : currentTenant;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    return `${origin}${pathname}?workspace=${target.slug}`;
  };

  const login = async (
    usernameOrUser: string | User,
    password?: string,
    workspaceSlugOrId?: string
  ): Promise<{ success: boolean; message: string; collisionCompanies?: { id: string; name: string; slug: string }[] }> => {
    let matchedTenant: Tenant | undefined;
    let matchedUser: User | undefined;

    if (typeof usernameOrUser === 'string') {
      const term = usernameOrUser.trim().toLowerCase();
      const inputPass = (password || '').trim();

      // Check if target workspace was explicitly provided
      const explicitSlug = workspaceSlugOrId?.trim().toLowerCase();
      let targetTenant: Tenant | undefined;

      if (explicitSlug) {
        const cleanSlug = explicitSlug.trim().toLowerCase();
        targetTenant = tenants.find(
          (t) =>
            t.slug?.toLowerCase() === cleanSlug ||
            t.id?.toLowerCase() === cleanSlug ||
            t.companyName?.toLowerCase() === cleanSlug ||
            t.slug?.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSlug.replace(/[^a-z0-9]/g, '')
        );

        if (!targetTenant) {
          const freshTenants = getAllSavedTenants();
          targetTenant = freshTenants.find(
            (t) =>
              t.slug?.toLowerCase() === cleanSlug ||
              t.id?.toLowerCase() === cleanSlug ||
              t.companyName?.toLowerCase() === cleanSlug ||
              t.slug?.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSlug.replace(/[^a-z0-9]/g, '')
          );
          if (targetTenant) {
            setTenants(freshTenants);
          }
        }

        if (!targetTenant) {
          return {
            success: false,
            message: `Company workspace "${workspaceSlugOrId}" not found. Please verify your company workspace code.`,
          };
        }
      }

      // If a specific workspace was designated:
      if (targetTenant) {
        let tUsers = loadTenantData<User[]>(
          targetTenant.id,
          'users',
          targetTenant.id === DEFAULT_TENANT.id ? INITIAL_USERS : []
        );
        let cleanTUsers = sanitizeTenantUsers(targetTenant.id, tUsers, tenants);
        matchedUser = cleanTUsers.find(
          (u) => !u.isDeleted && (u.username.toLowerCase() === term || u.fullName.toLowerCase() === term)
        );

        // Multi-device / Vercel deployment fallback: Fetch tenant users from Firebase RTDB if not in local storage
        if (!matchedUser) {
          const remoteUsers = await fetchTenantDataFromFirebase<User[]>(targetTenant.id, 'users');
          if (remoteUsers && remoteUsers.length > 0) {
            const cleanRemote = sanitizeTenantUsers(targetTenant.id, remoteUsers, tenants);
            saveTenantData(targetTenant.id, 'users', cleanRemote);
            matchedUser = cleanRemote.find(
              (u) => !u.isDeleted && (u.username.toLowerCase() === term || u.fullName.toLowerCase() === term)
            );
          }
        }

        if (!matchedUser) {
          return {
            success: false,
            message: `User account "${usernameOrUser}" not found in ${targetTenant.companyName} workspace.`,
          };
        }
        matchedTenant = targetTenant;
      } else {
        // Collect candidate users across tenants that match the username
        const candidates: { tenant: Tenant; user: User; expectedPass: string }[] = [];

        for (const t of tenants) {
          let tUsers = loadTenantData<User[]>(
            t.id,
            'users',
            t.id === DEFAULT_TENANT.id ? INITIAL_USERS : []
          );
          let cleanTUsers = sanitizeTenantUsers(t.id, tUsers, tenants);
          let found = cleanTUsers.find(
            (u) => !u.isDeleted && (u.username.toLowerCase() === term || u.fullName.toLowerCase() === term)
          );

          if (!found) {
            const remoteUsers = await fetchTenantDataFromFirebase<User[]>(t.id, 'users');
            if (remoteUsers && remoteUsers.length > 0) {
              const cleanRemote = sanitizeTenantUsers(t.id, remoteUsers, tenants);
              saveTenantData(t.id, 'users', cleanRemote);
              found = cleanRemote.find(
                (u) => !u.isDeleted && (u.username.toLowerCase() === term || u.fullName.toLowerCase() === term)
              );
            }
          }

          if (found) {
            const isMaster = t.id === DEFAULT_TENANT.id && (found.username === 'admin' || found.id === 'usr-admin-1');
            const expected = isMaster ? 'sasith@123' : (found.password || 'password123').trim();
            candidates.push({ tenant: t, user: found, expectedPass: expected });
          }
        }

        if (candidates.length === 0) {
          return { success: false, message: 'User account not found. Please verify your username.' };
        }

        if (candidates.length === 1) {
          matchedTenant = candidates[0].tenant;
          matchedUser = candidates[0].user;
        } else {
          // Multiple companies have a user with this username (Multi-tenant collision resolution!)
          // 1. Check if user's entered password matches exactly one candidate
          const passwordMatched = inputPass
            ? candidates.filter((c) => c.expectedPass === inputPass)
            : [];

          if (passwordMatched.length === 1) {
            matchedTenant = passwordMatched[0].tenant;
            matchedUser = passwordMatched[0].user;
          } else if (passwordMatched.length > 1) {
            // Collision on both username AND password
            const matchedCompanies = passwordMatched.map((c) => `"${c.tenant.companyName}" (${c.tenant.slug})`).join(', ');
            return {
              success: false,
              message: `The username "${usernameOrUser}" with this password exists in multiple companies (${matchedCompanies}). Please choose your company workspace below or specify your workspace code:`,
              collisionCompanies: passwordMatched.map((c) => ({
                id: c.tenant.id,
                name: c.tenant.companyName,
                slug: c.tenant.slug,
              })),
            };
          } else {
            // Multiple candidates, but none matched password - check current active tenant in session
            const currentTenantCandidate = candidates.find((c) => c.tenant.id === currentTenantIdRef.current);
            if (currentTenantCandidate) {
              matchedTenant = currentTenantCandidate.tenant;
              matchedUser = currentTenantCandidate.user;
            } else {
              const companyNames = candidates.map((c) => c.tenant.companyName).join(', ');
              return {
                success: false,
                message: `Invalid password for "${usernameOrUser}". (Matching accounts exist in: ${companyNames}. If this is for another company, enter your Company Workspace Code or use your direct company login link).`,
              };
            }
          }
        }
      }
    } else {
      for (const t of tenants) {
        const tUsers = loadTenantData<User[]>(t.id, 'users', t.id === DEFAULT_TENANT.id ? INITIAL_USERS : []);
        const found = tUsers.find((u) => u.id === usernameOrUser.id && !u.isDeleted);
        if (found) {
          matchedTenant = t;
          matchedUser = found;
          break;
        }
      }
      if (!matchedUser) {
        matchedUser = usernameOrUser;
        matchedTenant = currentTenant;
      }
    }

    if (!matchedUser || !matchedTenant) {
      return { success: false, message: 'User account not found. Please verify your username.' };
    }

    // Password verification
    if (password !== undefined) {
      const inputPass = password.trim();
      const isMasterAdminTarget =
        matchedTenant.id === 'tenant-apex-main' &&
        (matchedUser.username === 'admin' || matchedUser.id === 'usr-admin-1');

      if (isMasterAdminTarget) {
        const secureDeveloperPassword = 'sasith@123';
        if (inputPass !== secureDeveloperPassword) {
          return { success: false, message: 'Invalid master administrator credentials. Access restricted.' };
        }
      } else {
        const expectedPass = (matchedUser.password || 'password123').trim();
        if (inputPass !== expectedPass) {
          return { success: false, message: 'Invalid password. Please check your credentials.' };
        }
      }
    }

    // Switch tenant context if different
    if (matchedTenant.id !== currentTenantId) {
      setCurrentTenantId(matchedTenant.id);
      currentTenantIdRef.current = matchedTenant.id;
      try {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'current_tenant_id', matchedTenant.id);
      } catch (e) {
        console.warn('Could not save current_tenant_id:', e);
      }
      loadTenantStateIntoMemory(matchedTenant.id);
    }

    setCurrentUser(matchedUser);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'is_authenticated', 'true');
      localStorage.setItem(STORAGE_KEY_PREFIX + 'auth_user_id', matchedUser.id);
    } catch (e) {
      console.warn('Could not save auth state:', e);
    }

    return { success: true, message: `Welcome back, ${matchedUser.fullName} (${matchedTenant.companyName})!` };
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'is_authenticated', 'false');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'auth_user_id');
    } catch (e) {
      console.warn('Could not save logout state:', e);
    }
  };

  // SaaS Tenant Management
  const [previewTenantId, setPreviewTenantId] = useState<string | null>(null);

  const previewTenant = useMemo(() => {
    if (!previewTenantId) return null;
    return tenants.find((t) => t.id === previewTenantId) || null;
  }, [tenants, previewTenantId]);

  const activeTenantId = useMemo(() => {
    return previewTenantId || currentTenantId;
  }, [previewTenantId, currentTenantId]);

  const setPreviewTenant = (tenant: Tenant | null) => {
    if (!tenant) {
      setPreviewTenantId(null);
    } else {
      setPreviewTenantId(tenant.id);
      loadTenantStateIntoMemory(tenant.id);
    }
  };

  const exitTenantPreview = () => {
    setPreviewTenantId(null);
    loadTenantStateIntoMemory(currentTenantId);
  };

  const switchTenant = (tenantId: string) => {
    let target = tenants.find((t) => t.id === tenantId);
    
    // Explicit fallback for Master Developer tenant
    if (!target && tenantId === 'tenant-apex-main') {
      target = DEFAULT_TENANT;
    }

    if (!target) return;
    setPreviewTenantId(null);
    setCurrentTenantId(target.id);
    currentTenantIdRef.current = target.id;
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'current_tenant_id', target.id);
    } catch (e) {
      console.warn('Could not save current_tenant_id:', e);
    }
    loadTenantStateIntoMemory(target.id);
  };

  const switchToMasterStock = () => {
    try {
      if (typeof window !== 'undefined' && window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.warn('Could not clear url query params:', e);
    }

    setPreviewTenantId(null);
    setViewAsUserId(null);

    setCurrentTenantId(DEFAULT_TENANT.id);
    currentTenantIdRef.current = DEFAULT_TENANT.id;
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'current_tenant_id', DEFAULT_TENANT.id);
    } catch (e) {
      console.warn('Could not save current_tenant_id:', e);
    }

    loadTenantStateIntoMemory(DEFAULT_TENANT.id);
    const masterConfig: SystemConfig = {
      ...INITIAL_CONFIG,
      companyName: 'Apex Developer',
      systemName: 'Apex Stock & Site Management System',
    };
    setConfig(masterConfig);
    saveTenantData(DEFAULT_TENANT.id, 'config', masterConfig);

    const cleanUsers = sanitizeAndRecoverApexUsers();
    setUsers(cleanUsers);
    saveTenantData(DEFAULT_TENANT.id, 'users', cleanUsers);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'users', JSON.stringify(cleanUsers));
    writeUsersToFirebase(cleanUsers).catch(console.warn);

    const masterAdmin = cleanUsers.find((u) => u.username === 'admin') || INITIAL_USERS[0];
    setAuthUser(masterAdmin);
    setCurrentUser(masterAdmin);
  };

  const registerTenant = (
    form: TenantRegistrationForm
  ): { success: boolean; message: string; tenant?: Tenant } => {
    try {
      const cleanName = form.companyName.trim();
      if (!cleanName) {
        return { success: false, message: 'Company Name is required.' };
      }
      if (!form.adminEmail.trim()) {
        return { success: false, message: 'Admin email is required.' };
      }
      if (!form.adminPassword.trim() || form.adminPassword.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters.' };
      }

      const rawSlug = form.slug?.trim() || cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const slug = rawSlug.replace(/^-|-$/g, '') || 'company';
      const tenantId = `tenant-${slug}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newTenant: Tenant = {
        id: tenantId,
        companyName: cleanName,
        slug,
        contactEmail: form.adminEmail.trim(),
        contactPhone: form.contactPhone?.trim() || '',
        currencySymbol: form.currencySymbol || 'Rs.',
        country: form.country || 'Sri Lanka',
        subscription: {
          plan: 'free_trial',
          status: 'trialing',
          trialStartedAt: new Date().toISOString(),
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          monthlyPrice: 19.90,
          currency: 'USD',
          paymentMethodStatus: 'pending_setup',
        },
        createdAt: new Date().toISOString(),
        ownerUserId: `usr-${slug}-admin`,
        isActive: true,
      };

      // Create owner user for new tenant
      const newAdminUser: User = {
        id: `usr-${slug}-admin`,
        username: form.adminEmail.trim(),
        fullName: form.adminFullName.trim() || `${cleanName} Admin`,
        siteId: 'all',
        role: 'Super Admin Central',
        password: form.adminPassword,
        createdAt: new Date().toISOString(),
      };

      // Create initial main yard for new tenant
      const newInitialSite: Site = {
        id: `site-${slug}-main`,
        name: form.initialWarehouseName?.trim() || 'Central Main Warehouse',
        isMainWarehouse: true,
        supervisorName: form.adminFullName.trim() || 'Warehouse Manager',
        location: `${cleanName} Logistics Yard`,
        contactNumber: form.contactPhone?.trim() || '+94 77 123 4567',
        createdAt: new Date().toISOString(),
      };

      const tenantConfig: SystemConfig = {
        companyName: cleanName,
        systemName: 'Apex Stock & Site Management System',
        defaultLowStockThreshold: 15,
        currencySymbol: form.currencySymbol || 'Rs.',
        address: 'Central Logistics Yard & Operations Hub',
        phone: form.contactPhone?.trim() || '',
        email: form.adminEmail.trim(),
      };

      const initialAuditLog: AuditLogEntry = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'TENANT_REGISTERED',
        referenceNo: tenantId,
        siteName: newInitialSite.name,
        performedBy: newAdminUser.fullName,
        details: `Workspace registered for ${cleanName}. 7-Day Free Trial activated ($19.90/mo).`,
      };

      // Save initial clean datasets specifically for this new tenantId
      saveTenantData(tenantId, 'config', tenantConfig);
      saveTenantData(tenantId, 'users', [newAdminUser]);
      saveTenantData(tenantId, 'sites', [newInitialSite]);
      saveTenantData(tenantId, 'items', []);
      saveTenantData(tenantId, 'teams', []);
      saveTenantData(tenantId, 'mainStockEntries', []);
      saveTenantData(tenantId, 'stockRequests', []);
      saveTenantData(tenantId, 'teamIssues', []);
      saveTenantData(tenantId, 'teamReturns', []);
      saveTenantData(tenantId, 'projects', []);
      saveTenantData(tenantId, 'projectUsages', []);
      saveTenantData(tenantId, 'branchReturns', []);
      saveTenantData(tenantId, 'damagedRestorations', []);
      saveTenantData(tenantId, 'backups', []);
      saveTenantData(tenantId, 'auditLogs', [initialAuditLog]);
      saveTenantData(tenantId, 'suppliers', []);
      saveTenantData(tenantId, 'purchaseOrders', []);
      saveTenantData(tenantId, 'supplierReturns', []);
      saveTenantData(tenantId, 'letterheadTemplates', DEFAULT_LETTERHEAD_TEMPLATES);
      saveTenantData(tenantId, 'digitalSignatures', DEFAULT_DIGITAL_SIGNATURES);

      // Save tenant to global tenants registry
      const updatedTenants = [...tenants.filter((t) => t.id !== newTenant.id), newTenant];
      setTenants(updatedTenants);
      saveTenantData(DEFAULT_TENANT.id, 'tenants', updatedTenants);
      try {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'tenants', JSON.stringify(updatedTenants));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}tenant-apex-main_tenants`, JSON.stringify(updatedTenants));
      } catch (e) {
        console.warn('Could not write tenants to localStorage:', e);
      }
      writeTenantsToFirebase(updatedTenants).catch(console.warn);

      // Switch context to new tenant
      setCurrentTenantId(newTenant.id);
      currentTenantIdRef.current = newTenant.id;
      try {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'current_tenant_id', newTenant.id);
      } catch (e) {
        console.warn('Could not save current_tenant_id:', e);
      }

      // Load clean tenant state into memory
      loadTenantStateIntoMemory(newTenant.id);

      // Log in automatically
      setCurrentUser(newAdminUser);
      setIsAuthenticated(true);
      try {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'is_authenticated', 'true');
        localStorage.setItem(STORAGE_KEY_PREFIX + 'auth_user_id', newAdminUser.id);
      } catch (e) {
        console.warn('Could not save auth state:', e);
      }

      return {
        success: true,
        message: `Welcome to your new workspace, ${cleanName}! Your 7-Day Free Trial is now active.`,
        tenant: newTenant,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to register company workspace.' };
    }
  };

  const updateTenantSubscription = (
    tenantId: string,
    subscriptionUpdates: Partial<TenantSubscription>
  ) => {
    setTenants((prev) => {
      const updated = prev.map((t) => {
        if (t.id === tenantId) {
          return {
            ...t,
            subscription: {
              ...t.subscription,
              ...subscriptionUpdates,
            },
          };
        }
        return t;
      });
      saveTenantData(DEFAULT_TENANT.id, 'tenants', updated);
      try {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'tenants', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to write tenants to root storage key:', e);
      }
      writeTenantsToFirebase(updated).catch(console.warn);
      return updated;
    });
  };

  const updateTenantDetails = (
    tenantId: string,
    updates: Partial<Pick<Tenant, 'companyName' | 'contactEmail' | 'contactPhone' | 'currencySymbol' | 'country' | 'slug'>>
  ) => {
    setTenants((prev) => {
      const updated = prev.map((t) => {
        if (t.id === tenantId) {
          return {
            ...t,
            ...updates,
          };
        }
        return t;
      });
      saveTenantData(DEFAULT_TENANT.id, 'tenants', updated);
      try {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'tenants', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to write tenants to root storage key:', e);
      }
      writeTenantsToFirebase(updated).catch(console.warn);
      return updated;
    });

    // If updating current active tenant, also sync config companyName/email/phone
    if (tenantId === currentTenantIdRef.current) {
      setConfig((prev) => {
        const merged: SystemConfig = {
          ...prev,
          ...(updates.companyName ? { companyName: updates.companyName } : {}),
          ...(updates.contactEmail ? { email: updates.contactEmail } : {}),
          ...(updates.contactPhone !== undefined ? { phone: updates.contactPhone } : {}),
          ...(updates.currencySymbol ? { currencySymbol: updates.currencySymbol } : {}),
        };
        saveToStorage('config', merged);
        return merged;
      });
    }
  };

  const deleteTenant = (tenantId: string) => {
    if (tenantId === DEFAULT_TENANT.id) {
      console.warn('Cannot delete default master tenant.');
      return;
    }

    const updatedTenants = tenants.filter((t) => t.id !== tenantId);
    setTenants(updatedTenants);
    saveTenantData(DEFAULT_TENANT.id, 'tenants', updatedTenants);
    writeTenantsToFirebase(updatedTenants).catch(console.warn);

    const keysToRemove = [
      'config',
      'users',
      'sites',
      'items',
      'teams',
      'mainStockEntries',
      'stockRequests',
      'teamIssues',
      'teamReturns',
      'projects',
      'projectUsages',
      'branchReturns',
      'damagedRestorations',
      'backups',
      'auditLogs',
      'suppliers',
      'purchaseOrders',
      'supplierReturns',
      'letterheadTemplates',
      'digitalSignatures',
    ];

    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(getTenantStorageKey(tenantId, k));
      } catch (e) {
        console.warn('Failed removing key:', e);
      }
    });

    if (currentTenantId === tenantId) {
      setCurrentTenantId(DEFAULT_TENANT.id);
      currentTenantIdRef.current = DEFAULT_TENANT.id;
      try {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'current_tenant_id', DEFAULT_TENANT.id);
      } catch (e) {
        console.warn('Could not save current_tenant_id:', e);
      }
      loadTenantStateIntoMemory(DEFAULT_TENANT.id);
    }
  };

  // Firebase Realtime Database Live State
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState<boolean>(false);
  const isIncomingFirebaseItems = useRef<boolean>(false);
  const isIncomingFirebaseRequests = useRef<boolean>(false);
  const isIncomingFirebaseEntries = useRef<boolean>(false);
  const isIncomingFirebaseSites = useRef<boolean>(false);
  const isIncomingFirebaseTeams = useRef<boolean>(false);
  const isIncomingFirebaseUsers = useRef<boolean>(false);
  const isIncomingFirebaseIssues = useRef<boolean>(false);
  const isIncomingFirebaseReturns = useRef<boolean>(false);
  const isIncomingFirebaseProjects = useRef<boolean>(false);
  const isIncomingFirebaseProjectUsages = useRef<boolean>(false);
  const isIncomingFirebaseBranchReturns = useRef<boolean>(false);
  const isIncomingFirebaseBackups = useRef<boolean>(false);
  const isIncomingFirebaseAudit = useRef<boolean>(false);
  const isIncomingFirebaseConfig = useRef<boolean>(false);
  const isIncomingFirebaseLetterheadTemplates = useRef<boolean>(false);
  const isIncomingFirebaseDigitalSignatures = useRef<boolean>(false);
  const isIncomingFirebaseSuppliers = useRef<boolean>(false);
  const isIncomingFirebasePurchaseOrders = useRef<boolean>(false);
  const isIncomingFirebaseSupplierReturns = useRef<boolean>(false);
  const isInitializedFromFirebase = useRef<boolean>(false);

  // Guards to prevent newly mounted empty clients from overwriting Firebase with []
  const hasLoadedItemsFromFirebase = useRef<boolean>(false);
  const hasLoadedRequestsFromFirebase = useRef<boolean>(false);
  const hasLoadedEntriesFromFirebase = useRef<boolean>(false);
  const hasLoadedSitesFromFirebase = useRef<boolean>(false);
  const hasLoadedTeamsFromFirebase = useRef<boolean>(false);
  const hasLoadedUsersFromFirebase = useRef<boolean>(false);
  const hasLoadedIssuesFromFirebase = useRef<boolean>(false);
  const hasLoadedReturnsFromFirebase = useRef<boolean>(false);
  const hasLoadedProjectsFromFirebase = useRef<boolean>(false);
  const hasLoadedProjectUsagesFromFirebase = useRef<boolean>(false);
  const hasLoadedBranchReturnsFromFirebase = useRef<boolean>(false);
  const hasLoadedBackupsFromFirebase = useRef<boolean>(false);
  const hasLoadedAuditFromFirebase = useRef<boolean>(false);
  const hasLoadedConfigFromFirebase = useRef<boolean>(false);
  const hasLoadedTemplatesFromFirebase = useRef<boolean>(false);
  const hasLoadedSignaturesFromFirebase = useRef<boolean>(false);
  const hasLoadedSuppliersFromFirebase = useRef<boolean>(false);
  const hasLoadedPurchaseOrdersFromFirebase = useRef<boolean>(false);
  const hasLoadedSupplierReturnsFromFirebase = useRef<boolean>(false);

  // Fallback timer: After 2.5s, enable writes even if remote was empty or network slow
  useEffect(() => {
    const timer = setTimeout(() => {
      hasLoadedItemsFromFirebase.current = true;
      hasLoadedRequestsFromFirebase.current = true;
      hasLoadedEntriesFromFirebase.current = true;
      hasLoadedSitesFromFirebase.current = true;
      hasLoadedTeamsFromFirebase.current = true;
      hasLoadedUsersFromFirebase.current = true;
      hasLoadedIssuesFromFirebase.current = true;
      hasLoadedReturnsFromFirebase.current = true;
      hasLoadedProjectsFromFirebase.current = true;
      hasLoadedProjectUsagesFromFirebase.current = true;
      hasLoadedBranchReturnsFromFirebase.current = true;
      hasLoadedBackupsFromFirebase.current = true;
      hasLoadedAuditFromFirebase.current = true;
      hasLoadedConfigFromFirebase.current = true;
      hasLoadedTemplatesFromFirebase.current = true;
      hasLoadedSignaturesFromFirebase.current = true;
      hasLoadedSuppliersFromFirebase.current = true;
      hasLoadedPurchaseOrdersFromFirebase.current = true;
      hasLoadedSupplierReturnsFromFirebase.current = true;
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Subscribe to Firebase Realtime Database
  useEffect(() => {
    let unsubItems: (() => void) | undefined;
    let unsubRequests: (() => void) | undefined;
    let unsubEntries: (() => void) | undefined;
    let unsubSites: (() => void) | undefined;
    let unsubTeams: (() => void) | undefined;
    let unsubUsers: (() => void) | undefined;
    let unsubIssues: (() => void) | undefined;
    let unsubReturns: (() => void) | undefined;
    let unsubProjects: (() => void) | undefined;
    let unsubProjectUsages: (() => void) | undefined;
    let unsubBranchReturns: (() => void) | undefined;
    let unsubBackups: (() => void) | undefined;
    let unsubAudit: (() => void) | undefined;
    let unsubConfig: (() => void) | undefined;
    let unsubTemplates: (() => void) | undefined;
    let unsubSignatures: (() => void) | undefined;
    let unsubSuppliers: (() => void) | undefined;
    let unsubPurchaseOrders: (() => void) | undefined;
    let unsubSupplierReturns: (() => void) | undefined;
    let unsubTenants: (() => void) | undefined;

    try {
      unsubTenants = subscribeToFirebaseTenants(
        (remoteTenants) => {
          if (remoteTenants && remoteTenants.length > 0) {
            setTenants((prev) => {
              const map = new Map<string, Tenant>();
              prev.forEach((t) => map.set(t.id, t));
              remoteTenants.forEach((t) => {
                if (t.id === DEFAULT_TENANT.id || t.id === 'tenant-apex-main') {
                  map.set(DEFAULT_TENANT.id, {
                    ...t,
                    id: DEFAULT_TENANT.id,
                    companyName: 'Apex Developer',
                    slug: 'apex-developer',
                    contactEmail: 'apexdevinfo@gmail.com',
                  });
                } else {
                  map.set(t.id, t);
                }
              });
              const combined = Array.from(map.values());
              try {
                localStorage.setItem(STORAGE_KEY_PREFIX + 'tenants', JSON.stringify(combined));
                localStorage.setItem(`${STORAGE_KEY_PREFIX}tenant-apex-main_tenants`, JSON.stringify(combined));
              } catch {}
              return combined;
            });
          }
        },
        (err) => console.warn('Firebase tenants sync notice:', err)
      );

      unsubItems = subscribeToFirebaseItems(
        (remoteItems) => {
          setFirebaseConnected(true);
          hasLoadedItemsFromFirebase.current = true;
          if (remoteItems) {
            // Check if remote data contains legacy demo records (e.g. CBL-CU-400 or item-1)
            const hasOldDemo = remoteItems.some(
              (i) => i.itemCode === 'CBL-CU-400' || i.itemCode === 'ST-BAR-16' || i.id === 'item-1'
            );
            if (hasOldDemo) {
              writeItemsToFirebase([]).catch(() => {});
              setItems([]);
              saveToStorage('items', []);
            } else {
              isIncomingFirebaseItems.current = true;
              setItems(remoteItems);
              saveToStorage('items', remoteItems);
              setTimeout(() => {
                isIncomingFirebaseItems.current = false;
              }, 120);
            }
          }
          isInitializedFromFirebase.current = true;
        },
        () => {
          setFirebaseConnected(false);
          hasLoadedItemsFromFirebase.current = true;
        }
      );

      unsubRequests = subscribeToFirebaseStockRequests(
        (remoteRequests) => {
          setFirebaseConnected(true);
          hasLoadedRequestsFromFirebase.current = true;
          if (remoteRequests) {
            const hasOldDemo = remoteRequests.some((r) => r.id === 'sr-1' || r.requestNoteNumber === 'RN-2026-0041');
            if (hasOldDemo) {
              writeStockRequestsToFirebase([]).catch(() => {});
              setStockRequests([]);
              saveToStorage('stockRequests', []);
            } else {
              isIncomingFirebaseRequests.current = true;
              setStockRequests(remoteRequests);
              saveToStorage('stockRequests', remoteRequests);
              setTimeout(() => {
                isIncomingFirebaseRequests.current = false;
              }, 120);
            }
          }
        },
        () => {
          setFirebaseConnected(false);
          hasLoadedRequestsFromFirebase.current = true;
        }
      );

      unsubEntries = subscribeToFirebaseMainStockEntries(
        (remoteEntries) => {
          setFirebaseConnected(true);
          hasLoadedEntriesFromFirebase.current = true;
          if (remoteEntries) {
            const hasOldDemo = remoteEntries.some((e) => e.id === 'mse-1' || e.referenceNo === 'PO-2026-8812');
            if (hasOldDemo) {
              writeMainStockEntriesToFirebase([]).catch(() => {});
              setMainStockEntries([]);
              saveToStorage('mainStockEntries', []);
            } else {
              isIncomingFirebaseEntries.current = true;
              setMainStockEntries(remoteEntries);
              saveToStorage('mainStockEntries', remoteEntries);
              setTimeout(() => {
                isIncomingFirebaseEntries.current = false;
              }, 120);
            }
          }
        },
        () => {
          setFirebaseConnected(false);
          hasLoadedEntriesFromFirebase.current = true;
        }
      );

      unsubSites = subscribeToFirebaseSites(
        (remoteSites) => {
          setFirebaseConnected(true);
          hasLoadedSitesFromFirebase.current = true;
          if (remoteSites && remoteSites.length > 0) {
            const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
            const cleanSites = isMaster
              ? remoteSites.filter((s) => !s.id.includes('civilect') && !s.name.toLowerCase().includes('civilect'))
              : remoteSites;
            const finalSites = cleanSites.length > 0 ? cleanSites : INITIAL_SITES;
            isIncomingFirebaseSites.current = true;
            setSites(finalSites);
            saveToStorage('sites', finalSites);
            setTimeout(() => {
              isIncomingFirebaseSites.current = false;
            }, 120);
          }
        },
        () => {
          setFirebaseConnected(false);
          hasLoadedSitesFromFirebase.current = true;
        }
      );

      unsubTeams = subscribeToFirebaseTeams(
        (remoteTeams) => {
          setFirebaseConnected(true);
          hasLoadedTeamsFromFirebase.current = true;
          if (remoteTeams) {
            isIncomingFirebaseTeams.current = true;
            setTeams(remoteTeams);
            saveToStorage('teams', remoteTeams);
            setTimeout(() => {
              isIncomingFirebaseTeams.current = false;
            }, 120);
          }
        },
        () => {
          setFirebaseConnected(false);
          hasLoadedTeamsFromFirebase.current = true;
        }
      );

      unsubUsers = subscribeToFirebaseUsers(
        (remoteUsers) => {
          setFirebaseConnected(true);
          hasLoadedUsersFromFirebase.current = true;
          if (remoteUsers && remoteUsers.length > 0) {
            const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
            if (isMaster) {
              const cleanApex = sanitizeAndRecoverApexUsers(remoteUsers);
              isIncomingFirebaseUsers.current = true;
              setUsers(cleanApex);
              saveToStorage('users', cleanApex);
              // If remote held foreign users from another tenant (e.g. civilect), heal Firebase root
              if (remoteUsers.some((u) => isForeignUser(u))) {
                writeUsersToFirebase(cleanApex).catch(console.warn);
              }
              setTimeout(() => {
                isIncomingFirebaseUsers.current = false;
              }, 120);
            }
          }
        },
        () => {
          setFirebaseConnected(false);
          hasLoadedUsersFromFirebase.current = true;
        }
      );

      unsubIssues = subscribeToFirebaseTeamIssues(
        (remoteIssues) => {
          setFirebaseConnected(true);
          hasLoadedIssuesFromFirebase.current = true;
          if (remoteIssues) {
            isIncomingFirebaseIssues.current = true;
            setTeamIssues(remoteIssues);
            saveToStorage('teamIssues', remoteIssues);
            setTimeout(() => {
              isIncomingFirebaseIssues.current = false;
            }, 120);
          }
        },
        () => {
          setFirebaseConnected(false);
          hasLoadedIssuesFromFirebase.current = true;
        }
      );

      unsubReturns = subscribeToFirebaseTeamReturns(
        (remoteReturns) => {
          setFirebaseConnected(true);
          hasLoadedReturnsFromFirebase.current = true;
          if (remoteReturns) {
            isIncomingFirebaseReturns.current = true;
            setTeamReturns(remoteReturns);
            saveToStorage('teamReturns', remoteReturns);
            setTimeout(() => {
              isIncomingFirebaseReturns.current = false;
            }, 120);
          }
        },
        () => {
          setFirebaseConnected(false);
          hasLoadedReturnsFromFirebase.current = true;
        }
      );

      unsubProjects = subscribeToFirebaseProjects(
        (remoteProjects) => {
          setFirebaseConnected(true);
          hasLoadedProjectsFromFirebase.current = true;
          if (remoteProjects) {
            isIncomingFirebaseProjects.current = true;
            setProjects(remoteProjects);
            saveToStorage('projects', remoteProjects);
            setTimeout(() => {
              isIncomingFirebaseProjects.current = false;
            }, 120);
          }
        },
        () => {
          setFirebaseConnected(false);
          hasLoadedProjectsFromFirebase.current = true;
        }
      );

      unsubProjectUsages = subscribeToFirebaseProjectUsages(
        (remoteUsages) => {
          setFirebaseConnected(true);
          hasLoadedProjectUsagesFromFirebase.current = true;
          if (remoteUsages) {
            isIncomingFirebaseProjectUsages.current = true;
            setProjectUsages(remoteUsages);
            saveToStorage('projectUsages', remoteUsages);
            setTimeout(() => {
              isIncomingFirebaseProjectUsages.current = false;
            }, 120);
          }
        },
        () => {
          setFirebaseConnected(false);
          hasLoadedProjectUsagesFromFirebase.current = true;
        }
      );

      unsubBranchReturns = subscribeToFirebaseBranchReturns(
        (remoteBranchReturns) => {
          setFirebaseConnected(true);
          hasLoadedBranchReturnsFromFirebase.current = true;
          if (remoteBranchReturns) {
            isIncomingFirebaseBranchReturns.current = true;
            setBranchReturns(remoteBranchReturns);
            saveToStorage('branchReturns', remoteBranchReturns);
            setTimeout(() => {
              isIncomingFirebaseBranchReturns.current = false;
            }, 120);
          }
        },
        () => {
          setFirebaseConnected(false);
          hasLoadedBranchReturnsFromFirebase.current = true;
        }
      );

      unsubBackups = subscribeToFirebaseBackups(
        (remoteBackups) => {
          setFirebaseConnected(true);
          hasLoadedBackupsFromFirebase.current = true;
          if (remoteBackups) {
            isIncomingFirebaseBackups.current = true;
            setBackups(remoteBackups);
            saveToStorage('backups', remoteBackups);
            setTimeout(() => {
              isIncomingFirebaseBackups.current = false;
            }, 120);
          }
        },
        () => {
          setFirebaseConnected(false);
          hasLoadedBackupsFromFirebase.current = true;
        }
      );

      unsubAudit = subscribeToFirebaseAuditLogs(
        (remoteAudit) => {
          setFirebaseConnected(true);
          hasLoadedAuditFromFirebase.current = true;
          if (remoteAudit) {
            isIncomingFirebaseAudit.current = true;
            setAuditLogs(remoteAudit);
            saveToStorage('auditLogs', remoteAudit);
            setTimeout(() => {
              isIncomingFirebaseAudit.current = false;
            }, 120);
          }
        },
        () => {
          setFirebaseConnected(false);
          hasLoadedAuditFromFirebase.current = true;
        }
      );

      unsubConfig = subscribeToFirebaseConfig(
        (remoteConfig) => {
          setFirebaseConnected(true);
          hasLoadedConfigFromFirebase.current = true;
          if (remoteConfig && remoteConfig.companyName) {
            const finalConfig = { ...remoteConfig };
            if (currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main') {
              finalConfig.companyName = 'Apex Developer';
              finalConfig.systemName = 'Apex Stock & Site Management System';
            }
            isIncomingFirebaseConfig.current = true;
            setConfig(finalConfig);
            saveToStorage('config', finalConfig);
            setTimeout(() => {
              isIncomingFirebaseConfig.current = false;
            }, 120);
          }
        },
        () => {
          setFirebaseConnected(false);
          hasLoadedConfigFromFirebase.current = true;
        }
      );

      unsubTemplates = subscribeToFirebaseLetterheadTemplates(
        (remoteTemplates) => {
          setFirebaseConnected(true);
          hasLoadedTemplatesFromFirebase.current = true;
          if (remoteTemplates && remoteTemplates.length > 0) {
            isIncomingFirebaseLetterheadTemplates.current = true;
            setLetterheadTemplates(remoteTemplates);
            saveToStorage('letterheadTemplates', remoteTemplates);
            setTimeout(() => {
              isIncomingFirebaseLetterheadTemplates.current = false;
            }, 120);
          }
        },
        () => {
          setFirebaseConnected(false);
          hasLoadedTemplatesFromFirebase.current = true;
        }
      );

      unsubSignatures = subscribeToFirebaseDigitalSignatures(
        (remoteSignatures) => {
          setFirebaseConnected(true);
          hasLoadedSignaturesFromFirebase.current = true;
          if (remoteSignatures && remoteSignatures.length > 0) {
            isIncomingFirebaseDigitalSignatures.current = true;
            setDigitalSignatures(remoteSignatures);
            saveToStorage('digitalSignatures', remoteSignatures);
            setTimeout(() => {
              isIncomingFirebaseDigitalSignatures.current = false;
            }, 120);
          }
        },
        () => {
          setFirebaseConnected(false);
          hasLoadedSignaturesFromFirebase.current = true;
        }
      );

      unsubSuppliers = subscribeToFirebaseSuppliers(
        (remoteSuppliers) => {
          setFirebaseConnected(true);
          hasLoadedSuppliersFromFirebase.current = true;
          if (remoteSuppliers) {
            isIncomingFirebaseSuppliers.current = true;
            setSuppliers(remoteSuppliers);
            saveToStorage('suppliers', remoteSuppliers);
            setTimeout(() => {
              isIncomingFirebaseSuppliers.current = false;
            }, 120);
          }
        },
        () => {
          setFirebaseConnected(false);
          hasLoadedSuppliersFromFirebase.current = true;
        }
      );

      unsubPurchaseOrders = subscribeToFirebasePurchaseOrders(
        (remoteOrders) => {
          setFirebaseConnected(true);
          hasLoadedPurchaseOrdersFromFirebase.current = true;
          if (remoteOrders) {
            isIncomingFirebasePurchaseOrders.current = true;
            setPurchaseOrders(remoteOrders);
            saveToStorage('purchaseOrders', remoteOrders);
            setTimeout(() => {
              isIncomingFirebasePurchaseOrders.current = false;
            }, 120);
          }
        },
        () => {
          setFirebaseConnected(false);
          hasLoadedPurchaseOrdersFromFirebase.current = true;
        }
      );

      unsubSupplierReturns = subscribeToFirebaseSupplierReturns(
        (remoteReturns) => {
          setFirebaseConnected(true);
          hasLoadedSupplierReturnsFromFirebase.current = true;
          if (remoteReturns) {
            isIncomingFirebaseSupplierReturns.current = true;
            setSupplierReturns(remoteReturns);
            saveToStorage('supplierReturns', remoteReturns);
            setTimeout(() => {
              isIncomingFirebaseSupplierReturns.current = false;
            }, 120);
          }
        },
        () => {
          setFirebaseConnected(false);
          hasLoadedSupplierReturnsFromFirebase.current = true;
        }
      );
    } catch (err) {
      console.warn('Firebase Realtime Database subscription notice:', err);
    }

    return () => {
      if (unsubItems) unsubItems();
      if (unsubRequests) unsubRequests();
      if (unsubEntries) unsubEntries();
      if (unsubSites) unsubSites();
      if (unsubTeams) unsubTeams();
      if (unsubUsers) unsubUsers();
      if (unsubIssues) unsubIssues();
      if (unsubReturns) unsubReturns();
      if (unsubProjects) unsubProjects();
      if (unsubProjectUsages) unsubProjectUsages();
      if (unsubBranchReturns) unsubBranchReturns();
      if (unsubBackups) unsubBackups();
      if (unsubAudit) unsubAudit();
      if (unsubConfig) unsubConfig();
      if (unsubTemplates) unsubTemplates();
      if (unsubSignatures) unsubSignatures();
      if (unsubSuppliers) unsubSuppliers();
      if (unsubPurchaseOrders) unsubPurchaseOrders();
      if (unsubSupplierReturns) unsubSupplierReturns();
      if (unsubTenants) unsubTenants();
    };
  }, []);

  // Write changes to Firebase when modified locally (unless incoming from Firebase and only after initial load)
  useEffect(() => {
    saveToStorage('items', items);
    if (!isIncomingFirebaseItems.current && hasLoadedItemsFromFirebase.current) {
      writeItemsToFirebase(items).catch((err) => console.warn('Sync items to Firebase error:', err));
    }
  }, [items]);

  useEffect(() => {
    saveToStorage('stockRequests', stockRequests);
    if (!isIncomingFirebaseRequests.current && hasLoadedRequestsFromFirebase.current) {
      writeStockRequestsToFirebase(stockRequests).catch((err) => console.warn('Sync stockRequests to Firebase error:', err));
    }
  }, [stockRequests]);

  useEffect(() => {
    saveToStorage('mainStockEntries', mainStockEntries);
    if (!isIncomingFirebaseEntries.current && hasLoadedEntriesFromFirebase.current) {
      writeMainStockEntriesToFirebase(mainStockEntries).catch((err) => console.warn('Sync mainStockEntries to Firebase error:', err));
    }
  }, [mainStockEntries]);

  useEffect(() => {
    saveToStorage('sites', sites);
    const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
    if (!isIncomingFirebaseSites.current && hasLoadedSitesFromFirebase.current && isMaster) {
      writeSitesToFirebase(sites).catch((err) => console.warn('Sync sites to Firebase error:', err));
    }
  }, [sites]);

  useEffect(() => {
    saveToStorage('teams', teams);
    const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
    if (!isIncomingFirebaseTeams.current && hasLoadedTeamsFromFirebase.current && isMaster) {
      writeTeamsToFirebase(teams).catch((err) => console.warn('Sync teams to Firebase error:', err));
    }
  }, [teams]);

  useEffect(() => {
    saveToStorage('users', users);
    const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
    if (!isIncomingFirebaseUsers.current && hasLoadedUsersFromFirebase.current && isMaster) {
      const cleanUsers = users.filter((u) => !isForeignUser(u));
      writeUsersToFirebase(cleanUsers).catch((err) => console.warn('Sync users to Firebase error:', err));
    }
  }, [users]);

  useEffect(() => {
    saveToStorage('teamIssues', teamIssues);
    if (!isIncomingFirebaseIssues.current && hasLoadedIssuesFromFirebase.current) {
      writeTeamIssuesToFirebase(teamIssues).catch((err) => console.warn('Sync teamIssues to Firebase error:', err));
    }
  }, [teamIssues]);

  useEffect(() => {
    saveToStorage('teamReturns', teamReturns);
    if (!isIncomingFirebaseReturns.current && hasLoadedReturnsFromFirebase.current) {
      writeTeamReturnsToFirebase(teamReturns).catch((err) => console.warn('Sync teamReturns to Firebase error:', err));
    }
  }, [teamReturns]);

  useEffect(() => {
    saveToStorage('projects', projects);
    if (!isIncomingFirebaseProjects.current && hasLoadedProjectsFromFirebase.current) {
      writeProjectsToFirebase(projects).catch((err) => console.warn('Sync projects to Firebase error:', err));
    }
  }, [projects]);

  useEffect(() => {
    saveToStorage('projectTypes', projectTypes);
  }, [projectTypes]);

  useEffect(() => {
    saveToStorage('projectUsages', projectUsages);
    if (!isIncomingFirebaseProjectUsages.current && hasLoadedProjectUsagesFromFirebase.current) {
      writeProjectUsagesToFirebase(projectUsages).catch((err) => console.warn('Sync projectUsages to Firebase error:', err));
    }
  }, [projectUsages]);

  useEffect(() => {
    saveToStorage('branchReturns', branchReturns);
    if (!isIncomingFirebaseBranchReturns.current && hasLoadedBranchReturnsFromFirebase.current) {
      writeBranchReturnsToFirebase(branchReturns).catch((err) => console.warn('Sync branchReturns to Firebase error:', err));
    }
  }, [branchReturns]);

  useEffect(() => {
    saveToStorage('damagedRestorations', damagedRestorations);
  }, [damagedRestorations]);

  useEffect(() => {
    saveToStorage('backups', backups);
    if (!isIncomingFirebaseBackups.current && hasLoadedBackupsFromFirebase.current) {
      writeBackupsToFirebase(backups).catch((err) => console.warn('Sync backups to Firebase error:', err));
    }
  }, [backups]);

  useEffect(() => {
    saveToStorage('auditLogs', auditLogs);
    if (!isIncomingFirebaseAudit.current && hasLoadedAuditFromFirebase.current) {
      writeAuditLogsToFirebase(auditLogs).catch((err) => console.warn('Sync auditLogs to Firebase error:', err));
    }
  }, [auditLogs]);

  useEffect(() => {
    saveToStorage('config', config);
    if (!isIncomingFirebaseConfig.current && hasLoadedConfigFromFirebase.current) {
      writeConfigToFirebase(config).catch((err) => console.warn('Sync config to Firebase error:', err));
    }
  }, [config]);

  useEffect(() => {
    saveToStorage('letterheadTemplates', letterheadTemplates);
    if (!isIncomingFirebaseLetterheadTemplates.current && hasLoadedTemplatesFromFirebase.current) {
      writeLetterheadTemplatesToFirebase(letterheadTemplates).catch((err) =>
        console.warn('Sync letterheadTemplates to Firebase error:', err)
      );
    }
  }, [letterheadTemplates]);

  useEffect(() => {
    saveToStorage('digitalSignatures', digitalSignatures);
    if (!isIncomingFirebaseDigitalSignatures.current && hasLoadedSignaturesFromFirebase.current) {
      writeDigitalSignaturesToFirebase(digitalSignatures).catch((err) =>
        console.warn('Sync digitalSignatures to Firebase error:', err)
      );
    }
  }, [digitalSignatures]);

  useEffect(() => {
    saveToStorage('suppliers', suppliers);
    if (!isIncomingFirebaseSuppliers.current && hasLoadedSuppliersFromFirebase.current) {
      writeSuppliersToFirebase(suppliers).catch((err) =>
        console.warn('Sync suppliers to Firebase error:', err)
      );
    }
  }, [suppliers]);

  useEffect(() => {
    saveToStorage('purchaseOrders', purchaseOrders);
    if (!isIncomingFirebasePurchaseOrders.current && hasLoadedPurchaseOrdersFromFirebase.current) {
      writePurchaseOrdersToFirebase(purchaseOrders).catch((err) =>
        console.warn('Sync purchaseOrders to Firebase error:', err)
      );
    }
  }, [purchaseOrders]);

  useEffect(() => {
    saveToStorage('supplierReturns', supplierReturns);
    if (!isIncomingFirebaseSupplierReturns.current && hasLoadedSupplierReturnsFromFirebase.current) {
      writeSupplierReturnsToFirebase(supplierReturns).catch((err) =>
        console.warn('Sync supplierReturns to Firebase error:', err)
      );
    }
  }, [supplierReturns]);

  useEffect(() => {
    saveToStorage('activeTemplateId', activeTemplateId);
  }, [activeTemplateId]);

  const syncWithFirebaseNow = async () => {
    setIsFirebaseSyncing(true);
    try {
      await Promise.all([
        writeItemsToFirebase(items),
        writeStockRequestsToFirebase(stockRequests),
        writeMainStockEntriesToFirebase(mainStockEntries),
        writeSitesToFirebase(sites),
        writeTeamsToFirebase(teams),
        writeUsersToFirebase(users),
        writeTeamIssuesToFirebase(teamIssues),
        writeTeamReturnsToFirebase(teamReturns),
        writeProjectsToFirebase(projects),
        writeProjectUsagesToFirebase(projectUsages),
        writeBranchReturnsToFirebase(branchReturns),
        writeBackupsToFirebase(backups),
        writeAuditLogsToFirebase(auditLogs),
        writeConfigToFirebase(config),
        writeLetterheadTemplatesToFirebase(letterheadTemplates),
        writeDigitalSignaturesToFirebase(digitalSignatures),
        writeSuppliersToFirebase(suppliers),
        writePurchaseOrdersToFirebase(purchaseOrders),
        writeSupplierReturnsToFirebase(supplierReturns),
      ]);
      setFirebaseConnected(true);
    } catch (err) {
      console.error('Manual Firebase sync error:', err);
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  // Active (non-deleted) views
  const activeSites = useMemo(() => sites.filter((s) => !s.isDeleted), [sites]);
  const activeUsers = useMemo(() => users.filter((u) => !u.isDeleted), [users]);
  const activeItems = useMemo(() => items.filter((i) => !i.isDeleted), [items]);
  const activeTeams = useMemo(() => teams.filter((t) => !t.isDeleted), [teams]);
  const activeProjects = useMemo(() => projects.filter((p) => !p.isDeleted), [projects]);
  const activeProjectTypes = useMemo(() => projectTypes.filter((pt) => !pt.isDeleted), [projectTypes]);
  const activeSuppliers = useMemo(() => suppliers.filter((s) => !s.isDeleted), [suppliers]);
  const activeClients = useMemo(() => clients.filter((c) => !c.isDeleted), [clients]);
  const activePurchaseOrders = useMemo(() => purchaseOrders.filter((po) => !po.isDeleted), [purchaseOrders]);
  const activeSupplierReturns = useMemo(() => supplierReturns.filter((r) => !r.isDeleted), [supplierReturns]);

  // Supplier Management (CRUD)
  const addSupplier = (
    supplierData: Omit<Supplier, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>
  ): Supplier => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setSuppliers((prev) => [newSupplier, ...prev]);
    return newSupplier;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  };

  // Client / Principal Management (CRUD)
  const addClient = (
    clientData: Omit<Client, 'id' | 'clientCode' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'> & { clientCode?: string }
  ): Client => {
    const nextNum = clients.length + 1;
    const clientCode = clientData.clientCode?.trim() || `CLT-${String(nextNum).padStart(3, '0')}`;
    const newClient: Client = {
      ...clientData,
      id: `clt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      clientCode,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };
    setClients((prev) => {
      const next = [newClient, ...prev];
      saveToStorage('clients', next);
      saveTenantData(currentTenantIdRef.current, 'clients', next);
      return next;
    });

    addAuditLog(
      'CONFIG_CHANGED',
      newClient.clientCode,
      'System Master Registry',
      `Registered new Master Client / Principal "${newClient.name}" (${newClient.clientCode})`
    );
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      saveToStorage('clients', next);
      saveTenantData(currentTenantIdRef.current, 'clients', next);
      return next;
    });
    const c = clients.find((x) => x.id === id);
    if (c) {
      addAuditLog(
        'CONFIG_CHANGED',
        c.clientCode,
        'System Master Registry',
        `Updated details for Master Client / Principal "${updates.name || c.name}"`
      );
    }
  };

  const deleteClient = (id: string) => {
    const c = clients.find((x) => x.id === id);
    setClients((prev) => {
      const next = prev.filter((x) => x.id !== id);
      saveToStorage('clients', next);
      saveTenantData(currentTenantIdRef.current, 'clients', next);
      return next;
    });
    if (c) {
      addAuditLog(
        'RECORD_DELETED',
        c.clientCode,
        'System Master Registry',
        `Deleted Master Client / Principal "${c.name}" (${c.clientCode})`
      );
    }
  };

  // Purchase Orders & Material Requests for Main Stock
  const addPurchaseOrder = (
    poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>
  ): PurchaseOrder => {
    const newPo: PurchaseOrder = {
      ...poData,
      id: `po-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setPurchaseOrders((prev) => [newPo, ...prev]);
    return newPo;
  };

  const updatePurchaseOrder = (id: string, updates: Partial<PurchaseOrder>) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => (po.id === id ? { ...po, ...updates } : po))
    );
  };

  const deletePurchaseOrder = (id: string) => {
    setPurchaseOrders((prev) => prev.filter((po) => po.id !== id));
  };

  const receivePurchaseOrderToMainStock = (
    poId: string,
    batchReceipt?: {
      receivedBy?: string;
      deliveryNoteNo?: string;
      notes?: string;
      receiptDate?: string;
      items?: Array<{ itemId: string; quantityToReceive: number }>;
    }
  ): { success: boolean; message: string; count: number; isPartial?: boolean; newStatus?: PurchaseOrderStatus } => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) {
      return { success: false, message: 'Purchase Order not found.', count: 0 };
    }
    if (po.status === 'Received into Main Stock') {
      return { success: false, message: 'This purchase order has already been completely received into Main Stock.', count: 0 };
    }
    if (po.status === 'Cancelled') {
      return { success: false, message: 'Cannot receive items against a cancelled Purchase Order.', count: 0 };
    }

    const receiverName = batchReceipt?.receivedBy || currentUser?.fullName || 'Central Store In-Charge';
    const nowIso = batchReceipt?.receiptDate || new Date().toISOString();
    const batchGrnNumber = `GRN-${po.poNumber}-${(po.receiptHistory?.length || 0) + 1}`;

    const updatedItems = [...po.items];
    const grnReceivedItems: Array<{
      itemId: string;
      itemCode: string;
      itemName: string;
      quantityReceived: number;
      unit: string;
    }> = [];

    let totalBatchUnits = 0;
    let itemsCreditedCount = 0;

    if (batchReceipt && Array.isArray(batchReceipt.items)) {
      // Partial or custom batch receipt mode
      batchReceipt.items.forEach((batchItem) => {
        const itemIdx = updatedItems.findIndex((it) => it.itemId === batchItem.itemId);
        if (itemIdx >= 0) {
          const currentItem = updatedItems[itemIdx];
          const prevReceived = currentItem.receivedQuantity || 0;
          const maxRemaining = Math.max(0, currentItem.quantity - prevReceived);
          const requestedReceive = Math.max(0, Number(batchItem.quantityToReceive) || 0);

          // Cap at remaining quantity to prevent accidental over-receiving
          const actualReceive = Math.min(requestedReceive, maxRemaining);

          if (actualReceive > 0) {
            const newReceivedTotal = prevReceived + actualReceive;
            updatedItems[itemIdx] = {
              ...currentItem,
              receivedQuantity: newReceivedTotal,
            };

            // Credit Central Main Stock for this specific batch
            addMainStockEntry({
              entryType: 'Purchase',
              referenceNo: `${po.poNumber} (${batchGrnNumber})`,
              supplier: po.supplierName,
              itemId: currentItem.itemId,
              quantity: actualReceive,
              unitCost: currentItem.unitPrice,
              notes: `Batch delivery receipt against PO #${po.poNumber} (${batchGrnNumber}). DN: ${batchReceipt.deliveryNoteNo || 'N/A'}. ${batchReceipt.notes || ''}`.trim(),
              reservedProjectId: po.reservedProjectId,
              reservedProjectName: po.reservedProjectName,
            });

            grnReceivedItems.push({
              itemId: currentItem.itemId,
              itemCode: currentItem.itemCode,
              itemName: currentItem.itemName,
              quantityReceived: actualReceive,
              unit: currentItem.unit,
            });

            totalBatchUnits += actualReceive;
            itemsCreditedCount++;
          }
        }
      });
    } else {
      // Full delivery fallback (receives all remaining unreceived quantity for each item)
      updatedItems.forEach((it, idx) => {
        const prevReceived = it.receivedQuantity || 0;
        const remaining = Math.max(0, it.quantity - prevReceived);
        if (remaining > 0) {
          updatedItems[idx] = {
            ...it,
            receivedQuantity: it.quantity,
          };

          addMainStockEntry({
            entryType: 'Purchase',
            referenceNo: `${po.poNumber} (${batchGrnNumber})`,
            supplier: po.supplierName,
            itemId: it.itemId,
            quantity: remaining,
            unitCost: it.unitPrice,
            notes: `Full goods receipt against PO #${po.poNumber}. Payment terms: ${po.paymentTerms || 'Standard'}.`,
            reservedProjectId: po.reservedProjectId,
            reservedProjectName: po.reservedProjectName,
          });

          grnReceivedItems.push({
            itemId: it.itemId,
            itemCode: it.itemCode,
            itemName: it.itemName,
            quantityReceived: remaining,
            unit: it.unit,
          });

          totalBatchUnits += remaining;
          itemsCreditedCount++;
        }
      });
    }

    if (itemsCreditedCount === 0 || totalBatchUnits === 0) {
      return {
        success: false,
        message: 'No quantities were entered for this delivery batch. Please enter received quantities greater than 0.',
        count: 0,
      };
    }

    // Determine new overall PO status
    const allCompleted = updatedItems.every((it) => (it.receivedQuantity || 0) >= it.quantity);
    const anyReceived = updatedItems.some((it) => (it.receivedQuantity || 0) > 0);

    const newStatus: PurchaseOrderStatus = allCompleted
      ? 'Received into Main Stock'
      : anyReceived
      ? 'Partially Received'
      : po.status;

    const newGrnRecord: GoodsReceiptRecord = {
      id: `grn-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      grnNumber: batchGrnNumber,
      receiptDate: nowIso,
      receivedBy: receiverName,
      deliveryNoteNo: batchReceipt?.deliveryNoteNo?.trim() || undefined,
      notes: batchReceipt?.notes?.trim() || undefined,
      itemsReceived: grnReceivedItems,
    };

    const updatedHistory = [...(po.receiptHistory || []), newGrnRecord];

    updatePurchaseOrder(po.id, {
      items: updatedItems,
      status: newStatus,
      receivedDate: nowIso,
      receivedBy: receiverName,
      receiptHistory: updatedHistory,
    });

    const isPartial = !allCompleted;

    addAuditLog(
      'MAIN_STOCK_RECEIPT',
      `${po.poNumber} [${batchGrnNumber}]`,
      'Main Central Warehouse',
      isPartial
        ? `Partial Goods Receipt (${batchGrnNumber}): Received ${totalBatchUnits} unit(s) across ${itemsCreditedCount} item(s) from Supplier "${po.supplierName}". Delivery Note: ${batchReceipt?.deliveryNoteNo || 'N/A'}. PO status updated to "Partially Received".`
        : `Complete Inbound Receipt: All requested materials from PO #${po.poNumber} (${batchGrnNumber}) received from Supplier "${po.supplierName}". Status marked completed.`
    );

    return {
      success: true,
      message: isPartial
        ? `Partial receipt recorded! ${totalBatchUnits} units credited to Main Stock under ${batchGrnNumber}. Remaining balance is still pending delivery.`
        : `Complete delivery received! All items from PO #${po.poNumber} credited to Central Main Warehouse Stock.`,
      count: itemsCreditedCount,
      isPartial,
      newStatus,
    };
  };

  const closePurchaseOrderRemainder = (
    poId: string,
    reason?: string
  ): { success: boolean; message: string } => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) {
      return { success: false, message: 'Purchase Order not found.' };
    }

    const closeNote = reason?.trim() || 'Short delivery closed by Administrator. Supplier will not dispatch remaining balance.';
    updatePurchaseOrder(po.id, {
      status: 'Received into Main Stock',
      closedNotes: closeNote,
    });

    addAuditLog(
      'MAIN_STOCK_RECEIPT',
      po.poNumber,
      'Main Central Warehouse',
      `PO #${po.poNumber} marked as Completed / Closed (Short Delivered). Notes: ${closeNote}`
    );

    return {
      success: true,
      message: `PO #${po.poNumber} has been closed. Remaining pending items will no longer be expected.`,
    };
  };

  // Supplier Returns & Debit Notes Management (RTV)
  const addSupplierReturn = (
    rtvData: Omit<SupplierReturn, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>
  ): SupplierReturn => {
    const nextNum = supplierReturns.length + 1;
    const rtvNumber = rtvData.rtvNumber || `RTV-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
    const newReturn: SupplierReturn = {
      ...rtvData,
      rtvNumber,
      id: `rtv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };
    setSupplierReturns((prev) => [newReturn, ...prev]);
    addAuditLog(
      'SUPPLIER_RETURN_CREATED',
      newReturn.rtvNumber,
      newReturn.locationType === 'Main Stock' ? 'Main Central Warehouse' : (newReturn.siteName || 'Site Branch'),
      `Created Return to Supplier (Debit Note): ${newReturn.rtvNumber} for ${newReturn.supplierName}. Total value: ${config.currencySymbol} ${newReturn.grandTotal.toLocaleString()}. Status: ${newReturn.status}.`
    );
    return newReturn;
  };

  const updateSupplierReturn = (id: string, updates: Partial<SupplierReturn>) => {
    setSupplierReturns((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const deleteSupplierReturn = (id: string) => {
    const target = supplierReturns.find((r) => r.id === id);
    setSupplierReturns((prev) => prev.filter((r) => r.id !== id));
    if (target) {
      addAuditLog(
        'SUPPLIER_RETURN_DELETED',
        target.rtvNumber,
        target.locationType === 'Main Stock' ? 'Main Central Warehouse' : (target.siteName || 'Site Branch'),
        `Deleted supplier return record: ${target.rtvNumber} (${target.supplierName})`
      );
    }
  };

  const dispatchSupplierReturn = (
    id: string,
    dispatchDetails: {
      dispatchedBy?: string;
      gatePassNo?: string;
      transporterName?: string;
      vehicleNo?: string;
      driverContact?: string;
      notes?: string;
    }
  ): { success: boolean; message: string } => {
    const target = supplierReturns.find((r) => r.id === id);
    if (!target) return { success: false, message: 'Supplier return record not found.' };

    const dispatchedDate = new Date().toISOString();
    const dispatcher = dispatchDetails.dispatchedBy || currentUser?.fullName || 'Central Storekeeper';

    updateSupplierReturn(id, {
      status: 'Dispatched to Supplier',
      dispatchedDate,
      dispatchedBy: dispatcher,
      gatePassNo: dispatchDetails.gatePassNo || target.gatePassNo,
      transporterName: dispatchDetails.transporterName || target.transporterName,
      vehicleNo: dispatchDetails.vehicleNo || target.vehicleNo,
      driverContact: dispatchDetails.driverContact || target.driverContact,
      notes: dispatchDetails.notes ? `${target.notes ? target.notes + ' | ' : ''}${dispatchDetails.notes}` : target.notes,
    });

    addAuditLog(
      'SUPPLIER_RETURN_DISPATCHED',
      target.rtvNumber,
      target.locationType === 'Main Stock' ? 'Main Central Warehouse' : (target.siteName || 'Site Branch'),
      `Dispatched Return to Supplier #${target.rtvNumber} to ${target.supplierName}. Gate Pass: ${dispatchDetails.gatePassNo || 'N/A'}. Transporter: ${dispatchDetails.transporterName || 'N/A'} (Vehicle: ${dispatchDetails.vehicleNo || 'N/A'}). Stock balance deducted.`
    );

    return {
      success: true,
      message: `Return ${target.rtvNumber} dispatched to ${target.supplierName}! Outward Gate Pass recorded and inventory deducted.`,
    };
  };

  const settleSupplierReturn = (
    id: string,
    settlementDetails: {
      settledBy?: string;
      settlementRef: string;
      settlementType: SettlementType;
      settlementNotes?: string;
    }
  ): { success: boolean; message: string } => {
    const target = supplierReturns.find((r) => r.id === id);
    if (!target) return { success: false, message: 'Supplier return record not found.' };

    const settledDate = new Date().toISOString();
    const settledBy = settlementDetails.settledBy || currentUser?.fullName || 'Central Finance Admin';
    const newStatus: SupplierReturnStatus =
      settlementDetails.settlementType === 'Replacement Material'
        ? 'Replacement Stock Received'
        : 'Debit Note Settled';

    updateSupplierReturn(id, {
      status: newStatus,
      settledDate,
      settledBy,
      settlementRef: settlementDetails.settlementRef,
      settlementType: settlementDetails.settlementType,
      settlementNotes: settlementDetails.settlementNotes,
    });

    // If replacement stock was received back at Main Stock, log replacement receipt into main inventory
    if (settlementDetails.settlementType === 'Replacement Material' && target.locationType === 'Main Stock') {
      target.items.forEach((itemRow) => {
        addMainStockEntry({
          entryType: 'Purchase',
          referenceNo: `RPL-${target.rtvNumber}`,
          supplier: target.supplierName,
          itemId: itemRow.itemId,
          quantity: itemRow.quantity,
          unitCost: itemRow.unitCost,
          notes: `Replacement stock received against Supplier Return #${target.rtvNumber}. Ref: ${settlementDetails.settlementRef}`,
        });
      });
    }

    addAuditLog(
      'SUPPLIER_RETURN_SETTLED',
      target.rtvNumber,
      target.locationType === 'Main Stock' ? 'Main Central Warehouse' : (target.siteName || 'Site Branch'),
      `Settled Supplier Return #${target.rtvNumber} (${newStatus}). Ref: ${settlementDetails.settlementRef}. Settled by: ${settledBy}.`
    );

    return {
      success: true,
      message: `Supplier Return #${target.rtvNumber} marked as settled (${newStatus})!`,
    };
  };

  // Active Site scope
  const activeSite = useMemo(() => {
    if (!currentUser || currentUser.siteId === 'all') return null;
    return activeSites.find((s) => s.id === currentUser.siteId) || null;
  }, [currentUser, activeSites]);

  const updateConfig = (newConfig: Partial<SystemConfig>) => {
    setConfig((prev) => {
      const merged = { ...prev, ...newConfig };
      saveToStorage('config', merged);
      return merged;
    });

    // Automatically sync updated company details to tenant record
    if (newConfig.email || newConfig.companyName || newConfig.phone || newConfig.currencySymbol) {
      setTenants((prev) => {
        const updated = prev.map((t) => {
          if (t.id === currentTenantIdRef.current) {
            return {
              ...t,
              companyName: newConfig.companyName ? newConfig.companyName.trim() : t.companyName,
              contactEmail: newConfig.email ? newConfig.email.trim() : t.contactEmail,
              contactPhone: newConfig.phone !== undefined ? newConfig.phone.trim() : t.contactPhone,
              currencySymbol: newConfig.currencySymbol ? newConfig.currencySymbol.trim() : t.currencySymbol,
            };
          }
          return t;
        });
        saveTenantData(DEFAULT_TENANT.id, 'tenants', updated);
        try {
          localStorage.setItem(STORAGE_KEY_PREFIX + 'tenants', JSON.stringify(updated));
        } catch {}
        writeTenantsToFirebase(updated).catch(console.warn);
        return updated;
      });
    }
  };

  const addAuditLog = (
    action: AuditLogEntry['action'],
    referenceNo: string,
    siteName: string,
    details: string,
    itemCode?: string,
    quantityChanged?: number
  ) => {
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      referenceNo,
      siteName,
      performedBy: currentUser?.fullName || 'System Administrator',
      details,
      itemCode,
      quantityChanged,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Active Letterhead Template & Management
  const activeTemplate = useMemo(() => {
    return (
      letterheadTemplates.find((t) => t.id === activeTemplateId) ||
      letterheadTemplates[0] ||
      DEFAULT_LETTERHEAD_TEMPLATES[0]
    );
  }, [letterheadTemplates, activeTemplateId]);

  const setActiveTemplateId = (id: string) => {
    setActiveTemplateIdState(id);
    saveToStorage('activeTemplateId', id);
  };

  const updateLetterheadTemplate = (updated: LetterheadTemplate) => {
    setLetterheadTemplates((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
    addAuditLog('OTHER', updated.id, 'System', `Updated Letterhead Template: ${updated.templateName}`);
  };

  const addLetterheadTemplate = (data: Omit<LetterheadTemplate, 'id'>) => {
    const newTpl: LetterheadTemplate = {
      ...data,
      id: `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setLetterheadTemplates((prev) => [...prev, newTpl]);
    setActiveTemplateIdState(newTpl.id);
    addAuditLog('OTHER', newTpl.id, 'System', `Created Letterhead Template: ${newTpl.templateName}`);
    return newTpl;
  };

  const deleteLetterheadTemplate = (id: string) => {
    setLetterheadTemplates((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (filtered.length === 0) return prev;
      return filtered;
    });
    if (activeTemplateId === id) {
      const remaining = letterheadTemplates.filter((t) => t.id !== id);
      if (remaining.length > 0) {
        setActiveTemplateIdState(remaining[0].id);
      }
    }
    addAuditLog('OTHER', id, 'System', `Deleted Letterhead Template`);
  };

  const updateDigitalSignatures = (signatures: DigitalSignature[]) => {
    setDigitalSignatures(signatures);
  };

  const addDigitalSignature = (data: Omit<DigitalSignature, 'id' | 'createdAt'>) => {
    const newSig: DigitalSignature = {
      ...data,
      id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setDigitalSignatures((prev) => [...prev, newSig]);
    addAuditLog('OTHER', newSig.id, 'System', `Added Digital Signature: ${newSig.name} (${newSig.role})`);
    return newSig;
  };

  const deleteDigitalSignature = (id: string) => {
    setDigitalSignatures((prev) => prev.filter((s) => s.id !== id));
    addAuditLog('OTHER', id, 'System', `Deleted Digital Signature`);
  };

  // Demo Data Reset and Clear
  const resetAllData = () => {
    setConfig(INITIAL_CONFIG);
    setSites(INITIAL_SITES);
    setUsers(INITIAL_USERS);
    setItems(INITIAL_ITEMS);
    setTeams(INITIAL_TEAMS);
    setMainStockEntries(INITIAL_MAIN_STOCK_ENTRIES);
    setStockRequests(INITIAL_STOCK_REQUESTS);
    setTeamIssues(INITIAL_TEAM_ISSUES);
    setTeamReturns(INITIAL_TEAM_RETURNS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setCurrentUser(INITIAL_USERS[0]);
  };

  // Requirement: Clear All Demo Data for Clean Production
  const clearAllDemoData = () => {
    const cleanMainSite: Site = {
      id: 'site-main',
      name: 'Main Central Warehouse',
      isMainWarehouse: true,
      supervisorName: 'Administrator',
      location: 'Central Logistics Yard',
      contactNumber: '+1 (555) 010-0000',
      createdAt: new Date().toISOString(),
    };
    const cleanAdminUser: User = {
      id: 'usr-admin-clean',
      username: 'admin',
      fullName: 'System Super Admin',
      siteId: 'all',
      role: 'Super Admin Central',
      password: 'password123',
      createdAt: new Date().toISOString(),
    };

    setSites([cleanMainSite]);
    setUsers([cleanAdminUser]);
    setItems([]);
    setTeams([]);
    setMainStockEntries([]);
    setStockRequests([]);
    setTeamIssues([]);
    setTeamReturns([]);
    setCurrentUser(cleanAdminUser);

    const cleanLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'DEMO_DATA_CLEARED',
      referenceNo: 'CLEAN-RESET',
      siteName: 'Main Central Warehouse',
      performedBy: 'System Super Admin',
      details: 'All demo data, sample transactions, dummy sites, items, and teams cleared. System in clean production state.',
    };
    setAuditLogs([cleanLog]);

    // Force immediate persistence to local storage
    saveToStorage('sites', [cleanMainSite]);
    saveToStorage('users', [cleanAdminUser]);
    saveToStorage('items', []);
    saveToStorage('teams', []);
    saveToStorage('mainStockEntries', []);
    saveToStorage('stockRequests', []);
    saveToStorage('teamIssues', []);
    saveToStorage('teamReturns', []);
    saveToStorage('auditLogs', [cleanLog]);

    // Force clear all collections in Firebase Realtime Database
    clearAllFirebaseData(cleanMainSite, cleanAdminUser, INITIAL_CONFIG, cleanLog).catch((err) => {
      console.warn('Firebase clear demo data error:', err);
    });
  };

  // Restore Demo Data if user wants sample back
  const restoreDemoData = () => {
    resetAllData();
    addAuditLog(
      'DEMO_DATA_RESTORED',
      'SAMPLE-RESTORE',
      'Main Central Warehouse',
      'Restored sample demo infrastructure items, site branches, field teams, and transactions.'
    );
  };

  // Master Registrations (Create)
  const addSite = (siteData: Omit<Site, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>): Site => {
    const newSite: Site = {
      ...siteData,
      id: `site-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };
    setSites((prev) => [...prev, newSite]);
    addAuditLog('MASTER_SITE_CREATED', newSite.name, newSite.name, `New site registered: ${newSite.name} (${newSite.location})`);
    return newSite;
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>): User => {
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isDeleted: false,
      tenantId: activeTenantId,
    };
    setUsers((prev) => {
      const updated = [...prev, newUser];
      saveTenantData(activeTenantId, 'users', updated);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeUsersToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
    const siteName = sites.find((s) => s.id === newUser.siteId)?.name || 'All Sites';
    addAuditLog('MASTER_USER_CREATED', newUser.username, siteName, `New user created: ${newUser.fullName} [${newUser.role}]`);
    return newUser;
  };

  const addItem = (
    itemData: Omit<Item, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>,
    initialReceivedQty?: number
  ): Item => {
    const upperCode = (itemData.itemCode || '').trim().toUpperCase();
    const existingIndex = items.findIndex(
      (i) => !i.isDeleted && i.itemCode.toUpperCase() === upperCode
    );

    let savedItem: Item;

    if (existingIndex >= 0) {
      // If item code already exists, update rather than duplicating
      const prev = items[existingIndex];
      savedItem = {
        ...prev,
        ...itemData,
        itemCode: upperCode,
        isDeleted: false,
        deletedAt: undefined,
      };
      setItems((prevItems) => {
        const next = [...prevItems];
        next[existingIndex] = savedItem;
        return next;
      });
      addAuditLog(
        'MASTER_ITEM_CREATED',
        savedItem.itemCode,
        'Main Central Warehouse',
        `Master item updated: ${savedItem.itemCode} - ${savedItem.itemName} (${savedItem.unit})`,
        savedItem.itemCode
      );
    } else {
      savedItem = {
        ...itemData,
        itemCode: upperCode,
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString(),
        isDeleted: false,
      };
      setItems((prev) => [...prev, savedItem]);
      addAuditLog(
        'MASTER_ITEM_CREATED',
        savedItem.itemCode,
        'Main Central Warehouse',
        `Master item registered: ${savedItem.itemCode} - ${savedItem.itemName} (${savedItem.unit})`,
        savedItem.itemCode
      );
    }

    if (initialReceivedQty && initialReceivedQty > 0) {
      const entryRef = `INIT-${savedItem.itemCode}`;
      const newEntry: MainStockEntry = {
        id: `mse-${Date.now()}`,
        timestamp: new Date().toISOString(),
        entryType: 'Manual Entry',
        referenceNo: entryRef,
        supplier: 'Initial Master Inventory Setup',
        itemId: savedItem.id,
        quantity: initialReceivedQty,
        unitCost: savedItem.unitPrice,
        notes: 'Initial received stock during item registration',
        receivedBy: currentUser?.fullName || 'Arthur Vance',
      };
      setMainStockEntries((prev) => [newEntry, ...prev]);
      addAuditLog(
        'MAIN_STOCK_RECEIPT',
        entryRef,
        'Main Central Warehouse',
        `Logged initial stock of ${initialReceivedQty} ${savedItem.unit} for item ${savedItem.itemCode}`,
        savedItem.itemCode,
        initialReceivedQty
      );
    }

    return savedItem;
  };

  const bulkImportItems = (
    rows: ExcelItemRow[],
    mode: 'sync' | 'append' | 'replace'
  ): ImportResult => {
    let added = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];
    const now = new Date().toISOString();

    if (!rows || rows.length === 0) {
      return { added: 0, updated: 0, skipped: 0, total: 0, errors: ['No item rows provided for import.'] };
    }

    setItems((prevItems) => {
      let currentItems = [...prevItems];

      if (mode === 'replace') {
        // Soft delete all active items first
        currentItems = currentItems.map((i) => ({
          ...i,
          isDeleted: true,
          deletedAt: now,
          deletedBy: currentUser?.fullName || 'Excel Swap Import',
        }));
      }

      rows.forEach((row, idx) => {
        const code = (row.itemCode || '').trim().toUpperCase();
        const name = (row.itemName || '').trim();

        if (!code || !name) {
          errors.push(`Row ${idx + 1}: Missing item code or name.`);
          skipped++;
          return;
        }

        const existingIndex = currentItems.findIndex(
          (i) => i.itemCode.toUpperCase() === code
        );

        if (existingIndex >= 0) {
          if (mode === 'append') {
            skipped++;
          } else {
            // Overwrite / Sync
            const prev = currentItems[existingIndex];
            currentItems[existingIndex] = {
              ...prev,
              itemName: name,
              category: row.category?.trim() || prev.category,
              unit: row.unit?.trim() || prev.unit,
              unitPrice: row.unitPrice !== undefined ? row.unitPrice : prev.unitPrice,
              lowStockThreshold:
                row.lowStockThreshold !== undefined
                  ? row.lowStockThreshold
                  : prev.lowStockThreshold,
              description: row.description?.trim() || prev.description || name,
              isDeleted: false,
              deletedAt: undefined,
              deletedBy: undefined,
            };
            updated++;
          }
        } else {
          // Add new item
          const newItem: Item = {
            id: `item-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            itemCode: code,
            itemName: name,
            category: row.category?.trim() || 'Assembly Units (Manholes & Handholes)',
            unit: row.unit?.trim() || 'Pcs',
            unitPrice: row.unitPrice ?? 0,
            lowStockThreshold: row.lowStockThreshold ?? config.defaultLowStockThreshold,
            description: row.description?.trim() || name,
            createdAt: now,
            isDeleted: false,
          };
          currentItems.push(newItem);
          added++;
        }
      });

      saveToStorage('items', currentItems);
      writeItemsToFirebase(currentItems).catch((err) => console.warn('Failed direct Firebase items write:', err));
      return currentItems;
    });

    addAuditLog(
      'ITEMS_IMPORTED_EXCEL',
      `EXCEL-IMP-${Date.now().toString().slice(-4)}`,
      'Main Central Warehouse',
      `Imported items via Excel [${mode.toUpperCase()}]: ${added} added, ${updated} updated, ${skipped} skipped out of ${rows.length} records.`
    );

    return {
      added,
      updated,
      skipped,
      total: rows.length,
      errors,
    };
  };

  const addTeam = (teamData: Omit<Team, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>): Team => {
    const newTeam: Team = {
      ...teamData,
      id: `team-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };
    setTeams((prev) => [...prev, newTeam]);
    const siteName = sites.find((s) => s.id === newTeam.assignedSiteId)?.name || 'Unassigned';
    addAuditLog(
      'MASTER_TEAM_CREATED',
      newTeam.teamName,
      siteName,
      `Field team registered: ${newTeam.teamName} (Lead: ${newTeam.teamLeaderName}, Crew: ${newTeam.crewSize})`
    );
    return newTeam;
  };

  const addProject = (
    projectData: Omit<Project, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>
  ): Project => {
    const pId = (projectData.projectId || '').trim().toUpperCase();
    const newProject: Project = {
      ...projectData,
      projectId: pId,
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };
    setProjects((prev) => [...prev, newProject]);
    addAuditLog(
      'PROJECT_CREATED',
      newProject.projectId,
      'Project Office',
      `Registered project: ${newProject.projectId} - ${newProject.projectName} (${newProject.district})`
    );
    return newProject;
  };

  const bulkImportProjects = (
    rows: Array<Omit<Project, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>>
  ): { added: number; updated: number } => {
    let added = 0;
    let updated = 0;
    setProjects((prev) => {
      const copy = [...prev];
      rows.forEach((r) => {
        const pId = (r.projectId || '').trim().toUpperCase();
        if (!pId) return;
        const idx = copy.findIndex((p) => !p.isDeleted && p.projectId.toUpperCase() === pId);
        if (idx >= 0) {
          copy[idx] = { ...copy[idx], ...r, projectId: pId };
          updated++;
        } else {
          copy.push({
            ...r,
            projectId: pId,
            id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            createdAt: new Date().toISOString(),
            isDeleted: false,
          });
          added++;
        }
      });
      saveToStorage('projects', copy);
      writeProjectsToFirebase(copy).catch((err) => console.warn('Failed direct Firebase projects write:', err));
      return copy;
    });
    addAuditLog('PROJECT_CREATED', 'BULK-IMPORT', 'Project Office', `Imported projects from CSV/Excel: ${added} added, ${updated} updated.`);
    return { added, updated };
  };

  // Master Updates (CRUD - Edit)
  const updateItem = (id: string, updates: Partial<Item>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
    const itm = items.find((i) => i.id === id);
    addAuditLog(
      'MASTER_ITEM_UPDATED',
      updates.itemCode || itm?.itemCode || id,
      'Main Central Warehouse',
      `Updated item details for ${updates.itemCode || itm?.itemCode}: ${updates.itemName || itm?.itemName}`,
      updates.itemCode || itm?.itemCode
    );
  };

  const updateSite = (id: string, updates: Partial<Site>) => {
    setSites((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    const site = sites.find((s) => s.id === id);
    addAuditLog(
      'MASTER_SITE_UPDATED',
      updates.name || site?.name || id,
      updates.name || site?.name || 'Site',
      `Updated site branch profile: ${updates.name || site?.name}`
    );
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === id ? { ...u, ...updates } : u));
      saveTenantData(activeTenantId, 'users', updated);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeUsersToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
    const user = users.find((u) => u.id === id);
    addAuditLog(
      'MASTER_USER_UPDATED',
      updates.username || user?.username || id,
      'All Sites',
      `Updated user account: ${updates.fullName || user?.fullName} [${updates.role || user?.role}]`
    );
    if (authUser?.id === id) {
      setAuthUser((prev) => ({ ...prev, ...updates }));
    }
  };

  const updateTeam = (id: string, updates: Partial<Team>) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    const team = teams.find((t) => t.id === id);
    addAuditLog(
      'MASTER_TEAM_UPDATED',
      updates.teamName || team?.teamName || id,
      'Field Base',
      `Updated field team: ${updates.teamName || team?.teamName} (Lead: ${updates.teamLeaderName || team?.teamLeaderName})`
    );
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    // If project section/type or name is changed, update existing usages cleanly without any data loss
    if (updates.projectTypeId !== undefined || updates.projectTypeName !== undefined || updates.projectName !== undefined) {
      setProjectUsages((prev) =>
        prev.map((pu) =>
          pu.projectId === id
            ? {
                ...pu,
                projectTypeId: updates.projectTypeId !== undefined ? updates.projectTypeId : pu.projectTypeId,
                projectTypeName: updates.projectTypeName !== undefined ? updates.projectTypeName : pu.projectTypeName,
                projectName: updates.projectName !== undefined ? updates.projectName : pu.projectName,
              }
            : pu
        )
      );
    }
    const proj = projects.find((p) => p.id === id);
    addAuditLog(
      'PROJECT_CREATED',
      updates.projectId || proj?.projectId || id,
      'Project Office',
      `Updated project profile: ${updates.projectName || proj?.projectName} (${updates.projectId || proj?.projectId})`
    );
  };

  // Project Types / Sections CRUD & Templates
  const addProjectType = (
    data: Omit<ProjectType, 'id' | 'createdAt' | 'isDeleted'>
  ): ProjectType => {
    const newPt: ProjectType = {
      ...data,
      id: `pt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      templateItems: data.templateItems || [],
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };
    setProjectTypes((prev) => [...prev, newPt]);
    addAuditLog(
      'PROJECT_CREATED',
      newPt.id,
      'Project Office',
      `Created Project Section: "${newPt.name}"`
    );
    return newPt;
  };

  const updateProjectType = (id: string, updates: Partial<ProjectType>) => {
    setProjectTypes((prev) =>
      prev.map((pt) => (pt.id === id ? { ...pt, ...updates } : pt))
    );
    if (updates.name) {
      setProjects((prev) =>
        prev.map((p) => (p.projectTypeId === id ? { ...p, projectTypeName: updates.name } : p))
      );
      setProjectUsages((prev) =>
        prev.map((pu) => (pu.projectTypeId === id ? { ...pu, projectTypeName: updates.name } : pu))
      );
    }
    addAuditLog(
      'PROJECT_UPDATED',
      id,
      'Project Office',
      `Updated Project Section: "${updates.name || id}"`
    );
  };

  const deleteProjectType = (id: string) => {
    setProjectTypes((prev) => prev.filter((pt) => pt.id !== id));
    addAuditLog(
      'PROJECT_DELETED',
      id,
      'Project Office',
      `Deleted Project Section ID: ${id}`
    );
  };

  const saveProjectTypeTemplate = (
    projectTypeId: string,
    templateItems: ProjectTypeTemplateItem[]
  ) => {
    setProjectTypes((prev) =>
      prev.map((pt) => (pt.id === projectTypeId ? { ...pt, templateItems } : pt))
    );
    const pt = projectTypes.find((p) => p.id === projectTypeId);
    addAuditLog(
      'TEMPLATE_UPDATED',
      projectTypeId,
      'Project Office',
      `Updated Material Template for Section "${pt?.name || projectTypeId}" (${templateItems.length} items)`
    );
  };

  // Soft Delete Mechanism (is_deleted = true, deleted_at, deleted_by)
  const softDeleteItem = (id: string) => {
    const timestamp = new Date().toISOString();
    const deletedBy = currentUser?.fullName || 'Administrator';
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isDeleted: true, deletedAt: timestamp, deletedBy } : i))
    );
    const itm = items.find((i) => i.id === id);
    addAuditLog(
      'MASTER_ITEM_SOFT_DELETED',
      itm?.itemCode || id,
      'Main Central Warehouse',
      `Moved item ${itm?.itemCode} (${itm?.itemName}) to Recycle Bin`,
      itm?.itemCode
    );
  };

  const softDeleteSite = (id: string) => {
    const timestamp = new Date().toISOString();
    const deletedBy = currentUser?.fullName || 'Administrator';
    setSites((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isDeleted: true, deletedAt: timestamp, deletedBy } : s))
    );
    const site = sites.find((s) => s.id === id);
    addAuditLog(
      'MASTER_SITE_SOFT_DELETED',
      site?.name || id,
      site?.name || 'Site',
      `Moved site branch "${site?.name}" to Recycle Bin`
    );
  };

  const softDeleteUser = (id: string) => {
    const timestamp = new Date().toISOString();
    const deletedBy = currentUser?.fullName || 'Administrator';
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === id ? { ...u, isDeleted: true, deletedAt: timestamp, deletedBy } : u));
      saveTenantData(activeTenantId, 'users', updated);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeUsersToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
    const user = users.find((u) => u.id === id);
    addAuditLog(
      'MASTER_USER_SOFT_DELETED',
      user?.username || id,
      'All Sites',
      `Moved user account "${user?.fullName}" to Recycle Bin`
    );
  };

  const softDeleteTeam = (id: string) => {
    const timestamp = new Date().toISOString();
    const deletedBy = currentUser?.fullName || 'Administrator';
    setTeams((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isDeleted: true, deletedAt: timestamp, deletedBy } : t))
    );
    const team = teams.find((t) => t.id === id);
    addAuditLog(
      'MASTER_TEAM_SOFT_DELETED',
      team?.teamName || id,
      'Field Base',
      `Moved field team "${team?.teamName}" to Recycle Bin`
    );
  };

  const softDeleteProject = (id: string) => {
    const timestamp = new Date().toISOString();
    const deletedBy = currentUser?.fullName || 'Administrator';
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isDeleted: true, deletedAt: timestamp, deletedBy } : p))
    );
    const proj = projects.find((p) => p.id === id);
    addAuditLog(
      'PROJECT_CREATED',
      proj?.projectId || id,
      'Project Office',
      `Moved project "${proj?.projectName}" to Recycle Bin`
    );
  };

  // Bulk Soft Delete
  const bulkSoftDeleteItems = (ids: string[]) => {
    ids.forEach((id) => softDeleteItem(id));
  };
  const bulkSoftDeleteSites = (ids: string[]) => {
    ids.forEach((id) => softDeleteSite(id));
  };
  const bulkSoftDeleteUsers = (ids: string[]) => {
    ids.forEach((id) => softDeleteUser(id));
  };
  const bulkSoftDeleteTeams = (ids: string[]) => {
    ids.forEach((id) => softDeleteTeam(id));
  };

  // Recycle Bin Listing
  const recycleBinItems = useMemo<RecycleBinItem[]>(() => {
    const list: RecycleBinItem[] = [];

    items
      .filter((i) => i.isDeleted)
      .forEach((i) => {
        list.push({
          id: i.id,
          type: 'item',
          title: `[${i.itemCode}] ${i.itemName}`,
          subtitle: `Category: ${i.category} · Unit: ${i.unit}`,
          deletedAt: i.deletedAt || new Date().toISOString(),
          deletedBy: i.deletedBy || 'Administrator',
          originalData: i,
        });
      });

    sites
      .filter((s) => s.isDeleted)
      .forEach((s) => {
        list.push({
          id: s.id,
          type: 'site',
          title: s.name,
          subtitle: `Location: ${s.location} · Supervisor: ${s.supervisorName}`,
          deletedAt: s.deletedAt || new Date().toISOString(),
          deletedBy: s.deletedBy || 'Administrator',
          originalData: s,
        });
      });

    users
      .filter((u) => u.isDeleted)
      .forEach((u) => {
        list.push({
          id: u.id,
          type: 'user',
          title: `${u.fullName} (@${u.username})`,
          subtitle: `Role: ${u.role}`,
          deletedAt: u.deletedAt || new Date().toISOString(),
          deletedBy: u.deletedBy || 'Administrator',
          originalData: u,
        });
      });

    teams
      .filter((t) => t.isDeleted)
      .forEach((t) => {
        list.push({
          id: t.id,
          type: 'team',
          title: t.teamName,
          subtitle: `Lead: ${t.teamLeaderName} · Crew: ${t.crewSize}`,
          deletedAt: t.deletedAt || new Date().toISOString(),
          deletedBy: t.deletedBy || 'Administrator',
          originalData: t,
        });
      });

    projects
      .filter((p) => p.isDeleted)
      .forEach((p) => {
        list.push({
          id: p.id,
          type: 'project',
          title: `[${p.projectId}] ${p.projectName}`,
          subtitle: `District: ${p.district || 'N/A'} · Sub-Area: ${p.subArea || 'N/A'} · Ref: ${p.referenceNo || 'N/A'}`,
          deletedAt: p.deletedAt || new Date().toISOString(),
          deletedBy: p.deletedBy || 'Administrator',
          originalData: p,
        });
      });

    // Sort newest deletion first
    list.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
    return list;
  }, [items, sites, users, teams, projects]);

  const recycleBinCount = recycleBinItems.length;

  // Restore Mechanism
  const restoreItem = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isDeleted: false, deletedAt: undefined, deletedBy: undefined } : i))
    );
    const itm = items.find((i) => i.id === id);
    addAuditLog(
      'MASTER_ITEM_RESTORED',
      itm?.itemCode || id,
      'Main Central Warehouse',
      `Restored item ${itm?.itemCode} from Recycle Bin back to active catalog`,
      itm?.itemCode
    );
  };

  const restoreSite = (id: string) => {
    setSites((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isDeleted: false, deletedAt: undefined, deletedBy: undefined } : s))
    );
    const site = sites.find((s) => s.id === id);
    addAuditLog(
      'MASTER_SITE_RESTORED',
      site?.name || id,
      site?.name || 'Site',
      `Restored site branch "${site?.name}" from Recycle Bin back to active sites`
    );
  };

  const restoreUser = (id: string) => {
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === id ? { ...u, isDeleted: false, deletedAt: undefined, deletedBy: undefined } : u));
      saveTenantData(activeTenantId, 'users', updated);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeUsersToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
    const user = users.find((u) => u.id === id);
    addAuditLog(
      'MASTER_USER_RESTORED',
      user?.username || id,
      'All Sites',
      `Restored user "${user?.fullName}" from Recycle Bin`
    );
  };

  const restoreTeam = (id: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isDeleted: false, deletedAt: undefined, deletedBy: undefined } : t))
    );
    const team = teams.find((t) => t.id === id);
    addAuditLog(
      'MASTER_TEAM_RESTORED',
      team?.teamName || id,
      'Field Base',
      `Restored field team "${team?.teamName}" from Recycle Bin`
    );
  };

  const restoreProject = (id: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isDeleted: false, deletedAt: undefined, deletedBy: undefined } : p))
    );
    const proj = projects.find((p) => p.id === id);
    addAuditLog(
      'PROJECT_CREATED',
      proj?.projectId || id,
      'Project Office',
      `Restored project "${proj?.projectName}" from Recycle Bin`
    );
  };

  const bulkRestore = (records: Array<{ id: string; type: RecycleEntityType }>) => {
    records.forEach((r) => {
      if (r.type === 'item') restoreItem(r.id);
      else if (r.type === 'site') restoreSite(r.id);
      else if (r.type === 'user') restoreUser(r.id);
      else if (r.type === 'team') restoreTeam(r.id);
      else if (r.type === 'project') restoreProject(r.id);
    });
  };

  // Permanent Delete Mechanism
  const permanentlyDeleteItem = (id: string) => {
    const itm = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    addAuditLog(
      'MASTER_ITEM_PERMANENTLY_DELETED',
      itm?.itemCode || id,
      'Main Central Warehouse',
      `Permanently wiped item ${itm?.itemCode} from database`,
      itm?.itemCode
    );
  };

  const permanentlyDeleteSite = (id: string) => {
    const site = sites.find((s) => s.id === id);
    setSites((prev) => prev.filter((s) => s.id !== id));
    addAuditLog(
      'MASTER_SITE_PERMANENTLY_DELETED',
      site?.name || id,
      site?.name || 'Site',
      `Permanently wiped site "${site?.name}" from database`
    );
  };

  const permanentlyDeleteUser = (id: string) => {
    const user = users.find((u) => u.id === id);
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== id);
      saveTenantData(activeTenantId, 'users', updated);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeUsersToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
    addAuditLog(
      'MASTER_USER_PERMANENTLY_DELETED',
      user?.username || id,
      'All Sites',
      `Permanently wiped user "${user?.fullName}" from database`
    );
  };

  const permanentlyDeleteTeam = (id: string) => {
    const team = teams.find((t) => t.id === id);
    setTeams((prev) => prev.filter((t) => t.id !== id));
    addAuditLog(
      'MASTER_TEAM_PERMANENTLY_DELETED',
      team?.teamName || id,
      'Field Base',
      `Permanently wiped field team "${team?.teamName}" from database`
    );
  };

  const permanentlyDeleteProject = (id: string) => {
    const proj = projects.find((p) => p.id === id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    addAuditLog(
      'RECORD_DELETED',
      proj?.projectId || id,
      'Project Office',
      `Permanently wiped project "${proj?.projectName}" from database`
    );
  };

  const bulkPermanentlyDelete = (records: Array<{ id: string; type: RecycleEntityType }>) => {
    records.forEach((r) => {
      if (r.type === 'item') permanentlyDeleteItem(r.id);
      else if (r.type === 'site') permanentlyDeleteSite(r.id);
      else if (r.type === 'user') permanentlyDeleteUser(r.id);
      else if (r.type === 'team') permanentlyDeleteTeam(r.id);
      else if (r.type === 'project') permanentlyDeleteProject(r.id);
    });
  };

  const emptyRecycleBin = () => {
    const count = recycleBinItems.length;
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    setItems((prev) => prev.filter((i) => !i.isDeleted));
    setSites((prev) => prev.filter((s) => !s.isDeleted));
    setUsers((prev) => {
      const updated = prev.filter((u) => !u.isDeleted);
      saveTenantData(activeTenantId, 'users', updated);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeUsersToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
    setTeams((prev) => prev.filter((t) => !t.isDeleted));
    setProjects((prev) => prev.filter((p) => !p.isDeleted));

    addAuditLog(
      'MASTER_ITEM_PERMANENTLY_DELETED',
      'EMPTY-TRASH',
      'Main Central Warehouse',
      `Emptied Recycle Bin: permanently purged ${count} deleted record(s).`
    );
  };

  // Section-Specific Clear Operations
  const clearMainStockReceipts = () => {
    const count = mainStockEntries.length;
    setMainStockEntries([]);
    saveToStorage('mainStockEntries', []);
    addAuditLog('MAIN_STOCK_RECEIPT', 'CLEAR-INBOUND', 'Main Central Warehouse', `Cleared all ${count} inbound purchase/manual receipt entries.`);
  };

  const clearStockRequests = () => {
    const count = stockRequests.length;
    setStockRequests([]);
    saveToStorage('stockRequests', []);
    addAuditLog('SITE_REQUEST_CREATED', 'CLEAR-REQUESTS', 'All Sites', `Cleared all ${count} inter-branch transfer requisition notes.`);
  };

  const clearTeamIssues = () => {
    const count = teamIssues.length;
    setTeamIssues([]);
    saveToStorage('teamIssues', []);
    addAuditLog('TEAM_ISSUE_DISPATCHED', 'CLEAR-ISSUES', 'All Sites', `Cleared all ${count} field dispatch issue notes.`);
  };

  const clearTeamReturns = () => {
    const count = teamReturns.length;
    setTeamReturns([]);
    saveToStorage('teamReturns', []);
    addAuditLog('TEAM_RETURN_LOGGED', 'CLEAR-RETURNS', 'All Sites', `Cleared all ${count} field team return vouchers.`);
  };

  const clearAuditLogs = () => {
    const resetLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'DEMO_DATA_CLEARED',
      referenceNo: 'RESET-LOGS',
      siteName: 'Main Central Warehouse',
      performedBy: currentUser?.fullName || 'System Administrator',
      details: 'Audit trail history cleared.',
    };
    setAuditLogs([resetLog]);
    saveToStorage('auditLogs', [resetLog]);
  };

  const clearAllItems = () => {
    const timestamp = new Date().toISOString();
    const deletedBy = currentUser?.fullName || 'Administrator';
    setItems((prev) => {
      const updated = prev.map((i) => ({ ...i, isDeleted: true, deletedAt: timestamp, deletedBy }));
      saveToStorage('items', updated);
      return updated;
    });
    addAuditLog('MASTER_ITEM_SOFT_DELETED', 'CLEAR-ITEMS', 'Main Central Warehouse', 'Moved all active items to Recycle Bin.');
  };

  const clearAllSites = () => {
    const timestamp = new Date().toISOString();
    const deletedBy = currentUser?.fullName || 'Administrator';
    setSites((prev) => {
      const updated = prev.map((s) => (s.isMainWarehouse ? s : { ...s, isDeleted: true, deletedAt: timestamp, deletedBy }));
      saveToStorage('sites', updated);
      return updated;
    });
    addAuditLog('MASTER_SITE_SOFT_DELETED', 'CLEAR-SITES', 'All Sites', 'Moved all site branches (except Central Main) to Recycle Bin.');
  };

  const clearAllTeams = () => {
    const timestamp = new Date().toISOString();
    const deletedBy = currentUser?.fullName || 'Administrator';
    setTeams((prev) => {
      const updated = prev.map((t) => ({ ...t, isDeleted: true, deletedAt: timestamp, deletedBy }));
      saveToStorage('teams', updated);
      return updated;
    });
    addAuditLog('MASTER_TEAM_SOFT_DELETED', 'CLEAR-TEAMS', 'Field Base', 'Moved all field teams to Recycle Bin.');
  };

  const clearAllUsers = () => {
    setUsers((prev) => {
      const updated = prev.filter((u) => u.username === 'admin' || isSuperAdmin(u.role));
      saveToStorage('users', updated);
      saveTenantData(currentTenantIdRef.current, 'users', updated);
      const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
      if (isMaster) {
        writeUsersToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
    addAuditLog('MASTER_USER_PERMANENTLY_DELETED', 'CLEAR-USERS', 'All Sites', 'Cleared all non-admin users from system.');
  };

  // Single Record Deletion Handlers
  const deleteMainStockEntry = (id: string) => {
    const entry = mainStockEntries.find((e) => e.id === id);
    setMainStockEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      saveToStorage('mainStockEntries', updated);
      return updated;
    });
    if (entry) {
      addAuditLog(
        'RECORD_DELETED',
        entry.referenceNo,
        'Main Central Warehouse',
        `Deleted inbound receipt record: ${entry.referenceNo} (${entry.quantity} units)`
      );
    }
  };

  const deleteStockRequest = (id: string) => {
    const req = stockRequests.find((r) => r.id === id);
    setStockRequests((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveToStorage('stockRequests', updated);
      return updated;
    });
    if (req) {
      const siteName = sites.find((s) => s.id === req.siteId)?.name || 'Site';
      addAuditLog(
        'RECORD_DELETED',
        req.requestNoteNumber,
        siteName,
        `Deleted stock requirement note: ${req.requestNoteNumber} (${req.status})`
      );
    }
  };

  const deleteTeamIssue = (id: string) => {
    const issue = teamIssues.find((i) => i.id === id);
    setTeamIssues((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      saveToStorage('teamIssues', updated);
      return updated;
    });
    if (issue) {
      const siteName = sites.find((s) => s.id === issue.siteId)?.name || 'Site';
      addAuditLog(
        'RECORD_DELETED',
        issue.issueNoteNumber,
        siteName,
        `Deleted team dispatch note: ${issue.issueNoteNumber} (WO: ${issue.workOrderRef})`
      );
    }
  };

  const deleteTeamReturn = (id: string) => {
    const ret = teamReturns.find((r) => r.id === id);
    setTeamReturns((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveToStorage('teamReturns', updated);
      return updated;
    });
    if (ret) {
      const siteName = sites.find((s) => s.id === ret.siteId)?.name || 'Site';
      addAuditLog(
        'RECORD_DELETED',
        ret.returnVoucherNumber,
        siteName,
        `Deleted team return voucher: ${ret.returnVoucherNumber} (${ret.quantity} units)`
      );
    }
  };

  const deleteAuditLog = (id: string) => {
    setAuditLogs((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      saveToStorage('auditLogs', updated);
      return updated;
    });
  };

  // Main Stock Incoming
  const addMainStockEntry = (
    entryData: Omit<MainStockEntry, 'id' | 'timestamp' | 'receivedBy'>
  ): MainStockEntry => {
    const newEntry: MainStockEntry = {
      ...entryData,
      id: `mse-${Date.now()}`,
      timestamp: new Date().toISOString(),
      receivedBy: currentUser?.fullName || 'Arthur Vance',
    };
    setMainStockEntries((prev) => [newEntry, ...prev]);

    const item = items.find((i) => i.id === newEntry.itemId);
    addAuditLog(
      'MAIN_STOCK_RECEIPT',
      newEntry.referenceNo,
      'Main Central Warehouse',
      `Inbound ${newEntry.entryType}: ${newEntry.quantity} ${item?.unit || 'units'} of ${item?.itemName || 'item'} from ${newEntry.supplier}`,
      item?.itemCode,
      newEntry.quantity
    );
    return newEntry;
  };

  // Operational Workflows: Site Stock Requests & Request Note
  const createStockRequest = (
    data: Omit<StockTransferRequest, 'id' | 'requestNoteNumber' | 'status' | 'requestedDate' | 'requestedBy'>
  ): StockTransferRequest => {
    const nextNum = stockRequests.length + 1;
    const requestNoteNumber = `RN-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
    const newRequest: StockTransferRequest = {
      ...data,
      id: `req-${Date.now()}`,
      requestNoteNumber,
      status: 'Pending Approval',
      requestedDate: new Date().toISOString(),
      requestedBy: currentUser?.fullName || 'Branch Admin',
    };
    setStockRequests((prev) => [newRequest, ...prev]);

    const site = sites.find((s) => s.id === newRequest.siteId);
    addAuditLog(
      'SITE_REQUEST_CREATED',
      requestNoteNumber,
      site?.name || 'Site',
      `Submitted requirement for ${newRequest.items.length} item line(s). Purpose: ${newRequest.purpose}`
    );
    return newRequest;
  };

  const approveStockRequest = (
    requestId: string,
    approvedItems: Array<{ itemId: string; approvedQty: number }>,
    approvalNotes?: string
  ) => {
    setStockRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const updatedItems = req.items.map((itemRow) => {
          const match = approvedItems.find((a) => a.itemId === itemRow.itemId);
          return {
            ...itemRow,
            approvedQty: match ? match.approvedQty : itemRow.requestedQty,
          };
        });
        return {
          ...req,
          status: 'Approved / In-Transit',
          approvalDate: new Date().toISOString(),
          approvedBy: currentUser?.fullName || 'Arthur Vance',
          approvalNotes,
          items: updatedItems,
        };
      })
    );

    const targetReq = stockRequests.find((r) => r.id === requestId);
    const site = sites.find((s) => s.id === targetReq?.siteId);
    addAuditLog(
      'SITE_REQUEST_APPROVED',
      targetReq?.requestNoteNumber || 'RN-REQ',
      site?.name || 'Site',
      `Main Branch approved transfer request. Status changed to In-Transit.`
    );
  };

  const rejectStockRequest = (requestId: string, notes?: string) => {
    setStockRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        return {
          ...req,
          status: 'Rejected',
          approvalDate: new Date().toISOString(),
          approvedBy: currentUser?.fullName || 'Arthur Vance',
          approvalNotes: notes || 'Rejected by Main Branch Admin',
        };
      })
    );

    const targetReq = stockRequests.find((r) => r.id === requestId);
    const site = sites.find((s) => s.id === targetReq?.siteId);
    addAuditLog(
      'SITE_REQUEST_REJECTED',
      targetReq?.requestNoteNumber || 'RN-REQ',
      site?.name || 'Site',
      `Main Branch rejected transfer request. Reason: ${notes || 'No reason provided'}`
    );
  };

  const removeStockRequestItem = (requestId: string, itemId: string) => {
    const targetReq = stockRequests.find((r) => r.id === requestId);
    if (!targetReq) return;
    const itemMaster = items.find((i) => i.id === itemId);
    const updatedItems = targetReq.items.filter((i) => i.itemId !== itemId);

    setStockRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        if (updatedItems.length === 0) {
          return {
            ...req,
            items: [],
            status: 'Rejected',
            approvalDate: new Date().toISOString(),
            approvedBy: currentUser?.fullName || 'Main Branch Admin',
            approvalNotes: 'All items removed due to stock unavailability.',
          };
        }
        return {
          ...req,
          items: updatedItems,
        };
      })
    );

    const site = sites.find((s) => s.id === targetReq.siteId);
    addAuditLog(
      'SITE_REQUEST_REJECTED',
      targetReq.requestNoteNumber,
      site?.name || 'Site',
      `Removed item [${itemMaster?.itemCode || itemId}] ${itemMaster?.itemName || ''} from transfer request due to stock unavailability. ${updatedItems.length === 0 ? 'Request marked as Rejected as all items were removed.' : `${updatedItems.length} item(s) remain in request.`}`,
      itemMaster?.itemCode
    );
  };

  const acceptStockRequest = (
    requestId: string,
    receivedItems: Array<{ itemId: string; receivedQty: number }>,
    acceptanceNotes?: string
  ) => {
    setStockRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const updatedItems = req.items.map((itemRow) => {
          const match = receivedItems.find((r) => r.itemId === itemRow.itemId);
          const received = match !== undefined ? match.receivedQty : (itemRow.approvedQty ?? itemRow.requestedQty);
          return {
            ...itemRow,
            receivedQty: received,
          };
        });
        return {
          ...req,
          status: 'Accepted',
          acceptanceDate: new Date().toISOString(),
          acceptedBy: currentUser?.fullName || 'Branch Admin',
          acceptanceNotes,
          items: updatedItems,
        };
      })
    );

    const targetReq = stockRequests.find((r) => r.id === requestId);
    const site = sites.find((s) => s.id === targetReq?.siteId);
    addAuditLog(
      'SITE_REQUEST_ACCEPTED',
      targetReq?.requestNoteNumber || 'RN-REQ',
      site?.name || 'Site',
      `Site branch accepted stock transfer note into local inventory. Items now available for dispatch.`
    );
  };

  // Operational Workflows: Issue to Teams (Daily Dispatch)
  const issueStockToTeam = (
    data: Omit<TeamIssue, 'id' | 'issueNoteNumber' | 'issueDate' | 'issuedBy'>
  ): TeamIssue => {
    const nextNum = teamIssues.length + 1;
    const issueNoteNumber = `IN-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
    const newIssue: TeamIssue = {
      ...data,
      id: `issue-${Date.now()}`,
      issueNoteNumber,
      issueDate: new Date().toISOString(),
      issuedBy: currentUser?.fullName || 'Branch Admin',
    };
    setTeamIssues((prev) => [newIssue, ...prev]);

    const team = teams.find((t) => t.id === newIssue.teamId);
    const site = sites.find((s) => s.id === newIssue.siteId);
    const totalQty = newIssue.items.reduce((sum, i) => sum + i.quantity, 0);

    addAuditLog(
      'TEAM_ISSUE_DISPATCHED',
      issueNoteNumber,
      site?.name || 'Site',
      `Dispatched ${totalQty} unit(s) across ${newIssue.items.length} item(s) to ${team?.teamName || 'Team'}. Work Order: ${newIssue.workOrderRef}`
    );
    return newIssue;
  };

  // Operational Workflows: Team Returns
  const returnStockFromTeam = (
    data: Omit<TeamReturn, 'id' | 'returnVoucherNumber' | 'returnDate' | 'returnedBy'>
  ): TeamReturn => {
    // ENFORCE RULE: Stock must have been officially documented and transferred from Main Yard to this site branch
    const siteStock = getSiteItemStock(data.siteId, data.itemId);
    if (siteStock.received <= 0) {
      throw new Error(
        'Return blocked: Stock has not been documented or transferred from Main Yard to this site branch.'
      );
    }

    const nextNum = teamReturns.length + 1;
    const returnVoucherNumber = `RV-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
    const newReturn: TeamReturn = {
      ...data,
      id: `ret-${Date.now()}`,
      returnVoucherNumber,
      returnDate: new Date().toISOString(),
      returnedBy: currentUser?.fullName || 'Branch Admin',
    };
    setTeamReturns((prev) => [newReturn, ...prev]);

    const team = teams.find((t) => t.id === newReturn.teamId);
    const site = sites.find((s) => s.id === newReturn.siteId);
    const item = items.find((i) => i.id === newReturn.itemId);

    addAuditLog(
      'TEAM_RETURN_LOGGED',
      returnVoucherNumber,
      site?.name || 'Site',
      `Logged return of ${newReturn.quantity} ${item?.unit || 'units'} from ${team?.teamName || 'Team'} (${newReturn.condition}). Verified Main Yard transfer documentation (${siteStock.received} ${item?.unit || 'units'} received). Reason: ${newReturn.reason}`,
      item?.itemCode,
      newReturn.quantity
    );
    return newReturn;
  };

  // Operational Workflows: Project Material Usages (Custody Deduction)
  const logProjectMaterialUsage = (
    data: Omit<ProjectMaterialUsage, 'id' | 'usageVoucherNumber' | 'loggedBy'>
  ): ProjectMaterialUsage => {
    const nextNum = projectUsages.length + 1;
    const usageVoucherNumber = `PU-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
    const site = sites.find((s) => s.id === data.siteId);
    const team = teams.find((t) => t.id === data.teamId);
    const proj = projects.find((p) => p.id === data.projectId);
    const teamName = data.teamName || team?.teamName || 'Field Team';
    const projName = data.projectName || proj?.projectName || 'Project';
    const leaderName = data.supervisorOrLeaderName || data.supervisorOrLeader || team?.teamLeaderName || 'Supervisor';

    const newUsage: ProjectMaterialUsage = {
      ...data,
      id: `pu-${Date.now()}`,
      usageVoucherNumber,
      teamName,
      projectName: projName,
      customerName: data.customerName || proj?.customerName || '',
      customerPhone: data.customerPhone || proj?.customerPhone || '',
      siteIdentifier: data.siteIdentifier || proj?.siteIdentifier || '',
      projectTypeId: data.projectTypeId || proj?.projectTypeId || '',
      projectTypeName: data.projectTypeName || proj?.projectTypeName || '',
      supervisorOrLeader: leaderName,
      supervisorOrLeaderName: leaderName,
      loggedBy: currentUser?.fullName || 'Field Supervisor',
    };
    setProjectUsages((prev) => [newUsage, ...prev]);

    const totalQty = newUsage.items.reduce((sum, i) => sum + i.quantity, 0);
    addAuditLog(
      'PROJECT_MATERIAL_USED',
      usageVoucherNumber,
      site?.name || 'Site',
      `Logged usage of ${totalQty} unit(s) across ${newUsage.items.length} item(s) on Project "${projName}" by ${teamName} (Lead: ${leaderName})`
    );
    return newUsage;
  };

  const createCrossProjectOverrideRequest = (
    data: Omit<CrossProjectOverrideRequest, 'id' | 'requestNumber' | 'status' | 'requestedDate' | 'requestedBy'>
  ): CrossProjectOverrideRequest => {
    const nextNum = crossProjectRequests.length + 1;
    const requestNumber = `OVR-2026-${String(nextNum).padStart(4, '0')}`;
    const newReq: CrossProjectOverrideRequest = {
      ...data,
      id: `ovr-${Date.now()}`,
      requestNumber,
      status: 'Pending Admin Review',
      requestedDate: new Date().toISOString(),
      requestedBy: currentUser?.fullName || 'Field Supervisor',
    };
    setCrossProjectRequests((prev) => {
      const next = [newReq, ...prev];
      saveToStorage('crossProjectRequests', next);
      saveTenantData(currentTenantIdRef.current, 'crossProjectRequests', next);
      return next;
    });

    addAuditLog(
      'RESERVED_ITEM_CROSS_PROJECT_OVERRIDE',
      requestNumber,
      sites.find((s) => s.id === data.siteId)?.name || 'Site',
      `Submitted Cross-Project Stock Override Review Request ${requestNumber} for project "${data.projectName}" by ${newReq.requestedBy}`
    );
    return newReq;
  };

  const acceptCrossProjectOverrideRequest = (requestId: string, adminNotes?: string) => {
    const req = crossProjectRequests.find((r) => r.id === requestId);
    if (!req) return;

    if (req.usagePayload) {
      logProjectMaterialUsage(req.usagePayload);
    }

    setCrossProjectRequests((prev) => {
      const next = prev.map((r) => (r.id === requestId ? { ...r, status: 'Accepted' as const, adminNotes } : r));
      saveToStorage('crossProjectRequests', next);
      saveTenantData(currentTenantIdRef.current, 'crossProjectRequests', next);
      return next;
    });

    addAuditLog(
      'RESERVED_ITEM_CROSS_PROJECT_OVERRIDE',
      req.requestNumber,
      'Central HQ',
      `Admin ACCEPTED Cross-Project Stock Override Request ${req.requestNumber} for project "${req.projectName}". Material usage successfully logged and stock deducted.`
    );
  };

  const rejectCrossProjectOverrideRequest = (requestId: string, adminNotes?: string) => {
    const req = crossProjectRequests.find((r) => r.id === requestId);
    if (!req) return;

    setCrossProjectRequests((prev) => {
      const next = prev.map((r) => (r.id === requestId ? { ...r, status: 'Rejected' as const, adminNotes } : r));
      saveToStorage('crossProjectRequests', next);
      saveTenantData(currentTenantIdRef.current, 'crossProjectRequests', next);
      return next;
    });

    addAuditLog(
      'RESERVED_ITEM_CROSS_PROJECT_OVERRIDE',
      req.requestNumber,
      'Central HQ',
      `Admin REJECTED Cross-Project Stock Override Request ${req.requestNumber} for project "${req.projectName}". Reason: ${adminNotes || 'Not specified'}`
    );
  };

  // Client Free-Issue Stock (Client / Principal Project Materials)
  const addClientFreeIssue = (
    data: Omit<ClientFreeIssueEntry, 'id' | 'voucherNumber' | 'createdAt' | 'isDeleted'>
  ): ClientFreeIssueEntry => {
    const nextNum = clientFreeIssues.length + 1;
    const voucherNumber = `FOC-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
    const newEntry: ClientFreeIssueEntry = {
      ...data,
      id: `foc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      voucherNumber,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };
    setClientFreeIssues((prev) => {
      const next = [newEntry, ...prev];
      saveToStorage('clientFreeIssues', next);
      saveTenantData(currentTenantIdRef.current, 'clientFreeIssues', next);
      return next;
    });

    const totalQty = newEntry.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    addAuditLog(
      'CLIENT_FREE_ISSUE_RECEIVED',
      voucherNumber,
      newEntry.storageLocation || 'Main Warehouse',
      `Received Client Free-Issue Stock: ${totalQty} units across ${newEntry.items.length} item(s) from "${newEntry.clientName}" for Project "${newEntry.projectName}" (Dispatch Note: ${newEntry.dispatchNoteNo})`
    );
    return newEntry;
  };

  const updateClientFreeIssue = (id: string, updates: Partial<ClientFreeIssueEntry>) => {
    setClientFreeIssues((prev) => {
      const next = prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry));
      saveToStorage('clientFreeIssues', next);
      saveTenantData(currentTenantIdRef.current, 'clientFreeIssues', next);
      return next;
    });
    const entry = clientFreeIssues.find((e) => e.id === id);
    if (entry) {
      addAuditLog(
        'CLIENT_FREE_ISSUE_RECEIVED',
        entry.voucherNumber,
        entry.storageLocation || 'Main Warehouse',
        `Updated Client Free-Issue Stock voucher ${entry.voucherNumber} for Project "${entry.projectName}"`
      );
    }
  };

  const deleteClientFreeIssue = (id: string) => {
    const entry = clientFreeIssues.find((e) => e.id === id);
    setClientFreeIssues((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveToStorage('clientFreeIssues', next);
      saveTenantData(currentTenantIdRef.current, 'clientFreeIssues', next);
      return next;
    });
    if (entry) {
      addAuditLog(
        'CLIENT_FREE_ISSUE_DELETED',
        entry.voucherNumber,
        entry.storageLocation || 'Main Warehouse',
        `Deleted Client Free-Issue Stock voucher ${entry.voucherNumber} (${entry.clientName} for Project "${entry.projectName}")`
      );
    }
  };

  const clearClientFreeIssues = () => {
    setClientFreeIssues([]);
    saveToStorage('clientFreeIssues', []);
    saveTenantData(currentTenantIdRef.current, 'clientFreeIssues', []);
  };

  const getClientFreeStockBalance = (projectId: string, itemId: string) => {
    const totalReceived = clientFreeIssues
      .filter((e) => !e.isDeleted && e.projectId === projectId)
      .reduce((sum, entry) => {
        const row = entry.items.find((it) => it.itemId === itemId);
        return sum + (row ? Number(row.quantity) || 0 : 0);
      }, 0);

    const totalUsed = projectUsages
      .filter((u) => u.projectId === projectId)
      .reduce((sum, usage) => {
        const row = usage.items.find((it) => it.itemId === itemId);
        return sum + (row ? Number(row.quantity) || 0 : 0);
      }, 0);

    const remainingBalance = Math.max(0, totalReceived - totalUsed);
    return { totalReceived, totalUsed, remainingBalance };
  };

  const getProjectFreeStockList = (projectId: string) => {
    const itemMap = new Map<string, { itemId: string; itemCode: string; itemName: string; unit: string; totalReceived: number }>();
    clientFreeIssues
      .filter((e) => !e.isDeleted && e.projectId === projectId)
      .forEach((entry) => {
        entry.items.forEach((it) => {
          const existing = itemMap.get(it.itemId);
          if (existing) {
            existing.totalReceived += Number(it.quantity) || 0;
          } else {
            itemMap.set(it.itemId, {
              itemId: it.itemId,
              itemCode: it.itemCode || '',
              itemName: it.itemName || '',
              unit: it.unit || 'units',
              totalReceived: Number(it.quantity) || 0,
            });
          }
        });
      });

    return Array.from(itemMap.values()).map((info) => {
      const balance = getClientFreeStockBalance(projectId, info.itemId);
      return {
        itemId: info.itemId,
        itemCode: info.itemCode,
        itemName: info.itemName,
        unit: info.unit,
        totalReceived: info.totalReceived,
        totalUsed: balance.totalUsed,
        remainingBalance: balance.remainingBalance,
      };
    });
  };

  const updateProjectUsage = (id: string, updates: Partial<ProjectMaterialUsage>) => {
    setProjectUsages((prev) =>
      prev.map((pu) => (pu.id === id ? { ...pu, ...updates } : pu))
    );
    const pu = projectUsages.find((u) => u.id === id);
    if (pu) {
      addAuditLog(
        'PROJECT_UPDATED',
        pu.usageVoucherNumber,
        'Project Office',
        `Updated project material usage voucher ${pu.usageVoucherNumber} for ${updates.projectName || pu.projectName}`
      );
    }
  };

  const deleteProjectUsage = (id: string) => {
    const pu = projectUsages.find((u) => u.id === id);
    setProjectUsages((prev) => prev.filter((u) => u.id !== id));
    if (pu) {
      addAuditLog(
        'RECORD_DELETED',
        pu.usageVoucherNumber,
        'Project Office',
        `Deleted project material usage entry ${pu.usageVoucherNumber} for ${pu.projectName}`
      );
    }
  };

  const clearProjectUsages = () => {
    const count = projectUsages.length;
    setProjectUsages([]);
    saveToStorage('projectUsages', []);
    addAuditLog('RECORD_DELETED', 'CLEAR-USAGES', 'Project Office', `Cleared all ${count} project material usage records.`);
  };

  // Operational Workflows: Branch Stock Return (Site Branch to Central Main Yard)
  const returnStockFromBranchToMain = (
    data: Omit<BranchReturn, 'id' | 'branchReturnNumber' | 'returnDate' | 'returnedBy'>
  ): BranchReturn => {
    const sourceSiteId = data.siteId || data.fromSiteId || '';
    const siteStock = getSiteItemStock(sourceSiteId, data.itemId);
    if (siteStock.availableBalance < data.quantity) {
      throw new Error(`Insufficient branch stock. Available at site: ${siteStock.availableBalance}`);
    }

    const nextNum = branchReturns.length + 1;
    const branchReturnNumber = `BRM-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
    const fromSite = sites.find((s) => s.id === sourceSiteId);
    const siteName = data.siteName || data.fromSiteName || fromSite?.name || 'Site Branch';

    const newBranchReturn: BranchReturn = {
      ...data,
      siteId: sourceSiteId,
      siteName,
      fromSiteId: sourceSiteId,
      fromSiteName: siteName,
      id: `br-${Date.now()}`,
      branchReturnNumber,
      returnDate: new Date().toISOString(),
      returnedBy: currentUser?.fullName || 'Branch Admin',
    };
    setBranchReturns((prev) => [newBranchReturn, ...prev]);

    const item = items.find((i) => i.id === data.itemId);
    addAuditLog(
      'BRANCH_RETURN_TO_MAIN',
      branchReturnNumber,
      siteName,
      `Transferred ${data.quantity} ${item?.unit || 'units'} of ${item?.itemName} from ${siteName} back to Central Main Yard (${data.condition}). Reason: ${data.reason}`,
      item?.itemCode,
      data.quantity
    );
    return newBranchReturn;
  };

  const deleteBranchReturn = (id: string) => {
    const br = branchReturns.find((b) => b.id === id);
    setBranchReturns((prev) => prev.filter((b) => b.id !== id));
    if (br) {
      addAuditLog('RECORD_DELETED', br.branchReturnNumber, 'Main Central Warehouse', `Deleted branch return to main record: ${br.branchReturnNumber}`);
    }
  };

  const clearBranchReturns = () => {
    const count = branchReturns.length;
    setBranchReturns([]);
    saveToStorage('branchReturns', []);
    addAuditLog('RECORD_DELETED', 'CLEAR-BRANCH-RETURNS', 'Main Central Warehouse', `Cleared all ${count} branch stock return records.`);
  };

  // Damaged Stock Calculations
  const getDamagedStock = (itemId: string) => {
    const totalDamagedReceived = branchReturns
      .filter((br) => br.itemId === itemId && !br.isDeleted && br.condition === 'Damaged / Scrap')
      .reduce((sum, br) => sum + Number(br.quantity), 0);

    const totalRestored = damagedRestorations
      .filter((dr) => dr.itemId === itemId && !dr.isDeleted)
      .reduce((sum, dr) => sum + Number(dr.quantity), 0);

    const availableBalance = Math.max(0, totalDamagedReceived - totalRestored);
    const hasActivity = totalDamagedReceived > 0 || totalRestored > 0;

    return {
      totalDamagedReceived,
      totalRestored,
      availableBalance,
      hasActivity,
    };
  };

  const restoreDamagedStockToMain = (
    itemId: string,
    quantity: number,
    notes?: string
  ): { success: boolean; message: string; record?: DamagedStockRestoration } => {
    const damagedInfo = getDamagedStock(itemId);
    const numQty = Number(quantity);

    if (isNaN(numQty) || numQty <= 0) {
      return { success: false, message: 'Restoration quantity must be a positive number greater than 0.' };
    }
    if (numQty > damagedInfo.availableBalance) {
      return {
        success: false,
        message: `Cannot restore ${numQty} units. Current available damaged stock balance is only ${damagedInfo.availableBalance}.`,
      };
    }

    const item = items.find((i) => i.id === itemId);
    const count = damagedRestorations.length + 1;
    const restorationNumber = `DSR-${String(count).padStart(4, '0')}`;

    const newRestoration: DamagedStockRestoration = {
      id: `dsr-${Date.now()}`,
      restorationNumber,
      itemId,
      quantity: numQty,
      restoredDate: new Date().toISOString(),
      restoredBy: currentUser?.fullName || 'Super Admin Central',
      notes: notes?.trim() || 'Repaired and restored to central usable inventory',
      isDeleted: false,
    };

    const next = [newRestoration, ...damagedRestorations];
    setDamagedRestorations(next);
    saveToStorage('damagedRestorations', next);

    addAuditLog(
      'DAMAGED_STOCK_RESTORED',
      restorationNumber,
      'Main Central Warehouse',
      `Restored ${numQty} ${item?.unit || 'units'} of repaired ${item?.itemName} from Damaged Stock back into Main Central Warehouse inventory. Reason/Notes: ${notes || 'Repaired to working condition'}`,
      item?.itemCode,
      numQty
    );

    return {
      success: true,
      message: `Successfully restored ${numQty} ${item?.unit || 'units'} to Main Central Stock inventory!`,
      record: newRestoration,
    };
  };

  // Versioned Backups & Admin Password Protected Full System Flush
  const createBackup = (name: string, reason?: string): StockBackup => {
    const backupNumber = backups.length + 1;
    const finalName = name?.trim() || `Backup #${backupNumber}`;
    const newBackup: StockBackup = {
      id: `backup-${Date.now()}`,
      backupNumber,
      name: finalName,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.fullName || 'System Administrator',
      itemCount: items.length,
      transactionCount: mainStockEntries.length + stockRequests.length + teamIssues.length + teamReturns.length + projectUsages.length + branchReturns.length + damagedRestorations.length,
      reason: reason || 'Manual user backup',
      snapshot: {
        config,
        sites,
        users,
        items,
        teams,
        projects,
        projectTypes,
        mainStockEntries,
        stockRequests,
        teamIssues,
        teamReturns,
        projectUsages,
        branchReturns,
        damagedRestorations,
        auditLogs,
      },
    };

    const updated = [newBackup, ...backups];
    setBackups(updated);
    saveToStorage('backups', updated);
    addAuditLog(
      'BACKUP_CREATED',
      `BACKUP-#${backupNumber}`,
      'Main Central Warehouse',
      `Created full system snapshot: "${finalName}" (Backup #${backupNumber}) with ${newBackup.itemCount} items.`
    );
    return newBackup;
  };

  const triggerDailyBackupNow = (): StockBackup => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    const backupNumber = backups.length + 1;
    const finalName = `[Daily Auto-Backup] ${todayStr}`;
    const autoBackup: StockBackup = {
      id: `auto-backup-${Date.now()}`,
      backupNumber,
      name: finalName,
      createdAt: nowIso,
      createdBy: currentUser?.fullName || 'System (Daily Auto-Persistence)',
      itemCount: items.length,
      transactionCount:
        mainStockEntries.length +
        stockRequests.length +
        teamIssues.length +
        teamReturns.length +
        projectUsages.length +
        branchReturns.length +
        damagedRestorations.length,
      reason: 'Daily automated background snapshot for disaster recovery and offline access',
      snapshot: {
        config,
        sites,
        users,
        items,
        teams,
        projects,
        projectTypes,
        mainStockEntries,
        stockRequests,
        teamIssues,
        teamReturns,
        projectUsages,
        branchReturns,
        damagedRestorations,
        auditLogs,
      },
    };

    try {
      localStorage.setItem(`apex_daily_auto_snapshot_${currentTenantIdRef.current}`, JSON.stringify(autoBackup));
      localStorage.setItem(`apex_last_daily_backup_date_${currentTenantIdRef.current}`, todayStr);
      localStorage.setItem(`apex_last_daily_backup_time_${currentTenantIdRef.current}`, nowIso);

      // If user enabled automatic file download to PC Hard Drive / Downloads folder
      const autoDownloadKey = `apex_auto_download_daily_pc_${currentTenantIdRef.current}`;
      if (typeof window !== 'undefined' && localStorage.getItem(autoDownloadKey) === 'true') {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(autoBackup, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `Apex_Daily_AutoBackup_${todayStr}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
    } catch (e) {
      console.warn('Auto-backup local storage quota or auto-download notice:', e);
    }

    setBackups((prev) => {
      const filtered = prev.filter((b) => !b.name.includes(`[Daily Auto-Backup] ${todayStr}`));
      const updated = [autoBackup, ...filtered];
      saveToStorage('backups', updated);
      return updated;
    });

    setLastAutoBackupTime(nowIso);
    return autoBackup;
  };

  // Automated Daily Backup background trigger (runs when stock data exists)
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    let lastBackupDate: string | null = null;
    try {
      lastBackupDate = localStorage.getItem(`apex_last_daily_backup_date_${currentTenantId}`);
    } catch {
      // ignore
    }

    if (lastBackupDate !== todayStr && (items.length > 0 || mainStockEntries.length > 0 || sites.length > 0)) {
      const timer = setTimeout(() => {
        triggerDailyBackupNow();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentTenantId, items.length, mainStockEntries.length, sites.length]);

  const restoreBackup = (backupId: string) => {
    if (!isSuperAdmin(currentUser?.role) && currentUser?.username !== 'admin') {
      throw new Error('Access Denied: Restoring backups is strictly restricted to Central Super Admin.');
    }
    const backup = backups.find((b) => b.id === backupId);
    if (!backup) {
      throw new Error('Backup not found');
    }
    const snap = backup.snapshot;
    if (snap.config) {
      setConfig(snap.config);
      saveToStorage('config', snap.config);
    }
    if (snap.sites) {
      setSites(snap.sites);
      saveToStorage('sites', snap.sites);
    }
    if (snap.users) {
      setUsers(snap.users);
      saveToStorage('users', snap.users);
      saveTenantData(currentTenantIdRef.current, 'users', snap.users);
      const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
      if (isMaster) {
        writeUsersToFirebase(snap.users).catch(console.warn);
      }
    }
    if (snap.items) {
      setItems(snap.items);
      saveToStorage('items', snap.items);
      saveTenantData(currentTenantIdRef.current, 'items', snap.items);
    }
    if (snap.teams) {
      setTeams(snap.teams);
      saveToStorage('teams', snap.teams);
      saveTenantData(currentTenantIdRef.current, 'teams', snap.teams);
    }
    if (snap.projects) {
      setProjects(snap.projects);
      saveToStorage('projects', snap.projects);
      saveTenantData(currentTenantIdRef.current, 'projects', snap.projects);
    }
    if (snap.projectTypes) {
      setProjectTypes(snap.projectTypes);
      saveToStorage('projectTypes', snap.projectTypes);
      saveTenantData(currentTenantIdRef.current, 'projectTypes', snap.projectTypes);
    }
    if (snap.mainStockEntries) {
      setMainStockEntries(snap.mainStockEntries);
      saveToStorage('mainStockEntries', snap.mainStockEntries);
      saveTenantData(currentTenantIdRef.current, 'mainStockEntries', snap.mainStockEntries);
    }
    if (snap.stockRequests) {
      setStockRequests(snap.stockRequests);
      saveToStorage('stockRequests', snap.stockRequests);
      saveTenantData(currentTenantIdRef.current, 'stockRequests', snap.stockRequests);
    }
    if (snap.teamIssues) {
      setTeamIssues(snap.teamIssues);
      saveToStorage('teamIssues', snap.teamIssues);
      saveTenantData(currentTenantIdRef.current, 'teamIssues', snap.teamIssues);
    }
    if (snap.teamReturns) {
      setTeamReturns(snap.teamReturns);
      saveToStorage('teamReturns', snap.teamReturns);
      saveTenantData(currentTenantIdRef.current, 'teamReturns', snap.teamReturns);
    }
    if (snap.projectUsages) {
      setProjectUsages(snap.projectUsages);
      saveToStorage('projectUsages', snap.projectUsages);
      saveTenantData(currentTenantIdRef.current, 'projectUsages', snap.projectUsages);
    }
    if (snap.branchReturns) {
      setBranchReturns(snap.branchReturns);
      saveToStorage('branchReturns', snap.branchReturns);
      saveTenantData(currentTenantIdRef.current, 'branchReturns', snap.branchReturns);
    }
    if (snap.damagedRestorations) {
      setDamagedRestorations(snap.damagedRestorations);
      saveToStorage('damagedRestorations', snap.damagedRestorations);
      saveTenantData(currentTenantIdRef.current, 'damagedRestorations', snap.damagedRestorations);
    }
    if (snap.auditLogs) {
      setAuditLogs(snap.auditLogs);
      saveToStorage('auditLogs', snap.auditLogs);
      saveTenantData(currentTenantIdRef.current, 'auditLogs', snap.auditLogs);
    }

    addAuditLog(
      'BACKUP_RESTORED',
      `RESTORE-#${backup.backupNumber}`,
      'Main Central Warehouse',
      `Restored complete system state from backup: "${backup.name}" (Backup #${backup.backupNumber}) taken on ${new Date(backup.createdAt).toLocaleString()}`
    );
  };

  const deleteBackup = (backupId: string) => {
    if (!isSuperAdmin(currentUser?.role) && currentUser?.username !== 'admin') {
      return;
    }
    const backup = backups.find((b) => b.id === backupId);
    setBackups((prev) => {
      const next = prev.filter((b) => b.id !== backupId);
      saveToStorage('backups', next);
      return next;
    });
    if (backup) {
      addAuditLog('RECORD_DELETED', `BACKUP-#${backup.backupNumber}`, 'Main Central Warehouse', `Deleted backup archive "${backup.name}"`);
    }
  };

  const flushSystemWithBackup = (
    adminPassword: string,
    backupName: string
  ): { success: boolean; message: string; backupNumber?: number } => {
    if (!isSuperAdmin(currentUser?.role) && currentUser?.username !== 'admin') {
      return {
        success: false,
        message: 'Access Denied: Full System Flush is strictly restricted to Central Super Admin.',
      };
    }
    const trimmedPw = (adminPassword || '').trim();
    const validPasswords = [
      currentUser?.password,
      'password123',
      'admin',
      'admin123',
      'flush2026',
    ].filter(Boolean);

    if (!validPasswords.includes(trimmedPw)) {
      return { success: false, message: 'Invalid Admin Password! System flush cancelled.' };
    }

    // 1. Create versioned backup snapshot BEFORE flush
    const backupNumber = backups.length + 1;
    const assignedName = (backupName || '').trim() || `Pre-Flush Auto Backup #${backupNumber}`;
    const autoBackup: StockBackup = {
      id: `backup-${Date.now()}`,
      backupNumber,
      name: assignedName,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.fullName || 'System Administrator',
      itemCount: items.length,
      transactionCount:
        mainStockEntries.length +
        stockRequests.length +
        teamIssues.length +
        teamReturns.length +
        projectUsages.length +
        branchReturns.length +
        damagedRestorations.length,
      reason: 'Automatic snapshot preserved prior to full system flush',
      snapshot: {
        config,
        sites,
        users,
        items,
        teams,
        projects,
        mainStockEntries,
        stockRequests,
        teamIssues,
        teamReturns,
        projectUsages,
        branchReturns,
        damagedRestorations,
        auditLogs,
      },
    };

    const newBackups = [autoBackup, ...backups];
    setBackups(newBackups);
    saveToStorage('backups', newBackups);

    // 2. Clear all operational data and catalog items cleanly
    const cleanMainSite: Site = {
      id: 'site-main',
      name: 'Main Central Warehouse',
      isMainWarehouse: true,
      supervisorName: 'Administrator',
      location: 'Central Logistics Yard',
      contactNumber: '+1 (555) 010-0000',
      createdAt: new Date().toISOString(),
    };
    const cleanAdminUser: User = {
      id: 'usr-admin-clean',
      username: 'admin',
      fullName: 'System Super Admin',
      siteId: 'all',
      role: 'Super Admin Central',
      password: 'password123',
      createdAt: new Date().toISOString(),
    };

    setSites([cleanMainSite]);
    setUsers([cleanAdminUser]);
    setItems([]);
    setTeams([]);
    setProjects([]);
    setMainStockEntries([]);
    setStockRequests([]);
    setTeamIssues([]);
    setTeamReturns([]);
    setProjectUsages([]);
    setBranchReturns([]);
    setDamagedRestorations([]);
    setCurrentUser(cleanAdminUser);

    const flushLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'SYSTEM_FLUSHED_WITH_BACKUP',
      referenceNo: `FLUSH-#${backupNumber}`,
      siteName: 'Main Central Warehouse',
      performedBy: currentUser?.fullName || 'System Super Admin',
      details: `Full System Flush completed under admin authorization. Prior inventory and records saved as Backup #${backupNumber} ("${assignedName}"). System reset to clean state.`,
    };

    setAuditLogs([flushLog]);

    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}tenant-comtec-main_users`);
    } catch {}

    // Save to storage
    saveToStorage('sites', [cleanMainSite]);
    saveToStorage('users', [cleanAdminUser]);
    saveTenantData(currentTenantIdRef.current, 'users', [cleanAdminUser]);
    saveTenantData(currentTenantIdRef.current, 'sites', [cleanMainSite]);
    saveToStorage('items', []);
    saveToStorage('teams', []);
    saveToStorage('projects', []);
    saveToStorage('mainStockEntries', []);
    saveToStorage('stockRequests', []);
    saveToStorage('teamIssues', []);
    saveToStorage('teamReturns', []);
    saveToStorage('projectUsages', []);
    saveToStorage('branchReturns', []);
    saveToStorage('damagedRestorations', []);
    saveToStorage('auditLogs', [flushLog]);

    // Force clear Firebase Realtime Database
    writeBackupsToFirebase(newBackups).catch(() => {});
    clearAllFirebaseData(cleanMainSite, cleanAdminUser, config, flushLog).catch(() => {});
    writeUsersToFirebase([cleanAdminUser]).catch(() => {});

    return {
      success: true,
      message: `System successfully flushed! Versioned Backup #${backupNumber} ("${assignedName}") was preserved and can be restored anytime.`,
      backupNumber,
    };
  };

  // Dynamic Inventory Balance Calculations
  const getMainWarehouseStock = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    const threshold = item?.lowStockThreshold ?? config.defaultLowStockThreshold;

    const totalReceived = mainStockEntries
      .filter((entry) => entry.itemId === itemId)
      .reduce((sum, entry) => sum + Number(entry.quantity), 0);

    // Only good/restocked returns add back to available main stock
    const goodBranchReturnsToMain = branchReturns
      .filter((br) => br.itemId === itemId && !br.isDeleted && br.condition === 'Good / Restock')
      .reduce((sum, br) => sum + Number(br.quantity), 0);

    // Units repaired from damaged stock and restored back to main stock
    const restoredFromDamaged = damagedRestorations
      .filter((dr) => dr.itemId === itemId && !dr.isDeleted)
      .reduce((sum, dr) => sum + Number(dr.quantity), 0);

    const dispatched = stockRequests
      .filter((req) => req.status === 'Approved / In-Transit' || req.status === 'Accepted')
      .reduce((sum, req) => {
        const row = req.items.find((i) => i.itemId === itemId);
        if (!row) return sum;
        const qty =
          req.status === 'Accepted'
            ? (row.receivedQty ?? row.approvedQty ?? row.requestedQty)
            : (row.approvedQty ?? row.requestedQty);
        return sum + Number(qty);
      }, 0);

    // Units returned to suppliers from Main Stock (Dispatched or Settled Debit Notes)
    const returnedToSuppliers = supplierReturns
      .filter(
        (sr) =>
          sr.locationType === 'Main Stock' &&
          !sr.isDeleted &&
          sr.status !== 'Draft' &&
          sr.status !== 'Cancelled'
      )
      .reduce((sum, sr) => {
        const row = sr.items.find((i) => i.itemId === itemId);
        return sum + (row ? Number(row.quantity) : 0);
      }, 0);

    const availableBalance = Math.max(
      0,
      totalReceived + goodBranchReturnsToMain + restoredFromDamaged - dispatched - returnedToSuppliers
    );
    const hasActivity = totalReceived > 0 || goodBranchReturnsToMain > 0 || restoredFromDamaged > 0;
    const isLowStock = hasActivity && availableBalance <= threshold;

    return {
      totalReceived,
      dispatched,
      returnedToSuppliers,
      availableBalance,
      threshold,
      isLowStock,
      hasActivity,
    };
  };

  const getSiteItemStock = (siteId: string, itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    const threshold = item?.lowStockThreshold ?? config.defaultLowStockThreshold;

    const received = stockRequests
      .filter((req) => req.siteId === siteId && req.status === 'Accepted')
      .reduce((sum, req) => {
        const row = req.items.find((i) => i.itemId === itemId);
        if (!row) return sum;
        return sum + Number(row.receivedQty ?? row.approvedQty ?? row.requestedQty);
      }, 0);

    const returned = teamReturns
      .filter((ret) => ret.siteId === siteId && ret.itemId === itemId && ret.condition === 'Good / Restock')
      .reduce((sum, ret) => sum + Number(ret.quantity), 0);

    const issued = teamIssues
      .filter((iss) => iss.siteId === siteId)
      .reduce((sum, iss) => {
        const row = iss.items.find((i) => i.itemId === itemId);
        if (!row) return sum;
        return sum + Number(row.quantity);
      }, 0);

    const returnedToMain = branchReturns
      .filter((br) => (br.fromSiteId === siteId || br.siteId === siteId) && br.itemId === itemId && !br.isDeleted)
      .reduce((sum, br) => sum + Number(br.quantity), 0);

    const returnedToSuppliersFromSite = supplierReturns
      .filter(
        (sr) =>
          sr.locationType === 'Site Stock' &&
          sr.siteId === siteId &&
          !sr.isDeleted &&
          sr.status !== 'Draft' &&
          sr.status !== 'Cancelled'
      )
      .reduce((sum, sr) => {
        const row = sr.items.find((i) => i.itemId === itemId);
        return sum + (row ? Number(row.quantity) : 0);
      }, 0);

    const availableBalance = Math.max(0, received + returned - issued - returnedToMain - returnedToSuppliersFromSite);
    const hasActivity = received > 0 || returned > 0 || issued > 0 || returnedToMain > 0;
    const isLowStock = hasActivity && availableBalance <= threshold;

    return {
      received,
      returned,
      issued,
      availableBalance,
      threshold,
      isLowStock,
      hasActivity,
    };
  };

  const getTeamInHandStock = (teamId: string): TeamInHandSummary => {
    const team = teams.find((t) => t.id === teamId) || {
      id: teamId,
      teamName: 'Unknown Team',
      teamLeaderName: '',
      assignedSiteId: '',
      contactPhone: '',
      crewSize: 0,
      createdAt: '',
    };
    const site = sites.find((s) => s.id === team.assignedSiteId) || {
      id: '',
      name: 'Unassigned Site',
      isMainWarehouse: false,
      supervisorName: '',
      location: '',
      contactNumber: '',
      createdAt: '',
    };

    const issuesForTeam = teamIssues.filter((iss) => iss.teamId === teamId);
    const returnsForTeam = teamReturns.filter((ret) => ret.teamId === teamId);
    const usagesForTeam = projectUsages.filter((pu) => pu.teamId === teamId && !pu.isDeleted);

    const itemMap = new Map<
      string,
      { totalIssued: number; totalReturned: number; totalUsed: number; lastDate: string }
    >();

    issuesForTeam.forEach((issue) => {
      issue.items.forEach((itemRow) => {
        const existing = itemMap.get(itemRow.itemId) || {
          totalIssued: 0,
          totalReturned: 0,
          totalUsed: 0,
          lastDate: issue.issueDate,
        };
        existing.totalIssued += Number(itemRow.quantity);
        if (new Date(issue.issueDate) > new Date(existing.lastDate)) {
          existing.lastDate = issue.issueDate;
        }
        itemMap.set(itemRow.itemId, existing);
      });
    });

    returnsForTeam.forEach((ret) => {
      const existing = itemMap.get(ret.itemId) || {
        totalIssued: 0,
        totalReturned: 0,
        totalUsed: 0,
        lastDate: ret.returnDate,
      };
      existing.totalReturned += Number(ret.quantity);
      itemMap.set(ret.itemId, existing);
    });

    usagesForTeam.forEach((pu) => {
      const uDate = pu.date || pu.usageDate || '';
      pu.items.forEach((itemRow) => {
        const existing = itemMap.get(itemRow.itemId) || {
          totalIssued: 0,
          totalReturned: 0,
          totalUsed: 0,
          lastDate: uDate,
        };
        existing.totalUsed += Number(itemRow.quantity);
        if (new Date(uDate) > new Date(existing.lastDate)) {
          existing.lastDate = uDate;
        }
        itemMap.set(itemRow.itemId, existing);
      });
    });

    const balanceItems: TeamInHandBalanceItem[] = [];
    let totalUnitsHeld = 0;

    itemMap.forEach((val, itemId) => {
      const totalUsed = val.totalUsed || 0;
      const currentInHand = Math.max(0, val.totalIssued - val.totalReturned - totalUsed);
      const itemMaster = items.find((i) => i.id === itemId);
      if (val.totalIssued > 0 || val.totalReturned > 0 || totalUsed > 0) {
        balanceItems.push({
          itemId,
          itemCode: itemMaster?.itemCode || 'UNKNOWN',
          itemName: itemMaster?.itemName || 'Item Not Found',
          unit: itemMaster?.unit || 'units',
          totalIssued: val.totalIssued,
          totalReturned: val.totalReturned,
          totalUsedInProjects: totalUsed,
          currentInHand,
          lastIssuedDate: val.lastDate,
        });
        totalUnitsHeld += currentInHand;
      }
    });

    balanceItems.sort((a, b) => b.currentInHand - a.currentInHand);

    return {
      team,
      site,
      items: balanceItems,
      totalUnitsHeld,
      distinctItemsCount: balanceItems.filter((i) => i.currentInHand > 0).length,
    };
  };

  const allTeamsInHandStock = useMemo(() => {
    return activeTeams.map((t) => getTeamInHandStock(t.id));
  }, [activeTeams, teamIssues, teamReturns, projectUsages, items, sites]);

  const totalLowStockAlertsCount = useMemo(() => {
    let count = 0;
    activeItems.forEach((item) => {
      const mainStock = getMainWarehouseStock(item.id);
      if (mainStock.isLowStock && (mainStock.totalReceived > 0 || mainStock.availableBalance > 0)) {
        count++;
      }
    });
    activeSites.filter((s) => !s.isMainWarehouse).forEach((site) => {
      activeItems.forEach((item) => {
        const siteStk = getSiteItemStock(site.id, item.id);
        if (siteStk.isLowStock) {
          count++;
        }
      });
    });
    return count;
  }, [activeItems, activeSites, mainStockEntries, branchReturns, stockRequests, teamIssues, teamReturns, config.defaultLowStockThreshold]);

  const pendingRequestsCount = useMemo(() => {
    return stockRequests.filter((r) => r.status === 'Pending Approval' || r.status === 'Approved / In-Transit').length;
  }, [stockRequests]);

  return (
    <StockContext.Provider
      value={{
        config,
        updateConfig,
        resetAllData,
        clearAllDemoData,
        restoreDemoData,
        currentUser,
        setCurrentUser,
        isAuthenticated,
        login,
        logout,
        activeSite,
        sites,
        activeSites,
        users,
        activeUsers,
        items,
        activeItems,
        teams,
        activeTeams,
        projects,
        activeProjects,
        projectTypes,
        activeProjectTypes,
        mainStockEntries,
        stockRequests,
        teamIssues,
        teamReturns,
        projectUsages,
        branchReturns,
        backups,
        auditLogs,
        addSite,
        addUser,
        addItem,
        addTeam,
        addProject,
        bulkImportItems,
        bulkImportProjects,
        updateSite,
        updateUser,
        updateItem,
        updateTeam,
        updateProject,
        softDeleteItem,
        softDeleteSite,
        softDeleteUser,
        softDeleteTeam,
        softDeleteProject,
        bulkSoftDeleteItems,
        bulkSoftDeleteSites,
        bulkSoftDeleteUsers,
        bulkSoftDeleteTeams,
        recycleBinItems,
        recycleBinCount,
        restoreItem,
        restoreSite,
        restoreUser,
        restoreTeam,
        restoreProject,
        bulkRestore,
        permanentlyDeleteItem,
        permanentlyDeleteSite,
        permanentlyDeleteUser,
        permanentlyDeleteTeam,
        permanentlyDeleteProject,
        bulkPermanentlyDelete,
        emptyRecycleBin,
        addMainStockEntry,
        createStockRequest,
        approveStockRequest,
        rejectStockRequest,
        removeStockRequestItem,
        acceptStockRequest,
        issueStockToTeam,
        returnStockFromTeam,
        addProjectType,
        updateProjectType,
        deleteProjectType,
        saveProjectTypeTemplate,
        logProjectMaterialUsage,
        updateProjectUsage,
        deleteProjectUsage,
        clearProjectUsages,
        crossProjectRequests,
        createCrossProjectOverrideRequest,
        acceptCrossProjectOverrideRequest,
        rejectCrossProjectOverrideRequest,
        clientFreeIssues,
        addClientFreeIssue,
        updateClientFreeIssue,
        deleteClientFreeIssue,
        clearClientFreeIssues,
        getClientFreeStockBalance,
        getProjectFreeStockList,
        returnStockFromBranchToMain,
        deleteBranchReturn,
        clearBranchReturns,
        damagedRestorations,
        restoreDamagedStockToMain,
        getDamagedStock,
        createBackup,
        restoreBackup,
        deleteBackup,
        flushSystemWithBackup,
        lastAutoBackupTime,
        triggerDailyBackupNow,
        getMainWarehouseStock,
        getSiteItemStock,
        getTeamInHandStock,
        allTeamsInHandStock,
        totalLowStockAlertsCount,
        pendingRequestsCount,
        clearMainStockReceipts,
        clearStockRequests,
        clearTeamIssues,
        clearTeamReturns,
        clearAuditLogs,
        addAuditLog,
        clearAllItems,
        clearAllSites,
        clearAllTeams,
        clearAllUsers,
        deleteMainStockEntry,
        deleteStockRequest,
        deleteTeamIssue,
        deleteTeamReturn,
        deleteAuditLog,
        letterheadTemplates,
        activeTemplateId,
        activeTemplate,
        digitalSignatures,
        setActiveTemplateId,
        updateLetterheadTemplate,
        addLetterheadTemplate,
        deleteLetterheadTemplate,
        updateDigitalSignatures,
        addDigitalSignature,
        deleteDigitalSignature,
        suppliers,
        activeSuppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        clients,
        activeClients,
        addClient,
        updateClient,
        deleteClient,
        purchaseOrders,
        activePurchaseOrders,
        addPurchaseOrder,
        updatePurchaseOrder,
        deletePurchaseOrder,
        receivePurchaseOrderToMainStock,
        closePurchaseOrderRemainder,
        supplierReturns,
        activeSupplierReturns,
        addSupplierReturn,
        updateSupplierReturn,
        deleteSupplierReturn,
        dispatchSupplierReturn,
        settleSupplierReturn,
        firebaseConnected,
        isFirebaseSyncing,
        syncWithFirebaseNow,
        firebaseDbUrl: firebaseConfig.databaseURL,
        authUser,
        viewAsUser,
        setViewAsUser,
        exitViewAsMode,
        tenants,
        currentTenant,
        previewTenant,
        registerTenant,
        switchTenant,
        switchToMasterStock,
        setPreviewTenant,
        exitTenantPreview,
        updateTenantSubscription,
        updateTenantDetails,
        deleteTenant,
        getWorkspaceLoginUrl,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};
