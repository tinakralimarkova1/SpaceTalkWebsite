# Backend setup

This project uses Supabase for the backend and is designed to deploy on Vercel. Both services can be used on their free plans while the site is small.

## What is configured

- `@supabase/supabase-js` provides the Supabase database, authentication, and storage client.
- `@supabase/ssr` provides clients that work with the Next.js App Router and cookie-based user sessions.
- `lib/supabase/client.ts` is for Client Components running in the browser.
- `lib/supabase/server.ts` is for Server Components, Server Actions, and Route Handlers.
- `.env.example` documents the required configuration without storing real credentials in Git.

No database tables or authentication screens have been added yet. Those should be created for a specific feature so the schema and security policies match the real workflow.

## 1. Create the Supabase project

1. Sign in at https://supabase.com/dashboard.
2. Create a new organization or use an existing one.
3. Create a new project on the Free plan.
4. Choose a strong database password and store it in a password manager. The website does not need this password for normal Supabase client requests.
5. Choose a region close to the main audience.
6. Wait for the project to finish provisioning.

## 2. Get the connection values

1. Open the project in the Supabase dashboard.
2. Open the Connect dialog or go to Project Settings > API.
3. Copy the Project URL.
4. Copy the publishable key. Older projects may label this the `anon` key.
5. Never use the `service_role` or secret key in browser code or in a variable beginning with `NEXT_PUBLIC_`.

## 3. Connect local development

Create `.env.local` in the project root using `.env.example` as the template:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Restart `npm run dev` after changing environment variables. `.env.local` is ignored by Git and must never be committed.

## 4. Create database features safely

For each feature, create tables in the Supabase SQL Editor or with versioned migrations. Then:

1. Enable Row Level Security on every table exposed through the Data API.
2. Add policies defining exactly who may select, insert, update, or delete rows.
3. Keep public content, authenticated-user content, and administrator actions separate.
4. Test policies with both signed-out and signed-in users before publishing.

Suggested implementation order for this website:

1. Newsletter signups.
2. Talks, speakers, seasons, and archive records.
3. Research posts and searchable metadata.
4. User accounts and profiles.
5. Comments and discussion pages with moderation controls.
6. Media metadata and file storage, if needed.

## 5. Add authentication later

The browser and server clients are ready for authentication, but authentication itself is intentionally not enabled yet. When accounts are added, also add:

- Supabase Auth providers and redirect URLs.
- A Next.js `proxy.ts` that refreshes session cookies.
- Email confirmation and password-reset routes.
- Protected server-side queries using verified claims, not untrusted browser state.
- Profile and role tables protected by Row Level Security.

## 6. Deploy through Vercel

1. Push the project to GitHub.
2. Import the repository at https://vercel.com/new and select the Free/Hobby plan.
3. In the Vercel project, open Settings > Environment Variables.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Production, Preview, and Development.
5. Deploy or redeploy after adding the variables. Environment-variable changes do not affect deployments that already exist.
6. Add the final Vercel URL and custom domain to Supabase Auth redirect URLs before enabling login.

The optional Supabase integration in the Vercel Marketplace can populate the same variables automatically. Manual variables are also fine and make the connection easier to understand during handover.

## Security checklist

- Commit `.env.example`, never `.env.local`.
- Never expose a Supabase secret or `service_role` key to the browser.
- Enable Row Level Security before putting real data into public-facing tables.
- Validate form input on the server.
- Add rate limiting and bot protection to public forms.
- Restrict administrator actions to server-side code and verified roles.
- Review Supabase and Vercel usage dashboards so the project stays within free-plan limits.

## Free-plan expectations

The free tiers are suitable for development and an early version of this site. Supabase may pause inactive free projects, and free-plan storage, database, authentication, bandwidth, and function quotas are limited. Vercel's Hobby plan also has usage limits. Check the current official pricing pages before launch because quotas can change.
