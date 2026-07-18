using Budgex.Domain.Entities;

namespace Budgex.Application.Interfaces;

public interface IBudgetMonthRepository
{
    Task<BudgetMonth?> GetByIdAsync(Guid id, Guid userId);
    Task<BudgetMonth?> GetByYearMonthAsync(Guid userId, int year, int month);
    Task AddAsync(BudgetMonth budgetMonth);
    Task SaveChangesAsync();
}