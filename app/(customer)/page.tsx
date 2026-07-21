import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BRAND_INFO } from "@/lib/assets";
import ClientNavbar from "./_components/ClientNavbar";
import { getSession } from "@/lib/auth";
import HeroQuickSearch from "./_components/HeroQuickSearch";
import FeaturedCourtsGrid from "./_components/FeaturedCourtsGrid";
import FlySmartFooter from "./_components/Footer";

/**
 * Customer Home / Marketing Landing Page (AGENTS.md §6.1)
 * Redesigned with FlySmart-inspired dynamic layout & asymmetric composition.
 * Retains SM Sport Center design tokens (Navy primary, White canvas, Carbon text, Pill radius).
 */
export default async function CustomerHomePage() {
  // Query real stats from database via Prisma plus current session
  const [totalCourts, totalCustomers, totalBookings, dbCourts, session] = await Promise.all([
    prisma.court.count(),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.booking.count({ where: { status: "paid" } }),
    prisma.court.findMany({ orderBy: { type: "asc" } }),
    getSession(),
  ]);

  return (
    <div className="min-h-screen bg-paper-white text-carbon flex flex-col font-sans">
      {/* 1. NAVBAR (Shared Client Component with smooth scroll & session state) */}
      <ClientNavbar activePage="home" initialSession={session} />

      <main className="flex-grow">
        {/* 2. HERO SECTION (Split Asymmetric Hero + Embedded Search Widget + Trust Badges + Offset Promo) */}
        <HeroQuickSearch courts={dbCourts} />

        {/* 3. FEATURED COURTS GRID (FlySmart "Explore Top Destinations" 3-card style) */}
        <FeaturedCourtsGrid courts={dbCourts} />

        {/* 5. WHY CHOOSE US (Keunggulan SM Sport Center) */}
        <section id="keunggulan" className="py-20 px-4 max-w-6xl mx-auto border-t border-fog/60">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-ash block mb-2">
              Kualitas &amp; Kenyamanan Terjamin
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-carbon tracking-tight">
              Kenapa Memilih {BRAND_INFO.name}?
            </h2>
            <p className="text-graphite mt-3 text-base">
              Kami memadukan sistem reservasi modern dan fasilitas arena berstandar profesional untuk performa bertanding maksimal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Keunggulan 1 */}
            <div className="bg-paper-white border border-fog rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center shadow-subtle hover:border-lavender hover:shadow-subtle-3 transition">
              <div className="w-14 h-14 rounded-full bg-lavender/10 text-lavender flex items-center justify-center mb-5">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-carbon text-lg mb-2">Booking Online 24 Jam</h3>
              <p className="text-graphite text-sm leading-relaxed">
                Pesan lapangan kapan pun langsung dari smartphone tanpa perlu repot telepon atau menunggu balasan admin.
              </p>
            </div>

            {/* Keunggulan 2 */}
            <div className="bg-paper-white border border-fog rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center shadow-subtle hover:border-lavender hover:shadow-subtle-3 transition">
              <div className="w-14 h-14 rounded-full bg-lavender/10 text-lavender flex items-center justify-center mb-5">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-carbon text-lg mb-2">Bebas Bentrok Jadwal</h3>
              <p className="text-graphite text-sm leading-relaxed">
                Proteksi *row-locking* database &amp; hold slot otomatis menjamin jadwal yang kamu pesan tidak akan diduplikasi orang lain.
              </p>
            </div>

            {/* Keunggulan 3 */}
            <div className="bg-paper-white border border-fog rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center shadow-subtle hover:border-lavender hover:shadow-subtle-3 transition">
              <div className="w-14 h-14 rounded-full bg-lavender/10 text-lavender flex items-center justify-center mb-5">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="font-bold text-carbon text-lg mb-2">Pembayaran Mudah</h3>
              <p className="text-graphite text-sm leading-relaxed">
                Mendukung verifikasi pembayaran instan serta penahanan slot otomatis 10 menit agar kamu leluasa berkoordinasi.
              </p>
            </div>

            {/* Keunggulan 4 */}
            <div className="bg-paper-white border border-fog rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center shadow-subtle hover:border-lavender hover:shadow-subtle-3 transition">
              <div className="w-14 h-14 rounded-full bg-lavender/10 text-lavender flex items-center justify-center mb-5">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-carbon text-lg mb-2">Lokasi Strategis &amp; Nyaman</h3>
              <p className="text-graphite text-sm leading-relaxed">
                Berada di pusat kota dengan parkir luas, kantin bersih, mushola, dan ruang ganti pemain berpendingin udara.
              </p>
            </div>
          </div>
        </section>

        {/* 6. REAL-TIME STATS FROM DATABASE (§6.1 #5) */}
        <section className="py-16 bg-linen border-y border-fog px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-ash block mb-1">
                Transparansi Data Real-Time
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-carbon">
                Statistik {BRAND_INFO.name} Saat Ini
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-paper-white border border-fog rounded-3xl p-8 text-center shadow-subtle hover:border-lavender transition">
                <span className="text-4xl sm:text-5xl font-black text-carbon block mb-2">
                  {totalCourts}
                </span>
                <span className="text-sm font-bold text-graphite">Total Lapangan Aktif</span>
                <span className="text-xs text-mint font-semibold block mt-1.5">● Futsal &amp; Badminton</span>
              </div>

              <div className="bg-paper-white border border-fog rounded-3xl p-8 text-center shadow-subtle hover:border-lavender transition">
                <span className="text-4xl sm:text-5xl font-black text-carbon block mb-2">
                  {totalCustomers}
                </span>
                <span className="text-sm font-bold text-graphite">Pelanggan Terdaftar</span>
                <span className="text-xs text-ash block mt-1.5">Komunitas &amp; member online</span>
              </div>

              <div className="bg-paper-white border border-fog rounded-3xl p-8 text-center shadow-subtle hover:border-lavender transition">
                <span className="text-4xl sm:text-5xl font-black text-carbon block mb-2">
                  {totalBookings}
                </span>
                <span className="text-sm font-bold text-graphite">Sesi Booking Selesai</span>
                <span className="text-xs text-ash block mt-1.5">Terverifikasi &amp; berjalan lancar</span>
              </div>
            </div>
          </div>
        </section>

        {/* 7. CTA BANNER */}
        <section className="py-16 px-4 max-w-6xl mx-auto">
          <div className="bg-carbon text-paper-white rounded-3xl p-10 sm:p-16 text-center shadow-subtle-3 relative overflow-hidden border border-fog">
            {/* Decorative Shimmer Rings */}
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-lavender/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-mint/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-[#6ee7b7] bg-mint/20 px-3 py-1 rounded-full border border-mint/30 inline-block mb-4">
                Jangan Sampai Kehabisan Slot Jam Favorit
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-6">
                Siap Bertanding di Lapangan Hari Ini?
              </h2>
              <p className="text-paper-white/95 text-base md:text-lg mb-8 leading-relaxed">
                Amankan slot favoritmu sekarang, kumpulkan timmu, dan tunjukkan aksi terbaik di atas lapangan interlock &amp; vinyl bertaraf nasional.
              </p>
              <Link
                href="/booking"
                className="inline-flex items-center gap-2.5 bg-lavender text-white px-8 py-4 rounded-full font-bold text-sm md:text-base shadow-subtle hover:opacity-95 transition scale-105 hover:scale-110 duration-200"
              >
                <span>Booking Lapangan Sekarang</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 9. FLYSMART FOOTER */}
      <FlySmartFooter />
    </div>
  );
}
