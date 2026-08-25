using Budgex.Domain.Common;

namespace Budgex.Domain.Entities;

public sealed class SavingsAccount
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid UserId { get; init; }
    public required string Name { get; set; }
    public required string Icon { get; set; }
    public decimal? Goal { get; set; }
    public decimal? Saved { get; set; }
    public MonthKey From { get; set; }
    public MonthKey? To { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public List<AllocationRule> Rules { get; init; } = [];

    public bool LiveIn(MonthKey month) =>
        From <= month && (To is null || month < To.Value);
}
