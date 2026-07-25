using System.Net;
using System.Net.Http.Json;

namespace Budgex.Tests.Integration;

public sealed class AuthEndpointsTests(AuthApiFactory factory)
    : IClassFixture<AuthApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Register_WithNewEmail_ReturnsCreated()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            email = $"{Guid.NewGuid()}@budgex.se",
            password = "Test1234!"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsConflict()
    {
        var email = $"{Guid.NewGuid()}@budgex.se";
        var request = new { email, password = "Test1234!" };

        await _client.PostAsJsonAsync("/api/auth/register", request);
        var secondResponse = await _client.PostAsJsonAsync("/api/auth/register", request);

        Assert.Equal(HttpStatusCode.Conflict, secondResponse.StatusCode);
    }

    [Fact]
    public async Task Login_WithCorrectCredentials_ReturnsTokens()
    {
        var email = $"{Guid.NewGuid()}@budgex.se";
        var password = "Test1234!";

        await _client.PostAsJsonAsync("/api/auth/register", new { email, password });

        var response = await _client.PostAsJsonAsync("/api/auth/login", new { email, password });
        var body = await response.Content.ReadFromJsonAsync<AuthResponseDto>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body!.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(body.RefreshToken));
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        var email = $"{Guid.NewGuid()}@budgex.se";

        await _client.PostAsJsonAsync("/api/auth/register", new { email, password = "Test1234!" });

        var response = await _client.PostAsJsonAsync("/api/auth/login", new { email, password = "WrongPassword1!" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/months/2026/7");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithValidToken_ReturnsOk()
    {
        var email = $"{Guid.NewGuid()}@budgex.se";
        var password = "Test1234!";

        await _client.PostAsJsonAsync("/api/auth/register", new { email, password });
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new { email, password });
        var tokens = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();

        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tokens!.AccessToken);

        var response = await _client.GetAsync("/api/months/2026/7");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Refresh_WithUsedToken_ReturnsUnauthorized()
    {
        var email = $"{Guid.NewGuid()}@budgex.se";
        var password = "Test1234!";

        await _client.PostAsJsonAsync("/api/auth/register", new { email, password });
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new { email, password });
        var tokens = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();

        // Första refresh - ska lyckas och rotera token
        await _client.PostAsJsonAsync("/api/auth/refresh", new { refreshToken = tokens!.RefreshToken });

        // Andra refresh med SAMMA (nu redan använda) token - ska nekas
        var replayResponse = await _client.PostAsJsonAsync("/api/auth/refresh", new { refreshToken = tokens.RefreshToken });

        Assert.Equal(HttpStatusCode.Unauthorized, replayResponse.StatusCode);
    }

    [Fact]
    public async Task Logout_ThenRefresh_ReturnsUnauthorized()
    {
        var email = $"{Guid.NewGuid()}@budgex.se";
        var password = "Test1234!";

        await _client.PostAsJsonAsync("/api/auth/register", new { email, password });
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new { email, password });
        var tokens = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();

        await _client.PostAsJsonAsync("/api/auth/logout", new { refreshToken = tokens!.RefreshToken });

        var refreshResponse = await _client.PostAsJsonAsync("/api/auth/refresh", new { refreshToken = tokens.RefreshToken });

        Assert.Equal(HttpStatusCode.Unauthorized, refreshResponse.StatusCode);
    }

    private sealed record AuthResponseDto(string AccessToken, string RefreshToken, DateTime RefreshTokenExpiresAt);
}