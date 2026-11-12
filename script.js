// ===== PronounTalk: login -> biodata -> dashboard (tes, skor, modul, pasangan, teman, chat) =====
// Data akun, hasil, pertemanan, dan pesan disimpan di Google Sheet lewat Apps Script.

const API = 'https://script.google.com/macros/s/AKfycbwVrViS20z02_tCijo7u_M7TwY4I9ZLiM18yqifb7NTaXPGB0NEs6uZHYRNMMiFS5nxUw/exec';

// ----- Teks antarmuka (Indonesia & English) -----
const S = {
  id: {
    brandSub: 'Latihan pronoun, selangkah demi selangkah',
    logout: 'Keluar',
    pill: 'Basic English · Pronoun',
    heroTitle: 'Belajar pronoun jadi lebih mudah',
    heroDesc: 'Kerjakan tes singkat, lihat bagian yang masih lemah, lalu latihan bersama teman.',
    perk1: '30 soal dalam 3 bagian',
    perk2: 'Penjelasan dalam Bahasa Indonesia dan English',
    perk3: 'Papan skor dan pasangan belajar',
    tabLogin: 'Masuk', tabRegister: 'Daftar',
    lblEmail: 'Email', lblPass: 'Kata sandi', lblPassNew: 'Kata sandi (min. 6 karakter)',
    btnLogin: 'Masuk', btnRegister: 'Buat akun',
    stepLogin: '✓ Login', stepBio: '2 Biodata', stepTest: '3 Tes',
    bioNew: 'Isi biodata', bioEdit: 'Ubah biodata',
    bioNote: 'Data ini dipakai untuk papan skor dan pasangan belajar.',
    lblNama: 'Nama lengkap', lblSekolah: 'Asal sekolah / kampus', lblUmur: 'Umur',
    phNama: 'Contoh: Rara Putri', phSekolah: 'Contoh: SMA Negeri 1', phUmur: 'Contoh: 19',
    bioSave: 'Simpan & lanjut →', bioCancel: 'Batal',
    tabBio: 'Biodata', tabSkor: 'Papan Skor', tabSoal: 'Soal Basic English', tabTeman: 'Teman',
    panelBio: 'Biodata', panelSkor: 'Papan Skor', panelSoal: 'Soal Basic English', panelTeman: 'Teman & Chat',
    editBio: '✏️ Ubah biodata',
    welcomeBack: 'Selamat datang kembali 👋',
    accountCreated: 'Akun dibuat. Yuk isi biodata!',
    loginFail: 'Email atau kata sandi salah.',
    registerFail: 'Gagal membuat akun.',
    networkFail: 'Gagal terhubung ke server. Coba lagi.',
    sessionEnded: 'Sesi berakhir, silakan masuk lagi',
    noSession: 'Server belum memberi sesi. Pastikan Apps Script sudah deploy New version.',
    bioSaved: 'Biodata tersimpan ✨',
    bioFail: 'Gagal menyimpan biodata',
    soalEmpty: 'Soal belum berhasil dimuat.',
    soalLoadFail: 'Soal gagal dimuat ({err}). Pastikan file ada di data/questions.json.',
    soalNone: 'Soal untuk bagian ini belum tersedia',
    soalIntro: 'Tes diagnosis terdiri dari 3 bagian, masing-masing 10 soal. Kerjakan ketiganya untuk melihat analisa lengkap.',
    btnStart: 'Mulai', btnRetry: 'Ulangi',
    notDone: 'Belum dikerjakan',
    quitQuiz: '← Kembali',
    tips: 'Tips: tekan 1–4 untuk memilih, Enter untuk lanjut',
    btnNext: 'Lanjut →', btnFinish: 'Lihat hasil 🎉',
    qProgress: '{bagian} · {i}/{n}',
    correct: 'Benar! 🎉', wrongMsg: 'Belum tepat 🤔',
    answerWas: 'Jawaban yang benar: ',
    savedFail: 'Hasil belum tersimpan ke server. Coba lagi nanti.',
    partDone: '{bagian} selesai: {skor}/{total}',
    resHigh: 'Luar biasa! Kamu sudah cukup kuat di bagian ini.',
    resMid: 'Bagus, sedikit lagi. Pelajari modul yang disarankan.',
    resLow: 'Tidak apa-apa. Ulangi materinya lalu coba lagi.',
    resView: '🏆 Lihat papan skor', resOther: 'Pilih bagian lain',
    noScoreTitle: 'Belum ada skor',
    noScoreDesc: 'Kerjakan soal basic English dulu untuk mengisi papan skor.',
    btnStartQuiz: 'Mulai soal',
    strong: 'Kuat', needPractice: 'Perlu latihan',
    prevScore: 'Sebelumnya {skor}/{total}',
    completeAll: 'Selesaikan ketiga bagian untuk melihat analisa lengkap dan rekomendasi modul.',
    continueTest: 'Lanjutkan tes',
    levelNow: 'Level saat ini', levelNotYet: 'Belum dites',
    weakest: 'Bagian yang perlu diperkuat: {bagian}',
    modulTitle: 'Modul yang disarankan', modulSoon: 'Segera hadir',
    modulAllGood: 'Semua bagian sudah cukup baik. Lanjutkan dengan pasangan belajar.',
    pairTitle: 'Pasangan belajar',
    pairNote: 'Dicari dari pengguna lain dengan skor per bagian yang paling mirip.',
    btnFindPartner: '🤝 Cari pasangan',
    searching: 'Mencari pasangan…',
    needFirst: 'Selesaikan ketiga bagian dulu',
    noOneYet: 'Belum ada pengguna lain yang sudah menyelesaikan ketiga bagian. Coba lagi nanti, atau ajak teman langsung lewat Meet atau Zoom.',
    bestPartners: 'Pasangan terbaik untuk kamu, diurutkan dari skor paling mirip:',
    sameScore: 'Skor sama', diff: 'Selisih {n} poin',
    btnAddChat: '💬 Ajak chat', waiting: 'Menunggu jawaban',
    viewRequests: 'Lihat permintaan', btnChat: '💬 Chat',
    reqSent: 'Permintaan chat terkirim 💬', reqFail: 'Gagal mengirim permintaan',
    friendsLoading: 'Memuat teman…', friendsFail: 'Gagal memuat teman.',
    addFriend: 'Tambah teman',
    noOthers: 'Belum ada pengguna lain. Ajak teman kamu untuk daftar.',
    pendingAbove: 'Ada permintaan masuk di atas',
    inbound: 'Permintaan masuk', noInbound: 'Belum ada permintaan masuk.',
    btnAccept: 'Terima', btnReject: 'Tolak',
    friendsTitle: 'Teman',
    noFriends: 'Belum punya teman. Cari pasangan di Papan Skor, lalu tekan Ajak chat.',
    waitingTitle: 'Menunggu jawaban',
    nowFriends: 'Kalian sekarang berteman 🎉', rejected: 'Permintaan ditolak',
    onlyFriends: 'Hanya bisa chat dengan teman',
    loadingMsgs: 'Memuat pesan…', typeMsg: 'Tulis pesan…', send: 'Kirim', close: 'Tutup',
    noMsgs: 'Belum ada pesan. Sapa dulu!',
    loggedOut: 'Kamu sudah keluar',
    yearsUnit: 'tahun', school: 'Sekolah / kampus', age: 'Umur', levelLbl: 'Level',
    userSub: 'Pengguna PronounTalk', levelWord: 'level',
    selisihLabel: 'poin',
    lvlSame: 'Skor sama'
  },
  en: {
    brandSub: 'Pronoun practice, one step at a time',
    logout: 'Log out',
    pill: 'Basic English · Pronoun',
    heroTitle: 'Learning pronouns made easier',
    heroDesc: 'Take a short test, see which parts are weak, then practice with friends.',
    perk1: '30 questions in 3 parts',
    perk2: 'Explanations in Indonesian and English',
    perk3: 'Score board and study partners',
    tabLogin: 'Log in', tabRegister: 'Sign up',
    lblEmail: 'Email', lblPass: 'Password', lblPassNew: 'Password (min. 6 characters)',
    btnLogin: 'Log in', btnRegister: 'Create account',
    stepLogin: '✓ Log in', stepBio: '2 Profile', stepTest: '3 Test',
    bioNew: 'Fill in your profile', bioEdit: 'Edit profile',
    bioNote: 'This data is used for the score board and study partners.',
    lblNama: 'Full name', lblSekolah: 'School / campus', lblUmur: 'Age',
    phNama: 'e.g. Rara Putri', phSekolah: 'e.g. Riverside High School', phUmur: 'e.g. 19',
    bioSave: 'Save & continue →', bioCancel: 'Cancel',
    tabBio: 'Profile', tabSkor: 'Scoreboard', tabSoal: 'Basic English Quiz', tabTeman: 'Friends',
    panelBio: 'Profile', panelSkor: 'Scoreboard', panelSoal: 'Basic English Quiz', panelTeman: 'Friends & Chat',
    editBio: '✏️ Edit profile',
    welcomeBack: 'Welcome back 👋',
    accountCreated: "Account created. Let's fill in your profile!",
    loginFail: 'Wrong email or password.',
    registerFail: 'Could not create the account.',
    networkFail: 'Could not reach the server. Try again.',
    sessionEnded: 'Session expired, please log in again',
    noSession: 'The server did not return a session. Make sure Apps Script is deployed as a New version.',
    bioSaved: 'Profile saved ✨',
    bioFail: 'Could not save profile',
    soalEmpty: 'Questions could not be loaded.',
    soalLoadFail: 'Questions failed to load ({err}). Make sure the file is at data/questions.json.',
    soalNone: 'Questions for this part are not available yet',
    soalIntro: 'The diagnostic test has 3 parts, 10 questions each. Complete all three to see your full analysis.',
    btnStart: 'Start', btnRetry: 'Retry',
    notDone: 'Not done yet',
    quitQuiz: '← Back',
    tips: 'Tip: press 1–4 to choose, Enter to continue',
    btnNext: 'Next →', btnFinish: 'See results 🎉',
    qProgress: '{bagian} · {i}/{n}',
    correct: 'Correct! 🎉', wrongMsg: 'Not quite 🤔',
    answerWas: 'The correct answer: ',
    savedFail: 'Result not saved to the server yet. Try again later.',
    partDone: '{bagian} done: {skor}/{total}',
    resHigh: "Amazing! You're already strong in this part.",
    resMid: 'Good, almost there. Study the suggested module.',
    resLow: "That's okay. Review the material and try again.",
    resView: '🏆 View scoreboard', resOther: 'Choose another part',
    noScoreTitle: 'No scores yet',
    noScoreDesc: 'Take the basic English quiz first to fill the scoreboard.',
    btnStartQuiz: 'Start the quiz',
    strong: 'Strong', needPractice: 'Needs practice',
    prevScore: 'Previously {skor}/{total}',
    completeAll: 'Complete all three parts to see the full analysis and module recommendations.',
    continueTest: 'Continue the test',
    levelNow: 'Current level', levelNotYet: 'Not tested yet',
    weakest: 'Part to strengthen: {bagian}',
    modulTitle: 'Recommended modules', modulSoon: 'Coming soon',
    modulAllGood: 'All parts look good. Keep going with study partners.',
    pairTitle: 'Study partners',
    pairNote: 'Matched with other users whose part scores are closest to yours.',
    btnFindPartner: '🤝 Find partners',
    searching: 'Searching for partners…',
    needFirst: 'Finish all three parts first',
    noOneYet: 'No other users have finished all three parts yet. Try again later, or invite a friend directly via Meet or Zoom.',
    bestPartners: 'Best partners for you, sorted by most similar score:',
    sameScore: 'Same score', diff: '{n} points apart',
    btnAddChat: '💬 Invite to chat', waiting: 'Waiting for reply',
    viewRequests: 'View requests', btnChat: '💬 Chat',
    reqSent: 'Chat request sent 💬', reqFail: 'Could not send the request',
    friendsLoading: 'Loading friends…', friendsFail: 'Could not load friends.',
    addFriend: 'Add friends',
    noOthers: 'No other users yet. Invite a friend to sign up.',
    pendingAbove: 'Incoming request above',
    inbound: 'Incoming requests', noInbound: 'No incoming requests.',
    btnAccept: 'Accept', btnReject: 'Decline',
    friendsTitle: 'Friends',
    noFriends: 'No friends yet. Find partners on the Scoreboard and press Invite to chat.',
    waitingTitle: 'Waiting for reply',
    nowFriends: "You're now friends 🎉", rejected: 'Request declined',
    onlyFriends: 'You can only chat with friends',
    loadingMsgs: 'Loading messages…', typeMsg: 'Type a message…', send: 'Send', close: 'Close',
    noMsgs: 'No messages yet. Say hi!',
    loggedOut: 'You have logged out',
    yearsUnit: 'years', school: 'School / campus', age: 'Age', levelLbl: 'Level',
    userSub: 'PronounTalk user', levelWord: 'level',
    selisihLabel: 'points',
    lvlSame: 'Same score'
  }
};

