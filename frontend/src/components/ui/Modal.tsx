import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        aria-label="Stäng"
        onClick={onClose}
        className="modal-veil absolute inset-0 bg-black/55 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="modal-pop desktop-scroll relative flex max-h-[88dvh] w-full max-w-[480px] flex-col overflow-y-auto overscroll-contain rounded-[var(--radius-hero)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-6"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
