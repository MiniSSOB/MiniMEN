// STORAGE KEYS
const USERS_KEY = "thebox_real_users";
const SESSION_KEY = "thebox_current_user";

let currentUser = null;
let timerInterval = null;

// DOM
const loginScreen = document.getElementById("loginScreen");
const registerScreen = document.getElementById("registerScreen");
const gameScreen = document.getElementById("gameScreen");
const cashSpan = document.getElementById("cashVal");
const timerSpan = document.getElementById("timerVal");
const gameMsgDiv = document.getElementById("gameMsg");
const boxButton = document.getElementById("boxBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Login elements
const loginName = document.getElementById("loginName");
const loginPass = document.getElementById("loginPass");
const doLogin = document.getElementById("doLoginBtn");
const loginMsg = document.getElementById("loginMsg");

// Register elements
const regName = document.getElementById("regName");
const regPass = document.getElementById("regPass");
const doReg = document.getElementById("doRegBtn");
const regMsg = document.getElementById("regMsg");

// Switch buttons
const gotoReg = document.getElementById("gotoReg");
const gotoLog = document.getElementById("gotoLog");

// ========== STORAGE ==========
function getUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function checkExistingSession() {
  const savedName = localStorage.getItem(SESSION_KEY);
  if (!savedName) return false;
  const users = getUsers();
  if (users[savedName]) {
    currentUser = { ...users[savedName] };
    return true;
  }
  return false;
}

function saveCurrentUser() {
  if (currentUser) {
    localStorage.setItem(SESSION_KEY, currentUser.username);
    const users = getUsers();
    users[currentUser.username] = {
      username: currentUser.username,
      password: currentUser.password,
      balance: currentUser.balance,
      lastClick: currentUser.lastClick
    };
    saveUsers(users);
  }
}

// ========== TIMER LOGIC ==========
function getRemainingSecs() {
  if (!currentUser || !currentUser.lastClick) return 0;
  const elapsed = Math.floor((Date.now() - currentUser.lastClick) / 1000);
  const left = 300 - elapsed;
  return left > 0 ? left : 0;
}

function updateTimer() {
  if (!currentUser) return;
  const left = getRemainingSecs();
  if (left <= 0) {
    timerSpan.innerText = "00:00";
    if (boxButton) boxButton.style.opacity = "1";
  } else {
    const mins = Math.floor(left / 60);
    const secs = left % 60;
    timerSpan.innerText = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    if (boxButton) boxButton.style.opacity = "0.6";
  }
}

function startTimerLoop() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (currentUser) {
      updateTimer();
      if (getRemainingSecs() === 0 && boxButton) boxButton.style.opacity = "1";
    }
  }, 200);
}

function updateCash() {
  cashSpan.innerText = currentUser.balance.toFixed(2);
}

function setGameMessage(txt, isError = false) {
  gameMsgDiv.innerHTML = txt;
  gameMsgDiv.style.color = isError ? "#cc6666" : "#cc8888";
  setTimeout(() => {
    if (currentUser) gameMsgDiv.innerHTML = "Click the box";
  }, 2500);
}

// ========== REWARD SYSTEM (weighted) ==========
function getReward() {
  const r = Math.random() * 100;
  if (r < 50) return Math.floor(Math.random() * 100) + 1;     // 1-100 (50%)
  if (r < 75) return Math.floor(Math.random() * 200) + 101;   // 101-300 (25%)
  if (r < 90) return Math.floor(Math.random() * 200) + 301;   // 301-500 (15%)
  if (r < 97) return Math.floor(Math.random() * 300) + 501;   // 501-800 (7%)
  if (r < 99.5) return Math.floor(Math.random() * 199) + 801; // 801-999 (2.5%)
  return 1000; // JACKPOT (0.5%)
}

