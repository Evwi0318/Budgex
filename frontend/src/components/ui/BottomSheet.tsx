import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 600;
/** Så långt måste fingret dras nedåt innan arket tar över från listan */
const PULL_START = 8;
/** iOS-kurvan: snabb start, lång mjuk utrullning */
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const ENTER_MS = 400;
const EXIT_MS = 250;
const RETURN_MS = 300;

// translateY, inte translate3d: den senare beräknas till en matrix3d och gör
// vilopositionen omätbar för testerna.
const CLOSED = "translateY(100%)";
const OPEN = "translateY(0px)";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  // Arket måste ligga kvar monterat medan det glider ut, annars försvinner
  // det tvärt. Det är det AnimatePresence gjorde åt oss förut.
  const [mounted, setMounted] = useState(open);
  const unmount = useCallback(() => setMounted(false), []);

  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <Sheet open={open} onClose={onClose} onExited={unmount}>
      {children}
    </Sheet>,
    document.body,
  );
}

interface SheetProps extends BottomSheetProps {
  onExited: () => void;
}

interface Drag {
  id: number;
  from: number;
  lastY: number;
  lastTime: number;
  velocity: number;
  offset: number;
}

function Sheet({ open, onClose, onExited, children }: SheetProps) {
  const sheet = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLButtonElement>(null);
  const drag = useRef<Drag | null>(null);
  const pull = useRef<{ x: number; y: number } | null>(null);

  // Webbläsaren interpolerar rörelsen. Ingen JS per bildruta, till skillnad
  // från en fjäder som räknas fram i huvudtråden.
  const glide = useCallback((to: string, ms: number) => {
    const el = sheet.current;
    if (!el) return;

    el.style.transition = `transform ${ms}ms ${EASE}`;
    el.style.transform = to;
  }, []);

  const fade = useCallback((opacity: number, ms: number) => {
    const el = backdrop.current;
    if (!el) return;

    el.style.transition = `opacity ${ms}ms ${EASE}`;
    el.style.opacity = String(opacity);
  }, []);

  useEffect(() => {
    if (!open) {
      fade(0, EXIT_MS);
      glide(CLOSED, EXIT_MS);
      const id = setTimeout(onExited, EXIT_MS);
      return () => clearTimeout(id);
    }

    // Stängt läge måste hinna målas innan transitionen får ett nytt mål,
    // annars finns inget att gå ifrån och arket hoppar rakt upp. Den andra
    // rutan håller dessutom monteringens layoutarbete borta från rörelsen.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        fade(1, ENTER_MS);
        glide(OPEN, ENTER_MS);
      });
    });

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [open, glide, fade, onExited]);

  const beginDrag = (event: ReactPointerEvent) => {
    const el = sheet.current;
    if (!el || drag.current) return;

    // iOS lämnar annars tangentbordet uppe medan arket dras undan
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    el.setPointerCapture(event.pointerId);
    el.style.transition = "none";

    drag.current = {
      id: event.pointerId,
      from: event.clientY,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocity: 0,
      offset: 0,
    };
  };

  const moveDrag = (event: ReactPointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;

    const elapsed = event.timeStamp - d.lastTime;
    if (elapsed > 0) {
      d.velocity = ((event.clientY - d.lastY) / elapsed) * 1000;
      d.lastY = event.clientY;
      d.lastTime = event.timeStamp;
    }

    // Uppåt tar arket inte emot — det ligger redan i sitt öppna läge
    d.offset = Math.max(0, event.clientY - d.from);

    // Rakt på elementet, inte via React eller en CSS-variabel: en variabel
    // räknar om stilen för varje barn i formuläret, varje bildruta.
    sheet.current?.style.setProperty("transform", `translateY(${d.offset}px)`);
  };

  const endDrag = (event: ReactPointerEvent) => {
    pull.current = null;

    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    drag.current = null;

    if (d.offset > DISMISS_DISTANCE || d.velocity > DISMISS_VELOCITY) {
      onClose();
    }

    // Alltid tillbaka upp. Stängdes arket tar utgången över i samma rendering;
    // stängdes det inte — en kasta-fråga kan ta över — ska det stå i sitt
    // öppna läge igen i stället för att ligga kvar nere.
    glide(OPEN, RETURN_MS);
  };

  // Draget får börja var som helst i arket, men bara när innehållet redan
  // ligger överst. Är listan scrollad ned hör rörelsen till listan.
  const armPull = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Reglaget dras med samma finger — det ska inte kunna dra arket med sig
    if ((event.target as Element).closest('input[type="range"]')) {
      pull.current = null;
      return;
    }

    pull.current =
      event.currentTarget.scrollTop <= 0
        ? { x: event.clientX, y: event.clientY }
        : null;
  };

  const trackPull = (event: ReactPointerEvent<HTMLDivElement>) => {
    const from = pull.current;
    if (!from || drag.current) return;

    const dy = event.clientY - from.y;
    if (dy < PULL_START || Math.abs(event.clientX - from.x) > dy) return;

    pull.current = null;
    beginDrag(event);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={open ? undefined : { pointerEvents: "none" }}
    >
      <button
        ref={backdrop}
        aria-label="Stäng"
        onClick={onClose}
        style={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60"
      />

      {/*
        Ett ark på väg ut är inte längre en dialog: det tar inga tryck, syns
        inte för skärmläsare, och svepet mellan flikarna ser ingen öppen dialog.
      */}
      <div
        ref={sheet}
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-hidden={open ? undefined : true}
        inert={!open ? true : undefined}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ transform: CLOSED }}
        className="relative flex max-h-[88dvh] w-full max-w-[480px] flex-col rounded-t-[var(--radius-hero)] bg-[var(--color-surface)] shadow-xl will-change-transform"
      >
        {/* Överkanten är alltid greppyta, även när listan är scrollad */}
        <div
          onPointerDown={beginDrag}
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
          onPointerDown={armPull}
          onPointerMove={trackPull}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5"
          style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
