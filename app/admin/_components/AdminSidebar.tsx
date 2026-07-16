"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND_INFO } from "@/lib/assets";

export default function AdminSidebar() {
  const pathname = usePathname();

  // If on admin login page, don't show sidebar
  if (pathname === "/admin/login") {
    return null;
  }

  const navItems = [
    { name: "Dashboard Utama", href: "/admin/dashboard", icon: "📊" },
    { name: "Kelola Pelanggan", href: "/admin/pelanggan", icon: "👥" },
    { name: "Jadwal & Blokir Manual", href: "/admin/jadwal", icon: "🗓️" },
    { name: "Verifikasi & Riwayat", href: "/admin/riwayat", icon: "💳" },
    { name: "Ekspor Laporan", href: "/admin/laporan", icon: "📈" },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <>
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#222436] border-r border-ash/20 text-white min-h-screen sticky top-0 flex-shrink-0 z-30">
        <div className="p-6 border-b border-ash/20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-iris text-white flex items-center justify-center font-black text-sm shadow-subtle flex-shrink-0">
            SM
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight text-white leading-tight">{BRAND_INFO.name}</h2>
            <span className="text-[10px] font-bold tracking-wider text-iris uppercase bg-iris/15 px-2 py-0.5 rounded-full border border-iris/30 inline-block mt-1">
              Admin Portal
            </span>
          </div>
        </div>

        <nav className="flex-grow p-4 space-y-1.5">
          <p className="text-[10px] font-bold text-ash uppercase tracking-wider px-3 mb-2">Navigasi Utama</p>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition ${
                  isActive
                    ? "bg-iris text-white shadow-subtle border border-iris/40"
                    : "text-ash hover:text-white hover:bg-carbon/60"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-ash/20 space-y-3 bg-carbon/40">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-iris/20 text-iris flex items-center justify-center text-xs font-bold border border-iris/30">
              🛡️
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">Administrator</p>
              <p className="text-[10px] text-ash truncate">Akses Penuh</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <Link
              href="/"
              className="text-center text-[11px] font-semibold bg-carbon/80 hover:bg-carbon text-ash hover:text-white py-2 rounded-xl border border-ash/20 transition"
            >
              🌐 Portal User
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-center text-[11px] font-bold bg-red-500/15 hover:bg-red-500/25 text-red-400 py-2 rounded-xl border border-red-500/30 transition"
            >
              🚪 Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile / Tablet Topbar Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#222436]/95 backdrop-blur-md border-b border-ash/20 px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-white">
            <span className="w-7 h-7 rounded-full bg-iris text-white flex items-center justify-center font-black text-xs shadow-subtle">
              SM
            </span>
            <span>{BRAND_INFO.name} <span className="text-[10px] text-iris bg-iris/20 px-1.5 py-0.5 rounded-full ml-1">ADMIN</span></span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-3 py-1.5 rounded-full"
          >
            Keluar
          </button>
        </div>

        {/* Mobile Horizontal Pill Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex-shrink-0 ${
                  isActive
                    ? "bg-iris text-white shadow-subtle"
                    : "bg-carbon text-ash border border-ash/20"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </header>
    </>
  );
}
