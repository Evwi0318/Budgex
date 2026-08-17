using System.Net;
using System.Net.Http.Json;

namespace Budgex.Tests.Integration;

public sealed class AuthEndpointsTests(AuthApiFactory factory)
    : IClassFixture<AuthApiFactory>
{
    private readonly AuthApiFactory _factory = factory;

    [Fact]
    public async Task Register_WithNewEmail_ReturnsCreated()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = $"{Guid.NewGuid()}@budgex.se",
            password = "Test1234!"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsConflict()
    {
        var client = _factory.CreateClient();
        var email = $"{Guid.NewGuid()}@budgex.se";
        var request = new { email, password = "Test1234!" };

        await client.PostAsJsonAsync("/api/auth/register", request);
        var secondResponse = await client.PostAsJsonAsync("/api/auth/register", request);

        Assert.Equal(HttpStatusCode.Conflict, secondResponse.StatusCode);
    }

    [Fact]
    public async Task Login_WithCorrectCredentials_ReturnsAccessTokenAndSetsCookie()
    {
        var client = _factory.CreateClientWithCookies();
        var email = $"{Guid.NewGuid()}@budgex.se";
        var password = "Test1234!";

        await client.PostAsJsonAsync("/api/auth/register", new { email, password });

        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        var body = await response.Content.ReadFromJsonAsync<AuthResponseDto>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body!.AccessToken));
        Assert.True(response.Headers.TryGetValues("Set-Cookie", out _));
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var email = $"{Guid.NewGuid()}@budgex.se";

        await client.PostAsJsonAsync("/api/auth/register", new { email, password = "Test1234!" });

        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "WrongPassword1!" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_AfterFiveWrongPasswords_LocksTheAccount()
    {
        var client = _factory.CreateClient();
        var email = $"{Guid.NewGuid()}@budgex.se";
        var password = "Test1234!";

        await client.PostAsJsonAsync("/api/auth/register", new { email, password });

        for (var attempt = 0; attempt < 5; attempt++)
        {
            await client.PostAsJsonAsync("/api/auth/login", new { email, password = "WrongPassword1!" });
        }

        // Rätt lösenord ska inte längre släppa in — kontot är låst
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithoutToken_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/months/2026/7");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithValidToken_ReturnsOk()
    {
        var client = _factory.CreateClientWithCookies();
        var email = $"{Guid.NewGuid()}@budgex.se";
        var password = "Test1234!";

        await client.PostAsJsonAsync("/api/auth/register", new { email, password });
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        var tokens = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();

        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tokens!.AccessToken);

        var response = await client.GetAsync("/api/months/2026/7");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

   [Fact]
public async Task Refresh_WithValidCookie_ReturnsNewAccessToken()
{
    var client = _factory.CreateClientWithCookies();
    var email = $"{Guid.NewGuid()}@budgex.se";
    var password = "Test1234!";

    await client.PostAsJsonAsync("/api/auth/register", new { email, password });
    var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new { email, password });

    Assert.True(loginResponse.Headers.TryGetValues("Set-Cookie", out var loginCookies));

    var refreshResponse = await client.PostAsync("/api/auth/refresh", null);
    var rawBody = await refreshResponse.Content.ReadAsStringAsync();

    Assert.True(
        refreshResponse.StatusCode == HttpStatusCode.OK,
        $"Expected OK but got {refreshResponse.StatusCode}. Body: {rawBody}");
}

    [Fact]
    public async Task Refresh_CalledTwiceInARow_SecondCallSucceedsWithRotatedCookie()
    {
        var client = _factory.CreateClientWithCookies();
        var email = $"{Guid.NewGuid()}@budgex.se";
        var password = "Test1234!";

        await client.PostAsJsonAsync("/api/auth/register", new { email, password });
        await client.PostAsJsonAsync("/api/auth/login", new { email, password });

        var first = await client.PostAsync("/api/auth/refresh", null);
        var second = await client.PostAsync("/api/auth/refresh", null);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
    }

    [Fact]
    public async Task Refresh_WithoutCookie_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsync("/api/auth/refresh", null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Logout_ThenRefresh_ReturnsUnauthorized()
    {
        var client = _factory.CreateClientWithCookies();
        var email = $"{Guid.NewGuid()}@budgex.se";
        var password = "Test1234!";

        await client.PostAsJsonAsync("/api/auth/register", new { email, password });
        await client.PostAsJsonAsync("/api/auth/login", new { email, password });

        await client.PostAsync("/api/auth/logout", null);

        var refreshResponse = await client.PostAsync("/api/auth/refresh", null);

        Assert.Equal(HttpStatusCode.Unauthorized, refreshResponse.StatusCode);
    }

    [Fact]
    public async Task Refresh_TwiceWithTheSameCookie_KeepsTheSessionAlive()
    {
        var client = _factory.CreateClientWithoutCookies();
        var cookie = await SignInAndGetRefreshCookie(client);

        // Två flikar som laddas samtidigt skickar båda den gamla cookien
        var first = await PostRefresh(client, cookie);
        var second = await PostRefresh(client, cookie);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);

        // Det viktiga: kedjan lever vidare i stället för att spärras
        var rotated = RefreshCookie(first);
        var afterRace = await PostRefresh(client, rotated);

        Assert.Equal(HttpStatusCode.OK, afterRace.StatusCode);
    }

    [Fact]
    public async Task Refresh_WithATokenTwoRotationsOld_RevokesEverything()
    {
        var client = _factory.CreateClientWithoutCookies();
        var stolen = await SignInAndGetRefreshCookie(client);

        // Kedjan rullar vidare två steg, så det stulna token ligger bakom
        var second = await PostRefresh(client, stolen);
        var third = await PostRefresh(client, RefreshCookie(second));
        var current = RefreshCookie(third);

        // Nu återanvänds det gamla — det är ingen kapplöpning längre
        var replay = await PostRefresh(client, stolen);
        Assert.Equal(HttpStatusCode.Unauthorized, replay.StatusCode);

        // Och hela sessionen ska vara spärrad, inte bara det stulna
        var afterReplay = await PostRefresh(client, current);
        Assert.Equal(HttpStatusCode.Unauthorized, afterReplay.StatusCode);
    }

    private async Task<string> SignInAndGetRefreshCookie(HttpClient client)
    {
        var email = $"{Guid.NewGuid()}@budgex.se";
        var password = "Test1234!";

        await client.PostAsJsonAsync("/api/auth/register", new { email, password });
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password });

        return RefreshCookie(login);
    }

    private static string RefreshCookie(HttpResponseMessage response) =>
        response.Headers.GetValues("Set-Cookie")
            .First(c => c.StartsWith("refreshToken="))
            .Split(';')[0];

    private static Task<HttpResponseMessage> PostRefresh(HttpClient client, string cookie)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/refresh");
        request.Headers.Add("Cookie", cookie);
        return client.SendAsync(request);
    }

    private sealed record AuthResponseDto(string AccessToken, DateTime RefreshTokenExpiresAt);
}