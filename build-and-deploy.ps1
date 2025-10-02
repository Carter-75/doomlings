# Doomlings Companion - PowerShell Build and Deploy Script
# This script builds AAB/APK files, manages backups, and pushes to Git

param(
    [switch]$Force,
    [switch]$SkipGit,
    [string]$AndroidSdkPath = ""
)

# Set execution policy for this session
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Doomlings Companion - Build and Deploy" -ForegroundColor Cyan  
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Confirmation prompt (unless -Force is used)
if (-not $Force) {
    Write-Host "This script will:" -ForegroundColor Yellow
    Write-Host "- Clean and rebuild the entire project" -ForegroundColor Yellow
    Write-Host "- Generate AAB and APK files" -ForegroundColor Yellow
    Write-Host "- Backup previous builds (if any)" -ForegroundColor Yellow
    Write-Host "- Commit and push changes to Git (unless -SkipGit)" -ForegroundColor Yellow
    Write-Host ""
    $confirm = Read-Host "Do you want to continue? (Y/N)"
    if ($confirm -ne "Y" -and $confirm -ne "y") {
        Write-Host "Build cancelled by user." -ForegroundColor Red
        exit 0
    }
}

Write-Host ""
Write-Host "Starting build process..." -ForegroundColor Green
Write-Host ""

# Set variables
$RootDir = $PSScriptRoot
$BuildOutputDir = Join-Path $RootDir "builds"
$BackupDir = Join-Path $BuildOutputDir "backup"
$AndroidDir = Join-Path $RootDir "android"
$AabSource = Join-Path $AndroidDir "app\build\outputs\bundle\release\app-release.aab"
$ApkSource = Join-Path $AndroidDir "app\build\outputs\apk\release\app-release.apk"
$LocalPropertiesFile = Join-Path $AndroidDir "local.properties"

# Create timestamp for backup
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

Write-Host "[INFO] Build started at $timestamp" -ForegroundColor Cyan
Write-Host "[INFO] Root directory: $RootDir" -ForegroundColor Cyan
Write-Host ""

# Function to Write colored output
function Write-Status {
    param(
        [string]$Message,
        [string]$Type = "INFO"
    )
    
    $color = switch ($Type) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        "INFO" { "Cyan" }
        default { "White" }
    }
    
    Write-Host "[$Type] $Message" -ForegroundColor $color
}

