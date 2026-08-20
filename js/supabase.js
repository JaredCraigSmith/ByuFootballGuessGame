// BYU Football Guess Game - Supabase REST API Service
const SUPABASE_BASE_URL = 'https://djqeavbyehrcbczvqgat.supabase.co/rest/v1';
const SUPABASE_API_KEY = 'sb_publishable_G0uJU_i5raC-YtLZrqMUZw_aRoe__oC';

const headers = {
  'apikey': SUPABASE_API_KEY,
  'Authorization': `Bearer ${SUPABASE_API_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

// In-memory Cache & TTL (60 seconds)
const cache = {
  accounts: null,
  players: null,
  games: null,
  guesses: null,
  lastFetch: {}
};

const CACHE_TTL_MS = 30000; // 30s cache

function isCacheValid(key) {
  return cache[key] && cache.lastFetch[key] && (Date.now() - cache.lastFetch[key] < CACHE_TTL_MS);
}

export const SupabaseAPI = {
  // Accounts
  async getAccounts(forceRefresh = false) {
    if (!forceRefresh && isCacheValid('accounts')) return cache.accounts;
    try {
      const res = await fetch(`${SUPABASE_BASE_URL}/Accounts?select=*&order=id.asc`, { headers });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      cache.accounts = data;
      cache.lastFetch.accounts = Date.now();
      return data;
    } catch (err) {
      console.error('Error fetching accounts:', err);
      return cache.accounts || [];
    }
  },

  async createAccount(name, pin) {
    try {
      const res = await fetch(`${SUPABASE_BASE_URL}/Accounts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, pin: parseInt(pin, 10), is_admin: false })
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      cache.accounts = null; // Invalidate
      return data[0];
    } catch (err) {
      console.error('Error creating account:', err);
      throw err;
    }
  },

  // Players
  async getPlayers(forceRefresh = false) {
    if (!forceRefresh && isCacheValid('players')) return cache.players;
    try {
      const res = await fetch(`${SUPABASE_BASE_URL}/Players?select=*&order=id.asc`, { headers });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      cache.players = data;
      cache.lastFetch.players = Date.now();
      return data;
    } catch (err) {
      console.error('Error fetching players:', err);
      return cache.players || [];
    }
  },

  async createPlayer(name, accountId) {
    try {
      const res = await fetch(`${SUPABASE_BASE_URL}/Players`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, account_id: parseInt(accountId, 10) })
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      cache.players = null; // Invalidate
      return data[0];
    } catch (err) {
      console.error('Error creating player:', err);
      throw err;
    }
  },

  async updatePlayer(playerId, name) {
    try {
      const res = await fetch(`${SUPABASE_BASE_URL}/Players?id=eq.${playerId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      cache.players = null; // Invalidate
      return data[0];
    } catch (err) {
      console.error('Error updating player:', err);
      throw err;
    }
  },

  // Games
  async getGames(forceRefresh = false) {
    if (!forceRefresh && isCacheValid('games')) return cache.games;
    try {
      const res = await fetch(`${SUPABASE_BASE_URL}/Games?select=*&order=start_date.asc,id.asc`, { headers });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      cache.games = data;
      cache.lastFetch.games = Date.now();
      return data;
    } catch (err) {
      console.error('Error fetching games:', err);
      return cache.games || [];
    }
  },

  async createGame(homeTeam, awayTeam, startDate, startTime = null) {
    try {
      const res = await fetch(`${SUPABASE_BASE_URL}/Games`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          home_team: homeTeam,
          away_team: awayTeam,
          start_date: startDate,
          start_time: startTime || null,
          game_finished: false
        })
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      cache.games = null; // Invalidate
      return data[0];
    } catch (err) {
      console.error('Error creating game:', err);
      throw err;
    }
  },

  async updateGameScore(gameId, homeScore, awayScore, isFinished = true) {
    try {
      const res = await fetch(`${SUPABASE_BASE_URL}/Games?id=eq.${gameId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          home_score: parseInt(homeScore, 10),
          away_score: parseInt(awayScore, 10),
          game_finished: Boolean(isFinished)
        })
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      cache.games = null; // Invalidate
      return data[0];
    } catch (err) {
      console.error('Error updating game score:', err);
      throw err;
    }
  },

  // Guesses
  async getGuesses(forceRefresh = false) {
    if (!forceRefresh && isCacheValid('guesses')) return cache.guesses;
    try {
      const res = await fetch(`${SUPABASE_BASE_URL}/Guesses?select=*`, { headers });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      cache.guesses = data;
      cache.lastFetch.guesses = Date.now();
      return data;
    } catch (err) {
      console.error('Error fetching guesses:', err);
      return cache.guesses || [];
    }
  },

  async upsertGuess(gameId, playerId, homeGuess, awayGuess) {
    try {
      // Check if guess exists
      const existingRes = await fetch(`${SUPABASE_BASE_URL}/Guesses?game_id=eq.${gameId}&player_id=eq.${playerId}`, { headers });
      const existing = await existingRes.json();

      let res;
      if (existing && existing.length > 0) {
        // Update
        res = await fetch(`${SUPABASE_BASE_URL}/Guesses?id=eq.${existing[0].id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            home: parseInt(homeGuess, 10),
            away: parseInt(awayGuess, 10)
          })
        });
      } else {
        // Insert
        res = await fetch(`${SUPABASE_BASE_URL}/Guesses`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            game_id: parseInt(gameId, 10),
            player_id: parseInt(playerId, 10),
            home: parseInt(homeGuess, 10),
            away: parseInt(awayGuess, 10)
          })
        });
      }
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      cache.guesses = null; // Invalidate
      return data[0];
    } catch (err) {
      console.error('Error upserting guess:', err);
      throw err;
    }
  }
};
