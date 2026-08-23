using Budgex.Domain.Allocation;

namespace Budgex.Domain.Budget;

public static class BudgetCalculator
{
    public static BudgetResult Calculate(
        decimal income,
        decimal expenses,
        IEnumerable<IAllocationRule> savingsRules)
    {
        var totalSavings = savingsRules.Sum(rule => rule.CalculateAmount(income));

        return new BudgetResult(income, totalSavings, income - expenses - totalSavings);
    }
}
