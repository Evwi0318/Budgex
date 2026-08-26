import { useEffect } from "react";
import { createPortal } from "react-dom";

export interface DialogAction {
  label: string;
  tone?: "primary" | "alt" | "danger";
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  actions: DialogAction[];
  cancelLabel?: string;
  onPick: (index: number) => void;
  onCancel: () => void;
}

const toneClasses = {
  primary:
    "bg-[var(--color-mint)] text-[var(--color-on-mint)] active:scale-[0.98]",
  alt: "border border-[var(--color-mint-dim)] text-[var(--color-mint)] active:scale-[0.98]",
  danger:
    "bg-[var(--color-danger-strong)] text-white active:scale-[0.98]",
};

export function ConfirmDialog({
  open,
  title,
  body,
  actions,
  cancelLabel,
  onPick,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  // I body, av samma skäl som BottomSheet
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
      <button
        aria-label="Stäng"
        onClick={onCancel}
        className="absolute inset-0 bg-black/70"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[380px] rounded-[var(--radius-hero)] bg-[var(--color-surface)] p-5"
      >
        <p className="text-[17px] font-extrabold">{title}</p>
        <p className="mt-2 mb-5 text-[13.5px] leading-snug text-[var(--color-text-muted)]">
          {body}
        </p>

        {actions.map((action, index) => (
          <button
            key={action.label}
            onClick={() => onPick(index)}
            className={`mb-3 h-12 w-full rounded-[var(--radius-pill)] text-base font-bold transition ${
              toneClasses[action.tone ?? (index === 0 ? "primary" : "alt")]
            }`}
          >
            {action.label}
          </button>
        ))}

        {cancelLabel && (
          <button
            onClick={onCancel}
            className="mt-2 h-12 w-full rounded-[var(--radius-pill)] border border-[var(--color-border)] text-base font-bold text-[var(--color-text)] transition active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
