import { ALL_WORLD_COUNTRIES } from './worldCountriesData';

export interface CountryPhoneRule {
  code: string;        // ISO 2-letter code e.g. 'LK'
  name: string;        // Country name e.g. 'Sri Lanka'
  dialCode: string;    // International prefix with '+' e.g. '+94'
  dialDigits: string;  // Digits of dial code e.g. '94'
  flag: string;        // Emoji flag e.g. '🇱🇰'
  nationalDigits: number; // Significant digits after dial code (or after trunk '0') e.g. 9 for Sri Lanka
  allowLeadingZero: boolean; // Whether local format starts with '0' (making local length = nationalDigits + 1)
  localPlaceholder: string; // Example local format e.g. '077 123 4567'
  intlPlaceholder: string;  // Example international format e.g. '+94 77 123 4567'
  currencies: string[];
  timezones: string[];
  isFlexibleLength?: boolean; // True for countries using flexible E.164 range validation (6–12 digits)
  minDigits?: number;
  maxDigits?: number;
}

export const COUNTRY_PHONE_RULES: CountryPhoneRule[] = [
  {
    code: 'LK',
    name: 'Sri Lanka',
    dialCode: '+94',
    dialDigits: '94',
    flag: '🇱🇰',
    nationalDigits: 9,
    allowLeadingZero: true,
    localPlaceholder: '077 123 4567 (10 digits)',
    intlPlaceholder: '+94 77 123 4567',
    currencies: ['Rs.', 'LKR', 'Rs'],
    timezones: ['Asia/Colombo'],
  },
  {
    code: 'IN',
    name: 'India',
    dialCode: '+91',
    dialDigits: '91',
    flag: '🇮🇳',
    nationalDigits: 10,
    allowLeadingZero: true,
    localPlaceholder: '98765 43210 (10 digits)',
    intlPlaceholder: '+91 98765 43210',
    currencies: ['₹', 'INR'],
    timezones: ['Asia/Kolkata', 'Asia/Calcutta'],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    dialCode: '+971',
    dialDigits: '971',
    flag: '🇦🇪',
    nationalDigits: 9,
    allowLeadingZero: true,
    localPlaceholder: '050 123 4567 (10 digits)',
    intlPlaceholder: '+971 50 123 4567',
    currencies: ['AED', 'د.إ'],
    timezones: ['Asia/Dubai'],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dialCode: '+44',
    dialDigits: '44',
    flag: '🇬🇧',
    nationalDigits: 10,
    allowLeadingZero: true,
    localPlaceholder: '07700 900077 (11 digits)',
    intlPlaceholder: '+44 7700 900077',
    currencies: ['£', 'GBP'],
    timezones: ['Europe/London'],
  },
  {
    code: 'US',
    name: 'United States / Canada',
    dialCode: '+1',
    dialDigits: '1',
    flag: '🇺🇸',
    nationalDigits: 10,
    allowLeadingZero: false,
    localPlaceholder: '(555) 234-5678 (10 digits)',
    intlPlaceholder: '+1 555 234 5678',
    currencies: ['$', 'USD', 'CAD'],
    timezones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Toronto'],
  },
  {
    code: 'AU',
    name: 'Australia',
    dialCode: '+61',
    dialDigits: '61',
    flag: '🇦🇺',
    nationalDigits: 9,
    allowLeadingZero: true,
    localPlaceholder: '0412 345 678 (10 digits)',
    intlPlaceholder: '+61 412 345 678',
    currencies: ['A$', 'AUD'],
    timezones: ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth', 'Australia/Brisbane'],
  },
  {
    code: 'SG',
    name: 'Singapore',
    dialCode: '+65',
    dialDigits: '65',
    flag: '🇸🇬',
    nationalDigits: 8,
    allowLeadingZero: false,
    localPlaceholder: '8123 4567 (8 digits)',
    intlPlaceholder: '+65 8123 4567',
    currencies: ['S$', 'SGD'],
    timezones: ['Asia/Singapore'],
  },
  {
    code: 'QA',
    name: 'Qatar',
    dialCode: '+974',
    dialDigits: '974',
    flag: '🇶🇦',
    nationalDigits: 8,
    allowLeadingZero: false,
    localPlaceholder: '3312 3456 (8 digits)',
    intlPlaceholder: '+974 3312 3456',
    currencies: ['QAR', 'QR'],
    timezones: ['Asia/Qatar'],
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    dialCode: '+966',
    dialDigits: '966',
    flag: '🇸🇦',
    nationalDigits: 9,
    allowLeadingZero: true,
    localPlaceholder: '050 123 4567 (10 digits)',
    intlPlaceholder: '+966 50 123 4567',
    currencies: ['SAR', 'SR'],
    timezones: ['Asia/Riyadh'],
  },
  {
    code: 'OM',
    name: 'Oman',
    dialCode: '+968',
    dialDigits: '968',
    flag: '🇴🇲',
    nationalDigits: 8,
    allowLeadingZero: false,
    localPlaceholder: '9123 4567 (8 digits)',
    intlPlaceholder: '+968 9123 4567',
    currencies: ['OMR'],
    timezones: ['Asia/Muscat'],
  },
  {
    code: 'KW',
    name: 'Kuwait',
    dialCode: '+965',
    dialDigits: '965',
    flag: '🇰🇼',
    nationalDigits: 8,
    allowLeadingZero: false,
    localPlaceholder: '5123 4567 (8 digits)',
    intlPlaceholder: '+965 5123 4567',
    currencies: ['KWD'],
    timezones: ['Asia/Kuwait'],
  },
  {
    code: 'BH',
    name: 'Bahrain',
    dialCode: '+973',
    dialDigits: '973',
    flag: '🇧🇭',
    nationalDigits: 8,
    allowLeadingZero: false,
    localPlaceholder: '3612 3456 (8 digits)',
    intlPlaceholder: '+973 3612 3456',
    currencies: ['BHD'],
    timezones: ['Asia/Bahrain'],
  },
  {
    code: 'MV',
    name: 'Maldives',
    dialCode: '+960',
    dialDigits: '960',
    flag: '🇲🇻',
    nationalDigits: 7,
    allowLeadingZero: false,
    localPlaceholder: '771 2345 (7 digits)',
    intlPlaceholder: '+960 771 2345',
    currencies: ['MVR', 'Rf'],
    timezones: ['Indian/Maldives'],
  },
  {
    code: 'MY',
    name: 'Malaysia',
    dialCode: '+60',
    dialDigits: '60',
    flag: '🇲🇾',
    nationalDigits: 9,
    allowLeadingZero: true,
    localPlaceholder: '012 345 6789 (10 digits)',
    intlPlaceholder: '+60 12 345 6789',
    currencies: ['RM', 'MYR'],
    timezones: ['Asia/Kuala_Lumpur'],
  },
  {
    code: 'JP',
    name: 'Japan',
    dialCode: '+81',
    dialDigits: '81',
    flag: '🇯🇵',
    nationalDigits: 10,
    allowLeadingZero: true,
    localPlaceholder: '090 1234 5678 (11 digits)',
    intlPlaceholder: '+81 90 1234 5678',
    currencies: ['¥', 'JPY'],
    timezones: ['Asia/Tokyo'],
  },
  {
    code: 'DE',
    name: 'Germany / Europe',
    dialCode: '+49',
    dialDigits: '49',
    flag: '🇩🇪',
    nationalDigits: 10,
    allowLeadingZero: true,
    localPlaceholder: '0151 23456789 (11 digits)',
    intlPlaceholder: '+49 151 23456789',
    currencies: ['€', 'EUR'],
    timezones: ['Europe/Berlin', 'Europe/Paris', 'Europe/Rome', 'Europe/Madrid', 'Europe/Amsterdam'],
  },
  {
    code: 'BD',
    name: 'Bangladesh',
    dialCode: '+880',
    dialDigits: '880',
    flag: '🇧🇩',
    nationalDigits: 10,
    allowLeadingZero: true,
    localPlaceholder: '01712 345678 (11 digits)',
    intlPlaceholder: '+880 1712 345678',
    currencies: ['৳', 'BDT'],
    timezones: ['Asia/Dhaka'],
  },
  {
    code: 'PK',
    name: 'Pakistan',
    dialCode: '+92',
    dialDigits: '92',
    flag: '🇵🇰',
    nationalDigits: 10,
    allowLeadingZero: true,
    localPlaceholder: '0300 1234567 (11 digits)',
    intlPlaceholder: '+92 300 1234567',
    currencies: ['PKR'],
    timezones: ['Asia/Karachi'],
  },
  {
    code: 'NP',
    name: 'Nepal',
    dialCode: '+977',
    dialDigits: '977',
    flag: '🇳🇵',
    nationalDigits: 10,
    allowLeadingZero: true,
    localPlaceholder: '984 1234567 (10 digits)',
    intlPlaceholder: '+977 984 1234567',
    currencies: ['NPR'],
    timezones: ['Asia/Kathmandu'],
  },
];

