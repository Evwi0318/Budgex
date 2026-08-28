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

    public const string RateLimitPolicy = "auth";

    // Två flikar som laddas samtidigt hinner skicka samma cookie innan den
    // första rotationen slagit igenom. Inom det här fönstret räknas det som
    // en kapplöpning, inte som ett stulet token.
    private static readonly TimeSpan RotationGracePeriod = TimeSpan.FromSeconds(30);

    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth").RequireRateLimiting(RateLimitPolicy);

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

            if (await userManager.IsLockedOutAsync(applicationUser))
            {
                return Results.Problem(
                    "För många misslyckade försök. Vänta en stund och försök igen.",
                    statusCode: StatusCodes.Status429TooManyRequests);
            }

            var passwordValid = await userManager.CheckPasswordAsync(applicationUser, request.Password);
            if (!passwordValid)
            {
                // Räknaren är det som gör att femte felgissningen låser kontot
                await userManager.AccessFailedAsync(applicationUser);
                return Results.Unauthorized();
            }

            await userManager.ResetAccessFailedCountAsync(applicationUser);

            var domainUser = await userRepository.GetByIdAsync(applicationUser.Id);
            if (domainUser is null)
            {
                return Results.Problem("Användarens domändata saknas.", statusCode: 500);
            }

            var accessToken = tokenService.CreateAccessToken(domainUser);
            var (refreshToken, rawRefreshValue) = tokenService.CreateRefreshToken(domainUser.Id);

            db.RefreshTokens.Add(refreshToken);
            await db.SaveChangesAsync();

            SetRefreshTokenCookie(httpContext, rawRefreshValue, refreshToken.ExpiresAt);

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

            var incomingHash = tokenService.HashRefreshToken(refreshTokenValue);

            var existingToken = await db.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.TokenHash == incomingHash);

            if (existingToken is null)
            {
                return Results.Unauthorized();
            }

            if (existingToken.RevokedAt is not null)
            {
                var replacement = existingToken.ReplacedByTokenId is null
                    ? null
                    : await db.RefreshTokens
                        .FirstOrDefaultAsync(rt => rt.Id == existingToken.ReplacedByTokenId);

                // Ersättaren måste fortfarande leva. Har även den roterats
                // vidare är kedjan förbi det här token, och då är en ny
                // användning av det något annat än en kapplöpning.
                var isRace =
                    DateTime.UtcNow - existingToken.RevokedAt.Value < RotationGracePeriod
                    && replacement is not null
                    && replacement.RevokedAt is null
                    && replacement.ExpiresAt > DateTime.UtcNow;

                if (isRace)
                {
                    var raceUser = await userRepository.GetByIdAsync(existingToken.UserId);
                    if (raceUser is null)
                    {
                        return Results.Problem("Användarens domändata saknas.", statusCode: 500);
                    }

                    // Ingen ny cookie: den förfrågan som vann äger kedjan, och
                    // vi kan ändå inte återskapa dess värde ur avtrycket
                    return Results.Ok(new AuthResponse(
                        tokenService.CreateAccessToken(raceUser),
                        replacement!.ExpiresAt));
                }

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
            var (newRefreshToken, newRawValue) = tokenService.CreateRefreshToken(domainUser.Id);

            existingToken.RevokedAt = DateTime.UtcNow;
            existingToken.ReplacedByTokenId = newRefreshToken.Id;

            db.RefreshTokens.Add(newRefreshToken);
            await db.SaveChangesAsync();

            SetRefreshTokenCookie(httpContext, newRawValue, newRefreshToken.ExpiresAt);

            return Results.Ok(new AuthResponse(newAccessToken, newRefreshToken.ExpiresAt));
        });

        group.MapPost("/logout", async (
            HttpContext httpContext,
            BudgexDbContext db,
            ITokenService tokenService) =>
        {
            if (httpContext.Request.Cookies.TryGetValue(RefreshTokenCookieName, out var refreshTokenValue)
                && !string.IsNullOrWhiteSpace(refreshTokenValue))
            {
                var incomingHash = tokenService.HashRefreshToken(refreshTokenValue);

                var existingToken = await db.RefreshTokens
                    .FirstOrDefaultAsync(rt => rt.TokenHash == incomingHash);

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
            SameSite = SameSiteMode.Lax,
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
public sealed record AuthResponse(string AccessToken, DateTime RefreshTokenExpiresAt);