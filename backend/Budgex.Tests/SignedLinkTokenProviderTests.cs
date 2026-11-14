using Budgex.Infrastructure.Identity;
using Microsoft.Extensions.Options;

namespace Budgex.Tests;

public sealed class SignedLinkTokenProviderTests
{
    private const string Purpose = "ResetPassword";

    private static readonly DateTimeOffset Now = new(2026, 11, 14, 12, 0, 0, TimeSpan.Zero);

    private static readonly ApplicationUser User = new()
    {
        Id = Guid.NewGuid(),
        Email = "evan@budgex.se",
        SecurityStamp = "stamp-1",
    };

    [Fact]
    public async Task Token_IsValid_WithinTheHour()
    {
        var token = await Provider(Now).GenerateAsync(Purpose, null!, User);

        Assert.True(await Provider(Now.AddMinutes(59)).ValidateAsync(Purpose, token, null!, User));
    }

    [Fact]
    public async Task Token_Expires_AfterAnHour()
    {
        var token = await Provider(Now).GenerateAsync(Purpose, null!, User);

        Assert.False(await Provider(Now.AddMinutes(61)).ValidateAsync(Purpose, token, null!, User));
    }

    [Fact]
    public async Task Token_StopsWorking_WhenTheSecurityStampChanges()
    {
        var token = await Provider(Now).GenerateAsync(Purpose, null!, User);
        var afterReset = new ApplicationUser { Id = User.Id, Email = User.Email, SecurityStamp = "stamp-2" };

        Assert.False(await Provider(Now).ValidateAsync(Purpose, token, null!, afterReset));
    }

    [Fact]
    public async Task Token_IsTiedToItsPurpose()
    {
        var token = await Provider(Now).GenerateAsync(Purpose, null!, User);

        Assert.False(await Provider(Now).ValidateAsync("EmailConfirmation", token, null!, User));
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-a-token")]
    [InlineData("9999999999.forged")]
    public async Task MalformedOrForgedTokens_AreRejected(string token)
    {
        Assert.False(await Provider(Now).ValidateAsync(Purpose, token, null!, User));
    }

    [Fact]
    public async Task ExtendingTheExpiry_BreaksTheSignature()
    {
        var token = await Provider(Now).GenerateAsync(Purpose, null!, User);
        var signature = token.Split('.')[1];
        var extended = $"{Now.AddDays(30).ToUnixTimeSeconds()}.{signature}";

        Assert.False(await Provider(Now.AddHours(2)).ValidateAsync(Purpose, extended, null!, User));
    }

    private static SignedLinkTokenProvider Provider(DateTimeOffset now) => new(
        Options.Create(new JwtSettings
        {
            SecretKey = "unit-test-key-som-ar-minst-32-tecken-lang",
            Issuer = "test",
            Audience = "test",
        }),
        new FixedClock(now));

    private sealed class FixedClock(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
