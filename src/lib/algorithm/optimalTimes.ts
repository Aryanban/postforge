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
    label: 'Morning Velocity Window (8:45 AM)',
    baseHour: 8,
    baseMinute: 45,
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
 * Calculates a humanized schedule timestamp by injecting pseudo-random jitter.
 * Prevents robotic exact-minute dispatch which triggers platform bot heuristics.
 */
export function calculateJitteredSchedule(slot: 'morning' | 'evening', targetDate?: Date): {
  scheduledDate: Date;
  jitterMinutes: number;
  formattedDisplay: string;
} {
  const now = targetDate || new Date();
  const config = AUDIENCE_ACTIVE_SLOTS.find(s => s.slot === slot) || AUDIENCE_ACTIVE_SLOTS[0];

  // Pseudo-random jitter between +4 and +18 minutes
  const jitterMinutes = Math.floor(Math.random() * 15) + 4;

  const date = new Date(now);
  date.setHours(config.baseHour);
  date.setMinutes(config.baseMinute + jitterMinutes);
  date.setSeconds(0);

  // If the calculated time has already passed today, schedule for tomorrow
  if (date.getTime() < now.getTime()) {
    date.setDate(date.getDate() + 1);
  }

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return {
    scheduledDate: date,
    jitterMinutes,
    formattedDisplay: `${dayName} at ${hours}:${minutes} (with +${jitterMinutes}m human jitter)`
  };
}
