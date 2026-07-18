using Budgex.Application.Interfaces;
using Budgex.Application.UseCases;
using Budgex.Domain.Entities;
using Budgex.Infrastructure.Persistence;
using Budgex.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://budgex-omega.vercel.app", "https://budgex-p0e4qmp6v-wilbardevan03-1705s-projects.vercel.app")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<BudgexDbContext>(options =>
    options.UseNpgsql(connectionString));

// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IBudgetMonthRepository, BudgetMonthRepository>();
builder.Services.AddScoped<IExpenseRepository, ExpenseRepository>();
builder.Services.AddScoped<ISavingsAccountRepository, SavingsAccountRepository>();

// Use cases
builder.Services.AddScoped<GetOrCreateBudgetMonth>();
builder.Services.AddScoped<GetBudgetSummary>();

var app = builder.Build();

app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Health
app.MapGet("/api/health", () => new { status = "healthy" });

// Months
app.MapGet("/api/months/{year}/{month}", async (
    int year, int month,
    GetOrCreateBudgetMonth useCase) =>
{
    // Temporärt hårdkodad userId tills auth är på plats i Fas 4
    var userId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    var result = await useCase.ExecuteAsync(userId, year, month);
    return Results.Ok(result);
});

app.MapGet("/api/months/{id}/summary", async (
    Guid id,
    GetBudgetSummary useCase) =>
{
    var userId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    var result = await useCase.ExecuteAsync(id, userId);
    return result is null ? Results.NotFound() : Results.Ok(result);
});

app.MapPost("/api/months/{id}/expenses", async (
    Guid id,
    ExpenseRequest request,
    IBudgetMonthRepository repo,
    IExpenseRepository expenseRepo) =>
{
    var userId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    var bm = await repo.GetByIdAsync(id, userId);
    if (bm is null) return Results.NotFound();

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

app.MapDelete("/api/expenses/{id}", async (
    Guid id,
    IExpenseRepository repo) =>
{
    var userId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    var expense = await repo.GetByIdAsync(id, userId);
    if (expense is null) return Results.NotFound();

    await repo.DeleteAsync(expense);
    await repo.SaveChangesAsync();
    return Results.NoContent();
});

app.MapPost("/api/months/{id}/savings-accounts", async (
    Guid id,
    SavingsAccountRequest request,
    IBudgetMonthRepository repo,
    ISavingsAccountRepository savingsRepo) =>
{
    var userId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    var bm = await repo.GetByIdAsync(id, userId);
    if (bm is null) return Results.NotFound();

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

app.MapDelete("/api/savings-accounts/{id}", async (
    Guid id,
    ISavingsAccountRepository repo) =>
{
    var userId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    var account = await repo.GetByIdAsync(id, userId);
    if (account is null) return Results.NotFound();

    await repo.DeleteAsync(account);
    await repo.SaveChangesAsync();
    return Results.NoContent();
});

app.MapPut("/api/months/{id}/income", async (
    Guid id,
    IncomeRequest request,
    IBudgetMonthRepository repo) =>
{
    var userId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    var bm = await repo.GetByIdAsync(id, userId);
    if (bm is null) return Results.NotFound();

    bm.IncomeSources.Clear();

    if (request.Salary > 0)
    {
        bm.IncomeSources.Add(new IncomeSource
        {
            BudgetMonthId = id,
            Type = IncomeType.Salary,
            Amount = request.Salary
        });
    }

    if (request.CsnAmount > 0)
    {
        bm.IncomeSources.Add(new IncomeSource
        {
            BudgetMonthId = id,
            Type = IncomeType.Csn,
            Amount = request.CsnAmount,
            LoanAmount = request.CsnLoanPart
        });
    }

    await repo.SaveChangesAsync();
    return Results.Ok(GetOrCreateBudgetMonth.ToDto(bm));
});

app.Run();

// Request records
record ExpenseRequest(string Name, decimal Amount, string Category);
record SavingsAccountRequest(string Name, string Icon, string RuleType, decimal RuleValue);
record IncomeRequest(decimal Salary, decimal CsnAmount, decimal CsnLoanPart);