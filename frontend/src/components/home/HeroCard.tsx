import { useRef } from "react";
import { motion } from "motion/react";
import { HeroAmount } from "../ui/HeroAmount";
import { formatKrShort } from "../../lib/format";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { MonthSummary } from "../../hooks/useMonthPlanQuery";
import type { HomeTab } from "../../context/MonthContext";

const HOLD_MS = 450;
const HOLD_SLOP = 8;

interface HeroCardProps {
  summary: MonthSummary;
  tab: HomeTab;
  onSelect: (tab: HomeTab) => void;
  dimmed?: boolean;
  onInspect?: () => void;
}

export function HeroCard({
  summary,
  tab,
  onSelect,
  dimmed = false,
  onInspect,
}: HeroCardProps) {
  const heading = summary.safeToSpend < 0 ? "Över budget" : "Kvar att spendera";

  const hold = useRef<{ x: number; y: number; timer: number } | null>(null);
  const held = useRef(false);

  const clearHold = () => {
    if (hold.current) window.clearTimeout(hold.current.timer);
    hold.current = null;
  };

  const startHold = (event: ReactPointerEvent) => {
    held.current = false;
    if (!onInspect) return;

    hold.current = {
      x: event.clientX,
      y: event.clientY,
      timer: window.setTimeout(() => {
        held.current = true;
        hold.current = null;
        onInspect();
      }, HOLD_MS),
    };
  };

  // Rör sig fingret är det ett svep, inte ett långtryck
  const trackHold = (event: ReactPointerEvent) => {
    const from = hold.current;
    if (!from) return;

    if (
      Math.abs(event.clientX - from.x) > HOLD_SLOP ||
      Math.abs(event.clientY - from.y) > HOLD_SLOP
    ) {
      clearHold();
    }
  };

  return (
    <div
      onPointerDown={startHold}
      onPointerMove={trackHold}
      onPointerUp={clearHold}
      onPointerCancel={clearHold}
      onContextMenu={(event) => event.preventDefault()}
      // Långtrycket får inte också räknas som ett tryck på fliken under fingret
      onClickCapture={(event) => {
        if (!held.current) return;

        held.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
      style={{ WebkitTouchCallout: "none" }}
      className={`hero-card sticky top-2 z-20 mx-4 rounded-[var(--radius-hero)] px-4 pb-1.5 ${
        dimmed ? "*:opacity-70" : ""
      }`}
    >
      <div className="hero-fade text-center text-[12px] font-medium text-[var(--color-text-muted)]">
        {heading}
      </div>

      <div className="hero-amount-wrap text-center">
        <HeroAmount value={summary.safeToSpend} label={heading.toLowerCase()} />
      </div>

      <div className="flex border-t border-[var(--color-border)]">
        <Tab
          label="Inkomst"
          amount={summary.income}
          tone="text-[var(--color-mint)]"
          underline="bg-[var(--color-mint)]"
          active={tab === "Income"}
          onClick={() => onSelect("Income")}
        />
        <Divider />
        <Tab
          label="Utgifter"
          amount={summary.totalExpenses}
          tone="text-[var(--color-danger)]"
          underline="bg-[var(--color-danger)]"
          active={tab === "Expense"}
          onClick={() => onSelect("Expense")}
        />
        <Divider />
        <Tab
          label="Sparande"
          amount={summary.totalSavings}
          tone="text-[var(--color-savings)]"
          underline="bg-[var(--color-savings)]"
          active={tab === "Savings"}
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
  onClick: () => void;
}

function Tab({
  label,
  amount,
  tone,
  underline,
  active,
  onClick,
}: TabProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="hero-tab min-w-0 flex-1 text-center"
    >
      <span className="hero-fade block text-[11.5px] font-medium text-[var(--color-text-muted)]">
        {label}
      </span>
      <span
        className={`hero-tab-amount mt-2 block tabular-nums whitespace-nowrap font-medium ${tone} ${
          active ? "" : "opacity-50"
        }`}
      >
        {formatKrShort(amount)}
      </span>
      <span
        className="hero-underline relative mx-auto block h-[3px] w-[34px]"
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
