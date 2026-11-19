import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  resolveSmartSystemSupportAnswer,
  SupportWorkspaceContext,
} from './src/utils/supportKnowledgeEngine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '10mb' }));

// ============================================================================
// HIGH-CONCURRENCY, NON-BLOCKING GEMINI AI SUPPORT AGENT ENGINE
// ============================================================================

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
   - **Supplier Orders (PO)**: Create Purchase Orders (item dropdowns display both Item Code and full Material Name underneath), receive Full or Partial batch GRNs against POs into Main Stock, close PO remainders, create **Supplier Returns (RTV)** for defective goods, dispatch with Gate Pass & vehicle details, print official **Debit Notes**, and record supplier settlements (Replacement, Credit Note, Refund).
   - **Client Free Stock (FOC) — "Under Main Project" vs. "Individual Project", Locked Branch, Assigned-Site Isolated FOC Summary & Admin Correction**:
     1) Open **"Client Free Stock (FOC)"** and click **"+ Log Client Free Stock"**.
     2) Choose Target Project Mode: **"🏢 Under Main Project"** or **"📄 Individual Project"**. Physical deliveries default to **"Main Central Warehouse (Central Yard)"**, while selecting a project automatically detects and **LOCKS** the **"Allocated Site Branch"** to that project's registered branch so stock cannot be mis-issued to another site.
     3) **Assigned-Site Isolated FOC Summary**: Expanding the FOC Summary inside **Client Free Stock (FOC)** strictly isolates the summary to that project's **Assigned Site Branch** (showing only the site distribution, field teams, and project consumption belonging to that assigned site).
     4) **Admin FOC Voucher Correction**: If a shipment was logged under the wrong project, Admins can edit that FOC voucher directly inside **Client Free Stock (FOC)** and reassign it to the correct Target Project.
     5) When FOC stock is received **"Under Main Project"**, Sub-Project usage automatically deducts from the Parent Main Project's pool while **"Project Free Stock Balances"** shows both the Main Project net balance and **"Sub-Projects Individual Usage Breakdown"**.

3. **Stock Requisitions ("Stock Requisitions") & Site Branch Stock ("Site Branch Stock")**:
   - **How a Branch gets items from Main Stock**:
     1) Open **"Stock Requisitions"** -> click **"+ New Stock Requirement Form"** -> select Requesting Site Branch and switch between **Tab 1 ("1. Normal Stock Request")** or **Tab 2 ("2. Client Free Stock for Assigned Project Request")** (item selector displays Item Code on top and full Item Name underneath).
     2) HQ Super Admin / Storekeeper clicks **"Approve & Dispatch"**.
     3) Branch Admin / Supervisor clicks **"Confirm Receipt (GRN)"** to add the items into their **"Site Branch Stock"**.
   - **Site Branch Stock Item Forward Traceability Summary**: Clicking any item row (or **"Forward Summary"**) in **Site Branch Stock** expands a **Forward Traceability Summary** underneath that item showing HQ/FOC transfers received at that branch, quantities issued to each Field Team at that branch, Project Used/Wasted, Site Store In-Hand, and Site Teams In-Hand — with **"Print A4 Summary"** and **"Download PDF"**.

4. **Issue to Field Teams ("Issue to Teams"), Site-Separated Team In-Hand ("Team In-Hand Stock"), & Branch Directory ("Branch Staff & Teams")**:
   - **Issue to Teams**: Select Branch Yard and Field Team -> pick items from available Site Branch Stock -> click **"Issue Material to Team"** and print the **Gate Pass / Issue Voucher**.
   - **Site-Separated Team In-Hand Stock ("Stock to Return - [Previous Site Name]")**:
     In **"Team In-Hand Stock"**, stock held by transferred teams is **NEVER combined or summed across sites**:
     • Any unreturned balance from a previous site is displayed separately in an amber section titled **"Stock to Return - [Previous Site Name]"** — those items must be returned to that previous site and cannot be used on the new site.
     • Stock issued at the team's new site is displayed separately under **"[Current Site Name] — Active Site Stock"**.
   - **Branch Staff & Teams**: Organizational directory showing every branch, supervisor, system staff, field teams, and verified team members with NIC numbers. Supports **Export Members (Excel)** and **Print Directory Report**.

