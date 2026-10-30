import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import {
  SystemConfig,
  Site,
  User,
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
  INITIAL_PROJECT_USAGES,
  INITIAL_BRANCH_RETURNS,
  INITIAL_BACKUPS,
  DEFAULT_LETTERHEAD_TEMPLATES,
  DEFAULT_DIGITAL_SIGNATURES,
} from '../data/initialData';
import {
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
  clearAllFirebaseData,
  firebaseConfig,
} from '../firebase';

const STORAGE_KEY_PREFIX = 'apex_stock_site_v1_';

interface StockContextType {
  config: SystemConfig;
  updateConfig: (newConfig: Partial<SystemConfig>) => void;
  resetAllData: () => void;
  clearAllDemoData: () => void;
  restoreDemoData: () => void;
  
  // Active User / Session Simulation
  currentUser: User;
  setCurrentUser: (user: User) => void;
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
  mainStockEntries: MainStockEntry[];
  stockRequests: StockTransferRequest[];
  teamIssues: TeamIssue[];
  teamReturns: TeamReturn[];
  projectUsages: ProjectMaterialUsage[];
  branchReturns: BranchReturn[];
  damagedRestorations: DamagedStockRestoration[];
  backups: StockBackup[];
  auditLogs: AuditLogEntry[];

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

