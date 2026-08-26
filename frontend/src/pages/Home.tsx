import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useOutletContext } from "react-router-dom";
import { MonthNav } from "../components/budget/MonthNav";
import { HeroCard } from "../components/home/HeroCard";
import { EntryRow } from "../components/home/EntryRow";
import { PaymentRow } from "../components/home/PaymentRow";
import { EmptyState } from "../components/home/EmptyState";
import { AddEntryForm } from "../components/home/AddEntryForm";
import { EditEntryForm } from "../components/home/EditEntryForm";
import { SavingsTab } from "../components/savings/SavingsTab";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Fab } from "../components/ui/Fab";
import { ProfileButton } from "../components/ui/ProfileButton";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { UndoToast } from "../components/ui/UndoToast";
import { useMonth } from "../hooks/useMonth";
import { useMonthPlanQuery } from "../hooks/useMonthPlanQuery";
import { useMonthLock } from "../hooks/useMonthLock";
import {
  useDeleteEntryMutation,
  useSetPaidMutation,
} from "../hooks/useEntryMutation";
import { getMonthName } from "../lib/format";
import { isPast } from "../lib/month";
import type { EntryScope } from "../hooks/useEntryMutation";
import type { HomeTab } from "../context/MonthContext";
import type { MonthPlan, PlannedEntry } from "../hooks/useMonthPlanQuery";

const UNDO_MS = 5000;

interface PendingDelete {
  entry: PlannedEntry;
  scope: EntryScope;
}

/** Sparande är ingen posttyp — där behövs en riktig EntryKind härleds den */
const kindOf = (tab: HomeTab) => (tab === "Income" ? "Income" : "Expense");

