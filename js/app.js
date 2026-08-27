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
  refreshAccountsBtn: document.getElementById('refreshAccountsBtn'),
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

  // Cosmo Easter Egg & Music Controls
  brandLogo: document.getElementById('brandLogo'),
  cosmoModal: document.getElementById('cosmoModal'),
  closeCosmoBtn: document.getElementById('closeCosmoBtn'),
  cosmoDanceTrigger: document.getElementById('cosmoDanceTrigger'),
  musicToggleBtn: document.getElementById('musicToggleBtn'),
  musicBtnIcon: document.getElementById('musicBtnIcon'),
  musicEqualizer: document.getElementById('musicEqualizer'),
  pumpUpAudio: document.getElementById('pumpUpAudio'),

  // Prizes View
  prizesAccountAvgScore: document.getElementById('prizesAccountAvgScore'),
  prizesAccountPlayerCount: document.getElementById('prizesAccountPlayerCount'),
  prizeCard1: document.getElementById('prizeCard1'),
  prizeIcon1: document.getElementById('prizeIcon1'),
  prizeBadge1: document.getElementById('prizeBadge1'),
  prizeProgressBar1: document.getElementById('prizeProgressBar1'),
  prizeProgressText1: document.getElementById('prizeProgressText1'),
  prizeStatusText1: document.getElementById('prizeStatusText1'),
  prizeBtnLabel1: document.getElementById('prizeBtnLabel1'),
  cosmoDanceTrigger: document.getElementById('cosmoDanceTrigger'),
  cosmoBtnImg: document.getElementById('cosmoBtnImg'),

  prizeCard2: document.getElementById('prizeCard2'),
  prizeIcon2: document.getElementById('prizeIcon2'),
  prizeBadge2: document.getElementById('prizeBadge2'),
  prizeProgressBar2: document.getElementById('prizeProgressBar2'),
  prizeProgressText2: document.getElementById('prizeProgressText2'),
  prizeStatusText2: document.getElementById('prizeStatusText2'),
  prizeBtnLabel2: document.getElementById('prizeBtnLabel2'),
  musicToggleBtn: document.getElementById('musicToggleBtn'),
  prizeBadgeImg2: document.getElementById('prizeBadgeImg2'),

  prizeCard3: document.getElementById('prizeCard3'),
  prizeIcon3: document.getElementById('prizeIcon3'),
  prizeBadge3: document.getElementById('prizeBadge3'),
  prizeProgressBar3: document.getElementById('prizeProgressBar3'),
  prizeProgressText3: document.getElementById('prizeProgressText3'),
  prizeStatusText3: document.getElementById('prizeStatusText3'),
  prizeBtnLabel3: document.getElementById('prizeBtnLabel3'),
  fireSpinnerTrigger: document.getElementById('fireSpinnerTrigger'),
  prizeBadgeImg3: document.getElementById('prizeBadgeImg3'),

  prizeCard4: document.getElementById('prizeCard4'),
  prizeIcon4: document.getElementById('prizeIcon4'),
  prizeBadge4: document.getElementById('prizeBadge4'),
  prizeProgressBar4: document.getElementById('prizeProgressBar4'),
  prizeProgressText4: document.getElementById('prizeProgressText4'),
  prizeStatusText4: document.getElementById('prizeStatusText4'),
  prizeBtnLabel4: document.getElementById('prizeBtnLabel4'),
  stadiumWaveTrigger: document.getElementById('stadiumWaveTrigger'),
  prizeBadgeImg4: document.getElementById('prizeBadgeImg4'),

  prizeCard5: document.getElementById('prizeCard5'),
  prizeIcon5: document.getElementById('prizeIcon5'),
  prizeBadge5: document.getElementById('prizeBadge5'),
  prizeProgressBar5: document.getElementById('prizeProgressBar5'),
  prizeProgressText5: document.getElementById('prizeProgressText5'),
  prizeStatusText5: document.getElementById('prizeStatusText5'),
  prizeBtnLabel5: document.getElementById('prizeBtnLabel5'),
  drumHypeTrigger: document.getElementById('drumHypeTrigger'),
  prizeBadgeImg5: document.getElementById('prizeBadgeImg5')
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
async function loadData(forceRefresh = false) {
  try {
    const [accs, plys, gms, gss] = await Promise.all([
      SupabaseAPI.getAccounts(forceRefresh),
      SupabaseAPI.getPlayers(forceRefresh),
      SupabaseAPI.getGames(forceRefresh),
      SupabaseAPI.getGuesses(forceRefresh)
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

  if (elements.refreshAccountsBtn) {
    elements.refreshAccountsBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      elements.refreshAccountsBtn.textContent = '⌛ Refreshing...';
      await loadData(true);
      renderAccountsDropdown();
      elements.refreshAccountsBtn.textContent = '🔄 Refresh';
    });
  }

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

// Smart Tap Listener to differentiate genuine taps from scroll dragging on mobile
function attachSmartTapListener(element, callback) {
  if (!element) return;
  let startX = 0;
  let startY = 0;
  let isScroll = false;
  let touchHandled = false;

  element.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isScroll = false;
      touchHandled = false;
    }
  }, { passive: true });

  element.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      const diffX = Math.abs(e.touches[0].clientX - startX);
      const diffY = Math.abs(e.touches[0].clientY - startY);
      if (diffX > 8 || diffY > 8) {
        isScroll = true; // User is scrolling/swiping!
      }
    }
  }, { passive: true });

  element.addEventListener('touchend', (e) => {
    if (!isScroll) {
      touchHandled = true;
      e.preventDefault();
      callback(e);
    }
    isScroll = false;
  });

  element.addEventListener('click', (e) => {
    if (touchHandled) {
      touchHandled = false;
      return;
    }
    if (!isScroll) {
      callback(e);
    }
  });
}

  // Smart Tap Listeners for Prize Badges (Prevents accidental triggers when scrolling!)
  attachSmartTapListener(elements.cosmoDanceTrigger, () => triggerCosmoDance());
  attachSmartTapListener(elements.musicToggleBtn, () => toggleMusic());
  attachSmartTapListener(elements.fireSpinnerTrigger, () => triggerFireSpinner());
  attachSmartTapListener(elements.stadiumWaveTrigger, () => triggerStadiumWave());
  attachSmartTapListener(elements.drumHypeTrigger, () => triggerDrumHype());
}

// Launch Fireworks Display on Screen
function launchFireworksShow() {
  if (!window.confetti) return;

  const count = 180;
  const fire = (particleRatio, opts) => {
    window.confetti({
      origin: { y: 0.7 },
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  };

  fire(0.25, { spread: 30, startVelocity: 60, colors: ['#0062B8', '#FFC72C', '#FFFFFF'] });
  fire(0.2, { spread: 65, colors: ['#003865', '#FFC72C', '#34D399'] });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9, colors: ['#0062B8', '#FFFFFF', '#FFC72C'] });
  fire(0.1, { spread: 120, startVelocity: 30, decay: 0.92, scalar: 1.2, colors: ['#FFC72C', '#0062B8'] });
  fire(0.1, { spread: 130, startVelocity: 50, colors: ['#FFFFFF', '#FFC72C'] });
}

