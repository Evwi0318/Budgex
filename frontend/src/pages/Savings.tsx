import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { MonthNav } from "../components/budget/MonthNav";
import { EmptyState } from "../components/home/EmptyState";
import { SavingsRow } from "../components/savings/SavingsRow";
import { SavingsForm } from "../components/savings/SavingsForm";
import { SavingsTopCard } from "../components/savings/SavingsTopCard";
import { BottomSheet } from "../components/ui/BottomSheet";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useSavingsQuery } from "../hooks/useSavingsQuery";
import { useMonthPlanQuery } from "../hooks/useMonthPlanQuery";
import { useMonthLock } from "../hooks/useMonthLock";
import {
  useDeleteSavingsAccountMutation,
  useTransferAllMutation,
  useTransferMutation,
} from "../hooks/useSavingsMutation";
import { formatNumber, getMonthName } from "../lib/format";
import { isPast } from "../lib/month";
import type { MonthOutletContext } from "../components/layout/AppShell";
import type { SavingsAccount } from "../hooks/useSavingsQuery";

export function Savings() {
  const { year, month, goToPrevMonth, goToNextMonth } =
    useOutletContext<MonthOutletContext>();

  const { data: savings, isLoading } = useSavingsQuery(year, month);
  const { data: plan } = useMonthPlanQuery(year, month);
  const { isClosed, isLocked, unlock, relock } = useMonthLock(year, month);

  const transfer = useTransferMutation(year, month);
  const transferAll = useTransferAllMutation(year, month);
  const deleteAccount = useDeleteSavingsAccountMutation(year, month);

  const [editing, setEditing] = useState<SavingsAccount | null>(null);
  const [adding, setAdding] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [removing, setRemoving] = useState<SavingsAccount | null>(null);
  const [showTransferred, setShowTransferred] = useState(false);

  const closeSheet = () => {
    setEditing(null);
    setAdding(false);
    setDirty(false);
    setDiscarding(false);
  };

  const requestClose = () => (dirty ? setDiscarding(true) : closeSheet());

  const confirmRemove = () => {
    if (!removing) return;

    deleteAccount.mutate(removing.id, { onSuccess: () => setRemoving(null) });
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="mb-4 h-10 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-surface-2)]" />
        <div className="h-28 animate-pulse rounded-[var(--radius-hero)] bg-[var(--color-surface-2)]" />
      </div>
    );
  }

  if (!savings) {
    return (
      <p className="px-4 py-6 text-center text-[var(--color-text-muted)]">
        Kunde inte hämta sparandet. Kontrollera anslutningen och försök igen.
      </p>
    );
  }

  const monthName = getMonthName(month);
  const remaining = savings.accounts.filter((account) => !account.isTransferred);
  const done = savings.accounts.filter((account) => account.isTransferred);
  // Bockas den sista överföringen bort finns ingen överförd-lista kvar att
  // visa, och vyn måste falla tillbaka i samma render — annars ser det ut
  // som att kontot försvann
  const showDone = showTransferred && done.length > 0;
  const visible = showDone ? done : remaining;
  const sheetOpen = adding || editing !== null;
  const hasAccounts = savings.accounts.length > 0;
  const allDone = remaining.length === 0;
  const remainingTotal = remaining.reduce((sum, account) => sum + account.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-center gap-2.5 pt-4">
        <h2 className="text-[22px] font-extrabold">Sparande</h2>
        <span className="text-[22px] leading-none" role="img" aria-label="Spargris">
          🐷
        </span>
      </div>

      <MonthNav
        year={year}
        month={month}
        canGoNext={isPast({ year, month })}
        onPrev={goToPrevMonth}
        onNext={goToNextMonth}
      />

      <SavingsTopCard
        safeToSpend={plan?.summary.safeToSpend ?? 0}
        allocated={savings.total}
      />

      <div className="px-4">
        {hasAccounts && (
          <button
            onClick={() => !allDone && transferAll.mutate(true)}
            disabled={allDone}
            className={`mb-[22px] flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-[14px] border px-3.5 py-3 text-[14px] font-extrabold transition ${
              allDone
                ? "border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] active:scale-[0.99]"
            }`}
          >
            <span className="text-[15px] text-[var(--color-mint)]">✓</span>
            {allDone
              ? `Allt överfört i ${monthName}`
              : `Markera alla som överförda · ${formatNumber(remainingTotal)} kr`}
          </button>
        )}

        <header className="mb-3 flex items-center gap-2 px-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.11em] text-[var(--color-text-muted)]">
            {showDone ? `Överfört i ${monthName}` : "Sparkonton"}
          </span>

          <span className="grid h-5 min-w-5 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1.5 text-[11px] font-extrabold text-[var(--color-mint)]">
            {visible.length}
          </span>

          <span className="flex-1" />

          {isClosed && (
            <button
              onClick={isLocked ? unlock : relock}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.04em] transition active:scale-95 ${
                isLocked
                  ? "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                  : "border-[var(--color-mint-dim)] bg-[var(--color-mint-wash)] text-[var(--color-mint)]"
              }`}
            >
              {isLocked ? "🔒 Lås upp" : "🔓 Lås igen"}
            </button>
          )}

          {done.length > 0 && (
            <button
              onClick={() => setShowTransferred(!showDone)}
              className={`flex h-[26px] items-center gap-1.5 rounded-full border px-[11px] text-[11px] font-extrabold uppercase tracking-[0.04em] transition active:scale-95 ${
                showDone
                  ? "border-[var(--color-mint-dim)] bg-[var(--color-mint-wash)] text-[var(--color-mint)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
              }`}
            >
              {showDone ? `‹ ${remaining.length} kvar` : `✓ ${done.length} överförda`}
            </button>
          )}
        </header>

        {!isLocked && hasAccounts && done.length === 0 && (
          <div className="-mt-1 mb-3 flex items-center justify-end gap-[7px] px-1 text-[11px] font-bold text-[var(--color-text-muted)]">
            Bocka av när du gjort överföringen
            <span className="h-[18px] w-[18px] shrink-0 rounded-full border-[1.8px] border-[var(--color-text-faint)]" />
          </div>
        )}

        {!hasAccounts ? (
          <EmptyState
            emoji="🐷"
            title={isLocked ? `Inget sparande i ${monthName}` : "Inga sparkonton skapade"}
            body={
              isLocked
                ? "Den här månaden är avslutad och innehåller inga sparkonton."
                : "Ett sparkonto tar en del av en inkomst varje månad. Välj källa och hur mycket — resten sköter sig."
            }
            footnote={isLocked ? undefined : "Tryck på + för att skapa ett sparkonto."}
          />
        ) : visible.length === 0 ? (
          <p className="rounded-[var(--radius-card)] border border-[var(--color-mint-dim)] bg-[var(--color-mint-wash)] px-4 py-5 text-center text-[13.5px] font-bold text-[var(--color-mint)]">
            🎉 Allt är överfört i {monthName}
          </p>
        ) : (
          visible.map((account) => (
            <SavingsRow
              key={account.id}
              account={account}
              sources={savings.sources}
              locked={isLocked}
              onOpen={() => setEditing(account)}
              onToggleTransfer={() =>
                transfer.mutate({
                  id: account.id,
                  isTransferred: !account.isTransferred,
                })
              }
            />
          ))
        )}
      </div>

      {!isLocked && (
        <button
          onClick={() => setAdding(true)}
          title="Lägg till sparkonto"
          aria-label="Lägg till sparkonto"
          style={{
            right: "max(20px, calc(50vw - 240px))",
            bottom: "calc(5.5rem + env(safe-area-inset-bottom))",
          }}
          className="fixed z-50 grid h-[58px] w-[58px] place-items-center rounded-full bg-[var(--color-mint)] pb-1 text-[30px] font-bold leading-none text-[var(--color-on-mint)] shadow-[0_8px_24px_rgba(0,0,0,0.5),0_0_24px_var(--glow-mint)] transition active:scale-95"
        >
          +
        </button>
      )}

      <BottomSheet open={sheetOpen} onClose={requestClose}>
        {sheetOpen && (
          <SavingsForm
            year={year}
            month={month}
            account={editing}
            incomes={plan?.income ?? []}
            sources={savings.sources}
            onSaved={closeSheet}
            onRemove={() => {
              const account = editing;
              closeSheet();
              if (account) setRemoving(account);
            }}
            onDirtyChange={setDirty}
          />
        )}
      </BottomSheet>

      <ConfirmDialog
        open={discarding}
        title="Kasta ändringarna?"
        body={`Ändringarna av ${editing?.name ?? "det nya sparkontot"} sparas inte.`}
        actions={[
          { label: "Kasta", tone: "danger" },
          { label: "Fortsätt skriva", tone: "alt" },
        ]}
        onPick={(index) => (index === 0 ? closeSheet() : setDiscarding(false))}
        onCancel={() => setDiscarding(false)}
      />

      <ConfirmDialog
        open={removing !== null}
        title={`Ta bort ${removing?.name ?? ""}?`}
        body={`Sparkontot slutar gälla från ${monthName}. Månader före behåller sitt sparande.`}
        actions={[{ label: "Ta bort", tone: "danger" }]}
        cancelLabel="Avbryt"
        onPick={confirmRemove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
