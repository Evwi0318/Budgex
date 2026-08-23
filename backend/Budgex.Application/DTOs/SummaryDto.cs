namespace Budgex.Application.DTOs;

public sealed record SummaryDto(
    decimal Income,
    decimal TotalExpenses,
    decimal TotalSavings,
    decimal SafeToSpend
);
