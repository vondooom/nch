# NorCalHunt — mobile

Expo SDK 54 · Expo Router · TypeScript. A field app for Northern California waterfowl hunters, built on the same layout as Pear (`app/` routes, `components/`, `constants/theme.ts`, `lib/` stores, `eas.json`, `TESTFLIGHT.md`).

```bash
npm install
npm run web          # or: npm start → i / a for simulators
npm run typecheck    # tsc --noEmit
npm run web:export   # static web build → dist/
```

## Tabs

| Tab | File | What it does |
|---|---|---|
| Index | `app/(tabs)/index.tsx` | NorCalHunt Index 0–100 for 16 federal + state areas (filter Federal / State and by CDFW zone), zone season status, six sub-scores, live Open-Meteo (NWS fallback) weather, wind/decoy tip, barometer trend, shoot light, CDFW harvest, My Refuges. |
| GPS Map | `app/(tabs)/map.tsx` | BestForNavigation tracking (2 m / 2 s), background task `NORCALHUNT_BG_LOCATION_TASK`, compass, breadcrumb trail, SVG tactical map (native satellite view on iOS/Android), precision waypoints with distance + magnetic bearing, Simulate Walk-In Trek. |
| Logbook | `app/(tabs)/tracker.tsx` | Offline hunt log with species counters, live bag-limit warnings, team/blind group names, season analytics and leaderboard. Optional Supabase sync behind email-code sign-in (`lib/auth.tsx`, `app/sign-in.tsx`); per-user RLS in `supabase/migrations/20261106_hunt_logs_auth.sql` (not applied yet). |
| Field Desk | `app/(tabs)/intel.tsx` | Legal shoot-time clock for today/tomorrow (NOAA algorithm, Open-Meteo cross-check), 2026–27 season dates, bag limits, field rules, and the NorCalHunt newsletter archive reader. |

## Data

- `data/dispatches.json` — snapshot of the website's newsletter archive (`../lib/archive.json`, read-only). Refresh with `npm run data:dispatches`.
- `lib/refuges.ts` — refuge coordinates, 14 CCR §551 entry types, and official CDFW weekly harvest totals (Oct 21–25, 2026; areas not in the report have `harvest: null` and no Index score).
- `lib/regs.ts` — 2026–27 seasons and limits as published by the desk.
- `assets/*.png` — generated from the website logo: `python3 scripts/make-icons.py ../public/media/c287c898-f222-4e06-ba3e-f9d2131869ad.png`.

## Web and maps

`react-native-maps` has no web renderer. `components/NativeMap.tsx` is the native satellite view; Metro picks `components/NativeMap.web.tsx` for web, so the library never enters the web bundle. The default tactical map (`components/TacticalMap.tsx`) is plain `react-native-svg` and runs everywhere.
