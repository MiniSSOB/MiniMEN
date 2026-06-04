// ---------- STORAGE KEYS ----------
const STORAGE_USERS = "thebox_users";
const STORAGE_SESSION = "thebox_active_user";

// ---------- GLOBAL STATE ----------
let currentUser = null;          // { username, balance, lastClickTimestamp, password }
let timerInterval = null;
let isLoggedIn = false;

// DOM elements (populated after DOM ready)
let authContainer, mainPanel, balanceDisplay, timerDisplay, clickBoxBtn, resultMessageDiv, logoutBtn;

// Helper: load users from localStorage
function loadUsers() {
  const raw = localStorage.getItem(STORAGE_USERS);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch(e) { return {}; }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

// load current session
function loadSession() {
  const sessionName = localStorage.getItem(STORAGE_SESSION);
  if (sessionName) {
    const users = loadUsers();
    const userData = users[sessionName];
    if (userData && userData.username === sessionName) {
      currentUser = { ...userData };
      isLoggedIn = true;
      return true;
    } else {
      localStorage.removeItem(STORAGE_SESSION);
    }
  }
  return false;
}

// save current user state to users object
function persistCurrentUser() {
  if (!currentUser) return;
  const users = loadUsers();
  users[currentUser.username] = {
    username: currentUser.username,
    password: currentUser.password,
    balance: currentUser.balance,
    lastClickTimestamp: currentUser.lastClickTimestamp
  };
  saveUsers(users);
  localStorage.setItem(STORAGE_SESSION, currentUser.username);
}

// update UI balance
function updateBalanceUI() {
  if (balanceDisplay) {
    balanceDisplay.innerText = `$${currentUser.balance.toFixed(2)}`;
  }
}

// core timer logic: returns remaining seconds until next click allowed (0 if ready)
function getRemainingSeconds() {
  if (!currentUser || !currentUser.lastClickTimestamp) return 0;
  const last = currentUser.lastClickTimestamp;
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - last) / 1000);
  const cooldown = 300; // 5 minutes
  const remaining = cooldown - elapsedSeconds;
  return remaining > 0 ? remaining : 0;
}

