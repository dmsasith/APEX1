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

// Sort dial rules longest dialDigits first so +971 matches before +9, etc.
const DIAL_SORTED_RULES = [...COUNTRY_PHONE_RULES].sort(
  (a, b) => b.dialDigits.length - a.dialDigits.length
);

/**
 * Finds a country rule by explicit dial prefix if the input starts with '+' or '00'.
 */
export function matchCountryByDialPrefix(phoneValue?: string): CountryPhoneRule | null {
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
  for (const rule of DIAL_SORTED_RULES) {
    if (digitsAfterPlus.startsWith(rule.dialDigits)) {
      return rule;
    }
  }
  return null;
}

/**
 * Finds a country rule by country name or ISO code.
 */
export function matchCountryByNameOrCode(countryNameOrCode?: string): CountryPhoneRule | null {
  if (!countryNameOrCode) return null;
  const norm = countryNameOrCode.trim().toLowerCase();
  if (!norm) return null;
  for (const rule of COUNTRY_PHONE_RULES) {
    if (
      rule.code.toLowerCase() === norm ||
      rule.name.toLowerCase() === norm ||
      rule.name.toLowerCase().includes(norm) ||
      norm.includes(rule.name.toLowerCase()) ||
      rule.dialCode === norm
    ) {
      return rule;
    }
  }
  if (norm === 'uk' || norm === 'great britain' || norm === 'england') {
    return COUNTRY_PHONE_RULES.find(r => r.code === 'GB') || null;
  }
  if (norm === 'uae' || norm === 'dubai') {
    return COUNTRY_PHONE_RULES.find(r => r.code === 'AE') || null;
  }
  if (norm === 'usa' || norm === 'united states' || norm === 'canada') {
    return COUNTRY_PHONE_RULES.find(r => r.code === 'US') || null;
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
 * 1. Explicit +dialCode in the typed phone number
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
  // 1. Check dialed prefix (+94, +971, +44, +1, etc.)
  const byDial = matchCountryByDialPrefix(options?.phoneValue);
  if (byDial) return byDial;

  const stored = getStoredTenantPhoneContext();
  const effectiveCountry = options?.tenantCountry || stored.tenantCountry;
  const effectiveCurrency = options?.currencySymbol || stored.currencySymbol;

  // 2. Check explicit or stored tenant country
  const byCountry = matchCountryByNameOrCode(effectiveCountry);
  if (byCountry) return byCountry;

  // 3. Check currency symbol (so 'Rs.' / 'LKR' always resolves to Sri Lanka even on Windows UTC+5:30 Asia/Calcutta)
  if (effectiveCurrency) {
    const byCurr = COUNTRY_PHONE_RULES.find(r => r.currencies.includes(effectiveCurrency));
    if (byCurr) return byCurr;
  }

  // 4. Check browser timezone
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      const byTz = COUNTRY_PHONE_RULES.find(r => r.timezones.includes(tz));
      if (byTz) return byTz;
    }
  } catch {
    // ignore timezone errors
  }

  // 5. Default to Sri Lanka (+94)
  return COUNTRY_PHONE_RULES[0];
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

