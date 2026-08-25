interface FabProps {
  onClick: () => void;
  label: string;
}

export function Fab({ onClick, label }: FabProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        right: "max(20px, calc(50vw - 240px))",
        bottom: "calc(5.5rem + env(safe-area-inset-bottom))",
      }}
      className="fixed z-50 grid h-[58px] w-[58px] place-items-center rounded-full bg-[var(--color-mint)] pb-1 text-[30px] font-bold leading-none text-[var(--color-on-mint)] shadow-[0_8px_24px_rgba(0,0,0,0.5),0_0_24px_var(--glow-mint)] transition active:scale-95"
    >
      +
    </button>
  );
}
