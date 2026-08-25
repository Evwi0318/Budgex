import { useEffect } from "react";

export interface ToastMessage {
  id: number;
  text: string;
  onUndo: () => void;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

const VISIBLE_MS = 6000;

export function Toast({ toast, onDismiss }: ToastProps) {
  const id = toast?.id;

  // Nyckeln är id och inte hela objektet — en ny toast startar om klockan,
  // en omrendering med samma toast gör det inte
  useEffect(() => {
    if (id === undefined) return;

    const timer = setTimeout(onDismiss, VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  if (!toast) return null;

  return (
    <div
      role="status"
      style={{ bottom: "calc(9.75rem + env(safe-area-inset-bottom))" }}
      className="fixed left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 px-4"
    >
      <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 shadow-[0_10px_28px_rgba(0,0,0,0.6)]">
        <span className="min-w-0 flex-1 text-[13px] font-semibold text-[var(--color-text)]">
          {toast.text}
        </span>

        <button
          onClick={() => {
            toast.onUndo();
            onDismiss();
          }}
          className="shrink-0 text-[13px] font-extrabold text-[var(--color-mint)] underline underline-offset-[3px] transition active:scale-95"
        >
          Ångra
        </button>
      </div>
    </div>
  );
}
