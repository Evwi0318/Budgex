using Budgex.Domain.Budget;
using Budgex.Domain.Common;
using Budgex.Domain.Entities;
using Xunit;

namespace Budgex.Tests;

public class EntryScopeTests
{
    private static readonly MonthKey January = new(2026, 1);
    private static readonly MonthKey July = new(2026, 7);
    private static readonly MonthKey August = new(2026, 8);
    private static readonly MonthKey September = new(2026, 9);

    [Fact]
    public void ChangeAmountThisMonth_CreatesOverrideWithoutTouchingTemplate()
    {
        var rent = Template(7500m, from: January);

        var change = EntryScope.ChangeAmountThisMonth(rent, August, 8200m, existing: null);

        Assert.Equal(7500m, rent.Amount);
        var state = Assert.Single(change.Save);
        Assert.Equal(8200m, state.Amount);
        Assert.Equal(August, state.Month);
    }

    [Fact]
    public void ChangeAmountThisMonth_ReusesExistingState()
    {
        var rent = Template(7500m, from: January);
        var existing = new EntryMonthState { EntryId = rent.Id, Month = August, Amount = 8200m };

        var change = EntryScope.ChangeAmountThisMonth(rent, August, 9000m, existing);

        Assert.Same(existing, Assert.Single(change.Save));
        Assert.Equal(9000m, existing.Amount);
    }

    [Fact]
    public void ChangeAmountOnwards_ChangesTheTemplate()
    {
        var rent = Template(7500m, from: January);

        EntryScope.ChangeAmountOnwards(rent, August, 8200m, []);

        Assert.Equal(8200m, rent.Amount);
    }

    [Fact]
    public void ChangeAmountOnwards_ClearsOverridesFromThatMonthOn()
    {
        var rent = Template(7500m, from: January);
        var future = new EntryMonthState { EntryId = rent.Id, Month = September, Amount = 9900m };

        var change = EntryScope.ChangeAmountOnwards(rent, August, 8200m, [future]);

        // Utan detta hade september fortsatt visa 9 900 kr och tyst vunnit över mallen
        Assert.Null(future.Amount);
        Assert.Same(future, Assert.Single(change.Save));
    }

    [Fact]
    public void ChangeAmountOnwards_LeavesThePastAlone()
    {
        var rent = Template(7500m, from: January);
        var past = new EntryMonthState { EntryId = rent.Id, Month = July, Amount = 7000m };

        var change = EntryScope.ChangeAmountOnwards(rent, August, 8200m, [past]);

        Assert.Equal(7000m, past.Amount);
        Assert.Empty(change.Save);
    }

    [Fact]
    public void ChangeAmountOnwards_KeepsPaidOnFutureStates()
    {
        var rent = Template(7500m, from: January);
        var future = new EntryMonthState
        {
            EntryId = rent.Id, Month = September, Amount = 9900m, IsPaid = true
        };

        EntryScope.ChangeAmountOnwards(rent, August, 8200m, [future]);

        // Bara beloppet är föråldrat — bocken hör till månaden och står kvar
        Assert.Null(future.Amount);
        Assert.True(future.IsPaid);
    }

    [Fact]
    public void SkipThisMonth_MarksOnlyThatMonth()
    {
        var rent = Template(7500m, from: January);

        var change = EntryScope.SkipThisMonth(rent, August, existing: null);

        var state = Assert.Single(change.Save);
        Assert.True(state.IsSkipped);
        Assert.Equal(August, state.Month);
        Assert.Null(rent.To);
    }

    [Fact]
    public void EndOnwards_SetsToWithoutTouchingHistory()
    {
        var rent = Template(7500m, from: January);

        var change = EntryScope.EndOnwards(rent, August);

        // To är exklusiv, så posten lever till och med juli
        Assert.Equal(August, rent.To);
        Assert.False(change.DeleteEntry);
    }

    [Fact]
    public void EndOnwards_DeletesTemplateCreatedInTheSameMonth()
    {
        var dentist = Template(1200m, from: August);

        var change = EntryScope.EndOnwards(dentist, August);

        // Ingen historik att bevara — mallen har aldrig gällt någon annan månad
        Assert.True(change.DeleteEntry);
    }

    private static Entry Template(decimal amount, MonthKey from) =>
        new()
        {
            UserId = Guid.NewGuid(),
            Kind = EntryKind.Expense,
            Name = "Hyra",
            Category = EntryCategory.Housing,
            Amount = amount,
            From = from
        };
}
