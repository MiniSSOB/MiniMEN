'use strict';
// MinibossX - fusion of Bots4 (combat), Kings of Chaos (turns, vault, spy/sentry),
// Bootleggers (ranks, risk) and CIFI (loop reset prestige). Saves to localStorage.
const KEY = 'minibossx_v1', TURN_SEC = 20, CAP = 250;
const $ = s => document.querySelector(s), fl = Math.floor, rnd = Math.random;
const WPN = [['Fists',5,0],['Lead Pipe',12,500],['Crab Whistler',28,5000],['Maul',60,40000],['Scarab Blade',120,300000],['Doom Cannon',260,2e6]];
const ARM = [['Rags',0,0],['Leather',30,400],['Kevlar',120,4000],['Iron Pelt',400,35000],['Spirit Forge',1200,300000],['Titan Plate',3500,2e6]];
// [name, str, dex, con, weaponDmg, armor, unlockLevel]
const BOTS = [['Trainmate',10,10,10,3,0,1],['T101',18,15,10,6,10,3],['Terminatrix',70,50,50,20,112,6],
  ['X-Machine',130,85,85,45,245,10],['X-Terminator',300,280,200,110,435,15],['Cyborg LX',1000,800,800,270,640,20]];
const NAMES = ['Vinnie','Knuckles','Big Sal','Lady Cass','Mr. Bones'];
const DEF = {cash:200,bank:0,turns:50,cd:300,pay:1000,cdL:0,payL:0,str:5,dex:5,con:5,int:5,spy:1,sen:1,
  xp:0,lvl:1,pts:0,wpn:0,arm:0,earned:0,mp:0,resets:0,rt:0,day:'',streak:0,boxAt:0};
let S, tab = 'box';

const fmt = n => n >= 1e9 ? (n/1e9).toFixed(2)+'B' : n >= 1e6 ? (n/1e6).toFixed(2)+'M' : n >= 1e4 ? (n/1e3).toFixed(1)+'K' : fl(n);
const mult = () => 1 + 0.1 * S.mp;
const me = () => ({str:S.str, dex:S.dex, con:S.con, wd:WPN[S.wpn][1], arm:ARM[S.arm][1]});

function mkRivals() {
  return NAMES.map((n, i) => {
    const k = 0.6 + i * 0.2, L = S.lvl;
    return {n, str:Math.round(5+L*4*k), dex:Math.round(5+L*3*k), con:Math.round(5+L*3*k),
      wd:Math.round(8+L*7*k), arm:Math.round(L*14*(0.5+i*0.3)), sen:1+Math.round(L*1.5*(i+1)), cash:1000*(i+1)};
  });
}
function load() {
  try { S = Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY))); } catch (e) { S = Object.assign({}, DEF); }
  S.log = S.log || []; S.t = S.t || Date.now(); if (!S.rivals) S.rivals = mkRivals();
  const today = new Date().toDateString();
  if (S.day !== today) {
    S.streak = S.day === new Date(Date.now() - 864e5).toDateString() ? S.streak + 1 : 1; S.day = today;
    const b = 20 * Math.min(S.streak, 7); S.turns = Math.min(CAP, S.turns + b);
    log(`Day ${S.streak} login bonus: +${b} turns`);
  }
}
const save = () => localStorage.setItem(KEY, JSON.stringify(S));
function log(m, c) { S.log.unshift(`<div class="${c||''}">${m}</div>`); S.log.length = Math.min(S.log.length, 30); }
const earn = n => { S.cash += n; S.earned += n; };
function gainXp(x) {
  S.xp += x;
  while (S.xp >= S.lvl * 100) { S.xp -= S.lvl * 100; S.lvl++; S.pts += 3; log(`LEVEL UP! You are level ${S.lvl}. +3 stat points`, 'win'); }
}

// Bots4-style combat: hit chance = atk/(atk+def), absorb = 2*sqrt(armor)%, damage scales with STR
function duel(a, b) {
  let ha = a.con*10+50, hb = b.con*10+50, dealt = 0, r = 0;
  const swing = (x, y) => {
    const atk = Math.max(x.dex*2-8, 1), df = y.dex/2;
    if (rnd() > Math.min(.95, Math.max(.05, atk/(atk+df)))) return 0;
    const d = x.wd * (1 + x.str/100) * (.5 + rnd()*.5), ab = Math.min(.9, 2*Math.sqrt(y.arm)/100);
    return Math.max(1, d * (1 - ab));
  };
  while (ha > 0 && hb > 0 && r++ < 60) {
    const d1 = swing(a, b); hb -= d1; dealt += d1;
    if (hb <= 0) break;
    ha -= swing(b, a);
  }
  return {win: hb <= 0 || (ha > 0 && hb < ha), dealt};
}

