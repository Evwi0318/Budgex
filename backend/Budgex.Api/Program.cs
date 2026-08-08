using Budgex.Application.Interfaces;
using Budgex.Application.UseCases;
using Budgex.Domain.Entities;
using Budgex.Infrastructure.Persistence;
using Budgex.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Budgex.Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Budgex.Api.Endpoints;
using Budgex.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://budgex-omega.vercel.app", "https://budgex-p0e4qmp6v-wilbardevan03-1705s-projects.vercel.app")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<BudgexDbContext>(options =>
    options.UseNpgsql(connectionString));


// JWT settings
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection(JwtSettings.SectionName));

var jwtSettings = builder.Configuration
    .GetSection(JwtSettings.SectionName)
    .Get<JwtSettings>()
    ?? throw new InvalidOperationException("Jwt settings not found in configuration.");

// ASP.NET Core Identity
builder.Services
    .AddIdentityCore<ApplicationUser>(options =>
    {
        options.Password.RequiredLength = 8;
        options.User.RequireUniqueEmail = true;
    })
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<BudgexDbContext>();

// JWT Authentication
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings.SecretKey))
        };
    });

builder.Services.AddAuthorization();

// Repositories
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IBudgetMonthRepository, BudgetMonthRepository>();
builder.Services.AddScoped<IExpenseRepository, ExpenseRepository>();
builder.Services.AddScoped<ISavingsAccountRepository, SavingsAccountRepository>();

// Use cases
builder.Services.AddScoped<GetOrCreateBudgetMonth>();
builder.Services.AddScoped<GetBudgetSummary>();

var app = builder.Build();


app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Health
app.MapGet("/api/health", () => new { status = "healthy" });

app.MapAuthEndpoints();

// Months
app.MapGet("/api/months/{year}/{month}", async (
    int year, int month,
    GetOrCreateBudgetMonth useCase,
    ClaimsPrincipal claimsPrincipal) =>
{
    var userId = claimsPrincipal.GetUserId();
    var result = await useCase.ExecuteAsync(userId, year, month);
    return Results.Ok(result);
}).RequireAuthorization();


app.MapGet("/api/months/{id}/summary", async (
    Guid id,
    GetBudgetSummary useCase,
    ClaimsPrincipal claimsPrincipal) =>
{
    var userId = claimsPrincipal.GetUserId();
    var result = await useCase.ExecuteAsync(id, userId);
    return result is null ? Results.NotFound() : Results.Ok(result);
}).RequireAuthorization();

app.MapPost("/api/months/{id}/expenses", async (
    Guid id,
    ExpenseRequest request,
    IBudgetMonthRepository repo,
    IExpenseRepository expenseRepo,
    ClaimsPrincipal claimsPrincipal) =>
{
    var userId = claimsPrincipal.GetUserId();
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
}).RequireAuthorization();

app.MapDelete("/api/expenses/{id}", async (
    Guid id,
    IExpenseRepository repo,
    ClaimsPrincipal claimsPrincipal) =>
{
    var userId = claimsPrincipal.GetUserId();
    var expense = await repo.GetByIdAsync(id, userId);
    if (expense is null) return Results.NotFound();

    await repo.DeleteAsync(expense);
    await repo.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();


app.MapPost("/api/months/{id}/savings-accounts", async (
    Guid id,
    SavingsAccountRequest request,
    IBudgetMonthRepository repo,
    ISavingsAccountRepository savingsRepo,
    ClaimsPrincipal claimsPrincipal) =>
{
    var userId = claimsPrincipal.GetUserId();
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
}).RequireAuthorization();


app.MapDelete("/api/savings-accounts/{id}", async (
    Guid id,
    ISavingsAccountRepository repo,
    ClaimsPrincipal claimsPrincipal) =>
{
    var userId = claimsPrincipal.GetUserId();
    var account = await repo.GetByIdAsync(id, userId);
    if (account is null) return Results.NotFound();

    await repo.DeleteAsync(account);
    await repo.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();


app.MapPut("/api/months/{id}/income", async (
    Guid id,
    IncomeRequest request,
    IBudgetMonthRepository repo,
    ClaimsPrincipal claimsPrincipal) =>
{
    var userId = claimsPrincipal.GetUserId();
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
}).RequireAuthorization();

app.Run();

// Request records
record ExpenseRequest(string Name, decimal Amount, string Category);
record SavingsAccountRequest(string Name, string Icon, string RuleType, decimal RuleValue);
record IncomeRequest(decimal Salary, decimal CsnAmount, decimal CsnLoanPart);

public partial class Program { }