let lang = 'id';
function T(k, v = {}) {
  let s = (S[lang] && S[lang][k] !== undefined) ? S[lang][k] : (S.id[k] !== undefined ? S.id[k] : k);
  for (const x in v) s = s.split('{' + x + '}').join(v[x]);
  return s;
}

// ----- Data bagian, modul, dan label singkat -----
const BAGIAN = {
  kosakata:    { nama: { id: 'Kosakata Dasar', en: 'Basic Vocabulary' }, ikon: '📚', desc: { id: 'Kata-kata dasar yang sering dipakai sehari-hari', en: 'Everyday basic words' } },
  kelas_kata:  { nama: { id: 'Kelas Kata Dasar', en: 'Basic Word Classes' }, ikon: '🧩', desc: { id: 'Noun, verb, adjective, adverb, dan pronoun', en: 'Nouns, verbs, adjectives, adverbs, and pronouns' } },
  tata_bahasa: { nama: { id: 'Tata Bahasa Dasar', en: 'Basic Grammar' }, ikon: '✏️', desc: { id: 'Pola kalimat dan pemakaian pronoun dalam kalimat', en: 'Sentence patterns and pronoun use in sentences' } }
};
const SHORT = {
  kosakata:    { id: 'Kosakata', en: 'Vocabulary' },
  kelas_kata:  { id: 'Kelas Kata', en: 'Word Classes' },
  tata_bahasa: { id: 'Tata Bahasa', en: 'Grammar' }
};
const MODUL = {
  kosakata:    { nama: { id: 'Modul Kosakata Dasar', en: 'Basic Vocabulary Module' }, desc: { id: 'Kata benda, lawan kata, dan tempat sehari-hari', en: 'Nouns, opposites, and everyday places' } },
  kelas_kata:  { nama: { id: 'Modul Kelas Kata Dasar', en: 'Basic Word Classes Module' }, desc: { id: 'Mengenali noun, verb, adjective, dan adverb', en: 'Recognizing nouns, verbs, adjectives, and adverbs' } },
  tata_bahasa: { nama: { id: 'Modul Tata Bahasa Dasar', en: 'Basic Grammar Module' }, desc: { id: 'Pronoun objek, possessive, dan present simple', en: 'Object pronouns, possessives, and present simple' } }
};
const KEYS = Object.keys(BAGIAN);
const MEET = 'https://meet.google.com/new';
const ZOOM = 'https://zoom.us/start/videomeeting';
const BATAS_MODUL = 70;
const RING_C = 2 * Math.PI * 52;

