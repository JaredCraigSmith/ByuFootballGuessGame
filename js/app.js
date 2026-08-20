// BYU Football Guess Game - Main Application Controller
import { SupabaseAPI } from './supabase.js?v=2';
import { 
  computeLeaderboard, 
  computeWeeklyLeaderboard, 
  getPlayerColor, 
  savePlayerColor, 
  PRESET_PLAYER_COLORS,
  isGameFinished,
  hexToRgba
} from './scoring.js?v=2';

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
  editingPlayerColor: PRESET_PLAYER_COLORS[0],
  countdownInterval: null
};

// Helper for Team Logo URLs
function getTeamLogoUrl(teamName) {
  if (!teamName) return '';
  return `TeamLogo/${encodeURIComponent(teamName)}.png`;
}

// DOM Elements
const elements = {
  navItems: document.querySelectorAll('.nav-item'),
  views: document.querySelectorAll('.view'),
  accountSelect: document.getElementById('accountSelect'),
  accountPin: document.getElementById('accountPin'),
  loginForm: document.getElementById('loginForm'),
  createAccountForm: document.getElementById('createAccountForm'),
  newAccountName: document.getElementById('newAccountName'),
  newAccountPin: document.getElementById('newAccountPin'),
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
  bannerHomeLogo: document.getElementById('bannerHomeLogo'),
  bannerAway: document.getElementById('bannerAway'),
  bannerAwayLogo: document.getElementById('bannerAwayLogo'),
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

  // Guesses & Players
  guessGameSelect: document.getElementById('guessGameSelect'),
  playerGuessesContainer: document.getElementById('playerGuessesContainer'),
  bulkGuessForm: document.getElementById('bulkGuessForm'),
  showAddPlayerBtn: document.getElementById('showAddPlayerBtn'),
  hideAddPlayerBtn: document.getElementById('hideAddPlayerBtn'),
  addPlayerCard: document.getElementById('addPlayerCard'),
  addPlayerForm: document.getElementById('addPlayerForm'),
  newPlayerName: document.getElementById('newPlayerName'),
  newPlayerColorPicker: document.getElementById('newPlayerColorPicker'),

  // Edit Player
  editPlayerCard: document.getElementById('editPlayerCard'),
  hideEditPlayerBtn: document.getElementById('hideEditPlayerBtn'),
  editPlayerForm: document.getElementById('editPlayerForm'),
  editPlayerId: document.getElementById('editPlayerId'),
  editPlayerName: document.getElementById('editPlayerName'),
  editPlayerColorPicker: document.getElementById('editPlayerColorPicker'),

  // Games & Admin
  gamesList: document.getElementById('gamesList'),
  adminAddGameForm: document.getElementById('adminAddGameForm'),
  adminHomeTeam: document.getElementById('adminHomeTeam'),
  adminAwayTeam: document.getElementById('adminAwayTeam'),
  adminStartDate: document.getElementById('adminStartDate'),
  adminStartTime: document.getElementById('adminStartTime'),
  adminScoreList: document.getElementById('adminScoreList'),

  // Cosmo Easter Egg & Dance Button
  brandLogo: document.getElementById('brandLogo'),
  cosmoModal: document.getElementById('cosmoModal'),
  closeCosmoBtn: document.getElementById('closeCosmoBtn'),
  cosmoDanceTrigger: document.getElementById('cosmoDanceTrigger')
};

