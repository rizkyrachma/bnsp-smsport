"use client";

import { useEffect, useState, useCallback } from "react";
import { getAdminBookings } from "@/lib/admin-actions";
import { BRAND_INFO } from "@/lib/assets";
import { generateLaporanPDF } from "@/lib/generateLaporanPDF";
import { formatTanggalWIB } from "@/lib/timezone";

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
  const [statusFilter, setStatusFilter] = useState<string>("paid");
  const [courtTypeFilter, setCourtTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [error, setError] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminBookings({
        status: statusFilter,
        courtType: courtTypeFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setItems(res);
    } catch {
      setError("Gagal memuat data laporan.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, courtTypeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const totalRevenue = items.reduce((sum, item) => (item.status === "paid" ? sum + item.totalPrice : sum), 0);

  // Hitung pendapatan pada hari itu (Jika filter tanggal spesifik 1 hari dipilih, gunakan tanggal tsb. Jika tidak/rentang, gunakan Hari Ini WIB)
  const todayStr = formatTanggalWIB(new Date());
  const targetDateStr = (dateFrom && dateTo && dateFrom === dateTo) ? dateFrom : todayStr;
  const isToday = targetDateStr === todayStr;
  const dayRevenue = items
    .filter((item) => item.status === "paid" && item.bookingDate === targetDateStr)
    .reduce((sum, item) => sum + item.totalPrice, 0);

  const handleExportCSV = () => {
    setError("");
    if (items.length === 0) {
      setError("Tidak ada data untuk diekspor.");
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

  const handlePrintPDF = () => {
    generateLaporanPDF(items, dateFrom, dateTo);
  };

  return (
    <main className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full pb-20">
      {error && (
        <div className="bg-red-50 border border-red-200/60 rounded-3xl p-5 flex items-start gap-3 text-left shadow-subtle relative print:hidden animate-fade-in">
          <div className="text-red-500 text-xl shrink-0">⚠️</div>
          <div className="flex-1">
            <p className="font-bold text-[10px] text-red-800 uppercase tracking-wider">Kesalahan</p>
            <p className="text-red-700 text-xs mt-1 leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-600 text-xs font-bold w-6 h-6 rounded-full bg-red-100/50 hover:bg-red-100 flex items-center justify-center transition absolute top-4 right-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-fog pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
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
            className="bg-mint hover:opacity-90 text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-subtle transition flex items-center gap-2 disabled:opacity-50"
          >
            <span>Unduh Excel (CSV)</span>
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            disabled={items.length === 0}
            className="bg-lavender hover:opacity-90 text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-subtle transition flex items-center gap-2 disabled:opacity-50"
          >
            <span>Cetak / Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* Filters Box */}
      <div className="print:hidden bg-paper-white border border-fog rounded-3xl p-6 shadow-subtle grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="filter-date-from" className="block text-[10px] font-bold uppercase tracking-wider text-graphite mb-1.5">
            Dari Tanggal
          </label>
          <input
            id="filter-date-from"
            type="date"
            aria-label="Filter laporan dari tanggal"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full bg-linen border border-fog rounded-2xl px-3.5 py-2 text-xs text-carbon focus:outline-none focus:ring-2 focus:ring-lavender transition"
          />
        </div>

        <div>
          <label htmlFor="filter-date-to" className="block text-[10px] font-bold uppercase tracking-wider text-graphite mb-1.5">
            Sampai Tanggal
          </label>
          <input
            id="filter-date-to"
            type="date"
            aria-label="Filter laporan sampai tanggal"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full bg-linen border border-fog rounded-2xl px-3.5 py-2 text-xs text-carbon focus:outline-none focus:ring-2 focus:ring-lavender transition"
          />
        </div>

        <div>
          <label htmlFor="filter-court-type" className="block text-[10px] font-bold uppercase tracking-wider text-graphite mb-1.5">
            Kategori Lapangan
          </label>
          <select
            id="filter-court-type"
            aria-label="Filter kategori lapangan laporan"
            value={courtTypeFilter}
            onChange={(e) => setCourtTypeFilter(e.target.value)}
            className="w-full bg-linen border border-fog rounded-2xl px-3.5 py-2 text-xs text-carbon focus:outline-none focus:ring-2 focus:ring-lavender transition"
          >
            <option value="all">Semua Kategori (Futsal &amp; Badminton)</option>
            <option value="futsal">Futsal</option>
            <option value="badminton">Badminton</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-payment-status" className="block text-[10px] font-bold uppercase tracking-wider text-graphite mb-1.5">
            Status Pembayaran
          </label>
          <select
            id="filter-payment-status"
            aria-label="Filter status pembayaran laporan"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-linen border border-fog rounded-2xl px-3.5 py-2 text-xs text-carbon focus:outline-none focus:ring-2 focus:ring-lavender transition"
          >
            <option value="paid">Lunas (Pendapatan Riil)</option>
            <option value="all">Semua Status (Lunas, Pending, Batal)</option>
            <option value="pending">Menunggu Verifikasi</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-paper-white border border-fog rounded-3xl p-6 shadow-subtle">
          <p className="text-xs font-bold uppercase text-ash">Total Reservasi Terfilter</p>
          <p className="text-3xl font-black text-carbon mt-2">{items.length} sesi</p>
        </div>

        <div className="bg-paper-white border border-fog rounded-3xl p-6 shadow-subtle">
          <p className="text-xs font-bold uppercase text-ash">Total Pendapatan (Lunas)</p>
          <p className="text-3xl font-black text-mint mt-2">
            Rp {totalRevenue.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="bg-paper-white border border-fog rounded-3xl p-6 shadow-subtle">
          <p className="text-xs font-bold uppercase text-ash">
            {isToday ? "Pendapatan Hari Ini" : `Pendapatan Hari Itu (${targetDateStr})`}
          </p>
          <p className="text-3xl font-black text-lavender mt-2">
            Rp {dayRevenue.toLocaleString("id-ID")}
          </p>
          <p className="text-[10px] text-ash mt-1">
            {isToday ? `Transaksi lunas tanggal ${todayStr}` : `Transaksi lunas tanggal ${targetDateStr}`}
          </p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-paper-white print:bg-white print:border-gray-300 print:text-black border border-fog rounded-3xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs print:text-[10px]">
            <thead className="bg-linen print:bg-gray-100 text-graphite print:text-black font-bold uppercase tracking-wider border-b border-fog print:border-gray-300">
              <tr>
                <th className="py-4 px-6 print:py-2 print:px-3">No. / ID</th>
                <th className="py-4 px-6 print:py-2 print:px-3">Pelanggan</th>
                <th className="py-4 px-6 print:py-2 print:px-3">Kategori &amp; Lapangan</th>
                <th className="py-4 px-6 print:py-2 print:px-3">Waktu Reservasi</th>
                <th className="py-4 px-6 print:py-2 print:px-3 text-right">Biaya (IDR)</th>
                <th className="py-4 px-6 print:py-2 print:px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog print:divide-gray-200">
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
                  <tr key={item.id} className="hover:bg-mist print:hover:bg-transparent transition">
                    <td className="py-4 px-6 print:py-2 print:px-3">
                      <p className="font-bold text-carbon print:text-black">{idx + 1}</p>
                      <p className="text-[10px] text-ash print:text-gray-600 font-mono">{item.id.slice(0, 8)}</p>
                    </td>
                    <td className="py-4 px-6 print:py-2 print:px-3">
                      <p className="font-bold text-carbon print:text-black">{item.userName}</p>
                      <p className="text-[11px] text-ash print:text-gray-600">{item.userPhone}</p>
                    </td>
                    <td className="py-4 px-6 print:py-2 print:px-3">
                      <span className="bg-linen print:bg-transparent px-2 py-0.5 rounded-full text-[10px] font-bold text-graphite print:text-black border border-fog print:border-none uppercase">
                        {item.courtType}
                      </span>
                      <p className="font-bold text-carbon print:text-black mt-1">{item.courtName}</p>
                    </td>
                    <td className="py-4 px-6 print:py-2 print:px-3">
                      <p className="font-bold text-carbon print:text-black">{item.bookingDate}</p>
                      <p className="text-[11px] text-ash print:text-gray-600">
                        {item.startTime} - {item.endTime} WIB
                      </p>
                    </td>
                    <td className="py-4 px-6 print:py-2 print:px-3 text-right font-black text-carbon print:text-black">
                      Rp {item.totalPrice.toLocaleString("id-ID")}
                    </td>
                    <td className="py-4 px-6 print:py-2 print:px-3 text-center">
                      <span
                        className={`inline-block px-3 py-1 print:px-2 print:py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          item.status === "paid"
                            ? "bg-mint-wash print:bg-transparent text-mint print:text-green-700 border-mint/30 print:border-green-700"
                            : item.status === "pending"
                            ? "bg-amber/10 print:bg-transparent text-amber-900 print:text-yellow-700 border-amber/20 print:border-yellow-700"
                            : "bg-ember/10 print:bg-transparent text-ember-800 print:text-red-700 border-ember/20 print:border-red-700"
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
