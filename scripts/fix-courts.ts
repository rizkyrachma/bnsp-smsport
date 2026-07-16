import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("🔧 Merapikan daftar lapangan agar tepat 2 Futsal + 3 Badminton...");

  // 1. Cari old "Lapangan Futsal 1"
  const oldCourt = await prisma.court.findFirst({
    where: { name: "Lapangan Futsal 1" },
  });

  const targetA = await prisma.court.findFirst({
    where: { name: "Lapangan Futsal A (Interlock Pro)" },
  });

  if (oldCourt && targetA && oldCourt.id !== targetA.id) {
    console.log("🔄 Memindahkan bookings dari old court ke targetA...");
    await prisma.booking.updateMany({
      where: { courtId: oldCourt.id },
      data: { courtId: targetA.id },
    });

    await prisma.court.delete({ where: { id: oldCourt.id } });
    console.log("🗑️ Old court 'Lapangan Futsal 1' berhasil dihapus setelah migrasi booking.");
  }

  const allCourts = await prisma.court.findMany({ orderBy: { type: "asc" } });
  console.log("📋 Daftar Lapangan Aktif Saat Ini:");
  allCourts.forEach((c, idx) => {
    console.log(`   ${idx + 1}. [${c.type.toUpperCase()}] ${c.name} - Rp ${c.pricePerHour.toLocaleString("id-ID")}/jam (${c.status})`);
  });

  console.log(`✅ Total Lapangan Aktif: ${allCourts.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Gagal merapikan lapangan:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