// Initialize Application
async function init() {
  setupEventListeners();
  initAddPlayerColorPicker();
  prepareCosmoDancerImage();
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

  // Guesses & Players
  elements.guessGameSelect.addEventListener('change', renderPlayerGuesses);
  elements.bulkGuessForm.addEventListener('submit', handleSaveGuesses);
  elements.showAddPlayerBtn.addEventListener('click', () => {
    elements.addPlayerCard.style.display = 'block';
    elements.editPlayerCard.style.display = 'none';
    initAddPlayerColorPicker();
  });
  elements.hideAddPlayerBtn.addEventListener('click', () => {
    elements.addPlayerCard.style.display = 'none';
  });
  elements.addPlayerForm.addEventListener('submit', handleAddPlayer);

  // Edit Player
  if (elements.hideEditPlayerBtn) {
    elements.hideEditPlayerBtn.addEventListener('click', () => {
      elements.editPlayerCard.style.display = 'none';
    });
  }
  if (elements.editPlayerForm) {
    elements.editPlayerForm.addEventListener('submit', handleEditPlayer);
  }

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

  // Floating Cosmo Dance Button Click Handler
  if (elements.cosmoDanceTrigger) {
    elements.cosmoDanceTrigger.addEventListener('click', triggerCosmoDance);
  }
}

// Remove White Background from Cosmo Images dynamically using Canvas
function prepareCosmoDancerImage() {
  const processImage = (targetImgId, srcPath) => {
    const targetImg = document.getElementById(targetImgId);
    if (!targetImg) return;

    const rawImg = new Image();
    rawImg.crossOrigin = 'Anonymous';
    rawImg.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = rawImg.naturalWidth || rawImg.width;
        canvas.height = rawImg.naturalHeight || rawImg.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(rawImg, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Make white/near-white background pixels 100% transparent
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (r > 230 && g > 230 && b > 230) {
            data[i + 3] = 0;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        targetImg.src = canvas.toDataURL('image/png');
      } catch (e) {
        console.warn('Canvas background removal fallback:', e);
      }
    };
    rawImg.src = srcPath;
  };

  processImage('cosmoDanceImg', 'assets/cosmo_dancer.jpg');
  processImage('cosmoBtnImg', 'assets/cosmo_head.jpg');
}

// Trigger Full Screen Dancing Cosmo Animation
let isCosmoDancing = false;
function triggerCosmoDance() {
  if (isCosmoDancing) return;
  isCosmoDancing = true;

  const overlay = document.getElementById('cosmoDanceOverlay');
  const dancerImg = document.getElementById('cosmoDanceImg');
  const cheerText = document.getElementById('cosmoCheerText');

  if (!overlay || !dancerImg) return;

  overlay.style.display = 'block';

  // Restart keyframe animation
  dancerImg.classList.remove('cosmo-dancer-animating');
  if (cheerText) cheerText.classList.remove('cosmo-cheer-pop');

  // Trigger DOM reflow
  void dancerImg.offsetWidth;

  dancerImg.classList.add('cosmo-dancer-animating');

  // Fun cheer phrases
  const cheers = [
    "GO COUGARS! 🐾",
    "COSMO IS ON FIRE! 🔥",
    "COUGAR POWER! 🤙",
    "BYU ALL THE WAY! 🏈",
    "TOUCHDOWN BYU! 🏆"
  ];
  const randomCheer = cheers[Math.floor(Math.random() * cheers.length)];
  if (cheerText) {
    cheerText.textContent = randomCheer;
    cheerText.classList.add('cosmo-cheer-pop');
  }

  // Confetti fireworks show during the dance
  if (window.confetti) {
    window.confetti({ particleCount: 90, spread: 80, origin: { x: 0.2, y: 0.8 } });
    setTimeout(() => {
      window.confetti({ particleCount: 110, spread: 100, origin: { x: 0.7, y: 0.3 } });
    }, 1200);
    setTimeout(() => {
      window.confetti({ particleCount: 130, spread: 90, origin: { x: 0.5, y: 0.5 } });
    }, 2400);
    setTimeout(() => {
      window.confetti({ particleCount: 150, spread: 120, origin: { x: 0.8, y: 0.6 } });
    }, 3600);
  }

  // Hide overlay after dance ends
  setTimeout(() => {
    overlay.style.display = 'none';
    dancerImg.classList.remove('cosmo-dancer-animating');
    if (cheerText) cheerText.classList.remove('cosmo-cheer-pop');
    isCosmoDancing = false;
  }, 4800);
}

