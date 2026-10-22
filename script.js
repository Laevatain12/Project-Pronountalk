// ===== PronounTalk: alur login -> biodata -> tes -> skor -> modul -> pasangan =====

const BAGIAN = {
  kosakata: 'Kosakata Dasar',
  kelas_kata: 'Kelas Kata Dasar',
  tata_bahasa: 'Tata Bahasa Dasar'
};
const MODUL = {
  kosakata: 'Modul Kosakata Dasar',
  kelas_kata: 'Modul Kelas Kata Dasar',
  tata_bahasa: 'Modul Tata Bahasa Dasar'
};
const MEET = 'https://meet.google.com/new';
const ZOOM = 'https://zoom.us/start/videomeeting';
const BATAS_MODUL = 70; // bagian di bawah persen ini disarankan untuk dipelajari

// Catatan: ini prototipe. Data disimpan di browser (localStorage), belum server.
let db = JSON.parse(localStorage.getItem('pronountalk_users') || '{}');
let questions = [];
let currentTab = 'biodata';
let quiz = null;

const $ = sel => document.querySelector(sel);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function save() { localStorage.setItem('pronountalk_users', JSON.stringify(db)); }
function currentUser() {
  const email = localStorage.getItem('pronountalk_session');
  return email && db[email] ? db[email] : null;
}
function pct(h) { return Math.round(h.skor / h.total * 100); }
function totalPct(u) {
  const ks = Object.keys(BAGIAN);
  const skor = ks.reduce((a, k) => a + u.hasil[k].skor, 0);
  const total = ks.reduce((a, k) => a + u.hasil[k].total, 0);
  return Math.round(skor / total * 100);
}
function levelOf(u) {
  const p = totalPct(u);
  return p >= 80 ? 'B1' : p >= 50 ? 'A2' : 'A1';
}
const LEVEL_NUM = { A1: 0, A2: 1, B1: 2 };
const sudahSemua = u => Object.keys(BAGIAN).every(k => u.hasil[k]);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('hidden', s.id !== id));
}
function showTab(name) {
  currentTab = name;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('hidden', p.id !== 'tab-' + name));
  const u = currentUser();
  if (!u) return;
  if (name === 'biodata') renderBio(u);
  if (name === 'skor') renderSkor(u);
  if (name === 'soal') renderSoal(u);
}

// ----- Routing: login -> biodata -> dashboard -----
function route() {
  const u = currentUser();
  $('#logoutBtn').classList.toggle('hidden', !u);
  if (!u) return showScreen('authScreen');
  if (!u.bio) return openBioForm(u);
  showScreen('dashScreen');
  showTab(currentTab);
}

// ----- 1. Login & daftar -----
$('#toggleAuth').onclick = () => {
  const daftar = $('#registerForm').classList.contains('hidden');
  $('#registerForm').classList.toggle('hidden', !daftar);
  $('#loginForm').classList.toggle('hidden', daftar);
  $('#authTitle').textContent = daftar ? 'Daftar' : 'Masuk';
  $('#toggleAuth').textContent = daftar ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar';
  $('#authMsg').textContent = '';
};

$('#loginForm').onsubmit = e => {
  e.preventDefault();
  const email = new FormData(e.target).get('email').trim().toLowerCase();
  const pass = new FormData(e.target).get('password');
  const u = db[email];
  if (!u || u.password !== pass) return $('#authMsg').textContent = 'Email atau kata sandi salah.';
  localStorage.setItem('pronountalk_session', email);
  route();
};

$('#registerForm').onsubmit = e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const email = f.get('email').trim().toLowerCase();
  if (db[email]) return $('#authMsg').textContent = 'Email ini sudah terdaftar. Silakan masuk.';
  db[email] = { email, password: f.get('password'), bio: null, hasil: {}, sebelum: {} };
  save();
  localStorage.setItem('pronountalk_session', email);
  route();
};

$('#logoutBtn').onclick = () => {
  localStorage.removeItem('pronountalk_session');
  route();
};

// ----- 2. Biodata -----
function openBioForm(u) {
  const form = $('#bioForm');
  form.nama.value = u.bio ? u.bio.nama : '';
  form.sekolah.value = u.bio ? u.bio.sekolah : '';
  form.umur.value = u.bio ? u.bio.umur : '';
  showScreen('bioScreen');
}

