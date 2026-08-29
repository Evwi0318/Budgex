import { useEffect } from "react";
import { createPortal } from "react-dom";
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

  // I body: ett transformerat element blir containing block för fixed inuti sig
  return createPortal(
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
            // Bara greppytan startar draget. Utan det krockar draget med
            // formulärets egen scroll så fort innehållet är högre än arket.
            dragListener={false}
            dragControls={dragControls}
            // bottom: 0 är det som drar tillbaka arket när draget inte räckte hela
            // vägen. Utan den ligger arket kvar nere, och skärmen blir bara suddig.
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 1 }}
            onDragStart={() => {
              // iOS lämnar annars tangentbordet uppe medan arket dras undan
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }
            }}
            onDragEnd={(_, info) => {
              if (info.offset.y > DISMISS_DISTANCE || info.velocity.y > DISMISS_VELOCITY) {
                onClose();
              }
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative flex max-h-[88dvh] w-full max-w-[480px] flex-col rounded-t-[var(--radius-hero)] bg-[var(--color-surface)] will-change-transform"
          >
            {/* Hela överkanten är greppyta, inte bara strecket — den täcker också
                rubrikraden, som ändå inte går att trycka på. */}
            <div
              onPointerDown={(event) => dragControls.start(event)}
              aria-hidden="true"
              className="absolute inset-x-0 top-0 z-10 h-16 cursor-grab touch-none active:cursor-grabbing"
            />

            <div
              aria-hidden="true"
              className="flex shrink-0 justify-center pt-3.5 pb-4"
            >
              <div className="h-1 w-10 rounded-full bg-[var(--color-border)]" />
            </div>

            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5"
              style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
