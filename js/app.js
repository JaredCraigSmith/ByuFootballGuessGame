// BYU Football Guess Game - Main Application Controller
import { SupabaseAPI } from './supabase.js';
import { 
  computeLeaderboard, 
  computeWeeklyLeaderboard, 
  getPlayerColor, 
  savePlayerColor, 
  PRESET_PLAYER_COLORS 
} from './scoring.js';

// Application State
const state = {
  accounts: [],
  players: [],
  games: [],
  guesses: [],
  currentAccount: null,
  activeView: 'leaderboardView',
  leaderboardMode: 'overall', // 'overall' or 'weekly'
  selectedWeeklyGameId: null,
  selectedPlayerColor: PRESET_PLAYER_COLORS[0],
  countdownInterval: null
};

// DOM Elements
const elements = {
  navItems: document.querySelectorAll('.nav-item'),
  views: document.querySelectorAll('.view'),
  accountSelect: document.getElementById('accountSelect'),
  accountPin: document.getElementById('accountPin'),
  loginForm: document.getElementById('loginForm'),
  createAccountForm: document.getElementById('createAccountForm'),
  showCreateAccountBtn: document.getElementById('showCreateAccountBtn'),
  cancelCreateAccountBtn: document.getElementById('cancelCreateAccountBtn'),
  loginView: document.getElementById('loginView'),
  createAccountSection: document.getElementById('createAccountSection'),
  userInfo: document.getElementById('userInfo'),
  currentAccountName: document.getElementById('currentAccountName'),
  logoutBtn: document.getElementById('logoutBtn'),
  adminNavTab: document.getElementById('adminNavTab'),

  // Countdown & Banner
  bannerHome: document.getElementById('bannerHome'),
  bannerAway: document.getElementById('bannerAway'),
  cdDays: document.getElementById('cdDays'),
  cdHours: document.getElementById('cdHours'),
  cdMins: document.getElementById('cdMins'),
  cdSecs: document.getElementById('cdSecs'),
  guessProgressIndicator: document.getElementById('guessProgressIndicator'),

  // Leaderboard & Sub Tabs
  btnOverallStandings: document.getElementById('btnOverallStandings'),
  btnWeeklyLeaders: document.getElementById('btnWeeklyLeaders'),
  weeklySelectorGroup: document.getElementById('weeklySelectorGroup'),
  weeklyGameSelect: document.getElementById('weeklyGameSelect'),
  standingsTitle: document.getElementById('standingsTitle'),
  leaderboardList: document.getElementById('leaderboardList'),
  dropRulesBadge: document.getElementById('dropRulesBadge'),

  // Guesses
  guessGameSelect: document.getElementById('guessGameSelect'),
  playerGuessesContainer: document.getElementById('playerGuessesContainer'),
  bulkGuessForm: document.getElementById('bulkGuessForm'),
  showAddPlayerBtn: document.getElementById('showAddPlayerBtn'),
  hideAddPlayerBtn: document.getElementById('hideAddPlayerBtn'),
  addPlayerCard: document.getElementById('addPlayerCard'),
  addPlayerForm: document.getElementById('addPlayerForm'),
  newPlayerName: document.getElementById('newPlayerName'),
  newPlayerColorPicker: document.getElementById('newPlayerColorPicker'),

  // Games & Admin
  gamesList: document.getElementById('gamesList'),
  adminAddGameForm: document.getElementById('adminAddGameForm'),
  adminHomeTeam: document.getElementById('adminHomeTeam'),
  adminAwayTeam: document.getElementById('adminAwayTeam'),
  adminStartDate: document.getElementById('adminStartDate'),
  adminStartTime: document.getElementById('adminStartTime'),
  adminScoreList: document.getElementById('adminScoreList'),

  // Cosmo Easter Egg
  brandLogo: document.getElementById('brandLogo'),
  cosmoModal: document.getElementById('cosmoModal'),
  closeCosmoBtn: document.getElementById('closeCosmoBtn')
};

// Initialize Application
async function init() {
  setupEventListeners();
  initColorPicker();
  await loadData();
  restoreSession();
  renderAccountsDropdown();
  renderLeaderboard();
  renderSchedule();
  setupCountdown();
}

