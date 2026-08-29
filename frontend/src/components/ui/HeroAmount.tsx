import { formatKr, formatKrShort } from "../../lib/format";

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
    "font-medium tracking-[-0.03em] tabular-nums whitespace-nowrap",
  ]
    .filter(Boolean)
    .join(" ");

  // Etiketten bär hela talet: kortformen är bara till för ögat
  return (
    <span className={classes} aria-label={`${formatKr(value)} ${label}`}>
      {formatKrShort(value)}
    </span>
  );
}
