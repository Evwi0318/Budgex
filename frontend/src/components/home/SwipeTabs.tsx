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

// Flikens topp när sidan står överst och hero-kortet är fullt utfällt
function topAtStart(main: HTMLElement, panel: HTMLElement) {
  const scroll = main.scrollTop;
  const hero = main.style.getPropertyValue("--hero-p");
  const shift = panel.style.transform;

  main.style.setProperty("--hero-p", "0");
  main.scrollTop = 0;
  panel.style.transform = "";
  const top = panel.getBoundingClientRect().top;

  main.style.setProperty("--hero-p", hero);
  main.scrollTop = scroll;
  panel.style.transform = shift;
  return top;
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
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const scrolling = useRef<ReturnType<typeof animate> | null>(null);
  const lift = useRef<{ from: number; y: number } | null>(null);

  const x = useMotionValue(-index);
  const deckX = useTransform(x, (value) => `${value * 100}%`);

  // Däcket är lika högt som den högsta panelen. Ett permanent lager av den
  // storleken kostar minne hela tiden — det behövs bara medan det rör sig.
  const moving = useMotionValue(0);
  const willChange = useTransform(moving, (value) =>
    value ? "transform" : "auto"
  );
  // Dolda flikar ligger absolut och skulle annars ge scroll åt en kort flik
  const overflowY = useTransform(moving, (value) => (value ? "visible" : "clip"));

  const width = () => deckRef.current?.offsetWidth ?? 0;

  // Däcket behåller höjden så hero-kortet inte scrollas ur bild, och de andra
  // flikarna läggs precis under kortet i stället för långt ovanför skärmen.
  const beginMove = () => {
    moving.set(1);
    scrolling.current?.stop();
    if (lift.current) return;

    const deck = deckRef.current;
    const hero = deck?.previousElementSibling;
    if (!deck || !hero) return;

    const y = Math.max(
      0,
      hero.getBoundingClientRect().bottom - deck.getBoundingClientRect().top
    );
    lift.current = { from: settled.current, y };
    deck.style.minHeight = `${deck.offsetHeight}px`;

    panels.current.forEach((panel, slot) => {
      if (panel) {
        panel.style.transform = slot === settled.current ? "" : `translateY(${y}px)`;
      }
    });
  };

  // En ny flik börjar överst. Sidan glider dit och fliken följer med,
  // eftersom hero-kortet växer med scrollen och ett hopp skulle rycka.
  const endMove = () => {
    moving.set(0);
    const shift = lift.current;
    lift.current = null;
    if (!shift) return;

    const deck = deckRef.current;
    const main = deck?.closest("main");
    const incoming = panels.current[settled.current];

    const reset = () => {
      if (deck) deck.style.minHeight = "";
      panels.current.forEach((panel) => {
        if (panel) panel.style.transform = "";
      });
    };

    if (!main || !incoming || settled.current === shift.from || shift.y === 0) {
      reset();
      return;
    }

    const start = main.scrollTop;
    const from = incoming.getBoundingClientRect().top;
    const to = topAtStart(main, incoming);

    scrolling.current = animate(0, 1, {
      duration: 0.35,
      ease: [0.2, 0.7, 0.3, 1],
      onUpdate: (t) => {
        main.scrollTop = start * (1 - t);
        // Hero-kortet ska byta storlek nu, inte nästa bildruta
        main.dispatchEvent(new Event("scroll"));
        incoming.style.transform = "";
        const natural = incoming.getBoundingClientRect().top;
        incoming.style.transform = `translateY(${from + (to - from) * t - natural}px)`;
      },
      onComplete: reset,
    });
  };

  const glide = (to: number) => {
    settling.current?.stop();
    beginMove();
    settling.current = animate(x, to, {
      ...SETTLE,
      onComplete: endMove,
    });
  };

  useEffect(() => {
    if (settled.current === index) return;
    beginMove();
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
        beginMove();
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

    // Fliken som redan är beslutad, inte den halvvägs framglidna positionen:
    // avbryter man en glidning pekar x fortfarande på fliken man lämnade.
    const current = settled.current;
    let next = current;

    if (far || flick) {
      next = dx < 0 ? current + 1 : current - 1;
    }

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
        gesture.current = null;
        glide(-settled.current);
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

      <motion.div ref={deckRef} style={{ overflowY }} className="relative overflow-x-clip">
        <motion.div style={{ x: deckX, willChange }} className="relative">
          {Array.from({ length: count }, (_, slot) => (
            <div
              key={slot}
              ref={(panel) => {
                panels.current[slot] = panel;
              }}
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
      </motion.div>
    </div>
  );
}
