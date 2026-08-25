namespace Budgex.Domain.Budget;

public static class BudgetCalculator
{
    public static BudgetResult Calculate(decimal income, decimal expenses, decimal totalSavings) =>
        new(income, totalSavings, income - expenses - totalSavings);
}
