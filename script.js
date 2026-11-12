// ===== PronounTalk: login -> biodata -> dashboard (tes, skor, modul, pasangan, teman, chat) =====
// Data akun, hasil, pertemanan, dan pesan disimpan di Google Sheet lewat Apps Script.

const API = 'https://script.google.com/macros/s/AKfycbwVrViS20z02_tCijo7u_M7TwY4I9ZLiM18yqifb7NTaXPGB0NEs6uZHYRNMMiFS5nxUw/exec';

const BAGIAN = {
  kosakata:    { nama: 'Kosakata Dasar',     ikon: '📚', desc: 'Kata-kata dasar yang sering dipakai sehari-hari' },
  kelas_kata:  { nama: 'Kelas Kata Dasar',   ikon: '🧩', desc: 'Noun, verb, adjective, adverb, dan pronoun' },
  tata_bahasa: { nama: 'Tata Bahasa Dasar',  ikon: '✏️', desc: 'Pola kalimat dan pemakaian pronoun dalam kalimat' }
};
const MODUL = {
  kosakata:    { nama: 'Modul Kosakata Dasar',    desc: 'Kata benda, lawan kata, dan tempat sehari-hari' },
  kelas_kata:  { nama: 'Modul Kelas Kata Dasar',  desc: 'Mengenali noun, verb, adjective, dan adverb' },
  tata_bahasa: { nama: 'Modul Tata Bahasa Dasar', desc: 'Pronoun objek, possessive, dan present simple' }
};
const KEYS = Object.keys(BAGIAN);
const MEET = 'https://meet.google.com/new';
const ZOOM = 'https://zoom.us/start/videomeeting';
const BATAS_MODUL = 70;
const RING_C = 2 * Math.PI * 52;

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initial = s => esc((s || '?').trim().charAt(0).toUpperCase() || '?');

let db = {};            // { id: { id, nama, sekolah, umur, bio, hasil, sebelum } }
let friendList = [];    // hasil dari aksi "friends"
let questions = [];
let currentTab = 'biodata';
let quiz = null;
let chatWith = null;    // id teman yang sedang dibuka di chat
let chatTimer = null;

// ----- Penyimpanan lokal (token dan id sesi saja, bukan kata sandi) -----
function store(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
const getToken = () => load('pronountalk_token');
const getSession = () => load('pronountalk_session');
function setAuth(token, id) { store('pronountalk_token', token); store('pronountalk_session', id); }
function clearAuth() { setAuth(null, null); }
function currentUser() { const id = getSession(); return id && db[id] ? db[id] : null; }

// ----- Koneksi ke server -----
async function apiGet(action) {
  const r = await fetch(`${API}?action=${action}`);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
async function apiPost(action, data = {}) {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, token: getToken(), ...data })
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const res = await r.json();
  if (!res.ok && /Sesi/.test(res.error || '')) {
    clearAuth();
    toast('Sesi berakhir, silakan masuk lagi', 'bad');
    setTimeout(route, 0);
  }
  return res;
}

// Ambil semua pengguna dan hasil tes, lalu susun ke db
async function loadAll() {
  const [users, results] = await Promise.all([apiGet('users'), apiGet('results')]);
  db = {};
  users.forEach(x => {
    db[x.id] = {
      id: x.id,
      bio: x.nama ? { nama: String(x.nama), sekolah: String(x.sekolah), umur: String(x.umur) } : null,
      hasil: {},
      sebelum: {}
    };
  });
  results.forEach(r => {
    const u = db[r.id];
    if (!u || !BAGIAN[r.bagian]) return;
    if (u.hasil[r.bagian]) u.sebelum[r.bagian] = u.hasil[r.bagian];
    u.hasil[r.bagian] = { skor: Number(r.skor), total: Number(r.total) };
  });
}
async function loadFriends() {
  const r = await apiPost('friends');
  if (!r.ok) throw new Error(r.error || 'Gagal memuat teman');
  friendList = r.friends;
}

