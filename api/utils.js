export function determineShift(date) {
  const h = date.getUTCHours() + 7; // asumsi WIB, sesuaikan kalau beda
  const hour = (h + 24) % 24;

  if (hour >= 5 && hour < 13) return "pagi";
  if (hour >= 13 && hour < 21) return "siang";
  return "malam";
}
