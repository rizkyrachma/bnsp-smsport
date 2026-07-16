# AGENTS.md — SM Sport Center Reservation System

Instruksi ini ditujukan untuk AI coding agent yang membangun/memelihara sistem reservasi lapangan (futsal & badminton) milik SM Sport Center. Baca seluruh file ini sebelum membuat atau mengubah kode.

## 1. Konteks Proyek
Mengganti reservasi manual (telepon/WhatsApp) dengan sistem reservasi berbasis web yang mencegah double booking, mengotomasi kalkulasi biaya, dan menyediakan dasbor admin.

Aset yang dikelola:
- 2 lapangan futsal
- 3 lapangan badminton

## 2. Tech Stack (wajib diikuti)
- **Framework:** Next.js (App Router) — dipakai sebagai frontend DAN backend sekaligus. Tidak ada backend terpisah (tidak pakai Node/Express standalone).
  - Gunakan **Route Handlers** (`app/api/.../route.ts`) untuk endpoint REST bila dibutuhkan (misal webhook payment gateway).
  - Gunakan **Server Actions** untuk operasi form-submit langsung (misal submit booking, verifikasi pembayaran admin) tanpa perlu bikin endpoint REST manual.
- **Styling:** Tailwind CSS (mobile-first/responsive, karena mayoritas pelanggan akses via smartphone).
- **Charting (dashboard admin):** gunakan library chart berbasis React seperti **Recharts** (disarankan, ringan & mudah dipadukan dengan Tailwind) untuk chart pendapatan & chart booking per lapangan. Data chart di-fetch dari Server Component/Route Handler yang query langsung ke Prisma, jangan hardcode data dummy di komponen chart.
- **ORM:** Prisma — semua akses database wajib lewat Prisma, jangan raw query kecuali untuk kasus locking khusus di section 4.1.
- **Database:** PostgreSQL, di-hosting di **Neon** (serverless Postgres). Wajib mendukung transaksi ACID. Jangan gunakan NoSQL untuk data booking/payment.
  - Gunakan connection string dari Neon (`DATABASE_URL`) di `.env`, dan aktifkan **connection pooling** (Neon pooled connection / `pgbouncer=true`) karena Next.js App Router (khususnya Server Actions & Route Handlers di lingkungan serverless seperti Vercel) rawan connection exhaustion tanpa pooling.
  - Prisma Client sebaiknya diinstansiasi sebagai singleton (`lib/prisma.ts`) untuk menghindari membuka koneksi baru di setiap hot-reload saat development.
- **Scheduler:** Cron job untuk auto-cancel booking yang kedaluwarsa (Vercel Cron jika deploy di Vercel, atau node-cron jika self-host).
- **Auth:** boleh pakai NextAuth/Auth.js atau implementasi custom dengan session/JWT — pilih salah satu dan konsisten, jangan campur.

## 2.1 Struktur Folder (App Router)
Admin dan customer berada dalam **satu project Next.js yang sama** (bukan 2 project terpisah), dipisahkan lewat routing:

```
app/
├── (customer)/
│   ├── page.tsx              ← beranda/kalender publik
│   ├── booking/
│   ├── login/
│   └── riwayat/
├── admin/
│   ├── layout.tsx            ← proteksi role admin di sini
│   ├── login/                ← login khusus admin, terpisah dari login customer
│   ├── dashboard/
│   ├── jadwal/
│   └── laporan/
├── api/
│   ├── bookings/
│   ├── payments/
│   └── auth/
├── middleware.ts              ← cek role sebelum mengizinkan akses /admin/*
prisma/
└── schema.prisma
```

Alasan disatukan: skema database, tipe data, dan logic booking (anti double-booking, kalkulasi harga) dipakai bersama oleh customer & admin. Memisahkan jadi 2 project akan memaksa duplikasi logic ini dan rawan bug/inkonsistensi. Proteksi rute admin cukup ditangani lewat `middleware.ts` + layout terpisah untuk `/admin`, bukan lewat pemisahan project.

