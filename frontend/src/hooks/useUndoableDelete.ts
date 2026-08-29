import { useEffect, useRef, useState } from "react";
import { useDeleteEntryMutation } from "./useEntryMutation";
import type { EntryScope } from "./useEntryMutation";
import type { MonthPlan, PlannedEntry } from "./useMonthPlanQuery";

const UNDO_MS = 5000;

export interface PendingDelete {
  entry: PlannedEntry;
  scope: EntryScope;
}

/**
 * Raderingen skickas först när ångra-fönstret runnit ut — utan fördröjningen
 * skulle "Ångra" behöva skapa posten på nytt, och den skulle få nytt id.
 *
 * Posten försvinner ändå ur listan och ur hero-kortet direkt, och hålls dold
 * ända tills månaden hämtats om utan den. Slutade döljandet redan när DELETE
 * skickades hann posten blinka förbi igen innan svaret kom.
 */
export function useUndoableDelete(
  year: number,
  month: number,
  plan: MonthPlan | undefined
) {
  const deleteEntry = useDeleteEntryMutation(year, month);

  const [pending, setPending] = useState<PendingDelete | null>(null);
  const [sent, setSent] = useState<PlannedEntry[]>([]);
  const pendingRef = useRef<PendingDelete | null>(null);
  const timer = useRef<number | null>(null);

  const clearTimer = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };

  const send = ({ entry, scope }: PendingDelete) => {
    setSent((list) => [...list, entry]);

    deleteEntry.mutate(
      { id: entry.id, scope },
      {
        // Gick det inte ska posten tillbaka in i listan, inte försvinna tyst
        onError: () =>
          setSent((list) => list.filter((item) => item.id !== entry.id)),
      }
    );
  };

  const flush = () => {
    const current = pendingRef.current;

    clearTimer();
    pendingRef.current = null;
    setPending(null);

    if (current) send(current);
  };

  const schedule = (entry: PlannedEntry, scope: EntryScope) => {
    flush();

    const next = { entry, scope };

    pendingRef.current = next;
    setPending(next);
    timer.current = window.setTimeout(flush, UNDO_MS);
  };

  const undo = () => {
    clearTimer();
    pendingRef.current = null;
    setPending(null);
  };

  useEffect(() => {
    return () => {
      if (timer.current === null) return;

      window.clearTimeout(timer.current);
      if (pendingRef.current) {
        deleteEntry.mutate({
          id: pendingRef.current.entry.id,
          scope: pendingRef.current.scope,
        });
      }
    };
    // deleteEntry byter identitet vid varje render, men muteringen är stabil
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alive = new Set(
    [...(plan?.income ?? []), ...(plan?.expenses ?? [])].map((entry) => entry.id)
  );

  // Skickade poster slutar räknas så fort månaden svarar utan dem — listan
  // städar därmed sig själv utan att behöva en egen effekt.
  const removed = [
    ...(pending ? [pending.entry] : []),
    ...sent.filter((entry) => alive.has(entry.id)),
  ];

  return { pending, removed, schedule, undo };
}
