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
  const isNegative = safeToSpend < 0;

  return (
    <Card variant="hero" className="mb-6">
      <div className="flex flex-col items-center gap-6">
        {/* Hero-talet */}
        <div className="w-full">
          <Eyebrow className="text-center mb-2">KVAR ATT SPENDERA</Eyebrow>
          <div className="flex justify-center">
            <HeroAmount value={safeToSpend} isNegative={isNegative} />
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[var(--color-border)]" />

        {/* Statpar */}
        <div className="w-full flex justify-between items-center gap-4">
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-faint)] mb-1">
              Inkomst
            </div>
            <Amount
              value={totalIncome}
              tone="positive"
              size="lg"
              aria-label={`Total inkomst: ${totalIncome} kronor`}
            />
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-faint)] mb-1">
              Utgifter
            </div>
            <Amount
              value={totalExpenses}
              tone="negative"
              size="lg"
              aria-label={`Totala utgifter: ${totalExpenses} kronor`}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
