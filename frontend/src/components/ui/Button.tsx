import type { ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const variantClasses = {
  primary:
    "bg-[var(--color-mint)] text-[var(--color-on-mint)] font-bold hover:opacity-90 active:scale-[0.98]",
  ghost:
    "bg-transparent text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] active:scale-[0.98]",
  danger:
    "bg-[var(--color-danger-strong)] text-white font-bold hover:opacity-90 active:scale-[0.98]",
};

const sizeClasses = {
  sm: "px-3 py-2 text-sm rounded-[var(--radius-chip)]",
  md: "px-4 py-2.5 text-sm rounded-[var(--radius-card)]",
  lg: "px-6 py-3 h-12 text-base rounded-[var(--radius-pill)] font-bold",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseClasses = "transition-all duration-100 disabled:opacity-50";

  return (
    // className plockas ut ur props och läggs sist, annars skulle
    // en className från anroparen radera komponentens egna stilar
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