// ----- Hitungan skor -----
function pct(h) { return h.total ? Math.round(h.skor / h.total * 100) : 0; }
function totalPct(u) {
  const sk = KEYS.reduce((a, k) => a + u.hasil[k].skor, 0);
  const t = KEYS.reduce((a, k) => a + u.hasil[k].total, 0);
  return t ? Math.round(sk / t * 100) : 0;
}
function levelOf(u) { const p = totalPct(u); return p >= 80 ? 'B1' : p >= 50 ? 'A2' : 'A1'; }
const sudahSemua = u => KEYS.every(k => u.hasil && u.hasil[k]);
const adaHasil = u => KEYS.some(k => u.hasil && u.hasil[k]);
function jarakSkor(a, b) {
  return KEYS.reduce((s, k) => s + Math.abs(pct(a.hasil[k]) - pct(b.hasil[k])), 0);
}

// ----- Tema -----
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  store('pronountalk_theme', t);
  $$('[data-set-theme]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setTheme === t)));
}

// ----- Notifikasi, konfeti, animasi -----
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 2600);
}
function confetti() {
  const cols = ['#E4574F', '#F2C94C', '#7FB8E0', '#2E7D5B', '#FF7A70', '#ffffff'];
  for (let i = 0; i < 70; i++) {
    const c = document.createElement('span');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = cols[i % cols.length];
    c.style.animationDelay = (Math.random() * 0.6) + 's';
    c.style.animationDuration = (2.2 + Math.random() * 1.5) + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4200);
  }
}
function ringSvg() {
  return `<svg class="ring" viewBox="0 0 120 120" aria-hidden="true">
    <circle class="ring-track" cx="60" cy="60" r="52"/>
    <circle class="ring-fg" cx="60" cy="60" r="52" stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C}"/>
  </svg>`;
}
function animateRing(root, p) {
  const fg = root.querySelector('.ring-fg');
  if (!fg) return;
  requestAnimationFrame(() => requestAnimationFrame(() => { fg.style.strokeDashoffset = RING_C * (1 - p / 100); }));
}
function countUp(el, to, ms = 1000) {
  const start = performance.now();
  (function f(t) {
    const k = Math.min((t - start) / ms, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(f);
  })(start);
}
function runCounts(root) { root.querySelectorAll('[data-to]').forEach(el => countUp(el, Number(el.dataset.to))); }
function animateBars(root) {
  root.querySelectorAll('[data-w]').forEach(el =>
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.width = el.dataset.w + '%'; })));
}
function setBusy(form, on) {
  const b = form.querySelector('button[type="submit"]');
  if (b) b.disabled = on;
}

// ----- Layar & tab -----
function showScreen(id) { $$('.screen').forEach(s => s.classList.toggle('hidden', s.id !== id)); }

function showTab(name) {
  quiz = null;
  if (name !== 'teman') { chatWith = null; clearInterval(chatTimer); }
  currentTab = name;
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  $$('.panel').forEach(p => p.classList.toggle('hidden', p.id !== 'tab-' + name));
  const u = currentUser();
  if (!u) return;
  if (name === 'biodata') renderBio(u);
  if (name === 'skor') renderSkor(u);
  if (name === 'soal') renderSoal(u);
  if (name === 'teman') renderTeman();
}

// Alur: login -> biodata -> dashboard
function route() {
  const u = currentUser();
  $('#logoutBtn').classList.toggle('hidden', !u);
  if (!u) return showScreen('authScreen');
  if (!u.bio) return openBioForm(u);
  showScreen('dashScreen');
  showTab(currentTab);
}

// ----- 1. Login & daftar -----
$$('[data-auth]').forEach(b => b.onclick = () => {
  const mode = b.dataset.auth;
  $$('[data-auth]').forEach(x => x.classList.toggle('active', x === b));
  $('#loginForm').classList.toggle('hidden', mode !== 'login');
  $('#registerForm').classList.toggle('hidden', mode !== 'register');
  $('#authMsg').textContent = '';
});

$('#loginForm').onsubmit = async e => {
  e.preventDefault();
  const f = new FormData(e.target);
  $('#authMsg').textContent = '';
  setBusy(e.target, true);
  try {
    const res = await apiPost('login', { email: String(f.get('email')).trim(), password: String(f.get('password')) });
    if (!res.ok) { $('#authMsg').textContent = res.error || 'Email atau kata sandi salah.'; return; }
    if (!res.id || !res.token) { $('#authMsg').textContent = 'Server belum memberi sesi. Pastikan Apps Script sudah deploy New version.'; return; }
    setAuth(res.token, res.id);
    await loadAll();
    toast('Selamat datang kembali 👋', 'ok');
    route();
  } catch (err) {
    $('#authMsg').textContent = 'Gagal terhubung ke server. Coba lagi.';
  } finally { setBusy(e.target, false); }
};

