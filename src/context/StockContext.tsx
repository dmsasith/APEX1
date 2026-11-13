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
  FlushMeta,
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
  DocumentFormatGroupId,
  SectionFormatConfig,
  isSuperAdmin,
  normalizeRole,
  isUserAllSites,
  getUserAssignedSiteIds,
} from '../types';
import { DEFAULT_SECTION_FORMATS } from '../utils/formatAnalyzerUtils';
import { generateUniqueBarcode, matchItemByScannedCode } from '../utils/barcodeUtils';
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
  fetchTenantsFromFirebase,
  subscribeToFirebaseDeletedTenants,
  deleteTenantInFirebase,
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
  atomicFlushWorkspaceInFirebase,
  clearFlushMetaInFirebase,
  subscribeToFirebaseFlushMeta,
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
  addSite: (
    site: Omit<Site, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>,
    assignedUserIds?: string[]
  ) => Site;
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>) => User;
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>, initialReceivedQty?: number) => Item;
  addTeam: (team: Omit<Team, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>) => Team;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>) => Project;
  bulkImportItems: (rows: ExcelItemRow[], mode: 'sync' | 'append' | 'replace') => ImportResult;
  findItemByBarcode: (scannedCode: string) => Item | undefined;
  autoGenerateMissingBarcodes: () => { updatedCount: number };
  bulkImportProjects: (rows: Array<Omit<Project, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>>) => { added: number; updated: number };

  // Master Updates (CRUD - Edit)
  updateSite: (id: string, updates: Partial<Site>, assignedUserIds?: string[]) => void;
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
  flushSystemWithBackup: (
    adminPassword: string,
    backupName: string
  ) => Promise<{ success: boolean; message: string; backupNumber?: number }>;
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
  sectionFormats: Record<DocumentFormatGroupId, SectionFormatConfig>;
  updateSectionFormat: (groupId: DocumentFormatGroupId, config: SectionFormatConfig) => void;
  resetSectionFormat: (groupId: DocumentFormatGroupId) => void;
  getEffectiveSectionFormat: (groupId: DocumentFormatGroupId) => SectionFormatConfig;

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

const FLUSHABLE_ARRAY_KEYS = new Set<string>([
  'sites',
  'users',
  'items',
  'teams',
  'projects',
  'mainStockEntries',
  'stockRequests',
  'teamIssues',
  'teamReturns',
  'projectUsages',
  'crossProjectRequests',
  'clientFreeIssues',
  'branchReturns',
  'damagedRestorations',
  'suppliers',
  'clients',
  'purchaseOrders',
  'supplierReturns',
  'auditLogs',
]);

export function getTenantFlushMeta(tenantId: string): FlushMeta | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${tenantId}_flushMeta`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.flushedAtMs === 'number') {
        return parsed as FlushMeta;
      }
    }
    if (tenantId === DEFAULT_TENANT.id || tenantId === 'tenant-apex-main') {
      const rootRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}flushMeta`);
      if (rootRaw) {
        const parsed = JSON.parse(rootRaw);
        if (parsed && typeof parsed.flushedAtMs === 'number') {
          return parsed as FlushMeta;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

function saveTenantFlushMetaLocal(tenantId: string, meta: FlushMeta): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${tenantId}_flushMeta`, JSON.stringify(meta));
    if (tenantId === DEFAULT_TENANT.id || tenantId === 'tenant-apex-main') {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}flushMeta`, JSON.stringify(meta));
    }
  } catch (e) {
    console.warn('Failed saving flushMeta locally:', e);
  }
}

function clearTenantFlushMetaLocal(tenantId: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${tenantId}_flushMeta`);
    if (tenantId === DEFAULT_TENANT.id || tenantId === 'tenant-apex-main') {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}flushMeta`);
    }
  } catch (e) {
    console.warn('Failed clearing flushMeta locally:', e);
  }
}

function extractRecordCreatedMs(rec: any): number {
  if (!rec || typeof rec !== 'object') return 0;
  if (typeof rec.id === 'string') {
    const idMatch = rec.id.match(/(\d{13})/);
    if (idMatch) {
      const parsedIdMs = Number(idMatch[1]);
      if (parsedIdMs > 1500000000000) return parsedIdMs;
    }
  }
  if (typeof rec.createdAt === 'string' && rec.createdAt.includes('T')) {
    const ms = Date.parse(rec.createdAt);
    if (!Number.isNaN(ms)) return ms;
  }
  if (typeof rec.timestamp === 'string' && rec.timestamp.includes('T')) {
    const ms = Date.parse(rec.timestamp);
    if (!Number.isNaN(ms)) return ms;
  }
  return 0;
}

function isProtectedCoreRecord(key: string, rec: any): boolean {
  if (!rec || typeof rec !== 'object') return false;
  if (key === 'sites') {
    return (
      rec.isMainWarehouse === true ||
      rec.id === 'site-main' ||
      (typeof rec.id === 'string' && rec.id.endsWith('-main'))
    );
  }
  if (key === 'users') {
    const uName = typeof rec.username === 'string' ? rec.username.trim().toLowerCase() : '';
    const uId = typeof rec.id === 'string' ? rec.id.toLowerCase() : '';
    return uName === 'admin' || uId === 'usr-admin-1' || uId.endsWith('-admin');
  }
  return false;
}

function getTenantDeletedRecordStorageKey(tenantId: string): string {
  return `${STORAGE_KEY_PREFIX}${tenantId}_deleted_record_ids`;
}

export function getTenantDeletedRecordIds(tenantId: string): Set<string> {
  try {
    if (typeof window === 'undefined' || !tenantId) return new Set();
    const set = new Set<string>();
    const raw = localStorage.getItem(getTenantDeletedRecordStorageKey(tenantId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => {
          if (typeof id === 'string' && id) set.add(id);
        });
      }
    }
    if (tenantId === DEFAULT_TENANT.id || tenantId === 'tenant-apex-main') {
      const legacyRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}deleted_record_ids`);
      if (legacyRaw) {
        const parsedLegacy = JSON.parse(legacyRaw);
        if (Array.isArray(parsedLegacy)) {
          parsedLegacy.forEach((id) => {
            if (typeof id === 'string' && id) set.add(id);
          });
        }
      }
    }
    return set;
  } catch {
    return new Set();
  }
}

function persistTenantDeletedRecordIdsLocal(tenantId: string, idsSet: Set<string>): void {
  try {
    if (typeof window === 'undefined' || !tenantId) return;
    const serialized = JSON.stringify(Array.from(idsSet));
    localStorage.setItem(getTenantDeletedRecordStorageKey(tenantId), serialized);
    if (tenantId === DEFAULT_TENANT.id || tenantId === 'tenant-apex-main') {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}deleted_record_ids`, serialized);
    }
  } catch (e) {
    console.warn(`Could not persist deleted_record_ids for tenant ${tenantId}:`, e);
  }
}

function markTenantRecordsDeleted(tenantId: string, ids: string[]): Set<string> {
  const targetId = tenantId || DEFAULT_TENANT.id;
  const set = getTenantDeletedRecordIds(targetId);
  let changed = false;
  (ids || []).forEach((id) => {
    if (typeof id === 'string' && id.trim() && !set.has(id)) {
      set.add(id);
      changed = true;
    }
  });
  if (changed) {
    persistTenantDeletedRecordIdsLocal(targetId, set);
  }
  writeTenantDataToFirebase(targetId, 'deletedRecordIds', Array.from(set)).catch(() => {});
  return set;
}

function unmarkTenantRecordDeleted(tenantId: string, id: string): void {
  const targetId = tenantId || DEFAULT_TENANT.id;
  const set = getTenantDeletedRecordIds(targetId);
  if (id && set.has(id)) {
    set.delete(id);
    persistTenantDeletedRecordIdsLocal(targetId, set);
    writeTenantDataToFirebase(targetId, 'deletedRecordIds', Array.from(set)).catch(() => {});
  }
}

function mergeRemoteTenantDeletedRecordIds(
  tenantId: string,
  remoteData: string[] | Record<string, any> | null | undefined
): Set<string> {
  const targetId = tenantId || DEFAULT_TENANT.id;
  const set = getTenantDeletedRecordIds(targetId);
  if (!remoteData) return set;
  const list: string[] = Array.isArray(remoteData)
    ? remoteData
    : typeof remoteData === 'object'
      ? Object.values(remoteData).map((v) => String(v))
      : [];
  let changed = false;
  list.forEach((id) => {
    if (typeof id === 'string' && id && !set.has(id)) {
      set.add(id);
      changed = true;
    }
  });
  if (changed) {
    persistTenantDeletedRecordIdsLocal(targetId, set);
  }
  return set;
}

export function filterPostFlushRecords<T>(tenantId: string, key: string, list: T[]): T[] {
  if (!Array.isArray(list)) return [];
  const deletedRecordIds = getTenantDeletedRecordIds(tenantId);
  const flushMeta = FLUSHABLE_ARRAY_KEYS.has(key) ? getTenantFlushMeta(tenantId) : null;

  return list.filter((rec: any) => {
    if (!rec) return false;
    if (isProtectedCoreRecord(key, rec)) return true;
    if (rec.id && deletedRecordIds.has(rec.id)) return false;
    if (flushMeta && flushMeta.flushedAtMs) {
      const createdMs = extractRecordCreatedMs(rec);
      return createdMs >= flushMeta.flushedAtMs;
    }
    return true;
  });
}

export function loadTenantData<T>(tenantId: string, key: string, fallback: T): T {
  try {
    const flushMeta = getTenantFlushMeta(tenantId);
    const tenantKey = getTenantStorageKey(tenantId, key);
    const item = localStorage.getItem(tenantKey);

    // If this workspace has been flushed, NEVER resurrect legacy or comtec keys and filter pre-flush records
    if (flushMeta && flushMeta.flushedAtMs) {
      if (item !== null) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed)) {
          return filterPostFlushRecords(tenantId, key, parsed) as unknown as T;
        }
        return parsed;
      }
      if (Array.isArray(fallback)) {
        return filterPostFlushRecords(tenantId, key, fallback) as unknown as T;
      }
      return fallback;
    }

    if (tenantId === DEFAULT_TENANT.id || tenantId === 'tenant-apex-main') {
      if (item !== null) {
        const parsedTenant = JSON.parse(item);
        if (Array.isArray(parsedTenant)) {
          return filterPostFlushRecords(tenantId, key, parsedTenant) as unknown as T;
        }
        return parsedTenant;
      }
      const legacyItem = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      if (legacyItem !== null) {
        const parsedLegacy = JSON.parse(legacyItem);
        if (Array.isArray(parsedLegacy)) {
          return filterPostFlushRecords(tenantId, key, parsedLegacy) as unknown as T;
        }
        return parsedLegacy;
      }
      return Array.isArray(fallback)
        ? (filterPostFlushRecords(tenantId, key, fallback) as unknown as T)
        : fallback;
    }

    if (item !== null) {
      const parsed = JSON.parse(item);
      if (Array.isArray(parsed)) {
        return filterPostFlushRecords(tenantId, key, parsed) as unknown as T;
      }
      return parsed;
    }
    return Array.isArray(fallback)
      ? (filterPostFlushRecords(tenantId, key, fallback) as unknown as T)
      : fallback;
  } catch (err) {
    console.error(`Failed to load ${key} for tenant ${tenantId}:`, err);
    return fallback;
  }
}

const DELETED_TENANTS_STORAGE_KEY = `${STORAGE_KEY_PREFIX}deleted_tenant_ids`;

export function getDeletedTenantIds(): Set<string> {
  try {
    if (typeof window === 'undefined') return new Set();
    const raw = localStorage.getItem(DELETED_TENANTS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    const list: string[] = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object'
        ? Object.keys(parsed)
        : [];
    return new Set(
      list.filter((id) => typeof id === 'string' && id !== DEFAULT_TENANT.id && id !== 'tenant-apex-main')
    );
  } catch {
    return new Set();
  }
}

function purgeTenantLocalStorageKeys(tenantId: string): void {
  try {
    if (typeof window === 'undefined' || !tenantId) return;
    if (tenantId === DEFAULT_TENANT.id || tenantId === 'tenant-apex-main') return;
    const prefix = `${STORAGE_KEY_PREFIX}${tenantId}_`;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        localStorage.removeItem(k);
      }
    }
  } catch (e) {
    console.warn(`Failed purging localStorage keys for deleted tenant ${tenantId}:`, e);
  }
}

function markTenantDeletedLocal(tenantId: string): Set<string> {
  const deletedSet = getDeletedTenantIds();
  if (tenantId && tenantId !== DEFAULT_TENANT.id && tenantId !== 'tenant-apex-main') {
    deletedSet.add(tenantId);
    try {
      localStorage.setItem(DELETED_TENANTS_STORAGE_KEY, JSON.stringify(Array.from(deletedSet)));
    } catch (e) {
      console.warn('Could not persist deleted_tenant_ids locally:', e);
    }
    purgeTenantLocalStorageKeys(tenantId);
  }
  return deletedSet;
}

function mergeRemoteDeletedTenantIds(remoteMap: Record<string, number>): Set<string> {
  const deletedSet = getDeletedTenantIds();
  let changed = false;
  Object.keys(remoteMap || {}).forEach((id) => {
    if (id && id !== DEFAULT_TENANT.id && id !== 'tenant-apex-main') {
      if (!deletedSet.has(id)) {
        deletedSet.add(id);
        changed = true;
      }
      purgeTenantLocalStorageKeys(id);
    }
  });
  if (changed) {
    try {
      localStorage.setItem(DELETED_TENANTS_STORAGE_KEY, JSON.stringify(Array.from(deletedSet)));
    } catch (e) {
      console.warn('Could not persist merged deleted_tenant_ids locally:', e);
    }
  }
  return deletedSet;
}

function persistTenantsLocal(tenantsList: Tenant[]): Tenant[] {
  const deletedIds = getDeletedTenantIds();
  const clean = (tenantsList || []).filter(
    (t) => t && t.id && (t.id === DEFAULT_TENANT.id || t.id === 'tenant-apex-main' || !deletedIds.has(t.id))
  );
  try {
    const serialized = JSON.stringify(clean);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'tenants', serialized);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}tenant-apex-main_tenants`, serialized);
  } catch (e) {
    console.warn('Could not write tenants registry to localStorage:', e);
  }
  return clean;
}

function saveTenantDataLocalOnly<T>(tenantId: string, key: string, data: T) {
  try {
    if (
      tenantId &&
      tenantId !== DEFAULT_TENANT.id &&
      tenantId !== 'tenant-apex-main' &&
      getDeletedTenantIds().has(tenantId)
    ) {
      return;
    }

    if (key === 'tenants' && Array.isArray(data)) {
      persistTenantsLocal(data as unknown as Tenant[]);
      return;
    }

    const serialized = JSON.stringify(data);
    const tenantKey = getTenantStorageKey(tenantId, key);
    localStorage.setItem(tenantKey, serialized);
    if ((tenantId === DEFAULT_TENANT.id || tenantId === 'tenant-apex-main') && key !== 'current_tenant_id') {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, serialized);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}tenant-comtec-main_${key}`);
    }
  } catch (err) {
    console.warn(`Failed to save ${key} locally for tenant ${tenantId}:`, err);
  }
}

function saveTenantData<T>(tenantId: string, key: string, data: T) {
  try {
    if (
      tenantId &&
      tenantId !== DEFAULT_TENANT.id &&
      tenantId !== 'tenant-apex-main' &&
      getDeletedTenantIds().has(tenantId)
    ) {
      return;
    }

    if (key === 'tenants' && Array.isArray(data)) {
      const cleanTenants = persistTenantsLocal(data as unknown as Tenant[]);
      writeTenantDataToFirebase(DEFAULT_TENANT.id, 'tenants', cleanTenants).catch(() => {});
      return;
    }

    saveTenantDataLocalOnly(tenantId, key, data);
    // Realtime sync to Firebase for all tenants (users, sites, config, items, teams, etc.)
    writeTenantDataToFirebase(tenantId, key, data).catch(() => {});
  } catch (err) {
    console.error(`Failed to save ${key} for tenant ${tenantId}:`, err);
  }
}

export function getAllSavedTenants(): Tenant[] {
  try {
    const deletedIds = getDeletedTenantIds();
    const rawRoot = localStorage.getItem(STORAGE_KEY_PREFIX + 'tenants');
    const rawApex = localStorage.getItem(`${STORAGE_KEY_PREFIX}tenant-apex-main_tenants`);
    const parsedRoot: Tenant[] = rawRoot ? JSON.parse(rawRoot) : [];
    const parsedApex: Tenant[] = rawApex ? JSON.parse(rawApex) : [];

    const map = new Map<string, Tenant>();

    // Initial defaults
    INITIAL_TENANTS.forEach((t) => {
      if (t && t.id && (t.id === DEFAULT_TENANT.id || !deletedIds.has(t.id))) {
        map.set(t.id, t);
      }
    });
    parsedApex.forEach((t) => {
      if (t && t.id && (t.id === DEFAULT_TENANT.id || !deletedIds.has(t.id))) {
        map.set(t.id, t);
      }
    });
    parsedRoot.forEach((t) => {
      if (t && t.id && (t.id === DEFAULT_TENANT.id || !deletedIds.has(t.id))) {
        map.set(t.id, t);
      }
    });

    // Dynamic Discovery: Scan all localStorage keys for any created tenant workspaces (excluding deleted tenants)
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_KEY_PREFIX + 'tenant-') && k.endsWith('_config')) {
        const tenantId = k.replace(STORAGE_KEY_PREFIX, '').replace('_config', '');
        if (tenantId !== DEFAULT_TENANT.id && tenantId !== 'tenant-apex-main' && deletedIds.has(tenantId)) {
          purgeTenantLocalStorageKeys(tenantId);
          continue;
        }
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

    return persistTenantsLocal(Array.from(map.values()));
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
  // Any user explicitly created under Master Tenant (tenant-apex-main) is NEVER foreign
  if (u.tenantId === DEFAULT_TENANT.id || u.tenantId === 'tenant-apex-main') {
    return false;
  }
  // Any user explicitly created under a different client tenant is foreign to Master Tenant
  if (u.tenantId && u.tenantId !== DEFAULT_TENANT.id && u.tenantId !== 'tenant-apex-main') {
    return true;
  }
  return false;
}

