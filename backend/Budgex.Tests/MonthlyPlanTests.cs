using Budgex.Domain.Budget;
using Budgex.Domain.Common;
using Budgex.Domain.Entities;
using Xunit;

namespace Budgex.Tests;

public class MonthlyPlanTests
{
    private static readonly MonthKey January = new(2026, 1);
    private static readonly MonthKey July = new(2026, 7);
    private static readonly MonthKey August = new(2026, 8);
    private static readonly MonthKey September = new(2026, 9);

    [Fact]
    public void For_TemplateStartedEarlier_IsIncluded()
    {
        var rent = Template("Hyra", 7500m, from: January);

        var planned = MonthlyPlan.For(August, [rent], []);

        Assert.Equal(7500m, Assert.Single(planned).Amount);
    }

    [Fact]
    public void For_TemplateNotYetStarted_IsExcluded()
    {
        var rent = Template("Hyra", 7500m, from: September);

        Assert.Empty(MonthlyPlan.For(August, [rent], []));
    }

    [Fact]
    public void For_EndedTemplate_StopsWithoutTouchingHistory()
    {
        // To är exklusiv: gymmet lever till och med juli
        var gym = Template("Gym", 399m, from: January, to: August);

        Assert.Empty(MonthlyPlan.For(August, [gym], []));
        Assert.Single(MonthlyPlan.For(July, [gym], []));
    }

    [Fact]
    public void For_OneOffEntry_LivesOnlyInItsOwnMonth()
    {
        var dentist = Template("Tandläkare", 1200m, from: August, to: August.Next);

        Assert.Single(MonthlyPlan.For(August, [dentist], []));
        Assert.Empty(MonthlyPlan.For(September, [dentist], []));
    }

    [Fact]
    public void For_Override_AppliesOnlyToItsOwnMonth()
    {
        var rent = Template("Hyra", 7500m, from: January);
        var raised = new EntryMonthState { EntryId = rent.Id, Month = August, Amount = 8200m };

        // Samma avvikelse skickas in för båda månaderna — bara augusti ska bry sig
        Assert.Equal(8200m, Assert.Single(MonthlyPlan.For(August, [rent], [raised])).Amount);
        Assert.Equal(7500m, Assert.Single(MonthlyPlan.For(September, [rent], [raised])).Amount);
    }

    [Fact]
    public void For_Skip_RemovesTheEntryOnlyInItsOwnMonth()
    {
        var rent = Template("Hyra", 7500m, from: January);
        var skipped = new EntryMonthState { EntryId = rent.Id, Month = August, IsSkipped = true };

        Assert.Empty(MonthlyPlan.For(August, [rent], [skipped]));
        Assert.Single(MonthlyPlan.For(September, [rent], [skipped]));
    }

    [Fact]
    public void For_Paid_DoesNotChangeTheAmount()
    {
        var rent = Template("Hyra", 7500m, from: January);
        var paid = new EntryMonthState { EntryId = rent.Id, Month = August, IsPaid = true };

        var planned = Assert.Single(MonthlyPlan.For(August, [rent], [paid]));

        Assert.True(planned.IsPaid);
        Assert.Equal(7500m, planned.Amount);
    }

    [Fact]
    public void For_Autogiro_CountsAsPaid()
    {
        var mobile = Template("Mobil", 299m, from: January, autogiro: true);

        Assert.True(Assert.Single(MonthlyPlan.For(August, [mobile], [])).IsPaid);
    }

    [Fact]
    public void For_Sorting_PutsAutogiroLast()
    {
        var rent = Template("Hyra", 7500m, from: January, autogiro: true, createdMinute: 0);
        var food = Template("Mat", 3600m, from: January, createdMinute: 1);

        var planned = MonthlyPlan.For(August, [rent, food], []);

        Assert.Equal("Mat", planned[0].Entry.Name);
        Assert.Equal("Hyra", planned[1].Entry.Name);
    }

    [Fact]
    public void For_Sorting_IsUnchangedWhenAnEntryIsPaid()
    {
        var food = Template("Mat", 3600m, from: January, createdMinute: 0);
        var gym = Template("Gym", 399m, from: January, createdMinute: 1);
        var paid = new EntryMonthState { EntryId = food.Id, Month = August, IsPaid = true };

        var planned = MonthlyPlan.For(August, [food, gym], [paid]);

        // Avbockad post flyttar sig inte — annars tappar man var man var
        Assert.Equal("Mat", planned[0].Entry.Name);
        Assert.Equal("Gym", planned[1].Entry.Name);
    }

    private static Entry Template(
        string name,
        decimal amount,
        MonthKey from,
        MonthKey? to = null,
        bool autogiro = false,
        int createdMinute = 0) =>
        new()
        {
            UserId = Guid.NewGuid(),
            Kind = EntryKind.Expense,
            Name = name,
            Category = EntryCategory.Housing,
            Amount = amount,
            IsAutogiro = autogiro,
            From = from,
            To = to,
            CreatedAt = new DateTime(2026, 1, 1, 0, createdMinute, 0, DateTimeKind.Utc)
        };
}
