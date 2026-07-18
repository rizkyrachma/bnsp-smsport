"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BRAND_INFO } from "@/lib/assets";

function CustomerLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "register";

  const [isRegistering, setIsRegistering] = useState(initialTab);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsRegistering(searchParams.get("tab") === "register");
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";

    const bodyData: Record<string, string> = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    if (isRegistering) {
      bodyData.name = formData.get("name") as string;
      bodyData.phone = formData.get("phone") as string;
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (isRegistering ? "Pendaftaran akun baru gagal." : "Login gagal. Periksa kembali email dan password."));
        return;
      }

      router.push(data.redirectUrl || "/");
    } catch {
      setError("Terjadi kesalahan koneksi jaringan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper-white text-carbon flex flex-col justify-between font-sans">
      {/* Mini top bar */}
      <header className="p-6 border-b border-fog bg-paper-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-carbon tracking-tight">
            <Image src="/images/logo.png" alt="SM Sports Logo" width={36} height={36} className="object-contain flex-shrink-0" priority />
            <span>{BRAND_INFO.name}</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-graphite hover:text-carbon transition bg-mist border border-fog px-4 py-2 rounded-full shadow-subtle"
          >
            ← Kembali ke Beranda
          </Link>
        </div>
      </header>

      {/* Main Login / Register Card */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md bg-paper-white border border-fog rounded-3xl p-6 sm:p-8 shadow-subtle-3 transition">
          {/* Header icon & badge */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-paper-white border border-fog flex items-center justify-center mx-auto mb-4 shadow-subtle p-2">
              <Image src="/images/logo.png" alt="SM Sports Logo" width={48} height={48} className="object-contain" priority />
            </div>
            <h1 className="text-2xl font-bold text-carbon tracking-tight">
              {isRegistering ? "Buat Akun Pelanggan" : "Selamat Datang Kembali"}
            </h1>
            <p className="text-xs text-graphite mt-1 leading-relaxed">
              {isRegistering
                ? "Daftarkan dirimu untuk reservasi lapangan futsal & badminton secara instan."
                : "Masuk ke akunmu untuk mengelola jadwal dan melihat riwayat reservasi."}
            </p>
          </div>

          {/* Mode Switcher Pills (DESIGN.md Tab Bar) */}
          <div className="grid grid-cols-2 gap-1 bg-mist p-1 rounded-full border border-fog mb-6 shadow-subtle">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setError("");
              }}
              className={`py-2 rounded-full text-xs font-bold transition ${!isRegistering ? "bg-lavender text-white shadow-subtle" : "text-graphite hover:text-carbon"
                }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(true);
                setError("");
              }}
              className={`py-2 rounded-full text-xs font-bold transition ${isRegistering ? "bg-lavender text-white shadow-subtle" : "text-graphite hover:text-carbon"
                }`}
            >
              Daftar Akun Baru
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <>
                <div>
                  <label htmlFor="name" className="block text-xs font-bold text-carbon mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Contoh: Rizky Rachma"
                    className="w-full bg-mist border border-fog rounded-xl px-4 py-3 text-xs font-medium text-carbon focus:outline-none focus:ring-2 focus:ring-lavender focus:bg-white transition shadow-subtle placeholder-ash"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs font-bold text-carbon mb-1">
                    Nomor WhatsApp / Telepon <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    className="w-full bg-mist border border-fog rounded-xl px-4 py-3 text-xs font-medium text-carbon focus:outline-none focus:ring-2 focus:ring-lavender focus:bg-white transition shadow-subtle placeholder-ash"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-carbon mb-1">
                Alamat Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="nama@email.com"
                className="w-full bg-mist border border-fog rounded-xl px-4 py-3 text-xs font-medium text-carbon focus:outline-none focus:ring-2 focus:ring-lavender focus:bg-white transition shadow-subtle placeholder-ash"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-carbon mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full bg-mist border border-fog rounded-xl pl-4 pr-12 py-3 text-xs font-medium text-carbon focus:outline-none focus:ring-2 focus:ring-lavender focus:bg-white transition shadow-subtle placeholder-ash"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-ash hover:text-carbon transition"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.388 4.178 5.325 7.178 9.963 7.178.966 0 1.9-.125 2.784-.36m3.111-1.246A10.743 10.743 0 0 0 22.066 12c-1.388-4.178-5.325-7.178-9.963-7.178-.966 0-1.9.125-2.784.36m-2.24 2.24L20.24 20.24M12.225 12.225a3 3 0 0 0-4.45-4.45" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200/60 rounded-2xl p-4 flex gap-3 text-left shadow-sm">
                <div className="text-red-500 text-lg shrink-0">⚠️</div>
                <div>
                  <p className="font-bold text-[10px] text-red-800 uppercase tracking-wider">Kesalahan</p>
                  <p className="text-red-700 text-xs mt-0.5 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lavender text-white py-3.5 rounded-full font-bold text-sm shadow-subtle hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : isRegistering ? (
                <span>Daftar Sekarang</span>
              ) : (
                <span>Masuk ke Akun</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-fog text-center">
            <p className="text-xs text-graphite">
              {isRegistering ? "Sudah memiliki akun terdaftar?" : "Belum memiliki akun pelanggan?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError("");
                }}
                className="text-lavender font-bold hover:underline transition ml-1"
              >
                {isRegistering ? "Masuk di sini" : "Daftar Akun Baru"}
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="py-6 border-t border-fog text-center text-[11px] text-ash">
        <p>© 2026 {BRAND_INFO.name}. Sistem Reservasi Real-Time.</p>
      </footer>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper-white flex items-center justify-center text-carbon font-bold">
          Memuat Halaman Login...
        </div>
      }
    >
      <CustomerLoginPageContent />
    </Suspense>
  );
}
