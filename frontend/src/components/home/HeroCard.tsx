import { motion } from "motion/react";
import { HeroAmount } from "../ui/HeroAmount";
import { formatKr } from "../../lib/format";
import type { MonthSummary } from "../../hooks/useMonthPlanQuery";
import type { EntryKind } from "../../lib/categories";

interface HeroCardProps {
  summary: MonthSummary;
  view: EntryKind;
  onSelect: (kind: EntryKind) => void;
  onSavings: () => void;
  dimmed?: boolean;
}

export function HeroCard({
  summary,
  view,
  onSelect,
  onSavings,
  dimmed = false,
}: HeroCardProps) {
  const heading = summary.safeToSpend < 0 ? "Över budget" : "Kvar att spendera";

  return (
    <div
      className={`hero-card mx-4 rounded-[var(--radius-hero)] px-4 pt-5 pb-1.5 transition-opacity ${
        dimmed ? "opacity-70" : ""
      }`}
    >
      <div className="text-center text-[12px] font-medium text-[var(--color-text-muted)]">
        {heading}
      </div>

      <div className="mt-1 mb-4 text-center">
        <HeroAmount value={summary.safeToSpend} label={heading.toLowerCase()} />
      </div>

      <div className="flex border-t border-[var(--color-border)]">
        <Tab
          label="Inkomst"
          amount={summary.income}
          tone="text-[var(--color-mint)]"
          underline="bg-[var(--color-mint)]"
          active={view === "Income"}
          onClick={() => onSelect("Income")}
        />
        <Divider />
        <Tab
          label="Utgifter"
          amount={summary.totalExpenses}
          tone="text-[var(--color-danger)]"
          underline="bg-[var(--color-danger)]"
          active={view === "Expense"}
          onClick={() => onSelect("Expense")}
        />
        <Divider />
        <Tab
          label="Sparande ›"
          amount={summary.totalSavings}
          tone="text-[var(--color-savings)]"
          underline=""
          active={false}
          onClick={onSavings}
        />
      </div>
    </div>
  );
}

const Divider = () => (
  <div className="my-3 w-px self-stretch bg-[var(--color-border)]" />
);

interface TabProps {
  label: string;
  amount: number;
  tone: string;
  underline: string;
  active: boolean;
  onClick: () => void;
}

function Tab({ label, amount, tone, underline, active, onClick }: TabProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="flex-1 pt-3 pb-2 text-center"
    >
      <span className="block text-[11.5px] font-medium text-[var(--color-text-muted)]">
        {label}
      </span>
      <span
        className={`mt-0.5 block text-[17px] font-extrabold tabular-nums ${tone} ${
          active ? "" : "opacity-50"
        }`}
      >
        {formatKr(amount)}
      </span>
      <span className="relative mx-auto mt-2 block h-[3px] w-[34px]">
        {active && underline && (
          <motion.span
            layoutId="hero-tab-underline"
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            className={`absolute inset-0 rounded-full ${underline}`}
          />
        )}
      </span>
    </button>
  );
}
