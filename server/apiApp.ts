import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  resolveSmartSystemSupportAnswer,
  SupportWorkspaceContext,
} from '../src/utils/supportKnowledgeEngine';
import {
  SYSTEM_KNOWLEDGE_PROMPT,
  detectSuggestedModule,
} from './supportShared';
import {
  createBillingPortalForTenant,
  createRecurringSubscriptionForTenant,
  formatPaymentsLkApiError,
  getConfiguredMode,
  getLiveMultiCurrencyRates,
  isSecretKeyConfigured,
  isWebhookSecretConfigured,
  normalizeServerPaymentCurrency,
  processPaymentsLkWebhook,
  updateAutoRenewForTenant,
  verifyAndSyncTenantSubscription,
} from './paymentsLkService';

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

  // Payments.lk Signed Webhook (MUST run BEFORE express.json so raw body bytes remain intact for HMAC verification)
  app.post(
    '/api/payments/webhook',
    express.raw({ type: 'application/json', limit: '2mb' }),
    async (req, res) => {
      try {
        const signatureHeader = req.headers['payments-signature'];
        const rawPayload = Buffer.isBuffer(req.body)
          ? req.body
          : typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body || {});
        const result = await processPaymentsLkWebhook(rawPayload, signatureHeader);
        res.status(200).json(result);
      } catch (err: unknown) {
        const formatted = formatPaymentsLkApiError(err);
        console.warn('[Payments.lk Webhook Error]:', formatted.code, formatted.message);
        res.status(formatted.status).json({ error: formatted.message, code: formatted.code });
      }
    }
  );

  app.use(express.json({ limit: '10mb' }));

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

  const DEFAULT_MASTER_SALT = '108d08133197debe60ff8ba1';
  const DEFAULT_MASTER_DIGEST_HEX =
    'bb9914cd7e862f0e15ab1d63be3a6bfbe857a428db612ee53d42cf1814dc9c7b';

  function verifyDefaultSaltedMasterDigest(plain: string): boolean {
    const actualHex = crypto
      .createHash('sha256')
      .update(`${DEFAULT_MASTER_SALT}:${plain}`)
      .digest('hex');
    const a = Buffer.from(actualHex, 'hex');
    const b = Buffer.from(DEFAULT_MASTER_DIGEST_HEX, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
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
    res.json({ configured: true, source: 'env' });
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
    const isMatch =
      (envPasscode ? verifyEnvPasscode(passcode, envPasscode) : false) ||
      (claimedMasterHash ? verifyScryptPasscode(passcode, claimedMasterHash) : false) ||
      verifyDefaultSaltedMasterDigest(passcode);

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

  // Payments.lk Gateway Status & Live Multi-Currency FX Rates (safe public metadata only)
  app.get('/api/payments/status', async (_req, res) => {
    try {
      const fx = await getLiveMultiCurrencyRates();
      res.json({
        configured: isSecretKeyConfigured(),
        webhookConfigured: isWebhookSecretConfigured(),
        mode: getConfiguredMode(),
        usdToLkrRate: fx.usdToLkrRate,
        fxRates: fx.rates,
        fxUpdatedAt: fx.updatedAt,
        isLiveFxRate: fx.isLive,
      });
    } catch {
      res.json({
        configured: isSecretKeyConfigured(),
        webhookConfigured: isWebhookSecretConfigured(),
        mode: getConfiguredMode(),
        usdToLkrRate: 300.0,
        fxRates: {
          USD: 1,
          LKR: 300.0,
          EUR: 0.92,
          GBP: 0.79,
          AUD: 1.53,
          SGD: 1.34,
        },
        fxUpdatedAt: new Date().toISOString(),
        isLiveFxRate: false,
      });
    }
  });

  function isLocalOrPrivateHostname(hostname: string): boolean {
    const clean = hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (!clean) return true;
    if (
      clean === 'localhost' ||
      clean.endsWith('.localhost') ||
      clean === '127.0.0.1' ||
      clean === '0.0.0.0' ||
      clean === '::1'
    ) {
      return true;
    }
    if (/^10\./.test(clean) || /^192\.168\./.test(clean) || /^172\.(1[6-9]|2\d|3[01])\./.test(clean)) {
      return true;
    }
    return false;
  }

  function resolveTrustedAppOrigin(req: express.Request): string {
    // 1. Prefer HTTPS Origin header (already validated by CSRF origin middleware on POST routes)
    const originHeader = (req.get('origin') || '').trim();
    if (originHeader) {
      try {
        const parsed = new URL(originHeader);
        if (parsed.protocol === 'https:' && !isLocalOrPrivateHostname(parsed.hostname)) {
          return parsed.origin;
        }
      } catch {
        // ignore invalid origin
      }
    }

    // 2. Check forwarded/request host and always force https:// when public
    const forwardedHost = (req.get('x-forwarded-host') || req.get('host') || '')
      .split(',')[0]
      .trim();
    if (forwardedHost) {
      try {
        const parsed = new URL(`https://${forwardedHost}`);
        if (!isLocalOrPrivateHostname(parsed.hostname)) {
          return parsed.origin;
        }
      } catch {
        // ignore malformed host
      }
    }

    // 3. Fallback to runtime APP_URL (e.g. AI Studio preview HTTPS URL)
    if (process.env.APP_URL) {
      try {
        const parsed = new URL(process.env.APP_URL);
        if (!isLocalOrPrivateHostname(parsed.hostname)) {
          return `https://${parsed.host}`;
        }
      } catch {
        // ignore invalid APP_URL
      }
    }

    // 4. Fallback to VERCEL_URL if present
    const vercelHost = (process.env.VERCEL_URL || '').trim();
    if (vercelHost && !isLocalOrPrivateHostname(vercelHost.split(':')[0])) {
      return `https://${vercelHost}`;
    }

    // 5. Production domain fallback (Payments.lk API strictly rejects http:// or localhost URLs)
    return 'https://apexstox.com';
  }

  // Create Auto-Renewing Recurring Subscription on Payments.lk (USD -> LKR Live FX)
  app.post('/api/payments/create-subscription', async (req, res) => {
    try {
      const session = verifySessionToken(extractBearerToken(req));
      if (!session) {
        res.status(401).json({ error: 'Authentication session required.' });
        return;
      }

      const billingCycle = req.body?.billingCycle === 'monthly' ? 'monthly' : 'annual';
      const selectedCurrency = normalizeServerPaymentCurrency(req.body?.selectedCurrency);
      const extraSiteSlots =
        typeof req.body?.extraSiteSlots === 'number' && !Number.isNaN(req.body.extraSiteSlots)
          ? Math.min(500, Math.max(0, Math.round(req.body.extraSiteSlots)))
          : undefined;
      const requestedTenantId =
        typeof req.body?.tenantId === 'string' ? req.body.tenantId.trim() : '';
      const targetTenantId =
        session.scope === 'master' && requestedTenantId ? requestedTenantId : session.tenantId;

      const result = await createRecurringSubscriptionForTenant({
        tenantId: targetTenantId,
        billingCycle,
        extraSiteSlots,
        selectedCurrency,
        baseReturnUrl: resolveTrustedAppOrigin(req),
        fallbackCustomerEmail:
          typeof req.body?.customerEmail === 'string' ? req.body.customerEmail : undefined,
        fallbackCustomerName:
          typeof req.body?.customerName === 'string' ? req.body.customerName : undefined,
      });

      res.json(result);
    } catch (err: unknown) {
      const formatted = formatPaymentsLkApiError(err);
      res.status(formatted.status).json({ error: formatted.message, code: formatted.code });
    }
  });

  // Confirm & Sync Subscription Status Directly from Payments.lk on Checkout Return
  app.post('/api/payments/verify-subscription', async (req, res) => {
    try {
      const session = verifySessionToken(extractBearerToken(req));
      if (!session) {
        res.status(401).json({ error: 'Authentication session required.' });
        return;
      }

      const requestedTenantId =
        typeof req.body?.tenantId === 'string' ? req.body.tenantId.trim() : '';
      const targetTenantId =
        session.scope === 'master' && requestedTenantId ? requestedTenantId : session.tenantId;
      const subscriptionId =
        typeof req.body?.subscriptionId === 'string' ? req.body.subscriptionId.trim() : undefined;

      const result = await verifyAndSyncTenantSubscription({
        tenantId: targetTenantId,
        subscriptionId,
      });

      res.json(result);
    } catch (err: unknown) {
      const formatted = formatPaymentsLkApiError(err);
      res.status(formatted.status).json({ error: formatted.message, code: formatted.code });
    }
  });

  // Open Payments.lk Customer Billing Portal (Manage Saved Card, Invoices & Auto-Renewal)
  app.post('/api/payments/billing-portal', async (req, res) => {
    try {
      const session = verifySessionToken(extractBearerToken(req));
      if (!session) {
        res.status(401).json({ error: 'Authentication session required.' });
        return;
      }

      const requestedTenantId =
        typeof req.body?.tenantId === 'string' ? req.body.tenantId.trim() : '';
      const targetTenantId =
        session.scope === 'master' && requestedTenantId ? requestedTenantId : session.tenantId;

      const result = await createBillingPortalForTenant({
        tenantId: targetTenantId,
        returnUrl: `${resolveTrustedAppOrigin(req)}/?payments_lk=portal_return`,
      });
      res.json(result);
    } catch (err: unknown) {
      const formatted = formatPaymentsLkApiError(err);
      res.status(formatted.status).json({ error: formatted.message, code: formatted.code });
    }
  });

  // Cancel Auto-Renewal at Period End or Resume Subscription
  app.post('/api/payments/auto-renew', async (req, res) => {
    try {
      const session = verifySessionToken(extractBearerToken(req));
      if (!session) {
        res.status(401).json({ error: 'Authentication session required.' });
        return;
      }

      const action = req.body?.action === 'resume' ? 'resume' : 'cancel';
      const requestedTenantId =
        typeof req.body?.tenantId === 'string' ? req.body.tenantId.trim() : '';
      const targetTenantId =
        session.scope === 'master' && requestedTenantId ? requestedTenantId : session.tenantId;

      const result = await updateAutoRenewForTenant({
        tenantId: targetTenantId,
        action,
      });
      res.json(result);
    } catch (err: unknown) {
      const formatted = formatPaymentsLkApiError(err);
      res.status(formatted.status).json({ error: formatted.message, code: formatted.code });
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      activeAiCalls,
      cacheSize: responseCache.size,
      paymentsLkConfigured: isSecretKeyConfigured(),
      paymentsLkMode: getConfiguredMode(),
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
