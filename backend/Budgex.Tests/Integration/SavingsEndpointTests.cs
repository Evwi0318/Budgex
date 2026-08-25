using System.Net.Http.Json;

namespace Budgex.Tests.Integration;

public sealed class SavingsEndpointTests(AuthApiFactory factory)
    : IClassFixture<AuthApiFactory>
{
    private readonly AuthApiFactory _factory = factory;

    private const string AugustEntries = "/api/months/2026/8/entries";
    private const string AugustSavings = "/api/months/2026/8/savings";
    private const string SeptemberSavings = "/api/months/2026/9/savings";

    [Fact]
    public async Task Percentage_TakesShareOfItsOwnSource()
    {
        var client = await AuthenticateAsync();
        var grant = await IncomeAsync(client, "CSN", "Grant", 6000m);
        await IncomeAsync(client, "Lön", "Salary", 20000m);

        await CreateAsync(client, AugustSavings, Percent(grant, 70m));

        var month = await SavingsAsync(client, AugustSavings);

        Assert.Equal(4200m, month.Total);
        Assert.Equal(4200m, Assert.Single(month.Accounts).Amount);
    }

    [Fact]
    public async Task Savings_IsSubtractedFromSafeToSpend()
    {
        var client = await AuthenticateAsync();
        var salary = await IncomeAsync(client, "Lön", "Salary", 20000m);

        await CreateAsync(client, AugustSavings, Percent(salary, 10m));

        var plan = await client.GetFromJsonAsync<PlanDto>(AugustEntries);

        Assert.Equal(2000m, plan!.Summary.TotalSavings);
        Assert.Equal(18000m, plan.Summary.SafeToSpend);
    }

    [Fact]
    public async Task Account_FollowsAlongToLaterMonths()
    {
        var client = await AuthenticateAsync();
        var salary = await IncomeAsync(client, "Lön", "Salary", 20000m);

        await CreateAsync(client, AugustSavings, Fixed(salary, 1000m));

        Assert.Single((await SavingsAsync(client, SeptemberSavings)).Accounts);
    }

    [Fact]
    public async Task Transfer_FreezesTheAmount_SoLaterRuleChangesLeaveHistoryAlone()
    {
        var client = await AuthenticateAsync();
        var salary = await IncomeAsync(client, "Lön", "Salary", 20000m);
        var id = await CreateAsync(client, AugustSavings, Percent(salary, 10m));

        await client.PutAsJsonAsync($"{AugustSavings}/{id}/transferred", new { isTransferred = true });
        await client.PutAsJsonAsync($"{AugustSavings}/{id}", Body("Buffert", Percent(salary, 25m)));

        var august = Assert.Single((await SavingsAsync(client, AugustSavings)).Accounts);
        var september = Assert.Single((await SavingsAsync(client, SeptemberSavings)).Accounts);

        Assert.Equal(2000m, august.Amount);
        Assert.True(august.IsTransferred);
        Assert.Equal(5000m, september.Amount);
    }

    [Fact]
    public async Task MarkAll_TransfersEveryAccountInTheMonth()
    {
        var client = await AuthenticateAsync();
        var salary = await IncomeAsync(client, "Lön", "Salary", 20000m);
        await CreateAsync(client, AugustSavings, Fixed(salary, 500m));
        await CreateAsync(client, AugustSavings, Fixed(salary, 700m));

        await client.PutAsJsonAsync($"{AugustSavings}/transferred", new { isTransferred = true });

        Assert.All((await SavingsAsync(client, AugustSavings)).Accounts,
            account => Assert.True(account.IsTransferred));
    }

    [Fact]
    public async Task OverAllocatedSource_IsReportedButNotBlocked()
    {
        var client = await AuthenticateAsync();
        var salary = await IncomeAsync(client, "Lön", "Salary", 20000m);

        await CreateAsync(client, AugustSavings, Percent(salary, 70m));
        await CreateAsync(client, AugustSavings, Percent(salary, 50m));

        var source = Assert.Single((await SavingsAsync(client, AugustSavings)).Sources);

        Assert.Equal("Over", source.Status);
        Assert.Equal(24000m, source.Allocated);
    }

    [Fact]
    public async Task Delete_InALaterMonth_KeepsTheHistory()
    {
        var client = await AuthenticateAsync();
        var salary = await IncomeAsync(client, "Lön", "Salary", 20000m);
        var id = await CreateAsync(client, AugustSavings, Fixed(salary, 500m));

        await client.DeleteAsync($"{SeptemberSavings}/{id}");

        Assert.Single((await SavingsAsync(client, AugustSavings)).Accounts);
        Assert.Empty((await SavingsAsync(client, SeptemberSavings)).Accounts);
    }

    [Fact]
    public async Task DeletedSource_LeavesTheRuleWithoutAName()
    {
        var client = await AuthenticateAsync();
        var salary = await IncomeAsync(client, "Lön", "Salary", 20000m);
        await CreateAsync(client, AugustSavings, Percent(salary, 10m));

        await client.DeleteAsync($"{AugustEntries}/{salary}?scope=Onwards");

        var rule = Assert.Single(Assert.Single((await SavingsAsync(client, AugustSavings)).Accounts).Rules);

        Assert.Equal("Borttagen källa", rule.SourceName);
        Assert.Equal(0m, rule.Amount);
    }

    private static object Percent(Guid source, decimal value) =>
        new { sourceEntryId = source, ruleType = "Percentage", value };

    private static object Fixed(Guid source, decimal value) =>
        new { sourceEntryId = source, ruleType = "Fixed", value };

    private static object Body(string name, params object[] rules) =>
        new { name, icon = "🛟", goal = (decimal?)null, saved = (decimal?)null, rules };

    private static async Task<Guid> CreateAsync(HttpClient client, string month, params object[] rules)
    {
        var response = await client.PostAsJsonAsync(month, Body("Buffert", rules));
        var body = await response.Content.ReadAsStringAsync();

        Assert.True(response.IsSuccessStatusCode, $"{response.StatusCode}: {body}");

        return (await response.Content.ReadFromJsonAsync<Guid>())!;
    }

    private static async Task<Guid> IncomeAsync(
        HttpClient client, string name, string category, decimal amount)
    {
        var response = await client.PostAsJsonAsync(AugustEntries, new
        {
            kind = "Income",
            name,
            category,
            amount,
            isAutogiro = false,
            repeats = true,
        });

        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.IsSuccessStatusCode, $"{response.StatusCode}: {body}");

        return (await response.Content.ReadFromJsonAsync<Guid>())!;
    }

    private static async Task<SavingsMonthDto> SavingsAsync(HttpClient client, string month) =>
        (await client.GetFromJsonAsync<SavingsMonthDto>(month))!;

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

    private sealed record TokenDto(string AccessToken, DateTime RefreshTokenExpiresAt);

    private sealed record RuleDto(Guid SourceEntryId, string SourceName, string RuleType,
        decimal Value, decimal Amount);

    private sealed record AccountDto(Guid Id, string Name, string Icon, decimal? Goal,
        decimal? Saved, decimal Amount, bool IsTransferred, List<RuleDto> Rules);

    private sealed record SourceDto(Guid SourceEntryId, string Name, decimal Available,
        decimal Allocated, string Status);

    private sealed record SavingsMonthDto(int Year, int Month, decimal Total,
        List<AccountDto> Accounts, List<SourceDto> Sources);

    private sealed record SummaryDto(decimal Income, decimal TotalExpenses,
        decimal TotalSavings, decimal SafeToSpend);

    private sealed record PlanDto(int Year, int Month, SummaryDto Summary);
}
