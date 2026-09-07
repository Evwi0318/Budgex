import { useQueries } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { currentMonth, shiftMonth } from "../lib/month";
import type { MonthPlan } from "./useMonthPlanQuery";

const WINDOW = 12;

export interface TrendMonth {
  year: number;
  month: number;
  safeToSpend: number | null;
}

export function useTrendQuery(): TrendMonth[] {
  const { request } = useApi();
  const now = currentMonth();

  const months = Array.from({ length: WINDOW }, (_, index) =>
    shiftMonth(now, index - (WINDOW - 1))
  );

  return useQueries({
    queries: months.map(({ year, month }) => ({
      queryKey: ["month", year, month],
      queryFn: () => request<MonthPlan>(`/api/months/${year}/${month}/entries`),
      retry: 1,
    })),
    combine: (results) =>
      results.map((result, index) => ({
        year: months[index].year,
        month: months[index].month,
        safeToSpend: result.data?.summary.safeToSpend ?? null,
      })),
  });
}
