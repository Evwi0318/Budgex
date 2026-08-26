import { formatKr } from "../../lib/format";

interface HeroAmountProps {
  value: number;
  label: string;
  compact?: boolean;
}

export function HeroAmount({ value, label, compact = false }: HeroAmountProps) {
  // Storleken bor i CSS så att övergången 42 → 21 px går att animera
  const classes = [
    "hero-amount",
    value < 0 ? "hero-amount--negative" : "",
    compact ? "hero-amount--compact" : "",
    "font-medium tracking-[-0.03em] tabular-nums",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} aria-label={`${formatKr(value)} ${label}`}>
      {formatKr(value)}
    </span>
  );
}
