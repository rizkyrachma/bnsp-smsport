"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BRAND_INFO } from "@/lib/assets";
import ClientNavbar from "../_components/ClientNavbar";

interface BookingItem {
  id: string;
  userId: string;
  courtId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
  court: {
    name: string;
    type: string;
  };
  payment?: {
    id: string;
    paymentMethod: string | null;
    amount: number;
    proofUrl: string | null;
    paymentStatus: string;
  } | null;
}

function RiwayatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const payBookingId = searchParams.get("payBooking") || "";

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Payment upload modal state
  const [activePayBooking, setActivePayBooking] = useState<BookingItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer");
  const [proofInput, setProofInput] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [payError, setPayError] = useState<string>("");
  const [paySuccess, setPaySuccess] = useState<boolean>(false);

  // E-Ticket view state
  const [ticketBooking, setTicketBooking] = useState<BookingItem | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bookings");
      if (res.status === 401) {
        router.push("/login?redirect=/riwayat");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal memuat riwayat booking.");
      } else {
        const list = data.bookings || [];
        setBookings(list);
        if (payBookingId) {
          const match = list.find((b: BookingItem) => b.id === payBookingId);
          if (match && match.status === "pending") {
            setActivePayBooking(match);
          }
        }
      }
    } catch {
      setError("Terjadi kesalahan koneksi jaringan.");
    } finally {
      setLoading(false);
    }
  }, [router, payBookingId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle manual transfer proof upload / QRIS simulation (§6 & §4.2)
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayBooking) return;
    setUploading(true);
    setPayError("");
    setPaySuccess(false);

    try {
      const res = await fetch("/api/payments/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: activePayBooking.id,
          paymentMethod,
          proofUrl: proofInput || (paymentMethod !== "bank_transfer" ? "https://placehold.co/400x400?text=QRIS/VA+Success" : ""),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPayError(data.error || "Gagal mengirim bukti pembayaran.");
        return;
      }

      setPaySuccess(true);
      setTimeout(() => {
        setActivePayBooking(null);
        setProofInput("");
        setPaySuccess(false);
        fetchBookings();
      }, 1500);
    } catch {
      setPayError("Terjadi kesalahan jaringan.");
    } finally {
      setUploading(false);
    }
  };

  // Format date & time
  const formatDateTime = (dateStr: string, startStr: string, endStr: string) => {
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    // Extract HH:mm
    const startH = new Date(startStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const endH = new Date(endStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    return `${dateFormatted} | ${startH} - ${endH} WIB`;
  };

  return (
    <div className="min-h-screen bg-paper-white text-carbon flex flex-col font-sans">
      {/* Navbar */}
      <ClientNavbar activePage="riwayat" />

      <main className="flex-grow max-w-6xl mx-auto px-4 py-10 w-full">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-carbon tracking-tight">
              Riwayat Booking Saya
            </h1>
            <p className="text-graphite text-sm mt-1">
              Pantau status pemesanan, lakukan konfirmasi pembayaran, dan unduh e-tiket reservasi lapanganmu.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchBookings}
            className="bg-mist text-graphite border border-fog px-4 py-2 rounded-full text-xs font-semibold hover:bg-fog/50 transition flex items-center gap-2 shadow-subtle"
          >
            <span>Segarkan Data</span>
          </button>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-lavender border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-graphite text-sm">Memuat daftar reservasi lapangan milikmu...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-3xl text-center">
            <p className="font-bold">{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-linen border border-fog rounded-3xl p-12 text-center max-w-lg mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-lavender/15 text-lavender flex items-center justify-center font-bold text-2xl mx-auto mb-4">
              📅
            </div>
            <h3 className="font-bold text-carbon text-lg mb-2">Belum Ada Riwayat Reservasi</h3>
            <p className="text-graphite text-sm mb-6 leading-relaxed">
              Kamu belum memiliki pesanan lapangan apa pun. Cek jadwal dan lakukan booking lapangan pertamamu sekarang!
            </p>
            <Link
              href="/booking"
              className="bg-lavender text-white px-6 py-3 rounded-full font-bold text-sm shadow-subtle hover:opacity-95 transition inline-block"
            >
              Cek Jadwal &amp; Booking
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((item) => {
              const isPending = item.status === "pending";
              const isPaid = item.status === "paid";
              const isCancelled = item.status === "cancelled";
              const hasSubmittedProof = item.payment && item.payment.proofUrl;

              return (
                <div
                  key={item.id}
                  className="bg-paper-white border border-fog rounded-3xl p-6 md:p-8 shadow-subtle-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition hover:border-lavender/40"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider bg-mist text-carbon px-3 py-0.5 rounded-full border border-fog">
                        {item.court.type}
                      </span>

                      {isPending && (
                        <span className="text-xs font-semibold px-3 py-0.5 rounded-full bg-amber/15 text-amber border border-amber/20 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
                          {hasSubmittedProof ? "Menunggu Verifikasi Admin" : "Pending (Hold Slot 15 Menit)"}
                        </span>
                      )}

                      {isPaid && (
                        <span className="text-xs font-semibold px-3 py-0.5 rounded-full bg-mint-wash text-mint border border-mint/20 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-mint" />
                          Terverifikasi / Lunas
                        </span>
                      )}

                      {isCancelled && (
                        <span className="text-xs font-semibold px-3 py-0.5 rounded-full bg-fog text-ash border border-ash/30 flex items-center gap-1.5">
                          ● Dibatalkan / Kedaluwarsa
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-carbon">
                      {item.court.name}
                    </h3>
                    <p className="text-xs font-medium text-graphite">
                      {formatDateTime(item.bookingDate, item.startTime, item.endTime)}
                    </p>
                    <p className="text-xs text-ash">
                      Booking ID: <code className="font-mono text-carbon">{item.id}</code>
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-fog">
                    <div className="text-left md:text-right">
                      <span className="text-xs text-ash block">Total Tagihan</span>
                      <span className="text-xl font-black text-carbon">
                        Rp {item.totalPrice.toLocaleString("id-ID")}
                      </span>
                      {hasSubmittedProof && (
                        <span className="text-[11px] text-mint font-semibold block mt-0.5">
                          ✓ Bukti diunggah
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                      {isPending && !hasSubmittedProof && (
                        <button
                          type="button"
                          onClick={() => {
                            setActivePayBooking(item);
                            setPayError("");
                            setPaySuccess(false);
                          }}
                          className="w-full sm:w-auto bg-lavender text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-subtle hover:opacity-95 transition"
                        >
                          Bayar / Unggah Bukti
                        </button>
                      )}

                      {isPending && hasSubmittedProof && (
                        <button
                          type="button"
                          onClick={() => {
                            setActivePayBooking(item);
                            setPayError("");
                            setPaySuccess(false);
                          }}
                          className="w-full sm:w-auto bg-mist text-graphite border border-fog px-4 py-2.5 rounded-full font-semibold text-xs hover:bg-fog/40 transition"
                        >
                          Lihat / Ubah Bukti
                        </button>
                      )}

                      {isPaid && (
                        <button
                          type="button"
                          onClick={() => setTicketBooking(item)}
                          className="w-full sm:w-auto bg-iris text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-subtle hover:opacity-95 transition flex items-center justify-center gap-1.5"
                        >
                          <span>Unduh E-Tiket</span>
                          <span>📥</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* PAYMENT & PROOF UPLOAD MODAL (§6 & §4.2) */}
      {activePayBooking && (
        <div className="fixed inset-0 z-50 bg-carbon/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-white border border-fog rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-subtle-3 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-fog mb-6">
              <h3 className="font-bold text-lg text-carbon">Konfirmasi Pembayaran</h3>
              <button
                type="button"
                onClick={() => setActivePayBooking(null)}
                className="w-8 h-8 rounded-full bg-mist text-graphite flex items-center justify-center font-bold hover:bg-fog transition"
              >
                ✕
              </button>
            </div>

            <div className="bg-linen rounded-2xl p-4 mb-6 border border-fog text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-graphite">Lapangan:</span>
                <span className="font-bold text-carbon">{activePayBooking.court.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite">Jadwal:</span>
                <span className="font-bold text-carbon">
                  {new Date(activePayBooking.bookingDate).toLocaleDateString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-fog/50">
                <span className="font-bold text-graphite">Total Yang Harus Dibayar:</span>
                <span className="font-black text-lavender text-sm">
                  Rp {activePayBooking.totalPrice.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-carbon mb-2 uppercase tracking-wider">
                  Pilih Jalur Pembayaran:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank_transfer")}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                      paymentMethod === "bank_transfer"
                        ? "bg-lavender/10 border-lavender text-lavender ring-2 ring-lavender/20"
                        : "bg-paper-white border-fog text-graphite hover:bg-mist"
                    }`}
                  >
                    <span>🏧 Transfer Bank / Manual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("qris")}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                      paymentMethod === "qris"
                        ? "bg-lavender/10 border-lavender text-lavender ring-2 ring-lavender/20"
                        : "bg-paper-white border-fog text-graphite hover:bg-mist"
                    }`}
                  >
                    <span>📱 QRIS / Virtual Account</span>
                  </button>
                </div>
              </div>

              {paymentMethod === "bank_transfer" ? (
                <div className="space-y-4">
                  <div className="bg-mist p-4 rounded-xl border border-fog text-xs space-y-1">
                    <span className="font-bold text-carbon block mb-1">Tujuan Transfer Resmi:</span>
                    <p className="text-graphite">Bank BCA: <strong className="text-carbon">8899-0011-22</strong></p>
                    <p className="text-graphite">Bank Mandiri: <strong className="text-carbon">1300-8888-9999</strong></p>
                    <p className="text-ash pt-1">a.n. SM Sport Center Official</p>
                  </div>

                  <div>
                    <label htmlFor="proof" className="block text-xs font-bold text-carbon mb-1">
                      Link / Bukti Foto Transfer (URL atau Keterangan):
                    </label>
                    <input
                      id="proof"
                      type="text"
                      required
                      placeholder="Contoh: https://i.imgur.com/... atau transfer BCA a.n. Rizky"
                      value={proofInput}
                      onChange={(e) => setProofInput(e.target.value)}
                      className="w-full bg-paper-white border border-fog rounded-xl px-3 py-2 text-xs text-carbon focus:outline-none focus:ring-2 focus:ring-lavender"
                    />
                    <p className="text-[11px] text-ash mt-1">
                      Admin akan segera memverifikasi bukti yang kamu kirim dalam waktu singkat.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-mist p-4 rounded-xl border border-fog text-center text-xs space-y-2">
                  <span className="font-bold text-carbon block">Simulasi QRIS / Virtual Account</span>
                  <p className="text-graphite leading-relaxed">
                    Integrasi payment gateway otomatis siap diaktifkan. Untuk tahap pengujian ini, kamu bisa langsung klik tombol verifikasi di bawah.
                  </p>
                </div>
              )}

              {payError && (
                <div className="bg-red-50 border border-red-200/60 rounded-2xl p-4 flex gap-3 text-left shadow-sm">
                  <div className="text-red-500 text-lg shrink-0">⚠️</div>
                  <div>
                    <h4 className="font-bold text-[10px] text-red-800 uppercase tracking-wider">Kesalahan</h4>
                    <p className="text-red-700 text-xs mt-0.5 leading-relaxed">{payError}</p>
                  </div>
                </div>
              )}

              {paySuccess && (
                <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-4 flex gap-3 text-left shadow-sm">
                  <div className="text-emerald-500 text-lg shrink-0">✅</div>
                  <div>
                    <h4 className="font-bold text-[10px] text-emerald-800 uppercase tracking-wider">Berhasil</h4>
                    <p className="text-emerald-700 text-xs mt-0.5 leading-relaxed">
                      {paymentMethod === "qris" 
                        ? "Pembayaran QRIS Berhasil! Pemesanan Anda kini telah lunas."
                        : "Bukti pembayaran berhasil disimpan! Admin sedang memeriksa pesananmu."
                      }
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || paySuccess}
                className="w-full bg-lavender text-white py-3.5 rounded-full font-bold text-sm shadow-subtle hover:opacity-95 transition disabled:opacity-50"
              >
                {uploading 
                  ? (paymentMethod === "qris" ? "Memproses Pembayaran..." : "Mengirim Data...") 
                  : (paymentMethod === "qris" ? "Selesaikan Pembayaran (Simulasi)" : "Kirim Bukti Pembayaran")
                }
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE E-TICKET MODAL (§6 Customer) */}
      {ticketBooking && (
        <div className="fixed inset-0 z-50 bg-carbon/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-white border border-fog rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-subtle-3 relative">
            <div id="tiket-booking" className="space-y-6">
              <div className="text-center pb-6 border-b border-fog">
                <span className="w-12 h-12 rounded-full bg-lavender text-white font-black text-lg inline-flex items-center justify-center shadow-subtle mb-3">
                  SM
                </span>
                <h2 className="text-2xl font-black text-carbon tracking-tight">{BRAND_INFO.name}</h2>
                <span className="text-xs font-bold uppercase tracking-widest text-mint bg-mint-wash px-3 py-1 rounded-full inline-block mt-2">
                  E-Tiket Resmi / Lunas
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-fog/40">
                  <span className="text-graphite">Nomor Reservasi:</span>
                  <code className="font-mono font-bold text-carbon">{ticketBooking.id}</code>
                </div>
                <div className="flex justify-between py-1 border-b border-fog/40">
                  <span className="text-graphite">Kategori &amp; Lapangan:</span>
                  <span className="font-bold text-carbon">
                    [{ticketBooking.court.type.toUpperCase()}] {ticketBooking.court.name}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-fog/40">
                  <span className="text-graphite">Tanggal Main:</span>
                  <span className="font-bold text-carbon">
                    {new Date(ticketBooking.bookingDate).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-fog/40">
                  <span className="text-graphite">Waktu Main:</span>
                  <span className="font-bold text-carbon">
                    {new Date(ticketBooking.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} -{" "}
                    {new Date(ticketBooking.endTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-fog/40">
                  <span className="text-graphite">Total Dibayar:</span>
                  <span className="font-black text-carbon text-sm">
                    Rp {ticketBooking.totalPrice.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="bg-linen p-4 rounded-2xl border border-fog text-center text-[11px] text-graphite space-y-1">
                <p className="font-bold text-carbon">Petunjuk Kedatangan:</p>
                <p>Tunjukkan e-tiket ini kepada petugas front office minimal 10 menit sebelum jam bermainmu dimulai.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-fog">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 bg-lavender text-white py-3 rounded-full font-bold text-xs shadow-subtle hover:opacity-95 transition"
              >
                🖨️ Cetak / Unduh PDF
              </button>
              <button
                type="button"
                onClick={() => setTicketBooking(null)}
                className="bg-mist text-graphite border border-fog px-6 py-3 rounded-full font-semibold text-xs hover:bg-fog transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RiwayatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper-white flex items-center justify-center text-carbon font-bold">
          Memuat Riwayat Booking...
        </div>
      }
    >
      <RiwayatPageContent />
    </Suspense>
  );
}
