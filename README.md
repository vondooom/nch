# NorCalHunt

Weekly intel for Northern California hunters — weather, season dates, regulations, shoot times, field stories, recipes, and gear in one place.

The public site is a Next.js App Router app. Staff manage copy from **the desk** at `/admin`.

## Roles

| Role | What they can do |
| --- | --- |
| **Editor** | Create and revise drafts, update hunt-day conditions, work the public inbox. Cannot publish, unpublish, or delete. |
| **Admin** | Everything an editor can do, plus publish, delete, and see the Team page. |

Local seats (change these in `.env.local`):

- Admin: `admin@norcalhunt.local` / `hunt-admin`
- Editor: `editor@norcalhunt.local` / `hunt-editor`

Sign in at `/sign-in`. Production should set `STAFF_SESSION_SECRET` and stronger passwords. Clerk + Neon can replace the cookie login and JSON store when you connect them on the Vercel project.

## Public pages

- `/` — Homepage, conditions strip, latest briefings, featured recipe
- `/newsletters` and `/newsletters/[slug]` — Tuesday briefing archive
- `/field-stories` and `/field-stories/[slug]` — Reader hunts
- `/field-stories/submit` — Public story inbox
- `/dog-of-the-week` and `/nominate` — Featured dogs
- `/recipes` — From Field to Table
- `/gear` — Field-tested picks
- `/conditions` — Hunt-day dashboard
- `/regulations` — The Board (seasons and deadlines)
- `/local-boys` — Trusted local services
- `/marketplace` — Classifieds preview
- `/about` / `/subscribe`

Drafts never appear on these routes.

## The desk (`/admin`)

Collections: issues, stories, dogs, gear, recipes, the Board, Local Boys, marketplace, conditions, and the public inbox. Accepting an inbox item can start a draft. Only admins can push that draft live.

Content is stored in `.data/store.json` locally and `/tmp/norcal-hunt-store.json` on Vercel until Neon is connected. Serverless writes will not persist across instances.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Dev server: `http://127.0.0.1:43180`

```bash
npm run build
npm run start
```

## Deploy

Production project: [norcal-hunt.vercel.app](https://norcal-hunt.vercel.app)

Set `STAFF_SESSION_SECRET`, `ADMIN_PASSWORD`, and `EDITOR_PASSWORD` on the Vercel project before treating the desk as real. Then:

```bash
npx vercel --prod
```

To graduate off the local seats and ephemeral JSON file, add **Clerk** and **Neon** from the Vercel Marketplace on the `norcal-hunt` project and pull env vars with `vercel env pull`.
