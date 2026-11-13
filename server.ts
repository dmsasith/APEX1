import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

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

const SYSTEM_KNOWLEDGE_PROMPT = `You are the official AI Support Assistant for the "Apex Stock & Site Management System" (Enterprise Warehouse, Branch Yard, Field Team Dispatch & Project Material Usage ERP).

Your job is to help system users solve problems, understand workflows, and troubleshoot issues clearly, accurately, and politely.

LANGUAGE RULES:
1. Automatically reply in the SAME language/style the user uses:
   - If the user asks in Sinhala (සිංහල අකුරෙන්) or Singlish (e.g., "kohomada team ekakata badu issue karanne", "main stock ekata badu danne kohomada"), reply clearly in natural, easy-to-understand Sinhala (using Sinhala script with clear English UI button/menu names so they can find them on screen).
   - If the user asks in English, reply in clear, concise English.
   - If the user explicitly requests Sinhala or English via their preference, follow that preference.
2. Keep answers concise, structured with short bullet points or numbered steps (1, 2, 3), and mention the exact sidebar menu names.

COMPLETE SYSTEM WORKFLOW & MODULE GUIDE:
1. **Master Setup / Registrations ("Master Setup" -> Items, Sites/Branches, Field Teams, System Users)**:
   - **Items**: Register materials, tools, machinery, or consumables with Item Code, Unit (Nos, m, kg, etc.), Unit Cost, Low Stock Reorder Level, and Category. Excel Import/Export and Barcode printing are supported.
   - **Sites / Branches**: Register operational branch yards. The Central Main Warehouse (HQ) is the primary stock receiving hub. Each branch has a Branch Supervisor.
   - **Field Teams**: Register field work squads with Team Name, Team Leader Name & NIC, Assigned Site Base, and Crew Members (Name, NIC/ID, Role, Phone).
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
     1) Go to **"2. Site Requests"** -> click **"+ New Stock Request"** -> select destination Branch and required items.
     2) Admin / Main Storekeeper clicks **"Approve & Dispatch"** on the request.
     3) Branch Supervisor clicks **"Confirm Receipt (GRN)"** to add the items into their **"Branch Stock"**.
   - Direct Transfer: Admin can also use **"Direct Transfer to Site"** inside **"1. Main Stock"** or **"2. Site Requests"**.

5. **Step 3: Issue to Field Teams ("3. Issue to Teams" & "Team In-Hand")**:
   - Before a team can use materials on a project, items must be issued from the Branch Yard to the Team:
     1) Go to **"3. Issue to Teams"** -> select Branch Yard and Field Team -> select items and quantities from available Branch Stock -> click **"Issue Material to Team"**.
     2) Issued items now appear in **"Team In-Hand"** (Team Custody).

6. **Step 4 & 5: Project Registry & Material Usage ("4. Project Registry" & "5. Material Usage")**:
   - **4. Project Registry**: Create projects, assign them to a Branch, and optionally set up a BOQ (Bill of Quantities) budget.
   - **5. Material Usage**: Record materials actually consumed on a project.
     - Note: Materials can be deducted either from **Team In-Hand stock** (items already issued to the team) or directly from **Branch Yard stock**.

7. **Step 6 & 7: Returns ("6. Team Returns" & "7. Branch Return")**:
   - **6. Team Returns**: Unused or recovered materials held by a Field Team are returned back to their Branch Yard stock (Good condition restores Branch Stock; Damaged logs to damaged ledger).
   - **7. Branch Return**: Unused stock at a Branch Yard is returned back to the Central Main Warehouse (HQ).

8. **Troubleshooting Common Issues**:
   - *"Why can't I see other branches?"*: Check your User Role. Site Supervisors are restricted to their "assignedSiteId" except where cross-branch visibility is enabled.
   - *"Why is an item not showing when issuing to a team?"*: Only items with available quantity (> 0) in that specific Branch Yard can be issued to a team. First transfer/receive the item from Main Stock into that Branch.
   - *"Accidentally deleted a user, item, team, or transaction?"*: Open **"Recycle Bin"** from the sidebar or top header to restore it, or permanently delete it.`;

// 1. Fast In-Memory LRU Response Cache (Prevents repeated API calls for identical questions)
interface CacheEntry {
  reply: string;
  suggestedTab?: string;
  modelUsed: string;
  timestamp: number;
}
const responseCache = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 300;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

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
const HIGH_LOAD_THRESHOLD = 4; // Switch to ultra-light model automatically when >4 concurrent users hit AI at the exact same moment

