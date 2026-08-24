import { useNavigate, useOutletContext } from "react-router-dom";
import { MonthNav } from "../components/budget/MonthNav";
import { HeroCard } from "../components/home/HeroCard";
import { EntryRow } from "../components/home/EntryRow";
import { EmptyState } from "../components/home/EmptyState";
import { useMonthPlanQuery } from "../hooks/useMonthPlanQuery";
import { useMonthLock } from "../hooks/useMonthLock";
import { getMonthName } from "../lib/format";
import { isPast } from "../lib/month";
import type { MonthOutletContext } from "../components/layout/AppShell";
import type { MonthPlan } from "../hooks/useMonthPlanQuery";

export function Home() {
  const { year, month, view, setView, goToPrevMonth, goToNextMonth } =
    useOutletContext<MonthOutletContext>();
  const navigate = useNavigate();

  const { data: plan, isLoading } = useMonthPlanQuery(year, month);
  const { isClosed, isLocked, unlock, relock } = useMonthLock(year, month);

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="mb-4 h-10 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-surface-2)]" />
        <div className="h-44 animate-pulse rounded-[var(--radius-hero)] bg-[var(--color-surface-2)]" />
      </div>
    );
  }

  if (!plan) {
    return (
      <p className="px-4 py-6 text-center text-[var(--color-text-muted)]">
        Kunde inte hämta månaden. Kontrollera anslutningen och försök igen.
      </p>
    );
  }

  const monthName = getMonthName(month);
  const entries = view === "Income" ? plan.income : plan.expenses;

  return (
    <div>
      <MonthNav
        year={year}
        month={month}
        canGoNext={isPast({ year, month })}
        onPrev={goToPrevMonth}
        onNext={goToNextMonth}
      />

      <HeroCard
        summary={plan.summary}
        view={view}
        onSelect={setView}
        onSavings={() => navigate("/savings")}
        dimmed={isLocked}
      />

      <div className="px-4 pt-5">
        <header className="mb-2.5 flex items-center gap-2.5 px-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            {view === "Income" ? "Inkomst" : "Utgifter"}
          </span>

          <span
            className={`grid h-[21px] min-w-[21px] place-items-center rounded-full px-1.5 text-[11.5px] font-extrabold ${
              view === "Income"
                ? "bg-[var(--color-mint-wash)] text-[var(--color-mint)]"
                : "bg-[var(--color-danger-wash)] text-[var(--color-danger)]"
            }`}
          >
            {entries.length}
          </span>

          {isClosed && (
            <button
              onClick={isLocked ? unlock : relock}
              className={`ml-auto rounded-full border px-2.5 py-1.5 text-[12.5px] font-extrabold transition active:scale-95 ${
                isLocked
                  ? "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]"
                  : "border-[var(--color-mint-dim)] bg-[var(--color-mint-wash)] text-[var(--color-mint)]"
              }`}
            >
              {isLocked ? "🔒 Avslutad — lås upp" : "🔓 Upplåst — lås igen"}
            </button>
          )}
        </header>

        {entries.length > 0 ? (
          entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} monthName={monthName} />
          ))
        ) : (
          <Empty plan={plan} view={view} monthName={monthName} closed={isClosed} />
        )}
      </div>
    </div>
  );
}

interface EmptyProps {
  plan: MonthPlan;
  view: "Income" | "Expense";
  monthName: string;
  closed: boolean;
}

function Empty({ plan, view, monthName, closed }: EmptyProps) {
  const nothingAtAll = plan.income.length === 0 && plan.expenses.length === 0;

  if (closed) {
    return (
      <EmptyState
        emoji="🗓"
        title={`Inget i ${monthName}`}
        body="Den här månaden är avslutad och innehåller inga poster."
      />
    );
  }

  if (nothingAtAll) {
    return (
      <EmptyState
        emoji="👋"
        title="Välkommen till Budgex"
        body="Börja med din inkomst — då vet appen hur mycket du har att röra dig med. Utgifterna lägger du till efteråt."
        footnote="Tryck på plus i menyn för att lägga till."
      />
    );
  }

  if (view === "Income") {
    return (
      <EmptyState
        emoji="💼"
        title={`Ingen inkomst i ${monthName}`}
        body="Lägg till lön, bidrag eller annat som kommit in den här månaden."
      />
    );
  }

  if (plan.income.length === 0) {
    return (
      <EmptyState
        emoji="🧾"
        title="Inkomsten först"
        body="Utan inkomst går det inte att se vad som är kvar att spendera. Byt till Inkomst-fliken och lägg till den."
      />
    );
  }

  return (
    <EmptyState
      emoji="🏠"
      title="Inga utgifter än"
      body="Börja med hyran — den återkommer varje månad, så välj Varje månad så slipper du lägga in den igen."
    />
  );
}
