import { useState } from "react";
import { Check } from "lucide-react";
import { AddButton, GhostButton, SectionHeader } from "./SectionHeader";
import { EmptyState } from "../home/EmptyState";
import { SavingsRow } from "../savings/SavingsRow";
import { SavingsForm } from "../savings/SavingsForm";
import { BottomSheet } from "../ui/BottomSheet";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useSavingsQuery } from "../../hooks/useSavingsQuery";
import {
  useDeleteSavingsAccountMutation,
  useTransferAllMutation,
  useTransferMutation,
} from "../../hooks/useSavingsMutation";
import { formatNumber } from "../../lib/format";
import type { MonthPlan } from "../../hooks/useMonthPlanQuery";
import type { SavingsAccount } from "../../hooks/useSavingsQuery";

interface SavingsSectionProps {
  plan: MonthPlan;
  year: number;
  month: number;
  monthName: string;
  isLocked: boolean;
}

export function SavingsSection({
  plan,
  year,
  month,
  monthName,
  isLocked,
}: SavingsSectionProps) {
  const { data: savings, isLoading } = useSavingsQuery(year, month);

  const transfer = useTransferMutation(year, month);
  const transferAll = useTransferAllMutation(year, month);
  const deleteAccount = useDeleteSavingsAccountMutation(year, month);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<SavingsAccount | null>(null);
  const [dirty, setDirty] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [removing, setRemoving] = useState<SavingsAccount | null>(null);
  const [showTransferred, setShowTransferred] = useState(false);

  const closeSheet = () => {
    setAdding(false);
    setEditing(null);
    setDirty(false);
    setDiscarding(false);
  };

  const requestClose = () => (dirty ? setDiscarding(true) : closeSheet());

  if (isLoading || !savings) {
    return (
      <section>
        <SectionHeader title="Sparkonton" count={0} tone="savings" />
        <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-surface-2)]" />
      </section>
    );
  }

  const remaining = savings.accounts.filter((account) => !account.isTransferred);
  const done = savings.accounts.filter((account) => account.isTransferred);
  const showDone = showTransferred && done.length > 0;
  const visible = showDone ? done : remaining;
  const sheetOpen = adding || editing !== null;
  const allDone = remaining.length === 0;
  const remainingTotal = remaining.reduce(
    (sum, account) => sum + account.amount,
    0
  );

  return (
    <section>
      <SectionHeader
        title={showDone ? `Överfört i ${monthName}` : "Sparkonton"}
        count={visible.length}
        tone="savings"
      >
        {!isLocked && <AddButton onClick={() => setAdding(true)}>Nytt</AddButton>}

        {done.length > 0 && (
          <GhostButton
            onClick={() => setShowTransferred(!showDone)}
            active={showDone}
          >
            {showDone ? `‹ ${remaining.length} kvar` : `✓ ${done.length} överförda`}
          </GhostButton>
        )}
      </SectionHeader>

      {savings.accounts.length === 0 ? (
        <EmptyState
          emoji="🐷"
          title={isLocked ? `Inget sparande i ${monthName}` : "Inga sparkonton"}
          body={
            isLocked
              ? "Den här månaden är avslutad och innehåller inga sparkonton."
              : "Ett sparkonto tar en del av en inkomst varje månad. Välj källa och hur mycket — resten sköter sig."
          }
        />
      ) : (
        <>
          <button
            onClick={() => transferAll.mutate(!allDone)}
            disabled={isLocked}
            className={`mb-2 flex min-h-[46px] w-full flex-col items-center justify-center gap-1 rounded-[14px] border px-3.5 py-2.5 text-[13px] font-extrabold transition ${
              allDone
                ? "border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] not-disabled:hover:bg-[var(--color-surface-2)]"
            } disabled:opacity-50`}
          >
            <span className="flex items-center gap-2.5">
              <Check
                size={15}
                strokeWidth={3}
                className="text-[var(--color-mint)]"
              />
              {allDone
                ? `Allt överfört i ${monthName}`
                : `Markera alla som överförda · ${formatNumber(remainingTotal)} kr`}
            </span>
            {allDone && (
              <span className="text-[11.5px] font-bold text-[var(--color-text-faint)] underline underline-offset-[3px]">
                Ångra alla överföringar
              </span>
            )}
          </button>

          {visible.map((account) => (
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
          ))}
        </>
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
        onPick={() =>
          removing &&
          deleteAccount.mutate(removing.id, {
            onSuccess: () => setRemoving(null),
          })
        }
        onCancel={() => setRemoving(null)}
      />
    </section>
  );
}
