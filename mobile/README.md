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
| Index | `app/(tabs)/index.tsx` | "How I hunt" strip on top (`components/TypeStrip.tsx`, onboarding card until a type is picked), then the NorCalHunt Index 0–100 for 16 federal + state areas (filter Federal / State and by CDFW zone), zone season status, six sub-scores, live Open-Meteo (NWS fallback) weather, wind/decoy tip, barometer trend, shoot light, CDFW harvest, My Refuges. |
| GPS Map | `app/(tabs)/map.tsx` | BestForNavigation tracking (2 m / 2 s), background task `NORCALHUNT_BG_LOCATION_TASK`, compass, breadcrumb trail, SVG tactical map (native satellite view on iOS/Android), precision waypoints with distance + magnetic bearing, Simulate Walk-In Trek. Pinned group blinds + access routes (`?blind=<id>` deep link). |
| Logbook | `app/(tabs)/tracker.tsx` | Offline hunt log with species counters, live bag-limit warnings, team/blind group names, season analytics and leaderboard. Optional blind / water / field / sightings / bands / client / guests section. Tools: Draws (multi-line nights, reservations), Groups (lease, guide service, duck club, crew), Blinds, Board (on-phone leaderboard + share card); order and emphasis follow "How I hunt". Optional Supabase sync behind email-code sign-in (`lib/auth.tsx`, `app/sign-in.tsx`); per-user RLS in `supabase/migrations/20261106_hunt_logs_auth.sql` (not applied yet). |
| Field Desk | `app/(tabs)/intel.tsx` | Legal shoot-time clock for today/tomorrow (NOAA algorithm, Open-Meteo cross-check), 2026–27 season dates, bag limits, field rules, and the NorCalHunt newsletter archive reader. |

## Data

- `data/dispatches.json` — snapshot of the website's newsletter archive (`../lib/archive.json`, read-only). Refresh with `npm run data:dispatches`.
- `lib/refuges.ts` — refuge coordinates, 14 CCR §551 entry types, and official CDFW weekly harvest totals from `lib/harvestWeeks.ts` (Index week Nov 4–8, 2026, DocumentID 248028; an area missing from it falls back to its newest older CDFW week, labeled with those dates; an area in no report has `harvest: null` and no Index score).
- `lib/refugeMaps.ts` — official hunt-map links per area. The tactical map plots only the HQ pin plus your GPS trail and waypoints, with no invented ponds or blinds.
- `lib/draws.ts` — sweat-line / reservation draw log, grouped by night (local only).
- `lib/userTypes.ts` — Build 6 hunter types: blind leasee, guide service, refuge rat, duck club (`nch.userTypes.v1`).
- `lib/groups.ts` — typed groups + roles (owner/admin/manager/guide/member/blindmate/client/guest); pre-Build 6 groups load as `crew` (or `guide_service` if they had guides). `lib/permissions.ts` — client-side role rules (clients and guests never see results).
- `lib/blinds.ts`, `lib/assignments.ts`, `lib/clubDraws.ts`, `lib/guestDays.ts`, `lib/leaderboard.ts` — blinds + performance / hot blinds, guide slates & lease schedules, club draw, guest days, on-phone board. Shared via `lib/groupStore.ts`.
- All of the above is LOCAL ONLY. Server shape for later: `supabase/migrations/20261111_guide_groups.sql` and `20261112_user_types_blinds_assignments.sql` (neither applied).
- `lib/regs.ts` — 2026–27 seasons and limits as published by the desk.
- `assets/*.png` — generated from the website logo: `python3 scripts/make-icons.py ../public/media/c287c898-f222-4e06-ba3e-f9d2131869ad.png`.

## Web and maps

`react-native-maps` has no web renderer. `components/NativeMap.tsx` is the native satellite view; Metro picks `components/NativeMap.web.tsx` for web, so the library never enters the web bundle. The default tactical map (`components/TacticalMap.tsx`) is plain `react-native-svg` and runs everywhere.

## Supabase (not configured)

The app ships with **no** Supabase URL or key (`app.json` `extra` and `eas.json` env are blank), so `isSupabaseConfigured` is false and everything stays in AsyncStorage. Sync/sign-in turn on when a dedicated **NorCalHunt** project is created and its URL + anon key are set as `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` (or `app.json` `extra`). Apply `supabase/schema.sql` then `supabase/migrations/*` in date order to that project only.
