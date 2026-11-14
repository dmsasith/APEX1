import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  resolveSmartSystemSupportAnswer,
  SupportWorkspaceContext,
} from './src/utils/supportKnowledgeEngine';

dotenv.config();

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
   - **Items ("Item Catalog" & "Plant & Equipment")**: Register Materials (consumables) or Machinery (Plant & Equipment) with Item Code, Barcode, Unit, Unit Price, Low Stock Threshold, and optional Project Reservation ("Reserved for Project"). Supports Excel Import (Sync, Append, Replace), Excel Export, Barcode Sticker printing, USB HID Barcode Scanner, and Mobile Camera Barcode Scanner.
   - **Sites / Branches**: Register Central Main Warehouse (HQ) and Operational Branch Yards, link a designated Branch Supervisor user, and assign system users.
   - **Field Teams**: Register field work squads with Team Name, Team Leader Name & NIC/ID, Assigned Site Base, Contact Phone, and individual **Team Members** (Full Name, NIC/ID Number, Role/Skill, Phone). Crew Size is auto-calculated (1 Leader + Team Members).
   - **Suppliers & Clients**: Register Suppliers (for Purchase Orders & Debit Notes) and Clients/Principals (for Projects & Client Free Issue Stock).
   - **User Management ("User Management")**: Create logins with Username, Password, Full Name, Role ("Super Admin Central", "All Site Branch Admin", "Branch Admin", "Branch System User"), and single or multi-branch assignment.

2. **Main Central Stock ("Main Central Stock"), Supplier Orders ("Supplier Orders (PO)"), & Client Free Stock ("Client Free Stock (FOC)")**:
   - **Main Central Stock**: Add stock via **"+ Add Stock (GRN)"** (Purchase or Manual Entry), perform **Direct Transfer to Site**, or manage the **Damaged Stock Ledger & Restoration** (restore repaired items back to Main Stock).
   - **Supplier Orders (PO)**: Create Purchase Orders, receive Full or Partial batch GRNs against POs into Main Stock, close PO remainders, create **Supplier Returns (RTV)** for defective goods, dispatch with Gate Pass & vehicle details, print official **Debit Notes**, and record supplier settlements (Replacement, Credit Note, Refund).
   - **Client Free Stock (FOC)**: Record Free-of-Charge materials supplied by Clients/Principals for specific projects and track Received, Used, and Remaining FOC balances per project.

3. **Stock Requisitions ("Stock Requisitions") & Site Branch Stock ("Site Branch Stock")**:
   - How a Branch gets items from Main Stock:
     1) Open **"Stock Requisitions"** -> click **"+ New Stock Requirement Form"** -> select destination Branch and required items.
     2) HQ Super Admin / Storekeeper clicks **"Approve & Dispatch"** (supports full or partial dispatch quantities).
     3) Branch Admin / Supervisor clicks **"Confirm Receipt (GRN)"** to add the items into their **"Site Branch Stock"**.

4. **Issue to Field Teams ("Issue to Teams"), Team In-Hand ("Team In-Hand Stock"), & Branch Directory ("Branch Staff & Teams")**:
   - **Issue to Teams**: Select Branch Yard and Field Team -> pick items from available Site Branch Stock -> click **"Issue Material to Team"** and print the **Gate Pass / Issue Voucher**.
   - **Team In-Hand Stock**: Live dashboard showing materials currently in each team's custody (Issued minus Used in Projects minus Returned to Branch).
   - **Branch Staff & Teams**: Organizational directory showing every branch, supervisor, system staff, field teams, and verified team members with NIC numbers. Supports **Export Members (Excel)** and **Print Directory Report**.

