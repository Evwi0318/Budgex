import { useState } from "react";
import { formatKr, formatMonthYear, getMonthName } from "../../lib/format";
import type { TrendMonth } from "../../hooks/useTrendQuery";
import type { Month } from "../../lib/month";

interface MonthTrendProps {
  months: TrendMonth[];
  selected: Month;
  onSelect: (month: Month) => void;
}

type Tone = "plus" | "zero" | "minus";

const toneOf = (safeToSpend: number | null): Tone =>
  safeToSpend === null || safeToSpend === 0
    ? "zero"
    : safeToSpend > 0
      ? "plus"
      : "minus";

const short = (month: number) => getMonthName(month).slice(0, 3).toUpperCase();

const UP = {
  plus: "bg-[var(--color-mint-dim)] group-hover:bg-[var(--color-mint)] group-aria-[current=true]:bg-[var(--color-mint)]",
  zero: "bg-[#2b3630] group-hover:bg-[#46554d] group-aria-[current=true]:bg-[#46554d]",
  minus: "bg-transparent",
};

const DOWN = {
  plus: "bg-transparent",
  zero: "bg-transparent",
  minus:
    "bg-[#5a2e2e] group-hover:bg-[var(--color-danger)] group-aria-[current=true]:bg-[var(--color-danger)]",
};

export function MonthTrend({ months, selected, onSelect }: MonthTrendProps) {
  const [hovered, setHovered] = useState<TrendMonth | null>(null);

  const values = months.map((entry) => entry.safeToSpend ?? 0);
  const up = Math.max(...values.map((value) => Math.max(value, 0)), 1);
  const down = Math.max(...values.map((value) => Math.max(-value, 0)), 1);
  const zero = Math.round((up / (up + down)) * 100);

  const known = months.slice(-6).filter((entry) => entry.safeToSpend !== null);
  const average = known.length
    ? Math.round(
        known.reduce((sum, entry) => sum + (entry.safeToSpend ?? 0), 0) /
          known.length
      )
    : null;

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[12px] font-bold tracking-[0.1em] text-[var(--color-text-muted)] uppercase">
        Senaste 12 månaderna
      </p>

      <div
        onPointerLeave={() => setHovered(null)}
        className="flex h-[118px] items-stretch gap-[clamp(4px,0.7vw,9px)] max-[1079px]:h-[92px]"
      >
        {months.map((entry, index) => {
          const tone = toneOf(entry.safeToSpend);
          const value = entry.safeToSpend ?? 0;
          const current =
            entry.year === selected.year && entry.month === selected.month;

          return (
            <button
              key={`${entry.year}-${entry.month}`}
              onClick={() => onSelect({ year: entry.year, month: entry.month })}
              onPointerEnter={() => setHovered(entry)}
              aria-current={current}
              aria-label={`${formatMonthYear(entry.month, entry.year)}, ${describe(entry)}`}
              className={`group flex flex-1 flex-col items-stretch gap-1.5 rounded-lg transition hover:bg-white/5 ${
                index < 2 ? "max-[1379px]:hidden" : ""
              }`}
            >
              <span
                className="grid min-h-0 flex-1"
                style={{ gridTemplateRows: `${zero}% 1px 1fr` }}
              >
                <span
                  className={`self-end rounded-t-[5px] transition-[height,background-color] duration-300 ${UP[tone]}`}
                  style={{
                    height:
                      tone === "plus"
                        ? `${Math.max(3, Math.round((value / up) * 100))}%`
                        : tone === "zero"
                          ? "3%"
                          : "0%",
                  }}
                />
                <span className="bg-[var(--color-border)]" />
                <span
                  className={`self-start rounded-b-[5px] transition-[height,background-color] duration-300 ${DOWN[tone]}`}
                  style={{
                    height:
                      tone === "minus"
                        ? `${Math.max(3, Math.round((-value / down) * 100))}%`
                        : "0%",
                  }}
                />
              </span>

              <span
                className={`text-center text-[10.5px] font-bold tracking-[0.04em] uppercase ${
                  current
                    ? "text-[var(--color-text)]"
                    : "text-[var(--color-text-faint)]"
                }`}
              >
                {short(entry.month)}
              </span>
            </button>
          );
        })}
      </div>

      <p className="flex min-h-5 items-baseline gap-2 text-[12.5px] text-[var(--color-text-faint)]">
        {hovered ? (
          <>
            <b className="font-semibold text-[var(--color-text-muted)]">
              {formatMonthYear(hovered.month, hovered.year)}
            </b>
            {describe(hovered)}
          </>
        ) : average !== null ? (
          <>
            <b className="font-semibold text-[var(--color-text-muted)]">
              Snitt senaste {known.length} mån
            </b>
            {formatKr(average)} kvar
          </>
        ) : null}
      </p>
    </div>
  );
}

function describe({ safeToSpend }: TrendMonth): string {
  if (safeToSpend === null) return "ingen data";
  if (safeToSpend === 0) return "gick jämnt ut";

  return safeToSpend > 0
    ? `${formatKr(safeToSpend)} kvar`
    : `${formatKr(-safeToSpend)} över budget`;
}