$('#bioForm').onsubmit = e => {
  e.preventDefault();
  const u = currentUser();
  const f = new FormData(e.target);
  u.bio = { nama: f.get('nama').trim(), sekolah: f.get('sekolah').trim(), umur: f.get('umur') };
  save();
  currentTab = 'biodata';
  route();
};

$('#editBioBtn').onclick = () => openBioForm(currentUser());

function renderBio(u) {
  $('#bioView').innerHTML = `
    <p><strong>Nama:</strong> ${esc(u.bio.nama)}</p>
    <p><strong>Sekolah / kampus:</strong> ${esc(u.bio.sekolah)}</p>
    <p><strong>Umur:</strong> ${esc(u.bio.umur)}</p>`;
}

// ----- Navigasi tab dashboard -----
document.querySelectorAll('.tab').forEach(t => t.onclick = () => showTab(t.dataset.tab));

// ----- 3a. Soal Basic English: menu tes -----
function renderSoal(u) {
  if (quiz) return; // jangan timpa tes yang sedang berjalan
  $('#soalContent').innerHTML = `
    <p class="note">Tes diagnosis terdiri dari 3 bagian, masing-masing 10 soal. Kerjakan ketiganya untuk melihat analisa lengkap.</p>
    ${Object.keys(BAGIAN).map(k => {
      const h = u.hasil[k];
      const status = h ? `Skor terakhir: ${h.skor}/${h.total}` : 'Belum dikerjakan';
      return `<div class="bagian">
        <div><strong>${BAGIAN[k]}</strong><br><span class="note">${status}</span></div>
        <button class="primary small" data-start="${k}">${h ? 'Ulangi' : 'Mulai'}</button>
      </div>`;
    }).join('')}`;
  document.querySelectorAll('[data-start]').forEach(b => b.onclick = () => startQuiz(b.dataset.start));
}

// ----- 3b. Kuis satu bagian -----
function startQuiz(bagian) {
  const items = questions.filter(q => q.bagian === bagian);
  if (!items.length) return alert('Soal untuk bagian ini belum tersedia.');
  quiz = { bagian, items, i: 0, skor: 0 };
  $('#soalContent').innerHTML = `
    <p class="note" id="qinfo"></p>
    <div class="progress"><span id="qbar"></span></div>
    <div class="question" id="qtext"></div>
    <div class="options" id="qopts"></div>
    <div class="feedback" id="qfb"></div>
    <button class="primary hidden" id="qnext">Lanjut</button>`;
  renderQ();
}

function renderQ() {
  const item = quiz.items[quiz.i];
  $('#qinfo').textContent = `${BAGIAN[quiz.bagian]} · soal ${quiz.i + 1} dari ${quiz.items.length}`;
  $('#qbar').style.width = (quiz.i / quiz.items.length * 100) + '%';
  $('#qtext').textContent = item.pertanyaan;
  $('#qfb').className = 'feedback';
  $('#qfb').textContent = '';
  $('#qnext').classList.add('hidden');
  const opts = $('#qopts');
  opts.innerHTML = '';
  item.pilihan.forEach(p => {
    const b = document.createElement('button');
    b.textContent = p;
    b.onclick = () => answer(p);
    opts.appendChild(b);
  });
}

function answer(p) {
  const item = quiz.items[quiz.i];
  document.querySelectorAll('#qopts button').forEach(b => b.disabled = true);
  const benar = p === item.jawaban;
  if (benar) quiz.skor++;
  const fb = $('#qfb');
  fb.className = 'feedback ' + (benar ? 'ok' : 'bad');
  fb.textContent = (benar ? 'Benar! ' : `Belum tepat. Jawaban: ${item.jawaban}. `) + item.penjelasan;
  $('#qnext').textContent = quiz.i < quiz.items.length - 1 ? 'Lanjut' : 'Lihat hasil';
  $('#qnext').classList.remove('hidden');
}

document.addEventListener('click', e => {
  if (e.target.id === 'qnext') {
    quiz.i++;
    if (quiz.i < quiz.items.length) return renderQ();
    finishQuiz();
  }
});

function finishQuiz() {
  const u = currentUser();
  const k = quiz.bagian;
  if (u.hasil[k]) u.sebelum[k] = u.hasil[k]; // simpan skor lama untuk perbandingan
  u.hasil[k] = { skor: quiz.skor, total: quiz.items.length };
  save();
  quiz = null;
  currentTab = 'skor'; // langsung tampilkan papan skor
  showTab('skor');
}

