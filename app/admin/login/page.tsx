"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BRAND_INFO } from "@/lib/assets";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
          loginType: "admin",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login admin gagal. Akses ditolak.");
        return;
      }

      router.push(data.redirectUrl);
    } catch {
      setError("Terjadi kesalahan jaringan saat proses autentikasi admin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-carbon text-white flex flex-col justify-between font-sans">
      {/* Top bar */}
      <header className="p-6 border-b border-ash/20 bg-carbon/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg text-white tracking-tight">
            <span className="w-8 h-8 rounded-full bg-iris text-white flex items-center justify-center font-black text-sm shadow-subtle">
              SM
            </span>
            <span>{BRAND_INFO.name} <span className="text-xs font-semibold bg-iris/20 text-iris px-2 py-0.5 rounded-full border border-iris/30 ml-1">ADMIN</span></span>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-ash hover:text-white transition bg-graphite/30 border border-ash/30 px-4 py-2 rounded-full shadow-subtle"
          >
            ← Kembali ke Portal Pelanggan
          </Link>
        </div>
      </header>

      {/* Main Admin Login Card */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md bg-[#222436] border border-ash/20 rounded-3xl p-6 sm:p-8 shadow-subtle-3 transition">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-iris/20 text-iris flex items-center justify-center text-2xl mx-auto font-black mb-3 shadow-subtle border border-iris/30">
              🛡️
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Portal Akses Admin
            </h1>
            <p className="text-xs text-ash mt-1 leading-relaxed">
              Silakan masuk menggunakan kredensial pengelola atau petugas lapangan resmi SM Sport Center.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-bold text-ash mb-1.5 uppercase tracking-wider">
                Alamat Email Admin <span className="text-iris">*</span>
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                required
                placeholder="admin@smsport.com"
                className="w-full bg-carbon/80 border border-ash/30 rounded-xl px-4 py-3 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-iris focus:border-iris transition placeholder-ash/40"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-bold text-ash mb-1.5 uppercase tracking-wider">
                Password Admin <span className="text-iris">*</span>
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-carbon/80 border border-ash/30 rounded-xl px-4 py-3 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-iris focus:border-iris transition placeholder-ash/40"
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-300 p-3 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-iris text-white py-3.5 rounded-full font-bold text-sm shadow-subtle hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifikasi Kredensial...</span>
                </>
              ) : (
                <span>Masuk ke Dashboard</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-ash/20 text-center">
            <p className="text-[11px] text-ash/70 leading-relaxed">
              Catatan Keamanan: Semua percobaan login ke portal admin dicatat oleh sistem audit keamanan.
            </p>
          </div>
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="py-6 border-t border-ash/20 text-center text-[11px] text-ash/60">
        <p>© 2026 {BRAND_INFO.name}. Sistem Reservasi Real-Time (Admin Panel).</p>
      </footer>
    </div>
  );
}
