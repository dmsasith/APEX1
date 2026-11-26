import { ALL_WORLD_COUNTRIES } from './worldCountriesData';

/**
 * Canonical primary IANA timezone per ISO 3166-1 alpha-2 country code.
 * Covers all 197 countries & key territories in ALL_WORLD_COUNTRIES.
 */
export const COUNTRY_CODE_TO_TIMEZONE: Record<string, string> = {
  AF: 'Asia/Kabul',
  AL: 'Europe/Tirane',
  DZ: 'Africa/Algiers',
  AD: 'Europe/Andorra',
  AO: 'Africa/Luanda',
  AG: 'America/Antigua',
  AR: 'America/Argentina/Buenos_Aires',
  AM: 'Asia/Yerevan',
  AU: 'Australia/Sydney',
  AT: 'Europe/Vienna',
  AZ: 'Asia/Baku',
  BS: 'America/Nassau',
  BH: 'Asia/Bahrain',
  BD: 'Asia/Dhaka',
  BB: 'America/Barbados',
  BY: 'Europe/Minsk',
  BE: 'Europe/Brussels',
  BZ: 'America/Belize',
  BJ: 'Africa/Porto-Novo',
  BT: 'Asia/Thimphu',
  BO: 'America/La_Paz',
  BA: 'Europe/Sarajevo',
  BW: 'Africa/Gaborone',
  BR: 'America/Sao_Paulo',
  BN: 'Asia/Brunei',
  BG: 'Europe/Sofia',
  BF: 'Africa/Ouagadougou',
  BI: 'Africa/Bujumbura',
  CV: 'Atlantic/Cape_Verde',
  KH: 'Asia/Phnom_Penh',
  CM: 'Africa/Douala',
  CA: 'America/Toronto',
  CF: 'Africa/Bangui',
  TD: 'Africa/Ndjamena',
  CL: 'America/Santiago',
  CN: 'Asia/Shanghai',
  CO: 'America/Bogota',
  KM: 'Indian/Comoro',
  CG: 'Africa/Brazzaville',
  CD: 'Africa/Kinshasa',
  CR: 'America/Costa_Rica',
  CI: 'Africa/Abidjan',
  HR: 'Europe/Zagreb',
  CU: 'America/Havana',
  CY: 'Asia/Nicosia',
  CZ: 'Europe/Prague',
  DK: 'Europe/Copenhagen',
  DJ: 'Africa/Djibouti',
  DM: 'America/Dominica',
  DO: 'America/Santo_Domingo',
  EC: 'America/Guayaquil',
  EG: 'Africa/Cairo',
  SV: 'America/El_Salvador',
  GQ: 'Africa/Malabo',
  ER: 'Africa/Asmara',
  EE: 'Europe/Tallinn',
  SZ: 'Africa/Mbabane',
  ET: 'Africa/Addis_Ababa',
  FJ: 'Pacific/Fiji',
  FI: 'Europe/Helsinki',
  FR: 'Europe/Paris',
  GA: 'Africa/Libreville',
  GM: 'Africa/Banjul',
  GE: 'Asia/Tbilisi',
  DE: 'Europe/Berlin',
  GH: 'Africa/Accra',
  GR: 'Europe/Athens',
  GD: 'America/Grenada',
  GT: 'America/Guatemala',
  GN: 'Africa/Conakry',
  GW: 'Africa/Bissau',
  GY: 'America/Guyana',
  HT: 'America/Port-au-Prince',
  HN: 'America/Tegucigalpa',
  HK: 'Asia/Hong_Kong',
  HU: 'Europe/Budapest',
  IS: 'Atlantic/Reykjavik',
  IN: 'Asia/Kolkata',
  ID: 'Asia/Jakarta',
  IR: 'Asia/Tehran',
  IQ: 'Asia/Baghdad',
  IE: 'Europe/Dublin',
  IL: 'Asia/Jerusalem',
  IT: 'Europe/Rome',
  JM: 'America/Jamaica',
  JP: 'Asia/Tokyo',
  JO: 'Asia/Amman',
  KZ: 'Asia/Almaty',
  KE: 'Africa/Nairobi',
  KI: 'Pacific/Tarawa',
  KP: 'Asia/Pyongyang',
  KR: 'Asia/Seoul',
  KW: 'Asia/Kuwait',
  KG: 'Asia/Bishkek',
  LA: 'Asia/Vientiane',
  LV: 'Europe/Riga',
  LB: 'Asia/Beirut',
  LS: 'Africa/Maseru',
  LR: 'Africa/Monrovia',
  LY: 'Africa/Tripoli',
  LI: 'Europe/Vaduz',
  LT: 'Europe/Vilnius',
  LU: 'Europe/Luxembourg',
  MO: 'Asia/Macau',
  MG: 'Indian/Antananarivo',
  MW: 'Africa/Blantyre',
  MY: 'Asia/Kuala_Lumpur',
  MV: 'Indian/Maldives',
  ML: 'Africa/Bamako',
  MT: 'Europe/Malta',
  MH: 'Pacific/Majuro',
  MR: 'Africa/Nouakchott',
  MU: 'Indian/Mauritius',
  MX: 'America/Mexico_City',
  FM: 'Pacific/Pohnpei',
  MD: 'Europe/Chisinau',
  MC: 'Europe/Monaco',
  MN: 'Asia/Ulaanbaatar',
  ME: 'Europe/Podgorica',
  MA: 'Africa/Casablanca',
  MZ: 'Africa/Maputo',
  MM: 'Asia/Yangon',
  NA: 'Africa/Windhoek',
  NR: 'Pacific/Nauru',
  NP: 'Asia/Kathmandu',
  NL: 'Europe/Amsterdam',
  NZ: 'Pacific/Auckland',
  NI: 'America/Managua',
  NE: 'Africa/Niamey',
  NG: 'Africa/Lagos',
  MK: 'Europe/Skopje',
  NO: 'Europe/Oslo',
  OM: 'Asia/Muscat',
  PK: 'Asia/Karachi',
  PW: 'Pacific/Palau',
  PS: 'Asia/Hebron',
  PA: 'America/Panama',
  PG: 'Pacific/Port_Moresby',
  PY: 'America/Asuncion',
  PE: 'America/Lima',
  PH: 'Asia/Manila',
  PL: 'Europe/Warsaw',
  PT: 'Europe/Lisbon',
  QA: 'Asia/Qatar',
  RO: 'Europe/Bucharest',
  RU: 'Europe/Moscow',
  RW: 'Africa/Kigali',
  KN: 'America/St_Kitts',
  LC: 'America/St_Lucia',
  VC: 'America/St_Vincent',
  WS: 'Pacific/Apia',
  SM: 'Europe/San_Marino',
  ST: 'Africa/Sao_Tome',
  SA: 'Asia/Riyadh',
  SN: 'Africa/Dakar',
  RS: 'Europe/Belgrade',
  SC: 'Indian/Mahe',
  SL: 'Africa/Freetown',
  SG: 'Asia/Singapore',
  SK: 'Europe/Bratislava',
  SI: 'Europe/Ljubljana',
  SB: 'Pacific/Guadalcanal',
  SO: 'Africa/Mogadishu',
  ZA: 'Africa/Johannesburg',
  SS: 'Africa/Juba',
  ES: 'Europe/Madrid',
  LK: 'Asia/Colombo',
  SD: 'Africa/Khartoum',
  SR: 'America/Paramaribo',
  SE: 'Europe/Stockholm',
  CH: 'Europe/Zurich',
  SY: 'Asia/Damascus',
  TW: 'Asia/Taipei',
  TJ: 'Asia/Dushanbe',
  TZ: 'Africa/Dar_es_Salaam',
  TH: 'Asia/Bangkok',
  TL: 'Asia/Dili',
  TG: 'Africa/Lome',
  TO: 'Pacific/Tongatapu',
  TT: 'America/Port_of_Spain',
  TN: 'Africa/Tunis',
  TR: 'Europe/Istanbul',
  TM: 'Asia/Ashgabat',
  TV: 'Pacific/Funafuti',
  UG: 'Africa/Kampala',
  UA: 'Europe/Kyiv',
  AE: 'Asia/Dubai',
  GB: 'Europe/London',
  US: 'America/New_York',
  UY: 'America/Montevideo',
  UZ: 'Asia/Tashkent',
  VU: 'Pacific/Efate',
  VA: 'Europe/Vatican',
  VE: 'America/Caracas',
  VN: 'Asia/Ho_Chi_Minh',
  YE: 'Asia/Aden',
  ZM: 'Africa/Lusaka',
  ZW: 'Africa/Harare',
};

