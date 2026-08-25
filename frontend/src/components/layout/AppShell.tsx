import { useState } from "react";
import { useLocation, useNavigate, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { BottomSheet } from "../ui/BottomSheet";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { AddEntryForm } from "../home/AddEntryForm";
import { currentMonth } from "../../lib/month";
import { useSlideDirection } from "../../hooks/useSlideDirection";
import type { EntryKind } from "../../lib/categories";

const TABS = ["/", "/savings", "/profile"];
const SWIPE_DISTANCE = 70;
const SWIPE_VELOCITY = 450;

/**
 * Månadsvalet och vald flik bor här och inte i Home. Månaden behövs av både
 * sidorna och lägg till-arket. Fliken måste överleva att Home monteras ur,
 * eftersom §8 kräver att den kommer ihåg sig efter ett besök på Sparande.
 */
export interface MonthOutletContext {
  year: number;
  month: number;
  view: EntryKind;
  setView: (kind: EntryKind) => void;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  openAdd: () => void;
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [{ year, month }, setMonth] = useState(currentMonth);
  const [view, setView] = useState<EntryKind>("Expense");
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [addDirty, setAddDirty] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  const closeAdd = () => {
    setAddSheetOpen(false);
    setAddDirty(false);
    setDiscarding(false);
  };

  const requestCloseAdd = () => (addDirty ? setDiscarding(true) : closeAdd());

  const step = (delta: number) => {
    const shifted = month + delta;
    setMonth({
      year: year + Math.floor((shifted - 1) / 12),
      month: ((((shifted - 1) % 12) + 12) % 12) + 1,
    });
  };

  const outletContext: MonthOutletContext = {
    year,
    month,
    view,
    setView,
    goToPrevMonth: () => step(-1),
    goToNextMonth: () => step(1),
    openAdd: () => setAddSheetOpen(true),
  };

  const outlet = useOutlet(outletContext);
  const tab = Math.max(0, TABS.indexOf(location.pathname));
  const direction = useSlideDirection(tab);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
      <div className="flex h-screen w-full max-w-[420px] flex-col bg-[var(--color-bg)]">
        <TopBar />

        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24">
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.14}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              const forward =
                info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY;
              const back =
                info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY;

              if (forward && tab < TABS.length - 1) navigate(TABS[tab + 1]);
              else if (back && tab > 0) navigate(TABS[tab - 1]);
            }}
            className="min-h-full"
          >
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: direction * 48 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -48 }}
                transition={{ type: "spring", damping: 30, stiffness: 320 }}
                className="will-change-transform"
              >
                {outlet}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </main>

        <BottomNav />
      </div>

      <BottomSheet open={addSheetOpen} onClose={requestCloseAdd}>
        <AddEntryForm
          year={year}
          month={month}
          kind={view}
          onSaved={closeAdd}
          onDirtyChange={setAddDirty}
        />
      </BottomSheet>

      <ConfirmDialog
        open={discarding}
        title="Kasta ändringarna?"
        body={`Den nya ${view === "Income" ? "inkomsten" : "utgiften"} sparas inte.`}
        actions={[
          { label: "Kasta", tone: "danger" },
          { label: "Fortsätt skriva", tone: "alt" },
        ]}
        onPick={(index) => (index === 0 ? closeAdd() : setDiscarding(false))}
        onCancel={() => setDiscarding(false)}
      />
    </div>
  );
}
