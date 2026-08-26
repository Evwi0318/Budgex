import { createPortal } from "react-dom";

interface FabProps {
  onClick: () => void;
  label: string;
}

export function Fab({ onClick, label }: FabProps) {
  // I body: fixed inuti en slide mäts mot sliden och följer med när den rör sig
  return createPortal(
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{ bottom: "calc(var(--fab-inset) + env(safe-area-inset-bottom))" }}
      className="fixed left-1/2 z-50 grid h-[var(--fab-size)] w-[var(--fab-size)] -translate-x-1/2 place-items-center rounded-full bg-[var(--color-mint)] pb-1 text-[30px] font-bold leading-none text-[var(--color-on-mint)] shadow-[0_8px_24px_rgba(0,0,0,0.5),0_0_24px_var(--glow-mint)] transition active:scale-95"
    >
      +
    </button>,
    document.body
  );
}
