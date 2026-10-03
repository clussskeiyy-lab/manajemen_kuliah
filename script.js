const DAYS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

const todayName = DAYS[(new Date().getDay() + 6) % 7];


// PENYIMPANAN LOKAL (localStorage)
const storage = {
  load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  },

  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      
    }
  },
};

// tasks : { id, title, mapel, prioritas, date, done }
let tasks = storage.load("kk_tasks", []);

// jadwal : { id, hari, jam, mapel, ruang }
let jadwal = storage.load("kk_jadwal", []);

// study : { id, hari, jam, topik }
let study = storage.load("kk_study", []);


// navigasi dan menu pop up
const menuToggle = document.getElementById("menuToggle");
const topnav = document.getElementById("topnav");

function setMenu(open) {
  topnav.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", open);
  menuToggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
}

// tombol tiga garis (HP)
menuToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  setMenu(!topnav.classList.contains("open"));
});

// klik di luar menu atau tekan Escape -> menu tertutup
document.addEventListener("click", (e) => {
  if (!topnav.contains(e.target)) setMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenu(false);
});

// tutup menu setelah memilih halaman (HP)
topnav.addEventListener("click", () => setMenu(false));

// Mencegah XSS sederhana saat menyisipkan teks user ke HTML
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => (
    {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m]
  ));
}

// Format tanggal ISO
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Selisih hari antara hari ini dan tanggal deadline (negatif = lewat)
function daysLeft(iso) {
  const target = new Date(iso + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target - now) / 86400000);
}

// Tampilkan notifikasi singkat untuk feedback aksi user 
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

// Tugas Kuliah
const formTugas = document.getElementById("formTugas");
const taskList = document.getElementById("taskList");
const searchTugas = document.getElementById("searchTugas");
const sortTugas = document.getElementById("sortTugas");
const filterTugas = document.getElementById("filterTugas");

const PRIORITY_WEIGHT = {
  tinggi: 3,
  sedang: 2,
  rendah: 1,
};

formTugas.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("tTitle").value.trim();
  const mapel = document.getElementById("tMapel").value.trim();
  const prioritas = document.getElementById("tPrioritas").value;
  const date = document.getElementById("tDate").value;

  if (!title || !mapel) return;

  tasks.push({
    id: Date.now(),
    title,
    mapel,
    prioritas,
    date,
    done: false,
  });

  storage.save("kk_tasks", tasks);
  formTugas.reset();
  document.getElementById("tPrioritas").value = "sedang";
  showToast("Tugas ditambahkan");
  renderAll();
});

searchTugas.addEventListener("input", renderTasks);
sortTugas.addEventListener("change", renderTasks);
filterTugas.addEventListener("change", renderTasks);

// Ubah status selesai atau belum
function toggleTask(id) {
  tasks = tasks.map((t) => (
    t.id === id ? { ...t, done: !t.done } : t
  ));
  storage.save("kk_tasks", tasks);
  renderAll();
}

// Hapus tugas berdasarkan id
function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  storage.save("kk_tasks", tasks);
  showToast("Tugas dihapus");
  renderAll();
}

