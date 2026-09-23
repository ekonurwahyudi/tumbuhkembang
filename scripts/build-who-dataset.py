#!/usr/bin/env python3
"""
Ubah tabel WHO Child Growth Standards (.xlsx) menjadi JSON yang dipakai aplikasi.

Sumber  : https://www.who.int/tools/child-growth-standards/standards
Input   : data/who-source/*-zscore-expanded-tables.xlsx (expanded tables, per hari)
Output  : src/lib/growth/data/who-<indicator>-<sex>.json

Script ini hanya menyalin nilai L, M, S apa adanya dari tabel resmi WHO —
tidak ada pembulatan, interpolasi, maupun penyesuaian nilai. Kolom SD milik
WHO dipakai sebagai pemeriksaan silang: z-score yang dihitung dari L/M/S
harus menghasilkan kembali nilai SD tersebut.

Memakai stdlib saja (xlsx adalah zip berisi XML), tanpa dependency tambahan.

Jalankan: python3 scripts/build-who-dataset.py
"""

import json
import math
import pathlib
import sys
import xml.etree.ElementTree as ET
import zipfile

M = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "who-source"
OUT = ROOT / "src" / "lib" / "growth" / "data"

# (nama file WHO, indikator aplikasi, sex)
FILES = [
    ("wfa-boys-zscore-expanded-tables.xlsx", "weight-for-age", "MALE"),
    ("wfa-girls-zscore-expanded-tables.xlsx", "weight-for-age", "FEMALE"),
    ("lhfa-boys-zscore-expanded-tables.xlsx", "length-for-age", "MALE"),
    ("lhfa-girls-zscore-expanded-tables.xlsx", "length-for-age", "FEMALE"),
    ("hcfa-boys-zscore-expanded-tables.xlsx", "head-circumference-for-age", "MALE"),
    ("hcfa-girls-zscore-expanded-tables.xlsx", "head-circumference-for-age", "FEMALE"),
]

REFERENCE = {
    "name": "WHO Child Growth Standards",
    "version": "2006",
    "source": "https://www.who.int/tools/child-growth-standards/standards",
    "population": "WHO Multicentre Growth Reference Study (MGRS), 0-5 tahun",
}


def read_sheet(path):
    """Baca sheet pertama xlsx jadi list of list string."""
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        root = ET.fromstring(z.read("xl/sharedStrings.xml"))
        shared = ["".join(t.text or "" for t in si.iter(M + "t")) for si in root]

    root = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    rows = []
    for row in root.iter(M + "row"):
        cells = []
        for c in row.iter(M + "c"):
            v = c.find(M + "v")
            val = v.text if v is not None else ""
            if c.get("t") == "s":
                val = shared[int(val)]
            cells.append(val)
        rows.append(cells)
    return rows


def value_at_z(z, l, m, s):
    """X(z) = M(1 + LSz)^(1/L), atau M*exp(Sz) bila L = 0."""
    if l == 0:
        return m * math.exp(s * z)
    return m * (1 + l * s * z) ** (1 / l)


def zscore(x, l, m, s):
    """
    z-score WHO termasuk koreksi ekor di luar +-3 SD.
    Sama persis dengan implementasi di src/lib/growth/lms.ts.
    """
    z = math.log(x / m) / s if l == 0 else ((x / m) ** l - 1) / (l * s)
    if z > 3:
        sd3 = value_at_z(3, l, m, s)
        return 3 + (x - sd3) / (sd3 - value_at_z(2, l, m, s))
    if z < -3:
        sd3 = value_at_z(-3, l, m, s)
        return -3 + (x - sd3) / (value_at_z(-2, l, m, s) - sd3)
    return z


def build(filename, indicator, sex):
    rows = read_sheet(SRC / filename)
    header = rows[0]
    if header[:4] != ["Day", "L", "M", "S"]:
        sys.exit(f"{filename}: header tak terduga {header[:4]}")

    # Kolom SD WHO untuk pemeriksaan silang.
    sd_cols = {name: header.index(name) for name in header if name.startswith("SD")}

    points = []
    max_err = 0.0
    for r in rows[1:]:
        day = int(r[0])
        l, m, s = float(r[1]), float(r[2]), float(r[3])

        # Verifikasi: hitung ulang z-score dari L/M/S untuk tiap nilai SD WHO.
        for name, idx in sd_cols.items():
            if idx >= len(r) or not r[idx]:
                continue
            expected = float(name[2:].replace("neg", "")) * (-1 if "neg" in name else 1)
            got = zscore(float(r[idx]), l, m, s)
            max_err = max(max_err, abs(got - expected))

        points.append({"day": day, "l": l, "m": m, "s": s})

    # Toleransi 0.005 hanya menyerap pembulatan tabel WHO (3 desimal),
    # bukan perbedaan rumus. Selisih nyata akan jauh melampaui ini.
    if max_err > 0.005:
        sys.exit(f"{filename}: z-score hasil hitung meleset {max_err:.4f} dari nilai SD WHO")

    days = [p["day"] for p in points]
    if days != list(range(days[0], days[-1] + 1)):
        sys.exit(f"{filename}: baris hari tidak berurutan/ada yang hilang")

    out = {
        "reference": REFERENCE,
        "indicator": indicator,
        "sex": sex,
        "ageUnit": "day",
        "minDay": days[0],
        "maxDay": days[-1],
        "sourceFile": filename,
        "points": points,
    }
    dest = OUT / f"who-{indicator}-{sex.lower()}.json"
    dest.write_text(json.dumps(out, separators=(",", ":")) + "\n")
    print(f"{dest.name:44} {len(points):5} titik  hari {days[0]}-{days[-1]}  selisih SD maks {max_err:.2e}")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for args in FILES:
        build(*args)
    print("\nSelesai. Seluruh nilai LMS disalin apa adanya dari tabel WHO.")


if __name__ == "__main__":
    main()
