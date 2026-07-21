import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { utcToWIB } from "./timezone";

interface ReportItem {
  id: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  courtName: string;
  courtType: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
}

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function formatToWIB(date: Date) {
  const wibTime = utcToWIB(date);
  const day = wibTime.date();
  const month = BULAN[wibTime.month()];
  const year = wibTime.year();
  return `${day} ${month} ${year}`;
}

export function generateLaporanPDF(
  items: ReportItem[], 
  dateFrom?: string, 
  dateTo?: string, 
  adminName: string = "Administrator"
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Calculate summary metrics
  const totalCount = items.length;
  const totalRevenue = items.reduce((sum, item) => item.status === "paid" ? sum + item.totalPrice : sum, 0);
  const uniqueUsersCount = new Set(items.map((item) => item.userPhone || item.userEmail || item.userName)).size;
  
  const futsalCount = items.filter(i => i.courtType.toLowerCase() === "futsal").length;
  const badmintonCount = items.filter(i => i.courtType.toLowerCase() === "badminton").length;
  
  const futsalPercentage = totalCount > 0 ? Math.round((futsalCount / totalCount) * 100) : 0;
  const badmintonPercentage = totalCount > 0 ? Math.round((badmintonCount / totalCount) * 100) : 0;

  // Format date ranges for subtitle
  let formattedPeriode = "Semua Waktu";
  if (dateFrom && dateTo) {
    formattedPeriode = `${dateFrom} s/d ${dateTo}`;
  } else if (dateFrom) {
    formattedPeriode = `Mulai ${dateFrom}`;
  } else if (dateTo) {
    formattedPeriode = `Hingga ${dateTo}`;
  }

  // Design System Tokens matching web UI
  const COLOR_CARBON: [number, number, number] = [24, 25, 37];     // #181925
  const COLOR_LAVENDER: [number, number, number] = [75, 46, 131];  // #4B2E83
  const COLOR_MINT: [number, number, number] = [0, 168, 107];      // #00A86B
  const COLOR_ASH: [number, number, number] = [130, 140, 155];     // #828C9B
  const COLOR_GRAPHITE: [number, number, number] = [100, 116, 139];// #64748B
  const COLOR_LINEN: [number, number, number] = [248, 250, 252];   // #F8FAFC
  const COLOR_FOG: [number, number, number] = [226, 232, 240];     // #E2E8F0
  const COLOR_WHITE: [number, number, number] = [255, 255, 255];   // #FFFFFF

  // 1. KOP / HEADER LAPORAN (Modern Minimalist Web Header)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...COLOR_CARBON);
  doc.text("SM SPORT CENTER", 14, 20);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_GRAPHITE);
  doc.text("Ruko SM Sport Center, Kota Depok, Jawa Barat • Sistem Manajemen Reservasi", 14, 24.5);
  
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_ASH);
  doc.text(`Dicetak: ${formatToWIB(new Date())} WIB`, 196, 20, { align: "right" });

  // Main Report Title
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_CARBON);
  doc.text("LAPORAN TRANSAKSI & ANALISIS PENDAPATAN", 14, 34);
  
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_LAVENDER);
  doc.text(`Periode Filter: ${formattedPeriode}`, 14, 39);

  // Horizontal separating line (Fog border)
  doc.setLineWidth(0.3);
  doc.setDrawColor(...COLOR_FOG);
  doc.line(14, 43, 196, 43);

  // 2. SUMMARY BANNER (3 Side-by-Side Modern Web Cards matching app/admin/laporan)
  const cardW = 58;
  const cardH = 26;
  const cardY = 48;

  // Card 1: Total Reservasi
  doc.setFillColor(...COLOR_WHITE);
  doc.setDrawColor(...COLOR_FOG);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, cardY, cardW, cardH, 4, 4, "FD");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_ASH);
  doc.text("TOTAL RESERVASI TERFILTER", 18, cardY + 6);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_CARBON);
  doc.text(`${totalCount} sesi`, 18, cardY + 14);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_GRAPHITE);
  doc.text(`Futsal ${futsalCount} (${futsalPercentage}%) • Badminton ${badmintonCount} (${badmintonPercentage}%)`, 18, cardY + 20.5);

  // Card 2: Total Pendapatan (Lunas)
  doc.setFillColor(...COLOR_WHITE);
  doc.setDrawColor(...COLOR_FOG);
  doc.setLineWidth(0.3);
  doc.roundedRect(14 + cardW + 3, cardY, cardW, cardH, 4, 4, "FD");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_ASH);
  doc.text("TOTAL PENDAPATAN (LUNAS)", 14 + cardW + 7, cardY + 6);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_MINT);
  doc.text(`Rp ${totalRevenue.toLocaleString("id-ID")}`, 14 + cardW + 7, cardY + 14);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_GRAPHITE);
  doc.text(`${items.filter(i => i.status === "paid").length} transaksi terverifikasi lunas`, 14 + cardW + 7, cardY + 20.5);

  // Card 3: Total Pengguna Booking
  doc.setFillColor(...COLOR_WHITE);
  doc.setDrawColor(...COLOR_FOG);
  doc.setLineWidth(0.3);
  doc.roundedRect(14 + (cardW + 3) * 2, cardY, cardW, cardH, 4, 4, "FD");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_ASH);
  doc.text("TOTAL PENGGUNA BOOKING", 14 + (cardW + 3) * 2 + 4, cardY + 6);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_LAVENDER);
  doc.text(`${uniqueUsersCount} orang`, 14 + (cardW + 3) * 2 + 4, cardY + 14);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_GRAPHITE);
  doc.text("Jumlah pelanggan yang memesan", 14 + (cardW + 3) * 2 + 4, cardY + 20.5);

  // 3. TABEL DETAIL TRANSAKSI (Sleek Modern Web Table)
  const tableRows = items.map((item, idx) => [
    (idx + 1).toString(),
    item.id.slice(0, 8).toUpperCase(),
    item.userName,
    item.userPhone,
    `[${item.courtType.toUpperCase()}] ${item.courtName}`,
    `${item.bookingDate}\n${item.startTime} - ${item.endTime} WIB`,
    `Rp ${item.totalPrice.toLocaleString("id-ID")}`,
    item.status.toUpperCase()
  ]);

  autoTable(doc, {
    startY: 80,
    head: [["No.", "ID", "Pelanggan", "Kontak", "Kategori & Lapangan", "Waktu Reservasi", "Biaya (IDR)", "Status"]],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: COLOR_LINEN,
      textColor: COLOR_GRAPHITE,
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
      lineWidth: 0.2,
      lineColor: COLOR_FOG,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: COLOR_CARBON,
      valign: "middle",
      lineWidth: 0.2,
      lineColor: COLOR_FOG,
    },
    alternateRowStyles: {
      fillColor: COLOR_LINEN,
    },
    columnStyles: {
      0: { halign: "center", fontStyle: "bold", cellWidth: 8 },
      1: { halign: "center", fontStyle: "normal", fontSize: 6.5, cellWidth: 16 },
      3: { fontStyle: "normal", fontSize: 7, cellWidth: 20 },
      6: { halign: "right", fontStyle: "bold", cellWidth: 24 },
      7: { halign: "center", fontStyle: "bold", cellWidth: 20 },
    },
    didParseCell: (data) => {
      // Color code the status pill text matching web colors
      if (data.column.index === 7 && data.cell.section === "body") {
        const status = data.cell.text[0];
        if (status === "PAID") {
          data.cell.styles.textColor = COLOR_MINT;
          data.cell.styles.fontStyle = "bold";
        } else if (status === "PENDING") {
          data.cell.styles.textColor = [180, 110, 0];
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [200, 30, 30];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    margin: { top: 15, right: 14, bottom: 20, left: 14 }
  });

  // 4. SIGNATURE AREA AND TANDA TANGAN AT THE END
  const finalY = (doc as any).lastAutoTable.finalY || 84;
  let signY = finalY + 15;
  if (signY > 230) {
    doc.addPage();
    signY = 25;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_CARBON);
  doc.text("Mengetahui,", 14, signY);
  doc.text(`Depok, ${formatToWIB(new Date())}`, 196, signY, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.text("Direktur SM Sport Center", 14, signY + 5);
  doc.text(`Staff Administrator (${adminName}),`, 196, signY + 5, { align: "right" });

  // Sign area dashed spacing
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_GRAPHITE);
  doc.text("( ________________________ )", 14, signY + 28);
  doc.text("( ________________________ )", 196, signY + 28, { align: "right" });

  // Add footer to all pages
  const pageCount = doc.getNumberOfPages();
  const timestamp = new Date().toLocaleString("id-ID");
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLOR_ASH);
    doc.text(
      `Dicetak otomatis oleh sistem SM Sport Center pada ${timestamp} WIB`,
      14,
      290
    );
    doc.text(`Halaman ${i} dari ${pageCount}`, 196, 290, { align: "right" });
  }

  // Save the PDF
  doc.save(`Laporan_Reservasi_SMSports_${dateFrom || "Semua"}_to_${dateTo || "Semua"}.pdf`);
}
