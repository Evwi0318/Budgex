import { Check } from "lucide-react";
import { categoryOf } from "../../lib/categories";
import { formatKr } from "../../lib/format";
import type { PlannedEntry } from "../../hooks/useMonthPlanQuery";

interface EntryRowProps {
  entry: PlannedEntry;
  monthName: string;
  onEdit: () => void;
  onTogglePaid: () => void;
}

export function EntryRow({
  entry,
  monthName,
  onEdit,
  onTogglePaid,
}: EntryRowProps) {
  const category = categoryOf(entry.kind, entry.category);
  const canMarkPaid = entry.kind === "Expense" && !entry.isAutogiro;
  const looksPaid = canMarkPaid && entry.isPaid;

  const note = entry.isAutogiro
    ? "Autogiro · Varje månad"
    : entry.repeats
      ? "Varje månad"
      : `Bara ${monthName}`;

  return (
    <div
      className={`mb-2 flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--color-surface)] px-3.5 py-2.5 transition-opacity ${
        looksPaid ? "opacity-55" : ""
      }`}
    >
      <button
        onClick={onEdit}
        aria-label={`Ändra ${entry.name}`}
        className="flex min-w-0 flex-1 items-center gap-3 text-left transition active:scale-[0.99]"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--color-mint-wash)] text-[17px]">
          {category.emoji}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold">
            {entry.name}
          </span>
          <span className="mt-px block text-[11.5px] text-[var(--color-text-faint)]">
            {note}
          </span>
        </span>

        <span
          className={`text-[15px] font-extrabold tabular-nums ${
            entry.kind === "Income" ? "text-[var(--color-mint)]" : ""
          } ${looksPaid ? "line-through" : ""}`}
        >
          {formatKr(entry.amount)}
        </span>
      </button>

      {canMarkPaid && (
        <button
          onClick={onTogglePaid}
          aria-pressed={entry.isPaid}
          aria-label={entry.isPaid ? "Markera som obetald" : "Markera som betald"}
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition active:scale-90 ${
            entry.isPaid
              ? "border-[var(--color-mint)] bg-[var(--color-mint)] text-[var(--color-on-mint)]"
              : "border-[var(--color-border)] text-transparent"
          }`}
        >
          <Check size={14} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
