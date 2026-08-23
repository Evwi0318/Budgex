namespace Budgex.Domain.Common;

public readonly record struct MonthKey : IComparable<MonthKey>
{
    public MonthKey(int year, int month)
    {
        if (month is < 1 or > 12)
        {
            throw new ArgumentOutOfRangeException(
                nameof(month), month, "Månaden måste vara 1–12.");
        }

        Year = year;
        Month = month;
    }

    public int Year { get; }
    public int Month { get; }

    public MonthKey Next => AddMonths(1);

    public static MonthKey From(DateOnly date) => new(date.Year, date.Month);

    public static MonthKey Parse(string value) =>
        new(int.Parse(value[..4]), int.Parse(value[5..]));

    public MonthKey AddMonths(int count) =>
        From(new DateOnly(Year, Month, 1).AddMonths(count));

    public int CompareTo(MonthKey other) =>
        (Year, Month).CompareTo((other.Year, other.Month));

    public static bool operator <(MonthKey left, MonthKey right) => left.CompareTo(right) < 0;
    public static bool operator >(MonthKey left, MonthKey right) => left.CompareTo(right) > 0;
    public static bool operator <=(MonthKey left, MonthKey right) => left.CompareTo(right) <= 0;
    public static bool operator >=(MonthKey left, MonthKey right) => left.CompareTo(right) >= 0;

    public override string ToString() => $"{Year:D4}-{Month:D2}";
}