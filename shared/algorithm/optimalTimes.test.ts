import { describe, it, expect } from 'vitest';
import { calculateJitteredSchedule } from './optimalTimes';

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
});
