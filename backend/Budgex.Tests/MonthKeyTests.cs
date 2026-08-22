using Budgex.Domain.Common;
using Xunit;

namespace Budgex.Tests;

public class MonthKeyTests
{
    [Fact]
    public void Compare_EarlierMonth_IsLessThanLater()
    {
        Assert.True(new MonthKey(2026, 3) < new MonthKey(2026, 8));
    }

    [Fact]
    public void Compare_AcrossYearBoundary_ComparesYearFirst()
    {
        // December 2025 kommer före januari 2026, trots att 12 > 1
        Assert.True(new MonthKey(2025, 12) < new MonthKey(2026, 1));
    }

    [Fact]
    public void AddMonths_PastDecember_RollsIntoNextYear()
    {
        Assert.Equal(new MonthKey(2027, 2), new MonthKey(2026, 11).AddMonths(3));
    }

    [Fact]
    public void AddMonths_Negative_RollsBackIntoPreviousYear()
    {
        Assert.Equal(new MonthKey(2025, 11), new MonthKey(2026, 1).AddMonths(-2));
    }

    [Fact]
    public void Next_InDecember_GivesJanuaryNextYear()
    {
        Assert.Equal(new MonthKey(2027, 1), new MonthKey(2026, 12).Next);
    }

    [Fact]
    public void Equality_SameYearAndMonth_AreEqual()
    {
        Assert.Equal(new MonthKey(2026, 8), new MonthKey(2026, 8));
    }

    [Fact]
    public void ToString_PadsYearAndMonth()
    {
        Assert.Equal("2026-08", new MonthKey(2026, 8).ToString());
    }

    [Fact]
    public void Parse_RoundTripsToString()
    {
        var original = new MonthKey(2026, 8);

        Assert.Equal(original, MonthKey.Parse(original.ToString()));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(13)]
    public void Constructor_MonthOutsideRange_Throws(int month)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new MonthKey(2026, month));
    }
}