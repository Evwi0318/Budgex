import { useEffect, useMemo, useState } from "react";
import type { UIEvent } from "react";
import { useLocation, useNavigate, useOutlet } from "react-router-dom";
import { MonthContext } from "../../context/MonthContext";
import { currentMonth } from "../../lib/month";
import type { HomeTab, MonthContextValue } from "../../context/MonthContext";

/**
 * Månadsvalet och vald flik bor här, inte i Home. Profilen är en egen sida,
 * så Home avmonteras när man går dit — låg valet i Home skulle månaden
 * hoppa tillbaka till dagens när man kom tillbaka.
 */
export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [{ year, month }, setMonth] = useState(currentMonth);
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);

  // Gamla bokmärken på /savings ska landa på sparandefliken direkt, utan att
  // först blinka förbi utgifterna
  const [tab, setTab] = useState<HomeTab>(() =>
    location.pathname === "/savings" ? "Savings" : "Expense"
  );

  const outlet = useOutlet({ compact });

  useEffect(() => {
    if (location.pathname === "/savings") navigate("/", { replace: true });
  }, [location.pathname, navigate]);

  const step = (delta: number) => {
    const shifted = month + delta;
    setMonth({
      year: year + Math.floor((shifted - 1) / 12),
      month: ((((shifted - 1) % 12) + 12) % 12) + 1,
    });
  };

  // Kortet krymper vid 24 px men växer inte tillbaka förrän vid 10. Utan
  // glappet kan komprimeringen göra sidan så kort att den skrollar tillbaka
  // över gränsen, och kortet börjar blinka.
  const handleScroll = (event: UIEvent<HTMLElement>) => {
    const top = event.currentTarget.scrollTop;

    setScrolled(top > 8);
    setCompact((was) => (was ? top > 10 : top > 24));
  };

  // Ny identitet varje render skulle tvinga om varje läsare av kontexten,
  // och skalet renderar om vid varje scroll som passerar tröskeln.
  const monthContext: MonthContextValue = useMemo(
    () => ({
      year,
      month,
      tab,
      setTab,
      goToPrevMonth: () => step(-1),
      goToNextMonth: () => step(1),
    }),
    // step härleds ur year och month, som båda finns med
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [year, month, tab]
  );

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--color-bg)]">
      <div className="relative flex h-[100dvh] w-full max-w-[420px] flex-col bg-[var(--color-bg)]">
        <MonthContext.Provider value={monthContext}>
          {/*
            overflow-anchor: none — när kortet krymper blir innehållet kortare,
            och webbläsarens scroll-ankring drar då tillbaka scrollTop under
            tröskeln igen. Kortet skulle börja pendla mellan lägena.
          */}
          <main
            onScroll={handleScroll}
            style={{ overflowAnchor: "none" }}
            className="min-h-0 flex-1 overflow-y-auto overscroll-none"
          >
            {/*
              Sidbytet får inte animeras. En uttoning måste spelas klart innan
              nästa sida monteras, och skärmen står tom under tiden — på en
              telefon läser den luckan som en omladdning.

              Flex-kolumn i full höjd så barnet (Home) kan växa till hela ytan
              även när innehållet är kort — då fångas svep på tom yta.
            */}
            <div
              style={{
                paddingBottom:
                  "calc(var(--list-bottom) + env(safe-area-inset-bottom))",
              }}
              className="flex min-h-full flex-col"
            >
              {outlet}
            </div>
          </main>
        </MonthContext.Provider>

        {/*
          Egna gradientlager, inte mask-image på scroll-ytan: en mask skapar en
          grupp som slår ut backdrop-filter hos barnen, och då försvinner
          glaset i hero-kortet. Ligger över raderna men under kortet (z-20).
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 transition-opacity duration-200"
          style={{
            opacity: scrolled ? 1 : 0,
            background:
              "linear-gradient(to bottom, var(--color-bg) 35%, transparent 100%)",
          }}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24"
          style={{
            background:
              "linear-gradient(to top, var(--color-bg) 30%, transparent 100%)",
          }}
        />
      </div>
    </div>
  );
}
