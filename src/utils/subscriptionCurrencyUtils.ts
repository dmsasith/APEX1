import type { SubscriptionPaymentCurrency, Tenant } from '../types';

export interface CurrencyMeta {
  code: SubscriptionPaymentCurrency;
  symbol: string;
  name: string;
  shortName: string;
  countryLabel: string;
  decimals: 0 | 2;
}

export const SUPPORTED_SUBSCRIPTION_CURRENCIES: CurrencyMeta[] = [
  {
    code: 'LKR',
    symbol: 'Rs.',
    name: 'Sri Lankan Rupee',
    shortName: 'LKR',
    countryLabel: 'Sri Lanka',
    decimals: 0,
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    shortName: 'USD',
    countryLabel: 'United States',
    decimals: 2,
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    shortName: 'EUR',
    countryLabel: 'Eurozone',
    decimals: 2,
  },
  {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    shortName: 'GBP',
    countryLabel: 'United Kingdom',
    decimals: 2,
  },
  {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    shortName: 'AUD',
    countryLabel: 'Australia',
    decimals: 2,
  },
  {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    shortName: 'SGD',
    countryLabel: 'Singapore',
    decimals: 2,
  },
];

export type FxRatesMap = Record<SubscriptionPaymentCurrency, number>;

export const DEFAULT_FALLBACK_FX_RATES: FxRatesMap = {
  USD: 1,
  LKR: 300.0,
  EUR: 0.92,
  GBP: 0.79,
  AUD: 1.53,
  SGD: 1.34,
};

export interface LiveFxSnapshot {
  rates: FxRatesMap;
  isLive: boolean;
  fetchedAt: string;
  source: string;
}

const FX_STORAGE_KEY = 'apex_live_fx_rates_v1';
const FX_CACHE_TTL_MS = 10 * 60 * 1000;

