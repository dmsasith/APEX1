import {
  PaymentsLk,
  ApiError,
  ValidationError,
  WebhookSignatureError,
  type Subscription as GatewaySubscription,
  type Invoice as GatewayInvoice,
  type Payment as GatewayPayment,
} from '@payments-lk/node';
import type { SubscriptionPaymentCurrency, Tenant, TenantSubscription } from '../src/types';

const FIREBASE_RTDB_BASE = 'https://apexdevoloper-31068-default-rtdb.firebaseio.com';
const PLATFORM_PRICING_URL = `${FIREBASE_RTDB_BASE}/tenantsData/tenant-apex-main/platformPricing.json`;
const MASTER_CONFIG_URL = `${FIREBASE_RTDB_BASE}/tenantsData/tenant-apex-main/config.json`;
const SAAS_TENANTS_URL = `${FIREBASE_RTDB_BASE}/saasTenants.json`;

export type SupportedFxRatesMap = Record<SubscriptionPaymentCurrency, number>;

const DEFAULT_SERVER_FX_RATES: SupportedFxRatesMap = {
  USD: 1,
  LKR: 300.0,
  EUR: 0.92,
  GBP: 0.79,
  AUD: 1.53,
  SGD: 1.34,
};

interface RateCache {
  rate: number;
  rates: SupportedFxRatesMap;
  fetchedAt: number;
  updatedAtIso: string;
  isLive: boolean;
}

let cachedUsdRate: RateCache | null = null;
const RATE_CACHE_TTL_MS = 15 * 60 * 1000;

const processedEventIds = new Map<string, number>();
const MAX_TRACKED_EVENTS = 1000;

export function isSecretKeyConfigured(): boolean {
  return Boolean((process.env.PAYMENTS_LK_SECRET_KEY || '').trim());
}

export function isWebhookSecretConfigured(): boolean {
  return Boolean((process.env.PAYMENTS_LK_WEBHOOK_SECRET || '').trim());
}

export function getConfiguredMode(): 'test' | 'live' | 'unconfigured' {
  const key = (process.env.PAYMENTS_LK_SECRET_KEY || '').trim();
  if (!key) return 'unconfigured';
  if (key.startsWith('sk_live_')) return 'live';
  return 'test';
}

export function createPaymentsLkClient(): PaymentsLk | null {
  const secretKey = (process.env.PAYMENTS_LK_SECRET_KEY || '').trim();
  if (!secretKey) return null;
  return new PaymentsLk(secretKey, {
    timeoutMs: 25_000,
    maxRetries: 2,
  });
}

function stripUndefinedDeep<T>(val: T): T {
  if (Array.isArray(val)) {
    return val.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (val && typeof val === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefinedDeep(v);
      }
    }
    return out as T;
  }
  return val;
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 4500): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function normalizeServerPaymentCurrency(raw?: unknown): SubscriptionPaymentCurrency {
  const upper = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  if (
    upper === 'LKR' ||
    upper === 'USD' ||
    upper === 'EUR' ||
    upper === 'GBP' ||
    upper === 'AUD' ||
    upper === 'SGD'
  ) {
    return upper;
  }
  return 'LKR';
}

