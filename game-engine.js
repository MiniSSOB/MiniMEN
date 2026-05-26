// Global Session Management & Database Sync
const session = localStorage.getItem('minimen_session');
if (!session && !window.location.href.includes('index.html')) {
    window.location.href = 'index.html';
}

let players = JSON.parse(localStorage.getItem('minimen_players')) || {};
let player = players[session];

// Force Starter Balance Alignment for existing testing accounts
if (player && (player.gold === 100000 || player.soldiers === 100 || !player.initialized_v2)) {
    player.gold = 50000;
    player.soldiers = 10;
    player.weapons = player.weapons || { att_1: 0, att_2: 0, def_1: 0, def_2: 0, spy_1: 0, spy_2: 0, sen_1: 0, sen_2: 0 };
    player.income_upgrades = player.income_upgrades || 0; // Starts at 0 upgrades
    player.initialized_v2 = true;
    saveData();
}

function saveData() {
    if (session && player) {
        players[session] = player;
        localStorage.setItem('minimen_players', JSON.stringify(players));
    }
}

// Background Income Engine: 5 Gold Per Minute Per Soldier + Upgrade Boosts
setInterval(() => {
    if (player) {
        // Base income = soldiers * 5 gold. Every income upgrade adds 1 more passive soldier generation rate.
        const goldEarned = Math.floor((player.soldiers * 5) / 60); // Distributed per second for smooth testing
        player.gold += goldEarned;
        saveData();
        
        // Update elements dynamically if they exist on the active page view
        const goldText = document.getElementById('gold-display');
        if (goldText) goldText.innerText = `${player.gold.toLocaleString()} Gold`;
    }
}, 1000);
