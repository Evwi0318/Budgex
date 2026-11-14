# ADR 0005: Money and rounding

- **Status:** Accepted
- **Date:** 2026-11-14

## Decision

| Value | Rule | Where |
|---|---|---|
| Stored amounts (entries, fixed rules, goals, saved, yearly items) | `decimal`, `numeric(18,2)`. Input with more than two decimals is rejected with 400 instead of being rounded by the database. | API validation (`HasCentsBeyondTwo`) |
| Percentage allocation | Rounded **down** to whole kronor. Rounding can never allocate more than the source pays. The remainder stays in *kvar att spendera*. | `SavingsPlan.AmountFor`, `draftAmount` |
| Monthly amount for yearly items | Rounded **up** to whole kronor, so twelve months always cover the year. | `SavingsPlan.MonthlyFromItems`, `monthlyFromItems` |
| Sums and safe-to-spend | Exact `decimal` arithmetic on the backend, no intermediate rounding. Negative results are kept, never clamped. | `BudgetCalculator` |
| Transfers | The amount is frozen when the transfer is marked and never recalculated. | `SavingsMonthState.Amount` |
| Display | Whole kronor, `sv-SE` grouping. A value that rounds to zero is shown as `0`, never `−0`. | `formatKr` |

The backend is authoritative. The frontend repeats the allocation rules only for
live previews in the form, and the shared unit tests keep both sides on the same rule.

## Why round percentages down

Rounding half away from zero (the previous rule) meant two 50 % rules on
1 001 kr allocated 501 + 501 = 1 002 kr. That marked the source as
over-allocated, which since ADR 0004 asks the user to confirm transfers, even
though the plan is sound. Rounding down moves at most 1 kr per rule from savings to
spending in months that are not yet transferred. Months that are already transferred keep their frozen amounts.
