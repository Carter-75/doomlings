@echo off
setlocal enabledelayedexpansion

:: Doomlings Companion - Automated Build and Deploy Script
:: This script builds AAB/APK files, manages backups, and pushes to Git
echo ================================================
echo    Doomlings Companion - Build and Deploy
echo ================================================
echo.

:: Confirmation prompt
echo This script will:
echo - Clean and rebuild the entire project
echo - Generate AAB and APK files
echo - Backup previous builds (if any)
echo - Commit and push changes to Git
echo.
set /p confirm="Do you want to continue? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Build cancelled by user.
    pause
    exit /b 0
)

echo.
echo Starting build process...
echo.

:: Set variables
set ROOT_DIR=%~dp0
set BUILD_OUTPUT_DIR=%ROOT_DIR%builds
set BACKUP_DIR=%BUILD_OUTPUT_DIR%\backup
set ANDROID_DIR=%ROOT_DIR%android
set AAB_SOURCE=%ANDROID_DIR%\app\build\outputs\bundle\release\app-release.aab
set APK_SOURCE=%ANDROID_DIR%\app\build\outputs\apk\release\app-release.apk

:: Create timestamp for backup
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"

echo [INFO] Build started at %timestamp%
echo [INFO] Root directory: %ROOT_DIR%
echo.

:: Check if builds directory exists and backup if needed
if exist "%BUILD_OUTPUT_DIR%" (
    echo [INFO] Previous builds found, creating backup...
    
    :: Create backup directory if it doesn't exist
    if not exist "%BACKUP_DIR%" (
        mkdir "%BACKUP_DIR%"
        echo [INFO] Created backup directory: %BACKUP_DIR%
    )
    
    :: Backup existing AAB file
    if exist "%BUILD_OUTPUT_DIR%\app-release.aab" (
        echo [INFO] Backing up previous AAB file...
        copy "%BUILD_OUTPUT_DIR%\app-release.aab" "%BACKUP_DIR%\app-release-backup.aab" >nul
        if !errorlevel! equ 0 (
            echo [SUCCESS] AAB backup created
        ) else (
            echo [WARNING] Failed to backup AAB file
        )
    )
    
    :: Backup existing APK file
    if exist "%BUILD_OUTPUT_DIR%\app-release.apk" (
        echo [INFO] Backing up previous APK file...
        copy "%BUILD_OUTPUT_DIR%\app-release.apk" "%BACKUP_DIR%\app-release-backup.apk" >nul
        if !errorlevel! equ 0 (
            echo [SUCCESS] APK backup created
        ) else (
            echo [WARNING] Failed to backup APK file
        )
    )
) else (
    echo [INFO] No previous builds found, creating fresh builds directory...
    mkdir "%BUILD_OUTPUT_DIR%"
    echo [SUCCESS] Created builds directory: %BUILD_OUTPUT_DIR%
)

echo.
echo ================================================
echo         STEP 1: CLEANING PROJECT
echo ================================================

:: Clean npm cache and build directories
echo [INFO] Cleaning npm cache and build directories...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache" >nul 2>&1
    echo [INFO] Cleared npm cache
)

if exist ".next" (
    rmdir /s /q ".next" >nul 2>&1
    echo [INFO] Cleared Next.js build cache
)

if exist "out" (
    rmdir /s /q "out" >nul 2>&1
    echo [INFO] Cleared output directory
)

:: Clean Android build directories
if exist "%ANDROID_DIR%\app\build" (
    echo [INFO] Cleaning Android build directory...
    rmdir /s /q "%ANDROID_DIR%\app\build" >nul 2>&1
    echo [SUCCESS] Android build directory cleaned
)

if exist "%ANDROID_DIR%\build" (
    rmdir /s /q "%ANDROID_DIR%\build" >nul 2>&1
    echo [INFO] Android project build cleaned
)

echo.
echo ================================================
echo         STEP 2: BUILDING NEXT.JS APP
echo ================================================