// Menggunakan pencarian dengan filter dan sort, lalu render daftar tugas ke DOM
function renderTasks(){
  const keyword = searchTugas.value.trim().toLowerCase();
  const sortBy = sortTugas.value;
  const filterBy = filterTugas.value;

  // Berdasarkan kata kunci dan status
  let result = tasks.filter((t) => {
    const cocokKata = (t.title + " " + t.mapel).toLowerCase().includes(keyword);

    let cocokStatus = true;
    if (filterBy === "belum") {
      cocokStatus = !t.done;
    } else if (filterBy === "selesai") {
      cocokStatus = t.done;
    }

    return cocokKata && cocokStatus;
  });

  // 2) Urutkan sesuai pilihan user
  result = [...result].sort((a, b) => {
    switch (sortBy) {
      case "prioritas":
        return PRIORITY_WEIGHT[b.prioritas] - PRIORITY_WEIGHT[a.prioritas];
      case "nama":
        return a.title.localeCompare(b.title);
      case "deadline":
      default:
        return (a.date || "9999-99-99").localeCompare(b.date || "9999-99-99");
    }
  });

  // 3) Render ke DOM
  if (result.length === 0) {
    taskList.innerHTML = `
      <li class="list-plain empty" style="padding:16px;">
        Tidak ada tugas yang cocok.
      </li>
    `;
    return;
  }

  taskList.innerHTML = result
    .map((t) => {
      const dl = t.date ? daysLeft(t.date) : null;
      const overdue = !t.done && dl !== null && dl < 0;

      let metaText = [t.mapel, t.date ? fmtDate(t.date) : ""]
        .filter(Boolean)
        .join(" • ");

      if (!t.done && dl !== null) {
        if (dl < 0) {
          metaText += ` — lewat ${Math.abs(dl)} hari`;
        } else if (dl === 0) {
          metaText += " — hari ini";
        } else {
          metaText += ` — ${dl} hari lagi`;
        }
      }

      return `
        <li class="task ${t.done ? "done" : ""} ${overdue ? "overdue" : ""}">
          <input
            type="checkbox"
            ${t.done ? "checked" : ""}
            aria-label="Tandai selesai: ${escapeHtml(t.title)}"
            onchange="toggleTask(${t.id})"
          >
          <div class="body">
            <p class="title">
              ${escapeHtml(t.title)}
              <span class="badge ${t.prioritas}">${t.prioritas}</span>
            </p>
            <p class="meta ${overdue ? "late" : ""}">
              ${escapeHtml(metaText)}
            </p>
          </div>
          <div class="actions">
            <button type="button" onclick="deleteTask(${t.id})">
              Hapus
            </button>
          </div>
        </li>
      `;
    })
    .join("");
}

// Belajar Mandiri
const formBelajar = document.getElementById("formBelajar");
const studyList = document.getElementById("studyList");

formBelajar.addEventListener("submit", (e) => {
  e.preventDefault();

  const hari = document.getElementById("sHari").value;
  const jam = document.getElementById("sJam").value.trim();
  const topik = document.getElementById("sTopik").value.trim();

  if (!jam || !topik) return;

  study.push({
    id: Date.now(),
    hari,
    jam,
    topik,
  });

  storage.save("kk_study", study);
  formBelajar.reset();
  showToast("Sesi belajar ditambahkan");
  renderAll();
});

function deleteStudy(id) {
  study = study.filter((s) => s.id !== id);
  storage.save("kk_study", study);
  showToast("Sesi belajar dihapus");
  renderAll();
}

function renderStudy() {
  if (study.length === 0) {
    studyList.innerHTML = `
      <li class="list-plain empty" style="padding:16px;">
        Belum ada jadwal belajar mandiri.
      </li>
    `;
    return;
  }

  const sorted = [...study].sort((a, b) => (
    DAYS.indexOf(a.hari) - DAYS.indexOf(b.hari)
  ));

  studyList.innerHTML = sorted
    .map((s) => `
      <li class="study">
        <span class="time">${escapeHtml(s.hari)}<br>${escapeHtml(s.jam)}</span>
        <span class="body">${escapeHtml(s.topik)}</span>
        <button type="button" onclick="deleteStudy(${s.id})">
          Hapus
        </button>
      </li>
    `)
    .join("");
}

