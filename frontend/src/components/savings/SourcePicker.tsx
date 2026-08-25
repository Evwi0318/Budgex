import { Check } from "lucide-react";
import { categoryOf } from "../../lib/categories";
import { formatKr } from "../../lib/format";
import { draftAmount } from "../../lib/savings";
import type { Draft } from "../../lib/savings";
import type { PlannedEntry } from "../../hooks/useMonthPlanQuery";
import type { RuleType } from "../../hooks/useSavingsQuery";

interface SourcePickerProps {
  incomes: PlannedEntry[];
  drafts: Record<string, Draft>;
  usedByOthers: (sourceEntryId: string) => number;
  onChange: (drafts: Record<string, Draft>) => void;
}

export function SourcePicker({
  incomes,
  drafts,
  usedByOthers,
  onChange,
}: SourcePickerProps) {
  if (incomes.length === 0) {
    return (
      <p className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] px-4 py-5 text-center text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
        Du har inga inkomster den här månaden. Lägg till lön, CSN eller annat på
        Hem först — sedan kan du fördela därifrån hit.
      </p>
    );
  }

  const toggle = (id: string) => {
    const next = { ...drafts };

    if (next[id]) delete next[id];
    else next[id] = { ruleType: "Fixed", value: 0 };

    onChange(next);
  };

  const set = (id: string, draft: Draft) => onChange({ ...drafts, [id]: draft });

  return (
    <div className="space-y-2">
      {incomes.map((income) => {
        const draft = drafts[income.id];
        const category = categoryOf("Income", income.category);
        const warning = draft
          ? warn(usedByOthers(income.id) + draftAmount(draft, income.amount), income.amount, income.name)
          : null;

        return (
          <div
            key={income.id}
            className={`rounded-[var(--radius-card)] border ${
              draft
                ? "border-[1.5px] border-[var(--color-mint)] bg-[var(--color-mint-wash)]"
                : "border-transparent bg-[var(--color-surface-2)]"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(income.id)}
              className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-[7px] border-2 ${
                  draft
                    ? "border-[var(--color-mint)] bg-[var(--color-mint)] text-[var(--color-on-mint)]"
                    : "border-[var(--color-border)] text-transparent"
                }`}
              >
                <Check size={13} strokeWidth={3} />
              </span>

              <span className="text-[16px]">{category.emoji}</span>
              <span className="flex-1 truncate text-[14.5px] font-bold">
                {income.name}
              </span>
              <span
                className={`text-[12.5px] font-bold tabular-nums ${
                  draft ? "text-[var(--color-mint)]" : "text-[var(--color-text-muted)]"
                }`}
              >
                {formatKr(income.amount)}
              </span>
            </button>

            {draft && (
              <div className="border-t border-[var(--color-border)] px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 rounded-xl bg-[var(--color-bg)] p-1">
                    {(["Fixed", "Percentage"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => set(income.id, convert(draft, type, income.amount))}
                        className={`w-10 rounded-lg py-1.5 text-[12.5px] font-bold transition ${
                          draft.ruleType === type
                            ? "bg-[var(--color-mint)] text-[var(--color-on-mint)]"
                            : "text-[var(--color-text-muted)]"
                        }`}
                      >
                        {type === "Fixed" ? "kr" : "%"}
                      </button>
                    ))}
                  </div>

                  <div className="flex h-10 flex-1 items-center gap-2 rounded-xl bg-[var(--color-bg)] px-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={draft.value === 0 ? "" : draft.value}
                      placeholder="0"
                      onChange={(event) =>
                        set(income.id, {
                          ...draft,
                          value: clamp(event.target.value, draft.ruleType),
                        })
                      }
                      className="min-w-0 flex-1 bg-transparent text-[15px] font-extrabold tabular-nums outline-none placeholder:font-normal placeholder:text-[var(--color-text-faint)]"
                    />
                    <span className="text-[13px] text-[var(--color-text-muted)]">
                      {draft.ruleType === "Fixed" ? "kr" : "%"}
                    </span>
                  </div>
                </div>

                {draft.ruleType === "Percentage" && (
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={draft.value}
                    onChange={(event) =>
                      set(income.id, { ...draft, value: Number(event.target.value) })
                    }
                    className="mt-3 w-full accent-[var(--color-mint)]"
                  />
                )}

                <p className="mt-2 text-[11.5px] text-[var(--color-text-faint)]">
                  {warning ?? `Ger ${formatKr(draftAmount(draft, income.amount))} i månaden.`}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function convert(draft: Draft, type: RuleType, available: number): Draft {
  if (draft.ruleType === type) return draft;

  const amount = draftAmount(draft, available);

  return type === "Fixed"
    ? { ruleType: "Fixed", value: amount }
    : { ruleType: "Percentage", value: Math.min(100, Math.round((amount / (available || 1)) * 100)) };
}

function clamp(raw: string, type: RuleType): number {
  const digits = Number(raw.replace(/\D/g, "")) || 0;

  return Math.min(digits, type === "Percentage" ? 100 : 10_000_000);
}

function warn(allocated: number, available: number, name: string): string | null {
  if (allocated > available) {
    return available === 0
      ? `${name} gav 0 kr den här månaden`
      : `Du fördelar ${formatKr(allocated)} från ${name} som ger ${formatKr(available)}`;
  }

  return allocated === available && allocated > 0 ? `Hela ${name} är fördelad` : null;
}
