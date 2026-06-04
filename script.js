// STORAGE
const USERS_KEY = "thebox_users";
const SESSION_KEY = "thebox_session";

// UPGRADE COSTS Arrays (Escalating prices)
const TIMER_COSTS = [1000, 3000, 9000, 27000, 81000, 243000]; // 6 upgrades = 60s off
const LOOT_COSTS = [500, 10000, 50000, 150000, 500000, 1000000]; // Multiplies loot range

let currentUser = null;
let timerInterval = null;

// DOM Elements
const loginScreen = document.getElementById("loginScreen");
const registerScreen = document.getElementById("registerScreen");
const gameScreen = document.getElementById("gameScreen");

const cashSpan = document.getElementById("cashVal");
const rollsSpan = document.getElementById("rollsVal");
const timerSpan = document.getElementById("timerVal");
const gameMsgDiv = document.getElementById("gameMsg");
const boxButton = document.getElementById("boxBtn");

// DOM: Nav
const navBoxBtn = document.getElementById("navBoxBtn");
const navUpgBtn = document.getElementById("navUpgBtn");
const boxView = document.getElementById("boxView");
const upgView = document.getElementById("upgView");

// DOM: Upgrades
const cdDisplay = document.getElementById("currentCdDisplay");
const upgTimerCost = document.getElementById("upgTimerCost");
const buyTimerBtn = document.getElementById("buyTimerBtn");

const maxDisplay = document.getElementById("currentMaxDisplay");
const upgLootCost = document.getElementById("upgLootCost");
const buyLootBtn = document.getElementById("buyLootBtn");

// Auth & Setup
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
    migrateUser(currentUser);
    return true;
  }
  return false;
}

function saveSession() {
  if (currentUser) {
    localStorage.setItem(SESSION_KEY, currentUser.username);
    const users = getUsers();
    users[currentUser.username] = { ...currentUser };
    saveUsers(users);
  }
}

// Ensures old accounts don't break with new stats
function migrateUser(user) {
  if (user.rolls === undefined) user.rolls = 0;
  if (user.timerUpg === undefined) user.timerUpg = 0;
  if (user.lootUpg === undefined) user.lootUpg = 0;
}

// GUI Updates
function updateStats() {
  cashSpan.innerText = currentUser.balance.toFixed(2);
  rollsSpan.innerText = currentUser.rolls;
  updateUpgradesUI();
}

function setGameMessage(txt, isError = false) {
  gameMsgDiv.innerHTML = txt;
  gameMsgDiv.style.color = isError ? "#cc6666" : "#cc8888";
  gameMsgDiv.style.display = "block";
  setTimeout(() => {
    if (currentUser) gameMsgDiv.innerHTML = "Awaiting interaction...";
  }, 3000);
}

// TIMER LOGIC
function getRemaining() {
  if (!currentUser || !currentUser.lastClick) return 0;
  const elapsed = Math.floor((Date.now() - currentUser.lastClick) / 1000);
  const baseTime = 300; 
  const deduction = currentUser.timerUpg * 10; // -10s per upgrade
  const maxTimer = baseTime - deduction;
  
  const left = maxTimer - elapsed;
  return left > 0 ? left : 0;
}

function updateTimer() {
  if (!currentUser) return;
  const left = getRemaining();
  if (left <= 0) {
    timerSpan.innerText = "READY";
    timerSpan.style.color = "#ffffff";
    if (boxButton) boxButton.style.opacity = "1";
  } else {
    const mins = Math.floor(left / 60);
    const secs = left % 60;
    timerSpan.innerText = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    timerSpan.style.color = "#cc5555";
    if (boxButton) boxButton.style.opacity = "0.4";
  }
}

function startTimerLoop() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (currentUser) updateTimer();
  }, 200);
}

// LOOT GENERATION (Scales with Loot Upgrade Tier)
function getReward() {
  const r = Math.random() * 100;
  let baseReward = 0;
  
  if (r < 50) baseReward = Math.floor(Math.random() * 100) + 1;
  else if (r < 75) baseReward = Math.floor(Math.random() * 200) + 101;
  else if (r < 90) baseReward = Math.floor(Math.random() * 200) + 301;
  else if (r < 97) baseReward = Math.floor(Math.random() * 300) + 501;
  else if (r < 99.5) baseReward = Math.floor(Math.random() * 199) + 801;
  else baseReward = 1000;

  // Multiply based on upgrade tier (Tier 0 = 1x, Tier 1 = 2x, etc.)
  const multiplier = currentUser.lootUpg + 1; 
  return baseReward * multiplier;
}

// INTERACTIONS
function onBoxClick() {
  if (!currentUser) return;
  const left = getRemaining();
  if (left > 0) {
    const mins = Math.floor(left / 60);
    const secs = left % 60;
    setGameMessage(`COOLDOWN ACTIVE: ${mins}m ${secs}s`, true);
    return;
  }

  const reward = getReward();
  currentUser.balance += reward;
  currentUser.rolls += 1;
  currentUser.lastClick = Date.now();
  
  saveSession();
  updateStats();
  updateTimer();
  setGameMessage(`+ $${reward.toFixed(2)} EXTRACTED`, false);
}

