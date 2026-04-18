# Mobile-First Monorepo Architecture & Rules

**Standard for: All future apps (e.g., GameX, AppY)**

This document defines the architectural patterns, database setup, and deployment strategy for mobile-first applications that work identically on web (Vercel) and Android (Capacitor).

This is the only documentation file to maintain for architecture + build/deploy rules. Do not split these rules into a separate architecture document.

---

## 1. Monorepo Structure

### Root Directory Layout
```
ProjectName/
├── apps/
│   ├── angular-mobile/            # 📱 Frontend: Angular + Capacitor
│   │   ├── src/app/               # UI Components
│   │   ├── android/               # Native Android wrapper (Capacitor)
│   │   └── ...
│   ├── next-api/                  # 🌐 Backend + Web UI: Next.js API & Web UI
│   │   ├── app/                   # Next.js App Router (Universal)
│   │   ├── components/            # Shared UI components (AdBanner, etc.)
│   │   ├── lib/                   # Shared Business Logic (Tabletop, Auth)
│   │   └── ...
├── build/                         # 🎯 Centralized Artifacts (APK/AAB)
├── build-and-deploy.ps1           # 👈 Unified build script template (Required)
├── package.json                   # 👈 Root Hoisting (Vercel Compatibility)
├── vercel.json                    # 👈 Root Build Config (Monorepo)
├── APP_RULES.md                   # 👈 Design guidelines & architecture rules
└── PROJECT_TODO.md                # 👈 Active task tracking
```

### Dependency Hoisting (Vercel Build Strategy)
In a monorepo, Vercel's build process works best when all dependencies and devDependencies (like `tailwindcss`, `postcss`, and `typescript`) are **hoisted to the root `package.json`**. This ensures that the build environment has immediate access to all tools needed for sub-project compilation.

**All game logic lives in the backend lib** (`apps/api-backend/src/lib/`) — shared business logic for:
- Game rules & state machine
- Tutorial workflow
- Room management
- Multiplayer synchronization
- User profiles & data

**API routes export this logic** (`apps/api-backend/src/app/api/`) — both web and mobile call the same endpoints.

---

## 2. Platform Architecture

### Web & API Platform (Next.js/Node on Vercel)
1. **Built from**: `apps/next-api`
2. **Deployment**: GitHub push → Vercel auto-deploys via root `vercel.json` orchestration.
3. **Architecture**: Root `package.json` handles all shared dependencies (Hoisting).
4. **Database**: MongoDB/Mongoose (Standard Persistence Layer).

### Mobile Platform (Frontend + Capacitor)
1. **Built from**: `apps/angular-mobile` (Mobile UI)
2. **Framework**: Angular + Capacitor.
3. **Android Build**: Target SDK 35 (Minimum Requirement).
4. **Identifier**: `com.fracturedearth` (Provisioned Package Name).
5. **Logic**: Syncing with `apps/next-api` endpoints via `nativeBridge.ts`.

### Monetization Layer (Sub/Ads)
1. **Subscriptions**: **RevenueCat** (`@revenuecat/purchases-capacitor`) for Sector Pass.
2. **Ads**: **AdMob** (`@capacitor-community/admob`) for real test ads on native platforms.
3. **Rules**: All ads must check the `adFree` status from `LocalUserSettings` before rendering.

---

## 3. Database Setup (MongoDB Atlas)

### Why MongoDB?
- Flexible document schema for complex card effects.
- Unified storage for global card data, user profiles, and active match states.
- High performance for real-time polling across web and mobile.

### Implementation

#### A. Multi-Regional Scalability
Data is hosted on **MongoDB Atlas** (Global Cluster) and accessed via **Mongoose** in `apps/api-backend`.

#### B. Data Migration Service
All apps should include a JSON-to-Db migration script in `apps/api-backend/scripts/migrate-data.ts`.

To refresh the database from local JSON data:
```bash
cd apps/api-backend
npx tsx scripts/migrate-data.ts
```

#### C. Concurrency Control
Revision numbers are mandatory for optimistic concurrency to prevent race conditions during simultaneous client updates.

---

## 4. Game Logic Structure (`apps/api-backend/src/lib/`)

### Core Patterns

#### A. Game State Machine (`gameEngine.ts`)

```typescript
// Exported types/interfaces
export interface GameState {
  players: Player[];
  round: number;
  currentTurn: string; // userId
  cards: Card[];
  status: 'WAITING' | 'PLAYING' | 'COMPLETED';
}

export interface Action {
  type: 'DRAW_CARD' | 'PLAY_CARD' | 'END_TURN';
  actorUserId: string;
  payload: any;
}

// Pure function: current state + action → new state
export function applyGameAction(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'DRAW_CARD':
      return { ...state, cards: [...state.cards, drawCard()] };
    case 'PLAY_CARD':
      return { ...state, /* apply card effect */ };
    case 'END_TURN':
      return { ...state, currentTurn: nextPlayer(state) };
    default:
      return state;
  }
}

// Check win condition
export function detectWinner(state: GameState): string | null {
  // return userId if won, null otherwise
}
```

