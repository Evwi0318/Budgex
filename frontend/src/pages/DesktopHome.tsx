import { useState } from "react";
import type { ReactNode } from "react";
import { Allocation } from "../components/desktop/Allocation";
import { MonthTrend } from "../components/desktop/MonthTrend";
import { DesktopEntryRow } from "../components/desktop/DesktopEntryRow";
import { SavingsSection } from "../components/desktop/SavingsSection";
import {
  AddButton,
  GhostButton,
  SectionHeader,
} from "../components/desktop/SectionHeader";
import { EntryDialogs } from "../components/home/EntryDialogs";
import { EmptyState } from "../components/home/EmptyState";
import { PaymentRow } from "../components/home/PaymentRow";
import { useMonth } from "../hooks/useMonth";
import { useMonthPlanQuery } from "../hooks/useMonthPlanQuery";
import { useMonthLock } from "../hooks/useMonthLock";
import { useEntryEditor } from "../hooks/useEntryEditor";
import { useSetPaidMutation } from "../hooks/useEntryMutation";
import { useSavingsQuery } from "../hooks/useSavingsQuery";
import { useTrendQuery } from "../hooks/useTrendQuery";
import { getMonthName } from "../lib/format";

export function DesktopHome() {
  const { year, month, goToMonth } = useMonth();

  const { data: plan, isLoading } = useMonthPlanQuery(year, month);
  const { data: savings } = useSavingsQuery(year, month);
  const { isClosed, isLocked, unlock, relock } = useMonthLock(year, month);
  const setPaid = useSetPaidMutation(year, month);
  const togglePaid = setPaid.mutate;
  const trend = useTrendQuery();

  const editor = useEntryEditor(year, month, plan);
  const { summary, removed, openAdd, openEdit } = editor;

  const [showPaid, setShowPaid] = useState(false);

  if (isLoading) {
    return (
      <Page>
        <div className="mt-9 h-52 animate-pulse rounded-[var(--radius-hero)] bg-[var(--color-surface-2)]" />
      </Page>
    );
  }

  if (!plan || !summary) {
    return (
      <Page>
        <p className="py-10 text-center text-[var(--color-text-muted)]">
          Kunde inte hämta månaden. Kontrollera anslutningen och försök igen.
        </p>
      </Page>
    );
  }

  const monthName = getMonthName(month);
  const hidden = new Set(removed.map((entry) => entry.id));

  const income = plan.income.filter((entry) => !hidden.has(entry.id));
  const expenses = plan.expenses.filter((entry) => !hidden.has(entry.id));
  const paidExpenses = expenses.filter((e) => !e.isAutogiro && e.isPaid);
  const openExpenses = expenses.filter((e) => e.isAutogiro || !e.isPaid);
  const showPaidList = showPaid && paidExpenses.length > 0;
  const visibleExpenses = showPaidList ? paidExpenses : openExpenses;

  const unpaid = openExpenses.filter((e) => !e.isAutogiro && !e.isPaid);
  const toTransfer = (savings?.accounts ?? [])
    .filter((account) => !account.isTransferred)
    .reduce((sum, account) => sum + account.amount, 0);

  return (
    <Page>
      <section className="grid gap-7 py-9 min-[1080px]:grid-cols-[minmax(0,1fr)_minmax(360px,46%)] min-[1080px]:items-end min-[1080px]:gap-12 min-[1080px]:pt-10">
        <Allocation
          summary={summary}
          monthName={monthName}
          unpaidCount={unpaid.length}
          toTransfer={toTransfer}
        />

        <MonthTrend
          months={trend}
          selected={{ year, month }}
          onSelect={goToMonth}
        />
      </section>

      <div className="grid gap-8 border-t border-[var(--color-border)] pt-7 lg:grid-cols-[minmax(0,1.85fr)_1px_minmax(300px,1fr)] lg:gap-x-9 lg:gap-y-0">
        <section className="min-w-0">
          <SectionHeader
            title={showPaidList ? `Betalda i ${monthName}` : "Utgifter"}
            count={visibleExpenses.length}
            tone="expense"
          >
            {isClosed && (
              <GhostButton
                onClick={isLocked ? unlock : relock}
                active={!isLocked}
              >
                {isLocked ? "🔒 Avslutad — lås upp" : "🔓 Upplåst — lås igen"}
              </GhostButton>
            )}

            {!isLocked && (
              <AddButton onClick={() => openAdd("Expense")}>Ny post</AddButton>
            )}

            {paidExpenses.length > 0 && (
              <GhostButton
                onClick={() => setShowPaid(!showPaidList)}
                active={showPaidList}
              >
                {showPaidList
                  ? `‹ ${openExpenses.length} kvar`
                  : `✓ ${paidExpenses.length} betalda`}
              </GhostButton>
            )}
          </SectionHeader>

          {expenses.length === 0 ? (
            <EmptyState
              emoji="🏠"
              title={
                isClosed ? `Inga utgifter i ${monthName}` : "Inga utgifter än"
              }
              body={
                isClosed
                  ? "Den här månaden är avslutad och innehåller inga utgifter."
                  : "Börja med hyran — den återkommer varje månad, så välj Varje månad så slipper du lägga in den igen."
              }
            />
          ) : (
            <>
              {!showPaidList && (
                <PaymentRow expenses={openExpenses} monthName={monthName} />
              )}

              {visibleExpenses.map((entry) => (
                <DesktopEntryRow
                  key={entry.id}
                  entry={entry}
                  monthName={monthName}
                  locked={isLocked}
                  onOpen={() => openEdit(entry)}
                  onTogglePaid={() =>
                    togglePaid({ id: entry.id, isPaid: !entry.isPaid })
                  }
                />
              ))}
            </>
          )}
        </section>

        <div className="hidden bg-[var(--color-border)] lg:block" />

        <div className="flex flex-col gap-8">
          <section className="min-w-0">
            <SectionHeader title="Inkomst" count={income.length} tone="income">
              {!isLocked && (
                <AddButton onClick={() => openAdd("Income")}>
                  Lägg till
                </AddButton>
              )}
            </SectionHeader>

            {income.length === 0 ? (
              <EmptyState
                emoji="💼"
                title={`Ingen inkomst i ${monthName}`}
                body="Lägg till lön, bidrag eller annat som kommit in den här månaden."
              />
            ) : (
              income.map((entry) => (
                <DesktopEntryRow
                  key={entry.id}
                  entry={entry}
                  monthName={monthName}
                  locked={isLocked}
                  onOpen={() => openEdit(entry)}
                />
              ))
            )}
          </section>

          <SavingsSection
            plan={plan}
            year={year}
            month={month}
            monthName={monthName}
            isLocked={isLocked}
          />
        </div>
      </div>

      <EntryDialogs editor={editor} />
    </Page>
  );
}

function Page({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-[clamp(18px,3vw,40px)] pb-16 min-[1600px]:max-w-[1460px]">
      {children}
    </div>
  );
}
