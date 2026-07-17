using Budgex.Application.Interfaces;
using Budgex.Domain.Entities;
using Budgex.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Budgex.Infrastructure.Repositories;

public sealed class SavingsAccountRepository(BudgexDbContext db) : ISavingsAccountRepository
{
    public Task<SavingsAccount?> GetByIdAsync(Guid id, Guid userId) =>
        db.SavingsAccounts
            .FirstOrDefaultAsync(sa => sa.Id == id);

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