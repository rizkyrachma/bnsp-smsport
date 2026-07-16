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
    setUpdatingCourtId(courtId);
    try {
      const nextStatus = currentStatus === "perbaikan" ? "tersedia" : "perbaikan";
      await updateCourtStatus(courtId, nextStatus);
      await fetchDashboard();
    } catch {
      alert("Gagal mengubah status lapangan.");
    } finally {
      setUpdatingCourtId(null);
    }
  };

  if (loading && !data) {
    return (
      <main className="p-6 sm:p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-[#222436] rounded-xl w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#222436] rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-[#222436] rounded-3xl" />
          <div className="h-80 bg-[#222436] rounded-3xl" />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="p-6 sm:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="bg-[#222436] border border-red-500/30 rounded-3xl p-8 max-w-md text-center space-y-4">
          <div className="text-3xl">⚠️</div>
          <h2 className="text-lg font-bold text-white">Gagal Memuat Dashboard</h2>
          <p className="text-xs text-ash leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={fetchDashboard}
            className="bg-iris text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-subtle"
          >
            Coba Lagi
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full pb-20">
      {/* Top Header & Date Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ash/20 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Dashboard Utama
          </h1>
          <p className="text-xs text-ash mt-1">
            Pantau statistik riil pendapatan, okupansi lapangan, dan pelanggan terdaftar dari database.
          </p>
        </div>

        {/* Date Filter Pill Tab Bar (§2 Recharts & §6 #1) */}
        <div className="flex items-center gap-1 bg-[#222436] p-1 rounded-full border border-ash/20 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setDateFilter("7days")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
              dateFilter === "7days" ? "bg-iris text-white shadow-subtle" : "text-ash hover:text-white"
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            type="button"
            onClick={() => setDateFilter("30days")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
              dateFilter === "30days" ? "bg-iris text-white shadow-subtle" : "text-ash hover:text-white"
            }`}
          >
            30 Hari Terakhir
          </button>
          <button
            type="button"
            onClick={() => setDateFilter("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
              dateFilter === "all" ? "bg-iris text-white shadow-subtle" : "text-ash hover:text-white"
            }`}
          >
            Semua Waktu
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards (DESIGN.md Admin Dark Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#222436] border border-ash/20 rounded-3xl p-6 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ash">Total Pelanggan</span>
            <span className="w-10 h-10 rounded-2xl bg-iris/15 text-iris flex items-center justify-center text-lg">
              👥
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-white">{data.totalCustomers}</p>
            <p className="text-[11px] text-ash mt-1">Pengguna aktif terdaftar</p>
          </div>
        </div>

        <div className="bg-[#222436] border border-ash/20 rounded-3xl p-6 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ash">Total Pendapatan</span>
            <span className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-lg">
              💰
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-emerald-400">
              Rp {data.totalRevenue.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-ash mt-1">Dari reservasi berstatus Lunas</p>
          </div>
        </div>

        <div className="bg-[#222436] border border-ash/20 rounded-3xl p-6 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ash">Total Booking</span>
            <span className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center text-lg">
              📅
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-white">{data.totalBookingsCount}</p>
            <p className="text-[11px] text-ash mt-1">Total seluruh pesanan masuk</p>
          </div>
        </div>

        <div className="bg-[#222436] border border-ash/20 rounded-3xl p-6 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ash">Menunggu Verifikasi</span>
            <span className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-lg">
              ⏳
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-amber-400">{data.pendingVerificationsCount}</p>
              <p className="text-[11px] text-ash mt-1">Bukti transfer baru unggah</p>
            </div>
            {data.pendingVerificationsCount > 0 && (
              <Link
                href="/admin/riwayat"
                className="text-[11px] font-bold text-iris hover:underline bg-iris/10 px-2.5 py-1 rounded-full border border-iris/20"
              >
                Periksa →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* CHARTS SECTION (Recharts §2 & §6 #1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A. Chart Pendapatan */}
        <div className="bg-[#222436] border border-ash/20 rounded-3xl p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>📈</span>
              <span>Chart Pendapatan Reservasi</span>
            </h2>
            <p className="text-xs text-ash mt-0.5">
              Data akumulasi tagihan dari setiap pesanan yang telah dibayar (Lunas).
            </p>
          </div>

          <div className="h-64 mt-6 w-full">
            {data.revenueChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center border border-dashed border-ash/20 rounded-2xl text-xs text-ash">
                Belum ada data pendapatan pada rentang waktu ini.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9580ff" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#9580ff" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#888fa6" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#888fa6"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `Rp ${val / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#181925",
                      borderColor: "#333752",
                      borderRadius: "16px",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                    formatter={(value: unknown) => [`Rp ${Number(value).toLocaleString("id-ID")}`, "Pendapatan"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#9580ff"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* B. Chart Jumlah Booking per Lapangan (2 Futsal + 3 Badminton terpisah) */}
        <div className="bg-[#222436] border border-ash/20 rounded-3xl p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>📊</span>
              <span>Okupansi Jumlah Booking per Lapangan</span>
            </h2>
            <p className="text-xs text-ash mt-0.5">
              Menampilkan kontribusi reservasi terpisah untuk 2 Futsal dan 3 Badminton.
            </p>
          </div>

          <div className="h-64 mt-6 w-full">
            {data.courtBookingStats.every((s) => s.totalBookings === 0) ? (
              <div className="h-full flex items-center justify-center border border-dashed border-ash/20 rounded-2xl text-xs text-ash">
                Belum ada pemesanan lapangan pada periode ini.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.courtBookingStats} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <XAxis
                    dataKey="courtName"
                    stroke="#888fa6"
                    fontSize={10}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke="#888fa6" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#181925",
                      borderColor: "#333752",
                      borderRadius: "16px",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                    formatter={(value: unknown, name: unknown, item: unknown) => [
                      `${value} kali (Rp ${(item as { payload: { revenue: number } }).payload.revenue.toLocaleString("id-ID")})`,
                      "Total Reservasi",
                    ]}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", color: "#888fa6" }} />
                  <Bar dataKey="totalBookings" name="Jumlah Reservasi" radius={[8, 8, 0, 0]}>
                    {data.courtBookingStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.type === "futsal" ? "#9580ff" : "#38bdf8"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* STATUS LAPANGAN SAAT INI (Tersedia / Dipesan / Perbaikan - §6 #1) */}
      <div className="bg-[#222436] border border-ash/20 rounded-3xl p-6 shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>⚡</span>
              <span>Status Lapangan Real-Time Saat Ini</span>
            </h2>
            <p className="text-xs text-ash mt-0.5">
              Menunjukkan status aktual (`courts.status`) dan mengecek apakah sedang ada sesi aktif jam ini.
            </p>
          </div>
          <Link
            href="/admin/jadwal"
            className="text-xs font-bold text-iris hover:underline bg-iris/10 px-4 py-2 rounded-full border border-iris/20 self-start sm:self-auto"
          >
            Atur Jadwal / Blokir Perawatan →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {data.courtsStatus.map((c) => {
            let badgeClass = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
            let badgeText = "TERSEDIA";
            let icon = "🟢";

            if (c.status === "perbaikan") {
              badgeClass = "bg-amber-500/15 text-amber-400 border-amber-500/30";
              badgeText = "PERBAIKAN";
              icon = "🚧";
            } else if (c.status === "dipesan") {
              badgeClass = "bg-iris/15 text-iris border-iris/30";
              badgeText = "SEDANG DIPAKAI";
              icon = "🔵";
            }

            return (
              <div
                key={c.id}
                className="bg-carbon/60 border border-ash/20 rounded-2xl p-4 flex flex-col justify-between gap-3 relative transition hover:border-ash/40"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ash bg-[#222436] px-2 py-0.5 rounded-full border border-ash/20">
                      {c.type}
                    </span>
                    <span className="text-sm">{icon}</span>
                  </div>
                  <h3 className="font-bold text-sm text-white">{c.name}</h3>
                  <p className="text-[11px] text-ash mt-0.5">Rp {c.pricePerHour.toLocaleString("id-ID")}/jam</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-ash/10">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider border ${badgeClass}`}
                  >
                    {badgeText}
                  </span>

                  {c.activeBooking && (
                    <p className="text-[11px] text-iris font-semibold">
                      🕒 Sesi: {c.activeBooking.start} - {c.activeBooking.end} WIB
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={updatingCourtId === c.id}
                    onClick={() => handleToggleStatus(c.id, c.status)}
                    className="w-full text-[11px] font-bold py-1.5 rounded-xl border border-ash/30 bg-[#222436] hover:bg-ash/20 text-white transition disabled:opacity-50 mt-1"
                  >
                    {updatingCourtId === c.id
                      ? "..."
                      : c.status === "perbaikan"
                      ? "✓ Aktifkan Lapangan"
                      : "🚧 Set Perbaikan"}
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
