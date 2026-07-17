using Budgex.Domain.Allocation;
using Budgex.Domain.Budget;
using Xunit;

namespace Budgex.Tests;

public class BudgetCalculatorTests
{
    [Fact]
    public void Calculate_WithSalaryOnly_ReturnsCorrectSafeToSpend()
    {
        // 28 000 lön, inga utgifter, inget sparande
        var result = BudgetCalculator.Calculate(
            salary: 28000m,
            csnAmount: 0m,
            csnLoanPart: 0m,
            expenses: 0m,
            savingsRules: []
        );

        Assert.Equal(28000m, result.SafeToSpend);
        Assert.Equal(0m, result.TransferToBank);
    }

    [Fact]
    public void Calculate_CsnLoanPart_IsNotSpendable()
    {
        // CSN 10 900, varav 7 500 är lån — bara bidraget (3 400) är spenderbart
        var result = BudgetCalculator.Calculate(
            salary: 0m,
            csnAmount: 10900m,
            csnLoanPart: 7500m,
            expenses: 0m,
            savingsRules: []
        );

        Assert.Equal(3400m, result.SafeToSpend);
        Assert.Equal(7500m, result.TransferToBank);
    }

    [Fact]
    public void Calculate_WithExpenses_ReducesSafeToSpend()
    {
        var result = BudgetCalculator.Calculate(
            salary: 28000m,
            csnAmount: 0m,
            csnLoanPart: 0m,
            expenses: 14198m,
            savingsRules: []
        );

        Assert.Equal(13802m, result.SafeToSpend);
        Assert.Equal(0m, result.TransferToBank);
    }

    [Fact]
    public void Calculate_WithSavingsRules_ReducesSafeToSpend()
    {
        var result = BudgetCalculator.Calculate(
            salary: 28000m,
            csnAmount: 0m,
            csnLoanPart: 0m,
            expenses: 0m,
            savingsRules: [new PercentageRule(10m), new FixedRule(1500m)]
        );

        // 10% av 28 000 = 2 800, + 1 500 fast = 4 300 totalt sparande
        Assert.Equal(23700m, result.SafeToSpend);
        Assert.Equal(4300m, result.TransferToBank);
    }

    [Fact]
    public void Calculate_FullScenario_SalaryPlusCsn()
    {
        // Lön 20 000 + CSN 10 900 (lån 7 500, bidrag 3 400)
        // Disponibel = 20 000 + 3 400 = 23 400
        // Utgifter = 8 000, sparande = 10% = 2 340
        // Kvar = 23 400 - 8 000 - 2 340 = 13 060
        // ÖverföraTillBank = 7 500 (lån) + 2 340 (sparande) = 9 840
        var result = BudgetCalculator.Calculate(
            salary: 20000m,
            csnAmount: 10900m,
            csnLoanPart: 7500m,
            expenses: 8000m,
            savingsRules: [new PercentageRule(10m)]
        );

        Assert.Equal(13060m, result.SafeToSpend);
        Assert.Equal(9840m, result.TransferToBank);
    }

    [Fact]
    public void Calculate_NegativeSafeToSpend_IsAllowed()
    {
        // Utgifterna överstiger inkomsten — kvar blir negativt
        var result = BudgetCalculator.Calculate(
            salary: 5000m,
            csnAmount: 0m,
            csnLoanPart: 0m,
            expenses: 8000m,
            savingsRules: []
        );

        Assert.Equal(-3000m, result.SafeToSpend);
    }

    [Fact]
    public void Calculate_CsnWithNoLoan_FullAmountIsSpendable()
    {
        // Bara CSN-bidrag, inget lån
        var result = BudgetCalculator.Calculate(
            salary: 0m,
            csnAmount: 3400m,
            csnLoanPart: 0m,
            expenses: 0m,
            savingsRules: []
        );

        Assert.Equal(3400m, result.SafeToSpend);
        Assert.Equal(0m, result.TransferToBank);
    }
}