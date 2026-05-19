/* ============================================================
   DATA
   ============================================================ */
const SYMS = [
  { e: '🐕', v: 18, w: 8 },   // labrador   — редкий, дорогой
  { e: '🐩', v: 14, w: 10 },   // poodle
  { e: '🦮', v: 12, w: 12 },   // guide dog
  { e: '🦴', v: 8, w: 18 },   // bone
  { e: '🐾', v: 5, w: 22 },   // paw
  { e: 'A', v: 3, w: 30 },
  { e: 'K', v: 2, w: 34 },
  { e: 'Q', v: 2, w: 36 },
  { e: 'J', v: 1, w: 38 },
  { e: '🎰', v: 60, w: 2 },   // WILD — очень редкий
];

// Bonus multiplier table  [mult, chance_weight, label]
const BONUS_MULTS = [
  { x: 3, w: 50, label: '×3' },
  { x: 5, w: 30, label: '×5' },
  { x: 10, w: 12, label: '×10' },
  { x: 25, w: 6, label: '×25' },
  { x: 50, w: 1.5, label: '×50' },
  { x: 100, w: .5, label: '×100' },
];

const GAMES = [
  { e: '🐕', n: 'The Dog House', rtp: '96.5%', tag: 'hot' },
  { e: '🌌', n: 'Starlight X', rtp: '97.1%', tag: '' },
  { e: '🍒', n: 'Classic Fruits', rtp: '95.8%', tag: 'hot' },
  { e: '🔱', n: 'Gates of Zeus', rtp: '96.9%', tag: '' },
  { e: '🧊', n: 'Frozen Wilds', rtp: '96.2%', tag: 'new' },
  { e: '🐉', n: 'Dragon Kingdom', rtp: '96.4%', tag: '' },
  { e: '💎', n: 'Diamond Heist', rtp: '97.8%', tag: 'new' },
  { e: '🌊', n: 'Deep Sea Riches', rtp: '96.0%', tag: '' },
];

const COIN_PACKS = [
  { ic: '🐾', amt: 10000, lbl: 'PawCoins', price: 'Бесплатно', free: true, pop: false },
  { ic: '🦴', amt: 50000, lbl: 'PawCoins', price: '99 ₽', free: false, pop: false },
  { ic: '🐕', amt: 150000, lbl: 'PawCoins', price: '249 ₽', free: false, pop: true },
  { ic: '🐩', amt: 500000, lbl: 'PawCoins', price: '699 ₽', free: false, pop: false },
  { ic: '👑', amt: 2000000, lbl: 'PawCoins', price: '1 999 ₽', free: false, pop: false },
];

const LB_INIT = [
  { n: 'WoofMaster99', av: '🐕', amt: 2840000 },
  { n: 'PugLord_42', av: '🐩', amt: 1990500 },
  { n: 'DachshundKing', av: '🦴', amt: 1455000 },
  { n: 'BoneCollector', av: '🐾', amt: 987200 },
  { n: 'PawCasino_Pro', av: '🏆', amt: 754000 },
];

const BOT_NAMES = [
  'PugLord', 'WoofBro', 'DachsDog', 'LabFan', 'BoneMaster',
  'PawKing', 'TailWagger', 'BarkLord', 'FurBall', 'ChopperK9',
];
const BOT_MSGS = [
  'Кручу дальше 🎰', 'ГГ всем!', 'Вот это да 😮', 'ставлю макс!',
  'почти бонус был...', 'удачи всем 🍀', 'это игра нервов', 'поймал ×5 !!!',
  'красная полоса((', 'снова крутить!', 'лайк кто выиграл', 'хз, наверное повезёт',
  'не везёт сегодня', 'ща будет бонус чую', '💎💎💎', 'где ×100 блин',
];
const BOT_WIN_MSGS = [
  'Выиграл {w} 🐾!', 'Поймал {w} монет!', 'Бонус ×{m} дал {w} 🎉',
  '{w} PawCoins на счёт!', 'ГГ {w} 🔥',
];

/* ============================================================
   STATE & PERSISTENCE
   ============================================================ */
