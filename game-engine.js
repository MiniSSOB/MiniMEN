// Global Session Management & Database Sync
const session = localStorage.getItem('minimen_session');
if (!session && !window.location.href.includes('index.html')) {
    window.location.href = 'index.html';
}

let players = JSON.parse(localStorage.getItem('minimen_players')) || {};
let player = players[session];

// Starter Balance Alignment
if (player && !player.initialized_v3) {
    player.gold = 50000;
    player.soldiers = 10; // Untrained Pool
    player.attack_troops = 0;
    player.defense_troops = 0;
    player.spy_troops = 0;
    player.sentry_troops = 0;
    player.weapons = player.weapons || {
        att_1: 0, att_2: 0, att_3: 0, att_4: 0,
        def_1: 0, def_2: 0, def_3: 0, def_4: 0,
        spy_1: 0, spy_2: 0, spy_3: 0, spy_4: 0,
        sen_1: 0, sen_2: 0, sen_3: 0, sen_4: 0
    };
    player.initialized_v3 = true;
    saveData();
}

function saveData() {
    if (session && player) {
        players[session] = player;
        localStorage.setItem('minimen_players', JSON.stringify(players));
    }
}

// Background Income Engine: 5 Gold Per Minute Per Valid Producing Soldier
setInterval(() => {
    if (player) {
        // ONLY Attack, Defense, and Untrained Soldiers generate money. Spy and Sentry earn 0.
        const producingTroops = (player.soldiers || 0) + (player.attack_troops || 0) + (player.defense_troops || 0);
        const goldEarned = Math.floor((producingTroops * 5) / 60); // Per-second ticking smooth simulation
        
        player.gold += goldEarned;
        saveData();
        
        const goldText = document.getElementById('gold-display');
        if (goldText) goldText.innerText = `${player.gold.toLocaleString()} Gold`;
    }
}, 1000);
