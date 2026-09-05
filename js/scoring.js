// BYU Football Guess Game - Scoring Algorithm & Leaderboard Logic

// Player Color Palette
export const PRESET_PLAYER_COLORS = [
  '#0062B8', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', 
  '#3B82F6', '#EF4444', '#14B8A6', '#6366F1', '#D97706',
  '#FFC72C', '#06B6D4'
];

export function getPlayerColor(playerId) {
  if (playerId) {
    const saved = localStorage.getItem('player_color_' + playerId);
    if (saved) return saved;
  }
  const index = (playerId || 0) % PRESET_PLAYER_COLORS.length;
  return PRESET_PLAYER_COLORS[index];
}

export function savePlayerColor(playerId, color) {
  if (playerId && color) {
    localStorage.setItem('player_color_' + playerId, color);
  }
}

export function hexToRgba(hex, alpha = 0.25) {
  if (!hex) return `rgba(0, 98, 184, ${alpha})`;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(0, 98, 184, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function isGameFinished(game) {
  if (!game) return false;
  return Boolean(game.game_finished || game.is_finished);
}

// Exponential Scoring Model Configuration Defaults
export const EXPONENTIAL_CONFIG = {
  game1Max: 250,        // Max points for Game 1 at Diff 0
  lastGameMax: 500,     // Max points for Game 14 at Diff 0
  totalGames: 14,       // Total season games
  targetDiff14: 150,    // Points awarded in Game 1 for being 14 points off (~150 pts)
  curvePower: 2.0,      // Exponential curve shape factor (2.0 = smooth bell curve, 1.0 = pure exponential)
  winnerBonusPts: 15    // Default winner bonus points
};

/**
 * Calculates decay constant sigma for targetDiff14
 */
export function getDecaySigma(game1Max = 250, targetDiff14 = 150, curvePower = 2.0) {
  const ratio = Math.max(0.01, Math.min(0.99, targetDiff14 / game1Max));
  return 14 / Math.pow(-Math.log(ratio), 1 / curvePower);
}

/**
 * Calculates exponential points for a game based on score difference and game number.
 */
export function calculateExponentialScore(totalDiff, gameIndex = 0, options = {}) {
  const {
    game1Max = EXPONENTIAL_CONFIG.game1Max,
    lastGameMax = EXPONENTIAL_CONFIG.lastGameMax,
    totalGames = EXPONENTIAL_CONFIG.totalGames,
    targetDiff14 = EXPONENTIAL_CONFIG.targetDiff14,
    curvePower = EXPONENTIAL_CONFIG.curvePower,
    hasWinnerBonus = false,
    winnerBonusPts = EXPONENTIAL_CONFIG.winnerBonusPts,
    zeroIndexed = true
  } = options;

  // Normalize game number to 1..totalGames
  const gameNumber = zeroIndexed ? (gameIndex + 1) : gameIndex;
  const clampedGame = Math.max(1, Math.min(totalGames, gameNumber));

  // 1. Exponential Game Progression: M(g) from game1Max to lastGameMax
  const maxPossiblePoints = game1Max * Math.pow(lastGameMax / game1Max, (clampedGame - 1) / Math.max(1, totalGames - 1));

  // 2. Exponential Decay based on targetDiff14 and curvePower
  const safeDiff = Math.max(0, totalDiff);
  let points = 0;

  if (safeDiff === 0) {
    points = Math.round(maxPossiblePoints);
  } else {
    // If a custom decaySigma is provided, use it, else calculate from targetDiff14 and curvePower
    const sigma = options.decaySigma || getDecaySigma(game1Max, targetDiff14, curvePower);
    const decayFactor = Math.exp(-Math.pow(safeDiff / sigma, curvePower));
    points = Math.round(maxPossiblePoints * decayFactor);
  }

  // 3. Winner bonus
  if (hasWinnerBonus) {
    points += winnerBonusPts;
  }

  return Math.max(0, points);
}

/**
 * Calculates game points for a guess against actual score using exponential model
 */
export function calculateGuessPoints(guess, game, gameIndex = 0) {
  const isFinished = isGameFinished(game) || (game.home_score !== null && game.away_score !== null);
  if (!isFinished || game.home_score === null || game.away_score === null || guess.home === null || guess.away === null) {
    return null;
  }

  const diffHome = Math.abs(game.home_score - guess.home);
  const diffAway = Math.abs(game.away_score - guess.away);
  const totalDiff = diffHome + diffAway;

  // Exact Winner Bonus
  const actualWinner = game.home_score > game.away_score ? 'home' : (game.home_score < game.away_score ? 'away' : 'tie');
  const guessWinner = guess.home > guess.away ? 'home' : (guess.home < guess.away ? 'away' : 'tie');
  const hasWinnerBonus = (actualWinner === guessWinner && actualWinner !== 'tie');

  return calculateExponentialScore(totalDiff, gameIndex, {
    hasWinnerBonus,
    winnerBonusPts: 15,
    zeroIndexed: true
  });
}

/**
 * Calculates game points purely from total score difference and game index.
 */
export function calculatePointsFromDiff(totalDiff, gameIndex = 0, hasWinnerBonus = false, customOptions = {}) {
  return calculateExponentialScore(totalDiff, gameIndex, {
    hasWinnerBonus,
    winnerBonusPts: 15,
    zeroIndexed: true,
    ...customOptions
  });
}

/**
 * Calculates cumulative score progression across games 1 to maxGames
 * with optional drop rules applied (Game 3 drop 1, Game 4+ drop 2 lowest).
 */
export function calculateCumulativePoints(totalDiff, maxGames = 14, options = {}) {
  const { 
    hasWinnerBonus = false, 
    zeroIndexed = true, 
    applyDrops = false,
    game1Max = EXPONENTIAL_CONFIG.game1Max,
    lastGameMax = EXPONENTIAL_CONFIG.lastGameMax,
    targetDiff14 = EXPONENTIAL_CONFIG.targetDiff14,
    curvePower = EXPONENTIAL_CONFIG.curvePower,
    winnerBonusPts = 15
  } = options;

  const perGameScores = [];
  const cumulativeScores = [];

  for (let g = 1; g <= maxGames; g++) {
    const gameIdx = zeroIndexed ? (g - 1) : g;
    const score = calculateExponentialScore(totalDiff, gameIdx, {
      hasWinnerBonus,
      winnerBonusPts,
      zeroIndexed,
      game1Max,
      lastGameMax,
      totalGames: maxGames,
      targetDiff14,
      curvePower
    });
    perGameScores.push(score);

    if (applyDrops) {
      let dropsAllowed = 0;
      if (g === 3) dropsAllowed = 1;
      else if (g >= 4) dropsAllowed = 2;

      const sorted = [...perGameScores].sort((a, b) => a - b);
      const kept = sorted.slice(dropsAllowed);
      const sum = kept.reduce((acc, val) => acc + val, 0);
      cumulativeScores.push(sum);
    } else {
      const sum = perGameScores.reduce((acc, val) => acc + val, 0);
      cumulativeScores.push(sum);
    }
  }

  return { perGameScores, cumulativeScores };
}




/**
 * Calculates Overall Leaderboard Standings
 */
export function computeLeaderboard(players, games, guesses, accounts) {
  const completedGames = games
    .filter(g => isGameFinished(g) || (g.home_score !== null && g.away_score !== null))
    .sort((a, b) => new Date(a.start_date || a.start_time) - new Date(b.start_date || b.start_time));

  const totalCompleted = completedGames.length;
  let dropsAllowed = 0;
  if (totalCompleted === 3) dropsAllowed = 1;
  else if (totalCompleted >= 4) dropsAllowed = 2;

  const playerStats = players.map(player => {
    const account = accounts.find(a => a.id === player.account_id);
    const playerGuesses = guesses.filter(g => g.player_id === player.id);

    const gameScores = [];
    let exactHits = 0;

    completedGames.forEach((game, idx) => {
      const g = playerGuesses.find(pg => pg.game_id === game.id);
      if (g) {
        const pts = calculateGuessPoints(g, game, idx);
        if (pts !== null) {
          gameScores.push(pts);
          if (g.home === game.home_score && g.away === game.away_score) {
            exactHits++;
          }
        } else {
          gameScores.push(0);
        }
      } else {
        gameScores.push(0);
      }
    });

    const sortedScores = [...gameScores].sort((a, b) => a - b);
    const dropped = sortedScores.slice(0, dropsAllowed);
    const keptScores = sortedScores.slice(dropsAllowed);
    const totalScore = keptScores.reduce((sum, val) => sum + val, 0);

    const lastGameScore = gameScores.length > 0 ? gameScores[gameScores.length - 1] : 0;
    const isOnFire = lastGameScore >= 100 || exactHits > 0;

    return {
      playerId: player.id,
      playerName: player.name,
      accountId: player.account_id,
      accountName: account ? account.name : 'Unknown Account',
      color: getPlayerColor(player.id),
      totalScore,
      gameScores,
      droppedScores: dropped,
      exactHits,
      isOnFire,
      gamesPlayed: gameScores.length
    };
  });

  playerStats.sort((a, b) => b.totalScore - a.totalScore);

  playerStats.forEach((stat, index) => {
    stat.rank = index + 1;
  });

  return {
    standings: playerStats,
    completedGamesCount: totalCompleted,
    dropsAllowed
  };
}

/**
 * Calculates Weekly Leaders for a specific game
 */
export function computeWeeklyLeaderboard(gameId, players, games, guesses, accounts) {
  const game = games.find(g => g.id === gameId);
  if (!game) return { standings: [], game: null, isCompleted: false, isLive: false };

  const gameIndex = games.indexOf(game);
  const isFinished = isGameFinished(game);
  const hasScores = game.home_score !== null && game.away_score !== null;
  const hasStarted = isFinished || hasScores;

  const standings = players.map(player => {
    const account = accounts.find(a => a.id === player.account_id);
    const guess = guesses.find(g => g.game_id === gameId && g.player_id === player.id);

    let score = null;
    let exactHit = false;

    if (guess && hasStarted) {
      score = calculateGuessPoints(guess, game, gameIndex);
      if (guess.home === game.home_score && guess.away === game.away_score) {
        exactHit = true;
      }
    }

    return {
      playerId: player.id,
      playerName: player.name,
      accountId: player.account_id,
      accountName: account ? account.name : 'Unknown Account',
      color: getPlayerColor(player.id),
      guessHome: guess ? guess.home : null,
      guessAway: guess ? guess.away : null,
      score: score !== null ? score : (guess ? 'Pending' : 'No Guess'),
      exactHit,
      hasGuess: !!guess
    };
  });

  standings.sort((a, b) => {
    if (typeof a.score === 'number' && typeof b.score === 'number') return b.score - a.score;
    if (typeof a.score === 'number') return -1;
    if (typeof b.score === 'number') return 1;
    return 0;
  });

  standings.forEach((stat, index) => {
    stat.rank = index + 1;
  });

  return { standings, game, isCompleted: isFinished, isLive: !isFinished && hasScores };
}
