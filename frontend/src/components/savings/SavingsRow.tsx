import { memo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatKr, formatNumber, getMonthName } from "../../lib/format";
import { goalProgress, overAllocationText } from "../../lib/savings";
import type { SavingsAccount, SourceUsage } from "../../hooks/useSavingsQuery";

interface SavingsRowProps {
  account: SavingsAccount;
  sources: SourceUsage[];
  locked: boolean;
  onOpen: () => void;
  onToggleTransfer: () => void;
}

function Row({
  account,
  sources,
  locked,
  onOpen,
  onToggleTransfer,
}: SavingsRowProps) {
  const [expanded, setExpanded] = useState(false);

  const over = account.rules.some((rule) =>
    sources.some(
      (source) =>
        source.sourceEntryId === rule.sourceEntryId && source.status === "Over",
    ),
  );

  const note = over
    ? overText(account, sources)
    : account.items.length > 0
      ? `från ${account.rules[0]?.sourceName ?? "ingen källa"}`
      : account.rules.map(ruleText).join(" · ") || "Ingen källa vald";

  const goal =
    !locked && account.goal
      ? goalProgress(account.goal, account.saved ?? 0, account.amount)
      : null;

  return (
    <div
      className={`mb-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 transition-opacity ${
        account.isTransferred ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onOpen}
          disabled={locked}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label={`Öppna ${account.name}`}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--color-surface-2)] text-[17px]">
            {account.icon}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-bold">
              {account.name}
            </span>
            <span
              className={`mt-px block truncate text-[11.5px] ${
                over
                  ? "text-[var(--color-unpaid)]"
                  : "text-[var(--color-text-faint)]"
              }`}
            >
              {note}
            </span>
          </span>

          <span className="shrink-0 text-right">
            <span className="text-[16px] font-medium tabular-nums text-[var(--color-mint)]">
              {formatNumber(account.amount)}
            </span>
            <span className="ml-1 text-[11px] font-bold text-[var(--color-text-muted)]">
              kr/mån
            </span>
          </span>
        </button>

        {account.items.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={`Visa vad ${account.name} sparar till`}
            className="grid h-8 w-8 shrink-0 place-items-center text-[var(--color-text-muted)]"
          >
            <ChevronDown
              size={18}
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}

        <button
          onClick={onToggleTransfer}
          disabled={locked}
          role="switch"
          aria-checked={account.isTransferred}
          aria-label={
            account.isTransferred
              ? `Ångra överföringen till ${account.name}`
              : `Markera ${formatKr(account.amount)} till ${account.name} som överfört`
          }
          className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[9px] border-2 text-[14px] font-black transition not-disabled:active:scale-90 disabled:opacity-40 ${
            account.isTransferred
              ? "border-[var(--color-mint)] bg-[var(--color-mint)] text-[var(--color-on-mint)]"
              : "border-[var(--color-border)] text-transparent"
          }`}
        >
          ✓
        </button>
      </div>

      {expanded && (
        <div className="mt-2.5 space-y-1.5">
          {account.items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-surface-2)] px-3 py-2"
            >
              <span className="truncate text-[13px] font-bold">
                {item.name}
              </span>
              <span className="shrink-0 text-[11.5px] text-[var(--color-text-muted)]">
                {formatKr(item.yearlyAmount)} · {getMonthName(item.dueMonth)}
              </span>
            </div>
          ))}
        </div>
      )}

      {goal && (
        <div className="mt-3">
          <div className="flex h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
            <span
              className="bg-[var(--color-mint)]"
              style={{ width: `${goal.pct}%` }}
            />
            <span
              className="bg-[var(--color-mint-dim)]"
              style={{ width: `${goal.nextPct}%` }}
            />
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[11.5px]">
            <span className="text-[var(--color-text-muted)]">{goal.text}</span>
            <span className="shrink-0 font-bold text-[var(--color-mint)]">
              {goal.eta}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Samma skäl som i EntryRow: flikbytet ska inte rita om rader som inte ändrats */
export const SavingsRow = memo(
  Row,
  (before, after) =>
    before.account === after.account &&
    before.sources === after.sources &&
    before.locked === after.locked,
);

function ruleText(rule: {
  ruleType: string;
  value: number;
  sourceName: string;
  amount: number;
}): string {
  return rule.ruleType === "Fixed"
    ? `${formatKr(rule.value)} från ${rule.sourceName}`
    : `${rule.value} % av ${rule.sourceName}`;
}

function overText(account: SavingsAccount, sources: SourceUsage[]): string {
  const source = sources.find(
    (candidate) =>
      candidate.status === "Over" &&
      account.rules.some(
        (rule) => rule.sourceEntryId === candidate.sourceEntryId,
      ),
  );

  return source
    ? overAllocationText(source.name, source.allocated, source.available)
    : "";
}