// Full list of ~197 world countries combining exact rules (where defined) + flexible international phone rules
const detailedRuleByCode = new Map<string, CountryPhoneRule>(
  COUNTRY_PHONE_RULES.map((r) => [r.code.toUpperCase(), r])
);

export const ALL_COUNTRY_PHONE_RULES: CountryPhoneRule[] = ALL_WORLD_COUNTRIES.map((wc) => {
  const exact = detailedRuleByCode.get(wc.code.toUpperCase());
  if (exact) {
    return {
      ...exact,
      name: wc.name, // Clean individual country name (e.g. "United States", "Germany")
      flag: wc.flag,
      currencies: exact.currencies.includes(wc.defaultCurrency)
        ? exact.currencies
        : [wc.defaultCurrency, ...exact.currencies],
    };
  }
  if (wc.code === 'CA') {
    return {
      code: 'CA',
      name: 'Canada',
      dialCode: '+1',
      dialDigits: '1',
      flag: wc.flag,
      nationalDigits: 10,
      allowLeadingZero: false,
      localPlaceholder: '(416) 555-0199 (10 digits)',
      intlPlaceholder: '+1 416 555 0199',
      currencies: ['C$', 'CAD', '$'],
      timezones: ['America/Toronto', 'America/Vancouver'],
    };
  }
  return {
    code: wc.code,
    name: wc.name,
    dialCode: wc.dialCode,
    dialDigits: wc.dialDigits,
    flag: wc.flag,
    nationalDigits: 9,
    minDigits: 6,
    maxDigits: 12,
    isFlexibleLength: true,
    allowLeadingZero: true,
    localPlaceholder: `${wc.dialCode} ... (phone number)`,
    intlPlaceholder: `${wc.dialCode} ...`,
    currencies: [wc.defaultCurrency],
    timezones: wc.timezones || [],
  };
});

