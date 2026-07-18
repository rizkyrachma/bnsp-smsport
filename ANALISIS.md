# Analisis Sistem Menyeluruh - SM Sport Center Reservation System

Dokumen ini menyajikan analisis sistem secara komprehensif, mulai dari analisis kebutuhan fungsional dan non-fungsional, arsitektur basis data, ERD (Entity Relationship Diagram), alur bisnis kritis, hingga mekanisme keamanan yang diterapkan pada sistem reservasi lapangan olahraga (Futsal & Badminton) milik **SM Sport Center**.

---

## 1. Analisis Kebutuhan Sistem (System Requirements)

Sistem dirancang berdasarkan pembagian peran (*role-based*) yang jelas antara **Pelanggan (Customer)** dan **Pengelola (Admin)** dengan spesifikasi fungsional berikut:

### 1.1 Kebutuhan Fungsional Pelanggan (Customer Features)
* **Pendaftaran & Autentikasi:** Pelanggan dapat membuat akun baru menggunakan nama, email, nomor telepon, dan password yang aman, serta masuk ke dalam sistem.
* **Lihat Jadwal Real-Time:** Pelanggan dapat memantau ketersediaan slot waktu (08:00 - 22:00 WIB) pada kalender interaktif untuk masing-masing lapangan (2 futsal & 3 badminton) secara real-time.
* **Booking Lapangan:** Pelanggan dapat memilih tanggal, lapangan, jam awal mulai, serta durasi sewa (1 s.d. 4 jam).
* **Multi-Slot Highlight:** Saat memilih durasi > 1 jam, sistem secara visual meng-highlight semua slot jam yang tercakup dalam durasi tersebut.
* **Sistem Pembayaran Instan (Checkout):**
  * Transaksi awal berstatus `pending` dan menahan slot selama **10 menit** (Hold Slot).
  * Menampilkan QRIS dinamis/detail rekening transfer manual untuk pembayaran.
  * Halaman checkout mandiri `/api/payments/checkout` yang responsif di HP untuk melakukan simulasi bayar instan.
* **Manajemen Riwayat & E-Ticket:**
  * Pelanggan dapat melihat riwayat reservasi beserta status bayar masing-masing (`pending`, `paid`, `cancelled`).
  * Menyediakan fitur pencarian dan filter riwayat berdasarkan tanggal dan jenis lapangan.
  * Mengunduh Bukti Sewa (E-Ticket) berformat PDF yang bersih dan profesional untuk ditunjukkan kepada petugas lapangan.

### 1.2 Kebutuhan Fungsional Pengelola (Admin Features)
* **Dasbor Statistik Utama:**
  * Menampilkan ringkasan total pelanggan terdaftar, total pendapatan, dan antrean reservasi.
  * Chart visualisasi pendapatan harian/bulanan menggunakan area chart.
  * Chart tingkat hunian/okupansi per lapangan (membedakan Futsal & Badminton) menggunakan bar chart.
  * Status real-time tiap lapangan saat ini (`tersedia`, `dipesan`, `perbaikan`).
* **Manajemen Pelanggan (CRUD):** Admin dapat melihat list pelanggan, mencari berdasarkan nama/kontak, melakukan pemblokiran (suspend) akun pelanggan yang bermasalah, serta memperbarui profil mereka.
* **Jadwal & Blokir Manual:** Admin dapat memblokir slot jam tertentu untuk keperluan turnamen atau perawatan rutin (*maintenance*) dengan mengubah status lapangan menjadi `perbaikan`.
* **Verifikasi Pembayaran Manual:** Admin dapat meninjau bukti transfer yang diunggah pelanggan, menyetujui (`paid`), atau menolak pembayaran yang tidak valid (otomatis mengubah status booking ke `cancelled`).
* **Laporan Bulanan & Ekspor PDF:** Fitur filter riwayat reservasi seluruh pelanggan berdasarkan rentang tanggal dan jenis lapangan, serta ekspor laporan rekapitulasi keuangan berformat PDF resmi dengan tanda tangan digital pengelola.

