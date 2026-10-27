# NorCalHunt — TestFlight Setup & Upload (`JSNAXH9XX2`)

Everything is built, prebuilt (`ios/`), and archived at `/tmp/NorCalHunt.xcarchive` on your Mac (`~/norcalhunt/mobile` -> `~/norcalhunt/repo/mobile`), signed with the Siki Holding Corp Apple Developer Team (`JSNAXH9XX2`).

- **App Name:** `NorCalHunt`
- **Bundle ID:** `com.norcalhunts.app`
- **Apple Team ID:** `JSNAXH9XX2` (Siki Holding Corp)
- **Version / Build:** `1.0.0` (`buildNumber: "1"`)
- **Encryption Flag:** `ITSAppUsesNonExemptEncryption = false` (already set in `app.json`, skips the export-compliance prompt on TestFlight)
- **Background Location:** `UIBackgroundModes = ["location"]` + iOS location & compass strings pre-configured

---

## One-Time Step (App Store Connect Web UI)

Apple does not allow `xcodebuild` or the API to create the initial App Store Connect record. Do this once:

1. If `com.norcalhunts.app` isn't registered as an explicit App ID yet, open [Apple Developer Identifiers](https://developer.apple.com/account/resources/identifiers/list) (or let Xcode register it when distributing) with Bundle ID `com.norcalhunts.app`.
2. Open [App Store Connect → Apps](https://appstoreconnect.apple.com/apps) under **Siki Holding Corp**:
   - Click **+ → New App**
   - **Platforms:** iOS
   - **Name:** `NorCalHunt` (or `NorCalHunt — Waterfowl & Refuges` if taken)
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** `com.norcalhunts.app`
   - **SKU:** `norcalhunt-001`
   - **User Access:** Full Access
3. Make sure your Apple ID session is active in **Xcode → Settings → Accounts** on your Mac.

---

## Uploading the Archive to TestFlight

The release archive `/tmp/NorCalHunt.xcarchive` is already built on your Mac. Once the App Store Connect record exists, upload it in either of two ways:

### Option A — One-liner from Terminal (Mac)
```bash
cd ~/norcalhunt/mobile
xcodebuild -exportArchive \
  -archivePath /tmp/NorCalHunt.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath /tmp/norcalhunt-export \
  -allowProvisioningUpdates
```

### Option B — Xcode Organizer GUI (also auto-registers the Bundle ID if needed)
```bash
open /tmp/NorCalHunt.xcarchive
```
Then click **Distribute App → TestFlight & App Store → Upload**.

---

## Rebuilding & Uploading Future Builds

Bump `expo.ios.buildNumber` in `mobile/app.json`, then run:

```bash
cd ~/norcalhunt/mobile
CI=1 npx expo prebuild --platform ios --clean
(cd ios && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install)
export EXPO_NO_DOTENV=1
(cd ios && xcodebuild -workspace NorCalHunt.xcworkspace -scheme NorCalHunt -configuration Release \
  -destination "generic/platform=iOS" -archivePath /tmp/NorCalHunt.xcarchive \
  -allowProvisioningUpdates DEVELOPMENT_TEAM=JSNAXH9XX2 CODE_SIGN_STYLE=Automatic archive)
xcodebuild -exportArchive -archivePath /tmp/NorCalHunt.xcarchive \
  -exportOptionsPlist ExportOptions.plist -exportPath /tmp/norcalhunt-export -allowProvisioningUpdates
```
