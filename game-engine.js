// Global Session Management & Database Sync
const session = localStorage.getItem('minimen_session');
if (!session && !window.location.href.includes('index.html')) {
    window.location.href = 'index.html';
}

let players = JSON.parse(localStorage.getItem('minimen_players')) || {};
let player = players[session];

// FORCE TEST-MODE OVERRIDE: Wipes old bugged states, grants 1M Gold and 100 Starting Soldiers
if (player && (!player.test_mode_v5 || player.soldiers < 10 || player.gold < 100000)) {
    player.gold = 1000000; // 1 Million Gold Testing Capital
    player.vault = 0;
    player.turns = 1440;
    player.soldiers = 100; // 100 Starting Units to split into Spies/Soldiers
    player.attack_troops = 0;
    player.defense_troops = 0;
    player.spy_troops = 0;
    player.sentry_troops = 0;
    
    player.weapons = {
        att_1: 0, att_2: 0, att_3: 0, att_4: 0,
        def_1: 0, def_2: 0, def_3: 0, def_4: 0,
        spy_1: 0, spy_2: 0, spy_3: 0, spy_4: 0,
        sen_1: 0, sen_2: 0, sen_3: 0, sen_4: 0
    };
    player.test_mode_v5 = true; // Strict structural baseline flag
    saveData();
}

function saveData() {
    if (session && player) {
        players[session] = player;
        localStorage.setItem('minimen_players', JSON.stringify(players));
    }
}

// SOLDIER-PAIRED INTELLIGENCE CALCULATOR
// Scans trained spy operatives and equips your strongest spy gear up to your physical army limit
window.getMyTotalSpyPower = function() {
    if (!player) return 0;
    
    const totalSpySoldiers = player.spy_troops || 0;
    const spyGearTiers = [
        { id: 'spy_4', power: 1000 },
        { id: 'spy_3', power: 600 },
        { id: 'spy_2', power: 250 },
        { id: 'spy_1', power: 140 }
    ];

    let unitsAvailableToEquip = totalSpySoldiers;
    let combinedSpyPower = 0;

    player.weapons = player.weapons || {};

    // Maximize efficiency by pairing highest-rating tools first
    for (let gear of spyGearTiers) {
        if (unitsAvailableToEquip <= 0) break;
        
        let ownedCount = player.weapons[gear.id] || 0;
        let equippedCount = Math.min(ownedCount, unitsAvailableToEquip);
        
        combinedSpyPower += equippedCount * gear.power;
        unitsAvailableToEquip -= equippedCount;
    }

    // Unarmed spy units contribute a baseline scouting score of 1
    if (unitsAvailableToEquip > 0) {
        combinedSpyPower += unitsAvailableToEquip * 1;
    }

    return combinedSpyPower;
};

// BACKGROUND CLOCK LOOPS
// 1. Passive Income Engine (Only counts Attack, Defense, and Untrained troops)
setInterval(() => {
    if (player) {
        const producingTroops = (player.soldiers || 0) + (player.attack_troops || 0) + (player.defense_troops || 0);
        const goldEarnedPerSecond = (producingTroops * 5) / 60; 
        
        player.gold += goldEarnedPerSecond;
        saveData();
        
        const goldText = document.getElementById('gold-display');
        if (goldText) goldText.innerText = `${Math.floor(player.gold).toLocaleString()} Gold`;
    }
}, 1000);

// 2. Passive Turn Tick (Gives 1 Turn per minute up to 1440 max)
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
