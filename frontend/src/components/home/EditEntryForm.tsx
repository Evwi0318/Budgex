import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EntryFields, SaveError } from "./EntryFields";
import { formatKr, getMonthName } from "../../lib/format";
import { useUpdateEntryMutation } from "../../hooks/useEntryMutation";
import type { EntryDraft } from "./EntryFields";
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

const FIELDS = [
  "name",
  "amount",
  "category",
  "isAutogiro",
  "repeats",
] as const satisfies readonly (keyof EntryDraft)[];

export function EditEntryForm({
  year,
  month,
  entry,
  onSaved,
  onRemove,
  onDirtyChange,
}: EditEntryFormProps) {
  const monthName = getMonthName(month);
  const noun = entry.kind === "Income" ? "Inkomsten" : "Utgiften";

  const [draft, setDraft] = useState<EntryDraft>(() => ({
    name: entry.name,
    amount: entry.amount,
    category: entry.category,
    isAutogiro: entry.isAutogiro,
    repeats: entry.repeats,
  }));
  const [askingScope, setAskingScope] = useState(false);

  const updateEntry = useUpdateEntryMutation(year, month);
  const canSave = draft.name.trim().length > 0 && draft.amount > 0;
  const dirty = FIELDS.some((field) => draft[field] !== entry[field]);

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  const commit = (scope: EntryScope) =>
    updateEntry.mutate(
      {
        id: entry.id,
        kind: entry.kind,
        ...draft,
        name: draft.name.trim(),
        scope,
      },
      { onSuccess: onSaved }
    );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;

    // Frågan om omfattning gäller bara ett belopp som ändras och fortsätter
    // gälla kommande månader. Slår man av "Varje månad" tar valet av Gäller över.
    if (entry.repeats && draft.repeats && draft.amount !== entry.amount) {
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

        <EntryFields
          kind={entry.kind}
          month={month}
          draft={draft}
          onChange={setDraft}
        />

        {updateEntry.isError && <SaveError error={updateEntry.error} />}

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
        body={`${formatKr(entry.amount)} → ${formatKr(draft.amount)}. ${noun} återkommer varje månad.`}
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
