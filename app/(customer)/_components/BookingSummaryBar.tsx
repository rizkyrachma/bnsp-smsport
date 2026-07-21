"use client";

import React from "react";
import { CourtSchedule, SlotStatus } from "@/lib/schedule";

interface BookingSummaryBarProps {
  selectedCourt: CourtSchedule | null;
  selectedSlot: SlotStatus | null;
  selectedDate: string;
  durationHours: number;
  onDurationChange: (dur: number) => void;
  checkConsecutiveAvailable: (court: CourtSchedule, startSlot: SlotStatus, duration: number) => boolean;
  totalPrice: number;
  submitting: boolean;
  bookingError: string;
  onConfirm: () => void;
}

const BookingSummaryBar: React.FC<BookingSummaryBarProps> = ({
  selectedCourt,
  selectedSlot,
  selectedDate,
  durationHours,
  onDurationChange,
  checkConsecutiveAvailable,
  totalPrice,
  submitting,
  bookingError,
  onConfirm,
}) => {
  if (!selectedCourt || !selectedSlot) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 bg-paper-white/95 backdrop-blur-md text-carbon rounded-3xl md:rounded-full shadow-2xl border border-fog p-4 sm:px-6 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 max-w-5xl w-[94vw] animate-in fade-in slide-in-from-bottom-6 duration-300">
      {/* Selected Details */}
      <div className="flex items-center gap-3.5 text-center md:text-left w-full md:w-auto justify-center md:justify-start">
        <div className="w-11 h-11 rounded-full bg-lavender/15 text-lavender border border-lavender/30 flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
          ✓
        </div>
        <div>
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ash">
              Slot Pilihan ({selectedDate})
            </span>
          </div>
          <h3 className="text-base font-bold text-carbon leading-tight">
            {selectedCourt.courtName} — Jam {selectedSlot.start} WIB
          </h3>
          <p className="text-[11px] text-graphite hidden sm:block">
            Hold slot otomatis 10 menit setelah konfirmasi pesanan.
          </p>
        </div>
      </div>

      {/* Controls & Action */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full md:w-auto">
        {/* Duration Selector */}
        <div className="flex items-center gap-1.5 bg-linen border border-fog rounded-full p-1 shadow-subtle">
          <span className="text-[11px] font-semibold text-graphite px-2.5">Durasi:</span>
          {[1, 2, 3, 4].map((dur) => {
            const isAvailable = checkConsecutiveAvailable(selectedCourt, selectedSlot, dur);
            return (
              <button
                key={dur}
                type="button"
                disabled={!isAvailable}
                onClick={() => onDurationChange(dur)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  durationHours === dur
                    ? "bg-lavender text-white shadow-subtle font-bold"
                    : isAvailable
                    ? "hover:bg-mist text-graphite"
                    : "opacity-35 cursor-not-allowed text-ash"
                }`}
              >
                {dur} Jam
              </button>
            );
          })}
        </div>

        {/* Price & Submit Button */}
        <div className="flex items-center gap-3.5">
          <div className="text-right">
            <span className="text-[10px] text-ash block uppercase font-semibold">
              Total ({durationHours} Jam)
            </span>
            <span className="text-lg sm:text-xl font-bold text-carbon">
              Rp {totalPrice.toLocaleString("id-ID")}
            </span>
          </div>

          <button
            type="button"
            disabled={submitting || !!bookingError}
            onClick={onConfirm}
            className="bg-lavender text-white px-6 py-3 rounded-full font-bold text-xs sm:text-sm shadow-subtle hover:opacity-95 transition disabled:opacity-50 flex items-center gap-2 shrink-0 cursor-pointer scale-105 hover:scale-110 duration-200"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Lanjut Bayar ➔</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSummaryBar;
