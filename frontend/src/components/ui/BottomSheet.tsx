import { useEffect } from "react";
import type { ReactNode } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  // Escape ska stänga arket, precis som backdrop-klick
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop — klick stänger */}
      <button
        aria-label="Stäng"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      {/* Själva arket. relative lyfter det ovanför backdropen. */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[480px] bg-[var(--color-surface)] rounded-t-[var(--radius-hero)] p-5 pb-8"
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
      >
        {/* Greppstrecket överst, ren dekoration */}
        <div
          aria-hidden="true"
          className="w-10 h-1 rounded-full bg-[var(--color-border)] mx-auto mb-5"
        />
        {children}
      </div>
    </div>
  );
}
