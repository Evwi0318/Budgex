import { useCallback, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useOutletContext } from "react-router-dom";
import { MonthNav } from "../components/budget/MonthNav";
import { HeroCard } from "../components/home/HeroCard";
import { EntryRow } from "../components/home/EntryRow";
import { PaymentRow } from "../components/home/PaymentRow";
import { EmptyState } from "../components/home/EmptyState";
import { AddEntryForm } from "../components/home/AddEntryForm";
import { EditEntryForm } from "../components/home/EditEntryForm";
import { ExactAmounts } from "../components/home/ExactAmounts";
import { SwipeTabs } from "../components/home/SwipeTabs";
import { SavingsTab } from "../components/savings/SavingsTab";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Fab } from "../components/ui/Fab";
import { ProfileButton } from "../components/ui/ProfileButton";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { UndoToast } from "../components/ui/UndoToast";
import { useMonth } from "../hooks/useMonth";
import { useMonthPlanQuery } from "../hooks/useMonthPlanQuery";
import { useMonthLock } from "../hooks/useMonthLock";
import { useSetPaidMutation } from "../hooks/useEntryMutation";
import { useUndoableDelete } from "../hooks/useUndoableDelete";
import { formatMonthYear, getMonthName } from "../lib/format";
import { isPast } from "../lib/month";
import type { EntryScope } from "../hooks/useEntryMutation";
import type { HomeTab } from "../context/MonthContext";
import type {
  MonthPlan,
  MonthSummary,
  PlannedEntry,
} from "../hooks/useMonthPlanQuery";

/** Sparande är ingen posttyp — där det behövs en riktig EntryKind härleds den */
const kindOf = (tab: HomeTab) => (tab === "Income" ? "Income" : "Expense");

/** Ordningen i hero-kortet, och därmed svepets ordning */
const TABS: HomeTab[] = ["Income", "Expense", "Savings"];

