using System.Net;
using System.Net.Http.Json;
using System.Text.RegularExpressions;

namespace Budgex.Tests.Integration;

public sealed partial class EmailVerificationTests(EmailApiFactory factory)
    : IClassFixture<EmailApiFactory>
{
    private const string Password = "Test1234!";
    private const string ConfirmSubject = "Bekräfta din e-post";

    [Fact]
    public async Task Register_NewAndTakenAddress_GiveTheSameResponse()
    {
        var client = factory.CreateClient();
        var email = NewEmail();

        var first = await RegisterAsync(client, email);
        var again = await RegisterAsync(client, email);

        Assert.Equal(HttpStatusCode.Accepted, first.StatusCode);
        Assert.Equal(first.StatusCode, again.StatusCode);
        Assert.Equal(await first.Content.ReadAsStringAsync(), await again.Content.ReadAsStringAsync());
        Assert.Single(factory.Outbox.Sent, message => message.To == email && message.Subject == ConfirmSubject);
        Assert.Single(factory.Outbox.Sent, message => message.To == email && message.Subject == "Du har redan ett konto");
    }

    [Fact]
    public async Task Register_WithAWeakPassword_FailsTheSameWayForNewAndTakenAddresses()
    {
        var client = factory.CreateClient();
        var taken = NewEmail();
        await RegisterAsync(client, taken);

        var forTaken = await client.PostAsJsonAsync("/api/auth/register", new { email = taken, password = "kort" });
        var forNew = await client.PostAsJsonAsync("/api/auth/register", new { email = NewEmail(), password = "kort" });

        Assert.Equal(HttpStatusCode.BadRequest, forTaken.StatusCode);
        Assert.Equal(await forNew.Content.ReadAsStringAsync(), await forTaken.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Login_BeforeConfirming_IsRefusedWithAHint()
    {
        var client = factory.CreateClient();
        var email = NewEmail();
        await RegisterAsync(client, email);

        var login = await LoginAsync(client, email);

        Assert.Equal(HttpStatusCode.Forbidden, login.StatusCode);
        Assert.Contains("needsConfirmation", await login.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Login_BeforeConfirming_WithAWrongPassword_RevealsNothing()
    {
        var client = factory.CreateClient();
        var email = NewEmail();
        await RegisterAsync(client, email);

        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "WrongPassword1!" });

        Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);
    }

    [Fact]
    public async Task ConfirmEmail_WithTheLinkFromTheEmail_LetsTheUserSignIn()
    {
        var client = factory.CreateClient();
        var email = NewEmail();
        await RegisterAsync(client, email);

        var confirm = await ConfirmAsync(email, TokenFromEmail(email));

        Assert.Equal(HttpStatusCode.NoContent, confirm.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await LoginAsync(client, email)).StatusCode);
    }

    [Fact]
    public async Task ConfirmEmail_WithAForgedToken_IsRejected()
    {
        var client = factory.CreateClient();
        var email = NewEmail();
        await RegisterAsync(client, email);

        var confirm = await ConfirmAsync(email, "9999999999.forged");

        Assert.Equal(HttpStatusCode.BadRequest, confirm.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await LoginAsync(client, email)).StatusCode);
    }

    [Fact]
    public async Task ResendConfirmation_AnswersTheSameAndOnlyMailsUnconfirmedAccounts()
    {
        var client = factory.CreateClient();
        var waiting = NewEmail();
        var unknown = NewEmail();
        await RegisterAsync(client, waiting);

        var forWaiting = await client.PostAsJsonAsync("/api/auth/resend-confirmation", new { email = waiting });
        var forUnknown = await client.PostAsJsonAsync("/api/auth/resend-confirmation", new { email = unknown });

        Assert.Equal(HttpStatusCode.Accepted, forWaiting.StatusCode);
        Assert.Equal(forWaiting.StatusCode, forUnknown.StatusCode);
        Assert.Equal(2, factory.Outbox.Sent.Count(message => message.To == waiting && message.Subject == ConfirmSubject));
        Assert.DoesNotContain(factory.Outbox.Sent, message => message.To == unknown);
    }

    [Fact]
    public async Task Demo_IsUsableWithoutConfirming()
    {
        var demo = await factory.CreateClient().PostAsync("/api/auth/demo", null);

        Assert.Equal(HttpStatusCode.OK, demo.StatusCode);
    }

    private static string NewEmail() => $"{Guid.NewGuid()}@budgex.se";

    private static Task<HttpResponseMessage> RegisterAsync(HttpClient client, string email) =>
        client.PostAsJsonAsync("/api/auth/register", new { email, password = Password });

    private static Task<HttpResponseMessage> LoginAsync(HttpClient client, string email) =>
        client.PostAsJsonAsync("/api/auth/login", new { email, password = Password });

    private Task<HttpResponseMessage> ConfirmAsync(string email, string token) =>
        factory.CreateClient().PostAsJsonAsync("/api/auth/confirm-email", new { email, token });

    private string TokenFromEmail(string email)
    {
        var message = factory.Outbox.Sent.Last(sent => sent.To == email && sent.Subject == ConfirmSubject);
        return Uri.UnescapeDataString(TokenInLink().Match(message.Text).Groups[1].Value);
    }

    [GeneratedRegex(@"token=([^\s&]+)")]
    private static partial Regex TokenInLink();
}
