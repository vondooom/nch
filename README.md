# NorCalHunt

The NorCalHunt website — weekly intel for Northern California hunters. Weather, season dates, regulations, shoot times, field stories, and gear in one place.

This repo is a Vite multi-page site built from the NorCal Hunt website rebuild export. Pages render through the included design-canvas runtime (`support.js`).

## Pages

- `/` — Homepage
- `/conditions` — Hunt-day conditions dashboard
- `/regulations` — Season dates and regs
- `/newsletters` — Briefing archive
- `/issue-13` — Latest issue
- `/field-stories` — Reader hunts
- `/gear` — Field-tested gear
- `/local-boys` — Local services directory
- `/dog-of-the-week` — Featured dogs
- `/marketplace` — Classifieds concept preview
- `/about` — Who’s behind it
- `/subscribe` — Tuesday briefing signup (client-side confirmation)

Subscribe currently validates email in the browser and shows a success state. It does not post to a newsletter provider yet.

## Local development

```bash
npm install
npm run dev
```

The dev server binds to `http://127.0.0.1:43180`.

```bash
npm run build
npm run preview
```

## Deploy

This project is set up for Vercel (Vite, static output). Push or deploy from the project root:

```bash
npx vercel --prod
```