// Kings-of-Chaos-style NPC raiders: they hit your pocket, never your bank
function raid() {
  if (S.cash < 10) return;
  const pct = .3 * 100 / (100 + S.sen*8 + ARM[S.arm][1]/5 + S.con), lost = fl(S.cash * pct);
  S.cash -= lost; log(`A raider hit you for $${fmt(lost)}. Bank your cash!`, 'lose');
}
function tick() {
  const now = Date.now(), dt = Math.min((now - S.t) / 1000, 864000); S.t = now;
  S.turns = Math.min(CAP, S.turns + dt / TURN_SEC * (1 + .05 * S.mp));
  S.bank *= Math.pow(.99, dt / 3600); // 1% vault tax per hour
  S.rivals.forEach((r, i) => r.cash += dt * 4 * (i + 1));
  S.rt += dt; let n = 0;
  while (S.rt >= 120 && n < 5) { S.rt -= 120; n++; if (rnd() < .6) raid(); }
  if (S.rt > 120) S.rt = 0;
}

const A = {
  box() {
    if (Date.now() < S.boxAt) return;
    let v = fl((S.pay*.1 + rnd()*S.pay*.9) * mult()), jp = rnd() < .05;
    if (jp) v *= 5; earn(v); S.boxAt = Date.now() + S.cd*1000;
    log(`${jp ? 'JACKPOT! ' : ''}The box paid $${fmt(v)}`, 'win');
  },
  stat(k) { if (S.pts > 0) { S.pts--; S[k]++; } },
  train(i) {
    const b = BOTS[i]; if (S.turns < 2 || S.lvl < b[6]) return; S.turns -= 2;
    const r = duel(me(), {str:b[1], dex:b[2], con:b[3], wd:b[4], arm:b[5]}), t = i + 1;
    if (r.win) { const c = fl(t*60*mult()); earn(c); gainXp(t*12*(1+S.int/40)); log(`Beat ${b[0]}: +$${fmt(c)}`, 'win'); }
    else { gainXp(t*3); log(`${b[0]} beat you.`, 'lose'); }
  },
  rob(i) {
    const r = S.rivals[i]; if (S.turns < 8) return; S.turns -= 8;
    if (duel(me(), r).win) {
      const s = fl(r.cash * (.5 + rnd()*.2)); r.cash -= s; earn(s); gainXp((i+1)*20*(1+S.int/40));
      log(`Robbed ${r.n} for $${fmt(s)}!`, 'win');
    } else { const l = fl(S.cash*.1); S.cash -= l; log(`${r.n} beat you. Medical bill: $${fmt(l)}`, 'lose'); }
  },
  buy(x) { // "wpn:3" or "arm:2"
    const [k, i] = x.split(':'), T = k === 'wpn' ? WPN : ARM, c = T[i][2];
    if (+i > S[k] && S.cash >= c) { S.cash -= c; S[k] = +i; log(`Bought ${T[i][0]}`); }
  },
  covert(k) { const c = fl(200 * 1.35 ** S[k]); if (S.cash >= c) { S.cash -= c; S[k]++; } },
  hack() { const c = fl(1000 * 1.25 ** S.cdL); if (S.cash >= c && S.cd > 30) { S.cash -= c; S.cd -= 10; S.cdL++; } },
  rng() { const c = fl(500 * 1.2 ** S.payL); if (S.cash >= c) { S.cash -= c; S.pay += 250; S.payL++; } },
  dep(f) { const n = fl(S.cash * f); S.cash -= n; S.bank += n; },
  wd(f) { const n = fl(S.bank * f); S.bank -= n; S.cash += n; },
  loop() {
    const g = fl(Math.sqrt(S.earned / 5000)); if (S.earned < 50000 || g < 1) return;
    const keep = {mp:S.mp+g, resets:S.resets+1, day:S.day, streak:S.streak, log:S.log};
    S = Object.assign({}, DEF, keep, {t:Date.now()}); S.rivals = mkRivals();
    log(`LOOP RESET! +${g} Mod Points. All payouts +${g*10}%`, 'win');
  }
};

