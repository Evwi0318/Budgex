using Budgex.Application.Interfaces;
using Budgex.Domain.Common;
using Budgex.Domain.Entities;
using Budgex.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Budgex.Infrastructure.Repositories;

public sealed class SavingsRepository(BudgexDbContext db) : ISavingsRepository
{
    public Task<List<SavingsAccount>> GetForUserAsync(Guid userId) =>
        db.SavingsAccounts
            .Include(account => account.Rules)
            .Where(account => account.UserId == userId)
            .ToListAsync();

    public Task<SavingsAccount?> GetByIdAsync(Guid id, Guid userId) =>
        db.SavingsAccounts
            .Include(account => account.Rules)
            .FirstOrDefaultAsync(account => account.Id == id && account.UserId == userId);

    public Task<List<SavingsMonthState>> GetStatesForMonthAsync(Guid userId, MonthKey month) =>
        db.SavingsMonthStates
            .Where(state => state.Month == month &&
                            db.SavingsAccounts.Any(account => account.Id == state.SavingsAccountId &&
                                                              account.UserId == userId))
            .ToListAsync();

    public async Task AddAsync(SavingsAccount account) =>
        await db.SavingsAccounts.AddAsync(account);

    public Task RemoveAsync(SavingsAccount account)
    {
        db.SavingsAccounts.Remove(account);
        return Task.CompletedTask;
    }

    public Task ReplaceRulesAsync(SavingsAccount account, IEnumerable<AllocationRule> rules)
    {
        db.AllocationRules.RemoveRange(account.Rules);
        account.Rules.Clear();
        account.Rules.AddRange(rules);

        return Task.CompletedTask;
    }

    public Task SaveStatesAsync(IEnumerable<SavingsMonthState> states)
    {
        foreach (var state in states)
        {
            if (db.Entry(state).State == EntityState.Detached)
            {
                db.SavingsMonthStates.Add(state);
            }
        }

        return Task.CompletedTask;
    }

    public Task SaveChangesAsync() =>
        db.SaveChangesAsync();
}
