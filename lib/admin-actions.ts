"use server";

import { prisma } from "./prisma";
import { getSession } from "./auth";
import { TIMEZONE } from "./constants";
import { hash } from "bcryptjs";
import { formatJamWIB, formatTanggalWIB, wibToUTC } from "./timezone";

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

  try {
    const { cancelExpiredBookings } = await import("./booking");
    await cancelExpiredBookings();
  } catch (err) {
    console.error("Gagal auto-cancel booking expired di dashboard:", err);
  }

  // Date filters if applied
  const whereBooking: BookingWhereInput = {};
  if (dateRange?.startDate || dateRange?.endDate) {
    whereBooking.bookingDate = {};
    if (dateRange.startDate) {
      (whereBooking.bookingDate as Record<string, unknown>).gte = new Date(dateRange.startDate + "T00:00:00Z");
    }
    if (dateRange.endDate) {
      (whereBooking.bookingDate as Record<string, unknown>).lte = new Date(dateRange.endDate + "T00:00:00Z");
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

  try {
    const { cancelExpiredBookings } = await import("./booking");
    await cancelExpiredBookings();
  } catch (err) {
    console.error("Gagal auto-cancel booking expired di riwayat:", err);
  }

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
      (whereClause.bookingDate as Record<string, unknown>).gte = new Date(filters.dateFrom + "T00:00:00Z");
    }
    if (filters.dateTo) {
      (whereClause.bookingDate as Record<string, unknown>).lte = new Date(filters.dateTo + "T00:00:00Z");
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
    bookingDate: formatTanggalWIB(b.bookingDate),
    startTime: formatJamWIB(b.startTime),
    endTime: formatJamWIB(b.endTime),
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

/**
 * 6. COURTS CRUD OPERATIONS
 */
export async function createCourt(name: string, type: "futsal" | "badminton", pricePerHour: number, status: "tersedia" | "perbaikan") {
  await requireAdmin();
  const court = await prisma.court.create({
    data: { name, type, pricePerHour, status },
  });
  return { success: true, court };
}

export async function updateCourt(courtId: string, name: string, type: "futsal" | "badminton", pricePerHour: number, status: "tersedia" | "perbaikan") {
  await requireAdmin();
  const court = await prisma.court.update({
    where: { id: courtId },
    data: { name, type, pricePerHour, status },
  });
  return { success: true, court };
}

export async function deleteCourt(courtId: string) {
  await requireAdmin();
  await prisma.$transaction(async (tx) => {
    const bookings = await tx.booking.findMany({ where: { courtId }, select: { id: true } });
    const bookingIds = bookings.map((b) => b.id);
    await tx.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await tx.booking.deleteMany({ where: { courtId } });
    await tx.court.delete({ where: { id: courtId } });
  });
  return { success: true };
}

/**
 * 7. CUSTOMERS CRUD OPERATIONS
 */
export async function createCustomerAction(name: string, email: string, phone: string, password?: string) {
  await requireAdmin();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Email sudah terdaftar.");
  }
  const pass = password || "123456";
  const hashedPassword = await hash(pass, 12);
  const customer = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
      role: "customer",
    },
  });
  return { success: true, customer };
}

export async function updateCustomerAction(userId: string, name: string, email: string, phone: string, password?: string) {
  await requireAdmin();
  const existing = await prisma.user.findFirst({
    where: { email, id: { not: userId } },
  });
  if (existing) {
    throw new Error("Email sudah digunakan pengguna lain.");
  }
  const data: any = { name, email, phone };
  if (password && password.trim() !== "") {
    data.password = await hash(password, 12);
  }
  const customer = await prisma.user.update({
    where: { id: userId },
    data,
  });
  return { success: true, customer };
}

export async function deleteCustomerAction(userId: string) {
  await requireAdmin();
  await prisma.$transaction(async (tx) => {
    const bookings = await tx.booking.findMany({ where: { userId }, select: { id: true } });
    const bookingIds = bookings.map((b) => b.id);
    await tx.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await tx.booking.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });
  return { success: true };
}

/**
 * 8. BOOKINGS CRUD OPERATIONS FOR ADMIN
 */
export async function deleteAdminBooking(bookingId: string) {
  await requireAdmin();
  await prisma.$transaction(async (tx) => {
    // Delete payments first
    await tx.payment.deleteMany({ where: { bookingId } });
    // Delete booking
    await tx.booking.delete({ where: { id: bookingId } });
  });
  return { success: true };
}

