import { formatNumber } from "../../lib/format";

interface SavingsTopCardProps {
  safeToSpend: number;
  allocated: number;
}

export function SavingsTopCard({ safeToSpend, allocated }: SavingsTopCardProps) {
  const negative = safeToSpend < 0;

  return (
    <div className="sticky top-3 z-10 mx-4 mb-6 flex items-stretch rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.55)]">
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <Label>Kvar att spendera</Label>
        <Amount
          value={safeToSpend}
          className={
            negative
              ? "text-[var(--color-danger)]"
              : "text-[var(--color-mint)]"
          }
          unitClassName={negative ? "text-[var(--color-danger)]/80" : "text-[var(--color-mint)]/80"}
        />
      </div>

      <div className="mx-[14px] w-px shrink-0 self-center bg-[var(--color-border)]" style={{ height: 40 }} />

      <div className="flex min-w-0 flex-1 flex-col justify-between text-right">
        <Label>Fördelat denna månad</Label>
        <Amount
          value={allocated}
          className="text-[var(--color-savings)]"
          unitClassName="text-[var(--color-savings)]/80"
        />
      </div>
    </div>
  );
}

function Label({ children }: { children: string }) {
  return (
    <div className="mb-1.5 text-[10px] font-bold uppercase leading-[1.3] tracking-[0.05em] text-[var(--color-text-muted)]">
      {children}
    </div>
  );
}

function Amount({
  value,
  className = "",
  unitClassName = "text-[var(--color-text-muted)]",
}: {
  value: number;
  className?: string;
  unitClassName?: string;
}) {
  return (
    <div className={`text-[24px] font-medium tracking-[-0.022em] tabular-nums ${className}`}>
      {formatNumber(value)}{" "}
      <span className={`text-[13px] font-normal ${unitClassName}`}>kr</span>
    </div>
  );
}
