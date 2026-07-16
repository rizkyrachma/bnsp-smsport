import { NextRequest, NextResponse } from "next/server";
import { cancelExpiredBookings } from "@/lib/booking";

/**
 * Cron endpoint to cancel expired pending bookings (§4.2).
 * Protected by CRON_SECRET to prevent unauthorized calls.
 *
 * Vercel Cron config (vercel.json):
 * "crons": [{ "path": "/api/bookings/cancel-expired", "schedule": "every 5 min" }]
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await cancelExpiredBookings();
  return NextResponse.json({ cancelled: count });
}
