# BYU Football Guess Game - Progress & Roadmap

## Project Status: Completed & Updated 🚀

### Specs Summary
- **App Name:** BYU Football Guess Game
- **Target Platform:** Web (GitHub Pages compatible, Mobile-first responsive UI)
- **Database:** Supabase REST API (`https://djqeavbyehrcbczvqgat.supabase.co/rest/v1/`)
- **Key Features Implemented:**
  - Account dropdown login + PIN authentication
  - Player management under accounts (with custom badge colors)
  - Edit Player form (edit name & badge color) — *Emojis can be typed directly into the name field!*
  - Bulk guess input for all family players on an account in one single view
  - **Automatic Game Locking:** Once a game starts or scores are entered, inputs are locked (`disabled`) and submission is blocked (`🔒 GUESSES LOCKED`)
  - Live countdown to kickoff timer for upcoming games with **TBD Kickoff support**
  - Support for `start_date` (date) & optional `start_time` (timetz/TBD)
  - Guess completion status indicator (e.g. `X/Y players submitted`)
  - Dynamic Leaderboard with Overall Standings & **Weekly Leaders breakdown**
  - Dropped scores algorithm (Game 3 drop 1, Games 4-6 drop 2, Games 7+ drop 3 lowest) & season progression weighting
  - Admin panel for `"J&J Smith's"` account to add games and submit official final scores
  - BYU fan aesthetics & Cosmo dancing Easter Egg 🐾 (Click Y logo 3 times!)
  - Smart client caching to minimize Supabase API quota usage

---

## Completed Tasks Checklist

- [x] **Phase 1: Setup & Specs Analysis**
  - Read `Specs/Database.md`, `Specs/General.md`, `Specs/Prompt.md`
  - Verified Supabase API REST connectivity & table schema
  - Created `progress.md` tracker

- [x] **Phase 2: Core Data Service & State Management (`js/supabase.js`, `js/scoring.js`)**
  - Built REST API integration layer using Supabase publishable key
  - Added `updatePlayer` REST API method to update player names in Supabase
  - Implemented 30-second memory cache to optimize quota usage
  - Programmed scoring engine with dropped lowest scores logic & season progression multiplier

- [x] **Phase 3: UI Design & Styling (`index.html`, `styles.css`)**
  - Designed mobile-first BYU Football theme (Royal Blue `#002E5D`, Gold `#FFC72C`, dark glassmorphism)
  - Added sub-tab switcher styling for Leaderboard view

- [x] **Phase 4: Views & Interactive Logic (`js/app.js`)**
  - **Login View:** Account select dropdown + PIN input + Create Account modal
  - **Leaderboard View:** Overall Standings and Weekly Leaders toggle, rank badges, fire emojis, countdown timer to kickoff, and guess submission progress indicator
  - **Submit Guesses View:** Single-page bulk guess input for all players in account + integrated Add Player & Edit Player forms + **Game Lock Enforcement**
  - **Schedule View:** List of upcoming and finished games with formatted date & Kickoff TBD indicators
  - **Admin View:** Full control panel enabled for `"J&J Smith's"` account to add games (with Date & optional Kickoff Time) and set final scores

- [x] **Phase 5: Verification & Launch**
  - Confirmed local preview server running
  - Created GitHub repository `JaredCraigSmith/ByuFootballGuessGame` and deployed to GitHub Pages
  - Populated complete 12-game 2026 BYU Football schedule in Supabase `Games` table
  - Updated app & API layer to support `start_date` and `start_time` (TBD handling)
  - Added **Edit Player** card (edit name & color)
  - Implemented **Game Locking** when kickoff passes or scores are entered
  - Added **Live Game Score Tracker** to Admin Control Panel with `⏱️ Save Live Score` and `🏆 Mark Final Score` controls
  - Added live status indicators (`🏆 FINISHED`, `🔴 LIVE IN PROGRESS`, `🗓️ UPCOMING`) across Admin Panel, Schedule View, Weekly Leaderboard, and Main Countdown Banner
  - Enhanced **Player Cell Styling**: Full cell cards in Overall Standings, Weekly Leaders, and My Guesses now display in each player's chosen color with custom background gradients, matching borders, and glowing shadows 🎨
  - Added **Family Account Prize Vault Tab (`🎁 Prizes`)**: Added a dedicated Prizes view where families track their account average score toward mystery surprise unlocks!
    - **Secret Surprise #1 (1 Avg Pt)**: Unlocks the **Cosmo Mascot Dance Party** (`assets/cosmo_head.jpg`)! 🐾
    - **Secret Surprise #2 (300 Avg Pts)**: Unlocks the **BYU Pump Up Song** (`assets/music_badge.jpg`)! 🎵
    - **Secret Surprise #3 (900 Avg Pts)**: Unlocks the **Polynesian Fire Knife Dancer Show** (`assets/fire_spinner_badge.jpg`), featuring the clean CSS Polynesian dancer from `fireDancer.html` who automatically tosses the flaming staff high into the air, catches it with a spark explosion, and smoothly fades away! 🔥
    - **Secret Surprise #4 (1500 Avg Pts)**: Unlocks the **LaVell Edwards Stadium Cougar Wave** (`assets/stadium_badge.jpg`), integrated directly from `Wave.html` featuring BYU endzones, midfield Block Y, stadium concrete seating bowl, and 1,600+ animated fan wave sprites, dynamically scaled for mobile phone viewports! 🌊
    - **Secret Surprise #5 (2500 Avg Pts)**: Unlocks the **BYU Game Day Drum Hype** (`assets/drum_badge.jpg`), featuring the interactive LaVell Edwards Stadium kick-off drum hype simulator! 🥁
