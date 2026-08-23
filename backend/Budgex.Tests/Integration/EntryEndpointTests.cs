using System.Net;
using System.Net.Http.Json;

namespace Budgex.Tests.Integration;

public sealed class EntryEndpointTests(AuthApiFactory factory)
    : IClassFixture<AuthApiFactory>
{
    private readonly AuthApiFactory _factory = factory;

    private const string August = "/api/months/2026/8/entries";
    private const string September = "/api/months/2026/9/entries";
    private const string July = "/api/months/2026/7/entries";

    [Fact]
    public async Task Create_RecurringExpense_ShowsUpInLaterMonths()
    {
        var client = await AuthenticateAsync();

        await CreateAsync(client, August, repeats: true);

        Assert.Equal("Hyra", Assert.Single((await PlanAsync(client, September)).Expenses).Name);
    }

    [Fact]
    public async Task Create_OneOff_StaysInItsOwnMonth()
    {
        var client = await AuthenticateAsync();

        await CreateAsync(client, August, repeats: false);

        Assert.Single((await PlanAsync(client, August)).Expenses);
        Assert.Empty((await PlanAsync(client, September)).Expenses);
    }

    [Fact]
    public async Task Update_ScopedToMonth_LeavesOtherMonthsOnTheTemplate()
    {
        var client = await AuthenticateAsync();
        var id = await CreateAsync(client, August, repeats: true);

        await UpdateAmountAsync(client, August, id, 8200m, scope: "Month");

        Assert.Equal(8200m, Assert.Single((await PlanAsync(client, August)).Expenses).Amount);
        Assert.Equal(7500m, Assert.Single((await PlanAsync(client, September)).Expenses).Amount);
    }

    [Fact]
    public async Task Update_ScopedOnwards_ChangesTheTemplate()
    {
        var client = await AuthenticateAsync();
        var id = await CreateAsync(client, August, repeats: true);

        await UpdateAmountAsync(client, August, id, 8200m, scope: "Onwards");

        Assert.Equal(8200m, Assert.Single((await PlanAsync(client, September)).Expenses).Amount);
    }

    [Fact]
    public async Task Delete_ScopedToMonth_SkipsOnlyThatMonth()
    {
        var client = await AuthenticateAsync();
        var id = await CreateAsync(client, August, repeats: true);

        var response = await client.DeleteAsync($"{August}/{id}?scope=Month");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        Assert.Empty((await PlanAsync(client, August)).Expenses);
        Assert.Single((await PlanAsync(client, September)).Expenses);
    }

    [Fact]
    public async Task Delete_ScopedOnwards_KeepsHistory()
    {
        var client = await AuthenticateAsync();
        var id = await CreateAsync(client, July, repeats: true);

        var response = await client.DeleteAsync($"{August}/{id}?scope=Onwards");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        Assert.Single((await PlanAsync(client, July)).Expenses);
        Assert.Empty((await PlanAsync(client, August)).Expenses);
    }

    [Fact]
    public async Task Paid_MarksOnlyTheMonthItWasSetIn()
    {
        var client = await AuthenticateAsync();
        var id = await CreateAsync(client, August, repeats: true);

        var response = await client.PutAsJsonAsync($"{August}/{id}/paid", new { isPaid = true });
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        Assert.True(Assert.Single((await PlanAsync(client, August)).Expenses).IsPaid);
        Assert.False(Assert.Single((await PlanAsync(client, September)).Expenses).IsPaid);
    }

    [Fact]
    public async Task Paid_OnAutogiro_IsRejected()
    {
        var client = await AuthenticateAsync();
        var id = await CreateAsync(client, August, repeats: true, autogiro: true);

        var response = await client.PutAsJsonAsync($"{August}/{id}/paid", new { isPaid = true });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_IncomeCategoryOnExpense_IsRejected()
    {
        var client = await AuthenticateAsync();

        var response = await client.PostAsJsonAsync(August, new
        {
            kind = "Expense", name = "Hyra", category = "Salary",
            amount = 7500m, isAutogiro = false, repeats = true
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Update_AnotherUsersEntry_ReturnsNotFound()
    {
        var owner = await AuthenticateAsync();
        var id = await CreateAsync(owner, August, repeats: true);
        var stranger = await AuthenticateAsync();

        var response = await stranger.PutAsJsonAsync($"{August}/{id}", new
        {
            kind = "Expense", name = "Kapad", category = "Housing",
            amount = 1m, isAutogiro = false, scope = "Onwards"
        });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private async Task<HttpClient> AuthenticateAsync()
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

    private static async Task<Guid> CreateAsync(
        HttpClient client, string month, bool repeats, bool autogiro = false)
    {
        var response = await client.PostAsJsonAsync(month, new
        {
            kind = "Expense",
            name = "Hyra",
            category = "Housing",
            amount = 7500m,
            isAutogiro = autogiro,
            repeats
        });

        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.IsSuccessStatusCode, $"{response.StatusCode}: {body}");

        return (await response.Content.ReadFromJsonAsync<Guid>())!;
    }

    private static async Task UpdateAmountAsync(
        HttpClient client, string month, Guid id, decimal amount, string scope)
    {
        var response = await client.PutAsJsonAsync($"{month}/{id}", new
        {
            kind = "Expense",
            name = "Hyra",
            category = "Housing",
            amount,
            isAutogiro = false,
            scope
        });

        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.IsSuccessStatusCode, $"{response.StatusCode}: {body}");
    }

    private static async Task<MonthPlan> PlanAsync(HttpClient client, string month) =>
        (await client.GetFromJsonAsync<MonthPlan>(month))!;

    private sealed record TokenDto(string AccessToken, DateTime RefreshTokenExpiresAt);
    private sealed record PlannedDto(Guid Id, string Kind, string Name, string Category,
        decimal Amount, bool IsAutogiro, bool IsPaid, bool Repeats);
    private sealed record MonthPlan(int Year, int Month,
        List<PlannedDto> Income, List<PlannedDto> Expenses);
}