export function Home() {
  const { year, month, tab, setTab, goToPrevMonth, goToNextMonth } = useMonth();
  // Skalet äger scroll-ytan och säger till när kortet ska krympa
  const { compact } = useOutletContext<{ compact: boolean }>();

  const { data: plan, isLoading } = useMonthPlanQuery(year, month);
  // En enda låsinstans för alla tre flikarna — samma månad kan inte vara
  // låst i en flik och upplåst i en annan
  const { isClosed, isLocked, unlock, relock } = useMonthLock(year, month);
  const setPaid = useSetPaidMutation(year, month);
  const deleteEntry = useDeleteEntryMutation(year, month);

  const [adding, setAdding] = useState(false);
  const [addDirty, setAddDirty] = useState(false);
  const [addDiscarding, setAddDiscarding] = useState(false);
  const [addingSavings, setAddingSavings] = useState(false);
  const [editing, setEditing] = useState<PlannedEntry | null>(null);
  const [editDirty, setEditDirty] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [removing, setRemoving] = useState<PlannedEntry | null>(null);
  const [pending, setPending] = useState<PendingDelete | null>(null);
  const pendingRef = useRef<PendingDelete | null>(null);
  const timer = useRef<number | null>(null);

  const closeAdd = () => {
    setAdding(false);
    setAddDirty(false);
    setAddDiscarding(false);
  };

  const requestCloseAdd = () => (addDirty ? setAddDiscarding(true) : closeAdd());

  const closeEdit = () => {
    setEditing(null);
    setEditDirty(false);
    setDiscarding(false);
  };

  const requestCloseEdit = () => (editDirty ? setDiscarding(true) : closeEdit());

  // Raderingen skickas först när ångra-fönstret runnit ut. Utan fördröjningen
  // skulle "Ångra" behöva skapa posten på nytt, och den skulle få nytt id.
  const commit = () => {
    const current = pendingRef.current;

    clearTimer();
    pendingRef.current = null;
    setPending(null);

    if (current) {
      deleteEntry.mutate({ id: current.entry.id, scope: current.scope });
    }
  };

  const clearTimer = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };

  const scheduleDelete = (entry: PlannedEntry, scope: EntryScope) => {
    commit();

    const next = { entry, scope };

    pendingRef.current = next;
    setPending(next);
    timer.current = window.setTimeout(commit, UNDO_MS);
  };

  const undoDelete = () => {
    clearTimer();
    pendingRef.current = null;
    setPending(null);
  };

  useEffect(() => () => {
    if (timer.current === null) return;

    window.clearTimeout(timer.current);
    if (pendingRef.current) {
      deleteEntry.mutate({
        id: pendingRef.current.entry.id,
        scope: pendingRef.current.scope,
      });
    }
    // deleteEntry byter identitet vid varje render, men muteringen är stabil
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestRemove = (entry: PlannedEntry) => {
    closeEdit();

    if (entry.repeats) {
      setRemoving(entry);
      return;
    }

    scheduleDelete(entry, "Onwards");
  };

  const confirmRemove = (scope: EntryScope) => {
    if (!removing) return;

    scheduleDelete(removing, scope);
    setRemoving(null);
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="mb-4 h-10 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-surface-2)]" />
        <div className="h-44 animate-pulse rounded-[var(--radius-hero)] bg-[var(--color-surface-2)]" />
      </div>
    );
  }

  if (!plan) {
    return (
      <p className="px-4 py-6 text-center text-[var(--color-text-muted)]">
        Kunde inte hämta månaden. Kontrollera anslutningen och försök igen.
      </p>
    );
  }

  const monthName = getMonthName(month);
  const entries = (tab === "Income" ? plan.income : plan.expenses).filter(
    (entry) => entry.id !== pending?.entry.id
  );
  const removingNoun = removing?.kind === "Income" ? "Inkomsten" : "Utgiften";

  const fabLabel =
    tab === "Income"
      ? "Lägg till inkomst"
      : tab === "Savings"
        ? "Lägg till sparkonto"
        : "Lägg till utgift";

  return (
    <div>
      <MonthNav
        year={year}
        month={month}
        canGoNext={isPast({ year, month })}
        onPrev={goToPrevMonth}
        onNext={goToNextMonth}
      />

      <HeroCard
        summary={plan.summary}
        tab={tab}
        onSelect={setTab}
        dimmed={isLocked}
        compact={compact}
      />

      {tab === "Savings" ? (
        <SavingsTab
          plan={plan}
          isClosed={isClosed}
          isLocked={isLocked}
          unlock={unlock}
          relock={relock}
          adding={addingSavings}
          onCloseAdding={() => setAddingSavings(false)}
        />
      ) : (
        <div className="px-4 pt-5">
          <header className="mb-2.5 flex items-center gap-2.5 px-1">
            <span className="text-[13.5px] font-bold tracking-[-0.015em] text-[var(--color-text)]">
              {tab === "Income" ? "Inkomst" : "Utgifter"}
            </span>

            <span
              className={`grid h-[21px] min-w-[21px] place-items-center rounded-full px-1.5 text-[11.5px] font-extrabold ${
                tab === "Income"
                  ? "bg-[var(--color-mint-wash)] text-[var(--color-mint)]"
                  : "bg-[var(--color-danger-wash)] text-[var(--color-danger)]"
              }`}
            >
              {entries.length}
            </span>

            <div className="ml-auto flex items-center gap-2">
              {isClosed && (
                <button
                  onClick={isLocked ? unlock : relock}
                  className={`rounded-full border px-2.5 py-1.5 text-[12.5px] font-extrabold transition active:scale-95 ${
                    isLocked
                      ? "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]"
                      : "border-[var(--color-mint-dim)] bg-[var(--color-mint-wash)] text-[var(--color-mint)]"
                  }`}
                >
                  {isLocked ? "🔒 Avslutad — lås upp" : "🔓 Upplåst — lås igen"}
                </button>
              )}
            </div>
          </header>

          {tab === "Expense" && (
            <PaymentRow expenses={entries} monthName={monthName} />
          )}

          <AnimatePresence initial={false}>
            {entries.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                monthName={monthName}
                locked={isLocked}
                onOpen={() => !isLocked && setEditing(entry)}
                onDelete={() => requestRemove(entry)}
                onTogglePaid={() =>
                  setPaid.mutate({ id: entry.id, isPaid: !entry.isPaid })
                }
              />
            ))}
          </AnimatePresence>

          {entries.length === 0 && (
            <Empty plan={plan} tab={tab} monthName={monthName} closed={isClosed} />
          )}
        </div>
      )}

      {/* Ångra-fönstret täcker annars sista raden */}
      {pending && <div aria-hidden style={{ height: "var(--toast-clearance)" }} />}

      <ProfileButton />

      {!isLocked && (
        <Fab
          onClick={() => (tab === "Savings" ? setAddingSavings(true) : setAdding(true))}
          label={fabLabel}
        />
      )}

      <BottomSheet open={adding} onClose={requestCloseAdd}>
        <AddEntryForm
          year={year}
          month={month}
          kind={kindOf(tab)}
          onSaved={closeAdd}
          onDirtyChange={setAddDirty}
        />
      </BottomSheet>

      <ConfirmDialog
        open={addDiscarding}
        title="Kasta ändringarna?"
        body={`Den nya ${tab === "Income" ? "inkomsten" : "utgiften"} sparas inte.`}
        actions={[
          { label: "Kasta", tone: "danger" },
          { label: "Fortsätt skriva", tone: "alt" },
        ]}
        onPick={(index) => (index === 0 ? closeAdd() : setAddDiscarding(false))}
        onCancel={() => setAddDiscarding(false)}
      />

      <BottomSheet open={editing !== null} onClose={requestCloseEdit}>
        {editing && (
          <EditEntryForm
            year={year}
            month={month}
            entry={editing}
            onSaved={closeEdit}
            onRemove={() => requestRemove(editing)}
            onDirtyChange={setEditDirty}
          />
        )}
      </BottomSheet>

      <ConfirmDialog
        open={discarding}
        title="Kasta ändringarna?"
        body={`Ändringarna av ${editing?.name ?? ""} sparas inte.`}
        actions={[
          { label: "Kasta", tone: "danger" },
          { label: "Fortsätt skriva", tone: "alt" },
        ]}
        onPick={(index) => (index === 0 ? closeEdit() : setDiscarding(false))}
        onCancel={() => setDiscarding(false)}
      />

      <UndoToast
        message={
          pending
            ? `${pending.entry.kind === "Income" ? "Inkomsten" : "Utgiften"} ${pending.entry.name} borttagen`
            : null
        }
        onUndo={undoDelete}
      />

      <ConfirmDialog
        open={removing !== null}
        title={`Ta bort ${removing?.name ?? ""}?`}
        body={`${removingNoun} återkommer varje månad.`}
        actions={[
          { label: `Bara ${monthName} ${year}` },
          { label: "Den här och kommande månader", tone: "alt" },
        ]}
        cancelLabel="Avbryt"
        onPick={(index) => confirmRemove(index === 0 ? "Month" : "Onwards")}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}

