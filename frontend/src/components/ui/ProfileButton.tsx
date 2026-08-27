import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { User } from "lucide-react";

// En vanlig Link som kan ta motion-gester (whileTap m.m.)
const MotionLink = motion.create(Link);

/**
 * Enda vägen till profilen sedan bottenmenyn togs bort. Absolut mot
 * appbehållaren precis som Fab, med samma kantavstånd som listans marginal,
 * och lika stor som Fab så att de läser som ett par.
 */
export function ProfileButton() {
  return (
    <MotionLink
      to="/profile"
      aria-label="Profil"
      title="Profil"
      // Samma fjäderkänsla som svepen: knappen sjunker in vid tryck och
      // studsar tillbaka när man släpper.
      whileTap={{ scale: 0.82 }}
      transition={{ type: "spring", stiffness: 420, damping: 16 }}
      style={{
        bottom: "calc(var(--fab-inset) + env(safe-area-inset-bottom))",
        height: "var(--fab-size)",
        width: "var(--fab-size)",
      }}
      className="absolute right-4 z-50 grid place-items-center rounded-full border-[1.5px] border-[var(--color-mint-dim)] bg-[var(--color-surface)] text-[var(--color-mint)] shadow-[0_6px_18px_rgba(0,0,0,0.45)] will-change-transform"
    >
      {/* Lucide-ikon i samma stil som resten av appens symboler */}
      <User size={22} strokeWidth={2} />
    </MotionLink>
  );
}