const STORAGE_KEY = 'paw_casino_state';

let state = {
  balance: 99221,
  bet: 100,
  totalSpins: 0,
  totalWins: 0,
  totalEarned: 0,
  leaderboard: [...LB_INIT]
};

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
    } catch (e) {
      console.error('Failed to load state', e);
    }
  }
}

loadState();

let spinning = false;
const REEL_COUNT = 5, ROWS = 3;
let reelSyms = [];

/* ============================================================
   UTILS
   ============================================================ */
function wRand(arr) {
  const tot = arr.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * tot;
  for (const x of arr) {
    r -= x.w;
    if (r <= 0) return x;
  }
  return arr[arr.length - 1];
}

function fmtN(n) {
  return Math.round(n).toLocaleString('ru-RU');
}

function notify(msg) {
  const el = document.getElementById('notif');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2800);
}

function updBalance() {
  document.getElementById('balNum').textContent = fmtN(state.balance);
  saveState();
}

function updStats() {
  document.getElementById('siSpins').textContent = state.totalSpins;
  document.getElementById('siWins').textContent = state.totalWins;
  document.getElementById('siTotal').textContent = fmtN(state.totalEarned);
  saveState();
}

/* ============================================================
   INIT REELS
   ============================================================ */
function initReels() {
  const wrap = document.getElementById('reelsWrap');
  wrap.innerHTML = '';
  reelSyms = [];
  for (let r = 0; r < REEL_COUNT; r++) {
    const reel = document.createElement('div');
    reel.className = 'reel';
    reel.id = 'rl' + r;
    const hl = document.createElement('div');
    hl.className = 'reel-hl';
    reel.appendChild(hl);
    const inner = document.createElement('div');
    inner.className = 'reel-inner';
    inner.id = 'ri' + r;
    const col = [];
    for (let row = 0; row < ROWS; row++) {
      const sym = wRand(SYMS);
      col.push(sym);
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.textContent = sym.e;
      inner.appendChild(cell);
    }
    reelSyms.push(col);
    reel.appendChild(inner);
    wrap.appendChild(reel);
  }
}

/* ============================================================
   SPIN
   ============================================================ */
async function doSpin() {
  if (spinning) return;
  if (state.balance < state.bet) {
    notify('❌ Недостаточно PawCoins!');
    return;
  }
  spinning = true;
  state.balance -= state.bet;
  updBalance();
  state.totalSpins++;
  updStats();

  const btn = document.getElementById('spinBtn');
  btn.disabled = true;
  btn.classList.add('go');
  btn.textContent = '🌀 Крутится...';
  const wl = document.getElementById('winLine');
  wl.textContent = '...';
  wl.className = 'win-line';

  // Clear old win highlights
  document.querySelectorAll('.cell').forEach(c => {
    c.classList.remove('win-cell', 'bonus-cell');
    const mb = c.querySelector('.mult-badge');
    if (mb) mb.remove();
  });

  // Generate final symbols per reel
  const nextSyms = [];
  for (let r = 0; r < REEL_COUNT; r++) {
    const col = [];
    for (let row = 0; row < ROWS; row++) col.push(wRand(SYMS));
    nextSyms.push(col);
  }

  // Animate reels with stagger
  const proms = [];
  for (let r = 0; r < REEL_COUNT; r++) {
    proms.push(new Promise(res => {
      setTimeout(() => {
        const inner = document.getElementById('ri' + r);
        const cells = [...inner.querySelectorAll('.cell')];
        let ticks = 0;
        const iv = setInterval(() => {
          cells.forEach(c => {
            c.textContent = wRand(SYMS).e;
          });
          ticks++;
          if (ticks >= 9) {
            clearInterval(iv);
            cells.forEach((c, i) => {
              c.textContent = nextSyms[r][i].e;
            });
            res();
          }
        }, 70);
      }, r * 130);
    }));
  }
  await Promise.all(proms);
  reelSyms = nextSyms;

  await new Promise(r => setTimeout(r, 150));

  // ---- Calculate win ----
  const { win, bonusTriggered, bonusMult, baseWin } = calcWin(reelSyms, state.bet);

  if (bonusTriggered) {
    // Show cells first
    highlightCells(reelSyms);
    await new Promise(r => setTimeout(r, 300));
    openBonusModal(bonusMult, win, baseWin);
    // Balance updated inside closeBonusModal
  } else if (win > 0) {
    state.balance += win;
    updBalance();
    state.totalWins++;
    state.totalEarned += win;
    updStats();
    wl.textContent = `🎉 ПОБЕДА! +${fmtN(win)} 🐾`;
    wl.className = 'win-line is-win';
    notify(`🎉 Выиграл ${fmtN(win)} PawCoins!`);
    highlightCells(reelSyms);
    addChatBotWin(win, 1);
  } else {
    wl.textContent = '😞 Не повезло... Попробуй ещё!';
    wl.className = 'win-line is-lose';
  }

  spinning = false;
  btn.disabled = false;
  btn.classList.remove('go');
  btn.textContent = '🎰 КРУТИТЬ';
}

