using Budgex.Application.Interfaces;
using Budgex.Domain.Entities;
using Budgex.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
namespace Budgex.Api.Endpoints;
using Budgex.Infrastructure.Persistence;



public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/register", async (
            RegisterRequest request,
            UserManager<ApplicationUser> userManager,
            IUserRepository userRepository) =>
        {
            var existingUser = await userRepository.GetByEmailAsync(request.Email);
            if (existingUser is not null)
            {
                return Results.Conflict(new { message = "En användare med denna e-post finns redan." });
            }

            var userId = Guid.NewGuid();

            var applicationUser = new ApplicationUser
            {
                Id = userId,
                UserName = request.Email,
                Email = request.Email
            };

            var identityResult = await userManager.CreateAsync(applicationUser, request.Password);

            if (!identityResult.Succeeded)
            {
                var errors = identityResult.Errors.Select(e => e.Description);
                return Results.BadRequest(new { errors });
            }

            var domainUser = new User
            {
                Id = userId,
                Email = request.Email,
                PasswordHash = string.Empty
            };

            await userRepository.AddAsync(domainUser);
            await userRepository.SaveChangesAsync();

            return Results.Created($"/api/auth/users/{userId}", new { id = userId, email = request.Email });
        });

        group.MapPost("/login", async (
    LoginRequest request,
    UserManager<ApplicationUser> userManager,
    IUserRepository userRepository,
    ITokenService tokenService,
    BudgexDbContext db) =>
{
    var applicationUser = await userManager.FindByEmailAsync(request.Email);
    if (applicationUser is null)
    {
        return Results.Unauthorized();
    }

    var passwordValid = await userManager.CheckPasswordAsync(applicationUser, request.Password);
    if (!passwordValid)
    {
        return Results.Unauthorized();
    }

    var domainUser = await userRepository.GetByIdAsync(applicationUser.Id);
    if (domainUser is null)
    {
        return Results.Problem("Användarens domändata saknas.", statusCode: 500);
    }

    var accessToken = tokenService.CreateAccessToken(domainUser);
    var refreshToken = tokenService.CreateRefreshToken(domainUser.Id);

    db.RefreshTokens.Add(refreshToken);
    await db.SaveChangesAsync();

    return Results.Ok(new AuthResponse(
        accessToken,
        refreshToken.Token,
        refreshToken.ExpiresAt));
});
    }
}

public sealed record RegisterRequest(string Email, string Password);
public sealed record LoginRequest(string Email, string Password);
public sealed record AuthResponse(string AccessToken, string RefreshToken, DateTime RefreshTokenExpiresAt);