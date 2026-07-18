using Budgex.Domain.Entities;

namespace Budgex.Application.Interfaces;

public interface IExpenseRepository
{
    Task<Expense?> GetByIdAsync(Guid id, Guid userId);
    Task AddAsync(Expense expense);
    Task DeleteAsync(Expense expense);
    Task SaveChangesAsync();
}