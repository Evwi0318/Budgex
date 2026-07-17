namespace Budgex.Domain.Allocation;

public interface IAllocationRule
{
    decimal CalculateAmount(decimal income);
}