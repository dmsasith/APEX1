import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  set,
  get,
  update,
  DatabaseReference,
  DataSnapshot,
} from 'firebase/database';
import {
  Item,
  StockTransferRequest,
  MainStockEntry,
  Site,
  Team,
  User,
  TeamIssue,
  TeamReturn,
  AuditLogEntry,
  SystemConfig,
  Project,
  ProjectType,
  ProjectMaterialUsage,
  BranchReturn,
  StockBackup,
  FlushMeta,
  LetterheadTemplate,
  DigitalSignature,
  Supplier,
  PurchaseOrder,
  SupplierReturn,
  Tenant,
} from './types';

// Web app's Firebase configuration provided by the user
export const firebaseConfig = {
  apiKey: "AIzaSyC3Fs18NG5AQBq1wUzMRaAGHy62MdHVNjA",
  authDomain: "apexdevoloper-31068.firebaseapp.com",
  databaseURL: "https://apexdevoloper-31068-default-rtdb.firebaseio.com",
  projectId: "apexdevoloper-31068",
  storageBucket: "apexdevoloper-31068.firebasestorage.app",
  messagingSenderId: "933348046008",
  appId: "1:933348046008:web:c15a9cf34610c727a1304d"
};

// Initialize Firebase App safely (singleton)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Realtime Database
export const rtdb = getDatabase(app);

// Helper to normalize objects or arrays from Firebase Realtime Database
function normalizeFirebaseList<T>(snapshotVal: unknown): T[] {
  if (!snapshotVal) return [];
  if (Array.isArray(snapshotVal)) {
    return snapshotVal.filter(Boolean) as T[];
  }
  if (typeof snapshotVal === 'object') {
    return Object.values(snapshotVal as Record<string, T>).filter(Boolean);
  }
  return [];
}

/**
 * Universal Sanitizer: Strips out undefined values before sending to Firebase RTDB
 * Prevents "set failed: value argument contains undefined" exceptions.
 */
function sanitizeData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Realtime sync listeners for Item Data
 */
