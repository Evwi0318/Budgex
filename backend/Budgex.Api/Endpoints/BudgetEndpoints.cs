using Budgex.Api.Extensions;
using Budgex.Application.Interfaces;
using Budgex.Application.UseCases;
using Budgex.Domain.Entities;
using System.Security.Claims;

namespace Budgex.Api.Endpoints;

public static class BudgetEndpoints
{
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

        group.MapGet("/months/{id}/summary", async (
            Guid id,
            GetBudgetSummary useCase,
            ClaimsPrincipal user) =>
        {
            var result = await useCase.ExecuteAsync(id, user.GetUserId());
            return result is null ? Results.NotFound() : Results.Ok(result);
        });

        group.MapPut("/months/{id}/income", async (
            Guid id,
            IncomeRequest request,
            IBudgetMonthRepository repo,
            ClaimsPrincipal user) =>
        {
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
            var month = await repo.GetByIdAsync(id, user.GetUserId());
            if (month is null) return Results.NotFound();

            var expense = new Expense
            {
                BudgetMonthId = id,
                Name = request.Name,
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
            var month = await repo.GetByIdAsync(id, user.GetUserId());
            if (month is null) return Results.NotFound();

            var account = new SavingsAccount
            {
                BudgetMonthId = id,
                Name = request.Name,
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
