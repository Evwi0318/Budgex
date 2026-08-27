import { motion } from "motion/react";
import { HeroAmount } from "../ui/HeroAmount";
import { formatKr } from "../../lib/format";
import type { MonthSummary } from "../../hooks/useMonthPlanQuery";
import type { HomeTab } from "../../context/MonthContext";

interface HeroCardProps {
  summary: MonthSummary;
  tab: HomeTab;
  onSelect: (tab: HomeTab) => void;
  dimmed?: boolean;
  /** Vid scroll krymper kortet till bara siffrorna */
  compact?: boolean;
}

export function HeroCard({
  summary,
  tab,
  onSelect,
  dimmed = false,
  compact = false,
}: HeroCardProps) {
  const heading = summary.safeToSpend < 0 ? "Över budget" : "Kvar att spendera";

  return (
    <div
      className={`hero-card sticky top-2 z-20 mx-4 rounded-[var(--radius-hero)] px-4 pb-1.5 transition-opacity ${
        compact ? "hero-card--compact pt-2.5" : "pt-5"
      } ${dimmed ? "opacity-70" : ""}`}
    >
      <div
        className={`hero-fade text-center text-[12px] font-medium text-[var(--color-text-muted)] ${
          compact ? "hero-fade--gone" : ""
        }`}
      >
        {heading}
      </div>

      <div className={`text-center ${compact ? "mt-0 mb-1.5" : "mt-1 mb-4"}`}>
        <HeroAmount
          value={summary.safeToSpend}
          label={heading.toLowerCase()}
          compact={compact}
        />
      </div>

      <div className="flex border-t border-[var(--color-border)]">
        <Tab
          label="Inkomst"
          amount={summary.income}
          tone="text-[var(--color-mint)]"
          underline="bg-[var(--color-mint)]"
          active={tab === "Income"}
          compact={compact}
          onClick={() => onSelect("Income")}
        />
        <Divider />
        <Tab
          label="Utgifter"
          amount={summary.totalExpenses}
          tone="text-[var(--color-danger)]"
          underline="bg-[var(--color-danger)]"
          active={tab === "Expense"}
          compact={compact}
          onClick={() => onSelect("Expense")}
        />
        <Divider />
        <Tab
          label="Sparande"
          amount={summary.totalSavings}
          tone="text-[var(--color-savings)]"
          underline="bg-[var(--color-savings)]"
          active={tab === "Savings"}
          compact={compact}
          onClick={() => onSelect("Savings")}
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
  compact: boolean;
  onClick: () => void;
}

function Tab({
  label,
  amount,
  tone,
  underline,
  active,
  compact,
  onClick,
}: TabProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 text-center ${compact ? "pt-1.5 pb-1" : "pt-3 pb-2"}`}
    >
      <span
        className={`hero-fade block text-[11.5px] font-medium text-[var(--color-text-muted)] ${
          compact ? "hero-fade--gone" : ""
        }`}
      >
        {label}
      </span>
      <span
        className={`hero-tab-amount mt-2 block font-extrabold tabular-nums ${tone} ${
          compact ? "hero-tab-amount--compact" : ""
        } ${active ? "" : "opacity-50"}`}
      >
        {formatKr(amount)}
      </span>
      <span
        className={`relative mx-auto block h-[3px] w-[34px] ${compact ? "mt-1" : "mt-2"}`}
      >
        {active && (
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
