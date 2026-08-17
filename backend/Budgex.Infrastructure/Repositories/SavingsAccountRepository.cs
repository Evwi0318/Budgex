using Budgex.Application.Interfaces;
using Budgex.Domain.Entities;
using Budgex.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Budgex.Infrastructure.Repositories;

public sealed class SavingsAccountRepository(BudgexDbContext db) : ISavingsAccountRepository
{
    // Ägarskapet verifieras via månaden — utan detta kan en inloggad
    // användare radera andras sparkonton genom att gissa id:n
    public Task<SavingsAccount?> GetByIdAsync(Guid id, Guid userId) =>
        db.SavingsAccounts.FirstOrDefaultAsync(sa =>
            sa.Id == id &&
            db.BudgetMonths.Any(bm => bm.Id == sa.BudgetMonthId && bm.UserId == userId));

    public async Task AddAsync(SavingsAccount account) =>
        await db.SavingsAccounts.AddAsync(account);

    public Task DeleteAsync(SavingsAccount account)
    {
        db.SavingsAccounts.Remove(account);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync() =>
        db.SaveChangesAsync();
}