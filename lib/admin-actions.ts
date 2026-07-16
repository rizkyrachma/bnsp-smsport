"use server";

import { prisma } from "./prisma";
import { getSession } from "./auth";
import { TIMEZONE } from "./constants";

type BookingWhereInput = NonNullable<Parameters<typeof prisma.booking.findMany>[0]>["where"];

/**
 * Section 5: Role protection. Must be called at the beginning of EVERY admin action.
 */
async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized: Akses ditolak. Hanya admin yang berhak melakukan operasi ini.");
  }
  return session;
}

/**
 * 1. DASHBOARD QUERIES (§6 #1)
 */
export async function getAdminDashboardData(dateRange?: { startDate?: string; endDate?: string }) {
  await requireAdmin();

  // Date filters if applied
  const whereBooking: BookingWhereInput = {};
  if (dateRange?.startDate || dateRange?.endDate) {
    whereBooking.bookingDate = {};
    if (dateRange.startDate) {
      (whereBooking.bookingDate as Record<string, unknown>).gte = new Date(dateRange.startDate + "T00:00:00");
    }
    if (dateRange.endDate) {
      (whereBooking.bookingDate as Record<string, unknown>).lte = new Date(dateRange.endDate + "T00:00:00");
    }
  }

  // A. Total pelanggan terdaftar (role=customer)
  const totalCustomers = await prisma.user.count({
    where: { role: "customer" },
  });

  // B. All courts
  const courts = await prisma.court.findMany({
    orderBy: { type: "asc" },
  });

  // C. All paid & pending bookings matching date range
  const bookings = await prisma.booking.findMany({
    where: whereBooking,
    include: {
      court: true,
      payment: true,
      user: true,
    },
    orderBy: { bookingDate: "asc" },
  });

  // Calculate revenue total
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paidBookings = bookings.filter((b: any) => b.status === "paid");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalRevenue = paidBookings.reduce((sum: number, b: any) => sum + b.totalPrice, 0);

  // Revenue chart data (Group by date string)
  const revenueByDateMap = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const b of paidBookings as any[]) {
    const dateStr = b.bookingDate.toISOString().slice(0, 10);
    revenueByDateMap.set(dateStr, (revenueByDateMap.get(dateStr) || 0) + b.totalPrice);
  }

  const revenueChartData = Array.from(revenueByDateMap.entries()).map(([date, amount]) => {
    // Format label nicely (e.g., "16 Jul")
    const d = new Date(date);
    const label = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    return { date, label, amount };
  });

  // Court booking stats (separated by futsal & badminton)
  const courtStatsMap = new Map<string, { courtName: string; type: string; totalBookings: number; revenue: number }>();
  for (const c of courts) {
    courtStatsMap.set(c.id, {
      courtName: c.name,
      type: c.type,
      totalBookings: 0,
      revenue: 0,
    });
  }

  for (const b of bookings) {
    if (b.status === "paid" || b.status === "pending") {
      const stat = courtStatsMap.get(b.courtId);
      if (stat) {
        stat.totalBookings += 1;
        if (b.status === "paid") {
          stat.revenue += b.totalPrice;
        }
      }
    }
  }

  const courtBookingStats = Array.from(courtStatsMap.values());

  // Check live occupancy status for right now
  const now = new Date();
  const nowJakarta = new Date(now.toLocaleString("en-US", { timeZone: TIMEZONE }));
  const todayStr = nowJakarta.toISOString().slice(0, 10);
  const currentHour = nowJakarta.getHours();

  // Find active booking right now
  const todayActiveBookings = await prisma.booking.findMany({
    where: {
      bookingDate: new Date(todayStr + "T00:00:00"),
      status: { in: ["paid", "pending"] },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courtsStatus = courts.map((c: any) => {
    // If court status in database is 'perbaikan', keep it
    if (c.status === "perbaikan") {
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        pricePerHour: c.pricePerHour,
        status: "perbaikan" as const,
        activeBooking: null,
      };
    }

    // Check if there's a booking active at current hour
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const active = todayActiveBookings.find((b: any) => {
      if (b.courtId !== c.id) return false;
      const startH = b.startTime.getUTCHours();
      const endH = b.endTime.getUTCHours();
      return currentHour >= startH && currentHour < endH;
    });

    return {
      id: c.id,
      name: c.name,
      type: c.type,
      pricePerHour: c.pricePerHour,
      status: active ? ("dipesan" as const) : ("tersedia" as const),
      activeBooking: active
        ? {
          id: active.id,
          start: `${active.startTime.getUTCHours().toString().padStart(2, "0")}:00`,
          end: `${active.endTime.getUTCHours().toString().padStart(2, "0")}:00`,
          status: active.status,
        }
        : null,
    };
  });

  return {
    totalCustomers,
    totalRevenue,
    totalBookingsCount: bookings.length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pendingVerificationsCount: bookings.filter((b: any) => b.status === "pending" && b.payment?.proofUrl).length,
    revenueChartData,
    courtBookingStats,
    courtsStatus,
  };
}

/**
 * 2. KELOLA PELANGGAN (§6 #2)
 */
export async function getCustomersList() {
  await requireAdmin();

  const customers = await prisma.user.findMany({
    where: { role: "customer" },
    include: {
      bookings: {
        include: {
          payment: true,
          court: true,
        },
        orderBy: { bookingDate: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return customers.map((c: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paidBookings = c.bookings.filter((b: any) => b.status === "paid");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalSpent = paidBookings.reduce((sum: number, b: any) => sum + b.totalPrice, 0);

    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone || "-",
      isBlocked: c.isBlocked,
      createdAt: c.createdAt.toISOString(),
      totalBookingsCount: c.bookings.length,
      paidBookingsCount: paidBookings.length,
      totalSpent,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentBookings: c.bookings.slice(0, 5).map((b: any) => ({
        id: b.id,
        courtName: b.court.name,
        date: b.bookingDate.toISOString().slice(0, 10),
        totalPrice: b.totalPrice,
        status: b.status,
      })),
    };
  });
}

export async function toggleBlockCustomer(userId: string, isBlocked: boolean) {
  await requireAdmin();

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isBlocked },
  });

  return { success: true, user };
}

/**
 * 3. BLOKIR JADWAL MANUAL (§6 #3)
 */
export async function updateCourtStatus(courtId: string, status: "tersedia" | "dipesan" | "perbaikan") {
  await requireAdmin();

  const court = await prisma.court.update({
    where: { id: courtId },
    data: { status },
  });

  return { success: true, court };
}

/**
 * 4. VERIFIKASI PEMBAYARAN MANUAL (§6 #4)
 */
export async function verifyPaymentAction(
  bookingId: string,
  action: "approve" | "reject",
  rejectionReason?: string
) {
  await requireAdmin();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });

  if (!booking) {
    return { success: false, error: "Data reservasi tidak ditemukan." };
  }

  if (action === "approve") {
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: "paid" },
      }),
      prisma.payment.upsert({
        where: { bookingId },
        create: {
          bookingId,
          amount: booking.totalPrice,
          paymentMethod: "manual_transfer",
          paymentStatus: "verified",
          paidAt: new Date(),
        },
        update: {
          paymentStatus: "verified",
          paidAt: new Date(),
        },
      }),
    ]);
    return { success: true, message: "Pembayaran berhasil diverifikasi & status pesanan kini LUNAS." };
  } else {
    // Reject
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: "cancelled" },
      }),
      prisma.payment.upsert({
        where: { bookingId },
        create: {
          bookingId,
          amount: booking.totalPrice,
          paymentMethod: "manual_transfer",
          paymentStatus: rejectionReason ? `rejected: ${rejectionReason}` : "rejected",
        },
        update: {
          paymentStatus: rejectionReason ? `rejected: ${rejectionReason}` : "rejected",
        },
      }),
    ]);
    return { success: true, message: "Pembayaran ditolak dan pesanan telah dibatalkan." };
  }
}