// Dashboard
function renderRingkasan() {
  const belum = tasks.filter((t) => !t.done).length;
  const selesai = tasks.filter((t) => t.done).length;
  const total = tasks.length;

  document.getElementById("statBelum").textContent = belum;
  document.getElementById("statSelesai").textContent = selesai;
  document.getElementById("statHariIni").textContent =
    jadwal.filter((j) => j.hari === todayName).length;
  document.getElementById("statBelajar").textContent = study.length;

  // Progress: persentase tugas selesai
  const percent = total === 0 ? 0 : Math.round((selesai / total) * 100);
  const fill = document.getElementById("progressFill");
  const track = document.getElementById("progressTrack");

  fill.style.width = percent + "%";
  track.setAttribute("aria-valuenow", percent);

  document.getElementById("progressCaption").textContent =
    total === 0
      ? "Belum ada tugas."
      : `${selesai} dari ${total} tugas selesai (${percent}%).`;

  // Deadline terdekat (maks 4 item)
  const upT = document.getElementById("upnextTugas");
  const pending = tasks
    .filter((t) => !t.done && t.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  upT.innerHTML = pending.length
    ? pending
        .map((t) => {
          const dl = daysLeft(t.date);
          const label =
            dl < 0
              ? `Lewat ${Math.abs(dl)} hari`
              : dl === 0
              ? "Hari ini"
              : `${dl} hari lagi`;

          return `
            <li>
              <span>${escapeHtml(t.title)}</span>
              <span class="muted">${label}</span>
            </li>
          `;
        })
        .join("")
    : '<li class="empty">Tidak ada tugas dengan deadline mendatang.</li>';

  // Kelas hari ini
  const upJ = document.getElementById("upnextJadwal");
  const todays = jadwal
    .filter((j) => j.hari === todayName)
    .sort((a, b) => a.jam.localeCompare(b.jam));

  upJ.innerHTML = todays.length
    ? todays
        .map((j) => `
          <li>
            <span>
              ${escapeHtml(j.mapel)}
              <span class="muted-inline">· ${escapeHtml(j.ruang || "")}</span>
            </span>
            <span class="muted">${escapeHtml(j.jam)}</span>
          </li>
        `)
        .join("")
    : '<li class="empty">Tidak ada kelas hari ini.</li>';
}

// Jadwal kuliah
const formJadwal = document.getElementById("formJadwal");
const weekGrid = document.getElementById("weekGrid");

formJadwal.addEventListener("submit", (e) => {
  e.preventDefault();

  const hari = document.getElementById("jHari").value;
  const jam = document.getElementById("jJam").value.trim();
  const mapel = document.getElementById("jMapel").value.trim();
  const ruang = document.getElementById("jRuang").value.trim();

  if (!jam || !mapel || !ruang) return;

  jadwal.push({
    id: Date.now(),
    hari,
    jam,
    mapel,
    ruang,
  });

  storage.save("kk_jadwal", jadwal);
  formJadwal.reset();
  showToast("Jadwal ditambahkan");
  renderAll();
});

function deleteJadwal(id) {
  jadwal = jadwal.filter((j) => j.id !== id);
  storage.save("kk_jadwal", jadwal);
  showToast("Jadwal dihapus");
  renderAll();
}

// 7 hari dari array DAYS 
function renderJadwal() {
  weekGrid.innerHTML = DAYS.map((day) => {
    const items = jadwal
      .filter((j) => j.hari === day)
      .sort((a, b) => a.jam.localeCompare(b.jam));

    const rows = items.length
      ? items
          .map((j) => `
            <div class="slot">
              <div class="slot-info">
                <span class="time">${escapeHtml(j.jam)}</span>
                <span class="slot-text">
                  ${escapeHtml(j.mapel)}
                  <span class="muted-inline">· ${escapeHtml(j.ruang || "")}</span>
                </span>
              </div>
              <button type="button" onclick="deleteJadwal(${j.id})">
                Hapus
              </button>
            </div>
          `)
          .join("")
      : '<p class="empty">Tidak ada kelas.</p>';

    return `
      <article class="day-card">
        <h3>${day}${day === todayName ? " — Hari ini" : ""}</h3>
        ${rows}
      </article>
    `;
  }).join("");
}

// Render total
function renderAll() {
  renderTasks();
  renderJadwal();
  renderStudy();
  renderRingkasan();
}

renderAll();