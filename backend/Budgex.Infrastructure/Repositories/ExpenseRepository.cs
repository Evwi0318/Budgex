using Budgex.Application.Interfaces;
using Budgex.Domain.Entities;
using Budgex.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Budgex.Infrastructure.Repositories;

public sealed class ExpenseRepository(BudgexDbContext db) : IExpenseRepository
{
    // Ägarskapet verifieras via månaden — utan detta kan en inloggad
    // användare radera andras utgifter genom att gissa id:n
    public Task<Expense?> GetByIdAsync(Guid id, Guid userId) =>
        db.Expenses.FirstOrDefaultAsync(e =>
            e.Id == id &&
            db.BudgetMonths.Any(bm => bm.Id == e.BudgetMonthId && bm.UserId == userId));

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