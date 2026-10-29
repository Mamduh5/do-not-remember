# Release Guide & Operations

## Overview
This application is configured for offline-first, standalone Android deployment via EAS Build without requiring Expo Go, Metro, or a development machine.

- **App Name**: `do-not-remember`
- **Android Package ID**: `com.mamduh.donotremember` (permanent, never change)
- **V1 Version**: `1.0.0`
- **V1 Android VersionCode**: `1`

---

## 1. EAS Build Configuration

The `preview` profile in `eas.json` is configured for internal distribution and produces a direct `.apk` installable on Android devices.

```bash
# Build installable standalone Android APK
npx eas-cli@latest build --platform android --profile preview
```

### Expo Authentication Boundary
EAS Build runs in the cloud and requires authentication:
1. Log in to your Expo account:
   ```bash
   npx eas-cli@latest login
   ```
2. Run the build command above. If prompted to generate an Android keystore, allow EAS to manage it automatically.

---

## 2. Signing Identity & Keystore Protection

- **Strategy**: EAS-managed Android Keystore.
- **Why it matters**: Android requires all subsequent APK updates to share the exact same cryptographic signature and package ID (`com.mamduh.donotremember`). If the keystore changes, Android will refuse to update the app with error `INSTALL_FAILED_UPDATE_INCOMPATIBLE`.
- **Rule**: Never regenerate, replace, or clear the Android Keystore in EAS for this project.

---

## 3. Data Safety & Upgrade Behavior

- **SQLite Location**: Database `poop.db` is stored in the application's internal private storage directory (`/data/data/com.mamduh.donotremember/databases/poop.db`).
- **In-place Upgrades**: Installing a new APK over the existing app preserves internal application storage and all SQLite history.
- **Critical Warning**: **DO NOT uninstall the application** before installing a newer APK. Uninstalling deletes Android app storage and destroys all local history. Always install the new APK directly over the old version.
- **Schema Migrations**: Handled in `db/migrations.ts` via `PRAGMA user_version` and atomic transactions. New migrations must only append to `MIGRATIONS` array and preserve existing tables/columns.

---

## 4. Real-Device Release Verification Checklist

Perform these steps on the phone after installing the V1 APK:

1. [ ] Download and install the APK on Android.
2. [ ] Open the app without PC, Metro, or WiFi/USB debugging.
3. [ ] Confirm fresh installation displays "NO EVIDENCE YET" (no mock/fake data).
4. [ ] Tap **I POOPED** to log a record.
5. [ ] Force-close the application (swipe away from recent apps).
6. [ ] Reopen the application.
7. [ ] Verify the record and elapsed timer are still present.
8. [ ] Tap **CHANGE TIME** (or tap **EDIT** in History) and modify the timestamp.
9. [ ] Force-close and restart the app again.
10. [ ] Verify the edited timestamp persisted.
11. [ ] Add a second record.
12. [ ] Navigate to **HISTORY** and verify chronological order (newest first).
13. [ ] Delete one record.
14. [ ] Force-close and restart the app.
15. [ ] Verify deletion persisted.
16. [ ] Enable Airplane Mode (turn off WiFi and Mobile Data).
17. [ ] Confirm all features (Today, History, Edit, Delete, Log) work completely offline.

---

## 5. Future Update Workflow (V2, V3, ...)

When updating the app later:

1. Make changes in the codebase (no feature additions for V1).
2. Run quality gates:
   ```bash
   npm test
   npx tsc --noEmit
   npm run lint
   npx expo-doctor
   ```
3. Increment `versionCode` (and optionally `version`) in `app.json`:
   - `versionCode: 1` -> `2`
   - `version: "1.0.0"` -> `"1.0.1"`
4. Run the preview build:
   ```bash
   npx eas-cli@latest build --platform android --profile preview
   ```
5. Download the resulting APK link and install it directly over the existing installation on the phone.

### Inviolable Configuration Values
Never accidentally change:
- **`android.package`**: Must remain `com.mamduh.donotremember`
- **Signing Keystore**: Managed EAS Android keystore
- **Database Name / Schema Path**: `poop.db` and non-destructive `PRAGMA user_version` migrations