### 1.3 Kebutuhan Non-Fungsional (Non-Functional Requirements)
* **Keamanan Data:** Enkripsi password menggunakan hashing satu arah blowfish-crypt (`bcryptjs`).
* **Autentikasi Sesi:** Token berbasis JSON Web Token (JWT) yang dienkripsi menggunakan library `jose` dengan penyimpanan aman di HTTP-Only Cookie.
* **Konsistensi Zona Waktu:** Penggunaan WIB (Asia/Jakarta) sebagai basis perhitungan seluruh transaksi di server maupun client guna mencegah kesalahan akibat perbedaan zona waktu host server.
* **Skalabilitas & Performa:** Integrasi basis data Neon Postgres (Serverless) dengan optimasi pooling koneksi agar andal saat menerima request bersamaan yang tinggi.

---

## 2. Entity Relationship Diagram (ERD) & Struktur Tabel

Basis data menggunakan database relasional PostgreSQL dengan skema tabel yang didefinisikan dalam Prisma ORM.

### 2.1 Visualisasi Relasi (Mermaid Diagram)
```mermaid
erDiagram
    users ||--o{ bookings : "memiliki (1:N)"
    courts ||--o{ bookings : "disewa (1:N)"
    bookings ||--o? payments : "dibayar (1:1)"

    users {
        string id PK
        string name
        string email UK
        string phone
        string password
        enum role "admin | customer"
        boolean is_blocked
        datetime created_at
    }

    courts {
        string id PK
        string name
        enum type "futsal | badminton"
        int price_per_hour
        enum status "tersedia | dipesan | perbaikan"
    }

    bookings {
        string id PK
        string user_id FK
        string court_id FK
        date booking_date
        timetz start_time
        timetz end_time
        int total_price
        enum status "pending | paid | cancelled"
        datetime created_at
    }

    payments {
        string id PK
        string booking_id FK "UK"
        string payment_method
        int amount
        string proof_url
        string payment_status "pending | paid | rejected"
        datetime paid_at
    }
```

### 2.2 Kamus Data Struktur Tabel

#### Tabel 1: `users`
Menyimpan informasi akun pelanggan dan administrator.
| Nama Kolom | Tipe Data | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | String (CUID) | PK, Default | ID unik untuk setiap pengguna. |
| `name` | String | Not Null | Nama lengkap pengguna. |
| `email` | String | Unique, Not Null | Alamat email unik (digunakan untuk login). |
| `phone` | String | Nullable | Nomor telepon/WhatsApp. |
| `password` | String | Not Null | Password akun yang telah di-hash menggunakan bcrypt. |
| `role` | Enum (`Role`) | Default: `customer` | Hak akses pengguna (`admin` atau `customer`). |
| `is_blocked`| Boolean | Default: `false` | Status blokir/suspend akun pelanggan. |
| `created_at`| DateTime | Default: `now()` | Tanggal pembuatan akun. |

#### Tabel 2: `courts`
Menyimpan spesifikasi lapangan yang dimiliki SM Sport Center.
| Nama Kolom | Tipe Data | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | String (CUID) | PK, Default | ID unik untuk setiap lapangan. |
| `name` | String | Not Null | Nama lapangan (misal: Lapangan Futsal 1). |
| `type` | Enum (`CourtType`)| Not Null | Jenis cabang olahraga (`futsal` atau `badminton`). |
| `price_per_hour`| Int | Not Null | Tarif sewa lapangan per jam. |
| `status` | Enum (`CourtStatus`)| Default: `tersedia` | Status operasional lapangan (`tersedia`, `dipesan`, `perbaikan`). |

#### Tabel 3: `bookings`
Menyimpan transaksi pemesanan lapangan oleh pelanggan.
| Nama Kolom | Tipe Data | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | String (CUID) | PK, Default | ID unik transaksi reservasi. |
| `user_id` | String (CUID) | FK, Not Null | Menghubungkan ke `users.id`. |
| `court_id` | String (CUID) | FK, Not Null | Menghubungkan ke `courts.id`. |
| `booking_date`| Date | Not Null | Tanggal pemesanan lapangan (Y-M-D). |
| `start_time` | Time with Timezone | Not Null | Waktu mulai sewa lapangan (WIB). |
| `end_time` | Time with Timezone | Not Null | Waktu selesai sewa lapangan (WIB). |
| `total_price`| Int | Not Null | Total biaya sewa (durasi x price_per_hour). |
| `status` | Enum (`BookingStatus`)| Default: `pending` | Status pemesanan (`pending`, `paid`, `cancelled`). |
| `created_at`| DateTime | Default: `now()` | Waktu transaksi dibuat. |

