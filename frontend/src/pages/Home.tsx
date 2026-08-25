import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { MonthNav } from "../components/budget/MonthNav";
import { HeroCard } from "../components/home/HeroCard";
import { EntryRow } from "../components/home/EntryRow";
import { EmptyState } from "../components/home/EmptyState";
import { EditEntryForm } from "../components/home/EditEntryForm";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Fab } from "../components/ui/Fab";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useMonthPlanQuery } from "../hooks/useMonthPlanQuery";
import { useMonthLock } from "../hooks/useMonthLock";
import {
  useDeleteEntryMutation,
  useSetPaidMutation,
} from "../hooks/useEntryMutation";
import { getMonthName } from "../lib/format";
import { isPast } from "../lib/month";
import type { EntryScope } from "../hooks/useEntryMutation";
import type { MonthOutletContext } from "../components/layout/AppShell";
import type { MonthPlan, PlannedEntry } from "../hooks/useMonthPlanQuery";

export function Home() {
  const {
    year,
    month,
    view,
    setView,
    goToPrevMonth,
    goToNextMonth,
    openAdd,
  } = useOutletContext<MonthOutletContext>();
  const navigate = useNavigate();

  const { data: plan, isLoading } = useMonthPlanQuery(year, month);
  const { isClosed, isLocked, unlock, relock } = useMonthLock(year, month);
  const setPaid = useSetPaidMutation(year, month);
  const deleteEntry = useDeleteEntryMutation(year, month);

  const [editing, setEditing] = useState<PlannedEntry | null>(null);
  const [editDirty, setEditDirty] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [removing, setRemoving] = useState<PlannedEntry | null>(null);

  const closeEdit = () => {
    setEditing(null);
    setEditDirty(false);
    setDiscarding(false);
  };

  const requestCloseEdit = () => (editDirty ? setDiscarding(true) : closeEdit());

  const requestRemove = (entry: PlannedEntry) => {
    closeEdit();

    if (entry.repeats) {
      setRemoving(entry);
      return;
    }

    deleteEntry.mutate({ id: entry.id, scope: "Onwards" });
  };

  const confirmRemove = (scope: EntryScope) => {
    if (!removing) return;

    deleteEntry.mutate(
      { id: removing.id, scope },
      { onSuccess: () => setRemoving(null) }
    );
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
  const entries = view === "Income" ? plan.income : plan.expenses;
  const removingNoun = removing?.kind === "Income" ? "Inkomsten" : "Utgiften";

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
        view={view}
        onSelect={setView}
        onSavings={() => navigate("/savings")}
        dimmed={isLocked}
      />

      <div className="px-4 pt-5">
        <header className="mb-2.5 flex items-center gap-2.5 px-1">
          <span className="text-[13.5px] font-bold tracking-[-0.015em] text-[var(--color-text)]">
            {view === "Income" ? "Inkomst" : "Utgifter"}
          </span>

          <span
            className={`grid h-[21px] min-w-[21px] place-items-center rounded-full px-1.5 text-[11.5px] font-extrabold ${
              view === "Income"
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

        {entries.length > 0 ? (
          entries.map((entry) => (
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
          ))
        ) : (
          <Empty plan={plan} view={view} monthName={monthName} closed={isClosed} />
        )}
      </div>

      {!isLocked && (
        <Fab
          onClick={openAdd}
          label={view === "Income" ? "Lägg till inkomst" : "Lägg till utgift"}
        />
      )}

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
  view: "Income" | "Expense";
  monthName: string;
  closed: boolean;
}

function Empty({ plan, view, monthName, closed }: EmptyProps) {
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
        footnote="Tryck på + nere till höger för att lägga till."
      />
    );
  }

  if (view === "Income") {
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
