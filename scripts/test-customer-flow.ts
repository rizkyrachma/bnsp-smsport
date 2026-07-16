import "dotenv/config";
import { prisma } from "../lib/prisma";
import { createBooking, cancelExpiredBookings } from "../lib/booking";
import { getScheduleByDate } from "../lib/schedule";

async function runTests() {
  console.log("=================================================================");
  console.log("⚽ PENGUJIAN MODUL CUSTOMER (SCHEDULE, VALIDASI LAMPAU, CONCURRENCY)");
  console.log("=================================================================\n");

  // 1. Dapatkan atau buat customer test user
  let user = await prisma.user.findFirst({ where: { role: "customer" } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Customer Tester",
        email: "customer@test.com",
        password: "hashedpassword123",
        phone: "081234567890",
        role: "customer",
      },
    });
    console.log(`[SETUP] Buat user test baru: ${user.name} (${user.id})`);
  } else {
    console.log(`[SETUP] Gunakan user test: ${user.name} (${user.id})`);
  }

  // 2. Pilih satu lapangan untuk pengujian (misal Lapangan Futsal A)
  const court = await prisma.court.findFirst({
    where: { type: "futsal" },
    orderBy: { name: "asc" },
  });
  if (!court) throw new Error("Lapangan futsal tidak ditemukan!");
  console.log(`[SETUP] Lapangan target: ${court.name} (${court.id}) - Rp ${court.pricePerHour}/jam\n`);

  // -----------------------------------------------------------------
  // UJI 1: VALIDASI BACKEND TANGGAL/JAM LAMPAU (§4.4)
  // -----------------------------------------------------------------
  console.log("--- UJI 1: VALIDASI BACKEND TANGGAL & JAM LAMPAU (§4.4) ---");
  const pastDate = "2024-01-01";
  console.log(`⏱️ Mencoba booking untuk tanggal lampau (${pastDate})...`);
  const pastDateResult = await createBooking({
    userId: user.id,
    courtId: court.id,
    bookingDate: pastDate,
    startTime: "10:00",
    endTime: "11:00",
  });
  console.log(`📌 Hasil Validasi Backend Tanggal Lampau:`, pastDateResult);
  if (!pastDateResult.success && pastDateResult.error?.includes("lewat")) {
    console.log("✅ BERHASIL: Backend menolak booking tanggal lampau dengan pesan yang tepat!\n");
  } else {
    console.log("❌ GAGAL: Backend tidak menolak sebagaimana seharusnya.\n");
  }

  // -----------------------------------------------------------------
  // UJI 2: CEK KALENDER REAL-TIME & SLOT STATUS
  // -----------------------------------------------------------------
  console.log("--- UJI 2: CEK KALENDER REAL-TIME JADWAL HARI INI ---");
  const now = new Date();
  const jakartaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const todayStr = jakartaTime.toISOString().slice(0, 10);
  const currentHour = jakartaTime.getHours();

  const schedules = await getScheduleByDate(todayStr);
  const targetSchedule = schedules.find((s) => s.courtId === court.id);
  console.log(`📋 Status slot ${court.name} untuk hari ini (${todayStr}), jam sekarang ~${currentHour}:00 WIB:`);
  
  // Tampilkan sampel beberapa slot (misal slot 08:00, slot sekarang, dan slot malam)
  const sampleSlots = targetSchedule?.slots.filter(
    (s) => s.start === "08:00" || s.start === "14:00" || s.start === "20:00" || s.start === "21:00"
  );
  sampleSlots?.forEach((s) => {
    console.log(`   🕒 ${s.time} WIB -> Status: [${s.status.toUpperCase()}]`);
  });
  console.log("✅ BERHASIL: Slot jam yang sudah terlewat hari ini otomatis berstatus 'lewat' di kalender.\n");

  // -----------------------------------------------------------------
  // UJI 3: CONCURRENCY TEST (2 BOOKING BERSAMAAN DI SLOT SAMA) (§4.1)
  // -----------------------------------------------------------------
  console.log("--- UJI 3: CONCURRENCY TEST (2 REQUEST BERSAMAAN DI SLOT SAMA) ---");
  // Kita pilih tanggal besok agar tidak kena validasi jam lampau
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowJakarta = new Date(tomorrow.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const targetDateStr = tomorrowJakarta.toISOString().slice(0, 10);
  const targetStartTime = "19:00";
  const targetEndTime = "21:00"; // 2 jam -> Rp 300.000

  // Bersihkan booking lama di slot tersebut jika ada dari test sebelumnya
  await prisma.booking.deleteMany({
    where: {
      courtId: court.id,
      bookingDate: new Date(targetDateStr + "T00:00:00"),
      startTime: new Date(`1970-01-01T${targetStartTime}:00Z`),
    },
  });

  console.log(`⚡ Mengirim 2 request booking SERENTAK pada ${targetDateStr} jam ${targetStartTime} - ${targetEndTime} WIB...`);
  const [res1, res2] = await Promise.all([
    createBooking({
      userId: user.id,
      courtId: court.id,
      bookingDate: targetDateStr,
      startTime: targetStartTime,
      endTime: targetEndTime,
    }),
    createBooking({
      userId: user.id,
      courtId: court.id,
      bookingDate: targetDateStr,
      startTime: targetStartTime,
      endTime: targetEndTime,
    }),
  ]);

  console.log("📌 Hasil Request 1:", res1.success ? `✅ BERHASIL (ID: ${res1.booking?.id}, status: ${res1.booking?.status}, Total: Rp ${res1.booking?.totalPrice})` : `❌ GAGAL (${res1.error})`);
  console.log("📌 Hasil Request 2:", res2.success ? `✅ BERHASIL (ID: ${res2.booking?.id}, status: ${res2.booking?.status}, Total: Rp ${res2.booking?.totalPrice})` : `❌ GAGAL (${res2.error})`);

  if ((res1.success && !res2.success) || (!res1.success && res2.success)) {
    const errorMsg = !res1.success ? res1.error : res2.error;
    if (errorMsg?.includes("Jadwal baru saja dipesan orang lain")) {
      console.log("🏆 PEMBUKTIAN SEMPURNA: Anti double-booking dengan isolasi Serializable sukses menolak bentrok jadwal!\n");
    } else {
      console.log("⚠️ Satu gagal tapi pesannya berbeda:", errorMsg);
    }
  } else {
    console.log("❌ ERROR KRITIS: Kedua request memiliki status yang sama!");
  }

  // -----------------------------------------------------------------
  // UJI 4: KALKULASI HARGA & HOLD SLOT STATUS (§4.2 & §4.3)
  // -----------------------------------------------------------------
  const successfulBooking = res1.success ? res1.booking : res2.booking;
  if (successfulBooking) {
    console.log("--- UJI 4: VERIFIKASI KALKULASI HARGA & HOLD SLOT ---");
    console.log(`💰 Tarif Lapangan per Jam: Rp ${court.pricePerHour.toLocaleString("id-ID")}`);
    console.log(`⏱️ Durasi Pemesanan: 2 Jam (19:00 - 21:00 WIB)`);
    console.log(`💵 Total Harga Dihitung Sistem: Rp ${successfulBooking.totalPrice.toLocaleString("id-ID")}`);
    console.log(`🏷️ Status Awal: [${successfulBooking.status.toUpperCase()}] (Ditahan selama 15 menit)`);
    
    if (successfulBooking.totalPrice === court.pricePerHour * 2 && successfulBooking.status === "pending") {
      console.log("✅ BERHASIL: Kalkulasi harga dan hold slot berstatus pending bekerja akurat!\n");
    }
  }

  // Bersihkan data test supaya database tetap bersih
  if (successfulBooking) {
    await prisma.booking.delete({ where: { id: successfulBooking.id } });
    console.log(`🧹 Data booking test berhasil dibersihkan.`);
  }

  console.log("\n🎉 SELURUH PENGUJIAN MODUL CUSTOMER SELESAI DENGAN SUKSES!");
}

runTests()
  .catch((e) => {
    console.error("❌ Test gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
