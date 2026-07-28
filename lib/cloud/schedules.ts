import type { BackupSchedule, ScheduleFrequency } from "./types";

export const FREQUENCIES: Array<{ id: ScheduleFrequency; label: string; detail: string }> = [
  { id: "daily", label: "Daily", detail: "Every day" },
  { id: "weekly", label: "Weekly", detail: "Every Monday" },
  { id: "monthly", label: "Monthly", detail: "1st of the month" },
];

/** Next occurrence strictly after `now`, in local time. */
export function nextRunAt(schedule: BackupSchedule, now: Date = new Date()): Date {
  const next = new Date(now);
  next.setHours(schedule.hour, 0, 0, 0);

  if (schedule.frequency === "daily") {
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
  }

  if (schedule.frequency === "weekly") {
    const MONDAY = 1;
    const daysAhead = (MONDAY - next.getDay() + 7) % 7;
    next.setDate(next.getDate() + daysAhead);
    if (next <= now) next.setDate(next.getDate() + 7);
    return next;
  }

  next.setDate(1);
  if (next <= now) next.setMonth(next.getMonth() + 1);
  return next;
}

export function formatHour(hour: number): string {
  const suffix = hour < 12 ? "AM" : "PM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${suffix}`;
}

export function describeSchedule(schedule: BackupSchedule): string {
  const frequency = FREQUENCIES.find((f) => f.id === schedule.frequency);
  return `${frequency?.detail ?? schedule.frequency} at ${formatHour(schedule.hour)}`;
}

/** "in 3 hours", "in 2 days" -- deliberately coarse. */
export function describeCountdown(target: Date, now: Date = new Date()): string {
  const minutes = Math.round((target.getTime() - now.getTime()) / 60000);
  if (minutes <= 0) return "due now";
  if (minutes < 60) return `in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `in ${hours} ${hours === 1 ? "hour" : "hours"}`;
  const days = Math.round(hours / 24);
  return `in ${days} ${days === 1 ? "day" : "days"}`;
}
