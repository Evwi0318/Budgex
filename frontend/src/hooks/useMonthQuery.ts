import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

export interface BudgetMonth {
  id: string;
  year: number;
  month: number;
  incomeSources: IncomeSource[];
  expenses: Expense[];
  savingsAccounts: SavingsAccount[];
}

export interface IncomeSource {
  id: string;
  type: "Salary" | "Csn";
  amount: number;
  loanAmount?: number;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
}

export interface SavingsAccount {
  id: string;
  name: string;
  icon: string;
  ruleType: "Fixed" | "Percentage";
  ruleValue: number;
}

export function useMonthQuery(year: number, month: number) {
  const { request } = useApi();

  return useQuery({
    queryKey: ["month", year, month],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_API_URL}/api/months/${year}/${month}`;
      const response = await request(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch month: ${response.status}`);
      }
      return response.json() as Promise<BudgetMonth>;
    },
    retry: 1,
  });
}
