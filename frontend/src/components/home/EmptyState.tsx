import type { ReactNode } from "react";

interface EmptyStateProps {
  emoji: string;
  title: string;
  body: string;
  action?: ReactNode;
  footnote?: string;
}

export function EmptyState({
  emoji,
  title,
  body,
  action,
  footnote,
}: EmptyStateProps) {
  return (
    <div className="px-5 pt-8 pb-2 text-center">
      <div className="mx-auto mb-3.5 grid h-14 w-14 place-items-center rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] text-2xl">
        {emoji}
      </div>

      <h4 className="mb-1.5 text-[17px] font-extrabold">{title}</h4>

      <p className="mx-auto mb-4 max-w-[270px] text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">
        {body}
      </p>

      {action}

      {footnote && (
        <p className="mx-auto mt-4 max-w-[250px] text-xs leading-relaxed text-[var(--color-text-faint)]">
          {footnote}
        </p>
      )}
    </div>
  );
}