// ----- 4. Papan skor, analisa, modul, pasangan -----
function renderSkor(u) {
  const box = $('#skorContent');
  const ks = Object.keys(BAGIAN);

  if (!ks.some(k => u.hasil[k])) {
    box.innerHTML = `
      <div class="empty">
        <strong>Belum ada skor</strong>
        <p class="note">Kerjakan soal basic English dulu untuk mengisi papan skor.</p>
        <button class="primary" id="mulaiSoal">Mulai soal</button>
      </div>`;
    $('#mulaiSoal').onclick = () => showTab('soal');
    return;
  }

  const rincian = ks.map(k => {
    const h = u.hasil[k];
    if (!h) return `<div class="row"><span>${BAGIAN[k]}</span><span class="note">Belum dikerjakan</span></div>`;
    const prev = u.sebelum[k] ? ` · sebelumnya ${u.sebelum[k].skor}/${u.sebelum[k].total}` : '';
    return `<div class="row"><span>${BAGIAN[k]}</span><strong>${h.skor}/${h.total}</strong></div>
      <div class="progress"><span style="width:${pct(h)}%"></span></div>
      <p class="note">${pct(h)}%${prev}</p>`;
  }).join('');

  if (!sudahSemua(u)) {
    box.innerHTML = rincian + `<p class="note">Selesaikan ketiga bagian untuk melihat analisa lengkap.</p>`;
    return;
  }

  const terlemah = ks.slice().sort((a, b) => pct(u.hasil[a]) - pct(u.hasil[b]))[0];
  const modul = ks.filter(k => pct(u.hasil[k]) < BATAS_MODUL);
  const daftarModul = modul.length
    ? modul.map(k => `<div class="row"><span>${MODUL[k]}</span><button class="secondary small" disabled>Segera hadir</button></div>`).join('')
    : '<p class="note">Semua bagian sudah cukup baik. Lanjutkan dengan pasangan belajar.</p>';

  box.innerHTML = rincian + `
    <h3>Analisa</h3>
    <p>Level kamu saat ini: <strong>${levelOf(u)}</strong>. Bagian yang perlu diperkuat: <strong>${BAGIAN[terlemah]}</strong>.</p>
    <h3>Modul yang disarankan</h3>
    ${daftarModul}
    <h3>Pasangan belajar</h3>
    <p class="note">Pasangan dicari dari pengguna lain dengan level yang berdekatan.</p>
    <button class="primary" id="cariPasangan">Cari pasangan</button>
    <div id="pasanganBox"></div>`;

  $('#cariPasangan').onclick = () => cariPasangan(u);
}

function cariPasangan(u) {
  const box = $('#pasanganBox');
  const lv = LEVEL_NUM[levelOf(u)];
  const kandidat = Object.values(db).filter(x =>
    x.email !== u.email && x.bio && sudahSemua(x) && Math.abs(LEVEL_NUM[levelOf(x)] - lv) <= 1
  ).sort((a, b) => Math.abs(totalPct(a) - totalPct(u)) - Math.abs(totalPct(b) - totalPct(u)));

  const tombol = `<div><a class="btn meet" href="${MEET}" target="_blank" rel="noopener">Buka Google Meet</a>
    <a class="btn zoom" href="${ZOOM}" target="_blank" rel="noopener">Buka Zoom</a></div>`;

  if (!kandidat.length) {
    box.innerHTML = `<p class="note" style="margin-top:12px">Belum ada pasangan yang cocok. Coba lagi nanti, atau buka Meet/Zoom dan ajak teman.</p>` + tombol;
    return;
  }
  const p = kandidat[0];
  box.innerHTML = `<div class="row" style="margin-top:12px"><span>Pasangan: <strong>${esc(p.bio.nama)}</strong> (${esc(p.bio.sekolah)}), level ${levelOf(p)}</span></div>` + tombol;
}

// ----- Muat soal lalu jalankan aplikasi -----
fetch('data/questions.json')
  .then(r => r.json())
  .then(data => { questions = data; route(); })
  .catch(() => {
    $('#authMsg').textContent = 'Soal gagal dimuat. Pastikan membuka lewat Live Server, bukan dobel-klik file.';
    showScreen('authScreen');
  });