// Sort dial rules longest dialDigits first so +971 matches before +9, +1-268 before +1, etc.
// Prioritize detailed rules when dialDigits length matches (so +1 defaults to US unless preferred).
const DIAL_SORTED_RULES = [...ALL_COUNTRY_PHONE_RULES].sort((a, b) => {
  if (b.dialDigits.length !== a.dialDigits.length) {
    return b.dialDigits.length - a.dialDigits.length;
  }
  const aDetailed = detailedRuleByCode.has(a.code) ? 1 : 0;
  const bDetailed = detailedRuleByCode.has(b.code) ? 1 : 0;
  return bDetailed - aDetailed;
});

/**
 * Finds a country rule by explicit dial prefix if the input starts with '+' or '00'.
 * If preferredCountryName is already selected and its dial prefix matches, keeps it.
 */
export function matchCountryByDialPrefix(
  phoneValue?: string,
  preferredCountryName?: string
): CountryPhoneRule | null {
  if (!phoneValue) return null;
  const trimmed = phoneValue.trim();
  let digitsAfterPlus = '';
  if (trimmed.startsWith('+')) {
    digitsAfterPlus = trimmed.slice(1).replace(/\D/g, '');
  } else if (trimmed.startsWith('00')) {
    digitsAfterPlus = trimmed.slice(2).replace(/\D/g, '');
  } else {
    return null;
  }
  if (!digitsAfterPlus) return null;

  if (preferredCountryName) {
    const pref = matchCountryByNameOrCode(preferredCountryName);
    if (pref && digitsAfterPlus.startsWith(pref.dialDigits)) {
      return pref;
    }
  }

  for (const rule of DIAL_SORTED_RULES) {
    if (digitsAfterPlus.startsWith(rule.dialDigits)) {
      return rule;
    }
  }
  return null;
}

/**
 * Finds a country rule by country name or ISO code across ALL world countries.
 * Checks exact matches & known aliases first so e.g. "Niger" never collides with "Nigeria".
 */