// Color Picker Swatches Initializer for Add Player
function initAddPlayerColorPicker() {
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

// Color Picker Swatches Initializer for Edit Player
function initEditPlayerColorPicker(initialColor) {
  if (!elements.editPlayerColorPicker) return;
  state.editingPlayerColor = initialColor || PRESET_PLAYER_COLORS[0];
  elements.editPlayerColorPicker.innerHTML = '';
  PRESET_PLAYER_COLORS.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-option' + (color === state.editingPlayerColor ? ' selected' : '');
    swatch.style.backgroundColor = color;
    swatch.addEventListener('click', () => {
      elements.editPlayerColorPicker.querySelectorAll('.color-option').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
      state.editingPlayerColor = color;
    });
    elements.editPlayerColorPicker.appendChild(swatch);
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
    const isFinished = isGameFinished(game);
    const isLive = !isFinished && (game.home_score !== null && game.away_score !== null);
    const dateFormatted = formatGameDateTime(game);

    let labelSuffix = '';
    if (isFinished) labelSuffix = ' - Final';
    else if (isLive) labelSuffix = ` - 🔴 Live (${game.home_score}-${game.away_score})`;

    opt.textContent = `${game.home_team} vs ${game.away_team} (${dateFormatted})${labelSuffix}`;
    elements.weeklyGameSelect.appendChild(opt);
  });
  if (!state.selectedWeeklyGameId && state.games.length > 0) {
    const firstActive = state.games.find(g => isGameFinished(g) || (g.home_score !== null && g.away_score !== null));
    state.selectedWeeklyGameId = firstActive ? firstActive.id : state.games[0].id;
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

  if (account && Boolean(account.is_admin)) {
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
  elements.accountSelect.innerHTML = '<option value="">-- Choose Shared Family Account --</option>';
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

// Check if game guesses are locked (Kickoff passed or final scores entered / game finished)
function isGameLocked(game) {
  if (!game) return false;

  // 1. If game is marked finished or final scores entered, game is locked
  if (isGameFinished(game) || (game.home_score !== null && game.away_score !== null)) {
    return true;
  }

  // 2. If kickoff time has passed, game is locked
  const kickoffTime = getGameStartTimestamp(game);
  if (kickoffTime && Date.now() >= kickoffTime) {
    return true;
  }

  return false;
}

// Countdown & Upcoming Game Banner
function setupCountdown() {
  if (state.countdownInterval) clearInterval(state.countdownInterval);

  // Check if there is a currently live/in-progress game
  const liveGame = state.games.find(g => !isGameFinished(g) && (g.home_score !== null && g.away_score !== null));

  if (liveGame) {
    elements.bannerHome.textContent = liveGame.home_team || 'BYU';
    elements.bannerAway.textContent = liveGame.away_team || 'Opponent';
    if (elements.bannerHomeLogo) {
      elements.bannerHomeLogo.src = getTeamLogoUrl(liveGame.home_team);
      elements.bannerHomeLogo.alt = liveGame.home_team;
    }
    if (elements.bannerAwayLogo) {
      elements.bannerAwayLogo.src = getTeamLogoUrl(liveGame.away_team);
      elements.bannerAwayLogo.alt = liveGame.away_team;
    }
    elements.cdDays.textContent = 'LI';
    elements.cdHours.textContent = 'VE';
    elements.cdMins.textContent = '00';
    elements.cdSecs.textContent = '00';
    elements.guessProgressIndicator.textContent = `🔴 GAME IN PROGRESS — Live Score: ${liveGame.home_team} ${liveGame.home_score} - ${liveGame.away_score} ${liveGame.away_team}`;
    return;
  }

  // Otherwise find next uncompleted upcoming game
  const upcomingGame = state.games
    .filter(g => !isGameFinished(g) && g.home_score === null && g.away_score === null)
    .sort((a, b) => {
      const dateA = a.start_date || a.start_time || '';
      const dateB = b.start_date || b.start_time || '';
      return dateA.localeCompare(dateB);
    })[0];

  if (!upcomingGame) {
    elements.bannerHome.textContent = 'BYU';
    elements.bannerAway.textContent = 'Season Ended';
    if (elements.bannerHomeLogo) elements.bannerHomeLogo.src = getTeamLogoUrl('BYU');
    if (elements.bannerAwayLogo) elements.bannerAwayLogo.style.display = 'none';
    elements.cdDays.textContent = '00';
    elements.cdHours.textContent = '00';
    elements.cdMins.textContent = '00';
    elements.cdSecs.textContent = '00';
    elements.guessProgressIndicator.textContent = '🎉 Season Completed!';
    return;
  }

  elements.bannerHome.textContent = upcomingGame.home_team || 'BYU';
  elements.bannerAway.textContent = upcomingGame.away_team || 'Opponent';
  if (elements.bannerHomeLogo) {
    elements.bannerHomeLogo.style.display = 'block';
    elements.bannerHomeLogo.src = getTeamLogoUrl(upcomingGame.home_team);
    elements.bannerHomeLogo.alt = upcomingGame.home_team;
  }
  if (elements.bannerAwayLogo) {
    elements.bannerAwayLogo.style.display = 'block';
    elements.bannerAwayLogo.src = getTeamLogoUrl(upcomingGame.away_team);
    elements.bannerAwayLogo.alt = upcomingGame.away_team;
  }

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
      const playerColor = player.color || getPlayerColor(player.playerId);
      const bgStyle = `background: linear-gradient(135deg, ${hexToRgba(playerColor, 0.38)} 0%, ${hexToRgba(playerColor, 0.16)} 100%); border: 1px solid ${hexToRgba(playerColor, 0.65)}; box-shadow: 0 4px 16px ${hexToRgba(playerColor, 0.25)};`;
      item.setAttribute('style', bgStyle);

      item.innerHTML = `
        <div class="leader-left">
          <div class="rank ${rankClass}">#${player.rank}</div>
          <div class="player-dot" style="background:${playerColor}; box-shadow: 0 0 10px ${playerColor}; border: 2px solid rgba(255,255,255,0.9);"></div>
          <div class="player-info">
            <div class="player-name">${player.playerName}${fireBadge}</div>
            <div class="account-sub">${player.accountName}</div>
          </div>
        </div>
        <div class="leader-right">
          <div class="score-tag">${player.totalScore} <span style="font-size:0.7rem; color:rgba(241,245,249,0.8);">pts</span></div>
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

    const { standings, game, isCompleted, isLive } = computeWeeklyLeaderboard(gameId, state.players, state.games, state.guesses, state.accounts);

    const homeLogo = getTeamLogoUrl(game.home_team);
    const awayLogo = getTeamLogoUrl(game.away_team);

    elements.standingsTitle.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <img src="${homeLogo}" class="team-logo-md" alt="${game.home_team}" onerror="this.style.display='none'" />
        <span>${game.home_team} vs ${game.away_team}</span>
        <img src="${awayLogo}" class="team-logo-md" alt="${game.away_team}" onerror="this.style.display='none'" />
      </div>
    `;
    elements.dropRulesBadge.style.display = 'inline-block';
    if (isCompleted) {
      elements.dropRulesBadge.textContent = `🏆 Final Score: ${game.home_team} ${game.home_score} - ${game.away_score} ${game.away_team}`;
    } else if (isLive) {
      elements.dropRulesBadge.textContent = `🔴 Live Score (In Progress): ${game.home_team} ${game.home_score} - ${game.away_score} ${game.away_team}`;
    } else {
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
      const playerColor = player.color || getPlayerColor(player.playerId);
      const bgStyle = `background: linear-gradient(135deg, ${hexToRgba(playerColor, 0.38)} 0%, ${hexToRgba(playerColor, 0.16)} 100%); border: 1px solid ${hexToRgba(playerColor, 0.65)}; box-shadow: 0 4px 16px ${hexToRgba(playerColor, 0.25)};`;
      item.setAttribute('style', bgStyle);

      item.innerHTML = `
        <div class="leader-left">
          <div class="rank ${rankClass}">#${player.rank}</div>
          <div class="player-dot" style="background:${playerColor}; box-shadow: 0 0 10px ${playerColor}; border: 2px solid rgba(255,255,255,0.9);"></div>
          <div class="player-info">
            <div class="player-name">${player.playerName}${exactBadge}</div>
            <div class="account-sub">Guess: <strong style="color:#FFF;">${guessStr}</strong> • ${player.accountName}</div>
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
  const selectedGame = state.games.find(g => g.id === selectedGameId);
  const isLocked = isGameLocked(selectedGame);
  const accountPlayers = state.players.filter(p => p.account_id === state.currentAccount.id);

  elements.playerGuessesContainer.innerHTML = '';

  if (selectedGame) {
    const matchHeaderCard = document.createElement('div');
    matchHeaderCard.className = 'card';
    matchHeaderCard.style.padding = '12px 16px';
    matchHeaderCard.style.marginBottom = '14px';
    matchHeaderCard.style.background = 'linear-gradient(135deg, rgba(0, 98, 184, 0.2) 0%, rgba(255, 199, 44, 0.12) 100%)';
    matchHeaderCard.style.border = '1px solid rgba(0, 98, 184, 0.3)';
    matchHeaderCard.style.display = 'flex';
    matchHeaderCard.style.justifyContent = 'space-around';
    matchHeaderCard.style.alignItems = 'center';

    matchHeaderCard.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
        <img src="${getTeamLogoUrl(selectedGame.home_team)}" class="team-logo-img" alt="${selectedGame.home_team}" onerror="this.style.display='none'" />
        <span style="font-weight:800; font-size:0.95rem; color:var(--text-bright);">${selectedGame.home_team}</span>
      </div>
      <div style="font-weight:900; color:var(--byu-gold); font-size:1.1rem; padding:0 8px;">VS</div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
        <img src="${getTeamLogoUrl(selectedGame.away_team)}" class="team-logo-img" alt="${selectedGame.away_team}" onerror="this.style.display='none'" />
        <span style="font-weight:800; font-size:0.95rem; color:var(--text-bright);">${selectedGame.away_team}</span>
      </div>
    `;
    elements.playerGuessesContainer.appendChild(matchHeaderCard);
  }

  if (isLocked) {
    const lockNotice = document.createElement('div');
    lockNotice.style.background = 'rgba(239, 68, 68, 0.15)';
    lockNotice.style.color = '#F87171';
    lockNotice.style.border = '1px solid rgba(239, 68, 68, 0.3)';
    lockNotice.style.padding = '10px 14px';
    lockNotice.style.borderRadius = 'var(--radius-sm)';
    lockNotice.style.marginBottom = '14px';
    lockNotice.style.textAlign = 'center';
    lockNotice.style.fontWeight = '700';
    lockNotice.style.fontSize = '0.9rem';
    lockNotice.innerHTML = '🔒 GUESSES LOCKED — Kickoff has passed for this game!';
    elements.playerGuessesContainer.appendChild(lockNotice);
  }

  if (accountPlayers.length === 0) {
    const emptyNotice = document.createElement('div');
    emptyNotice.style.textAlign = 'center';
    emptyNotice.style.color = 'var(--text-muted)';
    emptyNotice.style.padding = '16px';
    emptyNotice.innerHTML = 'No players added to your family account yet. Click <strong>"➕ Add Player"</strong> above!';
    elements.playerGuessesContainer.appendChild(emptyNotice);
    return;
  }

  accountPlayers.forEach(player => {
    const existingGuess = state.guesses.find(g => g.game_id === selectedGameId && g.player_id === player.id);
    const homeVal = existingGuess ? (existingGuess.home !== null ? existingGuess.home : '') : '';
    const awayVal = existingGuess ? (existingGuess.away !== null ? existingGuess.away : '') : '';
    const currentColor = getPlayerColor(player.id);

    const row = document.createElement('div');
    row.className = 'card player-guess-card';
    const bgStyle = `background: linear-gradient(135deg, ${hexToRgba(currentColor, 0.38)} 0%, ${hexToRgba(currentColor, 0.16)} 100%); border: 1px solid ${hexToRgba(currentColor, 0.65)}; box-shadow: 0 4px 16px ${hexToRgba(currentColor, 0.25)};`;
    row.setAttribute('style', `padding: 14px 16px; margin-bottom: 12px; ${bgStyle}${isLocked ? ' opacity: 0.75;' : ''}`);

    row.innerHTML = `
      <div style="font-weight:700; margin-bottom:10px; display:flex; align-items:center; justify-content:space-between;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="display:inline-block; width:16px; height:16px; border-radius:50%; background:${currentColor}; box-shadow:0 0 10px ${currentColor}; border:2px solid rgba(255,255,255,0.9);"></span>
          <span style="font-weight:800; font-size:1.05rem; color:#FFF; text-shadow:0 1px 3px rgba(0,0,0,0.5);">${player.name}</span>
        </div>
        <button type="button" class="btn btn-secondary edit-player-btn" data-player-id="${player.id}" style="width:auto; padding:4px 10px; font-size:0.75rem; background:rgba(0,0,0,0.3); border-color:rgba(255,255,255,0.3);">
          ✏️ Edit
        </button>
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
        <div>
          <label style="font-size:0.75rem; color:rgba(241,245,249,0.85); display:block; margin-bottom:4px; font-weight:600;">BYU / Home</label>
          <input type="number" class="form-control guess-home" data-player-id="${player.id}" value="${homeVal}" placeholder="Score" min="0" ${isLocked ? 'disabled' : ''} />
        </div>
        <div>
          <label style="font-size:0.75rem; color:rgba(241,245,249,0.85); display:block; margin-bottom:4px; font-weight:600;">Opponent / Away</label>
          <input type="number" class="form-control guess-away" data-player-id="${player.id}" value="${awayVal}" placeholder="Score" min="0" ${isLocked ? 'disabled' : ''} />
        </div>
      </div>
    `;
    elements.playerGuessesContainer.appendChild(row);
  });

  // Attach Edit Player Button Listeners
  document.querySelectorAll('.edit-player-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pId = parseInt(e.target.getAttribute('data-player-id'), 10);
      openEditPlayerModal(pId);
    });
  });

  // Disable save button if locked
  const saveBtn = document.querySelector('#bulkGuessForm button[type="submit"]');
  if (saveBtn) {
    if (isLocked) {
      saveBtn.disabled = true;
      saveBtn.style.opacity = '0.5';
      saveBtn.style.cursor = 'not-allowed';
      saveBtn.innerHTML = '<span>🔒 Guesses Locked for this Game</span>';
    } else {
      saveBtn.disabled = false;
      saveBtn.style.opacity = '1';
      saveBtn.style.cursor = 'pointer';
      saveBtn.innerHTML = '<span>Save All Family Guesses</span> 💾';
    }
  }
}

