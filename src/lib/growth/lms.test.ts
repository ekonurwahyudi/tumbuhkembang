/**
 * Uji engine LMS terhadap nilai yang tercetak di tabel resmi WHO
 * (expanded tables, kolom SD0/SD2neg/SD2/SD3), bukan sekadar memastikan
 * fungsi berhasil dijalankan.
 *
 * Nilai expected diambil langsung dari berkas di data/who-source/.
 */
import { describe, expect, it } from "vitest";
import { percentileFromZScore, valueAtZScore, zScore, type LMS } from "./lms";

// WHO weight-for-age, laki-laki, hari ke-0
const WFA_BOY_D0: LMS = { l: 0.3487, m: 3.3464, s: 0.14602 };
// WHO weight-for-age, laki-laki, hari ke-365
const WFA_BOY_D365: LMS = { l: 0.0645, m: 9.646, s: 0.10925 };
// WHO weight-for-age, perempuan, hari ke-1856 (5 tahun)
const WFA_GIRL_D1856: LMS = { l: -0.3531, m: 18.389, s: 0.14892 };
// WHO length-for-age, laki-laki, hari ke-0 (L = 1, distribusi normal)
const LHFA_BOY_D0: LMS = { l: 1, m: 49.8842, s: 0.03795 };
// WHO head-circumference-for-age, perempuan, hari ke-365
const HCFA_GIRL_D365: LMS = { l: 1, m: 44.894, s: 0.03027 };

describe("valueAtZScore terhadap tabel WHO", () => {
  it("weight-for-age laki-laki hari 0", () => {
    expect(valueAtZScore(0, WFA_BOY_D0)).toBeCloseTo(3.346, 3);
    expect(valueAtZScore(-2, WFA_BOY_D0)).toBeCloseTo(2.459, 3);
    expect(valueAtZScore(2, WFA_BOY_D0)).toBeCloseTo(4.419, 3);
    expect(valueAtZScore(3, WFA_BOY_D0)).toBeCloseTo(5.031, 3);
  });

  it("weight-for-age laki-laki hari 365", () => {
    expect(valueAtZScore(0, WFA_BOY_D365)).toBeCloseTo(9.646, 3);
    expect(valueAtZScore(-2, WFA_BOY_D365)).toBeCloseTo(7.741, 3);
    expect(valueAtZScore(2, WFA_BOY_D365)).toBeCloseTo(11.983, 3);
    expect(valueAtZScore(3, WFA_BOY_D365)).toBeCloseTo(13.341, 3);
  });

  it("weight-for-age perempuan hari 1856", () => {
    expect(valueAtZScore(0, WFA_GIRL_D1856)).toBeCloseTo(18.389, 3);
    expect(valueAtZScore(-2, WFA_GIRL_D1856)).toBeCloseTo(13.854, 3);
    expect(valueAtZScore(3, WFA_GIRL_D1856)).toBeCloseTo(29.903, 3);
  });

  it("length-for-age laki-laki hari 0 (L = 1)", () => {
    expect(valueAtZScore(0, LHFA_BOY_D0)).toBeCloseTo(49.884, 3);
    expect(valueAtZScore(-2, LHFA_BOY_D0)).toBeCloseTo(46.098, 3);
    expect(valueAtZScore(2, LHFA_BOY_D0)).toBeCloseTo(53.67, 3);
    expect(valueAtZScore(3, LHFA_BOY_D0)).toBeCloseTo(55.564, 3);
  });

  it("head-circumference-for-age perempuan hari 365", () => {
    expect(valueAtZScore(0, HCFA_GIRL_D365)).toBeCloseTo(44.894, 3);
    expect(valueAtZScore(-2, HCFA_GIRL_D365)).toBeCloseTo(42.176, 3);
    expect(valueAtZScore(2, HCFA_GIRL_D365)).toBeCloseTo(47.612, 3);
  });
});

