import { useApi } from "./useApi";
import { useBudgetMutation } from "./useBudgetMutation";
import type { RuleType } from "./useSavingsQuery";

export interface RuleInput {
  sourceEntryId: string;
  ruleType: RuleType;
  value: number;
}

export interface SavingsAccountInput {
  name: string;
  icon: string;
  goal: number | null;
  saved: number | null;
  rules: RuleInput[];
}

export function useAddSavingsAccountMutation(year: number, month: number) {
  const { request } = useApi();

  return useBudgetMutation((account: SavingsAccountInput) =>
    request(`/api/months/${year}/${month}/savings`, {
      method: "POST",
      body: JSON.stringify(account),
    })
  );
}

export function useUpdateSavingsAccountMutation(year: number, month: number) {
  const { request } = useApi();

  return useBudgetMutation(
    ({ id, ...account }: SavingsAccountInput & { id: string }) =>
      request(`/api/months/${year}/${month}/savings/${id}`, {
        method: "PUT",
        body: JSON.stringify(account),
      })
  );
}

export function useDeleteSavingsAccountMutation(year: number, month: number) {
  const { request } = useApi();

  return useBudgetMutation((id: string) =>
    request(`/api/months/${year}/${month}/savings/${id}`, { method: "DELETE" })
  );
}

export function useTransferMutation(year: number, month: number) {
  const { request } = useApi();

  return useBudgetMutation(
    ({ id, isTransferred }: { id: string; isTransferred: boolean }) =>
      request(`/api/months/${year}/${month}/savings/${id}/transferred`, {
        method: "PUT",
        body: JSON.stringify({ isTransferred }),
      })
  );
}

export function useTransferAllMutation(year: number, month: number) {
  const { request } = useApi();

  return useBudgetMutation((isTransferred: boolean) =>
    request(`/api/months/${year}/${month}/savings/transferred`, {
      method: "PUT",
      body: JSON.stringify({ isTransferred }),
    })
  );
}
