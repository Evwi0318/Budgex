import { useApi } from "./useApi";
import { useBudgetMutation, useOptimisticMutation } from "./useBudgetMutation";
import type { EntryKind } from "../lib/categories";
import type { MonthPlan } from "./useMonthPlanQuery";

export type EntryScope = "Month" | "Onwards";

export interface EntryInput {
  kind: EntryKind;
  name: string;
  category: string;
  amount: number;
  isAutogiro: boolean;
  repeats: boolean;
}

export interface EntryUpdate {
  id: string;
  kind: EntryKind;
  name: string;
  category: string;
  amount: number;
  isAutogiro: boolean;
  repeats: boolean;
  scope: EntryScope;
}

export function useAddEntryMutation(year: number, month: number) {
  const { request } = useApi();

  return useBudgetMutation((entry: EntryInput) =>
    request(`/api/months/${year}/${month}/entries`, {
      method: "POST",
      body: JSON.stringify(entry),
    })
  );
}

export function useUpdateEntryMutation(year: number, month: number) {
  const { request } = useApi();

  return useBudgetMutation(({ id, ...entry }: EntryUpdate) =>
    request(`/api/months/${year}/${month}/entries/${id}`, {
      method: "PUT",
      body: JSON.stringify(entry),
    })
  );
}

export function useDeleteEntryMutation(year: number, month: number) {
  const { request } = useApi();

  return useBudgetMutation(({ id, scope }: { id: string; scope: EntryScope }) =>
    request(`/api/months/${year}/${month}/entries/${id}?scope=${scope}`, {
      method: "DELETE",
    })
  );
}

export function useSetPaidMutation(year: number, month: number) {
  const { request } = useApi();

  // Bara månaden berörs — en avbockad utgift ändrar varken summorna eller
  // sparandet, så det finns inget mer att hämta om.
  return useOptimisticMutation<MonthPlan, { id: string; isPaid: boolean }>(
    ["month", year, month],
    ({ id, isPaid }) =>
      request(`/api/months/${year}/${month}/entries/${id}/paid`, {
        method: "PUT",
        body: JSON.stringify({ isPaid }),
      }),
    (plan, { id, isPaid }) => ({
      ...plan,
      expenses: plan.expenses.map((entry) =>
        entry.id === id ? { ...entry, isPaid } : entry
      ),
    })
  );
}
