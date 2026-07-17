"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { getAdminBookings, verifyPaymentAction } from "@/lib/admin-actions";

interface AdminBookingItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  courtId: string;
  courtName: string;
  courtType: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  payment: {
    method: string;
    proofUrl: string | null;
    status: string;
    paidAt: string | null;
  } | null;
}

export default function AdminRiwayatPage() {
  const [bookings, setBookings] = useState<AdminBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [courtTypeFilter, setCourtTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [alertState, setAlertState] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setAlertState(null);
    try {
      const res = await getAdminBookings({
        status: statusFilter,
        courtType: courtTypeFilter,
        search,
        dateFrom: dateFilter || undefined,
        dateTo: dateFilter || undefined,
      });
      setBookings(res);
    } catch {
      setAlertState({ message: "Gagal memuat daftar riwayat reservasi.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, courtTypeFilter, search, dateFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return (
    <main className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full pb-20">
      {alertState && (
        <div className={`border rounded-3xl p-5 flex items-start gap-3 text-left shadow-subtle relative animate-fade-in ${
          alertState.type === "success" 
            ? "bg-emerald-50 border-emerald-200/60 text-emerald-800" 
            : "bg-red-50 border-red-200/60 text-red-800"
        }`}>
          <div className="text-xl shrink-0">
            {alertState.type === "success" ? "✅" : "⚠️"}
          </div>
          <div className="flex-1">
            <h4 className={`font-bold text-[10px] uppercase tracking-wider ${
              alertState.type === "success" ? "text-emerald-800" : "text-red-800"
            }`}>
              {alertState.type === "success" ? "Berhasil" : "Kesalahan"}
            </h4>
            <p className={`text-xs mt-1 leading-relaxed ${
              alertState.type === "success" ? "text-emerald-700" : "text-red-700"
            }`}>
              {alertState.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAlertState(null)}
            className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition absolute top-4 right-4 ${
              alertState.type === "success" 
                ? "bg-emerald-100/50 hover:bg-emerald-100 text-emerald-500 hover:text-emerald-700" 
                : "bg-red-100/50 hover:bg-red-100 text-red-500 hover:text-red-700"
            }`}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-fog pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
            Riwayat Seluruh Reservasi Lapangan
          </h1>
          <p className="text-xs text-ash mt-1">
            Lihat daftar riwayat pesanan lapangan, total biaya, status lunas, dan rincian transaksi dari seluruh pelanggan.
          </p>
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Cari nama pelanggan atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-paper-white border border-fog rounded-full px-4 py-2.5 text-xs text-carbon placeholder-ash/60 focus:outline-none focus:ring-2 focus:ring-lavender transition shadow-subtle"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-linen p-4 rounded-3xl border border-fog">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-ash uppercase">Status:</span>
          <div className="flex items-center gap-1 bg-paper-white p-1 rounded-full border border-fog">
            {[
              { label: "Semua", val: "all" },
              { label: "Lunas", val: "paid" },
              { label: "Dibatalkan", val: "cancelled" },
            ].map((s) => (
              <button
                key={s.val}
                type="button"
                onClick={() => setStatusFilter(s.val)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  statusFilter === s.val ? "bg-lavender text-white shadow-subtle" : "text-graphite hover:text-carbon"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-ash uppercase">Kategori:</span>
          <div className="flex items-center gap-1 bg-paper-white p-1 rounded-full border border-fog">
            {[
              { label: "Semua Lapangan", val: "all" },
              { label: "Futsal", val: "futsal" },
              { label: "Badminton", val: "badminton" },
            ].map((c) => (
              <button
                key={c.val}
                type="button"
                onClick={() => setCourtTypeFilter(c.val)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  courtTypeFilter === c.val ? "bg-lavender text-white shadow-subtle" : "text-graphite hover:text-carbon"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-ash uppercase">Tanggal:</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-paper-white border border-fog rounded-full px-3 py-1.5 text-xs font-bold text-carbon focus:outline-none focus:ring-2 focus:ring-lavender transition shadow-subtle"
          />
          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter("")}
              className="text-[10px] text-red-500 font-bold hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Bookings List Table */}
      <div className="bg-paper-white border border-fog rounded-3xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-linen text-graphite font-bold uppercase tracking-wider border-b border-fog">
              <tr>
                <th className="py-4 px-6">Pelanggan</th>
                <th className="py-4 px-6">Lapangan &amp; Waktu</th>
                <th className="py-4 px-6 text-right">Total Biaya</th>
                <th className="py-4 px-6 text-center">Status Pesanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-ash animate-pulse">
                    Memuat riwayat reservasi dari database...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-ash">
                    Belum ada data reservasi yang sesuai dengan filter pencarian Anda.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  return (
                    <tr key={b.id} className="hover:bg-mist transition">
                      <td className="py-4 px-6">
                        <p className="font-bold text-carbon text-sm">{b.userName}</p>
                        <p className="text-[11px] text-ash">{b.userEmail}</p>
                        <p className="text-[11px] text-lavender font-semibold">{b.userPhone}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-linen px-2.5 py-0.5 rounded-full text-[10px] font-bold text-graphite border border-fog uppercase">
                          {b.courtType}
                        </span>
                        <p className="font-bold text-carbon mt-1">{b.courtName}</p>
                        <p className="text-[11px] text-ash">
                          {b.bookingDate} | {b.startTime} - {b.endTime} WIB
                        </p>
                      </td>
                      <td className="py-4 px-6 text-right font-black text-carbon text-sm">
                        Rp {b.totalPrice.toLocaleString("id-ID")}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-wider border ${
                            b.status === "paid"
                              ? "bg-mint-wash text-mint border-mint/30"
                              : b.status === "pending"
                              ? "bg-amber/10 text-amber border-amber/20 animate-pulse"
                              : "bg-ember/10 text-ember border-ember/20"
                          }`}
                        >
                          {b.status === "paid" ? "LUNAS / TERVERIFIKASI" : b.status === "pending" ? "MENUNGGU / PENDING" : "DIBATALKAN"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </main>
  );
}
