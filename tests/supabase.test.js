// BYU Football Guess Game - Supabase API Service Unit Tests
// STRICT REQUIREMENT: ZERO LIVE DATABASE REQUESTS OR MUTATIONS.
// All interactions are intercepted by mockNetwork and simulated in memory.

import './setup.js';
import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { mockNetwork } from './mock-network.js';
import { SupabaseAPI } from '../js/supabase.js';

describe('Supabase API Client - Zero Database Mutation & Security Guards', () => {
  beforeEach(() => {
    mockNetwork.reset();
    mockNetwork.setupStandardSupabaseMocks();
  });

  it('CRITICAL: Should block any unmocked live requests to Supabase to protect database', async () => {
    // Temporarily remove routes to verify guard
    mockNetwork.routes = [];
    await assert.rejects(
      async () => {
        await globalThis.fetch('https://djqeavbyehrcbczvqgat.supabase.co/rest/v1/DangerousMutation', {
          method: 'DELETE'
        });
      },
      (err) => {
        assert.match(err.message, /\[CRITICAL SAFETY GUARD\] Blocked live Supabase database request/);
        return true;
      }
    );
  });
});

describe('Supabase API - Accounts Endpoint', () => {
  beforeEach(() => {
    mockNetwork.reset();
    mockNetwork.setupStandardSupabaseMocks();
  });

  it('should fetch accounts with correct headers and query parameters', async () => {
    const accounts = await SupabaseAPI.getAccounts(true);
    assert.ok(Array.isArray(accounts));
    assert.ok(accounts.length >= 2);

    const recorded = mockNetwork.getRecordedRequests();
    const getReq = recorded.find(r => r.url.includes('/Accounts'));
    assert.ok(getReq, 'Should have made a GET request to /Accounts');
    assert.equal(getReq.method, 'GET');
    assert.ok(getReq.url.includes('select=*'));
    assert.ok(getReq.url.includes('order=id.asc'));
    assert.ok(getReq.headers['apikey'], 'Should supply apikey');
    assert.ok(getReq.headers['Authorization'], 'Should supply Authorization bearer');
  });

  it('should cache accounts and not re-fetch on immediate second call', async () => {
    const call1 = await SupabaseAPI.getAccounts(true);
    const initialRequestCount = mockNetwork.getRecordedRequests().length;

    const call2 = await SupabaseAPI.getAccounts(false);
    const secondRequestCount = mockNetwork.getRecordedRequests().length;

    assert.equal(secondRequestCount, initialRequestCount, 'Second call should use memory cache without fetch');
    assert.deepEqual(call1, call2);
  });

  it('should fallback to localStorage backup if network request fails', async () => {
    // Seed localStorage backup
    const backupAccounts = [{ id: 99, name: 'Offline Backup Family', pin: 1111 }];
    localStorage.setItem('byu_guess_accounts_backup', JSON.stringify(backupAccounts));

    // Force route to return error
    mockNetwork.routes = [];
    mockNetwork.addRoute('GET', '/Accounts', () => {
      return new Response('Network Failure', { status: 500 });
    });

    const accounts = await SupabaseAPI.getAccounts(true);
    assert.equal(accounts.length, 1);
    assert.equal(accounts[0].name, 'Offline Backup Family');
  });

  it('should create account with parsed integer pin and invalidate cache', async () => {
    const newAcc = await SupabaseAPI.createAccount("New Test Account", "5555");
    assert.ok(newAcc);
    assert.equal(newAcc.name, "New Test Account");
    assert.equal(newAcc.pin, 5555);

    const recorded = mockNetwork.getRecordedRequests();
    const postReq = recorded.find(r => r.method === 'POST' && r.url.includes('/Accounts'));
    assert.ok(postReq, 'Should send POST request');
    assert.deepEqual(postReq.body, {
      name: "New Test Account",
      pin: 5555,
      is_admin: false
    });
  });
});

describe('Supabase API - Players Endpoint', () => {
  beforeEach(() => {
    mockNetwork.reset();
    mockNetwork.setupStandardSupabaseMocks();
  });

  it('should fetch players with order query', async () => {
    const players = await SupabaseAPI.getPlayers(true);
    assert.ok(Array.isArray(players));
    assert.ok(players.length >= 2);

    const recorded = mockNetwork.getRecordedRequests();
    const getReq = recorded.find(r => r.url.includes('/Players'));
    assert.equal(getReq.method, 'GET');
    assert.ok(getReq.url.includes('select=*'));
  });

  it('should create player with parsed integer account_id', async () => {
    const newPlayer = await SupabaseAPI.createPlayer("Cosmo Jr", "1");
    assert.ok(newPlayer);
    assert.equal(newPlayer.name, "Cosmo Jr");
    assert.equal(newPlayer.account_id, 1);

    const recorded = mockNetwork.getRecordedRequests();
    const postReq = recorded.find(r => r.method === 'POST' && r.url.includes('/Players'));
    assert.ok(postReq);
    assert.equal(postReq.body.name, "Cosmo Jr");
    assert.equal(postReq.body.account_id, 1);
  });

  it('should update player name via PATCH', async () => {
    const updated = await SupabaseAPI.updatePlayer(101, "Jared Renamed");
    assert.ok(updated);
    assert.equal(updated.name, "Jared Renamed");

    const recorded = mockNetwork.getRecordedRequests();
    const patchReq = recorded.find(r => r.method === 'PATCH' && r.url.includes('/Players?id=eq.101'));
    assert.ok(patchReq, 'Should send PATCH with id query param');
    assert.deepEqual(patchReq.body, { name: "Jared Renamed" });
  });
});

