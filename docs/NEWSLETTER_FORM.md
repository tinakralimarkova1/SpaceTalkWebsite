# Newsletter signup: Google Sheets and owner notifications

## What happens when someone submits

The browser submits to `/api/newsletter`. Next.js validates the fields and forwards them to a secret-protected Google Apps Script web app. The script saves one row with a pending notification and returns success. A background trigger checks for queued notifications every five minutes.

The Sheet records **Timestamp, First name, Last name, Organization, Email**, in that order. Organization is optional. Additional tracking columns record notification status, attempts, last/next attempt, sent time, and a sanitized error. The notification goes only to the owner configured in `NOTIFICATION_EMAIL`, initially `tinathetinytuna@gmail.com`. It includes the name, email, organization, and a link to the private Sheet. No confirmation or welcome email is sent to the subscriber. Website success confirms the Sheet entry, not email delivery.

This revision restores owner notifications after the earlier Sheet-only version. No Supabase table or additional email service is required. Actual mail delivery still depends on Google authorization, sending quotas, and recipient spam filtering.

## Update the existing Google script

1. Open the target Sheet's **Extensions > Apps Script**. Replace the script with the contents of `google-apps-script/newsletter-signup.gs` and save.
2. Run `setupNewsletterForm` using the account that will own the notification trigger. Approve Google's requested email-sending permissions as well as Sheet access. If the project uses explicit manifest scopes, include `https://www.googleapis.com/auth/script.send_mail`.
3. In **Project Settings > Script Properties**, confirm `NOTIFICATION_EMAIL` is `tinathetinytuna@gmail.com`. Setup defaults to this address but preserves a previously configured recipient, so explicitly check it. Leave the existing `NEWSLETTER_FORM_SECRET` unchanged.
4. Open **Deploy > Manage deployments > Edit > New version > Deploy**. Keep the same `/exec` URL. The web app must still execute as the deploying owner.
5. Submit one new test identity, confirm one Sheet row and website success, then run `retryPendingNotifications` manually or wait for the five-minute trigger. Confirm status becomes `sent` and check the recipient inbox/spam folder. Retrying that signup must not create a second row or another notification.

Setup preserves existing rows and the shared secret, adds tracking columns after any existing columns, and records their starting position in `SIGNUP_NOTIFICATION_COLUMN`. Rerunning setup validates and reuses those columns. Do not move or delete them. Historical signup rows have no new pending status and do not generate retroactive mail, including when those existing subscribers resubmit.

Setup replaces notification triggers owned by the account running it with one five-minute trigger; unrelated triggers are untouched. Other editors should remove duplicate old triggers they own. A shared script lock prevents simultaneous workers from sending the same pending row. Historical extra columns remain untouched and may be hidden, but do not delete columns before the new tracking block without updating its configured position. The new column names begin with `Signup notification` to distinguish them from old records.

## Change the recipient later

Open **Apps Script > Project Settings > Script Properties** and change `NOTIFICATION_EMAIL` to the professor's approved email address. Save. No website changes or new web-app deployment are needed for a property-only change. Already queued notifications use the address configured when they are processed; sent notifications are not resent. Sender identity remains the Google account that owns the trigger, not the recipient. Transferring that account's ownership/authorization is a separate handover step.

## Retry and failure behavior

- Runs process up to ten due notifications, with a twenty-second processing budget between sends. Backlogs may take multiple trigger runs.
- A failed send retries after increasing delays (5, 10, 20, then 40 minutes), stopping at five attempts with status `failed`.
- If the sending quota is exhausted, rows stay queued without consuming attempts. They resume on a later run when quota is available.
- Missing permissions/configuration or unavailable Sheets can fail the trigger itself; inspect **Executions** if pending rows stop progressing. `sent` means Google accepted the send, not proof of inbox delivery.
- To retry a failed notification after resolving the cause, set its `Signup notification status` to `pending`, attempts to `0`, and clear its next-attempt cell; then run `retryPendingNotifications`.
- Duplicate form submissions do not queue additional mail. However, exactly-once delivery cannot be guaranteed: if Google accepts an email but the execution stops before recording `sent`, a later retry may send it again. The Sheet row itself remains deduplicated.
- Old subscribers are not backfilled automatically. Use a new email identity for the acceptance test.

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

Keep the Sheet private and give the intended owner access to the Sheet, Apps Script, Vercel, and the repository. The Google account deploying the web app authorizes Sheet access. Configure `NOTIFICATION_EMAIL` only for the intended mailing-list administrator because these emails contain submitted personal information.

Check Apps Script **Executions** and Vercel function logs when a signup fails. Logs from the website use sanitized error categories, not email addresses, secrets, or raw upstream bodies.

Saving script source is not enough to update its web endpoint: deploy a **New version** after code changes. Document both the deployment owner and notification trigger owner. This script uses MailApp for notifications; the trigger reads saved script code rather than a pinned web-app version.

## Verification

Run `npm test`, `npm run lint`, `npm run build`, and `npm audit`. The isolated regression tests never contact Google. They cover validation, success/error responses, rate limits, formula escaping, deduplication, queued delivery/retries, quota exhaustion, recipient changes, concurrent workers, and upgrades without historical mail.

For live acceptance, follow the new-identity signup and notification test above. Test formula-like inputs such as =1+1 in a separate test Sheet. Remove agreed test rows after verification.

Historical verification: on 2026-10-25 the user reported deploying the Sheet-only revision, and a live retry returned HTTP 201. On 2026-10-26 the owner-notification revision passed 31 local regression tests. Initial live attempts returned an Apps Script error. After the user reran setup and confirmed SIGNUP_NOTIFICATION_COLUMN was 6, the same test signup and retry both returned HTTP 201 with visible website success. The user then confirmed exactly one Notification Verification Test row, status sent, and receipt of the notification at the tester inbox. This verifies the local website through the deployed Google script and actual email delivery, with receipt and Sheet state confirmed by the owner. The scheduled five-minute trigger was not independently observed; the confirmation followed a request to run retryPendingNotifications manually. Repeat the signup check on Vercel after deployment, since local tests do not verify Vercel environment variables. Remove the labeled test row when finished if it should not receive future mailing-list updates.

## References

- [Google Sheets appendRow behavior](https://developers.google.com/apps-script/reference/spreadsheet/sheet#appendRow(Object))
- [Google installable triggers](https://developers.google.com/apps-script/guides/triggers/installable)
- [Google MailApp](https://developers.google.com/apps-script/reference/mail/mail-app)
- [Vercel request headers](https://vercel.com/docs/headers/request-headers)