5. **Project & New Section Registry ("Project & New Section Registry") — International Industry Section Templates (Telecom, Water, Electric, Solar), "+ Add Field" Builder & BOM Templates**:
   - **International Industry Section Templates (1-Click Auto-Load) & "+ Add Field" Custom Field Builder**:
     1) Open **"Project & New Section Registry"** -> **"New Section Registry & Material Templates"** tab and click **"+ Add New Section"** (or click the 1-click Quick-Load buttons).
     2) Select any of the 5 International Industry Templates:
        • **Telecom New Connection (ITU-T G.984 / FTTH)**: 6 Core Fields (*Customer FTTH/NC No, ONT Serial No, Customer Name, Address, Mobile, Exchange Area*) + *FDP/Splitter Port, Optical Power (dBm), Bandwidth Tier, Drop Span*.
        • **Water Supply & Utility Project (ISO 4064 / AWWA)**: 6 Core Fields (*Water Account/Application No, Water Meter Serial & Make, Consumer Name, Premises Address, Mobile, WSS Zone/DMA Area*) + *Pipe Diameter & Class (DN/PN), Tariff Class, Initial Reading (m3) & Pressure (Bar), Ferrule/Saddle Size*.
        • **Electrical Power & Service Connection (IEC 60364 / IEEE)**: 6 Core Fields (*Consumer Account/Service Order No, Energy Meter Serial kWh, Consumer Name, Installation Address, Mobile, Transformer Substation/Feeder/Pole No*) + *Phase/Voltage/Amps, Contract Demand (kVA) & Breaker, Earth Resistance (Ohm), Meter Seal No*.
        • **Solar PV & Net-Metering Project (IEC 62446 / UL 1741)**: 6 Core Fields (*Solar Project/Net-Metering Ref No, Solar Inverter Serial & Model, Client Name, Roof Address, Mobile, Grid Substation & Scheme*) + *System Capacity (kWp DC/kW AC), PV Module Make & Panel Count, Battery BESS (kWh), Bi-Directional Meter No*.
        • **Standard / Custom Engineering Project (ISO 21500 / EPC)**: Main / Sub / Individual Project hierarchy + Contract Ref & GPS Coordinates.
     3) **"+ Add Field" Custom Field Builder**: Users can click **"+ Add Field"** inside the Create/Edit Section modal (or inline inside the **Register Project** modal) to add unlimited custom technical fields and customize the 6 Core Field labels.
     4) On any section card, click **"Configure Material Template"** to add standard BOM items and **Suggested Qty**.

