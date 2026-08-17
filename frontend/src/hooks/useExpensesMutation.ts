import { useApi } from "./useApi";
import { useBudgetMutation } from "./useBudgetMutation";

export interface ExpenseInput {
  name: string;
  amount: number;
  category: string;
}

export function useAddExpenseMutation(monthId: string) {
  const { request } = useApi();

  return useBudgetMutation((expense: ExpenseInput) =>
    request(`/api/months/${monthId}/expenses`, {
      method: "POST",
      body: JSON.stringify(expense),
    })
  );
}

export function useDeleteExpenseMutation() {
  const { request } = useApi();

  return useBudgetMutation((expenseId: string) =>
    request(`/api/expenses/${expenseId}`, { method: "DELETE" })
  );
}
