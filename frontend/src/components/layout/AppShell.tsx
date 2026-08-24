import { useState } from "react";
import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { BottomSheet } from "../ui/BottomSheet";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { AddEntryForm } from "../home/AddEntryForm";
import { currentMonth } from "../../lib/month";
import type { EntryKind } from "../../lib/categories";

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
      <div className="flex h-screen w-full max-w-[420px] flex-col bg-[var(--color-bg)]">
        <TopBar />

        <main className="flex-1 overflow-y-auto pb-24">
          <Outlet context={outletContext} />
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