$('#registerForm').onsubmit = async e => {
  e.preventDefault();
  const f = new FormData(e.target);
  $('#authMsg').textContent = '';
  setBusy(e.target, true);
  try {
    const res = await apiPost('register', { email: String(f.get('email')).trim(), password: String(f.get('password')) });
    if (!res.ok) { $('#authMsg').textContent = res.error || 'Gagal membuat akun.'; return; }
    if (!res.id || !res.token) { $('#authMsg').textContent = 'Server belum memberi sesi. Pastikan Apps Script sudah deploy New version.'; return; }
    setAuth(res.token, res.id);
    await loadAll();
    toast('Akun dibuat. Yuk isi biodata!', 'ok');
    route();
  } catch (err) {
    $('#authMsg').textContent = 'Gagal terhubung ke server. Coba lagi.';
  } finally { setBusy(e.target, false); }
};

// ----- 2. Biodata -----
function openBioForm(u) {
  const f = $('#bioForm');
  f.nama.value = u.bio ? u.bio.nama : '';
  f.sekolah.value = u.bio ? u.bio.sekolah : '';
  f.umur.value = u.bio ? u.bio.umur : '';
  $('#bioCancel').classList.toggle('hidden', !u.bio);
  $('#bioTitle').textContent = u.bio ? 'Ubah biodata' : 'Isi biodata';
  showScreen('bioScreen');
}

$('#bioForm').onsubmit = async e => {
  e.preventDefault();
  const u = currentUser();
  if (!u) return route();
  const f = new FormData(e.target);
  const bio = { nama: String(f.get('nama')).trim(), sekolah: String(f.get('sekolah')).trim(), umur: String(f.get('umur')) };
  setBusy(e.target, true);
  try {
    const res = await apiPost('bio', bio);
    if (!res.ok) return toast(res.error || 'Gagal menyimpan biodata', 'bad');
    u.bio = bio;
    currentTab = 'biodata';
    toast('Biodata tersimpan ✨', 'ok');
    route();
  } catch (err) {
    toast('Gagal terhubung ke server', 'bad');
  } finally { setBusy(e.target, false); }
};

function renderBio(u) {
  const b = u.bio;
  const lv = sudahSemua(u) ? levelOf(u) : 'Belum dites';
  $('#bioView').innerHTML = `
    <div class="profile">
      <div class="avatar big">${initial(b.nama)}</div>
      <div><h3>${esc(b.nama)}</h3><p class="note">Pengguna PronounTalk</p></div>
    </div>
    <div class="tiles">
      <div class="tile"><span>Sekolah / kampus</span><strong>${esc(b.sekolah)}</strong></div>
      <div class="tile"><span>Umur</span><strong>${esc(b.umur)} tahun</strong></div>
      <div class="tile"><span>Level</span><strong>${lv}</strong></div>
    </div>`;
}

// ----- 3a. Menu Soal Basic English -----
function renderSoal(u) {
  if (!questions.length) {
    $('#soalContent').innerHTML = `<div class="empty"><div class="big">⚠️</div><p>Soal belum berhasil dimuat.</p></div>`;
    return;
  }
  const cards = KEYS.map((k, i) => {
    const h = u.hasil[k];
    const status = h ? `<span class="chip ${pct(h) >= 70 ? 'ok' : 'bad'}">Skor ${h.skor}/${h.total}</span>` : '<span class="chip">Belum dikerjakan</span>';
    return `<div class="bagian-card" data-k="${k}" style="--d:${i * 0.08}s">
      <div class="b-ikon">${BAGIAN[k].ikon}</div>
      <h3 style="margin-top:12px">${BAGIAN[k].nama}</h3>
      <p class="note">${BAGIAN[k].desc}</p>
      <div class="b-foot">${status}<button class="btn primary small" data-start="${k}">${h ? 'Ulangi' : 'Mulai'}</button></div>
    </div>`;
  }).join('');
  $('#soalContent').innerHTML = `
    <p class="lead">Tes diagnosis terdiri dari 3 bagian, masing-masing 10 soal. Kerjakan ketiganya untuk melihat analisa lengkap.</p>
    <div class="bagian-grid">${cards}</div>`;
}

