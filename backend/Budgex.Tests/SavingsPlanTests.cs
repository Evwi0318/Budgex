using Budgex.Domain.Common;
using Budgex.Domain.Entities;
using Budgex.Domain.Savings;
using Xunit;

namespace Budgex.Tests;

public class SavingsPlanTests
{
    private static readonly MonthKey August = new(2026, 8);
    private static readonly Guid Salary = Guid.NewGuid();
    private static readonly Guid Grant = Guid.NewGuid();

    private static SavingsAccount Account(MonthKey from, params AllocationRule[] rules)
    {
        var account = new SavingsAccount
        {
            UserId = Guid.NewGuid(),
            Name = "Buffert",
            Icon = "🛟",
            From = from,
        };

        account.Rules.AddRange(rules);
        return account;
    }

    private static AllocationRule Percent(Guid source, decimal value) =>
        new() { SourceEntryId = source, RuleType = RuleType.Percentage, Value = value };

    private static AllocationRule Fixed(Guid source, decimal value) =>
        new() { SourceEntryId = source, RuleType = RuleType.Fixed, Value = value };

    [Fact]
    public void PercentageRule_TakesShareOfItsOwnSource_NotTotalIncome()
    {
        var account = Account(August, Percent(Grant, 70m));
        var sources = new Dictionary<Guid, decimal> { [Salary] = 20_000m, [Grant] = 6_000m };

        Assert.Equal(4_200m, SavingsPlan.PlannedTotal(account, sources));
    }

    [Fact]
    public void PercentageRule_RoundsAwayFromZero()
    {
        var account = Account(August, Percent(Salary, 10m));
        var sources = new Dictionary<Guid, decimal> { [Salary] = 1_005m };

        Assert.Equal(101m, SavingsPlan.PlannedTotal(account, sources));
    }

    [Fact]
    public void PercentageRule_IsZero_WhenSourceGaveNothing()
    {
        var account = Account(August, Percent(Grant, 50m));
        var sources = new Dictionary<Guid, decimal> { [Salary] = 20_000m };

        Assert.Equal(0m, SavingsPlan.PlannedTotal(account, sources));
    }

    [Fact]
    public void FixedRule_IsUnaffected_BySourceAmount()
    {
        var account = Account(August, Fixed(Salary, 700m));
        var sources = new Dictionary<Guid, decimal> { [Salary] = 0m };

        Assert.Equal(700m, SavingsPlan.PlannedTotal(account, sources));
    }

    [Fact]
    public void SeveralRules_AreSummed()
    {
        var account = Account(August, Percent(Salary, 10m), Fixed(Grant, 500m));
        var sources = new Dictionary<Guid, decimal> { [Salary] = 20_000m, [Grant] = 6_000m };

        Assert.Equal(2_500m, SavingsPlan.PlannedTotal(account, sources));
    }

    [Fact]
    public void Account_IsSkipped_WhenItDoesNotLiveInTheMonth()
    {
        var account = Account(new MonthKey(2026, 9), Fixed(Salary, 700m));

        var planned = SavingsPlan.For(August, [account], [], new Dictionary<Guid, decimal>());

        Assert.Empty(planned);
    }

    [Fact]
    public void FrozenAmount_WinsOverTheCurrentRules()
    {
        var account = Account(August, Percent(Salary, 10m));
        var sources = new Dictionary<Guid, decimal> { [Salary] = 20_000m };
        var state = new SavingsMonthState
        {
            SavingsAccountId = account.Id,
            Month = August,
            Amount = 1_500m,
            IsTransferred = true,
        };

        var planned = SavingsPlan.For(August, [account], [state], sources);

        Assert.Equal(1_500m, planned.Single().Amount);
        Assert.True(planned.Single().IsTransferred);
    }

    [Fact]
    public void StateFromAnotherMonth_IsIgnored()
    {
        var account = Account(August, Percent(Salary, 10m));
        var sources = new Dictionary<Guid, decimal> { [Salary] = 20_000m };
        var state = new SavingsMonthState
        {
            SavingsAccountId = account.Id,
            Month = new MonthKey(2026, 7),
            Amount = 1_500m,
        };

        var planned = SavingsPlan.For(August, [account], [state], sources);

        Assert.Equal(2_000m, planned.Single().Amount);
        Assert.False(planned.Single().IsTransferred);
    }

    [Fact]
    public void Source_IsOver_WhenMoreIsAllocatedThanItGave()
    {
        var first = Account(August, Percent(Salary, 70m));
        var second = Account(August, Percent(Salary, 50m));
        var sources = new Dictionary<Guid, decimal> { [Salary] = 20_000m };

        var usage = SavingsPlan.Sources(August, [first, second], sources).Single();

        Assert.Equal(SourceStatus.Over, usage.Status);
        Assert.Equal(24_000m, usage.Allocated);
    }

    [Fact]
    public void Source_IsFull_WhenEverythingIsAllocated()
    {
        var account = Account(August, Percent(Salary, 100m));
        var sources = new Dictionary<Guid, decimal> { [Salary] = 20_000m };

        var usage = SavingsPlan.Sources(August, [account], sources).Single();

        Assert.Equal(SourceStatus.Full, usage.Status);
    }

    [Fact]
    public void Source_IsOk_WhenSomethingRemains()
    {
        var account = Account(August, Fixed(Salary, 1_000m));
        var sources = new Dictionary<Guid, decimal> { [Salary] = 20_000m };

        var usage = SavingsPlan.Sources(August, [account], sources).Single();

        Assert.Equal(SourceStatus.Ok, usage.Status);
        Assert.Equal(20_000m, usage.Available);
    }
}