/* ============================================================
   WIN CALC
   ============================================================ */
function calcWin(syms, b) {
  const mid = syms.map(col => col[1]);

  // Count middle row
  const cnt = {};
  for (const s of mid) cnt[s.e] = (cnt[s.e] || 0) + 1;

  let baseWin = 0;
  for (const [em, count] of Object.entries(cnt)) {
    if (count >= 3) {
      const sym = SYMS.find(s => s.e === em);
      if (sym) baseWin += sym.v * count * b;
    }
  }

  // Wild bonus (🎰) — extremely rare
  const wilds = mid.filter(s => s.e === '🎰').length;
  if (wilds >= 1) baseWin += wilds * 60 * b;

  // === BONUS TRIGGER ===
  let bonusCount = 0;
  for (const col of syms) for (const s of col) if (s.e === '🦴') bonusCount++;

  let bonusTriggered = false;
  let bonusMult = null;
  let totalWin = baseWin;

  if (bonusCount >= 3 && Math.random() < 0.18) {
    bonusMult = wRand(BONUS_MULTS);
    const bw = Math.max(baseWin, b * 2) * bonusMult.x;
    totalWin = Math.round(bw);
    bonusTriggered = true;
  }

  // Tiny consolation wins (8% chance)
  if (!bonusTriggered && totalWin === 0 && Math.random() < 0.08) {
    totalWin = Math.round(b * (0.3 + Math.random() * 1.2));
  }

  return { win: totalWin, bonusTriggered, bonusMult, baseWin };
}

/* ============================================================
   HIGHLIGHT WINNING CELLS
   ============================================================ */
function highlightCells(syms) {
  const mid = syms.map(col => col[1]);
  const cnt = {};
  for (const s of mid) cnt[s.e] = (cnt[s.e] || 0) + 1;

  for (let r = 0; r < REEL_COUNT; r++) {
    const inner = document.getElementById('ri' + r);
    const cells = [...inner.querySelectorAll('.cell')];
    if (cells[1] && cnt[syms[r][1].e] >= 3) {
      cells[1].classList.add('win-cell');
    }
    // Highlight bones for bonus
    cells.forEach((c, i) => {
      if (syms[r][i].e === '🦴') c.classList.add('bonus-cell');
    });
  }
}

/* ============================================================
   BONUS MODAL
   ============================================================ */
let _pendingBonus = null;

function openBonusModal(mult, totalWin, baseWin) {
  _pendingBonus = { mult, totalWin };
  document.getElementById('bmMult').textContent = mult.label;
  document.getElementById('bmWin').textContent = `+${fmtN(totalWin)} 🐾`;
  const icons = ['🎰', '🦴', '🐾', '🐕', '🎁'];
  document.getElementById('bmIcon').textContent = icons[Math.floor(Math.random() * icons.length)];
  document.getElementById('bonusOverlay').classList.add('show');
  document.getElementById('spinBtn').disabled = true;
}

