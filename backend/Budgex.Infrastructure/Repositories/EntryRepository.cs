using Budgex.Application.Interfaces;
using Budgex.Domain.Common;
using Budgex.Domain.Entities;
using Budgex.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Budgex.Infrastructure.Repositories;

public sealed class EntryRepository(BudgexDbContext db) : IEntryRepository
{
    public Task<List<Entry>> GetForUserAsync(Guid userId) =>
        db.Entries.Where(entry => entry.UserId == userId).ToListAsync();

    public Task<List<EntryMonthState>> GetStatesForMonthAsync(Guid userId, MonthKey month) =>
        db.EntryMonthStates
            .Where(state => state.Month == month &&
                            db.Entries.Any(entry => entry.Id == state.EntryId &&
                                                    entry.UserId == userId))
            .ToListAsync();

    public Task<Entry?> GetByIdAsync(Guid id, Guid userId) =>
        db.Entries.FirstOrDefaultAsync(entry => entry.Id == id && entry.UserId == userId);

    public Task<List<EntryMonthState>> GetStatesForEntryAsync(Guid entryId) =>
        db.EntryMonthStates.Where(state => state.EntryId == entryId).ToListAsync();

    public async Task AddAsync(Entry entry) =>
        await db.Entries.AddAsync(entry);

    public Task RemoveAsync(Entry entry)
    {
        db.Entries.Remove(entry);
        return Task.CompletedTask;
    }

    public Task SaveStatesAsync(IEnumerable<EntryMonthState> states)
    {
        foreach (var state in states)
        {
            if (db.Entry(state).State == EntityState.Detached)
            {
                db.EntryMonthStates.Add(state);
            }
        }

        return Task.CompletedTask;
    }

    public Task SaveChangesAsync() =>
        db.SaveChangesAsync();
}
