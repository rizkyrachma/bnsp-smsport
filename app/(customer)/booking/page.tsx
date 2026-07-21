"use client";

import { useState, useEffect, useCallback, useRef, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { COURT_IMAGES, BRAND_INFO } from "@/lib/assets";
import { CourtSchedule, SlotStatus } from "@/lib/schedule";
import ClientNavbar from "../_components/ClientNavbar";
import BookingToolbar from "../_components/BookingToolbar";
import FieldCard from "../_components/FieldCard";
import BookingSummaryBar from "../_components/BookingSummaryBar";

function BookingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCourtId = searchParams.get("courtId") || "";

  // Today in YYYY-MM-DD in Asia/Jakarta timezone
  const getTodayStr = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(now);
    const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return `${partMap.year}-${partMap.month}-${partMap.day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());

  useEffect(() => {
    const today = getTodayStr();
    if (selectedDate < today) {
      setSelectedDate(today);
    }
  }, []);

  const initialCategoryParam = (searchParams.get("type") || searchParams.get("category") || "all") as "all" | "futsal" | "badminton";
  const [selectedCategory, setSelectedCategory] = useState<"all" | "futsal" | "badminton">(
    ["all", "futsal", "badminton"].includes(initialCategoryParam) ? initialCategoryParam : "all"
  );
  const [schedules, setSchedules] = useState<CourtSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Selected reservation state
  const [selectedCourt, setSelectedCourt] = useState<CourtSchedule | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotStatus | null>(null);
  const [durationHours, setDurationHours] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string>("");
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const selectedCourtRef = useRef<CourtSchedule | null>(null);
  useEffect(() => {
    selectedCourtRef.current = selectedCourt;
  }, [selectedCourt]);

  const fetchSchedule = useCallback(async (dateStr: string, isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/schedule?date=${dateStr}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal memuat jadwal.");
      } else {
        setSchedules(data.schedule || []);
        if (initialCourtId && !selectedCourtRef.current) {
          const match = (data.schedule as CourtSchedule[]).find((c) => c.courtId === initialCourtId);
          if (match) {
            setSelectedCourt(match);
            setSelectedCategory(match.courtType as "all" | "futsal" | "badminton");
            setTimeout(() => {
              const cardEl = document.getElementById(`court-card-${match.courtId}`);
              if (cardEl) {
                cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }, 300);
          }
        }
      }
    } catch {
      setError("Terjadi kesalahan koneksi saat memuat jadwal.");
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [initialCourtId]);

  useEffect(() => {
    fetchSchedule(selectedDate);
  }, [selectedDate, fetchSchedule]);

  // Handle slot click
  const handleSelectSlot = (court: CourtSchedule, slot: SlotStatus) => {
    if (slot.status !== "tersedia") return;

    setSelectedCourt(court);
    setSelectedSlot(slot);
    setBookingError("");
    setShowConfirmModal(false);

    const targetDuration = durationHours; // Keep the active duration
    const isAvailable = checkConsecutiveAvailable(court, slot, targetDuration);

    if (!isAvailable) {
      // Find the first blocked slot or if it exceeds operational time
      const startIndex = court.slots.findIndex((s) => s.start === slot.start);
      let blockedSlot = null;
      let isOutOfBounds = false;

      for (let i = 0; i < targetDuration; i++) {
        const index = startIndex + i;
        if (index >= court.slots.length) {
          isOutOfBounds = true;
          break;
        }
        const currentSlot = court.slots[index];
        if (currentSlot.status !== "tersedia") {
          blockedSlot = currentSlot;
          break;
        }
      }

      let errorMsg = "";
      if (isOutOfBounds) {
        errorMsg = `Durasi ${targetDuration} jam tidak tersedia, melebihi jam operasional tutup (22:00).`;
      } else if (blockedSlot) {
        const statusText = blockedSlot.status === "dipesan" ? "sudah dipesan" : "sedang dalam perawatan";
        errorMsg = `Durasi ${targetDuration} jam tidak tersedia, jam ${blockedSlot.start} ${statusText}.`;
      } else {
        errorMsg = `Durasi ${targetDuration} jam tidak tersedia.`;
      }

      // Find the max available duration
      let maxAvailable = 1;
      for (let d = targetDuration - 1; d >= 1; d--) {
        if (checkConsecutiveAvailable(court, slot, d)) {
          maxAvailable = d;
          break;
        }
      }

      setDurationHours(maxAvailable);
      setBookingError(errorMsg);
    }
  };

  const handleSelectDuration = (dur: number) => {
    setDurationHours(dur);
    setBookingError("");
  };

  // Calculate if consecutive slots are available for duration > 1
  const checkConsecutiveAvailable = (court: CourtSchedule, startSlot: SlotStatus, duration: number) => {
    const startIndex = court.slots.findIndex((s) => s.start === startSlot.start);
    if (startIndex === -1 || startIndex + duration > court.slots.length) return false;

    for (let i = 0; i < duration; i++) {
      if (court.slots[startIndex + i].status !== "tersedia") {
        return false;
      }
    }
    return true;
  };

  // Calculate end time
  const calculateEndTime = (startTime: string, duration: number) => {
    const [startH] = startTime.split(":").map(Number);
    const endH = startH + duration;
    return endH.toString().padStart(2, "0") + ":00";
  };

  // Generate list of selected slots based on start slot and duration
  const getSelectedTimeRange = () => {
    if (!selectedCourt || !selectedSlot) return [];
    const startIndex = selectedCourt.slots.findIndex((s) => s.start === selectedSlot.start);
    if (startIndex === -1) return [];
    const range = [];
    for (let i = 0; i < durationHours; i++) {
      const s = selectedCourt.slots[startIndex + i];
      if (s) {
        range.push(s.start);
      }
    }
    return range;
  };

  const selectedTimeRange = getSelectedTimeRange();
  const totalPrice = selectedCourt ? selectedCourt.pricePerHour * durationHours : 0;
  const endTime = selectedSlot ? calculateEndTime(selectedSlot.start, durationHours) : "";

  // Submit Booking
  const handleConfirmBooking = async () => {
    if (!selectedCourt || !selectedSlot) return;
    setSubmitting(true);
    setBookingError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId: selectedCourt.courtId,
          bookingDate: selectedDate,
          startTime: selectedSlot.start,
          endTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setShowConfirmModal(false);
          setShowLoginModal(true);
          return;
        }
        setBookingError(data.error || "Booking gagal diproses.");
        // LAPISAN 4: Otomatis refetch jadwal agar slot yang barusan direbut langsung berubah warna di kalender
        fetchSchedule(selectedDate, true);
        return;
      }

      // Success -> close modal and redirect to history page / payment modal
      setShowConfirmModal(false);
      router.push(`/riwayat?payBooking=${data.booking.id}`);
    } catch {
      setBookingError("Terjadi kesalahan jaringan saat memproses booking.");
    } finally {
      setSubmitting(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredSchedules = schedules.filter((c: any) => {
    if (selectedCategory === "all") return true;
    return c.courtType === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-paper-white text-carbon flex flex-col font-sans">
      {/* Navbar */}
      <ClientNavbar activePage="booking" />

      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 w-full pb-36">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-carbon tracking-tight">
            Kalender Jadwal Real-Time
          </h1>
          <p className="text-graphite text-sm mt-1">
            Pilih tanggal, pilih lapangan, dan klik pada jam yang warna hijau (Tersedia) untuk melakukan reservasi.
          </p>
        </div>

        {/* Sticky Booking Toolbar: Date Picker, Category Tabs, Collapsible Legend */}
        <BookingToolbar
          selectedDate={selectedDate}
          onDateChange={(date) => {
            setSelectedDate(date);
            setSelectedSlot(null);
          }}
          minDate={getTodayStr()}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          schedules={schedules}
        />

        {/* Schedule Cards per Court (2 Columns on large desktop >= 1280px, 1 Column on mobile/tablet) */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-lavender border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-graphite text-sm font-semibold">Memuat jadwal real-time dari database...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-3xl text-center shadow-subtle">
            <p className="font-bold">{error}</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="py-16 text-center bg-mist border border-fog rounded-3xl p-8">
            <p className="text-carbon font-bold text-base">Tidak ada jadwal untuk kategori ini.</p>
            <p className="text-graphite text-xs mt-1">Silakan pilih kategori lain atau ganti tanggal pemesanan.</p>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {filteredSchedules.map((court: any, index: number) => (
              <FieldCard
                key={court.courtId}
                court={court}
                selectedCourt={selectedCourt}
                selectedTimeRange={selectedTimeRange}
                onSelectSlot={handleSelectSlot}
                defaultExpanded={index === 0 || filteredSchedules.length <= 1}
              />
            ))}
          </div>
        )}
      </main>

      {/* 9. FLOATING BOOKING SUMMARY BAR */}
      <BookingSummaryBar
        selectedCourt={selectedCourt}
        selectedSlot={selectedSlot}
        selectedDate={selectedDate}
        durationHours={durationHours}
        onDurationChange={handleSelectDuration}
        checkConsecutiveAvailable={checkConsecutiveAvailable}
        totalPrice={totalPrice}
        submitting={submitting}
        bookingError={bookingError}
        onConfirm={() => setShowConfirmModal(true)}
      />

      {/* LOGIN REQUIRED POPUP MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-carbon/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-paper-white border border-fog rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-subtle-3 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-lavender/15 text-lavender flex items-center justify-center text-2xl mx-auto font-bold">
              🔒
            </div>
            <h3 className="font-bold text-lg text-carbon">Login Diperlukan</h3>
            <p className="text-xs text-graphite leading-relaxed">
              Anda harus login terlebih dahulu untuk dapat mengonfirmasi pemesanan lapangan dan menahan slot pilihanmu.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(false);
                  router.push(`/login?redirect=/booking?courtId=${selectedCourt?.courtId || ""}`);
                }}
                className="w-full bg-lavender text-white py-3 rounded-full font-bold text-xs shadow-subtle hover:opacity-95 transition"
              >
                Masuk / Login Sekarang
              </button>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="w-full bg-mist text-graphite border border-fog py-2.5 rounded-full font-semibold text-xs hover:bg-fog transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION CARD MODAL */}
      {showConfirmModal && selectedCourt && selectedSlot && (
        <div className="fixed inset-0 z-50 bg-carbon/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-paper-white border border-fog rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-subtle-3 overflow-hidden relative text-left">
            <div className="flex items-center justify-between">
              <span className="bg-lavender/15 text-lavender px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Ringkasan Reservasi
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setBookingError("");
                }}
                className="w-8 h-8 rounded-full bg-mist text-graphite hover:bg-fog transition flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <h3 className="text-xl font-black text-carbon mt-3 tracking-tight">
              Konfirmasi Pesanan Anda
            </h3>
            <p className="text-xs text-graphite mt-1 leading-relaxed">
              Periksa kembali detail reservasi lapangan sebelum melanjutkan ke proses pembayaran.
            </p>

            {/* Detail Box */}
            <div className="bg-linen border border-fog/80 rounded-2xl p-5 mt-5 space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-graphite font-medium">Lapangan</span>
                <span className="font-bold text-carbon text-right">
                  {selectedCourt.courtName} ({selectedCourt.courtType.toUpperCase()})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-graphite font-medium">Tanggal</span>
                <span className="font-bold text-carbon">{selectedDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-graphite font-medium">Jam &amp; Durasi</span>
                <span className="font-bold text-carbon">
                  {selectedSlot.start} - {endTime} WIB ({durationHours} Jam)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-graphite font-medium">Tarif per Jam</span>
                <span className="font-semibold text-carbon">
                  Rp {selectedCourt.pricePerHour.toLocaleString("id-ID")}
                </span>
              </div>
              <hr className="border-fog/60 my-1" />
              <div className="flex justify-between items-center pt-1">
                <span className="text-carbon font-bold text-sm">Total Biaya</span>
                <span className="text-lg font-black text-lavender">
                  Rp {totalPrice.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Info Tahan Slot */}
            <div className="bg-lavender/5 border border-lavender/20 rounded-xl p-3.5 mt-4 flex gap-2.5 items-start">
              <span className="text-base leading-none">💡</span>
              <p className="text-[11px] text-carbon/80 leading-relaxed">
                Setelah tombol di bawah ditekan, slot ini akan ditahan otomatis selama{" "}
                <strong className="text-carbon font-bold">10 menit</strong> untuk proses pembayaran.
              </p>
            </div>

            {/* Error Message if booking rejected */}
            {bookingError && (
              <div className="w-full mt-4 bg-red-50 border border-red-200/60 rounded-2xl p-3.5 flex gap-2.5 text-left shadow-sm">
                <div className="text-red-500 text-base shrink-0">⚠️</div>
                <div>
                  <p className="font-bold text-[10px] text-red-800 uppercase tracking-wider">
                    Pesanan Ditolak
                  </p>
                  <p className="text-red-700 text-xs mt-0.5 leading-relaxed font-semibold">
                    {bookingError}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 mt-6">
              <button
                type="button"
                disabled={submitting || !!bookingError}
                onClick={handleConfirmBooking}
                className="w-full bg-lavender text-white py-3.5 rounded-full font-bold text-sm shadow-subtle hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memproses Booking...</span>
                  </>
                ) : (
                  <span>Lanjut Bayar &amp; Konfirmasi</span>
                )}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setShowConfirmModal(false);
                  setBookingError("");
                }}
                className="w-full bg-mist text-graphite border border-fog py-2.5 rounded-full font-semibold text-xs hover:bg-fog transition disabled:opacity-50"
              >
                Periksa Kembali / Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper-white flex items-center justify-center text-carbon font-bold">
          Memuat Halaman Booking...
        </div>
      }
    >
      <BookingPageContent />
    </Suspense>
  );
}