// Load Data from Supabase API
async function loadData() {
  try {
    const [accs, plys, gms, gss] = await Promise.all([
      SupabaseAPI.getAccounts(),
      SupabaseAPI.getPlayers(),
      SupabaseAPI.getGames(),
      SupabaseAPI.getGuesses()
    ]);
    state.accounts = accs || [];
    state.players = plys || [];
    state.games = gms || [];
    state.guesses = gss || [];
  } catch (err) {
    console.error('Failed to load initial data:', err);
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Navigation
  elements.navItems.forEach(item => {
    item.addEventListener('click', () => {
      const viewId = item.getAttribute('data-view');
      switchView(viewId);
    });
  });

  // Leaderboard Sub Tabs & Weekly Game Select
  if (elements.btnOverallStandings) {
    elements.btnOverallStandings.addEventListener('click', () => setLeaderboardMode('overall'));
  }
  if (elements.btnWeeklyLeaders) {
    elements.btnWeeklyLeaders.addEventListener('click', () => setLeaderboardMode('weekly'));
  }
  if (elements.weeklyGameSelect) {
    elements.weeklyGameSelect.addEventListener('change', (e) => {
      state.selectedWeeklyGameId = parseInt(e.target.value, 10);
      renderLeaderboard();
    });
  }

  // Login
  elements.loginForm.addEventListener('submit', handleLogin);
  elements.logoutBtn.addEventListener('click', handleLogout);

  // Account Creation
  elements.showCreateAccountBtn.addEventListener('click', () => {
    switchView('createAccountSection');
  });
  elements.cancelCreateAccountBtn.addEventListener('click', () => {
    switchView('loginView');
  });
  elements.createAccountForm.addEventListener('submit', handleCreateAccount);

  // Guesses
  elements.guessGameSelect.addEventListener('change', renderPlayerGuesses);
  elements.bulkGuessForm.addEventListener('submit', handleSaveGuesses);
  elements.showAddPlayerBtn.addEventListener('click', () => {
    elements.addPlayerCard.style.display = 'block';
    initColorPicker();
  });
  elements.hideAddPlayerBtn.addEventListener('click', () => {
    elements.addPlayerCard.style.display = 'none';
  });
  elements.addPlayerForm.addEventListener('submit', handleAddPlayer);

  // Admin
  elements.adminAddGameForm.addEventListener('submit', handleAdminAddGame);

  // Easter Egg (Cosmo)
  let clickCount = 0;
  elements.brandLogo.addEventListener('click', () => {
    clickCount++;
    if (clickCount >= 3) {
      elements.cosmoModal.classList.add('active');
      if (window.confetti) {
        window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
      clickCount = 0;
    }
  });
  elements.closeCosmoBtn.addEventListener('click', () => {
    elements.cosmoModal.classList.remove('active');
  });
}

// Color Picker Swatches Initializer
function initColorPicker() {
  if (!elements.newPlayerColorPicker) return;
  state.selectedPlayerColor = PRESET_PLAYER_COLORS[0];
  elements.newPlayerColorPicker.innerHTML = '';
  PRESET_PLAYER_COLORS.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-option' + (color === state.selectedPlayerColor ? ' selected' : '');
    swatch.style.backgroundColor = color;
    swatch.addEventListener('click', () => {
      elements.newPlayerColorPicker.querySelectorAll('.color-option').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
      state.selectedPlayerColor = color;
    });
    elements.newPlayerColorPicker.appendChild(swatch);
  });
}

// Leaderboard Mode Switcher
function setLeaderboardMode(mode) {
  state.leaderboardMode = mode;
  if (mode === 'overall') {
    elements.btnOverallStandings.classList.add('active');
    elements.btnWeeklyLeaders.classList.remove('active');
    elements.weeklySelectorGroup.style.display = 'none';
  } else {
    elements.btnWeeklyLeaders.classList.add('active');
    elements.btnOverallStandings.classList.remove('active');
    elements.weeklySelectorGroup.style.display = 'block';
    populateWeeklySelector();
  }
  renderLeaderboard();
}

