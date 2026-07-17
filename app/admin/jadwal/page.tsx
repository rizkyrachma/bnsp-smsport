"use client";

import { useEffect, useState, useCallback } from "react";
import { getAdminDashboardData, updateCourtStatus } from "@/lib/admin-actions";

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

  const fetchCourts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminDashboardData();
      setCourts(data.courtsStatus);
    } catch {
      alert("Gagal memuat status lapangan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourts();
  }, [fetchCourts]);

  const handleStatusChange = async (courtId: string, nextStatus: "tersedia" | "dipesan" | "perbaikan") => {
    const court = courts.find((c) => c.id === courtId);
    const courtName = court ? court.name : "Lapangan";
    const statusText = nextStatus === "tersedia" ? "TERSEDIA" : "DALAM PERBAIKAN";
    
    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin mengubah status ${courtName} menjadi "${statusText}"?`
    );
    if (!isConfirmed) return;

    setUpdatingId(courtId);
    try {
      await updateCourtStatus(courtId, nextStatus);
      await fetchCourts();
    } catch {
      alert("Gagal memperbarui status lapangan.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full pb-20">
      <div className="border-b border-fog pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
          Manajemen &amp; Blokir Jadwal Lapangan
        </h1>
        <p className="text-xs text-ash mt-1">
          Ubah status lapangan menjadi &quot;Dalam Perbaikan&quot; (Perawatan/Turnamen) untuk memblokir seluruh slot secara instan.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-amber/10 border border-amber/30 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber/20 text-amber flex items-center justify-center font-bold flex-shrink-0">
            !
          </div>
          <div>
            <h3 className="font-bold text-sm text-carbon">Cara Kerja Blokir Perawatan</h3>
            <p className="text-xs text-graphite mt-0.5 leading-relaxed">
              Jika status lapangan diubah ke <strong className="text-amber">Dalam Perbaikan</strong>, maka pada halaman kalender pelanggan seluruh slot jam di lapangan tersebut otomatis berubah menjadi <strong className="text-amber">Dalam Perawatan</strong> dan tidak bisa dipesan.
            </p>
          </div>
        </div>
      </div>

      {/* Courts Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
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
                <span className="bg-amber/15 text-amber border border-amber/30 px-3 py-1 rounded-full text-xs font-black">
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

                  <h2 className="text-lg font-bold text-carbon">{c.name}</h2>
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
                          : "bg-linen hover:bg-mist text-amber border border-amber/30"
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
    </main>
  );
}
