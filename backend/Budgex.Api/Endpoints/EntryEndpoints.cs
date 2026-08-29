using Budgex.Api.Extensions;
using Budgex.Application.Interfaces;
using Budgex.Application.UseCases;
using Budgex.Domain.Budget;
using Budgex.Domain.Common;
using Budgex.Domain.Entities;
using System.Security.Claims;

namespace Budgex.Api.Endpoints;

public static class EntryEndpoints
{
    private const decimal MaxAmount = 10_000_000m;

    public static void MapEntryEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/months/{year:int}/{month:int}/entries")
                       .RequireAuthorization();

        group.MapGet("", async (
            int year, int month,
            GetMonthPlan useCase,
            ClaimsPrincipal user) =>
        {
            if (!TryMonth(year, month, out var key)) return BadRequest("Ogiltig månad.");

            return Results.Ok(await useCase.ExecuteAsync(user.GetUserId(), key));
        });

        group.MapPost("", async (
            int year, int month,
            EntryRequest request,
            IEntryRepository repo,
            ClaimsPrincipal user) =>
        {
            if (!TryMonth(year, month, out var key)) return BadRequest("Ogiltig månad.");
            if (Parse(request, out var kind, out var category) is string error) return BadRequest(error);
            if (Validate(request) is string invalid) return BadRequest(invalid);

            var entry = new Entry
            {
                UserId = user.GetUserId(),
                Kind = kind,
                Name = request.Name.Trim(),
                Category = category,
                Amount = request.Amount,
                IsAutogiro = kind == EntryKind.Expense && request.IsAutogiro,
                From = key,
                To = request.Repeats ? null : key.Next
            };

            await repo.AddAsync(entry);
            await repo.SaveChangesAsync();

            return Results.Created($"/api/entries/{entry.Id}", entry.Id);
        });

        group.MapPut("/{id:guid}", async (
            int year, int month, Guid id,
            UpdateEntryRequest request,
            IEntryRepository repo,
            ClaimsPrincipal user) =>
        {
            if (!TryMonth(year, month, out var key)) return BadRequest("Ogiltig månad.");
            if (Parse(request, out var kind, out var category) is string error) return BadRequest(error);
            if (Validate(request) is string invalid) return BadRequest(invalid);

            var entry = await repo.GetByIdAsync(id, user.GetUserId());
            if (entry is null) return Results.NotFound();

            // Namn, kategori och autogiro hör till mallen — de är inga
            // avvikelser och ändras därför alltid för alla månader
            entry.Name = request.Name.Trim();
            entry.Category = category;
            entry.IsAutogiro = kind == EntryKind.Expense && request.IsAutogiro;

            // "Gäller" i formuläret: posten slutar efter den här månaden, eller
            // fortsätter tills vidare. Utelämnas fältet står valet kvar som det var,
            // så att en äldre frontend inte av misstag avslutar en post.
            if (request.Repeats is bool repeats)
            {
                entry.To = repeats ? null : key.Next;
            }

            if (ParseScope(request.Scope) is not EntryScopeOption chosen)
            {
                return BadRequest("Okänd omfattning.");
            }

            var change = chosen == EntryScopeOption.Onwards
                ? EntryScope.ChangeAmountOnwards(
                    entry, key, request.Amount, await repo.GetStatesForEntryAsync(entry.Id))
                : EntryScope.ChangeAmountThisMonth(
                    entry, key, request.Amount, await FindState(repo, entry.Id, key));

            await repo.SaveStatesAsync(change.Save);
            await repo.SaveChangesAsync();

            return Results.NoContent();
        });

        group.MapDelete("/{id:guid}", async (
            int year, int month, Guid id,
            string scope,
            IEntryRepository repo,
            ClaimsPrincipal user) =>
        {
            if (!TryMonth(year, month, out var key)) return BadRequest("Ogiltig månad.");
            if (ParseScope(scope) is not EntryScopeOption chosen) return BadRequest("Okänd omfattning.");

            var entry = await repo.GetByIdAsync(id, user.GetUserId());
            if (entry is null) return Results.NotFound();

            var change = chosen == EntryScopeOption.Onwards
                ? EntryScope.EndOnwards(entry, key)
                : EntryScope.SkipThisMonth(entry, key, await FindState(repo, entry.Id, key));

            if (change.DeleteEntry)
            {
                await repo.RemoveAsync(entry);
            }

            await repo.SaveStatesAsync(change.Save);
            await repo.SaveChangesAsync();

            return Results.NoContent();
        });

        group.MapPut("/{id:guid}/paid", async (
            int year, int month, Guid id,
            PaidRequest request,
            IEntryRepository repo,
            ClaimsPrincipal user) =>
        {
            if (!TryMonth(year, month, out var key)) return BadRequest("Ogiltig månad.");

            var entry = await repo.GetByIdAsync(id, user.GetUserId());
            if (entry is null) return Results.NotFound();
            if (entry.IsAutogiro) return BadRequest("Autogiroposter bockas inte av.");

            var state = await FindState(repo, entry.Id, key)
                        ?? new EntryMonthState { EntryId = entry.Id, Month = key };
            state.IsPaid = request.IsPaid;

            await repo.SaveStatesAsync([state]);
            await repo.SaveChangesAsync();

            return Results.NoContent();
        });
    }

    private static EntryScopeOption? ParseScope(string value) =>
        Enum.TryParse<EntryScopeOption>(value, ignoreCase: true, out var scope) ? scope : null;

    private static async Task<EntryMonthState?> FindState(
        IEntryRepository repo, Guid entryId, MonthKey month) =>
        (await repo.GetStatesForEntryAsync(entryId))
            .FirstOrDefault(state => state.Month == month);

    private static bool TryMonth(int year, int month, out MonthKey key)
    {
        key = default;
        if (year is < 2000 or > 2100 || month is < 1 or > 12) return false;

        key = new MonthKey(year, month);
        return true;
    }

    private static string? Parse(
        IEntryFields request, out EntryKind kind, out EntryCategory category)
    {
        category = default;

        if (!Enum.TryParse(request.Kind, out kind))
        {
            return "Okänd typ av post.";
        }

        if (!Enum.TryParse(request.Category, out category))
        {
            return "Okänd kategori.";
        }

        return EntryCategories.Matches(kind, category)
            ? null
            : "Kategorin hör inte till den typen av post.";
    }

    private static string? Validate(IEntryFields request) =>
        string.IsNullOrWhiteSpace(request.Name) ? "Namnet får inte vara tomt."
        : request.Name.Trim().Length > 40 ? "Namnet är för långt."
        : request.Amount < 0 ? "Beloppet kan inte vara negativt."
        : request.Amount > MaxAmount ? "Beloppet är för stort."
        : null;

    private static IResult BadRequest(string message) =>
        Results.BadRequest(new { message });
}

public enum EntryScopeOption { Month, Onwards }

public interface IEntryFields
{
    string Kind { get; }
    string Name { get; }
    string Category { get; }
    decimal Amount { get; }
    bool IsAutogiro { get; }
}

public sealed record EntryRequest(
    string Kind, string Name, string Category,
    decimal Amount, bool IsAutogiro, bool Repeats) : IEntryFields;

public sealed record UpdateEntryRequest(
    string Kind, string Name, string Category,
    decimal Amount, bool IsAutogiro, bool? Repeats, string Scope) : IEntryFields;

public sealed record PaidRequest(bool IsPaid);