// ----- 3b. Kuis satu bagian -----
function startQuiz(k) {
  const items = questions.filter(q => q.bagian === k);
  if (!items.length) { toast('Soal untuk bagian ini belum tersedia', 'bad'); return; }
  quiz = { bagian: k, items, i: 0, skor: 0, locked: false };
  $('#soalContent').innerHTML = `
    <div class="quiz" data-k="${k}">
      <div class="quiz-top">
        <button class="btn ghost small" id="quitQuiz">← Kembali</button>
        <span class="chip" id="qinfo"></span>
      </div>
      <div class="progress lg"><span id="qbar"></span></div>
      <div class="q-card" id="qtext"></div>
      <div class="options" id="qopts"></div>
      <div class="feedback" id="qfb" aria-live="polite"></div>
      <div class="quiz-actions">
        <span class="note">Tips: tekan 1–4 untuk memilih, Enter untuk lanjut</span>
        <button class="btn primary hidden" id="qnext">Lanjut →</button>
      </div>
    </div>`;
  renderQ();
}

function renderQ() {
  const it = quiz.items[quiz.i];
  quiz.locked = false;
  $('#qinfo').textContent = `${BAGIAN[quiz.bagian].nama} · ${quiz.i + 1}/${quiz.items.length}`;
  $('#qbar').style.width = (quiz.i / quiz.items.length * 100) + '%';
  $('#qtext').textContent = it.pertanyaan;
  const fb = $('#qfb');
  fb.className = 'feedback';
  fb.textContent = '';
  $('#qnext').classList.add('hidden');
  $('#qnext').textContent = quiz.i < quiz.items.length - 1 ? 'Lanjut →' : 'Lihat hasil 🎉';
  $('#qopts').innerHTML = it.pilihan.map((p, i) =>
    `<button class="opt" data-idx="${i}" style="animation-delay:${i * 0.05}s"><span class="letter">${'ABCD'[i]}</span><span>${esc(p)}</span></button>`
  ).join('');
}

function answer(idx) {
  if (!quiz || quiz.locked) return;
  const it = quiz.items[quiz.i];
  quiz.locked = true;
  const benar = it.pilihan[idx] === it.jawaban;
  const btns = $$('#qopts .opt');
  btns.forEach(b => {
    b.disabled = true;
    if (it.pilihan[Number(b.dataset.idx)] === it.jawaban) b.classList.add('correct');
  });
  if (benar) quiz.skor++;
  else btns[idx].classList.add('wrong');

  const fb = $('#qfb');
  fb.className = 'feedback show ' + (benar ? 'ok' : 'bad');
  fb.innerHTML = `<strong>${benar ? 'Benar! 🎉' : 'Belum tepat 🤔'}</strong> ${benar ? '' : `Jawaban yang benar: <b>${esc(it.jawaban)}</b>. `}${esc(it.penjelasan)}`;
  $('#qnext').classList.remove('hidden');
  $('#qnext').focus();
}

function nextQ() {
  if (!quiz || !quiz.locked) return;
  quiz.i++;
  if (quiz.i < quiz.items.length) return renderQ();
  finishQuiz();
}

async function finishQuiz() {
  const u = currentUser();
  const k = quiz.bagian, total = quiz.items.length, skor = quiz.skor;
  quiz = null;
  try {
    const res = await apiPost('result', { bagian: k, skor, total });
    if (!res.ok) throw new Error(res.error);
  } catch (err) {
    toast('Hasil belum tersimpan ke server. Coba lagi nanti.', 'bad');
  }
  if (u.hasil[k]) u.sebelum[k] = u.hasil[k];
  u.hasil[k] = { skor, total };
  renderHasil(k, skor, total);
  if (skor / total >= 0.7) confetti();
  toast(`${BAGIAN[k].nama} selesai: ${skor}/${total}`, 'ok');
}