/**
 * Analyzes a phone number against the active country rule.
 * Supports:
 * - International format: `+94 77 123 4567` (expects 9 subscriber digits after +94 -> 11 total digits)
 * - Local trunk '0' format: `077 123 4567` (expects 10 total digits: '0' + 9 subscriber digits)
 * - Direct national format: `77 123 4567` (expects 9 subscriber digits)
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
      statusLabel: `${country.flag} ${country.dialCode} • ${defaultExpected} digits (${country.localPlaceholder.split(' (')[0]})`,
    };
  }

  // Case 1: International format starting with '+' or '00' or starting with dialDigits when length > nationalDigits
  const startsWithPlus = trimmed.startsWith('+');
  const startsWith00 = !startsWithPlus && trimmed.startsWith('00');

  if (startsWithPlus || startsWith00) {
    const rawDigitsAfterPrefix = startsWithPlus
      ? trimmed.slice(1).replace(/\D/g, '')
      : trimmed.slice(2).replace(/\D/g, '');

    let subscriberPart = rawDigitsAfterPrefix.startsWith(country.dialDigits)
      ? rawDigitsAfterPrefix.slice(country.dialDigits.length)
      : rawDigitsAfterPrefix;

    // If user typed +94077..., ignore the redundant trunk '0' after +94
    const hasRedundantZero = country.allowLeadingZero && subscriberPart.startsWith('0');
    if (hasRedundantZero) {
      subscriberPart = subscriberPart.slice(1);
    }

    const enteredSub = subscriberPart.length;
    const expectedSub = country.nationalDigits;
    const isComplete = enteredSub === expectedSub;

    return {
      country,
      mode: 'international',
      enteredSubscriberDigits: enteredSub,
      expectedSubscriberDigits: expectedSub,
      enteredTotalDigits: enteredSub,
      expectedTotalDigits: expectedSub,
      isValid: isComplete,
      isComplete,
      isEmpty: false,
      error: isComplete
        ? undefined
        : `${country.name} (${country.dialCode}) requires ${expectedSub} digits after ${country.dialCode} (currently ${enteredSub}/${expectedSub}).`,
      statusLabel: `${country.flag} ${country.dialCode} • ${enteredSub}/${expectedSub} digits`,
    };
  }

  // Case 2: Local format starting with '0' (for countries with trunk '0' like Sri Lanka 0771234567 = 10 digits)
  if (country.allowLeadingZero && allDigits.startsWith('0')) {
    const expectedTotal = country.nationalDigits + 1; // e.g., 10 for Sri Lanka (0 + 9 digits)
    const enteredTotal = allDigits.length;
    const enteredSub = Math.max(0, enteredTotal - 1);
    const isComplete = enteredTotal === expectedTotal;

    return {
      country,
      mode: 'local_zero',
      enteredSubscriberDigits: enteredSub,
      expectedSubscriberDigits: country.nationalDigits,
      enteredTotalDigits: enteredTotal,
      expectedTotalDigits: expectedTotal,
      isValid: isComplete,
      isComplete,
      isEmpty: false,
      error: isComplete
        ? undefined
        : `${country.name} local number starting with 0 requires ${expectedTotal} digits (currently ${enteredTotal}/${expectedTotal}).`,
      statusLabel: `${country.flag} ${country.code} (${country.dialCode}) • ${enteredTotal}/${expectedTotal} digits`,
    };
  }

  // Case 3: User typed country code without '+' (e.g., 94771234567 = 11 digits)
  if (
    allDigits.startsWith(country.dialDigits) &&
    allDigits.length > country.nationalDigits
  ) {
    let subscriberPart = allDigits.slice(country.dialDigits.length);
    if (country.allowLeadingZero && subscriberPart.startsWith('0')) {
      subscriberPart = subscriberPart.slice(1);
    }
    const enteredSub = subscriberPart.length;
    const expectedSub = country.nationalDigits;
    const isComplete = enteredSub === expectedSub;

    return {
      country,
      mode: 'international',
      enteredSubscriberDigits: enteredSub,
      expectedSubscriberDigits: expectedSub,
      enteredTotalDigits: enteredSub,
      expectedTotalDigits: expectedSub,
      isValid: isComplete,
      isComplete,
      isEmpty: false,
      error: isComplete
        ? undefined
        : `${country.name} (${country.dialCode}) requires ${expectedSub} digits after country code (currently ${enteredSub}/${expectedSub}).`,
      statusLabel: `${country.flag} ${country.dialCode} • ${enteredSub}/${expectedSub} digits`,
    };
  }

  // Case 4: National format without leading '0' (e.g., 771234567 in SL or 5552345678 in US)
  const expectedSub = country.nationalDigits;
  const enteredSub = allDigits.length;
  const isComplete = enteredSub === expectedSub;

  return {
    country,
    mode: 'national',
    enteredSubscriberDigits: enteredSub,
    expectedSubscriberDigits: expectedSub,
    enteredTotalDigits: enteredSub,
    expectedTotalDigits: expectedSub,
    isValid: isComplete,
    isComplete,
    isEmpty: false,
    error: isComplete
      ? undefined
      : country.allowLeadingZero
        ? `${country.name} (${country.dialCode}) requires ${expectedSub + 1} digits with leading 0 (e.g. ${country.localPlaceholder.split(' (')[0]}) or ${expectedSub} digits after ${country.dialCode}.`
        : `${country.name} (${country.dialCode}) requires ${expectedSub} digits (currently ${enteredSub}/${expectedSub}).`,
    statusLabel: `${country.flag} ${country.dialCode} • ${enteredSub}/${expectedSub} digits`,
  };
}

/**
 * Sanitizes and strictly caps a phone number input string so the user cannot enter
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

  // Allow only digits, leading '+', spaces, dashes, and parentheses
  const hasLeadingPlus = rawInput.trimStart().startsWith('+');
  let cleaned = rawInput.replace(/[^\d+\s\-()]/g, '');
  // Ensure '+' only appears at the very start
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

  // Determine maximum total digits allowed in `cleaned`
  let maxAllowedDigits = country.nationalDigits;

  if (hasLeadingPlus) {
    if (allDigits.startsWith(country.dialDigits)) {
      const afterDial = allDigits.slice(country.dialDigits.length);
      const redundantZero = country.allowLeadingZero && afterDial.startsWith('0') ? 1 : 0;
      maxAllowedDigits = country.dialDigits.length + redundantZero + country.nationalDigits;
    } else {
      // Typing dial code in progress or unknown dial code
      maxAllowedDigits = country.dialDigits.length + country.nationalDigits;
    }
  } else if (cleaned.trimStart().startsWith('00')) {
    const after00 = allDigits.slice(2);
    if (after00.startsWith(country.dialDigits)) {
      maxAllowedDigits = 2 + country.dialDigits.length + country.nationalDigits;
    } else {
      maxAllowedDigits = 2 + 3 + 10;
    }
  } else if (country.allowLeadingZero && allDigits.startsWith('0')) {
    // Local format starting with single '0' (e.g. 0771234567 -> 10 digits in Sri Lanka)
    maxAllowedDigits = country.nationalDigits + 1;
  } else if (
    allDigits.startsWith(country.dialDigits) &&
    allDigits.length > country.nationalDigits
  ) {
    // Country code without '+' (e.g. 94771234567 -> 11 digits)
    const afterDial = allDigits.slice(country.dialDigits.length);
    const redundantZero = country.allowLeadingZero && afterDial.startsWith('0') ? 1 : 0;
    maxAllowedDigits = country.dialDigits.length + redundantZero + country.nationalDigits;
  } else {
    maxAllowedDigits = country.nationalDigits;
  }

  // Walk through `cleaned` and stop once `maxAllowedDigits` digits have been kept
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
      // Don't append trailing punctuation after hitting the digit cap
      if (digitCount < maxAllowedDigits) {
        result += ch;
      }
    }
  }

  return result;
}
