"use client";

import Image from "next/image";
import Link from "next/link";
import { COURT_IMAGES } from "@/lib/assets";

export interface FeaturedCourtData {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
  status: string;
}

interface FeaturedCourtsGridProps {
  courts: FeaturedCourtData[];
}

export default function FeaturedCourtsGrid({ courts }: FeaturedCourtsGridProps) {
  // Take top 3 or default cards if database is empty or has fewer
  const displayCourts = courts.slice(0, 3);

  return (
    <section id="lapangan-unggulan" className="py-20 px-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-ash block mb-2">
            Rekomendasi Arena Pilihan
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-carbon tracking-tight">
            Lapangan Unggulan
          </h2>
          <p className="text-graphite mt-2 text-base max-w-xl">
            Nikmati fasilitas berstandar turnamen, lantai antislip, serta pencahayaan LED terang anti-silau.
          </p>
        </div>

        <Link
          href="/booking"
          className="inline-flex items-center gap-2 bg-mist text-carbon border border-fog px-6 py-3 rounded-full font-bold text-sm hover:bg-lavender hover:text-white transition shadow-subtle shrink-0"
        >
          <span>Lihat Semua Jadwal</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>

      {displayCourts.length === 0 ? (
        <div className="text-center py-16 bg-paper-white border border-fog rounded-3xl p-8 max-w-xl mx-auto">
          <p className="text-graphite">Belum ada data lapangan tersedia saat ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {displayCourts.map((court) => {
            const isFutsal = court.type === "futsal";
            const imageAsset = isFutsal ? COURT_IMAGES.futsal : COURT_IMAGES.badminton;

            return (
              <Link
                key={court.id}
                href={`/booking?courtId=${court.id}`}
                className="group relative rounded-3xl overflow-hidden border border-fog shadow-subtle-3 h-[380px] sm:h-[420px] flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:border-lavender"
              >
                {/* Background Image filling full height */}
                <Image
                  src={imageAsset.url}
                  alt={imageAsset.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* Dark Gradient Overlay (FlySmart Destination Card Style) */}
                <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/30 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

                {/* Top Pill Badges */}
                <div className="relative z-10 p-5 flex items-center justify-between gap-2">
                  <span className="bg-lavender text-white font-bold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-subtle">
                    {court.type}
                  </span>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-subtle ${court.status === "tersedia"
                      ? "bg-paper-white/90 text-mint"
                      : "bg-paper-white/90 text-amber"
                      }`}
                  >
                    {court.status === "tersedia" ? "● Tersedia" : court.status}
                  </span>
                </div>

                {/* Bottom Overlay Content */}
                <div className="relative z-10 p-6 sm:p-7 text-white flex flex-col justify-end">
                  <div className="flex items-end justify-between gap-3 border-b border-paper-white/15 pb-4 mb-4">
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight leading-tight group-hover:text-sky transition-colors">
                        {court.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-paper-white/80 mt-1 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-mint shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>08:00 - 23:00 WIB • LED Pro</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-paper-white/70 uppercase tracking-wider block">
                        Tarif Mulai Dari
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xl sm:text-2xl font-black text-white">
                          Rp {court.pricePerHour.toLocaleString("id-ID")}
                        </span>
                        <span className="text-xs text-paper-white/70">/ jam</span>
                      </div>
                    </div>

                    <span className="w-10 h-10 rounded-full bg-paper-white/10 backdrop-blur-md text-white flex items-center justify-center group-hover:bg-lavender group-hover:text-white transition">
                      <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