// Trigger Fireworks Display (Secret Surprise #1 - Unlocked at 150 Avg Pts)
function triggerFireworksPrize() {
  const { avgScore } = getAccountAverageScore();
  const accId = state.currentAccount ? state.currentAccount.id : 'guest';
  const isUnwrapped1 = localStorage.getItem(`byu_prize_unwrapped_1_${accId}`) === 'true';

  if (avgScore < 150) {
    alert(`🔒 Secret Present #1 is locked!\n\nYour family account currently has ${avgScore} average points. Your family needs 150 average points to unwrap this present!`);
    return;
  }

  // If points reached but present not unwrapped yet, unwrap present!
  if (!isUnwrapped1) {
    localStorage.setItem(`byu_prize_unwrapped_1_${accId}`, 'true');
    renderPrizesView();
  }

  launchFireworksShow();
}

// Audio Controller for Pump Up Song (Secret Surprise #2 - Unlocked at 300 Avg Pts)
let isMusicPlaying = false;

function toggleMusic() {
  const { avgScore } = getAccountAverageScore();
  const accId = state.currentAccount ? state.currentAccount.id : 'guest';
  const isUnwrapped2 = localStorage.getItem(`byu_prize_unwrapped_2_${accId}`) === 'true';

  if (avgScore < 300) {
    alert(`🔒 Secret Present #2 is locked!\n\nYour family account currently has ${avgScore} average points. Your family needs 300 average points to unwrap this present!`);
    return;
  }

  // If points reached but present not unwrapped yet, unwrap present!
  if (!isUnwrapped2) {
    localStorage.setItem(`byu_prize_unwrapped_2_${accId}`, 'true');
    renderPrizesView();
    return;
  }

  const audioEl = elements.pumpUpAudio || document.getElementById('pumpUpAudio');
  const btn = elements.musicToggleBtn;
  const icon = elements.musicBtnIcon;
  const eq = elements.musicEqualizer;

  if (!audioEl) return;

  if (isMusicPlaying || !audioEl.paused) {
    audioEl.pause();
    isMusicPlaying = false;
    if (btn) btn.classList.remove('playing');
    if (icon) icon.style.display = 'block';
    if (eq) eq.style.display = 'none';
  } else {
    audioEl.loop = true;

    const playPromise = audioEl.play();
    isMusicPlaying = true;
    if (btn) btn.classList.add('playing');
    if (icon) icon.style.display = 'none';
    if (eq) eq.style.display = 'flex';

    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Primary audio path failed, trying fallback:', err);
        audioEl.src = 'assets/PumpUpSong.mp3';
        audioEl.play().then(() => {
          isMusicPlaying = true;
          if (btn) btn.classList.add('playing');
          if (icon) icon.style.display = 'none';
          if (eq) eq.style.display = 'flex';
        }).catch(e => {
          console.error('All audio playback attempts failed:', e);
          isMusicPlaying = false;
          if (btn) btn.classList.remove('playing');
          if (icon) icon.style.display = 'block';
          if (eq) eq.style.display = 'none';
        });
      });
    }
  }

  renderPrizesView();
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
}

// Polynesian Fire Knife Dancer Engine (integrated from C:\Main\Personal\Code\FunCss\fireDancer.html)
let fireAnimFrame = null;
let fireThrowing = false;
let fireThrowTime = 0;
const FIRE_THROW_DURATION = 1800; // ms
let fireStick = null;
let fireParticles = [];

