/**
 * Timezone and Date Utility for HSC Potential Mark Weekly Survey
 * Timezone: Asia/Dhaka (UTC+6, no DST)
 * Survey Cycle: Every Saturday 00:00:00 to Friday 23:59:59 (Asia/Dhaka)
 */

export interface DhakaDateTimeComponents {
  year: number;
  month: number; // 1-12
  date: number; // 1-31
  day: number; // 0=Sunday, 6=Saturday
  hours: number;
  minutes: number;
  seconds: number;
  isoDateString: string; // YYYY-MM-DD
}

/**
 * Returns date components in Asia/Dhaka timezone
 */
export function getDhakaComponents(inputDate: Date | string | number = new Date()): DhakaDateTimeComponents {
  const d = typeof inputDate === 'string' || typeof inputDate === 'number' ? new Date(inputDate) : inputDate;

  // Use Intl.DateTimeFormat to reliably extract Asia/Dhaka values
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }

  const year = parseInt(map.year, 10);
  const month = parseInt(map.month, 10);
  const date = parseInt(map.day, 10);
  const hours = parseInt(map.hour, 10);
  const minutes = parseInt(map.minute, 10);
  const seconds = parseInt(map.second, 10);

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const day = weekdayMap[map.weekday] ?? 0;

  const monthStr = month < 10 ? `0${month}` : `${month}`;
  const dateStr = date < 10 ? `0${date}` : `${date}`;
  const isoDateString = `${year}-${monthStr}-${dateStr}`;

  return {
    year,
    month,
    date,
    day,
    hours,
    minutes,
    seconds,
    isoDateString,
  };
}

/**
 * Calculate the Saturday date of the survey cycle that contains the given date in Asia/Dhaka.
 * If the given date is Saturday, returns that Saturday.
 * If Sunday-Friday, returns the Saturday immediately preceding.
 */
export function getSurveySaturday(inputDate: Date | string | number = new Date()): {
  surveyDate: string; // YYYY-MM-DD (Saturday date)
  saturdayDate: string; // YYYY-MM-DD
  weekId: string; // e.g. "2026-W45"
  cycleStartDate: string; // ISO string for Saturday 00:00:00 Asia/Dhaka
  cycleEndDate: string; // ISO string for Friday 23:59:59 Asia/Dhaka
  weekNumber: number;
} {
  const comp = getDhakaComponents(inputDate);
  const daysSinceSaturday = (comp.day + 1) % 7;

  // Compute Saturday UTC date by shifting input date backwards
  const d = typeof inputDate === 'string' || typeof inputDate === 'number' ? new Date(inputDate) : new Date(inputDate.getTime());
  // Shift by daysSinceSaturday in Dhaka time (using 24-hr chunks)
  d.setTime(d.getTime() - daysSinceSaturday * 24 * 60 * 60 * 1000);
  const satComp = getDhakaComponents(d);

  // Compute week number of the year for this Saturday
  // Standard week number formula (1-53)
  const jan1 = new Date(Date.UTC(satComp.year, 0, 1));
  const satUtc = new Date(Date.UTC(satComp.year, satComp.month - 1, satComp.date));
  const dayOfYear = Math.floor((satUtc.getTime() - jan1.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const weekNumber = Math.max(1, Math.min(53, Math.ceil(dayOfYear / 7)));

  const weekNumberStr = weekNumber < 10 ? `0${weekNumber}` : `${weekNumber}`;
  const weekId = `${satComp.year}-W${weekNumberStr}`;
  const saturdayDate = satComp.isoDateString;
  const surveyDate = saturdayDate;

  // Cycle start in Dhaka: Sat 00:00:00 (+06:00) -> UTC is Fri 18:00:00
  const cycleStartDate = `${saturdayDate}T00:00:00+06:00`;

  // Cycle end in Dhaka: next Friday 23:59:59 (+06:00)
  const nextFridayD = new Date(satUtc.getTime() + 6 * 24 * 60 * 60 * 1000);
  const friComp = getDhakaComponents(nextFridayD);
  const cycleEndDate = `${friComp.isoDateString}T23:59:59+06:00`;

  return {
    surveyDate,
    saturdayDate,
    weekId,
    cycleStartDate,
    cycleEndDate,
    weekNumber,
  };
}

/**
 * Formats a Saturday date into a readable string (e.g., "Saturday, 07 November 2026")
 */
export function formatSurveyDate(dateString: string): string {
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(Date.UTC(year, month, day, 6, 0, 0));
      return d.toLocaleDateString('en-US', {
        timeZone: 'Asia/Dhaka',
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }
  } catch {
    // fallback
  }
  return dateString;
}

/**
 * Returns the short formatted date for charts (e.g., "07 Nov")
 */
export function formatShortSurveyDate(dateString: string): string {
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(Date.UTC(year, month, day, 6, 0, 0));
      return d.toLocaleDateString('en-US', {
        timeZone: 'Asia/Dhaka',
        day: 'numeric',
        month: 'short',
      });
    }
  } catch {
    // fallback
  }
  return dateString;
}

/**
 * Calculate countdown until the next Saturday 00:00:00 in Asia/Dhaka
 */
export function getTimeUntilNextSurvey(now: Date = new Date()): {
  days: number;
  hours: number;
  minutes: number;
  formatted: string;
} {
  const comp = getDhakaComponents(now);
  // Current day: 0=Sun..6=Sat
  // Days until next Saturday:
  // Saturday (6) -> 7 days until NEXT Saturday
  // Sunday (0) -> 6 days
  // Monday (1) -> 5 days
  // Tuesday (2) -> 4 days
  // Wednesday (3) -> 3 days
  // Thursday (4) -> 2 days
  // Friday (5) -> 1 day
  let daysUntil = 6 - comp.day;
  if (daysUntil <= 0) {
    daysUntil = 7;
  }

  // Next Saturday 00:00:00 Dhaka
  const remainingHours = 23 - comp.hours;
  const remainingMinutes = 59 - comp.minutes;
  const daysAdjusted = Math.max(0, daysUntil - 1);

  return {
    days: daysAdjusted,
    hours: remainingHours,
    minutes: remainingMinutes,
    formatted: `${daysAdjusted}d ${remainingHours}h ${remainingMinutes}m`,
  };
}

/**
 * Generate a sequence of Saturday survey dates between fromDate and toDate (inclusive)
 * Used to catch up any missing weeks for the automatic carry-forward system.
 */
export function generateSaturdaySequence(
  fromSaturdayDate: string,
  toSaturdayDate: string
): { surveyDate: string; saturdayDate: string; weekId: string }[] {
  const result: { surveyDate: string; saturdayDate: string; weekId: string }[] = [];
  if (fromSaturdayDate > toSaturdayDate) {
    return result;
  }

  let current = new Date(`${fromSaturdayDate}T12:00:00+06:00`);
  const end = new Date(`${toSaturdayDate}T12:00:00+06:00`);

  // Max 104 weeks (2 years) guard
  let safety = 0;
  while (current.getTime() <= end.getTime() && safety < 104) {
    const cycle = getSurveySaturday(current);
    if (!result.some((r) => r.weekId === cycle.weekId)) {
      result.push({
        surveyDate: cycle.surveyDate,
        saturdayDate: cycle.saturdayDate,
        weekId: cycle.weekId,
      });
    }
    // Advance 7 days
    current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
    safety++;
  }

  return result;
}