// update timer display and enable/disable click button
function updateTimerUI() {
  if (!isLoggedIn || !currentUser) return;
  const remaining = getRemainingSeconds();
  if (remaining <= 0) {
    if (timerDisplay) timerDisplay.innerText = "00:00";
    if (clickBoxBtn) clickBoxBtn.style.opacity = "1";
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  } else {
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    if (timerDisplay) timerDisplay.innerText = `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
    if (clickBoxBtn) clickBoxBtn.style.opacity = "0.7";
  }
}

// start continuous countdown refresh
function startTimerRefresh() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!isLoggedIn || !currentUser) {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;
      return;
    }
    updateTimerUI();
    const rem = getRemainingSeconds();
    if (rem === 0 && clickBoxBtn) clickBoxBtn.style.opacity = "1";
    else if (rem > 0 && clickBoxBtn) clickBoxBtn.style.opacity = "0.7";
  }, 200);
}

// REWARD SYSTEM: weighted random
function getRandomReward() {
  const rand = Math.random() * 100;
  let amount = 0;
  if (rand < 55) {
    amount = Math.floor(Math.random() * 100) + 1;
  } else if (rand < 80) {
    amount = Math.floor(Math.random() * 200) + 101;
  } else if (rand < 93) {
    amount = Math.floor(Math.random() * 200) + 301;
  } else if (rand < 98) {
    amount = Math.floor(Math.random() * 300) + 501;
  } else if (rand < 99.5) {
    amount = Math.floor(Math.random() * 199) + 801;
  } else {
    amount = 1000;
  }
  return parseFloat(amount.toFixed(2));
}

function showResultMessage(msg, isError) {
  if (resultMessageDiv) {
    resultMessageDiv.innerHTML = msg;
    resultMessageDiv.style.color = isError ? "#ffaa77" : "#ffdd99";
    resultMessageDiv.style.borderColor = isError ? "#b85c2a" : "#b87c2e";
    setTimeout(() => {
      if (resultMessageDiv && !isError && isLoggedIn) 
        resultMessageDiv.innerHTML = "🔮 The Box awaits... 🔮";
      else if (resultMessageDiv && isError && isLoggedIn) {
        setTimeout(() => {
          if (resultMessageDiv && isLoggedIn) resultMessageDiv.innerHTML = "🔮 The Box awaits... 🔮";
        }, 1800);
      }
    }, 2200);
  }
}

function handleBoxClick() {
  if (!isLoggedIn || !currentUser) {
    showResultMessage("⚠️ You must be logged in!", true);
    return;
  }
  const remaining = getRemainingSeconds();
  if (remaining > 0) {
    const minutes = Math.floor(remaining / 60);
    const secs = remaining % 60;
    showResultMessage(`❌ BOX LOCKED! Wait ${minutes}m ${secs}s before next click.`, true);
    return;
  }

  const reward = getRandomReward();
  currentUser.balance += reward;
  currentUser.lastClickTimestamp = Date.now();
  persistCurrentUser();
  updateBalanceUI();

  let rarityMsg = "";
  if (reward <= 100) rarityMsg = "common drop 💰";
  else if (reward <= 300) rarityMsg = "solid loot 🎰";
  else if (reward <= 500) rarityMsg = "rare stash 🔥";
  else if (reward <= 800) rarityMsg = "LEGENDARY BOX 💎";
  else if (reward < 1000) rarityMsg = "MYTHIC HIT 🌟🌟🌟";
  else rarityMsg = "JACKPOT!! 👑 KINGS OF CHAOS BLESSING 👑";

  showResultMessage(`🎁 BOX OPENED! You got $${reward.toFixed(2)} — ${rarityMsg} 🎁`, false);
  updateTimerUI();
  if (clickBoxBtn) clickBoxBtn.style.opacity = "0.7";
}

function logout() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isLoggedIn = false;
  currentUser = null;
  localStorage.removeItem(STORAGE_SESSION);
  mainPanel.classList.add('hidden');
  renderAuthScreen('login');
}

function renderAuthScreen(mode) {
  authContainer.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'auth-panel';

  if (mode === 'login') {
    wrapper.innerHTML = `
      <div class="input-group"><label>🔐 USERNAME</label><input type="text" id="loginUsername" placeholder="ENTER CALLSIGN" autocomplete="off"></div>
      <div class="input-group"><label>🗝️ PASSWORD</label><input type="password" id="loginPassword" placeholder="******"></div>
      <button id="doLoginBtn">▶ LOGIN ◀</button>
      <div class="register-switch">⬇️ NEW RECRUIT? <span id="switchToRegister">REGISTER ACCOUNT</span></div>
      <div id="authError" class="error-message"></div>
    `;
    authContainer.appendChild(wrapper);
    const loginBtn = document.getElementById('doLoginBtn');
    const switchReg = document.getElementById('switchToRegister');
    const loginUser = document.getElementById('loginUsername');
    const loginPass = document.getElementById('loginPassword');
    const errorDiv = document.getElementById('authError');

    const doLogin = () => {
      const username = loginUser?.value.trim();
      const password = loginPass?.value.trim();
      if (!username || !password) {
        errorDiv.innerText = "❌ Username / password required.";
        return;
      }
      const users = loadUsers();
      const userRecord = users[username];
      if (!userRecord || userRecord.password !== password) {
        errorDiv.innerText = "❌ Invalid credentials or account doesn't exist.";
        return;
      }
      currentUser = {
        username: userRecord.username,
        balance: userRecord.balance,
        lastClickTimestamp: userRecord.lastClickTimestamp || null,
        password: userRecord.password
      };
      isLoggedIn = true;
      persistCurrentUser();
      enterMainGame();
    };
    loginBtn.addEventListener('click', doLogin);
    if (switchReg) switchReg.addEventListener('click', () => renderAuthScreen('register'));
    [loginUser, loginPass].forEach(inp => inp?.addEventListener('keypress', (e) => { if(e.key === 'Enter') doLogin(); }));
  } 
  else if (mode === 'register') {
    wrapper.innerHTML = `
      <div class="input-group"><label>🆕 CREATE USERNAME</label><input type="text" id="regUsername" placeholder="NO SPACES" autocomplete="off"></div>
      <div class="input-group"><label>🔒 PASSWORD</label><input type="password" id="regPassword" placeholder="min 3 chars"></div>
      <button id="doRegisterBtn">✍️ REGISTER ✍️</button>
      <div class="register-switch">🔙 ALREADY HAVE ACCESS? <span id="switchToLogin">LOGIN</span></div>
      <div id="regError" class="error-message"></div>
    `;
    authContainer.appendChild(wrapper);
    const regBtn = document.getElementById('doRegisterBtn');
    const switchLogin = document.getElementById('switchToLogin');
    const regUsername = document.getElementById('regUsername');
    const regPass = document.getElementById('regPassword');
    const errorSpan = document.getElementById('regError');

    const doRegister = () => {
      let username = regUsername?.value.trim();
      const password = regPass?.value.trim();
      if (!username || !password) {
        errorSpan.innerText = "❌ Fill both fields.";
        return;
      }
      if (password.length < 3) {
        errorSpan.innerText = "❌ Password too weak (min 3 chars).";
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errorSpan.innerText = "❌ Username can only contain letters, numbers, underscore.";
        return;
      }
      const users = loadUsers();
      if (users[username]) {
        errorSpan.innerText = "❌ Username already exists! Choose another.";
        return;
      }
      const newUser = {
        username: username,
        password: password,
        balance: 250.00,
        lastClickTimestamp: null
      };
      users[username] = newUser;
      saveUsers(users);
      currentUser = { ...newUser };
      isLoggedIn = true;
      persistCurrentUser();
      enterMainGame();
    };
    regBtn.addEventListener('click', doRegister);
    if (switchLogin) switchLogin.addEventListener('click', () => renderAuthScreen('login'));
    [regUsername, regPass].forEach(inp => inp?.addEventListener('keypress', (e) => { if(e.key === 'Enter') doRegister(); }));
  }
}

function enterMainGame() {
  if (!currentUser) return;
  if (currentUser.lastClickTimestamp === undefined) currentUser.lastClickTimestamp = null;
  if (currentUser.balance === undefined) currentUser.balance = 250;
  persistCurrentUser();

  mainPanel.classList.remove('hidden');
  authContainer.innerHTML = '';
  updateBalanceUI();
  updateTimerUI();

  // Re-attach click event
  const newBtn = clickBoxBtn.cloneNode(true);
  clickBoxBtn.parentNode.replaceChild(newBtn, clickBoxBtn);
  clickBoxBtn = newBtn;
  clickBoxBtn.addEventListener('click', handleBoxClick);

  // Re-attach logout
  const newLogout = logoutBtn.cloneNode(true);
  logoutBtn.parentNode.replaceChild(newLogout, logoutBtn);
  logoutBtn = newLogout;
  logoutBtn.addEventListener('click', () => logout());

  if (resultMessageDiv) resultMessageDiv.innerHTML = "🔮 The Box awaits... 🔮";
  startTimerRefresh();
  if (clickBoxBtn) clickBoxBtn.style.opacity = getRemainingSeconds() === 0 ? "1" : "0.7";
}

// Initialize after DOM loads
document.addEventListener('DOMContentLoaded', () => {
  authContainer = document.getElementById('authContainer');
  mainPanel = document.getElementById('mainPanel');
  balanceDisplay = document.getElementById('balanceDisplay');
  timerDisplay = document.getElementById('timerDisplay');
  clickBoxBtn = document.getElementById('clickBoxBtn');
  resultMessageDiv = document.getElementById('resultMessage');
  logoutBtn = document.getElementById('logoutBtn');

  const hasSession = loadSession();
  if (hasSession && currentUser) {
    isLoggedIn = true;
    enterMainGame();
  } else {
    renderAuthScreen('login');
  }
});
