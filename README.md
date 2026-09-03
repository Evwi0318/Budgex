# Budgex

> A minimalistic budget app that answers one question: how much do I have left to spend this month?

[![Live demo](https://img.shields.io/badge/Live%20demo-budgex--omega.vercel.app-3ddc84)](https://budgex-omega.vercel.app)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![.NET](https://img.shields.io/badge/.NET-10-512BD4)

Budgex is a simple budgeting app for students and people with mixed income. It calculates safe-to-spend and automatically works out how much to move to each savings account every month. It will be Installable on mobile and available as a desktop web app.

<!-- TODO (Fas 7): screenshots / GIF -->

## Live demo

**https://budgex-omega.vercel.app**

Press **Testa demo** on the sign-in screen. No registration: the API creates a throwaway account seeded with three months of a student budget — salary and study grant, rent and bills, two savings accounts with allocation rules — so every screen has something in it. The account is yours alone, so nothing you change there affects anyone else, and it is deleted after a week.

To use the app for real instead, register with an email address and a password of at least 8 characters; there is no confirmation mail. The API runs on Cloud Run and scales to zero, so the first request after an idle period may take a moment while the container starts.

## Tech stack

- **Backend:** ASP.NET Core Web API (.NET 10), C#, Clean Architecture
- **Database:** PostgreSQL + EF Core (Neon in production)
- **Auth:** ASP.NET Core Identity + JWT
- **Frontend:** React + TypeScript + Vite + Tailwind CSS (PWA)
- **Testing:** xUnit, Vitest + React Testing Library
- **CI/CD:** GitHub Actions
- **Hosting:** Vercel (frontend), Google Cloud Run (API), Neon (database)

## Architecture

<!-- TODO (Fas 0): link to /docs ER diagram and ADRs -->

See [`/docs`](./docs) for the ER diagram and architecture decision records (ADRs).

## Getting started

Secrets are never committed. Before the API will start, set them locally:

```bash
cd backend/Budgex.Api
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=budgex;Username=postgres;Password=postgres"
dotnet user-secrets set "Jwt:SecretKey" "$(openssl rand -base64 48)"
```

The key must be at least 32 bytes — startup rejects anything shorter.

<!-- TODO (Fas 1): remaining local run instructions -->

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