describe('Supabase API - Games & Scores Endpoint', () => {
  beforeEach(() => {
    mockNetwork.reset();
    mockNetwork.setupStandardSupabaseMocks();
  });

  it('should fetch games ordered by start_date and id', async () => {
    const games = await SupabaseAPI.getGames(true);
    assert.ok(Array.isArray(games));
    assert.ok(games.length >= 2);

    const recorded = mockNetwork.getRecordedRequests();
    const getReq = recorded.find(r => r.url.includes('/Games'));
    assert.ok(getReq.url.includes('order=start_date.asc,id.asc'));
  });

  it('should create new scheduled game with default game_finished = false', async () => {
    const newGame = await SupabaseAPI.createGame("BYU", "Utah", "2026-11-21", "18:00:00");
    assert.ok(newGame);
    assert.equal(newGame.home_team, "BYU");
    assert.equal(newGame.away_team, "Utah");
    assert.equal(newGame.start_date, "2026-11-21");
    assert.equal(newGame.start_time, "18:00:00");
    assert.equal(newGame.game_finished, false);

    const recorded = mockNetwork.getRecordedRequests();
    const postReq = recorded.find(r => r.method === 'POST' && r.url.includes('/Games'));
    assert.ok(postReq);
    assert.equal(postReq.body.game_finished, false);
  });

  it('should update game scores and finished status via PATCH', async () => {
    const updated = await SupabaseAPI.updateGameScore(201, "34", "27", true);
    assert.ok(updated);
    assert.equal(updated.home_score, 34);
    assert.equal(updated.away_score, 27);
    assert.equal(updated.game_finished, true);

    const recorded = mockNetwork.getRecordedRequests();
    const patchReq = recorded.find(r => r.method === 'PATCH' && r.url.includes('/Games?id=eq.201'));
    assert.ok(patchReq);
    assert.deepEqual(patchReq.body, {
      home_score: 34,
      away_score: 27,
      game_finished: true
    });
  });

  it('should support saving live in-progress game scores with isFinished = false', async () => {
    const liveUpdate = await SupabaseAPI.updateGameScore(203, "17", "14", false);
    assert.ok(liveUpdate);
    assert.equal(liveUpdate.home_score, 17);
    assert.equal(liveUpdate.away_score, 14);
    assert.equal(liveUpdate.game_finished, false);
  });
});

describe('Supabase API - Guesses Endpoint', () => {
  beforeEach(() => {
    mockNetwork.reset();
    mockNetwork.setupStandardSupabaseMocks();
  });

  it('should fetch all guesses', async () => {
    const guesses = await SupabaseAPI.getGuesses(true);
    assert.ok(Array.isArray(guesses));
    assert.ok(guesses.length >= 2);
  });

  it('should insert new guess when player has no existing guess for game', async () => {
    // Player 104 has no guess for game 203
    const result = await SupabaseAPI.upsertGuess(203, 104, "35", "21");
    assert.ok(result);
    assert.equal(result.home, 35);
    assert.equal(result.away, 21);

    const recorded = mockNetwork.getRecordedRequests();
    const postReq = recorded.find(r => r.method === 'POST' && r.url.includes('/Guesses'));
    assert.ok(postReq, 'Should send POST to /Guesses');
    assert.deepEqual(postReq.body, {
      game_id: 203,
      player_id: 104,
      home: 35,
      away: 21
    });
  });

  it('should update existing guess via PATCH when one already exists', async () => {
    // Player 101 already has guess id 301 for game 201 (45-10)
    const result = await SupabaseAPI.upsertGuess(201, 101, "49", "14");
    assert.ok(result);
    assert.equal(result.home, 49);
    assert.equal(result.away, 14);

    const recorded = mockNetwork.getRecordedRequests();
    const patchReq = recorded.find(r => r.method === 'PATCH' && r.url.includes('/Guesses?id=eq.301'));
    assert.ok(patchReq, 'Should send PATCH to /Guesses?id=eq.301');
    assert.deepEqual(patchReq.body, {
      home: 49,
      away: 14
    });
  });
});
