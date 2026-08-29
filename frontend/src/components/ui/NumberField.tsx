import { parseAmount } from "../../lib/amount";

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** Förklarande rad under fältet, t.ex. var siffran ska hämtas ifrån */
  hint?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  hint,
}: NumberFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-[var(--color-text-muted)]">
        {label}
      </span>

      <div className="flex items-center gap-2 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-card)] px-4 h-12 focus-within:border-[var(--color-mint)]">
        <input
          // text + inputMode ger sifferbord på mobil utan att webbläsaren
          // ritar upp- och nedpilar som type="number" gör
          type="text"
          inputMode="numeric"
          // En nolla visas som tomt fält, annars måste man radera den
          // för hand innan man kan skriva sitt belopp
          value={value === 0 ? "" : value}
          placeholder="0"
          onChange={(event) => onChange(parseAmount(event.target.value))}
          className="flex-1 min-w-0 bg-transparent text-[17px] font-extrabold text-[var(--color-text)] tabular-nums outline-none placeholder:text-[var(--color-text-faint)] placeholder:font-normal"
        />
        <span className="text-[15px] text-[var(--color-text-muted)] shrink-0">
          kr
        </span>
      </div>

      {hint && (
        <span className="block text-xs text-[var(--color-text-muted)] mt-2">
          {hint}
        </span>
      )}
    </label>
  );
}
