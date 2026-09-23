/**
 * Perhitungan z-score dari parameter LMS, mengikuti metode resmi WHO.
 *
 * Sumber rumus: WHO, "Computation of centiles and z-scores for height-for-age,
 * weight-for-age and BMI-for-age" —
 * https://cdn.who.int/media/docs/default-source/child-growth/growth-reference-5-19-years/computation.pdf
 * Dokumen tersebut menyatakan metodenya mengikuti WHO Child Growth Standards
 * (0-5 tahun), yaitu dataset yang dipakai aplikasi ini.
 *
 * Tidak ada konstanta medis yang dikarang di berkas ini — hanya rumus dari dokumen
 * di atas. Nilai L, M, S berasal dari tabel resmi WHO (lihat scripts/build-who-dataset.py).
 */

export type LMS = { l: number; m: number; s: number };

/**
 * Nilai pengukuran pada z-score tertentu:
 *
 *   X(z) = M × (1 + L×S×z)^(1/L)     bila L ≠ 0
 *   X(z) = M × exp(S×z)              bila L = 0
 *
 * Dipakai untuk menggambar kurva reference (-3 SD … +3 SD) pada grafik.
 */
export function valueAtZScore(z: number, { l, m, s }: LMS): number {
  if (l === 0) return m * Math.exp(s * z);
  return m * Math.pow(1 + l * s * z, 1 / l);
}

/** z-score LMS tanpa koreksi ekor. */
function rawZScore(x: number, { l, m, s }: LMS): number {
  if (l === 0) return Math.log(x / m) / s;
  return (Math.pow(x / m, l) - 1) / (l * s);
}

/**
 * z-score WHO, termasuk koreksi ekor di luar ±3 SD.
 *
 * WHO membatasi distribusi Box-Cox normal pada rentang di mana data empiris
 * tersedia (-3 SD sampai +3 SD). Di luar itu, standar deviasi dipatok pada
 * jarak antara 2 SD dan 3 SD, sehingga:
 *
 *   z > 3  → z* = 3 + (y − SD3pos) / SD23pos
 *   z < −3 → z* = −3 + (y − SD3neg) / SD23neg
 *
 * Tanpa koreksi ini, nilai ekstrem menghasilkan z-score yang meleset dari tabel
 * resmi WHO (terbukti pada verifikasi silang di scripts/build-who-dataset.py).
 */
export function zScore(x: number, lms: LMS): number {
  if (!(x > 0)) throw new RangeError("Nilai pengukuran harus lebih dari 0");

  const z = rawZScore(x, lms);
  if (z > 3) {
    const sd3pos = valueAtZScore(3, lms);
    const sd23pos = sd3pos - valueAtZScore(2, lms);
    return 3 + (x - sd3pos) / sd23pos;
  }
  if (z < -3) {
    const sd3neg = valueAtZScore(-3, lms);
    const sd23neg = valueAtZScore(-2, lms) - sd3neg;
    return -3 + (x - sd3neg) / sd23neg;
  }
  return z;
}

/**
 * Fungsi distribusi kumulatif normal standar, dipakai mengubah z-score jadi persentil.
 *
 * Memakai fungsi error Abramowitz & Stegun 7.1.26 (galat maksimum 1.5e-7),
 * jauh lebih teliti daripada kebutuhan tampilan persentil.
 */
function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const a = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * a);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-a * a);
  return 0.5 * (1 + sign * y);
}

/** Persentil (0-100) dari z-score. */
export function percentileFromZScore(z: number): number {
  return normalCdf(z) * 100;
}
