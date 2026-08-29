import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const AXIS_LOCK = 8;
const COMMIT_RATIO = 0.32;
/** Lodrätt måste vara tydligt större för att räknas som en scroll och inte ett svep */
const VERTICAL_BIAS = 1.3;
// Dämpningen är satt så att fjädern inte svänger förbi målet: markeringen
// ligger i kanten av spåret, och en översläng syns som att den åker utanför.
const SPRING = { type: "spring", damping: 45, stiffness: 500 } as const;

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
  const last = options.length - 1;

  const trackRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number; axis: "" | "x" } | null>(null);
  const dragged = useRef(false);

  const slot = useMotionValue(selected);
  // Klamras här och inte bara i gesten: annars kan fjädern ta markeringen
  // förbi ytterläget ett ögonblick, och då sticker den ut ur spåret.
  const offset = useTransform(
    slot,
    (value) => `${Math.min(last, Math.max(0, value)) * 100}%`
  );
  const settling = useRef<ReturnType<typeof animate> | null>(null);

  // En pågående animation måste stoppas innan något annat rör markeringen,
  // annars skriver den över varje ny position under nästa svep.
  const glide = (target: number) => {
    settling.current?.stop();
    settling.current = animate(slot, target, SPRING);
  };

  useEffect(() => {
    glide(selected);
    // glide rör bara refs och motion-värdet, och är stabil mellan renderingar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const pitch = () => (trackRef.current?.offsetWidth ?? 0) / options.length;

  // Markeringen ska alltid hamna på en hel plats. Utan det kan den bli
  // stående mitt emellan när gesten avbryts, till exempel av en scroll.
  const settle = (target: number) => {
    glide(target);
    if (target !== selected) onSelect(target);
  };

  const cancel = () => {
    if (!swipe.current) return;

    swipe.current = null;
    glide(selected);
  };

  const start = (event: ReactPointerEvent) => {
    dragged.current = false;

    if (event.pointerType === "mouse" && event.button !== 0) return;

    swipe.current = { x: event.clientX, y: event.clientY, axis: "" };
  };

  const move = (event: ReactPointerEvent) => {
    const from = swipe.current;
    const step = pitch();
    if (!from || step <= 0) return;

    const dx = event.clientX - from.x;

    if (from.axis === "") {
      const dy = Math.abs(event.clientY - from.y);
      if (Math.abs(dx) < AXIS_LOCK && dy < AXIS_LOCK) return;

      // Lodrätt vinner bara när det är tydligt lodrätt — en tumme håller sig
      // sällan på en rak linje, och svepet ska ändå gå fram
      if (dy > Math.abs(dx) * VERTICAL_BIAS) {
        swipe.current = null;
        return;
      }

      from.axis = "x";
      dragged.current = true;
      settling.current?.stop();
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    slot.set(Math.min(last, Math.max(0, selected + dx / step)));
  };

  const end = (event: ReactPointerEvent) => {
    const from = swipe.current;
    swipe.current = null;

    if (!from || from.axis !== "x") return;

    const dx = event.clientX - from.x;
    const step = pitch();
    const far = step > 0 && Math.abs(dx) > step * COMMIT_RATIO;

    settle(
      far ? Math.min(last, Math.max(0, selected + (dx > 0 ? 1 : -1))) : selected
    );
  };

  return (
    <div
      data-no-tab-swipe
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={cancel}
      // setPointerCapture flyttar touch-capture hit från knappen under fingret,
      // och webbläsaren skickar då lostpointercapture som bubblar upp. Bara
      // spårets eget tapp betyder att gesten faktiskt är slut.
      onLostPointerCapture={(event) => {
        if (event.target === event.currentTarget) cancel();
      }}
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
