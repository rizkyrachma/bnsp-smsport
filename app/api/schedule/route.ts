import { NextRequest, NextResponse } from "next/server";
import { getScheduleByDate } from "@/lib/schedule";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Format tanggal tidak valid (harus YYYY-MM-DD)." },
      { status: 400 }
    );
  }

  try {
    const schedule = await getScheduleByDate(date);
    return NextResponse.json({ schedule });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal mengambil jadwal lapangan." },
      { status: 500 }
    );
  }
}
