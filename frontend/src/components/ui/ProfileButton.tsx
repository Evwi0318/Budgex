import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useProfileQuery } from "../../hooks/useProfileQuery";
import { initials } from "../../lib/initials";

/**
 * Enda vägen till profilen sedan bottenmenyn togs bort. Absolut mot
 * appbehållaren precis som Fab, med samma kantavstånd som listans marginal,
 * och lika stor som Fab så att de läser som ett par.
 */
export function ProfileButton() {
  const { userEmail } = useAuth();
  const { data: profile } = useProfileQuery();

  const email = profile?.email ?? userEmail ?? "";

  return (
    <Link
      to="/profile"
      aria-label="Profil"
      title="Profil"
      style={{
        bottom: "calc(var(--fab-inset) + env(safe-area-inset-bottom))",
        height: "var(--fab-size)",
        width: "var(--fab-size)",
      }}
      className="absolute right-4 z-50 grid place-items-center rounded-full border-[1.5px] border-[var(--color-mint-dim)] bg-[var(--color-surface)] text-[17px] font-bold tracking-tight text-[var(--color-mint)] shadow-[0_6px_18px_rgba(0,0,0,0.45)] transition active:scale-95"
    >
      {initials(profile?.name ?? null, email)}
    </Link>
  );
}
