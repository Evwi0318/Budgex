import type { ReactNode } from "react";
import { Logo } from "../ui/Logo";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] p-4">
      <div className="w-full max-w-[480px] rounded-[var(--radius-card)] bg-[var(--color-surface)] p-8">
        <h1 className="mb-6 text-xl text-[var(--color-text)]">
          <Logo size={28} />
        </h1>
        {children}
      </div>
    </div>
  );
}

export function AuthMessage({ tone, children }: { tone: "danger" | "info"; children: ReactNode }) {
  const colors =
    tone === "danger"
      ? "bg-[var(--color-danger-wash)] text-[var(--color-danger)]"
      : "bg-[var(--color-mint-wash)] text-[var(--color-text)]";

  return (
    <div role={tone === "danger" ? "alert" : "status"} className={`mb-4 rounded-[var(--radius-card)] p-3 ${colors}`}>
      {children}
    </div>
  );
}
