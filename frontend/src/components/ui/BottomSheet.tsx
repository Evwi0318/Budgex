import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useIsPresent,
  useMotionValue,
} from "motion/react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;
const PULL_START = 12;
const SPRING = { type: "spring", damping: 25, stiffness: 300 } as const;

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && <Sheet onClose={onClose}>{children}</Sheet>}
    </AnimatePresence>,
    document.body,
  );
}

function Sheet({ onClose, children }: Omit<BottomSheetProps, "open">) {
  const dragControls = useDragControls();
  const y = useMotionValue(0);
  const pull = useRef<{ x: number; y: number; atTop: boolean } | null>(null);
  const present = useIsPresent();
  // Säkrar att vi använder rena pixlar istället för "100dvh" (som skapar lagg)
  const [startY] = useState(() => window.innerHeight);

  const beginPull = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest('input[type="range"]')) {
      pull.current = null;
      return;
    }

    pull.current = {
      x: event.clientX,
      y: event.clientY,
      atTop: event.currentTarget.scrollTop <= 0,
    };
  };

  const trackPull = (event: ReactPointerEvent<HTMLDivElement>) => {
    const from = pull.current;
    if (!from?.atTop) return;

    const dy = event.clientY - from.y;
    if (dy < PULL_START || Math.abs(event.clientX - from.x) > dy) return;

    pull.current = null;
    // LÖSNING 1: snapToCursor: false förhindrar att arket hoppar/teleporteras
    dragControls.start(event, { snapToCursor: false });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={present ? undefined : { pointerEvents: "none" }}
    >
      <motion.button
        aria-label="Stäng"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60"
      />

      <motion.div
        role="dialog"
        aria-modal={present ? "true" : undefined}
        aria-hidden={present ? undefined : true}
        inert={!present ? true : undefined}
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        // LÖSNING 2: bottom: 0 tvingar Framer Motion att ta hand om tillbakastudsen
        dragConstraints={{ top: 0, bottom: 0 }}
        // LÖSNING 3: bottom: 1 gör att tummen följs exakt 1:1 så länge man drar nedåt
        dragElastic={{ top: 0, bottom: 1 }}
        style={{ y }}
        onDragStart={() => {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }}
        onDragEnd={(_, info) => {
          if (
            info.offset.y > DISMISS_DISTANCE ||
            info.velocity.y > DISMISS_VELOCITY
          ) {
            onClose();
          }
          // Vi behöver INTE längre anropa `animate(y, 0)` här. dragConstraints sköter det!
        }}
        // Använder pixel-siffran istället för procent för direkt GPU-koppling
        initial={{ y: startY }}
        animate={{ y: 0 }}
        exit={{
          y: startY,
          // Matchar svep-utgången med en spring så den bibehåller farten tummen hade
          transition: { type: "spring", damping: 25, stiffness: 200 },
        }}
        transition={SPRING}
        className="relative flex max-h-[88dvh] w-full max-w-[480px] flex-col rounded-t-[var(--radius-hero)] bg-[var(--color-surface)] shadow-xl"
      >
        <div
          onPointerDown={(event) =>
            dragControls.start(event, { snapToCursor: false })
          }
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
          onPointerDown={beginPull}
          onPointerMove={trackPull}
          onPointerUp={() => (pull.current = null)}
          onPointerCancel={() => (pull.current = null)}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5"
          style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
