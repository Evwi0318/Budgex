import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

// Fälten speglar SummaryDto i backend exakt — ASP.NET serialiserar
// PascalCase till camelCase, så DisposableIncome blir disposableIncome
export interface BudgetSummary {
  disposableIncome: number;
  totalExpenses: number;
  totalSavings: number;
  safeToSpend: number;
  transferToBank: number;
}

export function useSummaryQuery(monthId: string) {
  const { request } = useApi();

  return useQuery({
    queryKey: ["summary", monthId],
    queryFn: () => request<BudgetSummary>(`/api/months/${monthId}/summary`),
    enabled: !!monthId,
    retry: 1,
  });
}