**Principle**: Game logic is **pure functions** (no side effects), testable everywhere.

#### B. Tutorial Logic (`tutorialEngine.ts`)

```typescript
export interface TutorialStep {
  step: number;
  title: string;
  description: string;
  expectedAction: 'DRAW_CARD' | 'PLAY_CARD' | 'END_TURN';
  fixedHand?: Card[];
  fixedOpponent?: Player;
}

export function startTutorial(): GameState {
  // Fixed setup: deterministic hand, bot opponent
}

export function applyTutorialAction(state: GameState, action: Action): GameState {
  // Validate action matches expectedAction
  // Apply via applyGameAction
}

export function getCurrentStep(stepIndex: number): TutorialStep | null {
  // Return step definition
}
```

#### C. Room Management (`rooms.ts`)

```typescript
export interface Room {
  code: string;
  hostUserId: string;
  members: { userId: string; displayName: string }[];
  currentGameState?: GameState;
  status: 'LOBBY' | 'PLAYING' | 'COMPLETED';
}

export async function createRoom(userId: string, displayName: string): Promise<string> {
  const code = generateCode(); // 6-char alphanumeric
  await setRoom(code, { hostUserId: userId, members: [{ userId, displayName }] });
  return code;
}

export async function joinRoom(code: string, userId: string, displayName: string): Promise<boolean> {
  const room = await getRoom(code);
  if (!room) return false;
  room.members.push({ userId, displayName });
  await setRoom(code, room);
  return true;
}

export async function syncGameState(code: string, state: GameState): Promise<void> {
  await setGameState(code, state, state.revision);
}
```

### API Routes Export Logic

**`src/app/api/game/action/route.ts`**:
```typescript
import { applyGameAction } from '@/lib/gameEngine';
import { getRoom, syncGameState } from '@/lib/rooms';

export async function POST(req: NextRequest) {
  const { roomCode, userId, action } = await req.json();

  const room = await getRoom(roomCode);
  const newState = applyGameAction(room.currentGameState, action);

  await syncGameState(roomCode, newState);

  return NextResponse.json({ success: true, state: newState });
}
```

---

## 5. Multiplayer & Real-Time

### Polling Pattern (Recommended for MVP)

**Web Client** (`src/app/game/page.tsx`):
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch(`/api/rooms/${roomCode}/state`);
    const data = await res.json();
    setGameState(data.state);
  }, 1000); // Poll every 1 second
  return () => clearInterval(interval);
}, [roomCode]);
```

**Mobile Client** (`apps/mobile-client/src/app/services/game.service.ts`):
```typescript
// Heartbeat / State Polling
setInterval(async () => {
  const res = await fetch(`${API_BASE_URL}/rooms/${roomCode}/state`);
  const data = await res.json();
  this.gameState$.next(data.state);
}, 1000); // Poll every 1 second
```

### Heartbeat Pattern (Connection Management)

**`src/app/api/rooms/[code]/heartbeat/route.ts`**:
```typescript
export async function POST(req: NextRequest, { params }) {
  const { userId } = await req.json();
  const room = await getRoom(params.code);
  
  // Mark player as active
  room.members = room.members.map(m => 
    m.userId === userId ? { ...m, lastHeartbeatMs: Date.now() } : m
  );
  
  await setRoom(params.code, room);
  return NextResponse.json({ success: true });
}
```

**Client-side** (both platforms):
```typescript
setInterval(() => {
  fetch(`/api/rooms/${roomCode}/heartbeat`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
}, 30000); // Every 30 seconds
```

---

## 6. Build & Deployment (Unified Automation)

### Build Script (`build-and-deploy.ps1`)
The root directory contains a unified PowerShell script that orchestrates the entire build pipeline for both Next-API and Angular-Mobile.

#### Key Features:
1. **Environment Sync**: Automatically updates Vercel environment variables (e.g., `MONGODB_URI`).
2. **Database Migration**: Optional switch (`-SkipMigration`) to run or skip card data migrations.
3. **Artifact Management**:
   - Moves generated APK and AAB files to the root `build/` directory.
   - **Backup System**: Automatically moves existing artifacts in `build/` to `build/backup/` with a timestamp before replacing them.
4. **Build Control**:
   - `-SkipBuild`: Allows running only the artifact movement and environment sync logic (useful if the build was already completed manually).
   - `-SkipVercel`: Skips Vercel configuration steps.

### Deployment Workflow
1. **Web (API)**: Automatic deployment via GitHub → Vercel integration.
2. **Android**:
   - Run `./build-and-deploy.ps1`.
   - Retrieve the production-ready `.aab` from the `build/` folder.
   - Manually upload to Google Play Console.

### Release Requirements (Android)
- **Package Name**: Must be `com.fracturedearth`.
- **Target SDK**: Level 35 (Android 15).
- **Optimization**: `minifyEnabled true` and `ndk { debugSymbolLevel "FULL" }` are mandatory for production releases to ensure