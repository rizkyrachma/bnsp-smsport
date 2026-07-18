"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { BRAND_INFO } from "@/lib/assets";

interface ClientNavbarProps {
  activePage?: "home" | "booking" | "riwayat";
  initialSession?: { id: string; name: string; email: string; role: string } | null;
}

export default function ClientNavbar({ activePage = "home", initialSession = null }: ClientNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState(initialSession);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!initialSession) {
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((data) => {
          setSession(data.session || null);
        })
        .catch(() => {
          setSession(null);
        });
    }
  }, [initialSession]);

  // Tutup mobile menu ketika pindah rute
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    window.location.href = "/";
  };

  const handleBerandaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setIsMobileMenuOpen(false);
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-paper-white/95 backdrop-blur-md border-b border-fog shadow-subtle">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={handleBerandaClick}
          className="flex items-center gap-1.5 font-black text-lg text-[#1A237E] tracking-tight shrink-0"
        >
          <Image src="/images/logo.png" alt="SM Sports Logo" width={44} height={44} className="object-contain" priority />
          <span>{BRAND_INFO.name}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            href="/"
            onClick={handleBerandaClick}
            className={`transition ${activePage === "home" ? "text-lavender font-bold" : "text-graphite hover:text-carbon"}`}
          >
            Beranda
          </Link>
          <Link
            href="/booking"
            className={`transition ${activePage === "booking" ? "text-lavender font-bold" : "text-graphite hover:text-carbon"}`}
          >
            Jadwal &amp; Booking
          </Link>
          {activePage === "home" && (
            <>
              <a href="#info-lapangan" className="text-graphite hover:text-carbon transition">
                Info Lapangan
              </a>
              <a href="#keunggulan" className="text-graphite hover:text-carbon transition">
                Tentang Kami
              </a>
              <a href="#kontak" className="text-graphite hover:text-carbon transition">
                Kontak
              </a>
            </>
          )}
          <Link
            href="/riwayat"
            className={`transition ${activePage === "riwayat" ? "text-lavender font-bold" : "text-graphite hover:text-carbon"}`}
          >
            Riwayat Saya
          </Link>
        </nav>

        {/* Desktop & Mobile Header Actions */}
        <div className="flex items-center gap-3">
          {/* Action buttons (Desktop & Compact Mobile) */}
          <div className="hidden sm:flex items-center gap-4 text-sm font-medium">
            {session ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/riwayat"
                  className="bg-mist border border-fog px-3.5 py-1.5 rounded-full text-xs font-bold text-carbon hover:bg-lavender/10 transition flex items-center gap-1.5 shadow-subtle"
                >
                  <span>👤</span>
                  <span>{session.name.split(" ")[0]}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs text-ash hover:text-red-600 transition font-semibold"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-carbon hover:text-lavender px-3 py-2 transition">
                  Masuk
                </Link>
                <Link
                  href="/login?tab=register"
                  className="bg-iris text-white px-4 py-2 rounded-full shadow-subtle hover:opacity-90 transition text-xs font-bold"
                >
                  Daftar Akun
                </Link>
              </>
            )}
          </div>

          {/* Mobile User Badge (When logged in on extra small screens) */}
          {session && (
            <Link
              href="/riwayat"
              className="sm:hidden bg-mist border border-fog px-3 py-1.5 rounded-full text-xs font-bold text-carbon flex items-center gap-1 shadow-subtle"
            >
              <span>👤</span>
              <span>{session.name.split(" ")[0]}</span>
            </Link>
          )}

          {/* Hamburger Menu Toggle Button (Mobile Only) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="md:hidden p-2 rounded-xl bg-mist border border-fog text-carbon hover:bg-fog/60 transition flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-lavender"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-paper-white/98 backdrop-blur-xl border-t border-fog shadow-subtle-3 animate-fade-in">
          <div className="max-w-6xl mx-auto px-5 py-5 space-y-4">
            <nav className="flex flex-col space-y-2.5 text-sm font-semibold text-graphite">
              <Link
                href="/"
                onClick={handleBerandaClick}
                className={`px-4 py-2.5 rounded-2xl transition flex items-center justify-between ${
                  activePage === "home" ? "bg-lavender/10 text-lavender font-bold" : "hover:bg-mist text-carbon"
                }`}
              >
                <span>Beranda</span>
                {activePage === "home" && <span className="text-xs">●</span>}
              </Link>

              <Link
                href="/booking"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-2.5 rounded-2xl transition flex items-center justify-between ${
                  activePage === "booking" ? "bg-lavender/10 text-lavender font-bold" : "hover:bg-mist text-carbon"
                }`}
              >
                <span>Jadwal &amp; Booking</span>
                {activePage === "booking" && <span className="text-xs">●</span>}
              </Link>

              {activePage === "home" && (
                <div className="pl-4 pr-2 py-1 flex flex-col space-y-2 border-l-2 border-lavender/30 my-1">
                  <a
                    href="#info-lapangan"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-xs text-graphite hover:text-carbon py-1"
                  >
                    ↳ Info Lapangan
                  </a>
                  <a
                    href="#keunggulan"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-xs text-graphite hover:text-carbon py-1"
                  >
                    ↳ Tentang Kami
                  </a>
                  <a
                    href="#kontak"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-xs text-graphite hover:text-carbon py-1"
                  >
                    ↳ Kontak
                  </a>
                </div>
              )}

              <Link
                href="/riwayat"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-2.5 rounded-2xl transition flex items-center justify-between ${
                  activePage === "riwayat" ? "bg-lavender/10 text-lavender font-bold" : "hover:bg-mist text-carbon"
                }`}
              >
                <span>Riwayat Saya</span>
                {activePage === "riwayat" && <span className="text-xs">●</span>}
              </Link>
            </nav>

            <hr className="border-fog/80" />

            {/* Account Actions in Dropdown (Visible on Mobile) */}
            <div className="pt-1">
              {session ? (
                <div className="flex items-center justify-between bg-mist/70 p-3.5 rounded-2xl border border-fog">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="w-8 h-8 rounded-full bg-lavender/20 text-lavender flex items-center justify-center font-bold text-sm shrink-0">
                      👤
                    </span>
                    <div className="truncate">
                      <p className="font-bold text-xs text-carbon truncate">{session.name}</p>
                      <p className="text-[10px] text-ash truncate">{session.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-red-100 transition shrink-0 ml-2"
                  >
                    Keluar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:hidden gap-2.5">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center bg-mist text-carbon border border-fog py-2.5 rounded-full font-bold text-xs hover:bg-fog transition"
                  >
                    Masuk ke Akun
                  </Link>
                  <Link
                    href="/login?tab=register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center bg-iris text-white py-2.5 rounded-full shadow-subtle hover:opacity-90 transition text-xs font-bold"
                  >
                    Daftar Akun Baru
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
