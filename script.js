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