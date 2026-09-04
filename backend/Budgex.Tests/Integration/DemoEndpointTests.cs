using System.Net;
using System.Net.Http.Json;

namespace Budgex.Tests.Integration;

public sealed class DemoEndpointTests(AuthApiFactory factory)
    : IClassFixture<AuthApiFactory>
{
    private readonly AuthApiFactory _factory = factory;

    private static readonly DateTime Today = DateTime.UtcNow;

    [Fact]
    public async Task Demo_FillsTheCurrentMonth()
    {
        var client = await StartDemoAsync();

        var plan = await PlanAsync(client, Today);

        Assert.Equal(2, plan.Income.Count);
        Assert.Equal(8, plan.Expenses.Count);
        Assert.True(plan.Summary.TotalSavings > 0);
        Assert.True(plan.Summary.SafeToSpend > 0);
        Assert.Contains(plan.Expenses, expense => expense.IsPaid);
    }

    [Fact]
    public async Task Demo_FillsTheMonthsBehindItAsAlreadySettled()
    {
        var client = await StartDemoAsync();

        var plan = await PlanAsync(client, Today.AddMonths(-2));

        Assert.NotEmpty(plan.Expenses);
        Assert.All(
            plan.Expenses.Where(expense => !expense.IsAutogiro),
            expense => Assert.True(expense.IsPaid));
    }

    [Fact]
    public async Task Demo_GivesEachVisitorTheirOwnAccount()
    {
        var first = await StartDemoAsync();
        var second = await StartDemoAsync();

        var expenses = (await PlanAsync(first, Today)).Expenses;

        var removed = await first.DeleteAsync(
            $"{Entries(Today)}/{expenses[0].Id}?scope=Onwards");

        Assert.Equal(HttpStatusCode.NoContent, removed.StatusCode);
        Assert.Equal(expenses.Count - 1, (await PlanAsync(first, Today)).Expenses.Count);
        Assert.Equal(expenses.Count, (await PlanAsync(second, Today)).Expenses.Count);
    }

    private async Task<HttpClient> StartDemoAsync()
    {
        var client = _factory.CreateClientWithCookies();
        var response = await client.PostAsync("/api/auth/demo", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var tokens = await response.Content.ReadFromJsonAsync<TokenDto>();
        Assert.False(string.IsNullOrWhiteSpace(tokens!.AccessToken));

        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tokens.AccessToken);

        return client;
    }

    private static string Entries(DateTime month) =>
        $"/api/months/{month.Year}/{month.Month}/entries";

    private static async Task<MonthPlan> PlanAsync(HttpClient client, DateTime month) =>
        (await client.GetFromJsonAsync<MonthPlan>(Entries(month)))!;

    private sealed record TokenDto(string AccessToken, DateTime RefreshTokenExpiresAt);
    private sealed record PlannedDto(Guid Id, string Kind, string Name, string Category,
        decimal Amount, bool IsAutogiro, bool IsPaid, bool Repeats);
    private sealed record SummaryDto(decimal Income, decimal TotalExpenses,
        decimal TotalSavings, decimal SafeToSpend);
    private sealed record MonthPlan(int Year, int Month,
        List<PlannedDto> Income, List<PlannedDto> Expenses, SummaryDto Summary);
}