const pick = o => (o && (o[lang] || o.id)) || '';
const namaBagian = k => pick(BAGIAN[k].nama);
const shortBagian = k => pick(SHORT[k]);
const qExpl = it => (lang === 'en' && it.penjelasan_en) ? it.penjelasan_en : it.penjelasan;

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initial = s => esc((s || '?').trim().charAt(0).toUpperCase() || '?');

let db = {};            // { id: { id, bio, hasil, sebelum } }
let friendList = [];
let questions = [];
let currentTab = 'biodata';
let quiz = null;        // { bagian, items, i, skor, locked, last }
let chatWith = null;
let chatTimer = null;

// ----- Penyimpanan lokal (token dan id sesi saja) -----
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
    toast(T('sessionEnded'), 'bad');
    setTimeout(route, 0);
  }
  return res;
}

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

// ----- Bahasa -----
function applyStatic() {
  document.documentElement.lang = lang;
  $$('[data-i18n]').forEach(el => { el.textContent = T(el.dataset.i18n); });
  $$('[data-i18n-ph]').forEach(el => { el.placeholder = T(el.dataset.i18nPh); });
  $$('[data-set-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setLang === lang)));
}
function setLang(l) {
  lang = l;
  store('pronountalk_lang', l);
  applyStatic();
  if (quiz) return drawQuiz();
  if (!$('#bioScreen').classList.contains('hidden')) {
    const u = currentUser();
    $('#bioTitle').textContent = T(u && u.bio ? 'bioEdit' : 'bioNew');
    return;
  }
  route();
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
    if (!res.ok) { $('#authMsg').textContent = res.error || T('loginFail'); return; }
    if (!res.id || !res.token) { $('#authMsg').textContent = T('noSession'); return; }
    setAuth(res.token, res.id);
    await loadAll();
    toast(T('welcomeBack'), 'ok');
    route();
  } catch (err) {
    $('#authMsg').textContent = T('networkFail');
  } finally { setBusy(e.target, false); }
};

