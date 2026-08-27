import { createPortal } from "react-dom";
import type { HomeTab } from "../../context/MonthContext";

interface FabProps {
  tab: HomeTab;
  onClick: () => void;
}

/** Kort etikett på knappen, full formulering för skärmläsaren */
const LOOK = {
  Income: {
    label: "Inkomst",
    aria: "Lägg till inkomst",
    bg: "var(--color-mint)",
    text: "var(--color-on-mint)",
    glow: "var(--glow-mint)",
  },
  Expense: {
    label: "Utgift",
    aria: "Lägg till utgift",
    bg: "var(--color-danger)",
    text: "var(--color-on-danger)",
    glow: "var(--glow-danger)",
  },
  Savings: {
    label: "Sparkonto",
    aria: "Lägg till sparkonto",
    bg: "var(--color-savings)",
    text: "var(--color-on-savings)",
    glow: "var(--glow-savings)",
  },
} as const;

export function Fab({ tab, onClick }: FabProps) {
  const look = LOOK[tab];

  // I body: fixed inuti den scrollande listan mäts mot listan, inte skärmen
  return createPortal(
    <button
      onClick={onClick}
      title={look.aria}
      aria-label={look.aria}
      style={{
        bottom: "calc(var(--fab-inset) + env(safe-area-inset-bottom))",
        height: "var(--fab-size)",
        backgroundColor: look.bg,
        color: look.text,
        boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 24px ${look.glow}`,
        transition:
          "background-color .22s var(--ease-hero), color .22s var(--ease-hero), box-shadow .22s var(--ease-hero)",
      }}
      className="fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-5 text-[16px] font-extrabold active:scale-95"
    >
      <span className="text-[22px] leading-none font-bold">+</span>
      {look.label}
    </button>,
    document.body
  );
}
