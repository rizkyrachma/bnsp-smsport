# Analisis Menyeluruh Proyek SM Sport Center Reservation System

Dokumen ini berisi analisis arsitektur, basis data, aturan bisnis, alur kerja sistem, dan hasil perbaikan bug yang telah dilakukan pada sistem reservasi lapangan olahraga (Futsal & Badminton) milik **SM Sport Center**.

---

## 1. Spesifikasi Teknis (Tech Stack)

Sistem ini dirancang menggunakan arsitektur modern berbasis Fullstack Next.js:

* **Framework Utama:** Next.js (App Router) menggunakan TypeScript. Menyediakan sisi client (UI interaktif) sekaligus server-side logic (Server Actions, API Route Handlers, dan Server-side rendering).
* **Pemetaan Basis Data (ORM):** Prisma Client dengan database relasional **PostgreSQL** (yang di-hosting secara serverless di platform **Neon**).
* **Desain UI & Styling:** Tailwind CSS v4 dengan sistem manajemen variabel terpusat untuk tema warna modern, tipografi geometris, dan tata letak mobile-first.
* **Autentikasi & Otorisasi:** Kustomisasi session berbasis **JSON Web Token (JWT)** menggunakan library `jose` dan pengamanan hash password dengan `bcryptjs`.
* **Visualisasi Data (Admin):** Library grafik **Recharts** untuk visualisasi pendapatan harian/bulanan serta tingkat okupansi per jenis lapangan secara real-time.
* **Ekspor Dokumen:** Library **jsPDF** bersama plugin **jspdf-autotable** untuk mencetak invoice/tiket reservasi pelanggan serta mengunduh laporan bulanan berformat PDF resmi.

---

## 2. Struktur Folder & Routing

Aplikasi ini disatukan dalam satu repositori Next.js untuk mencegah duplikasi logika bisnis, dengan pemisahan akses rute sebagai berikut:

```
app/
├── (customer)/             # Halaman & fitur sisi Pelanggan
│   ├── _components/        # Komponen navbar pelanggan, badge countdown, dll.
│   ├── booking/            # Halaman pemilihan jadwal & durasi
│   ├── login/              # Portal masuk customer
│   ├── riwayat/            # Riwayat transaksi & e-ticket
│   └── page.tsx            # Landing page publik (Beranda)
├── admin/                  # Halaman & fitur sisi Pengelola (Admin)
│   ├── _components/        # Sidebar responsif admin, layout, dll.
│   ├── dashboard/          # Panel statistik & status lapangan
│   ├── jadwal/             # Kelola jadwal & blokir lapangan manual
│   ├── laporan/            # Ekspor laporan PDF berfilter
│   ├── pelanggan/          # Kelola daftar pelanggan
│   └── login/              # Portal login terpisah khusus pengelola
├── api/                    # Endpoint API publik/integrasi
│   ├── auth/               # Endpoint masuk, daftar, & cek sesi
│   ├── bookings/           # Endpoint CRUD booking & auto-cancel
│   └── payments/           # Endpoint verifikasi & callback transaksi
├── globals.css             # Tema variabel warna & style dasar Tailwind v4
└── layout.tsx              # Root HTML & font wrapper
```

---

## 3. Skema Basis Data (Prisma Schema)

Hubungan relasi antar-tabel diatur secara ketat dengan skema berikut:

1. **User (Pengguna):**
   * Menyimpan kredensial pelanggan dan admin. Memiliki kolom `role` (`admin` / `customer`) untuk otorisasi akses.
2. **Court (Lapangan):**
   * Mengelola 5 lapangan (2 Futsal & 3 Badminton). Memiliki kolom `status` (`tersedia`, `dipesan`, `perbaikan`).
3. **Booking (Reservasi):**
   * Menyimpan detail waktu sewa (`bookingDate`, `startTime`, `endTime`), kalkulasi biaya (`totalPrice`), dan `status` (`pending`, `paid`, `cancelled`).
4. **Payment (Pembayaran):**
   * Menyimpan data bukti pembayaran, metode bayar (misal QRIS / transfer manual), status verifikasi, dan tanggal pelunasan (`paidAt`).

