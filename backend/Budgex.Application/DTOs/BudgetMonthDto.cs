namespace Budgex.Application.DTOs;

public sealed record IncomeSourceDto(
    Guid Id,
    string Type,
    decimal Amount,
    decimal? LoanAmount
);

public sealed record ExpenseDto(
    Guid Id,
    string Name,
    decimal Amount,
    string Category
);

public sealed record SavingsAccountDto(
    Guid Id,
    string Name,
    string Icon,
    string RuleType,
    decimal RuleValue
);

public sealed record BudgetMonthDto(
    Guid Id,
    int Year,
    int Month,
    List<IncomeSourceDto> IncomeSources,
    List<ExpenseDto> Expenses,
    List<SavingsAccountDto> SavingsAccounts
);