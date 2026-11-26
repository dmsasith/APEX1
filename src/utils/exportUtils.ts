import {
  extractCalendarDateParts,
  getActiveWorkspaceTimezone,
  getCountryTodayIsoDate,
  getTimezoneForCountry,
  isDateOnlyOrMidnightUtcIso,
} from './countryTimezoneUtils';

export function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || !rows.length) {
    console.warn('No data available to export.');
    return;
  }

  const separator = ',';
  const keys = Object.keys(rows[0]);

  const csvContent =
    keys.map((k) => `"${k.replace(/"/g, '""')}"`).join(separator) +
    '\n' +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            const rawCell = row[k];
            let cellStr = '';
            if (rawCell !== null && rawCell !== undefined) {
              cellStr =
                rawCell instanceof Date
                  ? rawCell.toLocaleString('en-US', { timeZone: getActiveWorkspaceTimezone() })
                  : String(rawCell);
            }
            cellStr = cellStr.replace(/"/g, '""');
            return `"${cellStr}"`;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/\.csv$/, '')}_${getCountryTodayIsoDate()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatCalendarDateOnly(isoString: string): string | null {
  if (!isDateOnlyOrMidnightUtcIso(isoString)) return null;
  const parts = extractCalendarDateParts(isoString);
  if (!parts) return null;
  const utcDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return utcDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDateTime(isoString?: string, countryOrTz?: string): string {
  if (!isoString) return '—';
  try {
    const calendarOnly = formatCalendarDateOnly(isoString);
    if (calendarOnly) return calendarOnly;

    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const tz = countryOrTz ? getTimezoneForCountry(countryOrTz) : getActiveWorkspaceTimezone();
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: tz,
    });
  } catch {
    return isoString;
  }
}

export function formatDateTimeParts(
  isoString?: string,
  countryOrTz?: string
): { date: string; time: string } {
  if (!isoString) return { date: '—', time: '' };
  try {
    const calendarOnly = formatCalendarDateOnly(isoString);
    if (calendarOnly) return { date: calendarOnly, time: '' };

    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: isoString, time: '' };
    const tz = countryOrTz ? getTimezoneForCountry(countryOrTz) : getActiveWorkspaceTimezone();
    const date = d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: tz,
    });
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: tz,
    });
    return { date, time };
  } catch {
    return { date: isoString, time: '' };
  }
}

export function formatDate(isoString?: string, countryOrTz?: string): string {
  if (!isoString) return '—';
  try {
    const calendarOnly = formatCalendarDateOnly(isoString);
    if (calendarOnly) return calendarOnly;

    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const tz = countryOrTz ? getTimezoneForCountry(countryOrTz) : getActiveWorkspaceTimezone();
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: tz,
    });
  } catch {
    return isoString;
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
