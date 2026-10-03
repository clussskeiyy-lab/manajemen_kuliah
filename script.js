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

// pindah halaman
document.querySelectorAll(".navbtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".navbtn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("view-" + btn.dataset.view).classList.add("active");
    setMenu(false);
  });
});

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
  const keyword = searchTugas.value.trim().tolowerCase();
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