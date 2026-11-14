using Budgex.Domain.Common;
using Budgex.Domain.Entities;
using Budgex.Domain.Savings;

namespace Budgex.Application.Interfaces;

public interface ISavingsRepository
{
    Task<List<SavingsAccount>> GetForUserAsync(Guid userId);
    Task<SavingsAccount?> GetByIdAsync(Guid id, Guid userId);
    Task<List<SavingsMonthState>> GetStatesForMonthAsync(Guid userId, MonthKey month);
    Task AddAsync(SavingsAccount account);
    Task RemoveAsync(SavingsAccount account);
    Task ReplaceRulesAsync(SavingsAccount account, IEnumerable<AllocationRule> rules);

    /// Allt eller inget. Falskt när en ångring skulle dra mer än kontots
    /// saldo, vilket betyder att saldot ändrats efter överföringen.
    Task<bool> SetTransferredAsync(IReadOnlyList<PlannedTransfer> transfers, MonthKey month, bool isTransferred);
    Task SaveChangesAsync();
}
