using Budgex.Application.Interfaces;
using Budgex.Domain.Common;
using Budgex.Domain.Entities;
using Budgex.Domain.Savings;
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

    // Varje steg är en villkorad uppdatering, så två samtidiga anrop kan inte
    // båda se kontot som ej överfört och räkna in beloppet två gånger
    public async Task<bool> SetTransferredAsync(
        IReadOnlyList<PlannedTransfer> transfers, MonthKey month, bool isTransferred)
    {
        await using var transaction = await db.Database.BeginTransactionAsync();

        foreach (var transfer in transfers)
        {
            if (isTransferred)
            {
                await TransferAsync(transfer, month);
            }
            else if (!await UndoAsync(transfer.AccountId, month))
            {
                return false;
            }
        }

        await transaction.CommitAsync();
        return true;
    }

    private async Task TransferAsync(PlannedTransfer transfer, MonthKey month)
    {
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "SavingsMonthStates" ("Id", "SavingsAccountId", "Month", "IsTransferred")
            VALUES ({Guid.NewGuid()}, {transfer.AccountId}, {month.ToString()}, false)
            ON CONFLICT ("SavingsAccountId", "Month") DO NOTHING
            """);

        var marked = await db.SavingsMonthStates
            .Where(state => state.SavingsAccountId == transfer.AccountId
                            && state.Month == month
                            && !state.IsTransferred)
            .ExecuteUpdateAsync(set => set
                .SetProperty(state => state.IsTransferred, true)
                .SetProperty(state => state.Amount, (decimal?)transfer.Amount));

        if (marked == 1)
        {
            await db.SavingsAccounts
                .Where(account => account.Id == transfer.AccountId)
                .ExecuteUpdateAsync(set => set.SetProperty(
                    account => account.Saved,
                    account => (decimal?)((account.Saved ?? 0) + transfer.Amount)));
        }
    }

    private async Task<bool> UndoAsync(Guid accountId, MonthKey month)
    {
        var state = await db.SavingsMonthStates
            .AsNoTracking()
            .FirstOrDefaultAsync(candidate => candidate.SavingsAccountId == accountId
                                              && candidate.Month == month
                                              && candidate.IsTransferred);
        if (state is null) return true;

        var unmarked = await db.SavingsMonthStates
            .Where(candidate => candidate.Id == state.Id && candidate.IsTransferred)
            .ExecuteUpdateAsync(set => set
                .SetProperty(candidate => candidate.IsTransferred, false)
                .SetProperty(candidate => candidate.Amount, (decimal?)null));

        var amount = state.Amount ?? 0;
        if (unmarked == 0 || amount == 0) return true;

        var debited = await db.SavingsAccounts
            .Where(account => account.Id == accountId && (account.Saved ?? 0) >= amount)
            .ExecuteUpdateAsync(set => set.SetProperty(
                account => account.Saved,
                account => (decimal?)((account.Saved ?? 0) - amount)));

        return debited == 1;
    }

    public Task SaveChangesAsync() =>
        db.SaveChangesAsync();
}
