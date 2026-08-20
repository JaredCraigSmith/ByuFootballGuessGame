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

/**
 * Calculates game points for a guess against actual score
 */
export function calculateGuessPoints(guess, game, gameIndex = 0) {
  const isFinished = Boolean(game.is_finished) || (game.home_score !== null && game.away_score !== null);
  if (!isFinished || game.home_score === null || game.away_score === null || guess.home === null || guess.away === null) {
    return null;
  }

  const diffHome = Math.abs(game.home_score - guess.home);
  const diffAway = Math.abs(game.away_score - guess.away);
  const totalDiff = diffHome + diffAway;

  let rawPoints = Math.max(0, 100 - (totalDiff * 3));

  // Exact Winner Bonus
  const actualWinner = game.home_score > game.away_score ? 'home' : (game.home_score < game.away_score ? 'away' : 'tie');
  const guessWinner = guess.home > guess.away ? 'home' : (guess.home < guess.away ? 'away' : 'tie');
  if (actualWinner === guessWinner && actualWinner !== 'tie') {
    rawPoints += 5;
  }

  // Season Progression Multiplier (Later games worth slightly more)
  const multiplier = 1.0 + (gameIndex * 0.15);
  const finalScore = Math.round(rawPoints * multiplier);
  return finalScore * 10 // Return score out of 1000 for more fun.
}

/**
 * Calculates Overall Leaderboard Standings
 */
export function computeLeaderboard(players, games, guesses, accounts) {
  const completedGames = games
    .filter(g => Boolean(g.is_finished) || (g.home_score !== null && g.away_score !== null))
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
  if (!game) return { standings: [], game: null, isCompleted: false };

  const gameIndex = games.indexOf(game);
  const isCompleted = Boolean(game.is_finished) || (game.home_score !== null && game.away_score !== null);

  const standings = players.map(player => {
    const account = accounts.find(a => a.id === player.account_id);
    const guess = guesses.find(g => g.game_id === gameId && g.player_id === player.id);

    let score = null;
    let exactHit = false;

    if (guess && isCompleted) {
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

  return { standings, game, isCompleted };
}
