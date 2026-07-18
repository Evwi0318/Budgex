namespace Budgex.Application.DTOs;

public sealed record SummaryDto(
    decimal DisposableIncome,
    decimal TotalExpenses,
    decimal TotalSavings,
    decimal SafeToSpend,
    decimal TransferToBank
);