import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  resolveSmartSystemSupportAnswer,
  SupportWorkspaceContext,
} from '../src/utils/supportKnowledgeEngine';

interface SessionTokenPayload {
  sub: string;
  scope: 'master' | 'workspace';
  tenantId: string;
  exp: number;
}

interface CacheEntry {
  reply: string;
  suggestedTab?: string;
  modelUsed: string;
  timestamp: number;
}

function resolveSessionSigningSecret(): string {
  const explicit = (process.env.SESSION_SECRET || '').trim();
  if (explicit) return explicit;
  const masterPass = (process.env.MASTER_ADMIN_PASSCODE || '').trim();
  if (masterPass) {
    return crypto.createHmac('sha256', 'apex-session-key-v1').update(masterPass).digest('hex');
  }
  return crypto.randomBytes(32).toString('hex');
}

export function createApiApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '10mb' }));

  const SESSION_SIGNING_SECRET = resolveSessionSigningSecret();

  // Security Response Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production' || req.secure) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // Reject cross-origin state-changing API calls (no wildcard CORS)
  app.use('/api', (req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const originHeader = req.get('origin');
      if (originHeader) {
        try {
          const originHost = new URL(originHeader).host.toLowerCase();
          const forwardedHost = (req.get('x-forwarded-host') || req.get('host') || '')
            .split(',')[0]
            .trim()
            .toLowerCase();
          let appUrlHost = '';
          if (process.env.APP_URL) {
            try {
              appUrlHost = new URL(process.env.APP_URL).host.toLowerCase();
            } catch {
              appUrlHost = '';
            }
          }
          const vercelHost = (process.env.VERCEL_URL || '').trim().toLowerCase();
          const allowedHosts = [forwardedHost, appUrlHost, vercelHost].filter(Boolean);
          if (allowedHosts.length > 0 && !allowedHosts.includes(originHost)) {
            res.status(403).json({ error: 'Cross-origin request blocked.' });
            return;
          }
        } catch {
          res.status(403).json({ error: 'Invalid Origin header.' });
          return;
        }
      }
    }
    next();
  });

  function signSessionToken(payload: Omit<SessionTokenPayload, 'exp'>, ttlMs = 24 * 60 * 60 * 1000): string {
    const fullPayload: SessionTokenPayload = {
      ...payload,
      exp: Date.now() + ttlMs,
    };
    const encoded = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
    const sig = crypto.createHmac('sha256', SESSION_SIGNING_SECRET).update(encoded).digest('base64url');
    return `${encoded}.${sig}`;
  }

  function verifySessionToken(token: string | undefined): SessionTokenPayload | null {
    if (!token || typeof token !== 'string') return null;
    const parts = token.trim().split('.');
    if (parts.length !== 2) return null;
    const [encoded, providedSig] = parts;
    if (!encoded || !providedSig) return null;
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SIGNING_SECRET)
      .update(encoded)
      .digest('base64url');
    const a = Buffer.from(providedSig, 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
      const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionTokenPayload;
      if (!parsed || typeof parsed.exp !== 'number' || Date.now() > parsed.exp) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function extractBearerToken(req: express.Request): string | undefined {
    const auth = req.get('authorization');
    if (!auth || !auth.toLowerCase().startsWith('bearer ')) return undefined;
    return auth.slice(7).trim();
  }

  // Server-side Master Admin passcode (env MASTER_ADMIN_PASSCODE overrides first-run scrypt claim)
  let claimedMasterHash: string | null = null;

  function hashScryptPasscode(plain: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
    return `${salt}:${derived}`;
  }

  function verifyScryptPasscode(plain: string, storedHash: string): boolean {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, expectedHex] = parts;
    if (!salt || !expectedHex) return false;
    const actualBuf = crypto.scryptSync(plain, salt, 64);
    const expectedBuf = Buffer.from(expectedHex, 'hex');
    return actualBuf.length === expectedBuf.length && crypto.timingSafeEqual(actualBuf, expectedBuf);
  }

  function verifyEnvPasscode(plain: string, envPasscode: string): boolean {
    const a = crypto.createHash('sha256').update(plain).digest();
    const b = crypto.createHash('sha256').update(envPasscode).digest();
    return crypto.timingSafeEqual(a, b);
  }

  const authAttemptMap = new Map<string, { failures: number; windowStart: number }>();
  function checkAuthRateLimit(ip: string): boolean {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const rec = authAttemptMap.get(ip);
    if (!rec || now - rec.windowStart > windowMs) {
      return true;
    }
    return rec.failures < 12;
  }
  function recordAuthFailure(ip: string) {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const rec = authAttemptMap.get(ip);
    if (!rec || now - rec.windowStart > windowMs) {
      authAttemptMap.set(ip, { failures: 1, windowStart: now });
    } else {
      rec.failures += 1;
    }
  }
  function clearAuthFailures(ip: string) {
    authAttemptMap.delete(ip);
  }

  app.get('/api/auth/master/status', (_req, res) => {
    const envPasscode = (process.env.MASTER_ADMIN_PASSCODE || '').trim();
    if (envPasscode) {
      res.json({ configured: true, source: 'env' });
      return;
    }
    if (claimedMasterHash) {
      res.json({ configured: true, source: 'claimed' });
      return;
    }
    res.json({ configured: false, source: 'unset' });
  });

  app.post('/api/auth/master/claim', (req, res) => {
    const envPasscode = (process.env.MASTER_ADMIN_PASSCODE || '').trim();
    if (envPasscode || claimedMasterHash) {
      res.status(409).json({
        success: false,
        message: 'Master Admin passcode is already configured and locked.',
      });
      return;
    }
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
    if (passcode.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Master Admin passcode must be at least 8 characters long.',
      });
      return;
    }
    claimedMasterHash = hashScryptPasscode(passcode);
    const token = signSessionToken({ sub: 'usr-admin-1', scope: 'master', tenantId: 'tenant-apex-main' });
    res.json({
      success: true,
      token,
      message: 'Master Admin security passcode claimed and hashed on server.',
    });
  });

  app.post('/api/auth/master/verify', (req, res) => {
    const ip = String(req.ip || 'unknown');
    if (!checkAuthRateLimit(ip)) {
      res.status(429).json({
        valid: false,
        message: 'Too many failed authentication attempts. Please wait 15 minutes and try again.',
      });
      return;
    }

    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
    if (!passcode) {
      res.status(400).json({ valid: false, message: 'Passcode is required.' });
      return;
    }

    const envPasscode = (process.env.MASTER_ADMIN_PASSCODE || '').trim();
    if (!envPasscode && !claimedMasterHash) {
      res.status(409).json({
        valid: false,
        needsSetup: true,
        message: 'Master Admin passcode has not been configured yet. Please complete first-run setup.',
      });
      return;
    }

    const isMatch = envPasscode
      ? verifyEnvPasscode(passcode, envPasscode)
      : verifyScryptPasscode(passcode, claimedMasterHash!);

    if (!isMatch) {
      recordAuthFailure(ip);
      res.status(401).json({ valid: false, message: 'Invalid Master Admin credentials.' });
      return;
    }

    clearAuthFailures(ip);
    const token = signSessionToken({ sub: 'usr-admin-1', scope: 'master', tenantId: 'tenant-apex-main' });
    res.json({ valid: true, token });
  });

  app.post('/api/auth/workspace-session', (req, res) => {
    const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
    const tenantId = typeof req.body?.tenantId === 'string' ? req.body.tenantId.trim() : '';
    if (!userId || !tenantId || userId === 'usr-admin-1') {
      res.status(400).json({ error: 'Valid non-master workspace userId and tenantId are required.' });
      return;
    }
    const token = signSessionToken({ sub: userId, scope: 'workspace', tenantId });
    res.json({ token });
  });

  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  const SYSTEM_KNOWLEDGE_PROMPT = `You are the official Chat System Support Assistant for the "Apex Stock & Site Management System" (Enterprise Warehouse, Branch Yard, Field Team Dispatch, Project & New Section Registry, and Material Usage ERP).

Your job is to help system users solve problems, understand every feature and workflow inside the system, and troubleshoot issues clearly, accurately, and politely.

LANGUAGE RULES:
1. If LanguagePreference is "en" (English Section) and the user writes in English:
   - Reply 100% in clear, structured English. Do NOT include any Sinhala words.
2. If LanguagePreference is "si" (Sinhala Section) OR if the user writes in Sinhala script or Singlish (e.g., "kohomada aluth project section ekak hadala template hadanne"):
   - Reply clearly in natural, easy-to-understand Sinhala (keeping exact English menu/button names in quotes so they can find them on screen).
3. Keep answers structured with numbered steps (1, 2, 3) and mention the exact sidebar menu names and button labels.

COMPLETE SYSTEM FEATURES & WORKFLOW GUIDE:
1. **Master Registrations ("Master Registrations" -> Items, Sites/Branches, Field Teams, Suppliers, Clients, Users)**:
   - **Items ("Item Catalog" & "Plant & Equipment") + Optional Item Photo (<200KB Auto-Compression) & "Print with Image"**: Register Materials (consumables) or Machinery (Plant & Equipment) with Item Code, Barcode, Unit, Unit Price, Low Stock Threshold, optional Project Reservation, and optional **Item Photo** (automatically resized and compressed to **under 200KB**). When printing any voucher or report, users can toggle the **"Print with Image"** checkbox in the print toolbar to include item thumbnail images. Supports Excel Import (Sync, Append, Replace), Excel Export, Barcode Sticker printing, USB HID Barcode Scanner, and Mobile Camera Barcode Scanner ("Scan Now").
   - **Sites / Branches**: Register Central Main Warehouse (HQ) and Operational Branch Yards, link a designated Branch Supervisor user, and assign system users.
   - **Field Teams, Team Name Lock After Stock Issue & Conflict-Free Site Transfer Workflow ("Temporary Assigned to - [New Site]" vs. Permanent "(Ref: [Previous Site])")**:
     1) Register field work squads with Team Name, Team Leader Name & NIC/ID, Assigned Site Base, Contact Phone, and individual **Team Members** (Crew Size auto-calculates as 1 Leader + N Members).
     2) **Team Name Lock After Stock Issue**: Once a team has received any stock item, its **Team Name** is locked against renaming to preserve historical voucher and audit integrity (while Team Leader, Phone, and Members remain editable).
     3) **Transferring a Team ("Transfer / Site History")**: When transferring a team to a new Site Branch, whether they still have unreturned stock on their current site or zero stock, the assignment starts in a **Temporary** state displayed as **"Temporary Assigned to - [New Site Name]"**.
     4) **Promotion to Permanent with Prior-Site Reference**: Once previous-site stock is returned/cleared (or when Branch Admin / System Admin clicks **"Confirm / Promote to Permanent"** for a team that had zero stock on the old site), the assignment promotes to **Permanent** and updates the displayed team name with a prior-site reference: **"[Team Name] (Ref: [Previous Site Name])"**.
     5) **Complete Assigned Sites History**: Inside **Transfer / Site History**, users can view all past and current assigned sites for that team, showing **Temporary** vs. **Permanent**, **Reference Site (Ref:)**, assignment dates, and **Stock Cleared / Stock Pending** status.
   - **Suppliers & Clients**: Register Suppliers (for Purchase Orders & Debit Notes) and Clients/Principals (for Projects & Client Free Issue Stock).
   - **User Management ("User Management")**: Create logins with Username, Password, Full Name, Role ("Super Admin Central", "All Site Branch Admin", "Branch Admin", "Branch System User"), and single or multi-branch assignment.

2. **Main Central Stock ("Main Central Stock"), Supplier Orders ("Supplier Orders (PO)"), & Client Free Stock ("Client Free Stock (FOC)")**:
   - **Main Central Stock & Item Lifecycle Summary**: Add stock via **"+ Add Stock (GRN)"** (Purchase or Manual Entry), perform **Direct Transfer to Site**, or manage the **Damaged Stock Ledger & Restoration**. Clicking any item row (or **"Summary"**) in **Main Central Stock** opens a complete **End-to-End Material Lifecycle & Custody Summary** right below the item (showing PO/GRN/Manual/FOC inbound sources, Site Branch distribution & Site In-Hand, Field Team distribution & Team In-Hand, Project Used/Wastage, Central Stock In-Hand, and **"Print A4 Summary"** / **"Download PDF"**).
   - **Supplier Orders (PO)**: Create Purchase Orders (**item dropdowns show Item Images alongside Item Code and Material Name**), receive Full or Partial batch GRNs against POs into Main Stock, close PO remainders, create **Supplier Returns (RTV)** for defective goods, dispatch with Gate Pass & vehicle details, print official **Debit Notes**, and record supplier settlements (Replacement, Credit Note, Refund).
   - **Client Free Stock (FOC) — Standard 5-Stage Reconciliation Flow, Color-Coded Project Cards, Individual & Full Reports, and "ALL AREAS" Branch Support**:
     1) Open **"Client Free Stock (FOC)"** and click **"+ Log Client Free Stock"**. Choose Target Project Mode (**"🏢 Under Main Project"**, **"Main Project (For New Connections)"**, or **"📄 Individual Project"**). Selecting a project automatically **LOCKS** the **"Allocated Site Branch"** — unless the project is registered under **"🌐 ALL AREAS (All Site Branches)"**, which allows any site branch to request and consume its FOC stock.
     2) **Standard 5-Stage FOC Reconciliation Flow**: All Client FOC summaries and reconciliation reports follow a clear chronological order: **(1) Initial FOC Receipt at Central -> (2) Site Issue -> (3) Team Issue -> (4) Usage & Wastage -> (5) Balance / Returnable Stock on Project Completion**.
     3) **Main Project & Sub-Project Flow + Color-Coded Cards**: Selecting a **Sub-Project** shows that Sub-Project's dedicated Usage Flow. Selecting a **Main Project** displays **distinct color-coded Main Project cards**, followed by each linked **Sub-Project (e.g., KT-RGL-0505, KT-ABK-0506)** in its own flow section below, and concludes at the bottom with a **Full Usage & Client Completion Returnable Balance Report**.
     4) **Central FOC Individual & Consolidated A4/PDF Reports + Admin Reassignment**: From Central Stock / Client Free Stock, users can generate clean printable reports both **per individual issued item** AND as **one full consolidated report for all items in a project**. Admins can also edit and reassign mis-logged FOC vouchers anytime.

3. **Stock Requisitions ("Stock Requisitions") & Site Branch Stock ("Site Branch Stock")**:
   - **How a Branch gets items from Main Stock**:
     1) Open **"Stock Requisitions"** -> click **"+ New Stock Requirement Form"** -> select Requesting Site Branch and switch between **Tab 1 ("1. Normal Stock Request")** or **Tab 2 ("2. Client Free Stock for Assigned Project Request")** — Tab 2 displays projects assigned to that Site Branch PLUS any **"🌐 ALL AREAS (All Site Branches)"** island-wide projects.
     2) HQ Super Admin / Storekeeper clicks **"Approve & Dispatch"**. Branch Admin / Supervisor clicks **"Confirm Receipt (GRN)"** to add the items into **"Site Branch Stock"**.
   - **Site Branch Stock "Central FOC" Badge & 5-Stage Forward Traceability Summary**: Inside **Site Branch Stock**, stock received from Central FOC is clearly highlighted with a distinct **"🎁 Central FOC"** badge/tag and color highlight so branch staff immediately distinguish Central FOC items from normal stock. Clicking any item row (or **"Forward Summary"**) expands its forward reconciliation flow (Transfers Received Normal vs. Central FOC -> Site Issues to Teams -> Usage & Wastage -> Site & Team In-Hand Balance) with **"Print A4 Summary"** and **"Download PDF"**.

4. **Issue to Field Teams ("Issue to Teams"), Site-Separated Team In-Hand ("Team In-Hand Stock"), & Branch Directory ("Branch Staff & Teams")**:
   - **Issue to Teams**: Select Branch Yard and Field Team -> pick items from available Site Branch Stock -> click **"Issue Material to Team"** and print the **Gate Pass / Issue Voucher**.
   - **Site-Separated Team In-Hand Stock ("Stock to Return - [Previous Site Name]")**:
     In **"Team In-Hand Stock"**, stock held by transferred teams is **NEVER combined or summed across sites**:
     • Any unreturned balance from a previous site is displayed separately in an amber section titled **"Stock to Return - [Previous Site Name]"** — those items must be returned to that previous site and cannot be used on the new site.
     • Stock issued at the team's new site is displayed separately under **"[Current Site Name] — Active Site Stock"**.
   - **Branch Staff & Teams**: Organizational directory showing every branch, supervisor, system staff, field teams, and verified team members with NIC numbers. Supports **Export Members (Excel)** and **Print Directory Report**.

5. **Project & New Section Registry ("Project & New Section Registry") — "Main Project -> Under New Connections", "ALL AREAS" Branch, Templates (Telecom, Water, Electric, Solar) & "+ Add Field"**:
   - **International Industry Section Templates (1-Click Auto-Load) & "+ Add Field" Custom Field Builder**:
     1) Open **"Project & New Section Registry"** -> **"New Section Registry & Material Templates"** tab and click **"+ Add New Section"** (or click the 1-click Quick-Load buttons) for **Telecom New Connection (ITU-T G.984)**, **Water Supply (ISO 4064)**, **Electrical Power (IEC 60364)**, **Solar PV (IEC 62446)**, or **Standard EPC Project**, plus unlimited **"+ Add Field"** custom fields and **Default Material Template (BOM)**.
   - **"Main Project -> Under New Connections" Across All 4 Utility Sections & "ALL AREAS" Branch Option**:
     1) In **Telecom, Water, Electrical, and Solar New Connection** sections, projects can be registered in 3 modes: **Standalone New Connection**, **🏢 Main Project (For New Connections)** (umbrella project receiving bulk Client FOC), or **↳ Under Main Project (New Connection)**.
     2) When registering any project, users select a specific **Assigned Site Branch *** OR choose **"🌐 ALL AREAS (All Site Branches)"** for multi-site / island-wide projects so **any Site Branch** can request its Client FOC and log daily usage without branch locks.

6. **Material Usage / Daily Progress Entry ("Material Usage / Daily Progress Entry")**:
   - **Strict Active-Site-Only vs. "ALL AREAS" Stock Usage Rule**: A team can only consume materials issued under the project's own Site Branch — unless the project or its Parent Main Project is assigned to **"🌐 ALL AREAS"**, in which case any site branch's field teams can log usage. Unreturned stock from a previous site (**"Stock to Return - [Previous Site Name]"**) is always excluded on a new site.
   - **Connection & Utility Sections (Telecom, Water, Electric, Solar) — Simple 1, 2, 3 Workflow & Section-Filtered FOC**:
     1) **Step 1 — Team & Area Selection (Locked Until Refresh)**: Select Site Branch, Field Team, and Working Area at the top and click **"Confirm & Lock Team / Area"**.
     2) **Step 2 — Select Connection or "+ Register New Connection" + Smart Section-Filtered FOC**: When linking a New Connection to a Main Project FOC pool, FOC dropdowns **ONLY appear if Client FOC stock exists AND filter strictly to Main Projects registered under the active section** (Telecom NC only shows Telecom NC FOC Main Projects, Water only shows Water FOC Main Projects, etc., keeping normal Company Stock workflows clean).
     3) **Step 3 — Material Usage**: Enter **Qty Used** + **Wastage Qty** (auto-deducts from Parent Main Project FOC pool).
   - **Full Site Reports & Reconciliation**: In **Usage Vouchers History**, select any project and click **"Full Report for This Site (Project)"** for **Part 1 (Team-by-Team Subtotals)** and **Part 2 (Consolidated Grand Total)**.

7. **Multi-Item Batch Returns in Team Returns ("Team Returns") & Branch Returns ("Branch Returns")**:
   - **Team Returns (RV) & Branch Returns (BRM) with Item Photos in Dropdowns**: Item thumbnail images display inside return item dropdowns. Users can add **multiple items at once** (**"+ Add Item"**, **"+ Add All Held / Available"**, or barcode scan), set per-item quantity and condition (**Good** / **Damaged**), and submit the entire batch on a single **RV** or **BRM** voucher.

8. **Document Templates ("Document Templates"), Admin Password Delete Protection & Enterprise Controls**:
   - **Document Templates (3 Tabs)**:
     • **Tab 1 ("1. Section Formats")**: ISO 9001:2015 Controlled Formats (**FORMAT-01** to **FORMAT-04**) with auto-populated Tenant Company Header, optional **PDF/Image Format Upload (limited to max 1MB file size)**, 1-click Format-01/02 unification, and Live A4 Studio settings.
     • **Tab 2 ("2. Auto Tenant Header & Signers")**: Company Logo & **ISO Signer Names, Designations & Department Matrix** (**Prepared & Checked By**, **Authorized & Approved By**, **Reviewed By**).
     • **Tab 3 ("3. Digital Signatures")**: Draw on the interactive signature pad or upload a PNG/JPG signature image; auto-matches signers on vouchers and supports isolated single-click A4 printing (with **"Print with Image"** option).
   - **Mandatory Admin Password Verification for Any Deletion**: Deleting any record or transaction across the entire system requires entering the **Admin Password** in the confirmation modal (never deletes on a simple click).
   - **Audit Trail & Recycle Bin**: Filterable chronological history with isolated A4 Print & CSV export; restore or permanently delete soft-deleted records.
   - **Automatic Email Verification & Support**: Clicking **"Send Verification Email"** sends a Firebase link from **apexstox.com**; clicking the email link verifies the account automatically. Official domain: **apexstox.com** | Support email: **support@apexstox.com**.
   - **System Backups & Config (Top Header)**: Create/restore backups, open the **Offline Backup Viewer**, run **Admin System Flush**, change theme/company settings, or use **Admin View-As Mode**.`;

  const responseCache = new Map<string, CacheEntry>();
  const MAX_CACHE_ENTRIES = 300;
  const CACHE_TTL_MS = 30 * 60 * 1000;

  function getNormalizedCacheKey(message: string, langPref: string, currentTab: string, userRole: string): string {
    const cleanMsg = message.trim().toLowerCase().replace(/\s+/g, ' ');
    return `${langPref}|${userRole}|${currentTab}|${cleanMsg}`;
  }

  function getCachedResponse(key: string): CacheEntry | null {
    const entry = responseCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      responseCache.delete(key);
      return null;
    }
    return entry;
  }

  function setCachedResponse(key: string, entry: CacheEntry) {
    if (responseCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = responseCache.keys().next().value;
      if (oldestKey) responseCache.delete(oldestKey);
    }
    responseCache.set(key, entry);
  }

  const inFlightRequests = new Map<string, Promise<{ reply: string; suggestedTab?: string; modelUsed: string }>>();
  let activeAiCalls = 0;
  const HIGH_LOAD_THRESHOLD = 4;

  const clientBurstMap = new Map<string, { count: number; windowStart: number }>();
  function checkClientFairRate(clientId: string): boolean {
    const now = Date.now();
    const windowMs = 10_000;
    const maxPerWindow = 12;
    const record = clientBurstMap.get(clientId);
    if (!record || now - record.windowStart > windowMs) {
      clientBurstMap.set(clientId, { count: 1, windowStart: now });
      return true;
    }
    if (record.count >= maxPerWindow) {
      return false;
    }
    record.count += 1;
    return true;
  }

  function detectSuggestedModule(text: string): string | undefined {
    const lower = text.toLowerCase();
    if (
      lower.includes('format setting') ||
      lower.includes('document template') ||
      lower.includes('letterhead') ||
      lower.includes('digital signature') ||
      lower.includes('signature') ||
      lower.includes('signer') ||
      lower.includes('iso 9001') ||
      lower.includes('section format')
    ) {
      return 'templates';
    }
    if (
      lower.includes('stock to return') ||
      lower.includes('temporary assigned') ||
      lower.includes('team transfer') ||
      lower.includes('transfer team') ||
      lower.includes('team in-hand') ||
      lower.includes('team inhand')
    ) {
      return 'team-stock';
    }
    if (
      lower.includes('section registry') ||
      lower.includes('project section') ||
      lower.includes('material template') ||
      lower.includes('bom') ||
      lower.includes('register project') ||
      lower.includes('project registry') ||
      lower.includes('main project') ||
      lower.includes('major project') ||
      lower.includes('sub project') ||
      lower.includes('sub-project') ||
      lower.includes('individual project')
    ) {
      return 'projects';
    }
    if (
      lower.includes('material usage') ||
      lower.includes('daily progress') ||
      lower.includes('project usage') ||
      lower.includes('wastage') ||
      lower.includes('full report') ||
      lower.includes('full site') ||
      lower.includes('usage vouchers') ||
      lower.includes('reconciliation') ||
      lower.includes('reconcile') ||
      lower.includes('boq')
    ) {
      return 'project-usage';
    }
    if (lower.includes('client free') || lower.includes('free stock') || lower.includes('foc')) return 'client-free-stock';
    if (lower.includes('transfer') || lower.includes('request') || lower.includes('requisition')) return 'requests';
    if (lower.includes('grn') || lower.includes('main stock') || lower.includes('main central stock')) return 'main-stock';
    if (lower.includes('supplier') || lower.includes('purchase order') || lower.includes('debit note')) return 'procurement';
    if (lower.includes('issue to team') || lower.includes('dispatch')) return 'dispatch';
    if (lower.includes('team return')) return 'returns';
    if (lower.includes('branch return')) return 'branch-returns';
    if (lower.includes('user') || lower.includes('login') || lower.includes('password') || lower.includes('role')) return 'manage-users';
    if (lower.includes('team')) return 'teams';
    if (lower.includes('site') || lower.includes('branch')) return 'site-stock';
    if (lower.includes('recycle') || lower.includes('delete')) return 'recycle-bin';
    if (lower.includes('item') || lower.includes('barcode') || lower.includes('excel') || lower.includes('print with image')) return 'items';
    return undefined;
  }

  async function queryGeminiWithFallback(
    userMessage: string,
    history: Array<{ role: 'user' | 'model'; text: string }>,
    context: SupportWorkspaceContext
  ): Promise<{ reply: string; suggestedTab?: string; modelUsed: string }> {
    const ai = getAiClient();
    if (!ai) {
      const localAns = resolveSmartSystemSupportAnswer(userMessage, context);
      return { ...localAns, modelUsed: 'system-expert-kb' };
    }

    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
    const contextLine = `\n[Current Live User Context: User="${context.userName || 'User'}", Role="${context.userRole || 'Staff'}", ActiveScreen="${context.currentTab || 'dashboard'}", AssignedBranch="${context.branchName || 'All Branches'}", LanguagePreference="${context.language || 'en'}", ActiveItems=${context.activeItemsCount ?? 0}, LowStockItems=${context.lowStockItemsCount ?? 0}, ActiveBranches=${context.activeSitesCount ?? 0}, ActiveTeams=${context.activeTeamsCount ?? 0}, ActiveProjects=${context.activeProjectsCount ?? 0}, ActiveProjectSections=${context.activeProjectSectionsCount ?? 0}, PendingRequests=${context.pendingRequestsCount ?? 0}]`;

    const conversationTranscript = recentHistory
      .map((m) => `${m.role === 'user' ? 'User' : 'Support Agent'}: ${m.text}`)
      .join('\n');

    const fullPrompt = `${contextLine}\n${
      conversationTranscript ? `Recent Chat:\n${conversationTranscript}\n\n` : ''
    }User Question: ${userMessage}`;

    const primaryModel = activeAiCalls >= HIGH_LOAD_THRESHOLD ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';
    const fallbackModel = primaryModel === 'gemini-4-hydrogen' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';
    const modelsToTry = [primaryModel, fallbackModel];

    activeAiCalls += 1;
    try {
      for (let i = 0; i < modelsToTry.length; i++) {
        const modelName = modelsToTry[i];
        try {
          const configObj: Record<string, unknown> = {
            systemInstruction: SYSTEM_KNOWLEDGE_PROMPT,
          };
          if (modelName === 'gemini-4-hydrogen') {
            configObj.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
          }

          const response = await ai.models.generateContent({
            model: modelName,
            contents: fullPrompt,
            config: configObj,
          });

          const replyText = (response.text || '').trim();
          if (replyText) {
            return {
              reply: replyText,
              suggestedTab: detectSuggestedModule(`${userMessage} ${replyText}`),
              modelUsed: modelName,
            };
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn(`[Chat System Support] Model ${modelName} attempt failed:`, errMsg);
          if (i < modelsToTry.length - 1) {
            await new Promise((r) => setTimeout(r, 200));
          }
        }
      }
    } finally {
      activeAiCalls = Math.max(0, activeAiCalls - 1);
    }

    const localAns = resolveSmartSystemSupportAnswer(userMessage, context);
    return { ...localAns, modelUsed: 'system-expert-kb' };
  }

  app.post('/api/support-chat', async (req, res) => {
    try {
      const bearer = extractBearerToken(req);
      const session = verifySessionToken(bearer);
      if (!session) {
        res.status(401).json({ error: 'Authentication session required.' });
        return;
      }

      const { message, history = [], context = {}, clientId = 'anon' } = req.body || {};

      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ error: 'Message is required.' });
        return;
      }

      const trimmedMessage = message.trim().slice(0, 1200);
      const ipOrClient = `${session.tenantId}:${session.sub}:${String(clientId || req.ip || 'anon')}`;
      const safeContext: SupportWorkspaceContext = {
        userName: context?.userName || 'User',
        userRole: context?.userRole || 'Staff',
        currentTab: context?.currentTab || 'dashboard',
        branchName: context?.branchName || 'All Branches',
        language: context?.language === 'si' ? 'si' : 'en',
        activeItemsCount: Number(context?.activeItemsCount || 0),
        lowStockItemsCount: Number(context?.lowStockItemsCount || 0),
        lowStockItemNames: Array.isArray(context?.lowStockItemNames) ? context.lowStockItemNames : [],
        activeSitesCount: Number(context?.activeSitesCount || 0),
        siteNames: Array.isArray(context?.siteNames) ? context.siteNames : [],
        activeTeamsCount: Number(context?.activeTeamsCount || 0),
        teamNames: Array.isArray(context?.teamNames) ? context.teamNames : [],
        activeProjectsCount: Number(context?.activeProjectsCount || 0),
        activeProjectSectionsCount: Number(context?.activeProjectSectionsCount || 0),
        projectSectionNames: Array.isArray(context?.projectSectionNames) ? context.projectSectionNames : [],
        pendingRequestsCount: Number(context?.pendingRequestsCount || 0),
      };

      if (!checkClientFairRate(ipOrClient)) {
        res.status(429).json({
          reply:
            safeContext.language === 'si'
              ? 'ඔබ ඉතා වේගයෙන් පණිවිඩ යවමින් සිටී. කරුණාකර තත්පර කිහිපයක් රැඳී නැවත උත්සාහ කරන්න.'
              : 'You are sending messages too quickly. Please wait a few seconds and try again.',
          modelUsed: 'rate-guard',
        });
        return;
      }

      const cacheKey = getNormalizedCacheKey(
        trimmedMessage,
        safeContext.language,
        String(safeContext.currentTab || ''),
        String(safeContext.userRole || '')
      );

      if (!Array.isArray(history) || history.length <= 2) {
        const cached = getCachedResponse(cacheKey);
        if (cached) {
          res.json({
            reply: cached.reply,
            suggestedTab: cached.suggestedTab,
            modelUsed: `${cached.modelUsed} (cached)`,
            cached: true,
          });
          return;
        }
      }

      let pendingPromise = inFlightRequests.get(cacheKey);
      if (!pendingPromise) {
        pendingPromise = queryGeminiWithFallback(trimmedMessage, history, safeContext).finally(() => {
          inFlightRequests.delete(cacheKey);
        });
        inFlightRequests.set(cacheKey, pendingPromise);
      }

      const result = await pendingPromise;

      setCachedResponse(cacheKey, {
        reply: result.reply,
        suggestedTab: result.suggestedTab,
        modelUsed: result.modelUsed,
        timestamp: Date.now(),
      });

      res.json(result);
    } catch (error: unknown) {
      console.error('[Chat System Support Route Error]:', error);
      const fallbackCtx: SupportWorkspaceContext = {
        language: req.body?.context?.language === 'si' ? 'si' : 'en',
        userRole: req.body?.context?.userRole,
        currentTab: req.body?.context?.currentTab,
        branchName: req.body?.context?.branchName,
      };
      const fallback = resolveSmartSystemSupportAnswer(String(req.body?.message || ''), fallbackCtx);
      res.json({ ...fallback, modelUsed: 'system-expert-kb' });
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      activeAiCalls,
      cacheSize: responseCache.size,
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
