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
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{ bookingId: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminBookings({
        status: statusFilter,
        courtType: courtTypeFilter,
        search,
      });
      setBookings(res);
    } catch {
      alert("Gagal memuat daftar riwayat reservasi.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, courtTypeFilter, search]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleVerify = async (bookingId: string, action: "approve" | "reject", reason?: string) => {
    const confirmMsg =
      action === "approve"
        ? "SETUJUI pembayaran ini dan ubah pesanan menjadi LUNAS?"
        : "TOLAK pembayaran ini dan batalkan pesanan?";

    if (!window.confirm(confirmMsg)) return;

    setVerifyingId(bookingId);
    try {
      const res = await verifyPaymentAction(bookingId, action, reason);
      if (res.success) {
        alert(res.message);
        await fetchBookings();
        setRejectionModal(null);
        setRejectionReason("");
      } else {
        alert(res.error || "Gagal memverifikasi pembayaran.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <main className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-fog pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
            Verifikasi &amp; Riwayat Seluruh Reservasi
          </h1>
          <p className="text-xs text-ash mt-1">
            Periksa bukti pembayaran yang diunggah pelanggan, setujui/tolak pesanan, serta lihat detail transaksi.
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
              { label: "Menunggu Verifikasi", val: "pending" },
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
                <th className="py-4 px-6 text-right">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ash animate-pulse">
                    Memuat riwayat reservasi dari database...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ash">
                    Belum ada data reservasi yang sesuai dengan filter pencarian Anda.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  const isPendingUpload = b.status === "pending" && b.payment?.proofUrl;
                  return (
                    <tr key={b.id} className={`hover:bg-mist transition ${isPendingUpload ? "bg-amber/5" : ""}`}>
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
                      <td className="py-4 px-6 text-right">
                        {b.status === "pending" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={verifyingId === b.id}
                              onClick={() => handleVerify(b.id, "approve")}
                              className="bg-mint hover:opacity-90 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-subtle transition disabled:opacity-50"
                            >
                              ✓ Setujui
                            </button>
                            <button
                              type="button"
                              disabled={verifyingId === b.id}
                              onClick={() => setRejectionModal({ bookingId: b.id })}
                              className="bg-ember/10 hover:bg-ember/20 text-ember border border-ember/20 px-3 py-1.5 rounded-xl font-bold text-xs transition disabled:opacity-50"
                            >
                              ✕ Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-ash text-[11px]">Selesai</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROOF IMAGE MODAL */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 bg-carbon/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-paper-white border border-fog rounded-3xl max-w-lg w-full p-6 shadow-subtle-3 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-fog pb-3">
              <h3 className="font-bold text-base text-carbon">Bukti Transfer Pembayaran</h3>
              <button
                type="button"
                onClick={() => setSelectedProof(null)}
                className="w-8 h-8 rounded-full bg-linen text-ash hover:text-carbon flex items-center justify-center font-bold border border-fog"
              >
                ✕
              </button>
            </div>
            <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-fog bg-linen">
              <Image src={selectedProof} alt="Bukti Transfer" fill className="object-contain" />
            </div>
            <button
              type="button"
              onClick={() => setSelectedProof(null)}
              className="w-full bg-lavender text-white py-2.5 rounded-full font-bold text-xs shadow-subtle"
            >
              Tutup Preview
            </button>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectionModal && (
        <div className="fixed inset-0 z-50 bg-carbon/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-paper-white border border-fog rounded-3xl max-w-sm w-full p-6 shadow-subtle-3 space-y-4">
            <h3 className="font-bold text-base text-carbon">Alasan Penolakan Pembayaran</h3>
            <p className="text-xs text-ash">
              Berikan alasan singkat mengapa bukti transfer ini ditolak (misal: nominal tidak sesuai atau gambar buram).
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Nominal transfer kurang dari tagihan / bukti transfer buram."
              className="w-full bg-linen border border-fog rounded-2xl p-3 text-xs text-carbon placeholder-ash/60 focus:outline-none focus:ring-2 focus:ring-ember h-24"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectionModal(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 rounded-full font-bold text-xs bg-linen text-graphite hover:text-carbon border border-fog"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={verifyingId === rejectionModal.bookingId}
                onClick={() => handleVerify(rejectionModal.bookingId, "reject", rejectionReason)}
                className="px-5 py-2 rounded-full font-bold text-xs bg-ember text-white shadow-subtle hover:opacity-90 disabled:opacity-50"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
