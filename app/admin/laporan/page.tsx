"use client";

import { useEffect, useState, useCallback } from "react";
import { getAdminBookings } from "@/lib/admin-actions";
import { BRAND_INFO } from "@/lib/assets";

interface ReportItem {
  id: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  courtName: string;
  courtType: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  payment: {
    method: string;
    proofUrl: string | null;
    status: string;
    paidAt: string | null;
  } | null;
}

export default function AdminLaporanPage() {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("paid"); // Default laporan berfokus pada pendapatan lunas
  const [courtTypeFilter, setCourtTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminBookings({
        status: statusFilter,
        courtType: courtTypeFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setItems(res);
    } catch {
      alert("Gagal memuat data laporan.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, courtTypeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Total summary calculation
  const totalRevenue = items.reduce((sum, item) => (item.status === "paid" ? sum + item.totalPrice : sum), 0);
  const paidCount = items.filter((item) => item.status === "paid").length;
  const avgTicket = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;

  // Export to CSV / Excel
  const handleExportCSV = () => {
    if (items.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    const headers = [
      "ID Pesanan",
      "Tanggal Booking",
      "Jam Mulai",
      "Jam Selesai",
      "Nama Pelanggan",
      "Email",
      "No. HP",
      "Kategori Lapangan",
      "Nama Lapangan",
      "Total Biaya (IDR)",
      "Status",
      "Metode Pembayaran",
    ];

    const rows = items.map((i) => [
      i.id,
      i.bookingDate,
      i.startTime,
      i.endTime,
      `"${i.userName.replace(/"/g, '""')}"`,
      i.userEmail,
      i.userPhone,
      i.courtType.toUpperCase(),
      `"${i.courtName.replace(/"/g, '""')}"`,
      i.totalPrice,
      i.status.toUpperCase(),
      i.payment?.method || "-",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Laporan_SMSports_${dateFrom || "Semua"}_to_${dateTo || "Semua"}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF / Print
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <main className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full pb-20">
      {/* Header — Hide when printing */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ash/20 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Ekspor Laporan &amp; Analisis Pendapatan
          </h1>
          <p className="text-xs text-ash mt-1">
            Filter transaksi berdasarkan rentang tanggal, jenis lapangan, atau status, lalu unduh ke Excel / PDF.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={items.length === 0}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-subtle transition flex items-center gap-2 disabled:opacity-50"
          >
            <span>📊</span>
            <span>Unduh Excel (CSV)</span>
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            disabled={items.length === 0}
            className="bg-iris hover:bg-iris/90 text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-subtle transition flex items-center gap-2 disabled:opacity-50"
          >
            <span>🖨️</span>
            <span>Cetak / Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* Filters Box — Hide when printing */}
      <div className="print:hidden bg-[#222436] border border-ash/20 rounded-3xl p-6 shadow-subtle grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-ash mb-1.5">
            📅 Dari Tanggal
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full bg-carbon border border-ash/30 rounded-2xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-iris transition"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-ash mb-1.5">
            📅 Sampai Tanggal
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full bg-carbon border border-ash/30 rounded-2xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-iris transition"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-ash mb-1.5">
            🏷️ Kategori Lapangan
          </label>
          <select
            value={courtTypeFilter}
            onChange={(e) => setCourtTypeFilter(e.target.value)}
            className="w-full bg-carbon border border-ash/30 rounded-2xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-iris transition"
          >
            <option value="all">Semua Kategori (Futsal & Badminton)</option>
            <option value="futsal">⚽ Futsal</option>
            <option value="badminton">🏸 Badminton</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-ash mb-1.5">
            📌 Status Pembayaran
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-carbon border border-ash/30 rounded-2xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-iris transition"
          >
            <option value="paid">🟢 Lunas (Pendapatan Riil)</option>
            <option value="all">Semua Status (Lunas, Pending, Batal)</option>
            <option value="pending">⏳ Menunggu Verifikasi</option>
            <option value="cancelled">🔴 Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* PRINT / PDF HEADER (Visible only on Print) */}
      <div className="hidden print:block text-center border-b border-gray-400 pb-4 mb-6 text-black">
        <h2 className="text-xl font-bold uppercase">{BRAND_INFO.name} — LAPORAN RESERVASI &amp; PENDAPATAN</h2>
        <p className="text-xs">
          Periode: {dateFrom || "Awal"} s/d {dateTo || "Sekarang"} | Kategori: {courtTypeFilter.toUpperCase()} | Status: {statusFilter.toUpperCase()}
        </p>
        <p className="text-[10px] text-gray-600 mt-1">Dicetak pada: {new Date().toLocaleString("id-ID")}</p>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
        <div className="bg-[#222436] print:bg-white print:border-gray-300 print:text-black border border-ash/20 rounded-3xl p-6 shadow-subtle">
          <p className="text-xs print:text-[10px] font-bold uppercase text-ash print:text-gray-600">Total Reservasi Terfilter</p>
          <p className="text-3xl print:text-xl font-black text-white print:text-black mt-2">{items.length} sesi</p>
        </div>

        <div className="bg-[#222436] print:bg-white print:border-gray-300 print:text-black border border-ash/20 rounded-3xl p-6 shadow-subtle">
          <p className="text-xs print:text-[10px] font-bold uppercase text-ash print:text-gray-600">Total Pendapatan (Lunas)</p>
          <p className="text-3xl print:text-xl font-black text-emerald-400 print:text-black mt-2">
            Rp {totalRevenue.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="bg-[#222436] print:bg-white print:border-gray-300 print:text-black border border-ash/20 rounded-3xl p-6 shadow-subtle">
          <p className="text-xs print:text-[10px] font-bold uppercase text-ash print:text-gray-600">Rata-Rata per Sesi Lunas</p>
          <p className="text-3xl print:text-xl font-black text-iris print:text-black mt-2">
            Rp {avgTicket.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#222436] print:bg-white print:border-gray-300 print:text-black border border-ash/20 rounded-3xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs print:text-[10px]">
            <thead className="bg-carbon/80 print:bg-gray-100 text-ash print:text-black font-bold uppercase tracking-wider border-b border-ash/20 print:border-gray-300">
              <tr>
                <th className="py-4 px-6 print:py-2 print:px-3">No. / ID</th>
                <th className="py-4 px-6 print:py-2 print:px-3">Pelanggan</th>
                <th className="py-4 px-6 print:py-2 print:px-3">Kategori &amp; Lapangan</th>
                <th className="py-4 px-6 print:py-2 print:px-3">Waktu Reservasi</th>
                <th className="py-4 px-6 print:py-2 print:px-3 text-right">Biaya (IDR)</th>
                <th className="py-4 px-6 print:py-2 print:px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ash/10 print:divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ash print:text-black animate-pulse">
                    Memuat data laporan dari database...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ash print:text-black">
                    Tidak ada data transaksi yang cocok dengan filter laporan ini.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-carbon/40 print:hover:bg-transparent transition">
                    <td className="py-4 px-6 print:py-2 print:px-3">
                      <p className="font-bold text-white print:text-black">{idx + 1}</p>
                      <p className="text-[10px] text-ash print:text-gray-600 font-mono">{item.id.slice(0, 8)}</p>
                    </td>
                    <td className="py-4 px-6 print:py-2 print:px-3">
                      <p className="font-bold text-white print:text-black">{item.userName}</p>
                      <p className="text-[11px] text-ash print:text-gray-600">{item.userPhone}</p>
                    </td>
                    <td className="py-4 px-6 print:py-2 print:px-3">
                      <span className="bg-carbon print:bg-transparent px-2 py-0.5 rounded-full text-[10px] font-bold text-ash print:text-black border border-ash/20 print:border-none uppercase">
                        {item.courtType}
                      </span>
                      <p className="font-bold text-white print:text-black mt-1">{item.courtName}</p>
                    </td>
                    <td className="py-4 px-6 print:py-2 print:px-3">
                      <p className="font-bold text-white print:text-black">{item.bookingDate}</p>
                      <p className="text-[11px] text-ash print:text-gray-600">
                        {item.startTime} - {item.endTime} WIB
                      </p>
                    </td>
                    <td className="py-4 px-6 print:py-2 print:px-3 text-right font-black text-white print:text-black">
                      Rp {item.totalPrice.toLocaleString("id-ID")}
                    </td>
                    <td className="py-4 px-6 print:py-2 print:px-3 text-center">
                      <span
                        className={`inline-block px-3 py-1 print:px-2 print:py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          item.status === "paid"
                            ? "bg-emerald-500/15 print:bg-transparent text-emerald-400 print:text-green-700 border-emerald-500/30 print:border-green-700"
                            : item.status === "pending"
                            ? "bg-amber-500/15 print:bg-transparent text-amber-400 print:text-yellow-700 border-amber-500/30 print:border-yellow-700"
                            : "bg-red-500/15 print:bg-transparent text-red-400 print:text-red-700 border-red-500/30 print:border-red-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
