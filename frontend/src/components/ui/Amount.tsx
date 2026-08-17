import { formatKr } from "../../lib/format";

interface AmountProps {
  value: number;
  tone?: "default" | "positive" | "negative";
  size?: "base" | "lg";
}

const sizeClasses = {
  base: "text-[15px] leading-5 font-extrabold",
  lg: "text-[17px] leading-[22px] font-extrabold",
};

const toneClasses = {
  default: "text-[var(--color-text)]",
  positive: "text-[var(--color-mint-light)]",
  negative: "text-[var(--color-danger)]",
};

export function Amount({ value, tone = "default", size = "base" }: AmountProps) {
  return (
    <span className={`tabular-nums ${sizeClasses[size]} ${toneClasses[tone]}`}>
      {formatKr(value)}
    </span>
  );
}