describe("zScore terhadap tabel WHO", () => {
  it("nilai pada garis SD menghasilkan z-score yang sesuai", () => {
    expect(zScore(3.346, WFA_BOY_D0)).toBeCloseTo(0, 2);
    expect(zScore(2.459, WFA_BOY_D0)).toBeCloseTo(-2, 2);
    expect(zScore(4.419, WFA_BOY_D0)).toBeCloseTo(2, 2);
    expect(zScore(5.031, WFA_BOY_D0)).toBeCloseTo(3, 2);

    expect(zScore(9.646, WFA_BOY_D365)).toBeCloseTo(0, 2);
    expect(zScore(7.741, WFA_BOY_D365)).toBeCloseTo(-2, 2);
    expect(zScore(13.341, WFA_BOY_D365)).toBeCloseTo(3, 2);

    expect(zScore(49.884, LHFA_BOY_D0)).toBeCloseTo(0, 2);
    expect(zScore(46.098, LHFA_BOY_D0)).toBeCloseTo(-2, 2);
  });

  it("bolak-balik dengan valueAtZScore konsisten", () => {
    for (const lms of [WFA_BOY_D0, WFA_BOY_D365, WFA_GIRL_D1856, LHFA_BOY_D0]) {
      for (const z of [-2.5, -1, 0, 1, 2.5]) {
        expect(zScore(valueAtZScore(z, lms), lms)).toBeCloseTo(z, 6);
      }
    }
  });

  it("menolak nilai nol atau negatif", () => {
    expect(() => zScore(0, WFA_BOY_D0)).toThrow();
    expect(() => zScore(-1, WFA_BOY_D0)).toThrow();
  });
});

describe("koreksi ekor WHO di luar ±3 SD", () => {
  /**
   * WHO membatasi distribusi Box-Cox normal pada -3..+3 SD. Di luar itu
   * standar deviasi dipatok pada jarak 2 SD ke 3 SD, sehingga z-score
   * bertambah LINEAR terhadap nilai pengukuran.
   */
  it("di atas +3 SD bertambah linear, bukan mengikuti Box-Cox", () => {
    const sd3 = valueAtZScore(3, WFA_BOY_D365);
    const sd23 = sd3 - valueAtZScore(2, WFA_BOY_D365);

    expect(zScore(sd3, WFA_BOY_D365)).toBeCloseTo(3, 6);
    expect(zScore(sd3 + sd23, WFA_BOY_D365)).toBeCloseTo(4, 6);
    expect(zScore(sd3 + 2 * sd23, WFA_BOY_D365)).toBeCloseTo(5, 6);
  });

  it("di bawah -3 SD bertambah linear", () => {
    const sd3neg = valueAtZScore(-3, WFA_BOY_D365);
    const sd23neg = valueAtZScore(-2, WFA_BOY_D365) - sd3neg;

    expect(zScore(sd3neg, WFA_BOY_D365)).toBeCloseTo(-3, 6);
    expect(zScore(sd3neg - sd23neg, WFA_BOY_D365)).toBeCloseTo(-4, 6);
  });

  it("berbeda dari LMS mentah di ekor — koreksi benar-benar berlaku", () => {
    const sd3 = valueAtZScore(3, WFA_BOY_D365);
    const sd23 = sd3 - valueAtZScore(2, WFA_BOY_D365);
    const nilai = sd3 + 2 * sd23;

    const { l, m, s } = WFA_BOY_D365;
    const mentah = (Math.pow(nilai / m, l) - 1) / (l * s);

    expect(zScore(nilai, WFA_BOY_D365)).toBeCloseTo(5, 6);
    // Tanpa koreksi hasilnya berbeda nyata; inilah penyebab verifikasi
    // silang gagal pada kolom SD4 saat dataset dibangun.
    expect(Math.abs(mentah - 5)).toBeGreaterThan(0.05);
  });

  it("tidak mengubah apa pun di dalam ±3 SD", () => {
    const { l, m, s } = WFA_BOY_D365;
    for (const z of [-2.9, -1, 0, 1, 2.9]) {
      const x = valueAtZScore(z, WFA_BOY_D365);
      const mentah = (Math.pow(x / m, l) - 1) / (l * s);
      expect(zScore(x, WFA_BOY_D365)).toBeCloseTo(mentah, 10);
    }
  });
});

describe("percentileFromZScore", () => {
  it("cocok dengan nilai distribusi normal standar yang diketahui", () => {
    expect(percentileFromZScore(0)).toBeCloseTo(50, 4);
    expect(percentileFromZScore(1)).toBeCloseTo(84.134, 2);
    expect(percentileFromZScore(-1)).toBeCloseTo(15.866, 2);
    expect(percentileFromZScore(1.96)).toBeCloseTo(97.5, 2);
    expect(percentileFromZScore(-1.96)).toBeCloseTo(2.5, 2);
    expect(percentileFromZScore(2)).toBeCloseTo(97.725, 2);
    expect(percentileFromZScore(-3)).toBeCloseTo(0.135, 2);
    expect(percentileFromZScore(3)).toBeCloseTo(99.865, 2);
  });

  it("monoton naik", () => {
    let prev = -1;
    for (let z = -4; z <= 4; z += 0.25) {
      const p = percentileFromZScore(z);
      expect(p).toBeGreaterThan(prev);
      prev = p;
    }
  });
});