const COUNTRY_NAME_ALIASES: Record<string, string> = {
  uae: 'AE',
  'u.a.e.': 'AE',
  uk: 'GB',
  'u.k.': 'GB',
  england: 'GB',
  britain: 'GB',
  'great britain': 'GB',
  usa: 'US',
  'u.s.a.': 'US',
  'united states of america': 'US',
  'czech republic': 'CZ',
  czechia: 'CZ',
  burma: 'MM',
  myanmar: 'MM',
  'south korea': 'KR',
  'republic of korea': 'KR',
  'north korea': 'KP',
  'cape verde': 'CV',
  'ivory coast': 'CI',
  swaziland: 'SZ',
  'east timor': 'TL',
  'sri lanka': 'LK',
  srilanka: 'LK',
};

function getBrowserFallbackTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Colombo';
  } catch {
    return 'Asia/Colombo';
  }
}

function isValidIanaTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

let activeWorkspaceCountry = '';
let activeWorkspaceTimezone = '';

/**
 * Resolves a tenant's Operating Country name, ISO-2 code, or IANA zone into a valid IANA timezone.
 */
export function getTimezoneForCountry(countryOrTz?: string): string {
  const raw = (countryOrTz || '').trim();
  if (!raw) {
    return activeWorkspaceTimezone || getBrowserFallbackTimezone();
  }

  // If caller already passed an IANA timezone (e.g. 'Asia/Colombo')
  if (raw.includes('/') && isValidIanaTimezone(raw)) {
    return raw;
  }

  const upper = raw.toUpperCase();
  if (upper.length === 2 && COUNTRY_CODE_TO_TIMEZONE[upper]) {
    return COUNTRY_CODE_TO_TIMEZONE[upper];
  }

  const lower = raw.toLowerCase();
  const aliasCode = COUNTRY_NAME_ALIASES[lower];
  if (aliasCode && COUNTRY_CODE_TO_TIMEZONE[aliasCode]) {
    return COUNTRY_CODE_TO_TIMEZONE[aliasCode];
  }

  // Exact match on ALL_WORLD_COUNTRIES names
  const exactCountry = ALL_WORLD_COUNTRIES.find(
    (c) => c.name.toLowerCase() === lower || c.code.toLowerCase() === lower
  );
  if (exactCountry && COUNTRY_CODE_TO_TIMEZONE[exactCountry.code]) {
    return COUNTRY_CODE_TO_TIMEZONE[exactCountry.code];
  }

  // Partial/prefix match e.g. 'Sri Lanka (LK)' or 'Congo'
  const partialCountry = ALL_WORLD_COUNTRIES.find(
    (c) =>
      lower.includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(lower)
  );
  if (partialCountry && COUNTRY_CODE_TO_TIMEZONE[partialCountry.code]) {
    return COUNTRY_CODE_TO_TIMEZONE[partialCountry.code];
  }

  return activeWorkspaceTimezone || getBrowserFallbackTimezone();
}

