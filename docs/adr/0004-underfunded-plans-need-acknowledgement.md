# ADR 0004: Underfunded plans need acknowledgement before transfers

- **Status:** Accepted
- **Date:** 2026-11-14

## Context

A user can save allocation rules that ask for more money than exists: two
rules taking 70 % and 50 % of the same salary, or expenses plus savings
larger than the month's income. Income varies from month to month, so a plan
that was fine last month can become impossible this month without the user
touching it. Earlier, such plans were shown as a negative "kvar att spendera"
or a per-account note, but transfers could still be marked as done as if
the plan were sound.

## Decision

- Plans are always **saved** as entered. Percentages and priorities are never
  reduced or redistributed automatically.
- A month is **underfunded** when safe-to-spend is negative
  (`income − expenses − planned savings < 0`), or when the rules on one income
  source allocate more than that source pays.
- Marking a transfer as done in an underfunded month requires
  `acknowledged: true`. Without it the API answers `409` with
  `needsAcknowledgement: true` and a Swedish message stating the exact excess.
  The API is the source of truth; the frontend computes the same warning
  (`fundingWarning`) only to show the confirmation before sending.
- Undoing a transfer never needs acknowledgement.

## Consequences

- An impossible plan is never presented as safe, and the user stays in control.
- An acknowledged transfer is recorded like any other, so history reflects what
  the user actually moved.
- The check runs per request, so a user transferring accounts one by one is asked
  each time while the month stays underfunded.
