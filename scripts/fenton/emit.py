"""Tabel LMS mingguan hasil digitasi -> berkas dataset yang dipakai aplikasi.

Bentuk keluarannya sengaja sama persis dengan berkas WHO di
src/lib/growth/data/ (`ReferenceDataset` pada src/lib/growth/types.ts), supaya
`fenton.ts` bisa menyalin `who.ts` tanpa tipe atau pencarian baru: satu baris
per hari, diindeks langsung lewat `points[day - minDay]`.

Sumbunya PMA dalam hari, bukan usia kronologis — Fenton memang digambar
terhadap usia pascamenstruasi, dan `postMenstrualAgeDays()` sudah ada di
src/lib/growth/corrected-age.ts.

Nilai harian diinterpolasi linear di antara minggu bulat. L, M, dan S memang
berubah mulus terhadap usia, dan jarak antar titiknya cuma tujuh hari; kesalahan
interpolasi jauh di bawah galat digitasi ~0,02 unit. Minggu yang dibuang
digitizer (mis. 44 pada perempuan) ikut terisi dari tetangganya oleh
interpolasi yang sama.
"""
import json
import sys
from pathlib import Path

INDICATORS = {
    "weight": "weight-for-age",
    "length": "length-for-age",
    "head": "head-circumference-for-age",
}

REFERENCE = {
    "name": "Fenton Preterm Growth Chart",
    "version": "2013",
    "source": "https://ucalgary.ca/fenton",
    "population": (
        "Meta-analisis Fenton 2013 (n~4 juta), didigitasi dari grafik Buku KIA "
        "Kementerian Kesehatan RI"
    ),
}


def interpolate(rows):
    """Baris mingguan -> satu baris per hari PMA, linear di antara minggu."""
    rows = sorted(rows, key=lambda r: r["week"])
    lo, hi = rows[0]["week"] * 7, rows[-1]["week"] * 7
    out = []
    for day in range(lo, hi + 1):
        w = day / 7
        j = next(i for i, r in enumerate(rows) if r["week"] >= w)
        if rows[j]["week"] == w:
            a = b = rows[j]
            t = 0.0
        else:
            a, b = rows[j - 1], rows[j]
            t = (w - a["week"]) / (b["week"] - a["week"])
        out.append({
            "day": day,
            "l": round(a["l"] + (b["l"] - a["l"]) * t, 4),
            "m": round(a["m"] + (b["m"] - a["m"]) * t, 4),
            "s": round(a["s"] + (b["s"] - a["s"]) * t, 5),
        })
    return out


def main():
    raw = json.loads(Path(sys.argv[1]).read_text())
    outdir = Path(sys.argv[2])
    for sex, groups in raw.items():
        for short, indicator in INDICATORS.items():
            points = interpolate(groups[short])
            ds = {
                "reference": REFERENCE,
                "indicator": indicator,
                "sex": sex,
                "ageUnit": "day",
                "minDay": points[0]["day"],
                "maxDay": points[-1]["day"],
                "sourceFile": "buku-kia-fenton-2013.pdf",
                "points": points,
            }
            path = outdir / f"fenton-{indicator}-{sex.lower()}.json"
            path.write_text(json.dumps(ds, indent=1) + "\n")
            print(f"{path.name}: PMA {ds['minDay'] / 7:.0f}..{ds['maxDay'] / 7:.0f} minggu")


if __name__ == "__main__":
    main()
