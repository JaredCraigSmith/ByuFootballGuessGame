// BYU Football Guess Game - Scoring Engine & Leaderboard Logic Unit Tests
import './setup.js';
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  PRESET_PLAYER_COLORS,
  getPlayerColor,
  savePlayerColor,
  hexToRgba,
  isGameFinished,
  EXPONENTIAL_CONFIG,
  getDecaySigma,
  calculateExponentialScore,
  calculateGuessPoints,
  calculatePointsFromDiff,
  calculateCumulativePoints,
  computeLeaderboard,
  computeWeeklyLeaderboard,
  getGameStartTimestamp,
  getDefaultFocusedGame
} from '../js/scoring.js';

describe('Player Color & Styling Helpers', () => {
  it('should provide at least 10 preset colors', () => {
    assert.ok(Array.isArray(PRESET_PLAYER_COLORS));
    assert.ok(PRESET_PLAYER_COLORS.length >= 10);
    assert.match(PRESET_PLAYER_COLORS[0], /^#[0-9A-Fa-f]{6}$/);
  });

  it('should get default color deterministically by player ID', () => {
    localStorage.clear();
    const color0 = getPlayerColor(0);
    const color1 = getPlayerColor(1);
    const colorWrap = getPlayerColor(PRESET_PLAYER_COLORS.length);

    assert.equal(color0, PRESET_PLAYER_COLORS[0]);
    assert.equal(color1, PRESET_PLAYER_COLORS[1]);
    assert.equal(colorWrap, PRESET_PLAYER_COLORS[0]);
  });

  it('should save and retrieve custom player color from localStorage', () => {
    localStorage.clear();
    savePlayerColor(42, '#FF0099');
    const retrieved = getPlayerColor(42);
    assert.equal(retrieved, '#FF0099');
  });

  it('should convert 6-character hex to rgba with specified alpha', () => {
    const rgba = hexToRgba('#0062B8', 0.5);
    assert.equal(rgba, 'rgba(0, 98, 184, 0.5)');
  });

  it('should convert 3-character hex to rgba correctly', () => {
    const rgba = hexToRgba('#FFF', 1);
    assert.equal(rgba, 'rgba(255, 255, 255, 1)');
  });

  it('should handle invalid or null hex safely with fallback', () => {
    const fallback1 = hexToRgba(null, 0.3);
    const fallback2 = hexToRgba('invalid', 0.4);
    assert.equal(fallback1, 'rgba(0, 98, 184, 0.3)');
    assert.equal(fallback2, 'rgba(0, 98, 184, 0.4)');
  });
});

describe('Game Status Helpers', () => {
  it('should correctly identify finished games', () => {
    assert.equal(isGameFinished({ game_finished: true }), true);
    assert.equal(isGameFinished({ is_finished: true }), true);
    assert.equal(isGameFinished({ game_finished: false }), false);
    assert.equal(isGameFinished({}), false);
    assert.equal(isGameFinished(null), false);
  });
});

describe('Exponential Scoring Mathematical Calculations', () => {
  it('should calculate Game 1 perfect prediction as exactly 250 points', () => {
    const score = calculateExponentialScore(0, 0, {
      game1Max: 250,
      lastGameMax: 500,
      totalGames: 14,
      hasWinnerBonus: false,
      zeroIndexed: true
    });
    assert.equal(score, 250);
  });

  it('should calculate Game 14 perfect prediction as exactly 500 points', () => {
    const score = calculateExponentialScore(0, 13, {
      game1Max: 250,
      lastGameMax: 500,
      totalGames: 14,
      hasWinnerBonus: false,
      zeroIndexed: true
    });
    assert.equal(score, 500);
  });

  it('should award approximately 150 points for 14 points off in Game 1', () => {
    const score = calculateExponentialScore(14, 0, {
      game1Max: 250,
      lastGameMax: 500,
      targetDiff14: 150,
      curvePower: 2.0,
      hasWinnerBonus: false,
      zeroIndexed: true
    });
    // Target is 150 (allow +/- 1 due to rounding)
    assert.ok(Math.abs(score - 150) <= 1, `Expected ~150, got ${score}`);
  });

  it('should award winner bonus points when hasWinnerBonus is true', () => {
    const noBonus = calculateExponentialScore(7, 0, { hasWinnerBonus: false, winnerBonusPts: 15 });
    const withBonus = calculateExponentialScore(7, 0, { hasWinnerBonus: true, winnerBonusPts: 15 });
    assert.equal(withBonus, noBonus + 15);
  });

  it('should smoothly decay points as score difference increases', () => {
    const diff0 = calculateExponentialScore(0, 0);
    const diff7 = calculateExponentialScore(7, 0);
    const diff14 = calculateExponentialScore(14, 0);
    const diff28 = calculateExponentialScore(28, 0);
    const diff40 = calculateExponentialScore(40, 0);

    assert.ok(diff0 > diff7, 'Diff 0 should beat Diff 7');
    assert.ok(diff7 > diff14, 'Diff 7 should beat Diff 14');
    assert.ok(diff14 > diff28, 'Diff 14 should beat Diff 28');
    assert.ok(diff28 >= diff40, 'Diff 28 should beat or equal Diff 40');
    assert.ok(diff40 >= 0, 'Score should never be negative');
  });

  it('should handle negative diff safely as 0 diff', () => {
    const normal0 = calculateExponentialScore(0, 0);
    const negativeDiff = calculateExponentialScore(-5, 0);
    assert.equal(negativeDiff, normal0);
  });

  it('should support 1-indexed game numbering when zeroIndexed is false', () => {
    const scoreGame1 = calculateExponentialScore(0, 1, { zeroIndexed: false });
    assert.equal(scoreGame1, 250);

    const scoreGame14 = calculateExponentialScore(0, 14, { zeroIndexed: false });
    assert.equal(scoreGame14, 500);
  });

  it('should clamp out-of-bounds game indices safely', () => {
    const scoreLow = calculateExponentialScore(0, -10, { zeroIndexed: true });
    assert.equal(scoreLow, 250, 'Out-of-bounds low index should clamp to Game 1');

    const scoreHigh = calculateExponentialScore(0, 999, { zeroIndexed: true });
    assert.equal(scoreHigh, 500, 'Out-of-bounds high index should clamp to Game 14');
  });

  it('should calculate decay sigma properly and clamp ratios', () => {
    const sigmaDefault = getDecaySigma(250, 150, 2.0);
    assert.ok(Number.isFinite(sigmaDefault) && sigmaDefault > 0);

    // Clamped low
    const sigmaLow = getDecaySigma(1000, 1, 2.0);
    assert.ok(Number.isFinite(sigmaLow));

    // Clamped high
    const sigmaHigh = getDecaySigma(100, 99, 2.0);
    assert.ok(Number.isFinite(sigmaHigh));
  });
});

describe('calculateGuessPoints Function', () => {
  it('should return null if game is unfinished and has no scores', () => {
    const game = { home_score: null, away_score: null, game_finished: false };
    const guess = { home: 35, away: 21 };
    assert.equal(calculateGuessPoints(guess, game, 0), null);
  });

  it('should return null if guess values are missing', () => {
    const game = { home_score: 35, away_score: 21, game_finished: true };
    assert.equal(calculateGuessPoints({ home: null, away: 21 }, game, 0), null);
    assert.equal(calculateGuessPoints({ home: 35, away: null }, game, 0), null);
  });

  it('should award exact points and winner bonus for perfect prediction', () => {
    const game = { home_score: 35, away_score: 21, game_finished: true };
    const guess = { home: 35, away: 21 };
    const points = calculateGuessPoints(guess, game, 0); // Game 1
    // Game 1 Max is 250 + 15 winner bonus = 265
    assert.equal(points, 265);
  });

  it('should award winner bonus when user picks the correct winner', () => {
    // BYU (home) wins 31-28
    const game = { home_score: 31, away_score: 28, game_finished: true };
    // Guess has BYU winning 24-21 (diff = 7 + 7 = 14)
    const guessWithBonus = { home: 24, away: 21 };
    // Guess has opponent winning 21-24 (diff = 10 + 4 = 14)
    const guessWithoutBonus = { home: 21, away: 24 };

    const ptsWith = calculateGuessPoints(guessWithBonus, game, 0);
    const ptsWithout = calculateGuessPoints(guessWithoutBonus, game, 0);

    assert.ok(ptsWith > ptsWithout, 'Correct winner pick should earn more points for equal diff');
  });

  it('should not award winner bonus in case of a tie game', () => {
    const game = { home_score: 24, away_score: 24, game_finished: true };
    const guess = { home: 24, away: 24 };
    const points = calculateGuessPoints(guess, game, 0);
    // Diff is 0, points should be 250 without the 15 bonus
    assert.equal(points, 250);
  });
});

describe('calculateCumulativePoints & Dropped Scores Rules', () => {
  it('should calculate raw sum correctly when applyDrops is false', () => {
    const { perGameScores, cumulativeScores } = calculateCumulativePoints(0, 14, {
      hasWinnerBonus: false,
      applyDrops: false
    });

    assert.equal(perGameScores.length, 14);
    assert.equal(cumulativeScores.length, 14);
    assert.equal(cumulativeScores[0], perGameScores[0]);
    assert.equal(cumulativeScores[13], perGameScores.reduce((a, b) => a + b, 0));
  });

  it('should apply official drop rules progressively across the season', () => {
    // Simulate game scores: [100, 100, 50, 40, 100, 100, 30, 100, ...]
    const { cumulativeScores } = calculateCumulativePoints(14, 8, {
      applyDrops: true
    });

    assert.equal(cumulativeScores.length, 8);
    // Cumulative scores should exist for all games
    for (let i = 0; i < cumulativeScores.length; i++) {
      assert.ok(typeof cumulativeScores[i] === 'number');
      assert.ok(cumulativeScores[i] > 0);
    }
  });
});

describe('computeLeaderboard Function', () => {
  const sampleAccounts = [
    { id: 1, name: "J&J Smith's" },
    { id: 2, name: "Taylor Family" }
  ];

  const samplePlayers = [
    { id: 101, name: "Jared", account_id: 1 },
    { id: 102, name: "Julie", account_id: 1 },
    { id: 103, name: "Zach", account_id: 2 }
  ];

  it('should sort standings in descending order of total score and assign ranks', () => {
    const completedGames = [
      { id: 1, home_score: 35, away_score: 21, game_finished: true, start_date: '2026-09-05' },
      { id: 2, home_score: 28, away_score: 24, game_finished: true, start_date: '2026-09-12' }
    ];

    const guesses = [
      { game_id: 1, player_id: 101, home: 35, away: 21 }, // Perfect!
      { game_id: 2, player_id: 101, home: 28, away: 24 }, // Perfect!
      { game_id: 1, player_id: 102, home: 20, away: 10 },
      { game_id: 2, player_id: 102, home: 20, away: 10 },
      { game_id: 1, player_id: 103, home: 0, away: 50 },  // Bad guess
      { game_id: 2, player_id: 103, home: 0, away: 50 }
    ];

    const result = computeLeaderboard(samplePlayers, completedGames, guesses, sampleAccounts);

    assert.equal(result.standings.length, 3);
    assert.equal(result.standings[0].playerId, 101, 'Jared should be rank 1');
    assert.equal(result.standings[0].rank, 1);
    assert.equal(result.standings[1].rank, 2);
    assert.equal(result.standings[2].rank, 3);
    assert.ok(result.standings[0].totalScore > result.standings[1].totalScore);
    assert.ok(result.standings[1].totalScore > result.standings[2].totalScore);
  });

  it('should count exact hits accurately', () => {
    const completedGames = [
      { id: 1, home_score: 35, away_score: 21, game_finished: true, start_date: '2026-09-05' },
      { id: 2, home_score: 28, away_score: 24, game_finished: true, start_date: '2026-09-12' }
    ];

    const guesses = [
      { game_id: 1, player_id: 101, home: 35, away: 21 }, // Exact hit 1
      { game_id: 2, player_id: 101, home: 28, away: 24 }  // Exact hit 2
    ];

    const result = computeLeaderboard([samplePlayers[0]], completedGames, guesses, sampleAccounts);
    assert.equal(result.standings[0].exactHits, 2);
    assert.equal(result.standings[0].isOnFire, true);
  });

  it('should drop 1 lowest score when exactly 3 completed games exist', () => {
    const threeGames = [
      { id: 1, home_score: 35, away_score: 21, game_finished: true, start_date: '2026-09-05' },
      { id: 2, home_score: 28, away_score: 24, game_finished: true, start_date: '2026-09-12' },
      { id: 3, home_score: 14, away_score: 10, game_finished: true, start_date: '2026-09-19' }
    ];

    // Player made 2 good guesses and 1 terrible guess (diff 50)
    const guesses = [
      { game_id: 1, player_id: 101, home: 35, away: 21 },
      { game_id: 2, player_id: 101, home: 28, away: 24 },
      { game_id: 3, player_id: 101, home: 70, away: 60 } // Terrible score
    ];

    const result = computeLeaderboard([samplePlayers[0]], threeGames, guesses, sampleAccounts);
    assert.equal(result.dropsAllowed, 1);
    assert.equal(result.standings[0].droppedScores.length, 1);
    // Dropped score should be the lowest score
    assert.ok(result.standings[0].droppedScores[0] < result.standings[0].gameScores[0]);
  });

  it('should drop 2 lowest scores when 4 to 6 completed games exist', () => {
    const fiveGames = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      home_score: 30,
      away_score: 20,
      game_finished: true,
      start_date: `2026-09-${String(i + 1).padStart(2, '0')}`
    }));

    const guesses = fiveGames.map(g => ({
      game_id: g.id,
      player_id: 101,
      home: 30,
      away: 20
    }));

    const result = computeLeaderboard([samplePlayers[0]], fiveGames, guesses, sampleAccounts);
    assert.equal(result.dropsAllowed, 2);
    assert.equal(result.standings[0].droppedScores.length, 2);
  });

  it('should drop 3 lowest scores when 7 or more completed games exist', () => {
    const eightGames = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      home_score: 30,
      away_score: 20,
      game_finished: true,
      start_date: `2026-09-${String(i + 1).padStart(2, '0')}`
    }));

    const guesses = eightGames.map(g => ({
      game_id: g.id,
      player_id: 101,
      home: 30,
      away: 20
    }));

    const result = computeLeaderboard([samplePlayers[0]], eightGames, guesses, sampleAccounts);
    assert.equal(result.dropsAllowed, 3);
    assert.equal(result.standings[0].droppedScores.length, 3);
  });

  it('CRITICAL: must ISOLATE live games so live scores do NOT alter totalScore or rank', () => {
    const games = [
      // 1 Completed Game
      { id: 1, home_score: 35, away_score: 21, game_finished: true, start_date: '2026-09-05' },
      // 1 In-Progress / Live Game (scores entered, but game_finished = false)
      { id: 2, home_score: 21, away_score: 7, game_finished: false, start_date: '2026-09-12' }
    ];

    const guesses = [
      // Player 1 got perfect on Game 1 (completed)
      { game_id: 1, player_id: 101, home: 35, away: 21 },
      { game_id: 2, player_id: 101, home: 0, away: 50 }, // Bad live guess

      // Player 2 got 0 on Game 1 (completed)
      { game_id: 1, player_id: 102, home: 0, away: 50 },
      { game_id: 2, player_id: 102, home: 21, away: 7 }  // Perfect live guess!
    ];

    const result = computeLeaderboard(
      [samplePlayers[0], samplePlayers[1]],
      games,
      guesses,
      sampleAccounts
    );

    // Live game must be identified
    assert.ok(result.liveGame);
    assert.equal(result.liveGame.id, 2);

    // Completed game count must be 1, NOT 2
    assert.equal(result.completedGamesCount, 1);

    // Player 1 MUST stay Rank 1 in official standings because Game 2 is still live!
    assert.equal(result.standings[0].playerId, 101);
    assert.equal(result.standings[0].rank, 1);

    // Live points must be populated separately in liveGameScore without contaminating totalScore
    const p1 = result.standings.find(s => s.playerId === 101);
    const p2 = result.standings.find(s => s.playerId === 102);

    assert.ok(p2.liveGameScore > 0, 'Player 2 should have pending live points');
    assert.equal(p2.liveExactHit, true, 'Player 2 should have pending live exact hit');
    assert.equal(p2.totalScore, 0, 'Player 2 official totalScore must remain 0 from completed games');
  });
});