$('#registerForm').onsubmit = async e => {
  e.preventDefault();
  const f = new FormData(e.target);
  $('#authMsg').textContent = '';
  setBusy(e.target, true);
  try {
    const res = await apiPost('register', { email: String(f.get('email')).trim(), password: String(f.get('password')) });
    if (!res.ok) { $('#authMsg').textContent = res.error || T('registerFail'); return; }
    if (!res.id || !res.token) { $('#authMsg').textContent = T('noSession'); return; }
    setAuth(res.token, res.id);
    await loadAll();
    toast(T('accountCreated'), 'ok');
    route();
  } catch (err) {
    $('#authMsg').textContent = T('networkFail');
  } finally { setBusy(e.target, false); }
};

// ----- 2. Biodata -----
function openBioForm(u) {
  const f = $('#bioForm');
  f.nama.value = u.bio ? u.bio.nama : '';
  f.sekolah.value = u.bio ? u.bio.sekolah : '';
  f.umur.value = u.bio ? u.bio.umur : '';
  $('#bioCancel').classList.toggle('hidden', !u.bio);
  $('#bioTitle').textContent = T(u.bio ? 'bioEdit' : 'bioNew');
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
    if (!res.ok) return toast(res.error || T('bioFail'), 'bad');
    u.bio = bio;
    currentTab = 'biodata';
    toast(T('bioSaved'), 'ok');
    route();
  } catch (err) {
    toast(T('networkFail'), 'bad');
  } finally { setBusy(e.target, false); }
};

