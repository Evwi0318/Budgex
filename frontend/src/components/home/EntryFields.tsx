import { Label } from "../ui/Label";
import { NumberField } from "../ui/NumberField";
import { Segmented } from "../ui/Segmented";
import { categoriesFor } from "../../lib/categories";
import { getMonthName } from "../../lib/format";
import { saveError } from "../../lib/apiError";
import type { EntryKind } from "../../lib/categories";

export interface EntryDraft {
  name: string;
  amount: number;
  category: string;
  isAutogiro: boolean;
  repeats: boolean;
}

interface EntryFieldsProps {
  kind: EntryKind;
  month: number;
  draft: EntryDraft;
  onChange: (draft: EntryDraft) => void;
  placeholder?: string;
}

export function EntryFields({
  kind,
  month,
  draft,
  onChange,
  placeholder,
}: EntryFieldsProps) {
  const set = (patch: Partial<EntryDraft>) => onChange({ ...draft, ...patch });

  return (
    <>
      <label className="block">
        <Label>Namn</Label>
        <input
          type="text"
          value={draft.name}
          onChange={(event) => set({ name: event.target.value })}
          maxLength={40}
          placeholder={placeholder}
          className="h-12 w-full rounded-2xl bg-[var(--color-surface-2)] px-4 text-base font-bold outline-none focus:border focus:border-[var(--color-mint-dim)] placeholder:font-normal placeholder:text-[var(--color-text-faint)]"
        />
      </label>

      <NumberField
        label="Belopp"
        value={draft.amount}
        onChange={(amount) => set({ amount })}
      />

      <div>
        <Label>Kategori</Label>
        <div className="grid grid-cols-4 gap-2">
          {categoriesFor(kind).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => set({ category: option.value })}
              aria-pressed={option.value === draft.category}
              className={`flex flex-col items-center gap-1 rounded-[14px] py-2.5 text-[10px] font-bold transition ${
                option.value === draft.category
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
          selected={draft.repeats ? 1 : 0}
          onSelect={(index) => set({ repeats: index === 1 })}
        />
      </div>

      {kind === "Expense" && (
        <div>
          <Label>Betalning</Label>
          <Segmented
            options={["Betalar själv", "Autogiro"]}
            selected={draft.isAutogiro ? 1 : 0}
            onSelect={(index) => set({ isAutogiro: index === 1 })}
          />
        </div>
      )}
    </>
  );
}

export function SaveError({ error }: { error: unknown }) {
  return (
    <p className="text-sm text-[var(--color-danger)]">{saveError(error)}</p>
  );
}
