import type { ReactNode } from "react";

interface EyebrowProps {
  children: ReactNode;
  className?: string;
}

export function Eyebrow({ children, className = "" }: EyebrowProps) {
  return (
    <div
      className={`text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-faint)] ${className}`}
    >
      {children}
    </div>
  );
}
