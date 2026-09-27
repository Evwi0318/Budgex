export const sheetField =
  "h-[46px] w-full rounded-xl border border-transparent bg-[var(--color-surface-2)] px-3.5 text-[15px] font-bold outline-none focus:border-[var(--color-mint-dim)] placeholder:font-semibold placeholder:text-[var(--color-text-faint)]";

interface SheetActionsProps {
  onCancel: () => void;
  onSave?: () => void;
  saveLabel: string;
  disabled?: boolean;
}

export function SheetActions({
  onCancel,
  onSave,
  saveLabel,
  disabled = false,
}: SheetActionsProps) {
  return (
    <div className="flex gap-2.5">
      <button
        type="button"
        onClick={onCancel}
        className="h-12 flex-1 rounded-xl bg-[var(--color-surface-2)] text-[15px] font-extrabold text-[var(--color-text-muted)] transition active:scale-[0.98]"
      >
        Avbryt
      </button>
      <button
        type={onSave ? "button" : "submit"}
        onClick={onSave}
        disabled={disabled}
        className="h-12 flex-1 rounded-xl bg-[var(--color-mint)] text-[15px] font-extrabold text-[var(--color-on-mint)] transition active:scale-[0.98] disabled:opacity-35"
      >
        {saveLabel}
      </button>
    </div>
  );
}
