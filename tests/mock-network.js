// BYU Football Guess Game - Network Safety Guard & Mock Layer
// This file enforces that NO tests ever communicate with or modify the live Supabase database.

// In-Memory LocalStorage Mock for Node / Non-Browser Environments
export class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(String(key)) ? this.store.get(String(key)) : null;
  }
  setItem(key, value) {
    this.store.set(String(key), String(value));
  }
  removeItem(key) {
    this.store.delete(String(key));
  }
  clear() {
    this.store.clear();
  }
  key(n) {
    return Array.from(this.store.keys())[n] || null;
  }
  get length() {
    return this.store.size;
  }
}

// In-Memory Database Fixture
export function createSampleDatabase() {
  return {
    accounts: [
      { id: 1, name: "J&J Smith's", pin: 1234, is_admin: true, created_at: "2026-08-01T12:00:00Z" },
      { id: 2, name: "Taylor Family", pin: 4321, is_admin: false, created_at: "2026-08-02T12:00:00Z" },
      { id: 3, name: "Solo Fan", pin: 9999, is_admin: false, created_at: "2026-08-03T12:00:00Z" }
    ],
    players: [
      { id: 101, name: "Jared", account_id: 1, color: "🦁", created_at: "2026-08-01T12:00:00Z" },
      { id: 102, name: "Julie", account_id: 1, color: "🌸", created_at: "2026-08-01T12:00:00Z" },
      { id: 103, name: "Zach", account_id: 2, color: "⚡", created_at: "2026-08-02T12:00:00Z" },
      { id: 104, name: "Emma", account_id: 2, color: "⭐", created_at: "2026-08-02T12:00:00Z" }
    ],
    games: [
      {
        id: 201,
        home_team: "BYU",
        away_team: "Utah Tech",
        start_date: "2026-09-05",
        start_time: "19:00:00-06",
        home_score: 45,
        away_score: 10,
        game_finished: true
      },
      {
        id: 202,
        home_team: "BYU",
        away_team: "Baylor",
        start_date: "2026-09-12",
        start_time: "20:15:00-06",
        home_score: 28,
        away_score: 24,
        game_finished: true
      },
      {
        id: 203,
        home_team: "Arizona",
        away_team: "BYU",
        start_date: "2026-09-19",
        start_time: "18:00:00-07",
        home_score: null,
        away_score: null,
        game_finished: false
      }
    ],
    guesses: [
      { id: 301, game_id: 201, player_id: 101, home: 45, away: 10 }, // Exact hit!
      { id: 302, game_id: 201, player_id: 102, home: 38, away: 14 },
      { id: 303, game_id: 201, player_id: 103, home: 42, away: 7 },
      { id: 304, game_id: 202, player_id: 101, home: 27, away: 20 },
      { id: 305, game_id: 202, player_id: 102, home: 31, away: 17 }
    ]
  };
}

// Network Mock Manager
class MockNetwork {
  constructor() {
    this.originalFetch = null;
    this.routes = [];
    this.recordedRequests = [];
    this.db = createSampleDatabase();
  }