function renderBio(u) {
  const b = u.bio;
  const lv = sudahSemua(u) ? levelOf(u) : T('levelNotYet');
  $('#bioView').innerHTML = `
    <div class="profile">
      <div class="avatar big">${initial(b.nama)}</div>
      <div><h3>${esc(b.nama)}</h3><p class="note">${T('userSub')}</p></div>
    </div>
    <div class="tiles">
      <div class="tile"><span>${T('school')}</span><strong>${esc(b.sekolah)}</strong></div>
      <div class="tile"><span>${T('age')}</span><strong>${esc(b.umur)} ${T('yearsUnit')}</strong></div>
      <div class="tile"><span>${T('levelLbl')}</span><strong>${lv}</strong></div>
    </div>`;
}

// ----- 3a. Menu soal -----
function renderSoal(u) {
  if (!questions.length) {
    $('#soalContent').innerHTML = `<div class="empty"><div class="big">⚠️</div><p>${T('soalEmpty')}</p></div>`;
    return;
  }
  const cards = KEYS.map((k, i) => {
    const h = u.hasil[k];
    const status = h ? `<span class="chip ${pct(h) >= 70 ? 'ok' : 'bad'}">${h.skor}/${h.total}</span>` : `<span class="chip">${T('notDone')}</span>`;
    return `<div class="bagian-card" data-k="${k}" style="--d:${i * 0.08}s">
      <div class="b-ikon">${BAGIAN[k].ikon}</div>
      <h3 style="margin-top:12px">${namaBagian(k)}</h3>
      <p class="note">${pick(BAGIAN[k].desc)}</p>
      <div class="b-foot">${status}<button class="btn primary small" data-start="${k}">${h ? T('btnRetry') : T('btnStart')}</button></div>
    </div>`;
  }).join('');
  $('#soalContent').innerHTML = `
    <p class="lead">${T('soalIntro')}</p>
    <div class="bagian-grid">${cards}</div>`;
}

// ----- 3b. Kuis satu bagian -----
function startQuiz(k) {
  const items = questions.filter(q => q.bagian === k);
  if (!items.length) { toast(T('soalNone'), 'bad'); return; }
  quiz = { bagian: k, items, i: 0, skor: 0, locked: false, last: -1 };
  drawQuiz();
}

function drawQuiz() {
  const wasLocked = quiz.locked, last = quiz.last;
  $('#soalContent').innerHTML = `
    <div class="quiz" data-k="${quiz.bagian}">
      <div class="quiz-top">
        <button class="btn ghost small" id="quitQuiz">${T('quitQuiz')}</button>
        <span class="chip" id="qinfo"></span>
      </div>
      <div class="progress lg"><span id="qbar"></span></div>
      <div class="q-card" id="qtext"></div>
      <div class="options" id="qopts"></div>
      <div class="feedback" id="qfb" aria-live="polite"></div>
      <div class="quiz-actions">
        <span class="note">${T('tips')}</span>
        <button class="btn primary hidden" id="qnext"></button>
      </div>
    </div>`;
  renderQ();
  if (wasLocked) markAnswer(last);
}

function renderQ() {
  const it = quiz.items[quiz.i];
  quiz.locked = false;
  $('#qinfo').textContent = T('qProgress', { bagian: namaBagian(quiz.bagian), i: quiz.i + 1, n: quiz.items.length });
  $('#qbar').style.width = (quiz.i / quiz.items.length * 100) + '%';
  $('#qtext').textContent = it.pertanyaan;
  const fb = $('#qfb');
  fb.className = 'feedback';
  fb.textContent = '';
  $('#qnext').classList.add('hidden');
  $('#qnext').textContent = quiz.i < quiz.items.length - 1 ? T('btnNext') : T('btnFinish');
  $('#qopts').innerHTML = it.pilihan.map((p, i) =>
    `<button class="opt" data-idx="${i}" style="animation-delay:${i * 0.05}s"><span class="letter">${'ABCD'[i]}</span><span>${esc(p)}</span></button>`
  ).join('');
}

