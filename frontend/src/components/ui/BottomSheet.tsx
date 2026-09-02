import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useIsPresent,
  useMotionValue,
} from "motion/react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import React from "react";

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;
const PULL_START = 12;
const ENTER = { type: "spring", damping: 30, stiffness: 300 } as const;
const EXIT = { duration: 0.22, ease: [0.32, 0.72, 0, 1] } as const;

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  // Memoize children to prevent re-renders of the sheet content
  const memoizedChildren = useMemo(() => children, [children]);

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
      {open && <Sheet onClose={onClose}>{memoizedChildren}</Sheet>}
    </AnimatePresence>,
    document.body,
  );
}

// Memoize the Sheet component to avoid re-renders when its parent updates
const Sheet = React.memo(function Sheet({
  onClose,
  children,
}: Omit<BottomSheetProps, "open">) {
  const dragControls = useDragControls();
  const y = useMotionValue(0);
  const pull = useRef<{ x: number; y: number; atTop: boolean } | null>(null);

  const [draggable, setDraggable] = useState(false);
  const [ready, setReady] = useState(false);

  // Wait two frames before starting the animation to let the sheet mount
  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  const present = useIsPresent();

  const beginPull = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest('input[type="range"]')) {
      pull.current = null;
      return;
    }
    pull.current = {
      x: event.clientX,
      y: event.clientY,
      atTop: event.currentTarget.scrollTop <= 0,
    };
  }, []);

  const trackPull = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const from = pull.current;
      if (!from?.atTop) return;

      const dy = event.clientY - from.y;
      if (dy < PULL_START || Math.abs(event.clientX - from.x) > dy) {
        return;
      }
      pull.current = null;
      dragControls.start(event, { snapToCursor: false });
    },
    [dragControls],
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
      if (
        info.offset.y > DISMISS_DISTANCE ||
        info.velocity.y > DISMISS_VELOCITY
      ) {
        onClose();
      }
    },
    [onClose],
  );

  const handleDragStart = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={present ? undefined : { pointerEvents: "none" }}
    >
      {/* Backdrop */}
      <motion.button
        aria-label="Close"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60"
      />

      {/* Sheet */}
      <motion.div
        role="dialog"
        aria-modal={present ? "true" : undefined}
        aria-hidden={present ? undefined : true}
        inert={!present ? true : undefined}
        drag={draggable ? "y" : false}
        onAnimationComplete={() => setDraggable(true)}
        dragListener={false}
        dragControls={draggable ? dragControls : undefined}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 1 }}
        dragMomentum={false} // Reduce physics calculations during drag
        style={{
          y,
          willChange: "transform",
          transform: "translateZ(0)", // Force GPU layer
          contain: "layout style paint", // Isolate layout and paint
        }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        initial={{ y: "100%" }}
        animate={ready ? { y: 0 } : { y: "100%" }}
        exit={{ y: "100%", transition: EXIT }}
        transition={ENTER}
        className="relative flex max-h-[88dvh] w-full max-w-[480px] flex-col rounded-t-[var(--radius-hero)] bg-[var(--color-surface)] shadow-xl will-change-transform"
      >
        {/* Drag handle area */}
        <div
          onPointerDown={(event) =>
            dragControls.start(event, { snapToCursor: false })
          }
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-10 h-16 cursor-grab touch-none active:cursor-grabbing"
        />

        {/* Visual handle */}
        <div
          aria-hidden="true"
          className="flex shrink-0 justify-center pt-3.5 pb-4"
        >
          <div className="h-1 w-10 rounded-full bg-[var(--color-border)]" />
        </div>

        {/* Scrollable content */}
        <div
          onPointerDown={beginPull}
          onPointerMove={trackPull}
          onPointerUp={() => (pull.current = null)}
          onPointerCancel={() => (pull.current = null)}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5"
          style={{
            paddingBottom: "calc(2rem + env(safe-area-inset-bottom))",
          }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
});
