import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

const AXIS_LOCK = 10;
/** Andel av bredden som måste passeras för att fliken ska bytas */
const COMMIT_RATIO = 0.25;
/** En snabb knyck byter flik tidigare — px per millisekund */
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
 * släpp.
 *
 * Alla paneler ligger monterade hela tiden, var och en med sin egen nyckel.
 * Monterades de i takt med svepet skulle panelen man sveper till byggas upp
 * på nytt i samma stund som den blev aktiv — den syntes som en omladdning
 * precis när fingret släpptes.
 *
 * Panelerna har fasta platser i däcket och x mäts i flikbredder, inte pixlar.
 * Ingen position beror alltså på index, så ett byte kan inte hinna slå igenom
 * en bildruta före omrenderingen och rycka tillbaka den gamla fliken.
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
  const settling = useRef<ReturnType<typeof animate> | null>(null);

  const x = useMotionValue(-index);
  const deckX = useTransform(x, (value) => `${value * 100}%`);

  // Däcket är lika högt som den högsta panelen. Ett permanent lager av den
  // storleken kostar minne hela tiden — det behövs bara medan det rör sig.
  const moving = useMotionValue(0);
  const willChange = useTransform(moving, (value) =>
    value ? "transform" : "auto"
  );

  const width = () => deckRef.current?.offsetWidth ?? 0;

  // En pågående återgång måste stoppas innan något annat rör x, annars
  // skriver den över varje ny position och svepet hackar.
  const glide = (to: number) => {
    settling.current?.stop();
    moving.set(1);
    settling.current = animate(x, to, {
      ...SETTLE,
      onComplete: () => moving.set(0),
    });
  };

  // Ett tryck på en flik i hero-kortet ska glida likadant som ett svep
  useEffect(() => {
    if (settled.current === index) return;

    settled.current = index;
    glide(-index);
    // glide är stabil mellan renderingar — den rör bara refs och motion-värden
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

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
        settling.current?.stop();
        moving.set(1);
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

    x.set(-index + resist(dx, index, count, span) / span);
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
    const next =
      (far || flick) && target >= 0 && target < count ? target : index;

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
        gesture.current = null;
        glide(-index);
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
        <motion.div style={{ x: deckX, willChange }} className="relative">
          {Array.from({ length: count }, (_, slot) => (
            <div
              key={slot}
              // Bara den aktiva panelen ligger i flödet och sätter höjden.
              // De andra hålls utanför både layout och skärmläsare.
              aria-hidden={slot !== index || undefined}
              inert={slot !== index}
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

/** Vid ytterflikarna går svepet trögt i stället för att ta emot helt */
function resist(dx: number, index: number, count: number, span: number): number {
  if ((dx > 0 && index === 0) || (dx < 0 && index === count - 1)) return dx * 0.25;

  return Math.max(-span, Math.min(span, dx));
}
