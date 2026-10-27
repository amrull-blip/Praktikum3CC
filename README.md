# 🎨 ChromaCraft - Generator Random Color Palette (PHP Native)

Aplikasi web modern berbasis **PHP Native** murni tanpa framework, dirancang untuk menghasilkan palet warna acak harmonis dengan estetika premium.

---

## ✨ Fitur Unggulan

- **🚀 Server-Side & Client-Side Harmony**: Logika warna dihitung menggunakan matematika ruang warna HSL & Golden Ratio di PHP murni serta didukung generasi real-time di sisi browser.
- **🎹 Keyboard-First Experience**: Tekan tombol **SPASI** untuk mengacak palet seketika, tekan **S** untuk menyimpan ke koleksi, dan **C** untuk menyalin semua kode warna.
- **🔒 Color Lock**: Kunci warna tertentu yang Anda sukai, lalu acak sisa warna lainnya.
- **🌈 9 Mode Harmoni Warna**:
  - *Harmonious (Golden Ratio)*
  - *Analogous*
  - *Complementary*
  - *Triadic*
  - *Monochromatic*
  - *Soft Pastel*
  - *Cyberpunk Neon*
  - *Warm Sunset*
  - *Cool Ocean*
- **👁️ Pratinjau Desain UI Nyata**: Tinjau bagaimana palet warna Anda bekerja secara langsung pada mockup antarmuka pengguna (tombol CTA, kartu dashboard, kartu hero, badge).
- **📋 Salin & Ekspor Multi-Format**:
  - Salin HEX, RGB, HSL dalam 1-klik dengan notifikasi toast.
  - Ekspor ke **CSS Variables**, **Tailwind CSS config**, **JSON**, dan **SVG Vector**.
- **💾 Koleksi Tersimpan**: Simpan palet favorit ke memori lokal browser (localStorage) dan muat kembali kapan saja.
- **🔗 URL Shareable**: Bagikan palet spesifik melalui parameter URL (misalnya `?palette=264653-2A9D8F-E9C46A-F4A261-E76F51`).

---

## 💻 Cara Menjalankan Secara Lokal

Pastikan Anda telah memiliki **PHP** terpasang di komputer Anda (PHP 7.4+ atau PHP 8.x).

### Cara 1: Menggunakan file `run.bat` (Windows)
Cukup klik dua kali (double click) file [`run.bat`](file:///c:/Users/Amrul/Documents/praktikumCC/run.bat). Browser Anda akan otomatis membuka:
```text
http://localhost:8000
```

### Cara 2: Lewat Terminal / Command Prompt / PowerShell
Buka terminal di folder project ini, lalu jalankan perintah:
```bash
php -S localhost:8000
```
Buka browser dan kunjungi:
```text
http://localhost:8000
```

---

## 📂 Struktur File

```text
praktikumCC/
├── assets/
│   ├── css/
│   │   └── style.css       # Styling modern (glassmorphism, animatif, responsif)
│   └── js/
│       └── app.js          # Interaktivitas keyboard, sintesis suara, modal pratinjau & ekspor
├── index.php               # Halaman utama & fungsi perhitungan warna PHP native
├── run.bat                 # Script praktis untuk menjalankan server lokal di Windows
└── README.md               # Dokumentasi proyek
```