5. **Project & New Section Registry ("Project & New Section Registry") — Creating New Project Sections & Default Material Templates (BOM)**:
   - **How to Create a New Project Section ("New Section Registry")**:
     1) Open **"Project & New Section Registry"** from the left sidebar.
     2) Click **"+ New Section Registry"** at the top right (or switch to the **"New Section Registry & Material Templates"** tab and click **"+ Create New Section"**).
     3) Enter the **Section Name** (e.g., *Telecom New Connection*, *Telecom Cable Development*), **Short Code** (e.g., *TNC*), **Badge Theme Color**, and **Description**, then click **"Create Section"**.
   - **How to Configure a Default Material Template (BOM) for a Section**:
     1) In **"Project & New Section Registry"**, open the **"New Section Registry & Material Templates"** tab.
     2) On the section card, click **"Configure Material Template"** (or **"Edit Material Template (BOM)"**).
     3) Select the standard items used in that section, click **"+ Add Item to Template"** to add rows, and enter the **Suggested Qty** for each item.
     4) Click **"Save Material Template"**.
     5) Whenever a project in this section is selected inside **"Material Usage"**, all template items and suggested quantities pre-populate automatically!
   - **How to Register Projects**:
     1) Click **"Register Project"** (or click **"+ Add"** on any section card in the Project Sections Hub).
     2) Enter Project ID, Reference No, Project/Customer Name, Customer Phone Number, Site ID / Connection ID, Client/Principal, Project Section, District, and Sub Area.
     3) Supports **Sample CSV**, **Import CSV**, **Export CSV**, real-time duplicate detection, Zero-Data-Loss section switching, and viewing team-by-team usage breakdowns per project.

6. **Material Usage ("Material Usage")**:
   - Record materials consumed on a project against a Field Team.
   - Choose deduction source: **Team In-Hand Stock**, **Site Branch Stock**, or **Client Free Stock (FOC)**.
   - Automatically loads the section's **Default Material Template (BOM)** items when a project is selected.
   - Supports **Cross-Project Override Requests** when using project-reserved items on a different project.

7. **Team Returns ("Team Returns") & Branch Returns ("Branch Returns")**:
   - **Team Returns**: Return unused or recovered items from a Field Team to their Site Branch Stock (**Good** condition restores usable branch stock; **Damaged** logs to Damaged Stock).
   - **Branch Returns**: Return surplus stock from a Site Branch Yard back to the Central Main Warehouse (HQ).

8. **Document Templates ("Document Templates"), Audit Trail ("Audit Trail"), Recycle Bin ("Recycle Bin"), Backups & System Config**:
   - **Document Templates**: Customize company letterhead, logo, digital signatures, and print formatting for all vouchers.
   - **Audit Trail**: Filterable chronological history of all system actions with PDF/CSV export.
   - **Recycle Bin**: Restore soft-deleted Items, Sites, Teams, Users, Projects, or Transactions, or **Delete Permanently** forever.
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
    lower.includes('section registry') ||
    lower.includes('project section') ||
    lower.includes('material template') ||
    lower.includes('bom') ||
    lower.includes('register project') ||
    lower.includes('project registry')
  ) {
    return 'projects';
  }
  if (lower.includes('material usage') || lower.includes('project usage') || lower.includes('boq')) return 'project-usage';
  if (lower.includes('transfer') || lower.includes('request') || lower.includes('requisition')) return 'requests';
  if (lower.includes('grn') || lower.includes('main stock') || lower.includes('main central stock')) return 'main-stock';
  if (lower.includes('supplier') || lower.includes('purchase order') || lower.includes('debit note')) return 'procurement';
  if (lower.includes('issue to team') || lower.includes('dispatch')) return 'dispatch';
  if (lower.includes('team return')) return 'returns';
  if (lower.includes('branch return')) return 'branch-returns';
  if (lower.includes('user') || lower.includes('login') || lower.includes('password') || lower.includes('role')) return 'manage-users';
  if (lower.includes('team in-hand')) return 'team-stock';
  if (lower.includes('team')) return 'teams';
  if (lower.includes('site') || lower.includes('branch')) return 'site-stock';
  if (lower.includes('recycle') || lower.includes('delete')) return 'recycle-bin';
  if (lower.includes('letterhead') || lower.includes('document template')) return 'templates';
  if (lower.includes('item') || lower.includes('barcode') || lower.includes('excel')) return 'items';
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
