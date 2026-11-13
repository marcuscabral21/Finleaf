export function dateInMonth(year: number, month: number, day: number) {
  const clampedMonth = ((month - 1) % 12 + 12) % 12 + 1;
  const clampedYear = year + Math.floor((month - 1) / 12);
  const lastDay = new Date(clampedYear, clampedMonth, 0).getDate();
  return `${clampedYear}-${String(clampedMonth).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

export function periodStartForDate(date: string, payday: number) {
  const [year, month] = date.split("-").map(Number);
  const currentStart = dateInMonth(year, month, payday);
  if (date >= currentStart) return currentStart;
  return dateInMonth(year, month - 1, payday);
}

export function periodStartForOffset(date: string, payday: number, offset: number) {
  const [year, month] = periodStartForDate(date, payday).split("-").map(Number);
  return dateInMonth(year, month + offset, payday);
}

export function previousDate(date: string) {
  const previous = new Date(`${date}T12:00:00`);
  previous.setDate(previous.getDate() - 1);
  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}-${String(previous.getDate()).padStart(2, "0")}`;
}

export function cycleRange(start: string, payday: number) {
  const end = previousDate(periodStartForOffset(start, payday, 1));
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
) {
  const dates: string[] = [];
  let periodStart = periodStartForDate(startDate, payday);
  const lastPeriodStart = periodStartForDate(throughDate, payday);

  while (periodStart <= lastPeriodStart) {
    const dueDate = fixedDueDateForPeriod(periodStart, day);
    if (dueDate >= startDate && dueDate <= throughDate) dates.push(dueDate);

    const nextPeriodStart = periodStartForOffset(periodStart, payday, 1);
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