// Open Edit Player Card
function openEditPlayerModal(playerId) {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return;

  elements.editPlayerId.value = player.id;
  elements.editPlayerName.value = player.name;
  
  initEditPlayerColorPicker(getPlayerColor(player.id));
  
  elements.addPlayerCard.style.display = 'none';
  elements.editPlayerCard.style.display = 'block';
  elements.editPlayerCard.scrollIntoView({ behavior: 'smooth' });
}

// Edit Player Form Handler
async function handleEditPlayer(e) {
  e.preventDefault();
  const playerId = parseInt(elements.editPlayerId.value, 10);
  const newName = elements.editPlayerName.value.trim();

  if (!playerId || !newName) return;

  try {
    await SupabaseAPI.updatePlayer(playerId, newName);
    savePlayerColor(playerId, state.editingPlayerColor);
    await loadData();
    elements.editPlayerCard.style.display = 'none';
    renderPlayerGuesses();
    renderLeaderboard();
    alert('Player updated successfully!');
  } catch (err) {
    alert('Failed to update player.');
  }
}

// Bulk Save Guesses
async function handleSaveGuesses(e) {
  e.preventDefault();
  const gameId = parseInt(elements.guessGameSelect.value, 10);
  if (!gameId) return;

  const game = state.games.find(g => g.id === gameId);
  if (isGameLocked(game)) {
    alert('🔒 Guesses for this game are locked because kickoff has passed!');
    return;
  }

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
    const isFinished = isGameFinished(game);
    const isLive = !isFinished && (game.home_score !== null && game.away_score !== null);

    let scoreDisplay = 'VS';
    if (isFinished) {
      scoreDisplay = `<span style="color:var(--byu-gold);">🏆 ${game.home_score} - ${game.away_score} (Final)</span>`;
    } else if (isLive) {
      scoreDisplay = `<span style="color:#F87171; font-weight:900;">🔴 ${game.home_score} - ${game.away_score} (Live)</span>`;
    }

    const homeLogo = getTeamLogoUrl(game.home_team);
    const awayLogo = getTeamLogoUrl(game.away_team);

    card.innerHTML = `
      <div style="font-size:0.8rem; color:var(--byu-gold); font-weight:700; margin-bottom:6px;">
        📅 ${dateStr}
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:1.05rem;">
        <div style="display:flex; align-items:center; gap:8px;">
          <img src="${homeLogo}" class="team-logo-md" alt="${game.home_team}" onerror="this.style.display='none'" />
          <span>${game.home_team}</span>
        </div>
        <div style="font-size:0.9rem; text-align:center; padding:0 8px;">${scoreDisplay}</div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span>${game.away_team}</span>
          <img src="${awayLogo}" class="team-logo-md" alt="${game.away_team}" onerror="this.style.display='none'" />
        </div>
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
    row.style.padding = '14px';
    row.style.marginBottom = '12px';

    const isFinished = isGameFinished(game);
    const isLive = !isFinished && (game.home_score !== null && game.away_score !== null);
    const dateFormatted = formatGameDateTime(game);
    const homeLogo = getTeamLogoUrl(game.home_team);
    const awayLogo = getTeamLogoUrl(game.away_team);

    let statusBadge = '';
    if (isFinished) {
      statusBadge = '<span style="background:rgba(16,185,129,0.2); color:#10B981; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700; border:1px solid rgba(16,185,129,0.4);">🏆 FINISHED</span>';
    } else if (isLive) {
      statusBadge = '<span style="background:rgba(239,68,68,0.2); color:#F87171; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700; border:1px solid rgba(239,68,68,0.4);">🔴 LIVE IN PROGRESS</span>';
    } else {
      statusBadge = '<span style="background:rgba(59,130,246,0.2); color:#60A5FA; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700; border:1px solid rgba(59,130,246,0.4);">🗓️ UPCOMING</span>';
    }

    row.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <div>
          <div style="font-weight:800; font-size:1rem; color:var(--text-bright); display:flex; align-items:center; gap:6px;">
            <img src="${homeLogo}" class="team-logo-sm" alt="${game.home_team}" onerror="this.style.display='none'" />
            <span>${game.home_team}</span>
            <span style="color:var(--byu-gold); font-size:0.85rem; margin:0 2px;">vs</span>
            <img src="${awayLogo}" class="team-logo-sm" alt="${game.away_team}" onerror="this.style.display='none'" />
            <span>${game.away_team}</span>
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${dateFormatted}</div>
        </div>
        <div>${statusBadge}</div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:12px;">
        <div>
          <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">${game.home_team} Score</label>
          <input type="number" class="form-control admin-home-score" data-game-id="${game.id}" value="${game.home_score !== null ? game.home_score : ''}" placeholder="0" min="0" />
        </div>
        <div>
          <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">${game.away_team} Score</label>
          <input type="number" class="form-control admin-away-score" data-game-id="${game.id}" value="${game.away_score !== null ? game.away_score : ''}" placeholder="0" min="0" />
        </div>
      </div>

      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.06);">
        <label style="font-size:0.85rem; display:flex; align-items:center; gap:8px; cursor:pointer; color:var(--byu-gold); font-weight:700;">
          <input type="checkbox" class="admin-is-finished" data-game-id="${game.id}" ${isFinished ? 'checked' : ''} style="width:18px; height:18px; accent-color:var(--byu-gold);" />
          <span>🏁 Mark Game Finished</span>
        </label>
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn btn-secondary save-live-btn" data-game-id="${game.id}" style="width:auto; padding:6px 12px; font-size:0.8rem;">
            ⏱️ Save Live Score
          </button>
          <button type="button" class="btn btn-gold save-final-btn" data-game-id="${game.id}" style="width:auto; padding:6px 12px; font-size:0.8rem;">
            🏆 Mark Final Score
          </button>
        </div>
      </div>
    `;
    elements.adminScoreList.appendChild(row);
  });

  // Attach listener for Save Live Score
  document.querySelectorAll('.save-live-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const gameId = parseInt(e.target.getAttribute('data-game-id'), 10);
      const homeInput = document.querySelector(`.admin-home-score[data-game-id="${gameId}"]`);
      const awayInput = document.querySelector(`.admin-away-score[data-game-id="${gameId}"]`);
      const isFinishedInput = document.querySelector(`.admin-is-finished[data-game-id="${gameId}"]`);
      const game = state.games.find(g => g.id === gameId);

      if (homeInput.value === '' || awayInput.value === '') {
        alert('Please enter scores for both teams.');
        return;
      }

      const isFinished = isFinishedInput ? isFinishedInput.checked : false;

      try {
        await SupabaseAPI.updateGameScore(gameId, homeInput.value, awayInput.value, isFinished);
        await loadData();
        renderAdminView();
        setupCountdown();
        renderLeaderboard();
        alert(`⏱️ Live score updated: ${game ? game.home_team : 'Home'} ${homeInput.value} - ${awayInput.value} ${game ? game.away_team : 'Away'}${isFinished ? ' (Marked Finished)' : ' (In Progress)'}`);
      } catch (err) {
        alert('Failed to update score.');
      }
    });
  });

  // Attach listener for Mark Final Score
  document.querySelectorAll('.save-final-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const gameId = parseInt(e.target.getAttribute('data-game-id'), 10);
      const homeInput = document.querySelector(`.admin-home-score[data-game-id="${gameId}"]`);
      const awayInput = document.querySelector(`.admin-away-score[data-game-id="${gameId}"]`);
      const game = state.games.find(g => g.id === gameId);

      if (homeInput.value === '' || awayInput.value === '') {
        alert('Please enter scores for both teams.');
        return;
      }

      try {
        await SupabaseAPI.updateGameScore(gameId, homeInput.value, awayInput.value, true);
        await loadData();
        renderAdminView();
        setupCountdown();
        renderLeaderboard();
        alert(`🏆 Final score set & marked Finished! ${game ? game.home_team : 'Home'} ${homeInput.value} - ${awayInput.value} ${game ? game.away_team : 'Away'}`);
      } catch (err) {
        alert('Failed to mark game as finished.');
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
