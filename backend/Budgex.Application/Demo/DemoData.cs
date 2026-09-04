using Budgex.Domain.Common;
using Budgex.Domain.Entities;

namespace Budgex.Application.Demo;

public sealed record DemoBudget(
    IReadOnlyList<Entry> Entries,
    IReadOnlyList<EntryMonthState> EntryStates,
    IReadOnlyList<SavingsAccount> Accounts,
    IReadOnlyList<SavingsMonthState> AccountStates);

public static class DemoData
{
    public const string EmailDomain = "budgex.demo";
    public const string UserName = "Demo";

    private const int MonthsOfHistory = 2;

    public static DemoBudget Create(Guid userId, MonthKey current)
    {
        var start = current.AddMonths(-MonthsOfHistory);

        var salary = Income(userId, "Lön", EntryCategory.Salary, 14_200m, start);
        var grant = Income(userId, "CSN", EntryCategory.Grant, 12_000m, start);
        var electricity = Expense(userId, "Elräkning", EntryCategory.Bills, 640m, start);

        var entries = new List<Entry>
        {
            salary,
            grant,
            Expense(userId, "Hyra", EntryCategory.Housing, 7_450m, start, autogiro: true),
            Expense(userId, "Mat", EntryCategory.Food, 3_200m, start),
            electricity,
            Expense(userId, "Busskort", EntryCategory.Transport, 1_020m, start, autogiro: true),
            Expense(userId, "Mobil", EntryCategory.Bills, 245m, start, autogiro: true),
            Expense(userId, "Spotify", EntryCategory.Subscription, 139m, start, autogiro: true),
            Expense(userId, "Träningskort", EntryCategory.Health, 349m, start, autogiro: true),
            Expense(userId, "Tandläkare", EntryCategory.Health, 1_250m, current, to: current.Next)
        };

        var buffer = Account(userId, "Buffert", "🐷", goal: 30_000m, saved: 12_400m, start);
        buffer.Rules.Add(Rule(buffer.Id, salary.Id, RuleType.Percentage, 10m));

        var trip = Account(userId, "Resa", "✈️", goal: 18_000m, saved: 4_800m, start);
        trip.Rules.Add(Rule(trip.Id, grant.Id, RuleType.Fixed, 900m));

        var accounts = new List<SavingsAccount> { buffer, trip };
        var closedMonths = Enumerable.Range(0, MonthsOfHistory).Select(start.AddMonths).ToList();

        var entryStates = closedMonths
            .SelectMany(month => entries
                .Where(entry => IsPayable(entry) && entry.LiveIn(month))
                .Select(entry => Paid(entry.Id, month)))
            .ToList();

        entryStates.Add(Paid(electricity.Id, current));

        var accountStates = closedMonths
            .SelectMany(month => accounts.Select(account => Transferred(account.Id, month)))
            .ToList();

        return new DemoBudget(entries, entryStates, accounts, accountStates);
    }

    // Autogiron dras av sig själva och räknas aldrig som "kvar att betala"
    private static bool IsPayable(Entry entry) =>
        entry.Kind == EntryKind.Expense && !entry.IsAutogiro;

    private static Entry Income(
        Guid userId, string name, EntryCategory category, decimal amount, MonthKey from) =>
        new()
        {
            UserId = userId,
            Kind = EntryKind.Income,
            Name = name,
            Category = category,
            Amount = amount,
            From = from
        };

    private static Entry Expense(
        Guid userId,
        string name,
        EntryCategory category,
        decimal amount,
        MonthKey from,
        bool autogiro = false,
        MonthKey? to = null) =>
        new()
        {
            UserId = userId,
            Kind = EntryKind.Expense,
            Name = name,
            Category = category,
            Amount = amount,
            IsAutogiro = autogiro,
            From = from,
            To = to
        };

    private static SavingsAccount Account(
        Guid userId, string name, string icon, decimal goal, decimal saved, MonthKey from) =>
        new()
        {
            UserId = userId,
            Name = name,
            Icon = icon,
            Goal = goal,
            Saved = saved,
            From = from
        };

    private static AllocationRule Rule(
        Guid accountId, Guid sourceEntryId, RuleType ruleType, decimal value) =>
        new()
        {
            SavingsAccountId = accountId,
            SourceEntryId = sourceEntryId,
            RuleType = ruleType,
            Value = value
        };

    private static EntryMonthState Paid(Guid entryId, MonthKey month) =>
        new() { EntryId = entryId, Month = month, IsPaid = true };

    private static SavingsMonthState Transferred(Guid accountId, MonthKey month) =>
        new() { SavingsAccountId = accountId, Month = month, IsTransferred = true };
}
