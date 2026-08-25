using Budgex.Domain.Common;

namespace Budgex.Domain.Entities;

public sealed class SavingsMonthState
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid SavingsAccountId { get; init; }
    public MonthKey Month { get; init; }

    public decimal? Amount { get; set; }
    public bool IsTransferred { get; set; }
}
