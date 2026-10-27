# Shipping NorCalHunt to TestFlight

End-to-end checklist for getting `com.norcalhunts.app` onto a hunting partner's iPhone through TestFlight. Commands run from `mobile/`.

## Prerequisites (one-time)

- [ ] **Apple Developer Program** membership on the Siki Holding Corp team (`JSNAXH9XX2`).
- [ ] **Bundle ID** `com.norcalhunts.app` registered at https://developer.apple.com/account/resources/identifiers. Capabilities: none extra are needed for background location — it is an Info.plist background mode, not an App ID capability (see below).
- [ ] **App Store Connect app record** — https://appstoreconnect.apple.com → My Apps → + → New App. Platform iOS, name **NorCalHunt**, bundle ID `com.norcalhunts.app`, SKU `norcalhunt-ios`.
- [ ] **Expo account** — https://expo.dev.
- [ ] **eas-cli** — use `npx eas-cli@latest` (bare `npx eas-cli` fails with "Invalid Version" in Pear; same here).

## Wiring the project to EAS (one-time)

```bash
cd mobile
npx eas-cli@latest login
npx eas-cli@latest init          # fills extra.eas.projectId + owner in app.json — commit them
npx eas-cli@latest credentials   # let EAS create the distribution cert + profile
```

## Background location — what's configured and what Apple will ask

The walk-in breadcrumb trail keeps recording with the phone in a wader pocket. That needs:

| Where | Setting |
|---|---|
| `app.json → ios.infoPlist.UIBackgroundModes` | `["location"]` |
| `NSLocationWhenInUseUsageDescription` | navigate refuges in the dark, waypoints, shoot times |
| `NSLocationAlwaysAndWhenInUseUsageDescription` | background breadcrumb trail / return bearing |
| `NSLocationAlwaysUsageDescription` | background trail in pre-dawn conditions |
| `NSMotionUsageDescription` | compass heading |
| `expo-location` plugin | `isIosBackgroundLocationEnabled: true`, Android background + foreground service |
| JS | `NORCALHUNT_BG_LOCATION_TASK` defined in `lib/locationTask.ts`, imported first from `index.ts` |

After `expo prebuild`, confirm in Xcode → target **NorCalHunt** → **Signing & Capabilities** that **Background Modes → Location updates** is ticked. If it isn't, the plist key didn't make it in — re-run prebuild with `--clean`.

App Review: background location gets scrutiny. Put this in **App Review Information → Notes**:

> NorCalHunt records a GPS breadcrumb trail while a waterfowl hunter walks from their truck to a blind before dawn, so they can follow it back out. Background location runs only after the user starts a walk-in on the GPS Map tab and turns on "Background tracking"; it stops when they tap Stop Trek. To test without travelling: GPS Map → Simulate trek.

## Build option A — EAS cloud

```bash
npx eas-cli@latest build --platform ios --profile production    # autoIncrement bumps buildNumber
npx eas-cli@latest submit --platform ios --latest
```

`preview` is an internal ad-hoc build (testers' UDIDs must be registered); `development` is a simulator dev client.

## Build option B — Xcode on Chris's Mac

Xcode is signed in to team `JSNAXH9XX2` and manages App Store signing itself. Bump `expo.ios.buildNumber` in `app.json` first (every upload needs a higher number), then:

```bash
cd mobile

# 1. Regenerate the native project from app.json (ios/ is gitignored)
CI=1 npx expo prebuild --platform ios --clean
(cd ios && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install)   # CocoaPods needs a UTF-8 locale

# 2. Archive. Only public values may be in the env — Supabase URL + anon key, if sync is on.
export EXPO_NO_DOTENV=1
export EXPO_PUBLIC_SUPABASE_URL=...  EXPO_PUBLIC_SUPABASE_ANON_KEY=...   # optional; copy from eas.json
(cd ios && xcodebuild -workspace NorCalHunt.xcworkspace -scheme NorCalHunt -configuration Release \
  -destination "generic/platform=iOS" -archivePath /tmp/NorCalHunt.xcarchive \
  -allowProvisioningUpdates DEVELOPMENT_TEAM=JSNAXH9XX2 CODE_SIGN_STYLE=Automatic archive)

# 3. Export + upload. ExportOptions.plist: method app-store-connect, destination upload,
#    teamID JSNAXH9XX2, signingStyle automatic, manageAppVersionAndBuildNumber false
xcodebuild -exportArchive -archivePath /tmp/NorCalHunt.xcarchive \
  -exportOptionsPlist ExportOptions.plist -exportPath /tmp/norcalhunt-export -allowProvisioningUpdates
```

Before step 3, sanity-check the archive:

```bash
/usr/libexec/PlistBuddy -c "Print :UIBackgroundModes" \
  /tmp/NorCalHunt.xcarchive/Products/Applications/NorCalHunt.app/Info.plist   # → location
```

## In App Store Connect

1. Build appears under **TestFlight** as *Processing* (5–30 min, you get an email).
2. **Export Compliance** is pre-answered (`ITSAppUsesNonExemptEncryption: false`).
3. Fill **Test Information**: what to test (Index refresh, Simulate trek, logging a hunt, shoot-time clock), feedback email, and the review note above.
4. **Internal Testing** → add team members — no review needed.
5. **External Testing** → create a group (e.g. *Blind Group BUTTE-7*), add testers by email or a public link. The first external build goes through Beta App Review (~24 h); expect the background-location question.
6. Testers install TestFlight, accept the invite, and on first launch of GPS Map grant **While Using**, then **Always** when they enable Background tracking.

## Field test before inviting anyone

- [ ] Fresh install → Index loads live Open-Meteo weather for all 10 refuges (green "Live weather" dot).
- [ ] GPS Map → Start walk-in → lock the phone, walk 200 yds, unlock: trail is continuous.
- [ ] Background tracking toggle prompts for **Always** and shows the blue location indicator.
- [ ] Drop Truck / Blind / Downed Bird pins; distance + magnetic bearing update as you walk.
- [ ] Airplane mode: Logbook saves a hunt; Field Desk shoot times still compute.
- [ ] Shoot times match the CDFW / USNO table for the refuge within a minute.

## Known gotchas for this app

- **Harvest numbers** on the Index (`lib/refuges.ts → harvest`) are desk-entered from the weekly CDFW/USFWS reports. Update them every week of the season or the "Recent Hunter Reports" sub-score goes stale.
- **Regulations** live in `lib/regs.ts` and come from the desk's 2026–27 calendar (Issue #2 / #20). Pintail is **3**/day there; change `BAG_LIMITS` if the frameworks move.
- **Refuge ponds on the tactical map are schematic.** The GPS trail and waypoints are real; the units/ponds are a deterministic layout per refuge, labeled as such in the app.
- **Team sync is optional.** With no `EXPO_PUBLIC_SUPABASE_*` the app is fully offline. The starter RLS in `supabase/schema.sql` is open to anyone with the anon key — fine for a private TestFlight group, not for a public release.
- **Icons** are generated from the website logo by `scripts/make-icons.py` (amber on `#0d1410`, 1024×1024, opaque). Re-run it if the logo changes.
- Bump `expo.version` (e.g. 1.0.0 → 1.1.0) for a meaningfully new feature set; `package.json`'s version isn't used for builds.
