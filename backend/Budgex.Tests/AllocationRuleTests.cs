using Budgex.Domain.Allocation;
using Xunit;

namespace Budgex.Tests;

public class AllocationRuleTests
{
    [Fact]
    public void FixedRule_ReturnsFixedAmount_RegardlessOfIncome()
    {
        var rule = new FixedRule(1500m);
        Assert.Equal(1500m, rule.CalculateAmount(28000m));
    }

    [Fact]
    public void FixedRule_ReturnsFixedAmount_WhenIncomeIsZero()
    {
        var rule = new FixedRule(1500m);
        Assert.Equal(1500m, rule.CalculateAmount(0m));
    }


    [Fact]
    public void  PercentageRule_CalculatesCorrectAmount()
    {
        var rule = new PercentageRule(10m);
        Assert.Equal(2800m, rule.CalculateAmount(28000m));
    }


    [Fact]
    public void PercentageRule_ReturnsZero_WhenIncomeIsZero()
    {
        var rule = new PercentageRule(10m);
        Assert.Equal(0m, rule.CalculateAmount(0m));
        
    }

}