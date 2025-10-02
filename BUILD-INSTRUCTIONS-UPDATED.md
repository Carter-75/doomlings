# Doomlings Companion - Build Instructions (Updated)

This document provides updated instructions for building the Doomlings Companion app with Android AAB and APK files.

## Quick Start

### Option 1: PowerShell Script (Recommended for Windows 10/11)

```powershell
# Navigate to the project directory
cd path\to\doomlings

# Run the PowerShell script
.\build-and-deploy.ps1
```

### Option 2: Batch Script (Windows compatibility)

```cmd
# Navigate to the project directory
cd path\to\doomlings

# Run the batch script
.\build-and-deploy.bat
```

## Script Features

Both scripts automatically:
- ✅ **Detect Android SDK** - Finds your Android SDK installation automatically
- ✅ **Create local.properties** - Sets up Android configuration if missing
- ✅ **Generate keystores** - Creates secure signing certificates for production apps
- ✅ **Clean and rebuild** - Complete project cleanup and fresh build
- ✅ **Build AAB and APK** - Generates both Android App Bundle and APK files
- ✅ **Backup management** - Backs up previous builds before creating new ones
- ✅ **Git integration** - Commits and pushes changes automatically
- ✅ **Comprehensive error handling** - Clear error messages and solutions

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/

2. **Android Studio** (Recommended) OR Android SDK
   - Download from: https://developer.android.com/studio
   - Install Android SDK Build-Tools and Platform-Tools
   - Install at least one Android Platform (API level 21+)

3. **Java Development Kit (JDK)** (for keystore generation)
   - Download from: https://adoptium.net/ or https://www.oracle.com/java/
   - Required for `keytool` command used in keystore generation

4. **Git** (for version control)
   - Download from: https://git-scm.com/

### Android SDK Setup

The scripts will automatically detect your Android SDK in these locations:
- `%LOCALAPPDATA%\Android\Sdk` (Android Studio default)
- `%USERPROFILE%\AppData\Local\Android\Sdk`
- `C:\Android\Sdk`
- `C:\Program Files\Android\Sdk`
- `C:\Program Files (x86)\Android\android-sdk`

Or from environment variables:
- `ANDROID_HOME`
- `ANDROID_SDK_ROOT`

## Usage Options

### PowerShell Script Parameters

```powershell
# Basic usage
.\build-and-deploy.ps1

# Skip confirmation prompt
.\build-and-deploy.ps1 -Force

# Skip Git operations
.\build-and-deploy.ps1 -SkipGit

# Specify custom Android SDK path
.\build-and-deploy.ps1 -AndroidSdkPath "C:\CustomPath\Android\Sdk"

# Combine parameters
.\build-and-deploy.ps1 -Force -SkipGit -AndroidSdkPath "C:\MySDK\Android\Sdk"
```

### Batch Script Usage

```cmd
# Just run it - it will prompt for confirmation
.\build-and-deploy.bat
```

## Troubleshooting

### Common Issues and Solutions

#### 1. "Android SDK not found"

**Solution Options:**

**Option A: Install Android Studio (Recommended)**
1. Download from: https://developer.android.com/studio
2. Install Android Studio
3. Open Android Studio and install SDK components
4. Re-run the build script

**Option B: Set Environment Variable**
1. Find your Android SDK installation path
2. Set `ANDROID_HOME` environment variable:
   ```cmd
   setx ANDROID_HOME "C:\Users\YourUser\AppData\Local\Android\Sdk"
   ```
3. Restart command prompt/PowerShell
4. Re-run the build script

**Option C: Use Script Parameter (PowerShell only)**
```powershell
.\build-and-deploy.ps1 -AndroidSdkPath "C:\path\to\your\android\sdk"
```

**Option D: Manual Configuration**
1. Create file: `android\local.properties`
2. Add this line: `sdk.dir=C:/path/to/your/android/sdk`
3. Use forward slashes (/) not backslashes (\)

#### 2. "PowerShell execution policy" error

```powershell
# Set execution policy for current session
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Or run with bypass
PowerShell.exe -ExecutionPolicy Bypass -File .\build-and-deploy.ps1
```