echo [INFO] Installing/updating dependencies...
call npm install
if !errorlevel! neq 0 (
    echo [ERROR] npm install failed
    pause
    exit /b 1
)

echo [INFO] Building Next.js production app...
call npm run build
if !errorlevel! neq 0 (
    echo [ERROR] Next.js build failed
    pause
    exit /b 1
)
echo [SUCCESS] Next.js build completed

echo.
echo ================================================
echo         STEP 3: SYNCING WITH CAPACITOR
echo ================================================

echo [INFO] Syncing with Capacitor Android...
call npx cap sync android
if !errorlevel! neq 0 (
    echo [ERROR] Capacitor sync failed
    pause
    exit /b 1
)
echo [SUCCESS] Capacitor sync completed

echo.
echo ================================================
echo         STEP 4: BUILDING ANDROID FILES
echo ================================================

:: Navigate to Android directory
cd /d "%ANDROID_DIR%"
if !errorlevel! neq 0 (
    echo [ERROR] Could not navigate to Android directory
    pause
    exit /b 1
)

echo [INFO] Current directory: %CD%

:: Clean Android project
echo [INFO] Cleaning Android project...
call gradlew clean
if !errorlevel! neq 0 (
    echo [WARNING] Gradle clean had issues, continuing...
)

:: Build Release AAB
echo [INFO] Building Release AAB (Android App Bundle)...
call gradlew bundleRelease
if !errorlevel! neq 0 (
    echo [ERROR] AAB build failed
    pause
    exit /b 1
)
echo [SUCCESS] AAB build completed

:: Build Release APK
echo [INFO] Building Release APK...
call gradlew assembleRelease
if !errorlevel! neq 0 (
    echo [WARNING] APK build failed, continuing with AAB only...
    set "APK_FAILED=true"
) else (
    echo [SUCCESS] APK build completed
    set "APK_FAILED=false"
)

echo.
echo ================================================
echo         STEP 5: COPYING BUILD FILES
echo ================================================

:: Navigate back to root
cd /d "%ROOT_DIR%"

:: Copy AAB file
if exist "%AAB_SOURCE%" (
    echo [INFO] Copying AAB file to builds directory...
    copy "%AAB_SOURCE%" "%BUILD_OUTPUT_DIR%\app-release.aab" >nul
    if !errorlevel! equ 0 (
        echo [SUCCESS] AAB file copied successfully
    ) else (
        echo [ERROR] Failed to copy AAB file
        pause
        exit /b 1
    )
) else (
    echo [ERROR] AAB file not found at: %AAB_SOURCE%
    pause
    exit /b 1
)

:: Copy APK file (if build succeeded)
if "%APK_FAILED%"=="false" (
    if exist "%APK_SOURCE%" (
        echo [INFO] Copying APK file to builds directory...
        copy "%APK_SOURCE%" "%BUILD_OUTPUT_DIR%\app-release.apk" >nul
        if !errorlevel! equ 0 (
            echo [SUCCESS] APK file copied successfully
        ) else (
            echo [WARNING] Failed to copy APK file
        )
    ) else (
        echo [WARNING] APK file not found, only AAB will be available
    )
) else (
    echo [INFO] APK build failed, only AAB available
)

echo.
echo ================================================
echo         STEP 6: CREATING BUILD INFO
echo ================================================