export async function getLiveMultiCurrencyRates(): Promise<{
  usdToLkrRate: number;
  rates: SupportedFxRatesMap;
  isLive: boolean;
  updatedAt: string;
}> {
  if (cachedUsdRate && Date.now() - cachedUsdRate.fetchedAt < RATE_CACHE_TTL_MS) {
    return {
      usdToLkrRate: cachedUsdRate.rate,
      rates: cachedUsdRate.rates,
      isLive: cachedUsdRate.isLive,
      updatedAt: cachedUsdRate.updatedAtIso,
    };
  }

  // 1. Live FX feed
  const fx = await fetchJsonWithTimeout<{
    result?: string;
    time_last_update_utc?: string;
    rates?: Record<string, number>;
  }>('https://open.er-api.com/v6/latest/USD', 4500);

  const liveLkr = fx?.result === 'success' ? Number(fx?.rates?.LKR) : NaN;
  if (Number.isFinite(liveLkr) && liveLkr > 50 && liveLkr < 2000) {
    const roundedLkr = parseFloat(liveLkr.toFixed(2));
    const pick = (code: Exclude<SubscriptionPaymentCurrency, 'USD' | 'LKR'>) => {
      const val = Number(fx?.rates?.[code]);
      return Number.isFinite(val) && val > 0.01 && val < 1000
        ? parseFloat(val.toFixed(4))
        : DEFAULT_SERVER_FX_RATES[code];
    };
    const rates: SupportedFxRatesMap = {
      USD: 1,
      LKR: roundedLkr,
      EUR: pick('EUR'),
      GBP: pick('GBP'),
      AUD: pick('AUD'),
      SGD: pick('SGD'),
    };
    const updatedAtIso = fx?.time_last_update_utc || new Date().toISOString();
    cachedUsdRate = {
      rate: roundedLkr,
      rates,
      fetchedAt: Date.now(),
      updatedAtIso,
      isLive: true,
    };
    return { usdToLkrRate: roundedLkr, rates, isLive: true, updatedAt: updatedAtIso };
  }

  // 2. Fallback to stored master config LKR rate in Firebase RTDB
  const cfg = await fetchJsonWithTimeout<{ usdToLkrRate?: number }>(MASTER_CONFIG_URL, 3500);
  const cfgRate = Number(cfg?.usdToLkrRate);
  if (Number.isFinite(cfgRate) && cfgRate > 50 && cfgRate < 2000) {
    const roundedLkr = parseFloat(cfgRate.toFixed(2));
    return {
      usdToLkrRate: roundedLkr,
      rates: { ...DEFAULT_SERVER_FX_RATES, LKR: roundedLkr },
      isLive: false,
      updatedAt: new Date().toISOString(),
    };
  }

  // 3. Safe conservative fallback
  return {
    usdToLkrRate: DEFAULT_SERVER_FX_RATES.LKR,
    rates: { ...DEFAULT_SERVER_FX_RATES },
    isLive: false,
    updatedAt: new Date().toISOString(),
  };
}

export async function getLiveUsdToLkrRate(): Promise<{ rate: number; isLive: boolean }> {
  const multi = await getLiveMultiCurrencyRates();
  return { rate: multi.usdToLkrRate, isLive: multi.isLive };
}

export async function getAuthoritativeUsdPricing(): Promise<{
  monthlyPrice: number;
  annualPrice: number;
  includedSiteBranches: number;
  extraSiteMonthlyPrice: number;
}> {
  const remote = await fetchJsonWithTimeout<{
    monthlyPrice?: number;
    annualPrice?: number;
    includedSiteBranches?: number;
    extraSiteMonthlyPrice?: number;
  }>(PLATFORM_PRICING_URL, 3500);
  const monthly = Number(remote?.monthlyPrice);
  const annual = Number(remote?.annualPrice);
  const includedBranches = Number(remote?.includedSiteBranches);
  const extraSiteMonthly = Number(remote?.extraSiteMonthlyPrice);
  return {
    monthlyPrice: Number.isFinite(monthly) && monthly >= 1 ? monthly : 19.9,
    annualPrice: Number.isFinite(annual) && annual >= 10 ? annual : 189.0,
    includedSiteBranches:
      Number.isFinite(includedBranches) && includedBranches >= 1
        ? Math.min(500, Math.round(includedBranches))
        : 20,
    extraSiteMonthlyPrice:
      Number.isFinite(extraSiteMonthly) && extraSiteMonthly >= 0
        ? Number(extraSiteMonthly.toFixed(2))
        : 10.0,
  };
}

interface TenantRecordEntry {
  key: string;
  tenant: Tenant;
}

async function loadFirebaseTenants(): Promise<TenantRecordEntry[]> {
  const raw = await fetchJsonWithTimeout<Tenant[] | Record<string, Tenant>>(SAAS_TENANTS_URL, 5000);
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((t, idx) => (t && t.id ? { key: String(idx), tenant: t } : null))
      .filter((x): x is TenantRecordEntry => Boolean(x));
  }
  if (typeof raw === 'object') {
    return Object.entries(raw)
      .map(([key, t]) => (t && t.id ? { key, tenant: t } : null))
      .filter((x): x is TenantRecordEntry => Boolean(x));
  }
  return [];
}

