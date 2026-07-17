import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const WIB = "Asia/Jakarta";

/**
 * Konversi input jam WIB (dari form/slot) ke UTC untuk disimpan ke DB
 */
export function wibToUTC(dateString: string, timeString: string) {
  return dayjs.tz(`${dateString} ${timeString}`, WIB).utc().toDate();
}

/**
 * Konversi DateTime dari DB (UTC) ke WIB
 */
export function utcToWIB(date: Date | string) {
  return dayjs(date).tz(WIB);
}

/**
 * Format untuk jam saja, contoh: "08:00"
 */
export function formatJamWIB(date: Date | string) {
  return dayjs(date).tz(WIB).format("HH:mm");
}

/**
 * Format tanggal dalam format YYYY-MM-DD di timezone WIB
 */
export function formatTanggalWIB(date: Date | string) {
  return dayjs(date).tz(WIB).format("YYYY-MM-DD");
}
