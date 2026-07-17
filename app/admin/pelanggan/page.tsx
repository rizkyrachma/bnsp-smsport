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
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCustomersList();
      setCustomers(data);
    } catch {
      setError("Gagal mengambil data pelanggan.");
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

    setActionError("");
    setUpdatingId(c.id);
    try {
      await toggleBlockCustomer(c.id, nextState);
      await fetchCustomers();
      if (selectedCustomer?.id === c.id) {
        setSelectedCustomer((prev) => (prev ? { ...prev, isBlocked: nextState } : null));
      }
    } catch {
      setActionError("Gagal memperbarui status blokir akun.");
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
      {error && (
        <div className="bg-red-50 border border-red-200/60 rounded-3xl p-5 flex items-start gap-3 text-left shadow-subtle relative animate-fade-in">
          <div className="text-red-500 text-xl shrink-0">⚠️</div>
          <div className="flex-1">
            <h4 className="font-bold text-[10px] text-red-800 uppercase tracking-wider">Kesalahan</h4>
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

      {actionError && (
        <div className="bg-red-50 border border-red-200/60 rounded-3xl p-5 flex items-start gap-3 text-left shadow-subtle relative animate-fade-in">
          <div className="text-red-500 text-xl shrink-0">⚠️</div>
          <div className="flex-1">
            <h4 className="font-bold text-[10px] text-red-800 uppercase tracking-wider">Kesalahan</h4>
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-fog pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
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
            placeholder="Cari nama, email, atau no. HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-paper-white border border-fog rounded-full px-4 py-2.5 text-xs text-carbon placeholder-ash/60 focus:outline-none focus:ring-2 focus:ring-lavender focus:border-lavender transition shadow-subtle"
          />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-paper-white border border-fog rounded-3xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-linen text-graphite font-bold uppercase tracking-wider border-b border-fog">
              <tr>
                <th className="py-4 px-6">Pelanggan</th>
                <th className="py-4 px-6">Kontak & Telepon</th>
                <th className="py-4 px-6 text-center">Total Pesanan</th>
                <th className="py-4 px-6 text-right">Total Pengeluaran (Lunas)</th>
                <th className="py-4 px-6 text-center">Status Akun</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog">
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
                  <tr key={c.id} className="hover:bg-mist transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-lavender/10 text-lavender font-bold flex items-center justify-center text-xs border border-lavender/20">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-carbon text-sm">{c.name}</p>
                          <p className="text-[11px] text-ash">Terdaftar: {new Date(c.createdAt).toLocaleDateString("id-ID")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-carbon font-medium">{c.email}</p>
                      <p className="text-ash text-[11px]">{c.phone}</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="bg-linen px-3 py-1 rounded-full border border-fog font-bold text-carbon">
                        {c.totalBookingsCount} kali
                      </span>
                      <p className="text-[10px] text-ash mt-0.5">({c.paidBookingsCount} lunas)</p>
                    </td>
                    <td className="py-4 px-6 text-right font-black text-mint text-sm">
                      Rp {c.totalSpent.toLocaleString("id-ID")}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border ${
                          c.isBlocked
                            ? "bg-ember/10 text-ember border-ember/20"
                            : "bg-mint-wash text-mint border-mint/30"
                        }`}
                      >
                        {c.isBlocked ? "DIBLOKIR" : "AKTIF"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(c)}
                        className="bg-linen hover:bg-mist text-graphite hover:text-carbon border border-fog px-3 py-1.5 rounded-xl font-bold transition"
                      >
                        Detail
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === c.id}
                        onClick={() => handleToggleBlock(c)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition disabled:opacity-50 ${
                          c.isBlocked
                            ? "bg-mint-wash text-mint border border-mint/30 hover:opacity-80"
                            : "bg-ember/10 text-ember border border-ember/20 hover:opacity-80"
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
        <div className="fixed inset-0 z-50 bg-carbon/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-paper-white border border-fog rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-subtle-3 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-fog pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-lavender/10 text-lavender font-black flex items-center justify-center text-lg border border-lavender/20">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-carbon">{selectedCustomer.name}</h3>
                  <p className="text-xs text-ash">{selectedCustomer.email} | {selectedCustomer.phone}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-full bg-linen text-ash hover:text-carbon flex items-center justify-center font-bold border border-fog transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-linen border border-fog p-3 rounded-2xl text-center">
                <p className="text-[10px] text-ash font-bold uppercase">Total Pesanan</p>
                <p className="text-xl font-black text-carbon mt-1">{selectedCustomer.totalBookingsCount}</p>
              </div>
              <div className="bg-linen border border-fog p-3 rounded-2xl text-center">
                <p className="text-[10px] text-ash font-bold uppercase">Pesanan Lunas</p>
                <p className="text-xl font-black text-mint mt-1">{selectedCustomer.paidBookingsCount}</p>
              </div>
              <div className="bg-linen border border-fog p-3 rounded-2xl text-center">
                <p className="text-[10px] text-ash font-bold uppercase">Total Belanja</p>
                <p className="text-sm font-black text-lavender mt-1.5">Rp {selectedCustomer.totalSpent.toLocaleString("id-ID")}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ash mb-3">5 Riwayat Pesanan Terakhir</h4>
              {selectedCustomer.recentBookings.length === 0 ? (
                <p className="text-xs text-ash text-center py-6 bg-linen rounded-2xl border border-fog">
                  Belum ada riwayat pesanan.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedCustomer.recentBookings.map((b) => (
                    <div
                      key={b.id}
                      className="bg-linen border border-fog rounded-2xl p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-xs text-carbon">{b.courtName}</p>
                        <p className="text-[11px] text-ash">Tanggal: {b.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xs text-carbon">Rp {b.totalPrice.toLocaleString("id-ID")}</p>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase inline-block mt-0.5 ${
                            b.status === "paid"
                              ? "bg-mint-wash text-mint border border-mint/30"
                              : b.status === "pending"
                              ? "bg-amber/10 text-amber border border-amber/20"
                              : "bg-ember/10 text-ember border border-ember/20"
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

            <div className="pt-4 border-t border-fog flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleToggleBlock(selectedCustomer)}
                className={`px-4 py-2 rounded-full font-bold text-xs transition ${
                  selectedCustomer.isBlocked
                    ? "bg-mint-wash text-mint border border-mint/30 hover:opacity-80"
                    : "bg-ember/10 text-ember border border-ember/20 hover:opacity-80"
                }`}
              >
                {selectedCustomer.isBlocked ? "Aktifkan Akun Ini" : "Blokir & Nonaktifkan Akun Ini"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="bg-linen hover:bg-mist text-carbon px-6 py-2 rounded-full font-bold text-xs border border-fog transition"
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