export function matchCountryByNameOrCode(countryNameOrCode?: string): CountryPhoneRule | null {
  if (!countryNameOrCode) return null;
  const norm = countryNameOrCode.trim().toLowerCase();
  if (!norm) return null;

  // 1. Exact matches across ALL world countries
  for (const rule of ALL_COUNTRY_PHONE_RULES) {
    if (
      rule.code.toLowerCase() === norm ||
      rule.name.toLowerCase() === norm ||
      rule.dialCode.toLowerCase() === norm
    ) {
      return rule;
    }
  }

  // 2. Common legacy aliases
  if (norm === 'uk' || norm === 'great britain' || norm === 'england') {
    return ALL_COUNTRY_PHONE_RULES.find((r) => r.code === 'GB') || COUNTRY_PHONE_RULES[3];
  }
  if (norm === 'uae' || norm === 'dubai') {
    return ALL_COUNTRY_PHONE_RULES.find((r) => r.code === 'AE') || COUNTRY_PHONE_RULES[2];
  }
  if (norm === 'usa' || norm === 'united states / canada') {
    return ALL_COUNTRY_PHONE_RULES.find((r) => r.code === 'US') || COUNTRY_PHONE_RULES[4];
  }
  if (norm === 'germany / europe') {
    return ALL_COUNTRY_PHONE_RULES.find((r) => r.code === 'DE') || COUNTRY_PHONE_RULES[15];
  }

  // 3. Partial match across all world countries
  for (const rule of ALL_COUNTRY_PHONE_RULES) {
    const rName = rule.name.toLowerCase();
    if (rName.includes(norm) || norm.includes(rName)) {
      return rule;
    }
  }

  return null;
}

/**
 * Reads active tenant country & currency symbol from localStorage as a fallback
 * when callers invoke detectActivePhoneCountry / enforceCountryPhoneInput without options.
 */
function getStoredTenantPhoneContext(): { tenantCountry?: string; currencySymbol?: string } {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const prefix = 'apex_stock_site_v1_';
    const activeTenantId = window.localStorage.getItem(prefix + 'current_tenant_id') || 'tenant-apex-main';

    let tenantCountry: string | undefined;
    let currencySymbol: string | undefined;

    const rawTenants =
      window.localStorage.getItem(prefix + 'tenants') ||
      window.localStorage.getItem(`${prefix}tenant-apex-main_tenants`);
    if (rawTenants) {
      const parsedTenants = JSON.parse(rawTenants);
      if (Array.isArray(parsedTenants)) {
        const matched = parsedTenants.find((t: any) => t && t.id === activeTenantId);
        if (matched) {
          if (typeof matched.country === 'string' && matched.country.trim()) {
            tenantCountry = matched.country.trim();
          }
          if (typeof matched.currencySymbol === 'string' && matched.currencySymbol.trim()) {
            currencySymbol = matched.currencySymbol.trim();
          }
        }
      }
    }

    const rawTenantConfig =
      window.localStorage.getItem(`${prefix}${activeTenantId}_config`) ||
      (activeTenantId === 'tenant-apex-main' ? window.localStorage.getItem(prefix + 'config') : null);
    if (rawTenantConfig) {
      const parsedCfg = JSON.parse(rawTenantConfig);
      if (parsedCfg && typeof parsedCfg.currencySymbol === 'string' && parsedCfg.currencySymbol.trim()) {
        currencySymbol = parsedCfg.currencySymbol.trim();
      }
    }

    return { tenantCountry, currencySymbol };
  } catch {
    return {};
  }
}

/**
 * Detects the active country phone rule using:
 * 1. Explicit +dialCode in the typed phone number (respecting selected country on shared codes like +1)
 * 2. Explicit tenantCountry / form country override (or stored active tenant country)
 * 3. Currency symbol if distinctive (or stored active tenant currency, e.g. Rs. -> Sri Lanka)
 * 4. Browser timezone (e.g. Asia/Colombo -> Sri Lanka)
 * 5. Fallback to Sri Lanka (+94)
 */
