import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "hero";
}

export function Card({
  children,
  className = "",
  variant = "default",
}: CardProps) {
  const baseClasses = "bg-[var(--color-surface)]";
  const variantClasses = {
    default: "p-4 rounded-[var(--radius-card)]",
    hero: "hero-card p-5 rounded-[var(--radius-hero)]",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}
