namespace Budgex.Domain.Entities;

public sealed class SavingsItem
{
    public required string Name { get; set; }
    public decimal YearlyAmount { get; set; }
    public int DueMonth { get; set; }
}
