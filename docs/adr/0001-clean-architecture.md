# ADR 0001: Lightweight Clean Architecture

- **Status:** Accepted
- **Date:** 2026-07-08

## Context

Budgex has an important core of business logic, the CSN income
split and the safe-to-spend calculation. This logic must be easy to test in
isolation and must not depend on the database, the web framework, or any
external service. As a solo developer, I also
need a structure that is clear and demonstrable without being over-engineered.

## Decision

Use a lightweight Clean Architecture with four backend projects — Domain,
Application, Infrastructure, and Api — where all dependencies point inward
toward Domain. Domain has zero external dependencies (no EF Core, no ASP.NET
Core). EF entities never leave the API layer; DTOs are used at the Application
boundary.

## Consequences

- Core logic is unit-testable without a database or web server.
- Infrastructure choices (Postgres, JWT) can change without touching business rules.
- The structure is clear and easy to explain in an interview.