async function findTenantEntry(opts: {
  tenantId?: string | null;
  subscriptionId?: string | null;
  customerId?: string | null;
}): Promise<TenantRecordEntry | null> {
  const entries = await loadFirebaseTenants();
  if (opts.tenantId) {
    const byId = entries.find((e) => e.tenant.id === opts.tenantId);
    if (byId) return byId;
  }
  if (opts.subscriptionId) {
    const bySub = entries.find(
      (e) => e.tenant.subscription?.paymentsLkSubscriptionId === opts.subscriptionId
    );
    if (bySub) return bySub;
  }
  if (opts.customerId) {
    const byCust = entries.find(
      (e) => e.tenant.subscription?.paymentsLkCustomerId === opts.customerId
    );
    if (byCust) return byCust;
  }
  return null;
}

function parseReference(reference: string | null | undefined): {
  tenantId?: string;
  billingCycle?: 'monthly' | 'annual';
  extraSiteSlots?: number;
} {
  if (!reference || typeof reference !== 'string') return {};
  const parts = reference.split(':');
  if (parts.length >= 2 && parts[0] === 'apex') {
    const cycle = parts[2] === 'monthly' || parts[2] === 'annual' ? parts[2] : undefined;
    let extraSiteSlots: number | undefined;
    if (parts[3] && parts[3].startsWith('xs-')) {
      const parsed = Number(parts[3].slice(3));
      if (Number.isFinite(parsed) && parsed >= 0) {
        extraSiteSlots = Math.min(500, Math.round(parsed));
      }
    }
    return { tenantId: parts[1], billingCycle: cycle, extraSiteSlots };
  }
  return {};
}

