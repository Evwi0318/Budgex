namespace Budgex.Domain.Entities;

public enum RuleType { Fixed, Percentage }

public sealed class AllocationRule
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid SavingsAccountId { get; init; }
    public Guid SourceEntryId { get; init; }
    public RuleType RuleType { get; set; }
    public decimal Value { get; set; }
}
