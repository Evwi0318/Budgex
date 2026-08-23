using Budgex.Api.Extensions;
using Budgex.Application.Interfaces;
using Budgex.Application.UseCases;
using Budgex.Domain.Entities;
using System.Security.Claims;

namespace Budgex.Api.Endpoints;

public static class BudgetEndpoints
{
    private const decimal MaxAmount = 10_000_000m;
    private const int MaxNameLength = 60;

    // Utan tak kan en inloggad användare fylla databasen med godtyckligt
    // långa strängar, och utan kontroll blir ogiltig indata ett 500-fel
    // i stället för ett svar som säger vad som var fel
    private static string? Validate(ExpenseRequest r) =>
        string.IsNullOrWhiteSpace(r.Name) ? "Namnet får inte vara tomt."
        : r.Name.Length > MaxNameLength ? "Namnet är för långt."
        : r.Amount <= 0 || r.Amount > MaxAmount ? "Beloppet måste vara större än noll."
        : string.IsNullOrWhiteSpace(r.Category) || r.Category.Length > 40 ? "Ogiltig kategori."
        : null;

    private static string? Validate(SavingsAccountRequest r) =>
        string.IsNullOrWhiteSpace(r.Name) ? "Namnet får inte vara tomt."
        : r.Name.Length > MaxNameLength ? "Namnet är för långt."
        : r.Icon.Length > 8 ? "Ikonen är för lång."
        : !Enum.TryParse<RuleType>(r.RuleType, out var type) ? "Okänd regeltyp."
        : r.RuleValue < 0 ? "Regelvärdet kan inte vara negativt."
        : type == RuleType.Percentage && r.RuleValue > 100 ? "Procenten kan inte överstiga 100."
        : type == RuleType.Fixed && r.RuleValue > MaxAmount ? "Beloppet är för stort."
        : null;

    private static string? Validate(IncomeRequest r) =>
        r.Salary < 0 || r.CsnAmount < 0 || r.CsnLoanPart < 0 ? "Belopp kan inte vara negativa."
        : r.Salary > MaxAmount || r.CsnAmount > MaxAmount ? "Beloppet är för stort."
        : r.CsnLoanPart > r.CsnAmount ? "Lånedelen kan inte vara större än CSN totalt."
        : null;

    private static IResult BadRequest(string message) =>
        Results.BadRequest(new { message });

    public static void MapBudgetEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api").RequireAuthorization();

        group.MapGet("/months/{year}/{month}", async (
            int year, int month,
            GetOrCreateBudgetMonth useCase,
            ClaimsPrincipal user) =>
        {
            var result = await useCase.ExecuteAsync(user.GetUserId(), year, month);
            return Results.Ok(result);
        });

        group.MapPut("/months/{id}/income", async (
            Guid id,
            IncomeRequest request,
            IBudgetMonthRepository repo,
            ClaimsPrincipal user) =>
        {
            if (Validate(request) is string error) return BadRequest(error);

            var month = await repo.GetByIdAsync(id, user.GetUserId());
            if (month is null) return Results.NotFound();

            month.IncomeSources.Clear();

            if (request.Salary > 0)
            {
                month.IncomeSources.Add(new IncomeSource
                {
                    BudgetMonthId = id,
                    Type = IncomeType.Salary,
                    Amount = request.Salary
                });
            }

            if (request.CsnAmount > 0)
            {
                month.IncomeSources.Add(new IncomeSource
                {
                    BudgetMonthId = id,
                    Type = IncomeType.Csn,
                    Amount = request.CsnAmount,
                    LoanAmount = request.CsnLoanPart
                });
            }

            await repo.SaveChangesAsync();
            return Results.Ok(GetOrCreateBudgetMonth.ToDto(month));
        });

        group.MapPost("/months/{id}/expenses", async (
            Guid id,
            ExpenseRequest request,
            IBudgetMonthRepository repo,
            IExpenseRepository expenseRepo,
            ClaimsPrincipal user) =>
        {
            if (Validate(request) is string error) return BadRequest(error);

            var month = await repo.GetByIdAsync(id, user.GetUserId());
            if (month is null) return Results.NotFound();

            var expense = new Expense
            {
                BudgetMonthId = id,
                Name = request.Name.Trim(),
                Amount = request.Amount,
                Category = request.Category
            };

            await expenseRepo.AddAsync(expense);
            await expenseRepo.SaveChangesAsync();
            return Results.Created($"/api/expenses/{expense.Id}", expense);
        });

        group.MapDelete("/expenses/{id}", async (
            Guid id,
            IExpenseRepository repo,
            ClaimsPrincipal user) =>
        {
            var expense = await repo.GetByIdAsync(id, user.GetUserId());
            if (expense is null) return Results.NotFound();

            await repo.DeleteAsync(expense);
            await repo.SaveChangesAsync();
            return Results.NoContent();
        });

        group.MapPost("/months/{id}/savings-accounts", async (
            Guid id,
            SavingsAccountRequest request,
            IBudgetMonthRepository repo,
            ISavingsAccountRepository savingsRepo,
            ClaimsPrincipal user) =>
        {
            if (Validate(request) is string error) return BadRequest(error);

            var month = await repo.GetByIdAsync(id, user.GetUserId());
            if (month is null) return Results.NotFound();

            var account = new SavingsAccount
            {
                BudgetMonthId = id,
                Name = request.Name.Trim(),
                Icon = request.Icon,
                RuleType = Enum.Parse<RuleType>(request.RuleType),
                RuleValue = request.RuleValue
            };

            await savingsRepo.AddAsync(account);
            await savingsRepo.SaveChangesAsync();
            return Results.Created($"/api/savings-accounts/{account.Id}", account);
        });

        group.MapDelete("/savings-accounts/{id}", async (
            Guid id,
            ISavingsAccountRepository repo,
            ClaimsPrincipal user) =>
        {
            var account = await repo.GetByIdAsync(id, user.GetUserId());
            if (account is null) return Results.NotFound();

            await repo.DeleteAsync(account);
            await repo.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}

public sealed record ExpenseRequest(string Name, decimal Amount, string Category);
public sealed record SavingsAccountRequest(string Name, string Icon, string RuleType, decimal RuleValue);
public sealed record IncomeRequest(decimal Salary, decimal CsnAmount, decimal CsnLoanPart);
