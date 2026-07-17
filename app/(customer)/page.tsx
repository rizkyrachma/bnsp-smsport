import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { COURT_IMAGES, BRAND_INFO } from "@/lib/assets";
import CourtSection from "./_components/CourtSection";
import ClientNavbar from "./_components/ClientNavbar";
import { getSession } from "@/lib/auth";

/**
 * Customer Home / Marketing Landing Page (AGENTS.md §6.1)
 * Rendered as a Server Component.
 * Uses DESIGN.md tokens & visual guidelines (white-canvas, Carbon text, Lavender CTA, pill radius).
 */
export default async function CustomerHomePage() {
  // Query real stats from database via Prisma (§6.1 #5 & §6.1 rule 2) plus current session
  const [totalCourts, totalCustomers, totalBookings, dbCourts, session] = await Promise.all([
    prisma.court.count(),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.booking.count({ where: { status: "paid" } }),
    prisma.court.findMany({ orderBy: { type: "asc" } }),
    getSession(),
  ]);

  // Group courts by type to calculate starting/average prices if available from DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const futsalCourts = dbCourts.filter((c: any) => c.type === "futsal");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const badmintonCourts = dbCourts.filter((c: any) => c.type === "badminton");

  const futsalPrice =
    futsalCourts.length > 0 ? futsalCourts[0].pricePerHour : 150000;
  const badmintonPrice =
    badmintonCourts.length > 0 ? badmintonCourts[0].pricePerHour : 60000;

  return (
    <div className="min-h-screen bg-paper-white text-carbon flex flex-col font-sans">
      {/* 1. NAVBAR (Shared Client Component with smooth scroll to top & session state) */}
      <ClientNavbar activePage="home" initialSession={session} />

      <main className="flex-grow">
        {/* 2. HERO SECTION */}
        <section className="py-20 md:py-28 px-4 text-center max-w-5xl mx-auto">

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-carbon leading-[1.12] max-w-4xl mx-auto">
            {BRAND_INFO.tagline}
          </h1>

          <p className="text-graphite text-base sm:text-lg md:text-xl max-w-2xl mx-auto mt-6 leading-relaxed font-normal">
            Cek ketersediaan lapangan secara real-time, pilih jam mainmu, dan bayar online dalam hitungan detik. Tanpa antre, tanpa tumpang tindih jadwal.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            <Link
              href="/booking"
              className="bg-lavender text-white px-8 py-4 rounded-full font-medium text-sm md:text-base shadow-subtle hover:opacity-95 transition flex items-center gap-2"
            >
              <span>Booking Sekarang</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <a
              href="#info-lapangan"
              className="bg-mist text-graphite border border-fog px-8 py-4 rounded-full font-medium text-sm md:text-base hover:bg-fog/40 transition"
            >
              Lihat Tarif &amp; Fasilitas
            </a>
          </div>

          {/* Decorative Trust Badge */}
          <div className="mt-16 pt-10 border-t border-fog flex flex-wrap items-center justify-center gap-8 text-xs text-ash uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-mint" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Garansi Jadwal 100% Aman
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-mint" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Hold Slot Otomatis 10 Menit
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-mint" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Konfirmasi Pembayaran Cepat
            </span>
          </div>
        </section>

        {/* 3. INFO LAPANGAN (§6.1 #3) */}
        <section id="info-lapangan" className="py-20 bg-linen border-y border-fog px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-carbon tracking-tight">
                Pilihan Lapangan Berkualitas
              </h2>
              <p className="text-graphite mt-3 text-base">
                Fasilitas berstandar turnamen, pencahayaan LED terang, serta area penonton yang nyaman.
              </p>
            </div>

            <CourtSection courts={dbCourts} />
          </div>
        </section>

        {/* 4. KENAPA PILIH KAMI (§6.1 #4) */}
        <section id="keunggulan" className="py-20 px-4 max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-carbon tracking-tight">
              Kenapa Memilih {BRAND_INFO.name}?
            </h2>
            <p className="text-graphite mt-3 text-base">
              Kami merancang sistem dan venue untuk memberikan pengalaman berolahraga terbaik.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Keunggulan 1 */}
            <div className="bg-paper-white border border-fog rounded-2xl p-6 text-center flex flex-col items-center shadow-subtle-2">
              <div className="w-12 h-12 rounded-full bg-lavender/15 text-lavender flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-carbon text-lg mb-2">Booking Online 24 Jam</h3>
              <p className="text-graphite text-sm leading-relaxed">
                Pesan lapangan kapan pun langsung dari smartphone tanpa perlu repot telepon atau menunggu balasan admin.
              </p>
            </div>

            {/* Keunggulan 2 */}
            <div className="bg-paper-white border border-fog rounded-2xl p-6 text-center flex flex-col items-center shadow-subtle-2">
              <div className="w-12 h-12 rounded-full bg-lavender/15 text-lavender flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-carbon text-lg mb-2">Bebas Bentrok Jadwal</h3>
              <p className="text-graphite text-sm leading-relaxed">
                Teknologi proteksi *row-locking* database menjamin jadwal yang sudah kamu pesan tidak akan diduplikasi orang lain.
              </p>
            </div>

            {/* Keunggulan 3 */}
            <div className="bg-paper-white border border-fog rounded-2xl p-6 text-center flex flex-col items-center shadow-subtle-2">
              <div className="w-12 h-12 rounded-full bg-lavender/15 text-lavender flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="font-bold text-carbon text-lg mb-2">Pembayaran Mudah</h3>
              <p className="text-graphite text-sm leading-relaxed">
                Mendukung pembayaran langsung serta fitur penahanan slot otomatis selama 10 menit agar kamu punya waktu bayar.
              </p>
            </div>

            {/* Keunggulan 4 */}
            <div className="bg-paper-white border border-fog rounded-2xl p-6 text-center flex flex-col items-center shadow-subtle-2">
              <div className="w-12 h-12 rounded-full bg-lavender/15 text-lavender flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-carbon text-lg mb-2">Lokasi Strategis &amp; Nyaman</h3>
              <p className="text-graphite text-sm leading-relaxed">
                Berada di pusat kota dengan parkir luas, kantin bersih, mushola, dan ruang ganti pemain yang nyaman.
              </p>
            </div>
          </div>
        </section>

        {/* 5. STATISTIK ASLI DARI DATABASE (§6.1 #5 & §6.1 rule 2) */}
        <section className="py-16 bg-linen border-y border-fog px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-ash block mb-1">
                Transparansi Data Real-Time
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-carbon">
                Statistik {BRAND_INFO.name} Saat Ini
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-paper-white border border-fog rounded-2xl p-6 text-center shadow-subtle">
                <span className="text-4xl sm:text-5xl font-black text-carbon block mb-2">
                  {totalCourts}
                </span>
                <span className="text-sm font-medium text-graphite">Total Lapangan Aktif</span>
                <span className="text-xs text-mint block mt-1">Futsal &amp; Badminton</span>
              </div>

              <div className="bg-paper-white border border-fog rounded-2xl p-6 text-center shadow-subtle">
                <span className="text-4xl sm:text-5xl font-black text-carbon block mb-2">
                  {totalCustomers}
                </span>
                <span className="text-sm font-medium text-graphite">Pelanggan Terdaftar</span>
                <span className="text-xs text-ash block mt-1">Sistem member online</span>
              </div>

              <div className="bg-paper-white border border-fog rounded-2xl p-6 text-center shadow-subtle">
                <span className="text-4xl sm:text-5xl font-black text-carbon block mb-2">
                  {totalBookings}
                </span>
                <span className="text-sm font-medium text-graphite">Sesi Booking Selesai</span>
                <span className="text-xs text-ash block mt-1">Diverifikasi &amp; dibayar</span>
              </div>
            </div>
          </div>
        </section>

        {/* 6. TESTIMONI PELANGGAN (§6.1 #6) */}
        <section className="py-20 px-4 max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-carbon tracking-tight">
              Kata Mereka yang Sudah Bermain
            </h2>
            <p className="text-graphite mt-3 text-base">
              Pengalaman bermain di lapangan interlock dan badminton kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-paper-white border border-fog rounded-2xl p-8 shadow-subtle-2 flex flex-col justify-between">
              <p className="text-graphite text-sm italic leading-relaxed mb-6">
                &ldquo;Booking lewat web ini gampang banget! Gak perlu waswas bentrok jadwal pas sampai lokasi karena langsung terkunci otomatis waktu klik pesan.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-lavender/20 text-lavender font-bold flex items-center justify-center text-sm">
                  R
                </div>
                <div>
                  <h4 className="font-bold text-carbon text-sm">Rizky Pratama</h4>
                  <span className="text-xs text-ash">Kapten Tim Futsal FC</span>
                </div>
              </div>
            </div>

            <div className="bg-paper-white border border-fog rounded-2xl p-8 shadow-subtle-2 flex flex-col justify-between">
              <p className="text-graphite text-sm italic leading-relaxed mb-6">
                &ldquo;Karpet badmintonnya empuk dan gak licin sama sekali. Lampu LED-nya juga pas banget terang tanpa bikin silau waktu smash bola tinggi.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-iris/20 text-iris font-bold flex items-center justify-center text-sm">
                  D
                </div>
                <div>
                  <h4 className="font-bold text-carbon text-sm">Diana Novita</h4>
                  <span className="text-xs text-ash">Komunitas Badminton Weekend</span>
                </div>
              </div>
            </div>

            <div className="bg-paper-white border border-fog rounded-2xl p-8 shadow-subtle-2 flex flex-col justify-between">
              <p className="text-graphite text-sm italic leading-relaxed mb-6">
                &ldquo;Sistem hold slot 10 menitnya sangat membantu saat harus koordinasi udunan dulu sama teman-teman tim sebelum transfer pembayaran.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-mint/20 text-mint font-bold flex items-center justify-center text-sm">
                  A
                </div>
                <div>
                  <h4 className="font-bold text-carbon text-sm">Ahmad Fauzi</h4>
                  <span className="text-xs text-ash">Pelanggan Setia Mingguan</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. CTA BANNER (§6.1 #7) */}
        <section className="py-10 px-4 max-w-5xl mx-auto mb-16">
          <div className="bg-carbon text-paper-white rounded-3xl p-10 md:p-16 text-center shadow-subtle-3 relative overflow-hidden border border-fog">
            {/* Decorative Shimmer Ring */}
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-lavender/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-sky/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-[#60b8f0] block mb-3">
                Jangan Sampai Kehabisan Slot
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
                Siap Bertanding di Lapangan Hari Ini?
              </h2>
              <p className="text-ash text-base md:text-lg mb-8">
                Pilih jadwal bertandingmu sekarang, amankan slot favoritmu, dan tunjukkan aksi terbaik timmu di atas lapangan.
              </p>
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 bg-lavender text-white px-8 py-4 rounded-full font-medium text-sm md:text-base shadow-subtle hover:opacity-95 transition"
              >
                <span>Booking Lapangan Sekarang</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 8. FOOTER (§6.1 #8) */}
      <footer id="kontak" className="bg-linen border-t border-fog py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-carbon tracking-tight mb-4">
              <span className="w-8 h-8 rounded-full bg-lavender text-white flex items-center justify-center font-black text-sm">
                SM
              </span>
              <span>{BRAND_INFO.name}</span>
            </Link>
            <p className="text-graphite text-xs leading-relaxed mb-4">
              Pusat penyewaan lapangan futsal interlock profesional dan lapangan badminton vinyl berkualitas berstandar turnamen.
            </p>
            <p className="text-ash text-xs">
              &copy; {new Date().getFullYear()} {BRAND_INFO.name}. All rights reserved.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-carbon text-sm mb-4">Menu Navigasi</h4>
            <ul className="space-y-2 text-sm text-graphite">
              <li><Link href="/" className="hover:text-carbon transition">Beranda</Link></li>
              <li><Link href="/booking" className="hover:text-carbon transition">Jadwal &amp; Booking</Link></li>
              <li><a href="#info-lapangan" className="hover:text-carbon transition">Info Lapangan</a></li>
              <li><a href="#keunggulan" className="hover:text-carbon transition">Keunggulan Kami</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-carbon text-sm mb-4">Akses Akun</h4>
            <ul className="space-y-2 text-sm text-graphite">
              <li><Link href="/login" className="hover:text-carbon transition">Masuk Akun</Link></li>
              <li><Link href="/login" className="hover:text-carbon transition">Daftar Pelanggan Baru</Link></li>
              <li><Link href="/admin/login" className="hover:text-carbon transition">Portal Admin</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-carbon text-sm mb-4">Jam &amp; Kontak Operasional</h4>
            <ul className="space-y-2 text-sm text-graphite">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-ash" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{BRAND_INFO.operatingHours}</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-ash" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{BRAND_INFO.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-ash" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Telepon/WA: {BRAND_INFO.phone}</span>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