export function setActiveWorkspaceCountry(countryNameOrCode?: string): void {
  activeWorkspaceCountry = (countryNameOrCode || '').trim();
  activeWorkspaceTimezone = activeWorkspaceCountry
    ? getTimezoneForCountry(activeWorkspaceCountry)
    : getBrowserFallbackTimezone();
}

export function getActiveWorkspaceCountry(): string {
  return activeWorkspaceCountry;
}

export function getActiveWorkspaceTimezone(): string {
  return activeWorkspaceTimezone || getBrowserFallbackTimezone();
}

/**
 * Returns true if the string represents a pure calendar date ('YYYY-MM-DD') or
 * a legacy exact UTC-midnight placeholder ('YYYY-MM-DDT00:00:00.000Z') generated
 * from `new Date('YYYY-MM-DD').toISOString()` without real clock time.
 */
export function isDateOnlyOrMidnightUtcIso(value?: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return true;
  if (/^\d{4}-\d{2}-\d{2}T00:00:00(\.000)?Z$/i.test(trimmed)) return true;
  return false;
}

/**
 * Extracts YYYY-MM-DD calendar date parts if pure date-only or midnight UTC placeholder.
 */
export function extractCalendarDateParts(value: string): { year: number; month: number; day: number } | null {
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T00:00:00(?:\.000)?Z$)/i);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/**
 * Formats an ISO timestamp or Date into 'YYYY-MM-DD' in the active Operating Country's timezone.
 */
