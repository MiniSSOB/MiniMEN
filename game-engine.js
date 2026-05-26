// Global Session Management & Database Sync
const session = localStorage.getItem('minimen_session');
if (!session && !window.location.href.includes('index.html')) {
    window.location.href = 'index.html';
}

let players = JSON.parse(localStorage.getItem('minimen_players')) || {};
let player = players[session];

// Master Rule Engine Structure Setup
if (player && !player.initialized_v4) {
    player.gold = 50000;
    player.vault = 0;
    player.turns = 1440; // Starts with a full day's allocation of turns
    player.soldiers = 10; 
    player.attack_troops = 0;
    player.defense_troops = 0;
    player.spy_troops = 0;
    player.sentry_troops = 0;
    
    // Track daily interaction limits per enemy target id
    player.daily_attacks = {}; // e.g., { "target_45": 0 }
    player.daily_raids = {};   // e.g., { "target_45": 0 }
    
    player.weapons = player.weapons || {
        att_1: 0, att_2: 0, att_3: 0, att_4: 0,
        def_1: 0, def_2: 0, def_3: 0, def_4: 0,
        spy_1: 0, spy_2: 0, spy_3: 0, spy_4: 0,
        sen_1: 0, sen_2: 0, sen_3: 0, sen_4: 0
    };
    player.initialized_v4 = true;
    saveData();
}

function saveData() {
    if (session && player) {
        players[session] = player;
        localStorage.setItem('minimen_players', JSON.stringify(players));
    }
}

// Helper calculation to pull total spy power from trained stats and weapons
function getMyTotalSpyPower() {
    if (!player) return 0;
    const baseSpy = player.spy_troops || 0;
    const itemPowers = { spy_1: 140, spy_2: 250, spy_3: 600, spy_4: 1000 };
    let gearPower = 0;
    player.weapons = player.weapons || {};
    Object.keys(itemPowers).forEach(id => {
        gearPower += (player.weapons[id] || 0) * itemPowers[id];
    });
    return baseSpy + gearPower;
}

// Background Game Loop Clocks
// 1. Passive Troop Gold Mining: Distributed smoothly per second
setInterval(() => {
    if (player) {
        const producingTroops = (player.soldiers || 0) + (player.attack_troops || 0) + (player.defense_troops || 0);
        const goldEarnedPerSecond = (producingTroops * 5) / 60; 
        
        player.gold += goldEarnedPerSecond;
        saveData();
        
        // Push live updates straight to any visible text blocks across templates
        const goldText = document.getElementById('gold-display');
        if (goldText) goldText.innerText = `${Math.floor(player.gold).toLocaleString()} Gold`;
    }
}, 1000);

// 2. Passive Turn Generation: Adds 1 Turn every 60 seconds (1440 turns maximum cap per day)
setInterval(() => {
    if (player) {
        if ((player.turns || 0) < 1440) {
            player.turns = (player.turns || 0) + 1;
            saveData();
            
            const turnsText = document.getElementById('turns-display');
            if (turnsText) turnsText.innerText = player.turns;
        }
    }
}, 60000);
