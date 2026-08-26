import { formatKr } from "../../lib/format";
import type { PlannedEntry } from "../../hooks/useMonthPlanQuery";

interface PaymentRowProps {
  expenses: PlannedEntry[];
  monthName: string;
}

export function PaymentRow({ expenses, monthName }: PaymentRowProps) {
  if (expenses.length === 0) return null;

  // Autogiro räknas alltid som betalt och hör aldrig till siffran
  const unpaid = expenses.filter((entry) => !entry.isAutogiro && !entry.isPaid);

  if (unpaid.length === 0) {
    return (
      <div className="mb-2.5 flex items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-mint-dim)] bg-[var(--color-mint-wash)] px-3.5 py-2.5 text-[12.5px] font-extrabold text-[var(--color-mint)]">
        <span>✓</span>
        Allt är betalt i {monthName}
      </div>
    );
  }

  const total = unpaid.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="mb-2.5 flex items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[12.5px] font-extrabold text-[var(--color-unpaid)]">
      {unpaid.length} kvar att betala själv
      <span className="text-[var(--color-text-faint)]">·</span>
      <span className="tabular-nums">{formatKr(total)}</span>
    </div>
  );
}
