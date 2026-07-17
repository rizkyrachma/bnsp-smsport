"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAdminBookings,
  createAdminBooking,
  updateAdminBooking,
  deleteAdminBooking,
  getCourtsList,
  getCustomersList
} from "@/lib/admin-actions";
import CountdownBadge from "@/app/(customer)/_components/CountdownBadge";

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

const HOURS = Array.from({ length: 16 }, (_, i) => {
  const h = i + 8;
  return `${h.toString().padStart(2, "0")}:00`;
});

export default function AdminRiwayatPage() {
  const [bookings, setBookings] = useState<AdminBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [courtTypeFilter, setCourtTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [alertState, setAlertState] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<AdminBookingItem | null>(null);

  // Custom confirm modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Dropdown lists
  const [customers, setCustomers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [courts, setCourts] = useState<{ id: string; name: string; pricePerHour: number }[]>([]);

  // Create form state
  const [createUserId, setCreateUserId] = useState("");
  const [createCourtId, setCreateCourtId] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [createStart, setCreateStart] = useState("08:00");
  const [createEnd, setCreateEnd] = useState("09:00");
  const [createStatus, setCreateStatus] = useState<"pending" | "paid" | "cancelled">("pending");

  // Edit form state
  const [editCourtId, setEditCourtId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editStatus, setEditStatus] = useState<"pending" | "paid" | "cancelled">("pending");
  const [editPrice, setEditPrice] = useState(0);

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

  const loadOptions = useCallback(async () => {
    try {
      const [custData, courtData] = await Promise.all([
        getCustomersList(),
        getCourtsList()
      ]);
      setCustomers(custData.map((c) => ({ id: c.id, name: c.name, email: c.email })));
      setCourts(courtData);
    } catch {
      console.error("Gagal memuat opsi pelanggan/lapangan");
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const handleOpenCreateModal = () => {
    if (customers.length === 0 || courts.length === 0) {
      setAlertState({ message: "Harap buat data pelanggan dan lapangan terlebih dahulu.", type: "error" });
      return;
    }
    setAlertState(null);
    setCreateUserId(customers[0]?.id || "");
    setCreateCourtId(courts[0]?.id || "");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setCreateDate(tomorrow.toISOString().slice(0, 10));
    setCreateStart("08:00");
    setCreateEnd("09:00");
    setCreateStatus("pending");
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertState(null);
    try {
      await createAdminBooking({
        userId: createUserId,
        courtId: createCourtId,
        bookingDate: createDate,
        startTime: createStart,
        endTime: createEnd,
        status: createStatus,
      });
      setIsCreateOpen(false);
      setAlertState({ message: "Reservasi baru berhasil ditambahkan.", type: "success" });
      fetchBookings();
    } catch (err: any) {
      setAlertState({ message: err.message || "Gagal membuat reservasi baru.", type: "error" });
    }
  };

  const handleOpenEditModal = (b: AdminBookingItem) => {
    setAlertState(null);
    setEditingBooking(b);
    setEditCourtId(b.courtId);
    setEditDate(b.bookingDate);
    setEditStart(b.startTime);
    setEditEnd(b.endTime);
    setEditStatus(b.status as any);
    setEditPrice(b.totalPrice);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    setAlertState(null);
    try {
      await updateAdminBooking(editingBooking.id, {
        courtId: editCourtId,
        bookingDate: editDate,
        startTime: editStart,
        endTime: editEnd,
        status: editStatus,
        totalPrice: Number(editPrice),
      });
      setIsEditOpen(false);
      setAlertState({ message: "Reservasi berhasil diperbarui.", type: "success" });
      fetchBookings();
    } catch (err: any) {
      setAlertState({ message: err.message || "Gagal memperbarui reservasi.", type: "error" });
    }
  };

  const handleDelete = (bookingId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Reservasi",
      message: "Apakah Anda yakin ingin menghapus reservasi ini secara permanen? Tindakan ini tidak dapat dibatalkan.",
      onConfirm: async () => {
        setAlertState(null);
        try {
          await deleteAdminBooking(bookingId);
          setAlertState({ message: "Reservasi berhasil dihapus.", type: "success" });
          fetchBookings();
        } catch (err: any) {
          setAlertState({ message: err.message || "Gagal menghapus reservasi.", type: "error" });
        }
      }
    });
  };

  // Helper to dynamically calculate price in modals
  const calculatePrice = (courtId: string, start: string, end: string) => {
    const court = courts.find(c => c.id === courtId);
    if (!court) return 0;
    const [startH] = start.split(":").map(Number);
    const [endH] = end.split(":").map(Number);
    const duration = endH - startH;
    return duration > 0 ? court.pricePerHour * duration : 0;
  };

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

        {/* Actions & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto bg-lavender text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-subtle hover:opacity-95 transition flex items-center justify-center gap-1.5 cursor-pointer border-none outline-none"
          >
            <span>+ Tambah Reservasi</span>
          </button>
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
                <th className="py-4 px-6 text-center">Aksi</th>
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
                        {b.status === "pending" ? (
                          <CountdownBadge
                            createdAt={b.createdAt}
                            onExpire={() => fetchBookings()}
                          />
                        ) : (
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-wider border ${
                              b.status === "paid"
                                ? "bg-mint-wash text-mint border-mint/30"
                                : "bg-ember/10 text-ember border-ember/20"
                            }`}
                          >
                            {b.status === "paid" ? "LUNAS / TERVERIFIKASI" : "DIBATALKAN"}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(b)}
                            className="bg-paper-white border border-fog text-carbon px-3 py-1.5 rounded-xl hover:bg-mist text-[11px] font-bold transition cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(b.id)}
                            className="bg-red-50 border border-red-200/60 text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-100/50 text-[11px] font-bold transition cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-carbon/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper-white border border-fog rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-subtle-3 max-h-[90vh] overflow-y-auto space-y-6">
            <div>
              <h3 className="text-lg font-bold text-carbon">Tambah Reservasi Manual</h3>
              <p className="text-xs text-ash">Buat pemesanan lapangan baru secara manual atas nama pelanggan.</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ash uppercase tracking-wider">Pilih Pelanggan</label>
                <select
                  value={createUserId}
                  onChange={(e) => setCreateUserId(e.target.value)}
                  className="w-full bg-paper-white border border-fog rounded-2xl px-3 py-2 text-xs text-carbon focus:outline-none focus:ring-2 focus:ring-lavender"
                  required
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ash uppercase tracking-wider">Pilih Lapangan</label>
                <select
                  value={createCourtId}
                  onChange={(e) => setCreateCourtId(e.target.value)}
                  className="w-full bg-paper-white border border-fog rounded-2xl px-3 py-2 text-xs text-carbon focus:outline-none focus:ring-2 focus:ring-lavender"
                  required
                >
                  {courts.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - Rp {c.pricePerHour.toLocaleString("id-ID")}/jam</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ash uppercase tracking-wider">Tanggal Main</label>
                <input
                  type="date"
                  value={createDate}
                  onChange={(e) => setCreateDate(e.target.value)}
                  className="w-full bg-paper-white border border-fog rounded-2xl px-3 py-2 text-xs text-carbon focus:outline-none focus:ring-2 focus:ring-lavender"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ash uppercase tracking-wider">Jam Mulai</label>
                  <select
                    value={createStart}
                    onChange={(e) => setCreateStart(e.target.value)}
                    className="w-full bg-paper-white border border-fog rounded-2xl px-3 py-2 text-xs text-carbon focus:outline-none focus:ring-2 focus:ring-lavender"
                  >
                    {HOURS.slice(0, -1).map(h => (
                      <option key={h} value={h}>{h} WIB</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ash uppercase tracking-wider">Jam Selesai</label>
                  <select
                    value={createEnd}
                    onChange={(e) => setCreateEnd(e.target.value)}
                    className="w-full bg-paper-white border border-fog rounded-2xl px-3 py-2 text-xs text-carbon focus:outline-none focus:ring-2 focus:ring-lavender"
                  >
                    {HOURS.filter(h => h > createStart).map(h => (
                      <option key={h} value={h}>{h} WIB</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ash uppercase tracking-wider">Status Pesanan</label>
                <select
                  value={createStatus}
                  onChange={(e) => setCreateStatus(e.target.value as any)}
                  className="w-full bg-paper-white border border-fog rounded-2xl px-3 py-2 text-xs text-carbon focus:outline-none focus:ring-2 focus:ring-lavender"
                >
                  <option value="pending">Pending / Menunggu Bayar</option>
                  <option value="paid">Paid / Lunas Terverifikasi</option>
                  <option value="cancelled">Cancelled / Dibatalkan</option>
                </select>
              </div>

              <div className="bg-[#fcfcfc] border border-gray-100 rounded-2xl p-4 text-xs flex justify-between items-center">
                <span className="text-gray-400 font-medium">Estimasi Biaya:</span>
                <span className="font-extrabold text-lavender text-sm">
                  Rp {calculatePrice(createCourtId, createStart, createEnd).toLocaleString("id-ID")}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="bg-paper-white border border-fog text-carbon px-5 py-2.5 rounded-full text-xs font-bold hover:bg-mist transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-lavender text-white px-5 py-2.5 rounded-full text-xs font-bold hover:opacity-95 transition cursor-pointer"
                >
                  Simpan Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && editingBooking && (
        <div className="fixed inset-0 bg-carbon/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper-white border border-fog rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-subtle-3 max-h-[90vh] overflow-y-auto space-y-6">
            <div>
              <h3 className="text-lg font-bold text-carbon">Edit Data Reservasi</h3>
              <p className="text-xs text-ash">Ubah parameter reservasi ID: <span className="font-mono">{editingBooking.id.slice(0,8).toUpperCase()}</span></p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ash uppercase tracking-wider">Nama Pelanggan</label>
                <input
                  type="text"
                  value={`${editingBooking.userName} (${editingBooking.userEmail})`}
                  className="w-full bg-linen border border-fog rounded-2xl px-3 py-2 text-xs text-graphite focus:outline-none cursor-not-allowed"
                  disabled
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ash uppercase tracking-wider">Pilih Lapangan</label>
                <select
                  value={editCourtId}
                  onChange={(e) => {
                    setEditCourtId(e.target.value);
                    // auto calculate new price if changing court
                    const newPrice = calculatePrice(e.target.value, editStart, editEnd);
                    setEditPrice(newPrice);
                  }}
                  className="w-full bg-paper-white border border-fog rounded-2xl px-3 py-2 text-xs text-carbon focus:outline-none focus:ring-2 focus:ring-lavender"
                  required
                >
                  {courts.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - Rp {c.pricePerHour.toLocaleString("id-ID")}/jam</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ash uppercase tracking-wider">Tanggal Main</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-paper-white border border-fog rounded-2xl px-3 py-2 text-xs text-carbon focus:outline-none focus:ring-2 focus:ring-lavender"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ash uppercase tracking-wider">Jam Mulai</label>
                  <select
                    value={editStart}
                    onChange={(e) => {
                      setEditStart(e.target.value);
                      const newPrice = calculatePrice(editCourtId, e.target.value, editEnd);
                      setEditPrice(newPrice);
                    }}
                    className="w-full bg-paper-white border border-fog rounded-2xl px-3 py-2 text-xs text-carbon focus:outline-none focus:ring-2 focus:ring-lavender"
                  >
                    {HOURS.slice(0, -1).map(h => (
                      <option key={h} value={h}>{h} WIB</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ash uppercase tracking-wider">Jam Selesai</label>
                  <select
                    value={editEnd}
                    onChange={(e) => {
                      setEditEnd(e.target.value);
                      const newPrice = calculatePrice(editCourtId, editStart, e.target.value);
                      setEditPrice(newPrice);
                    }}
                    className="w-full bg-paper-white border border-fog rounded-2xl px-3 py-2 text-xs text-carbon focus:outline-none focus:ring-2 focus:ring-lavender"
                  >
                    {HOURS.filter(h => h > editStart).map(h => (
                      <option key={h} value={h}>{h} WIB</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ash uppercase tracking-wider">Status Pesanan</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-paper-white border border-fog rounded-2xl px-3 py-2 text-xs text-carbon focus:outline-none focus:ring-2 focus:ring-lavender"
                >
                  <option value="pending">Pending / Menunggu Bayar</option>
                  <option value="paid">Paid / Lunas Terverifikasi</option>
                  <option value="cancelled">Cancelled / Dibatalkan</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ash uppercase tracking-wider">Total Biaya Sewa (Rp)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full bg-paper-white border border-fog rounded-2xl px-3 py-2 text-xs text-carbon focus:outline-none focus:ring-2 focus:ring-lavender font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="bg-paper-white border border-fog text-carbon px-5 py-2.5 rounded-full text-xs font-bold hover:bg-mist transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-lavender text-white px-5 py-2.5 rounded-full text-xs font-bold hover:opacity-95 transition cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-carbon/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-paper-white border border-fog rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-subtle-3 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-ember/10 text-ember font-black flex items-center justify-center text-xl border border-ember/20 mx-auto">
                ⚠️
              </div>
              <h3 className="font-bold text-base text-carbon">{confirmModal.title}</h3>
              <p className="text-xs text-ash leading-relaxed whitespace-pre-line">{confirmModal.message}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 bg-white text-graphite border border-fog py-2.5 rounded-full font-bold text-xs hover:bg-mist transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="flex-1 bg-lavender text-white py-2.5 rounded-full font-bold text-xs hover:opacity-95 transition cursor-pointer"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
