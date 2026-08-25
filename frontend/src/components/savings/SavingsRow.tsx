import { Check } from "lucide-react";
import { formatKr, formatNumber } from "../../lib/format";
import { goalProgress } from "../../lib/savings";
import type { SavingsAccount, SourceUsage } from "../../hooks/useSavingsQuery";

interface SavingsRowProps {
  account: SavingsAccount;
  sources: SourceUsage[];
  locked: boolean;
  onOpen: () => void;
  onToggleTransfer: () => void;
}

export function SavingsRow({
  account,
  sources,
  locked,
  onOpen,
  onToggleTransfer,
}: SavingsRowProps) {
  const over = account.rules.some((rule) =>
    sources.some(
      (source) =>
        source.sourceEntryId === rule.sourceEntryId && source.status === "Over"
    )
  );

  const note = over
    ? overText(account, sources)
    : account.rules.map(ruleText).join(" · ") || "Ingen källa vald";

  const goal =
    !locked && account.goal
      ? goalProgress(account.goal, account.saved ?? 0, account.amount)
      : null;

  return (
    <div
      className={`mb-2 rounded-[var(--radius-card)] bg-[var(--color-surface)] px-3.5 py-3 transition-opacity ${
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
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-surface-2)] text-[19px]">
            {account.icon}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-bold">
              {account.name}
            </span>
            <span
              className={`mt-px block truncate text-[11.5px] ${
                over ? "text-[var(--color-unpaid)]" : "text-[var(--color-text-faint)]"
              }`}
            >
              {note}
            </span>
          </span>

          <span className="shrink-0 text-right">
            <span className="text-[16px] font-extrabold tabular-nums text-[var(--color-mint)]">
              {formatNumber(account.amount)}
            </span>
            <span className="ml-1 text-[11px] font-bold text-[var(--color-text-muted)]">
              kr/mån
            </span>
          </span>
        </button>

        <button
          onClick={onToggleTransfer}
          role="switch"
          aria-checked={account.isTransferred}
          aria-label={
            account.isTransferred
              ? `Ångra överföringen till ${account.name}`
              : `Markera ${formatKr(account.amount)} till ${account.name} som överfört`
          }
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition active:scale-90 ${
            account.isTransferred
              ? "border-[var(--color-mint)] bg-[var(--color-mint)] text-[var(--color-on-mint)]"
              : "border-[var(--color-border)] text-transparent"
          }`}
        >
          <Check size={14} strokeWidth={3} />
        </button>
      </div>

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
            <span
              className={
                goal.done ? "text-[var(--color-mint)]" : "text-[var(--color-text-faint)]"
              }
            >
              {goal.eta}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

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
      account.rules.some((rule) => rule.sourceEntryId === candidate.sourceEntryId)
  );

  if (!source) return "";

  return source.available === 0
    ? `${source.name} gav 0 kr den här månaden`
    : `Du fördelar ${formatKr(source.allocated)} från ${source.name} som ger ${formatKr(source.available)}`;
}
