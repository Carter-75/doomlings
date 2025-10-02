# 🚀 Doomlings Companion - Build Instructions

## Quick Build (Windows)

### 📦 **One-Click Build and Deploy**
Simply double-click the batch file in the root directory:

```
build-and-deploy.bat
```

This script will automatically:
- ✅ Clean and rebuild the entire project
- ✅ Generate both AAB and APK files
- ✅ Backup previous builds (if any) 
- ✅ Commit and push changes to Git
- ✅ Create organized folder structure

### 📁 **Output Structure**
After running the script, you'll have:

```
doomlings/
├── build-and-deploy.bat          ← Click this to build
├── builds/                       ← Output folder
│   ├── app-release.aab          ← For Google Play Store
│   ├── app-release.apk          ← For direct installation
│   ├── build-info.txt           ← Build details
│   └── backup/                  ← Previous builds backup
│       ├── app-release-backup.aab
│       └── app-release-backup.apk
└── ...
```

## Manual Build (Alternative)

### 🛠️ **Command Line Build**
```bash
# Navigate to project
cd doomlings

# Full clean build
npm run clean
npm run build
npx cap sync android

# Build Android files
cd android
./gradlew clean
./gradlew bundleRelease      # Generates AAB
./gradlew assembleRelease    # Generates APK
```

### 📍 **Manual Build Output Locations**
- **AAB**: `android/app/build/outputs/bundle/release/app-release.aab`
- **APK**: `android/app/build/outputs/apk/release/app-release.apk`

## 🎯 **What's Included in Latest Build**

### ✅ **Updated Data Files:**
- **77 Dominant Cards** - 5-tier progression systems
- **40 Trinket Cards** - Complete power/objective/points data
- **48 Meaning of Life Cards** - With sM scaling notation
- **11 Merchant Age Cards** - Updated merchant data
- **77 Age Effects** - Properly organized and categorized
- **41 Catastrophe Cards** - With worldsEnd effects
- **7 Catastrophe Rules** - Restored gameplay rules

### 🔧 **Technical Fixes:**
- ✅ Fixed file reference paths for new data organization
- ✅ Restored catastrophe rules functionality
- ✅ Updated component imports for renamed files
- ✅ Maintained backward compatibility

## 🚨 **Requirements**

### **For Batch Script:**
- Windows OS
- Node.js installed
- Android SDK configured
- Git configured with credentials

### **For Manual Build:**
- Node.js 18+
- Android SDK
- Gradle
- Git

## 📱 **Deployment**

### **Google Play Store (AAB):**
1. Use `app-release.aab` from builds folder
2. Upload to Google Play Console
3. Follow Play Store review process

### **Direct Installation (APK):**
1. Use `app-release.apk` from builds folder  
2. Enable "Unknown Sources" on Android device
3. Install directly

## 🔄 **Updating Data**

When you update JSON data files:
1. Make your changes to files in `public/data/`
2. Run `build-and-deploy.bat`
3. Script will automatically include new data in build
4. Commit and push changes

## 🆘 **Troubleshooting**

### **Build Fails:**
- Ensure Android SDK is properly installed
- Check Node.js version (18+ required)
- Verify Gradle is accessible in PATH

### **Git Push Fails:**
- Configure Git credentials: `git config --global user.name "Your Name"`
- Set up authentication token if using HTTPS
- Or push manually: `git push origin main`

### **Permission Issues:**
- Run Command Prompt as Administrator
- Ensure write permissions in project directory

## 📧 **Support**

If you encounter issues:
1. Check the build log output
2. Verify all requirements are installed
3. Try manual build commands
4. Check Git repository access

---
*Last updated: 2025-10-02 - Build automation with comprehensive data updates*