function populateWeeklySelector() {
  elements.weeklyGameSelect.innerHTML = '';
  state.games.forEach(game => {
    const opt = document.createElement('option');
    opt.value = game.id;
    const isCompleted = game.home_score !== null && game.away_score !== null;
    const dateFormatted = formatGameDateTime(game);
    opt.textContent = `${game.home_team} vs ${game.away_team} (${dateFormatted})${isCompleted ? ' - Completed' : ''}`;
    elements.weeklyGameSelect.appendChild(opt);
  });
  if (!state.selectedWeeklyGameId && state.games.length > 0) {
    const firstCompleted = state.games.find(g => g.home_score !== null && g.away_score !== null);
    state.selectedWeeklyGameId = firstCompleted ? firstCompleted.id : state.games[0].id;
  }
  if (state.selectedWeeklyGameId) {
    elements.weeklyGameSelect.value = state.selectedWeeklyGameId;
  }
}

// Switch Views
function switchView(viewId) {
  state.activeView = viewId;
  elements.views.forEach(v => v.classList.remove('active'));
  elements.navItems.forEach(n => n.classList.remove('active'));

  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.add('active');

  const activeNav = Array.from(elements.navItems).find(n => n.getAttribute('data-view') === viewId);
  if (activeNav) activeNav.classList.add('active');

  if (viewId === 'leaderboardView') renderLeaderboard();
  if (viewId === 'guessesView') renderGuessesView();
  if (viewId === 'gamesView') renderSchedule();
  if (viewId === 'adminView') renderAdminView();
}

// Session Persistence
function restoreSession() {
  const savedAcc = localStorage.getItem('byu_guess_account');
  if (savedAcc) {
    try {
      const parsed = JSON.parse(savedAcc);
      const matched = state.accounts.find(a => a.id === parsed.id && a.pin === parsed.pin);
      if (matched) {
        setLoggedInUser(matched);
        return;
      }
    } catch (e) {}
  }
  switchView('loginView');
}

function setLoggedInUser(account) {
  state.currentAccount = account;
  localStorage.setItem('byu_guess_account', JSON.stringify(account));
  elements.userInfo.style.display = 'flex';
  elements.currentAccountName.textContent = account.name;

  if (account.name === "J&J Smith's") {
    elements.adminNavTab.style.display = 'flex';
  } else {
    elements.adminNavTab.style.display = 'none';
  }

  switchView('leaderboardView');
}

function handleLogout() {
  state.currentAccount = null;
  localStorage.removeItem('byu_guess_account');
  elements.userInfo.style.display = 'none';
  elements.adminNavTab.style.display = 'none';
  switchView('loginView');
}

// Render Accounts Dropdown
function renderAccountsDropdown() {
  elements.accountSelect.innerHTML = '<option value="">-- Choose Account --</option>';
  state.accounts.forEach(acc => {
    const opt = document.createElement('option');
    opt.value = acc.id;
    opt.textContent = acc.name;
    elements.accountSelect.appendChild(opt);
  });
}

// Login Handler
function handleLogin(e) {
  e.preventDefault();
  const accId = parseInt(elements.accountSelect.value, 10);
  const pinInput = parseInt(elements.accountPin.value, 10);

  const acc = state.accounts.find(a => a.id === accId);
  if (acc && acc.pin === pinInput) {
    setLoggedInUser(acc);
    elements.accountPin.value = '';
  } else {
    alert('Invalid Account or PIN. Please try again!');
  }
}

// Create Account Handler
async function handleCreateAccount(e) {
  e.preventDefault();
  const name = elements.newAccountName.value.trim();
  const pin = elements.newAccountPin.value.trim();

  if (!name || !pin) return;

  try {
    const newAcc = await SupabaseAPI.createAccount(name, pin);
    await loadData();
    renderAccountsDropdown();
    setLoggedInUser(newAcc);
    elements.newAccountName.value = '';
    elements.newAccountPin.value = '';
  } catch (err) {
    alert('Failed to create account. Please try again.');
  }
}

