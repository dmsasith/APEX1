import {
  resolveSmartSystemSupportAnswer,
  SupportWorkspaceContext,
} from '../../src/utils/supportKnowledgeEngine';
import {
  SYSTEM_KNOWLEDGE_PROMPT,
  detectSuggestedModule,
} from '../../server/supportShared';

interface CloudflareEnv {
  MASTER_ADMIN_PASSCODE?: string;
  SESSION_SECRET?: string;
  GEMINI_API_KEY?: string;
  APP_URL?: string;
}

interface CfEventContext {
  request: Request;
  env: CloudflareEnv;
}

interface SessionTokenPayload {
  sub: string;
  scope: 'master' | 'workspace';
  tenantId: string;
  exp: number;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(b64u: string): Uint8Array {
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const binary = atob(b64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function constantTimeEqualsBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function sha256Bytes(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(input));
  return new Uint8Array(digest);
}

async function verifyEnvPasscode(plain: string, envPasscode: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256Bytes(plain), sha256Bytes(envPasscode)]);
  return constantTimeEqualsBytes(a, b);
}

async function hashPbkdf2Passcode(plain: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(plain),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return `${bytesToHex(salt)}:${bytesToHex(new Uint8Array(bits))}`;
}

async function verifyPbkdf2Passcode(plain: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [saltHex, expectedHex] = parts;
  if (!saltHex || !expectedHex) return false;
  const salt = hexToBytes(saltHex);
  const expected = hexToBytes(expectedHex);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(plain),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return constantTimeEqualsBytes(new Uint8Array(bits), expected);
}

let ephemeralFallbackSecret: string | null = null;
async function resolveSigningSecret(env: CloudflareEnv): Promise<string> {
  const explicit = (env.SESSION_SECRET || '').trim();
  if (explicit) return explicit;
  const masterPass = (env.MASTER_ADMIN_PASSCODE || '').trim();
  if (masterPass) {
    const derived = await sha256Bytes(`apex-session-key-v1:${masterPass}`);
    return bytesToHex(derived);
  }
  if (!ephemeralFallbackSecret) {
    const rnd = new Uint8Array(32);
    crypto.getRandomValues(rnd);
    ephemeralFallbackSecret = bytesToHex(rnd);
  }
  return ephemeralFallbackSecret;
}

async function signSessionToken(
  env: CloudflareEnv,
  payload: Omit<SessionTokenPayload, 'exp'>,
  ttlMs = 24 * 60 * 60 * 1000
): Promise<string> {
  const fullPayload: SessionTokenPayload = {
    ...payload,
    exp: Date.now() + ttlMs,
  };
  const encoded = bytesToBase64Url(textEncoder.encode(JSON.stringify(fullPayload)));
  const secret = await resolveSigningSecret(env);
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, textEncoder.encode(encoded));
  return `${encoded}.${bytesToBase64Url(new Uint8Array(sig))}`;
}

async function verifySessionToken(
  env: CloudflareEnv,
  token: string | undefined
): Promise<SessionTokenPayload | null> {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 2) return null;
  const [encoded, providedSig] = parts;
  if (!encoded || !providedSig) return null;

  const secret = await resolveSigningSecret(env);
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const expectedOk = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlToBytes(providedSig) as BufferSource,
    textEncoder.encode(encoded)
  );
  if (!expectedOk) return null;

  try {
    const parsed = JSON.parse(textDecoder.decode(base64UrlToBytes(encoded))) as SessionTokenPayload;
    if (!parsed || typeof parsed.exp !== 'number' || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    },
  });
}

let claimedMasterHash: string | null = null;
const authAttemptMap = new Map<string, { failures: number; windowStart: number }>();
const clientBurstMap = new Map<string, { count: number; windowStart: number }>();

function checkAuthRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const rec = authAttemptMap.get(ip);
  if (!rec || now - rec.windowStart > windowMs) return true;
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

function checkClientFairRate(clientId: string): boolean {
  const now = Date.now();
  const windowMs = 10_000;
  const maxPerWindow = 12;
  const record = clientBurstMap.get(clientId);
  if (!record || now - record.windowStart > windowMs) {
    clientBurstMap.set(clientId, { count: 1, windowStart: now });
    return true;
  }
  if (record.count >= maxPerWindow) return false;
  record.count += 1;
  return true;
}

