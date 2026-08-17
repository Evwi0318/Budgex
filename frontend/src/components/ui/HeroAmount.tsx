import { formatKr } from "../../lib/format";

interface HeroAmountProps {
  value: number;
  label: string;
  size?: "hero" | "md";
}

const sizeClasses = {
  hero: "text-[40px] leading-[44px]",
  md: "text-[32px] leading-9",
};

export function HeroAmount({ value, label, size = "hero" }: HeroAmountProps) {
  const toneClass =
    value < 0 ? "hero-amount hero-amount--negative" : "hero-amount";

  return (
    <span
      className={`${toneClass} ${sizeClasses[size]} font-extrabold tracking-tight tabular-nums`}
      aria-label={`${formatKr(value)} ${label}`}
    >
      {formatKr(value)}
    </span>
  );
}
