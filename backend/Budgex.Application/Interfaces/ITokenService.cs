using Budgex.Domain.Entities;

namespace Budgex.Application.Interfaces;

public interface ITokenService
{
    string CreateAccessToken(User user);
    RefreshToken CreateRefreshToken(Guid userId);
}