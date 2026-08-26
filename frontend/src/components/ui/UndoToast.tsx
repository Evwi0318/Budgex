import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

interface UndoToastProps {
  message: string | null;
  onUndo: () => void;
}

export function UndoToast({ message, onUndo }: UndoToastProps) {
  // I body, och härlett ur FAB:ens token så att det alltid hamnar precis
  // ovanför plusknappen — även om knappens läge ändras
  return createPortal(
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: "spring", damping: 28, stiffness: 340 }}
          role="status"
          className="fixed inset-x-0 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-[400px] items-center gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3.5 text-[14px] font-bold will-change-transform"
          style={{ bottom: "calc(var(--toast-bottom) + env(safe-area-inset-bottom))" }}
        >
          <span className="min-w-0 flex-1 truncate">{message}</span>

          <button
            onClick={onUndo}
            className="shrink-0 text-[14px] font-extrabold text-[var(--color-mint)] active:scale-95"
          >
            Ångra
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