function markAnswer(idx) {
  const it = quiz.items[quiz.i];
  quiz.locked = true;
  quiz.last = idx;
  const benar = it.pilihan[idx] === it.jawaban;
  const btns = $$('#qopts .opt');
  btns.forEach(b => {
    b.disabled = true;
    if (it.pilihan[Number(b.dataset.idx)] === it.jawaban) b.classList.add('correct');
  });
  if (!benar) btns[idx].classList.add('wrong');
  const fb = $('#qfb');
  fb.className = 'feedback show ' + (benar ? 'ok' : 'bad');
  fb.innerHTML = `<strong>${benar ? T('correct') : T('wrongMsg')}</strong> ${benar ? '' : `${esc(T('answerWas'))}<b>${esc(it.jawaban)}</b>. `}${esc(qExpl(it))}`;
  $('#qnext').classList.remove('hidden');
  $('#qnext').focus();
}

function answer(idx) {
  if (!quiz || quiz.locked) return;
  const it = quiz.items[quiz.i];
  if (it.pilihan[idx] === it.jawaban) quiz.skor++;
  markAnswer(idx);
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
    toast(T('savedFail'), 'bad');
  }
  if (u.hasil[k]) u.sebelum[k] = u.hasil[k];
  u.hasil[k] = { skor, total };
  renderHasil(k, skor, total);
  if (skor / total >= 0.7) confetti();
  toast(T('partDone', { bagian: namaBagian(k), skor, total }), 'ok');
}

function renderHasil(k, skor, total) {
  const p = Math.round(skor / total * 100);
  const msg = p >= 80 ? T('resHigh') : p >= 50 ? T('resMid') : T('resLow');
  $('#soalContent').innerHTML = `
    <div class="result">
      <div class="ring-wrap">${ringSvg()}<div class="ring-text"><span data-to="${p}">0</span><span>%</span></div></div>
      <h3>${namaBagian(k)}: ${skor}/${total}</h3>
      <p class="note">${msg}</p>
      <div class="result-actions">
        <button class="btn primary" data-go="skor">${T('resView')}</button>
        <button class="btn ghost" data-again="${k}">${T('btnRetry')}</button>
        <button class="btn ghost" data-go="soal">${T('resOther')}</button>
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
        <h3>${T('noScoreTitle')}</h3>
        <p class="note">${T('noScoreDesc')}</p>
        <button class="btn primary" data-go="soal" style="margin-top:12px">${T('btnStartQuiz')}</button>
      </div>`;
    return;
  }

  const rincian = KEYS.map(k => {
    const h = u.hasil[k];
    if (!h) return `<div class="skor-row" data-k="${k}">
        <div class="b-ikon sm">${BAGIAN[k].ikon}</div>
        <div class="grow"><strong>${namaBagian(k)}</strong><p class="note">${T('notDone')}</p></div>
        <span class="chip">—</span></div>`;
    const p = pct(h);
    const prev = u.sebelum && u.sebelum[k] ? `<p class="note">${T('prevScore', { skor: u.sebelum[k].skor, total: u.sebelum[k].total })}</p>` : '';
    return `<div class="skor-row" data-k="${k}">
        <div class="b-ikon sm">${BAGIAN[k].ikon}</div>
        <div class="grow">
          <div class="row-between"><span>${namaBagian(k)}</span><span>${h.skor}/${h.total}</span></div>
          <div class="progress"><span data-w="${p}"></span></div>${prev}
        </div>
        <span class="chip ${p >= 70 ? 'ok' : 'bad'}">${p >= 70 ? T('strong') : T('needPractice')}</span>
      </div>`;
  }).join('');

  if (!sudahSemua(u)) {
    box.innerHTML = `<div class="stack">${rincian}</div>
      <p class="lead" style="margin-top:14px">${T('completeAll')}</p>
      <button class="btn ghost" data-go="soal" style="margin-top:8px">${T('continueTest')}</button>`;
    animateBars(box);
    return;
  }

  const tp = totalPct(u);
  const terlemah = KEYS.slice().sort((a, b) => pct(u.hasil[a]) - pct(u.hasil[b]))[0];
  const perlu = KEYS.filter(k => pct(u.hasil[k]) < BATAS_MODUL);
  const modul = perlu.length
    ? perlu.map(k => `<div class="modul-card" data-k="${k}">
        <div><strong>${pick(MODUL[k].nama)}</strong><p class="note">${pick(MODUL[k].desc)}</p></div>
        <button class="btn ghost small" disabled>${T('modulSoon')}</button></div>`).join('')
    : `<p class="note">${T('modulAllGood')}</p>`;

  box.innerHTML = `
    <div class="hero-score">
      <div class="ring-wrap">${ringSvg()}<div class="ring-text"><span data-to="${tp}">0</span><span>%</span></div></div>
      <div>
        <p class="eyebrow">${T('levelNow')}</p>
        <div class="level">${levelOf(u)}</div>
        <p>${T('weakest', { bagian: namaBagian(terlemah) })}</p>
      </div>
    </div>
    <div class="stack">${rincian}</div>
    <h3 class="section-title">${T('modulTitle')}</h3>
    <div class="stack">${modul}</div>
    <h3 class="section-title">${T('pairTitle')}</h3>
    <p class="note">${T('pairNote')}</p>
    <button class="btn primary" id="cariPasangan" style="margin-top:8px">${T('btnFindPartner')}</button>
    <div id="pasanganBox"></div>`;

  animateRing(box, tp);
  runCounts(box);
  animateBars(box);
}