export function getCountryTodayIsoDate(countryOrTz?: string): string {
  const tz = countryOrTz ? getTimezoneForCountry(countryOrTz) : getActiveWorkspaceTimezone();
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

/**
 * Returns the future/offset 'YYYY-MM-DD' date in the active Operating Country's timezone.
 */
export function getCountryOffsetIsoDate(offsetDays: number, countryOrTz?: string): string {
  const tz = countryOrTz ? getTimezoneForCountry(countryOrTz) : getActiveWorkspaceTimezone();
  const target = new Date(Date.now() + offsetDays * 86400000);
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(target);
  } catch {
    return target.toISOString().split('T')[0];
  }
}

/**
 * Formats any ISO timestamp into 'YYYY-MM-DD' in the specified or active country's timezone.
 */
export function formatIsoToCountryYyyyMmDd(isoString?: string, countryOrTz?: string): string {
  if (!isoString) return '';
  const parts = extractCalendarDateParts(isoString);
  if (parts) {
    return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  }
  const tz = countryOrTz ? getTimezoneForCountry(countryOrTz) : getActiveWorkspaceTimezone();
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return isoString.slice(0, 10);
  }
}

/**
 * Resolves a form `<input type="date">` value (`selectedDateStr`, e.g. '2026-11-25') into a real timestamp:
 * - If `selectedDateStr` already includes a non-midnight time (`T14:22:...`), preserves it.
 * - If `existingTimestamp` already has a real clock time AND sits on the same country-local calendar day,
 *   preserves `existingTimestamp`.
 * - If `selectedDateStr` equals TODAY in the active Operating Country, returns `new Date().toISOString()`
 *   so the exact submission time in that country is recorded.
 * - Otherwise (backdated/future calendar day with no clock entered), returns clean `'YYYY-MM-DD'`
 *   so reports show the exact date without a fabricated UTC-midnight `05:30 AM` clock time.
 */
export function resolveTimestampForDateInput(
  selectedDateStr?: string,
  existingTimestamp?: string,
  countryOrTz?: string
): string {
  const trimmed = (selectedDateStr || '').trim();
  if (!trimmed) {
    return new Date().toISOString();
  }

  if (!isDateOnlyOrMidnightUtcIso(trimmed)) {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
    return trimmed;
  }

  const dayPart = trimmed.slice(0, 10);

  if (existingTimestamp && !isDateOnlyOrMidnightUtcIso(existingTimestamp)) {
    const existingDay = formatIsoToCountryYyyyMmDd(existingTimestamp, countryOrTz);
    if (existingDay === dayPart) {
      return existingTimestamp;
    }
  }

  const todayInCountry = getCountryTodayIsoDate(countryOrTz);
  if (dayPart === todayInCountry) {
    return new Date().toISOString();
  }

  return dayPart;
}

/**
 * Selects the richest timestamp across record fields without letting a date-only string
 * override a real ISO timestamp on the same day, and without letting a different day's
 * `createdAt` overwrite a deliberately backdated entry date.
 */
export function pickBestTimestamp(
  primaryDate?: string,
  createdAt?: string,
  fallbackDate?: string,
  countryOrTz?: string
): string | undefined {
  const candidates = [primaryDate, fallbackDate, createdAt]
    .map((v) => (v || '').trim())
    .filter(Boolean);

  if (candidates.length === 0) return undefined;

  // Prefer the first candidate that has a genuine clock time
  const primary = (primaryDate || fallbackDate || '').trim();
  if (primary && !isDateOnlyOrMidnightUtcIso(primary)) {
    return primary;
  }

  const secondary = (fallbackDate || '').trim();
  if (secondary && !isDateOnlyOrMidnightUtcIso(secondary)) {
    return secondary;
  }

  // If primary/secondary is date-only, check if createdAt has a real time on that SAME country-local day
  const created = (createdAt || '').trim();
  if (created && !isDateOnlyOrMidnightUtcIso(created)) {
    if (!primary) return created;
    const primaryDay = formatIsoToCountryYyyyMmDd(primary, countryOrTz);
    const createdDay = formatIsoToCountryYyyyMmDd(created, countryOrTz);
    if (primaryDay === createdDay) {
      return created;
    }
  }

  // Normalize legacy UTC midnight placeholders ('YYYY-MM-DDT00:00:00.000Z') to pure 'YYYY-MM-DD'
  if (primary && /^\d{4}-\d{2}-\d{2}T00:00:00(\.000)?Z$/i.test(primary)) {
    return primary.slice(0, 10);
  }

  return primary || created || candidates[0];
}
