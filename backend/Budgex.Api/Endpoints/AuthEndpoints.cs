using Budgex.Application.Interfaces;
using Budgex.Domain.Entities;
using Budgex.Infrastructure.Identity;
using Budgex.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Budgex.Api.Endpoints;

public static class AuthEndpoints
{
    private const string RefreshTokenCookieName = "refreshToken";

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
            BudgexDbContext db,
            HttpContext httpContext) =>
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

            SetRefreshTokenCookie(httpContext, refreshToken.Token, refreshToken.ExpiresAt);

            return Results.Ok(new AuthResponse(accessToken, refreshToken.ExpiresAt));
        });

        group.MapPost("/refresh", async (
            HttpContext httpContext,
            BudgexDbContext db,
            IUserRepository userRepository,
            ITokenService tokenService) =>
        {
            if (!httpContext.Request.Cookies.TryGetValue(RefreshTokenCookieName, out var refreshTokenValue)
                || string.IsNullOrWhiteSpace(refreshTokenValue))
            {
                return Results.Unauthorized();
            }

            var existingToken = await db.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == refreshTokenValue);

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
                ClearRefreshTokenCookie(httpContext);
                return Results.Unauthorized();
            }

            if (existingToken.ExpiresAt < DateTime.UtcNow)
            {
                ClearRefreshTokenCookie(httpContext);
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

            SetRefreshTokenCookie(httpContext, newRefreshToken.Token, newRefreshToken.ExpiresAt);

            return Results.Ok(new AuthResponse(newAccessToken, newRefreshToken.ExpiresAt));
        });

        group.MapPost("/logout", async (
            HttpContext httpContext,
            BudgexDbContext db) =>
        {
            if (httpContext.Request.Cookies.TryGetValue(RefreshTokenCookieName, out var refreshTokenValue)
                && !string.IsNullOrWhiteSpace(refreshTokenValue))
            {
                var existingToken = await db.RefreshTokens
                    .FirstOrDefaultAsync(rt => rt.Token == refreshTokenValue);

                if (existingToken is not null && existingToken.RevokedAt is null)
                {
                    existingToken.RevokedAt = DateTime.UtcNow;
                    await db.SaveChangesAsync();
                }
            }

            ClearRefreshTokenCookie(httpContext);
            return Results.NoContent();
        });
    }

   private static void SetRefreshTokenCookie(HttpContext httpContext, string token, DateTime expiresAt)
{
    var isDevelopment = httpContext.RequestServices
        .GetRequiredService<IWebHostEnvironment>()
        .IsDevelopment();

    httpContext.Response.Cookies.Append(RefreshTokenCookieName, token, new CookieOptions
    {
        HttpOnly = true,
        Secure = !isDevelopment,
        SameSite = isDevelopment ? SameSiteMode.Lax : SameSiteMode.None,
        Expires = expiresAt,
        Path = "/api/auth"
    });
}

    private static void ClearRefreshTokenCookie(HttpContext httpContext)
    {
        httpContext.Response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions
        {
            Path = "/api/auth"
        });
    }
}

public sealed record RegisterRequest(string Email, string Password);
public sealed record LoginRequest(string Email, string Password);
public sealed record RefreshRequest(string RefreshToken);
public sealed record AuthResponse(string AccessToken, DateTime RefreshTokenExpiresAt);