namespace Budgex.Domain.Entities;

public enum IncomeType { Salary, Csn }

public sealed class IncomeSource
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid BudgetMonthId { get; init; }
    public IncomeType Type { get; set; }
    public decimal Amount { get; set; }
    public decimal? LoanAmount { get; set; }
}