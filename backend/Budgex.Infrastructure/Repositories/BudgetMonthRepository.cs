using Budgex.Application.Interfaces;
using Budgex.Domain.Entities;
using Budgex.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Budgex.Infrastructure.Repositories;

public sealed class BudgetMonthRepository(BudgexDbContext db) : IBudgetMonthRepository
{
    public Task<BudgetMonth?> GetByIdAsync(Guid id, Guid userId) =>
        db.BudgetMonths
            .Include(bm => bm.IncomeSources)
            .Include(bm => bm.Expenses)
            .Include(bm => bm.SavingsAccounts)
            .FirstOrDefaultAsync(bm => bm.Id == id && bm.UserId == userId);

    public Task<BudgetMonth?> GetByYearMonthAsync(Guid userId, int year, int month) =>
        db.BudgetMonths
            .Include(bm => bm.IncomeSources)
            .Include(bm => bm.Expenses)
            .Include(bm => bm.SavingsAccounts)
            .FirstOrDefaultAsync(bm => bm.UserId == userId
                                    && bm.Year == year
                                    && bm.Month == month);

    public async Task AddAsync(BudgetMonth budgetMonth) =>
        await db.BudgetMonths.AddAsync(budgetMonth);

    public Task SaveChangesAsync() =>
        db.SaveChangesAsync();
}