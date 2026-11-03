import { useRef } from "react";
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

      <div className="relative flex border-t border-[var(--color-border)]">
        <Tab
          label="Inkomst"
          amount={summary.income}
          tone="text-[var(--color-mint)]"
          active={tab === "Income"}
          onClick={() => onSelect("Income")}
        />
        <Divider />
        <Tab
          label="Utgifter"
          amount={summary.totalExpenses}
          tone="text-[var(--color-danger)]"
          active={tab === "Expense"}
          onClick={() => onSelect("Expense")}
        />
        <Divider />
        <Tab
          label="Sparande"
          amount={summary.totalSavings}
          tone="text-[var(--color-savings)]"
          active={tab === "Savings"}
          onClick={() => onSelect("Savings")}
        />

        {/* Inte layoutId: det mätte fel i en scrollad lista och strecket flög iväg */}
        <span
          aria-hidden
          style={{ transform: `translateX(${UNDERLINE[tab].at})` }}
          className="absolute bottom-0 left-0 flex w-1/3 justify-center transition-transform duration-300 ease-[var(--ease-hero)]"
        >
          <span
            className={`h-[3px] w-[34px] rounded-full transition-colors duration-300 ${UNDERLINE[tab].color}`}
          />
        </span>
      </div>
    </div>
  );
}

const UNDERLINE: Record<HomeTab, { at: string; color: string }> = {
  Income: { at: "0%", color: "bg-[var(--color-mint)]" },
  Expense: { at: "100%", color: "bg-[var(--color-danger)]" },
  Savings: { at: "200%", color: "bg-[var(--color-savings)]" },
};

const Divider = () => (
  <div className="my-3 w-px self-stretch bg-[var(--color-border)]" />
);

interface TabProps {
  label: string;
  amount: number;
  tone: string;
  active: boolean;
  onClick: () => void;
}

function Tab({
  label,
  amount,
  tone,
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
      <span className="hero-underline block h-[3px]" />
    </button>
  );
}
