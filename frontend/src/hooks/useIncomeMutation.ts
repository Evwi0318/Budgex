import { useApi } from "./useApi";
import { useBudgetMutation } from "./useBudgetMutation";

export interface IncomeInput {
  salary: number;
  csnAmount: number;
  /** Lånedelen i kronor, läst rakt av från CSN-beslutet */
  csnLoanPart: number;
}

export function useIncomeMutation(monthId: string) {
  const { request } = useApi();

  return useBudgetMutation((income: IncomeInput) =>
    request(`/api/months/${monthId}/income`, {
      method: "PUT",
      body: JSON.stringify(income),
    })
  );
}
