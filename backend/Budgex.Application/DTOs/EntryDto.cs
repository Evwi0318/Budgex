namespace Budgex.Application.DTOs;

public sealed record EntryDto(
    Guid Id,
    string Kind,
    string Name,
    string Category,
    decimal Amount,
    bool IsAutogiro,
    bool IsPaid,
    bool Repeats
);

public sealed record MonthPlanDto(
    int Year,
    int Month,
    List<EntryDto> Income,
    List<EntryDto> Expenses
);
