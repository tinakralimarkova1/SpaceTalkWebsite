# Newsletter signup: Google Sheets only

## What happens when someone submits

The browser submits to `/api/newsletter`. Next.js validates the fields and forwards them to a secret-protected Google Apps Script web app. The script saves one row and returns success.

The Sheet records **Timestamp, First name, Last name, Organization, Email**, in that order. Organization is optional. No notification, confirmation, or welcome email is sent. The website's success message confirms the Sheet entry, not an email.

The revised requirement supersedes the earlier professor-notification and email-retry workflow. No Supabase table or new paid service is required.

## Update the existing Google script

1. In Apps Script's **Triggers** panel, delete the old `retryPendingNotifications` trigger to stop scheduled notifications immediately.
2. Replace the script with `google-apps-script/newsletter-signup.gs` from this repository and save.
3. Run `setupNewsletterForm` using the same Google account that installed the old trigger.
4. Open **Deploy > Manage deployments > Edit > New version > Deploy**. Keep the same `/exec` URL.
5. Verify a signup is recorded once, a retry does not add another row, and the website displays success.

Setup preserves existing rows and the shared secret. It removes the old notification recipient property and notification triggers owned by the current account. It does not remove unrelated triggers. A no-op function remains for old notification triggers owned by another editor so they cannot send mail using the new saved code. Ask those editors to remove their obsolete triggers too.

Existing notification columns F-K are left untouched to avoid deleting historical data. After disabling the old workflow and deploying this version, those columns can be hidden or removed if they were created solely for notifications. Keep A-E in order. Old pending labels no longer indicate active work. A notification already in progress before the change cannot be recalled.

## First-time setup

1. Create a private Google Sheet and open **Extensions > Apps Script**.
2. Paste the repository's script and run `setupNewsletterForm`. Approve the required Google permissions.
3. Under **Project Settings > Script Properties**, find `NEWSLETTER_FORM_SECRET`.
4. Deploy a **Web app**, executing as **Me**, with access set to **Anyone**. Copy the URL ending in `/exec`, not `/dev`.
5. Configure the website as described below.

Setup refuses to overwrite unexpected headers in A-E. It does not delete existing duplicate rows automatically. Never post the shared secret in chat or commit it.

## Website configuration

In local `.env.local`:

```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/your-deployment-id/exec
NEWSLETTER_FORM_SECRET=the-secret-from-script-properties
```

Restart local development after environment changes. In Vercel, add both as server-only variables and redeploy. Use a separate Sheet/script for Preview environments. Neither value should use a `NEXT_PUBLIC_` prefix.

The current route supplies the hashed client key required by the current script. Deploy both together when upgrading from older versions. The route supports JSON `{"ok":true}` and the historical plain-text `SUCCESS` response.

The upstream request times out after 45 seconds within a 60-second function budget. A network failure can still happen after saving; the message then says the signup could not be confirmed. Retrying the same email does not create a duplicate.

## Security and rate limits

- Required names, email format, field lengths, control-character checks, and a 10 KB request-body limit are enforced server-side. Apps Script validates input too.
- Formula-like submitted strings are escaped as literal text before writing to Sheets. Review later CSV exports/imports separately because spreadsheet import behavior varies.
- Normalized email (trimmed and lowercased) is checked under the same script lock as insertion. Existing entries are not overwritten. New and duplicate signups receive identical success messages.
- Honeypot and same-origin browser checks remain in place.
- Persistent Script Properties enforce **five valid attempts per client per ten minutes** and **200 valid attempts globally per 24-hour window**. Duplicate attempts count. Windows start with their first accepted attempt, not at midnight.
- On Vercel, the server uses the platform's `x-vercel-forwarded-for` header and sends an HMAC hash, never the raw IP, to Google. Outside Vercel, all requests share one local bucket.
- Shared networks share a client limit. Adjust `RATE_PER_CLIENT`, `RATE_WINDOW_MS`, or `RATE_PER_DAY` in the script and redeploy if necessary.
- Limits are updated under a script lock, survive server restarts, and expire automatically. Expired properties are pruned on the next request.
- Limited requests receive HTTP 429 and `Retry-After`. Limits protect downstream writes, not all incoming traffic; floods can still consume execution quotas. Consider a server-verified CAPTCHA or firewall if needed.
- This is not double opt-in and does not verify email ownership.

## Maintenance and handover

Keep the Sheet private and give the intended owner access to the Sheet, Apps Script, Vercel, and the repository. The Google account deploying the web app authorizes Sheet access. No email recipient needs configuration.

Check Apps Script **Executions** and Vercel function logs when a signup fails. Logs from the website use sanitized error categories, not email addresses, secrets, or raw upstream bodies.

Saving script source is not enough to update its web endpoint: deploy a **New version** each time. Document the active deployment owner. Remove obsolete email permissions if explicitly declared in an Apps Script manifest; the current source does not use MailApp or GmailApp.

## Verification

Run `npm test`, `npm run lint`, `npm run build`, and `npm audit`. The isolated regression tests never contact Google. They cover validation, success/error responses, rate limits, formula escaping, deduplication, and removal of the old notification workflow.

For live acceptance, submit one approved test identity, confirm exactly one row and visible success, then retry and confirm no second row. Check that no notification trigger remains. Test formula-like inputs such as =1+1 in a separate test Sheet. Remove agreed test rows after verification.

On 2026-10-25, the user reported deploying the Sheet-only revision. A subsequent retry using the approved existing test identity returned HTTP 201 and the normal success message through the website API. The earlier signup/retry was confirmed by the user to produce exactly one row. Trigger removal and the final Sheet contents require owner confirmation. Repeat the basic signup check on Vercel after deployment, since local tests do not verify Vercel environment variables.

## References

- [Google Sheets appendRow behavior](https://developers.google.com/apps-script/reference/spreadsheet/sheet#appendRow(Object))
- [Google installable triggers](https://developers.google.com/apps-script/guides/triggers/installable)
- [Vercel request headers](https://vercel.com/docs/headers/request-headers)
