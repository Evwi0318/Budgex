import { categoryOf } from "../../lib/categories";
import { formatKr } from "../../lib/format";
import type { PlannedEntry } from "../../hooks/useMonthPlanQuery";

interface EntryRowProps {
  entry: PlannedEntry;
  monthName: string;
}

export function EntryRow({ entry, monthName }: EntryRowProps) {
  const category = categoryOf(entry.kind, entry.category);

  const note = entry.isAutogiro
    ? "Autogiro · Varje månad"
    : entry.repeats
      ? "Varje månad"
      : `Bara ${monthName}`;

  return (
    <div className="mb-2 flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--color-surface)] px-3.5 py-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--color-mint-wash)] text-[17px]">
        {category.emoji}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold">{entry.name}</span>
        <span className="mt-px block text-[11.5px] text-[var(--color-text-faint)]">
          {note}
        </span>
      </span>

      <span
        className={`text-[15px] font-extrabold tabular-nums ${
          entry.kind === "Income" ? "text-[var(--color-mint)]" : ""
        }`}
      >
        {formatKr(entry.amount)}
      </span>
    </div>
  );
}
