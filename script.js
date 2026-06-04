// STORAGE
const STORAGE_USERS = "thebox_users_v2";
const STORAGE_SESSION = "thebox_session_v2";

let currentUser = null;
let timerInterval = null;

// DOM elements
const loginSection = document.getElementById("loginSection");
const gameSection = document.getElementById("gameSection");
const loginFormArea = document.getElementById("loginFormArea");
const registerFormArea = document.getElementById("registerFormArea");
const gameCashSpan = document.getElementById("gameCash");
const gameTimerSpan = document.getElementById("gameTimer");
const gameMessageDiv = document.getElementById("gameMessage");
const clickableBox = document.getElementById("clickableBox");
const logoutGameBtn = document.getElementById("logoutGameBtn");

// Feedback elements
const loginFeedback = document.getElementById("loginFeedback");
const registerFeedback = document.getElementById("registerFeedback");

// Inputs
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const registerUsername = document.getElementById("registerUsername");
const registerPassword = document.getElementById("registerPassword");

// Buttons
const loginActionBtn = document.getElementById("loginActionBtn");
const registerActionBtn = document.getElementById("registerActionBtn");
const switchToRegisterBtn = document.getElementById("switchToRegisterBtn");
const switchToLoginBtn = document.getElementById("switchToLoginBtn");

// ========== HELPERS ==========
function loadUsers() {
  const raw = localStorage.getItem(STORAGE_USERS);
  return raw ? JSON.parse(raw) : {};
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function loadSession() {
  const sessionName = localStorage.getItem(STORAGE_SESSION);
  if (!sessionName) return false;
  const users = loadUsers();
  if (users[sessionName]) {
    currentUser = { ...users[sessionName] };
    return true;
  }
  return false;
}

function saveSession() {
  if (currentUser) {
    localStorage.setItem(STORAGE_SESSION, currentUser.username);
    const users = loadUsers();
    users[currentUser.username] = {
      username: currentUser.username,
      password: currentUser.password,
      balance: currentUser.balance,
      lastClick: currentUser.lastClick
    };
    saveUsers(users);
  }
}

// Timer logic
function getRemainingSeconds() {
  if (!currentUser || !currentUser.lastClick) return 0;
  const elapsed = Math.floor((Date.now() - currentUser.lastClick) / 1000);
  const remaining = 300 - elapsed;
  return remaining > 0 ? remaining : 0;
}

function updateTimerUI() {
  if (!currentUser) return;
  const remaining = getRemainingSeconds();
  if (remaining <= 0) {
    gameTimerSpan.innerText = "00:00";
    if (clickableBox) clickableBox.style.opacity = "1";
  } else {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    gameTimerSpan.innerText = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    if (clickableBox) clickableBox.style.opacity = "0.7";
  }
}

function startTimerLoop() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (currentUser) {
      updateTimerUI();
      if (getRemainingSeconds() === 0 && clickableBox) clickableBox.style.opacity = "1";
    }
  }, 200);
}

function updateCashUI() {
  if (gameCashSpan) gameCashSpan.innerText = `$${currentUser.balance.toFixed(2)}`;
}

function setGameMessage(msg, isError = false) {
  if (gameMessageDiv) {
    gameMessageDiv.innerHTML = msg;
    gameMessageDiv.style.color = isError ? "#e6a04a" : "#dbb45c";
    gameMessageDiv.style.borderLeftColor = isError ? "#b85c2a" : "#b87c2e";
    setTimeout(() => {
      if (currentUser && gameMessageDiv) gameMessageDiv.innerHTML = "READY TO RISK IT ALL?";
    }, 2600);
  }
}

// REWARD SYSTEM (weighted)
function getRandomReward() {
  const r = Math.random() * 100;
  if (r < 50) return Math.floor(Math.random() * 100) + 1;
  if (r < 75) return Math.floor(Math.random() * 200) + 101;
  if (r < 90) return Math.floor(Math.random() * 200) + 301;
  if (r < 97) return Math.floor(Math.random() * 300) + 501;
  if (r < 99.5) return Math.floor(Math.random() * 199) + 801;
  return 1000;
}

function getRarityTag(amount) {
  if (amount <= 100) return "COMMON";
  if (amount <= 300) return "SOLID";
  if (amount <= 500) return "RARE";
  if (amount <= 800) return "LEGENDARY";
  if (amount < 1000) return "MYTHIC";
  return "JACKPOT!!!";
}

