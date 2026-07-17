namespace Budgex.Domain.Allocation;

public sealed class PercentageRule(decimal percent) : IAllocationRule
{
    public decimal CalculateAmount(decimal income) =>
        Math.Round(income * percent / 100m);
}