export function subscribeToFirebaseItems(
  onData: (items: Item[]) => void,
  onError?: (err: Error) => void
): () => void {
  const itemsRef = ref(rtdb, 'items');
  const unsubscribe = onValue(
    itemsRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const normalized = normalizeFirebaseList<Item>(val);
        onData(normalized);
      }
    },
    (error) => {
      console.warn('Firebase items subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeItemsToFirebase(items: Item[]): Promise<void> {
  try {
    const itemsRef = ref(rtdb, 'items');
    await set(itemsRef, sanitizeData(items));
  } catch (err) {
    console.error('Failed to write items to Firebase:', err);
    throw err;
  }
}

/**
 * Realtime sync listeners for Stock Requests
 */
export function subscribeToFirebaseStockRequests(
  onData: (requests: StockTransferRequest[]) => void,
  onError?: (err: Error) => void
): () => void {
  const requestsRef = ref(rtdb, 'stockRequests');
  const unsubscribe = onValue(
    requestsRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const normalized = normalizeFirebaseList<StockTransferRequest>(val);
        onData(normalized);
      }
    },
    (error) => {
      console.warn('Firebase stockRequests subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeStockRequestsToFirebase(
  requests: StockTransferRequest[]
): Promise<void> {
  try {
    const requestsRef = ref(rtdb, 'stockRequests');
    await set(requestsRef, sanitizeData(requests));
  } catch (err) {
    console.error('Failed to write stockRequests to Firebase:', err);
    throw err;
  }
}

/**
 * Realtime sync listeners for Main Stock Entries
 */
export function subscribeToFirebaseMainStockEntries(
  onData: (entries: MainStockEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  const entriesRef = ref(rtdb, 'mainStockEntries');
  const unsubscribe = onValue(
    entriesRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const normalized = normalizeFirebaseList<MainStockEntry>(val);
        onData(normalized);
      }
    },
    (error) => {
      console.warn('Firebase mainStockEntries subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeMainStockEntriesToFirebase(
  entries: MainStockEntry[]
): Promise<void> {
  try {
    const entriesRef = ref(rtdb, 'mainStockEntries');
    await set(entriesRef, sanitizeData(entries));
  } catch (err) {
    console.error('Failed to write mainStockEntries to Firebase:', err);
    throw err;
  }
}

/**
 * Realtime sync listeners for Sites
 */
export function subscribeToFirebaseSites(
  onData: (sites: Site[]) => void,
  onError?: (err: Error) => void
): () => void {
  const sitesRef = ref(rtdb, 'sites');
  const unsubscribe = onValue(
    sitesRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const normalized = normalizeFirebaseList<Site>(val);
        onData(normalized);
      }
    },
    (error) => {
      console.warn('Firebase sites subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeSitesToFirebase(sites: Site[]): Promise<void> {
  try {
    const sitesRef = ref(rtdb, 'sites');
    await set(sitesRef, sanitizeData(sites));
  } catch (err) {
    console.error('Failed to write sites to Firebase:', err);
    throw err;
  }
}

/**
 * Realtime sync listeners for Teams
 */
export function subscribeToFirebaseTeams(
  onData: (teams: Team[]) => void,
  onError?: (err: Error) => void
): () => void {
  const teamsRef = ref(rtdb, 'teams');
  const unsubscribe = onValue(
    teamsRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const normalized = normalizeFirebaseList<Team>(val);
        onData(normalized);
      }
    },
    (error) => {
      console.warn('Firebase teams subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeTeamsToFirebase(teams: Team[]): Promise<void> {
  try {
    const teamsRef = ref(rtdb, 'teams');
    await set(teamsRef, sanitizeData(teams));
  } catch (err) {
    console.error('Failed to write teams to Firebase:', err);
    throw err;
  }
}

/**
 * Realtime sync listeners for Users
 */
export function subscribeToFirebaseUsers(
  onData: (users: User[]) => void,
  onError?: (err: Error) => void
): () => void {
  const usersRef = ref(rtdb, 'users');
  const unsubscribe = onValue(
    usersRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const normalized = normalizeFirebaseList<User>(val);
        onData(normalized);
      }
    },
    (error) => {
      console.warn('Firebase users subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeUsersToFirebase(users: User[]): Promise<void> {
  try {
    const usersRef = ref(rtdb, 'users');
    await set(usersRef, sanitizeData(users));
  } catch (err) {
    console.error('Failed to write users to Firebase:', err);
    throw err;
  }
}

/**
 * Realtime sync listeners for Team Issues (Dispatch)
 */
export function subscribeToFirebaseTeamIssues(
  onData: (issues: TeamIssue[]) => void,
  onError?: (err: Error) => void
): () => void {
  const issuesRef = ref(rtdb, 'teamIssues');
  const unsubscribe = onValue(
    issuesRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const normalized = normalizeFirebaseList<TeamIssue>(val);
        onData(normalized);
      }
    },
    (error) => {
      console.warn('Firebase teamIssues subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeTeamIssuesToFirebase(issues: TeamIssue[]): Promise<void> {
  try {
    const issuesRef = ref(rtdb, 'teamIssues');
    await set(issuesRef, sanitizeData(issues));
  } catch (err) {
    console.error('Failed to write teamIssues to Firebase:', err);
    throw err;
  }
}

/**
 * Realtime sync listeners for Team Returns
 */
export function subscribeToFirebaseTeamReturns(
  onData: (returns: TeamReturn[]) => void,
  onError?: (err: Error) => void
): () => void {
  const returnsRef = ref(rtdb, 'teamReturns');
  const unsubscribe = onValue(
    returnsRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const normalized = normalizeFirebaseList<TeamReturn>(val);
        onData(normalized);
      }
    },
    (error) => {
      console.warn('Firebase teamReturns subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeTeamReturnsToFirebase(returns: TeamReturn[]): Promise<void> {
  try {
    const returnsRef = ref(rtdb, 'teamReturns');
    await set(returnsRef, sanitizeData(returns));
  } catch (err) {
    console.error('Failed to write teamReturns to Firebase:', err);
    throw err;
  }
}

/**
 * Realtime sync listeners for Project Management
 */
export function subscribeToFirebaseProjects(
  onData: (projects: Project[]) => void,
  onError?: (err: Error) => void
): () => void {
  const projectsRef = ref(rtdb, 'projects');
  const unsubscribe = onValue(
    projectsRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const normalized = normalizeFirebaseList<Project>(val);
        onData(normalized);
      }
    },
    (error) => {
      console.warn('Firebase projects subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeProjectsToFirebase(projects: Project[]): Promise<void> {
  try {
    const projectsRef = ref(rtdb, 'projects');
    await set(projectsRef, sanitizeData(projects));
  } catch (err) {
    console.error('Failed to write projects to Firebase:', err);
    throw err;
  }
}

/**
 * Realtime sync listeners for Project Material Usages
 */
export function subscribeToFirebaseProjectUsages(
  onData: (usages: ProjectMaterialUsage[]) => void,
  onError?: (err: Error) => void
): () => void {
  const usagesRef = ref(rtdb, 'projectUsages');
  const unsubscribe = onValue(
    usagesRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const normalized = normalizeFirebaseList<ProjectMaterialUsage>(val);
        onData(normalized);
      }
    },
    (error) => {
      console.warn('Firebase projectUsages subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeProjectUsagesToFirebase(
  usages: ProjectMaterialUsage[]
): Promise<void> {
  try {
    const usagesRef = ref(rtdb, 'projectUsages');
    await set(usagesRef, sanitizeData(usages));
  } catch (err) {
    console.error('Failed to write projectUsages to Firebase:', err);
    throw err;
  }
}

/**
 * Realtime sync listeners for Branch Returns (To Main Yard)
 */
export function subscribeToFirebaseBranchReturns(
  onData: (returns: BranchReturn[]) => void,
  onError?: (err: Error) => void
): () => void {
  const branchReturnsRef = ref(rtdb, 'branchReturns');
  const unsubscribe = onValue(
    branchReturnsRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const normalized = normalizeFirebaseList<BranchReturn>(val);
        onData(normalized);
      }
    },
    (error) => {
      console.warn('Firebase branchReturns subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeBranchReturnsToFirebase(
  returns: BranchReturn[]
): Promise<void> {
  try {
    const branchReturnsRef = ref(rtdb, 'branchReturns');
    await set(branchReturnsRef, sanitizeData(returns));
  } catch (err) {
    console.error('Failed to write branchReturns to Firebase:', err);
    throw err;
  }
}

/**
 * Realtime sync listeners for System Backups
 */
export function subscribeToFirebaseBackups(
  onData: (backups: StockBackup[]) => void,
  onError?: (err: Error) => void
): () => void {
  const backupsRef = ref(rtdb, 'backups');
  const unsubscribe = onValue(
    backupsRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const normalized = normalizeFirebaseList<StockBackup>(val);
        onData(normalized);
      }
    },
    (error) => {
      console.warn('Firebase backups subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeBackupsToFirebase(backups: StockBackup[]): Promise<void> {
  try {
    const backupsRef = ref(rtdb, 'backups');
    await set(backupsRef, sanitizeData(backups));
  } catch (err) {
    console.error('Failed to write backups to Firebase:', err);
    throw err;
  }
}

/**
 * Realtime sync listeners for Audit Logs
 */
export function subscribeToFirebaseAuditLogs(
  onData: (logs: AuditLogEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  const logsRef = ref(rtdb, 'auditLogs');
  const unsubscribe = onValue(
    logsRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const normalized = normalizeFirebaseList<AuditLogEntry>(val);
        onData(normalized);
      }
    },
    (error) => {
      console.warn('Firebase auditLogs subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeAuditLogsToFirebase(logs: AuditLogEntry[]): Promise<void> {
  try {
    const logsRef = ref(rtdb, 'auditLogs');
    await set(logsRef, sanitizeData(logs));
  } catch (err) {
    console.error('Failed to write auditLogs to Firebase:', err);
    throw err;
  }
}

/**
 * Realtime sync listeners for System Config
 */
export function subscribeToFirebaseConfig(
  onData: (config: SystemConfig) => void,
  onError?: (err: Error) => void
): () => void {
  const configRef = ref(rtdb, 'config');
  const unsubscribe = onValue(
    configRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val && typeof val === 'object') {
        onData(val as SystemConfig);
      }
    },
    (error) => {
      console.warn('Firebase config subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeConfigToFirebase(config: SystemConfig): Promise<void> {
  try {
    const configRef = ref(rtdb, 'config');
    await set(configRef, sanitizeData(config));
  } catch (err) {
    console.error('Failed to write config to Firebase:', err);
    throw err;
  }
}

/**
 * Realtime sync listeners for Letterhead Templates
 */
export function subscribeToFirebaseLetterheadTemplates(
  onData: (templates: LetterheadTemplate[]) => void,
  onError?: (err: Error) => void
): () => void {
  const tplRef = ref(rtdb, 'letterheadTemplates');
  const unsubscribe = onValue(
    tplRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const normalized = normalizeFirebaseList<LetterheadTemplate>(val);
        onData(normalized);
      }
    },
    (error) => {
      console.warn('Firebase letterheadTemplates subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeLetterheadTemplatesToFirebase(
  templates: LetterheadTemplate[]
): Promise<void> {
  try {
    const tplRef = ref(rtdb, 'letterheadTemplates');
    await set(tplRef, sanitizeData(templates));
  } catch (err) {
    console.error('Failed to write letterheadTemplates to Firebase:', err);
    throw err;
  }
}

/**
 * Realtime sync listeners for Digital Signatures
 */
export function subscribeToFirebaseDigitalSignatures(
  onData: (signatures: DigitalSignature[]) => void,
  onError?: (err: Error) => void
): () => void {
  const sigRef = ref(rtdb, 'digitalSignatures');
  const unsubscribe = onValue(
    sigRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const normalized = normalizeFirebaseList<DigitalSignature>(val);
        onData(normalized);
      }
    },
    (error) => {
      console.warn('Firebase digitalSignatures subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeDigitalSignaturesToFirebase(
  signatures: DigitalSignature[]
): Promise<void> {
  try {
    const sigRef = ref(rtdb, 'digitalSignatures');
    await set(sigRef, sanitizeData(signatures));
  } catch (err) {
    console.error('Failed to write digitalSignatures to Firebase:', err);
    throw err;
  }
}

/**
 * Realtime sync listeners and writers for Suppliers
 */
export function subscribeToFirebaseSuppliers(
  onData: (suppliers: Supplier[]) => void,
  onError?: (err: Error) => void
): () => void {
  const suppliersRef = ref(rtdb, 'suppliers');
  const unsubscribe = onValue(
    suppliersRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const normalized = normalizeFirebaseList<Supplier>(val);
        onData(normalized);
      }
    },
    (error) => {
      console.warn('Firebase suppliers subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeSuppliersToFirebase(suppliers: Supplier[]): Promise<void> {
  try {
    const suppliersRef = ref(rtdb, 'suppliers');
    await set(suppliersRef, sanitizeData(suppliers));
  } catch (err) {
    console.error('Failed to write suppliers to Firebase:', err);
    throw err;
  }
}

/**
 * Realtime sync listeners and writers for Purchase Orders / Material Requests
 */
export function subscribeToFirebasePurchaseOrders(
  onData: (orders: PurchaseOrder[]) => void,
  onError?: (err: Error) => void
): () => void {
  const poRef = ref(rtdb, 'purchaseOrders');
  const unsubscribe = onValue(
    poRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const normalized = normalizeFirebaseList<PurchaseOrder>(val);
        onData(normalized);
      }
    },
    (error) => {
      console.warn('Firebase purchase orders subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writePurchaseOrdersToFirebase(orders: PurchaseOrder[]): Promise<void> {
  try {
    const poRef = ref(rtdb, 'purchaseOrders');
    await set(poRef, sanitizeData(orders));
  } catch (err) {
    console.error('Failed to write purchaseOrders to Firebase:', err);
    throw err;
  }
}

/**
 * Realtime sync listeners for Supplier Returns (RTV & Debit Notes)
 */
export function subscribeToFirebaseSupplierReturns(
  onData: (returns: SupplierReturn[]) => void,
  onError?: (err: Error) => void
): () => void {
  const rtvRef = ref(rtdb, 'supplierReturns');
  const unsubscribe = onValue(
    rtvRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const normalized = normalizeFirebaseList<SupplierReturn>(val);
        onData(normalized);
      }
    },
    (error) => {
      console.warn('Firebase supplier returns subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeSupplierReturnsToFirebase(returns: SupplierReturn[]): Promise<void> {
  try {
    const rtvRef = ref(rtdb, 'supplierReturns');
    await set(rtvRef, sanitizeData(returns));
  } catch (err) {
    console.error('Failed to write supplierReturns to Firebase:', err);
    throw err;
  }
}

/**
 * Check if a path in Firebase has data
 */
export async function checkFirebaseHasData(path: string): Promise<boolean> {
  try {
    const snapshot = await get(ref(rtdb, path));
    return snapshot.exists();
  } catch (err) {
    console.warn(`Failed checking Firebase path ${path}:`, err);
    return false;
  }
}

/**
 * Completely purge all demo records from Firebase RTDB and establish a clean production state
 */
export async function clearAllFirebaseData(
  cleanSite: Site,
  cleanUser: User,
  cleanConfig: SystemConfig,
  initialAuditLog: AuditLogEntry
): Promise<void> {
  try {
    const updates: Record<string, unknown> = {
      items: null,
      mainStockEntries: null,
      stockRequests: null,
      teamIssues: null,
      teamReturns: null,
      projectUsages: null,
      crossProjectRequests: null,
      clientFreeIssues: null,
      branchReturns: null,
      damagedRestorations: null,
      projects: null,
      teams: null,
      suppliers: null,
      clients: null,
      purchaseOrders: null,
      supplierReturns: null,
      sites: [sanitizeData(cleanSite)],
      users: [sanitizeData(cleanUser)],
      config: sanitizeData(cleanConfig),
      auditLogs: [sanitizeData(initialAuditLog)],
    };
    await update(ref(rtdb), updates);
  } catch (err) {
    console.error('Failed to clear Firebase data:', err);
    throw err;
  }
}

export interface AtomicFlushPayload {
  tenantId: string;
  isMasterTenant: boolean;
  cleanSite: Site;
  cleanUser: User;
  cleanConfig: SystemConfig;
  cleanProjectTypes: ProjectType[];
  flushLog: AuditLogEntry;
  backups: StockBackup[];
  flushMeta: FlushMeta;
}

/**
 * Single atomic multi-path Firebase RTDB flush so all operational & master records
 * are wiped simultaneously and stamped with flushMeta to prevent stale tab/device resurrection.
 */
export async function atomicFlushWorkspaceInFirebase(payload: AtomicFlushPayload): Promise<void> {
  const {
    tenantId,
    isMasterTenant,
    cleanSite,
    cleanUser,
    cleanConfig,
    cleanProjectTypes,
    flushLog,
    backups,
    flushMeta,
  } = payload;

  const updates: Record<string, unknown> = {
    [`tenantsData/${tenantId}/sites`]: [sanitizeData(cleanSite)],
    [`tenantsData/${tenantId}/users`]: [sanitizeData(cleanUser)],
    [`tenantsData/${tenantId}/config`]: sanitizeData(cleanConfig),
    [`tenantsData/${tenantId}/projectTypes`]: sanitizeData(cleanProjectTypes),
    [`tenantsData/${tenantId}/auditLogs`]: [sanitizeData(flushLog)],
    [`tenantsData/${tenantId}/backups`]: sanitizeData(backups),
    [`tenantsData/${tenantId}/flushMeta`]: sanitizeData(flushMeta),
    [`tenantsData/${tenantId}/items`]: null,
    [`tenantsData/${tenantId}/teams`]: null,
    [`tenantsData/${tenantId}/projects`]: null,
    [`tenantsData/${tenantId}/mainStockEntries`]: null,
    [`tenantsData/${tenantId}/stockRequests`]: null,
    [`tenantsData/${tenantId}/teamIssues`]: null,
    [`tenantsData/${tenantId}/teamReturns`]: null,
    [`tenantsData/${tenantId}/projectUsages`]: null,
    [`tenantsData/${tenantId}/crossProjectRequests`]: null,
    [`tenantsData/${tenantId}/clientFreeIssues`]: null,
    [`tenantsData/${tenantId}/branchReturns`]: null,
    [`tenantsData/${tenantId}/damagedRestorations`]: null,
    [`tenantsData/${tenantId}/suppliers`]: null,
    [`tenantsData/${tenantId}/clients`]: null,
    [`tenantsData/${tenantId}/purchaseOrders`]: null,
    [`tenantsData/${tenantId}/supplierReturns`]: null,
  };

  if (isMasterTenant) {
    updates['sites'] = [sanitizeData(cleanSite)];
    updates['users'] = [sanitizeData(cleanUser)];
    updates['config'] = sanitizeData(cleanConfig);
    updates['projectTypes'] = sanitizeData(cleanProjectTypes);
    updates['auditLogs'] = [sanitizeData(flushLog)];
    updates['backups'] = sanitizeData(backups);
    updates['flushMeta'] = sanitizeData(flushMeta);
    updates['items'] = null;
    updates['teams'] = null;
    updates['projects'] = null;
    updates['mainStockEntries'] = null;
    updates['stockRequests'] = null;
    updates['teamIssues'] = null;
    updates['teamReturns'] = null;
    updates['projectUsages'] = null;
    updates['crossProjectRequests'] = null;
    updates['clientFreeIssues'] = null;
    updates['branchReturns'] = null;
    updates['damagedRestorations'] = null;
    updates['suppliers'] = null;
    updates['clients'] = null;
    updates['purchaseOrders'] = null;
    updates['supplierReturns'] = null;
  }

  await update(ref(rtdb), updates);
}

/**
 * Clears flushMeta barrier when an administrator intentionally restores a historical backup snapshot.
 */
export async function clearFlushMetaInFirebase(
  tenantId: string,
  isMasterTenant: boolean
): Promise<void> {
  try {
    const updates: Record<string, unknown> = {
      [`tenantsData/${tenantId}/flushMeta`]: null,
    };
    if (isMasterTenant) {
      updates['flushMeta'] = null;
    }
    await update(ref(rtdb), updates);
  } catch (err) {
    console.warn('Failed clearing flushMeta in Firebase:', err);
  }
}

export function subscribeToFirebaseFlushMeta(
  onData: (meta: FlushMeta | null) => void,
  onError?: (err: Error) => void
): () => void {
  const flushRef = ref(rtdb, 'flushMeta');
  const unsubscribe = onValue(
    flushRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val && typeof val === 'object' && 'flushedAtMs' in val) {
        onData(val as FlushMeta);
      } else {
        onData(null);
      }
    },
    (error) => {
      console.warn('Firebase flushMeta subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

/**
 * Realtime sync listeners for Multi-Tenant Accounts
 */
export function subscribeToFirebaseTenants(
  onData: (tenants: Tenant[]) => void,
  onError?: (err: Error) => void
): () => void {
  const tenantsRef = ref(rtdb, 'saasTenants');
  const unsubscribe = onValue(
    tenantsRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const normalized = normalizeFirebaseList<Tenant>(val);
        onData(normalized);
      }
    },
    (error) => {
      console.warn('Firebase saasTenants subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeTenantsToFirebase(tenants: Tenant[]): Promise<void> {
  try {
    const cleanTenants = sanitizeData(tenants);
    const updates: Record<string, unknown> = {
      saasTenants: cleanTenants,
      'tenantsData/tenant-apex-main/tenants': cleanTenants,
    };
    await update(ref(rtdb), updates);
  } catch (err) {
    console.error('Failed to write saasTenants to Firebase:', err);
    throw err;
  }
}

export async function fetchTenantsFromFirebase(): Promise<Tenant[]> {
  try {
    const snap = await get(ref(rtdb, 'saasTenants'));
    if (snap.exists()) {
      const val = snap.val();
      const list = normalizeFirebaseList<Tenant>(val);
      if (list.length > 0) return list;
    }
    const fallbackSnap = await get(ref(rtdb, 'tenantsData/tenant-apex-main/tenants'));
    if (fallbackSnap.exists()) {
      return normalizeFirebaseList<Tenant>(fallbackSnap.val());
    }
    return [];
  } catch (err) {
    console.warn('Failed to fetch saasTenants from Firebase:', err);
    return [];
  }
}

export function subscribeToFirebaseDeletedTenants(
  onData: (deletedMap: Record<string, number>) => void,
  onError?: (err: Error) => void
): () => void {
  const deletedRef = ref(rtdb, 'saasDeletedTenants');
  const unsubscribe = onValue(
    deletedRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        onData(val as Record<string, number>);
      } else {
        onData({});
      }
    },
    (error) => {
      console.warn('Firebase saasDeletedTenants subscription error:', error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function deleteTenantInFirebase(
  tenantId: string,
  updatedTenants: Tenant[]
): Promise<void> {
  try {
    if (!tenantId || tenantId === 'tenant-apex-main') return;
    const cleanTenants = sanitizeData(updatedTenants);
    const updates: Record<string, unknown> = {
      saasTenants: cleanTenants,
      'tenantsData/tenant-apex-main/tenants': cleanTenants,
      [`saasDeletedTenants/${tenantId}`]: Date.now(),
      [`tenantsData/${tenantId}`]: null,
    };
    await update(ref(rtdb), updates);
  } catch (err) {
    console.error(`Failed to atomically delete tenant ${tenantId} from Firebase:`, err);
    throw err;
  }
}

/**
 * Realtime sync functions for Tenant-specific Data (Users, Sites, Items, Teams, Config, etc.)
 */
export function subscribeToFirebaseTenantData<T>(
  tenantId: string,
  key: string,
  onData: (data: T) => void,
  onError?: (err: Error) => void
): () => void {
  if (!tenantId) return () => {};
  const dataRef = ref(rtdb, `tenantsData/${tenantId}/${key}`);
  const unsubscribe = onValue(
    dataRef,
    (snapshot: DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        if (Array.isArray(val) || (typeof val === 'object' && val !== null && !('companyName' in val))) {
          onData(normalizeFirebaseList<any>(val) as T);
        } else {
          onData(val as T);
        }
      }
    },
    (error) => {
      console.warn(`Firebase tenant ${tenantId}/${key} subscription error:`, error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

export async function writeTenantDataToFirebase<T>(
  tenantId: string,
  key: string,
  data: T
): Promise<void> {
  try {
    if (!tenantId) return;
    const dataRef = ref(rtdb, `tenantsData/${tenantId}/${key}`);
    await set(dataRef, sanitizeData(data));
  } catch (err) {
    console.error(`Failed to write ${key} for tenant ${tenantId} to Firebase:`, err);
  }
}

export async function fetchTenantDataFromFirebase<T>(
  tenantId: string,
  key: string
): Promise<T | null> {
  try {
    if (!tenantId) return null;
    const dataRef = ref(rtdb, `tenantsData/${tenantId}/${key}`);
    const snapshot = await get(dataRef);
    if (snapshot.exists()) {
      const val = snapshot.val();
      if (Array.isArray(val) || (typeof val === 'object' && val !== null && !('companyName' in val))) {
        return normalizeFirebaseList<any>(val) as T;
      }
      return val as T;
    }
    return null;
  } catch (err) {
    console.warn(`Failed to fetch ${key} for tenant ${tenantId} from Firebase:`, err);
    return null;
  }
}
