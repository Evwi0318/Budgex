import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthYear } from "../../lib/format";

interface MonthNavProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthNav({ year, month, onPrev, onNext }: MonthNavProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <button
        onClick={onPrev}
        className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-chip)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
        aria-label="Föregående månad"
      >
        <ChevronLeft size={20} />
      </button>

      <span className="text-base font-black text-[var(--color-text)] min-w-[140px] text-center">
        {formatMonthYear(month, year)}
      </span>

      <button
        onClick={onNext}
        className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-chip)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
        aria-label="Nästa månad"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