// 3. Per-IP / Session Burst Rate Limiter (Fair queue so 1 user cannot block others)
const clientBurstMap = new Map<string, { count: number; windowStart: number }>();
function checkClientFairRate(clientId: string): boolean {
  const now = Date.now();
  const windowMs = 10_000; // 10 seconds
  const maxPerWindow = 8; // Max 8 messages per 10 seconds per single user
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
  if (lower.includes('grn') || lower.includes('main stock') || lower.includes('ප්‍රධාන ගබඩා')) return 'main-stock';
  if (lower.includes('supplier') || lower.includes('purchase order') || lower.includes('debit note')) return 'procurement';
  if (lower.includes('request') || lower.includes('transfer') || lower.includes('ඉල්ලුම්')) return 'requests';
  if (lower.includes('issue to team') || lower.includes('team එකකට') || lower.includes('team ekakata') || lower.includes('dispatch')) return 'dispatch';
  if (lower.includes('material usage') || lower.includes('project usage') || lower.includes('boq')) return 'project-usage';
  if (lower.includes('project') || lower.includes('ව්‍යාපෘති')) return 'projects';
  if (lower.includes('team return')) return 'returns';
  if (lower.includes('branch return')) return 'branch-returns';
  if (lower.includes('user') || lower.includes('login') || lower.includes('password')) return 'manage-users';
  if (lower.includes('team register') || lower.includes('crew') || lower.includes('කණ්ඩායම්')) return 'teams';
  if (lower.includes('site') || lower.includes('branch')) return 'site-stock';
  if (lower.includes('recycle') || lower.includes('delete') || lower.includes('මැකුණු')) return 'recycle-bin';
  if (lower.includes('item') || lower.includes('barcode') || lower.includes('excel')) return 'items';
  return undefined;
}

