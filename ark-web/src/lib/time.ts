/**
 * Time helpers. All church times are expressed in Asia/Kolkata (IST, UTC+05:30,
 * no daylight saving), stored in UTC in the database.
 */
export const TZ = "Asia/Kolkata";
const IST_OFFSET_MIN = 330;

/** Wall-clock parts of an instant in IST. */
export function istParts(d: Date) {
  const shifted = new Date(d.getTime() + IST_OFFSET_MIN * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(), // 0-based
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

/** Build a UTC Date from IST wall-clock components. */
export function fromIst(year: number, month: number, day: number, hour = 0, minute = 0) {
  return new Date(Date.UTC(year, month, day, hour, minute) - IST_OFFSET_MIN * 60_000);
}

/** Parse "YYYY-MM-DDTHH:mm" (from <input type="datetime-local">) as IST. */
export function parseIstLocal(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number) as [number, number, number, number, number, number];
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  return fromIst(y, mo - 1, d, h, mi);
}

/** Format a Date as "YYYY-MM-DDTHH:mm" in IST (for datetime-local inputs). */
export function toIstLocalInput(d: Date | null | undefined) {
  if (!d) return "";
  const p = istParts(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month + 1)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** "HH:mm" -> "6:00 AM" */
export function formatClock(hhmm: string | null | undefined) {
  if (!hhmm) return "Time to be announced";
  const [hs, ms] = hhmm.split(":");
  const h = Number(hs);
  const m = Number(ms);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: TZ,
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const longDateFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: TZ,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export const formatDate = (d: Date) => dateFmt.format(d);
export const formatLongDate = (d: Date) => longDateFmt.format(d);
export const formatTime = (d: Date) => timeFmt.format(d).toUpperCase();
export const formatDateTime = (d: Date) => `${formatDate(d)}, ${formatTime(d)}`;

export function formatEventWhen(start: Date, end?: Date | null) {
  if (!end) return `${formatLongDate(start)} · ${formatTime(start)}`;
  const sameDay = formatDate(start) === formatDate(end);
  return sameDay
    ? `${formatLongDate(start)} · ${formatTime(start)} – ${formatTime(end)}`
    : `${formatDateTime(start)} – ${formatDateTime(end)}`;
}

const monthFmt = new Intl.DateTimeFormat("en-IN", { timeZone: TZ, month: "long", year: "numeric" });
export const formatMonth = (d: Date) => monthFmt.format(d);

/** Friendly countdown by IST calendar day: "Today", "Tomorrow", "In 5 days", "In 3 weeks". */
export function relativeDay(d: Date, now = new Date()) {
  const a = istParts(now);
  const b = istParts(d);
  const days = Math.round((Date.UTC(b.year, b.month, b.day) - Date.UTC(a.year, a.month, a.day)) / 86_400_000);
  if (days < 0) return null;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 14) return `In ${days} days`;
  if (days < 60) return `In ${Math.round(days / 7)} weeks`;
  return `In ${Math.round(days / 30)} months`;
}

export const WEEKDAYS =["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const ORDINAL: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th", [-1]: "Last" };

export type ScheduleLike = {
  dayOfWeek: number;
  recurrence: "WEEKLY" | "MONTHLY_NTH";
  nthWeek: number | null;
  startTime: string | null;
  endTime?: string | null;
};

export function describeSchedule(s: ScheduleLike) {
  const day = WEEKDAYS[s.dayOfWeek] ?? "Sunday";
  const when =
    s.recurrence === "WEEKLY" ? `Every ${day}` : `${ORDINAL[s.nthWeek ?? 1] ?? ""} ${day} of every month`;
  return when;
}

export function describeTimeRange(s: Pick<ScheduleLike, "startTime" | "endTime">) {
  if (!s.startTime) return "Time to be announced";
  return s.endTime ? `${formatClock(s.startTime)} – ${formatClock(s.endTime)}` : formatClock(s.startTime);
}

/** Does `date` (IST calendar date) match the recurrence of `s`? */
function matchesRecurrence(s: ScheduleLike, year: number, month: number, day: number) {
  const weekday = new Date(Date.UTC(year, month, day)).getUTCDay();
  if (weekday !== s.dayOfWeek) return false;
  if (s.recurrence === "WEEKLY") return true;
  const nth = s.nthWeek ?? 1;
  if (nth === -1) {
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return day + 7 > daysInMonth;
  }
  return Math.ceil(day / 7) === nth;
}

/** Next start instant (UTC) of a recurring schedule, strictly after `from`. Null if no start time. */
export function nextOccurrence(s: ScheduleLike, from: Date = new Date()): Date | null {
  if (!s.startTime) return null;
  const [hh, mm] = s.startTime.split(":").map(Number) as [number, number];
  const p = istParts(from);
  for (let i = 0; i < 400; i++) {
    const probe = new Date(Date.UTC(p.year, p.month, p.day + i));
    const y = probe.getUTCFullYear();
    const m = probe.getUTCMonth();
    const d = probe.getUTCDate();
    if (!matchesRecurrence(s, y, m, d)) continue;
    const start = fromIst(y, m, d, hh, mm);
    if (start.getTime() > from.getTime()) return start;
  }
  return null;
}
