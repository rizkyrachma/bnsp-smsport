import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Cleaning up duplicate bookings to allow UNIQUE constraint...");
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "asc" },
  });

  const seen = new Set<string>();
  let removedCount = 0;

  for (const b of bookings) {
    // Format key: courtId_YYYY-MM-DD_time
    const dateStr = b.bookingDate instanceof Date ? b.bookingDate.toISOString().split("T")[0] : String(b.bookingDate);
    const timeStr = b.startTime instanceof Date ? b.startTime.toISOString() : String(b.startTime);
    const key = `${b.courtId}_${dateStr}_${timeStr}`;

    if (seen.has(key)) {
      console.log(`Removing duplicate booking ID: ${b.id} (${key}) - status: ${b.status}`);
      await prisma.payment.deleteMany({ where: { bookingId: b.id } });
      await prisma.booking.delete({ where: { id: b.id } });
      removedCount++;
    } else {
      seen.add(key);
    }
  }

  console.log(`Successfully removed ${removedCount} duplicate bookings.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
