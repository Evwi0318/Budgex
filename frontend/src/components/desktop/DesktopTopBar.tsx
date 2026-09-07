import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMonth } from "../../hooks/useMonth";
import { useAuth } from "../../hooks/useAuth";
import { useProfileQuery } from "../../hooks/useProfileQuery";
import { formatMonthYear } from "../../lib/format";
import { initials } from "../../lib/initials";
import { isPast } from "../../lib/month";
import type { ReactNode } from "react";

export function DesktopTopBar() {
  const { pathname } = useLocation();
  const { year, month, goToPrevMonth, goToNextMonth } = useMonth();
  const { userEmail } = useAuth();
  const { data: profile } = useProfileQuery();

  const email = profile?.email ?? userEmail ?? "";
  const name = profile?.name ?? null;

  return (
    <header className="grid h-[66px] shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-[var(--color-border)] px-[clamp(18px,3vw,40px)]">
      <Link
        to="/"
        className="flex items-center gap-2.5 text-[16px] font-extrabold tracking-[-0.02em]"
      >
        <span className="grid h-[25px] w-[25px] place-items-center rounded-lg bg-[var(--color-mint)] text-[14px] font-extrabold text-[var(--color-on-mint)]">
          B
        </span>
        Budgex
      </Link>

      {pathname === "/" ? (
        <div className="flex items-center justify-self-center gap-2.5">
          <Arrow onClick={goToPrevMonth} label="Föregående månad">
            <ChevronLeft size={19} />
          </Arrow>

          <span className="min-w-[186px] text-center text-[21px] font-bold tracking-[-0.02em]">
            {formatMonthYear(month, year)}
          </span>

          <Arrow
            onClick={goToNextMonth}
            label="Nästa månad"
            disabled={!isPast({ year, month })}
          >
            <ChevronRight size={19} />
          </Arrow>
        </div>
      ) : (
        <span />
      )}

      <Link
        to="/profile"
        aria-label="Profil"
        title={name ?? email}
        className="grid h-9 w-9 place-items-center justify-self-end rounded-full bg-[var(--color-surface)] text-[12.5px] font-extrabold text-[var(--color-mint)] shadow-[inset_0_0_0_1.5px_var(--color-mint-dim)] transition hover:brightness-125"
      >
        {initials(name, email)}
      </Link>
    </header>
  );
}

interface ArrowProps {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: ReactNode;
}

function Arrow({ onClick, label, disabled = false, children }: ArrowProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-[11px] text-[var(--color-text-muted)] transition not-disabled:hover:bg-[var(--color-surface)] not-disabled:hover:text-[var(--color-text)] disabled:opacity-25"
    >
      {children}
    </button>
  );
}
