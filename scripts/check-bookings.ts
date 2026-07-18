import "dotenv/config";
import { prisma } from "../lib/prisma";
import { utcToWIB } from "../lib/timezone";

async function main() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { court: true, user: true },
  });

  console.log("=== RECENT BOOKINGS IN DATABASE ===");
  for (const b of bookings) {
    const dateStr = b.bookingDate instanceof Date ? b.bookingDate.toISOString().split("T")[0] : String(b.bookingDate);
    const startWIB = utcToWIB(b.startTime).format("HH:mm");
    const endWIB = utcToWIB(b.endTime).format("HH:mm");
    console.log(`[ID: ${b.id}] Court: ${b.court?.name} (${b.courtId}) | Date: ${dateStr} | Time: ${startWIB} - ${endWIB} WIB (UTC: ${b.startTime.toISOString().slice(11,16)}) | Status: ${b.status} | User: ${b.user?.name || b.userId}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
