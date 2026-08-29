import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

const AXIS_LOCK = 10;
/** Andel av bredden som måste passeras för att fliken ska bytas */
const COMMIT_RATIO = 0.25;
/** En snabb knyck byter flik tidigare — px per millisekund */
const FLICK_SPEED = 0.5;
const FLICK_DISTANCE = 40;
const SETTLE = { type: "spring", damping: 34, stiffness: 420 } as const;

interface Gesture {
  x: number;
  y: number;
  axis: "" | "x" | "y";
  lastX: number;
  lastTime: number;
  speed: number;
}

interface SwipeTabsProps {
  index: number;
  count: number;
  onIndexChange: (index: number) => void;
  /** Ligger stilla ovanför panelerna, till exempel månadsrad och hero-kort */
  header: ReactNode;
  className?: string;
  children: (index: number) => ReactNode;
}

/**
 * Flikarna följer fingret medan man sveper i stället för att byta först vid
 * släpp. Grannpanelen monteras bara medan panelen är i rörelse, så viloläget
 * renderar lika lite som förut.
 */
export function SwipeTabs({
  index,
  count,
  onIndexChange,
  header,
  className = "",
  children,
}: SwipeTabsProps) {
  const deckRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const swiped = useRef(false);
  const settled = useRef(index);

  const x = useMotionValue(0);
  const [moving, setMoving] = useState(false);

  useMotionValueEvent(x, "change", (value) => setMoving(value !== 0));

  const width = () => deckRef.current?.offsetWidth ?? 0;

  // Ett tryck på en flik i hero-kortet ska glida likadant som ett svep
  useEffect(() => {
    if (settled.current === index) return;

    const from = settled.current;
    const span = width();
    settled.current = index;

    if (span === 0) return;

    x.set(index > from ? span : -span);
    const controls = animate(x, 0, SETTLE);

    return () => controls.stop();
  }, [index, x]);

  const start = (event: ReactPointerEvent) => {
    // Nollställs före alla avhopp: annars kan ett svep som inte följs av något
    // klick äta upp nästa tryck i stället.
    swiped.current = false;

    if (event.pointerType === "mouse" && event.button !== 0) return;

    // Rader och månadsraden har egna gester och håller sig utanför
    if ((event.target as Element).closest("[data-no-tab-swipe]")) return;

    // Ark och dialoger ligger i en portal på <body>, men deras pointer-event
    // bubblar hit ändå genom React-trädet. Fråga DOM:en direkt i stället.
    if (document.querySelector('[aria-modal="true"]')) return;

    gesture.current = {
      x: event.clientX,
      y: event.clientY,
      axis: "",
      lastX: event.clientX,
      lastTime: event.timeStamp,
      speed: 0,
    };
  };

  const move = (event: ReactPointerEvent) => {
    const from = gesture.current;
    if (!from) return;

    const dx = event.clientX - from.x;

    if (from.axis === "") {
      const dy = Math.abs(event.clientY - from.y);
      if (Math.abs(dx) < AXIS_LOCK && dy < AXIS_LOCK) return;

      from.axis = Math.abs(dx) > dy ? "x" : "y";

      if (from.axis === "x") {
        swiped.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }

    if (from.axis !== "x") return;

    const elapsed = event.timeStamp - from.lastTime;
    if (elapsed > 0) {
      from.speed = (event.clientX - from.lastX) / elapsed;
      from.lastX = event.clientX;
      from.lastTime = event.timeStamp;
    }

    x.set(resist(dx, index, count, width()));
  };

  const end = (event: ReactPointerEvent) => {
    const from = gesture.current;
    gesture.current = null;

    if (!from || from.axis !== "x") return;

    const dx = event.clientX - from.x;
    const span = width();
    const flick = Math.abs(from.speed) > FLICK_SPEED && Math.abs(dx) > FLICK_DISTANCE;
    const far = Math.abs(dx) > span * COMMIT_RATIO;
    const step = dx < 0 ? 1 : -1;
    const target = index + step;

    if ((far || flick) && target >= 0 && target < count) {
      // Panelen ligger redan på skärmen — den flyttas bara från grannplatsen
      // till mitten, och x kompenseras lika mycket så att inget hoppar.
      settled.current = target;
      x.set(x.get() + step * span);
      onIndexChange(target);
    }

    animate(x, 0, SETTLE);
  };

  return (
    <div
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={() => {
        gesture.current = null;
        animate(x, 0, SETTLE);
      }}
      // Ett svep får inte också räknas som ett tryck där fingret råkade landa
      onClickCapture={(event) => {
        if (!swiped.current) return;

        swiped.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
      style={{ touchAction: "pan-y" }}
      className={className}
    >
      {header}

      <div ref={deckRef} className="relative overflow-x-clip">
        <motion.div style={{ x }} className="relative will-change-transform">
          {moving && index > 0 && (
            <Neighbour side={-1}>{children(index - 1)}</Neighbour>
          )}

          {children(index)}

          {moving && index < count - 1 && (
            <Neighbour side={1}>{children(index + 1)}</Neighbour>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/** Grannen ligger utanför flödet, så höjden styrs av panelen som visas */
function Neighbour({ side, children }: { side: -1 | 1; children: ReactNode }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 w-full"
      style={{ transform: `translateX(${side * 100}%)` }}
    >
      {children}
    </div>
  );
}

/** Vid ytterflikarna går svepet trögt i stället för att ta emot helt */
function resist(dx: number, index: number, count: number, span: number): number {
  if ((dx > 0 && index === 0) || (dx < 0 && index === count - 1)) return dx * 0.25;

  return Math.max(-span, Math.min(span, dx));
}
