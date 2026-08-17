import { useState } from "react";
import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { BottomSheet } from "../ui/BottomSheet";
import { AddExpenseForm } from "../budget/AddExpenseForm";
import { useMonthQuery } from "../../hooks/useMonthQuery";

/**
 * Månadsvalet bor här och inte i Home, eftersom både sidorna (via
 * Outlet context) och lägg till-arket behöver veta vilken månad
 * som är vald. Plus-knappen i navigeringen ska alltid lägga utgiften
 * på månaden man tittar på.
 */
export interface MonthOutletContext {
  year: number;
  month: number;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
}

export function AppShell() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  // Samma query-nyckel som Home använder — React Query slår ihop dem
  // till en enda hämtning, så det här kostar ingen extra request
  const { data: budget } = useMonthQuery(year, month);

  const goToPrevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  const outletContext: MonthOutletContext = {
    year,
    month,
    goToPrevMonth,
    goToNextMonth,
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
      <div className="w-full max-w-[480px] flex flex-col h-screen bg-[var(--color-bg)]">
        <TopBar />

        <main className="flex-1 overflow-y-auto pb-24">
          <Outlet context={outletContext} />
        </main>

        <BottomNav onAdd={() => setAddSheetOpen(true)} />
      </div>

      <BottomSheet open={addSheetOpen} onClose={() => setAddSheetOpen(false)}>
        {budget ? (
          <AddExpenseForm
            monthId={budget.id}
            onSaved={() => setAddSheetOpen(false)}
          />
        ) : (
          <p className="text-center text-[var(--color-text-muted)] py-4">
            Kunde inte hämta månaden. Stäng och försök igen.
          </p>
        )}
      </BottomSheet>
    </div>
  );
}
