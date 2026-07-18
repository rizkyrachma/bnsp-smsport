"use server";

import { prisma } from "./prisma";
import { HOLD_DURATION_MS, TIMEZONE } from "./constants";
import { wibToUTC, utcToWIB } from "./timezone";

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

  // Query database server time to avoid client clock manipulation
  const dbTimeResult = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`;
  const dbNow = dbTimeResult[0]?.now || new Date();

  const dbNowWIB = utcToWIB(dbNow);
  const todayStr = dbNowWIB.format("YYYY-MM-DD");
  const currentHour = dbNowWIB.hour();

  if (bookingDate < todayStr) {
    return { success: false, error: "Tidak bisa booking untuk tanggal yang sudah lewat." };
  }

  if (bookingDate === todayStr) {
    const [startH] = startTime.split(":").map(Number);
    if (startH <= currentHour) {
      return { success: false, error: "Jam booking sudah lewat untuk hari ini." };
    }
  }

  const bookingDateObj = new Date(bookingDate + "T00:00:00Z");

  // Validate startTime < endTime
  if (startTime >= endTime) {
    return { success: false, error: "Jam mulai harus sebelum jam selesai." };
  }

  try {
    const booking = await prisma.$transaction(
      async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]> extends [infer T] ? T : never) => {
        // Check if user is active/blocked
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user || user.isBlocked) {
          throw new Error("Akun Anda telah dinonaktifkan/diblokir oleh Admin.");
        }

        // LAPISAN 3: Kunci baris lapangan (Court) terlebih dahulu agar semua transaksi serentak
        // pada lapangan yang sama wajib mengantre (mencegah TOCTOU saat baris booking belum ada).
        await tx.$queryRaw`SELECT id FROM courts WHERE id = ${courtId} FOR UPDATE`;

        // Row lock: check overlap with findMany within the locked Court transaction (§4.1)
        const utcStartObj = wibToUTC("1970-01-01", startTime);
        const utcEndObj = wibToUTC("1970-01-01", endTime);
        const inputStartMins = utcStartObj.getUTCHours() * 60 + utcStartObj.getUTCMinutes();
        const inputEndMins = utcEndObj.getUTCHours() * 60 + utcEndObj.getUTCMinutes();

        const existingBookings = await tx.booking.findMany({
          where: {
            courtId,
            bookingDate: bookingDateObj,
            status: { in: ["pending", "paid"] },
          },
        });

        const hasOverlap = existingBookings.some((b) => {
          const bStartMins = b.startTime.getUTCHours() * 60 + b.startTime.getUTCMinutes();
          const bEndMins = b.endTime.getUTCHours() * 60 + b.endTime.getUTCMinutes();
          return inputStartMins < bEndMins && inputEndMins > bStartMins;
        });

        if (hasOverlap) {
          throw new Error("sudah dipesan, silahkan pesan jam lain");
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
            startTime: utcStartObj,
            endTime: utcEndObj,
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
  } catch (err: any) {
    // LAPISAN 1 & 2: Tangkap error pelanggaran Unique Constraint maupun kegagalan serialisasi dari Postgres/Prisma
    if (
      err?.code === "P2002" ||
      err?.code === "P2034" ||
      (typeof err?.message === "string" &&
        (err.message.includes("23505") ||
          err.message.includes("40001") ||
          err.message.includes("sudah dipesan, silahkan pesan jam lain") ||
          err.message.includes("Jadwal baru saja dipesan orang lain")))
    ) {
      return {
        success: false,
        error: "sudah dipesan, silahkan pesan jam lain",
      };
    }
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
