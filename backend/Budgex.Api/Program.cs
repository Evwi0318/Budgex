using Budgex.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<BudgexDbContext> (options => options.UseNpgsql (builder.Configuration.GetConnectionString("DefaultConnection")));

// Add services to the container.> (options => options.UseNpgsql (builder.Configuration.GetConnectionString("DefaultConnection")));
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173", 
            "https://budgex-omega.vercel.app",
            "https://budgex-p0e4qmp6v-wilbardevan03-1705s-projects.vercel.app" // Lägg till preview-länken här
        )
        .AllowAnyMethod()
        .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors();

app.MapGet("/api/health", ()=> Results.Ok(new {status = "Healthy"}));

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();



app.Run();

