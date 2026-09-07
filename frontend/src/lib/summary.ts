import type { MonthSummary, PlannedEntry } from "../hooks/useMonthPlanQuery";

/**
 * Hero-kortet räknar bort en post så fort den tagits bort, inte först när
 * raderingen gått igenom. Ångrar man kommer summan tillbaka lika snabbt.
 */
export function withoutEntry(
  summary: MonthSummary,
  entry: PlannedEntry
): MonthSummary {
  return entry.kind === "Income"
    ? {
        ...summary,
        income: summary.income - entry.amount,
        safeToSpend: summary.safeToSpend - entry.amount,
      }
    : {
        ...summary,
        totalExpenses: summary.totalExpenses - entry.amount,
        safeToSpend: summary.safeToSpend + entry.amount,
      };
}
