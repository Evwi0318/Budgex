import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import type { EntryKind } from "../lib/categories";

export interface PlannedEntry {
  id: string;
  kind: EntryKind;
  name: string;
  category: string;
  amount: number;
  isAutogiro: boolean;
  isPaid: boolean;
  repeats: boolean;
}

export interface MonthSummary {
  income: number;
  totalExpenses: number;
  totalSavings: number;
  safeToSpend: number;
}

export interface MonthPlan {
  year: number;
  month: number;
  income: PlannedEntry[];
  expenses: PlannedEntry[];
  summary: MonthSummary;
}

export function useMonthPlanQuery(year: number, month: number) {
  const { request } = useApi();

  return useQuery({
    queryKey: ["month", year, month],
    queryFn: () => request<MonthPlan>(`/api/months/${year}/${month}/entries`),
    // Förra månaden ligger kvar tills den nya svarat, annars blinkar skelettet
    placeholderData: keepPreviousData,
    retry: 1,
  });
}
