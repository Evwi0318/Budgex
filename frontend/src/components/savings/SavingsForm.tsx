import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { NumberField } from "../ui/NumberField";
import { Label } from "../home/AddEntryForm";
import { SourcePicker } from "./SourcePicker";
import { formatKr } from "../../lib/format";
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
  onRemove,
  onDirtyChange,
}: SavingsFormProps) {
  const [name, setName] = useState(account?.name ?? "");
  const [icon, setIcon] = useState(account?.icon ?? "🐷");
  const [goal, setGoal] = useState(account?.goal ?? 0);
  const [saved, setSaved] = useState(account?.saved ?? 0);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(
      (account?.rules ?? []).map((rule) => [
        rule.sourceEntryId,
        { ruleType: rule.ruleType, value: rule.value },
      ])
    )
  );

  const addAccount = useAddSavingsAccountMutation(year, month);
  const updateAccount = useUpdateSavingsAccountMutation(year, month);
  const pending = addAccount.isPending || updateAccount.isPending;
  const failed = addAccount.isError || updateAccount.isError;

  const total = incomes.reduce(
    (sum, income) =>
      sum + (drafts[income.id] ? draftAmount(drafts[income.id], income.amount) : 0),
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

  const forecast =
    goal > 0 && total > 0 ? goalProgress(goal, saved, total).eta : null;

  return (
    <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto">
      <h2 className="text-xl font-extrabold">
        {account ? "Ändra sparkonto" : "Nytt sparkonto"}
      </h2>

      <div className="flex gap-3">
        <label className="block w-16 shrink-0">
          <Label>Ikon</Label>
          <input
            type="text"
            value={icon}
            onChange={(event) => setIcon(lastCharacter(event.target.value))}
            className="h-12 w-full rounded-2xl bg-[var(--color-surface-2)] text-center text-[22px] outline-none focus:border focus:border-[var(--color-mint-dim)]"
          />
        </label>

        <label className="block flex-1">
          <Label>Namn</Label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={60}
            placeholder="T.ex. Buffert"
            className="h-12 w-full rounded-2xl bg-[var(--color-surface-2)] px-4 text-base font-bold outline-none focus:border focus:border-[var(--color-mint-dim)] placeholder:font-normal placeholder:text-[var(--color-text-faint)]"
          />
        </label>
      </div>

      <div>
        <Label>Källor</Label>
        <SourcePicker
          incomes={incomes}
          drafts={drafts}
          usedByOthers={usedByOthers}
          onChange={setDrafts}
        />
      </div>

      <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-2)] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-[var(--color-text-muted)]">
            {Object.keys(drafts).length === 0
              ? "Ingen källa vald"
              : `${Object.keys(drafts).length} källor`}
          </span>
          <span className="text-[17px] font-extrabold tabular-nums text-[var(--color-savings)]">
            {formatKr(total)}/mån
          </span>
        </div>
      </div>

      <NumberField label="Sparmål" value={goal} onChange={setGoal} />

      {goal > 0 && (
        <>
          <NumberField
            label="Redan sparat"
            value={saved}
            onChange={setSaved}
            hint="Siffran räknas upp automatiskt varje gång du bockar av en överföring."
          />
          {forecast && (
            <p className="text-[12.5px] text-[var(--color-text-muted)]">
              Med {formatKr(total)} i månaden är du framme{" "}
              <b className="text-[var(--color-mint)]">{forecast}</b>.
            </p>
          )}
        </>
      )}

      {failed && (
        <p className="text-sm text-[var(--color-danger)]">
          Kunde inte spara. Försök igen.
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={!canSave || pending}>
        {pending ? "Sparar" : account ? "Spara" : "Lägg till"}
      </Button>

      {account && (
        <Button
          type="button"
          variant="danger"
          size="lg"
          className="w-full"
          onClick={onRemove}
        >
          Ta bort
        </Button>
      )}
    </form>
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
