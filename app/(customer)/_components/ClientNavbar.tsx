"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND_INFO } from "@/lib/assets";

interface ClientNavbarProps {
  activePage?: "home" | "booking" | "riwayat";
  initialSession?: { id: string; name: string; email: string; role: string } | null;
}

export default function ClientNavbar({ activePage = "home", initialSession = null }: ClientNavbarProps) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);

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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    window.location.href = "/";
  };

  const handleBerandaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-paper-white/95 backdrop-blur-md border-b border-fog shadow-subtle">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          onClick={handleBerandaClick}
          className="flex items-center gap-2 font-bold text-lg text-carbon tracking-tight"
        >
          <span className="w-8 h-8 rounded-full bg-lavender text-white flex items-center justify-center font-black text-sm shadow-subtle">
            SM
          </span>
          <span>{BRAND_INFO.name}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            href="/"
            onClick={handleBerandaClick}
            className={`transition ${
              activePage === "home" ? "text-lavender font-bold" : "text-graphite hover:text-carbon"
            }`}
          >
            Beranda
          </Link>
          <Link
            href="/booking"
            className={`transition ${
              activePage === "booking" ? "text-lavender font-bold" : "text-graphite hover:text-carbon"
            }`}
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
            className={`transition ${
              activePage === "riwayat" ? "text-lavender font-bold" : "text-graphite hover:text-carbon"
            }`}
          >
            Riwayat Saya
          </Link>
        </nav>

        <div className="flex items-center gap-4 text-sm font-medium">
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
      </div>
    </header>
  );
}
