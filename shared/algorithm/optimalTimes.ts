export interface OptimalTimeSlot {
  slot: 'morning' | 'evening';
  label: string;
  baseHour: number;   // 24h format
  baseMinute: number;
  reason: string;
  recommendedAngle: string;
}

export const AUDIENCE_ACTIVE_SLOTS: OptimalTimeSlot[] = [
  {
    slot: 'morning',
    label: 'Morning Velocity Window (8:30 AM)',
    baseHour: 8,
    baseMinute: 30,
    reason: 'Highest bookmark and retweet window as engineers, founders, and professionals begin their workday.',
    recommendedAngle: 'Build-in-public lesson, architecture diagrams, or engineering breakdown.'
  },
  {
    slot: 'evening',
    label: 'Evening Discussion Peak (7:15 PM)',
    baseHour: 19,
    baseMinute: 15,
    reason: 'Peak conversation and comment depth. The 150x author-reply multiplier is most effective here.',
    recommendedAngle: 'Contrarian question, open debate, or launch showcase asking for feedback.'
  }
];

/**
 * The machine's own IANA timezone, best-effort. Used as the default so that
 * scheduling without an explicit timezone matches the user's local clock.
 */
export function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/** Reads the wall-clock time that `date` corresponds to in `timezone`. */
function wallClockInTz(date: Date, timezone: string): WallClock {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date);
  const get = (type: string): number => Number(parts.find(p => p.type === type)?.value ?? 0);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

/**
 * Converts a wall-clock time in `timezone` into an absolute UTC instant.
 *
 * Pretends the wall time is UTC, formats that instant back in the target zone,
 * and measures how far the observed wall time drifted from the guess. The drift
 * is exactly the zone's UTC offset at that instant, so subtracting it recovers
 * the true instant — DST-safe, with no timezone library required.
 */
function wallClockToUtc(wall: WallClock, timezone: string): Date {
  const guess = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
  const observed = wallClockInTz(new Date(guess), timezone);
  const observedUtc = Date.UTC(
    observed.year,
    observed.month - 1,
    observed.day,
    observed.hour,
    observed.minute
  );
  return new Date(guess - (observedUtc - guess));
}

/** Next upcoming occurrence of hour:minute (wall clock) in `timezone`. */
function nextOccurrenceInTimezone(
  now: Date,
  timezone: string,
  hour: number,
  minute: number
): Date {
  const wall = wallClockInTz(now, timezone);
  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    const dayBase = new Date(
      Date.UTC(wall.year, wall.month - 1, wall.day + dayOffset, 12)
    );
    const candidate = wallClockToUtc(
      { ...wallClockInTz(dayBase, timezone), hour, minute },
      timezone
    );
    if (candidate.getTime() > now.getTime()) return candidate;
  }
  // Defensive: within three days a future slot always exists.
  return new Date(now.getTime() + 24 * 60 * 60_000);
}

/**
 * Calculates a humanized schedule timestamp by injecting pseudo-random jitter.
 * Prevents robotic exact-minute dispatch which triggers platform bot heuristics.
 *
 * Pass an IANA timezone (e.g. 'Asia/Kolkata') to target a specific audience;
 * otherwise the machine's own zone is used, matching the user's local clock.
 */
export function calculateJitteredSchedule(
  slot: 'morning' | 'evening',
  targetDate?: Date,
  timezone?: string
): {
  scheduledDate: Date;
  jitterMinutes: number;
  formattedDisplay: string;
} {
  const now = targetDate || new Date();
  const config = AUDIENCE_ACTIVE_SLOTS.find(s => s.slot === slot) || AUDIENCE_ACTIVE_SLOTS[0];

  // Pseudo-random jitter between +4 and +18 minutes
  const jitterMinutes = Math.floor(Math.random() * 15) + 4;

  let date: Date;
  if (timezone) {
    date = nextOccurrenceInTimezone(now, timezone, config.baseHour, config.baseMinute + jitterMinutes);
  } else {
    date = new Date(now);
    date.setHours(config.baseHour);
    date.setMinutes(config.baseMinute + jitterMinutes);
    date.setSeconds(0, 0);
    // If the calculated time has already passed today, schedule for tomorrow
    if (date.getTime() < now.getTime()) {
      date.setDate(date.getDate() + 1);
    }
  }

  const displayTz = timezone ?? localTimezone();
  const hours = date.toLocaleTimeString('en-US', {
    timeZone: displayTz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const dayName = date.toLocaleDateString('en-US', {
    timeZone: displayTz,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return {
    scheduledDate: date,
    jitterMinutes,
    formattedDisplay: `${dayName} at ${hours} (with +${jitterMinutes}m human jitter)`,
  };
}
