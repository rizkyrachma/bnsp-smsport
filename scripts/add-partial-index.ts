import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Creating partial unique index for active bookings only...");
  
  // Drop any lingering unconditional index if exists
  await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS bookings_court_id_booking_date_start_time_key;`);
  
  // Create partial unique index where status is 'pending' or 'paid'
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS active_booking_unique_idx 
    ON bookings (court_id, booking_date, start_time) 
    WHERE status IN ('pending', 'paid');
  `);

  console.log("✔ Partial unique index active_booking_unique_idx created successfully.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
