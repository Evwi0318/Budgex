# ADR 0002: CSN loan portion is entered exactly, not guessed

- **Status:** Accepted
- **Date:** 2026-07-08

## Context

Swedish student aid (CSN) combines a grant portion, which is spendable income,
and a loan portion, which should not be treated as spendable. The loan amount
varies with the student's situation (full-time, part-time, higher grant, or no
loan). Any approach that guesses this split with percentages or per-week math is
fragile and wrong for some cases.

## Decision

Model CSN as an income source where the user enters the loan portion in kronor,
read directly from their official CSN decision. The grant
(csnAmount − loanAmount) counts as income; the loan is always set aside and
added to the amount to transfer to the bank. No percentage guessing.

## Consequences

- Correct for every case, because the number comes from the user's real decision.
- Simple to implement and simple to explain.
- Keeps the safe-to-spend rule pure and easy to unit-test.
- Requires the user to read one number off their CSN decision — an acceptable,
  one-time input that removes a whole class of guessing errors.