async function cariPasangan() {
  const box = $('#pasanganBox');
  if (!box) return;
  box.innerHTML = `<p class="note" style="margin-top:12px">${T('searching')}</p>`;
  let me;
  try {
    await loadAll();
    await loadFriends();
    me = currentUser();
  } catch (err) {
    box.innerHTML = `<p class="note" style="margin-top:12px">${T('networkFail')}</p>`;
    return;
  }
  if (!me || !sudahSemua(me)) { box.innerHTML = ''; toast(T('needFirst'), 'bad'); return; }

  const tombol = `<div class="meet-row">
      <a class="btn meet" href="${MEET}" target="_blank" rel="noopener">Google Meet ↗</a>
      <a class="btn zoom" href="${ZOOM}" target="_blank" rel="noopener">Zoom ↗</a></div>`;

  const kandidat = Object.values(db)
    .filter(x => x.id !== me.id && x.bio && sudahSemua(x))
    .map(x => ({ user: x, jarak: jarakSkor(me, x) }))
    .sort((a, b) => a.jarak - b.jarak)
    .slice(0, 3);

  if (!kandidat.length) {
    box.innerHTML = `<div class="pair-card"><div class="grow"><p class="note">${T('noOneYet')}</p></div></div>${tombol}`;
    return;
  }

  const daftar = kandidat.map(({ user: p, jarak }) => {
    const skorTxt = KEYS.map(k => `${shortBagian(k)} ${pct(p.hasil[k])}%`).join(' · ');
    const badge = jarak === 0
      ? `<span class="chip ok">${T('sameScore')}</span>`
      : `<span class="chip">${T('diff', { n: Math.round(jarak / KEYS.length) })}</span>`;
    const f = friendList.find(x => x.id === p.id);
    let aksi;
    if (!f) aksi = `<button class="btn primary small" data-req="${p.id}">${T('btnAddChat')}</button>`;
    else if (f.status === 'pending' && f.arah === 'keluar') aksi = `<span class="chip">${T('waiting')}</span>`;
    else if (f.status === 'pending') aksi = `<button class="btn secondary small" data-go="teman">${T('viewRequests')}</button>`;
    else aksi = `<button class="btn primary small" data-chat="${p.id}">${T('btnChat')}</button>`;
    return `<div class="pair-card">
      <div class="avatar">${initial(p.bio.nama)}</div>
      <div class="grow">
        <div class="row-between"><strong>${esc(p.bio.nama)}</strong>${badge}</div>
        <p class="note">${esc(p.bio.sekolah)} · ${T('levelWord')} ${levelOf(p)}</p>
        <p class="note">${skorTxt}</p>
        <div style="margin-top:8px">${aksi}</div>
      </div>
    </div>`;
  }).join('');

  box.innerHTML = `<p class="note" style="margin-top:12px">${T('bestPartners')}</p>${daftar}${tombol}`;
}

async function sendRequest(id) {
  const r = await apiPost('friend_request', { ke: id });
  toast(r.ok ? T('reqSent') : (r.error || T('reqFail')), r.ok ? 'ok' : 'bad');
  if (r.ok) { if (currentTab === 'teman') renderTeman(); else cariPasangan(); }
}

