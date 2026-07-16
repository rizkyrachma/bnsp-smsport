import "dotenv/config";
import { prisma } from "../lib/prisma";
import { CourtType, CourtStatus } from "@prisma/client";

/**
 * Seed 5 Lapangan sesuai spesifikasi AGENTS.md Section 1:
 * - 2 Lapangan Futsal
 * - 3 Lapangan Badminton
 */
async function main() {
  console.log("🌱 Menyiapkan data 5 Lapangan (2 Futsal + 3 Badminton)...");

  const courtsData: {
    name: string;
    type: CourtType;
    price_per_hour: number;
    status: CourtStatus;
  }[] = [
    {
      name: "Lapangan Futsal A (Interlock Pro)",
      type: "futsal",
      price_per_hour: 150000,
      status: "tersedia",
    },
    {
      name: "Lapangan Futsal B (Interlock Deluxe)",
      type: "futsal",
      price_per_hour: 150000,
      status: "tersedia",
    },
    {
      name: "Lapangan Badminton 1 (Court Vinyl Pro)",
      type: "badminton",
      price_per_hour: 60000,
      status: "tersedia",
    },
    {
      name: "Lapangan Badminton 2 (Court Vinyl Pro)",
      type: "badminton",
      price_per_hour: 60000,
      status: "tersedia",
    },
    {
      name: "Lapangan Badminton 3 (Court Vinyl VIP)",
      type: "badminton",
      price_per_hour: 65000,
      status: "tersedia",
    },
  ];

  // We check if any courts exist; if there's only dummy/old courts, we can either clear or upsert
  for (const c of courtsData) {
    const existing = await prisma.court.findFirst({
      where: { name: c.name },
    });

    if (existing) {
      await prisma.court.update({
        where: { id: existing.id },
        data: {
          type: c.type,
          pricePerHour: c.price_per_hour,
          status: c.status,
        },
      });
      console.log(`✅ Updated: ${c.name}`);
    } else {
      await prisma.court.create({
        data: {
          name: c.name,
          type: c.type,
          pricePerHour: c.price_per_hour,
          status: c.status,
        },
      });
      console.log(`✨ Created: ${c.name}`);
    }
  }

  // Also clean up old single/generic "Court 1" if it exists and isn't one of these 5
  const allCourts = await prisma.court.findMany();
  const validNames = courtsData.map((d) => d.name);
  for (const dbCourt of allCourts) {
    if (!validNames.includes(dbCourt.name)) {
      // Check if there are bookings attached before deleting to prevent FK errors
      const bookingsCount = await prisma.booking.count({
        where: { courtId: dbCourt.id },
      });
      if (bookingsCount === 0) {
        await prisma.court.delete({ where: { id: dbCourt.id } });
        console.log(`🗑️ Removed old unused generic court: ${dbCourt.name}`);
      } else {
        // Update its name to one of the valid ones if needed or keep it
        console.log(`⚠️ Court ${dbCourt.name} has bookings, preserving.`);
      }
    }
  }

  const total = await prisma.court.count();
  console.log(`🎉 Selesai! Total lapangan aktif di database: ${total}`);
}

main()
  .catch((e) => {
    console.error("❌ Gagal seed courts:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
