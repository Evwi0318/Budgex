import { useEffect } from "react";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import type { ReactNode } from "react";

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  const dragControls = useDragControls();

  // Escape ska stänga arket, precis som backdrop-klick
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.button
            aria-label="Stäng"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            drag="y"
            // Bara greppstrecket startar draget. Utan det krockar draget med
            // formulärets egen scroll så fort innehållet är högre än arket.
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > DISMISS_DISTANCE || info.velocity.y > DISMISS_VELOCITY) {
                onClose();
              }
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[480px] rounded-t-[var(--radius-hero)] bg-[var(--color-surface)] px-5 pb-8 will-change-transform"
            style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
          >
            <div
              onPointerDown={(event) => dragControls.start(event)}
              aria-hidden="true"
              className="-mx-5 flex cursor-grab touch-none justify-center px-5 pt-3.5 pb-4 active:cursor-grabbing"
            >
              <div className="h-1 w-10 rounded-full bg-[var(--color-border)]" />
            </div>

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