export function detectActivePhoneCountry(options?: {
  phoneValue?: string;
  tenantCountry?: string;
  currencySymbol?: string;
}): CountryPhoneRule {
  const stored = getStoredTenantPhoneContext();
  const effectiveCountry = options?.tenantCountry || stored.tenantCountry;
  const effectiveCurrency = options?.currencySymbol || stored.currencySymbol;

  // 1. Check dialed prefix (+94, +971, +44, +1, +33, etc.)
  const byDial = matchCountryByDialPrefix(options?.phoneValue, effectiveCountry);
  if (byDial) return byDial;

  // 2. Check explicit or stored tenant country across ALL world countries
  const byCountry = matchCountryByNameOrCode(effectiveCountry);
  if (byCountry) return byCountry;

  // 3. Check currency symbol (e.g. 'Rs.' / 'LKR' -> Sri Lanka)
  if (effectiveCurrency) {
    const byCurr = ALL_COUNTRY_PHONE_RULES.find((r) => r.currencies.includes(effectiveCurrency));
    if (byCurr) return byCurr;
  }

  // 4. Check browser timezone
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      const byTz = ALL_COUNTRY_PHONE_RULES.find((r) => r.timezones.includes(tz));
      if (byTz) return byTz;
    }
  } catch {
    // ignore timezone errors
  }

  // 5. Default to Sri Lanka (+94)
  return ALL_COUNTRY_PHONE_RULES.find((r) => r.code === 'LK') || COUNTRY_PHONE_RULES[0];
}

export interface PhoneAnalysisResult {
  country: CountryPhoneRule;
  mode: 'international' | 'local_zero' | 'national';
  enteredSubscriberDigits: number;
  expectedSubscriberDigits: number;
  enteredTotalDigits: number;
  expectedTotalDigits: number;
  isValid: boolean;
  isComplete: boolean;
  isEmpty: boolean;
  error?: string;
  statusLabel: string;
}

const isFlexibleCountValid = (entered: number, country: CountryPhoneRule, extraLeadingZero: number = 0): boolean => {
  const min = (country.minDigits ?? 6) + extraLeadingZero;
  const max = (country.maxDigits ?? 12) + extraLeadingZero;
  return entered >= min && entered <= max;
};

/**
 * Analyzes a phone number against the active country rule.
 * Supports exact national rules for 19 primary countries and standard ITU E.164 range validation (6-12 subscriber digits) for all other world countries.
 */
