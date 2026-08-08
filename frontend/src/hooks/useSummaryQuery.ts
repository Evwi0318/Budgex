import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

export interface BudgetSummary {
  safeToSpend: number;
  totalIncome: number;
  totalExpenses: number;
  totalToTransfer: number;
}

export function useSummaryQuery(monthId: string) {
  const { request } = useApi();

  return useQuery({
    queryKey: ["summary", monthId],
    queryFn: async () => {
      const response = await request(
        `${import.meta.env.VITE_API_URL}/api/months/${monthId}/summary`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch summary");
      }
      return response.json() as Promise<BudgetSummary>;
    },
    enabled: !!monthId,
    retry: 1,
  });
}
