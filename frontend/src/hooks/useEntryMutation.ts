import { useApi } from "./useApi";
import { useBudgetMutation } from "./useBudgetMutation";
import type { EntryKind } from "../lib/categories";

export interface EntryInput {
  kind: EntryKind;
  name: string;
  category: string;
  amount: number;
  isAutogiro: boolean;
  repeats: boolean;
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
