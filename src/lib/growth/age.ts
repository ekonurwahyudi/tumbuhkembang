/**
 * Perhitungan usia. Murni kalkulasi kalender — tanpa interpretasi medis.
 *
 * Tanggal lahir dan tanggal pengukuran disimpan sebagai DATE (tanpa waktu/zona),
 * jadi seluruh aritmetika di sini memakai komponen kalender, bukan epoch milis,
 * agar tidak terpengaruh DST maupun timezone server.
 */

export type YMD = { year: number; month: number; day: number };

export type ChronologicalAge = {
  /** Selisih hari kalender penuh. Ini satuan yang dipakai lookup reference. */
  days: number;
  /** Pecahan kalender untuk tampilan: 8 bulan 12 hari. */
  years: number;
  months: number;
  remainingDays: number;
  /** Total bulan penuh — berguna untuk sumbu grafik usia. */
  totalMonths: number;
};

const MS_PER_DAY = 86_400_000;

export function parseYMD(value: string | Date): YMD {
  if (value instanceof Date)
    return { year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() };

  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) throw new RangeError(`Tanggal tidak valid: ${value}`);
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/** UTC epoch day — bebas DST karena UTC tidak punya pergeseran offset. */
function toEpochDay({ year, month, day }: YMD): number {
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

/** Selisih hari kalender penuh antara dua tanggal (negatif bila `to` lebih awal). */
export function diffInDays(from: string | Date, to: string | Date): number {
  return toEpochDay(parseYMD(to)) - toEpochDay(parseYMD(from));
}

export function addDays(date: string | Date, days: number): YMD {
  const d = parseYMD(date);
  const shifted = new Date(Date.UTC(d.year, d.month - 1, d.day + days));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function formatYMD({ year, month, day }: YMD): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Hari ini menurut jam lokal pengguna/server, dinormalkan ke YMD. */
export function todayYMD(now = new Date()): string {
  return formatYMD(parseYMD(now));
}

/** Tambah bulan kalender dengan clamp ke akhir bulan: 31 Jan + 1 bulan = 28/29 Feb. */
export function addMonthsClamped({ year, month, day }: YMD, months: number): YMD {
  const total = year * 12 + (month - 1) + months;
  const y = Math.floor(total / 12);
  const m = total % 12;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return { year: y, month: m + 1, day: Math.min(day, lastDay) };
}

/**
 * Usia kronologis = tanggal acuan - tanggal lahir.
 *
 * Bulan dihitung secara kalender (bukan asumsi 30 hari) memakai tanggal ulang
 * bulanan: usia dalam bulan penuh adalah jumlah ulang-bulan terakhir yang sudah
 * terlewati, dan `remainingDays` adalah selisih hari sejak ulang-bulan itu.
 * Tanggal ulang bulan di-clamp ke akhir bulan, sehingga lahir 31 Jan menjadi
 * 28 Feb (bukan meluber ke 3 Mar).
 */
export function chronologicalAge(
  dateOfBirth: string | Date,
  asOf: string | Date = new Date(),
): ChronologicalAge {
  const birth = parseYMD(dateOfBirth);
  const ref = parseYMD(asOf);

  const days = toEpochDay(ref) - toEpochDay(birth);
  if (days < 0) return { days, years: 0, months: 0, remainingDays: 0, totalMonths: 0 };

  let totalMonths = (ref.year - birth.year) * 12 + (ref.month - birth.month);
  let anniversary = addMonthsClamped(birth, totalMonths);
  if (toEpochDay(anniversary) > toEpochDay(ref)) {
    totalMonths -= 1;
    anniversary = addMonthsClamped(birth, totalMonths);
  }

  return {
    days,
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    remainingDays: toEpochDay(ref) - toEpochDay(anniversary),
    totalMonths,
  };
}

/** Label usia ringkas untuk UI berbahasa Indonesia. */
export function formatAge(age: ChronologicalAge): string {
  if (age.days < 0) return "-";
  if (age.days < 14) return `${age.days} hari`;
  if (age.totalMonths < 1) return `${Math.floor(age.days / 7)} minggu`;
  if (age.years < 1) return `${age.months} bulan`;
  if (age.months === 0) return `${age.years} tahun`;
  return `${age.years} tahun ${age.months} bulan`;
}

/**
 * Label usia lengkap sampai hari — dipakai kartu profil anak: "8 Bulan 14 Hari".
 * Di atas 1 tahun hari tidak ditampilkan lagi ("3 Tahun 2 Bulan"), mengikuti
 * konvensi KIA: hari penting justru pada usia muda saat koreksi prematur relevan.
 */
export function formatAgeDetailed(age: ChronologicalAge): string {
  if (age.days < 0) return "-";
  if (age.days < 14) return `${age.days} Hari`;
  if (age.years >= 1)
    return age.months === 0
      ? `${age.years} Tahun`
      : `${age.years} Tahun ${age.months} Bulan`;
  if (age.totalMonths < 1)
    return `${Math.floor(age.days / 7)} Minggu ${age.days % 7} Hari`;
  return `${age.months} Bulan ${age.remainingDays} Hari`;
}

/** `correctedAge().days` → label "6 Bulan 20 Hari" tanpa objek ChronologicalAge. */
export function formatAgeDaysDetailed(days: number): string {
  // Usia terkoreksi tidak pernah negatif saat ditampilkan (bayi belum term = 0).
  // ponytail: anchor kalender tetap — sisa hari bisa meleset ±1 hari karena
  // panjang bulan bervariasi; presisi hari hanya relevan untuk usia <2 minggu
  // yang tidak menyentuh konversi bulan. Butuh eksak? Hitung dari EDD asli.
  const from = formatYMD({ year: 2000, month: 1, day: 1 });
  const to = formatYMD(addDays(from, Math.max(0, days)));
  return formatAgeDetailed(chronologicalAge(from, to));
}
