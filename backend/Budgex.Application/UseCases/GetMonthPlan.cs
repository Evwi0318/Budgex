using Budgex.Application.DTOs;
using Budgex.Application.Interfaces;
using Budgex.Domain.Budget;
using Budgex.Domain.Common;
using Budgex.Domain.Entities;

namespace Budgex.Application.UseCases;

public sealed class GetMonthPlan(IEntryRepository repo)
{
    public async Task<MonthPlanDto> ExecuteAsync(Guid userId, MonthKey month)
    {
        var entries = await repo.GetForUserAsync(userId);
        var states = await repo.GetStatesForMonthAsync(userId, month);

        var planned = MonthlyPlan.For(month, entries, states);

        return new MonthPlanDto(
            month.Year,
            month.Month,
            Map(planned, EntryKind.Income),
            Map(planned, EntryKind.Expense));
    }

    private static List<EntryDto> Map(IReadOnlyList<PlannedEntry> planned, EntryKind kind) =>
        planned
            .Where(item => item.Entry.Kind == kind)
            .Select(item => new EntryDto(
                item.Entry.Id,
                item.Entry.Kind.ToString(),
                item.Entry.Name,
                item.Entry.Category.ToString(),
                item.Amount,
                item.Entry.IsAutogiro,
                item.IsPaid,
                item.Entry.To != item.Entry.From.Next))
            .ToList();
}