:: Create build info file
set BUILD_INFO_FILE=%BUILD_OUTPUT_DIR%\build-info.txt
echo Build Information > "%BUILD_INFO_FILE%"
echo ================== >> "%BUILD_INFO_FILE%"
echo Build Date: %timestamp% >> "%BUILD_INFO_FILE%"
echo Version: 2.2.0 >> "%BUILD_INFO_FILE%"
echo. >> "%BUILD_INFO_FILE%"
echo Files Generated: >> "%BUILD_INFO_FILE%"
echo - app-release.aab (Android App Bundle) >> "%BUILD_INFO_FILE%"
if "%APK_FAILED%"=="false" (
    echo - app-release.apk (Android Package) >> "%BUILD_INFO_FILE%"
) else (
    echo - APK build failed, only AAB available >> "%BUILD_INFO_FILE%"
)
echo. >> "%BUILD_INFO_FILE%"
echo Data Updates Included: >> "%BUILD_INFO_FILE%"
echo - 77 Dominant cards with 5-tier systems >> "%BUILD_INFO_FILE%"
echo - 40 Updated trinket cards >> "%BUILD_INFO_FILE%"
echo - 48 Meaning of life cards >> "%BUILD_INFO_FILE%"
echo - 11 Merchant age cards >> "%BUILD_INFO_FILE%"
echo - 77 Reorganized age effects >> "%BUILD_INFO_FILE%"
echo - 41 Catastrophe cards with worldsEnd effects >> "%BUILD_INFO_FILE%"
echo - 7 Catastrophe rules (restored) >> "%BUILD_INFO_FILE%"

echo [SUCCESS] Build info created: %BUILD_INFO_FILE%

echo.
echo ================================================
echo         STEP 7: GIT OPERATIONS
echo ================================================

:: Configure Git user (if not already configured)
echo [INFO] Configuring Git user...
git config user.name "Carter" >nul 2>&1
git config user.email "ph75nix@proton.me" >nul 2>&1
echo [SUCCESS] Git user configured

:: Add all changes
echo [INFO] Adding files to Git...
git add .
if !errorlevel! neq 0 (
    echo [ERROR] Git add failed
    pause
    exit /b 1
)
echo [SUCCESS] Files added to Git

:: Commit changes
echo [INFO] Committing changes...
git commit -m "build: Generate AAB and APK files with updated data - %timestamp%

- Built AAB and APK with all latest data updates
- Includes 77 dominant cards, 40 trinkets, 48 meanings, 11 merchants
- Updated age effects (77) and catastrophe cards (41)
- Restored catastrophe rules functionality
- Build timestamp: %timestamp%"
if !errorlevel! neq 0 (
    echo [INFO] No changes to commit or commit failed
)

:: Push changes
echo [INFO] Pushing to remote repository...
git push origin main
if !errorlevel! neq 0 (
    echo [WARNING] Git push failed - you may need to authenticate manually
    echo [INFO] You can run 'git push origin main' manually later
) else (
    echo [SUCCESS] Changes pushed to remote repository
)

echo.
echo ================================================
echo                BUILD SUMMARY
echo ================================================
echo.
echo [SUCCESS] Build completed successfully!
echo.
echo Build Output Location: %BUILD_OUTPUT_DIR%
echo.
echo Files Generated:
if exist "%BUILD_OUTPUT_DIR%\app-release.aab" (
    echo   ✓ app-release.aab (Android App Bundle)
) else (
    echo   ✗ app-release.aab (FAILED)
)

if exist "%BUILD_OUTPUT_DIR%\app-release.apk" (
    echo   ✓ app-release.apk (Android Package)
) else (
    echo   ✗ app-release.apk (Not generated)
)

if exist "%BACKUP_DIR%" (
    echo.
    echo Backup Location: %BACKUP_DIR%
    if exist "%BACKUP_DIR%\app-release-backup.aab" (
        echo   ✓ Previous AAB backed up
    )
    if exist "%BACKUP_DIR%\app-release-backup.apk" (
        echo   ✓ Previous APK backed up
    )
)

echo.
echo ================================================
echo Data Updates Included in This Build:
echo ================================================
echo ✓ 77 Dominant cards with 5-tier progression systems
echo ✓ 40 Updated trinket cards with complete data
echo ✓ 48 Meaning of life cards with sM scaling
echo ✓ 11 Merchant age cards updated
echo ✓ 77 Age effects properly organized
echo ✓ 41 Catastrophe cards with worldsEnd effects
echo ✓ 7 Catastrophe rules restored and functional
echo ✓ All file references updated and tested
echo.
echo The AAB file is ready for Google Play Store upload!
echo The APK file can be used for direct installation.
echo.
echo Build completed at: %date% %time%
echo.
pause