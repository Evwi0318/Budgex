import { formatKr } from "../../lib/format";
import type { MonthSummary } from "../../hooks/useMonthPlanQuery";

interface AllocationProps {
  summary: MonthSummary;
  monthName: string;
  unpaidCount: number;
  toTransfer: number;
}

interface Share {
  expenses: number;
  savings: number;
  rest: number;
}

function shareOf(summary: MonthSummary): Share {
  const span = Math.max(summary.income, 1);
  const percent = (value: number) => Math.round((value / span) * 100);

  if (summary.safeToSpend < 0) {
    return {
      expenses: percent(summary.totalExpenses),
      savings: percent(summary.totalSavings),
      rest: percent(-summary.safeToSpend),
    };
  }

  const raw = [
    summary.totalExpenses,
    summary.totalSavings,
    summary.safeToSpend,
  ].map((value) => (value / span) * 100);

  const parts = raw.map(Math.floor);
  const byRemainder = raw
    .map((value, index) => ({ remainder: value - Math.floor(value), index }))
    .sort((a, b) => b.remainder - a.remainder);

  const missing = 100 - parts.reduce((sum, value) => sum + value, 0);
  for (let step = 0; step < missing; step++) {
    parts[byRemainder[step % 3].index]++;
  }

  return { expenses: parts[0], savings: parts[1], rest: parts[2] };
}

export function Allocation({
  summary,
  monthName,
  unpaidCount,
  toTransfer,
}: AllocationProps) {
  const over = summary.safeToSpend < 0;
  const span = Math.max(summary.income, 1);
  const width = (value: number) =>
    `${Math.max(0, Math.round((value / span) * 100))}%`;
  const share = shareOf(summary);

  return (
    <div>
      <p className="text-[12px] font-bold tracking-[0.1em] text-[var(--color-text-muted)] uppercase">
        {over ? "Över budget i" : "Kvar att spendera i"} {monthName}
      </p>

      <p
        className={`mt-2.5 text-[clamp(46px,6.4vw,86px)] leading-[0.98] font-light tracking-[-0.035em] tabular-nums ${
          over ? "text-[var(--color-danger)]" : ""
        }`}
      >
        {formatKr(summary.safeToSpend)}
      </p>

      <p className="mt-5 max-w-[46ch] text-[13.5px] leading-[1.55] text-[var(--color-text-muted)]">
        {toTransfer > 0 ? (
          <>
            <b className="font-semibold text-[var(--color-text)]">
              {formatKr(toTransfer)}
            </b>{" "}
            ska föras över till sparkonton.
          </>
        ) : (
          "Allt sparande är överfört."
        )}{" "}
        {unpaidCount > 0 ? (
          <>
            <span className="font-semibold text-[var(--color-unpaid)]">
              {unpaidCount} {unpaidCount === 1 ? "räkning" : "räkningar"}
            </span>{" "}
            väntar på att du betalar {unpaidCount === 1 ? "den" : "dem"} själv.
          </>
        ) : (
          "Inget kvar att betala själv."
        )}
      </p>

      <div className="mt-6">
        <p className="mb-3 flex flex-wrap items-baseline gap-x-2.5 text-[13.5px] text-[var(--color-text-muted)]">
          Inkomst
          <b className="text-[29px] leading-[1.05] font-medium tracking-[-0.02em] tabular-nums text-[var(--color-mint)]">
            {formatKr(summary.income)}
          </b>
          fördelas så här
        </p>

        <div className="flex h-2.5 gap-[3px]">
          <span
            className="block h-full min-w-[4px] rounded-full bg-[var(--color-danger)] transition-[width] duration-300"
            style={{ width: width(summary.totalExpenses) }}
          />
          <span
            className="block h-full min-w-[4px] rounded-full bg-[var(--color-savings)] transition-[width] duration-300"
            style={{ width: width(summary.totalSavings) }}
          />
          {!over && (
            <span
              className="block h-full min-w-[4px] rounded-full bg-[var(--color-mint)] transition-[width] duration-300"
              style={{ width: width(summary.safeToSpend) }}
            />
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-11 gap-y-4">
          <Key
            label="Utgifter"
            dot="bg-[var(--color-danger)]"
            amount={summary.totalExpenses}
            percent={share.expenses}
          />
          <Key
            label="Sparande"
            dot="bg-[var(--color-savings)]"
            amount={summary.totalSavings}
            percent={share.savings}
          />
          <Key
            label={over ? "Över budget" : "Kvar"}
            dot={over ? "bg-[var(--color-danger)]" : "bg-[var(--color-mint)]"}
            amount={Math.abs(summary.safeToSpend)}
            percent={share.rest}
            tone={over ? "text-[var(--color-danger)]" : ""}
          />
        </div>
      </div>
    </div>
  );
}

interface KeyProps {
  label: string;
  dot: string;
  amount: number;
  percent: number;
  tone?: string;
}

function Key({ label, dot, amount, percent, tone = "" }: KeyProps) {
  return (
    <span className="grid gap-y-[3px]">
      <span className="flex items-center gap-[7px] text-[13px] text-[var(--color-text-muted)]">
        <span className={`h-2 w-2 rounded-[2px] ${dot}`} />
        {label}
      </span>
      <span className="flex items-baseline gap-2">
        <b
          className={`text-[23px] leading-[1.1] font-medium tracking-[-0.015em] tabular-nums ${tone}`}
        >
          {formatKr(amount)}
        </b>
        <em className="text-[23px] leading-[1.1] font-normal tracking-[-0.015em] text-[var(--color-text-muted)] not-italic tabular-nums">
          {percent} %
        </em>
      </span>
    </span>
  );
}
