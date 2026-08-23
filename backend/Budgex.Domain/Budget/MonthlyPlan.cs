using Budgex.Domain.Common;
using Budgex.Domain.Entities;

namespace Budgex.Domain.Budget;

public sealed record PlannedEntry(Entry Entry, decimal Amount, bool IsPaid);

public static class MonthlyPlan
{
    public static IReadOnlyList<PlannedEntry> For(
        MonthKey month,
        IEnumerable<Entry> entries,
        IEnumerable<EntryMonthState> states)
    {
        var stateByEntry = states.ToDictionary(state => state.EntryId);
        var planned = new List<PlannedEntry>();

        foreach (var entry in entries.Where(entry => entry.LiveIn(month)))
        {
            stateByEntry.TryGetValue(entry.Id, out var state);

            if (state?.IsSkipped == true)
            {
                continue;
            }

            planned.Add(new PlannedEntry(
                entry,
                state?.Amount ?? entry.Amount,
                entry.IsAutogiro || state?.IsPaid == true));
        }

        return planned
            .OrderBy(item => item.Entry.IsAutogiro)
            .ThenBy(item => item.Entry.CreatedAt)
            .ToList();
    }
}