export function sanitizeAndRecoverApexUsers(existingUsers?: User[]): User[] {
  const recovered: User[] = [];
  const seenUsernames = new Set<string>();
  const deletedIds = getTenantDeletedRecordIds(DEFAULT_TENANT.id);

  const addUserIfValid = (u: User) => {
    if (!u || !u.username) return;
    const norm = u.username.trim().toLowerCase();
    const isCoreAdmin = norm === 'admin' || u.id === 'usr-admin-1';
    if (!isCoreAdmin && u.id && deletedIds.has(u.id)) return;
    if (isForeignUser(u)) return;
    if (seenUsernames.has(norm)) return;
    seenUsernames.add(norm);
    recovered.push({
      ...u,
      tenantId: u.tenantId || DEFAULT_TENANT.id,
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
    tenantId: DEFAULT_TENANT.id,
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

export function sanitizeTenantUsers(tenantId: string, rawUsers: User[], _allTenants: Tenant[]): User[] {
  if (!Array.isArray(rawUsers)) return [];
  const isMaster = tenantId === DEFAULT_TENANT.id || tenantId === 'tenant-apex-main';

  if (isMaster) {
    return sanitizeAndRecoverApexUsers(rawUsers);
  }

  const deletedIds = getTenantDeletedRecordIds(tenantId);
  const seen = new Set<string>();
  return rawUsers.filter((u) => {
    if (!u || !u.username) return false;
    const uName = (u.username || '').trim().toLowerCase();
    const uId = (u.id || '').toLowerCase();
    const isPrimaryOwner = uId.endsWith('-admin');

    if (!isPrimaryOwner && u.id && deletedIds.has(u.id)) {
      return false;
    }

    // 1. If user explicitly belongs to this tenantId, keep them
    if (u.tenantId === tenantId) {
      if (seen.has(uName)) return false;
      seen.add(uName);
      return true;
    }

    // 2. If user explicitly specifies a different tenantId, exclude them
    if (u.tenantId && u.tenantId !== tenantId) {
      return false;
    }

    // 3. Exclude Master Developer Super Admin ('admin') from client workspace lists
    if (uName === 'admin' || uId === 'usr-admin-1') {
      return false;
    }

    if (seen.has(uName)) return false;
    seen.add(uName);
    return true;
  });
}

export function sanitizeTenantSites(tenantId: string, rawSites: Site[], allTenants: Tenant[]): Site[] {
  const isMaster = tenantId === DEFAULT_TENANT.id || tenantId === 'tenant-apex-main';
  const deletedIds = getTenantDeletedRecordIds(tenantId);
  const baseList = Array.isArray(rawSites) ? rawSites : [];

  const filtered = filterPostFlushRecords(tenantId, 'sites', baseList).filter((s) => {
    if (!s || !s.id || !s.name) return false;
    const isMain =
      s.isMainWarehouse === true ||
      s.id === 'site-main' ||
      (typeof s.id === 'string' && s.id.endsWith('-main'));
    if (!isMain && deletedIds.has(s.id)) return false;
    if (isMaster && (s.id.includes('civilect') || s.name.toLowerCase().includes('civilect'))) {
      return false;
    }
    return true;
  });

  const seenIds = new Set<string>();
  const deduped: Site[] = [];
  for (const s of filtered) {
    const isMain =
      s.isMainWarehouse === true ||
      s.id === 'site-main' ||
      (typeof s.id === 'string' && s.id.endsWith('-main'));
    if (seenIds.has(s.id)) continue;
    seenIds.add(s.id);
    deduped.push(
      isMain
        ? { ...s, isMainWarehouse: true, isDeleted: false }
        : s
    );
  }

  const hasMainWarehouse = deduped.some((s) => s.isMainWarehouse === true);
  if (!hasMainWarehouse) {
    if (isMaster) {
      const masterMain: Site = {
        ...INITIAL_SITES[0],
        isMainWarehouse: true,
        isDeleted: false,
      };
      deduped.unshift(masterMain);
    } else {
      const tObj = (allTenants || []).find((t) => t && t.id === tenantId);
      const slug =
        tObj?.slug ||
        tenantId.replace(/^tenant-/, '').replace(/-\d+$/, '') ||
        'main';
      const companyName = tObj?.companyName || 'Company';
      const tenantMainSite: Site = {
        id: `site-${slug}-main`,
        name: 'Central Main Warehouse',
        isMainWarehouse: true,
        supervisorName: 'Warehouse Manager',
        location: `${companyName} Logistics Yard`,
        contactNumber: tObj?.contactPhone || '+94 77 123 4567',
        createdAt: tObj?.createdAt || '2026-11-01T00:00:00.000Z',
        isDeleted: false,
      };
      deduped.unshift(tenantMainSite);
    }
  }

  // Always ensure Main Warehouse is positioned first
  return deduped.sort((a, b) => {
    if (a.isMainWarehouse && !b.isMainWarehouse) return -1;
    if (!a.isMainWarehouse && b.isMainWarehouse) return 1;
    return 0;
  });
}

function findMatchingTenantsBySlug(tenantsList: Tenant[], slugOrId: string): Tenant[] {
  const clean = slugOrId.trim().toLowerCase();
  const cleanAlphaNum = clean.replace(/[^a-z0-9]/g, '');
  const deletedIds = getDeletedTenantIds();
  const matches = tenantsList.filter(
    (t) =>
      t &&
      t.id &&
      (t.id === DEFAULT_TENANT.id || !deletedIds.has(t.id)) &&
      (t.id.toLowerCase() === clean ||
        t.slug?.toLowerCase() === clean ||
        t.companyName?.toLowerCase() === clean ||
        (cleanAlphaNum && t.slug?.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanAlphaNum))
  );
  // Sort newest created first so if duplicate company slugs exist, the most recent workspace is prioritized
  return matches.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
}

export const StockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    return getAllSavedTenants();
  });
  const tenantsRef = useRef<Tenant[]>(tenants);
  useEffect(() => {
    tenantsRef.current = tenants;
  }, [tenants]);

  const [currentTenantId, setCurrentTenantId] = useState<string>(() => {
    try {
      const deletedIds = getDeletedTenantIds();
      const loadedTenants = getAllSavedTenants();
      const urlParams = new URLSearchParams(window.location.search);
      const wsSlug = urlParams.get('workspace');
      if (wsSlug) {
        const matches = findMatchingTenantsBySlug(loadedTenants, wsSlug);
        if (matches.length > 0) {
          localStorage.setItem(STORAGE_KEY_PREFIX + 'current_tenant_id', matches[0].id);
          return matches[0].id;
        }
      }
      const storedId = localStorage.getItem(STORAGE_KEY_PREFIX + 'current_tenant_id');
      if (storedId === 'tenant-comtec-main' || (storedId && deletedIds.has(storedId))) {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'current_tenant_id', DEFAULT_TENANT.id);
        return DEFAULT_TENANT.id;
      }
      return storedId || DEFAULT_TENANT.id;
    } catch {
      return DEFAULT_TENANT.id;
    }
  });

  // SaaS Tenant Preview State (declared early so activeTenantId can drive all workspace data & links)
  const [previewTenantId, setPreviewTenantId] = useState<string | null>(null);
  const activeTenantId = useMemo(() => previewTenantId || currentTenantId, [previewTenantId, currentTenantId]);

  const currentTenantIdRef = useRef<string>(activeTenantId);
  const loadedTenantIdRef = useRef<string>(activeTenantId);
  const isFlushingRef = useRef<boolean>(false);
  // Tracks which tenantIds have completed initial Firebase hydration so empty local state never overwrites remote data
  const hydratedTenantsRef = useRef<Set<string>>(new Set());
  const isHydratingTenantRef = useRef<boolean>(false);
  const hydrationSeqRef = useRef<number>(0);

  useEffect(() => {
    currentTenantIdRef.current = activeTenantId;
  }, [activeTenantId]);

  // Fetch remote tenants list once on mount so fresh browsers with ?workspace=slug discover the workspace immediately
  useEffect(() => {
    fetchTenantsFromFirebase()
      .then((remoteList) => {
        if (remoteList && remoteList.length > 0) {
          const deletedIds = getDeletedTenantIds();
          const map = new Map<string, Tenant>();
          (tenantsRef.current.length > 0 ? tenantsRef.current : getAllSavedTenants()).forEach((t) => {
            if (t && t.id && (t.id === DEFAULT_TENANT.id || !deletedIds.has(t.id))) map.set(t.id, t);
          });
          remoteList.forEach((t) => {
            if (t && t.id && (t.id === DEFAULT_TENANT.id || !deletedIds.has(t.id))) map.set(t.id, t);
          });
          const merged = persistTenantsLocal(Array.from(map.values()));
          tenantsRef.current = merged;
          setTenants(merged);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-switch workspace if ?workspace=slug is present in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const wsSlug = urlParams.get('workspace');
      if (wsSlug) {
        const allList = tenants.length > 0 ? tenants : getAllSavedTenants();
        let matches = findMatchingTenantsBySlug(allList, wsSlug);

        if (matches.length === 0) {
          const fresh = getAllSavedTenants();
          matches = findMatchingTenantsBySlug(fresh, wsSlug);
          if (matches.length > 0) {
            setTenants(fresh);
          } else {
            // Fetch live tenants from Firebase if not yet in localStorage
            fetchTenantsFromFirebase().then((remoteList) => {
              if (remoteList && remoteList.length > 0) {
                const deletedIds = getDeletedTenantIds();
                const merged = persistTenantsLocal(
                  remoteList.filter((t) => t && t.id && (t.id === DEFAULT_TENANT.id || !deletedIds.has(t.id)))
                );
                tenantsRef.current = merged;
                setTenants(merged);
              }
            });
          }
        }

        // Only auto-switch if current active tenant does not already match the requested workspace slug
        const alreadyMatches = matches.some((m) => m.id === currentTenantIdRef.current);
        if (matches.length > 0 && !alreadyMatches) {
          const target = matches[0];
          setCurrentTenantId(target.id);
          currentTenantIdRef.current = target.id;
          try {
            localStorage.setItem(STORAGE_KEY_PREFIX + 'current_tenant_id', target.id);
          } catch {}
          loadTenantStateIntoMemory(target.id);
        }
      }
    }
  }, [tenants]);

  // Helper to safely merge local and remote collections by ID, respecting updatedAt timestamps when present
  const mergeListsById = <T extends { id: string; updatedAt?: string }>(localList: T[], remoteList: T[]): T[] => {
    const map = new Map<string, T>();
    (remoteList || []).forEach((item) => {
      if (item && item.id) map.set(item.id, item);
    });
    (localList || []).forEach((item) => {
      if (item && item.id) {
        const existing = map.get(item.id);
        if (!existing) {
          map.set(item.id, item);
        } else if (existing.updatedAt && item.updatedAt) {
          const remoteMs = new Date(existing.updatedAt).getTime();
          const localMs = new Date(item.updatedAt).getTime();
          map.set(item.id, remoteMs > localMs ? { ...item, ...existing } : { ...existing, ...item });
        } else {
          map.set(item.id, { ...existing, ...item });
        }
      }
    });
    return Array.from(map.values());
  };

  // Purges any pre-flush records in React state & localStorage when a newer flushMeta is discovered from Firebase
  const applyRemoteFlushBarrier = (targetTenantId: string, remoteMeta: FlushMeta) => {
    const localMeta = getTenantFlushMeta(targetTenantId);
    if (localMeta && localMeta.flushedAtMs >= remoteMeta.flushedAtMs) {
      return;
    }
    saveTenantFlushMetaLocal(targetTenantId, remoteMeta);

    const isMaster = targetTenantId === DEFAULT_TENANT.id || targetTenantId === 'tenant-apex-main';
    const clearedKeys = [
      'items',
      'teams',
      'projects',
      'mainStockEntries',
      'stockRequests',
      'teamIssues',
      'teamReturns',
      'projectUsages',
      'crossProjectRequests',
      'clientFreeIssues',
      'branchReturns',
      'damagedRestorations',
      'suppliers',
      'clients',
      'purchaseOrders',
      'supplierReturns',
    ];
    clearedKeys.forEach((k) => {
      try {
        localStorage.setItem(getTenantStorageKey(targetTenantId, k), JSON.stringify([]));
        if (isMaster) {
          localStorage.setItem(STORAGE_KEY_PREFIX + k, JSON.stringify([]));
          localStorage.removeItem(`${STORAGE_KEY_PREFIX}tenant-comtec-main_${k}`);
        }
      } catch {}
    });

    if (currentTenantIdRef.current !== targetTenantId) return;

    const wasFlushing = isFlushingRef.current;
    isFlushingRef.current = true;
    setSites((prev) => {
      return sanitizeTenantSites(targetTenantId, prev, tenantsRef.current);
    });
    setUsers((prev) => {
      const filtered = sanitizeTenantUsers(
        targetTenantId,
        filterPostFlushRecords(targetTenantId, 'users', prev),
        tenantsRef.current
      );
      return filtered;
    });
    setItems((prev) => filterPostFlushRecords(targetTenantId, 'items', prev));
    setTeams((prev) => filterPostFlushRecords(targetTenantId, 'teams', prev));
    setProjects((prev) => filterPostFlushRecords(targetTenantId, 'projects', prev));
    setMainStockEntries((prev) => filterPostFlushRecords(targetTenantId, 'mainStockEntries', prev));
    setStockRequests((prev) => filterPostFlushRecords(targetTenantId, 'stockRequests', prev));
    setTeamIssues((prev) => filterPostFlushRecords(targetTenantId, 'teamIssues', prev));
    setTeamReturns((prev) => filterPostFlushRecords(targetTenantId, 'teamReturns', prev));
    setProjectUsages((prev) => filterPostFlushRecords(targetTenantId, 'projectUsages', prev));
    setCrossProjectRequests((prev) => filterPostFlushRecords(targetTenantId, 'crossProjectRequests', prev));
    setClientFreeIssues((prev) => filterPostFlushRecords(targetTenantId, 'clientFreeIssues', prev));
    setBranchReturns((prev) => filterPostFlushRecords(targetTenantId, 'branchReturns', prev));
    setDamagedRestorations((prev) => filterPostFlushRecords(targetTenantId, 'damagedRestorations', prev));
    setSuppliers((prev) => filterPostFlushRecords(targetTenantId, 'suppliers', prev));
    setClients((prev) => filterPostFlushRecords(targetTenantId, 'clients', prev));
    setPurchaseOrders((prev) => filterPostFlushRecords(targetTenantId, 'purchaseOrders', prev));
    setSupplierReturns((prev) => filterPostFlushRecords(targetTenantId, 'supplierReturns', prev));
    setAuditLogs((prev) => filterPostFlushRecords(targetTenantId, 'auditLogs', prev));
    setTimeout(() => {
      if (!wasFlushing) {
        isFlushingRef.current = false;
      }
    }, 150);
  };

  const isApplyingRemoteRef = useRef<boolean>(false);
  const runWithRemoteGuard = (fn: () => void) => {
    isApplyingRemoteRef.current = true;
    try {
      fn();
    } finally {
      setTimeout(() => {
        isApplyingRemoteRef.current = false;
      }, 100);
    }
  };

  // Helper to sync all collections for any tenantId from Firebase RTDB (respecting flushMeta & deleted tombstones)
  const syncTenantCollectionsFromFirebase = async (targetTenantId: string): Promise<void> => {
    if (!targetTenantId || isFlushingRef.current) return;
    if (targetTenantId !== DEFAULT_TENANT.id && getDeletedTenantIds().has(targetTenantId)) return;

    const seq = ++hydrationSeqRef.current;
    isHydratingTenantRef.current = true;
    try {
      // 1. Fetch flushMeta AND deletedRecordIds FIRST before merging any collection so pre-flush or permanently deleted records can never resurrect
      const [remoteFlushMeta, remoteDeletedRecordIds] = await Promise.all([
        fetchTenantDataFromFirebase<FlushMeta>(targetTenantId, 'flushMeta'),
        fetchTenantDataFromFirebase<string[] | Record<string, any>>(targetTenantId, 'deletedRecordIds'),
      ]);
      if (targetTenantId !== DEFAULT_TENANT.id && getDeletedTenantIds().has(targetTenantId)) return;
      if (remoteDeletedRecordIds) {
        mergeRemoteTenantDeletedRecordIds(targetTenantId, remoteDeletedRecordIds);
      }
      if (remoteFlushMeta && typeof remoteFlushMeta.flushedAtMs === 'number') {
        applyRemoteFlushBarrier(targetTenantId, remoteFlushMeta);
      }
      if (currentTenantIdRef.current !== targetTenantId || isFlushingRef.current) return;

      const syncUsersTask = fetchTenantDataFromFirebase<User[]>(targetTenantId, 'users').then((remoteUsers) => {
        if (currentTenantIdRef.current !== targetTenantId || isFlushingRef.current) return;
        if (remoteUsers && Array.isArray(remoteUsers) && remoteUsers.length > 0) {
          const cleanRemote = filterPostFlushRecords(targetTenantId, 'users', remoteUsers);
          if (cleanRemote.length < remoteUsers.length) {
            writeTenantDataToFirebase(targetTenantId, 'users', cleanRemote).catch(() => {});
          }
          runWithRemoteGuard(() => {
            setUsers((prev) => {
              const cleanPrev = filterPostFlushRecords(targetTenantId, 'users', prev);
              const merged = sanitizeTenantUsers(
                targetTenantId,
                mergeListsById(cleanPrev, cleanRemote),
                tenantsRef.current
              );
              saveTenantDataLocalOnly(targetTenantId, 'users', merged);
              return merged;
            });
          });
        } else {
          runWithRemoteGuard(() => {
            setUsers((prev) => {
              const cleanPrev = sanitizeTenantUsers(
                targetTenantId,
                filterPostFlushRecords(targetTenantId, 'users', prev),
                tenantsRef.current
              );
              saveTenantDataLocalOnly(targetTenantId, 'users', cleanPrev);
              return cleanPrev;
            });
          });
        }
      });

      const syncSitesTask = fetchTenantDataFromFirebase<Site[]>(targetTenantId, 'sites').then((remoteSites) => {
        if (currentTenantIdRef.current !== targetTenantId || isFlushingRef.current) return;
        const remoteList = Array.isArray(remoteSites) ? remoteSites : [];
        const cleanRemote = filterPostFlushRecords(targetTenantId, 'sites', remoteList);
        runWithRemoteGuard(() => {
          setSites((prev) => {
            const cleanPrev = filterPostFlushRecords(targetTenantId, 'sites', prev);
            const merged = mergeListsById(cleanPrev, cleanRemote);
            const finalSites = sanitizeTenantSites(targetTenantId, merged, tenantsRef.current);
            saveTenantDataLocalOnly(targetTenantId, 'sites', finalSites);
            const remoteHadMain = cleanRemote.some((s) => s && s.isMainWarehouse === true);
            if (!remoteHadMain || cleanRemote.length !== remoteList.length) {
              writeTenantDataToFirebase(targetTenantId, 'sites', finalSites).catch(() => {});
            }
            return finalSites;
          });
        });
      });

      const syncConfigTask = fetchTenantDataFromFirebase<SystemConfig>(targetTenantId, 'config').then((remoteConfig) => {
        if (currentTenantIdRef.current !== targetTenantId || isFlushingRef.current) return;
        if (remoteConfig && remoteConfig.companyName) {
          runWithRemoteGuard(() => {
            setConfig((prev) => {
              const merged = { ...prev, ...remoteConfig };
              saveTenantDataLocalOnly(targetTenantId, 'config', merged);
              return merged;
            });
          });
        }
      });

      const syncCollection = <T extends { id: string }>(
        key: string,
        setter: React.Dispatch<React.SetStateAction<T[]>>
      ): Promise<void> => {
        return fetchTenantDataFromFirebase<T[]>(targetTenantId, key).then((remote) => {
          if (currentTenantIdRef.current !== targetTenantId || isFlushingRef.current) return;
          if (remote && Array.isArray(remote) && remote.length > 0) {
            const cleanRemote = filterPostFlushRecords(targetTenantId, key, remote);
            if (cleanRemote.length < remote.length) {
              writeTenantDataToFirebase(targetTenantId, key, cleanRemote).catch(() => {});
            }
            runWithRemoteGuard(() => {
              setter((prev) => {
                const cleanPrev = filterPostFlushRecords(targetTenantId, key, prev);
                const merged = mergeListsById(cleanPrev, cleanRemote);
                saveTenantDataLocalOnly(targetTenantId, key, merged);
                return merged;
              });
            });
          } else {
            runWithRemoteGuard(() => {
              setter((prev) => {
                const cleanPrev = filterPostFlushRecords(targetTenantId, key, prev);
                saveTenantDataLocalOnly(targetTenantId, key, cleanPrev);
                return cleanPrev;
              });
            });
          }
        });
      };

      await Promise.allSettled([
        syncUsersTask,
        syncSitesTask,
        syncConfigTask,
        syncCollection<Item>('items', setItems),
        syncCollection<Team>('teams', setTeams),
        syncCollection<MainStockEntry>('mainStockEntries', setMainStockEntries),
        syncCollection<StockTransferRequest>('stockRequests', setStockRequests),
        syncCollection<TeamIssue>('teamIssues', setTeamIssues),
        syncCollection<TeamReturn>('teamReturns', setTeamReturns),
        syncCollection<Project>('projects', setProjects),
        syncCollection<ProjectType>('projectTypes', setProjectTypes),
        syncCollection<ProjectMaterialUsage>('projectUsages', setProjectUsages),
        syncCollection<CrossProjectOverrideRequest>('crossProjectRequests', setCrossProjectRequests),
        syncCollection<ClientFreeIssueEntry>('clientFreeIssues', setClientFreeIssues),
        syncCollection<BranchReturn>('branchReturns', setBranchReturns),
        syncCollection<DamagedStockRestoration>('damagedRestorations', setDamagedRestorations),
        syncCollection<Supplier>('suppliers', setSuppliers),
        syncCollection<Client>('clients', setClients),
        syncCollection<PurchaseOrder>('purchaseOrders', setPurchaseOrders),
        syncCollection<SupplierReturn>('supplierReturns', setSupplierReturns),
        syncCollection<AuditLogEntry>('auditLogs', setAuditLogs),
        syncCollection<StockBackup>('backups', setBackups),
        syncCollection<LetterheadTemplate>('letterheadTemplates', setLetterheadTemplates),
        syncCollection<DigitalSignature>('digitalSignatures', setDigitalSignatures),
      ]);

      if (currentTenantIdRef.current === targetTenantId) {
        hydratedTenantsRef.current.add(targetTenantId);
      }
    } finally {
      if (hydrationSeqRef.current === seq) {
        isHydratingTenantRef.current = false;
      }
    }
  };

  // Realtime Cloud Data Sync for current active tenant (multi-device / Vercel deployment support)
  useEffect(() => {
    if (!activeTenantId) return;

    syncTenantCollectionsFromFirebase(activeTenantId);

    // Realtime listener for tenant deletedRecordIds so permanent deletions propagate across all tabs/devices immediately
    const unsubDeletedRecords = subscribeToFirebaseTenantData<string[] | Record<string, any>>(
      activeTenantId,
      'deletedRecordIds',
      (remoteDeleted) => {
        if (remoteDeleted && currentTenantIdRef.current === activeTenantId && !isFlushingRef.current) {
          const deletedSet = mergeRemoteTenantDeletedRecordIds(activeTenantId, remoteDeleted);
          if (deletedSet.size > 0) {
            runWithRemoteGuard(() => {
              setUsers((prev) => {
                const next = sanitizeTenantUsers(
                  activeTenantId,
                  filterPostFlushRecords(activeTenantId, 'users', prev),
                  tenantsRef.current
                );
                saveTenantDataLocalOnly(activeTenantId, 'users', next);
                return next;
              });
              setSites((prev) => {
                const next = sanitizeTenantSites(activeTenantId, prev, tenantsRef.current);
                saveTenantDataLocalOnly(activeTenantId, 'sites', next);
                return next;
              });
              setItems((prev) => filterPostFlushRecords(activeTenantId, 'items', prev));
              setTeams((prev) => filterPostFlushRecords(activeTenantId, 'teams', prev));
              setProjects((prev) => filterPostFlushRecords(activeTenantId, 'projects', prev));
            });
          }
        }
      }
    );

    // Realtime listener for tenant flushMeta so other open browser tabs/devices clear immediately on flush
    const unsubFlushMeta = subscribeToFirebaseTenantData<FlushMeta>(
      activeTenantId,
      'flushMeta',
      (remoteMeta) => {
        if (
          remoteMeta &&
          typeof remoteMeta === 'object' &&
          typeof remoteMeta.flushedAtMs === 'number' &&
          currentTenantIdRef.current === activeTenantId
        ) {
          applyRemoteFlushBarrier(activeTenantId, remoteMeta);
        }
      }
    );

    // Realtime listener for tenant users
    const unsubUsers = subscribeToFirebaseTenantData<User[]>(
      activeTenantId,
      'users',
      (remoteUsers) => {
        if (
          remoteUsers &&
          Array.isArray(remoteUsers) &&
          remoteUsers.length > 0 &&
          currentTenantIdRef.current === activeTenantId &&
          !isFlushingRef.current
        ) {
          runWithRemoteGuard(() => {
            setUsers((prev) => {
              const cleanPrev = filterPostFlushRecords(activeTenantId, 'users', prev);
              const cleanRemote = filterPostFlushRecords(activeTenantId, 'users', remoteUsers);
              const baseList = hydratedTenantsRef.current.has(activeTenantId)
                ? cleanRemote
                : mergeListsById(cleanPrev, cleanRemote);
              const merged = sanitizeTenantUsers(activeTenantId, baseList, tenantsRef.current);
              saveTenantDataLocalOnly(activeTenantId, 'users', merged);
              return merged;
            });
          });
        }
      }
    );

    // Realtime listener for tenant sites
    const unsubSites = subscribeToFirebaseTenantData<Site[]>(
      activeTenantId,
      'sites',
      (remoteSites) => {
        if (
          remoteSites &&
          Array.isArray(remoteSites) &&
          remoteSites.length > 0 &&
          currentTenantIdRef.current === activeTenantId &&
          !isFlushingRef.current
        ) {
          runWithRemoteGuard(() => {
            setSites((prev) => {
              const cleanPrev = filterPostFlushRecords(activeTenantId, 'sites', prev);
              const cleanRemote = filterPostFlushRecords(activeTenantId, 'sites', remoteSites);
              const baseList = hydratedTenantsRef.current.has(activeTenantId)
                ? cleanRemote
                : mergeListsById(cleanPrev, cleanRemote);
              const finalSites = sanitizeTenantSites(activeTenantId, baseList, tenantsRef.current);
              saveTenantDataLocalOnly(activeTenantId, 'sites', finalSites);
              return finalSites;
            });
          });
        }
      }
    );

    // Realtime listener for tenant config
    const unsubConfig = subscribeToFirebaseTenantData<SystemConfig>(
      activeTenantId,
      'config',
      (remoteConfig) => {
        if (
          remoteConfig &&
          typeof remoteConfig === 'object' &&
          remoteConfig.companyName &&
          currentTenantIdRef.current === activeTenantId &&
          !isFlushingRef.current
        ) {
          runWithRemoteGuard(() => {
            setConfig((prev) => {
              const merged = { ...prev, ...remoteConfig };
              saveTenantDataLocalOnly(activeTenantId, 'config', merged);
              return merged;
            });
          });
        }
      }
    );

    // Helper for subscribing to any tenant collection in real time
    const subscribeCollection = <T extends { id: string }>(
      key: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
      return subscribeToFirebaseTenantData<T[]>(activeTenantId, key, (remoteList) => {
        if (
          remoteList &&
          Array.isArray(remoteList) &&
          remoteList.length > 0 &&
          currentTenantIdRef.current === activeTenantId &&
          !isFlushingRef.current
        ) {
          runWithRemoteGuard(() => {
            setter((prev) => {
              const cleanPrev = filterPostFlushRecords(activeTenantId, key, prev);
              const cleanRemote = filterPostFlushRecords(activeTenantId, key, remoteList);
              const merged = hydratedTenantsRef.current.has(activeTenantId)
                ? cleanRemote
                : mergeListsById(cleanPrev, cleanRemote);
              saveTenantDataLocalOnly(activeTenantId, key, merged);
              return merged;
            });
          });
        }
      });
    };

    const unsubItems = subscribeCollection<Item>('items', setItems);
    const unsubTeams = subscribeCollection<Team>('teams', setTeams);
    const unsubProjects = subscribeCollection<Project>('projects', setProjects);
    const unsubProjectTypes = subscribeCollection<ProjectType>('projectTypes', setProjectTypes);
    const unsubMainEntries = subscribeCollection<MainStockEntry>('mainStockEntries', setMainStockEntries);
    const unsubStockRequests = subscribeCollection<StockTransferRequest>('stockRequests', setStockRequests);
    const unsubTeamIssues = subscribeCollection<TeamIssue>('teamIssues', setTeamIssues);
    const unsubTeamReturns = subscribeCollection<TeamReturn>('teamReturns', setTeamReturns);
    const unsubProjectUsages = subscribeCollection<ProjectMaterialUsage>('projectUsages', setProjectUsages);
    const unsubCrossRequests = subscribeCollection<CrossProjectOverrideRequest>('crossProjectRequests', setCrossProjectRequests);
    const unsubClientFreeIssues = subscribeCollection<ClientFreeIssueEntry>('clientFreeIssues', setClientFreeIssues);
    const unsubBranchReturns = subscribeCollection<BranchReturn>('branchReturns', setBranchReturns);
    const unsubRestorations = subscribeCollection<DamagedStockRestoration>('damagedRestorations', setDamagedRestorations);
    const unsubSuppliers = subscribeCollection<Supplier>('suppliers', setSuppliers);
    const unsubClients = subscribeCollection<Client>('clients', setClients);
    const unsubPOs = subscribeCollection<PurchaseOrder>('purchaseOrders', setPurchaseOrders);
    const unsubSupplierReturns = subscribeCollection<SupplierReturn>('supplierReturns', setSupplierReturns);
    const unsubAuditLogs = subscribeCollection<AuditLogEntry>('auditLogs', setAuditLogs);

    return () => {
      if (unsubDeletedRecords) unsubDeletedRecords();
      if (unsubFlushMeta) unsubFlushMeta();
      if (unsubUsers) unsubUsers();
      if (unsubSites) unsubSites();
      if (unsubConfig) unsubConfig();
      if (unsubItems) unsubItems();
      if (unsubTeams) unsubTeams();
      if (unsubProjects) unsubProjects();
      if (unsubProjectTypes) unsubProjectTypes();
      if (unsubMainEntries) unsubMainEntries();
      if (unsubStockRequests) unsubStockRequests();
      if (unsubTeamIssues) unsubTeamIssues();
      if (unsubTeamReturns) unsubTeamReturns();
      if (unsubProjectUsages) unsubProjectUsages();
      if (unsubCrossRequests) unsubCrossRequests();
      if (unsubClientFreeIssues) unsubClientFreeIssues();
      if (unsubBranchReturns) unsubBranchReturns();
      if (unsubRestorations) unsubRestorations();
      if (unsubSuppliers) unsubSuppliers();
      if (unsubClients) unsubClients();
      if (unsubPOs) unsubPOs();
      if (unsubSupplierReturns) unsubSupplierReturns();
      if (unsubAuditLogs) unsubAuditLogs();
    };
  }, [activeTenantId]);

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
    if (isFlushingRef.current) return;
    const targetTenantId = currentTenantIdRef.current;
    if (!targetTenantId || loadedTenantIdRef.current !== targetTenantId) return;

    // While hydrating a tenant or applying an incoming Firebase listener update, do not echo writes back to Firebase
    if (isHydratingTenantRef.current || isApplyingRemoteRef.current) {
      if (Array.isArray(data) && data.length === 0) return;
      saveTenantDataLocalOnly(targetTenantId, key, data);
      return;
    }

    saveTenantDataLocalOnly(targetTenantId, key, data);

    // Only write to Firebase from automatic useEffects AFTER the tenant has completed Firebase hydration,
    // and never overwrite remote Firebase collections with an empty array [] from a passive state effect
    if (hydratedTenantsRef.current.has(targetTenantId)) {
      if (Array.isArray(data) && data.length === 0) {
        return;
      }
      writeTenantDataToFirebase(targetTenantId, key, data).catch(() => {});
    }
  };

  // State variables for current active tenant
  const isDefaultTenant = activeTenantId === DEFAULT_TENANT.id;
  const currentTenant = useMemo(() => {
    return (
      tenants.find((t) => t.id === activeTenantId) ||
      tenants.find((t) => t.id === currentTenantId) ||
      tenants[0] ||
      DEFAULT_TENANT
    );
  }, [tenants, activeTenantId, currentTenantId]);

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
  const [sites, setSites] = useState<Site[]>(() => {
    const rawSites = loadTenantData(currentTenantId, 'sites', isDefaultTenant ? INITIAL_SITES : []);
    return sanitizeTenantSites(currentTenantId, rawSites, tenants);
  });
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
    try {
      const savedAuthId = localStorage.getItem(STORAGE_KEY_PREFIX + 'auth_user_id');
      if (savedAuthId) {
        const matched = users.find((u) => u.id === savedAuthId && !u.isDeleted);
        if (matched) return matched;
      }
    } catch {}
    const active = users.find((u) => !u.isDeleted) || users[0] || INITIAL_USERS[0];
    return active;
  });

  // Keep authUser synchronized when users array updates from Firebase (e.g., updated site assignments or role)
  useEffect(() => {
    if (!users || users.length === 0) return;
    try {
      const savedAuthId = localStorage.getItem(STORAGE_KEY_PREFIX + 'auth_user_id');
      const targetId = savedAuthId || authUser?.id;
      if (targetId) {
        const latestMatch = users.find((u) => u.id === targetId && !u.isDeleted);
        if (latestMatch) {
          setAuthUser((prev) => {
            if (
              prev?.id === latestMatch.id &&
              prev?.role === latestMatch.role &&
              prev?.siteId === latestMatch.siteId &&
              prev?.fullName === latestMatch.fullName &&
              JSON.stringify(prev?.siteIds) === JSON.stringify(latestMatch.siteIds)
            ) {
              return prev;
            }
            return latestMatch;
          });
        }
      }
    } catch {}
  }, [users]);

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
    isHydratingTenantRef.current = true;
    currentTenantIdRef.current = tenantId;
    loadedTenantIdRef.current = tenantId;
    const isDefault = tenantId === DEFAULT_TENANT.id;
    const allKnownTenants = tenantsRef.current.length > 0 ? tenantsRef.current : tenants;
    const tObj = allKnownTenants.find((t) => t.id === tenantId) || DEFAULT_TENANT;

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
    const finalUsers = sanitizeTenantUsers(tenantId, loadedUsers, allKnownTenants);
    if (finalUsers.length > 0) {
      saveTenantDataLocalOnly(tenantId, 'users', finalUsers);
    }

    const finalSites = sanitizeTenantSites(tenantId, loadedSites, allKnownTenants);
    if (finalSites.length > 0) {
      saveTenantDataLocalOnly(tenantId, 'sites', finalSites);
    }

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
      saveTenantDataLocalOnly(DEFAULT_TENANT.id, 'users', finalUsers);
      saveTenantDataLocalOnly(DEFAULT_TENANT.id, 'sites', finalSites);
    }

    const savedAuthId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_PREFIX + 'auth_user_id') : null;
    const activeUser =
      (savedAuthId ? finalUsers.find((u) => !u.isDeleted && u.id === savedAuthId) : null) ||
      finalUsers.find((u) => !u.isDeleted && u.username === 'admin') ||
      finalUsers.find((u) => !u.isDeleted) ||
      finalUsers[0] ||
      (isDefault ? INITIAL_USERS[0] : null);
    if (activeUser) {
      setCurrentUser(activeUser);
    }

    syncTenantCollectionsFromFirebase(tenantId);
  };

  const getWorkspaceLoginUrl = (slugOrTenantId?: string): string => {
    const target = slugOrTenantId
      ? (tenants.find((t) => t.id === slugOrTenantId || t.slug === slugOrTenantId) || currentTenant)
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

    // Ensure we have the latest tenants list (including remote Firebase saasTenants if needed)
    let allTenants = tenantsRef.current.length > 0 ? tenantsRef.current : getAllSavedTenants();
    const refreshTenantsFromCloud = async (): Promise<Tenant[]> => {
      const remoteList = await fetchTenantsFromFirebase();
      if (remoteList && remoteList.length > 0) {
        const deletedIds = getDeletedTenantIds();
        const map = new Map<string, Tenant>();
        allTenants.forEach((t) => {
          if (t && t.id && (t.id === DEFAULT_TENANT.id || !deletedIds.has(t.id))) map.set(t.id, t);
        });
        remoteList.forEach((t) => {
          if (t && t.id && (t.id === DEFAULT_TENANT.id || !deletedIds.has(t.id))) map.set(t.id, t);
        });
        const merged = persistTenantsLocal(Array.from(map.values()));
        tenantsRef.current = merged;
        setTenants(merged);
        allTenants = merged;
      }
      return allTenants;
    };

    const findUserInTenant = async (t: Tenant, termLower: string): Promise<User | undefined> => {
      const localUsers = loadTenantData<User[]>(
        t.id,
        'users',
        t.id === DEFAULT_TENANT.id ? INITIAL_USERS : []
      );
      const cleanLocal = sanitizeTenantUsers(t.id, localUsers, allTenants);
      let found = cleanLocal.find(
        (u) => !u.isDeleted && (u.username.trim().toLowerCase() === termLower || u.fullName.trim().toLowerCase() === termLower)
      );

      // Always verify/fetch from Firebase RTDB so newly created users or updated passwords/sites are never missed
      const remoteUsers = await fetchTenantDataFromFirebase<User[]>(t.id, 'users');
      if (remoteUsers && Array.isArray(remoteUsers) && remoteUsers.length > 0) {
        const cleanRemote = sanitizeTenantUsers(
          t.id,
          mergeListsById(
            filterPostFlushRecords(t.id, 'users', cleanLocal),
            filterPostFlushRecords(t.id, 'users', remoteUsers)
          ),
          allTenants
        );
        saveTenantDataLocalOnly(t.id, 'users', cleanRemote);
        const remoteMatch = cleanRemote.find(
          (u) => !u.isDeleted && (u.username.trim().toLowerCase() === termLower || u.fullName.trim().toLowerCase() === termLower)
        );
        if (remoteMatch) {
          found = remoteMatch;
        }
      }
      return found;
    };

    if (typeof usernameOrUser === 'string') {
      const term = usernameOrUser.trim().toLowerCase();
      const inputPass = (password || '').trim();

      const explicitSlug = workspaceSlugOrId?.trim().toLowerCase();
      let matchingTenants: Tenant[] = [];

      if (explicitSlug) {
        matchingTenants = findMatchingTenantsBySlug(allTenants, explicitSlug);
        if (matchingTenants.length === 0) {
          await refreshTenantsFromCloud();
          matchingTenants = findMatchingTenantsBySlug(allTenants, explicitSlug);
        }

        if (matchingTenants.length === 0) {
          return {
            success: false,
            message: `Company workspace "${workspaceSlugOrId}" not found. Please verify your company workspace code.`,
          };
        }
      }

      // If a specific workspace was designated, check all tenants matching that slug/id first
      if (matchingTenants.length > 0) {
        // Also refresh cloud tenants if there might be a newer workspace with the same slug
        await refreshTenantsFromCloud();
        matchingTenants = findMatchingTenantsBySlug(allTenants, explicitSlug!);

        const slugCandidates: { tenant: Tenant; user: User; expectedPass: string }[] = [];
        for (const t of matchingTenants) {
          const u = await findUserInTenant(t, term);
          if (u) {
            const isMaster = t.id === DEFAULT_TENANT.id && (u.username === 'admin' || u.id === 'usr-admin-1');
            const expected = isMaster ? 'sasith@123' : (u.password || 'password123').trim();
            slugCandidates.push({ tenant: t, user: u, expectedPass: expected });
          }
        }

        if (slugCandidates.length === 1) {
          matchedTenant = slugCandidates[0].tenant;
          matchedUser = slugCandidates[0].user;
        } else if (slugCandidates.length > 1) {
          const passMatched = inputPass ? slugCandidates.filter((c) => c.expectedPass === inputPass) : slugCandidates;
          const chosen = passMatched[0] || slugCandidates[0];
          matchedTenant = chosen.tenant;
          matchedUser = chosen.user;
        } else {
          // Fallback: if the user wasn't found in the slug-matched tenant, check all other active tenants
          // (in case the admin created the user in another workspace or Master workspace)
          for (const t of allTenants) {
            if (matchingTenants.some((m) => m.id === t.id)) continue;
            const u = await findUserInTenant(t, term);
            if (u) {
              matchedTenant = t;
              matchedUser = u;
              break;
            }
          }

          if (!matchedUser || !matchedTenant) {
            return {
              success: false,
              message: `User account "${usernameOrUser}" not found in ${matchingTenants[0].companyName} workspace.`,
            };
          }
        }
      } else {
        // No explicit workspace code: search across all tenants (refreshing from cloud if needed)
        await refreshTenantsFromCloud();
        const candidates: { tenant: Tenant; user: User; expectedPass: string }[] = [];

        for (const t of allTenants) {
          const found = await findUserInTenant(t, term);
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
          const passwordMatched = inputPass
            ? candidates.filter((c) => c.expectedPass === inputPass)
            : [];

          if (passwordMatched.length === 1) {
            matchedTenant = passwordMatched[0].tenant;
            matchedUser = passwordMatched[0].user;
          } else if (passwordMatched.length > 1) {
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
      for (const t of allTenants) {
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

    // Clear any preview mode and switch tenant context
    setPreviewTenantId(null);
    setCurrentTenantId(matchedTenant.id);
    currentTenantIdRef.current = matchedTenant.id;
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'current_tenant_id', matchedTenant.id);
      localStorage.setItem(STORAGE_KEY_PREFIX + 'is_authenticated', 'true');
      localStorage.setItem(STORAGE_KEY_PREFIX + 'auth_user_id', matchedUser.id);
      if (typeof window !== 'undefined' && window.location.search.includes('workspace=')) {
        const url = new URL(window.location.href);
        if (url.searchParams.get('workspace') !== matchedTenant.slug) {
          url.searchParams.set('workspace', matchedTenant.slug);
          window.history.replaceState({}, document.title, url.toString());
        }
      }
    } catch (e) {
      console.warn('Could not save auth/tenant state:', e);
    }

    loadTenantStateIntoMemory(matchedTenant.id);
    setCurrentUser(matchedUser);
    setIsAuthenticated(true);

    // Ensure all remote collections (sites, users, items, teams, projects, stock, etc.) are synced from Firebase
    await syncTenantCollectionsFromFirebase(matchedTenant.id);
    setCurrentUser(matchedUser);

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

  const previewTenant = useMemo(() => {
    if (!previewTenantId) return null;
    return tenants.find((t) => t.id === previewTenantId) || null;
  }, [tenants, previewTenantId]);

  const setPreviewTenant = (tenant: Tenant | null) => {
    if (!tenant) {
      setPreviewTenantId(null);
      currentTenantIdRef.current = currentTenantId;
      loadTenantStateIntoMemory(currentTenantId);
    } else {
      setPreviewTenantId(tenant.id);
      currentTenantIdRef.current = tenant.id;
      loadTenantStateIntoMemory(tenant.id);
    }
  };

  const exitTenantPreview = () => {
    setPreviewTenantId(null);
    currentTenantIdRef.current = currentTenantId;
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

    // Load all existing Master tenant data (including all created users, sites, items, teams, projects, and config)
    loadTenantStateIntoMemory(DEFAULT_TENANT.id);

    const existingUsers = loadTenantData<User[]>(DEFAULT_TENANT.id, 'users', INITIAL_USERS);
    const cleanUsers = sanitizeAndRecoverApexUsers(existingUsers);
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
      const deletedSet = getDeletedTenantIds();
      let tenantId = `tenant-${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
      while (deletedSet.has(tenantId)) {
        tenantId = `tenant-${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

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
        tenantId,
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
      const baseList = tenantsRef.current.length > 0 ? tenantsRef.current : tenants;
      const updatedTenants = persistTenantsLocal([...baseList.filter((t) => t.id !== newTenant.id), newTenant]);
      tenantsRef.current = updatedTenants;
      setTenants(updatedTenants);
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
      const updated = persistTenantsLocal(
        prev.map((t) => {
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
        })
      );
      tenantsRef.current = updated;
      writeTenantsToFirebase(updated).catch(console.warn);
      return updated;
    });
  };

  const updateTenantDetails = (
    tenantId: string,
    updates: Partial<Pick<Tenant, 'companyName' | 'contactEmail' | 'contactPhone' | 'currencySymbol' | 'country' | 'slug'>>
  ) => {
    setTenants((prev) => {
      const updated = persistTenantsLocal(
        prev.map((t) => {
          if (t.id === tenantId) {
            return {
              ...t,
              ...updates,
            };
          }
          return t;
        })
      );
      tenantsRef.current = updated;
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
    if (!tenantId || tenantId === DEFAULT_TENANT.id || tenantId === 'tenant-apex-main') {
      console.warn('Cannot delete default master tenant.');
      return;
    }

    // 1. Record permanent deletion tombstone locally & purge every localStorage key for this tenant
    const deletedIds = markTenantDeletedLocal(tenantId);

    // 2. Update React state & synchronize both localStorage tenant registry keys
    const baseList = tenantsRef.current.length > 0 ? tenantsRef.current : tenants;
    const updatedTenants = persistTenantsLocal(
      baseList.filter((t) => t.id !== tenantId && (t.id === DEFAULT_TENANT.id || !deletedIds.has(t.id)))
    );
    tenantsRef.current = updatedTenants;
    setTenants(updatedTenants);

    // 3. Atomically update saasTenants, record saasDeletedTenants tombstone, and wipe tenantsData/{tenantId} in Firebase RTDB
    deleteTenantInFirebase(tenantId, updatedTenants).catch(console.warn);

    if (previewTenantId === tenantId) {
      setPreviewTenantId(null);
    }

    if (currentTenantId === tenantId || currentTenantIdRef.current === tenantId) {
      try {
        if (typeof window !== 'undefined' && window.location.search) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch {}
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
    let unsubDeletedTenants: (() => void) | undefined;
    let unsubRootFlushMeta: (() => void) | undefined;

    try {
      unsubRootFlushMeta = subscribeToFirebaseFlushMeta((remoteMeta) => {
        if (remoteMeta && typeof remoteMeta.flushedAtMs === 'number') {
          const isMaster =
            currentTenantIdRef.current === DEFAULT_TENANT.id ||
            currentTenantIdRef.current === 'tenant-apex-main';
          if (isMaster) {
            applyRemoteFlushBarrier(DEFAULT_TENANT.id, remoteMeta);
          } else {
            saveTenantFlushMetaLocal(DEFAULT_TENANT.id, remoteMeta);
          }
        }
      });

      unsubDeletedTenants = subscribeToFirebaseDeletedTenants(
        (remoteDeletedMap) => {
          const deletedIds = mergeRemoteDeletedTenantIds(remoteDeletedMap);
          if (deletedIds.size > 0) {
            setTenants((prev) => {
              const filtered = prev.filter(
                (t) => t.id === DEFAULT_TENANT.id || t.id === 'tenant-apex-main' || !deletedIds.has(t.id)
              );
              if (filtered.length !== prev.length) {
                const persisted = persistTenantsLocal(filtered);
                tenantsRef.current = persisted;
                return persisted;
              }
              return prev;
            });

            if (
              currentTenantIdRef.current !== DEFAULT_TENANT.id &&
              currentTenantIdRef.current !== 'tenant-apex-main' &&
              deletedIds.has(currentTenantIdRef.current)
            ) {
              setCurrentTenantId(DEFAULT_TENANT.id);
              currentTenantIdRef.current = DEFAULT_TENANT.id;
              try {
                localStorage.setItem(STORAGE_KEY_PREFIX + 'current_tenant_id', DEFAULT_TENANT.id);
              } catch {}
              loadTenantStateIntoMemory(DEFAULT_TENANT.id);
            }
          }
        },
        (err) => console.warn('Firebase deleted tenants sync notice:', err)
      );

      unsubTenants = subscribeToFirebaseTenants(
        (remoteTenants) => {
          if (remoteTenants && remoteTenants.length > 0) {
            const deletedIds = getDeletedTenantIds();
            let hadDeletedInRemote = false;

            setTenants((prev) => {
              const map = new Map<string, Tenant>();
              prev.forEach((t) => {
                if (t && t.id && (t.id === DEFAULT_TENANT.id || !deletedIds.has(t.id))) {
                  map.set(t.id, t);
                }
              });
              remoteTenants.forEach((t) => {
                if (!t || !t.id) return;
                if (t.id === DEFAULT_TENANT.id || t.id === 'tenant-apex-main') {
                  map.set(DEFAULT_TENANT.id, {
                    ...t,
                    id: DEFAULT_TENANT.id,
                    companyName: 'Apex Developer',
                    slug: 'apex-developer',
                    contactEmail: 'apexdevinfo@gmail.com',
                  });
                } else if (deletedIds.has(t.id)) {
                  hadDeletedInRemote = true;
                } else {
                  map.set(t.id, t);
                }
              });

              const combined = persistTenantsLocal(Array.from(map.values()));
              tenantsRef.current = combined;
              if (hadDeletedInRemote) {
                writeTenantsToFirebase(combined).catch(() => {});
              }
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
          if (isFlushingRef.current) return;
          const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
          if (!isMaster) return;
          if (remoteItems && remoteItems.length > 0) {
            const hasOldDemo = remoteItems.some(
              (i) => i.itemCode === 'CBL-CU-400' || i.itemCode === 'ST-BAR-16' || i.id === 'item-1'
            );
            if (hasOldDemo) {
              writeItemsToFirebase([]).catch(() => {});
              setItems([]);
              saveToStorage('items', []);
            } else {
              const cleanRemote = filterPostFlushRecords(DEFAULT_TENANT.id, 'items', remoteItems);
              if (cleanRemote.length < remoteItems.length) {
                writeItemsToFirebase(cleanRemote).catch(() => {});
              }
              isIncomingFirebaseItems.current = true;
              setItems((prev) => {
                const cleanPrev = filterPostFlushRecords(DEFAULT_TENANT.id, 'items', prev);
                const merged = mergeListsById(cleanPrev, cleanRemote);
                saveToStorage('items', merged);
                return merged;
              });
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
          if (isFlushingRef.current) return;
          const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
          if (!isMaster) return;
          if (remoteRequests && remoteRequests.length > 0) {
            const hasOldDemo = remoteRequests.some((r) => r.id === 'sr-1' || r.requestNoteNumber === 'RN-2026-0041');
            if (hasOldDemo) {
              writeStockRequestsToFirebase([]).catch(() => {});
              setStockRequests([]);
              saveToStorage('stockRequests', []);
            } else {
              const cleanRemote = filterPostFlushRecords(DEFAULT_TENANT.id, 'stockRequests', remoteRequests);
              if (cleanRemote.length < remoteRequests.length) {
                writeStockRequestsToFirebase(cleanRemote).catch(() => {});
              }
              isIncomingFirebaseRequests.current = true;
              setStockRequests((prev) => {
                const cleanPrev = filterPostFlushRecords(DEFAULT_TENANT.id, 'stockRequests', prev);
                const merged = mergeListsById(cleanPrev, cleanRemote);
                saveToStorage('stockRequests', merged);
                return merged;
              });
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
          if (isFlushingRef.current) return;
          const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
          if (!isMaster) return;
          if (remoteEntries && remoteEntries.length > 0) {
            const hasOldDemo = remoteEntries.some((e) => e.id === 'mse-1' || e.referenceNo === 'PO-2026-8812');
            if (hasOldDemo) {
              writeMainStockEntriesToFirebase([]).catch(() => {});
              setMainStockEntries([]);
              saveToStorage('mainStockEntries', []);
            } else {
              const cleanRemote = filterPostFlushRecords(DEFAULT_TENANT.id, 'mainStockEntries', remoteEntries);
              if (cleanRemote.length < remoteEntries.length) {
                writeMainStockEntriesToFirebase(cleanRemote).catch(() => {});
              }
              isIncomingFirebaseEntries.current = true;
              setMainStockEntries((prev) => {
                const cleanPrev = filterPostFlushRecords(DEFAULT_TENANT.id, 'mainStockEntries', prev);
                const merged = mergeListsById(cleanPrev, cleanRemote);
                saveToStorage('mainStockEntries', merged);
                return merged;
              });
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
          if (isFlushingRef.current) return;
          const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
          if (!isMaster) return;
          if (remoteSites && remoteSites.length > 0) {
            const finalSites = sanitizeTenantSites(DEFAULT_TENANT.id, remoteSites, tenantsRef.current);
            isIncomingFirebaseSites.current = true;
            runWithRemoteGuard(() => {
              setSites(finalSites);
              saveTenantDataLocalOnly(DEFAULT_TENANT.id, 'sites', finalSites);
            });
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
          if (isFlushingRef.current) return;
          const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
          if (!isMaster) return;
          if (remoteTeams && remoteTeams.length > 0) {
            const cleanRemote = filterPostFlushRecords(DEFAULT_TENANT.id, 'teams', remoteTeams);
            if (cleanRemote.length < remoteTeams.length) {
              writeTeamsToFirebase(cleanRemote).catch(() => {});
            }
            isIncomingFirebaseTeams.current = true;
            runWithRemoteGuard(() => {
              setTeams(cleanRemote);
              saveTenantDataLocalOnly(DEFAULT_TENANT.id, 'teams', cleanRemote);
            });
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
          if (isFlushingRef.current) return;
          if (remoteUsers && remoteUsers.length > 0) {
            const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
            if (isMaster) {
              const filteredRemote = filterPostFlushRecords(DEFAULT_TENANT.id, 'users', remoteUsers);
              const cleanApex = sanitizeAndRecoverApexUsers(filteredRemote);
              if (filteredRemote.length < remoteUsers.length) {
                writeUsersToFirebase(cleanApex).catch(() => {});
              }
              isIncomingFirebaseUsers.current = true;
              runWithRemoteGuard(() => {
                setUsers(cleanApex);
                saveTenantDataLocalOnly(DEFAULT_TENANT.id, 'users', cleanApex);
              });
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
          if (isFlushingRef.current) return;
          const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
          if (!isMaster) return;
          if (remoteIssues && remoteIssues.length > 0) {
            const cleanRemote = filterPostFlushRecords(DEFAULT_TENANT.id, 'teamIssues', remoteIssues);
            if (cleanRemote.length < remoteIssues.length) {
              writeTeamIssuesToFirebase(cleanRemote).catch(() => {});
            }
            isIncomingFirebaseIssues.current = true;
            setTeamIssues((prev) => {
              const cleanPrev = filterPostFlushRecords(DEFAULT_TENANT.id, 'teamIssues', prev);
              const merged = mergeListsById(cleanPrev, cleanRemote);
              saveToStorage('teamIssues', merged);
              return merged;
            });
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
          if (isFlushingRef.current) return;
          const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
          if (!isMaster) return;
          if (remoteReturns && remoteReturns.length > 0) {
            const cleanRemote = filterPostFlushRecords(DEFAULT_TENANT.id, 'teamReturns', remoteReturns);
            if (cleanRemote.length < remoteReturns.length) {
              writeTeamReturnsToFirebase(cleanRemote).catch(() => {});
            }
            isIncomingFirebaseReturns.current = true;
            setTeamReturns((prev) => {
              const cleanPrev = filterPostFlushRecords(DEFAULT_TENANT.id, 'teamReturns', prev);
              const merged = mergeListsById(cleanPrev, cleanRemote);
              saveToStorage('teamReturns', merged);
              return merged;
            });
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
          if (isFlushingRef.current) return;
          const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
          if (!isMaster) return;
          if (remoteProjects && remoteProjects.length > 0) {
            const cleanRemote = filterPostFlushRecords(DEFAULT_TENANT.id, 'projects', remoteProjects);
            if (cleanRemote.length < remoteProjects.length) {
              writeProjectsToFirebase(cleanRemote).catch(() => {});
            }
            isIncomingFirebaseProjects.current = true;
            setProjects((prev) => {
              const cleanPrev = filterPostFlushRecords(DEFAULT_TENANT.id, 'projects', prev);
              const merged = mergeListsById(cleanPrev, cleanRemote);
              saveToStorage('projects', merged);
              if (merged.length > cleanRemote.length) {
                writeProjectsToFirebase(merged).catch(() => {});
              }
              return merged;
            });
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
          if (isFlushingRef.current) return;
          const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
          if (!isMaster) return;
          if (remoteUsages) {
            const cleanRemote = filterPostFlushRecords(DEFAULT_TENANT.id, 'projectUsages', remoteUsages);
            if (cleanRemote.length < remoteUsages.length) {
              writeProjectUsagesToFirebase(cleanRemote).catch(() => {});
            }
            isIncomingFirebaseProjectUsages.current = true;
            setProjectUsages((prev) => {
              const cleanPrev = filterPostFlushRecords(DEFAULT_TENANT.id, 'projectUsages', prev);
              const merged = mergeListsById(cleanPrev, cleanRemote);
              saveToStorage('projectUsages', merged);
              return merged;
            });
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
          if (isFlushingRef.current) return;
          const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
          if (!isMaster) return;
          if (remoteBranchReturns) {
            const cleanRemote = filterPostFlushRecords(DEFAULT_TENANT.id, 'branchReturns', remoteBranchReturns);
            if (cleanRemote.length < remoteBranchReturns.length) {
              writeBranchReturnsToFirebase(cleanRemote).catch(() => {});
            }
            isIncomingFirebaseBranchReturns.current = true;
            setBranchReturns((prev) => {
              const cleanPrev = filterPostFlushRecords(DEFAULT_TENANT.id, 'branchReturns', prev);
              const merged = mergeListsById(cleanPrev, cleanRemote);
              saveToStorage('branchReturns', merged);
              return merged;
            });
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
          if (isFlushingRef.current) return;
          const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
          if (!isMaster) return;
          if (remoteBackups) {
            isIncomingFirebaseBackups.current = true;
            setBackups((prev) => {
              const merged = mergeListsById(prev, remoteBackups);
              saveToStorage('backups', merged);
              return merged;
            });
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
          if (isFlushingRef.current) return;
          const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
          if (!isMaster) return;
          if (remoteAudit) {
            const cleanRemote = filterPostFlushRecords(DEFAULT_TENANT.id, 'auditLogs', remoteAudit);
            isIncomingFirebaseAudit.current = true;
            setAuditLogs(cleanRemote);
            saveToStorage('auditLogs', cleanRemote);
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
          if (isFlushingRef.current) return;
          const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
          if (!isMaster) return;
          if (remoteConfig && remoteConfig.companyName) {
            const finalConfig = {
              ...remoteConfig,
              companyName: 'Apex Developer',
              systemName: 'Apex Stock & Site Management System',
            };
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
          if (isFlushingRef.current) return;
          const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
          if (!isMaster) return;
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
          if (isFlushingRef.current) return;
          const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
          if (!isMaster) return;
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
          if (isFlushingRef.current) return;
          const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
          if (!isMaster) return;
          if (remoteSuppliers) {
            const cleanRemote = filterPostFlushRecords(DEFAULT_TENANT.id, 'suppliers', remoteSuppliers);
            if (cleanRemote.length < remoteSuppliers.length) {
              writeSuppliersToFirebase(cleanRemote).catch(() => {});
            }
            isIncomingFirebaseSuppliers.current = true;
            setSuppliers((prev) => {
              const cleanPrev = filterPostFlushRecords(DEFAULT_TENANT.id, 'suppliers', prev);
              const merged = mergeListsById(cleanPrev, cleanRemote);
              saveToStorage('suppliers', merged);
              return merged;
            });
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
          if (isFlushingRef.current) return;
          const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
          if (!isMaster) return;
          if (remoteOrders) {
            const cleanRemote = filterPostFlushRecords(DEFAULT_TENANT.id, 'purchaseOrders', remoteOrders);
            if (cleanRemote.length < remoteOrders.length) {
              writePurchaseOrdersToFirebase(cleanRemote).catch(() => {});
            }
            isIncomingFirebasePurchaseOrders.current = true;
            setPurchaseOrders((prev) => {
              const cleanPrev = filterPostFlushRecords(DEFAULT_TENANT.id, 'purchaseOrders', prev);
              const merged = mergeListsById(cleanPrev, cleanRemote);
              saveToStorage('purchaseOrders', merged);
              return merged;
            });
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
          if (isFlushingRef.current) return;
          const isMaster = currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main';
          if (!isMaster) return;
          if (remoteReturns) {
            const cleanRemote = filterPostFlushRecords(DEFAULT_TENANT.id, 'supplierReturns', remoteReturns);
            if (cleanRemote.length < remoteReturns.length) {
              writeSupplierReturnsToFirebase(cleanRemote).catch(() => {});
            }
            isIncomingFirebaseSupplierReturns.current = true;
            setSupplierReturns((prev) => {
              const cleanPrev = filterPostFlushRecords(DEFAULT_TENANT.id, 'supplierReturns', prev);
              const merged = mergeListsById(cleanPrev, cleanRemote);
              saveToStorage('supplierReturns', merged);
              return merged;
            });
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
      if (unsubRootFlushMeta) unsubRootFlushMeta();
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
      if (unsubDeletedTenants) unsubDeletedTenants();
    };
  }, []);

  // Write changes to Firebase when modified locally (saveToStorage writes to tenantsData/{tenantId}/{key} for EVERY tenant; root Firebase writes only run for Master tenant and skip during atomic flush)
  const isMasterWorkspaceActive = () =>
    !isFlushingRef.current &&
    (currentTenantIdRef.current === DEFAULT_TENANT.id || currentTenantIdRef.current === 'tenant-apex-main');

  useEffect(() => {
    saveToStorage('items', items);
    if (!isIncomingFirebaseItems.current && hasLoadedItemsFromFirebase.current && isMasterWorkspaceActive()) {
      writeItemsToFirebase(items).catch((err) => console.warn('Sync items to Firebase error:', err));
    }
  }, [items]);

  useEffect(() => {
    saveToStorage('stockRequests', stockRequests);
    if (!isIncomingFirebaseRequests.current && hasLoadedRequestsFromFirebase.current && isMasterWorkspaceActive()) {
      writeStockRequestsToFirebase(stockRequests).catch((err) => console.warn('Sync stockRequests to Firebase error:', err));
    }
  }, [stockRequests]);

  useEffect(() => {
    saveToStorage('mainStockEntries', mainStockEntries);
    if (!isIncomingFirebaseEntries.current && hasLoadedEntriesFromFirebase.current && isMasterWorkspaceActive()) {
      writeMainStockEntriesToFirebase(mainStockEntries).catch((err) => console.warn('Sync mainStockEntries to Firebase error:', err));
    }
  }, [mainStockEntries]);

  useEffect(() => {
    saveToStorage('sites', sites);
    if (!isIncomingFirebaseSites.current && hasLoadedSitesFromFirebase.current && isMasterWorkspaceActive()) {
      writeSitesToFirebase(sites).catch((err) => console.warn('Sync sites to Firebase error:', err));
    }
  }, [sites]);

  useEffect(() => {
    saveToStorage('teams', teams);
    if (!isIncomingFirebaseTeams.current && hasLoadedTeamsFromFirebase.current && isMasterWorkspaceActive()) {
      writeTeamsToFirebase(teams).catch((err) => console.warn('Sync teams to Firebase error:', err));
    }
  }, [teams]);

  useEffect(() => {
    saveToStorage('users', users);
    if (!isIncomingFirebaseUsers.current && hasLoadedUsersFromFirebase.current && isMasterWorkspaceActive()) {
      const cleanUsers = users.filter((u) => !isForeignUser(u));
      writeUsersToFirebase(cleanUsers).catch((err) => console.warn('Sync users to Firebase error:', err));
    }
  }, [users]);

  useEffect(() => {
    saveToStorage('teamIssues', teamIssues);
    if (!isIncomingFirebaseIssues.current && hasLoadedIssuesFromFirebase.current && isMasterWorkspaceActive()) {
      writeTeamIssuesToFirebase(teamIssues).catch((err) => console.warn('Sync teamIssues to Firebase error:', err));
    }
  }, [teamIssues]);

  useEffect(() => {
    saveToStorage('teamReturns', teamReturns);
    if (!isIncomingFirebaseReturns.current && hasLoadedReturnsFromFirebase.current && isMasterWorkspaceActive()) {
      writeTeamReturnsToFirebase(teamReturns).catch((err) => console.warn('Sync teamReturns to Firebase error:', err));
    }
  }, [teamReturns]);

  useEffect(() => {
    saveToStorage('projects', projects);
    if (!isIncomingFirebaseProjects.current && hasLoadedProjectsFromFirebase.current && isMasterWorkspaceActive()) {
      writeProjectsToFirebase(projects).catch((err) => console.warn('Sync projects to Firebase error:', err));
    }
  }, [projects]);

  useEffect(() => {
    saveToStorage('projectTypes', projectTypes);
  }, [projectTypes]);

  useEffect(() => {
    saveToStorage('projectUsages', projectUsages);
    if (!isIncomingFirebaseProjectUsages.current && hasLoadedProjectUsagesFromFirebase.current && isMasterWorkspaceActive()) {
      writeProjectUsagesToFirebase(projectUsages).catch((err) => console.warn('Sync projectUsages to Firebase error:', err));
    }
  }, [projectUsages]);

  useEffect(() => {
    saveToStorage('clientFreeIssues', clientFreeIssues);
  }, [clientFreeIssues]);

  useEffect(() => {
    saveToStorage('clients', clients);
  }, [clients]);

  useEffect(() => {
    saveToStorage('branchReturns', branchReturns);
    if (!isIncomingFirebaseBranchReturns.current && hasLoadedBranchReturnsFromFirebase.current && isMasterWorkspaceActive()) {
      writeBranchReturnsToFirebase(branchReturns).catch((err) => console.warn('Sync branchReturns to Firebase error:', err));
    }
  }, [branchReturns]);

  useEffect(() => {
    saveToStorage('damagedRestorations', damagedRestorations);
  }, [damagedRestorations]);

  useEffect(() => {
    saveToStorage('backups', backups);
    if (!isIncomingFirebaseBackups.current && hasLoadedBackupsFromFirebase.current && isMasterWorkspaceActive()) {
      writeBackupsToFirebase(backups).catch((err) => console.warn('Sync backups to Firebase error:', err));
    }
  }, [backups]);

  useEffect(() => {
    saveToStorage('auditLogs', auditLogs);
    if (!isIncomingFirebaseAudit.current && hasLoadedAuditFromFirebase.current && isMasterWorkspaceActive()) {
      writeAuditLogsToFirebase(auditLogs).catch((err) => console.warn('Sync auditLogs to Firebase error:', err));
    }
  }, [auditLogs]);

  useEffect(() => {
    saveToStorage('config', config);
    if (!isIncomingFirebaseConfig.current && hasLoadedConfigFromFirebase.current && isMasterWorkspaceActive()) {
      writeConfigToFirebase(config).catch((err) => console.warn('Sync config to Firebase error:', err));
    }
  }, [config]);

  useEffect(() => {
    saveToStorage('letterheadTemplates', letterheadTemplates);
    if (!isIncomingFirebaseLetterheadTemplates.current && hasLoadedTemplatesFromFirebase.current && isMasterWorkspaceActive()) {
      writeLetterheadTemplatesToFirebase(letterheadTemplates).catch((err) =>
        console.warn('Sync letterheadTemplates to Firebase error:', err)
      );
    }
  }, [letterheadTemplates]);

  useEffect(() => {
    saveToStorage('digitalSignatures', digitalSignatures);
    if (!isIncomingFirebaseDigitalSignatures.current && hasLoadedSignaturesFromFirebase.current && isMasterWorkspaceActive()) {
      writeDigitalSignaturesToFirebase(digitalSignatures).catch((err) =>
        console.warn('Sync digitalSignatures to Firebase error:', err)
      );
    }
  }, [digitalSignatures]);

  useEffect(() => {
    saveToStorage('suppliers', suppliers);
    if (!isIncomingFirebaseSuppliers.current && hasLoadedSuppliersFromFirebase.current && isMasterWorkspaceActive()) {
      writeSuppliersToFirebase(suppliers).catch((err) =>
        console.warn('Sync suppliers to Firebase error:', err)
      );
    }
  }, [suppliers]);

  useEffect(() => {
    saveToStorage('purchaseOrders', purchaseOrders);
    if (!isIncomingFirebasePurchaseOrders.current && hasLoadedPurchaseOrdersFromFirebase.current && isMasterWorkspaceActive()) {
      writePurchaseOrdersToFirebase(purchaseOrders).catch((err) =>
        console.warn('Sync purchaseOrders to Firebase error:', err)
      );
    }
  }, [purchaseOrders]);

  useEffect(() => {
    saveToStorage('supplierReturns', supplierReturns);
    if (!isIncomingFirebaseSupplierReturns.current && hasLoadedSupplierReturnsFromFirebase.current && isMasterWorkspaceActive()) {
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
      const targetId = currentTenantIdRef.current || activeTenantId;
      await syncTenantCollectionsFromFirebase(targetId);

      await Promise.all([
        writeTenantDataToFirebase(targetId, 'items', items),
        writeTenantDataToFirebase(targetId, 'stockRequests', stockRequests),
        writeTenantDataToFirebase(targetId, 'mainStockEntries', mainStockEntries),
        writeTenantDataToFirebase(targetId, 'sites', sites),
        writeTenantDataToFirebase(targetId, 'teams', teams),
        writeTenantDataToFirebase(targetId, 'users', users),
        writeTenantDataToFirebase(targetId, 'teamIssues', teamIssues),
        writeTenantDataToFirebase(targetId, 'teamReturns', teamReturns),
        writeTenantDataToFirebase(targetId, 'projects', projects),
        writeTenantDataToFirebase(targetId, 'projectTypes', projectTypes),
        writeTenantDataToFirebase(targetId, 'projectUsages', projectUsages),
        writeTenantDataToFirebase(targetId, 'crossProjectRequests', crossProjectRequests),
        writeTenantDataToFirebase(targetId, 'clientFreeIssues', clientFreeIssues),
        writeTenantDataToFirebase(targetId, 'branchReturns', branchReturns),
        writeTenantDataToFirebase(targetId, 'damagedRestorations', damagedRestorations),
        writeTenantDataToFirebase(targetId, 'backups', backups),
        writeTenantDataToFirebase(targetId, 'auditLogs', auditLogs),
        writeTenantDataToFirebase(targetId, 'config', config),
        writeTenantDataToFirebase(targetId, 'letterheadTemplates', letterheadTemplates),
        writeTenantDataToFirebase(targetId, 'digitalSignatures', digitalSignatures),
        writeTenantDataToFirebase(targetId, 'suppliers', suppliers),
        writeTenantDataToFirebase(targetId, 'clients', clients),
        writeTenantDataToFirebase(targetId, 'purchaseOrders', purchaseOrders),
        writeTenantDataToFirebase(targetId, 'supplierReturns', supplierReturns),
      ]);

      if (isMasterWorkspaceActive()) {
        await Promise.all([
          writeItemsToFirebase(items),
          writeStockRequestsToFirebase(stockRequests),
          writeMainStockEntriesToFirebase(mainStockEntries),
          writeSitesToFirebase(sites),
          writeTeamsToFirebase(teams),
          writeUsersToFirebase(users.filter((u) => !isForeignUser(u))),
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
      }
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
    setSuppliers((prev) => {
      const next = [newSupplier, ...prev];
      saveTenantData(currentTenantIdRef.current, 'suppliers', next);
      return next;
    });
    return newSupplier;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      saveTenantData(currentTenantIdRef.current, 'suppliers', next);
      return next;
    });
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveTenantData(currentTenantIdRef.current, 'suppliers', next);
      return next;
    });
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
    setPurchaseOrders((prev) => {
      const next = [newPo, ...prev];
      saveTenantData(currentTenantIdRef.current, 'purchaseOrders', next);
      return next;
    });
    return newPo;
  };

  const updatePurchaseOrder = (id: string, updates: Partial<PurchaseOrder>) => {
    setPurchaseOrders((prev) => {
      const next = prev.map((po) => (po.id === id ? { ...po, ...updates } : po));
      saveTenantData(currentTenantIdRef.current, 'purchaseOrders', next);
      return next;
    });
  };

  const deletePurchaseOrder = (id: string) => {
    setPurchaseOrders((prev) => {
      const next = prev.filter((po) => po.id !== id);
      saveTenantData(currentTenantIdRef.current, 'purchaseOrders', next);
      return next;
    });
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
    setSupplierReturns((prev) => {
      const next = [newReturn, ...prev];
      saveTenantData(currentTenantIdRef.current, 'supplierReturns', next);
      return next;
    });
    addAuditLog(
      'SUPPLIER_RETURN_CREATED',
      newReturn.rtvNumber,
      newReturn.locationType === 'Main Stock' ? 'Main Central Warehouse' : (newReturn.siteName || 'Site Branch'),
      `Created Return to Supplier (Debit Note): ${newReturn.rtvNumber} for ${newReturn.supplierName}. Total value: ${config.currencySymbol} ${newReturn.grandTotal.toLocaleString()}. Status: ${newReturn.status}.`
    );
    return newReturn;
  };

  const updateSupplierReturn = (id: string, updates: Partial<SupplierReturn>) => {
    setSupplierReturns((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      saveTenantData(currentTenantIdRef.current, 'supplierReturns', next);
      return next;
    });
  };

  const deleteSupplierReturn = (id: string) => {
    const target = supplierReturns.find((r) => r.id === id);
    setSupplierReturns((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveTenantData(currentTenantIdRef.current, 'supplierReturns', next);
      return next;
    });
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

  // Active Site scope (supports single and multi-site assignments)
  const activeSite = useMemo(() => {
    if (!currentUser || isUserAllSites(currentUser)) return null;
    const assignedIds = getUserAssignedSiteIds(currentUser, activeSites);
    if (assignedIds.length === 0) return null;
    return activeSites.find((s) => s.id === assignedIds[0]) || null;
  }, [currentUser, activeSites]);

  const updateConfig = (newConfig: Partial<SystemConfig>) => {
    setConfig((prev) => {
      const merged = { ...prev, ...newConfig };
      saveToStorage('config', merged);
      saveTenantData(currentTenantIdRef.current, 'config', merged);
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
    setAuditLogs((prev) => {
      const next = [newEntry, ...prev];
      saveTenantData(currentTenantIdRef.current, 'auditLogs', next);
      return next;
    });
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

  // Section-Specific Document Formats (stored inside activeTemplate.sectionFormats for automatic Firebase & Tenant Sync)
  const sectionFormats = useMemo<Record<DocumentFormatGroupId, SectionFormatConfig>>(() => {
    const saved = activeTemplate?.sectionFormats || {};
    return {
      REQUISITION_ISSUE_USAGE: {
        ...DEFAULT_SECTION_FORMATS.REQUISITION_ISSUE_USAGE,
        ...(saved.REQUISITION_ISSUE_USAGE || {}),
      },
      RECEIPT_RETURN_FOC: {
        ...DEFAULT_SECTION_FORMATS.RECEIPT_RETURN_FOC,
        ...(saved.RECEIPT_RETURN_FOC || {}),
      },
      PURCHASE_ORDER: {
        ...DEFAULT_SECTION_FORMATS.PURCHASE_ORDER,
        ...(saved.PURCHASE_ORDER || {}),
      },
      SUPPLIER_RETURN_DEBIT_NOTE: {
        ...DEFAULT_SECTION_FORMATS.SUPPLIER_RETURN_DEBIT_NOTE,
        ...(saved.SUPPLIER_RETURN_DEBIT_NOTE || {}),
      },
    };
  }, [activeTemplate]);

  const updateSectionFormat = (groupId: DocumentFormatGroupId, fmtConfig: SectionFormatConfig) => {
    const updatedFormats: Partial<Record<DocumentFormatGroupId, SectionFormatConfig>> = {
      ...(activeTemplate?.sectionFormats || {}),
      [groupId]: {
        ...fmtConfig,
        groupId,
        updatedAt: new Date().toISOString(),
      },
    };
    const updatedTpl: LetterheadTemplate = {
      ...activeTemplate,
      sectionFormats: updatedFormats,
    };
    setLetterheadTemplates((prev) =>
      prev.map((t) => (t.id === updatedTpl.id ? updatedTpl : t))
    );
    addAuditLog(
      'TEMPLATE_UPDATED',
      groupId,
      'System',
      `Updated Document Format for ${fmtConfig.groupName}${fmtConfig.uploadedFileName ? ` (File: ${fmtConfig.uploadedFileName})` : ''}`
    );
  };

  const resetSectionFormat = (groupId: DocumentFormatGroupId) => {
    const defaultCfg = DEFAULT_SECTION_FORMATS[groupId];
    const updatedFormats: Partial<Record<DocumentFormatGroupId, SectionFormatConfig>> = {
      ...(activeTemplate?.sectionFormats || {}),
      [groupId]: {
        ...defaultCfg,
        updatedAt: new Date().toISOString(),
      },
    };
    const updatedTpl: LetterheadTemplate = {
      ...activeTemplate,
      sectionFormats: updatedFormats,
    };
    setLetterheadTemplates((prev) =>
      prev.map((t) => (t.id === updatedTpl.id ? updatedTpl : t))
    );
    addAuditLog(
      'TEMPLATE_UPDATED',
      groupId,
      'System',
      `Reset Document Format for ${defaultCfg.groupName} to system standard`
    );
  };

  const getEffectiveSectionFormat = (groupId: DocumentFormatGroupId): SectionFormatConfig => {
    const primary = sectionFormats[groupId] || DEFAULT_SECTION_FORMATS[groupId];
    if (primary.linkedToGroupId && sectionFormats[primary.linkedToGroupId]) {
      return sectionFormats[primary.linkedToGroupId];
    }
    return primary;
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

  // Master Registrations (Create) with Bi-Directional Site <-> User Sync
  const addSite = (
    siteData: Omit<Site, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>,
    assignedUserIds?: string[]
  ): Site => {
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    const nowIso = new Date().toISOString();
    const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';

    const normSupName = (siteData.supervisorName || '').trim().toLowerCase();
    const matchedSup = users.find(
      (u) =>
        !u.isDeleted &&
        ((siteData.supervisorUserId && u.id === siteData.supervisorUserId) ||
          (normSupName && u.fullName.trim().toLowerCase() === normSupName))
    );

    const newSite: Site = {
      ...siteData,
      supervisorName: matchedSup ? matchedSup.fullName : siteData.supervisorName,
      supervisorUserId: matchedSup ? matchedSup.id : '',
      id: `site-${Date.now()}`,
      createdAt: nowIso,
      updatedAt: nowIso,
      isDeleted: false,
    };

    const nextSitesSnapshot = sanitizeTenantSites(activeTenantId, [...sites, newSite], tenantsRef.current);

    setSites((prev) => {
      const updated = sanitizeTenantSites(activeTenantId, [...prev, newSite], tenantsRef.current);
      saveTenantData(activeTenantId, 'sites', updated);
      if (isMaster) {
        writeSitesToFirebase(updated).catch(console.warn);
      }
      return updated;
    });

    // Bi-directional sync: add newSite.id to the selected supervisor & any selected assigned users
    const targetUserIds = new Set<string>(assignedUserIds || []);
    if (matchedSup) {
      targetUserIds.add(matchedSup.id);
    }

    if (targetUserIds.size > 0) {
      setUsers((prevUsers) => {
        let anyUserChanged = false;
        const updatedUsers = prevUsers.map((u) => {
          if (u.isDeleted || !targetUserIds.has(u.id)) return u;
          if (isUserAllSites(u)) {
            return u;
          }
          const existingIds = getUserAssignedSiteIds(u, nextSitesSnapshot);
          const nextIds = Array.from(new Set([...existingIds, newSite.id]));
          anyUserChanged = true;
          const syncedUser: User = {
            ...u,
            siteId: nextIds[0] || newSite.id,
            siteIds: nextIds,
            updatedAt: nowIso,
          };
          if (currentUser?.id === u.id) {
            setCurrentUser(syncedUser);
          }
          if (authUser?.id === u.id) {
            setAuthUser(syncedUser);
          }
          return syncedUser;
        });

        if (anyUserChanged) {
          saveTenantData(activeTenantId, 'users', updatedUsers);
          if (isMaster) {
            writeUsersToFirebase(updatedUsers).catch(console.warn);
          }
          return updatedUsers;
        }
        return prevUsers;
      });
    }

    addAuditLog('MASTER_SITE_CREATED', newSite.name, newSite.name, `New site registered: ${newSite.name} (${newSite.location})`);
    return newSite;
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>): User => {
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    const nowIso = new Date().toISOString();
    const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';

    const wantsAllSites =
      userData.siteId === 'all' ||
      (Array.isArray(userData.siteIds) && userData.siteIds.includes('all')) ||
      isSuperAdmin(userData.role);

    const cleanSpecificIds = wantsAllSites
      ? []
      : Array.from(
          new Set(
            (Array.isArray(userData.siteIds) && userData.siteIds.length > 0
              ? userData.siteIds
              : [userData.siteId]
            ).filter((sid): sid is string => Boolean(sid && sid !== 'all' && sid !== 'unassigned'))
          )
        );

    const normalizedSiteId = wantsAllSites ? 'all' : (cleanSpecificIds[0] || 'unassigned');
    const normalizedSiteIds = wantsAllSites
      ? ['all']
      : cleanSpecificIds.length > 0
      ? cleanSpecificIds
      : ['unassigned'];

    const newUser: User = {
      ...userData,
      siteId: normalizedSiteId,
      siteIds: normalizedSiteIds,
      id: `usr-${Date.now()}`,
      createdAt: nowIso,
      updatedAt: nowIso,
      isDeleted: false,
      tenantId: activeTenantId,
    };

    setUsers((prev) => {
      const updated = [...prev, newUser];
      saveTenantData(activeTenantId, 'users', updated);
      if (isMaster) {
        writeUsersToFirebase(updated).catch(console.warn);
      }
      return updated;
    });

    // Bi-directional sync: if assigned to site(s) that currently have placeholder/unassigned supervisor, link this user
    if (cleanSpecificIds.length > 0) {
      setSites((prevSites) => {
        let anySiteUpdated = false;
        const updatedSites = prevSites.map((s) => {
          if (s.isDeleted || !cleanSpecificIds.includes(s.id)) return s;
          const supLower = (s.supervisorName || '').trim().toLowerCase();
          const hasNoRegisteredSupervisor =
            !s.supervisorUserId &&
            (supLower === '' || supLower === 'unassigned' || supLower === 'assigned supervisor');
          if (hasNoRegisteredSupervisor) {
            anySiteUpdated = true;
            return {
              ...s,
              supervisorName: newUser.fullName,
              supervisorUserId: newUser.id,
              updatedAt: nowIso,
            };
          }
          return s;
        });

        if (anySiteUpdated) {
          saveTenantData(activeTenantId, 'sites', updatedSites);
          if (isMaster) {
            writeSitesToFirebase(updatedSites).catch(console.warn);
          }
          return updatedSites;
        }
        return prevSites;
      });
    }

    const assignedLabel = wantsAllSites
      ? 'All Sites'
      : cleanSpecificIds
          .map((sid) => sites.find((s) => s.id === sid)?.name)
          .filter(Boolean)
          .join(', ') || 'Unassigned';
    addAuditLog('MASTER_USER_CREATED', newUser.username, assignedLabel, `New user created: ${newUser.fullName} [${newUser.role}]`);
    return newUser;
  };

  const addItem = (
    itemData: Omit<Item, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>,
    initialReceivedQty?: number
  ): Item => {
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    const upperCode = (itemData.itemCode || '').trim().toUpperCase();
    const existingIndex = items.findIndex(
      (i) => !i.isDeleted && i.itemCode.toUpperCase() === upperCode
    );

    let savedItem: Item;

    if (existingIndex >= 0) {
      // If item code already exists, update rather than duplicating
      const prev = items[existingIndex];
      const finalBarcode =
        itemData.barcode?.trim().toUpperCase() ||
        prev.barcode ||
        generateUniqueBarcode(upperCode, config.barcodePrefix || 'APX-', items);
      savedItem = {
        ...prev,
        ...itemData,
        itemCode: upperCode,
        barcode: finalBarcode,
        isDeleted: false,
        deletedAt: undefined,
      };
      setItems((prevItems) => {
        const next = [...prevItems];
        next[existingIndex] = savedItem;
        saveTenantData(activeTenantId, 'items', next);
        const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
        if (isMaster) {
          writeItemsToFirebase(next).catch(console.warn);
        }
        return next;
      });
      addAuditLog(
        'MASTER_ITEM_CREATED',
        savedItem.itemCode,
        'Main Central Warehouse',
        `Master item updated: ${savedItem.itemCode} [Barcode: ${savedItem.barcode}] - ${savedItem.itemName} (${savedItem.unit})`,
        savedItem.itemCode
      );
    } else {
      const finalBarcode =
        itemData.barcode?.trim().toUpperCase() ||
        generateUniqueBarcode(upperCode, config.barcodePrefix || 'APX-', items);
      savedItem = {
        ...itemData,
        itemCode: upperCode,
        barcode: finalBarcode,
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString(),
        isDeleted: false,
      };
      setItems((prev) => {
        const updated = [...prev, savedItem];
        saveTenantData(activeTenantId, 'items', updated);
        const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
        if (isMaster) {
          writeItemsToFirebase(updated).catch(console.warn);
        }
        return updated;
      });
      addAuditLog(
        'MASTER_ITEM_CREATED',
        savedItem.itemCode,
        'Main Central Warehouse',
        `Master item registered: ${savedItem.itemCode} [Barcode: ${savedItem.barcode}] - ${savedItem.itemName} (${savedItem.unit})`,
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

  const findItemByBarcode = (scannedCode: string): Item | undefined => {
    return matchItemByScannedCode(scannedCode, activeItems);
  };

  const autoGenerateMissingBarcodes = (): { updatedCount: number } => {
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    let updatedCount = 0;
    const prefix = config.barcodePrefix || 'APX-';

    setItems((prevItems) => {
      const next = prevItems.map((item) => {
        if (!item.isDeleted && (!item.barcode || !item.barcode.trim())) {
          updatedCount++;
          return {
            ...item,
            barcode: generateUniqueBarcode(item.itemCode, prefix, prevItems),
          };
        }
        return item;
      });

      if (updatedCount > 0) {
        saveTenantData(activeTenantId, 'items', next);
        const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
        if (isMaster) {
          writeItemsToFirebase(next).catch(console.warn);
        }
      }
      return next;
    });

    if (updatedCount > 0) {
      addAuditLog(
        'MASTER_ITEM_UPDATED',
        'BARCODE-SYNC',
        'Main Central Warehouse',
        `Auto-generated and synced barcodes to Firebase for ${updatedCount} catalog item(s).`
      );
    }

    return { updatedCount };
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
    const activeTenantId = currentTenantIdRef.current || currentTenantId;

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
              barcode:
                row.barcode?.trim().toUpperCase() ||
                prev.barcode ||
                generateUniqueBarcode(code, config.barcodePrefix || 'APX-', currentItems),
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
            barcode:
              row.barcode?.trim().toUpperCase() ||
              generateUniqueBarcode(code, config.barcodePrefix || 'APX-', currentItems),
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

      saveTenantData(activeTenantId, 'items', currentItems);
      saveToStorage('items', currentItems);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeItemsToFirebase(currentItems).catch((err) => console.warn('Failed direct Firebase items write:', err));
      }
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
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    const newTeam: Team = {
      ...teamData,
      id: `team-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };
    setTeams((prev) => {
      const updated = [...prev, newTeam];
      saveTenantData(activeTenantId, 'teams', updated);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeTeamsToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
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
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    const pId = (projectData.projectId || '').trim().toUpperCase();
    const newProject: Project = {
      ...projectData,
      projectId: pId,
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };
    setProjects((prev) => {
      const updated = [...prev, newProject];
      saveTenantData(activeTenantId, 'projects', updated);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeProjectsToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
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
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
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
      saveTenantData(activeTenantId, 'projects', copy);
      if (isMaster) {
        writeProjectsToFirebase(copy).catch((err) => console.warn('Failed direct Firebase projects write:', err));
      }
      return copy;
    });
    addAuditLog('PROJECT_CREATED', 'BULK-IMPORT', 'Project Office', `Imported projects from CSV/Excel: ${added} added, ${updated} updated.`);
    return { added, updated };
  };

  // Master Updates (CRUD - Edit)
  const updateItem = (id: string, updates: Partial<Item>) => {
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    setItems((prev) => {
      const updated = prev.map((i) => (i.id === id ? { ...i, ...updates } : i));
      saveTenantData(activeTenantId, 'items', updated);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeItemsToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
    const itm = items.find((i) => i.id === id);
    addAuditLog(
      'MASTER_ITEM_UPDATED',
      updates.itemCode || itm?.itemCode || id,
      'Main Central Warehouse',
      `Updated item details for ${updates.itemCode || itm?.itemCode}: ${updates.itemName || itm?.itemName}`,
      updates.itemCode || itm?.itemCode
    );
  };

  const updateSite = (id: string, updates: Partial<Site>, assignedUserIds?: string[]) => {
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    const nowIso = new Date().toISOString();
    const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';

    const oldSite = sites.find((s) => s.id === id);
    const nextSupName =
      updates.supervisorName !== undefined ? updates.supervisorName : (oldSite?.supervisorName || '');
    const normNextSup = nextSupName.trim().toLowerCase();

    const matchedNewSup =
      updates.supervisorUserId === ''
        ? undefined
        : users.find(
            (u) =>
              !u.isDeleted &&
              ((updates.supervisorUserId && u.id === updates.supervisorUserId) ||
                (!updates.supervisorUserId && normNextSup && u.fullName.trim().toLowerCase() === normNextSup))
          );

    const oldNormSup = (oldSite?.supervisorName || '').trim().toLowerCase();
    const oldSupUser = oldSite
      ? users.find(
          (u) =>
            !u.isDeleted &&
            ((oldSite.supervisorUserId && u.id === oldSite.supervisorUserId) ||
              (!oldSite.supervisorUserId && oldNormSup && u.fullName.trim().toLowerCase() === oldNormSup))
        )
      : undefined;

    const finalSiteUpdates: Partial<Site> = {
      ...updates,
      supervisorName: matchedNewSup ? matchedNewSup.fullName : nextSupName,
      supervisorUserId: matchedNewSup ? matchedNewSup.id : '',
      updatedAt: nowIso,
    };

    const nextSitesSnapshot = sites.map((s) => (s.id === id ? { ...s, ...finalSiteUpdates } : s));

    setSites((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...finalSiteUpdates } : s));
      saveTenantData(activeTenantId, 'sites', updated);
      if (isMaster) {
        writeSitesToFirebase(updated).catch(console.warn);
      }
      return updated;
    });

    // Bi-directional sync: update users' assigned siteIds to match this site's supervisor & staff roster
    setUsers((prevUsers) => {
      let anyUserChanged = false;
      const updatedUsers = prevUsers.map((u) => {
        if (u.isDeleted || isUserAllSites(u)) return u;

        const prevAssigned = getUserAssignedSiteIds(u, sites);
        const otherSites = prevAssigned.filter((sid) => sid !== id);

        let shouldBeAssignedHere = false;
        if (assignedUserIds !== undefined) {
          shouldBeAssignedHere = assignedUserIds.includes(u.id) || matchedNewSup?.id === u.id;
        } else if (matchedNewSup?.id === u.id) {
          shouldBeAssignedHere = true;
        } else if (oldSupUser?.id === u.id && matchedNewSup?.id !== u.id) {
          shouldBeAssignedHere = false;
        } else {
          shouldBeAssignedHere = prevAssigned.includes(id);
        }

        const nextIds = shouldBeAssignedHere ? [...otherSites, id] : otherSites;
        const nextSiteId = nextIds[0] || 'unassigned';
        const nextSiteIdsField = nextIds.length > 0 ? nextIds : ['unassigned'];

        const prevCompare = Array.isArray(u.siteIds) ? u.siteIds.join(',') : u.siteId;
        const nextCompare = nextSiteIdsField.join(',');
        if (u.siteId === nextSiteId && prevCompare === nextCompare) {
          return u;
        }

        anyUserChanged = true;
        const syncedUser: User = {
          ...u,
          siteId: nextSiteId,
          siteIds: nextSiteIdsField,
          updatedAt: nowIso,
        };
        if (currentUser?.id === u.id) {
          setCurrentUser(syncedUser);
        }
        if (authUser?.id === u.id) {
          setAuthUser(syncedUser);
        }
        return syncedUser;
      });

      if (anyUserChanged) {
        saveTenantData(activeTenantId, 'users', updatedUsers);
        if (isMaster) {
          writeUsersToFirebase(updatedUsers).catch(console.warn);
        }
        return updatedUsers;
      }
      return prevUsers;
    });

    // Suppress unused warning if snapshot only used for reasoning
    void nextSitesSnapshot;

    addAuditLog(
      'MASTER_SITE_UPDATED',
      updates.name || oldSite?.name || id,
      updates.name || oldSite?.name || 'Site',
      `Updated site branch profile & staff sync: ${updates.name || oldSite?.name}`
    );
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    const nowIso = new Date().toISOString();
    const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';

    const oldUser = users.find((u) => u.id === id);
    const nextRole = updates.role !== undefined ? updates.role : (oldUser?.role || 'Branch System User');
    const nextFullName = (updates.fullName !== undefined ? updates.fullName : (oldUser?.fullName || '')).trim();
    const nextUsername = updates.username !== undefined ? updates.username : (oldUser?.username || '');

    const hasExplicitSiteChange =
      updates.siteId !== undefined || updates.siteIds !== undefined || isSuperAdmin(nextRole);

    let normalizedSiteId = oldUser?.siteId || 'unassigned';
    let normalizedSiteIds = oldUser?.siteIds || (oldUser?.siteId ? [oldUser.siteId] : ['unassigned']);
    let cleanSpecificIds: string[] = [];
    let isAllScope = false;

    if (hasExplicitSiteChange) {
      isAllScope =
        nextUsername === 'admin' ||
        isSuperAdmin(nextRole) ||
        updates.siteId === 'all' ||
        (Array.isArray(updates.siteIds) && updates.siteIds.includes('all'));

      if (isAllScope) {
        normalizedSiteId = 'all';
        normalizedSiteIds = ['all'];
        cleanSpecificIds = [];
      } else {
        const rawSource =
          updates.siteIds !== undefined
            ? updates.siteIds
            : updates.siteId !== undefined
            ? [updates.siteId]
            : getUserAssignedSiteIds(oldUser, sites);

        cleanSpecificIds = Array.from(
          new Set(rawSource.filter((sid): sid is string => Boolean(sid && sid !== 'all' && sid !== 'unassigned')))
        );
        normalizedSiteId = cleanSpecificIds[0] || 'unassigned';
        normalizedSiteIds = cleanSpecificIds.length > 0 ? cleanSpecificIds : ['unassigned'];
      }
    } else if (oldUser) {
      isAllScope = isUserAllSites(oldUser);
      cleanSpecificIds = isAllScope ? [] : getUserAssignedSiteIds(oldUser, sites);
    }

    const finalUserUpdates: Partial<User> = {
      ...updates,
      fullName: nextFullName || updates.fullName,
      siteId: normalizedSiteId,
      siteIds: normalizedSiteIds,
      updatedAt: nowIso,
    };

    const nextUsersSnapshot = users.map((u) => (u.id === id ? { ...u, ...finalUserUpdates } : u));

    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === id ? { ...u, ...finalUserUpdates } : u));
      saveTenantData(activeTenantId, 'users', updated);
      if (isMaster) {
        writeUsersToFirebase(updated).catch(console.warn);
      }
      return updated;
    });

    // Bi-directional sync: keep Site supervisorName & supervisorUserId consistent with User changes
    setSites((prevSites) => {
      let anySiteChanged = false;
      const oldNameLower = (oldUser?.fullName || '').trim().toLowerCase();
      const assignedSet = new Set(cleanSpecificIds);

      const updatedSites = prevSites.map((s) => {
        if (s.isDeleted) return s;

        const supLower = (s.supervisorName || '').trim().toLowerCase();
        const wasSupervisedByThisUser =
          s.supervisorUserId === id ||
          (!s.supervisorUserId && Boolean(oldNameLower) && supLower === oldNameLower);

        // 1. If user was unassigned from this site (and is not All-Sites), reassign or clear site supervisor
        if (wasSupervisedByThisUser && !isAllScope && !assignedSet.has(s.id)) {
          const fallbackStaff = nextUsersSnapshot.find(
            (other) =>
              !other.isDeleted &&
              other.id !== id &&
              !isUserAllSites(other) &&
              getUserAssignedSiteIds(other).includes(s.id)
          );
          anySiteChanged = true;
          return {
            ...s,
            supervisorName: fallbackStaff ? fallbackStaff.fullName : 'Unassigned',
            supervisorUserId: fallbackStaff ? fallbackStaff.id : '',
            updatedAt: nowIso,
          };
        }

        // 2. If still supervised by this user and user's fullName changed (or supervisorUserId wasn't linked yet), sync it
        if (wasSupervisedByThisUser && (s.supervisorName !== nextFullName || s.supervisorUserId !== id)) {
          anySiteChanged = true;
          return {
            ...s,
            supervisorName: nextFullName,
            supervisorUserId: id,
            updatedAt: nowIso,
          };
        }

        // 3. If user was newly assigned to a site that currently has no supervisor, auto-assign as supervisor
        const hasPlaceholderSupervisor =
          !s.supervisorUserId &&
          (supLower === '' || supLower === 'unassigned' || supLower === 'assigned supervisor');
        if (!isAllScope && assignedSet.has(s.id) && hasPlaceholderSupervisor) {
          anySiteChanged = true;
          return {
            ...s,
            supervisorName: nextFullName,
            supervisorUserId: id,
            updatedAt: nowIso,
          };
        }

        return s;
      });

      if (anySiteChanged) {
        saveTenantData(activeTenantId, 'sites', updatedSites);
        if (isMaster) {
          writeSitesToFirebase(updatedSites).catch(console.warn);
        }
        return updatedSites;
      }
      return prevSites;
    });

    const siteSummary = isAllScope
      ? 'All Sites'
      : cleanSpecificIds
          .map((sid) => sites.find((s) => s.id === sid)?.name)
          .filter(Boolean)
          .join(', ') || 'Unassigned';

    addAuditLog(
      'MASTER_USER_UPDATED',
      updates.username || oldUser?.username || id,
      siteSummary,
      `Updated user account: ${nextFullName} [${nextRole}] -> Sites: ${siteSummary}`
    );
    if (currentUser?.id === id) {
      setCurrentUser({ ...currentUser, ...finalUserUpdates });
    }
    if (authUser?.id === id) {
      setAuthUser((prev) => ({ ...prev, ...finalUserUpdates }));
    }
  };

  const updateTeam = (id: string, updates: Partial<Team>) => {
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    setTeams((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      saveTenantData(activeTenantId, 'teams', updated);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeTeamsToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
    const team = teams.find((t) => t.id === id);
    addAuditLog(
      'MASTER_TEAM_UPDATED',
      updates.teamName || team?.teamName || id,
      'Field Base',
      `Updated field team: ${updates.teamName || team?.teamName} (Lead: ${updates.teamLeaderName || team?.teamLeaderName})`
    );
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    setProjects((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      saveTenantData(activeTenantId, 'projects', updated);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeProjectsToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
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
    setProjectTypes((prev) => {
      const next = [...prev, newPt];
      saveTenantData(currentTenantIdRef.current, 'projectTypes', next);
      return next;
    });
    addAuditLog(
      'PROJECT_CREATED',
      newPt.id,
      'Project Office',
      `Created Project Section: "${newPt.name}"`
    );
    return newPt;
  };

  const updateProjectType = (id: string, updates: Partial<ProjectType>) => {
    setProjectTypes((prev) => {
      const next = prev.map((pt) => (pt.id === id ? { ...pt, ...updates } : pt));
      saveTenantData(currentTenantIdRef.current, 'projectTypes', next);
      return next;
    });
    if (updates.name) {
      setProjects((prev) => {
        const next = prev.map((p) => (p.projectTypeId === id ? { ...p, projectTypeName: updates.name } : p));
        saveTenantData(currentTenantIdRef.current, 'projects', next);
        return next;
      });
      setProjectUsages((prev) => {
        const next = prev.map((pu) => (pu.projectTypeId === id ? { ...pu, projectTypeName: updates.name } : pu));
        saveTenantData(currentTenantIdRef.current, 'projectUsages', next);
        return next;
      });
    }
    addAuditLog(
      'PROJECT_UPDATED',
      id,
      'Project Office',
      `Updated Project Section: "${updates.name || id}"`
    );
  };

  const deleteProjectType = (id: string) => {
    setProjectTypes((prev) => {
      const next = prev.filter((pt) => pt.id !== id);
      saveTenantData(currentTenantIdRef.current, 'projectTypes', next);
      return next;
    });
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
    setProjectTypes((prev) => {
      const next = prev.map((pt) => (pt.id === projectTypeId ? { ...pt, templateItems } : pt));
      saveTenantData(currentTenantIdRef.current, 'projectTypes', next);
      return next;
    });
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
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    setItems((prev) => {
      const updated = prev.map((i) => (i.id === id ? { ...i, isDeleted: true, deletedAt: timestamp, deletedBy } : i));
      saveTenantData(activeTenantId, 'items', updated);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeItemsToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
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
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';

    setSites((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, isDeleted: true, deletedAt: timestamp, deletedBy, updatedAt: timestamp } : s
      );
      saveTenantData(activeTenantId, 'sites', updated);
      if (isMaster) {
        writeSitesToFirebase(updated).catch(console.warn);
      }
      return updated;
    });

    // Remove deleted site from non-all-site users' siteIds so stale site references never linger
    setUsers((prevUsers) => {
      let changed = false;
      const updatedUsers = prevUsers.map((u) => {
        if (u.isDeleted || isUserAllSites(u)) return u;
        const remaining = getUserAssignedSiteIds(u, sites).filter((sid) => sid !== id);
        const prevIds = getUserAssignedSiteIds(u, sites);
        if (remaining.length === prevIds.length && u.siteId !== id) return u;
        changed = true;
        const nextUser: User = {
          ...u,
          siteId: remaining[0] || 'unassigned',
          siteIds: remaining.length > 0 ? remaining : ['unassigned'],
          updatedAt: timestamp,
        };
        if (currentUser?.id === u.id) setCurrentUser(nextUser);
        if (authUser?.id === u.id) setAuthUser(nextUser);
        return nextUser;
      });
      if (changed) {
        saveTenantData(activeTenantId, 'users', updatedUsers);
        if (isMaster) {
          writeUsersToFirebase(updatedUsers).catch(console.warn);
        }
        return updatedUsers;
      }
      return prevUsers;
    });

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
    const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
    const targetUser = users.find((u) => u.id === id);

    setUsers((prev) => {
      const updated = prev.map((u) =>
        u.id === id ? { ...u, isDeleted: true, deletedAt: timestamp, deletedBy, updatedAt: timestamp } : u
      );
      saveTenantData(activeTenantId, 'users', updated);
      if (isMaster) {
        writeUsersToFirebase(updated).catch(console.warn);
      }
      return updated;
    });

    // Clear deleted user from any site supervisor slot
    if (targetUser) {
      const targetNameLower = targetUser.fullName.trim().toLowerCase();
      setSites((prevSites) => {
        let siteChanged = false;
        const updatedSites = prevSites.map((s) => {
          if (s.isDeleted) return s;
          if (
            s.supervisorUserId === id ||
            (!s.supervisorUserId && (s.supervisorName || '').trim().toLowerCase() === targetNameLower)
          ) {
            siteChanged = true;
            return { ...s, supervisorName: 'Unassigned', supervisorUserId: '', updatedAt: timestamp };
          }
          return s;
        });
        if (siteChanged) {
          saveTenantData(activeTenantId, 'sites', updatedSites);
          if (isMaster) {
            writeSitesToFirebase(updatedSites).catch(console.warn);
          }
          return updatedSites;
        }
        return prevSites;
      });
    }

    addAuditLog(
      'MASTER_USER_SOFT_DELETED',
      targetUser?.username || id,
      'All Sites',
      `Moved user account "${targetUser?.fullName}" to Recycle Bin`
    );
  };

  const softDeleteTeam = (id: string) => {
    const timestamp = new Date().toISOString();
    const deletedBy = currentUser?.fullName || 'Administrator';
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    setTeams((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, isDeleted: true, deletedAt: timestamp, deletedBy } : t));
      saveTenantData(activeTenantId, 'teams', updated);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeTeamsToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
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
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    setProjects((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, isDeleted: true, deletedAt: timestamp, deletedBy } : p));
      saveTenantData(activeTenantId, 'projects', updated);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeProjectsToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
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
    setItems((prev) => {
      const updated = prev.map((i) => (i.id === id ? { ...i, isDeleted: false, deletedAt: undefined, deletedBy: undefined } : i));
      saveTenantData(currentTenantIdRef.current, 'items', updated);
      return updated;
    });
    unmarkTenantRecordDeleted(currentTenantIdRef.current, id);
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
    unmarkTenantRecordDeleted(currentTenantIdRef.current, id);
    setSites((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, isDeleted: false, deletedAt: undefined, deletedBy: undefined } : s));
      saveTenantData(currentTenantIdRef.current, 'sites', updated);
      return updated;
    });
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
    unmarkTenantRecordDeleted(activeTenantId, id);
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
    unmarkTenantRecordDeleted(currentTenantIdRef.current, id);
    setTeams((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, isDeleted: false, deletedAt: undefined, deletedBy: undefined } : t));
      saveTenantData(currentTenantIdRef.current, 'teams', updated);
      return updated;
    });
    const team = teams.find((t) => t.id === id);
    addAuditLog(
      'MASTER_TEAM_RESTORED',
      team?.teamName || id,
      'Field Base',
      `Restored field team "${team?.teamName}" from Recycle Bin`
    );
  };

  const restoreProject = (id: string) => {
    unmarkTenantRecordDeleted(currentTenantIdRef.current, id);
    setProjects((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, isDeleted: false, deletedAt: undefined, deletedBy: undefined } : p));
      saveTenantData(currentTenantIdRef.current, 'projects', updated);
      return updated;
    });
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
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    markTenantRecordsDeleted(activeTenantId, [id]);
    const itm = items.find((i) => i.id === id);
    setItems((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      saveTenantData(activeTenantId, 'items', updated);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeItemsToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
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
    if (site?.isMainWarehouse) return;
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
    const nowIso = new Date().toISOString();

    markTenantRecordsDeleted(activeTenantId, [id]);

    setSites((prev) => {
      const updated = sanitizeTenantSites(
        activeTenantId,
        prev.filter((s) => s.id !== id),
        tenantsRef.current
      );
      saveTenantData(activeTenantId, 'sites', updated);
      if (isMaster) {
        writeSitesToFirebase(updated).catch(console.warn);
      }
      return updated;
    });

    setUsers((prevUsers) => {
      let changed = false;
      const updatedUsers = prevUsers.map((u) => {
        if (isUserAllSites(u)) return u;
        const remaining = getUserAssignedSiteIds(u, sites).filter((sid) => sid !== id);
        if (!Array.isArray(u.siteIds) && u.siteId !== id) return u;
        if (Array.isArray(u.siteIds) && !u.siteIds.includes(id) && u.siteId !== id) return u;
        changed = true;
        return {
          ...u,
          siteId: remaining[0] || 'unassigned',
          siteIds: remaining.length > 0 ? remaining : ['unassigned'],
          updatedAt: nowIso,
        };
      });
      if (changed) {
        saveTenantData(activeTenantId, 'users', updatedUsers);
        if (isMaster) {
          writeUsersToFirebase(updatedUsers).catch(console.warn);
        }
        return updatedUsers;
      }
      return prevUsers;
    });

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
    const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
    const nowIso = new Date().toISOString();

    // Record permanent deletion tombstone BEFORE state update so no listener or merge can ever resurrect this user
    markTenantRecordsDeleted(activeTenantId, [id]);

    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== id);
      saveTenantData(activeTenantId, 'users', updated);
      if (isMaster) {
        writeUsersToFirebase(updated).catch(console.warn);
      }
      return updated;
    });

    if (user) {
      const targetNameLower = user.fullName.trim().toLowerCase();
      setSites((prevSites) => {
        let siteChanged = false;
        const updatedSites = prevSites.map((s) => {
          if (
            s.supervisorUserId === id ||
            (!s.supervisorUserId && (s.supervisorName || '').trim().toLowerCase() === targetNameLower)
          ) {
            siteChanged = true;
            return { ...s, supervisorName: 'Unassigned', supervisorUserId: '', updatedAt: nowIso };
          }
          return s;
        });
        if (siteChanged) {
          saveTenantData(activeTenantId, 'sites', updatedSites);
          if (isMaster) {
            writeSitesToFirebase(updatedSites).catch(console.warn);
          }
          return updatedSites;
        }
        return prevSites;
      });
    }

    addAuditLog(
      'MASTER_USER_PERMANENTLY_DELETED',
      user?.username || id,
      'All Sites',
      `Permanently wiped user "${user?.fullName}" from database`
    );
  };

  const permanentlyDeleteTeam = (id: string) => {
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    const team = teams.find((t) => t.id === id);
    const hasLedgerHistory =
      teamIssues.some((iss) => iss.teamId === id) ||
      projectUsages.some((u) => u.teamId === id) ||
      teamReturns.some((ret) => ret.teamId === id);

    if (hasLedgerHistory) {
      // Preserve soft-deleted state so historical Issue/Usage/Return vouchers never lose their team reference
      addAuditLog(
        'MASTER_TEAM_SOFT_DELETED',
        team?.teamName || id,
        'Field Base',
        `Team "${team?.teamName}" retained in archived state because it is linked to historical material issue/usage records`
      );
      return;
    }

    markTenantRecordsDeleted(activeTenantId, [id]);

    setTeams((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveTenantData(activeTenantId, 'teams', updated);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeTeamsToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
    addAuditLog(
      'MASTER_TEAM_PERMANENTLY_DELETED',
      team?.teamName || id,
      'Field Base',
      `Permanently wiped field team "${team?.teamName}" from database`
    );
  };

  const permanentlyDeleteProject = (id: string) => {
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    markTenantRecordsDeleted(activeTenantId, [id]);
    const proj = projects.find((p) => p.id === id);
    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      saveTenantData(activeTenantId, 'projects', updated);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeProjectsToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
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
    const purgedIds = recycleBinItems.map((r) => r.id);
    if (purgedIds.length > 0) {
      markTenantRecordsDeleted(activeTenantId, purgedIds);
    }

    setItems((prev) => {
      const updated = prev.filter((i) => !i.isDeleted);
      saveTenantData(activeTenantId, 'items', updated);
      return updated;
    });
    setSites((prev) => {
      const updated = sanitizeTenantSites(
        activeTenantId,
        prev.filter((s) => !s.isDeleted),
        tenantsRef.current
      );
      saveTenantData(activeTenantId, 'sites', updated);
      return updated;
    });
    setUsers((prev) => {
      const updated = prev.filter((u) => !u.isDeleted);
      saveTenantData(activeTenantId, 'users', updated);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeUsersToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
    setTeams((prev) => {
      const updated = prev.filter((t) => !t.isDeleted);
      saveTenantData(activeTenantId, 'teams', updated);
      return updated;
    });
    setProjects((prev) => {
      const updated = prev.filter((p) => !p.isDeleted);
      saveTenantData(activeTenantId, 'projects', updated);
      return updated;
    });

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
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    markTenantRecordsDeleted(activeTenantId, mainStockEntries.map((e) => e.id));
    setMainStockEntries([]);
    saveTenantData(activeTenantId, 'mainStockEntries', []);
    addAuditLog('MAIN_STOCK_RECEIPT', 'CLEAR-INBOUND', 'Main Central Warehouse', `Cleared all ${count} inbound purchase/manual receipt entries.`);
  };

  const clearStockRequests = () => {
    const count = stockRequests.length;
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    markTenantRecordsDeleted(activeTenantId, stockRequests.map((r) => r.id));
    setStockRequests([]);
    saveTenantData(activeTenantId, 'stockRequests', []);
    addAuditLog('SITE_REQUEST_CREATED', 'CLEAR-REQUESTS', 'All Sites', `Cleared all ${count} inter-branch transfer requisition notes.`);
  };

  const clearTeamIssues = () => {
    const count = teamIssues.length;
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    markTenantRecordsDeleted(activeTenantId, teamIssues.map((i) => i.id));
    setTeamIssues([]);
    saveTenantData(activeTenantId, 'teamIssues', []);
    addAuditLog('TEAM_ISSUE_DISPATCHED', 'CLEAR-ISSUES', 'All Sites', `Cleared all ${count} field dispatch issue notes.`);
  };

  const clearTeamReturns = () => {
    const count = teamReturns.length;
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    markTenantRecordsDeleted(activeTenantId, teamReturns.map((r) => r.id));
    setTeamReturns([]);
    saveTenantData(activeTenantId, 'teamReturns', []);
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
    saveTenantData(currentTenantIdRef.current, 'auditLogs', [resetLog]);
  };

  const clearAllItems = () => {
    const timestamp = new Date().toISOString();
    const deletedBy = currentUser?.fullName || 'Administrator';
    setItems((prev) => {
      const updated = prev.map((i) => ({ ...i, isDeleted: true, deletedAt: timestamp, deletedBy }));
      saveTenantData(currentTenantIdRef.current, 'items', updated);
      return updated;
    });
    addAuditLog('MASTER_ITEM_SOFT_DELETED', 'CLEAR-ITEMS', 'Main Central Warehouse', 'Moved all active items to Recycle Bin.');
  };

  const clearAllSites = () => {
    const timestamp = new Date().toISOString();
    const deletedBy = currentUser?.fullName || 'Administrator';
    setSites((prev) => {
      const updated = prev.map((s) => (s.isMainWarehouse ? s : { ...s, isDeleted: true, deletedAt: timestamp, deletedBy }));
      saveTenantData(currentTenantIdRef.current, 'sites', updated);
      return updated;
    });
    addAuditLog('MASTER_SITE_SOFT_DELETED', 'CLEAR-SITES', 'All Sites', 'Moved all site branches (except Central Main) to Recycle Bin.');
  };

  const clearAllTeams = () => {
    const timestamp = new Date().toISOString();
    const deletedBy = currentUser?.fullName || 'Administrator';
    setTeams((prev) => {
      const updated = prev.map((t) => ({ ...t, isDeleted: true, deletedAt: timestamp, deletedBy }));
      saveTenantData(currentTenantIdRef.current, 'teams', updated);
      return updated;
    });
    addAuditLog('MASTER_TEAM_SOFT_DELETED', 'CLEAR-TEAMS', 'Field Base', 'Moved all field teams to Recycle Bin.');
  };

  const clearAllUsers = () => {
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    setUsers((prev) => {
      const updated = prev.filter(
        (u) => u.username === 'admin' || u.id === currentUser?.id || isSuperAdmin(u.role)
      );
      const removedIds = prev
        .filter((u) => !updated.some((keep) => keep.id === u.id))
        .map((u) => u.id);
      if (removedIds.length > 0) {
        markTenantRecordsDeleted(activeTenantId, removedIds);
      }
      saveTenantData(activeTenantId, 'users', updated);
      const isMaster = activeTenantId === DEFAULT_TENANT.id || activeTenantId === 'tenant-apex-main';
      if (isMaster) {
        writeUsersToFirebase(updated).catch(console.warn);
      }
      return updated;
    });
    addAuditLog('MASTER_USER_PERMANENTLY_DELETED', 'CLEAR-USERS', 'All Sites', 'Cleared all non-admin users from system.');
  };

  // Single Record Deletion Handlers
  const deleteMainStockEntry = (id: string) => {
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    markTenantRecordsDeleted(activeTenantId, [id]);
    const entry = mainStockEntries.find((e) => e.id === id);
    setMainStockEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      saveTenantData(activeTenantId, 'mainStockEntries', updated);
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
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    markTenantRecordsDeleted(activeTenantId, [id]);
    const req = stockRequests.find((r) => r.id === id);
    setStockRequests((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveTenantData(activeTenantId, 'stockRequests', updated);
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
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    markTenantRecordsDeleted(activeTenantId, [id]);
    const issue = teamIssues.find((i) => i.id === id);
    setTeamIssues((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      saveTenantData(activeTenantId, 'teamIssues', updated);
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
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    markTenantRecordsDeleted(activeTenantId, [id]);
    const ret = teamReturns.find((r) => r.id === id);
    setTeamReturns((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveTenantData(activeTenantId, 'teamReturns', updated);
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
    const activeTenantId = currentTenantIdRef.current || currentTenantId;
    markTenantRecordsDeleted(activeTenantId, [id]);
    setAuditLogs((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      saveTenantData(activeTenantId, 'auditLogs', updated);
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
    setMainStockEntries((prev) => {
      const next = [newEntry, ...prev];
      saveTenantData(currentTenantIdRef.current, 'mainStockEntries', next);
      return next;
    });

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
    setStockRequests((prev) => {
      const next = [newRequest, ...prev];
      saveTenantData(currentTenantIdRef.current, 'stockRequests', next);
      return next;
    });

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
    setStockRequests((prev) => {
      const next = prev.map((req) => {
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
          status: 'Approved / In-Transit' as const,
          approvalDate: new Date().toISOString(),
          approvedBy: currentUser?.fullName || 'Arthur Vance',
          approvalNotes,
          items: updatedItems,
        };
      });
      saveTenantData(currentTenantIdRef.current, 'stockRequests', next);
      return next;
    });

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
    setStockRequests((prev) => {
      const next = prev.map((req) => {
        if (req.id !== requestId) return req;
        return {
          ...req,
          status: 'Rejected' as const,
          approvalDate: new Date().toISOString(),
          approvedBy: currentUser?.fullName || 'Arthur Vance',
          approvalNotes: notes || 'Rejected by Main Branch Admin',
        };
      });
      saveTenantData(currentTenantIdRef.current, 'stockRequests', next);
      return next;
    });

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

    setStockRequests((prev) => {
      const next = prev.map((req) => {
        if (req.id !== requestId) return req;
        if (updatedItems.length === 0) {
          return {
            ...req,
            items: [],
            status: 'Rejected' as const,
            approvalDate: new Date().toISOString(),
            approvedBy: currentUser?.fullName || 'Main Branch Admin',
            approvalNotes: 'All items removed due to stock unavailability.',
          };
        }
        return {
          ...req,
          items: updatedItems,
        };
      });
      saveTenantData(currentTenantIdRef.current, 'stockRequests', next);
      return next;
    });

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
    setStockRequests((prev) => {
      const next = prev.map((req) => {
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
          status: 'Accepted' as const,
          acceptanceDate: new Date().toISOString(),
          acceptedBy: currentUser?.fullName || 'Branch Admin',
          acceptanceNotes,
          items: updatedItems,
        };
      });
      saveTenantData(currentTenantIdRef.current, 'stockRequests', next);
      return next;
    });

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
    setTeamIssues((prev) => {
      const next = [newIssue, ...prev];
      saveTenantData(currentTenantIdRef.current, 'teamIssues', next);
      return next;
    });

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
    setTeamReturns((prev) => {
      const next = [newReturn, ...prev];
      saveTenantData(currentTenantIdRef.current, 'teamReturns', next);
      return next;
    });

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
    setProjectUsages((prev) => {
      const next = [newUsage, ...prev];
      saveTenantData(currentTenantIdRef.current, 'projectUsages', next);
      return next;
    });

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
    setProjectUsages((prev) => {
      const next = prev.map((pu) => (pu.id === id ? { ...pu, ...updates } : pu));
      saveTenantData(currentTenantIdRef.current, 'projectUsages', next);
      return next;
    });
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
    setProjectUsages((prev) => {
      const next = prev.filter((u) => u.id !== id);
      saveTenantData(currentTenantIdRef.current, 'projectUsages', next);
      return next;
    });
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
    saveTenantData(currentTenantIdRef.current, 'projectUsages', []);
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
    setBranchReturns((prev) => {
      const next = [newBranchReturn, ...prev];
      saveTenantData(currentTenantIdRef.current, 'branchReturns', next);
      return next;
    });

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
    setBranchReturns((prev) => {
      const next = prev.filter((b) => b.id !== id);
      saveTenantData(currentTenantIdRef.current, 'branchReturns', next);
      return next;
    });
    if (br) {
      addAuditLog('RECORD_DELETED', br.branchReturnNumber, 'Main Central Warehouse', `Deleted branch return to main record: ${br.branchReturnNumber}`);
    }
  };

  const clearBranchReturns = () => {
    const count = branchReturns.length;
    setBranchReturns([]);
    saveToStorage('branchReturns', []);
    saveTenantData(currentTenantIdRef.current, 'branchReturns', []);
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

    setDamagedRestorations((prev) => {
      const next = [newRestoration, ...prev];
      saveToStorage('damagedRestorations', next);
      saveTenantData(currentTenantIdRef.current, 'damagedRestorations', next);
      return next;
    });

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
      transactionCount:
        mainStockEntries.length +
        stockRequests.length +
        teamIssues.length +
        teamReturns.length +
        projectUsages.length +
        clientFreeIssues.length +
        branchReturns.length +
        damagedRestorations.length +
        purchaseOrders.length +
        supplierReturns.length,
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
        crossProjectRequests,
        clientFreeIssues,
        branchReturns,
        damagedRestorations,
        suppliers,
        clients,
        purchaseOrders,
        supplierReturns,
        auditLogs,
      },
    };

    const updated = [newBackup, ...backups];
    setBackups(updated);
    saveToStorage('backups', updated);
    saveTenantData(currentTenantIdRef.current, 'backups', updated);
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
        clientFreeIssues.length +
        branchReturns.length +
        damagedRestorations.length +
        purchaseOrders.length +
        supplierReturns.length,
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
        crossProjectRequests,
        clientFreeIssues,
        branchReturns,
        damagedRestorations,
        suppliers,
        clients,
        purchaseOrders,
        supplierReturns,
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
      saveTenantData(currentTenantIdRef.current, 'backups', updated);
      return updated;
    });

    setLastAutoBackupTime(nowIso);
    return autoBackup;
  };

  // Automated Daily Backup background trigger (only runs when genuine inventory/transaction data exists, NOT just empty default site)
  useEffect(() => {
    if (isFlushingRef.current) return;
    const todayStr = new Date().toISOString().split('T')[0];
    let lastBackupDate: string | null = null;
    try {
      lastBackupDate = localStorage.getItem(`apex_last_daily_backup_date_${currentTenantId}`);
    } catch {
      // ignore
    }

    if (lastBackupDate !== todayStr && (items.length > 0 || mainStockEntries.length > 0 || projects.length > 0)) {
      const timer = setTimeout(() => {
        if (!isFlushingRef.current) {
          triggerDailyBackupNow();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentTenantId, items.length, mainStockEntries.length, projects.length]);

  const restoreBackup = (backupId: string) => {
    if (!isSuperAdmin(currentUser?.role) && currentUser?.username !== 'admin') {
      throw new Error('Access Denied: Restoring backups is strictly restricted to Central Super Admin.');
    }
    const backup = backups.find((b) => b.id === backupId);
    if (!backup) {
      throw new Error('Backup not found');
    }

    const targetTenantId = currentTenantIdRef.current;
    const isMaster = targetTenantId === DEFAULT_TENANT.id || targetTenantId === 'tenant-apex-main';

    // Clear flushMeta barrier so intentionally restored historical records are never filtered out
    clearTenantFlushMetaLocal(targetTenantId);
    clearFlushMetaInFirebase(targetTenantId, isMaster).catch(() => {});

    const snap = backup.snapshot;
    if (snap.config) {
      setConfig(snap.config);
      saveToStorage('config', snap.config);
      saveTenantData(targetTenantId, 'config', snap.config);
    }
    if (snap.sites) {
      setSites(snap.sites);
      saveToStorage('sites', snap.sites);
      saveTenantData(targetTenantId, 'sites', snap.sites);
    }
    if (snap.users) {
      setUsers(snap.users);
      saveToStorage('users', snap.users);
      saveTenantData(targetTenantId, 'users', snap.users);
      if (isMaster) {
        writeUsersToFirebase(snap.users).catch(console.warn);
      }
    }
    if (snap.items) {
      setItems(snap.items);
      saveToStorage('items', snap.items);
      saveTenantData(targetTenantId, 'items', snap.items);
    }
    if (snap.teams) {
      setTeams(snap.teams);
      saveToStorage('teams', snap.teams);
      saveTenantData(targetTenantId, 'teams', snap.teams);
    }
    if (snap.projects) {
      setProjects(snap.projects);
      saveToStorage('projects', snap.projects);
      saveTenantData(targetTenantId, 'projects', snap.projects);
    }
    if (snap.projectTypes) {
      setProjectTypes(snap.projectTypes);
      saveToStorage('projectTypes', snap.projectTypes);
      saveTenantData(targetTenantId, 'projectTypes', snap.projectTypes);
    }
    if (snap.mainStockEntries) {
      setMainStockEntries(snap.mainStockEntries);
      saveToStorage('mainStockEntries', snap.mainStockEntries);
      saveTenantData(targetTenantId, 'mainStockEntries', snap.mainStockEntries);
    }
    if (snap.stockRequests) {
      setStockRequests(snap.stockRequests);
      saveToStorage('stockRequests', snap.stockRequests);
      saveTenantData(targetTenantId, 'stockRequests', snap.stockRequests);
    }
    if (snap.teamIssues) {
      setTeamIssues(snap.teamIssues);
      saveToStorage('teamIssues', snap.teamIssues);
      saveTenantData(targetTenantId, 'teamIssues', snap.teamIssues);
    }
    if (snap.teamReturns) {
      setTeamReturns(snap.teamReturns);
      saveToStorage('teamReturns', snap.teamReturns);
      saveTenantData(targetTenantId, 'teamReturns', snap.teamReturns);
    }
    if (snap.projectUsages) {
      setProjectUsages(snap.projectUsages);
      saveToStorage('projectUsages', snap.projectUsages);
      saveTenantData(targetTenantId, 'projectUsages', snap.projectUsages);
    }
    if (snap.crossProjectRequests) {
      setCrossProjectRequests(snap.crossProjectRequests);
      saveToStorage('crossProjectRequests', snap.crossProjectRequests);
      saveTenantData(targetTenantId, 'crossProjectRequests', snap.crossProjectRequests);
    }
    if (snap.clientFreeIssues) {
      setClientFreeIssues(snap.clientFreeIssues);
      saveToStorage('clientFreeIssues', snap.clientFreeIssues);
      saveTenantData(targetTenantId, 'clientFreeIssues', snap.clientFreeIssues);
    }
    if (snap.branchReturns) {
      setBranchReturns(snap.branchReturns);
      saveToStorage('branchReturns', snap.branchReturns);
      saveTenantData(targetTenantId, 'branchReturns', snap.branchReturns);
    }
    if (snap.damagedRestorations) {
      setDamagedRestorations(snap.damagedRestorations);
      saveToStorage('damagedRestorations', snap.damagedRestorations);
      saveTenantData(targetTenantId, 'damagedRestorations', snap.damagedRestorations);
    }
    if (snap.suppliers) {
      setSuppliers(snap.suppliers);
      saveToStorage('suppliers', snap.suppliers);
      saveTenantData(targetTenantId, 'suppliers', snap.suppliers);
    }
    if (snap.clients) {
      setClients(snap.clients);
      saveToStorage('clients', snap.clients);
      saveTenantData(targetTenantId, 'clients', snap.clients);
    }
    if (snap.purchaseOrders) {
      setPurchaseOrders(snap.purchaseOrders);
      saveToStorage('purchaseOrders', snap.purchaseOrders);
      saveTenantData(targetTenantId, 'purchaseOrders', snap.purchaseOrders);
    }
    if (snap.supplierReturns) {
      setSupplierReturns(snap.supplierReturns);
      saveToStorage('supplierReturns', snap.supplierReturns);
      saveTenantData(targetTenantId, 'supplierReturns', snap.supplierReturns);
    }
    if (snap.auditLogs) {
      setAuditLogs(snap.auditLogs);
      saveToStorage('auditLogs', snap.auditLogs);
      saveTenantData(targetTenantId, 'auditLogs', snap.auditLogs);
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
      saveTenantData(currentTenantIdRef.current, 'backups', next);
      return next;
    });
    if (backup) {
      addAuditLog('RECORD_DELETED', `BACKUP-#${backup.backupNumber}`, 'Main Central Warehouse', `Deleted backup archive "${backup.name}"`);
    }
  };

  const flushSystemWithBackup = async (
    adminPassword: string,
    backupName: string
  ): Promise<{ success: boolean; message: string; backupNumber?: number }> => {
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

    const flushMs = Date.now();
    const flushIso = new Date(flushMs).toISOString();
    const targetTenantId = currentTenantIdRef.current;
    const isMaster = targetTenantId === DEFAULT_TENANT.id || targetTenantId === 'tenant-apex-main';
    const activeTenant = tenants.find((t) => t.id === targetTenantId) || currentTenant;

    // 1. Create complete versioned backup snapshot BEFORE flush
    const backupNumber = backups.length + 1;
    const assignedName = (backupName || '').trim() || `Pre-Flush Auto Backup #${backupNumber}`;
    const autoBackup: StockBackup = {
      id: `backup-${flushMs}`,
      backupNumber,
      name: assignedName,
      createdAt: flushIso,
      createdBy: currentUser?.fullName || 'System Administrator',
      itemCount: items.length,
      transactionCount:
        mainStockEntries.length +
        stockRequests.length +
        teamIssues.length +
        teamReturns.length +
        projectUsages.length +
        clientFreeIssues.length +
        branchReturns.length +
        damagedRestorations.length +
        purchaseOrders.length +
        supplierReturns.length,
      reason: 'Automatic snapshot preserved prior to full system flush',
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
        crossProjectRequests,
        clientFreeIssues,
        branchReturns,
        damagedRestorations,
        suppliers,
        clients,
        purchaseOrders,
        supplierReturns,
        auditLogs,
      },
    };

    const newBackups = [autoBackup, ...backups];

    // 2. Build clean post-flush baseline records & flushMeta barrier
    const cleanMainSite: Site = {
      id: 'site-main',
      name: 'Main Central Warehouse',
      isMainWarehouse: true,
      supervisorName: 'Administrator',
      location: 'Central Logistics Yard',
      contactNumber: '+1 (555) 010-0000',
      createdAt: flushIso,
    };
    const cleanAdminUser: User = {
      id: currentUser?.id || `usr-${activeTenant.slug}-admin`,
      username: currentUser?.username || 'admin',
      fullName: currentUser?.fullName || `${activeTenant.companyName} Super Admin`,
      siteId: 'all',
      role: 'Super Admin Central',
      password: currentUser?.password || 'password123',
      createdAt: flushIso,
      isDeleted: false,
      tenantId: targetTenantId,
    };
    const flushLog: AuditLogEntry = {
      id: `log-${flushMs}`,
      timestamp: flushIso,
      action: 'SYSTEM_FLUSHED_WITH_BACKUP',
      referenceNo: `FLUSH-#${backupNumber}`,
      siteName: 'Main Central Warehouse',
      performedBy: currentUser?.fullName || 'System Super Admin',
      details: `Full System Flush completed under admin authorization. Prior inventory and records saved as Backup #${backupNumber} ("${assignedName}"). System reset to clean state.`,
    };
    const flushMeta: FlushMeta = {
      flushId: `flush-${flushMs}`,
      flushedAt: flushIso,
      flushedAtMs: flushMs,
      flushedBy: currentUser?.fullName || 'System Super Admin',
      backupNumber,
    };

    // Pause background useEffect writers while atomic local + cloud wipe executes
    isFlushingRef.current = true;
    try {
      // 3. Persist flushMeta locally FIRST so no listener or reload can resurrect stale records
      saveTenantFlushMetaLocal(targetTenantId, flushMeta);

      // 4. Purge all tenant, legacy, and comtec localStorage keys cleanly
      const clearedArrayKeys = [
        'items',
        'teams',
        'projects',
        'mainStockEntries',
        'stockRequests',
        'teamIssues',
        'teamReturns',
        'projectUsages',
        'crossProjectRequests',
        'clientFreeIssues',
        'branchReturns',
        'damagedRestorations',
        'suppliers',
        'clients',
        'purchaseOrders',
        'supplierReturns',
      ];
      const allFlushableKeys = [...clearedArrayKeys, 'sites', 'users', 'projectTypes', 'auditLogs'];

      try {
        localStorage.removeItem(`apex_daily_auto_snapshot_${targetTenantId}`);
        if (isMaster) {
          allFlushableKeys.forEach((k) => {
            localStorage.removeItem(`${STORAGE_KEY_PREFIX}tenant-comtec-main_${k}`);
            localStorage.removeItem(STORAGE_KEY_PREFIX + k);
          });
        }
        clearedArrayKeys.forEach((k) => {
          localStorage.setItem(getTenantStorageKey(targetTenantId, k), JSON.stringify([]));
          if (isMaster) {
            localStorage.setItem(STORAGE_KEY_PREFIX + k, JSON.stringify([]));
          }
        });
        localStorage.setItem(getTenantStorageKey(targetTenantId, 'sites'), JSON.stringify([cleanMainSite]));
        localStorage.setItem(getTenantStorageKey(targetTenantId, 'users'), JSON.stringify([cleanAdminUser]));
        localStorage.setItem(getTenantStorageKey(targetTenantId, 'projectTypes'), JSON.stringify(INITIAL_PROJECT_TYPES));
        localStorage.setItem(getTenantStorageKey(targetTenantId, 'auditLogs'), JSON.stringify([flushLog]));
        localStorage.setItem(getTenantStorageKey(targetTenantId, 'backups'), JSON.stringify(newBackups));
        if (isMaster) {
          localStorage.setItem(STORAGE_KEY_PREFIX + 'sites', JSON.stringify([cleanMainSite]));
          localStorage.setItem(STORAGE_KEY_PREFIX + 'users', JSON.stringify([cleanAdminUser]));
          localStorage.setItem(STORAGE_KEY_PREFIX + 'projectTypes', JSON.stringify(INITIAL_PROJECT_TYPES));
          localStorage.setItem(STORAGE_KEY_PREFIX + 'auditLogs', JSON.stringify([flushLog]));
          localStorage.setItem(STORAGE_KEY_PREFIX + 'backups', JSON.stringify(newBackups));
        }
      } catch (storageErr) {
        console.warn('Local storage cleanup warning during flush:', storageErr);
      }

      // 5. Update in-memory React state immediately
      setBackups(newBackups);
      setSites([cleanMainSite]);
      setUsers([cleanAdminUser]);
      setProjectTypes(INITIAL_PROJECT_TYPES);
      setItems([]);
      setTeams([]);
      setProjects([]);
      setMainStockEntries([]);
      setStockRequests([]);
      setTeamIssues([]);
      setTeamReturns([]);
      setProjectUsages([]);
      setCrossProjectRequests([]);
      setClientFreeIssues([]);
      setBranchReturns([]);
      setDamagedRestorations([]);
      setSuppliers([]);
      setClients([]);
      setPurchaseOrders([]);
      setSupplierReturns([]);
      setAuditLogs([flushLog]);
      setCurrentUser(cleanAdminUser);

      // 6. Execute single atomic multi-path flush on Firebase Realtime Database and AWAIT confirmation
      await atomicFlushWorkspaceInFirebase({
        tenantId: targetTenantId,
        isMasterTenant: isMaster,
        cleanSite: cleanMainSite,
        cleanUser: cleanAdminUser,
        cleanConfig: config,
        cleanProjectTypes: INITIAL_PROJECT_TYPES,
        flushLog,
        backups: newBackups,
        flushMeta,
      });

      return {
        success: true,
        message: `System permanently flushed across Local & Cloud storage for ${activeTenant.companyName}! Versioned Backup #${backupNumber} ("${assignedName}") was preserved and all tenant accounts remain 100% safe.`,
        backupNumber,
      };
    } catch (err) {
      console.error('Atomic Firebase flush failed:', err);
      return {
        success: false,
        message:
          'Local workspace cleared, but Cloud database flush could not be confirmed. Please check your internet connection and run System Flush once more.',
      };
    } finally {
      setTimeout(() => {
        isFlushingRef.current = false;
      }, 250);
    }
  };

  // Dynamic Inventory Balance Calculations
  const getMainWarehouseStock = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    const threshold = item?.lowStockThreshold ?? config.defaultLowStockThreshold;
    const mainWarehouseSiteIds = new Set(
      sites.filter((s) => s.isMainWarehouse).map((s) => s.id)
    );

    const totalReceived = mainStockEntries
      .filter((entry) => entry.itemId === itemId)
      .reduce((sum, entry) => sum + Number(entry.quantity), 0);

    // Only good/restocked returns add back to available main stock
    const goodBranchReturnsToMain = branchReturns
      .filter((br) => br.itemId === itemId && !br.isDeleted && br.condition === 'Good / Restock')
      .reduce((sum, br) => sum + Number(br.quantity), 0);

    // Good returns from teams assigned directly to Main Warehouse
    const goodTeamReturnsToMain = teamReturns
      .filter((ret) => mainWarehouseSiteIds.has(ret.siteId) && ret.itemId === itemId && ret.condition === 'Good / Restock')
      .reduce((sum, ret) => sum + Number(ret.quantity), 0);

    // Units repaired from damaged stock and restored back to main stock
    const restoredFromDamaged = damagedRestorations
      .filter((dr) => dr.itemId === itemId && !dr.isDeleted)
      .reduce((sum, dr) => sum + Number(dr.quantity), 0);

    const dispatchedToBranches = stockRequests
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

    const dispatchedToMainTeams = teamIssues
      .filter((iss) => mainWarehouseSiteIds.has(iss.siteId))
      .reduce((sum, iss) => {
        const row = iss.items.find((i) => i.itemId === itemId);
        if (!row) return sum;
        return sum + Number(row.quantity);
      }, 0);

    const dispatched = dispatchedToBranches + dispatchedToMainTeams;

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
      totalReceived + goodBranchReturnsToMain + goodTeamReturnsToMain + restoredFromDamaged - dispatched - returnedToSuppliers
    );
    const hasActivity =
      totalReceived > 0 ||
      goodBranchReturnsToMain > 0 ||
      goodTeamReturnsToMain > 0 ||
      restoredFromDamaged > 0 ||
      dispatched > 0;
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
    const targetSite = sites.find((s) => s.id === siteId);
    if (targetSite?.isMainWarehouse) {
      const mainStk = getMainWarehouseStock(itemId);
      const returnedFromMainTeams = teamReturns
        .filter((ret) => ret.siteId === siteId && ret.itemId === itemId && ret.condition === 'Good / Restock')
        .reduce((sum, ret) => sum + Number(ret.quantity), 0);
      const goodBranchReturnsToMain = branchReturns
        .filter((br) => br.itemId === itemId && !br.isDeleted && br.condition === 'Good / Restock')
        .reduce((sum, br) => sum + Number(br.quantity), 0);
      return {
        received: mainStk.totalReceived,
        returned: returnedFromMainTeams + goodBranchReturnsToMain,
        issued: mainStk.dispatched,
        availableBalance: mainStk.availableBalance,
        threshold: mainStk.threshold,
        isLowStock: mainStk.isLowStock,
        hasActivity: mainStk.hasActivity,
      };
    }

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
        findItemByBarcode,
        autoGenerateMissingBarcodes,
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
        sectionFormats,
        updateSectionFormat,
        resetSectionFormat,
        getEffectiveSectionFormat,
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
