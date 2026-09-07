import { Plus } from "lucide-react";
import type { ReactNode } from "react";

const COUNT = {
  expense: "bg-[var(--color-danger-wash)] text-[var(--color-danger)]",
  income: "bg-[var(--color-mint-wash)] text-[var(--color-mint)]",
  savings: "bg-[#7fb8ff1a] text-[var(--color-savings)]",
};

interface SectionHeaderProps {
  title: string;
  count: number;
  tone: keyof typeof COUNT;
  children?: ReactNode;
}

export function SectionHeader({
  title,
  count,
  tone,
  children,
}: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <h2 className="text-[12px] font-bold tracking-[0.1em] text-[var(--color-text-muted)] uppercase">
        {title}
      </h2>

      <span
        className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-extrabold ${COUNT[tone]}`}
      >
        {count}
      </span>

      <span className="ml-auto flex items-center gap-2">{children}</span>
    </div>
  );
}

interface ButtonProps {
  onClick: () => void;
  children: ReactNode;
}

export function AddButton({ onClick, children }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex h-[29px] items-center gap-1.5 rounded-full bg-[var(--color-mint)] px-3 text-[12.5px] font-extrabold whitespace-nowrap text-[var(--color-on-mint)] transition hover:brightness-110"
    >
      <Plus size={15} strokeWidth={3} />
      {children}
    </button>
  );
}

interface GhostProps extends ButtonProps {
  active?: boolean;
}

export function GhostButton({ onClick, active = false, children }: GhostProps) {
  return (
    <button
      onClick={onClick}
      className={`flex h-[27px] items-center gap-1.5 rounded-full px-[11px] text-[12px] font-bold whitespace-nowrap transition ${
        active
          ? "bg-[var(--color-mint-wash)] text-[var(--color-mint)] shadow-[inset_0_0_0_1px_var(--color-mint-dim)]"
          : "text-[var(--color-text-muted)] shadow-[inset_0_0_0_1px_var(--color-border)] hover:bg-[var(--color-mint-wash)] hover:text-[var(--color-mint)] hover:shadow-[inset_0_0_0_1px_var(--color-mint-dim)]"
      }`}
    >
      {children}
    </button>
  );
}
