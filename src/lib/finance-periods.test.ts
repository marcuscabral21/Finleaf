import { describe, expect, it } from "vitest";
import {
  dueFixedDatesFrom,
  fixedDueDateForPeriod,
  periodIncome,
  periodStartForDate,
  periodStartForOffset,
} from "./finance-periods";

describe("financial cycles", () => {
  it("assigns dates to the cycle beginning on the configured payday", () => {
    expect(periodStartForDate("2026-11-24", 25)).toBe("2026-10-25");
    expect(periodStartForDate("2026-11-25", 25)).toBe("2026-11-25");
    expect(periodStartForOffset("2026-11-24", 25, 1)).toBe("2026-11-25");
  });

  it("keeps fixed charges on their scheduled calendar day within each cycle", () => {
    expect(fixedDueDateForPeriod("2026-11-25", 15)).toBe("2026-12-15");
    expect(fixedDueDateForPeriod("2026-11-25", 28)).toBe("2026-11-28");
    expect(fixedDueDateForPeriod("2026-02-28", 31)).toBe("2026-02-28");
  });

  it("only generates fixed charges once their scheduled dates have arrived", () => {
    expect(dueFixedDatesFrom("2026-11-25", 1, 25, "2026-11-30")).toEqual([]);
    expect(dueFixedDatesFrom("2026-11-25", 1, 25, "2026-12-01")).toEqual(["2026-12-01"]);
    expect(dueFixedDatesFrom("2026-11-25", 1, 25, "2027-01-02")).toEqual([
      "2026-12-01",
      "2027-01-01",
    ]);
  });

  it("uses a cycle-specific income without changing the default for other cycles", () => {
    const overrides = { "2026-11-25": 320000 };
    expect(periodIncome(250000, overrides, "2026-11-25")).toBe(320000);
    expect(periodIncome(250000, overrides, "2026-12-25")).toBe(250000);
    expect(periodIncome(250000, { "2026-11-25": 0 }, "2026-11-25")).toBe(0);
  });
});
