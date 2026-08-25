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
      className={`${toneClass} text-[42px] leading-[46px] font-medium tracking-[-0.03em] tabular-nums`}
      aria-label={`${formatKr(value)} ${label}`}
    >
      {formatKr(value)}
    </span>
  );
}
