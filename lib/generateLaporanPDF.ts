import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  // Convert current server time/browser time to WIB (UTC+7)
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const wibTime = new Date(utc + (3600000 * 7));
  const day = wibTime.getDate();
  const month = BULAN[wibTime.getMonth()];
  const year = wibTime.getFullYear();
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
  const averageRevenue = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;
  
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

  // 1. KOP/HEADER LAPORAN
  // Logo text bold besar
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(24, 25, 37); // navy / app primary color
  doc.text("SM SPORT CENTER", 14, 20);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 110);
  doc.text("Ruko SM Sport Center, Kota Depok, Jawa Barat", 14, 24);
  
  // Date printed on top right
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`Dicetak: ${formatToWIB(new Date())}`, 196, 20, { align: "right" });

  // Main Report Title
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(24, 25, 37);
  doc.text("LAPORAN TRANSAKSI RESERVASI LAPANGAN", 105, 33, { align: "center" });
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`Periode: ${formattedPeriode}`, 105, 38, { align: "center" });

  // Horizontal separating line
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 44, 196, 44);

  // 2. RINGKASAN EKSEKUTIF (SUMMARY BOX)
  doc.setFillColor(245, 246, 250);
  doc.roundedRect(14, 50, 182, 28, 4, 4, "F");
  doc.setDrawColor(220, 224, 230);
  doc.roundedRect(14, 50, 182, 28, 4, 4, "S");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(24, 25, 37);
  doc.text("RINGKASAN EKSEKUTIF LAPORAN", 18, 56);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("Total Reservasi:", 18, 62);
  doc.text("Total Pendapatan (Lunas):", 18, 67);
  doc.text("Rata-Rata per Transaksi:", 18, 72);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(24, 25, 37);
  doc.text(`${totalCount} Sesi`, 60, 62);
  doc.setTextColor(16, 124, 65); // Green for income
  doc.text(`Rp ${totalRevenue.toLocaleString("id-ID")}`, 60, 67);
  doc.setTextColor(24, 25, 37);
  doc.text(`Rp ${averageRevenue.toLocaleString("id-ID")}`, 60, 72);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Breakdown Futsal:", 115, 62);
  doc.text("Breakdown Badminton:", 115, 67);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(24, 25, 37);
  doc.text(`${futsalCount} Sesi (${futsalPercentage}%)`, 150, 62);
  doc.text(`${badmintonCount} Sesi (${badmintonPercentage}%)`, 150, 67);

  // 3. TABEL DETAIL TRANSAKSI
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
    startY: 84,
    head: [["No", "ID", "Pelanggan", "Kontak", "Kategori & Lapangan", "Waktu Reservasi", "Biaya", "Status"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [24, 25, 37],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
      valign: "middle",
    },
    columnStyles: {
      0: { halign: "center", fontStyle: "bold", cellWidth: 8 },
      1: { halign: "center", fontStyle: "normal", fontSize: 7, cellWidth: 16 },
      3: { fontStyle: "normal", fontSize: 7, cellWidth: 20 },
      6: { halign: "right", fontStyle: "bold", cellWidth: 24 },
      7: { halign: "center", fontStyle: "bold", cellWidth: 20 },
    },
    didParseCell: (data) => {
      // Color code the status cell text color
      if (data.column.index === 7 && data.cell.section === "body") {
        const status = data.cell.text[0];
        if (status === "PAID") {
          data.cell.styles.textColor = [16, 124, 65]; // Green
        } else if (status === "PENDING") {
          data.cell.styles.textColor = [180, 110, 0]; // Orange
        } else {
          data.cell.styles.textColor = [200, 30, 30]; // Red
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
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("Mengetahui,", 14, signY);
  doc.text(`Depok, ${formatToWIB(new Date())}`, 196, signY, { align: "right" });

  doc.text("Direktur SM Sport Center", 14, signY + 5);
  doc.text(`Staff Administrator (${adminName}),`, 196, signY + 5, { align: "right" });

  // Sign area dashed spacing
  doc.text("( ________________________ )", 14, signY + 30);
  doc.text("( ________________________ )", 196, signY + 30, { align: "right" });

  // Add footer to all pages
  const pageCount = doc.getNumberOfPages();
  const timestamp = new Date().toLocaleString("id-ID");
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);
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
