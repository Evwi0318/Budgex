# ADR 0007: E-mail verification without locking anyone out

- **Status:** Accepted
- **Date:** 2026-11-14

## Context

New accounts should prove they own their address. However, every existing
account was created without any mail, and production has no mail provider yet.
Requiring confirmation for those accounts would lock real users out of their
budgets.

## Decision

- **Existing accounts are treated as confirmed.** Migration
  `TreatExistingEmailsAsConfirmed` sets `EmailConfirmed = true` once. It is a data-only change,
  and the model is unchanged.
- **Without a mail provider**, registration works as before: `201`, the user signs in
  immediately, and the account is created with `EmailConfirmed = true`. A taken address
  still gets `409`, because there is no other channel to tell the user.
- **With a mail provider** (`IEmailSender` registered):
  - Registration answers `202` with the same body whether or not the address
    is taken. A new address gets a confirmation link. A taken address gets an
    "you already have an account" mail. Password rules are checked first, so a
    weak password fails the same way for both.
  - Signing in to an unconfirmed account with the **correct** password returns
    `403` with `needsConfirmation`. A wrong password still returns the generic `401`,
    so only the owner learns the account is waiting.
  - `POST /api/auth/resend-confirmation` always answers `202` and only mails
    unconfirmed accounts. It is rate limited like `forgot-password`.
  - A successful password reset also confirms the address, since the link
    arrived there.
- Confirmation links use `SignedLinkTokenProvider` (ADR 0006) and last one hour.
- Demo accounts are created confirmed.

## Consequences

- Turning on a mail provider never locks out anyone who could sign in before.
- The `409` enumeration on registration stays only while no mail provider is configured.
- Sending mail on registration, like reset, can leave a small timing difference
  (see ADR 0006).
