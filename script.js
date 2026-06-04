// STORAGE
const USER_KEY = "thebox_users";
const SESSION_KEY = "thebox_session";

let currentUser = null;
let timerInterval = null;

// DOM ELEMENTS
const loginView = document.getElementById("loginView");
const registerView = document.getElementById("registerView");
const gameView = document.getElementById("gameView");
const cashSpan = document.getElementById("cashAmount");
const timerSpan = document.getElementById("timerDisplay");
const messageDiv = document.getElementById("message");

// Helper: get users
function getUsers() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveUsers(users) {
  localStorage.setItem(USER_KEY, JSON.stringify(users));
}

// Check session on load
function checkSession() {
  const savedName = localStorage.getItem(SESSION_KEY);
  if (!savedName) return false;
  const users = getUsers();
  if (users[savedName]) {
    currentUser = users[savedName];
    return true;
  }
  return false;
}

function saveSession() {
  if (currentUser) {
    localStorage.setItem(SESSION_KEY, currentUser.username);
    const users = getUsers();
    users[currentUser.username] = currentUser;
    saveUsers(users);
  }
}

// Timer logic
function getRemainingSeconds() {
  if (!currentUser || !currentUser.lastClick) return 0;
  const elapsed = Math.floor((Date.now() - currentUser.lastClick) / 1000);
  const left = 300 - elapsed;
  return left > 0 ? left : 0;
}

function updateTimerDisplay() {
  if (!currentUser) return;
  const left = getRemainingSeconds();
  if (left <= 0) {
    timerSpan.innerText = "00:00";
  } else {
    const mins = Math.floor(left / 60);
    const secs = left % 60;
    timerSpan.innerText = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (currentUser) updateTimerDisplay();
  }, 200);
}

function updateCash() {
  if (cashSpan) cashSpan.innerText = currentUser.balance.toFixed(2);
}

function showMessage(msg, isError = false) {
  messageDiv.innerText = msg;
  messageDiv.style.color = isError ? "#e68a2e" : "#dfb15c";
  setTimeout(() => {
    if (currentUser && messageDiv) messageDiv.innerText = "CLICK THE BOX";
  }, 2500);
}

// REWARD SYSTEM
function getReward() {
  const r = Math.random() * 100;
  if (r < 50) return Math.floor(Math.random() * 100) + 1;
  if (r < 75) return Math.floor(Math.random() * 200) + 101;
  if (r < 90) return Math.floor(Math.random() * 200) + 301;
  if (r < 97) return Math.floor(Math.random() * 300) + 501;
  if (r < 99.5) return Math.floor(Math.random() * 199) + 801;
  return 1000;
}

function handleBoxClick() {
  if (!currentUser) return;
  
  const remaining = getRemainingSeconds();
  if (remaining > 0) {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    showMessage(`WAIT ${mins}m ${secs}s`, true);
    return;
  }

  const reward = getReward();
  currentUser.balance += reward;
  currentUser.lastClick = Date.now();
  saveSession();
  updateCash();

  let rarity = "";
  if (reward <= 100) rarity = "COMMON";
  else if (reward <= 300) rarity = "SOLID";
  else if (reward <= 500) rarity = "RARE";
  else if (reward <= 800) rarity = "LEGENDARY";
  else if (reward < 1000) rarity = "MYTHIC";
  else rarity = "JACKPOT!!!";

  showMessage(`$${reward.toFixed(2)} - ${rarity}`);
  updateTimerDisplay();
}

function logout() {
  if (timerInterval) clearInterval(timerInterval);
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
  
  // Show login, hide game
  gameView.style.display = "none";
  loginView.style.display = "block";
  registerView.style.display = "none";
  
  // Clear inputs
  document.getElementById("loginName").value = "";
  document.getElementById("loginPw").value = "";
  document.getElementById("regName").value = "";
  document.getElementById("regPw").value = "";
}

function login() {
  const username = document.getElementById("loginName").value.trim();
  const password = document.getElementById("loginPw").value;
  const errorP = document.getElementById("loginError");
  
  if (!username || !password) {
    errorP.innerText = "Enter username and password";
    return;
  }
  
  const users = getUsers();
  const user = users[username];
  if (!user || user.password !== password) {
    errorP.innerText = "Invalid login";
    return;
  }
  
  currentUser = {
    username: user.username,
    password: user.password,
    balance: user.balance,
    lastClick: user.lastClick || null
  };
  
  saveSession();
  
  // SWITCH VIEWS
  loginView.style.display = "none";
  registerView.style.display = "none";
  gameView.style.display = "block";
  
  updateCash();
  updateTimerDisplay();
  startTimer();
  messageDiv.innerText = "CLICK THE BOX";
  errorP.innerText = "";
}

function register() {
  const username = document.getElementById("regName").value.trim();
  const password = document.getElementById("regPw").value;
  const errorP = document.getElementById("regError");
  
  if (!username || !password) {
    errorP.innerText = "Fill all fields";
    return;
  }
  if (password.length < 3) {
    errorP.innerText = "Password too short (min 3)";
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errorP.innerText = "Letters, numbers, underscore only";
    return;
  }
  
  const users = getUsers();
  if (users[username]) {
    errorP.innerText = "Username taken";
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
  currentUser = newUser;
  saveSession();
  
  // SWITCH TO GAME
  loginView.style.display = "none";
  registerView.style.display = "none";
  gameView.style.display = "block";
  
  updateCash();
  updateTimerDisplay();
  startTimer();
  messageDiv.innerText = "CLICK THE BOX";
  errorP.innerText = "";
}

// EVENT LISTENERS
document.getElementById("loginSubmit").addEventListener("click", login);
document.getElementById("regSubmit").addEventListener("click", register);
document.getElementById("gotoRegister").addEventListener("click", () => {
  loginView.style.display = "none";
  registerView.style.display = "block";
  document.getElementById("loginError").innerText = "";
  document.getElementById("regError").innerText = "";
});
document.getElementById("gotoLogin").addEventListener("click", () => {
  registerView.style.display = "none";
  loginView.style.display = "block";
  document.getElementById("loginError").innerText = "";
  document.getElementById("regError").innerText = "";
});
document.getElementById("clickBox").addEventListener("click", handleBoxClick);
document.getElementById("logoutGame").addEventListener("click", logout);

// INITIALIZE
if (checkSession() && currentUser) {
  loginView.style.display = "none";
  registerView.style.display = "none";
  gameView.style.display = "block";
  updateCash();
  updateTimerDisplay();
  startTimer();
} else {
  loginView.style.display = "block";
  registerView.style.display = "none";
  gameView.style.display = "none";
}
