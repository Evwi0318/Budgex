import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthYear } from "../../lib/format";
import { useSlideDirection } from "../../hooks/useSlideDirection";

const SWIPE_DISTANCE = 45;
const SWIPE_VELOCITY = 400;

interface MonthNavProps {
  year: number;
  month: number;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthNav({
  year,
  month,
  canGoNext,
  onPrev,
  onNext,
}: MonthNavProps) {
  const ordinal = year * 12 + month;
  const direction = useSlideDirection(ordinal);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.12}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        const swipe = info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY;
        const back = info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY;

        if (swipe && canGoNext) onNext();
        else if (back) onPrev();
      }}
      style={{ touchAction: "pan-y" }}
      className="flex touch-pan-y items-center justify-center gap-3.5 px-5 pt-1 pb-3 select-none"
    >
      <Arrow onClick={onPrev} label="Föregående månad">
        <ChevronLeft size={18} />
      </Arrow>

      <span className="relative block h-[26px] min-w-[150px] overflow-hidden text-center">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={ordinal}
            initial={{ opacity: 0, x: direction * 26 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -26 }}
            transition={{ type: "spring", damping: 30, stiffness: 380 }}
            className="absolute inset-0 text-[17px] font-bold will-change-transform"
          >
            {formatMonthYear(month, year)}
          </motion.span>
        </AnimatePresence>
      </span>

      <Arrow onClick={onNext} label="Nästa månad" disabled={!canGoNext}>
        <ChevronRight size={18} />
      </Arrow>
    </motion.div>
  );
}

interface ArrowProps {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}

function Arrow({ onClick, label, disabled = false, children }: ArrowProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-[38px] w-[38px] place-items-center rounded-[13px] bg-[var(--color-surface)] text-[var(--color-text)] transition active:scale-95 disabled:opacity-25"
    >
      {children}
    </button>
  );
}
