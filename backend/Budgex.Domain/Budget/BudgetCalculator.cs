using Budgex.Domain.Allocation;

namespace Budgex.Domain.Budget;

public static class BudgetCalculator
{
    public static BudgetResult Calculate(
        decimal salary,
        decimal csnAmount,
        decimal csnLoanPart,
        decimal expenses,
        IEnumerable<IAllocationRule> savingsRules)
    {
        var csnGrant = csnAmount - csnLoanPart;
        var disposableIncome = salary + csnGrant;

        var totalSavings = savingsRules
            .Sum(rule => rule.CalculateAmount(disposableIncome));

        var safeToSpend = disposableIncome - expenses - totalSavings;
        var transferToBank = csnLoanPart + totalSavings;

        return new BudgetResult(safeToSpend, transferToBank);
    }
}