class FireEmber {
  constructor(x, y, fast) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 6 + 2;
    this.speedX = (Math.random() - 0.5) * (fast ? 6 : 4);
    this.speedY = (Math.random() - 0.5) * (fast ? 6 : 4) - 1;
    this.color = ['#ffcc00', '#ff4500', '#ff8c00', '#ffffff'][Math.floor(Math.random() * 4)];
    this.life = 1;
    this.decay = Math.random() * 0.05 + 0.02;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= this.decay;
    if (this.size > 0.5) this.size -= 0.1;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function initFireDancerEngine() {
  const canvas = document.getElementById('fireCanvas');
  const dancer = document.getElementById('fireDancerChar');
  if (!canvas || !dancer) return () => {};

  const ctx = canvas.getContext('2d');

  const createEmbers = () => {
    if (fireThrowing) return;
    const time = Date.now() * 0.0157;
    const cx = 200, cy = 150, r = 100;
    fireParticles.push(new FireEmber(cx + Math.cos(time) * r, cy + Math.sin(time) * r));
    fireParticles.push(new FireEmber(cx - Math.cos(time) * r, cy - Math.sin(time) * r));
  };

  const catchBurst = () => {
    for (let i = 0; i < 40; i++) {
      fireParticles.push(new FireEmber(200, 150, true));
    }
  };

  const drawAirborneStick = () => {
    if (!fireStick) return;
    const elapsed = Date.now() - fireThrowTime;
    const progress = Math.min(elapsed / FIRE_THROW_DURATION, 1);

    const catchY = 150;
    const peakY = -60;
    const arcY = catchY + (peakY - catchY) * Math.sin(progress * Math.PI);

    fireStick.angle += fireStick.spin;
    const x = 200;
    const y = arcY;
    const halfLen = 110;

    if (y < canvas.height + 20) {
      const ex1 = x + Math.cos(fireStick.angle) * halfLen;
      const ey1 = y + Math.sin(fireStick.angle) * halfLen;
      const ex2 = x - Math.cos(fireStick.angle) * halfLen;
      const ey2 = y - Math.sin(fireStick.angle) * halfLen;
      if (Math.random() < 0.8) fireParticles.push(new FireEmber(ex1, ey1, true));
      if (Math.random() < 0.8) fireParticles.push(new FireEmber(ex2, ey2, true));

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(fireStick.angle);

      ctx.strokeStyle = '#5c3a21';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-halfLen, 0);
      ctx.lineTo(halfLen, 0);
      ctx.stroke();

      [-halfLen, halfLen].forEach(ex => {
        const grad = ctx.createRadialGradient(ex, 0, 2, ex, 0, 20);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.3, 'rgba(255,204,0,0.9)');
        grad.addColorStop(1, 'rgba(255,69,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ex, 0, 20, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }
  };

  const animateFire = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    createEmbers();
    drawAirborneStick();

    for (let i = fireParticles.length - 1; i >= 0; i--) {
      fireParticles[i].update();
      fireParticles[i].draw(ctx);
      if (fireParticles[i].life <= 0) fireParticles.splice(i, 1);
    }

    fireAnimFrame = requestAnimationFrame(animateFire);
  };

  const tossKnife = () => {
    if (fireThrowing) return;
    fireThrowing = true;
    fireThrowTime = Date.now();
    dancer.classList.add('throwing');
    fireStick = { angle: 0, spin: 0.18 };

    setTimeout(catchBurst, FIRE_THROW_DURATION);
    setTimeout(() => {
      fireThrowing = false;
      fireStick = null;
      dancer.classList.remove('throwing');
    }, FIRE_THROW_DURATION + 80);
  };

  dancer.onclick = tossKnife;
  dancer.ontouchend = (e) => {
    e.preventDefault();
    tossKnife();
  };

  if (!fireAnimFrame) {
    animateFire();
  }

  return tossKnife;
}

function stopFireDancerEngine() {
  if (fireAnimFrame) {
    cancelAnimationFrame(fireAnimFrame);
    fireAnimFrame = null;
  }
  fireParticles = [];
  fireThrowing = false;
  fireStick = null;
  const dancer = document.getElementById('fireDancerChar');
  if (dancer) dancer.classList.remove('throwing');
}

// Trigger 4th Quarter Fire Spinner Show (Secret Surprise #3 - Unlocked at 450 Avg Pts)
let isFireSpinnerActive = false;

function triggerFireSpinner() {
  const { avgScore } = getAccountAverageScore();
  const accId = state.currentAccount ? state.currentAccount.id : 'guest';
  const isUnwrapped3 = localStorage.getItem(`byu_prize_unwrapped_3_${accId}`) === 'true';

  if (avgScore < 450) {
    alert(`🔒 Secret Present #3 is locked!\n\nYour family account currently has ${avgScore} average points. Your family needs 450 average points to unwrap this present!`);
    return;
  }

  // If points reached but present not unwrapped yet, unwrap present!
  if (!isUnwrapped3) {
    localStorage.setItem(`byu_prize_unwrapped_3_${accId}`, 'true');
    launchFireworksShow();
    renderPrizesView();
    return;
  }

  if (isFireSpinnerActive) return;
  isFireSpinnerActive = true;

  const overlay = document.getElementById('fireSpinnerOverlay');
  if (!overlay) return;

  overlay.style.display = 'flex';
  const triggerToss = initFireDancerEngine();

  // Automatically perform high throw & catch sequence
  setTimeout(() => {
    if (triggerToss) triggerToss();
  }, 250);

  // Automatically dismiss after throw and catch sequence completes (~2.8s)
  setTimeout(() => {
    overlay.style.display = 'none';
    stopFireDancerEngine();
    isFireSpinnerActive = false;
  }, 2850);
}

// Trigger Full Screen Dancing Cosmo Animation (Secret Surprise #1 - Unlocked at 150 Avg Pts)
let isCosmoDancing = false;
function triggerCosmoDance() {
  const { avgScore } = getAccountAverageScore();
  const accId = state.currentAccount ? state.currentAccount.id : 'guest';
  const isUnwrapped1 = localStorage.getItem(`byu_prize_unwrapped_1_${accId}`) === 'true';

  if (avgScore < 150) {
    alert(`🔒 Secret Present #1 is locked!\n\nYour family account currently has ${avgScore} average points. Your family needs 150 average points to unwrap this present!`);
    return;
  }

  // If points reached but present not unwrapped yet, unwrap present!
  if (!isUnwrapped1) {
    localStorage.setItem(`byu_prize_unwrapped_1_${accId}`, 'true');
    if (window.confetti) {
      window.confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    }
    renderPrizesView();
    return;
  }

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
  if (cheerText) cheerText.classList.add('cosmo-cheer-pop');

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

// Trigger LaVell Edwards Stadium Cougar Wave (Secret Surprise #4 - Unlocked at 600 Avg Pts)
let isStadiumWaveActive = false;

function triggerStadiumWave() {
  const { avgScore } = getAccountAverageScore();
  const accId = state.currentAccount ? state.currentAccount.id : 'guest';
  const isUnwrapped4 = localStorage.getItem(`byu_prize_unwrapped_4_${accId}`) === 'true';

  if (avgScore < 600) {
    alert(`🔒 Secret Present #4 is locked!\n\nYour family account currently has ${avgScore} average points. Your family needs 600 average points to unwrap this present!`);
    return;
  }

  // If points reached but present not unwrapped yet, unwrap present!
  if (!isUnwrapped4) {
    localStorage.setItem(`byu_prize_unwrapped_4_${accId}`, 'true');
    if (window.confetti) {
      window.confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
    }
    renderPrizesView();
    return;
  }

  if (isStadiumWaveActive) return;
  isStadiumWaveActive = true;

  const overlay = document.getElementById('stadiumWaveOverlay');
  if (!overlay) return;

  overlay.style.display = 'flex';
  initStadiumWaveEngine();
}

// Trigger BYU Game Day Drum Hype (Secret Surprise #5 - Unlocked at 750 Avg Pts)
let isDrumHypeActive = false;

function triggerDrumHype() {
  const { avgScore } = getAccountAverageScore();
  const accId = state.currentAccount ? state.currentAccount.id : 'guest';
  const isUnwrapped5 = localStorage.getItem(`byu_prize_unwrapped_5_${accId}`) === 'true';

  if (avgScore < 750) {
    alert(`🔒 Secret Present #5 is locked!\n\nYour family account currently has ${avgScore} average points. Your family needs 750 average points to unwrap this present!`);
    return;
  }

  // If points reached but present not unwrapped yet, unwrap present!
  if (!isUnwrapped5) {
    localStorage.setItem(`byu_prize_unwrapped_5_${accId}`, 'true');
    if (window.confetti) {
      window.confetti({ particleCount: 250, spread: 130, origin: { y: 0.6 } });
    }
    renderPrizesView();
    return;
  }

  if (isDrumHypeActive) return;
  isDrumHypeActive = true;

  const overlay = document.getElementById('drumHypeOverlay');
  if (!overlay) return;

  overlay.style.display = 'flex';
  initDrumHypeEngine();
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

// LaVell Edwards Stadium Cougar Wave Engine (integrated from C:\Main\Personal\Code\FunCss\Wave.html)
let waveAnimFrame = null;
let wavePosition = 0;
let waveSpeed = 0.035;
let wavePaused = false;
let waveDirection = 1;
let waveFans = [];

function initStadiumWaveEngine() {
  const canvas = document.getElementById('stadiumWaveCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  const resize = () => {
    // Sized for phone & mobile screens
    const availWidth = Math.min(window.innerWidth - 16, 950);
    const availHeight = Math.min(window.innerHeight - 130, 600);
    canvas.width = availWidth;
    canvas.height = availHeight;
  };
  resize();

  // Color Constants
  const COLOR_FIELD = '#1e7b34';
  const COLOR_EZ_BLUE = '#002E5D';
  const COLOR_STADIUM_CONCRETE = '#334155';
  const COLOR_WALL = '#1e293b';

  const FAN_CLOTHES = ['#0062b8', '#002E5D', '#ffffff', '#0062b8', '#d97706', '#ffffff'];
  const FAN_SKIN = ['#f8d7da', '#f5c6cb', '#e2e8f0', '#d4a373', '#8d5524', '#c68642'];

  // Generate Stadium Fans Grid if empty
  if (waveFans.length === 0) {
    const rows = 14;
    const fansPerRow = 120;

    for (let r = 0; r < rows; r++) {
      for (let i = 0; i < fansPerRow; i++) {
        const angle = (i / fansPerRow) * Math.PI * 2;
        const rx = 230 + r * 10.5;
        const ry = 125 + r * 6.8;

        const shirtColor = FAN_CLOTHES[Math.floor(Math.random() * FAN_CLOTHES.length)];
        const skinColor = FAN_SKIN[Math.floor(Math.random() * FAN_SKIN.length)];
        const heightOffset = Math.random() * 2;

        waveFans.push({ angle, row: r, rx, ry, shirtColor, skinColor, heightOffset });
      }
    }
    waveFans.sort((a, b) => a.ry - b.ry);
  }

  const drawField = (centerX, centerY, scale) => {
    ctx.save();
    ctx.translate(centerX, centerY);

    ctx.beginPath();
    ctx.ellipse(0, 0, 205 * scale, 105 * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_FIELD;
    ctx.fill();
    ctx.lineWidth = Math.max(2, 4 * scale);
    ctx.strokeStyle = '#0f5122';
    ctx.stroke();

    const fw = 250 * scale;
    const fh = 105 * scale;
    ctx.fillStyle = '#22863a';
    ctx.fillRect(-fw/2, -fh/2, fw, fh);

    const ezWidth = 28 * scale;
    ctx.fillStyle = COLOR_EZ_BLUE;
    ctx.fillRect(-fw/2, -fh/2, ezWidth, fh);
    ctx.fillRect(fw/2 - ezWidth, -fh/2, ezWidth, fh);

    const fontSize = Math.max(9, Math.round(13 * scale));
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.save();
    ctx.translate(-fw/2 + ezWidth / 2, 0);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("B Y U", 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(fw/2 - ezWidth / 2, 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillText("BYU", 0, 0);
    ctx.restore();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    const numLines = 10;
    const step = (fw - ezWidth * 2) / numLines;
    for (let i = 1; i < numLines; i++) {
      const x = -fw/2 + ezWidth + i * step;
      ctx.beginPath();
      ctx.moveTo(x, -fh/2);
      ctx.lineTo(x, fh/2);
      ctx.stroke();
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    ctx.strokeRect(-fw/2, -fh/2, fw, fh);

    const yFontSize = Math.max(14, Math.round(26 * scale));
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${yFontSize}px serif`;
    ctx.fillText("Y", 0, 2 * scale);

    ctx.restore();
  };

  const drawStadiumStructure = (centerX, centerY, scale) => {
    ctx.save();
    ctx.translate(centerX, centerY);

    ctx.beginPath();
    ctx.ellipse(0, 0, 380 * scale, 225 * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_STADIUM_CONCRETE;
    ctx.fill();
    ctx.lineWidth = Math.max(3, 5 * scale);
    ctx.strokeStyle = COLOR_WALL;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, 0, 218 * scale, 115 * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    ctx.restore();
  };

  const renderWave = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + (4 * (canvas.height / 500));
    const scale = Math.min(canvas.width / 800, canvas.height / 480);

    drawStadiumStructure(centerX, centerY, scale);
    drawField(centerX, centerY, scale);

    waveFans.forEach(fan => {
      const x = centerX + Math.cos(fan.angle) * (fan.rx * scale);
      const y = centerY + Math.sin(fan.angle) * (fan.ry * scale);

      let diff = fan.angle - wavePosition;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      const waveWidth = 0.55;
      let waveHeight = 0;

      if (Math.abs(diff) < waveWidth) {
        const normalized = (diff + waveWidth) / (waveWidth * 2);
        waveHeight = Math.sin(normalized * Math.PI) * (18 * scale);
      }

      const currentY = y - waveHeight - (fan.heightOffset * scale);
      const isStanding = waveHeight > (3 * scale);

      if (isStanding) {
        ctx.beginPath();
        ctx.ellipse(x, y + (2 * scale), 4 * scale, 2 * scale, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();
      }

      const fanW = Math.max(3, 6 * scale);
      const fanH = Math.max(4, (isStanding ? 8 : 6) * scale);
      ctx.fillStyle = fan.shirtColor;
      ctx.fillRect(x - fanW / 2, currentY - fanH / 2, fanW, fanH);

      const headRadius = Math.max(1.8, 3 * scale);
      ctx.fillStyle = fan.skinColor;
      ctx.beginPath();
      ctx.arc(x, currentY - fanH / 2 - headRadius, headRadius, 0, Math.PI * 2);
      ctx.fill();

      if (isStanding) {
        ctx.strokeStyle = fan.skinColor;
        ctx.lineWidth = Math.max(1, 1.5 * scale);
        ctx.beginPath();
        ctx.moveTo(x - (2 * scale), currentY - (4 * scale));
        ctx.lineTo(x - (6 * scale), currentY - ((12 * scale) + waveHeight * 0.2));
        ctx.moveTo(x + (2 * scale), currentY - (4 * scale));
        ctx.lineTo(x + (6 * scale), currentY - ((12 * scale) + waveHeight * 0.2));
        ctx.stroke();
      }
    });

    if (!wavePaused) {
      wavePosition += waveSpeed * waveDirection;
      if (wavePosition > Math.PI * 2) wavePosition -= Math.PI * 2;
      if (wavePosition < 0) wavePosition += Math.PI * 2;
    }

    waveAnimFrame = requestAnimationFrame(renderWave);
  };

  // Wire Controls
  const speedBtn = document.getElementById('waveSpeedBtn');
  const reverseBtn = document.getElementById('waveReverseBtn');
  const closeBtn = document.getElementById('closeWaveBtn');

  const speeds = [
    { label: 'Speed: Slow', val: 0.02 },
    { label: 'Speed: Normal', val: 0.035 },
    { label: 'Speed: Fast!', val: 0.06 }
  ];
  let speedIndex = 1;

  if (speedBtn) {
    speedBtn.onclick = () => {
      speedIndex = (speedIndex + 1) % speeds.length;
      waveSpeed = speeds[speedIndex].val;
      speedBtn.innerText = speeds[speedIndex].label;
    };
  }

  if (reverseBtn) {
    reverseBtn.onclick = () => {
      waveDirection *= -1;
      reverseBtn.classList.toggle('active');
    };
  }

  if (closeBtn) {
    closeBtn.onclick = () => {
      stopStadiumWaveEngine();
    };
  }

  if (!waveAnimFrame) {
    renderWave();
  }
}

function stopStadiumWaveEngine() {
  if (waveAnimFrame) {
    cancelAnimationFrame(waveAnimFrame);
    waveAnimFrame = null;
  }
  const overlay = document.getElementById('stadiumWaveOverlay');
  if (overlay) overlay.style.display = 'none';
  isStadiumWaveActive = false;
}

// Trigger LaVell Edwards Stadium Cougar Wave (Secret Surprise #5 - Unlocked at 750 Avg Pts)
let isStadiumWaveActive = false;

function triggerStadiumWave() {
  const { avgScore } = getAccountAverageScore();
  const accId = state.currentAccount ? state.currentAccount.id : 'guest';
  const isUnwrapped5 = localStorage.getItem(`byu_prize_unwrapped_5_${accId}`) === 'true';

  if (avgScore < 750) {
    alert(`🔒 Secret Present #5 is locked!\n\nYour family account currently has ${avgScore} average points. Your family needs 750 average points to unwrap this present!`);
    return;
  }

  // If points reached but present not unwrapped yet, unwrap present!
  if (!isUnwrapped5) {
    localStorage.setItem(`byu_prize_unwrapped_5_${accId}`, 'true');
    if (window.confetti) {
      window.confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
    }
    renderPrizesView();
    return;
  }

  if (isStadiumWaveActive) return;
  isStadiumWaveActive = true;

  const overlay = document.getElementById('stadiumWaveOverlay');
  if (!overlay) return;

  overlay.style.display = 'flex';
  initStadiumWaveEngine();
}

// BYU Game Day Drum Hype Engine (integrated from C:\Main\Personal\Code\FunCss\Drum.html)
let drumAudioCtx = null;
let drumStrikeLeft = true;
let drumLastHitTime = 0;
let drumAutoClapTimeout = null;
let drumHypeInterval = null;
let drumHypeEnergy = 0;
let drumCurrentBPM = 0;
let isDrumHypeActive = false;

function initDrumAudioCtx() {
  if (!drumAudioCtx) {
    drumAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (drumAudioCtx.state === 'suspended') {
    drumAudioCtx.resume();
  }
}

function playSynthesizedDrumSound() {
  initDrumAudioCtx();
  if (!drumAudioCtx) return;

  const osc = drumAudioCtx.createOscillator();
  const oscGain = drumAudioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(90, drumAudioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(0.01, drumAudioCtx.currentTime + 0.35);

  oscGain.gain.setValueAtTime(1.5, drumAudioCtx.currentTime);
  oscGain.gain.exponentialRampToValueAtTime(0.001, drumAudioCtx.currentTime + 0.35);

  osc.connect(oscGain);
  oscGain.connect(drumAudioCtx.destination);

  const bufferSize = drumAudioCtx.sampleRate * 0.25;
  const buffer = drumAudioCtx.createBuffer(1, bufferSize, drumAudioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = drumAudioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = drumAudioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;

  const noiseGain = drumAudioCtx.createGain();
  noiseGain.gain.setValueAtTime(1.0, drumAudioCtx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, drumAudioCtx.currentTime + 0.3);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(drumAudioCtx.destination);

  osc.start();
  noise.start();
  osc.stop(drumAudioCtx.currentTime + 0.35);
  noise.stop(drumAudioCtx.currentTime + 0.3);
}

function playSynthesizedClapSound() {
  initDrumAudioCtx();
  if (!drumAudioCtx) return;

  const now = drumAudioCtx.currentTime;
  const bufferSize = drumAudioCtx.sampleRate * 0.25;
  const buffer = drumAudioCtx.createBuffer(1, bufferSize, drumAudioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = drumAudioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = drumAudioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1200;
  filter.Q.value = 1.0;

  const gain = drumAudioCtx.createGain();

  gain.gain.setValueAtTime(0, now);
  gain.gain.setValueAtTime(1.0, now + 0.005);
  gain.gain.setValueAtTime(0.2, now + 0.015);
  gain.gain.setValueAtTime(1.2, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(drumAudioCtx.destination);

  noise.start(now);
  noise.stop(now + 0.25);
}

function initDrumHypeEngine() {
  const malletDrum = document.getElementById('mallet-drum');
  const clapDrum = document.getElementById('clap-drum');
  const malletLeft = document.getElementById('mallet-left');
  const malletRight = document.getElementById('mallet-right');
  const hypeBar = document.getElementById('hype-bar');
  const hypeFrame = document.getElementById('hype-meter-frame');
  const hypeTitle = document.getElementById('hype-title');
  const bpmDisplay = document.getElementById('bpm-display');
  const closeBtn = document.getElementById('closeDrumBtn');

  if (!malletDrum || !clapDrum) return;

  const hypeObjects = [
    { id: 'obj-ref', threshold: 20 },
    { id: 'obj-flag', threshold: 40 },
    { id: 'obj-cheer', threshold: 60 },
    { id: 'obj-player', threshold: 80 },
    { id: 'obj-cosmo', threshold: 95 }
  ];

  const triggerClap = () => {
    playSynthesizedClapSound();
    clapDrum.classList.add('auto-hit');
    setTimeout(() => clapDrum.classList.remove('auto-hit'), 120);
  };

  const updateUI = () => {
    if (hypeBar) hypeBar.style.width = `${drumHypeEnergy}%`;

    if (hypeFrame && hypeTitle) {
      if (drumHypeEnergy >= 90) {
        hypeFrame.classList.remove('flash-medium');
        hypeFrame.classList.add('flash-max');
        hypeTitle.textContent = "🔥 MAXIMUM HYPE! 🔥";
        hypeTitle.style.color = "#ffd700";
      } else if (drumHypeEnergy >= 60) {
        hypeFrame.classList.remove('flash-max');
        hypeFrame.classList.add('flash-medium');
        hypeTitle.textContent = "⚡ GETTING WILD! ⚡";
        hypeTitle.style.color = "#00b7ff";
      } else {
        hypeFrame.classList.remove('flash-medium', 'flash-max');
        hypeTitle.textContent = "STADIUM ENERGY";
        hypeTitle.style.color = "#0084ff";
      }
    }

    hypeObjects.forEach(obj => {
      const el = document.getElementById(obj.id);
      if (el) {
        if (drumHypeEnergy >= obj.threshold) {
          el.classList.add('visible');
        } else {
          el.classList.remove('visible');
        }
      }
    });
  };

  const processTempo = (intervalMs) => {
    if (intervalMs <= 0) return;
    drumCurrentBPM = Math.min(300, Math.round(60000 / intervalMs));
    if (bpmDisplay) bpmDisplay.textContent = `BPM: ${drumCurrentBPM}`;

    if (drumCurrentBPM >= 80) {
      const gain = (drumCurrentBPM / 80) * 2.5;
      drumHypeEnergy = Math.min(100, drumHypeEnergy + gain);
    } else {
      drumHypeEnergy = Math.max(0, drumHypeEnergy - 2);
    }

    updateUI();
  };

  const handleTempoDrumHit = () => {
    const now = Date.now();
    playSynthesizedDrumSound();

    const activeMallet = drumStrikeLeft ? malletLeft : malletRight;
    if (activeMallet) {
      activeMallet.classList.add('strike');
      setTimeout(() => activeMallet.classList.remove('strike'), 100);
    }
    drumStrikeLeft = !drumStrikeLeft;

    if (drumLastHitTime > 0) {
      const interval = now - drumLastHitTime;
      if (interval > 50) {
        processTempo(interval);
        if (drumAutoClapTimeout) clearTimeout(drumAutoClapTimeout);
        drumAutoClapTimeout = setTimeout(triggerClap, interval);
      }
    }

    drumLastHitTime = now;
  };

  malletDrum.onclick = handleTempoDrumHit;
  malletDrum.ontouchend = (e) => {
    e.preventDefault();
    handleTempoDrumHit();
  };

  clapDrum.onclick = triggerClap;
  clapDrum.ontouchend = (e) => {
    e.preventDefault();
    triggerClap();
  };

  if (closeBtn) {
    closeBtn.onclick = stopDrumHypeEngine;
  }

  // Energy decay loop
  if (!drumHypeInterval) {
    drumHypeInterval = setInterval(() => {
      const now = Date.now();
      if (drumLastHitTime > 0 && now - drumLastHitTime > 800) {
        drumHypeEnergy = Math.max(0, drumHypeEnergy - 4);
        drumCurrentBPM = Math.max(0, drumCurrentBPM - 15);
        if (bpmDisplay) bpmDisplay.textContent = `BPM: ${drumCurrentBPM}`;
        updateUI();
      }
    }, 150);
  }
}

function stopDrumHypeEngine() {
  if (drumHypeInterval) {
    clearInterval(drumHypeInterval);
    drumHypeInterval = null;
  }
  if (drumAutoClapTimeout) {
    clearTimeout(drumAutoClapTimeout);
    drumAutoClapTimeout = null;
  }
  drumHypeEnergy = 0;
  drumCurrentBPM = 0;
  drumLastHitTime = 0;

  const overlay = document.getElementById('drumHypeOverlay');
  if (overlay) overlay.style.display = 'none';
  isDrumHypeActive = false;
}

// Trigger BYU Game Day Drum Hype (Secret Surprise #6 - Unlocked at 900 Avg Pts)
function triggerDrumHype() {
  const { avgScore } = getAccountAverageScore();
  const accId = state.currentAccount ? state.currentAccount.id : 'guest';
  const isUnwrapped6 = localStorage.getItem(`byu_prize_unwrapped_6_${accId}`) === 'true';

  if (avgScore < 900) {
    alert(`🔒 Secret Present #6 is locked!\n\nYour family account currently has ${avgScore} average points. Your family needs 900 average points to unwrap this present!`);
    return;
  }

  // If points reached but present not unwrapped yet, unwrap present!
  if (!isUnwrapped6) {
    localStorage.setItem(`byu_prize_unwrapped_6_${accId}`, 'true');
    if (window.confetti) {
      window.confetti({ particleCount: 250, spread: 130, origin: { y: 0.6 } });
    }
    renderPrizesView();
    return;
  }

  if (isDrumHypeActive) return;
  isDrumHypeActive = true;

  const overlay = document.getElementById('drumHypeOverlay');
  if (!overlay) return;

  overlay.style.display = 'flex';
  initDrumHypeEngine();
}

// Calculate Family Account Average Score
function getAccountAverageScore() {
  if (!state.currentAccount) return { avgScore: 0, playerCount: 0 };

  const accountPlayers = state.players.filter(p => p.account_id === state.currentAccount.id);
  const playerCount = accountPlayers.length;
  if (playerCount === 0) return { avgScore: 0, playerCount: 0 };

  const leaderboardResult = computeLeaderboard(state.players, state.games, state.guesses, state.accounts);
  let totalScoreSum = 0;

  accountPlayers.forEach(player => {
    const stat = leaderboardResult.standings.find(s => s.playerId === player.id);
    if (stat) {
      totalScoreSum += stat.totalScore;
    }
  });

  const avgScore = Math.round(totalScoreSum / playerCount);
  return { avgScore, playerCount };
}

// Render Prizes View
function renderPrizesView() {
  const { avgScore, playerCount } = getAccountAverageScore();
  const accId = state.currentAccount ? state.currentAccount.id : 'guest';
  const isUnwrapped1 = localStorage.getItem(`byu_prize_unwrapped_1_${accId}`) === 'true';
  const isUnwrapped2 = localStorage.getItem(`byu_prize_unwrapped_2_${accId}`) === 'true';
  const isUnwrapped3 = localStorage.getItem(`byu_prize_unwrapped_3_${accId}`) === 'true';
  const isUnwrapped4 = localStorage.getItem(`byu_prize_unwrapped_4_${accId}`) === 'true';
  const isUnwrapped5 = localStorage.getItem(`byu_prize_unwrapped_5_${accId}`) === 'true';

  if (elements.prizesAccountAvgScore) {
    elements.prizesAccountAvgScore.innerHTML = `${avgScore} <span style="font-size:0.9rem; color:var(--byu-gold);">avg pts</span>`;
  }
  if (elements.prizesAccountPlayerCount) {
    elements.prizesAccountPlayerCount.textContent = state.currentAccount 
      ? `${playerCount} family player(s) registered under ${state.currentAccount.name}`
      : 'Log in to view your family account average points!';
  }

  // Surprise #1 (Cosmo Mascot Dance Party - 150 Avg Pts)
  const unlockThreshold1 = 150;
  const isUnlocked1 = avgScore >= unlockThreshold1;
  const pct1 = Math.min(100, Math.round((avgScore / unlockThreshold1) * 100));

  if (elements.prizeProgressBar1) elements.prizeProgressBar1.style.width = `${pct1}%`;
  if (elements.prizeProgressText1) elements.prizeProgressText1.textContent = `${avgScore} / ${unlockThreshold1} avg pts`;

  const badgeBox1 = elements.cosmoDanceTrigger;
  const badgeImg1 = elements.cosmoBtnImg || document.getElementById('cosmoBtnImg');

  if (!isUnlocked1) {
    if (elements.prizeIcon1) elements.prizeIcon1.textContent = '🔒';
    if (elements.prizeBadge1) {
      elements.prizeBadge1.className = 'prize-badge locked';
      elements.prizeBadge1.textContent = `Requires ${unlockThreshold1} Avg Pts`;
    }
    if (elements.prizeStatusText1) elements.prizeStatusText1.textContent = `Needs ${unlockThreshold1 - avgScore} more avg pts to unwrap`;
    if (badgeBox1) badgeBox1.className = 'prize-badge-box locked';
    if (badgeImg1) badgeImg1.src = 'assets/gift_box.jpg';
    if (elements.prizeBtnLabel1) elements.prizeBtnLabel1.textContent = `🔒 Locked Present (150 Avg Pts Needed)`;
  } else if (!isUnwrapped1) {
    if (elements.prizeIcon1) elements.prizeIcon1.textContent = '🎁';
    if (elements.prizeBadge1) {
      elements.prizeBadge1.className = 'prize-badge unlocked';
      elements.prizeBadge1.textContent = 'READY TO UNWRAP!';
    }
    if (elements.prizeStatusText1) elements.prizeStatusText1.textContent = 'Points Reached! Tap Present to Unwrap!';
    if (badgeBox1) badgeBox1.className = 'prize-badge-box ready-to-unwrap';
    if (badgeImg1) badgeImg1.src = 'assets/gift_box.jpg';
    if (elements.prizeBtnLabel1) elements.prizeBtnLabel1.textContent = '🎁 TAP PRESENT TO UNWRAP YOUR SURPRISE!';
  } else {
    if (elements.prizeIcon1) elements.prizeIcon1.textContent = '✨';
    if (elements.prizeBadge1) {
      elements.prizeBadge1.className = 'prize-badge unlocked';
      elements.prizeBadge1.textContent = 'UNLOCKED BADGE';
    }
    if (elements.prizeStatusText1) elements.prizeStatusText1.textContent = 'Unlocked Badge! Tap to launch Cosmo Dance!';
    if (badgeBox1) badgeBox1.className = 'prize-badge-box unlocked-badge';
    if (badgeImg1) badgeImg1.src = 'assets/cosmo_head.jpg';
    if (elements.prizeBtnLabel1) elements.prizeBtnLabel1.textContent = '🐾 Secret Surprise #1 (Tap for Cosmo Dance!)';
  }

  // Surprise #2 (BYU Pump Up Song - 300 Avg Pts)
  const unlockThreshold2 = 300;
  const isUnlocked2 = avgScore >= unlockThreshold2;
  const pct2 = Math.min(100, Math.round((avgScore / unlockThreshold2) * 100));

  if (elements.prizeProgressBar2) elements.prizeProgressBar2.style.width = `${pct2}%`;
  if (elements.prizeProgressText2) elements.prizeProgressText2.textContent = `${avgScore} / ${unlockThreshold2} avg pts`;

  const badgeBox2 = elements.musicToggleBtn;
  const badgeImg2 = elements.prizeBadgeImg2 || document.getElementById('prizeBadgeImg2');

  if (!isUnlocked2) {
    if (elements.prizeIcon2) elements.prizeIcon2.textContent = '🔒';
    if (elements.prizeBadge2) {
      elements.prizeBadge2.className = 'prize-badge locked';
      elements.prizeBadge2.textContent = `Requires ${unlockThreshold2} Avg Pts`;
    }
    if (elements.prizeStatusText2) elements.prizeStatusText2.textContent = `Needs ${unlockThreshold2 - avgScore} more avg pts to unwrap`;
    if (badgeBox2) badgeBox2.className = 'prize-badge-box locked';
    if (badgeImg2) badgeImg2.src = 'assets/gift_box.jpg';
    if (elements.prizeBtnLabel2) elements.prizeBtnLabel2.textContent = `🔒 Locked Present (300 Avg Pts Needed)`;
  } else if (!isUnwrapped2) {
    if (elements.prizeIcon2) elements.prizeIcon2.textContent = '🎁';
    if (elements.prizeBadge2) {
      elements.prizeBadge2.className = 'prize-badge unlocked';
      elements.prizeBadge2.textContent = 'READY TO UNWRAP!';
    }
    if (elements.prizeStatusText2) elements.prizeStatusText2.textContent = 'Points Reached! Tap Present to Unwrap!';
    if (badgeBox2) badgeBox2.className = 'prize-badge-box ready-to-unwrap';
    if (badgeImg2) badgeImg2.src = 'assets/gift_box.jpg';
    if (elements.prizeBtnLabel2) elements.prizeBtnLabel2.textContent = '🎁 TAP PRESENT TO UNWRAP YOUR SURPRISE!';
  } else {
    if (elements.prizeIcon2) elements.prizeIcon2.textContent = '✨';
    if (elements.prizeBadge2) {
      elements.prizeBadge2.className = 'prize-badge unlocked';
      elements.prizeBadge2.textContent = 'UNLOCKED BADGE';
    }
    if (elements.prizeStatusText2) elements.prizeStatusText2.textContent = 'Unlocked Badge! Tap to play/pause song!';
    if (badgeBox2) {
      badgeBox2.className = isMusicPlaying ? 'prize-badge-box unlocked-badge playing' : 'prize-badge-box unlocked-badge';
    }
    if (badgeImg2) badgeImg2.src = 'assets/music_badge.jpg';
    if (elements.prizeBtnLabel2) {
      elements.prizeBtnLabel2.textContent = isMusicPlaying ? '🎵 Secret Surprise #2 (Playing - Tap to Stop)' : '🎵 Secret Surprise #2 (Tap to Play Song)';
    }
  }

  // Surprise #3 (4th Quarter Fire Spinner Show - 450 Avg Pts)
  const unlockThreshold3 = 450;
  const isUnlocked3 = avgScore >= unlockThreshold3;
  const pct3 = Math.min(100, Math.round((avgScore / unlockThreshold3) * 100));

  if (elements.prizeProgressBar3) elements.prizeProgressBar3.style.width = `${pct3}%`;
  if (elements.prizeProgressText3) elements.prizeProgressText3.textContent = `${avgScore} / ${unlockThreshold3} avg pts`;

  const badgeBox3 = elements.fireSpinnerTrigger;
  const badgeImg3 = elements.prizeBadgeImg3 || document.getElementById('prizeBadgeImg3');

  if (!isUnlocked3) {
    if (elements.prizeIcon3) elements.prizeIcon3.textContent = '🔒';
    if (elements.prizeBadge3) {
      elements.prizeBadge3.className = 'prize-badge locked';
      elements.prizeBadge3.textContent = `Requires ${unlockThreshold3} Avg Pts`;
    }
    if (elements.prizeStatusText3) elements.prizeStatusText3.textContent = `Needs ${unlockThreshold3 - avgScore} more avg pts to unwrap`;
    if (badgeBox3) badgeBox3.className = 'prize-badge-box locked';
    if (badgeImg3) badgeImg3.src = 'assets/gift_box.jpg';
    if (elements.prizeBtnLabel3) elements.prizeBtnLabel3.textContent = `🔒 Locked Present (450 Avg Pts Needed)`;
  } else if (!isUnwrapped3) {
    if (elements.prizeIcon3) elements.prizeIcon3.textContent = '🎁';
    if (elements.prizeBadge3) {
      elements.prizeBadge3.className = 'prize-badge unlocked';
      elements.prizeBadge3.textContent = 'READY TO UNWRAP!';
    }
    if (elements.prizeStatusText3) elements.prizeStatusText3.textContent = 'Points Reached! Tap Present to Unwrap!';
    if (badgeBox3) badgeBox3.className = 'prize-badge-box ready-to-unwrap';
    if (badgeImg3) badgeImg3.src = 'assets/gift_box.jpg';
    if (elements.prizeBtnLabel3) elements.prizeBtnLabel3.textContent = '🎁 TAP PRESENT TO UNWRAP YOUR SURPRISE!';
  } else {
    if (elements.prizeIcon3) elements.prizeIcon3.textContent = '✨';
    if (elements.prizeBadge3) {
      elements.prizeBadge3.className = 'prize-badge unlocked';
      elements.prizeBadge3.textContent = 'UNLOCKED BADGE';
    }
    if (elements.prizeStatusText3) elements.prizeStatusText3.textContent = 'Unlocked Badge! Tap to launch Fire Knife Spinner!';
    if (badgeBox3) badgeBox3.className = 'prize-badge-box unlocked-badge';
    if (badgeImg3) badgeImg3.src = 'assets/fire_spinner_badge.jpg';
    if (elements.prizeBtnLabel3) elements.prizeBtnLabel3.textContent = '🔥 Secret Surprise #3 (Tap for Fire Knife Spinner!)';
  }

  // Surprise #4 (LaVell Edwards Stadium Cougar Wave - 600 Avg Pts)
  const unlockThreshold4 = 600;
  const isUnlocked4 = avgScore >= unlockThreshold4;
  const pct4 = Math.min(100, Math.round((avgScore / unlockThreshold4) * 100));

  if (elements.prizeProgressBar4) elements.prizeProgressBar4.style.width = `${pct4}%`;
  if (elements.prizeProgressText4) elements.prizeProgressText4.textContent = `${avgScore} / ${unlockThreshold4} avg pts`;

  const badgeBox4 = elements.stadiumWaveTrigger;
  const badgeImg4 = elements.prizeBadgeImg4 || document.getElementById('prizeBadgeImg4');

  if (!isUnlocked4) {
    if (elements.prizeIcon4) elements.prizeIcon4.textContent = '🔒';
    if (elements.prizeBadge4) {
      elements.prizeBadge4.className = 'prize-badge locked';
      elements.prizeBadge4.textContent = `Requires ${unlockThreshold4} Avg Pts`;
    }
    if (elements.prizeStatusText4) elements.prizeStatusText4.textContent = `Needs ${unlockThreshold4 - avgScore} more avg pts to unwrap`;
    if (badgeBox4) badgeBox4.className = 'prize-badge-box locked';
    if (badgeImg4) badgeImg4.src = 'assets/gift_box.jpg';
    if (elements.prizeBtnLabel4) elements.prizeBtnLabel4.textContent = `🔒 Locked Present (600 Avg Pts Needed)`;
  } else if (!isUnwrapped4) {
    if (elements.prizeIcon4) elements.prizeIcon4.textContent = '🎁';
    if (elements.prizeBadge4) {
      elements.prizeBadge4.className = 'prize-badge unlocked';
      elements.prizeBadge4.textContent = 'READY TO UNWRAP!';
    }
    if (elements.prizeStatusText4) elements.prizeStatusText4.textContent = 'Points Reached! Tap Present to Unwrap!';
    if (badgeBox4) badgeBox4.className = 'prize-badge-box ready-to-unwrap';
    if (badgeImg4) badgeImg4.src = 'assets/gift_box.jpg';
    if (elements.prizeBtnLabel4) elements.prizeBtnLabel4.textContent = '🎁 TAP PRESENT TO UNWRAP YOUR SURPRISE!';
  } else {
    if (elements.prizeIcon4) elements.prizeIcon4.textContent = '✨';
    if (elements.prizeBadge4) {
      elements.prizeBadge4.className = 'prize-badge unlocked';
      elements.prizeBadge4.textContent = 'UNLOCKED BADGE';
    }
    if (elements.prizeStatusText4) elements.prizeStatusText4.textContent = 'Unlocked Badge! Tap to launch Stadium Wave!';
    if (badgeBox4) badgeBox4.className = 'prize-badge-box unlocked-badge';
    if (badgeImg4) badgeImg4.src = 'assets/stadium_badge.jpg';
    if (elements.prizeBtnLabel4) elements.prizeBtnLabel4.textContent = '🌊 Secret Surprise #4 (Tap for Stadium Wave!)';
  }

  // Surprise #5 (BYU Game Day Drum Hype - 750 Avg Pts)
  const unlockThreshold5 = 750;
  const isUnlocked5 = avgScore >= unlockThreshold5;
  const pct5 = Math.min(100, Math.round((avgScore / unlockThreshold5) * 100));

  if (elements.prizeProgressBar5) elements.prizeProgressBar5.style.width = `${pct5}%`;
  if (elements.prizeProgressText5) elements.prizeProgressText5.textContent = `${avgScore} / ${unlockThreshold5} avg pts`;

  const badgeBox5 = elements.drumHypeTrigger;
  const badgeImg5 = elements.prizeBadgeImg5 || document.getElementById('prizeBadgeImg5');

  if (!isUnlocked5) {
    if (elements.prizeIcon5) elements.prizeIcon5.textContent = '🔒';
    if (elements.prizeBadge5) {
      elements.prizeBadge5.className = 'prize-badge locked';
      elements.prizeBadge5.textContent = `Requires ${unlockThreshold5} Avg Pts`;
    }
    if (elements.prizeStatusText5) elements.prizeStatusText5.textContent = `Needs ${unlockThreshold5 - avgScore} more avg pts to unwrap`;
    if (badgeBox5) badgeBox5.className = 'prize-badge-box locked';
    if (badgeImg5) badgeImg5.src = 'assets/gift_box.jpg';
    if (elements.prizeBtnLabel5) elements.prizeBtnLabel5.textContent = `🔒 Locked Present (750 Avg Pts Needed)`;
  } else if (!isUnwrapped5) {
    if (elements.prizeIcon5) elements.prizeIcon5.textContent = '🎁';
    if (elements.prizeBadge5) {
      elements.prizeBadge5.className = 'prize-badge unlocked';
      elements.prizeBadge5.textContent = 'READY TO UNWRAP!';
    }
    if (elements.prizeStatusText5) elements.prizeStatusText5.textContent = 'Points Reached! Tap Present to Unwrap!';
    if (badgeBox5) badgeBox5.className = 'prize-badge-box ready-to-unwrap';
    if (badgeImg5) badgeImg5.src = 'assets/gift_box.jpg';
    if (elements.prizeBtnLabel5) elements.prizeBtnLabel5.textContent = '🎁 TAP PRESENT TO UNWRAP YOUR SURPRISE!';
  } else {
    if (elements.prizeIcon5) elements.prizeIcon5.textContent = '✨';
    if (elements.prizeBadge5) {
      elements.prizeBadge5.className = 'prize-badge unlocked';
      elements.prizeBadge5.textContent = 'UNLOCKED BADGE';
    }
    if (elements.prizeStatusText5) elements.prizeStatusText5.textContent = 'Unlocked Badge! Tap to launch Drum Show!';
    if (badgeBox5) badgeBox5.className = 'prize-badge-box unlocked-badge';
    if (badgeImg5) badgeImg5.src = 'assets/drum_badge.jpg';
    if (elements.prizeBtnLabel5) elements.prizeBtnLabel5.textContent = '🥁 Secret Surprise #5 (Tap for Drum Show!)';
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

  if (viewId === 'loginView') {
    renderAccountsDropdown();
    if (!state.accounts || state.accounts.length === 0) {
      loadData(true).then(() => renderAccountsDropdown());
    }
  }
  if (viewId === 'leaderboardView') renderLeaderboard();
  if (viewId === 'guessesView') renderGuessesView();
  if (viewId === 'gamesView') renderSchedule();
  if (viewId === 'prizesView') renderPrizesView();
  if (viewId === 'adminView') renderAdminView();
}

// Session Persistence
function restoreSession() {
  const savedAcc = localStorage.getItem('byu_guess_account');
  if (savedAcc) {
    try {
      const parsed = JSON.parse(savedAcc);
      const matched = state.accounts.find(a => String(a.id) === String(parsed.id) && String(a.pin) === String(parsed.pin));
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
  if (!elements.accountSelect) return;
  elements.accountSelect.innerHTML = '';

  if (!state.accounts || state.accounts.length === 0) {
    const opt = document.createElement('option');
    opt.value = "";
    opt.textContent = "-- No Accounts Found (Tap 🔄 to retry) --";
    elements.accountSelect.appendChild(opt);
    return;
  }

  const defaultOpt = document.createElement('option');
  defaultOpt.value = "";
  defaultOpt.textContent = "-- Choose Shared Family Account --";
  elements.accountSelect.appendChild(defaultOpt);

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
  const rawAccValue = elements.accountSelect ? elements.accountSelect.value : '';
  if (!rawAccValue) {
    alert('Please select your shared family account from the dropdown list!');
    return;
  }

  const accId = parseInt(rawAccValue, 10);
  const pinRaw = elements.accountPin ? elements.accountPin.value.trim() : '';
  const pinInput = parseInt(pinRaw, 10);

  const acc = state.accounts.find(a => a.id === accId || String(a.id) === String(rawAccValue));
  if (acc && (acc.pin === pinInput || String(acc.pin) === pinRaw || String(acc.pin) === String(pinInput))) {
    setLoggedInUser(acc);
    elements.accountPin.value = '';
  } else {
    alert('Invalid Account or PIN. Please check your PIN and try again!');
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
