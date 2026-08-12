// BYU Football Guess Game - Scoring Algorithm & Leaderboard Logic

// Player Color Palette (Assigned dynamically by Player ID or Index)
const PLAYER_COLORS = [
  '#0062B8', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', 
  '#3B82F6', '#EF4444', '#14B8A6', '#6366F1', '#D97706'
];

export function getPlayerColor(playerId) {
  const index = (playerId || 0) % PLAYER_COLORS.length;
  return PLAYER_COLORS[index];
}

/**
 * Calculates game points for a guess against actual score
 * Baseline formula:
 * Difference = |ActualHome - GuessHome| + |ActualAway - GuessAway|
 * Exact score bonus: +50 pts
 * Exact winner bonus: +10 pts
 * Base Game Points: Max(0, 100 - Difference * 5) + Bonuses
 * Season multiplier: Game N has a weight multiplier (1.0 + (gameIndex * 0.15)) to make later games worth slightly more.
 */
export function calculateGuessPoints(guess, game, gameIndex = 0) {
  if (game.home_score === null || game.away_score === null || guess.home === null || guess.away === null) {
    return null;
  }

  const diffHome = Math.abs(game.home_score - guess.home);
  const diffAway = Math.abs(game.away_score - guess.away);
  const totalDiff = diffHome + diffAway;

  let rawPoints = Math.max(0, 100 - (totalDiff * 5));

  // Exact Score Bonus
  if (diffHome === 0 && diffAway === 0) {
    rawPoints += 50;
  }

  // Exact Winner Bonus
  const actualWinner = game.home_score > game.away_score ? 'home' : (game.home_score < game.away_score ? 'away' : 'tie');
  const guessWinner = guess.home > guess.away ? 'home' : (guess.home < guess.away ? 'away' : 'tie');
  if (actualWinner === guessWinner && actualWinner !== 'tie') {
    rawPoints += 15;
  }

  // Season Progression Multiplier (Later games worth slightly more)
  const multiplier = 1.0 + (gameIndex * 0.15);
  return Math.round(rawPoints * multiplier);
}

/**
 * Calculates Leaderboard Standings
 * Rules for dropping lowest scores based on completed games count:
 * - 1-2 games completed: Drop 0 lowest scores
 * - 3 games completed: Drop 1 lowest score
 * - 4+ games completed: Drop 2 lowest scores
 */
export function computeLeaderboard(players, games, guesses, accounts) {
  const completedGames = games
    .filter(g => g.home_score !== null && g.away_score !== null)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

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
          gameScores.push(0); // Missed guess count as 0
        }
      } else {
        gameScores.push(0); // Missed game
      }
    });

    // Calculate total score after dropping lowest X scores
    const sortedScores = [...gameScores].sort((a, b) => a - b);
    const dropped = sortedScores.slice(0, dropsAllowed);
    const keptScores = sortedScores.slice(dropsAllowed);
    const totalScore = keptScores.reduce((sum, val) => sum + val, 0);

    // Compute recent trend (last game score for fire emoji)
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

  // Sort by Total Score descending
  playerStats.sort((a, b) => b.totalScore - a.totalScore);

  // Assign Ranks and calculate rank change (delta)
  // For rank delta demo/mock calculation, compare score relative to total average or previous round
  playerStats.forEach((stat, index) => {
    stat.rank = index + 1;
    // Rank delta heuristic (random demo variance if first run, or strictly computed)
    stat.rankDelta = 0; 
  });

  return {
    standings: playerStats,
    completedGamesCount: totalCompleted,
    dropsAllowed
  };
}
