import { useRef, useState } from "react";
import type { ReactNode } from "react";

const REVEAL = 78;
const THRESHOLD = 38;

interface SwipeRowProps {
  onDelete: () => void;
  disabled?: boolean;
  children: ReactNode;
}

export function SwipeRow({ onDelete, disabled = false, children }: SwipeRowProps) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const opened = useRef(false);

  const handlePointerDown = (event: React.PointerEvent) => {
    if (disabled) return;
    startX.current = event.clientX;
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (startX.current === null) return;
    const base = opened.current ? -REVEAL : 0;
    const next = event.clientX - startX.current + base;
    setOffset(Math.min(0, Math.max(-REVEAL, next)));
  };

  const handlePointerEnd = () => {
    if (startX.current === null) return;
    opened.current = offset < -THRESHOLD;
    setOffset(opened.current ? -REVEAL : 0);
    startX.current = null;
    setDragging(false);
  };

  const close = () => {
    opened.current = false;
    setOffset(0);
  };

  return (
    <div className="relative mb-2 overflow-hidden rounded-[var(--radius-card)]">
      <button
        onClick={() => {
          close();
          onDelete();
        }}
        tabIndex={offset < 0 ? 0 : -1}
        className={`absolute inset-y-0 right-0 grid w-[82px] place-items-center rounded-[var(--radius-card)] bg-[var(--color-danger)] text-[13px] font-extrabold text-[#3a0d0d] transition-opacity ${
          offset < 0 ? "opacity-100" : "invisible opacity-0"
        }`}
      >
        Ta bort
      </button>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform .22s cubic-bezier(.3,.8,.3,1)",
          touchAction: "pan-y",
        }}
        className="relative"
      >
        {children}
      </div>
    </div>
  );
}
