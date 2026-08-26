import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

export type RuleType = "Fixed" | "Percentage";
export type SourceStatus = "Ok" | "Full" | "Over";

export interface SavingsRule {
  sourceEntryId: string;
  sourceName: string;
  ruleType: RuleType;
  value: number;
  amount: number;
}

export interface SavingsAccount {
  id: string;
  name: string;
  icon: string;
  goal: number | null;
  saved: number | null;
  amount: number;
  isTransferred: boolean;
  rules: SavingsRule[];
}

export interface SourceUsage {
  sourceEntryId: string;
  name: string;
  available: number;
  allocated: number;
  status: SourceStatus;
}

export interface SavingsMonth {
  year: number;
  month: number;
  total: number;
  accounts: SavingsAccount[];
  sources: SourceUsage[];
}

export function useSavingsQuery(year: number, month: number) {
  const { request } = useApi();

  return useQuery({
    queryKey: ["savings", year, month],
    queryFn: () => request<SavingsMonth>(`/api/months/${year}/${month}/savings`),
    placeholderData: keepPreviousData,
    retry: 1,
  });
}