interface EmptyProps {
  plan: MonthPlan;
  tab: HomeTab;
  monthName: string;
  closed: boolean;
}

function Empty({ plan, tab, monthName, closed }: EmptyProps) {
  const nothingAtAll = plan.income.length === 0 && plan.expenses.length === 0;

  if (closed) {
    return (
      <EmptyState
        emoji="🗓"
        title={`Inget i ${monthName}`}
        body="Den här månaden är avslutad och innehåller inga poster."
      />
    );
  }

  if (nothingAtAll) {
    return (
      <EmptyState
        emoji="👋"
        title="Välkommen till Budgex"
        body="Börja med din inkomst — då vet appen hur mycket du har att röra dig med. Utgifterna lägger du till efteråt."
        footnote="Tryck på + nere i mitten för att lägga till."
      />
    );
  }

  if (tab === "Income") {
    return (
      <EmptyState
        emoji="💼"
        title={`Ingen inkomst i ${monthName}`}
        body="Lägg till lön, bidrag eller annat som kommit in den här månaden."
      />
    );
  }

  if (plan.income.length === 0) {
    return (
      <EmptyState
        emoji="🧾"
        title="Inkomsten först"
        body="Utan inkomst går det inte att se vad som är kvar att spendera. Byt till Inkomst-fliken och lägg till den."
      />
    );
  }

  return (
    <EmptyState
      emoji="🏠"
      title="Inga utgifter än"
      body="Börja med hyran — den återkommer varje månad, så välj Varje månad så slipper du lägga in den igen."
    />
  );
}
