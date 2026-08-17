using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Budgex.Application.Interfaces;
using Budgex.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Budgex.Infrastructure.Identity;

public sealed class TokenService(IOptions<JwtSettings> jwtOptions) : ITokenService
{
    private readonly JwtSettings _settings = jwtOptions.Value;

    public string CreateAccessToken(User user)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_settings.AccessTokenExpiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public (RefreshToken Token, string RawValue) CreateRefreshToken(Guid userId)
    {
        var rawValue = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

        var token = new RefreshToken
        {
            UserId = userId,
            TokenHash = HashRefreshToken(rawValue),
            ExpiresAt = DateTime.UtcNow.AddDays(_settings.RefreshTokenExpiryDays)
        };

        return (token, rawValue);
    }

    // SHA-256 räcker och ska användas här: värdet är redan 64 slumpbytes,
    // så det finns inget att gissa sig till. Lösenord behöver bcrypt för
    // att de är korta och förutsägbara — det gäller inte det här.
    public string HashRefreshToken(string rawValue) =>
        Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(rawValue)));
}
