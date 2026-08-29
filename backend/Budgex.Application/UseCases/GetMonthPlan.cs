using Budgex.Application.DTOs;
using Budgex.Application.Interfaces;
using Budgex.Domain.Budget;
using Budgex.Domain.Common;
using Budgex.Domain.Entities;
using Budgex.Domain.Savings;

namespace Budgex.Application.UseCases;

public sealed class GetMonthPlan(IEntryRepository entries, ISavingsRepository savings)
{
    public async Task<MonthPlanDto> ExecuteAsync(Guid userId, MonthKey month)
    {
        var planned = MonthlyPlan.For(
            month,
            await entries.GetForUserAsync(userId),
            await entries.GetStatesForMonthAsync(userId, month));

        var income = Total(planned, EntryKind.Income);
        var expenses = Total(planned, EntryKind.Expense);

        var result = BudgetCalculator.Calculate(
            income, expenses, await TotalSavings(userId, month, planned));

        return new MonthPlanDto(
            month.Year,
            month.Month,
            Map(planned, EntryKind.Income, month),
            Map(planned, EntryKind.Expense, month),
            new SummaryDto(result.Income, expenses, result.TotalSavings, result.SafeToSpend));
    }

    private async Task<decimal> TotalSavings(
        Guid userId, MonthKey month, IReadOnlyList<PlannedEntry> planned)
    {
        var amounts = planned
            .Where(item => item.Entry.Kind == EntryKind.Income)
            .ToDictionary(item => item.Entry.Id, item => item.Amount);

        return SavingsPlan.For(
                month,
                await savings.GetForUserAsync(userId),
                await savings.GetStatesForMonthAsync(userId, month),
                amounts)
            .Sum(account => account.Amount);
    }

    private static decimal Total(IReadOnlyList<PlannedEntry> planned, EntryKind kind) =>
        planned.Where(item => item.Entry.Kind == kind).Sum(item => item.Amount);

    // Repeats svarar på om posten lever vidare efter den här månaden, inte på om
    // den någon gång gjort det. Annars står "Varje månad" kvar på en post vars
    // sista månad man just tittar på.
    private static List<EntryDto> Map(
        IReadOnlyList<PlannedEntry> planned, EntryKind kind, MonthKey month) =>
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
                item.Entry.To is null || item.Entry.To > month.Next))
            .ToList();
}
