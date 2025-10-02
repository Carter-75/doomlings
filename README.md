# 🎲 DOOMlings Companion App

A comprehensive digital companion for the **DOOMlings** board game, featuring card management, game tracking, and multiplayer functionality.

![Version](https://img.shields.io/badge/version-2.2.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20Web-green.svg)
![Built with](https://img.shields.io/badge/built%20with-Next.js%20%7C%20Capacitor-orange.svg)

## 🚀 Quick Start

### Option 1: One-Click Build (Windows) ⚡
1. **Clone/Pull the repository:**
   ```bash
   git clone https://github.com/Carter-75/doomlings.git
   cd doomlings
   ```

2. **Double-click the build file:**
   ```
   build-and-deploy.bat
   ```

3. **Click "Y" to confirm** and wait for completion

4. **Get your files:**
   - AAB file: `builds/app-release.aab` (for Google Play Store)
   - APK file: `builds/app-release.apk` (for direct installation)

### Option 2: Manual Setup 🛠️

#### Prerequisites
- **Node.js** 18+ 
- **npm** 9+
- **Android SDK** (for mobile builds)
- **Git**

#### Installation Steps
```bash
# 1. Clone the repository
git clone https://github.com/Carter-75/doomlings.git
cd doomlings

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

#### Building for Android
```bash
# Build web app
npm run build

# Sync with Capacitor
npx cap sync android

# Build Android files
cd android
./gradlew bundleRelease    # Creates AAB for Play Store
./gradlew assembleRelease  # Creates APK for direct install
```

## 📱 Features

### 🎯 **Core Functionality**
- ✅ **Complete Card Database** - 77+ dominants, 40+ trinkets, 48 meanings, ages & catastrophes
- ✅ **5-Tier Dominant System** - Full progression tracking for all dominant cards
- ✅ **Game State Management** - Track players, turns, and game progress
- ✅ **Smart Reset System** - Clear dominants with proper UI updates
- ✅ **Multiplayer Support** - Socket.io-based real-time gameplay
- ✅ **Offline Capability** - Full functionality without internet

### 🃏 **Card Management**
- **Dominant Cards** (77) - 5-tier progression systems with scaling effects
- **Trinket Cards** (40) - Power, objectives, and point values
- **Meaning of Life** (48) - Complete with sM scaling notation
- **Age Effects** (77) - Organized gameplay modifiers
- **Catastrophe Cards** (41) - With worldsEnd effects
- **Merchant Ages** (11) - Special merchant interactions
- **Rules** (7+7) - Normal and catastrophe gameplay rules

### 🎮 **Game Features**
- **Turn Management** - Track current player and age progression
- **Age Deck Builder** - Customize your game experience
- **Player Setup** - 2-6 player support with custom names
- **Catastrophe Mode** - Special rules for intense gameplay
- **Card Search** - Find cards quickly by name or effect
- **State Persistence** - Resume games where you left off

## 📁 Project Structure

```
doomlings/
├── 📄 build-and-deploy.bat      # One-click build automation
├── 📄 BUILD-INSTRUCTIONS.md    # Detailed build guide
├── 📄 README.md                # This file
├── 📁 src/                     # Source code
│   ├── 📁 app/                 # Next.js app pages
│   ├── 📁 components/          # React components
│   └── 📁 lib/                 # Utilities and services
├── 📁 public/                  # Static assets
│   └── 📁 data/               # JSON game data
│       ├── dominantData.json  # 77 dominant cards
│       ├── trinketData.json   # 40 trinket cards
│       ├── ageData.json       # 77 age effects
│       └── ...               # Other game data
├── 📁 android/                 # Capacitor Android project
├── 📁 builds/                  # Build outputs (created after build)
│   ├── app-release.aab        # Android App Bundle
│   ├── app-release.apk        # Android Package
│   └── 📁 backup/             # Previous builds backup
└── 📁 icons/                   # App icons (multiple sizes)
```

## 🔧 Development

### Available Scripts
```bash
npm run dev        # Start development server (with Turbopack)
npm run build      # Build production app
npm run start      # Start production server
npm run lint       # Run ESLint
npm run clean      # Clean build caches
```

### Key Technologies
- **Frontend**: Next.js 15, React 18, TypeScript
- **Mobile**: Capacitor 6 for native Android
- **Styling**: Tailwind CSS
- **Data**: JSON-based card database
- **Multiplayer**: Socket.io (optional)
- **Build**: Gradle for Android builds

## 📦 Deployment

### Google Play Store (Recommended)
1. Build AAB: Run `build-and-deploy.bat` or manual build
2. Upload `builds/app-release.aab` to Google Play Console
3. Follow Play Store review process

### Direct Installation
1. Build APK: Run `build-and-deploy.bat` or manual build
2. Enable "Unknown Sources" on Android device
3. Install `builds/app-release.apk` directly

### Web Deployment
```bash
npm run build  # Creates static export in 'out' directory
# Deploy 'out' directory to any static hosting service
```

## 🎯 What's New in v2.2.0

### ✨ **Latest Updates**
- 🔄 **Complete Data Overhaul** - All card data updated with latest expansions
- ⚡ **5-Tier Dominants** - Full progression systems for all dominant cards
- 🛠️ **Automated Build System** - One-click Windows batch file builds
- 🗂️ **Reorganized Data** - Clean separation of ages, catastrophes, and rules
- 🔧 **Bug Fixes** - Dominant reset system fully functional
- 📱 **Enhanced UI** - Improved card displays and interactions

### 📊 **Data Statistics**
- **77 Dominant Cards** with comprehensive 5-tier progression
- **40 Trinket Cards** with complete power/objective/points
- **48 Meaning of Life Cards** with sM scaling mechanics  
- **77 Age Effects** properly categorized and organized
- **41 Catastrophe Cards** with worldsEnd effects
- **11 Merchant Ages** for expanded gameplay
- **14 Total Rules** (7 normal + 7 catastrophe)

## 🆘 Troubleshooting

### Common Issues

**Build fails:**
- Ensure Node.js 18+ and Android SDK are installed
- Run `npm run clean` before building
- Check Android SDK path in `android/local.properties`

**App won't start:**
- Clear browser cache for web version
- Reinstall APK for Android version
- Check console for error messages

**Cards not loading:**
- Verify JSON files in `public/data/` directory
- Check browser network tab for failed requests
- Ensure file paths match component imports

### Getting Help
1. Check the **BUILD-INSTRUCTIONS.md** for detailed build steps
2. Review console logs for error messages
3. Verify all prerequisites are properly installed
4. Try manual build commands if batch file fails

## 📋 Requirements

### Development
- **Node.js** 18.17.0+
- **npm** 9.0.0+
- **Git** (for version control)

### Android Building
- **Android SDK** with API level 34+
- **Gradle** (included in Android SDK)
- **Java** 11+ (for Gradle)

### Recommended Tools
- **Android Studio** (for advanced Android development)
- **VS Code** (for web development)
- **Chrome DevTools** (for debugging)

## 📄 License

**MIT License** - Feel free to use, modify, and distribute.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 🎮 About DOOMlings

DOOMlings is a strategic card game where players evolve creatures through different ages, collect traits, and survive catastrophes to achieve the highest score. This companion app enhances the physical game with digital card management, rule references, and multiplayer capabilities.

---

**Built with ❤️ for the DOOMlings community**

*Last updated: October 2025 - v2.2.0 with comprehensive card database*