import { memo } from "react";

interface AmountProps {
  value: number;
  tone?: "default" | "positive" | "negative";
  size?: "sm" | "base" | "lg" | "hero";
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

const sizeClasses = {
  sm: "text-sm font-semibold",
  base: "text-base font-bold",
  lg: "text-[17px] font-bold leading-6",
  hero: "text-5xl font-black leading-tight",
};

const toneClasses = {
  default: "text-white",
  positive: "text-[var(--color-mint-light)]",
  negative: "text-[var(--color-danger)]",
};

export const Amount = memo(function Amount({
  value,
  tone = "default",
  size = "base",
  showLabel = false,
  label,
}: AmountProps) {
  const formatted = formatKr(value);

  return (
    <div className="flex flex-col items-end tabular-nums">
      <span
        className={`${sizeClasses[size]} ${toneClasses[tone]}`}
        aria-label={`${value} kronor${label ? ` ${label}` : ""}`}
      >
        {formatted}
      </span>
      {showLabel && label && (
        <span className="text-xs text-[var(--color-text-muted)] mt-1">
          {label}
        </span>
      )}
    </div>
  );
});
