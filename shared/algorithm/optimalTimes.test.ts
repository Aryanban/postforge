import { describe, it, expect } from 'vitest';
import { calculateJitteredSchedule, localTimezone } from './optimalTimes';

describe('calculateJitteredSchedule', () => {
  it('applies humanized jitter between 4 and 18 minutes', () => {
    for (let i = 0; i < 50; i++) {
      const { jitterMinutes } = calculateJitteredSchedule('morning');
      expect(jitterMinutes).toBeGreaterThanOrEqual(4);
      expect(jitterMinutes).toBeLessThanOrEqual(18);
    }
  });

  it('lands on the configured base hour', () => {
    const { scheduledDate } = calculateJitteredSchedule('morning', new Date('2026-01-15T12:00:00Z'));
    expect(scheduledDate.getHours()).toBe(8);
  });

  it('rolls over to tomorrow when the slot already passed', () => {
    // Use local late evening so the morning slot is guaranteed in the past,
    // regardless of the machine's timezone.
    const now = new Date();
    now.setHours(23, 30, 0, 0);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const { scheduledDate } = calculateJitteredSchedule('morning', now);
    expect(scheduledDate.getDate()).toBe(tomorrow.getDate());
  });

  it('produces a human-readable display string with the jitter', () => {
    const { formattedDisplay, jitterMinutes } = calculateJitteredSchedule('evening');
    expect(formattedDisplay).toContain(`+${jitterMinutes}m`);
  });

  it('returns a valid IANA timezone for the machine', () => {
    expect(localTimezone()).toMatch(/^[A-Za-z_]+\/[A-Za-z_]+$/);
  });

  it('honours an explicit timezone: 8:30 morning slot is 8:xx in that zone', () => {
    const { scheduledDate } = calculateJitteredSchedule(
      'morning',
      new Date('2026-01-15T12:00:00Z'),
      'Asia/Kolkata'
    );
    const inZone = scheduledDate.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    // Base hour 8 + jitter of up to 18 minutes can roll into 8:xx (jitter max 18
    // on a base of :30 stays within the 8 o'clock hour).
    expect(inZone.startsWith('08:')).toBe(true);
  });

  it('timezone slots are absolute: the returned instant is in the future', () => {
    const now = new Date('2026-01-15T12:00:00Z');
    const { scheduledDate } = calculateJitteredSchedule('evening', now, 'America/New_York');
    expect(scheduledDate.getTime()).toBeGreaterThan(now.getTime());
  });

  it('timezone scheduling respects the audience zone, not the machine zone', () => {
    // The evening slot is 19:15 + jitter. In New York that must never be
    // reported as an 8am-equivalent local time on the same calendar day.
    const { scheduledDate } = calculateJitteredSchedule(
      'evening',
      new Date('2026-01-15T08:00:00Z'),
      'America/New_York'
    );
    const nyHour = Number(
      scheduledDate.toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        hour12: false,
      })
    );
    expect(nyHour).toBe(19);
  });
});
