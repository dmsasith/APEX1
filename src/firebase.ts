import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  set,
  get,
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
  ProjectMaterialUsage,
  BranchReturn,
  StockBackup,
  LetterheadTemplate,
  DigitalSignature,
} from './types';

// Web app's Firebase configuration provided by the user
export const firebaseConfig = {
  apiKey: "AIzaSyApU0FcmTmk4qEwc235f11ZZRrjMt-P1gM",
  authDomain: "stock-management-system-61c6f.firebaseapp.com",
  databaseURL: "https://stock-management-system-61c6f-default-rtdb.firebaseio.com",
  projectId: "stock-management-system-61c6f",
  storageBucket: "stock-management-system-61c6f.firebasestorage.app",
  messagingSenderId: "576165978947",
  appId: "1:576165978947:web:d79ebf390256ecd244c5f6"
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
    await Promise.all([
      set(ref(rtdb, 'items'), []),
      set(ref(rtdb, 'mainStockEntries'), []),
      set(ref(rtdb, 'stockRequests'), []),
      set(ref(rtdb, 'teamIssues'), []),
      set(ref(rtdb, 'teamReturns'), []),
      set(ref(rtdb, 'projectUsages'), []),
      set(ref(rtdb, 'branchReturns'), []),
      set(ref(rtdb, 'projects'), []),
      set(ref(rtdb, 'teams'), []),
      set(ref(rtdb, 'sites'), [sanitizeData(cleanSite)]),
      set(ref(rtdb, 'users'), [sanitizeData(cleanUser)]),
      set(ref(rtdb, 'config'), sanitizeData(cleanConfig)),
      set(ref(rtdb, 'auditLogs'), [sanitizeData(initialAuditLog)]),
    ]);
  } catch (err) {
    console.error('Failed to clear Firebase data:', err);
    throw err;
  }
}
