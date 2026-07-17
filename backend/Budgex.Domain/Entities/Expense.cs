namespace Budgex.Domain.Entities;

public sealed class Expense
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid BudgetMonthId { get; init; }
    public required string Name { get; set; }
    public decimal Amount { get; set; }
    public required string Category { get; set; }
}