export function Home() {
  const { year, month, tab, setTab, goToPrevMonth, goToNextMonth } = useMonth();
  // Skalet äger scroll-ytan och säger till när kortet ska krympa
  const { compact } = useOutletContext<{ compact: boolean }>();

  const { data: plan, isLoading } = useMonthPlanQuery(year, month);
  // En enda låsinstans för alla tre flikarna — samma månad kan inte vara
  // låst i en flik och upplåst i en annan
  const { isClosed, isLocked, unlock, relock } = useMonthLock(year, month);
  const setPaid = useSetPaidMutation(year, month);
  const togglePaid = setPaid.mutate;
  const { pending, removed, schedule, undo } = useUndoableDelete(
    year,
    month,
    plan,
  );

  const [adding, setAdding] = useState(false);
  const [addDirty, setAddDirty] = useState(false);
  const [addDiscarding, setAddDiscarding] = useState(false);
  const [addingSavings, setAddingSavings] = useState(false);
  const [editing, setEditing] = useState<PlannedEntry | null>(null);
  const [editDirty, setEditDirty] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [removing, setRemoving] = useState<PlannedEntry | null>(null);
  const [showPaid, setShowPaid] = useState(false);
  const [inspecting, setInspecting] = useState(false);

  const closeAdd = () => {
    setAdding(false);
    setAddDirty(false);
    setAddDiscarding(false);
  };

  const requestCloseAdd = () =>
    addDirty ? setAddDiscarding(true) : closeAdd();

  const closeEdit = useCallback(() => {
    setEditing(null);
    setEditDirty(false);
    setDiscarding(false);
  }, []);

  const requestCloseEdit = () =>
    editDirty ? setDiscarding(true) : closeEdit();

  const requestRemove = useCallback(
    (entry: PlannedEntry) => {
      closeEdit();

      if (entry.repeats) {
        setRemoving(entry);
        return;
      }

      schedule(entry, "Onwards");
    },
    [closeEdit, schedule],
  );

  const closeSavings = useCallback(() => setAddingSavings(false), []);

  const confirmRemove = (scope: EntryScope) => {
    if (!removing) return;

    schedule(removing, scope);
    setRemoving(null);
  };

  // Borttagna poster försvinner ur både listan och hero-kortet direkt, redan
  // innan raderingen skickats — annars står summan kvar hela ångra-fönstret ut.
  const summary = useMemo(
    () => (plan ? removed.reduce(withoutEntry, plan.summary) : null),
    [plan, removed],
  );

  /**
   * Flikarnas innehåll byggs bara om när något de visar har ändrats. Ett
   * flikbyte rör då bara panelernas position, i stället för att rita om alla
   * tre listorna — det var det som gjorde bytet segare ju längre listan var.
   */
  const panels = useMemo(() => {
    if (!plan) return null;

    const monthName = getMonthName(month);
    const hidden = new Set(removed.map((entry) => entry.id));

    const incomeEntries = plan.income.filter((entry) => !hidden.has(entry.id));
    const expenseEntries = plan.expenses.filter(
      (entry) => !hidden.has(entry.id),
    );

    // Manuellt ibockade utgifter göms i en egen bubbla. Autogiro räknas alltid
    // som betalt men ligger kvar i listan — det är inget du bockar av.
    const paidExpenses = expenseEntries.filter((e) => !e.isAutogiro && e.isPaid);
    const openExpenses = expenseEntries.filter((e) => e.isAutogiro || !e.isPaid);

    const renderTab = (which: HomeTab) => {
      if (which === "Savings") {
        return (
          <SavingsTab
            plan={plan}
            isClosed={isClosed}
            isLocked={isLocked}
            unlock={unlock}
            relock={relock}
            adding={addingSavings}
            onCloseAdding={closeSavings}
          />
        );
      }

      const isExpense = which === "Expense";
      const showPaidList = isExpense && showPaid && paidExpenses.length > 0;

      // Varje manuell utgift avbockad → tydlig kvittobanner i stället för
      // "N kvar"-raden, precis som sparande-fliken vid allt överfört.
      const allManualPaid =
        isExpense &&
        !showPaidList &&
        paidExpenses.length > 0 &&
        openExpenses.every((e) => e.isAutogiro);

      const entries = !isExpense
        ? incomeEntries
        : showPaidList
          ? paidExpenses
          : openExpenses;

      // Tomt-läget styrs av om månaden har poster alls, inte av den synliga
      // listan — annars visas välkomsttexten när allt är betalt.
      const listIsEmpty =
        (isExpense ? expenseEntries : incomeEntries).length === 0;

      return (
        <div className="px-4 pt-5">
          <header className="mb-2.5 flex items-center gap-2.5 px-1">
            <span className="text-[13.5px] font-bold tracking-[-0.015em] text-[var(--color-text)]">
              {!isExpense
                ? "Inkomst"
                : showPaidList
                  ? `Betalda i ${monthName}`
                  : "Utgifter"}
            </span>

            <span
              className={`grid h-[21px] min-w-[21px] place-items-center rounded-full px-1.5 text-[11.5px] font-extrabold ${
                isExpense
                  ? "bg-[var(--color-danger-wash)] text-[var(--color-danger)]"
                  : "bg-[var(--color-mint-wash)] text-[var(--color-mint)]"
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
                  {isLocked
                    ? "🔒 Avslutad — lås upp"
                    : "🔓 Upplåst — lås igen"}
                </button>
              )}

              {isExpense && paidExpenses.length > 0 && (
                <button
                  onClick={() => setShowPaid(!showPaidList)}
                  className={`flex h-[26px] shrink-0 items-center gap-1.5 rounded-full border px-[11px] text-[11.5px] font-bold transition active:scale-95 ${
                    showPaidList
                      ? "border-[var(--color-mint-dim)] bg-[var(--color-mint-wash)] text-[var(--color-mint)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                  }`}
                >
                  {showPaidList
                    ? `‹ ${openExpenses.length} kvar`
                    : `✓ ${paidExpenses.length} betalda`}
                </button>
              )}
            </div>
          </header>

          {isExpense && !showPaidList && !allManualPaid && (
            <PaymentRow expenses={openExpenses} monthName={monthName} />
          )}

          {allManualPaid && (
            <p className="mb-2.5 rounded-[var(--radius-card)] border border-[var(--color-mint-dim)] bg-[var(--color-mint-wash)] px-4 py-5 text-center text-[13.5px] font-bold text-[var(--color-mint)]">
              🎉 Allt är betalt i {monthName}
            </p>
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
                  togglePaid({ id: entry.id, isPaid: !entry.isPaid })
                }
              />
            ))}
          </AnimatePresence>

          {listIsEmpty && (
            <Empty
              plan={plan}
              tab={which}
              monthName={monthName}
              closed={isClosed}
            />
          )}
        </div>
      );
    };

    return TABS.map(renderTab);
  }, [
    plan,
    removed,
    month,
    isClosed,
    isLocked,
    unlock,
    relock,
    showPaid,
    addingSavings,
    closeSavings,
    requestRemove,
    togglePaid,
  ]);

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="mb-4 h-10 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-surface-2)]" />
        <div className="h-44 animate-pulse rounded-[var(--radius-hero)] bg-[var(--color-surface-2)]" />
      </div>
    );
  }

  if (!plan || !summary || !panels) {
    return (
      <p className="px-4 py-6 text-center text-[var(--color-text-muted)]">
        Kunde inte hämta månaden. Kontrollera anslutningen och försök igen.
      </p>
    );
  }

  const monthName = getMonthName(month);
  const removingNoun = removing?.kind === "Income" ? "Inkomsten" : "Utgiften";

  return (
    <>
      <SwipeTabs
        index={TABS.indexOf(tab)}
        count={TABS.length}
        onIndexChange={(next) => setTab(TABS[next])}
        // Utan select-none börjar ett svep markera text i stället, och nästa
        // svep över markeringen startar ett inbyggt drag som äter pointerup.
        // flex-1: fyll skalets höjd så svep på tom yta under korten fångas.
        className="flex-1 select-none"
        header={
          <>
            <MonthNav
              year={year}
              month={month}
              canGoNext={isPast({ year, month })}
              onPrev={goToPrevMonth}
              onNext={goToNextMonth}
            />

            <HeroCard
              summary={summary}
              tab={tab}
              onSelect={setTab}
              dimmed={isLocked}
              compact={compact}
              onInspect={() => setInspecting(true)}
            />
          </>
        }
      >
        {(index) => panels[index]}
      </SwipeTabs>

      {/* Ångra-fönstret täcker annars sista raden */}
      {pending && (
        <div aria-hidden style={{ height: "var(--toast-clearance)" }} />
      )}

      <ExactAmounts
        summary={summary}
        monthLabel={formatMonthYear(month, year)}
        open={inspecting}
        onClose={() => setInspecting(false)}
      />

      <ProfileButton />

      {!isLocked && (
        <Fab
          tab={tab}
          onClick={() =>
            tab === "Savings" ? setAddingSavings(true) : setAdding(true)
          }
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
        onUndo={undo}
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
    </>
  );
}

/**
 * Hero-kortet räknar bort en post så fort den tagits bort, inte först när
 * raderingen gått igenom. Ångrar man kommer summan tillbaka lika snabbt.
 */
function withoutEntry(summary: MonthSummary, entry: PlannedEntry): MonthSummary {
  return entry.kind === "Income"
    ? {
        ...summary,
        income: summary.income - entry.amount,
        safeToSpend: summary.safeToSpend - entry.amount,
      }
    : {
        ...summary,
        totalExpenses: summary.totalExpenses - entry.amount,
        safeToSpend: summary.safeToSpend + entry.amount,
      };
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
