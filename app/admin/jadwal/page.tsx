"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  getAdminDashboardData, 
  updateCourtStatus, 
  createCourt, 
  updateCourt, 
  deleteCourt 
} from "@/lib/admin-actions";

interface CourtInfo {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
  status: "tersedia" | "dipesan" | "perbaikan";
  activeBooking: { id: string; start: string; end: string; status: string } | null;
}

export default function AdminJadwalPage() {
  const [courts, setCourts] = useState<CourtInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  // CRUD modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"futsal" | "badminton">("futsal");
  const [formPrice, setFormPrice] = useState(100000);
  const [formStatus, setFormStatus] = useState<"tersedia" | "perbaikan">("tersedia");

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

  const fetchCourts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminDashboardData();
      setCourts(data.courtsStatus);
    } catch {
      setError("Gagal memuat status lapangan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourts();
  }, [fetchCourts]);

  const handleStatusChange = (courtId: string, nextStatus: "tersedia" | "dipesan" | "perbaikan") => {
    const court = courts.find((c) => c.id === courtId);
    const courtName = court ? court.name : "Lapangan";
    const statusText = nextStatus === "tersedia" ? "TERSEDIA" : "DALAM PERBAIKAN";

    setConfirmModal({
      isOpen: true,
      title: "Ubah Status Lapangan",
      message: `Apakah Anda yakin ingin mengubah status ${courtName} menjadi "${statusText}"?`,
      onConfirm: async () => {
        setActionError("");
        setUpdatingId(courtId);
        try {
          await updateCourtStatus(courtId, nextStatus);
          await fetchCourts();
        } catch {
          setActionError("Gagal memperbarui status lapangan.");
        } finally {
          setUpdatingId(null);
        }
      },
    });
  };

  const handleOpenAddModal = () => {
    setActionError("");
    setFormName("");
    setFormType("futsal");
    setFormPrice(100000);
    setFormStatus("tersedia");
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (c: CourtInfo) => {
    setActionError("");
    setSelectedCourtId(c.id);
    setFormName(c.name);
    setFormType(c.type === "badminton" ? "badminton" : "futsal");
    setFormPrice(c.pricePerHour);
    setFormStatus(c.status === "perbaikan" ? "perbaikan" : "tersedia");
    setIsEditModalOpen(true);
  };

  const handleAddCourtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setActionError("Nama lapangan wajib diisi.");
      return;
    }
    setActionError("");
    setLoading(true);
    try {
      await createCourt(formName, formType, formPrice, formStatus);
      setIsAddModalOpen(false);
      await fetchCourts();
    } catch {
      setActionError("Gagal menambah data lapangan.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCourtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourtId || !formName.trim()) return;
    setActionError("");
    setLoading(true);
    try {
      await updateCourt(selectedCourtId, formName, formType, formPrice, formStatus);
      setIsEditModalOpen(false);
      await fetchCourts();
    } catch {
      setActionError("Gagal memperbarui data lapangan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourt = (courtId: string, courtName: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Lapangan",
      message: `HAPUS LAPANGAN ${courtName}?\nPERINGATAN: Menghapus lapangan akan menghapus seluruh data reservasi terkait secara permanen.`,
      onConfirm: async () => {
        setActionError("");
        setUpdatingId(courtId);
        try {
          await deleteCourt(courtId);
          await fetchCourts();
        } catch {
          setActionError("Gagal menghapus lapangan.");
        } finally {
          setUpdatingId(null);
        }
      },
    });
  };

  return (
    <main className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full pb-20">
      {error && (
        <div className="bg-red-50 border border-red-200/60 rounded-3xl p-5 flex items-start gap-3 text-left shadow-subtle relative animate-fade-in">
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

      {actionError && (
        <div className="bg-red-50 border border-red-200/60 rounded-3xl p-5 flex items-start gap-3 text-left shadow-subtle relative animate-fade-in">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-fog pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
            Manajemen &amp; Blokir Jadwal Lapangan
          </h1>
          <p className="text-xs text-ash mt-1">
            Tambah, edit, hapus lapangan, atau ubah status lapangan menjadi &quot;Dalam Perbaikan&quot; untuk memblokir seluruh slot secara instan.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="bg-lavender text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-subtle hover:opacity-95 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <span>+ Tambah Lapangan</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-amber/10 border border-amber/30 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber/20 text-amber flex items-center justify-center font-bold flex-shrink-0">
            !
          </div>
          <div>
            <h2 className="font-bold text-sm text-carbon">Panduan Manajemen Lapangan</h2>
            <p className="text-xs text-graphite mt-0.5 leading-relaxed">
              Semua perubahan detail lapangan (harga, tipe, nama) akan langsung ter-sinkronisasi ke halaman customer.
              Mengubah status ke <strong className="text-amber-900">Dalam Perbaikan</strong> otomatis memblokir pesanan baru pada lapangan tersebut.
            </p>
          </div>
        </div>
      </div>

      {/* Courts Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && courts.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-ash animate-pulse">
            Memuat data lapangan dari database...
          </div>
        ) : (
          courts.map((c) => {
            let statusBadge = (
              <span className="bg-mint-wash text-mint border border-mint/30 px-3 py-1 rounded-full text-xs font-black">
                TERSEDIA
              </span>
            );

            if (c.status === "perbaikan") {
              statusBadge = (
                <span className="bg-amber/15 text-amber-900 border border-amber/30 px-3 py-1 rounded-full text-xs font-black">
                  DALAM PERBAIKAN
                </span>
              );
            } else if (c.status === "dipesan") {
              statusBadge = (
                <span className="bg-lavender/15 text-lavender border border-lavender/30 px-3 py-1 rounded-full text-xs font-black">
                  SEDANG DIPAKAI
                </span>
              );
            }

            return (
              <div
                key={c.id}
                className="bg-paper-white border border-fog rounded-3xl p-6 shadow-subtle flex flex-col justify-between gap-6 transition hover:border-graphite/30"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-graphite bg-linen px-3 py-1 rounded-full border border-fog">
                      {c.type}
                    </span>
                    {statusBadge}
                  </div>

                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-bold text-carbon">{c.name}</h2>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(c)}
                        className="text-xs text-lavender hover:underline font-bold"
                      >
                        Edit
                      </button>
                      <span className="text-fog">|</span>
                      <button
                        type="button"
                        disabled={updatingId === c.id}
                        onClick={() => handleDeleteCourt(c.id, c.name)}
                        className="text-xs text-red-700 hover:underline font-bold disabled:opacity-40"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-ash mt-1">Tarif: Rp {c.pricePerHour.toLocaleString("id-ID")}/jam</p>

                  {c.activeBooking && (
                    <div className="mt-4 bg-linen border border-lavender/30 p-3 rounded-2xl">
                      <p className="text-[10px] font-bold uppercase text-lavender">Sedang Digunakan</p>
                      <p className="text-xs text-carbon font-semibold mt-0.5">
                        Jam {c.activeBooking.start} - {c.activeBooking.end} WIB
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t border-fog">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ash mb-2">Ubah Status Lapangan:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={updatingId === c.id || c.status === "tersedia"}
                      onClick={() => handleStatusChange(c.id, "tersedia")}
                      className={`py-2 px-3 rounded-2xl text-xs font-bold transition disabled:opacity-40 ${
                        c.status === "tersedia"
                          ? "bg-mint text-white shadow-subtle"
                          : "bg-linen hover:bg-mist text-mint border border-mint/30"
                      }`}
                    >
                      Tersedia
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === c.id || c.status === "perbaikan"}
                      onClick={() => handleStatusChange(c.id, "perbaikan")}
                      className={`py-2 px-3 rounded-2xl text-xs font-bold transition disabled:opacity-40 ${
                        c.status === "perbaikan"
                          ? "bg-amber text-carbon font-black shadow-subtle"
                          : "bg-linen hover:bg-mist text-[#78350f] border border-amber/30"
                      }`}
                    >
                      Perbaikan
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD COURT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-carbon/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-white border border-fog rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-subtle-3 space-y-4">
            <h3 className="font-bold text-lg text-carbon">Tambah Lapangan Baru</h3>
            {actionError && (
              <div className="bg-red-50 border border-red-200/60 rounded-2xl p-4 text-left text-red-700 text-xs leading-relaxed animate-fade-in">
                ⚠️ {actionError}
              </div>
            )}
            <form onSubmit={handleAddCourtSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-ash mb-1 uppercase tracking-wider">Nama Lapangan</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Lapangan Futsal A"
                  className="w-full bg-linen border border-fog rounded-2xl px-4 py-2.5 text-carbon"
                />
              </div>

              <div>
                <label className="block font-bold text-ash mb-1 uppercase tracking-wider">Tipe Olahraga</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                  className="w-full bg-linen border border-fog rounded-2xl px-4 py-2.5 text-carbon"
                >
                  <option value="futsal">Futsal</option>
                  <option value="badminton">Badminton</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-ash mb-1 uppercase tracking-wider">Harga per Jam (Rp)</label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  className="w-full bg-linen border border-fog rounded-2xl px-4 py-2.5 text-carbon"
                />
              </div>

              <div>
                <label className="block font-bold text-ash mb-1 uppercase tracking-wider">Status Awal</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full bg-linen border border-fog rounded-2xl px-4 py-2.5 text-carbon"
                >
                  <option value="tersedia">Tersedia</option>
                  <option value="perbaikan">Perbaikan (Dalam Perawatan)</option>
                </select>
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

      {/* EDIT COURT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-carbon/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-white border border-fog rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-subtle-3 space-y-4">
            <h3 className="font-bold text-lg text-carbon">Edit Lapangan</h3>
            {actionError && (
              <div className="bg-red-50 border border-red-200/60 rounded-2xl p-4 text-left text-red-700 text-xs leading-relaxed animate-fade-in">
                ⚠️ {actionError}
              </div>
            )}
            <form onSubmit={handleEditCourtSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-ash mb-1 uppercase tracking-wider">Nama Lapangan</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-linen border border-fog rounded-2xl px-4 py-2.5 text-carbon"
                />
              </div>

              <div>
                <label className="block font-bold text-ash mb-1 uppercase tracking-wider">Tipe Olahraga</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                  className="w-full bg-linen border border-fog rounded-2xl px-4 py-2.5 text-carbon"
                >
                  <option value="futsal">Futsal</option>
                  <option value="badminton">Badminton</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-ash mb-1 uppercase tracking-wider">Harga per Jam (Rp)</label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  className="w-full bg-linen border border-fog rounded-2xl px-4 py-2.5 text-carbon"
                />
              </div>

              <div>
                <label className="block font-bold text-ash mb-1 uppercase tracking-wider">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full bg-linen border border-fog rounded-2xl px-4 py-2.5 text-carbon"
                >
                  <option value="tersedia">Tersedia</option>
                  <option value="perbaikan">Perbaikan (Dalam Perawatan)</option>
                </select>
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

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-carbon/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-paper-white border border-fog rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-subtle-3 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-ember/10 text-ember-800 font-black flex items-center justify-center text-xl border border-ember/20 mx-auto">
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