  // Project Material Usages
  logProjectMaterialUsage: (
    data: Omit<ProjectMaterialUsage, 'id' | 'usageVoucherNumber' | 'loggedBy'>
  ) => ProjectMaterialUsage;
  deleteProjectUsage: (id: string) => void;
  clearProjectUsages: () => void;

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

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.error(`Failed to load ${key} from storage:`, err);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save ${key} to storage:`, err);
  }
}

export const StockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SystemConfig>(() =>
    loadFromStorage('config', INITIAL_CONFIG)
  );
  const [sites, setSites] = useState<Site[]>(() =>
    loadFromStorage('sites', INITIAL_SITES)
  );
  const [users, setUsers] = useState<User[]>(() =>
    loadFromStorage('users', INITIAL_USERS)
  );
  const [items, setItems] = useState<Item[]>(() =>
    loadFromStorage('items', INITIAL_ITEMS)
  );
  const [teams, setTeams] = useState<Team[]>(() =>
    loadFromStorage('teams', INITIAL_TEAMS)
  );
  const [mainStockEntries, setMainStockEntries] = useState<MainStockEntry[]>(() =>
    loadFromStorage('mainStockEntries', INITIAL_MAIN_STOCK_ENTRIES)
  );
  const [stockRequests, setStockRequests] = useState<StockTransferRequest[]>(() =>
    loadFromStorage('stockRequests', INITIAL_STOCK_REQUESTS)
  );
  const [teamIssues, setTeamIssues] = useState<TeamIssue[]>(() =>
    loadFromStorage('teamIssues', INITIAL_TEAM_ISSUES)
  );
  const [teamReturns, setTeamReturns] = useState<TeamReturn[]>(() =>
    loadFromStorage('teamReturns', INITIAL_TEAM_RETURNS)
  );
  const [projects, setProjects] = useState<Project[]>(() =>
    loadFromStorage('projects', INITIAL_PROJECTS)
  );
  const [projectUsages, setProjectUsages] = useState<ProjectMaterialUsage[]>(() =>
    loadFromStorage('projectUsages', INITIAL_PROJECT_USAGES)
  );
  const [branchReturns, setBranchReturns] = useState<BranchReturn[]>(() =>
    loadFromStorage('branchReturns', INITIAL_BRANCH_RETURNS)
  );
  const [damagedRestorations, setDamagedRestorations] = useState<DamagedStockRestoration[]>(() =>
    loadFromStorage('damagedRestorations', [])
  );
  const [backups, setBackups] = useState<StockBackup[]>(() =>
    loadFromStorage('backups', INITIAL_BACKUPS)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    loadFromStorage('auditLogs', INITIAL_AUDIT_LOGS)
  );
  const [letterheadTemplates, setLetterheadTemplates] = useState<LetterheadTemplate[]>(() =>
    loadFromStorage('letterheadTemplates', DEFAULT_LETTERHEAD_TEMPLATES)
  );
  const [activeTemplateId, setActiveTemplateIdState] = useState<string>(() =>
    loadFromStorage('activeTemplateId', DEFAULT_LETTERHEAD_TEMPLATES[0].id)
  );
  const [digitalSignatures, setDigitalSignatures] = useState<DigitalSignature[]>(() =>
    loadFromStorage('digitalSignatures', DEFAULT_DIGITAL_SIGNATURES)
  );

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUsers = loadFromStorage<User[]>('users', INITIAL_USERS);
    const active = savedUsers.find((u) => !u.isDeleted) || savedUsers[0] || INITIAL_USERS[0];
    return active;
  });

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
  const isInitializedFromFirebase = useRef<boolean>(false);

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

    try {
      unsubItems = subscribeToFirebaseItems(
        (remoteItems) => {
          setFirebaseConnected(true);
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
        () => setFirebaseConnected(false)
      );

      unsubRequests = subscribeToFirebaseStockRequests(
        (remoteRequests) => {
          setFirebaseConnected(true);
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
        () => setFirebaseConnected(false)
      );

      unsubEntries = subscribeToFirebaseMainStockEntries(
        (remoteEntries) => {
          setFirebaseConnected(true);
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
        () => setFirebaseConnected(false)
      );

      unsubSites = subscribeToFirebaseSites(
        (remoteSites) => {
          setFirebaseConnected(true);
          if (remoteSites && remoteSites.length > 0) {
            isIncomingFirebaseSites.current = true;
            setSites(remoteSites);
            saveToStorage('sites', remoteSites);
            setTimeout(() => {
              isIncomingFirebaseSites.current = false;
            }, 120);
          }
        },
        () => setFirebaseConnected(false)
      );

      unsubTeams = subscribeToFirebaseTeams(
        (remoteTeams) => {
          setFirebaseConnected(true);
          if (remoteTeams) {
            isIncomingFirebaseTeams.current = true;
            setTeams(remoteTeams);
            saveToStorage('teams', remoteTeams);
            setTimeout(() => {
              isIncomingFirebaseTeams.current = false;
            }, 120);
          }
        },
        () => setFirebaseConnected(false)
      );

      unsubUsers = subscribeToFirebaseUsers(
        (remoteUsers) => {
          setFirebaseConnected(true);
          if (remoteUsers && remoteUsers.length > 0) {
            isIncomingFirebaseUsers.current = true;
            setUsers(remoteUsers);
            saveToStorage('users', remoteUsers);
            setTimeout(() => {
              isIncomingFirebaseUsers.current = false;
            }, 120);
          }
        },
        () => setFirebaseConnected(false)
      );

      unsubIssues = subscribeToFirebaseTeamIssues(
        (remoteIssues) => {
          setFirebaseConnected(true);
          if (remoteIssues) {
            isIncomingFirebaseIssues.current = true;
            setTeamIssues(remoteIssues);
            saveToStorage('teamIssues', remoteIssues);
            setTimeout(() => {
              isIncomingFirebaseIssues.current = false;
            }, 120);
          }
        },
        () => setFirebaseConnected(false)
      );

      unsubReturns = subscribeToFirebaseTeamReturns(
        (remoteReturns) => {
          setFirebaseConnected(true);
          if (remoteReturns) {
            isIncomingFirebaseReturns.current = true;
            setTeamReturns(remoteReturns);
            saveToStorage('teamReturns', remoteReturns);
            setTimeout(() => {
              isIncomingFirebaseReturns.current = false;
            }, 120);
          }
        },
        () => setFirebaseConnected(false)
      );

      unsubProjects = subscribeToFirebaseProjects(
        (remoteProjects) => {
          setFirebaseConnected(true);
          if (remoteProjects) {
            isIncomingFirebaseProjects.current = true;
            setProjects(remoteProjects);
            saveToStorage('projects', remoteProjects);
            setTimeout(() => {
              isIncomingFirebaseProjects.current = false;
            }, 120);
          }
        },
        () => setFirebaseConnected(false)
      );

      unsubProjectUsages = subscribeToFirebaseProjectUsages(
        (remoteUsages) => {
          setFirebaseConnected(true);
          if (remoteUsages) {
            isIncomingFirebaseProjectUsages.current = true;
            setProjectUsages(remoteUsages);
            saveToStorage('projectUsages', remoteUsages);
            setTimeout(() => {
              isIncomingFirebaseProjectUsages.current = false;
            }, 120);
          }
        },
        () => setFirebaseConnected(false)
      );

      unsubBranchReturns = subscribeToFirebaseBranchReturns(
        (remoteBranchReturns) => {
          setFirebaseConnected(true);
          if (remoteBranchReturns) {
            isIncomingFirebaseBranchReturns.current = true;
            setBranchReturns(remoteBranchReturns);
            saveToStorage('branchReturns', remoteBranchReturns);
            setTimeout(() => {
              isIncomingFirebaseBranchReturns.current = false;
            }, 120);
          }
        },
        () => setFirebaseConnected(false)
      );

      unsubBackups = subscribeToFirebaseBackups(
        (remoteBackups) => {
          setFirebaseConnected(true);
          if (remoteBackups) {
            isIncomingFirebaseBackups.current = true;
            setBackups(remoteBackups);
            saveToStorage('backups', remoteBackups);
            setTimeout(() => {
              isIncomingFirebaseBackups.current = false;
            }, 120);
          }
        },
        () => setFirebaseConnected(false)
      );

      unsubAudit = subscribeToFirebaseAuditLogs(
        (remoteAudit) => {
          setFirebaseConnected(true);
          if (remoteAudit) {
            isIncomingFirebaseAudit.current = true;
            setAuditLogs(remoteAudit);
            saveToStorage('auditLogs', remoteAudit);
            setTimeout(() => {
              isIncomingFirebaseAudit.current = false;
            }, 120);
          }
        },
        () => setFirebaseConnected(false)
      );

      unsubConfig = subscribeToFirebaseConfig(
        (remoteConfig) => {
          setFirebaseConnected(true);
          if (remoteConfig && remoteConfig.companyName) {
            isIncomingFirebaseConfig.current = true;
            setConfig(remoteConfig);
            saveToStorage('config', remoteConfig);
            setTimeout(() => {
              isIncomingFirebaseConfig.current = false;
            }, 120);
          }
        },
        () => setFirebaseConnected(false)
      );

      unsubTemplates = subscribeToFirebaseLetterheadTemplates(
        (remoteTemplates) => {
          setFirebaseConnected(true);
          if (remoteTemplates && remoteTemplates.length > 0) {
            isIncomingFirebaseLetterheadTemplates.current = true;
            setLetterheadTemplates(remoteTemplates);
            saveToStorage('letterheadTemplates', remoteTemplates);
            setTimeout(() => {
              isIncomingFirebaseLetterheadTemplates.current = false;
            }, 120);
          }
        },
        () => setFirebaseConnected(false)
      );

      unsubSignatures = subscribeToFirebaseDigitalSignatures(
        (remoteSignatures) => {
          setFirebaseConnected(true);
          if (remoteSignatures && remoteSignatures.length > 0) {
            isIncomingFirebaseDigitalSignatures.current = true;
            setDigitalSignatures(remoteSignatures);
            saveToStorage('digitalSignatures', remoteSignatures);
            setTimeout(() => {
              isIncomingFirebaseDigitalSignatures.current = false;
            }, 120);
          }
        },
        () => setFirebaseConnected(false)
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
    };
  }, []);

  // Write changes to Firebase when modified locally (unless incoming from Firebase)
  useEffect(() => {
    saveToStorage('items', items);
    if (!isIncomingFirebaseItems.current) {
      writeItemsToFirebase(items).catch((err) => console.warn('Sync items to Firebase error:', err));
    }
  }, [items]);

  useEffect(() => {
    saveToStorage('stockRequests', stockRequests);
    if (!isIncomingFirebaseRequests.current) {
      writeStockRequestsToFirebase(stockRequests).catch((err) => console.warn('Sync stockRequests to Firebase error:', err));
    }
  }, [stockRequests]);

  useEffect(() => {
    saveToStorage('mainStockEntries', mainStockEntries);
    if (!isIncomingFirebaseEntries.current) {
      writeMainStockEntriesToFirebase(mainStockEntries).catch((err) => console.warn('Sync mainStockEntries to Firebase error:', err));
    }
  }, [mainStockEntries]);

  useEffect(() => {
    saveToStorage('sites', sites);
    if (!isIncomingFirebaseSites.current) {
      writeSitesToFirebase(sites).catch((err) => console.warn('Sync sites to Firebase error:', err));
    }
  }, [sites]);

  useEffect(() => {
    saveToStorage('teams', teams);
    if (!isIncomingFirebaseTeams.current) {
      writeTeamsToFirebase(teams).catch((err) => console.warn('Sync teams to Firebase error:', err));
    }
  }, [teams]);

  useEffect(() => {
    saveToStorage('users', users);
    if (!isIncomingFirebaseUsers.current) {
      writeUsersToFirebase(users).catch((err) => console.warn('Sync users to Firebase error:', err));
    }
  }, [users]);

  useEffect(() => {
    saveToStorage('teamIssues', teamIssues);
    if (!isIncomingFirebaseIssues.current) {
      writeTeamIssuesToFirebase(teamIssues).catch((err) => console.warn('Sync teamIssues to Firebase error:', err));
    }
  }, [teamIssues]);

  useEffect(() => {
    saveToStorage('teamReturns', teamReturns);
    if (!isIncomingFirebaseReturns.current) {
      writeTeamReturnsToFirebase(teamReturns).catch((err) => console.warn('Sync teamReturns to Firebase error:', err));
    }
  }, [teamReturns]);

  useEffect(() => {
    saveToStorage('projects', projects);
    if (!isIncomingFirebaseProjects.current) {
      writeProjectsToFirebase(projects).catch((err) => console.warn('Sync projects to Firebase error:', err));
    }
  }, [projects]);

  useEffect(() => {
    saveToStorage('projectUsages', projectUsages);
    if (!isIncomingFirebaseProjectUsages.current) {
      writeProjectUsagesToFirebase(projectUsages).catch((err) => console.warn('Sync projectUsages to Firebase error:', err));
    }
  }, [projectUsages]);

  useEffect(() => {
    saveToStorage('branchReturns', branchReturns);
    if (!isIncomingFirebaseBranchReturns.current) {
      writeBranchReturnsToFirebase(branchReturns).catch((err) => console.warn('Sync branchReturns to Firebase error:', err));
    }
  }, [branchReturns]);

  useEffect(() => {
    saveToStorage('damagedRestorations', damagedRestorations);
  }, [damagedRestorations]);

  useEffect(() => {
    saveToStorage('backups', backups);
    if (!isIncomingFirebaseBackups.current) {
      writeBackupsToFirebase(backups).catch((err) => console.warn('Sync backups to Firebase error:', err));
    }
  }, [backups]);

  useEffect(() => {
    saveToStorage('auditLogs', auditLogs);
    if (!isIncomingFirebaseAudit.current) {
      writeAuditLogsToFirebase(auditLogs).catch((err) => console.warn('Sync auditLogs to Firebase error:', err));
    }
  }, [auditLogs]);

  useEffect(() => {
    saveToStorage('config', config);
    if (!isIncomingFirebaseConfig.current) {
      writeConfigToFirebase(config).catch((err) => console.warn('Sync config to Firebase error:', err));
    }
  }, [config]);

  useEffect(() => {
    saveToStorage('letterheadTemplates', letterheadTemplates);
    if (!isIncomingFirebaseLetterheadTemplates.current) {
      writeLetterheadTemplatesToFirebase(letterheadTemplates).catch((err) =>
        console.warn('Sync letterheadTemplates to Firebase error:', err)
      );
    }
  }, [letterheadTemplates]);

  useEffect(() => {
    saveToStorage('digitalSignatures', digitalSignatures);
    if (!isIncomingFirebaseDigitalSignatures.current) {
      writeDigitalSignaturesToFirebase(digitalSignatures).catch((err) =>
        console.warn('Sync digitalSignatures to Firebase error:', err)
      );
    }
  }, [digitalSignatures]);

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

  // Active Site scope
  const activeSite = useMemo(() => {
    if (!currentUser || currentUser.siteId === 'all') return null;
    return activeSites.find((s) => s.id === currentUser.siteId) || null;
  }, [currentUser, activeSites]);

  const updateConfig = (newConfig: Partial<SystemConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
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
      role: 'Central Warehouse Admin',
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
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };
    setUsers((prev) => [...prev, newUser]);
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
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );
    const user = users.find((u) => u.id === id);
    addAuditLog(
      'MASTER_USER_UPDATED',
      updates.username || user?.username || id,
      'All Sites',
      `Updated user account: ${updates.fullName || user?.fullName} [${updates.role || user?.role}]`
    );
    if (currentUser?.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...updates }));
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
    const proj = projects.find((p) => p.id === id);
    addAuditLog(
      'PROJECT_CREATED',
      updates.projectId || proj?.projectId || id,
      'Project Office',
      `Updated project profile: ${updates.projectName || proj?.projectName} (${updates.projectId || proj?.projectId})`
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
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isDeleted: true, deletedAt: timestamp, deletedBy } : u))
    );
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
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isDeleted: false, deletedAt: undefined, deletedBy: undefined } : u))
    );
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
    setUsers((prev) => prev.filter((u) => u.id !== id));
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
    setItems((prev) => prev.filter((i) => !i.isDeleted));
    setSites((prev) => prev.filter((s) => !s.isDeleted));
    setUsers((prev) => prev.filter((u) => !u.isDeleted));
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
    const timestamp = new Date().toISOString();
    const deletedBy = currentUser?.fullName || 'Administrator';
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === currentUser.id || u.role === 'Central Warehouse Admin' ? u : { ...u, isDeleted: true, deletedAt: timestamp, deletedBy }));
      saveToStorage('users', updated);
      return updated;
    });
    addAuditLog('MASTER_USER_SOFT_DELETED', 'CLEAR-USERS', 'All Sites', 'Moved all non-admin users to Recycle Bin.');
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
      requestedBy: currentUser?.fullName || 'Site Admin',
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
          acceptedBy: currentUser?.fullName || 'Site Admin',
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
      issuedBy: currentUser?.fullName || 'Site Admin',
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
      returnedBy: currentUser?.fullName || 'Site Admin',
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
      restoredBy: currentUser?.fullName || 'Central Warehouse Admin',
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

  const restoreBackup = (backupId: string) => {
    if (currentUser?.role !== 'Central Warehouse Admin') {
      throw new Error('Access Denied: Restoring backups is strictly restricted to Central Warehouse Admin.');
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
    }
    if (snap.items) {
      setItems(snap.items);
      saveToStorage('items', snap.items);
    }
    if (snap.teams) {
      setTeams(snap.teams);
      saveToStorage('teams', snap.teams);
    }
    if (snap.projects) {
      setProjects(snap.projects);
      saveToStorage('projects', snap.projects);
    }
    if (snap.mainStockEntries) {
      setMainStockEntries(snap.mainStockEntries);
      saveToStorage('mainStockEntries', snap.mainStockEntries);
    }
    if (snap.stockRequests) {
      setStockRequests(snap.stockRequests);
      saveToStorage('stockRequests', snap.stockRequests);
    }
    if (snap.teamIssues) {
      setTeamIssues(snap.teamIssues);
      saveToStorage('teamIssues', snap.teamIssues);
    }
    if (snap.teamReturns) {
      setTeamReturns(snap.teamReturns);
      saveToStorage('teamReturns', snap.teamReturns);
    }
    if (snap.projectUsages) {
      setProjectUsages(snap.projectUsages);
      saveToStorage('projectUsages', snap.projectUsages);
    }
    if (snap.branchReturns) {
      setBranchReturns(snap.branchReturns);
      saveToStorage('branchReturns', snap.branchReturns);
    }
    if (snap.damagedRestorations) {
      setDamagedRestorations(snap.damagedRestorations);
      saveToStorage('damagedRestorations', snap.damagedRestorations);
    }
    if (snap.auditLogs) {
      setAuditLogs(snap.auditLogs);
      saveToStorage('auditLogs', snap.auditLogs);
    }

    addAuditLog(
      'BACKUP_RESTORED',
      `RESTORE-#${backup.backupNumber}`,
      'Main Central Warehouse',
      `Restored complete system state from backup: "${backup.name}" (Backup #${backup.backupNumber}) taken on ${new Date(backup.createdAt).toLocaleString()}`
    );
  };

  const deleteBackup = (backupId: string) => {
    if (currentUser?.role !== 'Central Warehouse Admin') {
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
    if (currentUser?.role !== 'Central Warehouse Admin') {
      return {
        success: false,
        message: 'Access Denied: Full System Flush is strictly restricted to Central Warehouse Admin.',
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
      role: 'Central Warehouse Admin',
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

    // Save to storage
    saveToStorage('sites', [cleanMainSite]);
    saveToStorage('users', [cleanAdminUser]);
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

    const availableBalance = Math.max(0, totalReceived + goodBranchReturnsToMain + restoredFromDamaged - dispatched);
    const hasActivity = totalReceived > 0 || goodBranchReturnsToMain > 0 || restoredFromDamaged > 0;
    const isLowStock = hasActivity && availableBalance <= threshold;

    return {
      totalReceived,
      dispatched,
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

    const availableBalance = Math.max(0, received + returned - issued - returnedToMain);
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
        logProjectMaterialUsage,
        deleteProjectUsage,
        clearProjectUsages,
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
        firebaseConnected,
        isFirebaseSyncing,
        syncWithFirebaseNow,
        firebaseDbUrl: firebaseConfig.databaseURL,
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
