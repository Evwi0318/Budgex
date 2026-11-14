# ADR 0006: Signed account links instead of Data Protection tokens

- **Status:** Accepted
- **Date:** 2026-11-14

## Context

Password reset (and later e-mail verification) sends a link with a token.
ASP.NET Core Identity's default `DataProtectorTokenProvider` encrypts the token
with Data Protection keys. Without a shared key store, those keys live inside
the container: on Cloud Run, a link stops working after a redeploy, a restart,
or when the request lands on another instance. Persisting the keys would need a
new table, a migration and an extra package, for this one feature.

## Decision

`SignedLinkTokenProvider` is plugged into Identity with `AddTokenProvider` and
used as `PasswordResetTokenProvider`:

- The token is `{unix expiry}.{HMAC-SHA256}`. The HMAC covers the user id, the purpose, the e-mail,
  the security stamp and the expiry.
- The key is derived with HKDF from `Jwt:SecretKey`, which is already a required
  secret, using its own `info` label so it never equals the JWT signing key.
- Links expire after one hour. They are single use because Identity rotates the
  security stamp when the password is reset. Changing the e-mail also invalidates them.
- Comparison is constant-time. Only standard primitives from `System.Security.Cryptography` are used.

Supporting rules:

- `forgot-password` always answers `202` with the same body. Demo accounts never get mail.
- A successful reset clears the lockout and revokes every refresh token.
- Mail goes through `IEmailSender`. `ResendEmailSender` is used when `Email:ResendApiKey`
  is set. `PickupDirectoryEmailSender` writes files locally. With neither, no sender
  is registered, `/api/auth/options` reports `passwordReset: false`, and the UI
  hides "Glömt lösenordet?".

## Consequences

- Rotating `Jwt:SecretKey` invalidates outstanding links (and all sessions), which is acceptable.
- Known limitation: sending a mail takes longer than skipping it, so response
  *timing* can still hint that an address exists. Responses are identical in
  status and body, and the rate limit is five requests per IP per 15 minutes. A background
  queue would remove the timing difference if it ever matters.