const btn = (a, i, txt, cls = '', dis = false) => `<button class="act ${cls}" data-a="${a}" data-i="${i}" ${dis ? 'disabled' : ''}>${txt}</button>`;
const V = {
  box: () => `<h2>The Box</h2><button id="boxbtn" class="big" data-a="box">OPEN THE BOX</button><div id="bt"></div>
    <p class="dim">Pays up to $${fmt(S.pay*mult())}. 5% chance of a 5x jackpot. Cash lands in your pocket, where raiders can take it.</p>`,
  train: () => `<h2>Stats <small class="dim">(${S.pts} points)</small></h2>` +
    ['str','dex','con','int'].map(k => `<div class="card"><span><b>${k.toUpperCase()} ${S[k]}</b><small>${{str:'Hit harder',dex:'Hit more, dodge more',con:'HP = CON x10 + 50',int:'More XP per win'}[k]}</small></span>${btn('stat',k,'+1','teal',S.pts<1)}</div>`).join('') +
    `<h2>Training bots <small class="dim">(2 turns)</small></h2>` +
    BOTS.map((b, i) => `<div class="card"><span><b>${b[0]}</b><small>Unlocks at level ${b[6]}</small></span>${btn('train',i,'Fight','',S.turns<2||S.lvl<b[6])}</div>`).join(''),
  rivals: () => `<h2>Rivals <small class="dim">(8 turns)</small></h2><p class="dim">Your spy rating (${S.spy}) must be at least half their sentry to see their cash.</p>` +
    S.rivals.map((r, i) => `<div class="card"><span><b>${r.n}</b><small>Sentry ${r.sen} | Cash ${S.spy*2>=r.sen ? '$'+fmt(r.cash) : '???'}</small></span>${btn('rob',i,'Rob','red',S.turns<8)}</div>`).join(''),
  market() {
    const row = (k, T) => T.map((t, i) => `<div class="card"><span><b>${t[0]}</b><small>${k==='wpn'?'Damage':'Armor'} ${t[k==='wpn'?1:1]}</small></span>${i<=S[k] ? `<small>${i===S[k]?'Equipped':'Owned'}</small>` : btn('buy',k+':'+i,'$'+fmt(t[2]),'',S.cash<t[2])}</div>`).join('');
    const hc = fl(1000*1.25**S.cdL), rc = fl(500*1.2**S.payL);
    return `<h2>Weapons</h2>${row('wpn',WPN)}<h2>Armor</h2>${row('arm',ARM)}<h2>Black market</h2>
    <div class="card"><span><b>Hack timer (-10s)</b><small>Cooldown ${S.cd}s</small></span>${btn('hack',0,'$'+fmt(hc),'',S.cash<hc||S.cd<=30)}</div>
    <div class="card"><span><b>Corrupt RNG (+$250 max)</b><small>Max payout $${fmt(S.pay)}</small></span>${btn('rng',0,'$'+fmt(rc),'',S.cash<rc)}</div>
    <div class="card"><span><b>Train spies</b><small>Spy rating ${S.spy}</small></span>${btn('covert','spy','$'+fmt(200*1.35**S.spy),'',S.cash<200*1.35**S.spy)}</div>
    <div class="card"><span><b>Train sentries</b><small>Sentry rating ${S.sen} (blocks raiders)</small></span>${btn('covert','sen','$'+fmt(200*1.35**S.sen),'',S.cash<200*1.35**S.sen)}</div>`;
  },
  bank() {
    const g = fl(Math.sqrt(S.earned / 5000));
    return `<h2>Bank</h2><p class="dim">Banked cash can't be raided or robbed, but the vault takes 1% per hour.</p>
    <div class="card"><span><b>Pocket $${fmt(S.cash)}</b><small>Exposed to raiders</small></span>${btn('dep',1,'Bank all','teal',S.cash<1)}</div>
    <div class="card"><span><b>Bank $${fmt(S.bank)}</b><small>Safe</small></span>${btn('wd',1,'Withdraw all','',S.bank<1)}</div>
    <h2>Loop reset</h2><p class="dim">Wipe your run for permanent Mod Points (+10% cash and +5% turn speed each). Needs $50K earned this run.</p>
    <div class="card"><span><b>Mod Points ${S.mp}</b><small>Resets ${S.resets} | Reset now for +${S.earned>=50000?g:0}</small></span>${btn('loop',0,'Loop reset','red',S.earned<50000||g<1)}</div>`;
  }
};
const TABS = {box:'Box', train:'Train', rivals:'Rivals', market:'Market', bank:'Bank'};

function hud() {
  $('#hud').innerHTML = `<span class="c">$${fmt(S.cash)}</span><span class="b">Bank $${fmt(S.bank)}</span><span>Turns ${fl(S.turns)}/${CAP}</span>
    <span>Lv ${S.lvl} (${fl(S.xp)}/${S.lvl*100} xp)</span>${S.mp ? `<span>MP ${S.mp}</span>` : ''}`;
}
function boxTimer() {
  const b = $('#boxbtn'); if (!b) return;
  const left = Math.max(0, S.boxAt - Date.now()), s = Math.ceil(left / 1000);
  b.disabled = left > 0; $('#bt').textContent = left ? `${fl(s/60)}:${String(s%60).padStart(2,'0')}` : 'Ready';
}
function render() {
  $('#nav').innerHTML = Object.entries(TABS).map(([k, v]) => `<button data-t="${k}" class="${k===tab?'on':''}">${v}</button>`).join('');
  $('#view').innerHTML = V[tab](); $('#log').innerHTML = S.log.slice(0, 5).join(''); hud(); boxTimer();
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-t]'); if (t) { tab = t.dataset.t; render(); return; }
  const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
  const a = b.dataset.a, i = ['train','rob','dep','wd'].includes(a) ? +b.dataset.i : b.dataset.i;
  A[a](i); tick(); save(); render();
});
load(); tick(); render();
setInterval(() => { tick(); hud(); boxTimer(); }, 1000);
setInterval(save, 5000);
