import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { NumberField } from "../ui/NumberField";
import { categoriesFor } from "../../lib/categories";
import { getMonthName } from "../../lib/format";
import { useAddEntryMutation } from "../../hooks/useEntryMutation";
import type { EntryKind } from "../../lib/categories";

interface AddEntryFormProps {
  year: number;
  month: number;
  kind: EntryKind;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

export function AddEntryForm({
  year,
  month,
  kind,
  onSaved,
  onDirtyChange,
}: AddEntryFormProps) {
  const categories = categoriesFor(kind);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState(categories[0].value);
  const [repeats, setRepeats] = useState(kind === "Income");
  const [isAutogiro, setIsAutogiro] = useState(false);

  const addEntry = useAddEntryMutation(year, month);
  const canSave = name.trim().length > 0 && amount > 0;
  const dirty = name.trim().length > 0 || amount > 0;

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;

    addEntry.mutate(
      { kind, name: name.trim(), category, amount, isAutogiro, repeats },
      { onSuccess: onSaved }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-extrabold">
        {kind === "Income" ? "Ny inkomst" : "Ny utgift"}
      </h2>

      <label className="block">
        <Label>Namn</Label>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={40}
          placeholder={kind === "Income" ? "T.ex. Lön" : "T.ex. Hyra"}
          className="h-12 w-full rounded-2xl bg-[var(--color-surface-2)] px-4 text-base font-bold outline-none focus:border focus:border-[var(--color-mint-dim)] placeholder:font-normal placeholder:text-[var(--color-text-faint)]"
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

      <div>
        <Label>Gäller</Label>
        <Segmented
          options={[`Bara ${getMonthName(month)}`, "Varje månad"]}
          selected={repeats ? 1 : 0}
          onSelect={(index) => setRepeats(index === 1)}
        />
      </div>

      {kind === "Expense" && (
        <div>
          <Label>Betalning</Label>
          <Segmented
            options={["Betalar själv", "Autogiro"]}
            selected={isAutogiro ? 1 : 0}
            onSelect={(index) => setIsAutogiro(index === 1)}
          />
        </div>
      )}

      {addEntry.isError && (
        <p className="text-sm text-[var(--color-danger)]">
          Kunde inte spara. Försök igen.
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!canSave || addEntry.isPending}
      >
        {addEntry.isPending ? "Sparar" : "Spara"}
      </Button>
    </form>
  );
}

export const Label = ({ children }: { children: string }) => (
  <span className="mb-2 block text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
    {children}
  </span>
);

interface SegmentedProps {
  options: [string, string];
  selected: number;
  onSelect: (index: number) => void;
}

export function Segmented({ options, selected, onSelect }: SegmentedProps) {
  return (
    <div className="flex gap-1 rounded-2xl bg-[var(--color-surface-2)] p-1">
      {options.map((option, index) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(index)}
          className={`flex-1 rounded-xl py-2.5 text-[13.5px] font-bold transition ${
            index === selected
              ? "bg-[var(--color-bg)] text-[var(--color-mint)]"
              : "text-[var(--color-text-muted)]"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
