namespace Budgex.Domain.Allocation;

public sealed class FixedRule(decimal amount) : IAllocationRule
{
    public decimal CalculateAmount(decimal income) => amount;
}