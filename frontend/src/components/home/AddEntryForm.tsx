import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { EntryFields, SaveError } from "./EntryFields";
import { categoriesFor } from "../../lib/categories";
import { useAddEntryMutation } from "../../hooks/useEntryMutation";
import type { EntryDraft } from "./EntryFields";
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
  const [draft, setDraft] = useState<EntryDraft>(() => ({
    name: "",
    amount: 0,
    category: categoriesFor(kind)[0].value,
    isAutogiro: false,
    repeats: kind === "Income",
  }));

  const addEntry = useAddEntryMutation(year, month);
  const canSave = draft.name.trim().length > 0 && draft.amount > 0;
  const dirty = draft.name.trim().length > 0 || draft.amount > 0;

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;

    addEntry.mutate(
      { kind, ...draft, name: draft.name.trim() },
      { onSuccess: onSaved }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-extrabold">
        {kind === "Income" ? "Ny inkomst" : "Ny utgift"}
      </h2>

      <EntryFields
        kind={kind}
        month={month}
        draft={draft}
        onChange={setDraft}
        placeholder={kind === "Income" ? "T.ex. Lön" : "T.ex. Hyra"}
      />

      {addEntry.isError && <SaveError error={addEntry.error} />}

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
