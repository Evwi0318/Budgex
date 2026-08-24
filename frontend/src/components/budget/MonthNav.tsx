import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthYear } from "../../lib/format";

interface MonthNavProps {
  year: number;
  month: number;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthNav({
  year,
  month,
  canGoNext,
  onPrev,
  onNext,
}: MonthNavProps) {
  return (
    <div className="flex items-center justify-center gap-3.5 px-5 pt-1 pb-3">
      <Arrow onClick={onPrev} label="Föregående månad">
        <ChevronLeft size={18} />
      </Arrow>

      <span className="min-w-[150px] text-center text-[17px] font-bold">
        {formatMonthYear(month, year)}
      </span>

      <Arrow onClick={onNext} label="Nästa månad" disabled={!canGoNext}>
        <ChevronRight size={18} />
      </Arrow>
    </div>
  );
}

interface ArrowProps {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}

function Arrow({ onClick, label, disabled = false, children }: ArrowProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-[38px] w-[38px] place-items-center rounded-[13px] bg-[var(--color-surface)] text-[var(--color-text)] transition active:scale-95 disabled:opacity-25"
    >
      {children}
    </button>
  );
}