#### 3. "Gradle build failed" errors

**Common causes:**
- Missing Android SDK components
- Incorrect SDK path format
- Network issues during build
- Insufficient disk space

**Solutions:**
1. Verify Android SDK components are installed:
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - At least one Android Platform (API 21+)

2. Check the generated `android\local.properties` file:
   ```
   sdk.dir=C:/Users/YourUser/AppData/Local/Android/Sdk
   ```
   (Note: Use forward slashes, not backslashes)

3. Clear Gradle cache and retry:
   ```cmd
   cd android
   .\gradlew clean
   .\gradlew build --refresh-dependencies
   ```

#### 4. "npm install failed" or Node.js issues

1. Verify Node.js version: `node --version` (should be 18+)
2. Clear npm cache: `npm cache clean --force`
3. Delete node_modules and retry: 
   ```cmd
   rmdir /s node_modules
   npm install
   ```

#### 5. Keystore and signing issues

**First-time keystore setup:**
- The script will automatically prompt you to create a keystore on first run
- You'll be asked for passwords and your name - choose secure passwords
- See `KEYSTORE-SETUP.md` for detailed keystore information

**Common keystore problems:**
- **"keytool: command not found"**: Install Java JDK and add to PATH
- **"password was incorrect"**: Check `android/keystore.properties` file
- **Signing errors**: Ensure keystore files exist in `android/` directory

#### 6. Git authentication issues

The script may fail to push to GitHub if you haven't configured authentication:

1. **Configure Git credentials:**
   ```cmd
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

2. **Set up authentication:**
   - Use GitHub Desktop, or
   - Set up SSH keys, or
   - Use Personal Access Token

3. **Manual push if script fails:**
   ```cmd
   git push origin main
   ```

## Script Output

### Successful Build

Both scripts will create:
- `builds/app-release.aab` - Android App Bundle for Play Store
- `builds/app-release.apk` - Android Package for direct installation
- `builds/build-info.txt` - Build information and timestamps
- `builds/backup/` - Backups of previous builds (if any)

### File Locations

```
doomlings/
├── builds/
│   ├── app-release.aab          # ← Upload this to Google Play Store
│   ├── app-release.apk          # ← Install directly on Android devices
│   ├── build-info.txt           # Build details
│   └── backup/
│       ├── app-release-backup.aab
│       └── app-release-backup.apk
├── android/
│   └── local.properties         # ← Auto-generated SDK configuration
├── build-and-deploy.bat         # Windows batch script
├── build-and-deploy.ps1         # PowerShell script (recommended)
└── ...
```

## Advanced Usage

### Manual Build Steps (if scripts fail)

1. **Clean project:**
   ```cmd
   npm install
   npm run build
   ```

2. **Sync Capacitor:**
   ```cmd
   npx cap sync android
   ```

3. **Build Android files:**
   ```cmd
   cd android
   .\gradlew clean
   .\gradlew bundleRelease
   .\gradlew assembleRelease
   ```

4. **Copy files:**
   ```cmd
   copy android\app\build\outputs\bundle\release\app-release.aab builds\
   copy android\app\build\outputs\apk\release\app-release.apk builds\
   ```

### Custom Android SDK Setup

If you need to use a specific Android SDK version or location:

1. **Download Android Command Line Tools:**
   - Download from: https://developer.android.com/studio#command-tools

2. **Install specific components:**
   ```cmd
   sdkmanager "build-tools;34.0.0"
   sdkmanager "platforms;android-34"
   sdkmanager "platform-tools"
   ```

3. **Use with script:**
   ```powershell
   .\build-and-deploy.ps1 -AndroidSdkPath "C:\your\custom\sdk\path"
   ```

## Support

If you encounter issues not covered here:

1. **Check the console output** for specific error messages
2. **Verify all prerequisites** are properly installed
3. **Try manual build steps** to isolate the issue
4. **Check Android SDK components** in Android Studio SDK Manager

The enhanced scripts provide detailed error messages and suggestions for most common issues.

---

**Last Updated:** October 2025  
**Script Version:** 2.0 (Enhanced with auto-detection and error handling)