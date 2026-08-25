using System.Net;
using System.Net.Http.Json;

namespace Budgex.Tests.Integration;

public sealed class ProfileEndpointTests(AuthApiFactory factory)
    : IClassFixture<AuthApiFactory>
{
    private readonly AuthApiFactory _factory = factory;

    private const string Profile = "/api/profile";
    private const string Password = "Test1234!";

    [Fact]
    public async Task Get_ReturnsTheSignedInEmailAndNoNameYet()
    {
        var (client, email) = await AuthenticateAsync();

        var profile = await client.GetFromJsonAsync<ProfileDto>(Profile);

        Assert.Equal(email, profile!.Email);
        Assert.Null(profile.Name);
    }

    [Fact]
    public async Task Put_SetsTheName()
    {
        var (client, _) = await AuthenticateAsync();

        await client.PutAsJsonAsync(Profile, new { name = "Evan Wibom" });

        Assert.Equal("Evan Wibom", (await client.GetFromJsonAsync<ProfileDto>(Profile))!.Name);
    }

    [Fact]
    public async Task Put_BlankName_ClearsItRatherThanStoringEmptyText()
    {
        var (client, _) = await AuthenticateAsync();

        await client.PutAsJsonAsync(Profile, new { name = "Evan" });
        await client.PutAsJsonAsync(Profile, new { name = "   " });

        Assert.Null((await client.GetFromJsonAsync<ProfileDto>(Profile))!.Name);
    }

    [Fact]
    public async Task Put_NameOverSixtyCharacters_IsRejected()
    {
        var (client, _) = await AuthenticateAsync();

        var response = await client.PutAsJsonAsync(Profile, new { name = new string('a', 61) });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ChangePassword_WithWrongCurrentPassword_IsRejected()
    {
        var (client, _) = await AuthenticateAsync();

        var response = await client.PutAsJsonAsync($"{Profile}/password", new
        {
            currentPassword = "WrongPassword1!",
            newPassword = "Brandnew1!"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ChangePassword_ThenTheNewOneSignsInAndTheOldOneDoesNot()
    {
        var (client, email) = await AuthenticateAsync();
        const string newPassword = "Brandnew1!";

        var changed = await client.PutAsJsonAsync($"{Profile}/password", new
        {
            currentPassword = Password,
            newPassword
        });
        Assert.Equal(HttpStatusCode.NoContent, changed.StatusCode);

        var fresh = _factory.CreateClient();

        var withNew = await fresh.PostAsJsonAsync("/api/auth/login", new { email, password = newPassword });
        Assert.Equal(HttpStatusCode.OK, withNew.StatusCode);

        var withOld = await fresh.PostAsJsonAsync("/api/auth/login", new { email, password = Password });
        Assert.Equal(HttpStatusCode.Unauthorized, withOld.StatusCode);
    }

    [Fact]
    public async Task Delete_RemovesTheAccountSoItCannotSignInAgain()
    {
        var (client, email) = await AuthenticateAsync();

        var deleted = await client.DeleteAsync(Profile);
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);

        var fresh = _factory.CreateClient();
        var login = await fresh.PostAsJsonAsync("/api/auth/login", new { email, password = Password });

        Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);
    }

    [Fact]
    public async Task Get_WithoutAToken_IsUnauthorized()
    {
        var response = await _factory.CreateClient().GetAsync(Profile);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private async Task<(HttpClient Client, string Email)> AuthenticateAsync()
    {
        var client = _factory.CreateClientWithCookies();
        var email = $"{Guid.NewGuid()}@budgex.se";

        await client.PostAsJsonAsync("/api/auth/register", new { email, password = Password });
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = Password });
        var tokens = await login.Content.ReadFromJsonAsync<TokenDto>();

        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tokens!.AccessToken);

        return (client, email);
    }

    private sealed record ProfileDto(string Email, string? Name);
    private sealed record TokenDto(string AccessToken, DateTime RefreshTokenExpiresAt);
}
