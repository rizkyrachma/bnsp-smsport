import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";
import { createBooking, cancelExpiredBookings } from "@/lib/booking";
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
    const { courtId, bookingDate, startTime, endTime } = body;

    if (!courtId || !bookingDate || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Semua data booking (lapangan, tanggal, jam mulai, jam selesai) wajib diisi." },
        { status: 400 }
      );
    }

    // Call foundational createBooking logic (§4.1 & §4.4)
    const result = await createBooking({
      userId: session.id,
      courtId,
      bookingDate,
      startTime,
      endTime,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({ success: true, booking: result.booking }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat memproses booking." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    }

    // Run auto-cancel check before returning status
    await cancelExpiredBookings();

    const bookings = await prisma.booking.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      include: {
        court: true,
        payment: true,
      },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data booking." },
      { status: 500 }
    );
  }
}
