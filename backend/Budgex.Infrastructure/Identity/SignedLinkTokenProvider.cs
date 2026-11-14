using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace Budgex.Infrastructure.Identity;

// Identitys standardleverantör bygger på Data Protection, vars nycklar bara
// lever i containern: en länk skulle sluta fungera vid omstart eller på en
// annan Cloud Run-instans. Här signeras länken med en nyckel härledd ur
// Jwt:SecretKey. Säkerhetsstämpeln ingår, och Identity byter den när
// lösenordet ändras, så en länk fungerar bara en gång (ADR 0006).
public sealed class SignedLinkTokenProvider(IOptions<JwtSettings> jwt, TimeProvider clock)
    : IUserTwoFactorTokenProvider<ApplicationUser>
{
    public const string Name = "SignedLink";

    public static readonly TimeSpan Lifetime = TimeSpan.FromHours(1);

    public Task<string> GenerateAsync(
        string purpose, UserManager<ApplicationUser> manager, ApplicationUser user)
    {
        var expires = clock.GetUtcNow().Add(Lifetime).ToUnixTimeSeconds();

        return Task.FromResult($"{expires}.{Sign(purpose, user, expires)}");
    }

    public Task<bool> ValidateAsync(
        string purpose, string token, UserManager<ApplicationUser> manager, ApplicationUser user)
    {
        var parts = token.Split('.');

        var valid = parts.Length == 2
            && long.TryParse(parts[0], out var expires)
            && expires > clock.GetUtcNow().ToUnixTimeSeconds()
            && CryptographicOperations.FixedTimeEquals(
                Encoding.ASCII.GetBytes(parts[1]),
                Encoding.ASCII.GetBytes(Sign(purpose, user, expires)));

        return Task.FromResult(valid);
    }

    public Task<bool> CanGenerateTwoFactorTokenAsync(
        UserManager<ApplicationUser> manager, ApplicationUser user) => Task.FromResult(false);

    private string Sign(string purpose, ApplicationUser user, long expires)
    {
        var key = HKDF.DeriveKey(
            HashAlgorithmName.SHA256,
            Encoding.UTF8.GetBytes(jwt.Value.SecretKey),
            outputLength: 32,
            info: Encoding.UTF8.GetBytes("divunds-account-links"));

        var payload = Encoding.UTF8.GetBytes(
            $"{user.Id}|{purpose}|{user.Email}|{user.SecurityStamp}|{expires}");

        return Base64Url.EncodeToString(HMACSHA256.HashData(key, payload));
    }
}
