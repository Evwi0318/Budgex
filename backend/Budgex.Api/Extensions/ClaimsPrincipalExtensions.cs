using System.Security.Claims;

namespace Budgex.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var subClaim = user.FindFirst(ClaimTypes.NameIdentifier)
            ?? user.FindFirst("sub");

        if (subClaim is null || !Guid.TryParse(subClaim.Value, out var userId))
        {
            throw new InvalidOperationException("Ingen giltig användar-id hittades i token.");
        }

        return userId;
    }
}