function closeBonusModal() {
  document.getElementById('bonusOverlay').classList.remove('show');
  if (_pendingBonus) {
    const { totalWin } = _pendingBonus;
    state.balance += totalWin;
    updBalance();
    state.totalWins++;
    state.totalEarned += totalWin;
    updStats();
    const wl = document.getElementById('winLine');
    wl.textContent = `💫 БОНУС! +${fmtN(totalWin)} 🐾`;
    wl.className = 'win-line is-bonus';
    notify(`💫 Бонус-выигрыш: +${fmtN(totalWin)} PawCoins!`);
    addChatBotWin(totalWin, _pendingBonus.mult.x);
    _pendingBonus = null;
  }
  document.getElementById('spinBtn').disabled = false;
  spinning = false;
}

/* ============================================================
   BET CONTROL
   ============================================================ */
function chgBet(d) {
  if (d === 850) state.bet = 1000;
  else state.bet = Math.max(10, Math.min(1000, state.bet + d));
  document.getElementById('betDisp').textContent = `🐾 ${state.bet}`;
  saveState();
}

/* ============================================================
   GAMES GRID
   ============================================================ */
function initGames() {
  const g = document.getElementById('gamesGrid');
  GAMES.forEach(gm => {
    const c = document.createElement('div');
    c.className = 'gc';
    c.innerHTML = `
      ${gm.tag === 'hot' ? '<div class="gc-tag tag-hot">🔥 HOT</div>' : ''}
      ${gm.tag === 'new' ? '<div class="gc-tag tag-new">✨ NEW</div>' : ''}
      <div class="gc-thumb">${gm.e}</div>
      <div class="gc-info">
        <div class="gc-name">${gm.n}</div>
        <div class="gc-rtp">RTP: ${gm.rtp}</div>
      </div>`;
    c.onclick = () => notify(`🎮 Загружаю ${gm.n}...`);
    g.appendChild(c);
  });
}

/* ============================================================
   LEADERBOARD
   ============================================================ */
function renderLB() {
  const box = document.getElementById('lbBox');
  box.innerHTML = '';
  const cls = ['g', 's', 'b', '', ''];
  const em = ['🥇', '🥈', '🥉', '4', '5'];
  state.leaderboard.slice(0, 5).forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'lb-row';
    row.innerHTML = `
      <div class="lb-rank ${cls[i]}">${em[i]}</div>
      <div class="lb-av">${p.av}</div>
      <div class="lb-name">${p.n}</div>
      <div class="lb-amt">${fmtN(p.amt)} 🐾</div>`;
    box.appendChild(row);
  });
}

/* ============================================================
   SHOP
   ============================================================ */
function initShop() {
  const g = document.getElementById('shopGrid');
  COIN_PACKS.forEach(p => {
    const c = document.createElement('div');
    c.className = `cp${p.pop ? ' pop' : ''}`;
    c.innerHTML = `
      <div class="cp-icon">${p.ic}</div>
      <div class="cp-amt">${fmtN(p.amt)}</div>
      <div class="cp-lbl">${p.lbl}</div>
      <div class="cp-price">${p.price}</div>`;
    c.onclick = () => {
      state.balance += p.amt;
      updBalance();
      notify(`💰 +${fmtN(p.amt)} PawCoins зачислено!`);
    };
    g.appendChild(c);
  });
}

/* ============================================================
   LIVE CHAT
   ============================================================ */
function addMsg(type, name, color, text) {
  const box = document.getElementById('chatMsgs');
  const d = document.createElement('div');
  d.className = `msg${type ? ' msg-' + type : ''}`;
  d.innerHTML = `<span class="msg-name" style="color:${color}">${name}</span><span class="msg-text">${text}</span>`;
  box.appendChild(d);
  // Limit messages
  while (box.children.length > 60) box.removeChild(box.firstChild);
  box.scrollTop = box.scrollHeight;
}

function sendMsg() {
  const inp = document.getElementById('chatInput');
  const txt = inp.value.trim();
  if (!txt) return;
  addMsg('', 'Вы', '#FFD700', txt);
  inp.value = '';
  inp.focus();
}