// Format Game Date & Time string
function formatGameDateTime(game) {
  let dateFormatted = '';
  if (game.start_date) {
    const parts = game.start_date.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      dateFormatted = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } else {
      dateFormatted = game.start_date;
    }
  } else if (game.start_time) {
    dateFormatted = new Date(game.start_time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } else {
    dateFormatted = 'TBD';
  }

  let timeFormatted = 'TBD';
  if (game.start_time) {
    if (game.start_time.includes('T')) {
      timeFormatted = new Date(game.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      const timePart = game.start_time.split('+')[0].split('-')[0].trim();
      const timeParts = timePart.split(':');
      if (timeParts.length >= 2) {
        let hours = parseInt(timeParts[0], 10);
        const minutes = timeParts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        timeFormatted = `${hours}:${minutes} ${ampm}`;
      } else {
        timeFormatted = game.start_time;
      }
    }
  }

  return `${dateFormatted} • ${timeFormatted === 'TBD' ? 'Kickoff TBD' : timeFormatted}`;
}

// Robust Game Timestamp Helper (Fixes NaN in Date parsing)
function getGameStartTimestamp(game) {
  if (!game) return null;
  const dateStr = game.start_date || '2026-09-05';
  const dateParts = dateStr.split('-').map(Number);
  
  let hours = 0, mins = 0;
  if (game.start_time) {
    const timeClean = game.start_time.split('+')[0].split('-')[0].trim();
    const timeParts = timeClean.split(':').map(Number);
    hours = timeParts[0] || 0;
    mins = timeParts[1] || 0;
  }
  
  return new Date(dateParts[0], dateParts[1] - 1, dateParts[2], hours, mins, 0).getTime();
}

// Countdown & Upcoming Game Banner
function setupCountdown() {
  if (state.countdownInterval) clearInterval(state.countdownInterval);

  // Find next uncompleted game
  const upcomingGame = state.games
    .filter(g => g.home_score === null && g.away_score === null)
    .sort((a, b) => {
      const dateA = a.start_date || a.start_time || '';
      const dateB = b.start_date || b.start_time || '';
      return dateA.localeCompare(dateB);
    })[0];

  if (!upcomingGame) {
    elements.bannerHome.textContent = 'BYU';
    elements.bannerAway.textContent = 'Season Ended';
    elements.cdDays.textContent = '00';
    elements.cdHours.textContent = '00';
    elements.cdMins.textContent = '00';
    elements.cdSecs.textContent = '00';
    elements.guessProgressIndicator.textContent = '🎉 Season Completed!';
    return;
  }

  elements.bannerHome.textContent = upcomingGame.home_team || 'BYU';
  elements.bannerAway.textContent = upcomingGame.away_team || 'Opponent';

  // Submission count indicator
  const submittedGuesses = state.guesses.filter(g => g.game_id === upcomingGame.id);
  const uniquePlayersWithGuess = new Set(submittedGuesses.map(g => g.player_id));
  const hasTime = !!upcomingGame.start_time;

  elements.guessProgressIndicator.textContent = `📊 ${uniquePlayersWithGuess.size}/${state.players.length} players submitted guesses ${!hasTime ? '(Kickoff TBD)' : ''}`;

  const targetDate = getGameStartTimestamp(upcomingGame);

  if (!targetDate) return;

  state.countdownInterval = setInterval(() => {
    const currentTime = Date.now();
    const diff = targetDate - currentTime;

    if (diff <= 0 && hasTime) {
      clearInterval(state.countdownInterval);
      elements.cdDays.textContent = '00';
      elements.cdHours.textContent = '00';
      elements.cdMins.textContent = '00';
      elements.cdSecs.textContent = '00';
      elements.guessProgressIndicator.textContent = '🏈 GAME IN PROGRESS!';
      return;
    }

    const absDiff = Math.abs(diff);
    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((absDiff % (1000 * 60)) / 1000);

    elements.cdDays.textContent = String(days).padStart(2, '0');
    elements.cdHours.textContent = String(hours).padStart(2, '0');
    elements.cdMins.textContent = String(mins).padStart(2, '0');
    elements.cdSecs.textContent = String(secs).padStart(2, '0');
  }, 1000);
}

// Render Leaderboard (Overall or Weekly)
function renderLeaderboard() {
  if (state.leaderboardMode === 'overall') {
    elements.standingsTitle.textContent = '🏆 Overall Standings';
    elements.dropRulesBadge.style.display = 'inline-block';
    
    const result = computeLeaderboard(state.players, state.games, state.guesses, state.accounts);
    elements.dropRulesBadge.textContent = `Dropping ${result.dropsAllowed} lowest score(s)`;

    elements.leaderboardList.innerHTML = '';
    if (result.standings.length === 0) {
      elements.leaderboardList.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:20px;">No players registered yet! Add players in "My Guesses".</div>';
      return;
    }

    result.standings.forEach(player => {
      const item = document.createElement('div');
      item.className = 'leader-item';
      const rankClass = player.rank <= 3 ? `rank-${player.rank}` : '';
      const fireBadge = player.isOnFire ? ' 🔥' : '';

      item.innerHTML = `
        <div class="leader-left">
          <div class="rank ${rankClass}">#${player.rank}</div>
          <div class="player-dot" style="background:${player.color};"></div>
          <div class="player-info">
            <div class="player-name">${player.playerName} ${fireBadge}</div>
            <div class="account-sub">${player.accountName}</div>
          </div>
        </div>
        <div class="leader-right">
          <div class="score-tag">${player.totalScore} <span style="font-size:0.7rem; color:var(--text-muted);">pts</span></div>
        </div>
      `;
      elements.leaderboardList.appendChild(item);
    });
  } else {
    // Weekly Leaders Mode
    const gameId = state.selectedWeeklyGameId || (state.games[0] ? state.games[0].id : null);
    if (!gameId) {
      elements.leaderboardList.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:20px;">No games available.</div>';
      return;
    }

    const { standings, game, isCompleted } = computeWeeklyLeaderboard(gameId, state.players, state.games, state.guesses, state.accounts);

    elements.standingsTitle.textContent = `📅 ${game.home_team} vs ${game.away_team}`;
    if (isCompleted) {
      elements.dropRulesBadge.style.display = 'inline-block';
      elements.dropRulesBadge.textContent = `Final Score: ${game.home_team} ${game.home_score} - ${game.away_score} ${game.away_team}`;
    } else {
      elements.dropRulesBadge.style.display = 'inline-block';
      elements.dropRulesBadge.textContent = `Game Upcoming (${formatGameDateTime(game)})`;
    }

    elements.leaderboardList.innerHTML = '';
    if (standings.length === 0) {
      elements.leaderboardList.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:20px;">No players registered.</div>';
      return;
    }

    // Highlight top winner card if completed
    if (isCompleted && standings[0] && typeof standings[0].score === 'number') {
      const topScore = standings[0].score;
      const winners = standings.filter(s => s.score === topScore);
      const winnerNames = winners.map(w => w.playerName).join(', ');
      
      const winnerCard = document.createElement('div');
      winnerCard.className = 'card';
      winnerCard.style.background = 'linear-gradient(135deg, rgba(255, 199, 44, 0.25) 0%, rgba(0, 98, 184, 0.3) 100%)';
      winnerCard.style.border = '1px solid var(--byu-gold)';
      winnerCard.style.textAlign = 'center';
      winnerCard.style.padding = '14px';
      winnerCard.style.marginBottom = '12px';
      winnerCard.innerHTML = `
        <div style="font-size: 1.1rem; font-weight:800; color:var(--byu-gold);">🥇 WEEKLY WINNER(S) 🥇</div>
        <div style="font-size: 1.2rem; font-weight: 900; color: white; margin-top: 4px;">${winnerNames}</div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">${topScore} points earned this week</div>
      `;
      elements.leaderboardList.appendChild(winnerCard);
    }

    standings.forEach(player => {
      const item = document.createElement('div');
      item.className = 'leader-item';
      const rankClass = player.rank <= 3 ? `rank-${player.rank}` : '';
      const exactBadge = player.exactHit ? ' 🎯' : '';
      const guessStr = player.hasGuess ? `${player.guessHome} - ${player.guessAway}` : 'No Guess';
      const scoreStr = typeof player.score === 'number' ? `${player.score} pts` : player.score;

      item.innerHTML = `
        <div class="leader-left">
          <div class="rank ${rankClass}">#${player.rank}</div>
          <div class="player-dot" style="background:${player.color};"></div>
          <div class="player-info">
            <div class="player-name">${player.playerName}${exactBadge}</div>
            <div class="account-sub">Guess: <strong>${guessStr}</strong> • ${player.accountName}</div>
          </div>
        </div>
        <div class="leader-right">
          <div class="score-tag">${scoreStr}</div>
        </div>
      `;
      elements.leaderboardList.appendChild(item);
    });
  }
}

// Render Guesses View
function renderGuessesView() {
  if (!state.currentAccount) {
    switchView('loginView');
    return;
  }

  // Populate Game Select
  elements.guessGameSelect.innerHTML = '';
  state.games.forEach(game => {
    const opt = document.createElement('option');
    opt.value = game.id;
    const isCompleted = game.home_score !== null && game.away_score !== null;
    const dateFormatted = formatGameDateTime(game);
    opt.textContent = `${game.home_team} vs ${game.away_team} (${dateFormatted})${isCompleted ? ' - Final' : ''}`;
    elements.guessGameSelect.appendChild(opt);
  });

  renderPlayerGuesses();
}

function renderPlayerGuesses() {
  const selectedGameId = parseInt(elements.guessGameSelect.value, 10);
  const accountPlayers = state.players.filter(p => p.account_id === state.currentAccount.id);

  elements.playerGuessesContainer.innerHTML = '';

  if (accountPlayers.length === 0) {
    elements.playerGuessesContainer.innerHTML = `
      <div style="text-align:center; color:var(--text-muted); padding:16px;">
        No players added to your family account yet. Click <strong>"➕ Add Player"</strong> above!
      </div>
    `;
    return;
  }

  accountPlayers.forEach(player => {
    const existingGuess = state.guesses.find(g => g.game_id === selectedGameId && g.player_id === player.id);
    const homeVal = existingGuess ? (existingGuess.home !== null ? existingGuess.home : '') : '';
    const awayVal = existingGuess ? (existingGuess.away !== null ? existingGuess.away : '') : '';
    const currentColor = getPlayerColor(player.id);

    const row = document.createElement('div');
    row.className = 'card';
    row.style.padding = '12px 14px';
    row.style.marginBottom = '10px';
    row.style.background = 'rgba(255, 255, 255, 0.03)';

    row.innerHTML = `
      <div style="font-weight:700; margin-bottom:8px; display:flex; align-items:center; justify-content:space-between;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="display:inline-block; width:14px; height:14px; border-radius:50%; background:${currentColor}; border:1px solid rgba(255,255,255,0.4);"></span>
          <span>${player.name}</span>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <span style="font-size:0.75rem; color:var(--text-muted);">Color:</span>
          ${PRESET_PLAYER_COLORS.map(c => `
            <div class="color-mini-swatch" data-player-id="${player.id}" data-color="${c}" style="width:16px; height:16px; border-radius:50%; background:${c}; cursor:pointer; border:${c === currentColor ? '2px solid white' : '1px solid transparent'}; box-shadow:${c === currentColor ? '0 0 6px ' + c : 'none'};"></div>
          `).join('')}
        </div>
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
        <div>
          <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">BYU / Home</label>
          <input type="number" class="form-control guess-home" data-player-id="${player.id}" value="${homeVal}" placeholder="Score" min="0" />
        </div>
        <div>
          <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">Opponent / Away</label>
          <input type="number" class="form-control guess-away" data-player-id="${player.id}" value="${awayVal}" placeholder="Score" min="0" />
        </div>
      </div>
    `;
    elements.playerGuessesContainer.appendChild(row);
  });

  // Color Swatch Selection Listeners for Players
  document.querySelectorAll('.color-mini-swatch').forEach(swatch => {
    swatch.addEventListener('click', (e) => {
      const pId = parseInt(e.target.getAttribute('data-player-id'), 10);
      const color = e.target.getAttribute('data-color');
      savePlayerColor(pId, color);
      renderPlayerGuesses();
      renderLeaderboard();
    });
  });
}

// Bulk Save Guesses
async function handleSaveGuesses(e) {
  e.preventDefault();
  const gameId = parseInt(elements.guessGameSelect.value, 10);
  if (!gameId) return;

  const homeInputs = document.querySelectorAll('.guess-home');
  const awayInputs = document.querySelectorAll('.guess-away');

  const promises = [];

  homeInputs.forEach(homeInput => {
    const playerId = parseInt(homeInput.getAttribute('data-player-id'), 10);
    const awayInput = Array.from(awayInputs).find(i => parseInt(i.getAttribute('data-player-id'), 10) === playerId);

    const homeVal = homeInput.value !== '' ? parseInt(homeInput.value, 10) : null;
    const awayVal = awayInput && awayInput.value !== '' ? parseInt(awayInput.value, 10) : null;

    if (homeVal !== null && awayVal !== null) {
      promises.push(SupabaseAPI.upsertGuess(gameId, playerId, homeVal, awayVal));
    }
  });

  try {
    await Promise.all(promises);
    await loadData();
    setupCountdown();
    alert('All family guesses saved successfully! 🏈');
  } catch (err) {
    alert('Error saving guesses. Please check internet connection.');
  }
}

// Add Player Handler
async function handleAddPlayer(e) {
  e.preventDefault();
  const name = elements.newPlayerName.value.trim();
  if (!name || !state.currentAccount) return;

  try {
    const newPlayer = await SupabaseAPI.createPlayer(name, state.currentAccount.id);
    if (newPlayer && newPlayer.id) {
      savePlayerColor(newPlayer.id, state.selectedPlayerColor);
    }
    await loadData();
    elements.newPlayerName.value = '';
    elements.addPlayerCard.style.display = 'none';
    renderPlayerGuesses();
    renderLeaderboard();
  } catch (err) {
    alert('Failed to add player.');
  }
}

// Render Schedule View
function renderSchedule() {
  elements.gamesList.innerHTML = '';
  if (state.games.length === 0) {
    elements.gamesList.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:20px;">No games scheduled yet.</div>';
    return;
  }

  state.games.forEach(game => {
    const card = document.createElement('div');
    card.className = 'card';
    const dateStr = formatGameDateTime(game);
    const isFinished = game.home_score !== null && game.away_score !== null;

    card.innerHTML = `
      <div style="font-size:0.8rem; color:var(--byu-gold); font-weight:700; margin-bottom:6px;">
        📅 ${dateStr}
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:1.1rem;">
        <div>${game.home_team}</div>
        <div style="color:var(--text-muted); font-size:0.9rem;">${isFinished ? `${game.home_score} - ${game.away_score}` : 'VS'}</div>
        <div>${game.away_team}</div>
      </div>
    `;
    elements.gamesList.appendChild(card);
  });
}

// Render Admin View
function renderAdminView() {
  elements.adminScoreList.innerHTML = '';

  state.games.forEach(game => {
    const row = document.createElement('div');
    row.className = 'card';
    row.style.padding = '12px 14px';

    row.innerHTML = `
      <div style="font-weight:700; font-size:0.9rem; margin-bottom:8px;">
        ${game.home_team} vs ${game.away_team}
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr 100px; gap:8px; align-items:center;">
        <input type="number" class="form-control admin-home-score" data-game-id="${game.id}" value="${game.home_score !== null ? game.home_score : ''}" placeholder="${game.home_team} Score" />
        <input type="number" class="form-control admin-away-score" data-game-id="${game.id}" value="${game.away_score !== null ? game.away_score : ''}" placeholder="${game.away_team} Score" />
        <button class="btn btn-gold save-score-btn" data-game-id="${game.id}" style="padding:10px 4px; font-size:0.8rem;">Save Score</button>
      </div>
    `;
    elements.adminScoreList.appendChild(row);
  });

  // Attach listeners to save score buttons
  document.querySelectorAll('.save-score-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const gameId = parseInt(e.target.getAttribute('data-game-id'), 10);
      const homeInput = document.querySelector(`.admin-home-score[data-game-id="${gameId}"]`);
      const awayInput = document.querySelector(`.admin-away-score[data-game-id="${gameId}"]`);

      if (homeInput.value === '' || awayInput.value === '') {
        alert('Please enter scores for both teams.');
        return;
      }

      try {
        await SupabaseAPI.updateGameScore(gameId, homeInput.value, awayInput.value);
        await loadData();
        renderAdminView();
        setupCountdown();
        renderLeaderboard();
        alert('Game final score updated!');
      } catch (err) {
        alert('Failed to update score.');
      }
    });
  });
}

// Admin Add Game
async function handleAdminAddGame(e) {
  e.preventDefault();
  const home = elements.adminHomeTeam.value.trim();
  const away = elements.adminAwayTeam.value.trim();
  const startDate = elements.adminStartDate.value;
  const startTime = elements.adminStartTime.value || null;

  if (!home || !away || !startDate) return;

  try {
    await SupabaseAPI.createGame(home, away, startDate, startTime);
    await loadData();
    elements.adminAwayTeam.value = '';
    elements.adminStartDate.value = '';
    elements.adminStartTime.value = '';
    renderAdminView();
    setupCountdown();
    alert('New game added to schedule!');
  } catch (err) {
    alert('Failed to add game.');
  }
}

// Run App on Load
document.addEventListener('DOMContentLoaded', init);
