const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const gameView = document.getElementById('game-view');

let currentUser = null;
let timerInterval = null;

// Toggle Views
document.getElementById('show-register').addEventListener('click', (e) => {
  e.preventDefault();
  loginView.style.display = 'none';
  registerView.style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', (e) => {
  e.preventDefault();
  registerView.style.display = 'none';
  loginView.style.display = 'block';
});

// Register
document.getElementById('registerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const username = document.getElementById('reg-username').value.trim();

  if (localStorage.getItem(username)) {
    alert("SYSTEM ERROR: Username already exists in database.");
    return;
  }

  const newDossier = { name: name, username: username, money: 0, nextDropTime: 0 };
  localStorage.setItem(username, JSON.stringify(newDossier));
  
  alert("DOSSIER CREATED. Please proceed to login.");
  document.getElementById('registerForm').reset();
  registerView.style.display = 'none';
  loginView.style.display = 'block';
});

// Login
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('login-name').value.trim();
  const username = document.getElementById('login-username').value.trim();

  const storedData = localStorage.getItem(username);
  
  if (storedData) {
    const userData = JSON.parse(storedData);
    if (userData.name === name) {
      currentUser = userData;
      initGame();
    } else {
      alert("ACCESS DENIED: Credentials mismatch.");
    }
  } else {
    alert("ACCESS DENIED: Dossier not found.");
  }
});

// Initialize Game Screen
function initGame() {
  loginView.style.display = 'none';
  gameView.style.display = 'block';
  document.getElementById('loginForm').reset();
  
  updateDashboard();
  checkTimer();
}

function updateDashboard() {
  document.getElementById('display-name').innerText = currentUser.name;
  document.getElementById('display-money').innerText = currentUser.money.toLocaleString();
}

// Open Box Logic
document.getElementById('open-box-btn').addEventListener('click', () => {
  const roll = Math.random();
  let reward = 0;

  if (roll > 0.99) {
    reward = Math.floor(Math.random() * 501) + 500; 
  } else if (roll > 0.90) {
    reward = Math.floor(Math.random() * 400) + 100;
  } else if (roll > 0.60) {
    reward = Math.floor(Math.random() * 80) + 20;
  } else {
    reward = Math.floor(Math.random() * 19) + 1;
  }

  alert(`CRATE DECRYPTED: You extracted $${reward}.`);
  
  currentUser.money += reward;
  currentUser.nextDropTime = Date.now() + (5 * 60 * 1000); 
  
  localStorage.setItem(currentUser.username, JSON.stringify(currentUser));
  updateDashboard();
  checkTimer();
});

// Timer Logic
function checkTimer() {
  clearInterval(timerInterval);
  const btn = document.getElementById('open-box-btn');
  const timerDisplay = document.getElementById('timer');

  timerInterval = setInterval(() => {
    const timeRemaining = currentUser.nextDropTime - Date.now();

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerDisplay.innerText = "READY";
      timerDisplay.style.color = "#0f0";
      btn.disabled = false;
      btn.innerText = "OPEN THE BOX";
    } else {
      btn.disabled = true;
      btn.innerText = "COOLDOWN ACTIVE";
      timerDisplay.style.color = "#ffaa00";
      
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      
      timerDisplay.innerText = 
        (minutes < 10 ? "0" + minutes : minutes) + ":" + 
        (seconds < 10 ? "0" + seconds : seconds);
    }
  }, 1000);
}

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
  clearInterval(timerInterval);
  currentUser = null;
  gameView.style.display = 'none';
  loginView.style.display = 'block';
});
