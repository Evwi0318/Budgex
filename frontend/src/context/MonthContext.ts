import { createContext } from "react";

/**
 * Vilken flik som visas i hero-kortet. Sparande är inte en posttyp, så det
 * här är ett UI-begrepp och avsiktligt skilt från domänens EntryKind — där
 * en riktig EntryKind behövs härleds den, den lagras aldrig.
 */
export type HomeTab = "Income" | "Expense" | "Savings";

export interface MonthContextValue {
  year: number;
  month: number;
  tab: HomeTab;
  setTab: (tab: HomeTab) => void;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
}

// Egen fil utan komponenter, av samma skäl som AuthContext
export const MonthContext = createContext<MonthContextValue | undefined>(
  undefined
);
