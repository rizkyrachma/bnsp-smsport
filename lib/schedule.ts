"use server";

import { prisma } from "./prisma";
import { TIMEZONE } from "./constants";

export interface SlotStatus {
  time: string; // "08:00 - 09:00"
  start: string; // "08:00"
  end: string; // "09:00"
  status: "tersedia" | "dipesan" | "perbaikan" | "lewat";
}

export interface CourtSchedule {
  courtId: string;
  courtName: string;
  courtType: string;
  pricePerHour: number;
  courtStatus: string;
  slots: SlotStatus[];
}

/**
 * Fetch real-time schedule for all courts on a given date (YYYY-MM-DD).
 * Enforces server-side time check (Asia/Jakarta) for past dates/times (§4.4).
 */
export async function getScheduleByDate(dateStr: string): Promise<CourtSchedule[]> {
  // 1. Server time in Asia/Jakarta (§4.4)
  const now = new Date();
  const nowJakarta = new Date(
    now.toLocaleString("en-US", { timeZone: TIMEZONE })
  );

  const todayStr = nowJakarta.toISOString().slice(0, 10);
  const isPastDate = dateStr < todayStr;
  const isToday = dateStr === todayStr;
  const currentHour = nowJakarta.getHours();
  const currentMinute = nowJakarta.getMinutes();

  // 2. Query all courts
  const courts = await prisma.court.findMany({
    orderBy: { type: "asc" },
  });

  // 3. Query active bookings on that date (pending or paid)
  // We parse dateStr to DB date
  const dateObj = new Date(dateStr + "T00:00:00");
  const bookings = await prisma.booking.findMany({
    where: {
      bookingDate: dateObj,
      status: { in: ["pending", "paid"] },
    },
  });

  // Standard 1-hour slots: 08:00 to 23:00
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8 .. 22

  return courts.map((court) => {
    const slots: SlotStatus[] = hours.map((h) => {
      const startHStr = h.toString().padStart(2, "0") + ":00";
      const endHStr = (h + 1).toString().padStart(2, "0") + ":00";
      const timeLabel = `${startHStr} - ${endHStr}`;

      // A. Check if court itself is under maintenance
      if (court.status === "perbaikan") {
        return {
          time: timeLabel,
          start: startHStr,
          end: endHStr,
          status: "perbaikan",
        };
      }

      // B. Check if past date/time against server time (§4.4)
      if (isPastDate) {
        return {
          time: timeLabel,
          start: startHStr,
          end: endHStr,
          status: "lewat",
        };
      }

      if (isToday) {
        if (h < currentHour || (h === currentHour && currentMinute >= 0)) {
          // e.g. if now is 10:15, slot 10:00-11:00 is considered started/past
          return {
            time: timeLabel,
            start: startHStr,
            end: endHStr,
            status: "lewat",
          };
        }
      }

      // C. Check overlap with active bookings
      const startMinutes = h * 60;
      const endMinutes = (h + 1) * 60;

      const isBooked = bookings.some((b) => {
        if (b.courtId !== court.id) return false;
        // Parse booking startTime / endTime from Date object
        const bStartMinutes = b.startTime.getUTCHours() * 60 + b.startTime.getUTCMinutes();
        const bEndMinutes = b.endTime.getUTCHours() * 60 + b.endTime.getUTCMinutes();

        return startMinutes < bEndMinutes && endMinutes > bStartMinutes;
      });

      if (isBooked) {
        return {
          time: timeLabel,
          start: startHStr,
          end: endHStr,
          status: "dipesan",
        };
      }

      return {
        time: timeLabel,
        start: startHStr,
        end: endHStr,
        status: "tersedia",
      };
    });

    return {
      courtId: court.id,
      courtName: court.name,
      courtType: court.type,
      pricePerHour: court.pricePerHour,
      courtStatus: court.status,
      slots,
    };
  });
}