export function analyzeCountryPhone(
  phoneValue: string,
  options?: {
    tenantCountry?: string;
    currencySymbol?: string;
    required?: boolean;
  }
): PhoneAnalysisResult {
  const country = detectActivePhoneCountry({
    phoneValue,
    tenantCountry: options?.tenantCountry,
    currencySymbol: options?.currencySymbol,
  });

  const isFlex = Boolean(country.isFlexibleLength);
  const minSub = country.minDigits ?? 6;
  const maxSub = country.maxDigits ?? 12;

  const trimmed = (phoneValue || '').trim();
  const allDigits = trimmed.replace(/\D/g, '');

  if (!trimmed || allDigits.length === 0) {
    const defaultExpected = country.allowLeadingZero ? country.nationalDigits + 1 : country.nationalDigits;
    return {
      country,
      mode: country.allowLeadingZero ? 'local_zero' : 'national',
      enteredSubscriberDigits: 0,
      expectedSubscriberDigits: country.nationalDigits,
      enteredTotalDigits: 0,
      expectedTotalDigits: defaultExpected,
      isValid: !options?.required,
      isComplete: false,
      isEmpty: true,
      error: options?.required
        ? `Please enter a valid ${country.name} (${country.dialCode}) phone number.`
        : undefined,
      statusLabel: isFlex
        ? `${country.flag} ${country.dialCode} • ${minSub}–${maxSub} digits`
        : `${country.flag} ${country.dialCode} • ${defaultExpected} digits (${country.localPlaceholder.split(' (')[0]})`,
    };
  }

  // Case 1: International format starting with '+' or '00'
  const startsWithPlus = trimmed.startsWith('+');
  const startsWith00 = !startsWithPlus && trimmed.startsWith('00');

  if (startsWithPlus || startsWith00) {
    const rawDigitsAfterPrefix = startsWithPlus
      ? trimmed.slice(1).replace(/\D/g, '')
      : trimmed.slice(2).replace(/\D/g, '');

    let subscriberPart = rawDigitsAfterPrefix.startsWith(country.dialDigits)
      ? rawDigitsAfterPrefix.slice(country.dialDigits.length)
      : rawDigitsAfterPrefix;

    const hasRedundantZero = country.allowLeadingZero && subscriberPart.startsWith('0');
    if (hasRedundantZero) {
      subscriberPart = subscriberPart.slice(1);
    }

    const enteredSub = subscriberPart.length;
    const expectedSub = country.nationalDigits;
    const isComplete = isFlex ? isFlexibleCountValid(enteredSub, country) : enteredSub === expectedSub;

    return {
      country,
      mode: 'international',
      enteredSubscriberDigits: enteredSub,
      expectedSubscriberDigits: expectedSub,
      enteredTotalDigits: enteredSub,
      expectedTotalDigits: isFlex ? maxSub : expectedSub,
      isValid: isComplete,
      isComplete,
      isEmpty: false,
      error: isComplete
        ? undefined
        : isFlex
          ? `${country.name} (${country.dialCode}) requires ${minSub}–${maxSub} digits after ${country.dialCode} (currently ${enteredSub}).`
          : `${country.name} (${country.dialCode}) requires ${expectedSub} digits after ${country.dialCode} (currently ${enteredSub}/${expectedSub}).`,
      statusLabel: isFlex
        ? `${country.flag} ${country.dialCode} • ${enteredSub} digits`
        : `${country.flag} ${country.dialCode} • ${enteredSub}/${expectedSub} digits`,
    };
  }

  // Case 2: Local format starting with '0'
  if (country.allowLeadingZero && allDigits.startsWith('0')) {
    const expectedTotal = country.nationalDigits + 1;
    const enteredTotal = allDigits.length;
    const enteredSub = Math.max(0, enteredTotal - 1);
    const isComplete = isFlex ? isFlexibleCountValid(enteredTotal, country, 1) : enteredTotal === expectedTotal;

    return {
      country,
      mode: 'local_zero',
      enteredSubscriberDigits: enteredSub,
      expectedSubscriberDigits: country.nationalDigits,
      enteredTotalDigits: enteredTotal,
      expectedTotalDigits: isFlex ? maxSub + 1 : expectedTotal,
      isValid: isComplete,
      isComplete,
      isEmpty: false,
      error: isComplete
        ? undefined
        : isFlex
          ? `${country.name} local number requires ${minSub + 1}–${maxSub + 1} digits (currently ${enteredTotal}).`
          : `${country.name} local number starting with 0 requires ${expectedTotal} digits (currently ${enteredTotal}/${expectedTotal}).`,
      statusLabel: isFlex
        ? `${country.flag} ${country.code} (${country.dialCode}) • ${enteredTotal} digits`
        : `${country.flag} ${country.code} (${country.dialCode}) • ${enteredTotal}/${expectedTotal} digits`,
    };
  }

  // Case 3: User typed country code without '+' (e.g., 94771234567 = 11 digits)
  const minThresholdForPrefixWithoutPlus = isFlex ? minSub : country.nationalDigits;
  if (
    allDigits.startsWith(country.dialDigits) &&
    allDigits.length > minThresholdForPrefixWithoutPlus
  ) {
    let subscriberPart = allDigits.slice(country.dialDigits.length);
    if (country.allowLeadingZero && subscriberPart.startsWith('0')) {
      subscriberPart = subscriberPart.slice(1);
    }
    const enteredSub = subscriberPart.length;
    const expectedSub = country.nationalDigits;
    const isComplete = isFlex ? isFlexibleCountValid(enteredSub, country) : enteredSub === expectedSub;

    return {
      country,
      mode: 'international',
      enteredSubscriberDigits: enteredSub,
      expectedSubscriberDigits: expectedSub,
      enteredTotalDigits: enteredSub,
      expectedTotalDigits: isFlex ? maxSub : expectedSub,
      isValid: isComplete,
      isComplete,
      isEmpty: false,
      error: isComplete
        ? undefined
        : isFlex
          ? `${country.name} (${country.dialCode}) requires ${minSub}–${maxSub} digits after country code (currently ${enteredSub}).`
          : `${country.name} (${country.dialCode}) requires ${expectedSub} digits after country code (currently ${enteredSub}/${expectedSub}).`,
      statusLabel: isFlex
        ? `${country.flag} ${country.dialCode} • ${enteredSub} digits`
        : `${country.flag} ${country.dialCode} • ${enteredSub}/${expectedSub} digits`,
    };
  }

  // Case 4: National format without leading '0'
  const expectedSub = country.nationalDigits;
  const enteredSub = allDigits.length;
  const isComplete = isFlex ? isFlexibleCountValid(enteredSub, country) : enteredSub === expectedSub;

  return {
    country,
    mode: 'national',
    enteredSubscriberDigits: enteredSub,
    expectedSubscriberDigits: expectedSub,
    enteredTotalDigits: enteredSub,
    expectedTotalDigits: isFlex ? maxSub : expectedSub,
    isValid: isComplete,
    isComplete,
    isEmpty: false,
    error: isComplete
      ? undefined
      : isFlex
        ? `${country.name} (${country.dialCode}) requires ${minSub}–${maxSub} digits (currently ${enteredSub}).`
        : country.allowLeadingZero
          ? `${country.name} (${country.dialCode}) requires ${expectedSub + 1} digits with leading 0 (e.g. ${country.localPlaceholder.split(' (')[0]}) or ${expectedSub} digits after ${country.dialCode}.`
          : `${country.name} (${country.dialCode}) requires ${expectedSub} digits (currently ${enteredSub}/${expectedSub}).`,
    statusLabel: isFlex
      ? `${country.flag} ${country.dialCode} • ${enteredSub} digits`
      : `${country.flag} ${country.dialCode} • ${enteredSub}/${expectedSub} digits`,
  };
}

