using Budgex.Domain.Budget;
using Xunit;

namespace Budgex.Tests;

public class BudgetCalculatorTests
{
    [Fact]
    public void Calculate_WithoutSavings_SafeToSpendIsIncomeMinusExpenses()
    {
        var result = BudgetCalculator.Calculate(income: 28000m, expenses: 14198m, totalSavings: 0m);

        Assert.Equal(13802m, result.SafeToSpend);
        Assert.Equal(0m, result.TotalSavings);
    }

    [Fact]
    public void Calculate_SavingsIsSubtractedFromSafeToSpend()
    {
        // §2: sparandet är intecknade pengar och dras från hero-siffran
        var result = BudgetCalculator.Calculate(income: 28000m, expenses: 0m, totalSavings: 1500m);

        Assert.Equal(1500m, result.TotalSavings);
        Assert.Equal(26500m, result.SafeToSpend);
    }

    [Fact]
    public void Calculate_FullMonth_AddsUp()
    {
        // 23 400 in, 8 000 ut, 2 340 till sparande → 13 060 kvar
        var result = BudgetCalculator.Calculate(income: 23400m, expenses: 8000m, totalSavings: 2340m);

        Assert.Equal(23400m, result.Income);
        Assert.Equal(2340m, result.TotalSavings);
        Assert.Equal(13060m, result.SafeToSpend);
    }

    [Fact]
    public void Calculate_ExpensesAboveIncome_GoesNegative()
    {
        // Ingen spärr — §2 säger röd siffra och "Över budget", inte ett stopp
        var result = BudgetCalculator.Calculate(income: 5000m, expenses: 8000m, totalSavings: 0m);

        Assert.Equal(-3000m, result.SafeToSpend);
    }
}