function getRank(amount) {
  if (amount <= 100) return "COMMON";
  if (amount <= 300) return "SOLID";
  if (amount <= 500) return "RARE";
  if (amount <= 800) return "LEGENDARY";
  if (amount < 1000) return "MYTHIC";
  return "JACKPOT!!!";
}

// ========== CLICK BOX ==========
function onBoxClick() {
  if (!currentUser) return;
  const remaining = getRemainingSecs();
  if (remaining > 0) {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    setGameMessage(`WAIT ${mins}m ${secs}s`, true);
    return;
  }

  const reward = getReward();
  currentUser.balance += reward;
  currentUser.lastClick = Date.now();
  saveCurrentUser();
  updateCash();

  const rank = getRank(reward);
  setGameMessage(`+ $${reward.toFixed(2)} · ${rank}`);
  updateTimer();
  if (boxButton) boxButton.style.opacity = "0.6";
}

// ========== LOGOUT ==========
function logout() {
  if (timerInterval) clearInterval(timerInterval);
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
  
  gameScreen.style.display = "none";
  loginScreen.style.display = "block";
  registerScreen.style.display = "none";
  
  loginName.value = "";
  loginPass.value = "";
  regName.value = "";
  regPass.value = "";
  loginMsg.innerText = "";
  regMsg.innerText = "";
}

// ========== LOGIN ==========
function login() {
  const username = loginName.value.trim();
  const password = loginPass.value;
  
  if (!username || !password) {
    loginMsg.innerText = "Enter username and password";
    return;
  }
  
  const users = getUsers();
  const user = users[username];
  
  if (!user || user.password !== password) {
    loginMsg.innerText = "Invalid username or password";
    return;
  }
  
  currentUser = {
    username: user.username,
    password: user.password,
    balance: user.balance,
    lastClick: user.lastClick || null
  };
  
  saveCurrentUser();
  
  // SWITCH TO GAME
  loginScreen.style.display = "none";
  registerScreen.style.display = "none";
  gameScreen.style.display = "block";
  
  updateCash();
  updateTimer();
  startTimerLoop();
  gameMsgDiv.innerHTML = "Click the box";
  loginMsg.innerText = "";
}

// ========== REGISTER ==========
function register() {
  const username = regName.value.trim();
  const password = regPass.value;
  
  if (!username || !password) {
    regMsg.innerText = "Fill both fields";
    return;
  }
  
  if (password.length < 3) {
    regMsg.innerText = "Password too short (min 3 chars)";
    return;
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    regMsg.innerText = "Only letters, numbers, underscore";
    return;
  }
  
  const users = getUsers();
  if (users[username]) {
    regMsg.innerText = "Username already taken";
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
  saveCurrentUser();
  
  // SWITCH TO GAME
  loginScreen.style.display = "none";
  registerScreen.style.display = "none";
  gameScreen.style.display = "block";
  
  updateCash();
  updateTimer();
  startTimerLoop();
  gameMsgDiv.innerHTML = "Click the box";
  regMsg.innerText = "";
}

// ========== EVENT LISTENERS ==========
doLogin.addEventListener("click", login);
doReg.addEventListener("click", register);
gotoReg.addEventListener("click", () => {
  loginScreen.style.display = "none";
  registerScreen.style.display = "block";
  loginMsg.innerText = "";
  regMsg.innerText = "";
});
gotoLog.addEventListener("click", () => {
  registerScreen.style.display = "none";
  loginScreen.style.display = "block";
  loginMsg.innerText = "";
  regMsg.innerText = "";
});
boxButton.addEventListener("click", onBoxClick);
logoutBtn.addEventListener("click", logout);

// ========== INIT ==========
if (checkExistingSession() && currentUser) {
  loginScreen.style.display = "none";
  registerScreen.style.display = "none";
  gameScreen.style.display = "block";
  updateCash();
  updateTimer();
  startTimerLoop();
} else {
  loginScreen.style.display = "block";
  registerScreen.style.display = "none";
  gameScreen.style.display = "none";
}
