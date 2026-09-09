import { useCallback, useMemo, useState } from "react";
import { useUndoableDelete } from "./useUndoableDelete";
import { withoutEntry } from "../lib/summary";
import type { EntryKind } from "../lib/categories";
import type { EntryScope } from "./useEntryMutation";
import type { MonthPlan, PlannedEntry } from "./useMonthPlanQuery";

/**
 * Allt som hör till att lägga till, ändra och ta bort en post. Mobil- och
 * desktopvyn visar olika listor men driver exakt samma flöde.
 */
export function useEntryEditor(
  year: number,
  month: number,
  plan: MonthPlan | undefined
) {
  const { pending, removed, schedule, undo } = useUndoableDelete(
    year,
    month,
    plan
  );

  const [adding, setAdding] = useState<EntryKind | null>(null);
  const [addDirty, setAddDirty] = useState(false);
  const [addDiscarding, setAddDiscarding] = useState(false);
  const [editing, setEditing] = useState<PlannedEntry | null>(null);
  const [editDirty, setEditDirty] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [removing, setRemoving] = useState<PlannedEntry | null>(null);

  const closeAdd = useCallback(() => {
    setAdding(null);
    setAddDirty(false);
    setAddDiscarding(false);
  }, []);

  const closeEdit = useCallback(() => {
    setEditing(null);
    setEditDirty(false);
    setDiscarding(false);
  }, []);

  const requestRemove = useCallback(
    (entry: PlannedEntry) => {
      closeEdit();

      if (entry.repeats) {
        setRemoving(entry);
        return;
      }

      schedule(entry, "Onwards");
    },
    [closeEdit, schedule]
  );

  const confirmRemove = useCallback(
    (scope: EntryScope) => {
      if (!removing) return;

      schedule(removing, scope);
      setRemoving(null);
    },
    [removing, schedule]
  );

  // Borttagna poster försvinner ur både listan och hero-kortet direkt, redan
  // innan raderingen skickats — annars står summan kvar hela ångra-fönstret ut.
  const summary = useMemo(
    () => (plan ? removed.reduce(withoutEntry, plan.summary) : null),
    [plan, removed]
  );

  return {
    year,
    month,
    summary,
    removed,
    pending,
    undo,
    adding,
    editing,
    removing,
    openAdd: setAdding,
    openEdit: setEditing,
    requestRemove,
    confirmRemove,
    closeAdd,
    closeEdit,
    addDirty,
    setAddDirty,
    addDiscarding,
    setAddDiscarding,
    editDirty,
    setEditDirty,
    discarding,
    setDiscarding,
    setRemoving,
  };
}

export type EntryEditor = ReturnType<typeof useEntryEditor>;
