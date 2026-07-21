"use client";

import React from "react";
import { CourtSchedule } from "@/lib/schedule";

interface BookingToolbarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  minDate: string;
  selectedCategory: "all" | "futsal" | "badminton";
  onCategoryChange: (cat: "all" | "futsal" | "badminton") => void;
  schedules: CourtSchedule[];
}

const BookingToolbar: React.FC<BookingToolbarProps> = ({
  selectedDate,
  onDateChange,
  minDate,
  selectedCategory,
  onCategoryChange,
  schedules,
}) => {
  const futsalCount = schedules.filter((s) => s.courtType === "futsal").length;
  const badmintonCount = schedules.filter((s) => s.courtType === "badminton").length;

  return (
    <div className="sticky top-[72px] z-30 py-3 transition-all">
      <div className="max-w-5xl mx-auto">
        {/* Unified Card for Date Picker & Category Tabs */}
        <div className="bg-paper-white/95 backdrop-blur-md border border-fog rounded-2xl p-2 md:p-2.5 shadow-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Date Picker Section */}
          <div className="flex items-center gap-2.5 px-2 py-1 sm:border-r sm:border-fog/80 shrink-0">
            <label htmlFor="date" className="text-xs font-semibold uppercase tracking-wider text-ash cursor-pointer">
              Tanggal
            </label>
            <input
              id="date"
              type="date"
              aria-label="Pilih tanggal reservasi lapangan"
              min={minDate}
              value={selectedDate}
              onChange={(e) => {
                const dateVal = e.target.value;
                if (dateVal < minDate) return;
                onDateChange(dateVal);
              }}
              className="bg-paper-white border border-fog rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium text-carbon shadow-subtle focus:outline-none focus:ring-2 focus:ring-lavender cursor-pointer"
            />
          </div>

          {/* Category Tabs Section */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 px-1">
            <button
              type="button"
              onClick={() => onCategoryChange("all")}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-lavender text-white shadow-subtle font-semibold"
                  : "bg-paper-white text-graphite border border-fog hover:bg-mist hover:text-carbon"
              }`}
            >
              Semua ({schedules.length})
            </button>
            <button
              type="button"
              onClick={() => onCategoryChange("futsal")}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                selectedCategory === "futsal"
                  ? "bg-lavender text-white shadow-subtle font-semibold"
                  : "bg-paper-white text-graphite border border-fog hover:bg-mist hover:text-carbon"
              }`}
            >
              Futsal ({futsalCount})
            </button>
            <button
              type="button"
              onClick={() => onCategoryChange("badminton")}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                selectedCategory === "badminton"
                  ? "bg-lavender text-white shadow-subtle font-semibold"
                  : "bg-paper-white text-graphite border border-fog hover:bg-mist hover:text-carbon"
              }`}
            >
              Badminton ({badmintonCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingToolbar;
