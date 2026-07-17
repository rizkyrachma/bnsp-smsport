import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const bookingId = searchParams.get("bookingId");

  if (!bookingId) {
    return new NextResponse(
      `<html>
        <head>
          <title>Error - SM Sport Center</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-[#fafafa] flex items-center justify-center min-h-screen p-4 font-sans text-[#181925]">
          <div class="bg-white border border-red-200/60 rounded-3xl p-8 max-w-sm w-full text-center shadow-lg">
            <div class="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 class="text-xl font-bold text-red-800">Kesalahan Pembayaran</h1>
            <p class="text-xs text-red-600 mt-2 leading-relaxed">ID Pesanan tidak ditemukan atau tidak valid.</p>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
    );
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { court: true },
    });

    if (!booking) {
      return new NextResponse(
        `<html>
          <head>
            <title>Error - SM Sport Center</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-[#fafafa] flex items-center justify-center min-h-screen p-4 font-sans text-[#181925]">
            <div class="bg-white border border-red-200/60 rounded-3xl p-8 max-w-sm w-full text-center shadow-lg">
              <div class="text-red-500 text-5xl mb-4">⚠️</div>
              <h1 class="text-xl font-bold text-red-800">Kesalahan</h1>
              <p class="text-xs text-red-600 mt-2 leading-relaxed">Pemesanan dengan ID tersebut tidak ditemukan.</p>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 404 }
      );
    }

    if (booking.status === "cancelled") {
      return new NextResponse(
        `<html>
          <head>
            <title>Kedaluwarsa - SM Sport Center</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-[#fafafa] flex items-center justify-center min-h-screen p-4 font-sans text-[#181925]">
            <div class="bg-white border border-yellow-200/60 rounded-3xl p-8 max-w-sm w-full text-center shadow-lg">
              <div class="text-yellow-500 text-5xl mb-4">⏳</div>
              <h1 class="text-xl font-bold text-yellow-800">Booking Kedaluwarsa</h1>
              <p class="text-xs text-yellow-600 mt-2 leading-relaxed">Pemesanan ini sudah kedaluwarsa atau dibatalkan karena melewati batas pembayaran 15 menit.</p>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
      );
    }

    // Process payment and mark as paid if not already paid
    if (booking.status === "pending") {
      await prisma.$transaction([
        prisma.payment.upsert({
          where: { bookingId },
          update: {
            paymentMethod: "qris",
            amount: booking.totalPrice,
            proofUrl: "QRIS Dynamic Scan",
            paymentStatus: "verified",
            paidAt: new Date(),
          },
          create: {
            bookingId,
            paymentMethod: "qris",
            amount: booking.totalPrice,
            proofUrl: "QRIS Dynamic Scan",
            paymentStatus: "verified",
            paidAt: new Date(),
          },
        }),
        prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: "paid",
          },
        }),
      ]);
    }

    const formattedDate = new Date(booking.bookingDate).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return new NextResponse(
      `<html>
        <head>
          <title>Pembayaran Sukses - SM Sport Center</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @keyframes checkmark {
              0% { transform: scale(0); opacity: 0; }
              50% { transform: scale(1.2); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            .animate-checkmark {
              animation: checkmark 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
          </style>
        </head>
        <body class="bg-[#fafafa] flex items-center justify-center min-h-screen p-4 font-sans text-[#181925]">
          <div class="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl flex flex-col items-center">
            
            <!-- Dynamic Checkmark -->
            <div class="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-3xl mb-4 shadow-inner border border-emerald-100/50 animate-checkmark">
              ✓
            </div>

            <h1 class="text-2xl font-black text-emerald-800 tracking-tight">Pembayaran Sukses!</h1>
            <p class="text-xs text-emerald-600 mt-1 font-semibold text-center uppercase tracking-wider">SM Sport Center</p>

            <div class="w-full border-t border-dashed border-gray-200 my-6"></div>

            <!-- Booking Details Card -->
            <div class="bg-[#fcfcfc] border border-gray-100 rounded-2xl p-4 w-full text-xs space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-400 font-medium">ID Reservasi</span>
                <span class="font-bold text-gray-800 font-mono text-[10px] bg-gray-100 px-2 py-0.5 rounded">${bookingId}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400 font-medium">Lapangan</span>
                <span class="font-bold text-gray-800">${booking.court.name}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400 font-medium">Tanggal</span>
                <span class="font-bold text-gray-800">${formattedDate}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400 font-medium">Total Harga</span>
                <span class="font-extrabold text-emerald-600 text-sm">Rp ${booking.totalPrice.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <p class="text-center text-[11px] text-gray-500 mt-6 leading-relaxed">
              Lunas terbayar via QRIS Dinamis. Layar komputer Anda di lokasi pemesanan akan otomatis diperbarui dan memunculkan E-Tiket dalam waktu singkat. Anda sekarang dapat menutup tab ini.
            </p>

          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 }
    );
  } catch (error) {
    console.error("Checkout page error:", error);
    return new NextResponse(
      `<html>
        <head>
          <title>Error - SM Sport Center</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-[#fafafa] flex items-center justify-center min-h-screen p-4 font-sans text-[#181925]">
          <div class="bg-white border border-red-200/60 rounded-3xl p-8 max-w-sm w-full text-center shadow-lg">
            <div class="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 class="text-xl font-bold text-red-800">Kesalahan Server</h1>
            <p class="text-xs text-red-600 mt-2 leading-relaxed">Gagal memproses pembayaran. Hubungi IT support.</p>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 500 }
    );
  }
}