## 2.2 Alur Login & Redirect per Role
Login admin dan login user **tujuan setelah berhasil login berbeda**, meskipun mekanisme autentikasi (session/JWT) yang dipakai sama:
- **Login user (customer)** → route `app/(customer)/login/` → setelah sukses, redirect ke **halaman utama pelanggan** (`app/(customer)/page.tsx` atau dashboard customer, misal kalender booking).
- **Login admin** → route login terpisah, misal `app/admin/login/` (bukan berbagi form dengan login customer) → setelah sukses, redirect ke **halaman utama admin** (`app/admin/dashboard/`).
- Setelah autentikasi berhasil, cek `role` dari data user (`admin` atau `customer`) untuk menentukan redirect tujuan — jangan hardcode redirect ke satu tujuan saja untuk semua role.
- Jika user dengan `role: customer` mencoba mengakses `/admin/*` (baik lewat redirect manual URL maupun sengaja), `middleware.ts` HARUS menolak akses dan redirect balik ke halaman customer — jangan hanya menyembunyikan menu admin di UI.
- Sebaliknya, admin yang login tetap boleh mengakses halaman customer bila perlu (misal untuk keperluan testing/booking manual), kecuali ditentukan lain oleh pengguna.
- Jangan gabungkan form login admin & customer jadi satu halaman dengan pemilihan role manual oleh pengguna — role ditentukan dari data akun di database (kolom `users.role`), bukan dipilih sendiri oleh yang login (mencegah user biasa memilih "login sebagai admin").

## 3. Skema Database (acuan tabel)
```
users
  id, name, email, phone, password (hashed), role [admin|customer], created_at

courts
  id, name, type [futsal|badminton], price_per_hour,
  status [tersedia|dipesan|perbaikan]

bookings
  id, user_id, court_id, booking_date, start_time, end_time,
  total_price, status [pending|paid|cancelled], created_at

payments
  id, booking_id, payment_method, amount, proof_url,
  payment_status, paid_at
```
Agent tidak boleh mengubah struktur inti tabel ini tanpa konfirmasi eksplisit dari pengguna.

## 4. Aturan Bisnis Kritis (non-negotiable)

### 4.1 Anti Double Booking
- Setiap insert/update ke `bookings` WAJIB dibungkus dalam **Prisma `$transaction`** dengan row locking. Prisma tidak punya `SELECT ... FOR UPDATE` native, jadi gunakan salah satu pendekatan berikut:
  - `prisma.$transaction(async (tx) => { ... })` dikombinasikan dengan raw query `SELECT ... FOR UPDATE` via `tx.$queryRaw` sebelum insert booking baru, ATAU
  - Serialization di level aplikasi: tambahkan unique constraint di database pada kombinasi (`court_id`, `booking_date`, `start_time`) untuk status aktif, sehingga insert kedua otomatis gagal karena constraint violation (lebih sederhana dan disarankan untuk skala proyek ini).
- Cek overlap sebelum booking disetujui:
  ```
  bentrok jika: (start_time_baru < end_time_existing)
            DAN (end_time_baru > start_time_existing)
  ```
  pada `court_id` + `booking_date` yang sama, dengan status existing `pending` atau `paid`.
- Jika terjadi race condition (dua request bersamaan), request kedua HARUS gagal dengan pesan: "Jadwal baru saja dipesan orang lain."

### 4.2 Hold Slot & Auto-Cancel
- Saat pelanggan klik "Pesan", status booking → `pending`, ditahan **15 menit**.
- Jika tidak dibayar dalam 15 menit → cron job otomatis ubah status ke `cancelled` dan slot kembali tersedia.
- Jangan hardcode durasi 15 menit di banyak tempat — simpan sebagai konstanta/config tunggal.

### 4.3 Kalkulasi Harga
- Harga dihitung otomatis dari `price_per_hour` × durasi.
- Jika ada tarif prime time vs reguler, definisikan aturan tarif sebagai data terkonfigurasi (bukan hardcoded di logic), agar admin bisa ubah tanpa deploy ulang.