/**
 * 5. RIWAYAT BOOKING SEMUA PELANGGAN (§6 #5)
 */
export async function getAdminBookings(filters?: {
  status?: string;
  courtType?: string;
  courtId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  await requireAdmin();

  const whereClause: BookingWhereInput = {};

  if (filters?.status && filters.status !== "all") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    whereClause.status = filters.status as any;
  }

  if (filters?.courtId && filters.courtId !== "all") {
    whereClause.courtId = filters.courtId;
  } else if (filters?.courtType && filters.courtType !== "all") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    whereClause.court = { type: filters.courtType as any };
  }

  if (filters?.dateFrom || filters?.dateTo) {
    whereClause.bookingDate = {};
    if (filters.dateFrom) {
      (whereClause.bookingDate as Record<string, unknown>).gte = new Date(filters.dateFrom + "T00:00:00");
    }
    if (filters.dateTo) {
      (whereClause.bookingDate as Record<string, unknown>).lte = new Date(filters.dateTo + "T00:00:00");
    }
  }

  if (filters?.search && filters.search.trim() !== "") {
    const q = filters.search.trim();
    whereClause.user = {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  const bookings = await prisma.booking.findMany({
    where: whereClause,
    include: {
      user: true,
      court: true,
      payment: true,
    },
    orderBy: [
      { bookingDate: "desc" },
      { startTime: "desc" },
    ],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return bookings.map((b: any) => ({
    id: b.id,
    userId: b.userId,
    userName: b.user.name,
    userEmail: b.user.email,
    userPhone: b.user.phone || "-",
    courtId: b.courtId,
    courtName: b.court.name,
    courtType: b.court.type,
    bookingDate: b.bookingDate.toISOString().slice(0, 10),
    startTime: `${b.startTime.getUTCHours().toString().padStart(2, "0")}:${b.startTime.getUTCMinutes().toString().padStart(2, "0")}`,
    endTime: `${b.endTime.getUTCHours().toString().padStart(2, "0")}:${b.endTime.getUTCMinutes().toString().padStart(2, "0")}`,
    totalPrice: b.totalPrice,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
    payment: b.payment
      ? {
        method: b.payment.paymentMethod || "transfer",
        proofUrl: b.payment.proofUrl,
        status: b.payment.paymentStatus,
        paidAt: b.payment.paidAt ? b.payment.paidAt.toISOString() : null,
      }
      : null,
  }));
}
