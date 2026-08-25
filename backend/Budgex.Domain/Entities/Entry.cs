using Budgex.Domain.Common;

namespace Budgex.Domain.Entities;

public enum EntryKind { Income, Expense }

public enum EntryCategory
{
    Housing,
    Food,
    Transport,
    Bills,
    Subscription,
    Loan,
    Insurance,
    Health,
    Shopping,
    Travel,
    Salary,
    Grant,
    Transfer,
    Sale,
    Other
}

public sealed class Entry
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid UserId { get; init; }
    public EntryKind Kind { get; init; }
    public required string Name { get; set; }
    public EntryCategory Category { get; set; }
    public decimal Amount { get; set; }
    public bool IsAutogiro { get; set; }
    public MonthKey From { get; set; }
    public MonthKey? To { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;

    public bool LiveIn(MonthKey month) =>
        From <= month && (To is null || month < To.Value);
}