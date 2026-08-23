namespace Budgex.Domain.Entities;

public static class EntryCategories
{
    private static readonly EntryCategory[] IncomeOnly =
    [
        EntryCategory.Salary,
        EntryCategory.Grant,
        EntryCategory.Transfer,
        EntryCategory.Sale
    ];

    public static bool Matches(EntryKind kind, EntryCategory category) =>
        kind == EntryKind.Income
            ? IncomeOnly.Contains(category) || category == EntryCategory.Other
            : !IncomeOnly.Contains(category);
}