function addChatBotWin(w, mult) {
  const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  const colors = ['#ff9800', '#4fc3f7', '#ce93d8', '#80cbc4', '#ef9a9a', '#a5d6a7'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  let tmpl = BOT_WIN_MSGS[Math.floor(Math.random() * BOT_WIN_MSGS.length)];
  tmpl = tmpl.replace('{w}', fmtN(w)).replace('{m}', mult);
  addMsg('win', name, color, tmpl);
}

function startBotChat() {
  function postBot() {
    const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const colors = ['#ff9800', '#4fc3f7', '#ce93d8', '#80cbc4', '#ef9a9a', '#a5d6a7'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const txt = BOT_MSGS[Math.floor(Math.random() * BOT_MSGS.length)];
    addMsg('', name, color, txt);
    const delay = 3000 + Math.random() * 8000;
    setTimeout(postBot, delay);
  }
  // Initial messages
  addMsg('sys', '🤖 Система', '#ffbf69', 'Добро пожаловать в PawCasino! Удачи 🐾');
  setTimeout(postBot, 2000);
}

/* ============================================================
   TICKER
   ============================================================ */
function initTicker() {
  const wins = [
    { u: 'PugLord_42', g: 'Dog House', w: '42 500' },
    { u: 'WoofMaster', g: 'Starlight X', w: '18 000' },
    { u: 'BoneHunter', g: 'Classic Fruits', w: '7 200' },
    { u: 'DachsKing', g: 'Dragon Kingdom', w: '95 000' },
    { u: 'Анон 🐾', g: 'Dog House', w: '300 000' },
    { u: 'PawCasino_Pro', g: 'Diamond Heist', w: '55 500' },
    { u: 'FurBall99', g: 'Dog House', w: '12 750' },
  ];
  const tr = document.getElementById('tickerTrack');
  const doubled = [...wins, ...wins];
  doubled.forEach(e => {
    const d = document.createElement('div');
    d.className = 'tick-item';
    d.innerHTML = `🎉 <b>${e.u}</b> выиграл <em>${e.w} 🐾</em> в "${e.g}" &nbsp;•`;
    tr.appendChild(d);
  });
  // Live inject new wins
  setInterval(() => {
    const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const game = GAMES[Math.floor(Math.random() * GAMES.length)];
    const w = fmtN(Math.floor(500 + Math.random() * 200000));
    const d = document.createElement('div');
    d.className = 'tick-item';
    d.innerHTML = `🎉 <b>${name}</b> выиграл <em>${w} 🐾</em> в "${game.n}" &nbsp;•`;
    tr.appendChild(d);
    tr.appendChild(d.cloneNode(true));
  }, 12000);
}

/* ============================================================
   ONLINE COUNTER (fake, fluctuates)
   ============================================================ */
function initOnline() {
  let count = 1187 + Math.floor(Math.random() * 200);
  function update() {
    const delta = Math.floor((Math.random() - 0.48) * 7);
    count = Math.max(900, Math.min(1800, count + delta));
    document.getElementById('onlineCount').textContent = fmtN(count);
    setTimeout(update, 2000 + Math.random() * 2000);
  }
  update();
}

/* ============================================================
   LEADERBOARD LIVE UPDATE
   ============================================================ */
function startLBUpdates() {
  setInterval(() => {
    const i = Math.floor(Math.random() * state.leaderboard.length);
    state.leaderboard[i].amt += Math.floor(1000 + Math.random() * 50000);
    state.leaderboard.sort((a, b) => b.amt - a.amt);
    renderLB();
    saveState();
  }, 7000 + Math.random() * 5000);
}

/* ============================================================
   BONUS STRIP CLAIM
   ============================================================ */
function claimBonus() {
  state.balance += 50000;
  updBalance();
  notify('🎁 Бонус получен! +50 000 PawCoins!');
}

/* ============================================================
   INIT ALL
   ============================================================ */
window.onload = () => {
  initReels();
  initGames();
  renderLB();
  initShop();
  initTicker();
  initOnline();
  startBotChat();
  startLBUpdates();
  updBalance();
  updStats();
  document.getElementById('betDisp').textContent = `🐾 ${state.bet}`;
};
