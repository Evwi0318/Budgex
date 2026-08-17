import { formatKr } from "../../lib/format";

interface HeroAmountProps {
  value: number;
  label: string;
}

export function HeroAmount({ value, label }: HeroAmountProps) {
  const toneClass =
    value < 0 ? "hero-amount hero-amount--negative" : "hero-amount";

  return (
    <span
      className={`${toneClass} text-[40px] leading-[44px] font-extrabold tracking-tight tabular-nums`}
      aria-label={`${formatKr(value)} ${label}`}
    >
      {formatKr(value)}
    </span>
  );
}
