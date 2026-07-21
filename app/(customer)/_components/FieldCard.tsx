"use client";

import React from "react";
import Image from "next/image";
import { COURT_IMAGES } from "@/lib/assets";
import { CourtSchedule, SlotStatus } from "@/lib/schedule";
import TimeSlotGrid from "./TimeSlotGrid";

interface FieldCardProps {
  court: CourtSchedule;
  selectedCourt: CourtSchedule | null;
  selectedTimeRange: string[];
  onSelectSlot: (court: CourtSchedule, slot: SlotStatus) => void;
  defaultExpanded?: boolean;
}

const FieldCard: React.FC<FieldCardProps> = ({
  court,
  selectedCourt,
  selectedTimeRange,
  onSelectSlot,
}) => {
  const isFutsal = court.courtType === "futsal";
  const imageAsset = isFutsal ? COURT_IMAGES.futsal : COURT_IMAGES.badminton;

  const availableCount = court.slots.filter((s) => s.status === "tersedia").length;
  const isSelectedCourt = selectedCourt?.courtId === court.courtId;

  return (
    <div
      id={`court-card-${court.courtId}`}
      className={`bg-paper-white border rounded-3xl p-5 sm:p-6 md:p-8 transition-all space-y-5 ${
        isSelectedCourt
          ? "border-lavender ring-2 ring-lavender/40 shadow-subtle-3 bg-lavender/[0.02]"
          : "border-fog shadow-subtle hover:border-lavender/40"
      }`}
    >
      {/* 1. Landscape Thumbnail with Court Name overlaid at bottom-left */}
      <div className="w-full aspect-[16/10] sm:aspect-[16/9] md:aspect-[16/7] max-h-[380px] rounded-2xl overflow-hidden relative border border-fog bg-carbon/5">
        <Image
          src={imageAsset.url}
          alt={imageAsset.alt}
          fill
          sizes="(max-width: 768px) 100vw, 80vw"
          className="object-cover"
        />
        {/* Bottom-left overlay for courtName */}
        <div className="absolute inset-0 bg-gradient-to-t from-carbon/90 via-carbon/30 to-transparent pointer-events-none flex flex-col justify-end p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-md">
            {court.courtName}
          </h2>
        </div>
      </div>

      {/* 2. Compact 1-line horizontal bar: Category + Available slots on left, Price directly on right */}
      <div className="flex items-center justify-between pb-4 border-b border-fog/70 flex-wrap gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider text-carbon bg-mist px-2.5 py-1 rounded-full border border-fog">
            {court.courtType}
          </span>
          <span className="text-xs font-medium text-graphite">
            • {availableCount > 0 ? `${availableCount} slot tersedia` : "Jadwal penuh"}
          </span>
          {isSelectedCourt && (
            <span className="bg-lavender text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide shadow-subtle flex items-center gap-1 animate-in fade-in duration-200">
              ✓ Lapangan Terpilih
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-lg sm:text-xl font-bold text-carbon">
            Rp {court.pricePerHour.toLocaleString("id-ID")}
          </span>
          <span className="text-xs font-normal text-graphite">/ jam</span>
        </div>
      </div>

      {/* 3. TimeSlotGrid */}
      <div className="w-full pt-0.5">
        <div className="mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-graphite">
            Pilih jam bermain
          </span>
        </div>
        <TimeSlotGrid
          court={court}
          selectedCourt={selectedCourt}
          selectedTimeRange={selectedTimeRange}
          onSelectSlot={onSelectSlot}
        />
      </div>
    </div>
  );
};

export default FieldCard;