// UPGRADES SYSTEM
function updateUpgradesUI() {
  if (!currentUser) return;

  // Timer Upgrade
  const tLvl = currentUser.timerUpg;
  cdDisplay.innerText = `${300 - (tLvl * 10)}s`;
  
  if (tLvl < TIMER_COSTS.length) {
    const cost = TIMER_COSTS[tLvl];
    upgTimerCost.innerText = "$" + cost.toLocaleString();
    buyTimerBtn.disabled = currentUser.balance < cost;
  } else {
    upgTimerCost.innerText = "MAX";
    buyTimerBtn.disabled = true;
  }

  // Loot Upgrade
  const lLvl = currentUser.lootUpg;
  maxDisplay.innerText = (1000 * (lLvl + 1)).toLocaleString();

  if (lLvl < LOOT_COSTS.length) {
    const cost = LOOT_COSTS[lLvl];
    upgLootCost.innerText = "$" + cost.toLocaleString();
    buyLootBtn.disabled = currentUser.balance < cost;
  } else {
    upgLootCost.innerText = "MAX";
    buyLootBtn.disabled = true;
  }
}

buyTimerBtn.addEventListener("click", () => {
  const tLvl = currentUser.timerUpg;
  if (tLvl >= TIMER_COSTS.length) return;
  const cost = TIMER_COSTS[tLvl];
  
  if (currentUser.balance >= cost) {
    currentUser.balance -= cost;
    currentUser.timerUpg += 1;
    saveSession();
    updateStats();
  }
});

buyLootBtn.addEventListener("click", () => {
  const lLvl = currentUser.lootUpg;
  if (lLvl >= LOOT_COSTS.length) return;
  const cost = LOOT_COSTS[lLvl];
  
  if (currentUser.balance >= cost) {
    currentUser.balance -= cost;
    currentUser.lootUpg += 1;
    saveSession();
    updateStats();
  }
});

// NAVIGATION
navBoxBtn.addEventListener("click", () => {
  navBoxBtn.classList.add("active-tab");
  navUpgBtn.classList.remove("active-tab");
  boxView.style.display = "flex";
  upgView.style.display = "none";
});

navUpgBtn.addEventListener("click", () => {
  navUpgBtn.classList.add("active-tab");
  navBoxBtn.classList.remove("active-tab");
  upgView.style.display = "flex";
  boxView.style.display = "none";
  updateUpgradesUI();
});

// AUTHENTICATION LOGIC
function showAuthError(msgId, text) {
  const el = document.getElementById(msgId);
  el.innerText = text;
  el.style.display = "block";
}

document.getElementById("doLoginBtn").addEventListener("click", () => {
  const u = document.getElementById("loginName").value.trim();
  const p = document.getElementById("loginPass").value;
  if (!u || !p) return showAuthError("loginMsg", "Enter username and password");
  
  const users = getUsers();
  const user = users[u];
  if (!user || user.password !== p) return showAuthError("loginMsg", "Invalid credentials");
  
  currentUser = { ...user };
  migrateUser(currentUser);
  saveSession();
  loadGame();
});

document.getElementById("doRegBtn").addEventListener("click", () => {
  const u = document.getElementById("regName").value.trim();
  const p = document.getElementById("regPass").value;
  if (!u || !p) return showAuthError("regMsg", "Fill both fields");
  if (p.length < 3) return showAuthError("regMsg", "Password too short");
  
  const users = getUsers();
  if (users[u]) return showAuthError("regMsg", "Username taken");
  
  const newUser = { username: u, password: p, balance: 250.00, lastClick: null, rolls: 0, timerUpg: 0, lootUpg: 0 };
  users[u] = newUser;
  saveUsers(users);
  
  currentUser = { ...newUser };
  saveSession();
  loadGame();
});

document.getElementById("gotoReg").addEventListener("click", () => {
  loginScreen.style.display = "none";
  registerScreen.style.display = "block";
  document.getElementById("loginMsg").style.display = "none";
});

document.getElementById("gotoLog").addEventListener("click", () => {
  registerScreen.style.display = "none";
  loginScreen.style.display = "block";
  document.getElementById("regMsg").style.display = "none";
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  if (timerInterval) clearInterval(timerInterval);
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
  gameScreen.style.display = "none";
  loginScreen.style.display = "block";
});

boxButton.addEventListener("click", onBoxClick);

function loadGame() {
  loginScreen.style.display = "none";
  registerScreen.style.display = "none";
  gameScreen.style.display = "flex";
  
  // Force back to Box tab on login
  navBoxBtn.click();
  
  updateStats();
  updateTimer();
  startTimerLoop();
}

// INIT
if (checkSession() && currentUser) {
  loadGame();
} else {
  loginScreen.style.display = "block";
}