function renderHasil(k, skor, total) {
  const p = Math.round(skor / total * 100);
  const msg = p >= 80 ? 'Luar biasa! Kamu sudah cukup kuat di bagian ini.'
            : p >= 50 ? 'Bagus, sedikit lagi. Pelajari modul yang disarankan.'
            : 'Tidak apa-apa. Ulangi materinya lalu coba lagi.';
  $('#soalContent').innerHTML = `
    <div class="result">
      <div class="ring-wrap">${ringSvg()}<div class="ring-text"><span data-to="${p}">0</span><span>%</span></div></div>
      <h3>${BAGIAN[k].nama}: ${skor}/${total}</h3>
      <p class="note">${msg}</p>
      <div class="result-actions">
        <button class="btn primary" data-go="skor">🏆 Lihat papan skor</button>
        <button class="btn ghost" data-again="${k}">Ulangi</button>
        <button class="btn ghost" data-go="soal">Pilih bagian lain</button>
      </div>
    </div>`;
  const box = $('#soalContent');
  animateRing(box, p);
  runCounts(box);
}

// ----- 4. Papan skor, analisa, modul, pasangan -----
function renderSkor(u) {
  const box = $('#skorContent');
  if (!adaHasil(u)) {
    box.innerHTML = `
      <div class="empty">
        <div class="big">📭</div>
        <h3>Belum ada skor</h3>
        <p class="note">Kerjakan soal basic English dulu untuk mengisi papan skor.</p>
        <button class="btn primary" data-go="soal" style="margin-top:12px">Mulai soal</button>
      </div>`;
    return;
  }

  const rincian = KEYS.map(k => {
    const h = u.hasil[k];
    if (!h) return `<div class="skor-row" data-k="${k}">
        <div class="b-ikon sm">${BAGIAN[k].ikon}</div>
        <div class="grow"><strong>${BAGIAN[k].nama}</strong><p class="note">Belum dikerjakan</p></div>
        <span class="chip">—</span></div>`;
    const p = pct(h);
    const prev = u.sebelum && u.sebelum[k] ? `<p class="note">Sebelumnya ${u.sebelum[k].skor}/${u.sebelum[k].total}</p>` : '';
    return `<div class="skor-row" data-k="${k}">
        <div class="b-ikon sm">${BAGIAN[k].ikon}</div>
        <div class="grow">
          <div class="row-between"><span>${BAGIAN[k].nama}</span><span>${h.skor}/${h.total}</span></div>
          <div class="progress"><span data-w="${p}"></span></div>${prev}
        </div>
        <span class="chip ${p >= 70 ? 'ok' : 'bad'}">${p >= 70 ? 'Kuat' : 'Perlu latihan'}</span>
      </div>`;
  }).join('');

  if (!sudahSemua(u)) {
    box.innerHTML = `<div class="stack">${rincian}</div>
      <p class="lead" style="margin-top:14px">Selesaikan ketiga bagian untuk melihat analisa lengkap dan rekomendasi modul.</p>
      <button class="btn ghost" data-go="soal" style="margin-top:8px">Lanjutkan tes</button>`;
    animateBars(box);
    return;
  }

  const tp = totalPct(u);
  const terlemah = KEYS.slice().sort((a, b) => pct(u.hasil[a]) - pct(u.hasil[b]))[0];
  const perlu = KEYS.filter(k => pct(u.hasil[k]) < BATAS_MODUL);
  const modul = perlu.length
    ? perlu.map(k => `<div class="modul-card" data-k="${k}">
        <div><strong>${MODUL[k].nama}</strong><p class="note">${MODUL[k].desc}</p></div>
        <button class="btn ghost small" disabled>Segera hadir</button></div>`).join('')
    : `<p class="note">Semua bagian sudah cukup baik. Lanjutkan dengan pasangan belajar.</p>`;

  box.innerHTML = `
    <div class="hero-score">
      <div class="ring-wrap">${ringSvg()}<div class="ring-text"><span data-to="${tp}">0</span><span>%</span></div></div>
      <div>
        <p class="eyebrow">Level saat ini</p>
        <div class="level">${levelOf(u)}</div>
        <p>Bagian yang perlu diperkuat: <strong>${BAGIAN[terlemah].nama}</strong></p>
      </div>
    </div>
    <div class="stack">${rincian}</div>
    <h3 class="section-title">Modul yang disarankan</h3>
    <div class="stack">${modul}</div>
    <h3 class="section-title">Pasangan belajar</h3>
    <p class="note">Dicari dari pengguna lain dengan skor per bagian yang paling mirip.</p>
    <button class="btn primary" id="cariPasangan" style="margin-top:8px">🤝 Cari pasangan</button>
    <div id="pasanganBox"></div>`;

  animateRing(box, tp);
  runCounts(box);
  animateBars(box);
}