### 4.4 Validasi Waktu Lampau (Past Date/Time)
- Tanggal yang sudah lewat dari hari ini (real-time server, bukan waktu di browser client) HARUS di-disable di kalender — tidak bisa dipilih/diklik.
- Untuk **hari ini**, jam/slot yang sudah lewat dari jam saat ini juga HARUS di-disable. Contoh: jika sekarang jam 10:00, maka slot jam 09:00 dan sebelumnya untuk tanggal hari ini harus disabled, tapi slot jam 10:00 ke atas tetap bisa dipilih (sesuaikan aturan buffer minimum booking jika ada, misal minimal booking H+1 jam dari sekarang).
- **WAJIB divalidasi di DUA tempat:**
  1. **Frontend (UI):** tombol/slot tanggal & jam yang sudah lewat ditampilkan disabled/abu-abu, tidak bisa diklik.
  2. **Backend (Server Action/API):** validasi ulang sebelum insert ke `bookings` — JANGAN hanya mengandalkan validasi frontend, karena request bisa dikirim langsung lewat API tanpa lewat UI.
- Gunakan waktu **server** (misal `new Date()` di server action, atau `NOW()` di database) sebagai acuan "sekarang", jangan percaya waktu yang dikirim dari client, untuk mencegah manipulasi jam di perangkat pelanggan.
- Perhatikan timezone: seluruh sistem harus konsisten menggunakan satu timezone (WIB / Asia/Jakarta), baik di database, server, maupun tampilan frontend — jangan campur UTC dan WIB tanpa konversi eksplisit.

- Password di-hash (bcrypt/argon2), jangan pernah simpan plaintext.
- Sanitasi semua input untuk mencegah SQL Injection.
- Escape output untuk mencegah XSS.
- Validasi role (`admin` vs `customer`) di setiap endpoint sensitif — jangan hanya di frontend.

## 6. Modul yang Harus Dibangun

**Customer:**
- Halaman utama (landing page) yang menarik agar pengunjung tertarik booking — lihat detail di section 6.1.
- Registrasi/login (email atau nomor telepon)
- Lihat jadwal real-time (kalender: Tersedia / Dipesan / Dalam Perawatan)
- Booking (pilih tanggal, lapangan, jam mulai, durasi), bayar **full price** langsung (lihat 4.3)
- Pembayaran (QRIS/VA via payment gateway, atau upload bukti transfer manual)
- Riwayat booking + unduh bukti/tiket

**Admin:**
- Dasbor utama, berisi minimal:
  - Total pelanggan terdaftar
  - Chart pendapatan (misal per hari/bulan, bisa difilter rentang tanggal)
  - Chart jumlah booking per lapangan (2 futsal + 3 badminton ditampilkan terpisah agar okupansi tiap lapangan terlihat)
  - Status tiap lapangan saat ini: **Tersedia** / **Dalam Perbaikan** (agent perlu memastikan field `courts.status` mendukung minimal kedua state ini, plus state lain yang relevan seperti "Dipesan" untuk slot yang sedang aktif)
- Kelola pelanggan: daftar seluruh pelanggan (nama, kontak, jumlah booking), lihat detail, dan kemampuan admin menonaktifkan/memblokir akun pelanggan bermasalah
- Blokir jadwal manual (perawatan/turnamen) — mengubah status lapangan jadi "Dalam Perbaikan" untuk rentang waktu tertentu
- Verifikasi pembayaran manual
- Riwayat booking seluruh pelanggan, beserta detail transaksi per booking (total harga, metode pembayaran, bukti transfer, status)
- Ekspor laporan (PDF/Excel) per rentang tanggal, jenis lapangan, pendapatan

## 6.1 Landing Page (Halaman Publik Sebelum Login)
Referensi gaya: ayo.co.id — tapi diskalakan untuk single-venue (1 tempat, 5 lapangan), BUKAN marketplace multi-venue. Jangan tiru fitur yang di luar scope (cari lawan sparring, direktori tim, kompetisi, partner venue lain).

Route: `app/(customer)/page.tsx` — ini halaman pertama yang dilihat pengunjung sebelum login.

