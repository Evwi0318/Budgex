import { useState } from "react";
import { Label } from "../ui/Label";
import { SheetActions, sheetField } from "../ui/SheetActions";
import { useChangePasswordMutation } from "../../hooks/useProfileQuery";

const MIN_LENGTH = 8;

interface PasswordFormProps {
  onDone: () => void;
}

export function PasswordForm({ onDone }: PasswordFormProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const change = useChangePasswordMutation();

  const tooShort = next.length > 0 && next.length < MIN_LENGTH;
  const canSave = current.length > 0 && next.length >= MIN_LENGTH;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;

    change.mutate(
      { currentPassword: current, newPassword: next },
      { onSuccess: onDone }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-[18px] font-extrabold">Byt lösenord</h2>

      <label className="block">
        <Label>Nuvarande lösenord</Label>
        <Field value={current} onChange={setCurrent} autoFocus />
      </label>

      <label className="block">
        <Label>Nytt lösenord</Label>
        <Field value={next} onChange={setNext} />
        <span className="mt-1.5 block text-[12px] text-[var(--color-text-muted)]">
          Minst {MIN_LENGTH} tecken.
        </span>
      </label>

      {change.isError && (
        <p className="text-sm text-[var(--color-danger)]">
          Bytet gick inte igenom. Kontrollera att det nuvarande lösenordet
          stämmer och att det nya uppfyller kraven.
        </p>
      )}

      <SheetActions
        onCancel={onDone}
        saveLabel={
          change.isPending
            ? "Byter"
            : tooShort
              ? `Minst ${MIN_LENGTH} tecken`
              : "Byt"
        }
        disabled={!canSave || change.isPending}
      />
    </form>
  );
}

interface FieldProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

function Field({ value, onChange, autoFocus = false }: FieldProps) {
  return (
    <input
      type="password"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      autoFocus={autoFocus}
      autoComplete={autoFocus ? "current-password" : "new-password"}
      className={sheetField}
    />
  );
}
