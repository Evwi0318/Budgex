import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import { formatKr } from "../../lib/format";
import type { MonthSummary } from "../../hooks/useMonthPlanQuery";

/** Kort utgång, så att skärmen går att använda igen direkt */
const EXIT = { duration: 0.14, ease: [0.32, 0.72, 0, 1] } as const;

interface ExactAmountsProps {
  summary: MonthSummary;
  monthLabel: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Hero-kortet kortar av tal från en miljon och uppåt så att de får plats.
 * Håller man in på kortet visas hela beloppet här i stället, i mindre stil
 * och med skärmen bakom nedtonad.
 */
export function ExactAmounts({
  summary,
  monthLabel,
  open,
  onClose,
}: ExactAmountsProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <Panel summary={summary} monthLabel={monthLabel} onClose={onClose} />
      )}
    </AnimatePresence>,
    document.body
  );
}

function Panel({
  summary,
  monthLabel,
  onClose,
}: Omit<ExactAmountsProps, "open">) {
  // Medan fönstret tonar bort ska trycken bakom gå fram igen
  const present = useIsPresent();
  const heading = summary.safeToSpend < 0 ? "Över budget" : "Kvar att spendera";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      style={present ? undefined : { pointerEvents: "none" }}
    >
      <motion.button
        aria-label="Stäng"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: EXIT }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-black/55 backdrop-blur-md"
      />

      <motion.div
        role="dialog"
        aria-modal={present ? "true" : undefined}
        aria-label={`Exakta belopp för ${monthLabel}`}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96, transition: EXIT }}
        transition={{ type: "spring", damping: 28, stiffness: 380 }}
        className="relative w-full max-w-[340px] rounded-[var(--radius-hero)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 will-change-transform"
      >
        <p className="text-[12px] font-medium text-[var(--color-text-muted)]">
          {heading} · {monthLabel}
        </p>

        <p
          className={`mt-1 text-[26px] leading-8 font-medium tracking-[-0.02em] tabular-nums ${
            summary.safeToSpend < 0
              ? "text-[var(--color-danger)]"
              : "text-[var(--color-text)]"
          }`}
        >
          {formatKr(summary.safeToSpend)}
        </p>

        <div className="mt-4 space-y-2.5 border-t border-[var(--color-border)] pt-3.5">
          <Row
            label="Inkomst"
            value={summary.income}
            tone="text-[var(--color-mint)]"
          />
          <Row
            label="Utgifter"
            value={summary.totalExpenses}
            tone="text-[var(--color-danger)]"
          />
          <Row
            label="Sparande"
            value={summary.totalSavings}
            tone="text-[var(--color-savings)]"
          />
        </div>
      </motion.div>
    </div>
  );
}

interface RowProps {
  label: string;
  value: number;
  tone: string;
}

function Row({ label, value, tone }: RowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[13px] font-semibold text-[var(--color-text-muted)]">
        {label}
      </span>
      <span className={`text-[15px] font-bold tabular-nums ${tone}`}>
        {formatKr(value)}
      </span>
    </div>
  );
}