export async function createAdminBooking(input: {
  userId: string;
  courtId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: "pending" | "paid" | "cancelled";
}) {
  await requireAdmin();
  const { userId, courtId, bookingDate, startTime, endTime, status } = input;
  const bookingDateObj = new Date(bookingDate + "T00:00:00Z");

  if (startTime >= endTime) {
    throw new Error("Jam mulai harus sebelum jam selesai.");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // LAPISAN 3: Kunci baris lapangan (Court) agar semua pengecekan serentak pada lapangan yang sama mengantre
      await tx.$queryRaw`SELECT id FROM courts WHERE id = ${courtId} FOR UPDATE`;

      // Check conflicts
      const conflicts = await tx.booking.findMany({
        where: {
          courtId,
          bookingDate: bookingDateObj,
          status: { in: ["pending", "paid"] },
        },
      });

      const utcStartObj = wibToUTC("1970-01-01", startTime);
      const utcEndObj = wibToUTC("1970-01-01", endTime);
      const inputStart = utcStartObj.getUTCHours() * 60 + utcStartObj.getUTCMinutes();
      const inputEnd = utcEndObj.getUTCHours() * 60 + utcEndObj.getUTCMinutes();

      const hasOverlap = conflicts.some((b) => {
        const bStart = b.startTime.getUTCHours() * 60 + b.startTime.getUTCMinutes();
        const bEnd = b.endTime.getUTCHours() * 60 + b.endTime.getUTCMinutes();
        return inputStart < bEnd && inputEnd > bStart;
      });

      if (hasOverlap) {
        throw new Error("sudah dipesan, silahkan pesan jam lain");
      }

      const court = await tx.court.findUniqueOrThrow({ where: { id: courtId } });
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      const durationHours = (endH * 60 + endM - (startH * 60 + startM)) / 60;
      const totalPrice = Math.round(court.pricePerHour * durationHours);

      const booking = await tx.booking.create({
        data: {
          userId,
          courtId,
          bookingDate: bookingDateObj,
          startTime: utcStartObj,
          endTime: utcEndObj,
          totalPrice,
          status,
        },
      });

      if (status === "paid") {
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            amount: totalPrice,
            paymentMethod: "manual_transfer",
            paymentStatus: "verified",
            paidAt: new Date(),
          },
        });
      }

      return booking;
    }, { isolationLevel: "Serializable" });
  } catch (err: any) {
    if (
      err?.code === "P2002" ||
      err?.code === "P2034" ||
      (typeof err?.message === "string" &&
        (err.message.includes("23505") ||
          err.message.includes("40001") ||
          err.message.includes("sudah dipesan, silahkan pesan jam lain") ||
          err.message.includes("Jadwal bentrok dengan booking aktif lainnya")))
    ) {
      throw new Error("sudah dipesan, silahkan pesan jam lain");
    }
    throw err;
  }
}

export async function updateAdminBooking(
  bookingId: string,
  input: {
    courtId: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    status: "pending" | "paid" | "cancelled";
    totalPrice: number;
  }
) {
  await requireAdmin();
  const { courtId, bookingDate, startTime, endTime, status, totalPrice } = input;
  const bookingDateObj = new Date(bookingDate + "T00:00:00Z");

  if (startTime >= endTime) {
    throw new Error("Jam mulai harus sebelum jam selesai.");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // LAPISAN 3: Kunci baris lapangan (Court) agar semua pengecekan serentak pada lapangan yang sama mengantre
      await tx.$queryRaw`SELECT id FROM courts WHERE id = ${courtId} FOR UPDATE`;

      // Check conflicts excluding this booking
      const conflicts = await tx.booking.findMany({
        where: {
          courtId,
          bookingDate: bookingDateObj,
          status: { in: ["pending", "paid"] },
          id: { not: bookingId },
        },
      });

      const utcStartObj = wibToUTC("1970-01-01", startTime);
      const utcEndObj = wibToUTC("1970-01-01", endTime);
      const inputStart = utcStartObj.getUTCHours() * 60 + utcStartObj.getUTCMinutes();
      const inputEnd = utcEndObj.getUTCHours() * 60 + utcEndObj.getUTCMinutes();

      const hasOverlap = conflicts.some((b) => {
        const bStart = b.startTime.getUTCHours() * 60 + b.startTime.getUTCMinutes();
        const bEnd = b.endTime.getUTCHours() * 60 + b.endTime.getUTCMinutes();
        return inputStart < bEnd && inputEnd > bStart;
      });

      if (hasOverlap) {
        throw new Error("sudah dipesan, silahkan pesan jam lain");
      }

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          courtId,
          bookingDate: bookingDateObj,
          startTime: utcStartObj,
          endTime: utcEndObj,
          totalPrice,
          status,
        },
      });

      if (status === "paid") {
        await tx.payment.upsert({
          where: { bookingId },
          update: {
            paymentStatus: "verified",
            amount: totalPrice,
            paidAt: new Date(),
          },
          create: {
            bookingId,
            amount: totalPrice,
            paymentMethod: "manual_transfer",
            paymentStatus: "verified",
            paidAt: new Date(),
          },
        });
      } else if (status === "cancelled") {
        await tx.payment.updateMany({
          where: { bookingId },
          data: { paymentStatus: "cancelled" },
        });
      }

      return updated;
    }, { isolationLevel: "Serializable" });
  } catch (err: any) {
    if (
      err?.code === "P2002" ||
      err?.code === "P2034" ||
      (typeof err?.message === "string" &&
        (err.message.includes("23505") ||
          err.message.includes("40001") ||
          err.message.includes("sudah dipesan, silahkan pesan jam lain") ||
          err.message.includes("Jadwal bentrok dengan booking aktif lainnya")))
    ) {
      throw new Error("sudah dipesan, silahkan pesan jam lain");
    }
    throw err;
  }
}

export async function getCourtsList() {
  await requireAdmin();
  return prisma.court.findMany({
    orderBy: { name: "asc" },
  });
}

