"use client";

import React, { useState } from "react";
import { CourtSchedule, SlotStatus } from "@/lib/schedule";

interface TimeSlotGridProps {
  court: CourtSchedule;
  selectedCourt: CourtSchedule | null;
  selectedTimeRange: string[];
  onSelectSlot: (court: CourtSchedule, slot: SlotStatus) => void;
}

interface PeriodGroup {
  id: string;
  label: string;
  slots: SlotStatus[];
}

const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  court,
  selectedCourt,
  selectedTimeRange,
  onSelectSlot,
}) => {
  const [showPastSlots, setShowPastSlots] = useState<boolean>(false);

  // Separate past ('lewat') vs active slots
  const pastSlots = court.slots.filter((s) => s.status === "lewat");
  const activeSlots = court.slots.filter((s) => s.status !== "lewat");

  // Group active slots into Pagi, Siang, Malam periods (no emojis, no badges)
  const periods: PeriodGroup[] = [
    {
      id: "pagi",
      label: "Pagi (08:00 - 11:00)",
      slots: activeSlots.filter((s) => {
        const h = parseInt(s.start.split(":")[0], 10);
        return h < 12;
      }),
    },
    {
      id: "siang",
      label: "Siang (12:00 - 16:00)",
      slots: activeSlots.filter((s) => {
        const h = parseInt(s.start.split(":")[0], 10);
        return h >= 12 && h < 17;
      }),
    },
    {
      id: "malam",
      label: "Malam - Prime Time (17:00 - 22:00+)",
      slots: activeSlots.filter((s) => {
        const h = parseInt(s.start.split(":")[0], 10);
        return h >= 17;
      }),
    },
  ];

  return (
    <div className="space-y-6 pt-2">
      {/* 1. AUTO-COLLAPSED PAST SLOTS BAR (if any past slots exist today) */}
      {pastSlots.length > 0 && (
        <div className="border border-fog/80 bg-fog/20 rounded-xl overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setShowPastSlots(!showPastSlots)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-fog/30 transition cursor-pointer"
          >
            <span className="text-xs font-normal text-graphite">
              {pastSlots.length} slot ({pastSlots[0].start} - {pastSlots[pastSlots.length - 1].start} WIB) sudah lewat hari ini
            </span>
            <span className="text-xs font-medium text-lavender flex items-center gap-1">
              <span>{showPastSlots ? "Tutup" : "Lihat detail"}</span>
              <span className={`transition-transform duration-200 inline-block ${showPastSlots ? "rotate-180" : ""}`}>
                ▾
              </span>
            </span>
          </button>

          {showPastSlots && (
            <div className="p-3 border-t border-fog/60 bg-paper-white/60 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 animate-in fade-in duration-200">
              {pastSlots.map((slot) => (
                <div
                  key={slot.start}
                  className="py-2 px-1 rounded-lg bg-fog/40 border border-fog/50 text-ash/60 flex flex-col items-center justify-center text-center pointer-events-none opacity-60"
                  aria-disabled="true"
                >
                  <span className="text-xs font-normal text-carbon">{slot.start} WIB</span>
                  <span className="text-[10px] font-normal text-ash mt-0.5">Lewat</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. ACTIVE SLOTS GROUPED BY PERIOD (Plain typography, clean hierarchy) */}
      {activeSlots.length === 0 ? (
        <div className="py-6 text-center bg-mist/60 border border-fog rounded-xl p-4">
          <p className="text-xs font-medium text-graphite">
            Semua jam operasional untuk hari ini telah selesai atau berlalu.
          </p>
          <p className="text-xs font-normal text-ash mt-1">Silakan pilih tanggal hari berikutnya untuk memesan.</p>
        </div>
      ) : (
        periods.map((group) => {
          if (group.slots.length === 0) return null;

          return (
            <div key={group.id} className="space-y-3">
              {/* Clean Period Header without extra badges or icons */}
              <div className="pb-1.5 border-b border-fog/70">
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-graphite">
                  {group.label}
                </span>
              </div>

              {/* Compact Slot Grid (3 columns on mobile, 4 on sm, 6 on md/lg) */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-2.5">
                {group.slots.map((slot) => {
                  const isSelected =
                    selectedCourt?.courtId === court.courtId &&
                    selectedTimeRange.includes(slot.start);

                  if (slot.status === "tersedia") {
                    return (
                      <button
                        key={slot.start}
                        type="button"
                        onClick={() => onSelectSlot(court, slot)}
                        className={`group py-2.5 px-2 rounded-xl border text-center transition-all duration-150 flex flex-col items-center justify-center cursor-pointer ${
                          isSelected
                            ? "bg-lavender text-white border-lavender ring-2 ring-lavender/40 shadow-subtle scale-[1.02]"
                            : "bg-mint-wash border-mint/50 text-carbon hover:bg-mint hover:text-white hover:border-mint shadow-subtle"
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-medium tracking-tight group-hover:text-white transition-colors">{slot.start} WIB</span>
                        <span className={`text-[11px] font-normal mt-0.5 transition-colors ${isSelected ? "text-white/90" : "text-mint group-hover:text-white"}`}>
                          {isSelected ? "Dipilih ✓" : "Tersedia"}
                        </span>
                      </button>
                    );
                  }

                  if (slot.status === "dipesan") {
                    return (
                      <div
                        key={slot.start}
                        className="py-2.5 px-2 rounded-xl border border-fog bg-mist text-ash flex flex-col items-center justify-center text-center cursor-not-allowed opacity-80"
                      >
                        <span className="text-xs font-normal text-carbon/70">{slot.start} WIB</span>
                        <span className="text-[11px] font-normal text-ash mt-0.5">Dipesan</span>
                      </div>
                    );
                  }

                  if (slot.status === "perbaikan") {
                    return (
                      <div
                        key={slot.start}
                        className="py-2.5 px-2 rounded-xl border border-amber/30 bg-amber/10 text-amber flex flex-col items-center justify-center text-center cursor-not-allowed opacity-90"
                      >
                        <span className="text-xs font-normal text-[#78350f]">{slot.start} WIB</span>
                        <span className="text-[11px] font-normal text-[#78350f] mt-0.5">Perawatan</span>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default TimeSlotGrid;
