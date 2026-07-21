-- ============================================================================
-- SQL SCRIPT: SISTEM RESERVASI LAPANGAN SM SPORT CENTER
-- Target Database: PostgreSQL 16+
-- Deskripsi: DDL (Pembentukan Tabel & Index) + DML (Pengisian Data Lapangan/Pelanggan)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DATA DEFINITION LANGUAGE (DDL) - PEMBENTUKAN ENUM & TABEL
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS courts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS role_enum CASCADE;
DROP TYPE IF EXISTS court_type_enum CASCADE;
DROP TYPE IF EXISTS court_status_enum CASCADE;
DROP TYPE IF EXISTS booking_status_enum CASCADE;

CREATE TYPE role_enum AS ENUM ('admin', 'customer');
CREATE TYPE court_type_enum AS ENUM ('futsal', 'badminton');
CREATE TYPE court_status_enum AS ENUM ('tersedia', 'dipesan', 'perbaikan');
CREATE TYPE booking_status_enum AS ENUM ('pending', 'paid', 'cancelled');

-- Tabel 1: users (Pelanggan & Administrator)
CREATE TABLE users (
    id VARCHAR(30) PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    role role_enum NOT NULL DEFAULT 'customer',
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX users_email_key ON users(email);

-- Tabel 2: courts (Master Aset Lapangan Futsal & Badminton)
CREATE TABLE courts (
    id VARCHAR(30) PRIMARY KEY,
    name TEXT NOT NULL,
    type court_type_enum NOT NULL,
    price_per_hour INTEGER NOT NULL,
    status court_status_enum NOT NULL DEFAULT 'tersedia'
);

-- Tabel 3: bookings (Transaksi Reservasi Lapangan)
CREATE TABLE bookings (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    court_id VARCHAR(30) NOT NULL REFERENCES courts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIMETZ NOT NULL,
    end_time TIMETZ NOT NULL,
    total_price INTEGER NOT NULL,
    status booking_status_enum NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX bookings_court_id_booking_date_idx ON bookings(court_id, booking_date);

-- PARTIAL UNIQUE INDEX (Proteksi Anti Double-Booking)
CREATE UNIQUE INDEX active_booking_unique_idx 
ON bookings (court_id, booking_date, start_time) 
WHERE status IN ('pending', 'paid');

-- Tabel 4: payments (Catatan & Verifikasi Pembayaran)
CREATE TABLE payments (
    id VARCHAR(30) PRIMARY KEY,
    booking_id VARCHAR(30) NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    payment_method TEXT,
    amount INTEGER NOT NULL,
    proof_url TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP(3)
);




-- ----------------------------------------------------------------------------
-- 2. DATA MANIPULATION LANGUAGE (DML) - INSERT DATA AWAL (SEEDING)
-- ----------------------------------------------------------------------------

-- A. Masukkan Data Master Lapangan (2 Futsal + 3 Badminton)
INSERT INTO courts (id, name, type, price_per_hour, status) VALUES
('court-futsal-1', 'Lapangan Futsal A (Rumah Sintetis Pro)', 'futsal', 150000, 'tersedia'),
('court-futsal-2', 'Lapangan Futsal B (Interlock Vinyl Tournament)', 'futsal', 130000, 'tersedia'),
('court-badminton-1', 'Lapangan Badminton 1 (Karpet Yonex Green)', 'badminton', 50000, 'tersedia'),
('court-badminton-2', 'Lapangan Badminton 2 (Karpet Yonex Green)', 'badminton', 50000, 'tersedia'),
('court-badminton-3', 'Lapangan Badminton 3 (Lantai Kayu Pro Grade)', 'badminton', 45000, 'perbaikan');

-- B. Masukkan Data Akun (1 Admin + 3 Pelanggan Terdaftar)
INSERT INTO users (id, name, email, phone, password, role, is_blocked, created_at) VALUES
('user-admin-01', 'Super Administrator', 'admin@smsport.id', '081234567890', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewe0uG.wD0R4Wv5W', 'admin', false, NOW()),
('user-cust-01', 'Rizky Rachma', 'rizky@gmail.com', '089876543210', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewe0uG.wD0R4Wv5W', 'customer', false, NOW()),
('user-cust-02', 'Budi Santoso', 'budi.santoso@yahoo.com', '085612345678', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewe0uG.wD0R4Wv5W', 'customer', false, NOW()),
('user-cust-03', 'Siti Aminah', 'siti.aminah@outlook.com', '087711223344', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewe0uG.wD0R4Wv5W', 'customer', false, NOW());

-- C. Masukkan Sampel Data Reservasi & Pembayaran
INSERT INTO bookings (id, user_id, court_id, booking_date, start_time, end_time, total_price, status, created_at) VALUES
('book-sample-01', 'user-cust-01', 'court-futsal-1', CURRENT_DATE + INTERVAL '1 day', '10:00:00+07', '12:00:00+07', 300000, 'paid', NOW() - INTERVAL '2 hours'),
('book-sample-02', 'user-cust-02', 'court-badminton-1', CURRENT_DATE + INTERVAL '1 day', '15:00:00+07', '17:00:00+07', 100000, 'pending', NOW() - INTERVAL '5 minutes');

INSERT INTO payments (id, booking_id, payment_method, amount, proof_url, payment_status, paid_at) VALUES
('pay-sample-01', 'book-sample-01', 'QRIS (Gateway)', 300000, '/proofs/qris_book_01.jpg', 'verified', NOW() - INTERVAL '1 hour 50 minutes');
