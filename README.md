# Budgex

> A minimalist budget app that answers one question: how much do I have left to spend this month?

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![.NET](https://img.shields.io/badge/.NET-10-512BD4)

Budgex is a budgeting app for students and people with mixed income (salary + Swedish student aid, CSN). It calculates safe-to-spend and automatically works out how much to move to each savings account every month. Installable on mobile and available as a desktop web app.

<!-- TODO (Fas 7): screenshots / GIF -->
<!-- TODO (Fas 1): live demo link -->

## Tech stack

- **Backend:** ASP.NET Core Web API (.NET 10), C#, Clean Architecture
- **Database:** PostgreSQL + EF Core (Neon in production)
- **Auth:** ASP.NET Core Identity + JWT
- **Frontend:** React + TypeScript + Vite + Tailwind CSS (PWA)
- **Testing:** xUnit, Vitest + React Testing Library
- **CI/CD:** GitHub Actions
- **Hosting:** Azure Container Apps (API), Neon (database)

## Architecture

<!-- TODO (Fas 0): link to /docs ER diagram and ADRs -->

See [`/docs`](./docs) for the ER diagram and architecture decision records (ADRs).

## Getting started

<!-- TODO (Fas 1): local run instructions -->

## Testing

<!-- TODO (Fas 2+): how to run tests -->

## Project structure

<!-- TODO (Fas 1): folder overview -->

## Future work

Statistics, savings goals, streaks, multi-currency, and PRO features are intentionally out of scope for the MVP.

## AI assistance

AI was used for repetitive and mechanical work — boilerplate, configuration, test scaffolding, commit message formatting, and documentation structure. The core decisions — the domain model, the CSN logic, the architecture, and the trade-offs — were made and understood by me.

## License

[MIT](./LICENSE)
