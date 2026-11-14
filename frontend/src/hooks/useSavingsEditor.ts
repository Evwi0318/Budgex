import { useState } from "react";
import {
  useDeleteSavingsAccountMutation,
  useTransferAllMutation,
  useTransferMutation,
} from "./useSavingsMutation";
import type { SavingsAccount, SavingsMonth } from "./useSavingsQuery";
import type { MonthSummary } from "./useMonthPlanQuery";
import { fundingWarning } from "../lib/savings";

/**
 * Sparkontolistan och dess ark. Mobilfliken låter FAB:en äga "lägg till",
 * desktopsektionen sin egen knapp — därför kommer det tillståndet utifrån.
 */
export function useSavingsEditor(
  year: number,
  month: number,
  savings: SavingsMonth | undefined,
  summary: MonthSummary,
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
  const [pendingTransfer, setPendingTransfer] = useState<SavingsAccount | "all" | null>(null);

  const warning = savings ? fundingWarning(summary, savings.sources) : null;

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

  const markTransferred = (target: SavingsAccount | "all", acknowledged: boolean) =>
    target === "all"
      ? transferAll.mutate({ isTransferred: true, acknowledged })
      : transfer.mutate({ id: target.id, isTransferred: true, acknowledged });

  // Bara den som bockar i behöver se varningen. Att ångra är alltid fritt.
  const requestTransfer = (target: SavingsAccount | "all") =>
    warning ? setPendingTransfer(target) : markTransferred(target, false);

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
    warning,
    pendingTransfer,
    toggleTransfer: (account: SavingsAccount) =>
      account.isTransferred
        ? transfer.mutate({ id: account.id, isTransferred: false })
        : requestTransfer(account),
    toggleAll: () =>
      remaining.length === 0
        ? transferAll.mutate({ isTransferred: false })
        : requestTransfer("all"),
    confirmTransfer: () => {
      if (pendingTransfer) markTransferred(pendingTransfer, true);
      setPendingTransfer(null);
    },
    cancelTransfer: () => setPendingTransfer(null),
  };
}

export type SavingsEditor = ReturnType<typeof useSavingsEditor>;
