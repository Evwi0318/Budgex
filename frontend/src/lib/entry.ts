import type { PlannedEntry } from "../hooks/useMonthPlanQuery";

export interface EntryRowShape {
  entry: PlannedEntry;
  monthName: string;
  locked: boolean;
}

export const entryNote = (entry: PlannedEntry, monthName: string): string =>
  entry.isAutogiro
    ? "Autogiro · Varje månad"
    : entry.repeats
      ? "Varje månad"
      : `Bara ${monthName}`;

/** Överstruken och tonad: bara manuella utgifter man själv bockat av */
export const isTickedOff = (entry: PlannedEntry): boolean =>
  entry.kind === "Expense" && !entry.isAutogiro && entry.isPaid;

/**
 * Ett flikbyte ritar om alla tre panelerna, och varje rad är en egen gest med
 * eget lager — utan den här spärren blev bytet segare ju längre listan var.
 * Återanropen jämförs inte: de läser bara posten och låset.
 */
export const sameRow = <T extends EntryRowShape>(before: T, after: T) =>
  before.entry === after.entry &&
  before.monthName === after.monthName &&
  before.locked === after.locked;