- [x] **Phase 6: Admin Point System Reference & Cumulative Score Matrix**
  - **Admin Sub-Tabs**: Added tab navigation between `🎮 Games & Live Scores` and `📊 Point System Tables`.
  - **Table 1: Single-Game Point Payouts**: 14 game index columns with multiplier badges (×1.00 to ×2.95) across score differences (0, 7, 14, 21, 28, 35+).
  - **Table 2: Cumulative Point Progression Matrix**: Running cumulative point total across all 14 games.
  - **Rule Toggles**: One-click toggles for Winner Bonus (+5 vs +0), Index Base (0-based vs 1-based), and Official Drop Rules (Game 3 drop 1, Games 4-6 drop 2, Games 7+ drop 3 lowest).
  - **Custom Diff Adder**: Dynamically add and remove arbitrary score differentials to the matrix tables.
  - **Sticky Side Column**: `Score Diff` labels remain anchored on the left during horizontal scrolling on mobile screens.
  - **Interactive Score Simulator**: Real-time calculator sandbox breaking down raw points, multiplier, single-game payout, and season projection.

- [x] **Phase 7: Live Score Isolation & Prize Vault Bugfix**
  - **Overall Leaderboard Isolation**: Updated `computeLeaderboard` in `js/scoring.js` to strictly filter completed games by `isGameFinished(game)`. In-progress games with live scores entered are no longer counted towards `totalScore`, drop rules, or overall standings rank.
  - **Prize Vault Protection**: Since the Family Prize Vault average score is calculated from `totalScore`, prize unlocking now strictly depends on completed games. Live mid-game score matches can no longer prematurely unlock or unwrap vault prizes.
  - **Unearned Prize Reset**: Added automatic cleanup in `renderPrizesView` to clear any unearned unwrapped prize flags in `localStorage` if an account's true completed average score is below the threshold.
  - **Live Point Visibility Across Views**:
    - **Overall Standings**: Displays an active live game banner when in progress and shows each player's pending live points (`🔴 X live pts 🎯`) right below their official total score.
    - **Weekly Leaders**: Shows full live game standings, points, rank, and exact hit badges in real time as the admin updates scores.
    - **My Guesses**: Added live status notice and individual player point badges (`🔴 X live pts` / `🏆 X pts earned`) directly on each player's guess card.
    - **Prize Vault**: Subtitle indicates when a live game is in progress and clarifies that points will be added when the game is final.

- [x] **Phase 8: Smart Dynamic Focus for Weekly Leaders & My Guesses Dropdowns**
  - **3-Day Post-Game Score Viewing Buffer**: After a game concludes, the dropdown selector on Weekly Leaders and My Guesses continues to default to that recently finished game for a 3-day buffer window (~4 hours duration + 72 hours), allowing players to readily inspect their final scores, points earned, and ranks.
  - **Automatic Transition to Upcoming Game**: Once the 3-day buffer expires, initial navigation automatically advances to the next upcoming scheduled game.
  - **Live Game Priority**: If a game is currently in progress (scores entered or kickoff recently passed), both views immediately prioritize and focus on the live matchup.
  - **User Selection Freedom**: Preserves manual dropdown selections while interacting on the page, allowing users to freely view other game scores or guesses without interruption.

- [x] **Phase 9: Comprehensive Automated Test Suite (Zero-Database-Mutation Safety)**
  - **Strict Database Protection Guardrail**: `tests/mock-network.js` intercepts all `fetch` requests with a safety barrier preventing any production queries or mutation requests (`POST`, `PATCH`, `DELETE`) from reaching Supabase.
  - **Dual Test Runners**:
    - **CLI Runner**: Built-in Node test runner (`node:test`) running 52 unit and integration tests across 13 suites in under 300ms via `run-tests.cmd`, `run-tests.ps1`, or `npm test`.
    - **Browser Runner (`test.html`)**: BYU-themed visual web test runner to execute and view all assertions directly in any browser with real-time timers and pass/fail badges.
  - **Complete Algorithm & API Coverage**:
    - Mathematical exponential scoring curves, decay sigma, and winner bonuses
    - Dropped scores algorithm (Game 3 drop 1, Games 4–6 drop 2, Games 7+ drop 3)
    - Overall and weekly leaderboard calculation
    - Live game isolation (guaranteeing in-progress scores never mutate official standings)
    - Smart dynamic game focus and 3-day buffer window logic
    - Supabase REST client request construction, caching, offline fallback, and error handling


