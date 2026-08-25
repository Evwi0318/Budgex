import { useState } from "react";
import { Label } from "../home/AddEntryForm";
import { useUpdateNameMutation } from "../../hooks/useProfileQuery";

interface NameFormProps {
  current: string | null;
  onDone: () => void;
}

export function NameForm({ current, onDone }: NameFormProps) {
  const [name, setName] = useState(current ?? "");
  const save = useUpdateNameMutation();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    save.mutate(name.trim(), { onSuccess: onDone });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-[18px] font-extrabold">Ditt namn</h2>

      <label className="block">
        <Label>Namn</Label>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
          autoFocus
          placeholder="Evan Wibom"
          className="h-[46px] w-full rounded-xl border border-transparent bg-[var(--color-surface-2)] px-3.5 text-[15px] font-bold outline-none focus:border-[var(--color-mint-dim)] placeholder:font-semibold placeholder:text-[var(--color-text-faint)]"
        />
      </label>

      <p className="text-[12px] text-[var(--color-text-muted)]">
        Namnet syns bara för dig. Lämnar du fältet tomt tas det bort.
      </p>

      {save.isError && (
        <p className="text-sm text-[var(--color-danger)]">
          Kunde inte spara namnet. Försök igen.
        </p>
      )}

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onDone}
          className="h-12 flex-1 rounded-xl bg-[var(--color-surface-2)] text-[15px] font-extrabold text-[var(--color-text-muted)] transition active:scale-[0.98]"
        >
          Avbryt
        </button>
        <button
          type="submit"
          disabled={save.isPending}
          className="h-12 flex-1 rounded-xl bg-[var(--color-mint)] text-[15px] font-extrabold text-[var(--color-on-mint)] transition active:scale-[0.98] disabled:opacity-35"
        >
          {save.isPending ? "Sparar" : "Spara"}
        </button>
      </div>
    </form>
  );
}
