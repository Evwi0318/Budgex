using Budgex.Domain.Entities;

namespace Budgex.Application.Interfaces;

public interface ISavingsAccountRepository
{
    Task<SavingsAccount?> GetByIdAsync(Guid id, Guid userId);
    Task AddAsync(SavingsAccount account);
    Task DeleteAsync(SavingsAccount account);
    Task SaveChangesAsync();
}