import { useState } from "react";
import { MonthNav } from "../components/budget/MonthNav";
import { HeroBalance } from "../components/budget/HeroBalance";
import { ExpenseRow } from "../components/budget/ExpenseRow";
import { Eyebrow } from "../components/ui/Eyebrow";
import { useMonthQuery } from "../hooks/useMonthQuery";
import { useSummaryQuery } from "../hooks/useSummaryQuery";
import { useDeleteExpenseMutation } from "../hooks/useExpensesMutation";
import { getMonthName } from "../lib/format";

export function Home() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const { data: budget, isLoading: budgetLoading } = useMonthQuery(year, month);
  // Summaryn hämtas först när vi vet månadens id — useSummaryQuery
  // står stilla så länge den får en tom sträng
  const { data: summary, isLoading: summaryLoading } = useSummaryQuery(
    budget?.id ?? "",
  );
  const deleteExpense = useDeleteExpenseMutation();

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

  if (budgetLoading || summaryLoading) {
    return (
      <div className="px-4 py-6">
        <div className="h-10 bg-[var(--color-surface-2)] rounded-[var(--radius-card)] animate-pulse mb-4" />
        <div className="h-40 bg-[var(--color-surface-2)] rounded-[var(--radius-hero)] animate-pulse mb-6" />
        <div className="h-14 bg-[var(--color-surface-2)] rounded-[var(--radius-card)] animate-pulse" />
      </div>
    );
  }

  if (!budget || !summary) {
    return (
      <div className="px-4 py-6 text-center text-[var(--color-text-muted)]">
        Kunde inte hämta budgeten. Kontrollera anslutningen och försök igen.
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <MonthNav
        year={year}
        month={month}
        onPrev={goToPrevMonth}
        onNext={goToNextMonth}
      />

      <HeroBalance
        safeToSpend={summary.safeToSpend}
        totalIncome={summary.disposableIncome}
        totalExpenses={summary.totalExpenses}
      />

      <div className="space-y-2">
        <Eyebrow className="mb-3">Utgifter</Eyebrow>

        {budget.expenses.length === 0 ? (
          <p className="text-center py-8 text-[var(--color-text-muted)]">
            Inga utgifter i {getMonthName(month)} än. Lägg till den första.
          </p>
        ) : (
          budget.expenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              id={expense.id}
              name={expense.name}
              amount={expense.amount}
              category={expense.category}
              onDelete={(id) => deleteExpense.mutate(id)}
              isDeleting={deleteExpense.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}
