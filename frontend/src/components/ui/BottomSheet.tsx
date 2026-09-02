import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  animate,
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
const RETURN = { type: "spring", damping: 30, stiffness: 400 } as const;
const EXIT = { duration: 0.2, ease: [0.32, 0.72, 0, 1] } as const;

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
    dragControls.start(event);
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
        exit={{ opacity: 0, transition: EXIT }}
        transition={{ duration: 0.2 }}
        // Backdrop-blur borttagen. En solid semi-transparent bakgrund räcker
        // och frigör GPU-kraft så att arket kan flyga upp mjukt.
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
        dragConstraints={{ top: 0 }}
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

          animate(y, 0, RETURN);
        }}
        // "100dvh" istället för "100%". Vi flyttar arket utanför skärmen
        // baserat på fönsterhöjden istället för elementets höjd. Det slipper
        // trigga en onödig storleksberäkning (reflow) precis när det renderas.
        initial={{ y: "100dvh" }}
        animate={{ y: 0 }}
        exit={{ y: "100dvh", transition: EXIT }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        // will-change-transform borttagen
        className="relative flex max-h-[88dvh] w-full max-w-[480px] flex-col rounded-t-[var(--radius-hero)] bg-[var(--color-surface)]"
      >
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
