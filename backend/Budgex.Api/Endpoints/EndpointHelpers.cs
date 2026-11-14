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

    // Kolumnerna är numeric(18,2). Fler decimaler skulle avrundas tyst av databasen.
    public static bool HasCentsBeyondTwo(decimal value) => decimal.Round(value, 2) != value;

    public const string TooManyDecimals = "Belopp kan ha högst två decimaler.";

    public static IResult BadRequest(string message) =>
        Results.BadRequest(new { message });
}