// 4. Built-in Instant Fallback Knowledge Responder (Guarantees 0% downtime even if API key quota is exhausted)
function generateLocalSmartFallback(
  message: string,
  context?: { userRole?: string; currentTab?: string; userName?: string; language?: string }
): { reply: string; suggestedTab?: string; modelUsed: string } {
  const q = message.toLowerCase();
  const isEnglishOnly = context?.language === 'en';

  if (q.includes('grn') || q.includes('main stock') || (q.includes('add') && q.includes('stock')) || q.includes('badu danne')) {
    return {
      suggestedTab: 'main-stock',
      modelUsed: 'instant-kb',
      reply: isEnglishOnly
        ? `**How to add stock (GRN) to Central Main Warehouse:**\n1. Open **1. Main Stock** from the left sidebar.\n2. Click **+ Add Stock (GRN)** (or **Direct Stock Entry**).\n3. Enter the Supplier / Invoice / Reference details, select the Items and Quantities, and click **Save GRN**.\n4. If you are receiving against a Purchase Order, open **Supplier PO** and click **Receive GRN** on that PO.`
        : `**Main Stock එකට අලුතින් බඩු (GRN) ඇතුළත් කරන ආකාරය:**\n1. වම් පස මෙනුවෙන් **"1. Main Stock"** වෙත යන්න.\n2. එහි ඇති **"+ Add Stock (GRN)"** බටන් එක ක්ලික් කරන්න.\n3. Supplier විස්තර, Invoice අංකය සහ අදාළ Items වල ප්‍රමාණයන් (Quantity) ඇතුළත් කර Save කරන්න.\n4. Purchase Order එකකට අදාළව බඩු ගන්නවා නම් **"Supplier PO"** වෙත ගොස් GRN එක දාන්න පුළුවන්.`,
    };
  }

  if (q.includes('team') && (q.includes('issue') || q.includes('dispatch') || q.includes('badu') || q.includes('දෙන්නේ'))) {
    return {
      suggestedTab: 'dispatch',
      modelUsed: 'instant-kb',
      reply: isEnglishOnly
        ? `**How to Issue Materials to a Field Team:**\n1. Ensure the items are available in your **Branch Stock** (transfer from Main Stock first if needed).\n2. Open **3. Issue to Teams** from the sidebar.\n3. Select the **Site / Branch Yard** and the **Field Team**.\n4. Pick the items and quantities to issue, then click **Issue Material to Team**.\n5. You can track all items currently held by teams under **Team In-Hand**.`
        : `**Team එකකට බඩු නිකුත් කරන (Issue to Teams) ආකාරය:**\n1. පළමුව අදාළ Branch එකේ (Site Stock) එම බඩු තොගය තිබිය යුතුය.\n2. වම් පස මෙනුවෙන් **"3. Issue to Teams"** වෙත යන්න.\n3. අදාළ **Branch/Site එක** සහ **Team එක** තෝරන්න.\n4. නිකුත් කරන Items සහ ප්‍රමාණයන් තෝරා **"Issue Material to Team"** ක්ලික් කරන්න.\n5. නිකුත් කළ බඩු **"Team In-Hand"** පිටුවෙන් බලාගත හැක.`,
    };
  }

  if (q.includes('transfer') || q.includes('request') || q.includes('site ekata') || q.includes('branch ekata')) {
    return {
      suggestedTab: 'requests',
      modelUsed: 'instant-kb',
      reply: isEnglishOnly
        ? `**How to Transfer Stock from Main Warehouse to a Branch / Site:**\n1. Go to **2. Site Requests** and click **+ New Stock Request** (or use **Direct Transfer** if you are an Admin/Storekeeper).\n2. Select the destination Branch and add the requested items.\n3. The Main Storekeeper / Admin clicks **Approve & Dispatch**.\n4. The Branch Supervisor clicks **Confirm Receipt** to add the stock into their Branch inventory.`
        : `**Main Stock එකෙන් Branch / Site එකකට බඩු ගෙන්වා ගන්නා ආකාරය:**\n1. **"2. Site Requests"** වෙත ගොස් **"+ New Stock Request"** මගින් අවශ්‍ය බඩු ඉල්ලුම් කරන්න (Admin කෙනෙක් නම් කෙලින්ම Direct Transfer කළ හැක).\n2. Main Storekeeper හෝ Admin විසින් එය **Approve & Dispatch** කළ පසු, Branch එකෙන් **Confirm Receipt (GRN)** ක්ලික් කර බඩු භාරගන්න.\n3. ඉන්පසු එම බඩු **"Branch Stock"** තුළ පෙන්වයි.`,
    };
  }

  if (q.includes('usage') || q.includes('project') || q.includes('boq') || q.includes('වැය')) {
    return {
      suggestedTab: 'project-usage',
      modelUsed: 'instant-kb',
      reply: isEnglishOnly
        ? `**How to Record Project Material Usage:**\n1. First register the project in **4. Project Registry** (and optionally add BOQ items).\n2. Open **5. Material Usage** from the sidebar.\n3. Select the **Project**, **Source** (Team In-Hand stock or Branch Yard stock), and the **Field Team**.\n4. Enter the consumed quantities and save. The system automatically updates remaining stock and BOQ progress.`
        : `**Project එකකට වැය වූ බඩු (Material Usage) සටහන් කරන ආකාරය:**\n1. පළමුව **"4. Project Registry"** හි අදාළ ව්‍යාපෘතිය (Project) ලියාපදිංචි කර තිබිය යුතුය.\n2. ඉන්පසු **"5. Material Usage"** වෙත යන්න.\n3. අදාළ **Project එක**, **Team එක** සහ බඩු වැය කළේ **Team In-Hand** තොගයෙන්ද නැතිනම් කෙලින්ම **Branch Stock** එකෙන්ද යන්න තෝරා ප්‍රමාණයන් ඇතුළත් කර Save කරන්න.`,
    };
  }

  if (q.includes('delete') || q.includes('recycle') || q.includes('restore') || q.includes('මැකු')) {
    return {
      suggestedTab: 'recycle-bin',
      modelUsed: 'instant-kb',
      reply: isEnglishOnly
        ? `**How to Restore or Permanently Delete Records:**\n1. Open **Recycle Bin** from the left sidebar.\n2. Find the deleted Item, User, Site, Team, or Transaction.\n3. Click **Restore** to bring it back into the active system, or **Delete Permanently** to remove it forever.`
        : `**මැකූ දත්ත නැවත ගැනීමට (Restore) හෝ ස්ථිරවම ඉවත් කිරීමට:**\n1. වම් පස මෙනුවෙන් **"Recycle Bin"** වෙත යන්න.\n2. එහි ඇති ඕනෑම මැකුණු User, Site, Team, Item හෝ ගනුදෙනුවක් ඉදිරියෙන් ඇති **Restore** බටන් එකෙන් නැවත පද්ධතියට ගත හැක.\n3. **Permanent Delete** මගින් එය නැවත නොඑන ලෙස ස්ථිරවම ඉවත් කළ හැක.`,
    };
  }

  return {
    suggestedTab: detectSuggestedModule(message),
    modelUsed: 'instant-kb',
    reply: isEnglishOnly
      ? `**Apex Stock & Site Management System Quick Guide:**\n- **Master Setup**: Register Items, Branches/Sites, Field Teams & Users.\n- **1. Main Stock**: Add central warehouse GRN stock.\n- **2. Site Requests**: Request & transfer materials from Main Stock to Branch Yards.\n- **3. Issue to Teams**: Dispatch materials from a Branch Yard to a Field Team.\n- **5. Material Usage**: Log project material consumption against teams & BOQs.\n- **6. Team Returns / 7. Branch Return**: Return unused materials.\n\nTell me which exact task you want to perform and I will guide you step by step!`
      : `**Apex Stock & Site Management පද්ධතියේ ප්‍රධාන පියවර:**\n1. **Master Setup**: අලුත් Items, Branches (Sites), Field Teams සහ Users ලියාපදිංචි කිරීම.\n2. **1. Main Stock**: ප්‍රධාන ගබඩාවට බඩු ඇතුළත් කිරීම (GRN).\n3. **2. Site Requests**: ප්‍රධාන ගබඩාවෙන් අනෙක් Branch වලට බඩු ඉල්ලුම් කිරීම සහ යැවීම.\n4. **3. Issue to Teams**: Branch එකේ සිට වැඩ කරන Team වලට බඩු නිකුත් කිරීම.\n5. **5. Material Usage**: Project වලට වැය වූ බඩු සටහන් කිරීම.\n6. **6. Team Returns / 7. Branch Return**: ඉතිරි වූ බඩු නැවත ගබඩාවට භාරගැනීම.\n\nඔබට දැනගැනීමට අවශ්‍ය කොටස ගැන අහන්න, පියවරෙන් පියවර කියා දෙන්නම්!`,
  };
}

