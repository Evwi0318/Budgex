import { useEffect, useState } from "react";
import { Label } from "../home/AddEntryForm";
import { SourcePicker } from "./SourcePicker";
import { categoryOf } from "../../lib/categories";
import { formatNumber } from "../../lib/format";
import { draftAmount, goalProgress } from "../../lib/savings";
import {
  useAddSavingsAccountMutation,
  useUpdateSavingsAccountMutation,
} from "../../hooks/useSavingsMutation";
import type { Draft } from "../../lib/savings";
import type { PlannedEntry } from "../../hooks/useMonthPlanQuery";
import type { SavingsAccount, SourceUsage } from "../../hooks/useSavingsQuery";

interface SavingsFormProps {
  year: number;
  month: number;
  account: SavingsAccount | null;
  incomes: PlannedEntry[];
  sources: SourceUsage[];
  onSaved: () => void;
  onCancel: () => void;
  onRemove: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

export function SavingsForm({
  year,
  month,
  account,
  incomes,
  sources,
  onSaved,
  onCancel,
  onRemove,
  onDirtyChange,
}: SavingsFormProps) {
  const [name, setName] = useState(account?.name ?? "");
  const [icon, setIcon] = useState(account?.icon ?? "🐷");
  const [goal, setGoal] = useState(account?.goal ?? 0);
  const [saved, setSaved] = useState(account?.saved ?? 0);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    initialDrafts(account)
  );

  const addAccount = useAddSavingsAccountMutation(year, month);
  const updateAccount = useUpdateSavingsAccountMutation(year, month);
  const pending = addAccount.isPending || updateAccount.isPending;
  const failed = addAccount.isError || updateAccount.isError;

  const chosen = incomes.filter((income) => drafts[income.id]);
  const total = chosen.reduce(
    (sum, income) => sum + draftAmount(drafts[income.id], income.amount),
    0
  );

  const dirty =
    name !== (account?.name ?? "") ||
    icon !== (account?.icon ?? "🐷") ||
    goal !== (account?.goal ?? 0) ||
    saved !== (account?.saved ?? 0) ||
    JSON.stringify(drafts) !== JSON.stringify(initialDrafts(account));

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  const canSave = name.trim().length > 0;

  const usedByOthers = (sourceEntryId: string) => {
    const usage = sources.find((source) => source.sourceEntryId === sourceEntryId);
    const mine = account?.rules.find((rule) => rule.sourceEntryId === sourceEntryId);

    return (usage?.allocated ?? 0) - (mine?.amount ?? 0);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;

    const input = {
      name: name.trim(),
      icon,
      goal: goal > 0 ? goal : null,
      saved: goal > 0 ? saved : null,
      rules: Object.entries(drafts).map(([sourceEntryId, draft]) => ({
        sourceEntryId,
        ruleType: draft.ruleType,
        value: draft.value,
      })),
    };

    if (account) {
      updateAccount.mutate({ id: account.id, ...input }, { onSuccess: onSaved });
      return;
    }

    addAccount.mutate(input, { onSuccess: onSaved });
  };

