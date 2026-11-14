using Budgex.Application.Interfaces;
using Budgex.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Budgex.Tests.Integration;

public sealed class EmailApiFactory : AuthApiFactory
{
    public TestOutbox Outbox { get; } = new();

    protected override IEmailSender EmailSender => Outbox;

    public async Task ConfirmEmailAsync(string email)
    {
        using var scope = Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = (await users.FindByEmailAsync(email))!;

        await users.ConfirmEmailAsync(user, await users.GenerateEmailConfirmationTokenAsync(user));
    }
}
