# Doomlings Multiplayer: Project Roadmap

This document outlines the comprehensive roadmap to take the Doomlings multiplayer game from its current prototype state to a fully-fledged, commercially viable product. The project is broken down into five distinct phases.

---

### **Phase 1: Foundational Fixes & Core Logic**
*The goal of this phase is to solidify the game's foundation, implement all core rules, and connect the UI to an authoritative server, eliminating all placeholder logic.*

#### **1. Integrate `DoomlingGameServer`**
- **Goal:** Make `server-with-socket.js` a thin wrapper that delegates all game logic to the authoritative `DoomlingGameServer`.
- **Sub-tasks:**
  - Remove all old, in-memory game logic (`rooms` Map, `generateRoomCode`, etc.) from `server-with-socket.js`.
  - Refactor every socket event handler (`create-room`, `join-room`, `play-card`, etc.) to call the corresponding method on the `gameServer` instance.
  - Ensure the mapping between a player's `socket.id` and their persistent `playerId` is robustly managed.

#### **2. Implement the `RulesEngine`**
- **Goal:** Fill in all the stubbed-out methods in `RulesEngine.ts` to create a fully functional and canonical rules implementation.
- **Sub-tasks:**
  - **`executeStartOfTurnTriggers`:**
    - Query the current player's `traitPile` and active `age` effects for any start-of-turn abilities.
    - Create and queue the corresponding effect objects for resolution.
  - **`executeTraitPlayStep`:**
    - Implement the logic that allows a player to select and play a card from their hand. This will be triggered by a socket event.
    - Validate the play against the `RulesEngine` (`validateCardPlay`).
  - **`executeAdditionalPlays`:**
    - Implement logic to check for effects that grant extra card plays and allow the player to act on them.
  - **`executeEndOfTurnTriggers`:**
    - Implement effects that trigger at the end of a player's turn, before passing priority.
  - **`applyAgeEffects`:**
    - Write the logic for each unique Age card in the game.
  - **`applyForcedDiscard`:**
    - Implement the UI flow for a player to choose which cards to discard when forced by an effect.
  - **`validateRestriction`:**
    - Implement the logic for all card-specific play restrictions (e.g., "Cannot be played if...").
  - **`resolveEffect`:**
    - Create a master handler that can take any `QueuedEffect` and apply its specific game state changes.

#### **3. Implement All Card Effects (Base Game)**
- **Goal:** Write the specific logic for every single card in the base set.
- **Sub-tasks:**
  - Create a structured way to map a `card.id` to its effect logic within the `RulesEngine`.
  - Implement all **Trait** card effects (e.g., draw, discard, steal, modify gene pool).
  - Implement all **Dominant** card effects (both persistent and "World's End" scoring bonuses).
  - Implement all **Catastrophe** card effects.

#### **4. Implement Full Scoring Logic**
- **Goal:** Complete the `executeWorldEndScoring` method in the `RulesEngine` to accurately calculate final scores.
- **Sub-tasks:**
  - Implement `calculateDominantBonuses` based on final game state.
  - Implement `calculateColorBonuses` (e.g., points for color sets).
  - Implement `calculateVarietyBonuses` (e.g., points for unique colors).
  - Implement `calculateSpeciesBonuses`.
  - Implement `calculateTreasureBonuses`.
  - Implement `calculateWorldEndBonuses` from specific card effects.
  - Implement a tie-breaker system based on the official rules.

#### **5. Connect UI to Authoritative State**
- **Goal:** Remove all placeholder and sample data from the UI, making it a pure reflection of the server's `GameState`.
- **Sub-tasks:**
  - Remove the `sampleCards` array and any other hardcoded data from `DoomlingGameInterface.tsx` and other components.
  - Ensure the `room` prop passed to the game interface contains the complete, player-specific view of the `GameState` from the server.
  - Render the player's hand, trait piles, scores, and all other UI elements directly from this prop.
  - Strictly disable UI controls (e.g., the "Play Card" button) when `isCurrentTurn` is false.

#### **6. Verify Card Database**
- **Goal:** Ensure all official card data is loaded correctly and used to build game decks.
- **Sub-tasks:**
  - Validate that `CardDatabase.ts` successfully parses all card JSON files, including expansions.
  - Confirm that `GameServer.ts` uses the `CardDatabase` to correctly construct the Trait and Age decks based on the `gameConfig` (i.e., which expansions are enabled).

---

### **Phase 2: Feature Completion & UI/UX Polish**
*The goal of this phase is to transform the functional prototype into a beautiful, engaging, and user-friendly game.*

#### **1. Professional Visuals**
- **Goal:** Overhaul the game's visuals to be commercially appealing.
- **Sub-tasks:**
  - **Card Art:** Commission or create unique, high-quality artwork for every card.
  - **Card Frame:** Design a professional, polished card frame that includes all necessary elements (name, type, value, effect text, art box).
  - **Game Board:** Design and implement a high-fidelity game board, replacing the current placeholder background.
  - **UI Assets:** Create a consistent set of icons, buttons, and other UI elements.

