import { useApi } from "./useApi";
import { useBudgetMutation, useOptimisticMutation } from "./useBudgetMutation";
import type { RuleType, SavingsItem, SavingsMonth } from "./useSavingsQuery";

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
  items: SavingsItem[];
}

/** acknowledged: användaren har sett att planen saknar täckning och överför ändå */
export interface Transfer {
  isTransferred: boolean;
  acknowledged?: boolean;
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

  // Överfört-bocken syns bara i sparandet, så månaden behöver inte hämtas om
  return useOptimisticMutation<SavingsMonth, Transfer & { id: string }>(
    ["savings", year, month],
    ({ id, ...transfer }) =>
      request(`/api/months/${year}/${month}/savings/${id}/transferred`, {
        method: "PUT",
        body: JSON.stringify(transfer),
      }),
    (savings, { id, isTransferred }) => ({
      ...savings,
      accounts: savings.accounts.map((account) =>
        account.id === id ? { ...account, isTransferred } : account
      ),
    })
  );
}

export function useTransferAllMutation(year: number, month: number) {
  const { request } = useApi();

  return useOptimisticMutation<SavingsMonth, Transfer>(
    ["savings", year, month],
    (transfer) =>
      request(`/api/months/${year}/${month}/savings/transferred`, {
        method: "PUT",
        body: JSON.stringify(transfer),
      }),
    (savings, { isTransferred }) => ({
      ...savings,
      accounts: savings.accounts.map((account) => ({ ...account, isTransferred })),
    })
  );
}