async function cariPasangan() {
  const box = $('#pasanganBox');
  if (!box) return;
  box.innerHTML = `<p class="note" style="margin-top:12px">Mencari pasangan…</p>`;
  let me;
  try {
    await loadAll();
    await loadFriends();
    me = currentUser();
  } catch (err) {
    box.innerHTML = `<p class="note" style="margin-top:12px">Gagal terhubung ke server. Coba lagi.</p>`;
    return;
  }
  if (!me || !sudahSemua(me)) { box.innerHTML = ''; toast('Selesaikan ketiga bagian dulu', 'bad'); return; }

  const tombol = `<div class="meet-row">
      <a class="btn meet" href="${MEET}" target="_blank" rel="noopener">Google Meet ↗</a>
      <a class="btn zoom" href="${ZOOM}" target="_blank" rel="noopener">Zoom ↗</a></div>`;

  const kandidat = Object.values(db)
    .filter(x => x.id !== me.id && x.bio && sudahSemua(x))
    .map(x => ({ user: x, jarak: jarakSkor(me, x) }))
    .sort((a, b) => a.jarak - b.jarak)
    .slice(0, 3);

  if (!kandidat.length) {
    box.innerHTML = `<div class="pair-card"><div class="grow"><p class="note">Belum ada pengguna lain yang sudah menyelesaikan ketiga bagian. Coba lagi nanti, atau ajak teman langsung lewat Meet atau Zoom.</p></div></div>${tombol}`;
    return;
  }

  const daftar = kandidat.map(({ user: p, jarak }) => {
    const skorTxt = KEYS.map(k => `${BAGIAN[k].nama.split(' ')[0]} ${pct(p.hasil[k])}%`).join(' · ');
    const badge = jarak === 0
      ? '<span class="chip ok">Skor sama</span>'
      : `<span class="chip">Selisih ${Math.round(jarak / KEYS.length)} poin</span>`;
    const f = friendList.find(x => x.id === p.id);
    let aksi;
    if (!f) aksi = `<button class="btn primary small" data-req="${p.id}">💬 Ajak chat</button>`;
    else if (f.status === 'pending' && f.arah === 'keluar') aksi = '<span class="chip">Menunggu jawaban</span>';
    else if (f.status === 'pending') aksi = `<button class="btn secondary small" data-go="teman">Lihat permintaan</button>`;
    else aksi = `<button class="btn primary small" data-chat="${p.id}">💬 Chat</button>`;
    return `<div class="pair-card">
      <div class="avatar">${initial(p.bio.nama)}</div>
      <div class="grow">
        <div class="row-between"><strong>${esc(p.bio.nama)}</strong>${badge}</div>
        <p class="note">${esc(p.bio.sekolah)} · level ${levelOf(p)}</p>
        <p class="note">${skorTxt}</p>
        <div style="margin-top:8px">${aksi}</div>
      </div>
    </div>`;
  }).join('');

  box.innerHTML = `<p class="note" style="margin-top:12px">Pasangan terbaik untuk kamu, diurutkan dari skor paling mirip:</p>${daftar}${tombol}`;
}

async function sendRequest(id) {
  const r = await apiPost('friend_request', { ke: id });
  toast(r.ok ? 'Permintaan chat terkirim 💬' : (r.error || 'Gagal mengirim permintaan'), r.ok ? 'ok' : 'bad');
  if (r.ok) { if (currentTab === 'teman') renderTeman(); else cariPasangan(); }
}