describe('computeWeeklyLeaderboard Function', () => {
  const sampleAccounts = [{ id: 1, name: "J&J Smith's" }];
  const samplePlayers = [
    { id: 101, name: "Jared", account_id: 1 },
    { id: 102, name: "Julie", account_id: 1 }
  ];

  it('should rank players for a completed game by score descending', () => {
    const games = [
      { id: 201, home_score: 35, away_score: 21, game_finished: true }
    ];
    const guesses = [
      { game_id: 201, player_id: 101, home: 35, away: 21 }, // Perfect: 265
      { game_id: 201, player_id: 102, home: 28, away: 24 }  // Lower
    ];

    const result = computeWeeklyLeaderboard(201, samplePlayers, games, guesses, sampleAccounts);
    assert.equal(result.isCompleted, true);
    assert.equal(result.isLive, false);
    assert.equal(result.standings[0].playerId, 101);
    assert.equal(result.standings[0].exactHit, true);
    assert.equal(result.standings[0].score, 265);
    assert.equal(result.standings[0].rank, 1);
  });

  it('should mark game as live when score exists but game is not finished', () => {
    const games = [
      { id: 202, home_score: 14, away_score: 7, game_finished: false }
    ];
    const guesses = [
      { game_id: 202, player_id: 101, home: 14, away: 7 }
    ];

    const result = computeWeeklyLeaderboard(202, samplePlayers, games, guesses, sampleAccounts);
    assert.equal(result.isLive, true);
    assert.equal(result.isCompleted, false);
  });

  it('should show Pending or No Guess for games that have not started', () => {
    const games = [
      { id: 203, home_score: null, away_score: null, game_finished: false }
    ];
    const guesses = [
      { game_id: 203, player_id: 101, home: 35, away: 28 } // Guess submitted
      // Julie has no guess
    ];

    const result = computeWeeklyLeaderboard(203, samplePlayers, games, guesses, sampleAccounts);
    const jared = result.standings.find(s => s.playerId === 101);
    const julie = result.standings.find(s => s.playerId === 102);

    assert.equal(jared.score, 'Pending');
    assert.equal(julie.score, 'No Guess');
  });
});

