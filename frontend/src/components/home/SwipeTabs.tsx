import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

const AXIS_LOCK = 10;
const COMMIT_RATIO = 0.25;
const FLICK_SPEED = 0.5;
const FLICK_DISTANCE = 40;
const SETTLE = {
  type: "spring",
  damping: 41,
  stiffness: 420,
  restDelta: 0.0005,
  restSpeed: 0.01,
} as const;

interface Gesture {
  x: number;
  y: number;
  axis: "" | "x" | "y";
  lastX: number;
  lastTime: number;
  speed: number;
  startX: number; // Avgörande: sparar den faktiska fysiska positionen när svepet börjar
}

interface SwipeTabsProps {
  index: number;
  count: number;
  onIndexChange: (index: number) => void;
  header: ReactNode;
  className?: string;
  children: (index: number) => ReactNode;
}

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
  const settling = useRef<ReturnType<typeof animate> | null>(null);

  const x = useMotionValue(-index);
  const deckX = useTransform(x, (value) => `${value * 100}%`);

  const width = () => deckRef.current?.offsetWidth ?? 0;

  const glide = (to: number) => {
    settling.current?.stop();
    settling.current = animate(x, to, SETTLE);
  };

  useEffect(() => {
    if (settled.current === index) return;
    settled.current = index;
    glide(-index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const start = (event: ReactPointerEvent) => {
    swiped.current = false;

    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as Element).closest("[data-no-tab-swipe]")) return;
    if (document.querySelector('[aria-modal="true"]')) return;

    gesture.current = {
      x: event.clientX,
      y: event.clientY,
      axis: "",
      lastX: event.clientX,
      lastTime: event.timeStamp,
      speed: 0,
      startX: x.get(), // Fånga exakt var panelen befinner sig visuellt just nu
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
        settling.current?.stop();
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

    const span = width();
    if (span === 0) return;

    // Räkna från startX istället för från Reacts 'index' prop
    let nextX = from.startX + dx / span;

    // Motstånd om vi försöker svepa förbi första eller sista fliken
    if (nextX > 0) {
      nextX = nextX * 0.25;
    } else if (nextX < -(count - 1)) {
      const over = nextX - -(count - 1);
      nextX = -(count - 1) + over * 0.25;
    }

    x.set(nextX);
  };

  const end = (event: ReactPointerEvent) => {
    const from = gesture.current;
    gesture.current = null;

    if (!from || from.axis !== "x") return;

    const dx = event.clientX - from.x;
    const span = width();
    const flick =
      Math.abs(from.speed) > FLICK_SPEED && Math.abs(dx) > FLICK_DISTANCE;
    const far = Math.abs(dx) > span * COMMIT_RATIO;

    // Utgå från fliken vi var på när svepet BÖRJADE, inte vart React tror vi är
    const startIndex = Math.round(-from.startX);
    let next = startIndex;

    if (far || flick) {
      next = dx < 0 ? startIndex + 1 : startIndex - 1;
    }

    // Se till att vi inte landar utanför arrayen
    next = Math.max(0, Math.min(count - 1, next));

    if (next !== index) {
      settled.current = next;
      onIndexChange(next);
    }

    glide(-next);
  };

  return (
    <div
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={() => {
        if (!gesture.current) return;
        const startIndex = Math.round(-gesture.current.startX);
        gesture.current = null;
        glide(-startIndex);
      }}
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
        {/* willChange borttaget för att förhindra GPU-blinkningar */}
        <motion.div style={{ x: deckX }} className="relative">
          {Array.from({ length: count }, (_, slot) => (
            <div
              key={slot}
              aria-hidden={slot !== index || undefined}
              inert={slot !== index ? true : undefined}
              className={
                slot === index
                  ? "relative"
                  : "pointer-events-none absolute top-0 w-full"
              }
              style={{ left: `${slot * 100}%` }}
            >
              {children(slot)}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
