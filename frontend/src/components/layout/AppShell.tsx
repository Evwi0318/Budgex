import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import type { SwiperClass } from "swiper/react";
import "swiper/css";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { BottomSheet } from "../ui/BottomSheet";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { AddEntryForm } from "../home/AddEntryForm";
import { Home } from "../../pages/Home";
import { Savings } from "../../pages/Savings";
import { Profile } from "../../pages/Profile";
import { MonthContext } from "../../context/MonthContext";
import { currentMonth } from "../../lib/month";
import type { MonthContextValue } from "../../context/MonthContext";
import type { EntryKind } from "../../lib/categories";

const TABS = ["/", "/savings", "/profile"];

/**
 * Månadsvalet och vald flik bor här och inte i Home. Månaden behövs av både
 * sidorna och lägg till-arket, och de tre sidorna ligger som slides i samma
 * Swiper — de är alltså monterade hela tiden, så fliken överlever ett besök
 * på Sparande utan att sparas någon annanstans.
 */
export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [{ year, month }, setMonth] = useState(currentMonth);
  const [view, setView] = useState<EntryKind>("Expense");
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [addDirty, setAddDirty] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  const tab = Math.max(0, TABS.indexOf(location.pathname));
  const swiperRef = useRef<SwiperClass | null>(null);

  // Swiper återanvänder callbacken, så jämförelsen måste läsa ur en ref
  const pathRef = useRef(location.pathname);

  // Fryst vid monteringen: ändras initialSlide senare bygger Swiper om sig
  const [startTab] = useState(tab);

  // Bottennavigeringen navigerar, effekten glider Swiper dit. Kommer bytet
  // från ett svep står Swiper redan rätt och inget händer.
  useEffect(() => {
    pathRef.current = location.pathname;

    const swiper = swiperRef.current;

    if (swiper && !swiper.destroyed && swiper.activeIndex !== tab) {
      swiper.slideTo(tab);
    }
  }, [location.pathname, tab]);

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

  const monthContext: MonthContextValue = {
    year,
    month,
    view,
    setView,
    goToPrevMonth: () => step(-1),
    goToNextMonth: () => step(1),
    openAdd: () => setAddSheetOpen(true),
    activePath: TABS[tab],
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--color-bg)]">
      <div className="flex h-[100dvh] w-full max-w-[420px] flex-col bg-[var(--color-bg)]">
        <TopBar />

        <MonthContext.Provider value={monthContext}>
          <main className="min-h-0 flex-1">
            <Swiper
              className="h-full w-full"
              initialSlide={startTab}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              onSlideChange={(swiper) => {
                const path = TABS[swiper.activeIndex];
                if (path && path !== pathRef.current) navigate(path);
              }}
            >
              <SwiperSlide className="overflow-y-auto overscroll-y-contain">
                <div className="pb-24">
                  <Home />
                </div>
              </SwiperSlide>

              <SwiperSlide className="overflow-y-auto overscroll-y-contain">
                <div className="pb-24">
                  <Savings />
                </div>
              </SwiperSlide>

              <SwiperSlide className="overflow-y-auto overscroll-y-contain">
                <div className="pb-24">
                  <Profile />
                </div>
              </SwiperSlide>
            </Swiper>
          </main>
        </MonthContext.Provider>

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
