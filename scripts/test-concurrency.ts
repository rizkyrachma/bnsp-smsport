/**
 * Test anti double-booking concurrency + auto-cancel expired bookings.
 * 
 * Usage: npx tsx scripts/test-concurrency.ts
 * 
 * Prerequisites:
 *   - DATABASE_URL set in .env
 *   - `npx prisma migrate dev` already run
 *   - `npx prisma generate` already run
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ponytail: inline the booking logic here instead of importing server action
// because "use server" directives don't work outside Next.js runtime.
// Duplicates the core transaction from lib/booking.ts for testing purposes only.
async function createBookingDirect(input: {
  userId: string;
  courtId: string;
  bookingDate: Date;
  startTime: string;
  endTime: string;
}) {
  const { userId, courtId, bookingDate, startTime, endTime } = input;

  try {
    const booking = await prisma.$transaction(
      async (tx) => {
        const conflicts = await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM bookings
          WHERE court_id = ${courtId}
            AND booking_date = ${bookingDate}::date
            AND start_time < ${endTime}::time
            AND end_time > ${startTime}::time
            AND status IN ('pending', 'paid')
          FOR UPDATE
        `;

        if (conflicts.length > 0) {
          throw new Error("Jadwal baru saja dipesan orang lain.");
        }

        const court = await tx.court.findUniqueOrThrow({
          where: { id: courtId },
        });

        const [startH, startM] = startTime.split(":").map(Number);
        const [endH, endM] = endTime.split(":").map(Number);
        const durationHours =
          (endH * 60 + endM - (startH * 60 + startM)) / 60;
        const totalPrice = Math.round(court.pricePerHour * durationHours);

        return tx.booking.create({
          data: {
            userId,
            courtId,
            bookingDate,
            startTime: new Date(`1970-01-01T${startTime}:00Z`),
            endTime: new Date(`1970-01-01T${endTime}:00Z`),
            totalPrice,
            status: "pending",
          },
        });
      },
      { isolationLevel: "Serializable" }
    );

    return { success: true, bookingId: booking.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function main() {
  console.log("🧹 Cleaning up test data...");
  await prisma.payment.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.court.deleteMany({});
  await prisma.user.deleteMany({ where: { email: { startsWith: "test-" } } });

  console.log("🌱 Seeding test data...");

  const hashedPw = await hash("password123", 12);

  const [user1, user2] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Test User 1",
        email: "test-user1@example.com",
        password: hashedPw,
        role: "customer",
      },
    }),
    prisma.user.create({
      data: {
        name: "Test User 2",
        email: "test-user2@example.com",
        password: hashedPw,
        role: "customer",
      },
    }),
  ]);

  const court = await prisma.court.create({
    data: {
      name: "Lapangan Futsal 1",
      type: "futsal",
      pricePerHour: 150000,
      status: "tersedia",
    },
  });

  // Tomorrow's date to avoid past-date validation issues
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const bookingDate = new Date(tomorrow.toISOString().slice(0, 10) + "T00:00:00Z");

  // ============================================
  // TEST 1: Concurrent double-booking (§4.1)
  // ============================================
  console.log("\n═══════════════════════════════════════");
  console.log("TEST 1: Anti Double-Booking (Concurrency)");
  console.log("═══════════════════════════════════════");
  console.log("→ 2 users booking the SAME slot simultaneously...");

  const [result1, result2] = await Promise.all([
    createBookingDirect({
      userId: user1.id,
      courtId: court.id,
      bookingDate,
      startTime: "10:00",
      endTime: "11:00",
    }),
    createBookingDirect({
      userId: user2.id,
      courtId: court.id,
      bookingDate,
      startTime: "10:00",
      endTime: "11:00",
    }),
  ]);

  console.log("  User 1:", result1.success ? `✅ BOOKED (${result1.bookingId})` : `❌ REJECTED: ${result1.error}`);
  console.log("  User 2:", result2.success ? `✅ BOOKED (${result2.bookingId})` : `❌ REJECTED: ${result2.error}`);

  const oneSuccess = (result1.success ? 1 : 0) + (result2.success ? 1 : 0) === 1;
  console.log(
    oneSuccess
      ? "\n  ✅ PASS: Exactly 1 booking succeeded, 1 was rejected."
      : "\n  ❌ FAIL: Expected exactly 1 success and 1 failure!"
  );

  // ============================================
  // TEST 2: Overlapping time range (§4.1)
  // ============================================
  console.log("\n═══════════════════════════════════════");
  console.log("TEST 2: Overlapping Time Range");
  console.log("═══════════════════════════════════════");
  console.log("→ Booking 10:30-11:30 should conflict with existing 10:00-11:00...");

  const overlapResult = await createBookingDirect({
    userId: user2.id,
    courtId: court.id,
    bookingDate,
    startTime: "10:30",
    endTime: "11:30",
  });

  console.log(
    "  Result:",
    overlapResult.success
      ? "❌ FAIL: Should have been rejected!"
      : `✅ PASS: Correctly rejected — ${overlapResult.error}`
  );

  // ============================================
  // TEST 3: Non-overlapping booking (should succeed)
  // ============================================
  console.log("\n═══════════════════════════════════════");
  console.log("TEST 3: Non-Overlapping Booking");
  console.log("═══════════════════════════════════════");
  console.log("→ Booking 12:00-13:00 should succeed (no conflict)...");

  const noConflict = await createBookingDirect({
    userId: user2.id,
    courtId: court.id,
    bookingDate,
    startTime: "12:00",
    endTime: "13:00",
  });

  console.log(
    "  Result:",
    noConflict.success
      ? `✅ PASS: Booked successfully (${noConflict.bookingId})`
      : `❌ FAIL: Should have succeeded — ${noConflict.error}`
  );

  // ============================================
  // TEST 4: Auto-cancel expired bookings (§4.2)
  // ============================================
  console.log("\n═══════════════════════════════════════");
  console.log("TEST 4: Auto-Cancel Expired Bookings");
  console.log("═══════════════════════════════════════");

  // Create a booking with created_at set to 20 minutes ago (simulate expired)
  const expiredBooking = await prisma.booking.create({
    data: {
      userId: user1.id,
      courtId: court.id,
      bookingDate,
      startTime: new Date("1970-01-01T14:00:00Z"),
      endTime: new Date("1970-01-01T15:00:00Z"),
      totalPrice: 150000,
      status: "pending",
      createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20 min ago
    },
  });

  console.log(`→ Created pending booking ${expiredBooking.id} with createdAt 20min ago`);

  // Run the auto-cancel logic
  const HOLD_DURATION_MS = 15 * 60 * 1000;
  const cutoff = new Date(Date.now() - HOLD_DURATION_MS);

  const cancelResult = await prisma.booking.updateMany({
    where: {
      status: "pending",
      createdAt: { lt: cutoff },
    },
    data: { status: "cancelled" },
  });

  console.log(`→ Auto-cancel result: ${cancelResult.count} booking(s) cancelled`);

  const cancelled = await prisma.booking.findUnique({
    where: { id: expiredBooking.id },
  });

  console.log(
    cancelled?.status === "cancelled"
      ? "  ✅ PASS: Expired booking was correctly cancelled."
      : `  ❌ FAIL: Booking status is "${cancelled?.status}", expected "cancelled".`
  );

  // Summary
  console.log("\n═══════════════════════════════════════");
  console.log("SUMMARY");
  console.log("═══════════════════════════════════════");
  const allPassed =
    oneSuccess &&
    !overlapResult.success &&
    noConflict.success &&
    cancelled?.status === "cancelled";
  console.log(allPassed ? "✅ All tests PASSED" : "❌ Some tests FAILED");

  await prisma.$disconnect();
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  prisma.$disconnect();
  process.exit(1);
});
