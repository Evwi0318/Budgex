interface AuthFieldProps {
  label: string;
  type: "email" | "password";
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  hint?: string;
}

export function AuthField({ label, type, value, onChange, autoComplete, hint }: AuthFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-[var(--color-text-muted)]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        className="w-full rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-mint)] focus:outline-none"
        required
      />
      {hint && <span className="mt-1.5 block text-[12px] text-[var(--color-text-muted)]">{hint}</span>}
    </label>
  );
}

export function AuthSubmit({ pending, children }: { pending: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-[var(--radius-pill)] bg-[var(--color-mint)] py-2 font-bold text-[var(--color-on-mint)] transition hover:opacity-90 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
