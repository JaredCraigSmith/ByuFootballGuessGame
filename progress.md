# BYU Football Guess Game - Progress & Roadmap

## Project Status: Completed & Updated 🚀

### Specs Summary
- **App Name:** BYU Football Guess Game
- **Target Platform:** Web (GitHub Pages compatible, Mobile-first responsive UI)
- **Database:** Supabase REST API (`https://djqeavbyehrcbczvqgat.supabase.co/rest/v1/`)
- **Key Features Implemented:**
  - Account dropdown login + PIN authentication
  - Player management under accounts (with custom badge colors & status emojis)
  - Edit Player form (edit name, badge color, status emoji)
  - Bulk guess input for all family players on an account in one single view
  - Live countdown to kickoff timer for upcoming games with **TBD Kickoff support**
  - Support for `start_date` (date) & optional `start_time` (timetz/TBD)
  - Guess completion status indicator (e.g. `X/Y players submitted`)
  - Dynamic Leaderboard with Overall Standings & **Weekly Leaders breakdown**
  - Dropped scores algorithm (Game 3 drop 1, Game 4+ drop 2 lowest) & season progression weighting
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
  - **Submit Guesses View:** Single-page bulk guess input for all players in account + integrated Add Player & Edit Player forms
  - **Schedule View:** List of upcoming and finished games with formatted date & Kickoff TBD indicators
  - **Admin View:** Full control panel enabled for `"J&J Smith's"` account to add games (with Date & optional Kickoff Time) and set final scores

- [x] **Phase 5: Verification & Launch**
  - Confirmed local preview server running
  - Created GitHub repository `JaredCraigSmith/ByuFootballGuessGame` and deployed to GitHub Pages
  - Populated complete 12-game 2026 BYU Football schedule in Supabase `Games` table
  - Updated app & API layer to support `start_date` and `start_time` (TBD handling)
  - Added **Edit Player** card & **Single Emoji Status** support (`⚡, 🔥, 🏈, 👑...`)
