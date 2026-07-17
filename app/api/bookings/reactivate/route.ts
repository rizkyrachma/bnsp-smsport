import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || session.role !== "customer") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "ID Booking wajib diisi." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find the booking
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { court: true },
      });

      if (!booking) {
        throw new Error("Booking tidak ditemukan.");
      }

      if (booking.userId !== session.id) {
        throw new Error("Akses ditolak.");
      }

      // Check if slot conflicts with another active booking (anti double-booking)
      // Since startTime and endTime in database are stored as Date/Time object, we match them
      const conflicts = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM bookings
        WHERE court_id = ${booking.courtId}
          AND booking_date = ${booking.bookingDate}::date
          AND start_time < ${booking.endTime}::time
          AND end_time > ${booking.startTime}::time
          AND status IN ('pending', 'paid')
          AND id != ${bookingId}
        FOR UPDATE
      `;

      if (conflicts.length > 0) {
        throw new Error("Jadwal lapangan ini telah dipesan oleh orang lain. Silakan buat pesanan baru.");
      }

      // Reactivate the booking: reset status to pending and createdAt to NOW
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "pending",
          createdAt: new Date(),
        },
        include: {
          court: true,
          payment: true,
        }
      });

      return updatedBooking;
    }, {
      isolationLevel: "Serializable"
    });

    return NextResponse.json({ success: true, booking: result });
  } catch (error: any) {
    console.error("Reactivate booking error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan server saat memperbarui booking." },
      { status: 400 }
    );
  }
}
