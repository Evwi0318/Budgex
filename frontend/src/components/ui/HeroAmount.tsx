import { memo } from "react";

interface HeroAmountProps {
  value: number;
  isNegative?: boolean;
  showLabel?: boolean;
  label?: string;
}

const formatKr = (value: number): string => {
  const kr = new Intl.NumberFormat("sv-SE", {
    style: "decimal",
    maximumFractionDigits: 0,
  });
  return `${kr.format(value)} kr`;
};

export const HeroAmount = memo(function HeroAmount({
  value,
  isNegative = false,
  showLabel = false,
  label,
}: HeroAmountProps) {
  const formatted = formatKr(value);
  const heroClass = isNegative ? "hero-amount--negative" : "hero-amount";

  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={`${heroClass} text-5xl font-black leading-tight tabular-nums`}
        aria-label={`${value} kronor${label ? ` ${label}` : ""}`}
      >
        {formatted}
      </span>
      {showLabel && label && (
        <span className="text-xs font-semibold text-[var(--color-text-faint)] uppercase tracking-widest">
          {label}
        </span>
      )}
    </div>
  );
});
