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
        // Testerna får inte hänga på utvecklarens user-secrets — utan detta
        // startar de på min maskin men inte i CI
        builder.UseSetting("Jwt:SecretKey", "integration-test-key-minst-32-tecken-langt");
        builder.UseSetting("ConnectionStrings:DefaultConnection", _dbContainer.GetConnectionString());

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

    // För tester som behöver skicka en bestämd cookie i stället för den
    // senast mottagna — annars går kapplöpningen inte att återskapa
    public HttpClient CreateClientWithoutCookies()
    {
        return CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = false
        });
    }
}