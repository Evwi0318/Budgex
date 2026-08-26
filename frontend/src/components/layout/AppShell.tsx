import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
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

  // Gamla bokmärken på /savings ska landa på sparandefliken direkt, utan att
  // först blinka förbi utgifterna
  const [tab, setTab] = useState<HomeTab>(() =>
    location.pathname === "/savings" ? "Savings" : "Expense"
  );

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

  const monthContext: MonthContextValue = {
    year,
    month,
    tab,
    setTab,
    goToPrevMonth: () => step(-1),
    goToNextMonth: () => step(1),
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--color-bg)]">
      <div className="flex h-[100dvh] w-full max-w-[420px] flex-col bg-[var(--color-bg)]">
        <MonthContext.Provider value={monthContext}>
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            <div className="pb-24">
              <Outlet />
            </div>
          </main>
        </MonthContext.Provider>
      </div>
    </div>
  );
}
