import { formatKr } from "../../lib/format";

interface AmountProps {
  value: number;
  tone?: "default" | "positive" | "negative";
  size?: "sm" | "base" | "lg";
}

const sizeClasses = {
  sm: "text-sm font-bold",
  base: "text-[15px] leading-5 font-extrabold",
  lg: "text-[17px] leading-[22px] font-extrabold",
};

const toneClasses = {
  default: "text-[var(--color-text)]",
  positive: "text-[var(--color-mint-light)]",
  negative: "text-[var(--color-danger)]",
};

/**
 * Varje belopp i appen renderas genom den här komponenten, så att
 * formatering och färgsättning aldrig kan glida isär mellan skärmar.
 * Layout och justering bestäms av föräldern — Amount är bara texten.
 */
export function Amount({
  value,
  tone = "default",
  size = "base",
}: AmountProps) {
  return (
    <span className={`tabular-nums ${sizeClasses[size]} ${toneClasses[tone]}`}>
      {formatKr(value)}
    </span>
  );
}
