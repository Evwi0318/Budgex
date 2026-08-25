using Budgex.Api.Extensions;
using Budgex.Application.Interfaces;
using Budgex.Application.UseCases;
using Budgex.Domain.Common;
using Budgex.Domain.Entities;
using Budgex.Domain.Savings;
using System.Security.Claims;

namespace Budgex.Api.Endpoints;

public static class SavingsEndpoints
{
    private const decimal MaxAmount = 10_000_000m;

    public static void MapSavingsEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/months/{year:int}/{month:int}/savings")
                       .RequireAuthorization();

        group.MapGet("", async (
            int year, int month,
            GetSavingsMonth useCase,
            ClaimsPrincipal user) =>
        {
            if (!TryMonth(year, month, out var key)) return BadRequest("Ogiltig månad.");

            return Results.Ok(await useCase.ExecuteAsync(user.GetUserId(), key));
        });

        group.MapPost("", async (
            int year, int month,
            SavingsAccountRequest request,
            ISavingsRepository repo,
            ClaimsPrincipal user) =>
        {
            if (!TryMonth(year, month, out var key)) return BadRequest("Ogiltig månad.");
            if (Validate(request) is string error) return BadRequest(error);

            var account = new SavingsAccount
            {
                UserId = user.GetUserId(),
                Name = request.Name.Trim(),
                Icon = request.Icon,
                Goal = request.Goal,
                Saved = request.Saved,
                From = key,
            };

            account.Rules.AddRange(Rules(request, account.Id));

            await repo.AddAsync(account);
            await repo.SaveChangesAsync();

            return Results.Created($"/api/savings/{account.Id}", account.Id);
        });

        group.MapPut("/{id:guid}", async (
            int year, int month, Guid id,
            SavingsAccountRequest request,
            ISavingsRepository repo,
            ClaimsPrincipal user) =>
        {
            if (!TryMonth(year, month, out _)) return BadRequest("Ogiltig månad.");
            if (Validate(request) is string error) return BadRequest(error);

            var account = await repo.GetByIdAsync(id, user.GetUserId());
            if (account is null) return Results.NotFound();

            account.Name = request.Name.Trim();
            account.Icon = request.Icon;
            account.Goal = request.Goal;
            account.Saved = request.Saved;

            await repo.ReplaceRulesAsync(account, Rules(request, account.Id));
            await repo.SaveChangesAsync();

            return Results.NoContent();
        });

        group.MapDelete("/{id:guid}", async (
            int year, int month, Guid id,
            ISavingsRepository repo,
            ClaimsPrincipal user) =>
        {
            if (!TryMonth(year, month, out var key)) return BadRequest("Ogiltig månad.");

            var account = await repo.GetByIdAsync(id, user.GetUserId());
            if (account is null) return Results.NotFound();

            if (account.From >= key)
            {
                await repo.RemoveAsync(account);
            }
            else
            {
                account.To = key;
            }

            await repo.SaveChangesAsync();
            return Results.NoContent();
        });

        group.MapPut("/{id:guid}/transferred", async (
            int year, int month, Guid id,
            TransferredRequest request,
            IEntryRepository entryRepo,
            ISavingsRepository repo,
            ClaimsPrincipal user) =>
        {
            if (!TryMonth(year, month, out var key)) return BadRequest("Ogiltig månad.");

            var account = await repo.GetByIdAsync(id, user.GetUserId());
            if (account is null) return Results.NotFound();

            var amounts = await SourceAmounts(entryRepo, user.GetUserId(), key);
            var states = await repo.GetStatesForMonthAsync(user.GetUserId(), key);

            await repo.SaveStatesAsync([Mark(account, key, states, amounts, request.IsTransferred)]);
            await repo.SaveChangesAsync();

            return Results.NoContent();
        });

