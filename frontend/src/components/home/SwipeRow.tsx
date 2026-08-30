import { animate, motion, useMotionValue, useTransform } from "motion/react";
import type { ReactNode } from "react";

const REVEAL = 88;
const FULL_SWIPE = 165;
const FULL_SWIPE_VELOCITY = 800;
const SPRING = { type: "spring", damping: 30, stiffness: 400 } as const;

interface SwipeRowProps {
  onDelete: () => void;
  disabled?: boolean;
  children: ReactNode;
}

export function SwipeRow({ onDelete, disabled = false, children }: SwipeRowProps) {
  const x = useMotionValue(0);

  // Klippningen av rundade hörn görs på kompositorn och kan ligga en pixel
  // fel när barnet har ett eget lager. Röda ytan hålls därför helt osynlig
  // tills raden faktiskt rört sig.
  const revealed = useTransform(x, (value) => (value < -0.5 ? 1 : 0));

  // Eget lager bara medan raden faktiskt rör sig. Ligger will-change kvar
  // får varje rad ett eget lager i minnet, och en lista på trettio rader blir
  // trettio lager som kompositorn måste hålla reda på under hela scrollen.
  const willChange = useTransform(x, (value) =>
    value === 0 ? "auto" : "transform"
  );

  return (
    <motion.div
      data-no-tab-swipe
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", damping: 34, stiffness: 420 }}
      // Inget layout-prop: det animerar transform samtidigt som höjden krymper
      // vid exit, och raden kunde då bli hängande ovanpå nästa kort. Flödet
      // knuffar ändå syskonen mjukt när höjden går mot noll.
      className="relative isolate mb-2 overflow-hidden rounded-[var(--radius-card)]"
    >
      {/* Ren feedback under draget — ingen klickbar knapp. Radering sker
          bara genom att dra förbi tröskeln; annars studsar raden tillbaka.
          Ytan täcker hela raden så röd färg följer med hur långt man än drar;
          etiketten hålls kvar till höger där raden först lämnar plats. */}
      <motion.div
        aria-hidden
        style={{ opacity: revealed }}
        // Egen rundning, samma som kortet: kompositorns hörnklippning kan ligga
        // en pixel fel, och utan detta läckte röd färg ut i vänsterhörnen när
        // raden precis börjat röra sig eller nästan är tillbaka.
        className="absolute inset-0 flex items-center justify-end rounded-[var(--radius-card)] bg-[var(--color-danger)] pr-5 text-[13px] font-extrabold text-[#3a0d0d]"
      >
        Ta bort
      </motion.div>

      <motion.div
        drag={disabled ? false : "x"}
        style={{ x, touchAction: "pan-y", willChange }}
        dragConstraints={{ left: -REVEAL, right: 0 }}
        dragElastic={{ left: 0.55, right: 0 }}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          const full =
            info.offset.x < -FULL_SWIPE || info.velocity.x < -FULL_SWIPE_VELOCITY;

          // Raden går alltid tillbaka till utgångsläget. Har du dragit förbi
          // tröskeln raderar vi också — men studsen ska ändå ske, t.ex. om
          // posten är återkommande och en bekräftelsedialog tar över.
          animate(x, 0, SPRING);
          if (full) onDelete();
        }}
        className="relative"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
