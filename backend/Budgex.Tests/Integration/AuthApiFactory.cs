using Budgex.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace Budgex.Tests.Integration;

public sealed class AuthApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{private readonly PostgreSqlContainer _dbContainer = new PostgreSqlBuilder("postgres:18")
    .WithDatabase("budgex_test")
    .WithUsername("postgres")
    .WithPassword("postgres")
    .Build();

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<BudgexDbContext>));

            if (descriptor is not null)
            {
                services.Remove(descriptor);
            }

            services.AddDbContext<BudgexDbContext>(options =>
                options.UseNpgsql(_dbContainer.GetConnectionString()));
        });
    }

    public async Task InitializeAsync()
    {
        await _dbContainer.StartAsync();

        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BudgexDbContext>();
        await db.Database.MigrateAsync();
    }

    public new async Task DisposeAsync()
    {
        await _dbContainer.DisposeAsync();
    }

    public HttpClient CreateClientWithCookies()
{
    return CreateClient(new WebApplicationFactoryClientOptions
    {
        HandleCookies = true
    });
}
}