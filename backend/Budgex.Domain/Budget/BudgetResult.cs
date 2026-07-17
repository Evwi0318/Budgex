namespace Budgex.Domain.Budget;

public sealed record BudgetResult(
    decimal SafeToSpend,
    decimal TransferToBank
);