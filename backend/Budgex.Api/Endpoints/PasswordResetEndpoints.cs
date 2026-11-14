using Budgex.Application.Interfaces;
using Budgex.Infrastructure.Identity;
using Budgex.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using static Budgex.Api.Endpoints.EndpointHelpers;

namespace Budgex.Api.Endpoints;

public static class PasswordResetEndpoints
{
    public const string RateLimitPolicy = "account-email";

    public static void MapPasswordResetEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth").RequireRateLimiting(AuthEndpoints.RateLimitPolicy);

        // Utan e-posttjänst finns ingen återställning, och då ska appen inte
        // visa en länk som ser ut att fungera
        group.MapGet("/options", (IServiceProvider services) =>
            Results.Ok(new AuthOptionsDto(services.GetService<IEmailSender>() is not null)));

        // Samma svar oavsett om adressen finns, så endpointen avslöjar inga konton
        group.MapPost("/forgot-password", async (
            ForgotPasswordRequest request,
            UserManager<ApplicationUser> userManager,
            IServiceProvider services,
            IConfiguration configuration) =>
        {
            if (services.GetService<IEmailSender>() is not IEmailSender sender) return Results.NotFound();

            var user = await userManager.FindByEmailAsync(request.Email);
            if (user?.Email is string email && !AuthEndpoints.IsDemoEmail(email))
            {
                var token = await userManager.GeneratePasswordResetTokenAsync(user);
                var link = $"{configuration["App:FrontendUrl"]}/reset-password"
                    + $"?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";

                await sender.SendAsync(new EmailMessage(email, "Återställ ditt lösenord", ResetText(link)));
            }

            return Results.Accepted();
        }).RequireRateLimiting(RateLimitPolicy);

        group.MapPost("/reset-password", async (
            ResetPasswordRequest request,
            UserManager<ApplicationUser> userManager,
            BudgexDbContext db) =>
        {
            var user = await userManager.FindByEmailAsync(request.Email);
            var result = user is null
                ? null
                : await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);

            if (user is null || result is null || result.Errors.Any(error => error.Code == "InvalidToken"))
            {
                return BadRequest("Länken är ogiltig eller har gått ut. Begär en ny.");
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

            return Results.NoContent();
        });
    }

    private static string ResetText(string link) => $"""
        Hej!

        Någon, förhoppningsvis du, har bett om att få återställa lösenordet till ditt Divunds-konto.

        Välj ett nytt lösenord här:
        {link}

        Länken gäller i en timme och kan bara användas en gång. Om det inte var du kan du strunta i det här mejlet. Ditt lösenord är oförändrat.

        Divunds
        """;
}

public sealed record AuthOptionsDto(bool PasswordReset);
public sealed record ForgotPasswordRequest(string Email);
public sealed record ResetPasswordRequest(string Email, string Token, string NewPassword);
