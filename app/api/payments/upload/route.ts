import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

/**
 * Payment Submission Endpoint (§6 Customer & §4.2)
 * Handles manual transfer proof upload and provides structure for future payment gateway integrations (QRIS/VA).
 */
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
    const { bookingId, paymentMethod, proofUrl } = body;

    if (!bookingId || !paymentMethod) {
      return NextResponse.json(
        { error: "Booking ID dan metode pembayaran wajib diisi." },
        { status: 400 }
      );
    }

    if (paymentMethod === "bank_transfer" && !proofUrl) {
      return NextResponse.json(
        { error: "Bukti transfer wajib diunggah untuk pembayaran manual." },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking || booking.userId !== session.id) {
      return NextResponse.json({ error: "Data booking tidak ditemukan." }, { status: 404 });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Booking sudah dibatalkan atau kedaluwarsa." },
        { status: 400 }
      );
    }

    if (booking.status === "paid") {
      return NextResponse.json(
        { error: "Booking ini sudah terverifikasi lunas." },
        { status: 400 }
      );
    }

    // Upsert payment record
    const payment = await prisma.payment.upsert({
      where: { bookingId },
      update: {
        paymentMethod,
        amount: booking.totalPrice,
        proofUrl: proofUrl || null,
        paymentStatus: "pending",
      },
      create: {
        bookingId,
        paymentMethod,
        amount: booking.totalPrice,
        proofUrl: proofUrl || null,
        paymentStatus: "pending",
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat menyimpan data pembayaran." },
      { status: 500 }
    );
  }
}
