import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { User } from "lucide-react";

/**
 * Enda vägen till profilen sedan bottenmenyn togs bort. Ligger i body av
 * samma skäl som Fab: fixed inuti den scrollande listan mäts mot listan.
 */
export function ProfileButton() {
  return createPortal(
    <Link
      to="/profile"
      aria-label="Profil"
      title="Profil"
      style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
      className="fixed right-5 z-50 grid h-[46px] w-[46px] place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] shadow-[0_6px_18px_rgba(0,0,0,0.45)] transition active:scale-95"
    >
      <User size={21} />
    </Link>,
    document.body
  );
}
