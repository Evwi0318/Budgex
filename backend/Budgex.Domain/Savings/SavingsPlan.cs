using Budgex.Domain.Common;
using Budgex.Domain.Entities;

namespace Budgex.Domain.Savings;

public sealed record PlannedAccount(SavingsAccount Account, decimal Amount, bool IsTransferred);

public enum SourceStatus { Ok, Full, Over }

public sealed record SourceUsage(
    Guid SourceEntryId,
    decimal Available,
    decimal Allocated,
    SourceStatus Status);

public static class SavingsPlan
{
    public static decimal AmountFor(AllocationRule rule, decimal sourceAmount) =>
        rule.RuleType == RuleType.Fixed
            ? rule.Value
            : Math.Round(sourceAmount * rule.Value / 100m, MidpointRounding.AwayFromZero);

    public static decimal PlannedTotal(
        SavingsAccount account,
        IReadOnlyDictionary<Guid, decimal> sources) =>
        account.Rules.Sum(rule => AmountFor(rule, Available(sources, rule.SourceEntryId)));

    public static IReadOnlyList<PlannedAccount> For(
        MonthKey month,
        IEnumerable<SavingsAccount> accounts,
        IEnumerable<SavingsMonthState> states,
        IReadOnlyDictionary<Guid, decimal> sources)
    {
        var stateByAccount = states
            .Where(state => state.Month == month)
            .ToDictionary(state => state.SavingsAccountId);

        return accounts
            .Where(account => account.LiveIn(month))
            .OrderBy(account => account.CreatedAt)
            .Select(account =>
            {
                stateByAccount.TryGetValue(account.Id, out var state);

                return new PlannedAccount(
                    account,
                    state?.Amount ?? PlannedTotal(account, sources),
                    state?.IsTransferred == true);
            })
            .ToList();
    }

    public static IReadOnlyList<SourceUsage> Sources(
        MonthKey month,
        IEnumerable<SavingsAccount> accounts,
        IReadOnlyDictionary<Guid, decimal> sources)
    {
        var allocated = accounts
            .Where(account => account.LiveIn(month))
            .SelectMany(account => account.Rules)
            .GroupBy(rule => rule.SourceEntryId)
            .ToDictionary(
                group => group.Key,
                group => group.Sum(rule => AmountFor(rule, Available(sources, group.Key))));

        return allocated
            .Select(pair =>
            {
                var available = Available(sources, pair.Key);

                return new SourceUsage(pair.Key, available, pair.Value, Status(available, pair.Value));
            })
            .ToList();
    }

    private static decimal Available(IReadOnlyDictionary<Guid, decimal> sources, Guid sourceEntryId) =>
        sources.TryGetValue(sourceEntryId, out var amount) ? amount : 0m;

    private static SourceStatus Status(decimal available, decimal allocated) =>
        allocated > available ? SourceStatus.Over
        : allocated == available && allocated > 0 ? SourceStatus.Full
        : SourceStatus.Ok;
}
