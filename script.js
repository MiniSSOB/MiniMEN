let isRegistered = localStorage.getItem('isRegistered');
let balance = 0;

// Auth Toggle
document.getElementById('toggle-auth').onclick = () => {
    const btn = document.getElementById('auth-btn');
    btn.innerText = btn.innerText === "Login" ? "Register" : "Login";
};

document.getElementById('auth-btn').onclick = () => {
    localStorage.setItem('isRegistered', 'true');
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
};

// Reward Logic (Weighted Chance)
function getReward() {
    const rand = Math.random() * 100;
    if (rand < 50) return Math.floor(Math.random() * 50) + 1; // 50% chance for 1-50
    if (rand < 85) return Math.floor(Math.random() * 200) + 51; // 35% chance for 51-250
    if (rand < 98) return Math.floor(Math.random() * 500) + 251; // 13% chance for 251-750
    return Math.floor(Math.random() * 250) + 751; // 2% chance for 751-1000
}

document.getElementById('box-btn').onclick = () => {
    balance += getReward();
    document.getElementById('balance').innerText = balance;
    // Add logic here to disable button for 5 minutes
};
