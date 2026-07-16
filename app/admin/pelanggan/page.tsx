"use client";

import { useEffect, useState, useCallback } from "react";
import { getCustomersList, toggleBlockCustomer } from "@/lib/admin-actions";

interface CustomerItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  isBlocked: boolean;
  createdAt: string;
  totalBookingsCount: number;
  paidBookingsCount: number;
  totalSpent: number;
  recentBookings: {
    id: string;
    courtName: string;
    date: string;
    totalPrice: number;
    status: string;
  }[];
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomersList();
      setCustomers(data);
    } catch {
      alert("Gagal mengambil data pelanggan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleToggleBlock = async (c: CustomerItem) => {
    const nextState = !c.isBlocked;
    const confirmMsg = nextState
      ? `Apakah Anda yakin ingin MEMBLOKIR/MENONAKTIFKAN akun ${c.name}? Pengguna ini tidak akan bisa login atau memesan lapangan lagi.`
      : `Apakah Anda yakin ingin MENGAKTIFKAN KEMBALI akun ${c.name}?`;

    if (!window.confirm(confirmMsg)) return;

    setUpdatingId(c.id);
    try {
      await toggleBlockCustomer(c.id, nextState);
      await fetchCustomers();
      if (selectedCustomer?.id === c.id) {
        setSelectedCustomer((prev) => (prev ? { ...prev, isBlocked: nextState } : null));
      }
    } catch {
      alert("Gagal memperbarui status blokir akun.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  });

  return (
    <main className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ash/20 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Kelola Pelanggan
          </h1>
          <p className="text-xs text-ash mt-1">
            Pantau seluruh pengguna terdaftar, riwayat transaksi, dan kelola pemblokiran akun bermasalah.
          </p>
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="🔍 Cari nama, email, atau no. HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#222436] border border-ash/30 rounded-full px-4 py-2.5 text-xs text-white placeholder-ash/50 focus:outline-none focus:ring-2 focus:ring-iris focus:border-iris transition"
          />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-[#222436] border border-ash/20 rounded-3xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-carbon/80 text-ash font-bold uppercase tracking-wider border-b border-ash/20">
              <tr>
                <th className="py-4 px-6">Pelanggan</th>
                <th className="py-4 px-6">Kontak & Telepon</th>
                <th className="py-4 px-6 text-center">Total Pesanan</th>
                <th className="py-4 px-6 text-right">Total Pengeluaran (Lunas)</th>
                <th className="py-4 px-6 text-center">Status Akun</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ash/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ash animate-pulse">
                    Memuat daftar pelanggan dari database...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ash">
                    Tidak ditemukan pelanggan yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-carbon/40 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-iris/20 text-iris font-bold flex items-center justify-center text-xs">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{c.name}</p>
                          <p className="text-[11px] text-ash">Terdaftar: {new Date(c.createdAt).toLocaleDateString("id-ID")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-white font-medium">{c.email}</p>
                      <p className="text-ash text-[11px]">{c.phone}</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="bg-carbon px-3 py-1 rounded-full border border-ash/20 font-bold text-white">
                        {c.totalBookingsCount} kali
                      </span>
                      <p className="text-[10px] text-ash mt-0.5">({c.paidBookingsCount} lunas)</p>
                    </td>
                    <td className="py-4 px-6 text-right font-black text-emerald-400 text-sm">
                      Rp {c.totalSpent.toLocaleString("id-ID")}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border ${
                          c.isBlocked
                            ? "bg-red-500/15 text-red-400 border-red-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {c.isBlocked ? "🚫 DIBLOKIR" : "🟢 AKTIF"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(c)}
                        className="bg-carbon hover:bg-carbon/80 text-iris border border-iris/30 px-3 py-1.5 rounded-xl font-bold transition"
                      >
                        Detail
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === c.id}
                        onClick={() => handleToggleBlock(c)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition disabled:opacity-50 ${
                          c.isBlocked
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                            : "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25"
                        }`}
                      >
                        {updatingId === c.id
                          ? "..."
                          : c.isBlocked
                          ? "Aktifkan"
                          : "Blokir"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL CUSTOMER MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-carbon/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#222436] border border-ash/20 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-subtle-3 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-ash/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-iris/20 text-iris font-black flex items-center justify-center text-lg">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{selectedCustomer.name}</h3>
                  <p className="text-xs text-ash">{selectedCustomer.email} | {selectedCustomer.phone}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-full bg-carbon text-ash hover:text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-carbon/60 border border-ash/20 p-3 rounded-2xl text-center">
                <p className="text-[10px] text-ash font-bold uppercase">Total Pesanan</p>
                <p className="text-xl font-black text-white mt-1">{selectedCustomer.totalBookingsCount}</p>
              </div>
              <div className="bg-carbon/60 border border-ash/20 p-3 rounded-2xl text-center">
                <p className="text-[10px] text-ash font-bold uppercase">Pesanan Lunas</p>
                <p className="text-xl font-black text-emerald-400 mt-1">{selectedCustomer.paidBookingsCount}</p>
              </div>
              <div className="bg-carbon/60 border border-ash/20 p-3 rounded-2xl text-center">
                <p className="text-[10px] text-ash font-bold uppercase">Total Belanja</p>
                <p className="text-sm font-black text-iris mt-1.5">Rp {selectedCustomer.totalSpent.toLocaleString("id-ID")}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ash mb-3">5 Riwayat Pesanan Terakhir</h4>
              {selectedCustomer.recentBookings.length === 0 ? (
                <p className="text-xs text-ash text-center py-6 bg-carbon/40 rounded-2xl border border-ash/10">
                  Belum ada riwayat pesanan.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedCustomer.recentBookings.map((b) => (
                    <div
                      key={b.id}
                      className="bg-carbon/80 border border-ash/20 rounded-2xl p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-xs text-white">{b.courtName}</p>
                        <p className="text-[11px] text-ash">Tanggal: {b.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xs text-white">Rp {b.totalPrice.toLocaleString("id-ID")}</p>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase inline-block mt-0.5 ${
                            b.status === "paid"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : b.status === "pending"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : "bg-red-500/15 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-ash/20 flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleToggleBlock(selectedCustomer)}
                className={`px-4 py-2 rounded-full font-bold text-xs transition ${
                  selectedCustomer.isBlocked
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-red-500/20 text-red-400 border border-red-500/40"
                }`}
              >
                {selectedCustomer.isBlocked ? "✅ Aktifkan Akun Ini" : "🚫 Blokir & Nonaktifkan Akun Ini"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="bg-carbon text-white px-6 py-2 rounded-full font-bold text-xs border border-ash/30 hover:bg-ash/20 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
