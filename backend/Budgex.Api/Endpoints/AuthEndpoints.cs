using Budgex.Application.Interfaces;
using Budgex.Domain.Entities;
using Budgex.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
namespace Budgex.Api.Endpoints;
using Budgex.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/register", async (
           [FromBody] RegisterRequest request,
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
     [FromBody] LoginRequest request,
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


   group.MapPost("/refresh", async (
    [FromBody] RefreshRequest request,
    BudgexDbContext db,
    IUserRepository userRepository,
    ITokenService tokenService) =>
{
    var existingToken = await db.RefreshTokens
        .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

    if (existingToken is null)
    {
        return Results.Unauthorized();
    }

    if (existingToken.RevokedAt is not null)
    {
        // Möjlig replay-attack: token har redan använts en gång tidigare.
        // Återkalla alla aktiva tokens för denna användare som säkerhetsåtgärd.
        var allUserTokens = await db.RefreshTokens
            .Where(rt => rt.UserId == existingToken.UserId && rt.RevokedAt == null)
            .ToListAsync();

        foreach (var t in allUserTokens)
        {
            t.RevokedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
        return Results.Unauthorized();
    }

    if (existingToken.ExpiresAt < DateTime.UtcNow)
    {
        return Results.Unauthorized();
    }

    var domainUser = await userRepository.GetByIdAsync(existingToken.UserId);
    if (domainUser is null)
    {
        return Results.Problem("Användarens domändata saknas.", statusCode: 500);
    }

    var newAccessToken = tokenService.CreateAccessToken(domainUser);
    var newRefreshToken = tokenService.CreateRefreshToken(domainUser.Id);

    existingToken.RevokedAt = DateTime.UtcNow;
    existingToken.ReplacedByTokenId = newRefreshToken.Id;

    db.RefreshTokens.Add(newRefreshToken);
    await db.SaveChangesAsync();

    return Results.Ok(new AuthResponse(
        newAccessToken,
        newRefreshToken.Token,
        newRefreshToken.ExpiresAt));
});

group.MapPost("/logout", async (
    [FromBody] RefreshRequest request,
    BudgexDbContext db) =>
{
    var existingToken = await db.RefreshTokens
        .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

    if (existingToken is not null && existingToken.RevokedAt is null)
    {
        existingToken.RevokedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    return Results.NoContent();
});



  }
}

public sealed record RegisterRequest(string Email, string Password);
public sealed record LoginRequest(string Email, string Password);
public sealed record AuthResponse(string AccessToken, string RefreshToken, DateTime RefreshTokenExpiresAt);
public sealed record RefreshRequest(string RefreshToken);