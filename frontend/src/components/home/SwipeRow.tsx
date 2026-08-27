import { useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import type { ReactNode } from "react";

const REVEAL = 88;
const FULL_SWIPE = 165;
const FULL_SWIPE_VELOCITY = 800;
const SPRING = { type: "spring", damping: 30, stiffness: 400 } as const;

interface SwipeRowProps {
  onDelete: () => void;
  disabled?: boolean;
  children: ReactNode;
}

export function SwipeRow({ onDelete, disabled = false, children }: SwipeRowProps) {
  const x = useMotionValue(0);
  const [open, setOpen] = useState(false);

  // Klippningen av rundade hörn görs på kompositorn och kan ligga en pixel
  // fel när barnet har ett eget lager. Röda ytan hålls därför helt osynlig
  // tills raden faktiskt rört sig.
  const revealed = useTransform(x, (value) => (value < -0.5 ? 1 : 0));

  const close = () => {
    animate(x, 0, SPRING);
    setOpen(false);
  };

  return (
    <motion.div
      layout
      data-no-tab-swipe
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", damping: 34, stiffness: 420 }}
      className="relative isolate mb-2 overflow-hidden rounded-[var(--radius-card)]"
    >
      <motion.button
        onClick={() => {
          close();
          onDelete();
        }}
        tabIndex={open ? 0 : -1}
        aria-hidden={!open}
        style={{ opacity: revealed }}
        className="absolute inset-y-0 right-0 grid w-[88px] place-items-center bg-[var(--color-danger)] text-[13px] font-extrabold text-[#3a0d0d]"
      >
        Ta bort
      </motion.button>

      <motion.div
        drag={disabled ? false : "x"}
        style={{ x, touchAction: "pan-y" }}
        dragConstraints={{ left: -REVEAL, right: 0 }}
        dragElastic={{ left: 0.55, right: 0 }}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          const full =
            info.offset.x < -FULL_SWIPE || info.velocity.x < -FULL_SWIPE_VELOCITY;

          if (full) {
            onDelete();
            return;
          }

          const shouldOpen = info.offset.x < -REVEAL / 2;

          animate(x, shouldOpen ? -REVEAL : 0, SPRING);
          setOpen(shouldOpen);
        }}
        onClickCapture={(event) => {
          if (!open) return;
          event.stopPropagation();
          event.preventDefault();
          close();
        }}
        className="relative will-change-transform"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
