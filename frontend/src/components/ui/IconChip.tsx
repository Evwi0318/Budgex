import type { LucideIcon } from "lucide-react";

interface IconChipProps {
  icon: LucideIcon;
}

export function IconChip({ icon: Icon }: IconChipProps) {
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-chip)] bg-[var(--color-mint-wash)] text-[var(--color-mint)]">
      <Icon size={20} strokeWidth={2.5} />
    </div>
  );
}