#### Tabel 4: `payments`
Menyimpan informasi detail bukti transaksi pembayaran.
| Nama Kolom | Tipe Data | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | String (CUID) | PK, Default | ID unik data pembayaran. |
| `booking_id` | String (CUID) | FK, Unique, Not Null | Menghubungkan ke `bookings.id` (Relasi 1:1). |
| `payment_method`| String | Nullable | Metode bayar yang dipilih (QRIS / Transfer). |
| `amount` | Int | Not Null | Nominal uang yang harus dibayar. |
| `proof_url` | String | Nullable | URL berkas foto/screenshot bukti transfer. |
| `payment_status`| String | Default: `pending` | Status pembayaran (`pending`, `paid`, `rejected`). |
| `paid_at` | DateTime | Nullable | Tanggal & waktu pelunasan terverifikasi. |

---

## 3. Logika & Alur Kerja Bisnis Utama (Core System Flow)

### 3.1 Logika Pencegahan Tabrakan Jadwal (Anti Double-Booking)
Untuk menjamin integritas data, setiap pembuatan transaksi baru divalidasi secara ketat pada server-side:
* Query akan mencari reservasi yang memiliki status aktif (`pending` atau `paid`), tanggal pemesanan yang sama (`bookingDate`), dan lapangan yang sama (`courtId`).
* Pemesanan dinyatakan **bentrok/tumpang-tindih** apabila:
  $$\text{start\_time\_baru} < \text{end\_time\_existing} \quad \text{dan} \quad \text{end\_time\_baru} > \text{start\_time\_existing}$$
* Operasi ini dibungkus di dalam **Prisma Transaction** untuk menjamin isolasi ACID basis data, sehingga jika terjadi race condition oleh dua user berbeda pada waktu yang sama, salah satu request akan otomatis dibatalkan.

### 3.2 Alur Hold Slot & Pembatalan Otomatis (Auto-Cancel)
Sistem menahan slot selama **10 menit** sejak transaksi dibuat:
1. Saat booking dibuat, status diatur menjadi `pending`.
2. Selama 10 menit ini, slot tersebut tidak dapat dipesan oleh orang lain.
3. Klien menampilkan countdown dinamis (Timer) berdasarkan sisa waktu.
4. **Mekanisme Pemicu Pasif:** Setiap kali database diakses oleh user atau admin, fungsi `cancelExpiredBookings()` akan dieksekusi secara otomatis untuk mencari transaksi `pending` yang dibuat lebih dari 10 menit yang lalu, kemudian mengubah statusnya menjadi `cancelled`. Hal ini membuat data di sisi admin maupun pelanggan selalu sinkron dan akurat secara instan.
5. **Mekanisme Pemicu Aktif:** Cron job eksternal memanggil endpoint `/api/bookings/cancel-expired` secara periodik untuk membersihkan slot yang hangus di basis data.

---

## 4. Fitur Keamanan Sistem (Security Measures)

Sistem ini menerapkan standar keamanan aplikasi web modern:

* **Sesi JWT yang Aman (HTTP-Only):**
  Token autentikasi disimpan di dalam cookie berlabel `HttpOnly` dan `Secure`. Ini melindungi token agar tidak dapat dibaca oleh script berbahaya dari sisi client (melindungi dari serangan *Cross-Site Scripting / XSS*).
* **Role-Based Redirect Middleware:**
  Sistem memisahkan alur masuk pengguna secara ketat:
  * Customer login diarahkan ke halaman utama (`/`).
  * Admin login diarahkan ke dashboard admin (`/admin/dashboard`).
  * Middleware `/middleware.ts` (melalui wrapper `proxy.ts`) secara aktif memeriksa role di dalam token sesi sebelum mengizinkan browser mengakses rute sensitif `/admin/*`. Pengguna dengan role `customer` yang mencoba mengakses dashboard pengelola secara ilegal akan langsung di-redirect paksa kembali ke beranda.
* **Pencegahan SQL Injection:**
  Semua komunikasi data ke PostgreSQL dilakukan melalui Prisma ORM yang secara default menggunakan parameterized queries (Prepared Statements). Ini mencegah masuknya query SQL berbahaya dari input form.
* **Keamanan Password:**
  Password pengguna di-hash sebelum disimpan ke database menggunakan algoritma blowfish-crypt (`bcryptjs`) berkekuatan tinggi, sehingga tidak ada data sensitif yang disimpan dalam teks biasa (*plaintext*).

---
*Dokumen ini diperbarui secara otomatis dan menjadi panduan arsitektur resmi sistem reservasi SM Sport Center.*