        group.MapPut("/transferred", async (
            int year, int month,
            TransferredRequest request,
            IEntryRepository entryRepo,
            ISavingsRepository repo,
            ClaimsPrincipal user) =>
        {
            if (!TryMonth(year, month, out var key)) return BadRequest("Ogiltig månad.");

            var userId = user.GetUserId();
            var accounts = await repo.GetForUserAsync(userId);
            var amounts = await SourceAmounts(entryRepo, userId, key);
            var states = await repo.GetStatesForMonthAsync(userId, key);

            var marked = accounts
                .Where(account => account.LiveIn(key))
                .Select(account => Mark(account, key, states, amounts, request.IsTransferred))
                .ToList();

            await repo.SaveStatesAsync(marked);
            await repo.SaveChangesAsync();

            return Results.NoContent();
        });
    }

    private static SavingsMonthState Mark(
        SavingsAccount account,
        MonthKey month,
        IReadOnlyList<SavingsMonthState> states,
        IReadOnlyDictionary<Guid, decimal> amounts,
        bool isTransferred)
    {
        var state = states.FirstOrDefault(s => s.SavingsAccountId == account.Id && s.Month == month)
                    ?? new SavingsMonthState { SavingsAccountId = account.Id, Month = month };

        if (state.IsTransferred == isTransferred)
        {
            return state;
        }

        if (isTransferred)
        {
            state.Amount = SavingsPlan.PlannedTotal(account, amounts);
            account.Saved = (account.Saved ?? 0) + state.Amount.Value;
        }
        else
        {
            account.Saved = Math.Max(0, (account.Saved ?? 0) - (state.Amount ?? 0));
            state.Amount = null;
        }

        state.IsTransferred = isTransferred;

        return state;
    }

    private static async Task<Dictionary<Guid, decimal>> SourceAmounts(
        IEntryRepository entries, Guid userId, MonthKey month) =>
        (await GetSavingsMonth.IncomeFor(entries, userId, month))
            .ToDictionary(item => item.Entry.Id, item => item.Amount);

    private static IEnumerable<AllocationRule> Rules(SavingsAccountRequest request, Guid accountId) =>
        request.Rules.Select(rule => new AllocationRule
        {
            SavingsAccountId = accountId,
            SourceEntryId = rule.SourceEntryId,
            RuleType = Enum.Parse<RuleType>(rule.RuleType, ignoreCase: true),
            Value = rule.Value,
        });

    private static string? Validate(SavingsAccountRequest r) =>
        string.IsNullOrWhiteSpace(r.Name) ? "Namnet får inte vara tomt."
        : r.Name.Length > 60 ? "Namnet är för långt."
        : string.IsNullOrWhiteSpace(r.Icon) || r.Icon.Length > 8 ? "Ogiltig ikon."
        : r.Goal is < 0 or > MaxAmount ? "Målet är ogiltigt."
        : r.Saved is < 0 or > MaxAmount ? "Sparat belopp är ogiltigt."
        : r.Rules.Any(rule => !Enum.TryParse<RuleType>(rule.RuleType, ignoreCase: true, out _))
            ? "Okänd regeltyp."
        : r.Rules.Any(rule => rule.Value < 0) ? "Regelvärdet kan inte vara negativt."
        : r.Rules.Any(rule => Percentage(rule) && rule.Value > 100) ? "Procenten kan inte överstiga 100."
        : r.Rules.Any(rule => !Percentage(rule) && rule.Value > MaxAmount) ? "Beloppet är för stort."
        : null;

    private static bool Percentage(AllocationRuleRequest rule) =>
        Enum.TryParse<RuleType>(rule.RuleType, ignoreCase: true, out var type)
        && type == RuleType.Percentage;

    private static bool TryMonth(int year, int month, out MonthKey key)
    {
        if (year is < 2000 or > 2100 || month is < 1 or > 12)
        {
            key = default;
            return false;
        }

        key = new MonthKey(year, month);
        return true;
    }

    private static IResult BadRequest(string message) =>
        Results.BadRequest(new { message });
}

public sealed record AllocationRuleRequest(Guid SourceEntryId, string RuleType, decimal Value);

public sealed record SavingsAccountRequest(
    string Name,
    string Icon,
    decimal? Goal,
    decimal? Saved,
    List<AllocationRuleRequest> Rules
);

public sealed record TransferredRequest(bool IsTransferred);
