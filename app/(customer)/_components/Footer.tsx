"use client";

import Link from "next/link";
import { BRAND_INFO } from "@/lib/assets";

export default function FlySmartFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="kontak" className="bg-carbon text-paper-white pt-16 pb-12 border-t border-fog/20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-14 border-b border-paper-white/10">
          {/* Column 1: Brand + Short Desc + Social Media Icons (lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div>
              <Link href="/" className="flex items-center gap-2.5 font-black text-xl text-white tracking-tight mb-4">
                <span className="w-9 h-9 rounded-full bg-lavender text-white flex items-center justify-center font-black text-sm shadow-subtle border border-white/20">
                  SM
                </span>
                <span>{BRAND_INFO.name}</span>
              </Link>
              <p className="text-paper-white/80 text-xs sm:text-sm leading-relaxed max-w-sm mb-6">
                Pusat penyewaan lapangan futsal interlock profesional dan lapangan badminton vinyl berkualitas turnamen. Reservasi real-time 100% bebas bentrok.
              </p>
            </div>

            {/* Social Media Pills */}
            <div className="flex items-center gap-3">
              <a
                href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${encodeURIComponent("Halo Admin SM Sport Center, saya ingin bertanya terkait jadwal dan reservasi.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-paper-white/10 hover:bg-[#25D366] hover:text-white text-paper-white transition flex items-center justify-center"
                title="WhatsApp Admin"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M11.996 0C5.372 0 0 5.373 0 11.998c0 2.115.552 4.18 1.602 6.002L.052 24l6.16-1.616a11.954 11.954 0 005.784 1.488h.005c6.624 0 11.996-5.373 11.996-11.998A11.996 11.996 0 0011.996 0zM11.996 21.84h-.004a9.96 9.96 0 01-5.075-1.385l-.364-.216-3.771.989 1.006-3.673-.237-.377a9.957 9.957 0 01-1.523-5.26c0-5.49 4.467-9.958 9.968-9.958 2.662 0 5.163 1.037 7.045 2.92 1.882 1.883 2.918 4.383 2.918 7.046 0 5.491-4.468 9.959-9.963 9.959zm5.464-7.464c-.299-.15-1.768-.872-2.042-.971-.274-.1-.474-.15-.674.15-.2.299-.773.971-.948 1.171-.174.199-.349.224-.648.075-.299-.15-1.261-.465-2.401-1.482-.888-.792-1.488-1.77-1.662-2.07-.174-.299-.019-.461.131-.611.135-.135.299-.35.449-.524.15-.175.2-.299.299-.499.1-.199.05-.374-.025-.524-.075-.15-.674-1.623-.923-2.223-.243-.585-.49-.505-.674-.514-.174-.009-.374-.009-.574-.009-.2 0-.524.075-.798.374-.274.299-1.048 1.024-1.048 2.498 0 1.474 1.073 2.897 1.223 3.097.15.199 2.112 3.224 5.116 4.521.715.309 1.273.493 1.708.631.718.228 1.371.196 1.888.119.578-.086 1.768-.722 2.017-1.421.249-.699.249-1.298.174-1.421-.074-.124-.274-.199-.573-.349z" />
                </svg>
              </a>

              <a
                href="#kontak"
                className="w-9 h-9 rounded-full bg-paper-white/10 hover:bg-lavender text-paper-white transition flex items-center justify-center"
                title="Instagram SM Sport Center"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>

              <a
                href="#kontak"
                className="w-9 h-9 rounded-full bg-paper-white/10 hover:bg-lavender text-paper-white transition flex items-center justify-center"
                title="Facebook SM Sport Center"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: "Layanan Kami" (lg:col-span-3) */}
          <div className="lg:col-span-3">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-5 border-l-2 border-lavender pl-3">
              Layanan Kami
            </h3>
            <ul className="space-y-3 text-sm text-paper-white/80">
              <li>
                <Link href="/booking" className="hover:text-white transition flex items-center gap-1.5">
                  <span className="text-xs text-lavender">→</span>
                  <span>Booking Lapangan</span>
                </Link>
              </li>
              <li>
                <Link href="/booking" className="hover:text-white transition flex items-center gap-1.5">
                  <span className="text-xs text-lavender">→</span>
                  <span>Jadwal Real-Time</span>
                </Link>
              </li>
              <li>
                <Link href="/riwayat" className="hover:text-white transition flex items-center gap-1.5">
                  <span className="text-xs text-lavender">→</span>
                  <span>Riwayat &amp; Tiket</span>
                </Link>
              </li>
              <li>
                <a href="#kategori-lapangan" className="hover:text-white transition flex items-center gap-1.5">
                  <span className="text-xs text-lavender">→</span>
                  <span>Tarif &amp; Fasilitas</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: "Info" (lg:col-span-2) */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-5 border-l-2 border-lavender pl-3">
              Info &amp; Bantuan
            </h3>
            <ul className="space-y-3 text-sm text-paper-white/80">
              <li>
                <a href="#keunggulan" className="hover:text-white transition">Tentang Kami</a>
              </li>
              <li>
                <a href="#lapangan-unggulan" className="hover:text-white transition">Arena Unggulan</a>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition">Akses Member</Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-white transition">Portal Admin</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: "Ikuti Kami / Kontak Operasional" (lg:col-span-3) */}
          <div className="lg:col-span-3">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-5 border-l-2 border-lavender pl-3">
              Kontak Operasional
            </h3>
            <ul className="space-y-3.5 text-sm text-paper-white/80">
              <li className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-lavender shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{BRAND_INFO.operatingHours}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-lavender shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{BRAND_INFO.address}</span>
              </li>
              <li className="flex items-center gap-2.5 pt-1">
                <svg className="w-4 h-4 text-[#25D366] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.996 0C5.372 0 0 5.373 0 11.998c0 2.115.552 4.18 1.602 6.002L.052 24l6.16-1.616a11.954 11.954 0 005.784 1.488h.005c6.624 0 11.996-5.373 11.996-11.998A11.996 11.996 0 0011.996 0zM11.996 21.84h-.004a9.96 9.96 0 01-5.075-1.385l-.364-.216-3.771.989 1.006-3.673-.237-.377a9.957 9.957 0 01-1.523-5.26c0-5.49 4.467-9.958 9.968-9.958 2.662 0 5.163 1.037 7.045 2.92 1.882 1.883 2.918 4.383 2.918 7.046 0 5.491-4.468 9.959-9.963 9.959zm5.464-7.464c-.299-.15-1.768-.872-2.042-.971-.274-.1-.474-.15-.674.15-.2.299-.773.971-.948 1.171-.174.199-.349.224-.648.075-.299-.15-1.261-.465-2.401-1.482-.888-.792-1.488-1.77-1.662-2.07-.174-.299-.019-.461.131-.611.135-.135.299-.35.449-.524.15-.175.2-.299.299-.499.1-.199.05-.374-.025-.524-.075-.15-.674-1.623-.923-2.223-.243-.585-.49-.505-.674-.514-.174-.009-.374-.009-.574-.009-.2 0-.524.075-.798.374-.274.299-1.048 1.024-1.048 2.498 0 1.474 1.073 2.897 1.223 3.097.15.199 2.112 3.224 5.116 4.521.715.309 1.273.493 1.708.631.718.228 1.371.196 1.888.119.578-.086 1.768-.722 2.017-1.421.249-.699.249-1.298.174-1.421-.074-.124-.274-.199-.573-.349z" />
                </svg>
                <a
                  href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${encodeURIComponent("Halo Admin SM Sport Center, saya ingin bertanya/konsultasi terkait reservasi lapangan.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition underline decoration-dotted underline-offset-4 text-[#25D366] font-semibold"
                  title="Klik untuk chat langsung ke WhatsApp Admin"
                >
                  Telepon/WA: {BRAND_INFO.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-paper-white/60">
          <p>
            &copy; {currentYear} {BRAND_INFO.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/booking" className="hover:text-white transition">Kebijakan Privasi</Link>
            <Link href="/booking" className="hover:text-white transition">Syarat &amp; Ketentuan</Link>
            <Link href="/booking" className="hover:text-white transition">Keamanan Transaksi</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
