using Budgex.Domain.Common;
using Budgex.Domain.Entities;

namespace Budgex.Domain.Budget;

public sealed record ScopeChange(IReadOnlyList<EntryMonthState> Save, bool DeleteEntry = false);

public static class EntryScope
{
    public static ScopeChange ChangeAmountThisMonth(
        Entry entry,
        MonthKey month,
        decimal amount,
        EntryMonthState? existing)
    {
        var state = existing ?? new EntryMonthState { EntryId = entry.Id, Month = month };
        state.Amount = amount;

        return new ScopeChange([state]);
    }

    public static ScopeChange ChangeAmountOnwards(
        Entry entry,
        MonthKey month,
        decimal amount,
        IEnumerable<EntryMonthState> states)
    {
        entry.Amount = amount;

        var outdated = states
            .Where(state => state.EntryId == entry.Id
                         && state.Month >= month
                         && state.Amount is not null)
            .ToList();

        foreach (var state in outdated)
        {
            state.Amount = null;
        }

        return new ScopeChange(outdated);
    }

    public static ScopeChange SkipThisMonth(
        Entry entry,
        MonthKey month,
        EntryMonthState? existing)
    {
        var state = existing ?? new EntryMonthState { EntryId = entry.Id, Month = month };
        state.IsSkipped = true;

        return new ScopeChange([state]);
    }

    public static ScopeChange EndOnwards(Entry entry, MonthKey month)
    {
        if (entry.From == month)
        {
            return new ScopeChange([], DeleteEntry: true);
        }

        entry.To = month;

        return new ScopeChange([]);
    }
}
