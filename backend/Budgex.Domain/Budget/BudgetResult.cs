namespace Budgex.Domain.Budget;

public sealed record BudgetResult(
    decimal Income,
    decimal TotalSavings,
    decimal SafeToSpend
);