/**
 * Sanitizes and caps a phone number input string so the user cannot enter
 * more digits than valid for the active country.
 */
export function enforceCountryPhoneInput(
  rawInput: string,
  options?: {
    tenantCountry?: string;
    currencySymbol?: string;
  }
): string {
  if (!rawInput) return '';

  const hasLeadingPlus = rawInput.trimStart().startsWith('+');
  let cleaned = rawInput.replace(/[^\d+\s\-()]/g, '');
  if (hasLeadingPlus) {
    cleaned = '+' + cleaned.replace(/\+/g, '').trimStart();
  } else {
    cleaned = cleaned.replace(/\+/g, '');
  }

  const country = detectActivePhoneCountry({
    phoneValue: cleaned,
    tenantCountry: options?.tenantCountry,
    currencySymbol: options?.currencySymbol,
  });

  const allDigits = cleaned.replace(/\D/g, '');
  if (allDigits.length === 0) {
    return hasLeadingPlus ? '+' : '';
  }

  const subMaxDigits = country.isFlexibleLength ? (country.maxDigits ?? 12) : country.nationalDigits;
  let maxAllowedDigits = subMaxDigits;

  if (hasLeadingPlus) {
    if (allDigits.startsWith(country.dialDigits)) {
      const afterDial = allDigits.slice(country.dialDigits.length);
      const redundantZero = country.allowLeadingZero && afterDial.startsWith('0') ? 1 : 0;
      maxAllowedDigits = country.dialDigits.length + redundantZero + subMaxDigits;
    } else {
      maxAllowedDigits = country.dialDigits.length + subMaxDigits;
    }
  } else if (cleaned.trimStart().startsWith('00')) {
    const after00 = allDigits.slice(2);
    if (after00.startsWith(country.dialDigits)) {
      maxAllowedDigits = 2 + country.dialDigits.length + subMaxDigits;
    } else {
      maxAllowedDigits = 2 + 3 + 12;
    }
  } else if (country.allowLeadingZero && allDigits.startsWith('0')) {
    maxAllowedDigits = subMaxDigits + 1;
  } else if (
    allDigits.startsWith(country.dialDigits) &&
    allDigits.length > subMaxDigits
  ) {
    const afterDial = allDigits.slice(country.dialDigits.length);
    const redundantZero = country.allowLeadingZero && afterDial.startsWith('0') ? 1 : 0;
    maxAllowedDigits = country.dialDigits.length + redundantZero + subMaxDigits;
  } else {
    maxAllowedDigits = subMaxDigits;
  }

  let digitCount = 0;
  let result = '';
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (/\d/.test(ch)) {
      if (digitCount >= maxAllowedDigits) {
        break;
      }
      digitCount++;
      result += ch;
    } else {
      if (digitCount < maxAllowedDigits) {
        result += ch;
      }
    }
  }

  return result;
}
