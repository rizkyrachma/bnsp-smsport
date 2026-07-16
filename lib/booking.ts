"use server";

import { prisma } from "./prisma";
import { HOLD_DURATION_MS, TIMEZONE } from "./constants";

interface CreateBookingInput {
  userId: string;
  courtId: string;
  bookingDate: string; // "YYYY-MM-DD"
  startTime: string;   // "HH:MM"
  endTime: string;     // "HH:MM"
}

/**
 * Create a booking with anti double-booking protection.
 * Uses Prisma interactive transaction + SELECT ... FOR UPDATE (AGENTS.md §4.1).
 * Returns { success, booking?, error? }.
 */
export async function createBooking(input: CreateBookingInput) {
  const { userId, courtId, bookingDate, startTime, endTime } = input;

  // §4.4: Validate against server time (Asia/Jakarta)
  const now = new Date();
  const nowJakarta = new Date(
    now.toLocaleString("en-US", { timeZone: TIMEZONE })
  );

  const bookingDateObj = new Date(bookingDate + "T00:00:00");
  const todayStr = nowJakarta.toISOString().slice(0, 10);
  const todayDate = new Date(todayStr + "T00:00:00");

  if (bookingDateObj < todayDate) {
    return { success: false, error: "Tidak bisa booking untuk tanggal yang sudah lewat." };
  }

  if (bookingDateObj.getTime() === todayDate.getTime()) {
    const currentHour = nowJakarta.getHours();
    const currentMinute = nowJakarta.getMinutes();
    const [startH, startM] = startTime.split(":").map(Number);
    if (startH < currentHour || (startH === currentHour && startM <= currentMinute)) {
      return { success: false, error: "Jam booking sudah lewat untuk hari ini." };
    }
  }

  // Validate startTime < endTime
  if (startTime >= endTime) {
    return { success: false, error: "Jam mulai harus sebelum jam selesai." };
  }

  try {
    const booking = await prisma.$transaction(
      async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]> extends [infer T] ? T : never) => {
        // Row lock: check overlap with SELECT ... FOR UPDATE (§4.1)
        const conflicts = await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM bookings
          WHERE court_id = ${courtId}
            AND booking_date = ${bookingDateObj}::date
            AND start_time < ${endTime}::time
            AND end_time > ${startTime}::time
            AND status IN ('pending', 'paid')
          FOR UPDATE
        `;

        if (conflicts.length > 0) {
          throw new Error("Jadwal baru saja dipesan orang lain.");
        }

        // Calculate price (§4.3)
        const court = await tx.court.findUniqueOrThrow({
          where: { id: courtId },
        });

        const [startH, startM] = startTime.split(":").map(Number);
        const [endH, endM] = endTime.split(":").map(Number);
        const durationHours = (endH * 60 + endM - (startH * 60 + startM)) / 60;
        const totalPrice = Math.round(court.pricePerHour * durationHours);

        // Create booking with status pending (§4.2 hold slot)
        return tx.booking.create({
          data: {
            userId,
            courtId,
            bookingDate: bookingDateObj,
            startTime: new Date(`1970-01-01T${startTime}:00Z`),
            endTime: new Date(`1970-01-01T${endTime}:00Z`),
            totalPrice,
            status: "pending",
          },
        });
      },
      {
        isolationLevel: "Serializable",
      }
    );

    return { success: true, booking };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan saat booking.";
    return { success: false, error: message };
  }
}

/**
 * Cancel bookings that have been pending longer than HOLD_DURATION (§4.2),
 * provided no payment proof has been submitted yet (`payment: null`).
 * Returns the count of cancelled bookings.
 */
export async function cancelExpiredBookings(): Promise<number> {
  const cutoff = new Date(Date.now() - HOLD_DURATION_MS);

  // Find IDs of pending bookings older than 15 mins that don't have submitted payment yet
  const expiredBookings = await prisma.booking.findMany({
    where: {
      status: "pending",
      createdAt: { lt: cutoff },
      payment: { is: null },
    },
    select: { id: true },
  });

  if (expiredBookings.length === 0) return 0;

  const result = await prisma.booking.updateMany({
    where: {
      id: { in: expiredBookings.map((b: { id: string }) => b.id) },
    },
    data: { status: "cancelled" },
  });

  return result.count;
}
