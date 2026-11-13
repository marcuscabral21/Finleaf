export function dateInMonth(year: number, month: number, day: number) {
  const clampedMonth = ((month - 1) % 12 + 12) % 12 + 1;
  const clampedYear = year + Math.floor((month - 1) / 12);
  const lastDay = new Date(clampedYear, clampedMonth, 0).getDate();
  return `${clampedYear}-${String(clampedMonth).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

function periodStartForMonth(
  year: number,
  month: number,
  payday: number,
  paydayOverrides?: Record<string, string>,
) {
  const monthStart = dateInMonth(year, month, 1);
  const monthKey = monthStart.slice(0, 7);
  const override = paydayOverrides?.[monthKey];
  if (!override || !override.startsWith(monthKey)) return dateInMonth(year, month, payday);

  const overrideTime = Date.parse(`${override}T00:00:00Z`);
  return Number.isFinite(overrideTime) && new Date(overrideTime).toISOString().slice(0, 10) === override
    ? override
    : dateInMonth(year, month, payday);
}

export function periodStartForDate(
  date: string,
  payday: number,
  paydayOverrides?: Record<string, string>,
) {
  const [year, month] = date.split("-").map(Number);
  const currentStart = periodStartForMonth(year, month, payday, paydayOverrides);
  if (date >= currentStart) return currentStart;
  return periodStartForMonth(year, month - 1, payday, paydayOverrides);
}

export function periodStartForOffset(
  date: string,
  payday: number,
  offset: number,
  paydayOverrides?: Record<string, string>,
) {
  const [year, month] = periodStartForDate(date, payday, paydayOverrides).split("-").map(Number);
  return periodStartForMonth(year, month + offset, payday, paydayOverrides);
}

export function previousDate(date: string) {
  const previous = new Date(`${date}T12:00:00`);
  previous.setDate(previous.getDate() - 1);
  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}-${String(previous.getDate()).padStart(2, "0")}`;
}

export function cycleRange(
  start: string,
  payday: number,
  paydayOverrides?: Record<string, string>,
) {
  const end = previousDate(periodStartForOffset(start, payday, 1, paydayOverrides));
  const formatter = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short" });
  return `${formatter.format(new Date(`${start}T12:00:00`))} – ${formatter.format(new Date(`${end}T12:00:00`))}`;
}

export function fixedDueDateForPeriod(start: string, day: number) {
  const [year, month] = start.split("-").map(Number);
  const date = dateInMonth(year, month, day);
  return date < start ? dateInMonth(year, month + 1, day) : date;
}

export function dueFixedDatesFrom(
  startDate: string,
  day: number,
  payday: number,
  throughDate: string,
  paydayOverrides?: Record<string, string>,
) {
  const dates: string[] = [];
  let periodStart = periodStartForDate(startDate, payday, paydayOverrides);
  const lastPeriodStart = periodStartForDate(throughDate, payday, paydayOverrides);

  while (periodStart <= lastPeriodStart) {
    const dueDate = fixedDueDateForPeriod(periodStart, day);
    if (dueDate >= startDate && dueDate <= throughDate) dates.push(dueDate);

    const nextPeriodStart = periodStartForOffset(periodStart, payday, 1, paydayOverrides);
    if (nextPeriodStart <= periodStart) break;
    periodStart = nextPeriodStart;
  }

  return dates;
}

export function periodIncome(
  defaultIncome: number,
  incomeByPeriod: Record<string, number> | undefined,
  periodStart: string,
) {
  return incomeByPeriod?.[periodStart] ?? defaultIncome;
}
