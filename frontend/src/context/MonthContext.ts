import { createContext } from "react";
import type { EntryKind } from "../lib/categories";

export interface MonthContextValue {
  year: number;
  month: number;
  view: EntryKind;
  setView: (kind: EntryKind) => void;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  openAdd: () => void;
  activePath: string;
}

// Egen fil utan komponenter, av samma skäl som AuthContext
export const MonthContext = createContext<MonthContextValue | undefined>(
  undefined
);
