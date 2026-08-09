import type { LucideIcon } from "lucide-react";

interface IconChipProps {
  icon: LucideIcon;
  tone?: "mint" | "muted";
  size?: "sm" | "md";
}

export function IconChip({
  icon: Icon,
  tone = "mint",
  size = "md",
}: IconChipProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
  };

  const toneClasses = {
    mint: "bg-[var(--color-mint-wash)] text-[var(--color-mint)]",
    muted: "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]",
  };

  return (
    <div
      className={`flex items-center justify-center rounded-[var(--radius-chip)] ${sizeClasses[size]} ${toneClasses[tone]}`}
    >
      <Icon size={20} strokeWidth={2.5} />
    </div>
  );
}