export function normalizePaymentCurrency(raw?: string | null): SubscriptionPaymentCurrency {
  const upper = (raw || '').trim().toUpperCase();
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

export function getCurrencyMeta(code: SubscriptionPaymentCurrency | string): CurrencyMeta {
  const normalized = normalizePaymentCurrency(code);
  return (
    SUPPORTED_SUBSCRIPTION_CURRENCIES.find((c) => c.code === normalized) ||
    SUPPORTED_SUBSCRIPTION_CURRENCIES[0]
  );
}

export function detectDefaultPaymentCurrency(
  tenant?: Pick<Tenant, 'currencySymbol' | 'country' | 'subscription'> | null
): SubscriptionPaymentCurrency {
  if (tenant?.subscription?.preferredPaymentCurrency) {
    return normalizePaymentCurrency(tenant.subscription.preferredPaymentCurrency);
  }
  const sym = (tenant?.currencySymbol || '').trim().toUpperCase();
  const country = (tenant?.country || '').trim().toLowerCase();

  if (sym === 'RS.' || sym === 'RS' || sym === 'LKR' || country.includes('sri lanka')) return 'LKR';
  if (sym === '€' || sym === 'EUR' || country.includes('germany') || country.includes('france') || country.includes('euro')) return 'EUR';
  if (sym === '£' || sym === 'GBP' || country.includes('united kingdom') || country === 'uk') return 'GBP';
  if (sym === 'A$' || sym === 'AUD' || country.includes('australia')) return 'AUD';
  if (sym === 'S$' || sym === 'SGD' || country.includes('singapore')) return 'SGD';
  if (sym === '$' || sym === 'USD' || country.includes('united states')) return 'USD';
  return 'LKR';
}

export function mergeFxRates(
  partial?: Partial<Record<string, number>> | null,
  customUsdToLkrRate?: number
): FxRatesMap {
  const next: FxRatesMap = { ...DEFAULT_FALLBACK_FX_RATES };
  for (const meta of SUPPORTED_SUBSCRIPTION_CURRENCIES) {
    const val = Number(partial?.[meta.code]);
    if (Number.isFinite(val) && val > 0) {
      next[meta.code] = meta.code === 'USD' ? 1 : Number(val.toFixed(meta.code === 'LKR' ? 2 : 4));
    }
  }
  if (
    typeof customUsdToLkrRate === 'number' &&
    Number.isFinite(customUsdToLkrRate) &&
    customUsdToLkrRate > 50 &&
    (!partial?.LKR || !Number.isFinite(Number(partial.LKR)))
  ) {
    next.LKR = Number(customUsdToLkrRate.toFixed(2));
  }
  next.USD = 1;
  return next;
}

export function convertUsdToCurrency(
  usdAmount: number,
  currencyCode: SubscriptionPaymentCurrency,
  rates: FxRatesMap
): number {
  const safeUsd = Number.isFinite(usdAmount) ? Math.max(0, usdAmount) : 0;
  if (currencyCode === 'USD') return Number(safeUsd.toFixed(2));
  const rate = rates[currencyCode] || DEFAULT_FALLBACK_FX_RATES[currencyCode] || 1;
  const converted = safeUsd * rate;
  if (currencyCode === 'LKR') {
    return Math.round(converted);
  }
  return Number(converted.toFixed(2));
}

export function formatConvertedCurrency(
  amountInCurrency: number,
  currencyCode: SubscriptionPaymentCurrency,
  includeCode = false
): string {
  const meta = getCurrencyMeta(currencyCode);
  const formattedNumber =
    meta.decimals === 0
      ? Math.round(amountInCurrency).toLocaleString('en-US')
      : Number(amountInCurrency).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  const base =
    meta.code === 'LKR'
      ? `${meta.symbol} ${formattedNumber}`
      : `${meta.symbol}${formattedNumber}`;
  return includeCode ? `${base} ${meta.code}` : base;
}

export function formatUsdConverted(
  usdAmount: number,
  currencyCode: SubscriptionPaymentCurrency,
  rates: FxRatesMap,
  includeCode = false
): string {
  const converted = convertUsdToCurrency(usdAmount, currencyCode, rates);
  return formatConvertedCurrency(converted, currencyCode, includeCode);
}

export function formatFxRateLabel(
  currencyCode: SubscriptionPaymentCurrency,
  rates: FxRatesMap
): string {
  if (currencyCode === 'USD') return '$1.00 USD = $1.00 USD (Base)';
  const meta = getCurrencyMeta(currencyCode);
  const rate = rates[currencyCode] || DEFAULT_FALLBACK_FX_RATES[currencyCode];
  if (currencyCode === 'LKR') {
    return `$1 USD = Rs. ${rate.toFixed(2)} LKR`;
  }
  return `$1 USD = ${meta.symbol}${rate.toFixed(4)} ${meta.code}`;
}

export function readCachedFxSnapshot(fallbackLkrRate?: number): LiveFxSnapshot {
  try {
    const raw = localStorage.getItem(FX_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LiveFxSnapshot>;
      if (parsed?.rates) {
        return {
          rates: mergeFxRates(parsed.rates, fallbackLkrRate),
          isLive: Boolean(parsed.isLive),
          fetchedAt: parsed.fetchedAt || new Date().toISOString(),
          source: parsed.source || 'cached',
        };
      }
    }
  } catch {
    // ignore storage errors
  }
  return {
    rates: mergeFxRates(undefined, fallbackLkrRate),
    isLive: false,
    fetchedAt: new Date().toISOString(),
    source: 'default',
  };
}

let inFlightFxPromise: Promise<LiveFxSnapshot> | null = null;

function persistLiveFxSnapshot(snapshot: LiveFxSnapshot) {
  try {
    localStorage.setItem(
      FX_STORAGE_KEY,
      JSON.stringify({ ...snapshot, cachedAtMs: Date.now() })
    );
    const masterRaw = localStorage.getItem('apex_master_bank_config_v1');
    const existingMaster = masterRaw ? JSON.parse(masterRaw) : {};
    localStorage.setItem(
      'apex_master_bank_config_v1',
      JSON.stringify({ ...existingMaster, usdToLkrRate: snapshot.rates.LKR })
    );
  } catch {
    // ignore storage errors
  }
}

export async function fetchLiveMultiCurrencyRates(options?: {
  forceRefresh?: boolean;
  fallbackLkrRate?: number;
}): Promise<LiveFxSnapshot> {
  if (!options?.forceRefresh) {
    try {
      const raw = localStorage.getItem(FX_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LiveFxSnapshot & { cachedAtMs?: number };
        if (
          parsed?.rates &&
          typeof parsed.cachedAtMs === 'number' &&
          Date.now() - parsed.cachedAtMs < FX_CACHE_TTL_MS &&
          parsed.isLive
        ) {
          return {
            rates: mergeFxRates(parsed.rates, options?.fallbackLkrRate),
            isLive: true,
            fetchedAt: parsed.fetchedAt,
            source: parsed.source || 'open.er-api.com',
          };
        }
      }
    } catch {
      // continue to live fetch
    }
  }

  if (inFlightFxPromise) {
    return inFlightFxPromise;
  }

  inFlightFxPromise = (async () => {
    const parseRatesObject = (
      rawRates: Record<string, unknown> | undefined,
      source: string,
      fetchedAt?: string
    ): LiveFxSnapshot | null => {
      const lkr = Number(rawRates?.LKR);
      if (!Number.isFinite(lkr) || lkr <= 50 || lkr >= 2000) return null;
      const rates = mergeFxRates(
        {
          USD: 1,
          LKR: lkr,
          EUR: Number(rawRates?.EUR),
          GBP: Number(rawRates?.GBP),
          AUD: Number(rawRates?.AUD),
          SGD: Number(rawRates?.SGD),
        },
        options?.fallbackLkrRate
      );
      const snapshot: LiveFxSnapshot = {
        rates,
        isLive: true,
        fetchedAt: fetchedAt || new Date().toISOString(),
        source,
      };
      persistLiveFxSnapshot(snapshot);
      return snapshot;
    };

    // 1. Primary live FX feed
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.result === 'success' && data?.rates) {
          const snap = parseRatesObject(data.rates, 'open.er-api.com', data.time_last_update_utc);
          if (snap) return snap;
        }
      }
    } catch {
      // try secondary feed
    }

    // 2. Secondary live FX feed
    try {
      const res2 = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2?.rates) {
          const snap = parseRatesObject(data2.rates, 'exchangerate-api.com', data2.date);
          if (snap) return snap;
        }
      }
    } catch {
      // try backend endpoint
    }

    // 3. Backend /api/payments/status live FX feed
    try {
      const res3 = await fetch('/api/payments/status', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4500),
      });
      const ct = res3.headers.get('content-type') || '';
      if (res3.ok && ct.includes('application/json')) {
        const data3 = await res3.json();
        if (data3?.isLiveFxRate && data3?.fxRates) {
          const snap = parseRatesObject(data3.fxRates, 'server-fx', data3.fxUpdatedAt);
          if (snap) return snap;
        }
      }
    } catch {
      // fallback below
    }

    return readCachedFxSnapshot(options?.fallbackLkrRate);
  })().finally(() => {
    inFlightFxPromise = null;
  });

  return inFlightFxPromise;
}
