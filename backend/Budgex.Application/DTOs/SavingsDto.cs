namespace Budgex.Application.DTOs;

public sealed record AllocationRuleDto(
    Guid SourceEntryId,
    string SourceName,
    string RuleType,
    decimal Value,
    decimal Amount
);

public sealed record SavingsAccountDto(
    Guid Id,
    string Name,
    string Icon,
    decimal? Goal,
    decimal? Saved,
    decimal Amount,
    bool IsTransferred,
    List<AllocationRuleDto> Rules
);

public sealed record SourceUsageDto(
    Guid SourceEntryId,
    string Name,
    decimal Available,
    decimal Allocated,
    string Status
);

public sealed record SavingsMonthDto(
    int Year,
    int Month,
    decimal Total,
    List<SavingsAccountDto> Accounts,
    List<SourceUsageDto> Sources
);
