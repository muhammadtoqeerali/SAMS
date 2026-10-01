export function currentMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "Europe/Rome",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
}

export function normalizeMonth(value?: string | null) {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : currentMonth();
}

export function monthBounds(month: string) {
  const [year, mon] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, mon - 1, 1));
  const end = new Date(Date.UTC(year, mon, 0));
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end), startDate: start, endDate: end };
}

export function monthsBack(fromMonth: string, count: number) {
  const [year, mon] = fromMonth.split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, mon - 1 - (count - 1 - index), 1));
    return date.toISOString().slice(0, 7);
  });
}

export function monthsBetween(fromMonth: string, throughMonth: string) {
  const [fromYear, fromMon] = fromMonth.split("-").map(Number);
  const [throughYear, throughMon] = throughMonth.split("-").map(Number);
  const start = fromYear * 12 + (fromMon - 1);
  const end = throughYear * 12 + (throughMon - 1);
  if (end < start) return [];
  return Array.from({ length: end - start + 1 }, (_, index) => {
    const absolute = start + index;
    const year = Math.floor(absolute / 12);
    const month = (absolute % 12) + 1;
    return `${year}-${String(month).padStart(2, "0")}`;
  });
}

export function daysInclusive(start: string, end: string) {
  const a = new Date(`${start}T00:00:00Z`).getTime();
  const b = new Date(`${end}T00:00:00Z`).getTime();
  return Math.floor((b - a) / 86_400_000) + 1;
}

export function overlapDays(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const start = [aStart, bStart].sort().at(-1)!;
  const end = [aEnd, bEnd].sort().at(0)!;
  if (start > end) return 0;
  return daysInclusive(start, end);
}