  return (
    <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-5 overflow-y-auto">
      <h2 className="text-[18px] font-extrabold">
        {account ? "Redigera sparkonto" : "Nytt sparkonto"}
      </h2>

      <div>
        <Label>Namn</Label>
        <div className="flex items-center gap-2.5">
          <input
            type="text"
            value={icon}
            onChange={(event) => setIcon(lastCharacter(event.target.value))}
            title="Välj ikon"
            className="h-[46px] w-[46px] shrink-0 rounded-xl border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface-2)] text-center text-[22px] leading-none outline-none focus:border-[var(--color-mint)] focus:bg-[var(--color-mint-wash)]"
          />
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            placeholder="t.ex. Buffert"
            className="h-[46px] min-w-0 flex-1 rounded-xl border border-transparent bg-[var(--color-surface-2)] px-3.5 text-[15px] font-bold outline-none focus:border-[var(--color-mint-dim)] placeholder:font-semibold placeholder:text-[var(--color-text-faint)]"
          />
        </div>
      </div>

      <div>
        <Label>Sparmål (valfritt)</Label>
        <div className="flex gap-2.5">
          <GoalField label="Redan sparat" value={saved} onChange={setSaved} />
          <GoalField label="Målbelopp" value={goal} onChange={setGoal} />
        </div>
        <GoalHint goal={goal} saved={saved} perMonth={total} />
      </div>

      <div>
        <Label>Fördela från</Label>
        <SourcePicker
          incomes={incomes}
          drafts={drafts}
          usedByOthers={usedByOthers}
          onChange={setDrafts}
        />

        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--color-mint-dim)] bg-[var(--color-mint-wash)] px-3 py-2.5">
          {chosen.length === 0 ? (
            <span className="text-[13px] font-bold text-[var(--color-text-muted)]">
              Ingen källa vald
            </span>
          ) : (
            <span className="flex min-w-0 flex-wrap items-center gap-1.5">
              {chosen.map((income) => (
                <span
                  key={income.id}
                  className="flex min-w-0 items-center gap-1.5 rounded-full bg-[var(--color-surface)] py-1 pl-2 pr-2.5 text-[12px] font-bold"
                >
                  <span className="shrink-0 text-[12px]">
                    {categoryOf("Income", income.category).emoji}
                  </span>
                  <span className="truncate">{income.name}</span>
                </span>
              ))}
            </span>
          )}
          <b className="shrink-0 text-[15px] font-extrabold tabular-nums text-[var(--color-mint)]">
            {formatNumber(total)} kr/mån
          </b>
        </div>
      </div>

      {failed && (
        <p className="text-sm text-[var(--color-danger)]">
          Kunde inte spara. Försök igen.
        </p>
      )}

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 flex-1 rounded-xl bg-[var(--color-surface-2)] text-[15px] font-extrabold text-[var(--color-text-muted)] transition active:scale-[0.98]"
        >
          Avbryt
        </button>
        <button
          type="submit"
          disabled={!canSave || pending}
          className="h-12 flex-1 rounded-xl bg-[var(--color-mint)] text-[15px] font-extrabold text-[var(--color-on-mint)] transition active:scale-[0.98] disabled:opacity-35"
        >
          {pending ? "Sparar" : account ? "Spara" : "Lägg till"}
        </button>
      </div>

      {account && (
        <button
          type="button"
          onClick={onRemove}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-[var(--color-danger)] bg-[var(--color-danger-wash)] text-[15px] font-extrabold text-[var(--color-danger)] transition active:scale-[0.985]"
        >
          🗑 Ta bort sparkontot
        </button>
      )}
    </form>
  );
}

interface GoalFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function GoalField({ label, value, onChange }: GoalFieldProps) {
  return (
    <label className="min-w-0 flex-1">
      <span className="mb-1.5 block text-[11px] font-bold text-[var(--color-text-muted)]">
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={value === 0 ? "" : value}
        placeholder="0"
        onChange={(event) =>
          onChange(Number(event.target.value.replace(/\D/g, "")) || 0)
        }
        className="h-[46px] w-full rounded-xl border border-transparent bg-[var(--color-surface-2)] px-3.5 text-[15px] font-bold tabular-nums outline-none focus:border-[var(--color-mint-dim)] placeholder:font-semibold placeholder:text-[var(--color-text-faint)]"
      />
    </label>
  );
}

interface GoalHintProps {
  goal: number;
  saved: number;
  perMonth: number;
}

function GoalHint({ goal, saved, perMonth }: GoalHintProps) {
  if (goal <= 0) return null;

  if (saved >= goal) {
    return (
      <p className="mt-2.5 text-[12px] font-semibold text-[var(--color-mint)]">
        Målet är redan nått 🎉
      </p>
    );
  }

  if (perMonth <= 0) {
    return (
      <p className="mt-2.5 text-[12px] font-semibold text-[var(--color-text-muted)]">
        Välj en källa nedan så räknar vi ut när du är framme.
      </p>
    );
  }

  return (
    <p className="mt-2.5 text-[12px] font-semibold leading-relaxed text-[var(--color-text-muted)]">
      Med {formatNumber(perMonth)} kr i månaden är du framme{" "}
      <b className="font-extrabold text-[var(--color-mint)]">
        {goalProgress(goal, saved, perMonth).eta}
      </b>
      .
    </p>
  );
}

function initialDrafts(account: SavingsAccount | null): Record<string, Draft> {
  return Object.fromEntries(
    (account?.rules ?? []).map((rule) => [
      rule.sourceEntryId,
      { ruleType: rule.ruleType, value: rule.value },
    ])
  );
}

function lastCharacter(value: string): string {
  const characters = [...value];

  return characters[characters.length - 1] ?? "🐷";
}
