// MiniMEN Master Brain
const Game = {
    // Basic stats
    data: {
        gold: 0,
        turns: 0,
        experience: 0,
        isLoggedIn: false
    },

    // Initialize: Setup menu and check login
    init: function() {
        this.injectSidebar();
        this.checkLogin();
        console.log("MiniMEN Engine Initialized");
    },

    // Inject the sidebar automatically (No more manual updates!)
    injectSidebar: function() {
        const sidebarHTML = `
            <h2>MiniMEN</h2>
            <a href="index.html">Command Center</a>
            <a href="battlefield.html">Battlefield</a>
            <a href="armory.html">Armory</a>
            <a href="conquest.html">Conquest</a>
            <a href="training.html">Training</a>
            <a href="upgrades.html">Upgrades</a>
            <a href="intelligence.html">Intelligence</a>
            <a href="alliances.html">Alliances</a>
            <a href="trade.html">Trade</a>
            <a href="safe.html">Safe</a>
            <a href="attack-log.html">Attack Log</a>
            <a href="rewards.html">Rewards</a>
            <a href="statistics.html">Statistics</a>
            <a href="donate.html">Donate</a>
            <a href="buddy-list.html">Buddy List</a>
            <a href="logout.html">Log Out</a>
        `;
        document.getElementById('sidebar').innerHTML = sidebarHTML;
    },

    // Login/Session Logic
    checkLogin: function() {
        const loggedIn = localStorage.getItem('isLoggedIn');
        if (!loggedIn && !window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
    }
};

// Run the engine when the page loads
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
