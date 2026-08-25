using Budgex.Application.Interfaces;
using Budgex.Domain.Entities;
using Budgex.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Budgex.Infrastructure.Repositories;

public sealed class UserRepository(BudgexDbContext db) : IUserRepository
{
    public Task<User?> GetByEmailAsync(string email) =>
        db.DomainUsers.FirstOrDefaultAsync(u => u.Email == email);

    public Task<User?> GetByIdAsync(Guid id) =>
        db.DomainUsers.FirstOrDefaultAsync(u => u.Id == id);

    public async Task AddAsync(User user) =>
        await db.DomainUsers.AddAsync(user);

    public Task RemoveAsync(User user)
    {
        db.DomainUsers.Remove(user);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync() =>
        db.SaveChangesAsync();
}