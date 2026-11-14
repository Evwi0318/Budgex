using System.Net;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using Budgex.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Budgex.Tests.Integration;

// Taket för återställningsmejl är fem per kvart och IP, och alla tester här
// delar IP. Därför går bara två tester via mejlet; resten hämtar token direkt.
public sealed partial class PasswordResetTests(AuthApiFactory factory)
    : IClassFixture<AuthApiFactory>
{
    private const string Password = "Test1234!";
    private const string NewPassword = "Brandnew1!";

    [Fact]
    public async Task Options_WithAnEmailSender_OfferPasswordReset()
    {
        var options = await factory.CreateClient().GetFromJsonAsync<OptionsDto>("/api/auth/options");

        Assert.True(options!.PasswordReset);
    }

    [Fact]
    public async Task ForgotPassword_AnswersTheSameForUnknownAndKnownAddresses()
    {
        var client = factory.CreateClient();
        var email = await RegisterAsync(client);
        var unknown = $"{Guid.NewGuid()}@budgex.se";

        var known = await client.PostAsJsonAsync("/api/auth/forgot-password", new { email });
        var missing = await client.PostAsJsonAsync("/api/auth/forgot-password", new { email = unknown });

        Assert.Equal(HttpStatusCode.Accepted, known.StatusCode);
        Assert.Equal(known.StatusCode, missing.StatusCode);
        Assert.Equal(await known.Content.ReadAsStringAsync(), await missing.Content.ReadAsStringAsync());
        Assert.Contains(factory.Outbox.Sent, message => message.To == email);
        Assert.DoesNotContain(factory.Outbox.Sent, message => message.To == unknown);
    }

    [Fact]
    public async Task ResetPassword_WithTheLinkFromTheEmail_ChangesThePasswordAndEndsOldSessions()
    {
        var client = factory.CreateClientWithCookies();
        var email = await RegisterAsync(client);
        await client.PostAsJsonAsync("/api/auth/login", new { email, password = Password });

        await client.PostAsJsonAsync("/api/auth/forgot-password", new { email });
        var reset = await ResetAsync(email, TokenFromEmail(email));

        var fresh = factory.CreateClient();
        Assert.Equal(HttpStatusCode.NoContent, reset.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await LoginAsync(fresh, email, NewPassword)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await LoginAsync(fresh, email, Password)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsync("/api/auth/refresh", null)).StatusCode);
    }

    [Fact]
    public async Task ResetPassword_TheSameLinkWorksOnlyOnce()
    {
        var email = await RegisterAsync(factory.CreateClient());
        var token = await TokenAsync(email);

        await ResetAsync(email, token);
        var again = await ResetAsync(email, token, "Another1!");

        Assert.Equal(HttpStatusCode.BadRequest, again.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await LoginAsync(factory.CreateClient(), email, NewPassword)).StatusCode);
    }

    [Fact]
    public async Task ResetPassword_WithATamperedToken_IsRejected()
    {
        var email = await RegisterAsync(factory.CreateClient());
        var token = await TokenAsync(email);

        var response = await ResetAsync(email, token[..^2] + "xx");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ResetPassword_WithAnotherUsersToken_IsRejected()
    {
        var victim = await RegisterAsync(factory.CreateClient());
        var attacker = await RegisterAsync(factory.CreateClient());

        var response = await ResetAsync(victim, await TokenAsync(attacker));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ResetPassword_UnlocksALockedAccount()
    {
        var client = factory.CreateClient();
        var email = await RegisterAsync(client);
        for (var attempt = 0; attempt < 5; attempt++)
        {
            await LoginAsync(client, email, "WrongPassword1!");
        }

        await ResetAsync(email, await TokenAsync(email));

        Assert.Equal(HttpStatusCode.OK, (await LoginAsync(client, email, NewPassword)).StatusCode);
    }

    private async Task<string> RegisterAsync(HttpClient client)
    {
        var email = $"{Guid.NewGuid()}@budgex.se";
        await client.PostAsJsonAsync("/api/auth/register", new { email, password = Password });
        return email;
    }

    private static Task<HttpResponseMessage> LoginAsync(HttpClient client, string email, string password) =>
        client.PostAsJsonAsync("/api/auth/login", new { email, password });

    private Task<HttpResponseMessage> ResetAsync(string email, string token, string newPassword = NewPassword) =>
        factory.CreateClient().PostAsJsonAsync("/api/auth/reset-password", new { email, token, newPassword });

    private async Task<string> TokenAsync(string email)
    {
        using var scope = factory.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        return await users.GeneratePasswordResetTokenAsync((await users.FindByEmailAsync(email))!);
    }

    private string TokenFromEmail(string email)
    {
        var message = factory.Outbox.Sent.Last(sent => sent.To == email);
        return Uri.UnescapeDataString(TokenInLink().Match(message.Text).Groups[1].Value);
    }

    [GeneratedRegex(@"token=([^\s&]+)")]
    private static partial Regex TokenInLink();

    private sealed record OptionsDto(bool PasswordReset);
}
