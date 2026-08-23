using System.Net;
using System.Net.Http.Json;

namespace Budgex.Tests.Integration;

public sealed class IncomeEndpointTests(AuthApiFactory factory)
    : IClassFixture<AuthApiFactory>
{
    private readonly AuthApiFactory _factory = factory;

    private async Task<HttpClient> CreateAuthenticatedClientAsync()
    {
        var client = _factory.CreateClientWithCookies();
        var email = $"{Guid.NewGuid()}@budgex.se";
        const string password = "Test1234!";

        await client.PostAsJsonAsync("/api/auth/register", new { email, password });
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        var tokens = await login.Content.ReadFromJsonAsync<TokenDto>();

        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tokens!.AccessToken);

        return client;
    }

    [Fact]
    public async Task PutIncome_OnEmptyMonth_ReturnsOk()
    {
        var client = await CreateAuthenticatedClientAsync();

        var month = await client.GetFromJsonAsync<BudgetMonthDto>("/api/months/2026/8");

        var response = await client.PutAsJsonAsync(
            $"/api/months/{month!.Id}/income",
            new { salary = 20000m, csnAmount = 12000m, csnLoanPart = 8000m });

        // Skriv ut kroppen vid fel, annars ser vi bara statuskoden
        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.IsSuccessStatusCode, $"{response.StatusCode}: {body}");
    }

    [Fact]
    public async Task PutIncome_Twice_ReplacesPreviousIncome()
    {
        var client = await CreateAuthenticatedClientAsync();
        var month = await client.GetFromJsonAsync<BudgetMonthDto>("/api/months/2026/9");

        await client.PutAsJsonAsync(
            $"/api/months/{month!.Id}/income",
            new { salary = 20000m, csnAmount = 12000m, csnLoanPart = 8000m });

        // Andra sparningen måste rensa den förra, annars dubbleras inkomsten
        var response = await client.PutAsJsonAsync(
            $"/api/months/{month.Id}/income",
            new { salary = 15000m, csnAmount = 0m, csnLoanPart = 0m });

        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.IsSuccessStatusCode, $"{response.StatusCode}: {body}");

        var updated = await client.GetFromJsonAsync<BudgetMonthDto>("/api/months/2026/9");
        Assert.Single(updated!.IncomeSources);
        Assert.Equal(15000m, updated.IncomeSources[0].Amount);
    }

    private sealed record TokenDto(string AccessToken, DateTime RefreshTokenExpiresAt);

    private sealed record IncomeSourceDto(Guid Id, string Type, decimal Amount, decimal? LoanAmount);

    private sealed record BudgetMonthDto(
        Guid Id,
        int Year,
        int Month,
        List<IncomeSourceDto> IncomeSources);
}