6. **Material Usage / Daily Progress Entry ("Material Usage / Daily Progress Entry")**:
   - **Strict Active-Site-Only Stock Usage Rule**: A team can **ONLY consume materials issued under the project's own Site Branch**. Unreturned stock from a previous site (**"Stock to Return - [Previous Site Name]"**) is strictly excluded and blocked from usage on the new site.
   - **Connection & Utility Sections (Telecom, Water, Electric, Solar) — Simple 1, 2, 3 Step Workflow with Team & Area Lock**:
     When any Connection/Utility Section (**Telecom, Water, Electric, or Solar**) is selected, complex Main/Sub-Project steps are replaced by **Steps 1, 2, 3**:
     1) **Step 1 — Team & Area Selection (Top-Most & Locked Until Refresh)**: Select Site Branch, Field Team, and Working Area at the top and click **"Confirm & Lock Team / Area"**. Step 1 **locks until the page is refreshed**, allowing the user to enter all daily connections completed by that team continuously without re-selecting the team/area every time.
     2) **Step 2 — Select Connection or "+ Register New Connection"**: Search registered connections by Name or ID, OR switch to the **"+ Register New Connection"** tab right inside Step 2 to fill that section's 6 Core Fields + Custom Fields on the spot.
     3) **Step 3 — Material Usage**: Enter consumed materials (**Qty Used** + **Wastage Qty**) and submit.
   - **Standard Project Sections — Section Filtering, Branch Lock, Wastage Qty & Full Site Report**:
     1) Picking a **Project Section** in Step 1 strictly filters Step 2 dropdowns to ONLY show projects registered under that section, and auto-loads the section's **Default Material Template (BOM)**.
     2) If the selected project belongs to a different **Site Branch** than the logged-in user's assigned site, Step 4 safely **locks**.
     3) Record both **Qty Used (Installed)** and **Wastage Qty** per material line (validates \`Used + Wastage <= Active-Site Team In-Hand\` and auto-deducts Sub-Project usage from the Parent Main Project's FOC pool).
     4) In **Usage Vouchers History**, select any project and click **"Full Report for This Site (Project)"** to view/print/export **Part 1 (Team-by-Team Breakdown & Subtotals)** and **Part 2 (Full Site Consolidated Grand Total)**.

7. **Multi-Item Batch Returns in Team Returns ("Team Returns") & Branch Returns ("Branch Returns")**:
   - **Team Returns (RV)**: Select the **Receiving Site Branch** and **Field Team**, then add **multiple items at once** using **"+ Add Item"**, **"+ Add All Held"**, or barcode scan. Set per-item quantity (**Max** button available) and condition (**Good** restores usable branch stock; **Damaged** logs to Damaged Stock) and submit all items together on a single shared **Return Voucher (RV-2026-XXXX)**.
   - **Branch Returns (BRM)**: Select your **Returning Site Branch**, add **multiple items at once** using **"+ Add Item"**, **"+ Add All Available"**, or clicking cards in the right-hand inventory list, set per-item quantity and condition (**Good** or **Damaged**), and return the entire batch to Central Main Warehouse (HQ) on a single **BRM Return Voucher (BRM-2026-XXXX)**.

8. **Document Templates ("Document Templates"), Admin Password Delete Protection & Enterprise Controls**:
   - **Document Templates (3 Tabs)**:
     • **Tab 1 ("1. Section Formats")**: ISO 9001:2015 Controlled Formats (**FORMAT-01** to **FORMAT-04**) with auto-populated Tenant Company Header, optional **PDF/Image Format Upload (limited to max 1MB file size)**, 1-click Format-01/02 unification, and Live A4 Studio settings.
     • **Tab 2 ("2. Auto Tenant Header & Signers")**: Company Logo & **ISO Signer Names, Designations & Department Matrix** (**Prepared & Checked By**, **Authorized & Approved By**, **Reviewed By**).
     • **Tab 3 ("3. Digital Signatures")**: Draw on the interactive signature pad or upload a PNG/JPG signature image; auto-matches signers on vouchers and supports isolated single-click A4 printing (with **"Print with Image"** option).
   - **Mandatory Admin Password Verification for Any Deletion**: Deleting any record or transaction across the entire system requires entering the **Admin Password** in the confirmation modal (never deletes on a simple click).
   - **Audit Trail & Recycle Bin**: Filterable chronological history with isolated A4 Print & CSV export; restore or permanently delete soft-deleted records.
   - **Automatic Email Verification & Support**: Clicking **"Send Verification Email"** sends a Firebase link from **apexstox.com**; clicking the email link verifies the account automatically. Official domain: **apexstox.com** | Support email: **support@apexstox.com**.
   - **System Backups & Config (Top Header)**: Create/restore backups, open the **Offline Backup Viewer**, run **Admin System Flush**, change theme/company settings, or use **Admin View-As Mode**.`;

interface CacheEntry {
  reply: string;
  suggestedTab?: string;
  modelUsed: string;
  timestamp: number;
}
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

// POST /api/support-chat
app.post('/api/support-chat', async (req, res) => {
  try {
    const { message, history = [], context = {}, clientId = 'anon' } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    const trimmedMessage = message.trim().slice(0, 1200);
    const ipOrClient = String(clientId || req.ip || 'anon');
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
      activeTeamsCount: Number(context?.activeTeamsCount || 0),
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

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    activeAiCalls,
    cacheSize: responseCache.size,
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  const distPath = path.join(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('Vite middleware not loaded, falling back to static dist if available:', e);
    }
  }

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
  }

  app.get('*', (_req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Application build in progress or dist/index.html not found.');
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
