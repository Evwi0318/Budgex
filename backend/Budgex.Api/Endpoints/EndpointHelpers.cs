using Budgex.Domain.Common;

namespace Budgex.Api.Endpoints;

public static class EndpointHelpers
{
    public const decimal MaxAmount = 10_000_000m;

    public static bool TryMonth(int year, int month, out MonthKey key)
    {
        key = default;
        if (year is < 2000 or > 2100 || month is < 1 or > 12) return false;

        key = new MonthKey(year, month);
        return true;
    }

    public static IResult BadRequest(string message) =>
        Results.BadRequest(new { message });
}
