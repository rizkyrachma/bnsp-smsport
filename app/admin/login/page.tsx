"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BRAND_INFO } from "@/lib/assets";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-mist text-carbon flex flex-col justify-between font-sans selection:bg-lavender selection:text-white">
      {/* Top bar */}
      <header className="p-6 border-b border-fog bg-paper-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg text-carbon tracking-tight">
            <span className="w-8 h-8 rounded-full bg-lavender text-white flex items-center justify-center font-black text-sm shadow-subtle">
              SM
            </span>
            <span>{BRAND_INFO.name} <span className="text-xs font-bold bg-lavender/10 text-lavender px-2.5 py-0.5 rounded-full border border-lavender/20 ml-1">ADMIN PORTAL</span></span>
          </div>
          <Link
            href="/"
            className="text-xs font-bold text-graphite hover:text-carbon transition bg-linen border border-fog px-4 py-2 rounded-full shadow-subtle"
          >
            ← Kembali ke Portal User
          </Link>
        </div>
      </header>

      {/* Main Admin Login Card */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md bg-paper-white border border-fog rounded-3xl p-6 sm:p-8 shadow-subtle-3 transition">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-lavender/10 text-lavender flex items-center justify-center mx-auto font-bold mb-3 shadow-subtle border border-lavender/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-carbon tracking-tight">
              Portal Akses Admin
            </h1>
            <p className="text-xs text-ash mt-1 leading-relaxed">
              Silakan masuk menggunakan kredensial pengelola atau petugas lapangan resmi SM Sport Center.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-bold text-graphite mb-1.5 uppercase tracking-wider">
                Alamat Email Admin <span className="text-ember">*</span>
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                required
                placeholder="admin@smsport.com"
                className="w-full bg-linen border border-fog rounded-xl px-4 py-3 text-xs font-medium text-carbon focus:outline-none focus:ring-2 focus:ring-lavender focus:border-lavender transition placeholder-ash/60 shadow-subtle"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-bold text-graphite mb-1.5 uppercase tracking-wider">
                Password Admin <span className="text-ember">*</span>
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full bg-linen border border-fog rounded-xl pl-4 pr-20 py-3 text-xs font-medium text-carbon focus:outline-none focus:ring-2 focus:ring-lavender focus:border-lavender transition placeholder-ash/60 shadow-subtle"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-ash hover:text-carbon transition text-[10px] font-bold uppercase tracking-wider"
                >
                  {showPassword ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200/60 rounded-2xl p-4 flex gap-3 text-left shadow-sm">
                <div className="text-red-500 text-lg shrink-0">⚠️</div>
                <div>
                  <h4 className="font-bold text-[10px] text-red-800 uppercase tracking-wider">Kesalahan</h4>
                  <p className="text-red-700 text-xs mt-0.5 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lavender text-white py-3.5 rounded-full font-bold text-sm shadow-subtle hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
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

          <div className="mt-8 pt-6 border-t border-fog text-center">
            <p className="text-[11px] text-ash leading-relaxed">
              Catatan Keamanan: Semua percobaan login ke portal admin dicatat oleh sistem audit keamanan.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-fog text-center text-[11px] text-ash">
        <p>© 2026 {BRAND_INFO.name}. Sistem Reservasi Real-Time (Admin Panel).</p>
      </footer>
    </div>
  );
}