---

## 4. Aturan Bisnis Kritis (Business Logic)

Sistem ini menerapkan standar keamanan transaksi yang tinggi:

### 4.1 Anti Double-Booking
* Mencegah pemesanan jadwal yang bertabrakan pada lapangan dan tanggal yang sama untuk transaksi berstatus aktif (`pending` / `paid`).
* Logika bentrok jadwal dihitung dengan formula:
  ```
  bentrok jika: (start_time_baru < end_time_existing) DAN (end_time_baru > start_time_existing)
  ```
* Didukung dengan *transaction lock* atau serialization agar jika terjadi *race condition* (2 request masuk di milidetik yang sama), salah satu otomatis gagal dengan pesan kesalahan.

### 4.2 Hold Slot & Auto-Cancel (10 Menit)
* Ketika pelanggan menekan "Pesan", slot lapangan akan ditahan (*hold*) dengan status `pending` selama **10 menit**.
* Jika pembayaran tidak dilakukan/tidak terverifikasi dalam batas waktu tersebut, pesanan otomatis dibatalkan (`cancelled`) dan slot dikembalikan agar dapat dipesan orang lain.
* Logika auto-cancel dipicu secara pasif pada query-query data (sehingga data admin & user selalu akurat saat dibuka) serta secara aktif via CRON Job.

### 4.3 Sinkronisasi Waktu WIB (Asia/Jakarta)
* Seluruh pencatatan tanggal, jam mulai, dan jam selesai dikonversi ke format WIB (+7) menggunakan library `dayjs/plugin/timezone`.
* Mencegah pergeseran waktu akibat perbedaan zona waktu server (misalnya server Vercel di UTC) dengan zona waktu pelanggan.

---

## 5. Ringkasan Perbaikan & Optimasi Terkini

Selama proses pengembangan, beberapa penyempurnaan krusial telah berhasil diselesaikan:

1. **Penerapan Tema Warna Baru (Brand Blue):**
   * Mengubah seluruh elemen visual yang sebelumnya berwarna ungu/lavender menjadi warna biru tua formal **`#21257c`** (sesuai logo baru). Ini dilakukan secara efisien dengan mengubah CSS Variables di `app/globals.css` serta menyesuaikan warna diagram `Recharts` di dashboard admin.
2. **Sidebar Admin Mobile yang Responsif:**
   * Mengganti navigasi slider horizontal lama pada mobile menjadi dropdown menu satu kolom yang dinamis dengan transisi animasi halus (*slide & fade*).
   * Dropdown dilengkapi dengan backdrop penutup otomatis saat diklik di luar area menu.
3. **Penyelesaian Masalah Infinite Rebuild Dev Server:**
   * Mengatasi isu penanganan file-watching pada sistem operasi Windows dengan beralih ke dev server berbasis Webpack (`--webpack`) dan menambahkan watch ignores untuk folder `.next`, `node_modules`, serta folder subproyek `my-app` di `next.config.ts`.
4. **Perbaikan Loop HMR pada Halaman Riwayat & Verifikasi:**
   * Memperbaiki loop pemanggilan berulang `getAdminBookings` pada sisi admin dan customer dengan mengimplementasikan *Latest Ref Pattern* (`useRef`) pada callback `onExpire` di komponen `CountdownBadge.tsx`. Ini mencegah `setInterval` terbuat ulang di setiap siklus render.
   * Menambahkan pemicu auto-cancel `cancelExpiredBookings` pada aksi pembacaan data admin untuk memastikan sinkronisasi data yang presisi.
5. **Penyempurnaan Teks & Visual:**
   * Mengubah kata *"udunan"* menjadi *"patungan"* pada halaman testimoni pelanggan.
   * Memperbaiki kontras visibilitas teks kecil `"Jangan Sampai Kehabisan Slot"` di atas latar belakang gelap pada landing page.
   * Mengintegrasikan file logo baru `SM SPORTS.png` dari aset BNSP ke seluruh navbar, sidebar, dan favicon.

---
*Dokumen ini dibuat secara otomatis sebagai rangkuman status final dan dokumentasi arsitektur proyek SM Sport Center.*
