import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function formatIndonesianDate(dateStr: Date) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = BULAN[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

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
              <h1 class="text-xl font-bold text-red-800">Pemesanan Tidak Ditemukan</h1>
              <p class="text-xs text-red-600 mt-2 leading-relaxed">Pemesanan dengan ID tersebut tidak ditemukan.</p>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 404 }
      );
    }

    // Check if paid already
    if (booking.status === "paid") {
      const formattedDate = formatIndonesianDate(booking.bookingDate);
      return new NextResponse(
        renderSuccessPage(bookingId, booking.court.name, formattedDate, booking.totalPrice),
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 }
      );
    }

    // Check if expired / cancelled
    if (booking.status === "cancelled") {
      return new NextResponse(
        `<html>
          <head>
            <title>Transaksi Kadaluarsa - SM Sport Center</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-[#fafafa] flex items-center justify-center min-h-screen p-4 font-sans text-[#181925]">
            <div class="bg-white border border-red-200/60 rounded-3xl p-8 max-w-sm w-full text-center shadow-lg">
              <div class="text-red-500 text-5xl mb-4">⏳</div>
              <h1 class="text-xl font-bold text-red-800">QRIS Sudah Kadaluarsa</h1>
              <p class="text-xs text-red-600 mt-2 leading-relaxed">Batas waktu pembayaran 10 menit telah habis. Silakan reaktivasi pesanan Anda kembali dari menu Riwayat Booking di aplikasi.</p>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
      );
    }

    // Render Checkout Confirmation Page
    const formattedDate = formatIndonesianDate(booking.bookingDate);
    return new NextResponse(
      `<html>
        <head>
          <title>Konfirmasi Pembayaran - SM Sport Center</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    lavender: '#21257c',
                    carbon: '#181925',
                    ash: '#828282',
                    mist: '#f3f4f6',
                    fog: '#e5e7eb',
                  }
                }
              }
            }
          </script>
        </head>
        <body class="bg-[#fafafa] flex items-center justify-center min-h-screen p-4 font-sans text-[#181925]">
          <div class="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl flex flex-col items-center">
            
            <span class="w-12 h-12 rounded-full bg-lavender/10 text-lavender font-black text-sm flex items-center justify-center mb-3">
              SM
            </span>
            <h1 class="text-xl font-black text-carbon tracking-tight">Konfirmasi Pembayaran</h1>
            <p class="text-[10px] text-ash font-bold uppercase tracking-wider mt-0.5">SM Sport Center</p>

            <div class="w-full border-t border-dashed border-gray-200 my-5"></div>

            <!-- Booking Details Card -->
            <div class="bg-[#fcfcfc] border border-gray-100 rounded-2xl p-4 w-full text-xs space-y-3 mb-5">
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
              <div class="flex justify-between border-t border-dashed border-gray-100 pt-2.5">
                <span class="text-gray-400 font-medium">Metode Pembayaran</span>
                <span class="font-bold text-[#181925]">📱 QRIS Dinamis</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400 font-medium">Total Bayar</span>
                <span class="font-extrabold text-lavender text-sm">Rp ${booking.totalPrice.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <form method="POST" action="/api/payments/checkout?bookingId=${bookingId}" class="w-full" onsubmit="document.getElementById('pay-btn').disabled = true; document.getElementById('pay-btn').innerText = 'Memproses Pembayaran...';">
              <button id="pay-btn" type="submit" class="w-full bg-lavender text-white py-3.5 rounded-full font-bold text-sm shadow-subtle hover:opacity-95 transition cursor-pointer">
                Bayar Sekarang
              </button>
            </form>
            
            <p class="text-center text-[10px] text-gray-400 mt-4 leading-relaxed">
              Dengan mengklik tombol, Anda menyatakan setuju melakukan pelunasan biaya sewa lapangan.
            </p>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 }
    );

  } catch (error) {
    console.error("GET checkout error:", error);
    return new NextResponse(
      `<html>
        <head><title>Error</title></head>
        <body><p>Terjadi kesalahan server.</p></body>
      </html>`,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const bookingId = searchParams.get("bookingId");

  if (!bookingId) {
    return new NextResponse("Missing bookingId", { status: 400 });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { court: true },
    });

    if (!booking) {
      return new NextResponse("Booking not found", { status: 404 });
    }

    if (booking.status === "cancelled") {
      return new NextResponse(
        `<html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h2>⏳ Transaksi Kadaluarsa</h2>
            <p>Batas waktu pembayaran 10 menit telah habis.</p>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" }, status: 400 }
      );
    }

    // Process the payment mutation (status paid)
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

    const formattedDate = formatIndonesianDate(booking.bookingDate);
    return new NextResponse(
      renderSuccessPage(bookingId, booking.court.name, formattedDate, booking.totalPrice),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 }
    );

  } catch (error) {
    console.error("POST checkout error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

function renderSuccessPage(bookingId: string, courtName: string, dateStr: string, price: number) {
  return `<html>
    <head>
      <title>Pembayaran Sukses - SM Sport Center</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                lavender: '#21257c',
                carbon: '#181925',
                ash: '#828282',
                mist: '#f3f4f6',
                fog: '#e5e7eb',
              }
            }
          }
        }
      </script>
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
            <span class="font-bold text-gray-800">${courtName}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400 font-medium">Tanggal</span>
            <span class="font-bold text-gray-800">${dateStr}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400 font-medium">Status</span>
            <span class="font-bold text-emerald-600 font-mono text-[10px] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">TERBAYAR LUNAS</span>
          </div>
          <div class="flex justify-between border-t border-dashed border-gray-100 pt-2.5">
            <span class="text-gray-400 font-medium">Total Harga</span>
            <span class="font-extrabold text-emerald-600 text-sm">Rp ${price.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <p class="text-center text-[11px] text-gray-500 mt-6 leading-relaxed">
          Lunas terbayar via QRIS Dinamis. Layar komputer Anda di lokasi pemesanan akan otomatis diperbarui dan memunculkan E-Tiket dalam waktu singkat. Anda sekarang dapat menutup tab ini.
        </p>

      </div>
    </body>
  </html>`;
}