// ----- 5. Teman dan chat -----
async function renderTeman() {
  const box = $('#temanContent');
  box.innerHTML = `<p class="note">Memuat teman…</p>`;
  try {
    await loadFriends();
    await loadAll();
  } catch (err) {
    box.innerHTML = `<p class="note">Gagal memuat teman. ${esc(err.message)}</p>`;
    return;
  }
  const masuk = friendList.filter(f => f.status === 'pending' && f.arah === 'masuk');
  const teman = friendList.filter(f => f.status === 'accepted');
  const keluar = friendList.filter(f => f.status === 'pending' && f.arah === 'keluar');

  const saya = currentUser();
  const lainnya = Object.values(db).filter(x => saya && x.id !== saya.id && x.bio);
  const cariHtml = lainnya.length ? lainnya.map(p => {
    const f = friendList.find(x => x.id === p.id);
    let aksi;
    if (!f) aksi = `<button class="btn primary small" data-req="${p.id}">💬 Ajak chat</button>`;
    else if (f.status === 'pending' && f.arah === 'keluar') aksi = '<span class="chip">Menunggu jawaban</span>';
    else if (f.status === 'pending') aksi = '<span class="chip">Ada permintaan masuk di atas</span>';
    else aksi = `<button class="btn primary small" data-chat="${p.id}">💬 Chat</button>`;
    return `<div class="pair-card">
      <div class="avatar">${initial(p.bio.nama)}</div>
      <div class="grow"><strong>${esc(p.bio.nama)}</strong><p class="note">${esc(p.bio.sekolah)}</p></div>
      ${aksi}
    </div>`;
  }).join('') : '<p class="note">Belum ada pengguna lain. Ajak teman kamu untuk daftar.</p>';

  box.innerHTML = `
    <h3 class="section-title">Tambah teman</h3>
    <div class="stack">${cariHtml}</div>

    <h3 class="section-title">Permintaan masuk</h3>
    <div class="stack">${masuk.length ? masuk.map(f => `
      <div class="pair-card">
        <div class="avatar">${initial(f.nama)}</div>
        <div class="grow"><strong>${esc(f.nama)}</strong><p class="note">${esc(f.sekolah)}</p></div>
        <button class="btn primary small" data-respond="${f.id}" data-terima="1">Terima</button>
        <button class="btn ghost small" data-respond="${f.id}" data-terima="0">Tolak</button>
      </div>`).join('') : '<p class="note">Belum ada permintaan masuk.</p>'}</div>

    <h3 class="section-title">Teman</h3>
    <div class="stack">${teman.length ? teman.map(f => `
      <div class="pair-card">
        <div class="avatar">${initial(f.nama)}</div>
        <div class="grow"><strong>${esc(f.nama)}</strong><p class="note">${esc(f.sekolah)}</p></div>
        <button class="btn primary small" data-chat="${f.id}">💬 Chat</button>
      </div>`).join('') : '<p class="note">Belum punya teman. Cari pasangan di Papan Skor, lalu tekan Ajak chat.</p>'}</div>

    ${keluar.length ? `<h3 class="section-title">Menunggu jawaban</h3><div class="stack">${keluar.map(f => `<p class="note">• ${esc(f.nama)}</p>`).join('')}</div>` : ''}

    <div id="chatPanel" class="chat hidden"></div>`;

  if (chatWith) openChat(chatWith);
}

