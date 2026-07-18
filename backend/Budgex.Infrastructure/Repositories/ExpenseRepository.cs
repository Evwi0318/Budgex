using Budgex.Application.Interfaces;
using Budgex.Domain.Entities;
using Budgex.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Budgex.Infrastructure.Repositories;

public sealed class ExpenseRepository(BudgexDbContext db) : IExpenseRepository
{
    public Task<Expense?> GetByIdAsync(Guid id, Guid userId) =>
        db.Expenses
            .Include(e => e.BudgetMonthId)
            .FirstOrDefaultAsync(e => e.Id == id);

    public async Task AddAsync(Expense expense) =>
        await db.Expenses.AddAsync(expense);

    public Task DeleteAsync(Expense expense)
    {
        db.Expenses.Remove(expense);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync() =>
        db.SaveChangesAsync();
}