# Tech Stack
- **Database / Backend:** Supabase
- **Docs/Portal:** https://supabase.com/

# Local Paths
- **Bruno API Examples:** `C:\Users\JaredCraigSmith\Documents\bruno\Jared\Supabase`

# Endpoints
- **Base REST API:** `https://djqeavbyehrcbczvqgat.supabase.co/rest/v1/`
- **Guesses Endpoint:** `https://djqeavbyehrcbczvqgat.supabase.co/rest/v1/Guesses`

# Apid Key
sb_publishable_G0uJU_i5raC-YtLZrqMUZw_aRoe__oC

# Note
This is just a side project for some fun with my family so security isn't super important.

---

## Database Schema

### `Accounts`
- `id` (bigint, PK, identity)
- `created_at` (timestamptz, default: `now()`)
- `name` (varchar, nullable)
- `pin` (int2, nullable)
- `is_admin` (boolean, default: `false`)

### `Players`
- `id` (bigint, PK, identity)
- `created_at` (timestamptz, default: `now()`)
- `name` (varchar, nullable)
- `account_id` (bigint, FK $\rightarrow$ `Accounts.id`)
- `color` (emoji)

### `Games`
- `id` (bigint, PK, identity)
- `created_at` (timestamptz, default: `now()`)
- `home_team` (varchar, nullable)
- `away_team` (varchar, nullable)
- `home_score` (int2, nullable)
- `away_score` (int2, nullable)
- `start_time` (timesz)
- `start_date` (date)
- `game_finished` (boolean, default: `false`)

### `Guesses`
- `id` (bigint, PK, identity)
- `created_at` (timestamptz, default: `now()`)
- `game_id` (bigint, FK $\rightarrow$ `Games.id`)
- `player_id` (bigint, FK $\rightarrow$ `Players.id`)
- `home` (int2, nullable)
- `away` (int2, nullable)

