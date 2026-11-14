# E-mail setup (owner)

Password reset and e-mail verification are off in production until a mail
provider is configured. The app works without them: "Glömt lösenordet?" is
hidden and new accounts can sign in straight away. Turning the provider on
never locks out existing accounts (ADR 0007). From then on, new accounts confirm their
address before signing in.

## Local development

Nothing to configure. `appsettings.Development.json` sets
`Email:PickupDirectory` to `mail-outbox/`. Every mail, including the reset link,
is written there as a `.txt` file next to the API (the folder is git-ignored).

## Production with Resend

1. Create an account at [resend.com](https://resend.com). The free plan covers 3 000 mails a month and 100 a day.
2. Add your domain (for example `divunds.se`) under **Domains** and add the DNS
   records Resend shows (SPF, DKIM) at your registrar. Wait until the domain shows **Verified**.
3. Create an API key with **Sending access** only.
4. Store it in Secret Manager and attach it to the Cloud Run service. Environment
   variables survive later deploys, so this is done once:

   ```bash
   printf '%s' 'YOUR_RESEND_API_KEY' | gcloud secrets create resend-api-key \
     --data-file=- --project=project-033d1c03-5912-428c-8e1

   gcloud secrets add-iam-policy-binding resend-api-key \
     --member="serviceAccount:1033149277081-compute@developer.gserviceaccount.com" \
     --role=roles/secretmanager.secretAccessor --project=project-033d1c03-5912-428c-8e1

   gcloud run services update budgex-api --region=europe-west3 \
     --project=project-033d1c03-5912-428c-8e1 \
     --update-secrets=Email__ResendApiKey=resend-api-key:latest \
     --update-env-vars=Email__From="Divunds <noreply@divunds.se>"
   ```

   The service account above is Cloud Run's default. If the service runs as
   another account, use that one instead (`gcloud run services describe budgex-api
   --region=europe-west3 --format="value(spec.template.spec.serviceAccountName)"`).
5. Check that `https://budgex-omega.vercel.app/api/auth/options` returns
   `{"passwordReset":true,"emailVerification":true}`, then register a test
   account and request a reset for your own address.

`App:FrontendUrl` in `appsettings.json` decides where links point. Update it
when the app moves to its own domain.
