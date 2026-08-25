import { SwipeRow } from "./SwipeRow";
import { categoryOf } from "../../lib/categories";
import { formatKr } from "../../lib/format";
import type { PlannedEntry } from "../../hooks/useMonthPlanQuery";

interface EntryRowProps {
  entry: PlannedEntry;
  monthName: string;
  locked: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onTogglePaid: () => void;
}

export function EntryRow({
  entry,
  monthName,
  locked,
  onOpen,
  onDelete,
  onTogglePaid,
}: EntryRowProps) {
  const category = categoryOf(entry.kind, entry.category);
  const isExpense = entry.kind === "Expense";
  const paid = isExpense && !entry.isAutogiro && entry.isPaid;

  const note = entry.isAutogiro
    ? "Autogiro · Varje månad"
    : entry.repeats
      ? "Varje månad"
      : `Bara ${monthName}`;

  return (
    <SwipeRow onDelete={onDelete} disabled={locked}>
      <div className="flex items-center gap-2.5 bg-[var(--color-surface)] px-3 py-2">
        {isExpense &&
          (entry.isAutogiro ? (
            <span
              title="Autogiro"
              className="grid w-[26px] shrink-0 place-items-center text-[14px] text-[var(--color-mint-dim)]"
            >
              ↻
            </span>
          ) : (
            <button
              onClick={onTogglePaid}
              disabled={locked}
              aria-pressed={entry.isPaid}
              aria-label={
                entry.isPaid ? "Markera som obetald" : "Markera som betald"
              }
              className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[9px] border-2 text-[14px] font-black transition ${
                entry.isPaid
                  ? "border-[var(--color-mint)] bg-[var(--color-mint)] text-[var(--color-on-mint)]"
                  : "border-[var(--color-border)] text-transparent"
              }`}
            >
              ✓
            </button>
          ))}

        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
          <category.icon size={17} strokeWidth={2} />
        </span>

        <button
          onClick={onOpen}
          className="min-w-0 flex-1 text-left"
          aria-label={`Öppna ${entry.name}`}
        >
          <span
            className={`block truncate text-[15px] font-bold ${
              paid ? "line-through decoration-[var(--color-text-faint)] opacity-50" : ""
            }`}
          >
            {entry.name}
          </span>
          <span className="mt-px block text-[11.5px] text-[var(--color-text-faint)]">
            {note}
          </span>
        </button>

        <span
          className={`text-[15px] font-extrabold tabular-nums ${
            entry.kind === "Income" ? "text-[var(--color-mint)]" : ""
          } ${paid ? "opacity-50" : ""}`}
        >
          {formatKr(entry.amount)}
        </span>

        <button
          onClick={onOpen}
          aria-label="Öppna"
          className={`shrink-0 pl-0.5 text-[17px] text-[var(--color-text-faint)] ${
            locked ? "opacity-40" : ""
          }`}
        >
          ›
        </button>
      </div>
    </SwipeRow>
  );
}
