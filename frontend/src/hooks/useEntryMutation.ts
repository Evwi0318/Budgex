import { useApi } from "./useApi";
import { useBudgetMutation } from "./useBudgetMutation";
import type { EntryKind } from "../lib/categories";

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

  return useBudgetMutation(({ id, isPaid }: { id: string; isPaid: boolean }) =>
    request(`/api/months/${year}/${month}/entries/${id}/paid`, {
      method: "PUT",
      body: JSON.stringify({ isPaid }),
    })
  );
}