// ----- 5. Teman dan chat -----
async function renderTeman() {
  const box = $('#temanContent');
  box.innerHTML = `<p class="note">${T('friendsLoading')}</p>`;
  try {
    await loadFriends();
    await loadAll();
  } catch (err) {
    box.innerHTML = `<p class="note">${T('friendsFail')} ${esc(err.message)}</p>`;
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
    if (!f) aksi = `<button class="btn primary small" data-req="${p.id}">${T('btnAddChat')}</button>`;
    else if (f.status === 'pending' && f.arah === 'keluar') aksi = `<span class="chip">${T('waiting')}</span>`;
    else if (f.status === 'pending') aksi = `<span class="chip">${T('pendingAbove')}</span>`;
    else aksi = `<button class="btn primary small" data-chat="${p.id}">${T('btnChat')}</button>`;
    return `<div class="pair-card">
      <div class="avatar">${initial(p.bio.nama)}</div>
      <div class="grow"><strong>${esc(p.bio.nama)}</strong><p class="note">${esc(p.bio.sekolah)}</p></div>
      ${aksi}
    </div>`;
  }).join('') : `<p class="note">${T('noOthers')}</p>`;

  box.innerHTML = `
    <h3 class="section-title">${T('addFriend')}</h3>
    <div class="stack">${cariHtml}</div>

    <h3 class="section-title">${T('inbound')}</h3>
    <div class="stack">${masuk.length ? masuk.map(f => `
      <div class="pair-card">
        <div class="avatar">${initial(f.nama)}</div>
        <div class="grow"><strong>${esc(f.nama)}</strong><p class="note">${esc(f.sekolah)}</p></div>
        <button class="btn primary small" data-respond="${f.id}" data-terima="1">${T('btnAccept')}</button>
        <button class="btn ghost small" data-respond="${f.id}" data-terima="0">${T('btnReject')}</button>
      </div>`).join('') : `<p class="note">${T('noInbound')}</p>`}</div>

    <h3 class="section-title">${T('friendsTitle')}</h3>
    <div class="stack">${teman.length ? teman.map(f => `
      <div class="pair-card">
        <div class="avatar">${initial(f.nama)}</div>
        <div class="grow"><strong>${esc(f.nama)}</strong><p class="note">${esc(f.sekolah)}</p></div>
        <button class="btn primary small" data-chat="${f.id}">${T('btnChat')}</button>
      </div>`).join('') : `<p class="note">${T('noFriends')}</p>`}</div>

    ${keluar.length ? `<h3 class="section-title">${T('waitingTitle')}</h3><div class="stack">${keluar.map(f => `<p class="note">• ${esc(f.nama)}</p>`).join('')}</div>` : ''}

    <div id="chatPanel" class="chat hidden"></div>`;

  if (chatWith) openChat(chatWith);
}

function openChat(id) {
  const f = friendList.find(x => x.id === id && x.status === 'accepted');
  if (!f) { toast(T('onlyFriends'), 'bad'); return; }
  chatWith = id;
  clearInterval(chatTimer);
  const p = $('#chatPanel');
  p.classList.remove('hidden');
  p.innerHTML = `
    <div class="chat-head">
      <div class="avatar">${initial(f.nama)}</div>
      <div class="grow"><strong>${esc(f.nama)}</strong><p class="note">${esc(f.sekolah)}</p></div>
      <button class="btn ghost small" id="closeChat">${T('close')}</button>
    </div>
    <div class="chat-log" id="chatLog"><p class="note">${T('loadingMsgs')}</p></div>
    <form id="chatForm" class="chat-form">
      <input id="chatInput" maxlength="500" placeholder="${esc(T('typeMsg'))}" autocomplete="off" required>
      <button class="btn primary small" type="submit">${T('send')}</button>
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
      : `<p class="note">${T('noMsgs')}</p>`;
    if (first || dekatBawah) log.scrollTop = log.scrollHeight;
  } catch (err) { /* coba lagi di putaran berikutnya */ }
}

async function respond(id, terima) {
  const r = await apiPost('friend_respond', { dari: id, terima });
  if (!r.ok) return toast(r.error || 'Gagal', 'bad');
  if (terima) { toast(T('nowFriends'), 'ok'); confetti(); }
  else toast(T('rejected'), 'info');
  renderTeman();
}

// ----- Klik global (event delegation) -----
document.addEventListener('click', e => {
  const t = e.target;
  const lg = t.closest('[data-set-lang]');  if (lg) return setLang(lg.dataset.setLang);
  const th = t.closest('[data-set-theme]'); if (th) return setTheme(th.dataset.setTheme);
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
    toast(T('loggedOut'), 'info');
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
  lang = load('pronountalk_lang') === 'en' ? 'en' : 'id';
  setTheme(load('pronountalk_theme') || 'merah');
  applyStatic();

  try {
    const r = await fetch('data/questions.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    questions = await r.json();
    if (!Array.isArray(questions) || !questions.length) throw new Error(T('soalEmpty'));
  } catch (err) {
    showScreen('authScreen');
    $('#authMsg').textContent = T('soalLoadFail', { err: err.message });
    return;
  }

  const id = getSession();
  if (id && getToken()) {
    try { await loadAll(); }
    catch (err) { toast(T('networkFail'), 'bad'); }
    if (!db[id]) clearAuth();
  }
  route();
}
init();
