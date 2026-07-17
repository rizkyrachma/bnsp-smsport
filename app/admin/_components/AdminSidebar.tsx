"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BRAND_INFO } from "@/lib/assets";

export default function AdminSidebar() {
  const pathname = usePathname();

  // If on admin login page, don't show sidebar
  if (pathname === "/admin/login") {
    return null;
  }

  const navItems = [
    {
      name: "Dashboard Utama",
      href: "/admin/dashboard",
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      ),
    },
    {
      name: "Kelola Pelanggan",
      href: "/admin/pelanggan",
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: "Jadwal & Blokir Manual",
      href: "/admin/jadwal",
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: "Verifikasi & Riwayat",
      href: "/admin/riwayat",
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      name: "Ekspor Laporan",
      href: "/admin/laporan",
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    // Directly redirect to customer homepage upon exit
    window.location.href = "/";
  };

  return (
    <>
      {/* Sidebar for Desktop — Fixed height h-screen, no independent vertical scroll, engineered white canvas style */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-paper-white border-r border-fog text-carbon h-screen sticky top-0 flex-shrink-0 z-30 overflow-hidden">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-fog flex items-center gap-3">
            <Image src="/images/logo.png" alt="SM Sports Logo" width={40} height={40} className="object-contain flex-shrink-0" />
            <div>
              <h2 className="font-bold text-sm tracking-tight text-carbon leading-tight">{BRAND_INFO.name}</h2>
              <span className="text-[10px] font-bold tracking-wider text-lavender uppercase bg-lavender/10 px-2 py-0.5 rounded-full border border-lavender/20 inline-block mt-1">
                Admin Portal
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1">
            <p className="text-[10px] font-bold text-ash uppercase tracking-wider px-3 mb-2">Navigasi Utama</p>
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition ${
                    isActive
                      ? "bg-lavender text-white shadow-subtle"
                      : "text-graphite hover:text-carbon hover:bg-linen"
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Actions */}
        <div className="p-4 border-t border-fog bg-linen space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-carbon text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              AD
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-carbon truncate">Administrator</p>
              <p className="text-[10px] text-ash truncate">Akses Pengelola</p>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-center text-[11px] font-bold bg-ember/10 hover:bg-ember/20 text-ember py-2.5 rounded-xl border border-ember/20 transition"
            >
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile / Tablet Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-paper-white/95 backdrop-blur-md border-b border-fog px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-carbon">
            <span className="w-7 h-7 rounded-full bg-lavender text-white flex items-center justify-center font-black text-xs shadow-subtle">
              SM
            </span>
            <span>{BRAND_INFO.name} <span className="text-[10px] text-lavender bg-lavender/10 px-1.5 py-0.5 rounded-full ml-1 font-bold">ADMIN</span></span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-bold text-ember bg-ember/10 border border-ember/20 px-3 py-1.5 rounded-full transition"
          >
            Keluar
          </button>
        </div>

        {/* Horizontal Nav without scrollbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex-shrink-0 ${
                  isActive
                    ? "bg-lavender text-white shadow-subtle"
                    : "bg-linen text-graphite border border-fog"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </header>
    </>
  );
}
