using Budgex.Domain.Entities;

namespace Budgex.Application.Interfaces;

public interface ITokenService
{
    string CreateAccessToken(User user);

    /// RawValue är enda gången värdet finns i klartext — det går till
    /// cookien, medan entiteten bär avtrycket som sparas i databasen.
    (RefreshToken Token, string RawValue) CreateRefreshToken(Guid userId);

    string HashRefreshToken(string rawValue);
}