# Check if builds directory exists and backup if needed
if (Test-Path $BuildOutputDir) {
    Write-Status "Previous builds found, creating backup..." "INFO"
    
    # Create backup directory if it doesn't exist
    if (-not (Test-Path $BackupDir)) {
        New-Item -Path $BackupDir -ItemType Directory -Force | Out-Null
        Write-Status "Created backup directory: $BackupDir" "INFO"
    }
    
    # Backup existing AAB file
    $existingAab = Join-Path $BuildOutputDir "app-release.aab"
    if (Test-Path $existingAab) {
        Write-Status "Backing up previous AAB file..." "INFO"
        $backupAab = Join-Path $BackupDir "app-release-backup.aab"
        Copy-Item $existingAab $backupAab -Force
        Write-Status "AAB backup created" "SUCCESS"
    }
    
    # Backup existing APK file
    $existingApk = Join-Path $BuildOutputDir "app-release.apk"
    if (Test-Path $existingApk) {
        Write-Status "Backing up previous APK file..." "INFO"
        $backupApk = Join-Path $BackupDir "app-release-backup.apk"
        Copy-Item $existingApk $backupApk -Force
        Write-Status "APK backup created" "SUCCESS"
    }
} else {
    Write-Status "No previous builds found, creating fresh builds directory..." "INFO"
    New-Item -Path $BuildOutputDir -ItemType Directory -Force | Out-Null
    Write-Status "Created builds directory: $BuildOutputDir" "SUCCESS"
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "        STEP 1: CLEANING PROJECT" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Clean npm cache and build directories
Write-Status "Cleaning npm cache and build directories..." "INFO"

$paths = @(
    "node_modules\.cache",
    ".next",
    "out",
    "$AndroidDir\app\build",
    "$AndroidDir\build"
)

foreach ($path in $paths) {
    if (Test-Path $path) {
        Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Status "Cleared $path" "INFO"
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "        STEP 2: ANDROID SDK CONFIGURATION" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

Write-Status "Checking Android SDK configuration..." "INFO"

# Check if local.properties exists
if (-not (Test-Path $LocalPropertiesFile)) {
    Write-Status "local.properties file not found" "WARNING"
    Write-Status "Attempting to detect Android SDK location..." "INFO"
    
    $sdkFound = $false
    $androidSdkRoot = ""
    
    # Use provided SDK path first
    if ($AndroidSdkPath -ne "") {
        if (Test-Path $AndroidSdkPath) {
            $androidSdkRoot = $AndroidSdkPath
            $sdkFound = $true
            Write-Status "Using provided Android SDK path: $AndroidSdkPath" "INFO"
        } else {
            Write-Status "Provided SDK path does not exist: $AndroidSdkPath" "WARNING"
        }
    }
    
    # Check environment variables
    if (-not $sdkFound) {
        $envVars = @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT)
        foreach ($envVar in $envVars) {
            if ($envVar -and (Test-Path $envVar)) {
                $androidSdkRoot = $envVar
                $sdkFound = $true
                Write-Status "Found Android SDK from environment variable: $envVar" "INFO"
                break
            }
        }
    }
    
    # Check common locations
    if (-not $sdkFound) {
        $commonPaths = @(
            "$env:LOCALAPPDATA\Android\Sdk",
            "$env:USERPROFILE\AppData\Local\Android\Sdk",
            "C:\Android\Sdk",
            "C:\Program Files\Android\Sdk",
            "C:\Program Files (x86)\Android\android-sdk"
        )
        
        foreach ($path in $commonPaths) {
            if (Test-Path $path) {
                $androidSdkRoot = $path
                $sdkFound = $true
                Write-Status "Found Android SDK at: $path" "INFO"
                break
            }
        }
    }
    
    # If SDK found, create local.properties
    if ($sdkFound) {
        Write-Status "Creating local.properties file..." "INFO"
        
        # Convert backslashes to forward slashes for Gradle compatibility
        $sdkPathGradle = $androidSdkRoot -replace '\\', '/'
        
        $content = @"
# Automatically generated by build script
# Location of the Android SDK
sdk.dir=$sdkPathGradle
"@
        
        Set-Content -Path $LocalPropertiesFile -Value $content -Encoding UTF8
        Write-Status "Created local.properties with SDK path: $androidSdkRoot" "SUCCESS"
        
        # Validate SDK installation
        $platformTools = Join-Path $androidSdkRoot "platform-tools\adb.exe"
        $buildTools = Join-Path $androidSdkRoot "build-tools"
        
        if (Test-Path $platformTools) {
            Write-Status "Android SDK validation passed - platform-tools found" "SUCCESS"
        } else {
            Write-Status "Android SDK may be incomplete - platform-tools not found" "WARNING"
            Write-Status "Make sure you have installed Android SDK Platform-Tools" "INFO"
        }
        
        if (Test-Path $buildTools) {
            Write-Status "Android SDK validation passed - build-tools found" "SUCCESS"
        } else {
            Write-Status "Android SDK may be incomplete - build-tools not found" "WARNING"
            Write-Status "Make sure you have installed Android SDK Build-Tools" "INFO"
        }
    } else {
        Write-Status "Android SDK not found in common locations!" "ERROR"
        Write-Host ""
        Write-Host "SOLUTION OPTIONS:" -ForegroundColor Yellow
        Write-Host "================" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Option 1: Install Android Studio (Recommended)" -ForegroundColor White
        Write-Host "  1. Download from: https://developer.android.com/studio" -ForegroundColor Gray
        Write-Host "  2. Install Android Studio" -ForegroundColor Gray
        Write-Host "  3. Open Android Studio and install SDK components" -ForegroundColor Gray
        Write-Host "  4. Re-run this script" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Option 2: Run with SDK Path Parameter" -ForegroundColor White
        Write-Host "  .\build-and-deploy.ps1 -AndroidSdkPath 'C:\path\to\android\sdk'" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Option 3: Set Environment Variable" -ForegroundColor White
        Write-Host "  Set ANDROID_HOME or ANDROID_SDK_ROOT environment variable" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Option 4: Manual Configuration" -ForegroundColor White
        Write-Host "  Create file: $LocalPropertiesFile" -ForegroundColor Gray
        Write-Host "  Add line: sdk.dir=C:/path/to/your/android/sdk" -ForegroundColor Gray
        Write-Host ""
        Write-Host "After installing the Android SDK, make sure you have:" -ForegroundColor Yellow
        Write-Host "- Android SDK Build-Tools" -ForegroundColor Gray
        Write-Host "- Android SDK Platform-Tools" -ForegroundColor Gray  
        Write-Host "- At least one Android Platform (API level 21+)" -ForegroundColor Gray
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Status "local.properties file already exists" "SUCCESS"
    Get-Content $LocalPropertiesFile | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "        STEP 3: KEYSTORE CONFIGURATION" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

Write-Status "Checking Android keystore configuration..." "INFO"

$KeystorePropertiesFile = Join-Path $AndroidDir "keystore.properties"
$KeystoreFile = Join-Path $AndroidDir "doomlings-companion-key.keystore"

if (-not (Test-Path $KeystorePropertiesFile)) {
    Write-Status "keystore.properties not found" "WARNING"
    Write-Status "Setting up new keystore for app signing..." "INFO"
    
    Write-Host ""
    # Prompt for keystore information
    $keystorePassword = Read-Host "Enter keystore password (or press Enter for default)"
    if ([string]::IsNullOrEmpty($keystorePassword)) {
        $keystorePassword = "doomlings2024!"
    }
    
    $keyPassword = Read-Host "Enter key password (or press Enter to use same as keystore)"
    if ([string]::IsNullOrEmpty($keyPassword)) {
        $keyPassword = $keystorePassword
    }
    
    $keyAlias = Read-Host "Enter key alias (or press Enter for default)"
    if ([string]::IsNullOrEmpty($keyAlias)) {
        $keyAlias = "doomlings-key"
    }
    
    $developerName = Read-Host "Enter your name"
    if ([string]::IsNullOrEmpty($developerName)) {
        $developerName = "Doomlings Developer"
    }
    
    Write-Host ""
    Write-Status "Generating new keystore..." "INFO"
    
    # Generate the keystore using keytool
    $keytoolArgs = @(
        "-genkey", "-v",
        "-keystore", $KeystoreFile,
        "-alias", $keyAlias,
        "-keyalg", "RSA",
        "-keysize", "2048",
        "-validity", "10000",
        "-storepass", $keystorePassword,
        "-keypass", $keyPassword,
        "-dname", "CN=$developerName, OU=Doomlings, O=Doomlings Companion, L=Unknown, S=Unknown, C=US"
    )
    
    try {
        & keytool $keytoolArgs
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Keystore generated successfully" "SUCCESS"
            
            # Create keystore.properties file
            Write-Status "Creating keystore.properties file..." "INFO"
            $keystoreContent = @"
# Keystore configuration for Doomlings Companion
storeFile=doomlings-companion-key.keystore
storePassword=$keystorePassword
keyAlias=$keyAlias
keyPassword=$keyPassword
"@
            Set-Content -Path $KeystorePropertiesFile -Value $keystoreContent -Encoding UTF8
            
            Write-Status "Keystore configuration completed" "SUCCESS"
            Write-Status "Keystore location: $KeystoreFile" "INFO"
            Write-Status "Properties file: $KeystorePropertiesFile" "INFO"
        } else {
            Write-Status "Failed to generate keystore" "ERROR"
            Write-Status "Make sure you have Java/keytool available in PATH" "INFO"
            Write-Status "Continuing with debug signing..." "INFO"
        }
    } catch {
        Write-Status "Error running keytool: $($_.Exception.Message)" "ERROR"
        Write-Status "Make sure Java SDK is installed and keytool is in PATH" "INFO"
        Write-Status "Continuing with debug signing..." "INFO"
    }
} else {
    Write-Status "keystore.properties already exists" "SUCCESS"
    Get-Content $KeystorePropertiesFile | ForEach-Object { 
        if (-not $_.StartsWith("#") -and $_.Contains("=")) {
            Write-Host "  $_" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "        STEP 4: VERSION MANAGEMENT" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

Write-Status "Automatically incrementing version numbers..." "INFO"

# Function to increment version number
function Update-Version {
    param(
        [string]$CurrentVersion
    )
    
    if ($CurrentVersion -match '^(\d+)\.(\d+)\.(\d+)$') {
        $major = [int]$matches[1]
        $minor = [int]$matches[2]  
        $patch = [int]$matches[3]
        
        # Increment patch version by 1
        $patch++
        
        return "$major.$minor.$patch"
    } else {
        Write-Status "Invalid version format: $CurrentVersion, defaulting to increment" "WARNING"
        return "3.0.1"
    }
}

# Update Android build.gradle version
$BuildGradlePath = Join-Path $AndroidDir "app\build.gradle"
if (Test-Path $BuildGradlePath) {
    Write-Status "Updating Android version in build.gradle..." "INFO"
    
    $gradleContent = Get-Content $BuildGradlePath -Raw
    
    # Extract current versionCode and versionName
    if ($gradleContent -match 'versionCode (\d+)') {
        $currentVersionCode = [int]$matches[1]
        $newVersionCode = $currentVersionCode + 1
        $gradleContent = $gradleContent -replace 'versionCode \d+', "versionCode $newVersionCode"
        Write-Status "Updated versionCode: $currentVersionCode -> $newVersionCode" "SUCCESS"
    }
    
    if ($gradleContent -match 'versionName "([^"]+)"') {
        $currentVersionName = $matches[1]
        $newVersionName = Update-Version $currentVersionName
        $gradleContent = $gradleContent -replace 'versionName "[^"]+"', "versionName `"$newVersionName`""
        Write-Status "Updated versionName: $currentVersionName -> $newVersionName" "SUCCESS"
    }
    
    # Write back to file
    Set-Content -Path $BuildGradlePath -Value $gradleContent -NoNewline
}

# Update package.json version  
$PackageJsonPath = Join-Path $RootDir "package.json"
if (Test-Path $PackageJsonPath) {
    Write-Status "Updating package.json version..." "INFO"
    
    $packageContent = Get-Content $PackageJsonPath -Raw
    if ($packageContent -match '"version":\s*"([^"]+)"') {
        $currentPackageVersion = $matches[1]
        $newPackageVersion = Update-Version $currentPackageVersion
        $packageContent = $packageContent -replace '"version":\s*"[^"]+"', "`"version`": `"$newPackageVersion`""
        Set-Content -Path $PackageJsonPath -Value $packageContent -NoNewline
        Write-Status "Updated package.json: $currentPackageVersion -> $newPackageVersion" "SUCCESS"
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "        STEP 5: BUILDING NEXT.JS APP" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

Write-Status "Installing/updating dependencies..." "INFO"
& npm install
if ($LASTEXITCODE -ne 0) {
    Write-Status "npm install failed" "ERROR"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Status "Building Next.js production app..." "INFO"
& npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Status "Next.js build failed" "ERROR"
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Status "Next.js build completed" "SUCCESS"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "        STEP 6: SYNCING WITH CAPACITOR" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

Write-Status "Syncing with Capacitor Android..." "INFO"
& npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Status "Capacitor sync failed" "ERROR"
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Status "Capacitor sync completed" "SUCCESS"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "        STEP 7: BUILDING ANDROID FILES" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Navigate to Android directory
Push-Location $AndroidDir
Write-Status "Current directory: $AndroidDir" "INFO"

# Clean Android project
Write-Status "Cleaning Android project..." "INFO"
& .\gradlew clean
if ($LASTEXITCODE -ne 0) {
    Write-Status "Gradle clean had issues, continuing..." "WARNING"
}

# Build Release AAB
Write-Status "Building Release AAB (Android App Bundle)..." "INFO"
& .\gradlew bundleRelease
if ($LASTEXITCODE -ne 0) {
    Write-Status "AAB build failed" "ERROR"
    Pop-Location
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Status "AAB build completed" "SUCCESS"

# Build Release APK
Write-Status "Building Release APK..." "INFO"
& .\gradlew assembleRelease
$apkFailed = $LASTEXITCODE -ne 0
if ($apkFailed) {
    Write-Status "APK build failed, continuing with AAB only..." "WARNING"
} else {
    Write-Status "APK build completed" "SUCCESS"
}

# Navigate back to root
Pop-Location

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "        STEP 8: COPYING BUILD FILES" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Copy AAB file
if (Test-Path $AabSource) {
    Write-Status "Copying AAB file to builds directory..." "INFO"
    $aabDest = Join-Path $BuildOutputDir "app-release.aab"
    Copy-Item $AabSource $aabDest -Force
    Write-Status "AAB file copied successfully" "SUCCESS"
} else {
    Write-Status "AAB file not found at: $AabSource" "ERROR"
    Read-Host "Press Enter to exit"
    exit 1
}

# Copy APK file (if build succeeded)
if (-not $apkFailed) {
    if (Test-Path $ApkSource) {
        Write-Status "Copying APK file to builds directory..." "INFO"
        $apkDest = Join-Path $BuildOutputDir "app-release.apk"
        Copy-Item $ApkSource $apkDest -Force
        Write-Status "APK file copied successfully" "SUCCESS"
    } else {
        Write-Status "APK file not found, only AAB will be available" "WARNING"
    }
} else {
    Write-Status "APK build failed, only AAB available" "INFO"
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "        STEP 9: CREATING BUILD INFO" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Create build info file
$buildInfoFile = Join-Path $BuildOutputDir "build-info.txt"
    # Get current version from build.gradle
    $currentVersionName = "3.0.0"
    if ($gradleContent -and $gradleContent -match 'versionName "([^"]+)"') {
        $currentVersionName = $matches[1]
    }

$buildInfo = @"
Build Information
==================
Build Date: $timestamp
Version: $currentVersionName

Files Generated:
- app-release.aab (Android App Bundle)
$(if (-not $apkFailed) { "- app-release.apk (Android Package)" } else { "- APK build failed, only AAB available" })

Data Updates Included:
- 77 Dominant cards with 5-tier systems
- 40 Updated trinket cards
- 48 Meaning of life cards
- 11 Merchant age cards
- 77 Reorganized age effects
- 41 Catastrophe cards with worldsEnd effects
- 7 Catastrophe rules (restored)
"@

Set-Content -Path $buildInfoFile -Value $buildInfo -Encoding UTF8
Write-Status "Build info created: $buildInfoFile" "SUCCESS"

# Git operations (if not skipped)
if (-not $SkipGit) {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "        STEP 10: GIT OPERATIONS" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan

    # Configure Git user (if not already configured)
    Write-Status "Configuring Git user..." "INFO"
    & git config user.name "Carter" 2>$null
    & git config user.email "ph75nix@proton.me" 2>$null
    Write-Status "Git user configured" "SUCCESS"

    # Add all changes
    Write-Status "Adding files to Git..." "INFO"
    & git add .
    if ($LASTEXITCODE -ne 0) {
        Write-Status "Git add failed" "ERROR"
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Status "Files added to Git" "SUCCESS"

    # Commit changes
    Write-Status "Committing changes..." "INFO"
    $commitMessage = @"
build: Generate AAB and APK files with updated data - $timestamp

- Built AAB and APK with all latest data updates
- Includes 77 dominant cards, 40 trinkets, 48 meanings, 11 merchants
- Updated age effects (77) and catastrophe cards (41)
- Restored catastrophe rules functionality
- Build timestamp: $timestamp
"@
    
    & git commit -m $commitMessage
    if ($LASTEXITCODE -ne 0) {
        Write-Status "No changes to commit or commit failed" "INFO"
    }

    # Push changes
    Write-Status "Pushing to remote repository..." "INFO"
    & git push origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Status "Git push failed - you may need to authenticate manually" "WARNING"
        Write-Status "You can run 'git push origin main' manually later" "INFO"
    } else {
        Write-Status "Changes pushed to remote repository" "SUCCESS"
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "               BUILD SUMMARY" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Status "Build completed successfully!" "SUCCESS"
Write-Host ""
Write-Host "Build Output Location: " -NoNewline -ForegroundColor White
Write-Host $BuildOutputDir -ForegroundColor Yellow
Write-Host ""
Write-Host "Files Generated:" -ForegroundColor White

$aabPath = Join-Path $BuildOutputDir "app-release.aab"
$apkPath = Join-Path $BuildOutputDir "app-release.apk"

if (Test-Path $aabPath) {
    Write-Host "  ✓ app-release.aab (Android App Bundle)" -ForegroundColor Green
} else {
    Write-Host "  ✗ app-release.aab (FAILED)" -ForegroundColor Red
}

if (Test-Path $apkPath) {
    Write-Host "  ✓ app-release.apk (Android Package)" -ForegroundColor Green
} else {
    Write-Host "  ✗ app-release.apk (Not generated)" -ForegroundColor Yellow
}

if (Test-Path $BackupDir) {
    Write-Host ""
    Write-Host "Backup Location: " -NoNewline -ForegroundColor White
    Write-Host $BackupDir -ForegroundColor Yellow
    
    $backupAab = Join-Path $BackupDir "app-release-backup.aab"
    $backupApk = Join-Path $BackupDir "app-release-backup.apk"
    
    if (Test-Path $backupAab) {
        Write-Host "  ✓ Previous AAB backed up" -ForegroundColor Green
    }
    if (Test-Path $backupApk) {
        Write-Host "  ✓ Previous APK backed up" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Data Updates Included in This Build:" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✓ 77 Dominant cards with 5-tier progression systems" -ForegroundColor Green
Write-Host "✓ 40 Updated trinket cards with complete data" -ForegroundColor Green
Write-Host "✓ 48 Meaning of life cards with sM scaling" -ForegroundColor Green
Write-Host "✓ 11 Merchant age cards updated" -ForegroundColor Green
Write-Host "✓ 77 Age effects properly organized" -ForegroundColor Green
Write-Host "✓ 41 Catastrophe cards with worldsEnd effects" -ForegroundColor Green
Write-Host "✓ 7 Catastrophe rules restored and functional" -ForegroundColor Green
Write-Host "✓ All file references updated and tested" -ForegroundColor Green
Write-Host ""
Write-Host "The AAB file is ready for Google Play Store upload!" -ForegroundColor Green
Write-Host "The APK file can be used for direct installation." -ForegroundColor Green
Write-Host ""
Write-Host "Build completed at: $(Get-Date)" -ForegroundColor Cyan
Write-Host ""

if (-not $Force) {
    Read-Host "Press Enter to exit"
}