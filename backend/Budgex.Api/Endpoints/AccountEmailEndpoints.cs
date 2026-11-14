using Budgex.Application.Interfaces;
using Budgex.Infrastructure.Identity;
using Budgex.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using static Budgex.Api.Endpoints.EndpointHelpers;

namespace Budgex.Api.Endpoints;

// Allt som skickar mejl om kontot. Utan e-posttjänst registreras ingen
// IEmailSender, och då är både återställning och verifiering avstängda
// i stället för halvfärdiga (ADR 0006, 0007).
public static class AccountEmailEndpoints
{
    public const string RateLimitPolicy = "account-email";

    private const string InvalidLink = "Länken är ogiltig eller har gått ut.";

    public static void MapAccountEmailEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth").RequireRateLimiting(AuthEndpoints.RateLimitPolicy);

        group.MapGet("/options", (IServiceProvider services) =>
        {
            var hasEmail = services.GetService<IEmailSender>() is not null;
            return Results.Ok(new AuthOptionsDto(PasswordReset: hasEmail, EmailVerification: hasEmail));
        });

        // Samma svar oavsett om adressen finns, så endpointen avslöjar inga konton
        group.MapPost("/forgot-password", async (
            EmailRequest request,
            UserManager<ApplicationUser> userManager,
            IServiceProvider services,
            IConfiguration configuration) =>
        {
            if (services.GetService<IEmailSender>() is not IEmailSender sender) return Results.NotFound();

            var user = await userManager.FindByEmailAsync(request.Email);
            if (user?.Email is string email && !AuthEndpoints.IsDemoEmail(email))
            {
                var token = await userManager.GeneratePasswordResetTokenAsync(user);
                await sender.SendAsync(ResetMessage(email, Link(configuration, "reset-password", email, token)));
            }

            return Results.Accepted();
        }).RequireRateLimiting(RateLimitPolicy);

        group.MapPost("/reset-password", async (
            ResetPasswordRequest request,
            UserManager<ApplicationUser> userManager,
            BudgexDbContext db) =>
        {
            var user = await userManager.FindByEmailAsync(request.Email);
            if (user is null) return BadRequest($"{InvalidLink} Begär en ny.");

            var result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
            if (result.Errors.Any(error => error.Code == "InvalidToken"))
            {
                return BadRequest($"{InvalidLink} Begär en ny.");
            }

            if (!result.Succeeded)
            {
                return Results.BadRequest(new { errors = result.Errors.Select(error => error.Description) });
            }

            // Den som återställer har bevisat att mejlen är deras: ett lås från
            // gissningar ska inte hindra dem, och gamla sessioner ska ut
            await userManager.SetLockoutEndDateAsync(user, null);
            await userManager.ResetAccessFailedCountAsync(user);
            await AuthEndpoints.RevokeSessionsAsync(db, user.Id);

            // Länken kom till mejlen, så adressen är bevisligen deras
            if (!user.EmailConfirmed)
            {
                user.EmailConfirmed = true;
                await userManager.UpdateAsync(user);
            }

            return Results.NoContent();
        });

        group.MapPost("/confirm-email", async (
            ConfirmEmailRequest request,
            UserManager<ApplicationUser> userManager) =>
        {
            var user = await userManager.FindByEmailAsync(request.Email);
            var confirmed = user is not null
                && (await userManager.ConfirmEmailAsync(user, request.Token)).Succeeded;

            return confirmed ? Results.NoContent() : BadRequest(InvalidLink);
        });

        group.MapPost("/resend-confirmation", async (
            EmailRequest request,
            UserManager<ApplicationUser> userManager,
            IServiceProvider services,
            IConfiguration configuration) =>
        {
            if (services.GetService<IEmailSender>() is not IEmailSender sender) return Results.NotFound();

            var user = await userManager.FindByEmailAsync(request.Email);
            if (user is { EmailConfirmed: false })
            {
                await SendConfirmationAsync(sender, userManager, configuration, user);
            }

            return Results.Accepted();
        }).RequireRateLimiting(RateLimitPolicy);
    }

    public static async Task SendConfirmationAsync(
        IEmailSender sender,
        UserManager<ApplicationUser> userManager,
        IConfiguration configuration,
        ApplicationUser user)
    {
        var email = user.Email!;
        var token = await userManager.GenerateEmailConfirmationTokenAsync(user);

        await sender.SendAsync(new EmailMessage(email, "Bekräfta din e-post", $"""
            Hej och välkommen till Divunds!

            Bekräfta att det här är din e-post så aktiveras kontot:
            {Link(configuration, "confirm-email", email, token)}

            Länken gäller i en timme. Om det inte var du som skapade kontot kan du strunta i det här mejlet.

            Divunds
            """));
    }

    // Någon försökte registrera en adress som redan har ett konto. Ägaren får
    // veta det i sin inkorg i stället för att registreringen avslöjar det.
    public static Task SendAlreadyRegisteredAsync(IEmailSender sender, IConfiguration configuration, string email) =>
        sender.SendAsync(new EmailMessage(email, "Du har redan ett konto", $"""
            Hej!

            Någon, förhoppningsvis du, försökte skapa ett nytt Divunds-konto med den här adressen. Det finns redan ett konto, så inget nytt skapades.

            Logga in här: {configuration["App:FrontendUrl"]}/login
            Har du glömt lösenordet kan du återställa det därifrån.

            Divunds
            """));

    private static string Link(IConfiguration configuration, string page, string email, string token) =>
        $"{configuration["App:FrontendUrl"]}/{page}?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";

    private static EmailMessage ResetMessage(string email, string link) => new(email, "Återställ ditt lösenord", $"""
        Hej!

        Någon, förhoppningsvis du, har bett om att få återställa lösenordet till ditt Divunds-konto.

        Välj ett nytt lösenord här:
        {link}

        Länken gäller i en timme och kan bara användas en gång. Om det inte var du kan du strunta i det här mejlet. Ditt lösenord är oförändrat.

        Divunds
        """);
}

public sealed record AuthOptionsDto(bool PasswordReset, bool EmailVerification);
public sealed record EmailRequest(string Email);
public sealed record ResetPasswordRequest(string Email, string Token, string NewPassword);
public sealed record ConfirmEmailRequest(string Email, string Token);
