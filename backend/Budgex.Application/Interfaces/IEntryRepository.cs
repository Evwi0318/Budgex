using Budgex.Domain.Common;
using Budgex.Domain.Entities;

namespace Budgex.Application.Interfaces;

public interface IEntryRepository
{
    Task<List<Entry>> GetForUserAsync(Guid userId);
    Task<List<EntryMonthState>> GetStatesForMonthAsync(Guid userId, MonthKey month);
    Task<Entry?> GetByIdAsync(Guid id, Guid userId);
    Task<List<EntryMonthState>> GetStatesForEntryAsync(Guid entryId);
    Task AddAsync(Entry entry);
    Task RemoveAsync(Entry entry);
    Task SaveStatesAsync(IEnumerable<EntryMonthState> states);
    Task SaveChangesAsync();
}
