import { useState } from "react";
import { Check } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { MonthNav } from "../components/budget/MonthNav";
import { EmptyState } from "../components/home/EmptyState";
import { SavingsRow } from "../components/savings/SavingsRow";
import { SavingsForm } from "../components/savings/SavingsForm";
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
import { formatKr, getMonthName } from "../lib/format";
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

  return (
    <div>
      <MonthNav
        year={year}
        month={month}
        canGoNext={isPast({ year, month })}
        onPrev={goToPrevMonth}
        onNext={goToNextMonth}
      />

      <div className="mx-4 rounded-[var(--radius-hero)] bg-[var(--color-surface)] px-4 py-4 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Sparande i {monthName}
        </div>
        <div className="mt-1 text-[34px] font-extrabold tabular-nums text-[var(--color-savings)]">
          {formatKr(savings.total)}
        </div>
        <div className="mt-1 text-[12px] text-[var(--color-text-faint)]">
          Redan avdraget från kvar att spendera.
        </div>
      </div>

      <div className="px-4 pt-5">
        <header className="mb-2.5 flex items-center gap-2.5 px-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            {showDone ? `Överfört i ${monthName}` : "Sparkonton"}
          </span>

          <span className="grid h-[21px] min-w-[21px] place-items-center rounded-full bg-[rgba(127,184,255,0.14)] px-1.5 text-[11.5px] font-extrabold text-[var(--color-savings)]">
            {visible.length}
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

            {done.length > 0 && (
              <button
                onClick={() => setShowTransferred(!showDone)}
                className="rounded-full bg-[var(--color-mint-wash)] px-3 py-1.5 text-[12.5px] font-extrabold text-[var(--color-mint)] transition active:scale-95"
              >
                {showDone ? `‹ ${remaining.length} kvar` : `✓ ${done.length} överförda`}
              </button>
            )}

            {!isLocked && (
              <button
                onClick={() => setAdding(true)}
                className="rounded-full bg-[rgba(127,184,255,0.14)] px-3 py-1.5 text-[12.5px] font-extrabold text-[var(--color-savings)] transition active:scale-95"
              >
                + Sparkonto
              </button>
            )}
          </div>
        </header>

        {savings.accounts.length === 0 ? (
          <EmptyState
            emoji="🐷"
            title={isLocked ? `Inget sparande i ${monthName}` : "Inga sparkonton än"}
            body={
              isLocked
                ? "Den här månaden är avslutad och innehåller inga sparkonton."
                : "Ett sparkonto tar en del av en inkomst varje månad. Välj källa och hur mycket — resten sköter sig."
            }
            footnote={isLocked ? undefined : "Tryck på + Sparkonto uppe till höger."}
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

        {savings.accounts.length > 0 && (
          <button
            onClick={() => remaining.length > 0 && transferAll.mutate(true)}
            disabled={remaining.length === 0}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] px-4 py-3.5 text-[14px] font-extrabold transition active:scale-[0.99] ${
              remaining.length === 0
                ? "border border-[var(--color-mint-dim)] bg-[var(--color-mint-wash)] text-[var(--color-mint)]"
                : "bg-[var(--color-mint)] text-[var(--color-on-mint)]"
            }`}
          >
            <Check size={16} strokeWidth={3} />
            {remaining.length === 0
              ? `Allt överfört i ${monthName}`
              : `Markera alla som överförda · ${formatKr(
                  remaining.reduce((sum, account) => sum + account.amount, 0)
                )}`}
          </button>
        )}
      </div>

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
