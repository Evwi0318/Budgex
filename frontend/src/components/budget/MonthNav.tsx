import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthNavProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}

const monthNames = [
  "januari",
  "februari",
  "mars",
  "april",
  "maj",
  "juni",
  "juli",
  "augusti",
  "september",
  "oktober",
  "november",
  "december",
];

export function MonthNav({ year, month, onPrev, onNext }: MonthNavProps) {
  const monthName = monthNames[month - 1];
  const displayMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <button
        onClick={onPrev}
        className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-chip)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
        aria-label="Föregående månad"
      >
        <ChevronLeft size={20} />
      </button>

      <span className="text-base font-black text-white min-w-[140px] text-center">
        {displayMonth} {year}
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
