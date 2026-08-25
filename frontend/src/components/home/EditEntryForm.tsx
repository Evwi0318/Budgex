import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { NumberField } from "../ui/NumberField";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Label, Segmented } from "./AddEntryForm";
import { categoriesFor } from "../../lib/categories";
import { formatKr, getMonthName } from "../../lib/format";
import { useUpdateEntryMutation } from "../../hooks/useEntryMutation";
import type { EntryScope } from "../../hooks/useEntryMutation";
import type { PlannedEntry } from "../../hooks/useMonthPlanQuery";

interface EditEntryFormProps {
  year: number;
  month: number;
  entry: PlannedEntry;
  onSaved: () => void;
  onRemove: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

export function EditEntryForm({
  year,
  month,
  entry,
  onSaved,
  onRemove,
  onDirtyChange,
}: EditEntryFormProps) {
  const categories = categoriesFor(entry.kind);
  const monthName = getMonthName(month);
  const noun = entry.kind === "Income" ? "Inkomsten" : "Utgiften";

  const [name, setName] = useState(entry.name);
  const [amount, setAmount] = useState(entry.amount);
  const [category, setCategory] = useState(entry.category);
  const [isAutogiro, setIsAutogiro] = useState(entry.isAutogiro);
  const [askingScope, setAskingScope] = useState(false);

  const updateEntry = useUpdateEntryMutation(year, month);
  const canSave = name.trim().length > 0 && amount > 0;

  const dirty =
    name !== entry.name ||
    amount !== entry.amount ||
    category !== entry.category ||
    isAutogiro !== entry.isAutogiro;

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  const commit = (scope: EntryScope) =>
    updateEntry.mutate(
      {
        id: entry.id,
        kind: entry.kind,
        name: name.trim(),
        category,
        amount,
        isAutogiro,
        scope,
      },
      { onSuccess: onSaved }
    );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;

    if (entry.repeats && amount !== entry.amount) {
      setAskingScope(true);
      return;
    }

    commit("Onwards");
  };

  return (
    <>
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
                <option.icon size={19} strokeWidth={2} />
                {option.label}
              </button>
            ))}
          </div>
        </div>

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

        {updateEntry.isError && (
          <p className="text-sm text-[var(--color-danger)]">
            Kunde inte spara. Försök igen.
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!canSave || updateEntry.isPending}
        >
          {updateEntry.isPending ? "Sparar" : "Spara"}
        </Button>

        <Button
          type="button"
          variant="danger"
          size="lg"
          className="w-full"
          onClick={onRemove}
        >
          Ta bort
        </Button>
      </form>

      <ConfirmDialog
        open={askingScope}
        title={`Ändra ${noun.toLowerCase()} ${entry.name}`}
        body={`${formatKr(entry.amount)} → ${formatKr(amount)}. ${noun} återkommer varje månad.`}
        actions={[
          { label: `Bara ${monthName} ${year}` },
          { label: "Den här och kommande månader", tone: "alt" },
        ]}
        onPick={(index) => commit(index === 0 ? "Month" : "Onwards")}
        onCancel={() => setAskingScope(false)}
      />
    </>
  );
}
