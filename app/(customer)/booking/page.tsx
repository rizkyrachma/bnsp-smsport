"use client";

import { useState, useEffect, useCallback, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { COURT_IMAGES, BRAND_INFO } from "@/lib/assets";
import { CourtSchedule, SlotStatus } from "@/lib/schedule";
import ClientNavbar from "../_components/ClientNavbar";

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

  // Mount-time validation to reset if date is in the past
  useEffect(() => {
    const today = getTodayStr();
    if (selectedDate < today) {
      setSelectedDate(today);
    }
  }, []);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "futsal" | "badminton">("all");
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

  const fetchSchedule = useCallback(async (dateStr: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/schedule?date=${dateStr}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal memuat jadwal.");
      } else {
        setSchedules(data.schedule || []);
        if (initialCourtId && !selectedCourt) {
          const match = (data.schedule as CourtSchedule[]).find((c) => c.courtId === initialCourtId);
          if (match) setSelectedCourt(match);
        }
      }
    } catch {
      setError("Terjadi kesalahan koneksi saat memuat jadwal.");
    } finally {
      setLoading(false);
    }
  }, [initialCourtId, selectedCourt]);

  useEffect(() => {
    fetchSchedule(selectedDate);
  }, [selectedDate, fetchSchedule]);

  // Handle slot click
  const handleSelectSlot = (court: CourtSchedule, slot: SlotStatus) => {
    if (slot.status !== "tersedia") return;
    
    setSelectedCourt(court);
    setSelectedSlot(slot);
    setBookingError("");

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
          setShowLoginModal(true);
          return;
        }
        setBookingError(data.error || "Booking gagal diproses.");
        return;
      }

      // Success -> redirect to history page / payment modal
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

        {/* Date Picker & Category Filters Panel */}
        <div className="bg-linen border border-fog rounded-3xl p-6 mb-8 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <label htmlFor="date" className="text-sm font-bold text-carbon whitespace-nowrap">
              Pilih Tanggal:
            </label>
            <input
              id="date"
              type="date"
              min={getTodayStr()}
              value={selectedDate}
              onChange={(e) => {
                const dateVal = e.target.value;
                const todayVal = getTodayStr();
                if (dateVal < todayVal) {
                  return;
                }
                setSelectedDate(dateVal);
                setSelectedSlot(null);
              }}
              className="bg-paper-white border border-fog rounded-xl px-4 py-2 text-sm font-medium text-carbon shadow-subtle focus:outline-none focus:ring-2 focus:ring-lavender"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === "all"
                  ? "bg-lavender text-white shadow-subtle"
                  : "bg-paper-white text-graphite border border-fog hover:bg-mist"
              }`}
            >
              Semua ({schedules.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("futsal")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === "futsal"
                  ? "bg-lavender text-white shadow-subtle"
                  : "bg-paper-white text-graphite border border-fog hover:bg-mist"
              }`}
            >
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              Futsal ({schedules.filter((s: any) => s.courtType === "futsal").length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("badminton")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === "badminton"
                  ? "bg-lavender text-white shadow-subtle"
                  : "bg-paper-white text-graphite border border-fog hover:bg-mist"
              }`}
            >
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              Badminton ({schedules.filter((s: any) => s.courtType === "badminton").length})
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-graphite mb-6 px-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-mint shadow-sm" />
            <span>Tersedia (Bisa Dipesan)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-ash/60" />
            <span>Dipesan / Sedang Dipakai</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber" />
            <span>Dalam Perawatan / Turnamen</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-fog border border-ash/30" />
            <span>Sudah Lewat (Disabled)</span>
          </div>
        </div>

        {/* Schedule Cards per Court */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-lavender border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-graphite text-sm">Memuat jadwal real-time dari database...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-3xl text-center">
            <p className="font-bold">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {filteredSchedules.map((court: any) => {
              const isFutsal = court.courtType === "futsal";
              const imageAsset = isFutsal ? COURT_IMAGES.futsal : COURT_IMAGES.badminton;

              return (
                <div
                  key={court.courtId}
                  className="bg-paper-white border border-fog rounded-3xl p-6 md:p-8 shadow-subtle-3 transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-fog">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden relative bg-carbon/5 shrink-0 hidden sm:block">
                        <Image
                          src={imageAsset.url}
                          alt={imageAsset.alt}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider bg-mist text-carbon px-2.5 py-0.5 rounded-full border border-fog">
                            {court.courtType}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              court.courtStatus === "tersedia"
                                ? "bg-mint-wash text-mint"
                                : "bg-amber/15 text-amber"
                            }`}
                          >
                            ● {court.courtStatus === "tersedia" ? "Aktif" : court.courtStatus}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-carbon">{court.courtName}</h2>
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <span className="text-2xl font-black text-carbon">
                        Rp {court.pricePerHour.toLocaleString("id-ID")}
                      </span>
                      <span className="text-xs text-ash block">/ jam</span>
                    </div>
                  </div>

                  {/* Slots Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {court.slots.map((slot: any) => {
                      const isSelected =
                        selectedCourt?.courtId === court.courtId &&
                        selectedTimeRange.includes(slot.start);

                      if (slot.status === "tersedia") {
                        return (
                          <button
                            key={slot.start}
                            type="button"
                            onClick={() => handleSelectSlot(court, slot)}
                            className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between h-20 ${
                              isSelected
                                ? "bg-lavender text-white border-lavender shadow-subtle-2 ring-2 ring-lavender/30"
                                : "bg-paper-white text-carbon border-fog hover:border-lavender hover:bg-lavender/5 shadow-subtle"
                            }`}
                          >
                            <span className="text-xs font-bold block">{slot.start} WIB</span>
                            <span
                              className={`text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full inline-block ${
                                isSelected ? "bg-white/20 text-white" : "bg-mint-wash text-mint"
                              }`}
                            >
                              Tersedia
                            </span>
                          </button>
                        );
                      }

                      if (slot.status === "dipesan") {
                        return (
                          <div
                            key={slot.start}
                            className="p-3 rounded-2xl border border-fog bg-mist text-ash flex flex-col justify-between h-20 cursor-not-allowed opacity-80"
                          >
                            <span className="text-xs font-bold block">{slot.start} WIB</span>
                            <span className="text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full bg-fog/70 text-graphite inline-block">
                              ● Dipesan
                            </span>
                          </div>
                        );
                      }

                      if (slot.status === "perbaikan") {
                        return (
                          <div
                            key={slot.start}
                            className="p-3 rounded-2xl border border-amber/20 bg-amber/5 text-amber flex flex-col justify-between h-20 cursor-not-allowed opacity-90"
                          >
                            <span className="text-xs font-bold block">{slot.start} WIB</span>
                            <span className="text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full bg-amber/15 text-amber inline-block">
                              ● Perawatan
                            </span>
                          </div>
                        );
                      }

                      // status === 'lewat' (§4.4 validation frontend representation)
                      return (
                        <div
                          key={slot.start}
                          className="p-3 rounded-2xl bg-fog border border-ash/30 text-ash/60 flex flex-col justify-between h-20 pointer-events-none opacity-60"
                          aria-disabled="true"
                        >
                          <span className="text-xs font-bold block">{slot.start} WIB</span>
                          <span className="text-[10px] font-medium mt-1 px-2 py-0.5 rounded-full bg-ash/10 text-ash/80 inline-block w-fit">
                            Sudah Lewat
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 9. BOTTOM RESERVATION CONFIRMATION BAR */}
      {selectedCourt && selectedSlot && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-paper-white border-t border-fog shadow-subtle-3 p-4 sm:p-6 backdrop-blur-lg bg-paper-white/95">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-lavender/15 text-lavender flex items-center justify-center font-black text-lg shrink-0">
                ✓
              </div>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-lavender">
                    Slot Dipilih ({selectedDate})
                  </span>
                </div>
                <h3 className="text-lg font-bold text-carbon">
                  {selectedCourt.courtName} — Jam {selectedSlot.start} WIB
                </h3>
                <p className="text-xs text-graphite mt-0.5">
                  Hold slot otomatis 15 menit setelah konfirmasi.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 w-full md:w-auto">
              {/* Duration selector */}
              <div className="flex items-center gap-2 bg-mist border border-fog rounded-full p-1 shadow-subtle">
                <span className="text-xs font-semibold text-graphite px-3">Durasi:</span>
                {[1, 2, 3, 4].map((dur: number) => {
                  const isAvailable = checkConsecutiveAvailable(selectedCourt, selectedSlot, dur);
                  return (
                    <button
                      key={dur}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => handleSelectDuration(dur)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                        durationHours === dur
                          ? "bg-lavender text-white shadow-subtle"
                          : isAvailable
                          ? "hover:bg-paper-white text-carbon"
                          : "opacity-40 cursor-not-allowed text-ash"
                      }`}
                    >
                      {dur} Jam
                    </button>
                  );
                })}
              </div>

              {/* Price summary & Confirm button */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-ash block">Total Biaya ({durationHours} jam)</span>
                  <span className="text-xl font-black text-carbon">
                    Rp {totalPrice.toLocaleString("id-ID")}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={submitting || !!bookingError}
                  onClick={handleConfirmBooking}
                  className="bg-lavender text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-subtle hover:opacity-95 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Konfirmasi &amp; Pesan</span>
                  )}
                </button>
              </div>
            </div>

            {bookingError && (
              <div className="w-full mt-4 bg-red-50 border border-red-200/60 rounded-2xl p-4 flex gap-3 text-left shadow-sm">
                <div className="text-red-500 text-lg shrink-0">⚠️</div>
                <div>
                  <h4 className="font-bold text-[10px] text-red-800 uppercase tracking-wider">Kesalahan</h4>
                  <p className="text-red-700 text-xs mt-0.5 leading-relaxed">{bookingError}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
