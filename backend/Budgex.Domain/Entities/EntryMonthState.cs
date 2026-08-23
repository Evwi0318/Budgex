using Budgex.Domain.Common;

namespace Budgex.Domain.Entities;

public sealed class EntryMonthState
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid EntryId { get; init; }
    public MonthKey Month { get; init; }
    public decimal? Amount { get; set; }
    public bool IsSkipped { get; set; }
    public bool IsPaid { get; set; }
}
