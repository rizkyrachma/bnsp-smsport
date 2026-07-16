/**
 * Asset References & Placeholder Strategy (AGENTS.md §6.2)
 * 
 * Aturan:
 * 1. Foto lapangan menggunakan placeholder dari placehold.co dengan label jelas (bukan foto asli fisik yang belum ada).
 * 2. Ikon & dekorasi menggunakan inline SVG langsung di dalam komponen React.
 * 3. Semua referensi disimpan di sini agar mudah diganti secara massal dengan foto asli venue setelah live.
 */

export const COURT_IMAGES = {
  futsal: {
    url: "https://placehold.co/800x500/181925/918df6?text=Lapangan+Futsal+(Foto+Ilustrasi)",
    alt: "Foto Ilustrasi Lapangan Futsal SM Sport Center",
    caption: "Lapangan interlock standar profesional (Foto Ilustrasi)",
  },
  badminton: {
    url: "https://placehold.co/800x500/fafafa/181925?text=Lapangan+Badminton+(Foto+Ilustrasi)",
    alt: "Foto Ilustrasi Lapangan Badminton SM Sport Center",
    caption: "Karpet vinyl anti-slip spesifikasi turnamen (Foto Ilustrasi)",
  },
  heroBanner: {
    url: "https://placehold.co/1200x600/181925/ffffff?text=SM+Sport+Center+Venue+(Foto+Ilustrasi)",
    alt: "Ilustrasi Venue SM Sport Center",
  },
};

export const BRAND_INFO = {
  name: "SM Sport Center",
  tagline: "Reservasi Lapangan Futsal & Badminton Jadi Mudah",
  address: "Jl. Olahraga No. 88, Kota, Jawa Barat",
  phone: "0812-3456-7890",
  whatsapp: "6281234567890",
  operatingHours: "08:00 - 23:00 WIB (Buka Setiap Hari)",
};