async function patchTenantSubscriptionInRtdb(
  tenantId: string,
  subPatch: Partial<TenantSubscription>,
  clearPendingBankPayment = false
): Promise<TenantSubscription | null> {
  const entry = await findTenantEntry({
    tenantId,
    subscriptionId: subPatch.paymentsLkSubscriptionId,
    customerId: subPatch.paymentsLkCustomerId,
  });
  if (!entry) return null;

  const existingSub: TenantSubscription = entry.tenant.subscription || {
    plan: 'trial',
    status: 'trialing',
    trialStartedAt: new Date().toISOString(),
    trialEndsAt: new Date().toISOString(),
    monthlyPrice: 19.9,
    currency: 'USD',
  };

  const mergedRaw: TenantSubscription = {
    ...existingSub,
    ...subPatch,
  };
  if (clearPendingBankPayment) {
    delete mergedRaw.pendingBankPayment;
  }
  const cleanSub = stripUndefinedDeep(mergedRaw);

  const safeKey = encodeURIComponent(entry.key);
  const putUrl1 = `${FIREBASE_RTDB_BASE}/saasTenants/${safeKey}/subscription.json`;
  await fetch(putUrl1, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanSub),
    signal: AbortSignal.timeout(5000),
  }).catch((err) => {
    console.warn('[Payments.lk] Failed updating saasTenants subscription:', err);
  });

  // Also mirror to tenantsData/tenant-apex-main/tenants if same index matches tenant.id
  const mirrorCheck = await fetchJsonWithTimeout<{ id?: string }>(
    `${FIREBASE_RTDB_BASE}/tenantsData/tenant-apex-main/tenants/${safeKey}.json`,
    3500
  );
  if (mirrorCheck?.id === entry.tenant.id) {
    await fetch(`${FIREBASE_RTDB_BASE}/tenantsData/tenant-apex-main/tenants/${safeKey}/subscription.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanSub),
      signal: AbortSignal.timeout(4500),
    }).catch(() => undefined);
  }

  return cleanSub;
}

function normalizeSriLankanPhone(rawPhone?: string | null): string | undefined {
  if (!rawPhone) return undefined;
  const digits = rawPhone.replace(/[^\d+]/g, '');
  if (/^\+947\d{8}$/.test(digits)) return digits;
  if (/^947\d{8}$/.test(digits)) return `+${digits}`;
  if (/^07\d{8}$/.test(digits)) return digits;
  return undefined;
}

async function findOrCreateRecurringPrice(
  lk: PaymentsLk,
  billingCycle: 'monthly' | 'annual',
  lkrAmountCents: number
) {
  const targetInterval = billingCycle === 'annual' ? 'year' : 'month';
  const clampedCents = Math.min(100_000_000, Math.max(1000, Math.round(lkrAmountCents)));

  try {
    const pricesPage = await lk.prices.list({ active: 'true', limit: 100 });
    const existing = pricesPage.data.find(
      (p) =>
        p.active &&
        p.interval === targetInterval &&
        p.intervalCount === 1 &&
        p.usageType === 'licensed' &&
        p.billingScheme === 'per_unit' &&
        p.unitAmountCents === clampedCents &&
        p.product?.name?.startsWith('Apex Stock')
    );
    if (existing) return existing;
  } catch {
    // Proceed to create price directly if listing fails
  }

  const labelCycle = billingCycle === 'annual' ? 'Annual' : 'Monthly';
  const lkrDisplay = Math.round(clampedCents / 100).toLocaleString('en-US');

  return lk.prices.create(
    {
      product: {
        name: 'Apex Stock Pro SaaS',
        description: 'Apex Stock & Site Management Enterprise Cloud Subscription',
      },
      unitAmountCents: clampedCents,
      interval: targetInterval,
      intervalCount: 1,
      nickname: `Apex Pro ${labelCycle} (LKR ${lkrDisplay})`,
      usageType: 'licensed',
    },
    {
      idempotencyKey: `price-apex-${targetInterval}-${clampedCents}`,
    }
  );
}

function mapGatewaySubscriptionToPatch(
  sub: GatewaySubscription,
  fallbackBillingCycle?: 'monthly' | 'annual',
  fxContext?: {
    usdToLkrRate?: number;
    lkrAmountCents?: number;
    extraSiteSlots?: number;
    selectedCurrency?: SubscriptionPaymentCurrency;
    selectedCurrencyAmount?: number;
    fxRateToSelectedCurrency?: number;
  }
): Partial<TenantSubscription> {
  const interval = sub.price?.interval || sub.items?.[0]?.price?.interval;
  const billingCycle: 'monthly' | 'annual' =
    interval === 'year'
      ? 'annual'
      : interval === 'month'
      ? 'monthly'
      : fallbackBillingCycle || 'annual';

  const plan = billingCycle === 'annual' ? 'pro_annual' : 'pro_monthly';
  const unitCents = sub.price?.unitAmountCents || sub.items?.[0]?.price?.unitAmountCents;

  let localStatus: TenantSubscription['status'] = 'trialing';
  if (sub.status === 'active' || sub.status === 'trialing') {
    localStatus = 'active';
  } else if (sub.status === 'past_due' || sub.status === 'unpaid') {
    localStatus = 'past_due';
  } else if (sub.status === 'canceled' || sub.status === 'incomplete_expired') {
    localStatus = 'canceled';
  }

  const isPaid = sub.status === 'active';

  const patch: Partial<TenantSubscription> = {
    paymentsLkSubscriptionId: sub.id,
    paymentsLkCustomerId: sub.customerId,
    paymentsLkPriceId: sub.price?.id || sub.items?.[0]?.price?.id,
    paymentsLkMode: sub.mode,
    paymentsLkStatus: sub.status,
    autoRenew: sub.status === 'active' && !sub.cancelAtPeriodEnd,
    cancelAtPeriodEnd: Boolean(sub.cancelAtPeriodEnd),
    lastInvoiceId: sub.latestInvoiceId || undefined,
  };

  if (fxContext?.usdToLkrRate) {
    patch.lastUsdToLkrRate = fxContext.usdToLkrRate;
  }
  if (fxContext?.selectedCurrency) {
    patch.preferredPaymentCurrency = fxContext.selectedCurrency;
    patch.lastPaymentCurrency = fxContext.selectedCurrency;
  }
  if (typeof fxContext?.selectedCurrencyAmount === 'number') {
    patch.lastPaymentCurrencyAmount = fxContext.selectedCurrencyAmount;
  }
  if (typeof fxContext?.fxRateToSelectedCurrency === 'number') {
    patch.lastPaymentFxRate = fxContext.fxRateToSelectedCurrency;
  }
  if (unitCents) {
    patch.lastLkrAmountCharged = Math.round(unitCents / 100);
  } else if (fxContext?.lkrAmountCents) {
    patch.lastLkrAmountCharged = Math.round(fxContext.lkrAmountCents / 100);
  }

  if (isPaid) {
    patch.plan = plan;
    patch.status = 'active';
    patch.billingCycle = billingCycle;
    patch.paymentMethodStatus = 'active';
    patch.lastBillingDate = sub.currentPeriodStart || new Date().toISOString();
    patch.nextBillingDate = sub.currentPeriodEnd;
    if (typeof fxContext?.extraSiteSlots === 'number' && fxContext.extraSiteSlots >= 0) {
      patch.extraSiteSlots = fxContext.extraSiteSlots;
    }
  } else if (localStatus === 'past_due') {
    patch.status = 'past_due';
  } else if (localStatus === 'canceled') {
    patch.status = 'canceled';
  }

  return patch;
}

export interface CreateSubscriptionResult {
  subscriptionId: string;
  customerId: string;
  status: string;
  mode: 'test' | 'live';
  checkoutUrl: string | null;
  lkrAmountCents: number;
  lkrAmount: number;
  usdAmount: number;
  usdToLkrRate: number;
  selectedCurrency: SubscriptionPaymentCurrency;
  selectedCurrencyAmount: number;
  fxRateToSelectedCurrency: number;
  fxRates: SupportedFxRatesMap;
  fxUpdatedAt: string;
  isLiveFxRate: boolean;
  billingCycle: 'monthly' | 'annual';
  extraSiteSlots: number;
  subscriptionPatch: Partial<TenantSubscription>;
}

export async function createRecurringSubscriptionForTenant(params: {
  tenantId: string;
  billingCycle: 'monthly' | 'annual';
  extraSiteSlots?: number;
  selectedCurrency?: SubscriptionPaymentCurrency;
  baseReturnUrl: string;
  fallbackCustomerEmail?: string;
  fallbackCustomerName?: string;
}): Promise<CreateSubscriptionResult> {
  const lk = createPaymentsLkClient();
  if (!lk) {
    throw new Error('Payments.lk API key (PAYMENTS_LK_SECRET_KEY) is not configured on this server.');
  }

  const entry = await findTenantEntry({ tenantId: params.tenantId });
  const tenant = entry?.tenant;
  const email = (tenant?.contactEmail || params.fallbackCustomerEmail || '').trim();
  if (!email || !email.includes('@')) {
    throw new Error('Valid company contact email is required before starting Payments.lk subscription.');
  }
  const name = (tenant?.companyName || params.fallbackCustomerName || 'Apex Client Workspace')
    .trim()
    .slice(0, 120);
  const phone = normalizeSriLankanPhone(tenant?.contactPhone);

  const [pricing, fxMulti] = await Promise.all([
    getAuthoritativeUsdPricing(),
    getLiveMultiCurrencyRates(),
  ]);

  const selectedCurrency = normalizeServerPaymentCurrency(
    params.selectedCurrency || tenant?.subscription?.preferredPaymentCurrency || 'LKR'
  );
  const fxRateToSelectedCurrency = fxMulti.rates[selectedCurrency] || 1;

  const rawExtraSlots =
    typeof params.extraSiteSlots === 'number' && !Number.isNaN(params.extraSiteSlots)
      ? params.extraSiteSlots
      : Number(tenant?.subscription?.extraSiteSlots || 0);
  const extraSiteSlots = Math.min(500, Math.max(0, Math.round(rawExtraSlots)));

  const baseUsdAmount = params.billingCycle === 'annual' ? pricing.annualPrice : pricing.monthlyPrice;
  const extraUsdAmount =
    extraSiteSlots * pricing.extraSiteMonthlyPrice * (params.billingCycle === 'annual' ? 12 : 1);
  const usdAmount = Number((baseUsdAmount + extraUsdAmount).toFixed(2));
  const lkrAmount = Math.max(10, Math.round(usdAmount * fxMulti.usdToLkrRate));
  const lkrAmountCents = Math.min(100_000_000, Math.max(1000, lkrAmount * 100));
  const selectedCurrencyAmount =
    selectedCurrency === 'LKR'
      ? lkrAmount
      : Number((usdAmount * fxRateToSelectedCurrency).toFixed(2));

  const customer = await lk.customers.create({
    email,
    name,
    phone,
    locale: 'en',
  });

  const price = await findOrCreateRecurringPrice(lk, params.billingCycle, lkrAmountCents);

  const cleanOrigin = params.baseReturnUrl.replace(/\/+$/, '');
  const successUrl = `${cleanOrigin}/?payments_lk=success&billing_cycle=${params.billingCycle}`;
  const cancelUrl = `${cleanOrigin}/?payments_lk=cancel&billing_cycle=${params.billingCycle}`;

  // Allow fresh attempt every ~30s while keeping fast double-click idempotent
  const bucket = Math.floor(Date.now() / 30_000);
  const subscription = await lk.subscriptions.create(
    {
      customerId: customer.id,
      priceId: price.id,
      reference: `apex:${params.tenantId}:${params.billingCycle}:xs-${extraSiteSlots}`,
      successUrl,
      cancelUrl,
    },
    {
      idempotencyKey: `apex-sub-${params.tenantId}-${params.billingCycle}-xs${extraSiteSlots}-${lkrAmountCents}-${bucket}`,
    }
  );

  const subscriptionPatch = mapGatewaySubscriptionToPatch(subscription, params.billingCycle, {
    usdToLkrRate: fxMulti.usdToLkrRate,
    lkrAmountCents,
    extraSiteSlots,
    selectedCurrency,
    selectedCurrencyAmount,
    fxRateToSelectedCurrency,
  });

  // Save pending/created gateway linkage in Firebase RTDB so return callback always finds it
  await patchTenantSubscriptionInRtdb(
    params.tenantId,
    subscriptionPatch,
    subscription.status === 'active'
  );

  return {
    subscriptionId: subscription.id,
    customerId: customer.id,
    status: subscription.status,
    mode: subscription.mode,
    checkoutUrl: subscription.checkoutUrl,
    lkrAmountCents,
    lkrAmount: Math.round(lkrAmountCents / 100),
    usdAmount,
    usdToLkrRate: fxMulti.usdToLkrRate,
    selectedCurrency,
    selectedCurrencyAmount,
    fxRateToSelectedCurrency,
    fxRates: fxMulti.rates,
    fxUpdatedAt: fxMulti.updatedAt,
    isLiveFxRate: fxMulti.isLive,
    billingCycle: params.billingCycle,
    extraSiteSlots,
    subscriptionPatch,
  };
}

export async function verifyAndSyncTenantSubscription(params: {
  tenantId: string;
  subscriptionId?: string;
}): Promise<{
  verified: boolean;
  status: string;
  subscriptionPatch?: Partial<TenantSubscription>;
  updatedSubscription?: TenantSubscription | null;
  checkoutUrl?: string | null;
  message: string;
}> {
  const lk = createPaymentsLkClient();
  if (!lk) {
    throw new Error('Payments.lk API key is not configured on the server.');
  }

  const entry = await findTenantEntry({
    tenantId: params.tenantId,
    subscriptionId: params.subscriptionId,
  });
  const subId = (
    params.subscriptionId ||
    entry?.tenant?.subscription?.paymentsLkSubscriptionId ||
    ''
  ).trim();

  if (!subId) {
    return {
      verified: false,
      status: 'not_found',
      message: 'No pending or active Payments.lk subscription ID found for this workspace.',
    };
  }

  const sub = await lk.subscriptions.retrieve(subId);
  const refParsed = parseReference(sub.reference);

  // Enforce workspace ownership
  if (refParsed.tenantId && refParsed.tenantId !== params.tenantId) {
    throw new Error('Subscription ownership mismatch.');
  }
  if (
    !refParsed.tenantId &&
    entry?.tenant?.subscription?.paymentsLkSubscriptionId &&
    entry.tenant.subscription.paymentsLkSubscriptionId !== sub.id
  ) {
    throw new Error('Subscription does not belong to this workspace.');
  }

  // If still incomplete, check if its latest invoice was paid already
  let effectiveSub = sub;
  if (sub.status === 'incomplete' && sub.latestInvoiceId) {
    try {
      const inv = await lk.invoices.retrieve(sub.latestInvoiceId);
      if (inv.status === 'paid') {
        effectiveSub = await lk.subscriptions.retrieve(subId);
      }
    } catch {
      // ignore invoice retrieve error
    }
  }

  const patch = mapGatewaySubscriptionToPatch(effectiveSub, refParsed.billingCycle, {
    extraSiteSlots: refParsed.extraSiteSlots,
  });
  const isNowActive = effectiveSub.status === 'active';
  const updatedSub = await patchTenantSubscriptionInRtdb(params.tenantId, patch, isNowActive);

  return {
    verified: isNowActive,
    status: effectiveSub.status,
    subscriptionPatch: patch,
    updatedSubscription: updatedSub,
    checkoutUrl: effectiveSub.checkoutUrl,
    message: isNowActive
      ? 'Payments.lk auto-renewing subscription verified and activated!'
      : `Subscription status is currently "${effectiveSub.status}". Payment confirmation pending.`,
  };
}

export async function createBillingPortalForTenant(params: {
  tenantId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const lk = createPaymentsLkClient();
  if (!lk) {
    throw new Error('Payments.lk API key is not configured on the server.');
  }
  const entry = await findTenantEntry({ tenantId: params.tenantId });
  const customerId = entry?.tenant?.subscription?.paymentsLkCustomerId;
  if (!customerId) {
    throw new Error('No Payments.lk billing customer linked to this workspace yet.');
  }

  const portal = await lk.billingPortal.sessions.create({
    customerId,
    returnUrl: params.returnUrl,
  });
  return { url: portal.url };
}

export async function updateAutoRenewForTenant(params: {
  tenantId: string;
  action: 'cancel' | 'resume';
}): Promise<{ status: string; autoRenew: boolean; cancelAtPeriodEnd: boolean; subscriptionPatch: Partial<TenantSubscription> }> {
  const lk = createPaymentsLkClient();
  if (!lk) {
    throw new Error('Payments.lk API key is not configured on the server.');
  }
  const entry = await findTenantEntry({ tenantId: params.tenantId });
  const subId = entry?.tenant?.subscription?.paymentsLkSubscriptionId;
  if (!subId) {
    throw new Error('No Payments.lk subscription found for this workspace.');
  }

  const updated =
    params.action === 'cancel'
      ? await lk.subscriptions.cancel(subId, { atPeriodEnd: true })
      : await lk.subscriptions.resume(subId);

  const patch = mapGatewaySubscriptionToPatch(updated);
  await patchTenantSubscriptionInRtdb(params.tenantId, patch, false);

  return {
    status: updated.status,
    autoRenew: updated.status === 'active' && !updated.cancelAtPeriodEnd,
    cancelAtPeriodEnd: Boolean(updated.cancelAtPeriodEnd),
    subscriptionPatch: patch,
  };
}

async function markEventProcessedIfNew(eventId: string, eventType: string, tenantId?: string): Promise<boolean> {
  if (processedEventIds.has(eventId)) return false;

  const safeId = encodeURIComponent(eventId.replace(/[.#$[\]/]/g, '_'));
  const rtdbCheck = await fetchJsonWithTimeout<{ processedAt?: string }>(
    `${FIREBASE_RTDB_BASE}/tenantsData/tenant-apex-main/paymentWebhookEvents/${safeId}.json`,
    2500
  );
  if (rtdbCheck?.processedAt) {
    processedEventIds.set(eventId, Date.now());
    return false;
  }

  if (processedEventIds.size >= MAX_TRACKED_EVENTS) {
    const oldest = processedEventIds.keys().next().value;
    if (oldest) processedEventIds.delete(oldest);
  }
  processedEventIds.set(eventId, Date.now());

  await fetch(
    `${FIREBASE_RTDB_BASE}/tenantsData/tenant-apex-main/paymentWebhookEvents/${safeId}.json`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        eventType,
        tenantId: tenantId || null,
        processedAt: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(3000),
    }
  ).catch(() => undefined);

  return true;
}

export async function processPaymentsLkWebhook(
  rawBody: Buffer | string,
  signatureHeader: string | string[] | undefined
): Promise<{ received: boolean; eventType: string; testPing?: boolean; duplicate?: boolean }> {
  const lk = createPaymentsLkClient();
  const webhookSecret = (process.env.PAYMENTS_LK_WEBHOOK_SECRET || '').trim();
  if (!lk || !webhookSecret) {
    throw new Error('Payments.lk credentials or webhook secret are not configured.');
  }

  const event = lk.webhooks.constructEvent(rawBody, signatureHeader, webhookSecret);

  if (event.type === 'test.ping') {
    return { received: true, eventType: event.type, testPing: true };
  }

  const isFirst = await markEventProcessedIfNew(event.id, event.type);
  if (!isFirst) {
    return { received: true, eventType: event.type, duplicate: true };
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'customer.subscription.paused':
    case 'customer.subscription.resumed':
    case 'customer.subscription.trial_will_end': {
      const sub = event.data as GatewaySubscription;
      const refParsed = parseReference(sub.reference);
      const entry = await findTenantEntry({
        tenantId: refParsed.tenantId,
        subscriptionId: sub.id,
        customerId: sub.customerId,
      });
      if (entry) {
        const patch = mapGatewaySubscriptionToPatch(sub, refParsed.billingCycle, {
          extraSiteSlots: refParsed.extraSiteSlots,
        });
        patch.lastWebhookEventId = event.id;
        await patchTenantSubscriptionInRtdb(
          entry.tenant.id,
          patch,
          sub.status === 'active'
        );
      }
      break;
    }

    case 'invoice.paid': {
      const inv = event.data as GatewayInvoice;
      if (inv.subscriptionId) {
        const sub = await lk.subscriptions.retrieve(inv.subscriptionId);
        const refParsed = parseReference(sub.reference);
        const entry = await findTenantEntry({
          tenantId: refParsed.tenantId,
          subscriptionId: sub.id,
          customerId: inv.customerId,
        });
        if (entry) {
          const patch = mapGatewaySubscriptionToPatch(sub, refParsed.billingCycle, {
            lkrAmountCents: inv.amountPaidCents || inv.totalCents,
            extraSiteSlots: refParsed.extraSiteSlots,
          });
          patch.lastBillingDate = inv.paidAt || sub.currentPeriodStart || new Date().toISOString();
          patch.lastInvoiceId = inv.id;
          patch.lastWebhookEventId = event.id;
          await patchTenantSubscriptionInRtdb(entry.tenant.id, patch, true);
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const inv = event.data as GatewayInvoice;
      const entry = await findTenantEntry({
        subscriptionId: inv.subscriptionId,
        customerId: inv.customerId,
      });
      if (entry) {
        await patchTenantSubscriptionInRtdb(entry.tenant.id, {
          paymentsLkStatus: 'past_due',
          status: 'past_due',
          lastInvoiceId: inv.id,
          lastWebhookEventId: event.id,
        });
      }
      break;
    }

    case 'payment.succeeded': {
      const payment = event.data as GatewayPayment;
      if (payment.invoiceId) {
        try {
          const inv = await lk.invoices.retrieve(payment.invoiceId);
          if (inv.subscriptionId) {
            const sub = await lk.subscriptions.retrieve(inv.subscriptionId);
            const refParsed = parseReference(sub.reference);
            const entry = await findTenantEntry({
              tenantId: refParsed.tenantId,
              subscriptionId: sub.id,
              customerId: inv.customerId,
            });
            if (entry) {
              const patch = mapGatewaySubscriptionToPatch(sub, refParsed.billingCycle, {
                lkrAmountCents: payment.amountCents,
                extraSiteSlots: refParsed.extraSiteSlots,
              });
              patch.lastBillingDate = payment.succeededAt || new Date().toISOString();
              patch.lastInvoiceId = inv.id;
              patch.lastWebhookEventId = event.id;
              await patchTenantSubscriptionInRtdb(entry.tenant.id, patch, true);
            }
          }
        } catch {
          // ignore if invoice lookup unavailable
        }
      }
      break;
    }

    default:
      break;
  }

  return { received: true, eventType: event.type };
}

export function formatPaymentsLkApiError(err: unknown): {
  status: number;
  code: string;
  message: string;
} {
  if (err instanceof WebhookSignatureError) {
    return { status: 400, code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature.' };
  }
  if (err instanceof ValidationError) {
    return { status: 400, code: err.code || 'VALIDATION_ERROR', message: err.apiMessage || err.message };
  }
  if (err instanceof ApiError) {
    return {
      status: err.status || 400,
      code: err.code || 'PAYMENTS_LK_API_ERROR',
      message: err.apiMessage || err.message,
    };
  }
  if (err instanceof Error) {
    return { status: 500, code: 'SERVER_ERROR', message: err.message };
  }
  return { status: 500, code: 'UNKNOWN_ERROR', message: 'Unexpected payment gateway error.' };
}
