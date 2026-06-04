// STORAGE
const USERS_KEY = "thebox_users";
const SESSION_KEY = "thebox_session";

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

const loginName = document.getElementById("loginName");
const loginPass = document.getElementById("loginPass");
const doLogin = document.getElementById("doLoginBtn");
const loginMsg = document.getElementById("loginMsg");

const regName = document.getElementById("regName");
const regPass = document.getElementById("regPass");
const doReg = document.getElementById("doRegBtn");
const regMsg = document.getElementById("regMsg");

const gotoReg = document.getElementById("gotoReg");
const gotoLog = document.getElementById("gotoLog");

function getUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function checkSession() {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) return false;
  const users = getUsers();
  if (users[saved]) {
    currentUser = { ...users[saved] };
    return true;
  }
  return false;
}

function saveSession() {
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

function getRemaining() {
  if (!currentUser || !currentUser.lastClick) return 0;
  const elapsed = Math.floor((Date.now() - currentUser.lastClick) / 1000);
  const left = 300 - elapsed;
  return left > 0 ? left : 0;
}

function updateTimer() {
  if (!currentUser) return;
  const left = getRemaining();
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
      if (getRemaining() === 0 && boxButton) boxButton.style.opacity = "1";
    }
  }, 200);
}

function updateCash() {
  cashSpan.innerText = currentUser.balance.toFixed(2);
}

function setGameMessage(txt, isError) {
  gameMsgDiv.innerHTML = txt;
  gameMsgDiv.style.color = isError ? "#cc6666" : "#cc8888";
  setTimeout(() => {
    if (currentUser) gameMsgDiv.innerHTML = "Click the box";
  }, 2500);
}

function getReward() {
  const r = Math.random() * 100;
  if (r < 50) return Math.floor(Math.random() * 100) + 1;
  if (r < 75) return Math.floor(Math.random() * 200) + 101;
  if (r < 90) return Math.floor(Math.random() * 200) + 301;
  if (r < 97) return Math.floor(Math.random() * 300) + 501;
  if (r < 99.5) return Math.floor(Math.random() * 199) + 801;
  return 1000;
}

function getRank(amount) {
  if (amount <= 100) return "COMMON";
  if (amount <= 300) return "SOLID";
  if (amount <= 500) return "RARE";
  if (amount <= 800) return "LEGENDARY";
  if (amount < 1000) return "MYTHIC";
  return "JACKPOT!!!";
}

function onBoxClick() {
  if (!currentUser) return;
  const left = getRemaining();
  if (left > 0) {
    const mins = Math.floor(left / 60);
    const secs = left % 60;
    setGameMessage(`WAIT ${mins}m ${secs}s`, true);
    return;
  }

  const reward = getReward();
  currentUser.balance += reward;
  currentUser.lastClick = Date.now();
  saveSession();
  updateCash();

  setGameMessage(`+ $${reward.toFixed(2)} · ${getRank(reward)}`, false);
  updateTimer();
  if (boxButton) boxButton.style.opacity = "0.6";
}

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
    loginMsg.innerText = "Wrong username or password";
    return;
  }
  currentUser = {
    username: user.username,
    password: user.password,
    balance: user.balance,
    lastClick: user.lastClick || null
  };
  saveSession();
  loginScreen.style.display = "none";
  registerScreen.style.display = "none";
  gameScreen.style.display = "block";
  updateCash();
  updateTimer();
  startTimerLoop();
  gameMsgDiv.innerHTML = "Click the box";
  loginMsg.innerText = "";
}

function register() {
  const username = regName.value.trim();
  const password = regPass.value;
  if (!username || !password) {
    regMsg.innerText = "Fill both fields";
    return;
  }
  if (password.length < 3) {
    regMsg.innerText = "Password too short (min 3)";
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    regMsg.innerText = "Letters, numbers, underscore only";
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
  saveSession();
  loginScreen.style.display = "none";
  registerScreen.style.display = "none";
  gameScreen.style.display = "block";
  updateCash();
  updateTimer();
  startTimerLoop();
  gameMsgDiv.innerHTML = "Click the box";
  regMsg.innerText = "";
}

// EVENTS
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

// INIT
if (checkSession() && currentUser) {
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
