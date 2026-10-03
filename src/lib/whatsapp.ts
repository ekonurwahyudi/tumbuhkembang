/**
 * Nomor dukungan dalam bentuk internasional tanpa tanda apa pun — itu satu-satunya
 * bentuk yang diterima wa.me. Yang tertulis di kartu nama: 0812-1555-423.
 */
export const SUPPORT_WA = "628121555423";

/** Sapaan menurut jam. Dipisah dari jam sekarang supaya batasnya bisa diuji. */
export function greeting(hour: number): string {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

/**
 * Sapaan untuk sekarang, menurut WIB — bukan jam server dan bukan jam browser.
 *
 * Jam server mengikuti zona VPS, yang bisa UTC; jam browser akan berbeda antara
 * render server dan hidrasi, dan React menandainya sebagai ketidakcocokan. Dipatok
 * ke zona penggunanya, keduanya tidak terjadi.
 *
 * ponytail: pindah ke zona per-pengguna bila aplikasinya nanti dipakai lintas zona;
 * hari ini seluruh penggunanya di Indonesia dan WIB sudah benar untuk sebagian besar.
 */
export function greetingNow(now = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      hour12: false,
    }).format(now),
  );
  return greeting(hour);
}

/**
 * Tautan WhatsApp berisi pesan yang sudah diketik sebagian. Orangnya tinggal
 * melanjutkan kalimatnya — itu sebabnya `body` berakhir menggantung, bukan dengan
 * titik: kotak kirim WhatsApp terbuka dengan kursor tepat di situ.
 */
export function waLink(body: string, hello = "Halo"): string {
  return `https://wa.me/${SUPPORT_WA}?text=${encodeURIComponent(`${hello}, ${body}`)}`;
}
