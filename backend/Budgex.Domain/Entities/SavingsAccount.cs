namespace Budgex.Domain.Entities;

public enum RuleType { Fixed, Percentage }

public sealed class SavingsAccount
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid BudgetMonthId { get; init; }
    public required string Name { get; set; }
    public required string Icon { get; set; }
    public RuleType RuleType { get; set; }
    public decimal RuleValue { get; set; }
}