import { Card } from "../ui/Card";
import { HeroAmount } from "../ui/HeroAmount";
import { Amount } from "../ui/Amount";
import { Eyebrow } from "../ui/Eyebrow";

interface HeroBalanceProps {
  safeToSpend: number;
  totalIncome: number;
  totalExpenses: number;
}

export function HeroBalance({
  safeToSpend,
  totalIncome,
  totalExpenses,
}: HeroBalanceProps) {
  const heading = safeToSpend < 0 ? "Över budget" : "Kvar att spendera";

  return (
    <Card variant="hero" className="mb-6">
      <div className="flex flex-col items-center gap-5">
        {/* Hjälten — det enda lysande talet på skärmen */}
        <div className="flex flex-col items-center gap-2">
          <Eyebrow>{heading}</Eyebrow>
          <HeroAmount value={safeToSpend} label={heading.toLowerCase()} />
        </div>

        <div className="w-full h-px bg-[var(--color-border)]" />

        {/* Statparet — två kolumner med en hårfin lodrät kant emellan */}
        <div className="w-full flex items-center">
          <div className="flex-1 flex flex-col items-center gap-1">
            <Eyebrow>Inkomst</Eyebrow>
            <Amount value={totalIncome} tone="positive" size="lg" />
          </div>

          <div className="w-px self-stretch bg-[var(--color-border)]" />

          <div className="flex-1 flex flex-col items-center gap-1">
            <Eyebrow>Utgifter</Eyebrow>
            <Amount value={totalExpenses} tone="negative" size="lg" />
          </div>
        </div>
      </div>
    </Card>
  );
}