Section yang wajib ada, urutan dari atas ke bawah:
1. **Navbar** — logo SM Sport Center, menu (Beranda, Jadwal/Booking, Tentang, Kontak), tombol Masuk/Daftar di kanan.
2. **Hero section** — headline singkat (misal "Booking Lapangan Futsal & Badminton Jadi Mudah"), sub-headline, tombol CTA utama "Booking Sekarang" yang mengarah ke halaman kalender/booking.
3. **Info Lapangan** — kartu untuk tiap jenis lapangan (Futsal, Badminton) berisi foto (placeholder dulu jika belum ada aset), harga per jam, dan tombol "Lihat Jadwal".
4. **Kenapa Pilih Kami (keunggulan)** — 3-4 poin singkat: booking online 24 jam, tanpa bentrok jadwal, pembayaran mudah (QRIS/transfer), lokasi strategis.
5. **Angka/Statistik (opsional, isi manual dulu bukan hardcode fiktif)** — misal jumlah booking selesai, jumlah pelanggan — hanya tampilkan jika datanya nyata dari database, jangan isi angka palsu.
6. **Testimoni pelanggan** (opsional, bisa placeholder di awal, diisi setelah ada testimoni asli).
7. **CTA banner** sebelum footer — ajakan booking sekarang.
8. **Footer** — nama usaha, alamat, jam operasional, kontak (telepon/WhatsApp), link sosial media jika ada.

Catatan implementasi:
- Landing page ini adalah halaman statis/marketing, render sebagai Server Component biasa (tidak perlu data real-time kompleks), kecuali bagian statistik yang ambil dari database.
- Section kartu lapangan & CTA booking harus mengarah ke halaman kalender interaktif yang sudah didefinisikan di section 6 (Modul Customer).
- Jangan tambahkan fitur di luar scope proyek ini (misal komunitas, sparring, kompetisi) hanya karena ada di web referensi.

## 6.2 Strategi Aset Gambar (Banner, Foto Lapangan, Ikon)
User TIDAK akan upload gambar manual. Semua visual harus dihasilkan/didapat otomatis oleh agent dengan urutan prioritas berikut:

1. **Ikon, dekorasi, background hero, ilustrasi sederhana** → buat langsung sebagai **inline SVG** di dalam komponen React (bukan file gambar terpisah). Gunakan warna dari Tailwind theme agar konsisten. Ini pilihan utama karena tidak butuh API key dan tidak butuh aset eksternal.
2. **Foto lapangan/venue yang butuh terlihat "nyata" (misal kartu Info Lapangan, hero banner)** → gunakan placeholder sementara dari layanan gratis:
   - `https://placehold.co/{width}x{height}?text=Nama+Lapangan` untuk placeholder dengan label jelas, ATAU
   - Jika tersedia API key Unsplash/Pexels (tanyakan ke user apakah mau setup ini), fetch foto stok sesuai keyword ("futsal court", "badminton court").
3. **Jangan pernah generate/menyisipkan foto yang mengklaim sebagai foto asli venue SM Sport Center** — karena itu foto asli fisik yang belum ada, harus tetap ditandai placeholder (misal watermark teks "Foto Ilustrasi") agar tidak menyesatkan pelanggan setelah live.
4. Simpan referensi gambar dalam variabel/config terpusat (misal `lib/assets.ts`), supaya nanti gampang diganti massal dengan foto asli venue tanpa harus cari satu-satu di kode.

## 7. Kriteria "Selesai" (Definition of Done) per fitur

Sebelum menandai fitur selesai, agent harus memverifikasi:
1. Test concurrency: 2 booking bersamaan pada slot sama → hanya 1 yang berhasil.
2. Test auto-cancel: booking pending > 15 menit tanpa pembayaran terverifikasi → otomatis cancelled.
3. Slot penuh → tombol booking disabled di UI.
4. Dashboard admin (total pelanggan, chart pendapatan, chart booking per lapangan, status lapangan) menampilkan angka yang cocok dengan data di database, bukan data statis/dummy.
5. Ekspor laporan menghasilkan data akurat (cocok dengan data di database).
6. Tidak ada credential/password plaintext di database atau log.

## 8. Batasan untuk Agent
- Jangan mengubah skema database inti tanpa konfirmasi.
- Jangan menonaktifkan/menyederhanakan transaction locking demi "kemudahan development" — ini fitur keamanan inti proyek.
- Jika ragu antara dua pendekatan implementasi, tanyakan ke pengguna sebelum melanjutkan, terutama untuk hal yang menyentuh data pembayaran.
