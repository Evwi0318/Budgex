using Budgex.Application.DTOs;
using Budgex.Application.Interfaces;
using Budgex.Domain.Budget;
using Budgex.Domain.Common;
using Budgex.Domain.Entities;
using Budgex.Domain.Savings;

namespace Budgex.Application.UseCases;

public sealed class GetSavingsMonth(IEntryRepository entries, ISavingsRepository savings)
{
    public const string MissingSource = "Borttagen källa";

    public async Task<SavingsMonthDto> ExecuteAsync(Guid userId, MonthKey month)
    {
        var income = await IncomeFor(entries, userId, month);
        var amounts = income.ToDictionary(item => item.Entry.Id, item => item.Amount);
        var names = income.ToDictionary(item => item.Entry.Id, item => item.Entry.Name);

        var accounts = await savings.GetForUserAsync(userId);
        var states = await savings.GetStatesForMonthAsync(userId, month);

        var planned = SavingsPlan.For(month, accounts, states, amounts);

        return new SavingsMonthDto(
            month.Year,
            month.Month,
            planned.Sum(account => account.Amount),
            planned.Select(account => ToDto(account, amounts, names)).ToList(),
            SavingsPlan.Sources(month, accounts, amounts)
                .Select(usage => new SourceUsageDto(
                    usage.SourceEntryId,
                    Name(names, usage.SourceEntryId),
                    usage.Available,
                    usage.Allocated,
                    usage.Status.ToString()))
                .ToList());
    }

    public static async Task<List<PlannedEntry>> IncomeFor(
        IEntryRepository entries, Guid userId, MonthKey month) =>
        MonthlyPlan.For(
                month,
                await entries.GetForUserAsync(userId),
                await entries.GetStatesForMonthAsync(userId, month))
            .Where(item => item.Entry.Kind == EntryKind.Income)
            .ToList();

    private static SavingsAccountDto ToDto(
        PlannedAccount planned,
        IReadOnlyDictionary<Guid, decimal> amounts,
        IReadOnlyDictionary<Guid, string> names) =>
        new(planned.Account.Id,
            planned.Account.Name,
            planned.Account.Icon,
            planned.Account.Goal,
            planned.Account.Saved,
            planned.Amount,
            planned.IsTransferred,
            planned.Account.Rules
                .Select(rule => new AllocationRuleDto(
                    rule.SourceEntryId,
                    Name(names, rule.SourceEntryId),
                    rule.RuleType.ToString(),
                    rule.Value,
                    SavingsPlan.AmountFor(rule, Amount(amounts, rule.SourceEntryId))))
                .ToList());

    private static string Name(IReadOnlyDictionary<Guid, string> names, Guid id) =>
        names.TryGetValue(id, out var name) ? name : MissingSource;

    private static decimal Amount(IReadOnlyDictionary<Guid, decimal> amounts, Guid id) =>
        amounts.TryGetValue(id, out var amount) ? amount : 0m;
}
