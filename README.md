# Doomlings Companion

A personal project: a digital companion app for the Doomlings card game. It tracks a physical game in progress (players, age deck, challenges, dominants, trinkets, and Meaning of Life scoring) and ships as a responsive Next.js web app plus a Capacitor-based Android build.

Live web version: https://doomlings.vercel.app

## What the app does

- Guided game setup for 2-6 players with custom names
- Age deck builder: mix normal ages, merchant ages, and catastrophes, with an optional final catastrophe
- Challenge roller that assigns a random challenge to a random player each age
- Dominant tracking with the 5-tier progression system and card search by name or effect
- Trinket assignment and tracking, including pocketed trinkets
- Meaning of Life assignment and end-game scoring with sM scaling based on game length
- Game state persistence (localStorage on web, Capacitor Preferences on native) plus named save slots in Settings
- Themes and UI scaling in Settings
- Optional device-to-device Sync of the host's game state (see Multiplayer status below)
- A full digital version of the game is not included yet; the home screen labels it "Coming Soon"

## Card data

All card data lives as JSON in `public/data/` and is loaded by the game screen at runtime. Verified counts:

- Dominants: 70 (`dominantData.json`)
- Ages: 82 (`ageData.json`), plus 11 merchant ages (`merchantAgeData.json`)
- Catastrophes: 43 (`catastropheData.json`)
- Meaning of Life: 48 (`meaningOfLifeData.json`)
- Trinkets: 40 (`trinketData.json`)
- Rules: 7 normal + 7 catastrophe (`normalRules.json`, `catastropheRules.json`)
- Expansion extras (treasures and expansion traits/ages/catastrophes): `extendedCards.json`
- Card artwork lookup data scraped from the official compendium: `scrapedCards.json`, `missingCardsFoundFromScrape.json`

## Getting started

### Prerequisites

- Node.js 18.17+ (LTS recommended)
- npm 9+
- Android Studio or Android SDK + Java 17 for native builds

### Install and run (web)

```bash
git clone https://github.com/Carter-75/doomlings.git
cd doomlings
npm install
npm run dev
```

`npm run dev` starts the custom server (`server.mjs`, Next.js plus the Socket.IO sync server) on http://localhost:3000.

Other scripts:

```bash
npm run build        # Production build (static export when not on Vercel/Render)
npm run start        # Production run of server.mjs
npm run type-check   # tsc --noEmit (currently passes clean)
npm run lint         # ESLint (known pre-existing style debt, mostly explicit any)
npm run clean        # Remove .next, out, and node_modules/.cache
```

## Build workflows

Comprehensive instructions live in docs:

- docs/build/overview.md: consolidated automation and manual build guide
- docs/android/release-guide.md: Play Store release checklist
- docs/android/keystore-setup.md: creating and backing up signing keys
- docs/deployment/socket-deployment.md: Socket.IO deployment notes
- docs/integration/iframe-embedding.md: embedding the web app in an iframe

### Windows automation

```powershell
./scripts/web/build-and-deploy.ps1 [-Force] [-SkipGit]
```

```cmd
scripts\web\build-and-deploy.bat
```

Both produce signed AAB/APK artifacts in `builds/`. Generated bundles are ignored by Git; store them externally.

### Manual flow

See docs/build/overview.md for the step-by-step sequence (npm run clean, npm run build, npx cap sync android, Gradle release tasks). Release bundles (`*.aab`, `*.apk`) and keystore files must stay out of version control.

## Project structure

```
android/                 Capacitor wrapper and Gradle project
builds/                  Output directory for generated release bundles (gitignored)
docs/                    Build, Android, deployment, integration, and product docs
icons/                   App icons at multiple sizes
public/                  Static assets and game data JSON (public/data)
resources/               Additional art/assets used by the app
scripts/                 One-off data scraping helpers (scripts/web holds build automation)
server.mjs               Custom Node server: Next.js plus Socket.IO sync
src/
  app/                   App router pages (home, game, settings, contact, privacy, premium)
  app/api/game/          REST room backend scaffold backed by Upstash Redis (see below)
  components/            UI components
  hooks/                 Game state, sync, and card image hooks
  lib/                   Services: card data, socket manager, ads, themes, notifications
  modules/doomlings/     Experimental full-game engine (types, rules engine, decks)
```

## Multiplayer status

Sync is implemented against the Socket.IO server in `server.mjs`, which runs alongside Next.js when you use `npm run dev` or `npm run start` on your own host. The Vercel web deployment does not run `server.mjs`, so Sync cannot connect there unless `NEXT_PUBLIC_SOCKET_URL` points at a separately deployed socket server.

A REST room backend also exists at `src/app/api/game` (Upstash Redis) with a client in `src/lib/vercelGameManager.ts`. The current UI does not use that client, and the API needs `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` set in the deployment environment to answer anything except error responses.

Ads and premium purchases are currently disabled in code (`MONETIZATION_DISABLED` in `src/lib/monetization-config.ts`); the premium page redirects home while that flag is on.

## License and distribution

This repository is distributed under the Doomlings Companion Proprietary License (see LICENSE). Source code, assets, and generated builds may only be used via authorized deployments (https://doomlings.vercel.app) or approved tester programs. Do not redistribute or fork without written permission.

---
_Last updated: 2026-10-26_
