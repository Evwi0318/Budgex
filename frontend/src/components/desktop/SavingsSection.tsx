import { useState } from "react";
import { Check } from "lucide-react";
import { AddButton, GhostButton, SectionHeader } from "./SectionHeader";
import { EmptyState } from "../home/EmptyState";
import { SavingsList, SavingsSheet } from "../savings/SavingsList";
import { useSavingsQuery } from "../../hooks/useSavingsQuery";
import { useSavingsEditor } from "../../hooks/useSavingsEditor";
import { formatNumber } from "../../lib/format";
import type { MonthPlan } from "../../hooks/useMonthPlanQuery";

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
  const [adding, setAdding] = useState(false);
  const editor = useSavingsEditor(year, month, savings, adding, () =>
    setAdding(false)
  );

  if (isLoading || !savings) {
    return (
      <section>
        <SectionHeader title="Sparkonton" count={0} tone="savings" />
        <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-surface-2)]" />
      </section>
    );
  }

  const { remaining, done, showDone, visible, allDone, remainingTotal } = editor;

  return (
    <section>
      <SectionHeader
        title={showDone ? `Överfört i ${monthName}` : "Sparkonton"}
        count={visible.length}
        tone="savings"
      >
        {!isLocked && (
          <AddButton onClick={() => setAdding(true)}>Nytt</AddButton>
        )}

        {done.length > 0 && (
          <GhostButton onClick={editor.toggleShowTransferred} active={showDone}>
            {showDone
              ? `‹ ${remaining.length} kvar`
              : `✓ ${done.length} överförda`}
          </GhostButton>
        )}
      </SectionHeader>

      {editor.accounts.length === 0 ? (
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
            onClick={() => editor.transferAll.mutate(!allDone)}
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

          <SavingsList
            editor={editor}
            sources={savings.sources}
            locked={isLocked}
          />
        </>
      )}

      <SavingsSheet
        editor={editor}
        plan={plan}
        sources={savings.sources}
        year={year}
        month={month}
        monthName={monthName}
      />
    </section>
  );
}