describe('getGameStartTimestamp & getDefaultFocusedGame', () => {
  it('should parse start_date and start_time with timezone offsets', () => {
    const game = {
      start_date: '2026-09-05',
      start_time: '19:30:00-06'
    };
    const ts = getGameStartTimestamp(game);
    assert.ok(ts > 0);
    const d = new Date(ts);
    assert.equal(d.getFullYear(), 2026);
    assert.equal(d.getMonth(), 8); // September is month 8 (0-indexed)
    assert.equal(d.getDate(), 5);
    assert.equal(d.getHours(), 19);
    assert.equal(d.getMinutes(), 30);
  });

  it('should default to 7:00 PM if start_time is missing or TBD', () => {
    const game = { start_date: '2026-10-10', start_time: null };
    const ts = getGameStartTimestamp(game);
    const d = new Date(ts);
    assert.equal(d.getHours(), 19);
    assert.equal(d.getMinutes(), 0);
  });

  it('should focus on live game if one is in progress', () => {
    const games = [
      { id: 1, start_date: '2026-09-05', home_score: 30, away_score: 10, game_finished: true },
      { id: 2, start_date: '2026-09-12', home_score: 14, away_score: 7, game_finished: false }, // LIVE
      { id: 3, start_date: '2026-09-19', home_score: null, away_score: null, game_finished: false }
    ];

    const focused = getDefaultFocusedGame(games);
    assert.equal(focused.id, 2, 'Should focus on live game');
  });

  it('should focus on recently finished game within 3-day buffer', () => {
    const now = new Date(2026, 8, 7, 12, 0).getTime(); // 2 days after Game 1
    const games = [
      { id: 1, start_date: '2026-09-05', start_time: '19:00:00', home_score: 35, away_score: 21, game_finished: true },
      { id: 2, start_date: '2026-09-12', start_time: '19:00:00', home_score: null, away_score: null, game_finished: false }
    ];

    const focused = getDefaultFocusedGame(games, now);
    assert.equal(focused.id, 1, 'Should focus on Game 1 within 3-day buffer window');
  });

  it('should advance to next upcoming game once 3-day buffer expires', () => {
    const now = new Date(2026, 8, 10, 12, 0).getTime(); // 5 days after Game 1 (buffer expired)
    const games = [
      { id: 1, start_date: '2026-09-05', start_time: '19:00:00', home_score: 35, away_score: 21, game_finished: true },
      { id: 2, start_date: '2026-09-12', start_time: '19:00:00', home_score: null, away_score: null, game_finished: false }
    ];

    const focused = getDefaultFocusedGame(games, now);
    assert.equal(focused.id, 2, 'Should advance to Game 2 after buffer expired');
  });
});
