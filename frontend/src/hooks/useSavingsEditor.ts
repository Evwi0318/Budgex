import { useState } from "react";
import {
  useDeleteSavingsAccountMutation,
  useTransferAllMutation,
  useTransferMutation,
} from "./useSavingsMutation";
import type { SavingsAccount, SavingsMonth } from "./useSavingsQuery";

/**
 * Sparkontolistan och dess ark. Mobilfliken låter FAB:en äga "lägg till",
 * desktopsektionen sin egen knapp — därför kommer det tillståndet utifrån.
 */
export function useSavingsEditor(
  year: number,
  month: number,
  savings: SavingsMonth | undefined,
  adding: boolean,
  closeAdding: () => void
) {
  const transfer = useTransferMutation(year, month);
  const transferAll = useTransferAllMutation(year, month);
  const deleteAccount = useDeleteSavingsAccountMutation(year, month);

  const [editing, setEditing] = useState<SavingsAccount | null>(null);
  const [dirty, setDirty] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [removing, setRemoving] = useState<SavingsAccount | null>(null);
  const [showTransferred, setShowTransferred] = useState(false);

  const accounts = savings?.accounts ?? [];
  const remaining = accounts.filter((account) => !account.isTransferred);
  const done = accounts.filter((account) => account.isTransferred);

  // Bockas den sista överföringen bort finns ingen överförd-lista kvar att
  // visa, och vyn måste falla tillbaka i samma render — annars ser det ut
  // som att kontot försvann
  const showDone = showTransferred && done.length > 0;

  const closeSheet = () => {
    setEditing(null);
    closeAdding();
    setDirty(false);
    setDiscarding(false);
  };

  return {
    accounts,
    remaining,
    done,
    showDone,
    visible: showDone ? done : remaining,
    allDone: remaining.length === 0,
    remainingTotal: remaining.reduce((sum, account) => sum + account.amount, 0),
    toggleShowTransferred: () => setShowTransferred(!showDone),
    sheetOpen: adding || editing !== null,
    editing,
    openEdit: setEditing,
    removing,
    setRemoving,
    setDirty,
    discarding,
    setDiscarding,
    closeSheet,
    requestClose: () => (dirty ? setDiscarding(true) : closeSheet()),
    confirmRemove: () =>
      removing &&
      deleteAccount.mutate(removing.id, { onSuccess: () => setRemoving(null) }),
    transfer,
    transferAll,
  };
}

export type SavingsEditor = ReturnType<typeof useSavingsEditor>;
