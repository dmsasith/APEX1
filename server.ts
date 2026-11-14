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

const SYSTEM_KNOWLEDGE_PROMPT = `You are the official Chat System Support Assistant for the "Apex Stock & Site Management System" (Enterprise Warehouse, Branch Yard, Field Team Dispatch & Project Material Usage ERP).

Your job is to help system users solve problems, understand workflows, and troubleshoot issues clearly, accurately, and politely.

LANGUAGE RULES:
1. If LanguagePreference is "en" (English Section) and the user writes in English:
   - Reply 100% in clear, structured English. Do NOT include any Sinhala words.
2. If LanguagePreference is "si" (Sinhala Section) OR if the user writes in Sinhala script or Singlish (e.g., "kohomada team ekakata badu issue karanne"):
   - Reply clearly in natural, easy-to-understand Sinhala (keeping exact English menu/button names in quotes so they can find them on screen).
3. Keep answers concise, structured with numbered steps (1, 2, 3), and mention the exact sidebar menu names.

COMPLETE SYSTEM WORKFLOW & MODULE GUIDE:
1. **Master Setup / Registrations ("Master Setup" -> Items, Sites/Branches, Field Teams, Manage Users)**:
   - **Items**: Register materials, tools, machinery, or consumables with Item Code, Unit (Nos, m, kg, etc.), Unit Cost, Low Stock Reorder Level, and Category. Excel Import/Export and Barcode printing are supported.
   - **Sites / Branches**: Register operational branch yards. The Central Main Warehouse (HQ) is the primary stock receiving hub. Each branch has a Branch Supervisor.
   - **Field Teams**: Register field work squads with Team Name, Team Leader Name & NIC, Assigned Site Base, and Team Members (Name, NIC/ID, Role, Phone).
   - **Manage Users**: Create logins with specific Roles and Assigned Site/Branch.

2. **User Roles & Permissions**:
   - **Super Admin / All-Site Admin**: Full access to all branches, Main Stock, Supplier POs, Master Setup, Approvals, Audit Trail, and Recycle Bin.
   - **Main Storekeeper**: Manages Central Main Warehouse (GRN stock additions, approving/dispatching Site Stock Requests, receiving Branch Returns).
   - **Site Manager / Site Supervisor / Sub-Storekeeper**: Manages their assigned Branch Yard (requesting stock from Main Warehouse, receiving dispatched stock, issuing materials to Field Teams, recording Project Material Usage, receiving Team Returns).
   - **Project Manager / Auditor**: Views project BOQ usage, stock levels, and audit reports.

3. **Step 1: Main Stock ("1. Main Stock" & "Supplier PO")**:
   - To add new stock to Central Main Warehouse: Go to **"1. Main Stock"** -> click **"+ Add Stock (GRN)"** -> select Supplier/Invoice details and add item quantities.
   - For Purchase Orders & Supplier Returns: Go to **"Supplier PO" (Procurement)** to create POs, receive GRNs against POs, or record Supplier Returns / Debit Notes for damaged goods.
   - For Client-provided items: Go to **"Client Free Stock"** to log Free-of-Charge (FOC) client materials separately.

4. **Step 2: Site Stock Requests & Branch Transfers ("2. Site Requests" & "Branch Stock")**:
   - How a Branch gets items from Main Stock:
     1) Go to **"2. Site Requests"** -> click **"+ New Stock Requirement Form"** -> select destination Branch and required items.
     2) Admin / Main Storekeeper clicks **"Approve & Dispatch"** on the request.
     3) Branch Supervisor clicks **"Confirm Receipt (GRN)"** to add the items into their **"Branch Stock"**.
   - Direct Transfer: Admin can also use **"Direct Transfer to Site"** inside **"1. Main Stock"** or **"2. Site Requests"**.

5. **Step 3: Issue to Field Teams ("3. Issue to Teams" & "Team In-Hand")**:
   - Before a team can use materials on a project, items must be issued from the Branch Yard to the Team:
     1) Go to **"3. Issue to Teams"** -> select Branch Yard and Field Team -> select items and quantities from available Branch Stock -> click **"Issue Material to Team"**.
     2) Issued items now appear in **"Team In-Hand"** (Team Custody).

6. **Step 4 & 5: Project Registry & Material Usage ("4. Project Registry" & "5. Material Usage")**:
   - **4. Project Registry**: Create projects, assign them to a Branch, and optionally set up a BOQ (Bill of Quantities) budget.
   - **5. Material Usage**: Record materials actually consumed on a project. Materials can be deducted either from **Team In-Hand stock** or directly from **Branch Yard stock**.

7. **Step 6 & 7: Returns ("6. Team Returns" & "7. Branch Return")**:
   - **6. Team Returns**: Unused or recovered materials held by a Field Team are returned back to their Branch Yard stock (Good condition restores Branch Stock; Damaged logs to damaged ledger).
   - **7. Branch Return**: Unused stock at a Branch Yard is returned back to the Central Main Warehouse (HQ).

8. **Troubleshooting Common Issues**:
   - *"Why can't I see other branches?"*: Check your User Role. Site Supervisors are restricted to their assigned branch unless cross-branch visibility applies.
   - *"Why is an item not showing when issuing to a team?"*: Only items with available quantity (> 0) in that specific Branch Yard can be issued to a team. First transfer/receive the item from Main Stock into that Branch.
   - *"Accidentally deleted a user, item, team, or transaction?"*: Open **"Recycle Bin"** from the sidebar or top header to restore it, or permanently delete it.`;

// 1. Fast In-Memory LRU Response Cache
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

// 2. In-Flight Request Coalescing & Non-Blocking Concurrency Load Balancer
const inFlightRequests = new Map<string, Promise<{ reply: string; suggestedTab?: string; modelUsed: string }>>();
let activeAiCalls = 0;
const HIGH_LOAD_THRESHOLD = 4;

// 3. Per-Client Fair Burst Limiter
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

// Detect relevant navigation module from question/answer
function detectSuggestedModule(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('transfer') || lower.includes('request') || lower.includes('requisition')) return 'requests';
  if (lower.includes('grn') || lower.includes('main stock')) return 'main-stock';
  if (lower.includes('supplier') || lower.includes('purchase order') || lower.includes('debit note')) return 'procurement';
  if (lower.includes('issue to team') || lower.includes('dispatch')) return 'dispatch';
  if (lower.includes('material usage') || lower.includes('project usage') || lower.includes('boq')) return 'project-usage';
  if (lower.includes('project')) return 'projects';
  if (lower.includes('team return')) return 'returns';
  if (lower.includes('branch return')) return 'branch-returns';
  if (lower.includes('user') || lower.includes('login') || lower.includes('password') || lower.includes('role')) return 'manage-users';
  if (lower.includes('team')) return 'teams';
  if (lower.includes('site') || lower.includes('branch')) return 'site-stock';
  if (lower.includes('recycle') || lower.includes('delete')) return 'recycle-bin';
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
  const contextLine = `\n[Current Live User Context: User="${context.userName || 'User'}", Role="${context.userRole || 'Staff'}", ActiveScreen="${context.currentTab || 'dashboard'}", AssignedBranch="${context.branchName || 'All Branches'}", LanguagePreference="${context.language || 'en'}", ActiveItems=${context.activeItemsCount ?? 0}, LowStockItems=${context.lowStockItemsCount ?? 0}, ActiveBranches=${context.activeSitesCount ?? 0}, ActiveTeams=${context.activeTeamsCount ?? 0}, PendingRequests=${context.pendingRequestsCount ?? 0}]`;

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
