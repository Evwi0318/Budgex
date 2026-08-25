using Budgex.Api.Extensions;
using Budgex.Application.Interfaces;
using Budgex.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace Budgex.Api.Endpoints;

public static class ProfileEndpoints
{
    private const int MaxNameLength = 60;

    public static void MapProfileEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/profile").RequireAuthorization();

        group.MapGet("", async (
            IUserRepository users,
            ClaimsPrincipal principal) =>
        {
            var user = await users.GetByIdAsync(principal.GetUserId());

            return user is null
                ? Results.NotFound()
                : Results.Ok(new ProfileDto(user.Email, user.Name));
        });

        group.MapPut("", async (
            UpdateProfileRequest request,
            IUserRepository users,
            ClaimsPrincipal principal) =>
        {
            var name = request.Name?.Trim();

            if (name is { Length: > MaxNameLength })
            {
                return Results.BadRequest(new { message = $"Namnet får vara högst {MaxNameLength} tecken." });
            }

            var user = await users.GetByIdAsync(principal.GetUserId());
            if (user is null) return Results.NotFound();

            user.Name = string.IsNullOrWhiteSpace(name) ? null : name;
            await users.SaveChangesAsync();

            return Results.Ok(new ProfileDto(user.Email, user.Name));
        });

        group.MapPut("/password", async (
            ChangePasswordRequest request,
            UserManager<ApplicationUser> userManager,
            ClaimsPrincipal principal) =>
        {
            var applicationUser = await userManager.FindByIdAsync(principal.GetUserId().ToString());
            if (applicationUser is null) return Results.NotFound();

            var result = await userManager.ChangePasswordAsync(
                applicationUser, request.CurrentPassword, request.NewPassword);

            if (!result.Succeeded)
            {
                return Results.BadRequest(new { errors = result.Errors.Select(e => e.Description) });
            }

            return Results.NoContent();
        });

        group.MapDelete("", async (
            IUserRepository users,
            UserManager<ApplicationUser> userManager,
            ClaimsPrincipal principal) =>
        {
            var userId = principal.GetUserId();

            // Domändatan först: den kaskaderar bort månader, poster och
            // sparkonton. Blir identitetsraderingen kvar efteråt kan personen
            // logga in mot ett tomt konto, vilket är bättre än ett spöke i
            // Identity som ingen längre kan nå.
            var user = await users.GetByIdAsync(userId);
            if (user is not null)
            {
                await users.RemoveAsync(user);
                await users.SaveChangesAsync();
            }

            var applicationUser = await userManager.FindByIdAsync(userId.ToString());
            if (applicationUser is not null)
            {
                await userManager.DeleteAsync(applicationUser);
            }

            return Results.NoContent();
        });
    }
}

public sealed record ProfileDto(string Email, string? Name);
public sealed record UpdateProfileRequest(string? Name);
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