#### **2. Animations & Effects**
- **Goal:** Make the game feel alive and responsive.
- **Sub-tasks:**
  - Animate cards moving from the deck to a player's hand.
  - Animate cards being played to the trait pile.
  - Add visual effects for card abilities (e.g., a flash when a card is destroyed).
  - Add UI feedback for score changes and gene pool modifications.

#### **3. Audio**
- **Goal:** Add sound to enhance the game experience.
- **Sub-tasks:**
  - Commission or source background music for the menu, lobby, and game.
  - Add sound effects for key actions: playing a card, ending a turn, drawing cards, clicking buttons.
  - Implement a settings panel to control audio volume.

#### **4. Core Features**
- **Goal:** Implement standard features expected in a modern multiplayer game.
- **Sub-tasks:**
  - **Full Chat System:** Implement a scrollable chat log with system messages and player messages in the lobby and game.
  - **Player Profiles:** Create a simple profile page showing player stats (wins, losses, favorite card, etc.).
  - **Tutorial:** Design and implement an interactive tutorial for new players that explains the basic rules.
  - **Spectator Mode:** Fully implement the spectator functionality.
  - **Expansion Support:** Add UI elements to enable/disable expansions in the "Create Room" screen and ensure the game loads the correct cards.

---

### **Phase 3: Production Readiness & Infrastructure**
*The goal of this phase is to build the robust, secure, and scalable backend infrastructure required for a live, commercial game.*

#### **1. Data Persistence**
- **Goal:** Move from an in-memory server to a persistent, production-grade database.
- **Sub-tasks:**
  - Choose a database technology (e.g., Redis for game state, PostgreSQL for user data).
  - Design the database schema for users, games, and stats.
  - Refactor `DoomlingGameServer` to read from and write to the database instead of the in-memory `games` Map.

#### **2. User Authentication**
- **Goal:** Implement a secure and reliable user account system.
- **Sub-tasks:**
  - Choose and integrate an authentication solution (e.g., NextAuth.js).
  - Create UI for login, logout, and registration.
  - Secure all API endpoints and socket events to require authentication.
  - Link game `playerId` to a persistent user account.

#### **3. Scalability & Security**
- **Goal:** Prepare the application for a public launch.
- **Sub-tasks:**
  - Set up a scalable hosting environment (e.g., Vercel for the frontend, AWS/Heroku/Render for the server).
  - Implement robust error handling and logging (e.g., Sentry, LogRocket).
  - Perform a security audit and implement safeguards against common vulnerabilities (e.g., XSS, SQL injection).
  - Implement comprehensive rate limiting on API endpoints and socket events.
  - Create a CI/CD pipeline for automated testing and deployment.

---

### **Phase 4: Testing & Quality Assurance**
*The goal of this phase is to ensure the game is stable, bug-free, and balanced through rigorous, multi-faceted testing.*

#### **1. Automated Testing**
- **Goal:** Create a suite of tests to ensure code quality and prevent regressions.
- **Sub-tasks:**
  - **Unit Tests:** Write unit tests for the `RulesEngine` using a framework like Jest. Create a separate test file for each complex card to verify its logic in isolation.
  - **Integration Tests:** Use a tool like Cypress or Playwright to write end-to-end tests that simulate a full game, from login to the final score screen.

#### **2. Manual Testing & Feedback**
- **Goal:** Find and fix bugs through real-world usage.
- **Sub-tasks:**
  - **Internal QA:** Conduct thorough manual testing of every feature, card interaction, and UI element.
  - **Closed Beta:** Organize a closed beta with a group of players to gather feedback, identify bugs, and test for balance issues.
  - **Stress Testing:** Use tooling to simulate high traffic and many concurrent games to ensure the server is stable under load.
  - **Compatibility Testing:** Test the web application across different browsers (Chrome, Firefox, Safari) and devices (desktop, mobile).

---

### **Phase 5: Go-to-Market & Post-Launch**
*The goal of this phase is to successfully launch the game, attract a player base, and establish a plan for its ongoing success.*

#### **1. Business & Legal**
- **Goal:** Prepare the project for commercial launch.
- **Sub-tasks:**
  - **Monetization Strategy:** Decide on a final business model (e.g., one-time purchase, cosmetic microtransactions, expansion packs).
  - **Payment Integration:** If applicable, integrate a payment provider like Stripe or PayPal.
  - **Legal Documents:** Draft and publish official Terms of Service and a Privacy Policy.
  - **Marketing:** Create a landing page, trailer, and other marketing materials.

#### **2. Launch & Support**
- **Goal:** Successfully launch the game and support the player community.
- **Sub-tasks:**
  - **Analytics:** Integrate an analytics tool (e.g., Google Analytics, Mixpanel) to track player behavior.
  - **Community Management:** Establish a presence on platforms like Discord and Twitter to communicate with players.
  - **Player Support:** Set up a system for players to report bugs and get help.
  - **Content Roadmap:** Plan for future updates, including balance patches, new cards, and new features.
