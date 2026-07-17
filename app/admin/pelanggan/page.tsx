"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  getCustomersList, 
  toggleBlockCustomer,
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction
} from "@/lib/admin-actions";

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

  // CRUD modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPassword, setFormPassword] = useState("");

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

  const handleOpenAddModal = () => {
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormPassword("");
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (c: CustomerItem) => {
    setSelectedCustomerId(c.id);
    setFormName(c.name);
    setFormEmail(c.email);
    setFormPhone(c.phone);
    setFormPassword(""); // leave blank unless changing
    setIsEditModalOpen(true);
  };

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPhone.trim()) {
      alert("Nama, Email, dan Telepon wajib diisi.");
      return;
    }
    setActionError("");
    setLoading(true);
    try {
      await createCustomerAction(formName, formEmail, formPhone, formPassword || undefined);
      setIsAddModalOpen(false);
      await fetchCustomers();
    } catch (err: any) {
      setActionError(err.message || "Gagal menambah data pelanggan.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !formName.trim() || !formEmail.trim() || !formPhone.trim()) return;
    setActionError("");
    setLoading(true);
    try {
      await updateCustomerAction(selectedCustomerId, formName, formEmail, formPhone, formPassword || undefined);
      setIsEditModalOpen(false);
      await fetchCustomers();
    } catch (err: any) {
      setActionError(err.message || "Gagal memperbarui data pelanggan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (userId: string, userName: string) => {
    const isConfirmed = window.confirm(
      `HAPUS PELANGGAN ${userName}?\nPERINGATAN: Menghapus pelanggan akan menghapus seluruh riwayat pesanan & transaksi terkait secara permanen.`
    );
    if (!isConfirmed) return;

    setActionError("");
    setUpdatingId(userId);
    try {
      await deleteCustomerAction(userId);
      await fetchCustomers();
    } catch {
      setActionError("Gagal menghapus pelanggan.");
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
            Tambah, edit, hapus, pantau seluruh pengguna terdaftar, riwayat transaksi, dan kelola pemblokiran akun bermasalah.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="bg-lavender text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-subtle hover:opacity-95 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <span>+ Tambah Pelanggan</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-linen p-4 rounded-3xl border border-fog">
        <div className="flex-grow max-w-md">
          <input
            type="text"
            placeholder="Cari pelanggan berdasarkan nama, email, atau telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-paper-white border border-fog rounded-full px-4 py-2.5 text-xs text-carbon placeholder-ash/60 focus:outline-none focus:ring-2 focus:ring-lavender transition shadow-subtle"
          />
        </div>
        <div className="text-xs font-medium text-graphite self-center">
          Total Terfilter: <strong className="text-carbon">{filteredCustomers.length}</strong> pelanggan
        </div>
      </div>

      {/* Customers List Table */}
      <div className="bg-paper-white border border-fog rounded-3xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-linen text-graphite font-bold uppercase tracking-wider border-b border-fog">
              <tr>
                <th className="py-4 px-6">Pelanggan</th>
                <th className="py-4 px-6">Kontak</th>
                <th className="py-4 px-6 text-center">Frekuensi Booking</th>
                <th className="py-4 px-6 text-right">Total Transaksi</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog">
              {loading && customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ash animate-pulse">
                    Memuat daftar pelanggan dari database...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ash">
                    Belum ada data pelanggan yang sesuai dengan kriteria pencarian Anda.
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
                    <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(c)}
                        className="bg-linen hover:bg-mist text-graphite hover:text-carbon border border-fog px-2.5 py-1.5 rounded-xl font-bold transition text-[11px]"
                      >
                        Detail
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(c)}
                        className="bg-linen hover:bg-mist text-lavender border border-fog px-2.5 py-1.5 rounded-xl font-bold transition text-[11px]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === c.id}
                        onClick={() => handleToggleBlock(c)}
                        className={`px-2.5 py-1.5 rounded-xl font-bold transition text-[11px] disabled:opacity-50 ${
                          c.isBlocked
                            ? "bg-mint-wash text-mint border border-mint/30 hover:opacity-80"
                            : "bg-ember/10 text-ember border border-ember/20 hover:opacity-80"
                        }`}
                      >
                        {c.isBlocked ? "Aktifkan" : "Blokir"}
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === c.id}
                        onClick={() => handleDeleteCustomer(c.id, c.name)}
                        className="text-red-500 hover:text-red-700 bg-red-50 border border-red-100 hover:bg-red-100 px-2.5 py-1.5 rounded-xl font-bold transition text-[11px] disabled:opacity-50"
                      >
                        Hapus
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
                <p className="text-center text-xs text-ash py-6">Belum ada riwayat pesanan.</p>
              ) : (
                <div className="space-y-3">
                  {selectedCustomer.recentBookings.map((b) => (
                    <div key={b.id} className="bg-linen border border-fog p-3.5 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-carbon">{b.courtName}</p>
                        <p className="text-[10px] text-ash mt-0.5">{b.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-carbon">Rp {b.totalPrice.toLocaleString("id-ID")}</p>
                        <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border mt-1 ${
                          b.status === "paid"
                            ? "bg-mint-wash text-mint border-mint/20"
                            : b.status === "pending"
                            ? "bg-amber/10 text-amber border-amber/20 animate-pulse"
                            : "bg-ember/10 text-ember border-ember/20"
                        }`}>
                          {b.status === "paid" ? "Lunas" : b.status === "pending" ? "Pending" : "Batal"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedCustomer(null)}
              className="w-full bg-white text-graphite border border-fog py-3 rounded-full font-bold text-xs hover:bg-mist transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-carbon/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-white border border-fog rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-subtle-3 space-y-4">
            <h3 className="font-bold text-lg text-carbon">Tambah Pelanggan Baru</h3>
            <form onSubmit={handleAddCustomerSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-ash mb-1 uppercase tracking-wider">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full bg-linen border border-fog rounded-2xl px-4 py-2.5 text-carbon"
                />
              </div>

              <div>
                <label className="block font-bold text-ash mb-1 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="budi@example.com"
                  className="w-full bg-linen border border-fog rounded-2xl px-4 py-2.5 text-carbon"
                />
              </div>

              <div>
                <label className="block font-bold text-ash mb-1 uppercase tracking-wider">Nomor Telepon</label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full bg-linen border border-fog rounded-2xl px-4 py-2.5 text-carbon"
                />
              </div>

              <div>
                <label className="block font-bold text-ash mb-1 uppercase tracking-wider">Password (Opsional)</label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Default: 123456"
                  className="w-full bg-linen border border-fog rounded-2xl px-4 py-2.5 text-carbon"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-white text-graphite border border-fog py-2.5 rounded-full font-bold hover:bg-mist transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-lavender text-white py-2.5 rounded-full font-bold hover:opacity-95 transition disabled:opacity-50"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-carbon/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-white border border-fog rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-subtle-3 space-y-4">
            <h3 className="font-bold text-lg text-carbon">Edit Data Pelanggan</h3>
            <form onSubmit={handleEditCustomerSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-ash mb-1 uppercase tracking-wider">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-linen border border-fog rounded-2xl px-4 py-2.5 text-carbon"
                />
              </div>

              <div>
                <label className="block font-bold text-ash mb-1 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-linen border border-fog rounded-2xl px-4 py-2.5 text-carbon"
                />
              </div>

              <div>
                <label className="block font-bold text-ash mb-1 uppercase tracking-wider">Nomor Telepon</label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-linen border border-fog rounded-2xl px-4 py-2.5 text-carbon"
                />
              </div>

              <div>
                <label className="block font-bold text-ash mb-1 uppercase tracking-wider">Ubah Password (Opsional)</label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Isi hanya jika ingin mengganti password"
                  className="w-full bg-linen border border-fog rounded-2xl px-4 py-2.5 text-carbon"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-white text-graphite border border-fog py-2.5 rounded-full font-bold hover:bg-mist transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-lavender text-white py-2.5 rounded-full font-bold hover:opacity-95 transition disabled:opacity-50"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
