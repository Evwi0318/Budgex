import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const AXIS_LOCK = 8;
const COMMIT_RATIO = 0.32;
const SPRING = { type: "spring", damping: 30, stiffness: 380 } as const;

const TONES = {
  surface: {
    track: "bg-[var(--color-surface-2)]",
    pill: "bg-[var(--color-bg)]",
    on: "text-[var(--color-mint)]",
    off: "text-[var(--color-text-muted)]",
  },
  sunken: {
    track: "bg-[var(--color-bg)]",
    pill: "bg-[var(--color-mint)]",
    on: "text-[var(--color-on-mint)]",
    off: "text-[var(--color-text-muted)]",
  },
} as const;

interface SegmentedProps {
  options: [string, string];
  selected: number;
  onSelect: (index: number) => void;
  tone?: keyof typeof TONES;
  /** Smal variant för par som kr/% bredvid ett fält */
  compact?: boolean;
}

/**
 * Valet går att både trycka och svepa. Under svepet följer markeringen fingret
 * i realtid och lägger sig där den hamnar när man släpper.
 */
export function Segmented({
  options,
  selected,
  onSelect,
  tone = "surface",
  compact = false,
}: SegmentedProps) {
  const look = TONES[tone];
  const trackRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number; axis: "" | "x" } | null>(null);
  const dragged = useRef(false);

  const slot = useMotionValue(selected);
  const offset = useTransform(slot, (value) => `${value * 100}%`);

  useEffect(() => {
    const controls = animate(slot, selected, SPRING);
    return () => controls.stop();
  }, [selected, slot]);

  const pitch = () => (trackRef.current?.offsetWidth ?? 0) / options.length;

  const start = (event: ReactPointerEvent) => {
    dragged.current = false;

    if (event.pointerType === "mouse" && event.button !== 0) return;

    swipe.current = { x: event.clientX, y: event.clientY, axis: "" };
  };

  const move = (event: ReactPointerEvent) => {
    const from = swipe.current;
    const step = pitch();
    if (!from || step === 0) return;

    const dx = event.clientX - from.x;

    if (from.axis === "") {
      const dy = Math.abs(event.clientY - from.y);
      if (Math.abs(dx) < AXIS_LOCK && dy < AXIS_LOCK) return;

      // Lodrätt vinner: annars kan man inte scrolla arket från den här ytan
      if (Math.abs(dx) <= dy) {
        swipe.current = null;
        return;
      }

      from.axis = "x";
      dragged.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    slot.set(Math.min(options.length - 1, Math.max(0, selected + dx / step)));
  };

  const end = (event: ReactPointerEvent) => {
    const from = swipe.current;
    swipe.current = null;

    if (!from || from.axis !== "x") return;

    const dx = event.clientX - from.x;
    const step = pitch();
    const far = Math.abs(dx) > step * COMMIT_RATIO;
    const target = !far
      ? selected
      : Math.min(options.length - 1, Math.max(0, selected + (dx > 0 ? 1 : -1)));

    animate(slot, target, SPRING);
    if (target !== selected) onSelect(target);
  };

  return (
    <div
      data-no-tab-swipe
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={() => (swipe.current = null)}
      // Ett svep får inte också räknas som ett tryck på knappen under fingret
      onClickCapture={(event) => {
        if (!dragged.current) return;

        dragged.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
      style={{ touchAction: "pan-y" }}
      className={`p-1 ${look.track} ${
        compact ? "inline-block rounded-xl" : "block rounded-2xl"
      }`}
    >
      <div ref={trackRef} className="relative flex">
        <motion.span
          aria-hidden
          style={{ x: offset, width: `${100 / options.length}%` }}
          className={`absolute inset-y-0 left-0 ${
            compact ? "rounded-lg" : "rounded-xl"
          } ${look.pill}`}
        />

        {options.map((option, index) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(index)}
            aria-pressed={index === selected}
            className={`relative font-bold transition-colors ${
              compact ? "w-10 py-1.5 text-[12.5px]" : "flex-1 py-2.5 text-[13.5px]"
            } ${index === selected ? look.on : look.off}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
