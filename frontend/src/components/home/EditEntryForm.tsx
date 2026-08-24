import { useState } from "react";
import { Button } from "../ui/Button";
import { NumberField } from "../ui/NumberField";
import { Label, Segmented } from "./AddEntryForm";
import { categoriesFor } from "../../lib/categories";
import { getMonthName } from "../../lib/format";
import {
  useDeleteEntryMutation,
  useUpdateEntryMutation,
} from "../../hooks/useEntryMutation";
import type { EntryScope } from "../../hooks/useEntryMutation";
import type { PlannedEntry } from "../../hooks/useMonthPlanQuery";

interface EditEntryFormProps {
  year: number;
  month: number;
  entry: PlannedEntry;
  onSaved: () => void;
}

export function EditEntryForm({
  year,
  month,
  entry,
  onSaved,
}: EditEntryFormProps) {
  const categories = categoriesFor(entry.kind);
  const monthName = getMonthName(month);

  const [name, setName] = useState(entry.name);
  const [amount, setAmount] = useState(entry.amount);
  const [category, setCategory] = useState(entry.category);
  const [isAutogiro, setIsAutogiro] = useState(entry.isAutogiro);
  const [scope, setScope] = useState<EntryScope>("Month");
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const updateEntry = useUpdateEntryMutation(year, month);
  const deleteEntry = useDeleteEntryMutation(year, month);

  const effectiveScope: EntryScope = entry.repeats ? scope : "Onwards";
  const canSave = name.trim().length > 0 && amount > 0;
  const busy = updateEntry.isPending || deleteEntry.isPending;

  const removeLabel = !entry.repeats
    ? "Ta bort"
    : scope === "Month"
      ? `Hoppa över ${monthName}`
      : `Avsluta från ${monthName}`;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;

    updateEntry.mutate(
      {
        id: entry.id,
        kind: entry.kind,
        name: name.trim(),
        category,
        amount,
        isAutogiro,
        scope: effectiveScope,
      },
      { onSuccess: onSaved }
    );
  };

  const handleRemove = () => {
    if (!confirmingRemove) {
      setConfirmingRemove(true);
      return;
    }

    deleteEntry.mutate(
      { id: entry.id, scope: effectiveScope },
      { onSuccess: onSaved }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-extrabold">
        {entry.kind === "Income" ? "Ändra inkomst" : "Ändra utgift"}
      </h2>

      <label className="block">
        <Label>Namn</Label>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={40}
          className="h-12 w-full rounded-2xl bg-[var(--color-surface-2)] px-4 text-base font-bold outline-none focus:border focus:border-[var(--color-mint-dim)]"
        />
      </label>

      <NumberField label="Belopp" value={amount} onChange={setAmount} />

      <div>
        <Label>Kategori</Label>
        <div className="grid grid-cols-4 gap-2">
          {categories.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setCategory(option.value)}
              aria-pressed={option.value === category}
              className={`flex flex-col items-center gap-1 rounded-[14px] py-2.5 text-[10px] font-bold transition ${
                option.value === category
                  ? "bg-[var(--color-mint-wash)] text-[var(--color-mint)]"
                  : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
              }`}
            >
              <span className="text-[17px]">{option.emoji}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {entry.repeats && (
        <div>
          <Label>Ändringen gäller</Label>
          <Segmented
            options={[`Bara ${monthName}`, `Från och med ${monthName}`]}
            selected={scope === "Month" ? 0 : 1}
            onSelect={(index) => setScope(index === 0 ? "Month" : "Onwards")}
          />
        </div>
      )}

      {entry.kind === "Expense" && (
        <div>
          <Label>Betalning</Label>
          <Segmented
            options={["Betalar själv", "Autogiro"]}
            selected={isAutogiro ? 1 : 0}
            onSelect={(index) => setIsAutogiro(index === 1)}
          />
        </div>
      )}

      {(updateEntry.isError || deleteEntry.isError) && (
        <p className="text-sm text-[var(--color-danger)]">
          Kunde inte spara. Försök igen.
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!canSave || busy}
      >
        {updateEntry.isPending ? "Sparar" : "Spara"}
      </Button>

      <Button
        type="button"
        variant={confirmingRemove ? "danger" : "ghost"}
        size="lg"
        className="w-full"
        onClick={handleRemove}
        disabled={busy}
      >
        {confirmingRemove ? "Tryck igen för att bekräfta" : removeLabel}
      </Button>
    </form>
  );
}
