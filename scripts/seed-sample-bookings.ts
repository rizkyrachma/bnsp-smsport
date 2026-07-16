import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("🌱 Menyiapkan data sampel pelanggan dan riwayat reservasi untuk tes & demonstrasi Admin...");

  // 1. Ensure a few customer users exist
  const cust1 = await prisma.user.upsert({
    where: { email: "andika@gmail.com" },
    update: {},
    create: {
      name: "Andika Pratama",
      email: "andika@gmail.com",
      phone: "081234567891",
      password: "hashedpassword123",
      role: "customer",
    },
  });

  const cust2 = await prisma.user.upsert({
    where: { email: "budi.santoso@yahoo.com" },
    update: {},
    create: {
      name: "Budi Santoso",
      email: "budi.santoso@yahoo.com",
      phone: "081987654321",
      password: "hashedpassword123",
      role: "customer",
    },
  });

  const cust3 = await prisma.user.upsert({
    where: { email: "citra.kirana@gmail.com" },
    update: {},
    create: {
      name: "Citra Kirana",
      email: "citra.kirana@gmail.com",
      phone: "081345678902",
      password: "hashedpassword123",
      role: "customer",
    },
  });

  // 2. Get courts
  const futsalA = await prisma.court.findFirst({ where: { name: { contains: "Futsal A" } } });
  const futsalB = await prisma.court.findFirst({ where: { name: { contains: "Futsal B" } } });
  const badmA = await prisma.court.findFirst({ where: { name: { contains: "Badminton 1" } } });
  const badmB = await prisma.court.findFirst({ where: { name: { contains: "Badminton 2" } } });

  if (!futsalA || !futsalB || !badmA || !badmB) {
    console.log("❌ Lapangan belum lengkap, pastikan seed-courts sudah dijalankan.");
    return;
  }

  // 3. Create realistic sample bookings
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);

  const sampleBookings = [
    {
      userId: cust1.id,
      courtId: futsalA.id,
      date: threeDaysAgo,
      start: "19:00",
      end: "21:00",
      price: futsalA.pricePerHour * 2,
      status: "paid" as const,
      proof: "https://placehold.co/600x800/222436/9580ff.png?text=Bukti+BCA+Rp300.000",
    },
    {
      userId: cust2.id,
      courtId: badmA.id,
      date: twoDaysAgo,
      start: "16:00",
      end: "18:00",
      price: badmA.pricePerHour * 2,
      status: "paid" as const,
      proof: "https://placehold.co/600x800/222436/9580ff.png?text=Bukti+Mandiri+Rp160.000",
    },
    {
      userId: cust3.id,
      courtId: futsalB.id,
      date: yesterday,
      start: "20:00",
      end: "22:00",
      price: futsalB.pricePerHour * 2,
      status: "paid" as const,
      proof: "https://placehold.co/600x800/222436/9580ff.png?text=Bukti+QRIS+Rp260.000",
    },
    {
      userId: cust1.id,
      courtId: badmB.id,
      date: yesterday,
      start: "10:00",
      end: "12:00",
      price: badmB.pricePerHour * 2,
      status: "paid" as const,
      proof: "https://placehold.co/600x800/222436/9580ff.png?text=Bukti+BCA+Rp160.000",
    },
    {
      userId: cust2.id,
      courtId: futsalA.id,
      date: today,
      start: "20:00",
      end: "22:00",
      price: futsalA.pricePerHour * 2,
      status: "pending" as const,
      proof: "https://placehold.co/600x800/222436/ffaa00.png?text=Bukti+Transfer+Pending",
    },
  ];

  for (const b of sampleBookings) {
    const existing = await prisma.booking.findFirst({
      where: {
        courtId: b.courtId,
        bookingDate: new Date(b.date + "T00:00:00"),
        startTime: new Date(`1970-01-01T${b.start}:00Z`),
      },
    });

    if (!existing) {
      const booking = await prisma.booking.create({
        data: {
          userId: b.userId,
          courtId: b.courtId,
          bookingDate: new Date(b.date + "T00:00:00"),
          startTime: new Date(`1970-01-01T${b.start}:00Z`),
          endTime: new Date(`1970-01-01T${b.end}:00Z`),
          totalPrice: b.price,
          status: b.status,
        },
      });

      if (b.proof || b.status === "paid") {
        await prisma.payment.create({
          data: {
            bookingId: booking.id,
            amount: b.price,
            paymentMethod: "transfer_bank",
            proofUrl: b.proof,
            paymentStatus: b.status === "paid" ? "verified" : "pending",
            paidAt: b.status === "paid" ? new Date() : null,
          },
        });
      }
    }
  }

  console.log("✅ Data sampel reservasi berhasil disiapkan di database!");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