function openChat(id) {
  const f = friendList.find(x => x.id === id && x.status === 'accepted');
  if (!f) { toast('Hanya bisa chat dengan teman', 'bad'); return; }
  chatWith = id;
  clearInterval(chatTimer);
  const p = $('#chatPanel');
  p.classList.remove('hidden');
  p.innerHTML = `
    <div class="chat-head">
      <div class="avatar">${initial(f.nama)}</div>
      <div class="grow"><strong>${esc(f.nama)}</strong><p class="note">${esc(f.sekolah)}</p></div>
      <button class="btn ghost small" id="closeChat">Tutup</button>
    </div>
    <div class="chat-log" id="chatLog"><p class="note">Memuat pesan…</p></div>
    <form id="chatForm" class="chat-form">
      <input id="chatInput" maxlength="500" placeholder="Tulis pesan…" autocomplete="off" required>
      <button class="btn primary small" type="submit">Kirim</button>
    </form>`;
  loadMessages(true);
  chatTimer = setInterval(() => loadMessages(false), 3000);
  p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function loadMessages(first) {
  if (!chatWith) return;
  const log = $('#chatLog');
  if (!log) return;
  try {
    const r = await apiPost('messages', { dengan: chatWith });
    if (!r.ok) return;
    const dekatBawah = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
    log.innerHTML = r.messages.length
      ? r.messages.map(m => `<div class="bubble ${m.arah === 'saya' ? 'me' : 'them'}">${esc(m.isi)}</div>`).join('')
      : '<p class="note">Belum ada pesan. Sapa dulu!</p>';
    if (first || dekatBawah) log.scrollTop = log.scrollHeight;
  } catch (err) { /* jaringan gagal: coba lagi di putaran berikutnya */ }
}

async function respond(id, terima) {
  const r = await apiPost('friend_respond', { dari: id, terima });
  if (!r.ok) return toast(r.error || 'Gagal', 'bad');
  if (terima) { toast('Kalian sekarang berteman 🎉', 'ok'); confetti(); }
  else toast('Permintaan ditolak', 'info');
  renderTeman();
}

// ----- Klik global (event delegation) -----
document.addEventListener('click', e => {
  const t = e.target;
  const tab = t.closest('.tab');            if (tab) return showTab(tab.dataset.tab);
  const go = t.closest('[data-go]');        if (go) return showTab(go.dataset.go);
  const st = t.closest('[data-start]');     if (st) return startQuiz(st.dataset.start);
  const again = t.closest('[data-again]');  if (again) return startQuiz(again.dataset.again);
  if (t.closest('#quitQuiz')) { quiz = null; return renderSoal(currentUser()); }
  if (t.closest('#qnext')) return nextQ();
  const opt = t.closest('.opt');            if (opt && quiz) return answer(Number(opt.dataset.idx));
  if (t.closest('#cariPasangan')) return cariPasangan();
  const req = t.closest('[data-req]');      if (req) return sendRequest(req.dataset.req);
  const ch = t.closest('[data-chat]');      if (ch) { chatWith = ch.dataset.chat; return showTab('teman'); }
  const rs = t.closest('[data-respond]');   if (rs) return respond(rs.dataset.respond, rs.dataset.terima === '1');
  if (t.closest('#closeChat')) {
    chatWith = null; clearInterval(chatTimer);
    const p = $('#chatPanel'); if (p) p.classList.add('hidden');
    return;
  }
  if (t.closest('#editBioBtn')) return openBioForm(currentUser());
  if (t.closest('#bioCancel')) return route();
  if (t.closest('#logoutBtn')) {
    clearAuth(); db = {}; friendList = []; quiz = null; chatWith = null; clearInterval(chatTimer);
    route();
    toast('Kamu sudah keluar', 'info');
  }
});

// Kirim pesan
document.addEventListener('submit', async e => {
  if (e.target.id !== 'chatForm') return;
  e.preventDefault();
  const input = $('#chatInput');
  const isi = input.value.trim();
  if (!isi || !chatWith) return;
  input.value = '';
  const r = await apiPost('message_send', { ke: chatWith, isi });
  if (!r.ok) toast(r.error || 'Pesan gagal dikirim', 'bad');
  loadMessages(false);
});

// ----- Pintasan keyboard saat kuis -----
document.addEventListener('keydown', e => {
  if (!quiz || e.target.matches('input, textarea')) return;
  if (/^[1-4]$/.test(e.key) && !quiz.locked) answer(Number(e.key) - 1);
  else if (e.key === 'Enter' && quiz.locked && e.target.tagName !== 'BUTTON') nextQ();
});

// ----- Mulai aplikasi -----
async function init() {
  setTheme(load('pronountalk_theme') || 'merah');
  $$('[data-set-theme]').forEach(b => b.onclick = () => setTheme(b.dataset.setTheme));

  try {
    const r = await fetch('data/questions.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    questions = await r.json();
    if (!Array.isArray(questions) || !questions.length) throw new Error('file soal kosong');
  } catch (err) {
    showScreen('authScreen');
    $('#authMsg').textContent = 'Soal gagal dimuat (' + err.message + '). Pastikan file ada di data/questions.json.';
    return;
  }

  const id = getSession();
  if (id && getToken()) {
    try { await loadAll(); }
    catch (err) { toast('Gagal terhubung ke server', 'bad'); }
    if (!db[id]) clearAuth();
  }
  route();
}
init();
