# NYU Space Talks Website

This repository is the starting point for rebuilding
[space-talks.com](https://www.space-talks.com/) from Wix as a custom Next.js
website that can be hosted on Vercel with a custom domain.

## Prerequisites

- Node.js `>=22.13.0`
- npm

## Quick Start

```bash
npm install
npm run dev
npm run build
```

The local development site runs at the URL printed by `npm run dev`, usually
`http://localhost:3000`.

## Project Structure

- `app/page.tsx`: home page content and current starter data.
- `app/globals.css`: global styling and responsive layout.
- `app/layout.tsx`: site metadata, favicon, and HTML shell.
- `public/`: static assets such as favicons and future images.
- `docs/`: migration notes, Vercel/domain setup, and handoff documentation.

## Current Status

The first version is a simple single-page site with:

- About section
- Fall 2026 schedule
- Archive links
- Contact section
- Mailing-list form placeholder

The RSVP, archive, poster, and mailing-list links still need to be connected to
their final destinations as the Wix migration continues.

## Documentation

- [Migration Log](docs/migration-log.md)
- [Vercel and Domain Setup](docs/vercel-domain-setup.md)
- [Handoff Notes](docs/handoff.md)

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the production build
- `npm run start`: run the production build locally after building
- `npm run lint`: run lint checks

## Working Rule

When you make a meaningful change, add a short dated note to
`docs/migration-log.md`. This keeps the project easy to hand over.