async function queryGeminiRestWithFallback(
  env: CloudflareEnv,
  userMessage: string,
  history: Array<{ role: 'user' | 'model'; text: string }>,
  context: SupportWorkspaceContext
): Promise<{ reply: string; suggestedTab?: string; modelUsed: string }> {
  const apiKey = (env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
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

  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
  for (const modelName of modelsToTry) {
    try {
      const apiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_KNOWLEDGE_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          }),
        }
      );
      if (!apiRes.ok) continue;
      const data = (await apiRes.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const replyText = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
      if (replyText) {
        return {
          reply: replyText,
          suggestedTab: detectSuggestedModule(`${userMessage} ${replyText}`),
          modelUsed: modelName,
        };
      }
    } catch {
      // Fall through to next model or built-in KB
    }
  }

  const localAns = resolveSmartSystemSupportAnswer(userMessage, context);
  return { ...localAns, modelUsed: 'system-expert-kb' };
}

export async function onRequest(context: CfEventContext): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();

  // Same-origin CSRF check on state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const originHeader = request.headers.get('origin');
    if (originHeader) {
      try {
        const originHost = new URL(originHeader).host.toLowerCase();
        const requestHost = url.host.toLowerCase();
        let appUrlHost = '';
        if (env.APP_URL) {
          try {
            appUrlHost = new URL(env.APP_URL).host.toLowerCase();
          } catch {
            appUrlHost = '';
          }
        }
        const allowedHosts = [requestHost, appUrlHost].filter(Boolean);
        if (allowedHosts.length > 0 && !allowedHosts.includes(originHost)) {
          return jsonResponse({ error: 'Cross-origin request blocked.' }, 403);
        }
      } catch {
        return jsonResponse({ error: 'Invalid Origin header.' }, 403);
      }
    }
  }

  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'unknown';

  // GET /api/health
  if (method === 'GET' && pathname === '/api/health') {
    return jsonResponse({
      status: 'ok',
      runtime: 'cloudflare-pages',
      timestamp: new Date().toISOString(),
    });
  }

  // GET /api/auth/master/status
  if (method === 'GET' && pathname === '/api/auth/master/status') {
    const envPasscode = (env.MASTER_ADMIN_PASSCODE || '').trim();
    if (envPasscode) {
      return jsonResponse({ configured: true, source: 'env' });
    }
    if (claimedMasterHash) {
      return jsonResponse({ configured: true, source: 'claimed' });
    }
    return jsonResponse({ configured: false, source: 'unset' });
  }

  // POST /api/auth/master/claim
  if (method === 'POST' && pathname === '/api/auth/master/claim') {
    const envPasscode = (env.MASTER_ADMIN_PASSCODE || '').trim();
    if (envPasscode || claimedMasterHash) {
      return jsonResponse(
        { success: false, message: 'Master Admin passcode is already configured and locked.' },
        409
      );
    }
    const body = (await request.json().catch(() => ({}))) as { passcode?: unknown };
    const passcode = typeof body.passcode === 'string' ? body.passcode.trim() : '';
    if (passcode.length < 8) {
      return jsonResponse(
        { success: false, message: 'Master Admin passcode must be at least 8 characters long.' },
        400
      );
    }
    claimedMasterHash = await hashPbkdf2Passcode(passcode);
    const token = await signSessionToken(env, {
      sub: 'usr-admin-1',
      scope: 'master',
      tenantId: 'tenant-apex-main',
    });
    return jsonResponse({
      success: true,
      token,
      message: 'Master Admin security passcode claimed and hashed on server.',
    });
  }

  // POST /api/auth/master/verify
  if (method === 'POST' && pathname === '/api/auth/master/verify') {
    if (!checkAuthRateLimit(clientIp)) {
      return jsonResponse(
        {
          valid: false,
          message: 'Too many failed authentication attempts. Please wait 15 minutes and try again.',
        },
        429
      );
    }

    const body = (await request.json().catch(() => ({}))) as { passcode?: unknown };
    const passcode = typeof body.passcode === 'string' ? body.passcode.trim() : '';
    if (!passcode) {
      return jsonResponse({ valid: false, message: 'Passcode is required.' }, 400);
    }

    const envPasscode = (env.MASTER_ADMIN_PASSCODE || '').trim();
    if (!envPasscode && !claimedMasterHash) {
      return jsonResponse(
        {
          valid: false,
          needsSetup: true,
          message: 'Master Admin passcode has not been configured yet. Please complete first-run setup.',
        },
        409
      );
    }

    const isMatch = envPasscode
      ? await verifyEnvPasscode(passcode, envPasscode)
      : await verifyPbkdf2Passcode(passcode, claimedMasterHash!);

    if (!isMatch) {
      recordAuthFailure(clientIp);
      return jsonResponse({ valid: false, message: 'Invalid Master Admin credentials.' }, 401);
    }

    authAttemptMap.delete(clientIp);
    const token = await signSessionToken(env, {
      sub: 'usr-admin-1',
      scope: 'master',
      tenantId: 'tenant-apex-main',
    });
    return jsonResponse({ valid: true, token });
  }

  // POST /api/auth/workspace-session
  if (method === 'POST' && pathname === '/api/auth/workspace-session') {
    const body = (await request.json().catch(() => ({}))) as { userId?: unknown; tenantId?: unknown };
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const tenantId = typeof body.tenantId === 'string' ? body.tenantId.trim() : '';
    if (!userId || !tenantId || userId === 'usr-admin-1') {
      return jsonResponse(
        { error: 'Valid non-master workspace userId and tenantId are required.' },
        400
      );
    }
    const token = await signSessionToken(env, { sub: userId, scope: 'workspace', tenantId });
    return jsonResponse({ token });
  }

  // POST /api/support-chat
  if (method === 'POST' && pathname === '/api/support-chat') {
    const auth = request.headers.get('authorization') || '';
    const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : undefined;
    const session = await verifySessionToken(env, bearer);
    if (!session) {
      return jsonResponse({ error: 'Authentication session required.' }, 401);
    }

    const body = (await request.json().catch(() => ({}))) as {
      message?: unknown;
      history?: Array<{ role: 'user' | 'model'; text: string }>;
      context?: Partial<SupportWorkspaceContext>;
      clientId?: unknown;
    };

    const message = typeof body.message === 'string' ? body.message : '';
    if (!message.trim()) {
      return jsonResponse({ error: 'Message is required.' }, 400);
    }

    const trimmedMessage = message.trim().slice(0, 1200);
    const ctx = body.context || {};
    const safeContext: SupportWorkspaceContext = {
      userName: ctx.userName || 'User',
      userRole: ctx.userRole || 'Staff',
      currentTab: ctx.currentTab || 'dashboard',
      branchName: ctx.branchName || 'All Branches',
      language: ctx.language === 'si' ? 'si' : 'en',
      activeItemsCount: Number(ctx.activeItemsCount || 0),
      lowStockItemsCount: Number(ctx.lowStockItemsCount || 0),
      lowStockItemNames: Array.isArray(ctx.lowStockItemNames) ? ctx.lowStockItemNames : [],
      activeSitesCount: Number(ctx.activeSitesCount || 0),
      siteNames: Array.isArray(ctx.siteNames) ? ctx.siteNames : [],
      activeTeamsCount: Number(ctx.activeTeamsCount || 0),
      teamNames: Array.isArray(ctx.teamNames) ? ctx.teamNames : [],
      activeProjectsCount: Number(ctx.activeProjectsCount || 0),
      activeProjectSectionsCount: Number(ctx.activeProjectSectionsCount || 0),
      projectSectionNames: Array.isArray(ctx.projectSectionNames) ? ctx.projectSectionNames : [],
      pendingRequestsCount: Number(ctx.pendingRequestsCount || 0),
    };

    const rateKey = `${session.tenantId}:${session.sub}:${String(body.clientId || clientIp)}`;
    if (!checkClientFairRate(rateKey)) {
      return jsonResponse(
        {
          reply:
            safeContext.language === 'si'
              ? 'ඔබ ඉතා වේගයෙන් පණිවිඩ යවමින් සිටී. කරුණාකර තත්පර කිහිපයක් රැඳී නැවත උත්සාහ කරන්න.'
              : 'You are sending messages too quickly. Please wait a few seconds and try again.',
          modelUsed: 'rate-guard',
        },
        429
      );
    }

    const result = await queryGeminiRestWithFallback(
      env,
      trimmedMessage,
      Array.isArray(body.history) ? body.history : [],
      safeContext
    );
    return jsonResponse(result);
  }

  return jsonResponse({ error: 'API endpoint not found.' }, 404);
}
