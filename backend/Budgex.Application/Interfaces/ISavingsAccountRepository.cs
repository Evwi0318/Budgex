using Budgex.Domain.Common;
using Budgex.Domain.Entities;

namespace Budgex.Application.Interfaces;

public interface ISavingsRepository
{
    Task<List<SavingsAccount>> GetForUserAsync(Guid userId);
    Task<SavingsAccount?> GetByIdAsync(Guid id, Guid userId);
    Task<List<SavingsMonthState>> GetStatesForMonthAsync(Guid userId, MonthKey month);
    Task AddAsync(SavingsAccount account);
    Task RemoveAsync(SavingsAccount account);
    Task ReplaceRulesAsync(SavingsAccount account, IEnumerable<AllocationRule> rules);
    Task SaveStatesAsync(IEnumerable<SavingsMonthState> states);
    Task SaveChangesAsync();
}
