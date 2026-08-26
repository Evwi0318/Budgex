import { useState } from "react";
import { EmptyState } from "../home/EmptyState";
import { SavingsRow } from "./SavingsRow";
import { SavingsForm } from "./SavingsForm";
import { BottomSheet } from "../ui/BottomSheet";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useMonth } from "../../hooks/useMonth";
import { useSavingsQuery } from "../../hooks/useSavingsQuery";
import {
  useDeleteSavingsAccountMutation,
  useTransferAllMutation,
  useTransferMutation,
} from "../../hooks/useSavingsMutation";
import { formatNumber, getMonthName } from "../../lib/format";
import type { MonthPlan } from "../../hooks/useMonthPlanQuery";
import type { SavingsAccount } from "../../hooks/useSavingsQuery";

interface SavingsTabProps {
  plan: MonthPlan;
  isClosed: boolean;
  isLocked: boolean;
  unlock: () => void;
  relock: () => void;
  /** FAB:en ägs av Home, så den öppnar arket härifrån */
  adding: boolean;
  onCloseAdding: () => void;
}

export function SavingsTab({
  plan,
  isClosed,
  isLocked,
  unlock,
  relock,
  adding,
  onCloseAdding,
}: SavingsTabProps) {
  const { year, month } = useMonth();

  const { data: savings, isLoading } = useSavingsQuery(year, month);

  const transfer = useTransferMutation(year, month);
  const transferAll = useTransferAllMutation(year, month);
  const deleteAccount = useDeleteSavingsAccountMutation(year, month);

  const [editing, setEditing] = useState<SavingsAccount | null>(null);
  const [dirty, setDirty] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [removing, setRemoving] = useState<SavingsAccount | null>(null);
  const [showTransferred, setShowTransferred] = useState(false);

  const closeSheet = () => {
    setEditing(null);
    onCloseAdding();
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
      <div className="px-4 pt-5">
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
    <div className="px-4 pt-5">
      <header className="mb-2.5 flex items-center gap-2 px-1">
        <span className="shrink-0 text-[13.5px] font-bold tracking-[-0.015em] text-[var(--color-text)]">
          {showDone ? `Överfört i ${monthName}` : "Sparkonton"}
        </span>

        <span className="grid h-5 min-w-5 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1.5 text-[11px] font-extrabold text-[var(--color-mint)]">
          {visible.length}
        </span>

        <span className="flex-1" />

        {!isLocked && hasAccounts && done.length === 0 && (
          <span className="flex min-w-0 items-center gap-[7px] text-[11px] font-bold text-[var(--color-text-muted)]">
            <span className="truncate">Bocka av när du gjort överföringen</span>
            <span className="h-[18px] w-[18px] shrink-0 rounded-full border-[1.8px] border-[var(--color-text-faint)]" />
          </span>
        )}

        {isClosed && (
          <button
            onClick={isLocked ? unlock : relock}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11.5px] font-bold transition active:scale-95 ${
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
            className={`flex h-[26px] shrink-0 items-center gap-1.5 rounded-full border px-[11px] text-[11.5px] font-bold transition active:scale-95 ${
              showDone
                ? "border-[var(--color-mint-dim)] bg-[var(--color-mint-wash)] text-[var(--color-mint)]"
                : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
            }`}
          >
            {showDone ? `‹ ${remaining.length} kvar` : `✓ ${done.length} överförda`}
          </button>
        )}
      </header>

      {/* Under rubriken, på samma plats som PaymentRow har i utgiftsfliken */}
      {hasAccounts && (
        <button
          onClick={() => transferAll.mutate(!allDone)}
          className={`mb-2 flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-[14px] border px-3.5 py-3 text-[14px] font-extrabold transition active:scale-[0.99] ${
            allDone
              ? "border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
          }`}
        >
          <span className="flex items-center gap-2.5">
            <span className="text-[15px] text-[var(--color-mint)]">✓</span>
            {allDone
              ? `Allt överfört i ${monthName}`
              : `Markera alla som överförda · ${formatNumber(remainingTotal)} kr`}
          </span>
          {allDone && (
            <span className="text-[12px] font-bold text-[var(--color-text-faint)] underline underline-offset-[3px]">
              Ångra alla överföringar
            </span>
          )}
        </button>
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

      <BottomSheet open={sheetOpen} onClose={requestClose}>
        {sheetOpen && (
          <SavingsForm
            year={year}
            month={month}
            account={editing}
            incomes={plan.income}
            sources={savings.sources}
            onSaved={closeSheet}
            onCancel={requestClose}
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
