"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { COURT_IMAGES, BRAND_INFO } from "@/lib/assets";

export interface CourtOption {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
}

interface HeroQuickSearchProps {
  courts: CourtOption[];
}

export default function HeroQuickSearch({ courts }: HeroQuickSearchProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<"all" | "futsal" | "badminton">("all");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    // YYYY-MM-DD local time
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("18:00");
  const [activeSlide, setActiveSlide] = useState<"futsal" | "badminton">("futsal");

  useEffect(() => {
    if (selectedType === "futsal") {
      setActiveSlide("futsal");
      return;
    }
    if (selectedType === "badminton") {
      setActiveSlide("badminton");
      return;
    }
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev === "futsal" ? "badminton" : "futsal"));
    }, 4500);
    return () => clearInterval(timer);
  }, [selectedType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedType !== "all") {
      params.set("type", selectedType);
    }
    if (selectedDate) {
      params.set("date", selectedDate);
    }
    router.push(`/booking?${params.toString()}`);
  };

  return (
    <section className="relative pt-12 pb-24 md:pt-16 md:pb-32 px-4 overflow-hidden border-b border-fog bg-paper-white">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-lavender/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-mint/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
        {/* LEFT COLUMN: Headline + Subheadline + Embedded Search Widget + Trust Badges */}
        <div className="lg:col-span-7 flex flex-col text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-carbon leading-[1.1] mb-6">
            {BRAND_INFO.tagline}
          </h1>

          <p className="text-graphite text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl mb-8">
            Cek ketersediaan lapangan real-time, pilih jam main favoritmu, dan amankan slot tanding dalam hitungan detik. Tanpa antre, 100% anti bentrok jadwal.
          </p>

          {/* EMBEDDED SEARCH WIDGET (FlySmart Flight Finder Style) */}
          <div className="bg-paper-white border border-fog rounded-3xl p-6 sm:p-8 shadow-subtle-3 mb-8 relative">
            {/* Widget Tabs (Futsal vs Badminton vs Semua) */}
            <div className="flex flex-wrap items-center gap-2 pb-6 border-b border-fog mb-6">
              <button
                type="button"
                onClick={() => setSelectedType("all")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${selectedType === "all"
                  ? "bg-lavender text-white shadow-subtle"
                  : "bg-mist text-graphite hover:bg-fog/60 hover:text-carbon"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span>Semua Lapangan</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedType("futsal")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${selectedType === "futsal"
                  ? "bg-lavender text-white shadow-subtle"
                  : "bg-mist text-graphite hover:bg-fog/60 hover:text-carbon"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
                <span>Futsal</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedType("badminton")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${selectedType === "badminton"
                  ? "bg-lavender text-white shadow-subtle"
                  : "bg-mist text-graphite hover:bg-fog/60 hover:text-carbon"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Badminton</span>
              </button>
            </div>

            {/* Form Inputs Grid */}
            <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
              {/* Jenis Lapangan / Info */}
              <div className="sm:col-span-4">
                <label htmlFor="quick-search-category" className="block text-xs font-bold uppercase tracking-wider text-ash mb-2">
                  1. Kategori Lapangan
                </label>
                <div className="relative">
                  <select
                    id="quick-search-category"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as any)}
                    className="w-full bg-mist border border-fog rounded-2xl px-4 py-3.5 text-sm font-semibold text-carbon focus:outline-none focus:ring-2 focus:ring-lavender appearance-none cursor-pointer"
                  >
                    <option value="all">Futsal &amp; Badminton ({courts.length} Lapangan)</option>
                    <option value="futsal">Futsal</option>
                    <option value="badminton">Badminton</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ash">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Tanggal Main */}
              <div className="sm:col-span-4">
                <label htmlFor="quick-search-date" className="block text-xs font-bold uppercase tracking-wider text-ash mb-2">
                  2. Tanggal Bermain
                </label>
                <div className="relative">
                  <input
                    id="quick-search-date"
                    type="date"
                    value={selectedDate}
                    min={(() => {
                      const d = new Date();
                      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    })()}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-mist border border-fog rounded-2xl px-4 py-3 text-sm font-semibold text-carbon focus:outline-none focus:ring-2 focus:ring-lavender cursor-pointer"
                  />
                </div>
              </div>

              {/* Jam Estimasi / Slot */}
              <div className="sm:col-span-4 sm:hidden md:block md:col-span-4">
                <label htmlFor="quick-search-timeslot" className="block text-xs font-bold uppercase tracking-wider text-ash mb-2">
                  3. Jam Bertanding
                </label>
                <div className="relative">
                  <select
                    id="quick-search-timeslot"
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    className="w-full bg-mist border border-fog rounded-2xl px-4 py-3.5 text-sm font-semibold text-carbon focus:outline-none focus:ring-2 focus:ring-lavender appearance-none cursor-pointer"
                  >
                    <option value="08:00">Pagi (08:00 - 12:00)</option>
                    <option value="13:00">Siang (13:00 - 17:00)</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ash">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Search Submit Button */}
              <div className="sm:col-span-12 mt-2">
                <button
                  type="submit"
                  className="w-full bg-lavender text-white px-8 py-4 rounded-full font-bold text-sm sm:text-base shadow-subtle hover:opacity-95 transition flex items-center justify-center gap-2.5 group cursor-pointer"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Cari &amp; Pesan Jadwal Sekarang</span>
                </button>
              </div>
            </form>
          </div>

          {/* INTEGRATED TRUST BADGES ROW (Under Search Widget) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2.5 bg-linen border border-fog px-4 py-3 rounded-full text-xs font-semibold text-graphite">
              <span className="w-6 h-6 rounded-full bg-mint-wash text-mint flex items-center justify-center shrink-0 font-bold">
                ✓
              </span>
              <span>Garansi Jadwal 100% Aman</span>
            </div>

            <div className="flex items-center gap-2.5 bg-linen border border-fog px-4 py-3 rounded-full text-xs font-semibold text-graphite">
              <span className="w-6 h-6 rounded-full bg-mint-wash text-mint flex items-center justify-center shrink-0 font-bold">
                ⏱
              </span>
              <span>Hold Slot Otomatis 10 Menit</span>
            </div>

            <div className="flex items-center gap-2.5 bg-linen border border-fog px-4 py-3 rounded-full text-xs font-semibold text-graphite">
              <span className="w-6 h-6 rounded-full bg-mint-wash text-mint flex items-center justify-center shrink-0 font-bold">
                ⚡
              </span>
              <span>Konfirmasi Pembayaran Cepat</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Visual Element + Offset Promo Panel (FlySmart Asymmetry) */}
        <div className="lg:col-span-5 relative flex flex-col items-center lg:items-end">
          {/* Main Hero Visual Card with Slideshow & Navigation */}
          <div className="relative w-full max-w-lg rounded-3xl overflow-hidden border-4 border-paper-white shadow-subtle-3 bg-carbon/5 aspect-[4/3] sm:aspect-[16/11] group">
            {/* Futsal Image */}
            <div
              className={`absolute inset-0 transition-opacity duration-700 ${activeSlide === "futsal" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
            >
              <Image
                src={COURT_IMAGES.futsal.url}
                alt={COURT_IMAGES.futsal.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                priority
              />
            </div>

            {/* Badminton Image */}
            <div
              className={`absolute inset-0 transition-opacity duration-700 ${activeSlide === "badminton" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
            >
              <Image
                src={COURT_IMAGES.badminton.url}
                alt={COURT_IMAGES.badminton.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                priority
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-carbon/80 via-carbon/20 to-transparent z-15 pointer-events-none" />

            {/* Slide Navigation Buttons (< / >) */}
            <button
              type="button"
              onClick={() => setActiveSlide((prev) => (prev === "futsal" ? "badminton" : "futsal"))}
              aria-label="Slide Sebelumnya"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-paper-white/20 hover:bg-paper-white/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Slide Sebelumnya"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setActiveSlide((prev) => (prev === "futsal" ? "badminton" : "futsal"))}
              aria-label="Slide Berikutnya"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-paper-white/20 hover:bg-paper-white/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Slide Berikutnya"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Caption & Indicators */}
            <div className="absolute bottom-5 left-6 right-6 text-white z-20 flex items-end justify-between gap-4">
              <div>
                <span className="bg-lavender text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                  {activeSlide === "futsal" ? "Arena Futsal" : "Arena Badminton"}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold mt-2 leading-tight">
                  {activeSlide === "futsal" ? "Standar Turnamen Internasional" : "Karpet Vinyl Standar BWF"}
                </h2>
                <p className="text-xs sm:text-sm text-paper-white/80 mt-1">
                  {activeSlide === "futsal"
                    ? "Lantai interlock antislip berdaya cengkeram tinggi."
                    : "Lantai empuk anti-licin dengan lampu LED anti-silau."}
                </p>
              </div>

              {/* Dot indicators */}
              <div className="flex items-center gap-1.5 pb-1">
                <button
                  type="button"
                  onClick={() => setActiveSlide("futsal")}
                  aria-label="Slide 1 dari 2: Foto Futsal"
                  className="p-3 -m-3 cursor-pointer flex items-center justify-center"
                >
                  <span
                    className={`h-2 rounded-full transition-all block ${activeSlide === "futsal" ? "w-6 bg-mint" : "w-2 bg-white/40 hover:bg-white/70"
                      }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlide("badminton")}
                  aria-label="Slide 2 dari 2: Foto Badminton"
                  className="p-3 -m-3 cursor-pointer flex items-center justify-center"
                >
                  <span
                    className={`h-2 rounded-full transition-all block ${activeSlide === "badminton" ? "w-6 bg-mint" : "w-2 bg-white/40 hover:bg-white/70"
                      }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Live Court Status Badge (Pojok kanan atas visual) */}
          <div className="hidden sm:flex items-center gap-2.5 bg-paper-white/95 backdrop-blur-md border border-fog rounded-full px-4 py-2.5 shadow-subtle-2 absolute -top-5 right-4 z-20">
            <span className="w-2.5 h-2.5 rounded-full bg-mint animate-ping" />
            <span className="text-xs font-bold text-carbon">
              Jadwal Hari Ini: <span className="text-mint">Real-Time Terbuka</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
