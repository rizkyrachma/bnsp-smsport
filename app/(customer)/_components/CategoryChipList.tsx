"use client";

import Link from "next/link";

interface CategoryChip {
  id: string;
  name: string;
  badge: string;
  iconType: "futsal" | "badminton" | "event";
  link: string;
}

const CATEGORY_CHIPS: CategoryChip[] = [
  {
    id: "futsal-interlock",
    name: "Futsal Interlock Pro",
    badge: "Turnamen Internasional",
    iconType: "futsal",
    link: "/booking?type=futsal",
  },
  {
    id: "futsal-vinyl",
    name: "Futsal Vinyl Indoor",
    badge: "Anti-Slip Cengkeram Kuat",
    iconType: "futsal",
    link: "/booking?type=futsal",
  },
  {
    id: "badminton-a",
    name: "Badminton Court A",
    badge: "Karpet Vinyl Standar BWF",
    iconType: "badminton",
    link: "/booking?type=badminton",
  },
  {
    id: "badminton-b",
    name: "Badminton Court B",
    badge: "Pencahayaan LED Anti-Silau",
    iconType: "badminton",
    link: "/booking?type=badminton",
  },
  {
    id: "badminton-c",
    name: "Badminton Court C",
    badge: "Sirkulasi Udara & Ruang Luas",
    iconType: "badminton",
    link: "/booking?type=badminton",
  },

];

export default function CategoryChipList() {
  return (
    <section id="kategori-lapangan" className="py-16 bg-linen border-y border-fog px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-ash block mb-2">
            Pilihan Spesifikasi Arena
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-carbon tracking-tight">
            Kategori Lapangan Berkualitas
          </h2>
          <p className="text-graphite mt-2 text-base">
            Temukan tipe arena berstandar profesional yang sesuai dengan kebutuhan latihan, sparring, maupun turnamenmu.
          </p>
        </div>

        {/* Horizontal Chips / Rows (FlySmart Airline Chips Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORY_CHIPS.map((chip) => (
            <Link
              key={chip.id}
              href={chip.link}
              className="bg-paper-white border border-fog rounded-full p-4 sm:px-6 sm:py-4 shadow-subtle flex items-center justify-between gap-4 hover:border-lavender hover:shadow-subtle-2 transition group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-lavender/10 text-lavender flex items-center justify-center shrink-0 group-hover:bg-lavender group-hover:text-white transition-colors">
                  {chip.iconType === "futsal" && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                  )}
                  {chip.iconType === "badminton" && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  {chip.iconType === "event" && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  )}
                </div>
                <div className="truncate">
                  <h3 className="font-bold text-carbon text-sm group-hover:text-lavender transition-colors truncate">
                    {chip.name}
                  </h3>
                  <span className="text-xs text-ash block truncate">
                    {chip.badge}
                  </span>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-mist text-graphite flex items-center justify-center shrink-0 group-hover:bg-lavender/10 group-hover:text-lavender transition-colors">
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
