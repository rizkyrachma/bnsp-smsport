"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BRAND_INFO } from "@/lib/assets";
import ClientNavbar from "../_components/ClientNavbar";
import CountdownBadge from "../_components/CountdownBadge";
import { formatJamWIB } from "@/lib/timezone";

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
  const [courtTypeFilter, setCourtTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Payment upload modal state
  const [activePayBooking, setActivePayBooking] = useState<BookingItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("qris");
  const [proofInput, setProofInput] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [payError, setPayError] = useState<string>("");
  const [paySuccess, setPaySuccess] = useState<boolean>(false);

  // E-Ticket view state
  const [ticketBooking, setTicketBooking] = useState<BookingItem | null>(null);

  // Polling hook to automatically verify payment when scanned on mobile phone
  useEffect(() => {
    if (!activePayBooking || activePayBooking.status !== "pending") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/bookings");
        if (res.ok) {
          const data = await res.json();
          const list = data.bookings || [];
          setBookings(list);
          const currentBooking = list.find((b: BookingItem) => b.id === activePayBooking.id);
          if (currentBooking && currentBooking.status === "paid") {
            setPaySuccess(true);
            setTimeout(() => {
              setActivePayBooking(null);
              setPaySuccess(false);
            }, 2500);
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error("Error polling booking status:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activePayBooking]);

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

  // Handle reactivating a cancelled/expired booking to get a new 15-minute slot and new QRIS
  const handleReactivate = async (bookingId: string) => {
    setUploading(true);
    setPayError("");
    try {
      const res = await fetch("/api/bookings/reactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayError(data.error || "Gagal mengaktifkan kembali booking.");
        return;
      }
      setActivePayBooking(data.booking);
      fetchBookings();
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
      timeZone: "UTC",
    });
    const startH = formatJamWIB(startStr);
    const endH = formatJamWIB(endStr);
    return `${dateFormatted} | ${startH} - ${endH} WIB`;
  };

  // Client-side filtering for user bookings
  const filteredBookings = bookings.filter((item) => {
    if (courtTypeFilter !== "all" && item.court.type.toLowerCase() !== courtTypeFilter) {
      return false;
    }
    if (dateFilter) {
      const itemDate = new Date(item.bookingDate);
      const year = itemDate.getFullYear();
      const month = String(itemDate.getMonth() + 1).padStart(2, '0');
      const day = String(itemDate.getDate()).padStart(2, '0');
      const itemDateStr = `${year}-${month}-${day}`;
      if (itemDateStr !== dateFilter) {
        return false;
      }
    }
    return true;
  });

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
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4 bg-linen p-4 rounded-3xl border border-fog mb-6">
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
                <span className="text-xs font-bold text-ash uppercase">Tanggal Booking:</span>
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

            {filteredBookings.length === 0 ? (
              <div className="bg-linen border border-fog rounded-3xl p-12 text-center max-w-lg mx-auto">
                <h3 className="font-bold text-carbon text-sm">Tidak Ada Riwayat Booking Cocok</h3>
                <p className="text-graphite text-xs mt-1">
                  Ubah filter kategori atau tanggal Anda untuk melihat data reservasi.
                </p>
              </div>
            ) : (
              filteredBookings.map((item) => {
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
                        <CountdownBadge
                          createdAt={item.createdAt}
                          onExpire={() => fetchBookings()}
                        />
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
                      {isPaid && (
                        <span className="text-[11px] text-mint font-semibold block mt-0.5">
                          ✓ Pembayaran Berhasil
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => {
                            setActivePayBooking(item);
                            setPayError("");
                            setPaySuccess(false);
                          }}
                          className="w-full sm:w-auto bg-lavender text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-subtle hover:opacity-95 transition"
                        >
                          Lanjutkan Pembayaran
                        </button>
                      )}

                      {isCancelled && (
                        <button
                          type="button"
                          onClick={() => {
                            setActivePayBooking(item);
                            setPayError("");
                            setPaySuccess(false);
                          }}
                          className="w-full sm:w-auto bg-amber text-carbon px-5 py-2.5 rounded-full font-bold text-xs shadow-subtle hover:opacity-95 transition"
                        >
                          Perbarui Pembayaran
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
            }))}
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

            <div className="space-y-5">
              {activePayBooking.status === "cancelled" ? (
                <div className="space-y-4">
                  <div className="bg-amber/10 border border-amber/30 rounded-2xl p-4 flex gap-3 text-left shadow-sm">
                    <div className="text-amber text-lg shrink-0">⏳</div>
                    <div>
                      <h4 className="font-bold text-[10px] text-amber-800 uppercase tracking-wider">QRIS Kadaluarsa</h4>
                      <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
                        Batas waktu pembayaran 10 menit telah habis. Kode QRIS sebelumnya tidak dapat digunakan lagi.
                      </p>
                    </div>
                  </div>

                  {payError && (
                    <div className="bg-red-50 border border-red-200/60 rounded-2xl p-4 flex gap-3 text-left shadow-sm">
                      <div className="text-red-500 text-lg shrink-0">⚠️</div>
                      <div>
                        <h4 className="font-bold text-[10px] text-red-800 uppercase tracking-wider">Kesalahan</h4>
                        <p className="text-red-700 text-xs mt-0.5 leading-relaxed">{payError}</p>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => handleReactivate(activePayBooking.id)}
                    className="w-full bg-lavender text-white py-3.5 rounded-full font-bold text-sm shadow-subtle hover:opacity-95 transition disabled:opacity-50"
                  >
                    {uploading ? "Memproses..." : "Generate QRIS Baru"}
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <span className="block text-xs font-bold text-carbon mb-1 uppercase tracking-wider">
                      Metode Pembayaran: QRIS Instan
                    </span>
                    <p className="text-[11px] text-ash mb-4">
                      Silakan scan kode QR di bawah dengan aplikasi mobile banking atau dompet digital Anda.
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 bg-mist border border-fog rounded-2xl shadow-subtle space-y-4">
                    {paySuccess ? (
                      <div className="flex flex-col items-center py-4 space-y-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-xl font-bold shadow-inner border border-emerald-100/50">
                          ✓
                        </div>
                        <span className="text-xs font-bold text-emerald-800">Pembayaran Berhasil!</span>
                      </div>
                    ) : (
                      <>
                        <div className="mb-2">
                          <CountdownBadge
                            createdAt={activePayBooking.createdAt}
                            onExpire={() => {
                              fetchBookings();
                              setActivePayBooking((prev) => prev ? { ...prev, status: "cancelled" } : null);
                            }}
                          />
                        </div>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                            typeof window !== "undefined"
                              ? `${window.location.origin}/api/payments/checkout?bookingId=${activePayBooking.id}`
                              : ""
                          )}`}
                          alt="QRIS Dinamis"
                          className="w-48 h-48 object-contain bg-white p-2 rounded-xl border border-fog"
                        />
                        
                        <div className="text-center space-y-1 w-full">
                          <div className="flex items-center justify-center gap-2 py-1">
                            <div className="w-4 h-4 border-2 border-lavender border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-semibold text-graphite">Menunggu pembayaran...</span>
                          </div>
                          <p className="text-xs font-black text-carbon mt-1">
                            Total: Rp {activePayBooking.totalPrice.toLocaleString("id-ID")}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {payError && (
                    <div className="bg-red-50 border border-red-200/60 rounded-2xl p-4 flex gap-3 text-left shadow-sm">
                      <div className="text-red-500 text-lg shrink-0">⚠️</div>
                      <div>
                        <h4 className="font-bold text-[10px] text-red-800 uppercase tracking-wider">Kesalahan</h4>
                        <p className="text-red-700 text-xs mt-0.5 leading-relaxed">{payError}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={() => setActivePayBooking(null)}
                className="w-full bg-white text-graphite border border-fog py-3.5 rounded-full font-bold text-xs hover:bg-mist transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE E-TICKET MOD      {/* PRINTABLE E-TICKET MODAL (§6 Customer) */}
      {ticketBooking && (
        <div className="fixed inset-0 z-50 bg-carbon/60 backdrop-blur-sm flex items-center justify-center p-4 print-overlay">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              /* Hide all page layouts */
              nav, footer, main {
                display: none !important;
              }
              /* Make print overlay background white and fill window */
              .print-overlay {
                position: absolute !important;
                background: white !important;
                inset: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
                display: block !important;
                backdrop-filter: none !important;
              }
              /* Style the e-ticket card container as a structural Courier thermal receipt */
              #tiket-booking-container {
                max-width: 380px !important;
                margin: 20px auto !important;
                border: 2px dashed #000000 !important;
                border-radius: 0px !important;
                box-shadow: none !important;
                padding: 24px !important;
                background: white !important;
                color: black !important;
                font-family: Courier, monospace !important;
              }
              /* Force all inner elements to be pure black for thermal printing */
              #tiket-booking-container * {
                color: black !important;
                background: transparent !important;
                border-color: #000000 !important;
              }
              /* Hide action buttons and close buttons */
              .print-actions {
                display: none !important;
              }
            }
          ` }} />
          
          <div id="tiket-booking-container" className="bg-paper-white border border-fog rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-subtle-3 relative">
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
                      timeZone: "UTC",
                    })}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-fog/40">
                  <span className="text-graphite">Waktu Main:</span>
                  <span className="font-bold text-carbon">
                    {formatJamWIB(ticketBooking.startTime)} -{" "}
                    {formatJamWIB(ticketBooking.endTime)} WIB
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
 
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-fog print-actions">
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
