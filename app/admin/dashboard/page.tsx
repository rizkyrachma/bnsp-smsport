"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import { getAdminDashboardData, updateCourtStatus } from "@/lib/admin-actions";

interface DashboardData {
  totalCustomers: number;
  totalRevenue: number;
  totalBookingsCount: number;
  pendingVerificationsCount: number;
  revenueChartData: { date: string; label: string; amount: number }[];
  courtBookingStats: { courtName: string; type: string; totalBookings: number; revenue: number }[];
  courtsStatus: {
    id: string;
    name: string;
    type: string;
    pricePerHour: number;
    status: "tersedia" | "dipesan" | "perbaikan";
    activeBooking: { id: string; start: string; end: string; status: string } | null;
  }[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "7days" | "30days">("all");
  const [updatingCourtId, setUpdatingCourtId] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let dateRange: { startDate?: string; endDate?: string } | undefined = undefined;
      const now = new Date();
      if (dateFilter === "7days") {
        const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateRange = { startDate: d.toISOString().slice(0, 10), endDate: now.toISOString().slice(0, 10) };
      } else if (dateFilter === "30days") {
        const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateRange = { startDate: d.toISOString().slice(0, 10), endDate: now.toISOString().slice(0, 10) };
      }

      const res = await getAdminDashboardData(dateRange);
      setData(res);
    } catch (e: unknown) {
      setError((e as Error)?.message || "Gagal memuat data dashboard.");
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleToggleStatus = async (courtId: string, currentStatus: string) => {
    setActionError("");
    setUpdatingCourtId(courtId);
    try {
      const nextStatus = currentStatus === "perbaikan" ? "tersedia" : "perbaikan";
      await updateCourtStatus(courtId, nextStatus);
      await fetchDashboard();
    } catch {
      setActionError("Gagal mengubah status lapangan.");
    } finally {
      setUpdatingCourtId(null);
    }
  };

  if (loading && !data) {
    return (
      <main className="p-6 sm:p-8 space-y-6 animate-pulse max-w-7xl mx-auto w-full">
        <div className="h-8 bg-linen border border-fog rounded-xl w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-paper-white border border-fog rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-paper-white border border-fog rounded-3xl" />
          <div className="h-80 bg-paper-white border border-fog rounded-3xl" />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="p-6 sm:p-8 flex items-center justify-center min-h-[60vh] max-w-7xl mx-auto w-full">
        <div className="bg-paper-white border border-fog rounded-3xl p-8 max-w-md text-center space-y-4 shadow-subtle">
          <div className="w-12 h-12 rounded-full bg-ember/10 text-ember-800 flex items-center justify-center text-xl mx-auto font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-carbon">Gagal Memuat Dashboard</h2>
          <p className="text-xs text-ash leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={fetchDashboard}
            className="bg-lavender text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-subtle hover:opacity-95 transition"
          >
            Coba Lagi
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full pb-20">
      {actionError && (
        <div className="bg-red-50 border border-red-200/60 rounded-3xl p-5 flex items-start gap-3 text-left shadow-subtle relative">
          <div className="text-red-500 text-xl shrink-0">⚠️</div>
          <div className="flex-1">
            <p className="font-bold text-[10px] text-red-800 uppercase tracking-wider">Kesalahan</p>
            <p className="text-red-700 text-xs mt-1 leading-relaxed">{actionError}</p>
          </div>
          <button
            type="button"
            onClick={() => setActionError("")}
            className="text-red-400 hover:text-red-600 text-xs font-bold w-6 h-6 rounded-full bg-red-100/50 hover:bg-red-100 flex items-center justify-center transition absolute top-4 right-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Date Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-fog pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
            Dashboard Utama
          </h1>
          <p className="text-xs text-ash mt-1">
            Pantau statistik pendapatan, okupansi lapangan, dan pelanggan terdaftar secara langsung dari database.
          </p>
        </div>

        {/* Date Filter Pill Tab Bar (DESIGN.md White Engineering Theme) */}
        <div className="flex items-center gap-1 bg-linen p-1 rounded-full border border-fog self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setDateFilter("7days")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
              dateFilter === "7days" ? "bg-lavender text-white shadow-subtle" : "text-graphite hover:text-carbon"
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            type="button"
            onClick={() => setDateFilter("30days")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
              dateFilter === "30days" ? "bg-lavender text-white shadow-subtle" : "text-graphite hover:text-carbon"
            }`}
          >
            30 Hari Terakhir
          </button>
          <button
            type="button"
            onClick={() => setDateFilter("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
              dateFilter === "all" ? "bg-lavender text-white shadow-subtle" : "text-graphite hover:text-carbon"
            }`}
          >
            Semua Waktu
          </button>
        </div>
      </div>

      {/* 3 KPI Summary Cards (DESIGN.md White Canvas Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-paper-white border border-fog rounded-3xl p-6 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ash">Total Pelanggan</span>
            <div className="w-9 h-9 rounded-2xl bg-lavender/10 text-lavender flex items-center justify-center font-bold">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-carbon">{data.totalCustomers}</p>
            <p className="text-[11px] text-ash mt-1">Pengguna aktif terdaftar</p>
          </div>
        </div>

        <div className="bg-paper-white border border-fog rounded-3xl p-6 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ash">Total Pendapatan</span>
            <div className="w-9 h-9 rounded-2xl bg-mint/10 text-mint flex items-center justify-center font-bold">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-mint">
              Rp {data.totalRevenue.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-ash mt-1">Dari reservasi berstatus Lunas</p>
          </div>
        </div>

        <div className="bg-paper-white border border-fog rounded-3xl p-6 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ash">Total Booking</span>
            <div className="w-9 h-9 rounded-2xl bg-sky/10 text-sky flex items-center justify-center font-bold">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-carbon">{data.totalBookingsCount}</p>
            <p className="text-[11px] text-ash mt-1">Total seluruh pesanan masuk</p>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A. Chart Pendapatan */}
        <div className="bg-paper-white border border-fog rounded-3xl p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-carbon">
              Chart Pendapatan Reservasi
            </h2>
            <p className="text-xs text-ash mt-0.5">
              Data akumulasi tagihan dari setiap pesanan yang telah dibayar (Lunas).
            </p>
          </div>

          <div className="h-64 mt-6 w-full">
            {data.revenueChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center border border-dashed border-fog rounded-2xl text-xs text-ash">
                Belum ada data pendapatan pada rentang waktu ini.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#21257c" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#21257c" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#999999" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#999999"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `Rp ${val / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e8e8e8",
                      borderRadius: "16px",
                      fontSize: "12px",
                      color: "#181925",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                    }}
                    formatter={(value: unknown) => [`Rp ${Number(value).toLocaleString("id-ID")}`, "Pendapatan"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#21257c"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* B. Chart Jumlah Booking per Lapangan */}
        <div className="bg-paper-white border border-fog rounded-3xl p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-carbon">
              Okupansi Jumlah Booking per Lapangan
            </h2>
            <p className="text-xs text-ash mt-0.5">
              Menampilkan kontribusi reservasi terpisah untuk 2 Futsal dan 3 Badminton.
            </p>
          </div>

          <div className="h-64 mt-6 w-full">
            {data.courtBookingStats.every((s) => s.totalBookings === 0) ? (
              <div className="h-full flex items-center justify-center border border-dashed border-fog rounded-2xl text-xs text-ash">
                Belum ada pemesanan lapangan pada periode ini.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.courtBookingStats} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <XAxis
                    dataKey="courtName"
                    stroke="#999999"
                    fontSize={10}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke="#999999" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e8e8e8",
                      borderRadius: "16px",
                      fontSize: "12px",
                      color: "#181925",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                    }}
                    formatter={(value: unknown, name: unknown, item: unknown) => [
                      `${value} kali (Rp ${(item as { payload: { revenue: number } }).payload.revenue.toLocaleString("id-ID")})`,
                      "Total Reservasi",
                    ]}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", color: "#666666" }} />
                  <Bar dataKey="totalBookings" name="Jumlah Reservasi" radius={[8, 8, 0, 0]}>
                    {data.courtBookingStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.type === "futsal" ? "#21257c" : "#2c78fc"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* STATUS LAPANGAN SAAT INI */}
      <div className="bg-paper-white border border-fog rounded-3xl p-6 shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-carbon tracking-tight">
              Status Lapangan Real-Time Saat Ini
            </h2>
            <p className="text-xs text-ash mt-0.5">
              Menunjukkan status aktual dan mengecek apakah sedang ada sesi aktif jam ini.
            </p>
          </div>
          <Link
            href="/admin/jadwal"
            className="text-xs font-bold text-lavender hover:underline bg-lavender/10 px-4 py-2 rounded-full border border-lavender/20 self-start sm:self-auto transition"
          >
            Atur Jadwal / Blokir Perawatan →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {data.courtsStatus.map((c) => {
            let badgeClass = "bg-mint-wash text-mint border-mint/30";
            let badgeText = "TERSEDIA";

            if (c.status === "perbaikan") {
              badgeClass = "bg-amber/15 text-amber-900 border-amber/30";
              badgeText = "PERBAIKAN";
            } else if (c.status === "dipesan") {
              badgeClass = "bg-lavender/15 text-lavender border-lavender/30";
              badgeText = "SEDANG DIPAKAI";
            }

            return (
              <div
                key={c.id}
                className="bg-linen border border-fog rounded-2xl p-4 flex flex-col justify-between gap-3 relative transition hover:border-graphite/30"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-graphite bg-paper-white px-2 py-0.5 rounded-full border border-fog">
                      {c.type}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-carbon">{c.name}</h3>
                  <p className="text-[11px] text-graphite mt-0.5">Rp {c.pricePerHour.toLocaleString("id-ID")}/jam</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-fog">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider border ${badgeClass}`}
                  >
                    {badgeText}
                  </span>

                  {c.activeBooking && (
                    <p className="text-[11px] text-lavender font-semibold">
                      Sesi: {c.activeBooking.start} - {c.activeBooking.end} WIB
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={updatingCourtId === c.id}
                    onClick={() => handleToggleStatus(c.id, c.status)}
                    className="w-full text-[11px] font-bold py-1.5 rounded-xl border border-fog bg-paper-white hover:bg-mist text-carbon transition disabled:opacity-50 mt-1"
                  >
                    {updatingCourtId === c.id
                      ? "..."
                      : c.status === "perbaikan"
                      ? "✓ Aktifkan Lapangan"
                      : "Set Perbaikan"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
