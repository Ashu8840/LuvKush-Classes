# Mobile App Build Guide — Android (EAS)

Step-by-step guide to log in to Expo Application Services (EAS), build the **Luv Kush Classes** React Native (Expo) app for Android, and install the APK on your phone.

**Repository:** [https://github.com/Ashu8840/LuvKush-Classes](https://github.com/Ashu8840/LuvKush-Classes)

**Expo project:** [https://expo.dev/accounts/ayush_8840/projects/luvkush-classes](https://expo.dev/accounts/ayush_8840/projects/luvkush-classes)

**Latest Android build:** [Build #10268744](https://expo.dev/accounts/ayush_8840/projects/luvkush-classes/builds/10268744-30c9-4a27-a07a-0c633639c3f6) — download the APK from this page when status is **Finished**.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [EAS Login](#2-eas-login)
3. [Configure API URL](#3-configure-api-url)
4. [Android Signing Credentials](#4-android-signing-credentials)
5. [Build the APK](#5-build-the-apk)
6. [Install on Your Android Device](#6-install-on-your-android-device)
7. [Rebuild After Code Changes](#7-rebuild-after-code-changes)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

Before building, make sure you have:

| Requirement | Notes |
|-------------|-------|
| **Node.js 18+** | Same as the rest of the monorepo |
| **Expo account** | Free at [expo.dev](https://expo.dev) |
| **EAS CLI** | Installed via `npx eas-cli` (no global install required) |
| **Backend deployed** | Production API on Render, e.g. `https://luvkush-classes.onrender.com/api` |
| **Java JDK** | Only needed if you generate a local Android keystore yourself |

All commands below are run from the `mobile/` folder:

```powershell
cd mobile
npm install
```

---

## 2. EAS Login

Log in to your Expo account once on your machine:

```powershell
npx eas login
```

Enter your Expo username/email and password when prompted.

Verify you are logged in:

```powershell
npx eas whoami
```

Expected output: your Expo username (e.g. `ayush_8840`).

### Link the project (first time only)

If the app is not yet linked to an EAS project, run:

```powershell
npx eas init --force
```

This creates the project on Expo and writes a valid `projectId` UUID into `app.json`.

---

## 3. Configure API URL

The mobile app reads the backend URL from environment variables at **build time**.

### Local development (`mobile/.env`)

```env
EXPO_PUBLIC_API_URL=https://luvkush-classes.onrender.com/api
EXPO_PUBLIC_API_PORT=5000
```

Copy from `mobile/.env.example` if `mobile/.env` does not exist.

### EAS builds (`mobile/eas.json`)

Production API URLs are already set in the `preview` and `production` build profiles:

```json
"env": {
  "EXPO_PUBLIC_API_URL": "https://luvkush-classes.onrender.com/api",
  "EXPO_PUBLIC_API_PORT": "5000"
}
```

Change these values if your Render API URL changes, then rebuild.

> **Note:** `mobile/.env` is gitignored. EAS builds use the `env` block in `eas.json`, not your local `.env` file.

---

## 4. Android Signing Credentials

Android APKs must be signed with a keystore. This project uses **local credentials** so builds can run without interactive prompts.

### Files (local only — never commit)

| File | Purpose |
|------|---------|
| `mobile/credentials.json` | Points EAS to your keystore paths and passwords |
| `mobile/android/keystores/release.keystore` | Android signing keystore |

Both are listed in `mobile/.gitignore`.

### Generate a keystore (first time only)

```powershell
mkdir android\keystores

keytool -genkey -v -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 `
  -storepass YOUR_KEYSTORE_PASSWORD `
  -keypass YOUR_KEY_PASSWORD `
  -alias luvkush-release `
  -keystore android\keystores\release.keystore `
  -dname "CN=com.luvkush.classes,OU=LuvKush,O=LuvKush Classes,L=Mumbai,S=Maharashtra,C=IN"
```

Create `credentials.json` at `mobile/credentials.json`:

```json
{
  "android": {
    "keystore": {
      "keystorePath": "android/keystores/release.keystore",
      "keystorePassword": "YOUR_KEYSTORE_PASSWORD",
      "keyAlias": "luvkush-release",
      "keyPassword": "YOUR_KEY_PASSWORD"
    }
  }
}
```

> **Important:** Store your keystore and passwords safely. You need the **same keystore** for every future update you publish to the same app package (`com.luvkush.classes`). Losing it means you cannot update the installed app — you would have to uninstall and reinstall.

---

## 5. Build the APK

### Preview build (recommended for direct phone install)

Produces a signed **APK** you can download and sideload:

```powershell
npx eas build --platform android --profile preview --non-interactive
```

### Production build

Same APK format, suitable for wider distribution:

```powershell
npx eas build --platform android --profile production --non-interactive
```

### Monitor the build

- CLI prints a build URL when the upload finishes.
- Open the [Expo builds dashboard](https://expo.dev/accounts/ayush_8840/projects/luvkush-classes/builds) to watch progress.
- A typical Android build takes **10–20 minutes**.

### Download the APK

When the build status is **Finished**:

1. Open the build page on expo.dev.
2. Click **Download** under **Build artifact**.
3. Save the `.apk` file to your computer or phone.

You can also list recent builds from the terminal:

```powershell
npx eas build:list --platform android --limit 5
```

---

## 6. Install on Your Android Device

### Option A — Download on the phone

1. Open the Expo build page in Chrome on your Android phone.
2. Download the APK.
3. When prompted, allow installation from your browser or file manager.

### Option B — Transfer from computer

1. Copy the APK to your phone (USB, Google Drive, WhatsApp, etc.).
2. Open the file with a file manager.
3. Tap **Install**.

### Enable unknown sources (if needed)

On Android 8+, allow your file manager or browser to install unknown apps:

**Settings → Apps → [your file manager or Chrome] → Install unknown apps → Allow**

### First launch

1. Open **Luv Kush Classes**.
2. Log in with your institute credentials.
3. The app connects to the production API configured in `eas.json`.

> **Cold start:** If the backend is on Render's free tier, the first API request after idle time may take 30–60 seconds.

---

## 7. Rebuild After Code Changes

Whenever you change mobile code or the API URL:

1. Pull latest code: `git pull`
2. Update `eas.json` env vars if the API URL changed.
3. Run a new build:

   ```powershell
   npx eas build --platform android --profile preview --non-interactive
   ```

4. Download and install the new APK (overwrites the previous install if the version code is higher).

Bump `version` in `app.json` before major releases so users can tell builds apart.

---

## 8. Troubleshooting

| Problem | Solution |
|---------|----------|
| **`eas: command not found`** | Use `npx eas` instead of `eas`. |
| **Not logged in** | Run `npx eas login`, then `npx eas whoami`. |
| **Invalid UUID appId** | Remove `extra.eas.projectId` from `app.json`, then run `npx eas init --force`. |
| **Keystore prompt in CI / non-interactive** | Use `credentialsSource: "local"` in `eas.json` and provide `credentials.json` + keystore. |
| **App cannot reach API** | Confirm `EXPO_PUBLIC_API_URL` in `eas.json` ends with `/api` and rebuild. |
| **Login works in Expo Go but not APK** | Expo Go may use a different API URL from `mobile/.env`; the APK uses `eas.json` env vars. |
| **Install blocked** | Enable "Install unknown apps" for your browser or file manager. |
| **Build failed on EAS** | Open the build log URL from the CLI output and check the error at the bottom. |

---

## Quick Reference

```
1. cd mobile
2. npx eas login
3. npx eas whoami
4. Ensure credentials.json + keystore exist (Section 4)
5. npx eas build --platform android --profile preview --non-interactive
6. Download APK from expo.dev → Install on phone
```

---

## Related Docs

- [DEPLOYMENT.md](./DEPLOYMENT.md) — Deploy backend (Render) and frontend (Vercel)
- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) — Full project overview
- [ENV_COPY_PASTE.md](./ENV_COPY_PASTE.md) — Environment variable reference

---

*Last updated: June 2026*