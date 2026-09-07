import { memo } from "react";
import { ChevronRight, RefreshCw } from "lucide-react";
import { categoryOf } from "../../lib/categories";
import { formatKr } from "../../lib/format";
import type { PlannedEntry } from "../../hooks/useMonthPlanQuery";

interface DesktopEntryRowProps {
  entry: PlannedEntry;
  monthName: string;
  locked: boolean;
  onOpen: () => void;
  onTogglePaid?: () => void;
}

function Row({
  entry,
  monthName,
  locked,
  onOpen,
  onTogglePaid,
}: DesktopEntryRowProps) {
  const category = categoryOf(entry.kind, entry.category);
  const isExpense = entry.kind === "Expense";
  const paid = isExpense && !entry.isAutogiro && entry.isPaid;

  const note = entry.isAutogiro
    ? "Autogiro · Varje månad"
    : entry.repeats
      ? "Varje månad"
      : `Bara ${monthName}`;

  return (
    <div className="mb-1.5 flex items-center gap-2.5 rounded-[14px] bg-[var(--color-surface)] px-3 py-2.5 transition-colors hover:bg-[var(--color-surface-2)]">
      {isExpense &&
        (entry.isAutogiro ? (
          <span
            title="Autogiro"
            className="grid w-[26px] shrink-0 place-items-center text-[var(--color-mint-dim)]"
          >
            <RefreshCw size={14} strokeWidth={2.2} />
          </span>
        ) : (
          <button
            onClick={onTogglePaid}
            disabled={locked}
            aria-pressed={entry.isPaid}
            aria-label={
              entry.isPaid ? "Markera som obetald" : "Markera som betald"
            }
            className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[9px] border-2 text-[14px] font-black transition disabled:opacity-40 ${
              entry.isPaid
                ? "border-[var(--color-mint)] bg-[var(--color-mint)] text-[var(--color-on-mint)]"
                : "border-[var(--color-border)] text-transparent not-disabled:hover:border-[var(--color-mint-dim)]"
            }`}
          >
            ✓
          </button>
        ))}

      <button
        onClick={onOpen}
        disabled={locked}
        aria-label={`Öppna ${entry.name}`}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
          <category.icon size={17} strokeWidth={1.8} />
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-[15px] font-bold ${
              paid
                ? "line-through decoration-[var(--color-text-faint)] opacity-50"
                : ""
            }`}
          >
            {entry.name}
          </span>
          <span className="mt-px block text-[11.5px] text-[var(--color-text-faint)]">
            {note}
          </span>
        </span>

        <span
          className={`shrink-0 text-[15px] font-medium tabular-nums ${
            entry.kind === "Income" ? "text-[var(--color-mint)]" : ""
          } ${paid ? "opacity-50" : ""}`}
        >
          {formatKr(entry.amount)}
        </span>

        <span className="shrink-0 text-[var(--color-text-faint)]">
          <ChevronRight size={17} strokeWidth={2} />
        </span>
      </button>
    </div>
  );
}

export const DesktopEntryRow = memo(
  Row,
  (before, after) =>
    before.entry === after.entry &&
    before.monthName === after.monthName &&
    before.locked === after.locked
);
