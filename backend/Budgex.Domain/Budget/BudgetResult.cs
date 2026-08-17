namespace Budgex.Domain.Budget;

public sealed record BudgetResult(
    decimal DisposableIncome,
    decimal TotalSavings,
    decimal SafeToSpend,
    decimal TransferToBank
);
