# Doomlings Companion Build Overview

This guide consolidates the automated and manual build workflows for the Doomlings Companion project. Use it as the single source of truth whenever you need to produce fresh Android bundles or refresh the web build.

## Automated Workflow (Windows)

Automation scripts live in `scripts/web` and provide the fastest path to a signed build.

### PowerShell (Recommended)

```powershell
cd path\to\doomlings
./scripts/web/build-and-deploy.ps1 [-Force] [-SkipGit] [-AndroidSdkPath "C:\Custom\Android\Sdk"]
```

- Runs with execution-policy bypass for the current session.
- Detects/creates `android/local.properties` and keystore files when missing.
- Cleans caches, runs the Next.js build, syncs Capacitor, and invokes Gradle bundle and APK tasks.
- Rotates backups in `builds/backup/` before writing new artifacts.
- Optionally commits and pushes to Git (omit with `-SkipGit`).

### Batch Wrapper

```cmd
cd path\to\doomlings
scripts\web\build-and-deploy.bat
```

The batch file prompts for confirmation and delegates all heavy lifting to the shared logic so Windows users without PowerShell can still trigger the pipeline.

### Script Output

```
doomlings/
└── builds/
    ├── app-release.aab      # Upload to Google Play
    ├── app-release.apk      # Sideload on devices
    ├── build-info.txt       # Timestamped metadata
    └── backup/
        ├── app-release-backup.aab
        └── app-release-backup.apk
```

Artifacts are ignored by Git after this cleanup—always distribute them out-of-band.

## Manual Workflow (Cross-Platform)

Use the manual flow when running on macOS/Linux or when you need granular control over each step.

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Clean and build the web app**
   ```bash
   npm run clean
   npm run build
   ```
3. **Sync Capacitor**
   ```bash
   npx cap sync android
   ```
4. **Build Android artifacts**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew bundleRelease    # Produces the AAB
   ./gradlew assembleRelease  # Produces the APK
   cd ..
   ```
5. **Copy outputs (if needed)**
   ```bash
   cp android/app/build/outputs/bundle/release/app-release.aab builds/
   cp android/app/build/outputs/apk/release/app-release.apk builds/
   ```

## Prerequisites

- Node.js 18+ and npm 9+.
- Android SDK with Build-Tools and Platform-Tools (API 34+ recommended).
- Java Development Kit for `keytool` (scripts prompt for keystore details).
- Git credentials configured if you rely on scripted commits.

## Ongoing Data Updates

Whenever you change JSON in `public/data/`, rerun either workflow so the Android bundle includes the latest assets. The automation scripts already handle cache busting and packaging.

## Troubleshooting Checklist

- **Android SDK missing**: Install via Android Studio or pass `-AndroidSdkPath` to the PowerShell script.
- **Execution policy errors**: Launch PowerShell with `Set-ExecutionPolicy Bypass -Scope Process -Force`.
- **Gradle build fails**: Verify SDK components, clear `.gradle` caches, and rerun `./gradlew clean`.
- **Git push rejected**: Pull/rebase first or rerun the script with `-SkipGit` and handle version control manually.
- **Keystore issues**: See `docs/android/keystore-setup.md` for regeneration and backup guidance.

---
_Last updated: 2026-01-07_
