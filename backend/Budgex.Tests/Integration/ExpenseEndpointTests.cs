using System.Net;
using System.Net.Http.Json;

namespace Budgex.Tests.Integration;

public sealed class ExpenseEndpointTests(AuthApiFactory factory)
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

    private static async Task<ExpenseDto> AddExpenseAsync(HttpClient client, Guid monthId)
    {
        var response = await client.PostAsJsonAsync(
            $"/api/months/{monthId}/expenses",
            new { name = "Hyra", amount = 5500m, category = "Boende" });

        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.IsSuccessStatusCode, $"{response.StatusCode}: {body}");
        return (await response.Content.ReadFromJsonAsync<ExpenseDto>())!;
    }

    [Fact]
    public async Task DeleteExpense_OwnExpense_RemovesIt()
    {
        var client = await CreateAuthenticatedClientAsync();
        var month = await client.GetFromJsonAsync<BudgetMonthDto>("/api/months/2026/8");
        var expense = await AddExpenseAsync(client, month!.Id);

        var deleteResponse = await client.DeleteAsync($"/api/expenses/{expense.Id}");
        var body = await deleteResponse.Content.ReadAsStringAsync();

        Assert.True(
            deleteResponse.StatusCode == HttpStatusCode.NoContent,
            $"{deleteResponse.StatusCode}: {body}");

        var updated = await client.GetFromJsonAsync<BudgetMonthDto>("/api/months/2026/8");
        Assert.DoesNotContain(updated!.Expenses, e => e.Id == expense.Id);
    }

    [Fact]
    public async Task DeleteExpense_AnotherUsersExpense_ReturnsNotFound()
    {
        var owner = await CreateAuthenticatedClientAsync();
        var month = await owner.GetFromJsonAsync<BudgetMonthDto>("/api/months/2026/8");
        var expense = await AddExpenseAsync(owner, month!.Id);

        // En annan inloggad användare försöker radera ägarens utgift
        var attacker = await CreateAuthenticatedClientAsync();
        var response = await attacker.DeleteAsync($"/api/expenses/{expense.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // Utgiften ska finnas kvar hos ägaren
        var stillThere = await owner.GetFromJsonAsync<BudgetMonthDto>("/api/months/2026/8");
        Assert.Contains(stillThere!.Expenses, e => e.Id == expense.Id);
    }

    private sealed record TokenDto(string AccessToken, DateTime RefreshTokenExpiresAt);

    private sealed record ExpenseDto(Guid Id, string Name, decimal Amount, string Category);

    private sealed record BudgetMonthDto(
        Guid Id,
        int Year,
        int Month,
        List<ExpenseDto> Expenses);
}
