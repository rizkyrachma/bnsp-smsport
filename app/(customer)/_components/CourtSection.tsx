"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { COURT_IMAGES } from "@/lib/assets";

export type CourtData = {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
  status: string;
};

interface CourtSectionProps {
  courts: CourtData[];
}

export default function CourtSection({ courts }: CourtSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "futsal" | "badminton">("all");

  const filteredCourts = courts.filter((court) => {
    if (selectedCategory === "all") return true;
    return court.type === selectedCategory;
  });

  const futsalCount = courts.filter((c) => c.type === "futsal").length;
  const badmintonCount = courts.filter((c) => c.type === "badminton").length;

  return (
    <div>
      {/* Category Filter Tabs (DESIGN.md Pill Bar) */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`px-6 py-2.5 rounded-full text-sm font-medium transition flex items-center gap-2 shadow-subtle ${
            selectedCategory === "all"
              ? "bg-lavender text-white"
              : "bg-paper-white text-graphite border border-fog hover:text-carbon hover:bg-mist"
          }`}
        >
          <span>Semua Lapangan</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              selectedCategory === "all" ? "bg-white/20 text-white" : "bg-mist text-ash"
            }`}
          >
            {courts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory("futsal")}
          className={`px-6 py-2.5 rounded-full text-sm font-medium transition flex items-center gap-2 shadow-subtle ${
            selectedCategory === "futsal"
              ? "bg-lavender text-white"
              : "bg-paper-white text-graphite border border-fog hover:text-carbon hover:bg-mist"
          }`}
        >
          <span>Futsal</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              selectedCategory === "futsal" ? "bg-white/20 text-white" : "bg-mist text-ash"
            }`}
          >
            {futsalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory("badminton")}
          className={`px-6 py-2.5 rounded-full text-sm font-medium transition flex items-center gap-2 shadow-subtle ${
            selectedCategory === "badminton"
              ? "bg-lavender text-white"
              : "bg-paper-white text-graphite border border-fog hover:text-carbon hover:bg-mist"
          }`}
        >
          <span>Badminton</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              selectedCategory === "badminton" ? "bg-white/20 text-white" : "bg-mist text-ash"
            }`}
          >
            {badmintonCount}
          </span>
        </button>
      </div>

      {/* Courts Grid */}
      {filteredCourts.length === 0 ? (
        <div className="text-center py-16 bg-paper-white border border-fog rounded-3xl p-8 max-w-xl mx-auto">
          <p className="text-graphite">Tidak ada lapangan pada kategori ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourts.map((court) => {
            const isFutsal = court.type === "futsal";
            const imageAsset = isFutsal ? COURT_IMAGES.futsal : COURT_IMAGES.badminton;

            return (
              <div
                key={court.id}
                className="bg-paper-white border border-fog rounded-3xl overflow-hidden shadow-subtle-3 flex flex-col transition hover:border-lavender/60"
              >
                <div className="relative h-56 w-full bg-carbon/5">
                  <Image
                    src={imageAsset.url}
                    alt={imageAsset.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
                    <span className="bg-paper-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-carbon border border-fog shadow-subtle uppercase tracking-wider">
                      {court.type}
                    </span>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold shadow-subtle ${
                        court.status === "tersedia"
                          ? "bg-mint-wash text-mint border border-mint/20"
                          : "bg-amber/15 text-amber border border-amber/20"
                      }`}
                    >
                      {court.status === "tersedia" ? "● Tersedia" : court.status}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-xl font-bold text-carbon leading-snug">
                        {court.name}
                      </h3>
                    </div>

                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-2xl font-black text-carbon">
                        Rp {court.pricePerHour.toLocaleString("id-ID")}
                      </span>
                      <span className="text-xs text-ash">/ jam</span>
                    </div>

                    <p className="text-graphite text-xs leading-relaxed mb-6">
                      {imageAsset.caption}. Spesifikasi pencahayaan LED terang anti-silau serta sirkulasi udara optimal.
                    </p>
                  </div>

                  <Link
                    href={`/booking?courtId=${court.id}`}
                    className="w-full bg-mist hover:bg-lavender hover:text-white text-carbon border border-fog py-3 rounded-full font-medium text-sm text-center transition shadow-subtle block"
                  >
                    Booking Lapangan Ini
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