// BOX CLICK HANDLER
function handleBoxClick() {
  if (!currentUser) return;
  const remaining = getRemainingSeconds();
  if (remaining > 0) {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    setGameMessage(`⛔ LOCKED · WAIT ${mins}m ${secs}s`, true);
    return;
  }

  const reward = getRandomReward();
  currentUser.balance += reward;
  currentUser.lastClick = Date.now();
  saveSession();
  updateCashUI();

  const rarity = getRarityTag(reward);
  setGameMessage(`💸 +$${reward.toFixed(2)} · ${rarity} 💸`);
  updateTimerUI();
  if (clickableBox) clickableBox.style.opacity = "0.7";
}

// LOGOUT
function logout() {
  if (timerInterval) clearInterval(timerInterval);
  currentUser = null;
  localStorage.removeItem(STORAGE_SESSION);
  gameSection.style.display = "none";
  loginSection.style.display = "block";
  loginFormArea.style.display = "block";
  registerFormArea.style.display = "none";
  loginUsername.value = "";
  loginPassword.value = "";
  registerUsername.value = "";
  registerPassword.value = "";
  loginFeedback.innerText = "";
  registerFeedback.innerText = "";
}

// LOGIC LOGIN / REGISTER
function attemptLogin() {
  const username = loginUsername.value.trim();
  const password = loginPassword.value;
  if (!username || !password) {
    loginFeedback.innerText = "❌ ENTER CALLSIGN & PASSWORD";
    return;
  }
  const users = loadUsers();
  const user = users[username];
  if (!user || user.password !== password) {
    loginFeedback.innerText = "❌ INVALID CREDENTIALS";
    return;
  }
  currentUser = {
    username: user.username,
    password: user.password,
    balance: user.balance,
    lastClick: user.lastClick || null
  };
  saveSession();
  // Switch to Game UI
  loginSection.style.display = "none";
  gameSection.style.display = "block";
  updateCashUI();
  updateTimerUI();
  startTimerLoop();
  gameMessageDiv.innerHTML = "READY TO RISK IT ALL?";
  loginFeedback.innerText = "";
}

function attemptRegister() {
  const username = registerUsername.value.trim();
  const password = registerPassword.value;
  if (!username || !password) {
    registerFeedback.innerText = "❌ FILL BOTH FIELDS";
    return;
  }
  if (password.length < 3) {
    registerFeedback.innerText = "❌ PASSWORD TOO SHORT (3+ CHARS)";
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    registerFeedback.innerText = "❌ USE LETTERS, NUMBERS, UNDERSCORE";
    return;
  }
  const users = loadUsers();
  if (users[username]) {
    registerFeedback.innerText = "❌ CALLSIGN ALREADY TAKEN";
    return;
  }
  const newUser = {
    username: username,
    password: password,
    balance: 250.00,
    lastClick: null
  };
  users[username] = newUser;
  saveUsers(users);
  currentUser = { ...newUser };
  saveSession();
  // Switch to Game
  loginSection.style.display = "none";
  gameSection.style.display = "block";
  updateCashUI();
  updateTimerUI();
  startTimerLoop();
  gameMessageDiv.innerHTML = "READY TO RISK IT ALL?";
  registerFeedback.innerText = "";
}

// EVENT LISTENERS
loginActionBtn.addEventListener("click", attemptLogin);
registerActionBtn.addEventListener("click", attemptRegister);

switchToRegisterBtn.addEventListener("click", () => {
  loginFormArea.style.display = "none";
  registerFormArea.style.display = "block";
  loginFeedback.innerText = "";
  registerFeedback.innerText = "";
});

switchToLoginBtn.addEventListener("click", () => {
  registerFormArea.style.display = "none";
  loginFormArea.style.display = "block";
  loginFeedback.innerText = "";
  registerFeedback.innerText = "";
});

clickableBox.addEventListener("click", handleBoxClick);
logoutGameBtn.addEventListener("click", logout);

// INIT
if (loadSession() && currentUser) {
  loginSection.style.display = "none";
  gameSection.style.display = "block";
  updateCashUI();
  updateTimerUI();
  startTimerLoop();
} else {
  loginSection.style.display = "block";
  gameSection.style.display = "none";
  loginFormArea.style.display = "block";
  registerFormArea.style.display = "none";
}
