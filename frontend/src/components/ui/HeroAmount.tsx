import { formatKr } from "../../lib/format";

interface HeroAmountProps {
  value: number;
  /** Läses upp efter beloppet av skärmläsare, t.ex. "kvar att spendera" */
  label: string;
  /** "hero" på Hem (40px), "md" på Sparande (32px) */
  size?: "hero" | "md";
}

const sizeClasses = {
  hero: "text-[40px] leading-[44px]",
  md: "text-[32px] leading-9",
};

/**
 * Appens enda gradient- och glow-effekt. Den finns på exakt två ställen:
 * hero-talet på Hem och överföringssumman på Sparande. Effekten är
 * signaturen — den slutar vara det i samma sekund den används fler ställen.
 *
 * Själva gradienten och glowen ligger i .hero-amount i index.css.
 */
export function HeroAmount({ value, label, size = "hero" }: HeroAmountProps) {
  // Härleds ur värdet i stället för att skickas in som prop,
  // så färgen aldrig kan hamna i otakt med siffran
  const toneClass = value < 0 ? "hero-amount--negative" : "hero-amount";

  return (
    <span
      className={`${toneClass} ${sizeClasses[size]} font-extrabold tracking-tight tabular-nums`}
      aria-label={`${formatKr(value)} ${label}`}
    >
      {formatKr(value)}
    </span>
  );
}