  install() {
    if (!this.originalFetch && typeof globalThis.fetch === 'function') {
      this.originalFetch = globalThis.fetch;
    }

    if (typeof globalThis.localStorage === 'undefined') {
      globalThis.localStorage = new MockLocalStorage();
    }

    // Replace global fetch with safety-enforced mock
    globalThis.fetch = async (url, options = {}) => {
      const urlStr = String(url);
      const method = (options.method || 'GET').toUpperCase();
      const headers = options.headers || {};
      let parsedBody = null;

      if (options.body) {
        try {
          parsedBody = JSON.parse(options.body);
        } catch (e) {
          parsedBody = options.body;
        }
      }

      const record = {
        url: urlStr,
        method,
        headers,
        body: parsedBody,
        timestamp: Date.now()
      };
      this.recordedRequests.push(record);

      // Check routes
      for (const route of this.routes) {
        if (route.method === method && route.matches(urlStr)) {
          return route.handler(urlStr, options, parsedBody);
        }
      }

      // STRICT SAFETY: If hitting the Supabase domain without an explicit mock handler, BLOCK IT!
      if (urlStr.includes('supabase.co')) {
        const errorMsg = `[CRITICAL SAFETY GUARD] Blocked live Supabase database request: ${method} ${urlStr}. Unit tests must never contact or modify the production database!`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Default 404 response for any unhandled URL
      return new Response(JSON.stringify({ error: `Not found: ${method} ${urlStr}` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    };
  }

  uninstall() {
    if (this.originalFetch) {
      globalThis.fetch = this.originalFetch;
      this.originalFetch = null;
    }
  }

  reset() {
    this.routes = [];
    this.recordedRequests = [];
    this.db = createSampleDatabase();
    if (globalThis.localStorage && typeof globalThis.localStorage.clear === 'function') {
      globalThis.localStorage.clear();
    }
  }

  addRoute(method, matcher, handler) {
    const isRegex = matcher instanceof RegExp;
    this.routes.push({
      method: method.toUpperCase(),
      matches: (url) => isRegex ? matcher.test(url) : url.includes(matcher),
      handler
    });
  }

  getRecordedRequests() {
    return [...this.recordedRequests];
  }

  // Set up standard mock REST API handlers for Supabase
  setupStandardSupabaseMocks() {
    // 1. Accounts GET
    this.addRoute('GET', '/Accounts', (url) => {
      return new Response(JSON.stringify(this.db.accounts), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    // 2. Accounts POST (Create)
    this.addRoute('POST', '/Accounts', (url, options, body) => {
      const newAcc = {
        id: this.db.accounts.length + 1,
        name: body.name,
        pin: body.pin,
        is_admin: Boolean(body.is_admin),
        created_at: new Date().toISOString()
      };
      this.db.accounts.push(newAcc);
      return new Response(JSON.stringify([newAcc]), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    // 3. Players GET
    this.addRoute('GET', '/Players', (url) => {
      return new Response(JSON.stringify(this.db.players), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    // 4. Players POST (Create)
    this.addRoute('POST', '/Players', (url, options, body) => {
      const newPlayer = {
        id: 100 + this.db.players.length + 1,
        name: body.name,
        account_id: body.account_id,
        created_at: new Date().toISOString()
      };
      this.db.players.push(newPlayer);
      return new Response(JSON.stringify([newPlayer]), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    // 5. Players PATCH (Update)
    this.addRoute('PATCH', '/Players', (url, options, body) => {
      const idMatch = url.match(/id=eq\.(\d+)/);
      const id = idMatch ? parseInt(idMatch[1], 10) : null;
      const player = this.db.players.find(p => p.id === id);
      if (player) {
        if (body.name !== undefined) player.name = body.name;
        return new Response(JSON.stringify([player]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    // 6. Games GET
    this.addRoute('GET', '/Games', (url) => {
      return new Response(JSON.stringify(this.db.games), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    // 7. Games POST (Create)
    this.addRoute('POST', '/Games', (url, options, body) => {
      const newGame = {
        id: 200 + this.db.games.length + 1,
        home_team: body.home_team,
        away_team: body.away_team,
        start_date: body.start_date,
        start_time: body.start_time || null,
        home_score: null,
        away_score: null,
        game_finished: false,
        created_at: new Date().toISOString()
      };
      this.db.games.push(newGame);
      return new Response(JSON.stringify([newGame]), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    // 8. Games PATCH (Update Score)
    this.addRoute('PATCH', '/Games', (url, options, body) => {
      const idMatch = url.match(/id=eq\.(\d+)/);
      const id = idMatch ? parseInt(idMatch[1], 10) : null;
      const game = this.db.games.find(g => g.id === id);
      if (game) {
        if (body.home_score !== undefined) game.home_score = body.home_score;
        if (body.away_score !== undefined) game.away_score = body.away_score;
        if (body.game_finished !== undefined) game.game_finished = body.game_finished;
        return new Response(JSON.stringify([game]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    // 9. Guesses GET
    this.addRoute('GET', '/Guesses', (url) => {
      // Handle ?game_id=eq.X&player_id=eq.Y
      const gameMatch = url.match(/game_id=eq\.(\d+)/);
      const playerMatch = url.match(/player_id=eq\.(\d+)/);

      if (gameMatch && playerMatch) {
        const gameId = parseInt(gameMatch[1], 10);
        const playerId = parseInt(playerMatch[1], 10);
        const match = this.db.guesses.filter(g => g.game_id === gameId && g.player_id === playerId);
        return new Response(JSON.stringify(match), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(this.db.guesses), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    // 10. Guesses POST (Insert)
    this.addRoute('POST', '/Guesses', (url, options, body) => {
      const newGuess = {
        id: 300 + this.db.guesses.length + 1,
        game_id: body.game_id,
        player_id: body.player_id,
        home: body.home,
        away: body.away,
        created_at: new Date().toISOString()
      };
      this.db.guesses.push(newGuess);
      return new Response(JSON.stringify([newGuess]), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    // 11. Guesses PATCH (Update)
    this.addRoute('PATCH', '/Guesses', (url, options, body) => {
      const idMatch = url.match(/id=eq\.(\d+)/);
      const id = idMatch ? parseInt(idMatch[1], 10) : null;
      const guess = this.db.guesses.find(g => g.id === id);
      if (guess) {
        if (body.home !== undefined) guess.home = body.home;
        if (body.away !== undefined) guess.away = body.away;
        return new Response(JSON.stringify([guess]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });
  }
}

export const mockNetwork = new MockNetwork();
