# ADR 0003: Target .NET 10 (LTS) instead of .NET 9

- **Status:** Accepted
- **Date:** 2026-07-08

## Context

The original project spec locked .NET 9, which is a Standard-Term Support (STS)
release. The development machine already has the .NET 10 SDK installed, and
.NET 10 is a Long-Term Support (LTS) release.

## Decision

Target .NET 10 (LTS) across all backend projects instead of .NET 9.

## Consequences

- Longer support window (LTS is supported for about 3 years, STS for about 18
  months) — a better fit for a portfolio project meant to stay current.
- Already installed; no extra SDK setup or global.json pinning needed.
- No conceptual change: Clean Architecture, EF Core, Identity, and JWT all work
  identically. Only the target framework moniker changes (net10.0).
- A minor, deliberate divergence from the written spec, recorded here for traceability.
  git
