import { EmptyState } from "../home/EmptyState";
import { SavingsList, SavingsSheet } from "./SavingsList";
import { useMonth } from "../../hooks/useMonth";
import { useSavingsQuery } from "../../hooks/useSavingsQuery";
import { useSavingsEditor } from "../../hooks/useSavingsEditor";
import { formatNumber, getMonthName } from "../../lib/format";
import type { MonthPlan } from "../../hooks/useMonthPlanQuery";

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
  const editor = useSavingsEditor(year, month, savings, adding, onCloseAdding);

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
  const { remaining, done, showDone, visible, allDone, remainingTotal } = editor;
  const hasAccounts = editor.accounts.length > 0;

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
            onClick={editor.toggleShowTransferred}
            className={`flex h-[26px] shrink-0 items-center gap-1.5 rounded-full border px-[11px] text-[11.5px] font-bold transition active:scale-95 ${
              showDone
                ? "border-[var(--color-mint-dim)] bg-[var(--color-mint-wash)] text-[var(--color-mint)]"
                : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
            }`}
          >
            {showDone
              ? `‹ ${remaining.length} kvar`
              : `✓ ${done.length} överförda`}
          </button>
        )}
      </header>

      {hasAccounts && (
        <button
          onClick={() => editor.transferAll.mutate(!allDone)}
          disabled={isLocked}
          className={`mb-2 flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-[14px] border px-3.5 py-3 text-[14px] font-extrabold transition not-disabled:active:scale-[0.99] ${
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
          title={
            isLocked ? `Inget sparande i ${monthName}` : "Inga sparkonton skapade"
          }
          body={
            isLocked
              ? "Den här månaden är avslutad och innehåller inga sparkonton."
              : "Ett sparkonto tar en del av en inkomst varje månad. Välj källa och hur mycket — resten sköter sig."
          }
          footnote={
            isLocked ? undefined : "Tryck på + för att skapa ett sparkonto."
          }
        />
      ) : (
        <SavingsList
          editor={editor}
          sources={savings.sources}
          locked={isLocked}
        />
      )}

      <SavingsSheet
        editor={editor}
        plan={plan}
        sources={savings.sources}
        year={year}
        month={month}
        monthName={monthName}
      />
    </div>
  );
}
