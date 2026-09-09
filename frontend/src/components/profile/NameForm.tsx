import { useState } from "react";
import { Label } from "../ui/Label";
import { SheetActions, sheetField } from "../ui/SheetActions";
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
          className={sheetField}
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

      <SheetActions
        onCancel={onDone}
        saveLabel={save.isPending ? "Sparar" : "Spara"}
        disabled={save.isPending}
      />
    </form>
  );
}
