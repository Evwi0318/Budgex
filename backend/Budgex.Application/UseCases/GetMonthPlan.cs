using Budgex.Application.DTOs;
using Budgex.Application.Interfaces;
using Budgex.Domain.Allocation;
using Budgex.Domain.Budget;
using Budgex.Domain.Common;
using Budgex.Domain.Entities;

namespace Budgex.Application.UseCases;

public sealed class GetMonthPlan(IEntryRepository entries, IBudgetMonthRepository months)
{
    public async Task<MonthPlanDto> ExecuteAsync(Guid userId, MonthKey month)
    {
        var planned = MonthlyPlan.For(
            month,
            await entries.GetForUserAsync(userId),
            await entries.GetStatesForMonthAsync(userId, month));

        var income = Total(planned, EntryKind.Income);
        var expenses = Total(planned, EntryKind.Expense);

        var result = BudgetCalculator.Calculate(income, expenses, await SavingsRules(userId, month));

        return new MonthPlanDto(
            month.Year,
            month.Month,
            Map(planned, EntryKind.Income),
            Map(planned, EntryKind.Expense),
            new SummaryDto(result.Income, expenses, result.TotalSavings, result.SafeToSpend));
    }

    private async Task<IEnumerable<IAllocationRule>> SavingsRules(Guid userId, MonthKey month)
    {
        var budgetMonth = await months.GetByYearMonthAsync(userId, month.Year, month.Month);

        return (budgetMonth?.SavingsAccounts ?? []).Select<SavingsAccount, IAllocationRule>(account =>
            account.RuleType == RuleType.Fixed
                ? new FixedRule(account.RuleValue)
                : new PercentageRule(account.RuleValue));
    }

    private static decimal Total(IReadOnlyList<PlannedEntry> planned, EntryKind kind) =>
        planned.Where(item => item.Entry.Kind == kind).Sum(item => item.Amount);

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
