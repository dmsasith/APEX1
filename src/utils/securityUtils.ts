// Client-side security helpers:
// - Salted SHA-256 credential hashing via Web Crypto API for tenant user accounts
// - In-memory Bearer session token storage (never persisted in localStorage/sessionStorage)
// - Server-side Master Admin authentication & verification API wrappers

let inMemoryApiToken: string | null = null;

export function setApiSessionToken(token: string | null): void {
  inMemoryApiToken = token && token.trim() ? token.trim() : null;
}

export function getApiSessionToken(): string | null {
  return inMemoryApiToken;
}

export function clearApiSessionToken(): void {
  inMemoryApiToken = null;
}

const HASH_PREFIX = '$sha256$';

export function isHashedPassword(value?: string): boolean {
  return typeof value === 'string' && value.startsWith(HASH_PREFIX);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', data);
    return bytesToHex(new Uint8Array(digest));
  }
  // Fallback deterministic mixing if subtle crypto is unavailable in an insecure HTTP context
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < data.length; i++) {
    h1 ^= data[i];
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= data[i] + i;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function hashPasswordForStorage(plainPassword: string): Promise<string> {
  const clean = (plainPassword || '').trim();
  if (!clean) return '';
  if (isHashedPassword(clean)) return clean;

  const saltBytes = new Uint8Array(12);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(saltBytes);
  } else {
    for (let i = 0; i < saltBytes.length; i++) {
      saltBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const salt = bytesToHex(saltBytes);
  const digest = await sha256Hex(`${salt}:${clean}`);
  return `${HASH_PREFIX}${salt}$${digest}`;
}

export async function verifyStoredPassword(
  inputPassword: string,
  storedValue?: string
): Promise<boolean> {
  const cleanInput = (inputPassword || '').trim();
  const cleanStored = (storedValue || '').trim();
  if (!cleanInput || !cleanStored) return false;

  if (cleanStored.startsWith(HASH_PREFIX)) {
    const rest = cleanStored.slice(HASH_PREFIX.length);
    const parts = rest.split('$');
    if (parts.length !== 2) return false;
    const [salt, expectedDigest] = parts;
    if (!salt || !expectedDigest) return false;
    const actualDigest = await sha256Hex(`${salt}:${cleanInput}`);
    return constantTimeEquals(actualDigest, expectedDigest);
  }

  // Legacy plaintext compatibility: verified and migrated to salted hash upon sign-in
  return constantTimeEquals(cleanInput, cleanStored);
}

export interface MasterAuthStatusResponse {
  configured: boolean;
  source: 'env' | 'claimed' | 'unset';
}

export async function getMasterAuthStatus(): Promise<MasterAuthStatusResponse> {
  try {
    const res = await fetch('/api/auth/master/status', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return { configured: true, source: 'env' };
    }
    return (await res.json()) as MasterAuthStatusResponse;
  } catch {
    return { configured: true, source: 'env' };
  }
}

export async function claimMasterAdminPasscode(passcode: string): Promise<{
  success: boolean;
  token?: string;
  message: string;
}> {
  try {
    const res = await fetch('/api/auth/master/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ passcode }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        success: false,
        message: 'Authentication API route is not active on this host. Please deploy the latest backend API update.',
      };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      return {
        success: false,
        message: data?.message || 'Unable to set Master Admin passcode.',
      };
    }
    if (typeof data.token === 'string' && data.token) {
      setApiSessionToken(data.token);
    }
    return {
      success: true,
      token: data.token,
      message: data.message || 'Master Admin passcode configured on server.',
    };
  } catch {
    return {
      success: false,
      message: 'Could not reach the authentication server to claim Master Admin passcode.',
    };
  }
}

export async function verifyMasterAdminPasscode(passcode: string): Promise<{
  valid: boolean;
  needsSetup?: boolean;
  token?: string;
  message?: string;
}> {
  try {
    const res = await fetch('/api/auth/master/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ passcode }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        valid: false,
        message:
          'Authentication API (/api/auth/master/verify) is not deployed or was rewritten to HTML on this domain. Push the latest update including /api serverless routes and set MASTER_ADMIN_PASSCODE in your hosting Environment Variables.',
      };
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.valid) {
      if (typeof data.token === 'string' && data.token) {
        setApiSessionToken(data.token);
      }
      return { valid: true, token: data.token };
    }
    return {
      valid: false,
      needsSetup: Boolean(data?.needsSetup),
      message: data?.message || 'Invalid Master Admin credentials.',
    };
  } catch {
    return {
      valid: false,
      message: 'Authentication server unreachable. Please verify server is running.',
    };
  }
}

export async function issueWorkspaceSessionToken(userId: string, tenantId: string): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/workspace-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ userId, tenantId }),
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (data && typeof data.token === 'string' && data.token) {
      setApiSessionToken(data.token);
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}