// Helper: Call Gemini with automatic model load-balancing & retry
async function queryGeminiWithFallback(
  userMessage: string,
  history: Array<{ role: 'user' | 'model'; text: string }>,
  context?: {
    userRole?: string;
    currentTab?: string;
    userName?: string;
    branchName?: string;
    language?: string;
    statsSummary?: string;
  }
): Promise<{ reply: string; suggestedTab?: string; modelUsed: string }> {
  const ai = getAiClient();
  if (!ai) {
    return generateLocalSmartFallback(userMessage, context);
  }

  // Build compact conversation context (last 6 messages max to keep tokens small & fast)
  const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
  const contextLine = context
    ? `\n[Current Live User Context: User="${context.userName || 'User'}", Role="${context.userRole || 'Staff'}", ActiveScreen="${context.currentTab || 'dashboard'}", AssignedBranch="${context.branchName || 'All/Main'}", LanguagePreference="${context.language || 'auto'}", WorkspaceSummary="${context.statsSummary || ''}"]`
    : '';

  const conversationTranscript = recentHistory
    .map((m) => `${m.role === 'user' ? 'User' : 'Support Agent'}: ${m.text}`)
    .join('\n');

  const fullPrompt = `${contextLine}\n${
    conversationTranscript ? `Recent Chat:\n${conversationTranscript}\n\n` : ''
  }User Question: ${userMessage}`;

  // Choose primary model based on current server concurrency so high traffic never queues up
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
        console.warn(`[AI Support] Model ${modelName} attempt failed:`, errMsg);
        // Brief pause before trying fallback model
        if (i < modelsToTry.length - 1) {
          await new Promise((r) => setTimeout(r, 250));
        }
      }
    }
  } finally {
    activeAiCalls = Math.max(0, activeAiCalls - 1);
  }

  // If all models are rate-limited or unreachable, return instant smart fallback so user never gets stuck
  return generateLocalSmartFallback(userMessage, context);
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

    if (!checkClientFairRate(ipOrClient)) {
      res.status(429).json({
        reply:
          context?.language === 'en'
            ? 'You are sending messages very quickly. Please wait a few seconds and try again.'
            : 'ඔබ ඉතා වේගයෙන් පණිවිඩ යවමින් සිටී. කරුණාකර තත්පර කිහිපයක් රැඳී නැවත උත්සාහ කරන්න.',
        modelUsed: 'rate-guard',
      });
      return;
    }

    const cacheKey = getNormalizedCacheKey(
      trimmedMessage,
      String(context?.language || 'auto'),
      String(context?.currentTab || ''),
      String(context?.userRole || '')
    );

    // 1. Check Instant LRU Cache (only for standalone or initial questions)
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

    // 2. Coalesce identical concurrent in-flight requests
    let pendingPromise = inFlightRequests.get(cacheKey);
    if (!pendingPromise) {
      pendingPromise = queryGeminiWithFallback(trimmedMessage, history, context).finally(() => {
        inFlightRequests.delete(cacheKey);
      });
      inFlightRequests.set(cacheKey, pendingPromise);
    }

    const result = await pendingPromise;

    // Store in LRU cache for fast subsequent answers
    setCachedResponse(cacheKey, {
      reply: result.reply,
      suggestedTab: result.suggestedTab,
      modelUsed: result.modelUsed,
      timestamp: Date.now(),
    });

    res.json(result);
  } catch (error: unknown) {
    console.error('[AI Support Route Error]:', error);
    const fallback = generateLocalSmartFallback(String(req.body?.message || ''), req.body?.context);
    res.json(fallback);
  }
});

// Health check endpoint for Cloud Run container probes
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
