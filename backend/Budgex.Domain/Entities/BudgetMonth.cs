namespace Budgex.Domain.Entities;

public sealed class BudgetMonth
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid UserId { get; init; }
    public int Year { get; set; }
    public int Month { get; set; }
    public List<IncomeSource> IncomeSources { get; init; } = [];
    public List<Expense> Expenses { get; init; } = [];
    public List<SavingsAccount> SavingsAccounts { get; init; } = [];
}