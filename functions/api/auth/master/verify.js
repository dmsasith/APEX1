const DEFAULT_MASTER_SALT = '108d08133197debe60ff8ba1';
const DEFAULT_MASTER_DIGEST_HEX =
  'bb9914cd7e862f0e15ab1d63be3a6bfbe857a428db612ee53d42cf1814dc9c7b';

const encoder = new TextEncoder();

function hexToBytes(hex) {
  const clean = hex.trim();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function constantTimeEqualsBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function sha256Bytes(input) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  return new Uint8Array(digest);
}

async function verifyEnvPasscode(plain, envPasscode) {
  const [a, b] = await Promise.all([sha256Bytes(plain), sha256Bytes(envPasscode)]);
  return constantTimeEqualsBytes(a, b);
}

async function verifyDefaultSaltedMasterDigest(plain) {
  const actual = await sha256Bytes(`${DEFAULT_MASTER_SALT}:${plain}`);
  const expected = hexToBytes(DEFAULT_MASTER_DIGEST_HEX);
  return constantTimeEqualsBytes(actual, expected);
}

async function signMasterSessionToken(env) {
  const payload = {
    sub: 'usr-admin-1',
    scope: 'master',
    tenantId: 'tenant-apex-main',
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  const encoded = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const rawSecret =
    (env && (env.SESSION_SECRET || env.MASTER_ADMIN_PASSCODE)
      ? String(env.SESSION_SECRET || env.MASTER_ADMIN_PASSCODE).trim()
      : '') || DEFAULT_MASTER_DIGEST_HEX;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(rawSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(encoded));
  return `${encoded}.${bytesToBase64Url(new Uint8Array(sig))}`;
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json().catch(() => ({}));
  const passcode = typeof body?.passcode === 'string' ? body.passcode.trim() : '';

  if (!passcode) {
    return jsonResponse({ valid: false, message: 'Passcode is required.' }, 400);
  }

  const envPasscode = env && typeof env.MASTER_ADMIN_PASSCODE === 'string'
    ? env.MASTER_ADMIN_PASSCODE.trim()
    : '';

  const isMatch =
    (envPasscode ? await verifyEnvPasscode(passcode, envPasscode) : false) ||
    (await verifyDefaultSaltedMasterDigest(passcode));

  if (!isMatch) {
    return jsonResponse({ valid: false, message: 'Invalid Master Admin credentials.' }, 401);
  }

  const token = await signMasterSessionToken(env);
  return jsonResponse({ valid: true, token }, 200);
}

export async function onRequest(context) {
  if (context.request.method.toUpperCase() === 'POST') {
    return onRequestPost(context);
  }
  return jsonResponse({ error: 'Method Not Allowed' }, 405);
}
