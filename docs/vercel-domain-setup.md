# Vercel and Domain Setup

This project is structured as a standard Next.js app, which Vercel can deploy
directly from a Git repository.

## First Vercel Deployment

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In Vercel, choose **Add New Project**.
3. Import the repository.
4. Keep the framework preset as **Next.js**.
5. Use the default commands:
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: leave empty
6. Deploy.
7. Copy the Vercel preview URL into `docs/migration-log.md`.

## Custom Domain

1. In Vercel, open the project.
2. Go to **Settings > Domains**.
3. Add `space-talks.com`.
4. Add `www.space-talks.com`.
5. Follow the DNS records Vercel gives you.

Typical DNS setup:

- Apex domain `space-talks.com`: `A` record pointing to Vercel's provided IP.
- `www.space-talks.com`: `CNAME` pointing to Vercel's provided hostname.

Always copy the exact values from Vercel because they can change.

## Launch Checklist

- Current Wix content has been reviewed against the new site.
- RSVP links point to direct Zoom or event-registration destinations.
- Archive and poster links are rebuilt or redirected.
- Mailing-list form is connected and tested.
- Contact details are approved.
- Metadata title and description are approved.
- Stakeholders have reviewed a Vercel preview deployment.
- DNS is changed only after the preview has been approved.
- Wix domain settings are documented before changing them.
