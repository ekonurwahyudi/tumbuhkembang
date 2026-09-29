"""
Digitasi kurva Fenton 2013 dari Buku KIA (PDF gambar) menjadi tabel LMS.

Sekali jalan, bukan bagian dari aplikasi: hasilnya berkas JSON yang di-commit.
Dijalankan ulang hanya bila PDF sumbernya diganti.

Kalibrasi dibaca dari grid gambar itu sendiri, bukan diketik tangan:
- Sumbu X: garis mayor tiap minggu PMA, 22..50.
- Sumbu Y: 18 kotak mayor seragam, tapi label kirinya patah di tengah —
  0..4 kg pada sembilan kotak bawah (0,5 kg per kotak), lalu 15..60 cm pada
  sepuluh kotak atas (5 cm per kotak). Jadi berat dan ukuran panjang menempati
  wilayah gambar yang berbeda, bukan dua bacaan atas kotak yang sama.

Tiap kolom memuat 15 pita = 3 indikator x 5 persentil (3/10/50/90/97).

Kuncinya: **kurva di gambar ini tidak perlu ditelusuri sama sekali.** Persentil
satu indikator tak mungkin berpotongan (P3 < P10 < P50 < P90 < P97 menurut
definisi), dan ketiga rumpun indikator tidak pernah bertukar tempat pada sumbu
Y — panjang selalu di atas lingkar kepala, lingkar kepala selalu di atas berat,
di seluruh rentang 22-50 minggu. Jadi begitu sebuah kolom memuat tepat 15 pita,
mengurutkannya menurut Y sudah menentukan identitas tiap pita. Tidak ada
masalah "kurva bertukar lajur di titik potong" yang perlu dipecahkan, dan tidak
ada penelusur yang perlu disetel.

Yang tersisa hanyalah kolom yang pitanya kurang dari 15 — persentil 3/10/90/97
digambar putus-putus dan bertitik — dan itu cukup diabaikan: dari ~1900 kolom
per halaman, ~690 di antaranya lengkap, tersebar rata sepanjang rentang.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

PERCENTILES = [3, 10, 50, 90, 97]
Z = {3: -1.8807936081512509, 10: -1.2815515655446004, 50: 0.0,
     90: 1.2815515655446004, 97: 1.8807936081512509}

# Ambang residual LMS. Digitasi garis setebal ~6 px memberi galat ~0,02 unit;
# residual jauh di atas itu berarti kelima persentilnya bukan satu keluarga LMS,
# yang di gambar ini berarti ada pita yang salah terbaca. Minggu seperti itu
# dibuang, bukan diterbitkan: ini aplikasi kesehatan anak, dan LMS yang salah
# menghasilkan z-score yang salah untuk pasien paling rapuh.
MAX_RMSE = 0.05

# Tiga angka Fenton 2013 yang diterbitkan (bayi laki-laki, P50, PMA 30 minggu).
# Dipakai sebagai patokan luar: kalau kalibrasinya melenceng, ketiganya
# melenceng bersamaan, jadi ini menangkap galat sumbu yang tak terlihat oleh
# pemeriksaan internal mana pun.
KNOWN = {"length": 39.2, "head": 27.5, "weight": 1.41}
KNOWN_TOL = {"length": 0.5, "head": 0.5, "weight": 0.05}

INDICATORS = [("length", "cm"), ("head", "cm"), ("weight", "kg")]


def run_length(mask, axis):
    """Panjang lari kontinu tiap piksel sepanjang sumbu — untuk memisahkan
    garis grid (lurus panjang) dari kurva (miring, jadi larinya pendek)."""
    x = mask.astype(np.int32)
    if axis == 1:
        x = x.T
    n = x.shape[0]
    up = np.zeros_like(x)
    for i in range(1, n):
        up[i] = np.where(x[i] > 0, up[i - 1] + 1, 0)
    dn = np.zeros_like(x)
    for i in range(n - 2, -1, -1):
        dn[i] = np.where(x[i] > 0, dn[i + 1] + 1, 0)
    r = np.where(x > 0, up + dn + 1, 0)
    return r.T if axis == 1 else r


def load_curves(png, plot):
    """Piksel kurva saja: tinta pekat, dikurangi grid dan sisa anti-alias-nya."""
    a = np.asarray(Image.open(png).convert("RGB")).astype(int)
    x0, x1, y0, y1 = plot["x0"], plot["x1"], plot["y0"], plot["y1"]

    # Ambang tanpa memandang warna: halaman perempuan bertinta merah muda
    # (216,48,120) yang komponen merahnya tinggi, jadi uji "gelap" biasa
    # melewatkannya. Kurva jauh lebih pekat daripada grid minor; ambangnya
    # diletakkan di lembah histogram (grid ~100, kurva ~200).
    ink = (255 - a.min(2)) > 150
    curves = ink & (run_length(ink, 0) < 45) & (run_length(ink, 1) < 45)

    # Grid mayor tersaring oleh run-length, tapi tepi anti-alias-nya lolos.
    # Kolom/baris yang terisi hampir penuh tidak mungkin kurva.
    #
    # Ambang kolom jauh lebih rendah daripada baris (0,085 vs 0,55): grid minor
    # tegak dipotong-potong oleh grid mendatar yang melintasinya, jadi larinya
    # tinggal ~30 px dan lolos dari saringan run-length, tapi terisinya cuma
    # ~10% tinggi kotak. Sisanya terbaca sebagai "pita" setipis 4 piksel yang
    # membanjiri kolom di PMA akhir — di situlah minggu 47-50 hilang. Lembah
    # histogram kolom ada di 0,085 (kurva ~0,05, grid minor ~0,10).
    dense = ink[y0:y1, x0:x1]
    gcols = np.where(dense.mean(0) > 0.085)[0] + x0
    grows = np.where(dense.mean(1) > 0.55)[0] + y0
    for c in gcols:
        curves[:, max(0, c - 3):c + 4] = False
    for r in grows:
        curves[max(0, r - 3):r + 4, :] = False

    out = np.zeros_like(curves)
    out[y0:y1, x0:x1] = curves[y0:y1, x0:x1]
    for bx0, bx1, by0, by1 in plot.get("mask", []):
        out[by0:by1, bx0:bx1] = False
    return out


def bands_at(curves, x, halfwidth=4, gap=6):
    """Titik tengah tiap pita pada kolom x, terurut dari atas ke bawah.

    Jendela +-4 px, bukan satu kolom: persentil 3 dan 97 digambar bertitik
    dengan jeda ~8 px, jadi kolom selebar satu piksel sering jatuh tepat di
    antara dua titik dan kurvanya terbaca hilang padahal ada.
    """
    col = curves[:, max(0, x - halfwidth):x + halfwidth + 1].any(1)
    ys = np.where(col)[0]
    if len(ys) == 0:
        return []
    out, cur = [], [ys[0]]
    for y in ys[1:]:
        if y - cur[-1] <= gap:
            cur.append(y)
        else:
            out.append(float(np.mean(cur)))
            cur = [y]
    out.append(float(np.mean(cur)))
    return out


def column_ok(vals):
    """Apakah satu kolom masuk akal sebagai 15 persentil dari tiga indikator?

    Kolom dengan tepat 15 pita belum tentu memuat 15 kurva yang benar: di PMA
    akhir sebagian kurva putus-putus tidak tertangkap sementara tanda lain
    (angka sumbu, anotasi) ikut terbaca, jadi jumlahnya tetap 15 tapi isinya
    bergeser. Kolom begitu ketahuan karena kelima "persentil"-nya tidak lagi
    membentuk keluarga LMS — residualnya melonjak ke satuan penuh, bukan ~0,02.

    Penyaringan dilakukan per kolom, bukan per minggu, supaya satu kolom rusak
    tidak mencemari median seluruh minggu — yang penting justru di PMA akhir,
    tempat kolom lengkapnya tinggal segelintir.
    """
    for g, _ in enumerate(INDICATORS):
        group = vals[g * 5:g * 5 + 5][::-1]      # P3..P97
        if any(a >= b for a, b in zip(group, group[1:])):
            return False
        fit = fit_lms(group, [Z[p] for p in PERCENTILES])
        if fit is None or fit[3] > MAX_RMSE:
            return False
    return True


def read_page(curves, plot):
    """Semua kolom lengkap pada satu halaman -> {minggu: [15 nilai]}.

    Pita diurutkan menurut Y lalu dibagi jadi tiga rumpun; urutan itulah
    identitasnya. Lihat docstring modul untuk alasan mengapa pengurutan sudah
    cukup, dan `split_groups` untuk cara batas rumpunnya ditemukan.
    """
    px_per_week = (plot["x1"] - plot["x0"]) / (plot["week1"] - plot["week0"])

    def to_week(x):
        return plot["week0"] + (x - plot["x0"]) / px_per_week

    def to_value(y, unit):
        if unit == "kg":
            return (plot["y_kg_zero"] - y) / plot["y_step"] * 0.5
        return (plot["y_cm_zero"] - y) / plot["y_step"] * 5.0

    cols = {}
    for x in range(plot["x0"] + 2, plot["x1"] - 1):
        bands = bands_at(curves, x)
        if len(bands) != 15:
            continue
        bands.sort()
        vals = []
        for g, (_, unit) in enumerate(INDICATORS):
            vals.extend(to_value(y, unit) for y in bands[g * 5:g * 5 + 5])
        if not column_ok(vals):
            continue
        cols[to_week(x)] = vals
    return cols


def fit_lms(values, zs):
    """Pulihkan L, M, S dari lima persentil (metode Cole).

    X = M * (1 + L*S*z)^(1/L), atau X = M*exp(S*z) bila L = 0.
    M diambil dari persentil 50; L dan S dicari least-squares atas empat
    persentil sisanya — empat persamaan untuk dua parameter, jadi residualnya
    sekaligus jadi alat periksa: cocok berarti kurvanya memang keluarga LMS.
    """
    m = values[zs.index(0.0)]
    v = np.asarray(values, dtype=float)
    z = np.asarray(zs, dtype=float)
    if m <= 0 or np.any(v <= 0):
        return None

    # Sapuan L divektorkan: (kandidat L) x (5 persentil) sekaligus. Cara skalar
    # memanggil ini ~1900 kali per halaman untuk menyaring tiap kolom, dan di
    # sana selisihnya antara hitungan menit dan hitungan detik.
    L = np.arange(-3.0, 3.0001, 0.002)
    L = L[np.abs(L) > 1e-9]                       # L=0 ditangani terpisah
    off = z != 0.0
    r = (v / m)[off]
    with np.errstate(all="ignore"):
        S = np.mean((r ** L[:, None] - 1.0) / (L[:, None] * z[off]), axis=1)
        pred = m * (1 + L[:, None] * S[:, None] * z) ** (1 / L[:, None])
        err = np.sum((pred - v) ** 2, axis=1)
    err = np.where((S > 0) & np.all(np.isfinite(pred), axis=1), err, np.inf)

    # Kasus L = 0 (lognormal) bukan limit yang terjangkau sapuan di atas.
    with np.errstate(all="ignore"):
        S0 = float(np.mean(np.log(r) / z[off]))
        if S0 > 0:
            e0 = float(np.sum((m * np.exp(S0 * z) - v) ** 2))
        else:
            e0 = np.inf

    k = int(np.argmin(err))
    if not np.isfinite(err[k]) and not np.isfinite(e0):
        return None
    if e0 <= err[k]:
        return 0.0, m, S0, float(np.sqrt(e0 / len(values)))
    return (float(L[k]), m, float(S[k]),
            float(np.sqrt(err[k] / len(values))))


def build(cols, week0, week1):
    """Kolom mentah -> baris LMS per minggu bulat, per indikator.

    Nilai tiap minggu diambil dari median kolom di sekitarnya, bukan dari satu
    kolom: ada ~25 kolom lengkap per minggu, jadi median membuang kolom yang
    sesekali salah baca tanpa perlu menyetel apa pun.
    """
    weeks = np.array(sorted(cols))
    rows = {name: [] for name, _ in INDICATORS}
    dropped = []

    for wk in range(int(week0), int(week1) + 1):
        near = weeks[np.abs(weeks - wk) <= 0.25]
        if len(near) < 3:
            near = weeks[np.abs(weeks - wk) <= 0.5]
        if len(near) < 3:
            dropped.append((f"minggu {wk}", "kolom lengkap terlalu sedikit"))
            continue
        med = np.median(np.array([cols[w] for w in near]), axis=0)

        for g, (name, _) in enumerate(INDICATORS):
            # Urutan pita dari atas ke bawah = persentil dari besar ke kecil.
            vals = list(med[g * 5:g * 5 + 5])[::-1]
            if any(a >= b for a, b in zip(vals, vals[1:])):
                dropped.append((f"{name} minggu {wk}", "persentil tidak monoton"))
                continue
            fit = fit_lms(vals, [Z[p] for p in PERCENTILES])
            if fit is None:
                dropped.append((f"{name} minggu {wk}", "LMS tidak konvergen"))
                continue
            L, M, S, rmse = fit
            if rmse > MAX_RMSE:
                dropped.append((f"{name} minggu {wk}", f"rmse {rmse:.3f}"))
                continue
            rows[name].append({"week": wk, "l": round(L, 4), "m": round(M, 4),
                               "s": round(S, 5), "rmse": round(rmse, 5)})
    return rows, dropped


def percentiles_of(row):
    """Lima persentil kembali dari satu baris LMS."""
    L, M, S = row["l"], row["m"], row["s"]
    if abs(L) < 1e-9:
        return [M * np.exp(S * Z[p]) for p in PERCENTILES]
    return [M * (1 + L * S * Z[p]) ** (1 / L) for p in PERCENTILES]


def extend(rows, curves, plot, dropped):
    """Lanjutkan tiap indikator melewati minggu terakhir yang terbaca `build`.

    `read_page` menuntut satu kolom memuat tepat 15 pita lalu mengurutkannya
    menurut Y. Di PMA akhir syarat itu runtuh: persentil 97 berat naik melewati
    6,3 kg, dan pada tinggi gambar yang sama sumbu kiri membaca 33 cm — jadi
    rumpun berat menyusup ke dalam rumpun lingkar kepala dan pengurutan menurut
    Y tidak lagi menentukan identitas. Yang runtuh cuma *pengurutannya*; garisnya
    sendiri tetap tergambar jelas di sana.

    Jadi di luar jangkauan itu tiap indikator dilanjutkan sendiri-sendiri:
    posisi tiap persentil diramal dari laju tiga minggu terakhir, lalu pita
    terdekat di sekitar ramalan itu yang diambil (toleransi setengah kotak).
    Indikator lain boleh melintas tanpa mengganggu, karena tidak ada lagi
    asumsi tentang urutan antar-rumpun — hanya kontinuitas tiap garis.

    Pagar mutunya tetap sama: monoton + residual LMS <= MAX_RMSE. Minggu yang
    tidak lolos tetap dibuang, bukan diterbitkan.
    """
    ppw = (plot["x1"] - plot["x0"]) / (plot["week1"] - plot["week0"])
    tol = plot["y_step"] * 0.45

    def to_y(v, unit):
        if unit == "kg":
            return plot["y_kg_zero"] - v / 0.5 * plot["y_step"]
        return plot["y_cm_zero"] - v / 5.0 * plot["y_step"]

    def to_value(y, unit):
        if unit == "kg":
            return (plot["y_kg_zero"] - y) / plot["y_step"] * 0.5
        return (plot["y_cm_zero"] - y) / plot["y_step"] * 5.0

    for name, unit in INDICATORS:
        seq = rows[name]
        if len(seq) < 4:
            continue

        for wk in range(seq[-1]["week"] + 1, int(plot["week1"]) + 1):
            last, prev = seq[-1], seq[-4]
            v_last = np.array(percentiles_of(last))
            slope = (v_last - np.array(percentiles_of(prev))) / (last["week"] - prev["week"])
            pred = v_last + slope * (wk - last["week"])

            # Persentil yang ramalannya sudah keluar bidang gambar menghentikan
            # indikator ini: garisnya memang tidak ada lagi untuk dibaca.
            ys = [to_y(v, unit) for v in pred]
            if any(y < plot["y0"] or y > plot["y1"] for y in ys):
                dropped.append((f"{name} minggu {wk}", "kurva keluar bidang gambar"))
                break

            x0 = int(plot["x0"] + (wk - plot["week0"]) * ppw)
            hits = []
            for x in range(max(plot["x0"], x0 - 10), min(x0 + 11, plot["x1"] - 1)):
                bands = bands_at(curves, x)
                picks = []
                for y in ys:
                    near = [b for b in bands if abs(b - y) <= tol]
                    picks.append(min(near, key=lambda b: abs(b - y)) if near else None)
                if all(p is not None for p in picks) and len(set(picks)) == 5:
                    hits.append([to_value(p, unit) for p in picks])

            if len(hits) < 3:
                dropped.append((f"{name} minggu {wk}", "kolom lengkap terlalu sedikit"))
                break

            vals = sorted(np.median(np.array(hits), axis=0))
            if any(a >= b for a, b in zip(vals, vals[1:])):
                dropped.append((f"{name} minggu {wk}", "persentil tidak monoton"))
                break
            fit = fit_lms(vals, [Z[p] for p in PERCENTILES])
            if fit is None or fit[3] > MAX_RMSE:
                why = "LMS tidak konvergen" if fit is None else f"rmse {fit[3]:.3f}"
                dropped.append((f"{name} minggu {wk}", why))
                break

            L, M, S, rmse = fit
            seq.append({"week": wk, "l": round(L, 4), "m": round(M, 4),
                        "s": round(S, 5), "rmse": round(rmse, 5)})

    return rows, dropped


def verify(out):
    """Cocokkan P50 laki-laki pada PMA 30 minggu dengan angka terbitan Fenton.

    Pemeriksaan internal (monoton, residual LMS) tidak bisa melihat galat
    kalibrasi sumbu, karena sumbu yang salah menggeser kelima persentil
    bersamaan dan tetap membentuk keluarga LMS yang rapi. Hanya patokan dari
    luar yang menangkapnya.
    """
    for name, want in KNOWN.items():
        row = next((r for r in out["MALE"][name] if r["week"] == 30), None)
        assert row is not None, f"{name}: minggu 30 tidak ada di hasil"
        got = row["m"]
        assert abs(got - want) <= KNOWN_TOL[name], (
            f"{name} PMA 30w P50 = {got}, Fenton menerbitkan {want}")
    return True


def main():
    cfg = json.loads(Path(sys.argv[1]).read_text())
    out = {}
    for sex, page in cfg["pages"].items():
        plot = page["plot"]
        curves = load_curves(page["png"], plot)
        cols = read_page(curves, plot)
        rows, dropped = build(cols, plot["week0"], plot["week1"])
        rows, dropped = extend(rows, curves, plot, dropped)
        out[sex] = rows
        print(f"{sex}: {len(cols)} kolom lengkap")
        for name, _ in INDICATORS:
            r = rows[name]
            span = f"{r[0]['week']}..{r[-1]['week']}" if r else "-"
            worst = max((x["rmse"] for x in r), default=0.0)
            print(f"  {name:7} {len(r):3} minggu ({span})  rmse max {worst:.4f}")
        for what, why in dropped:
            print(f"    dibuang: {what}: {why}")

    verify(out)
    Path(cfg["out"]).write_text(json.dumps(out, indent=1))
    print(f"\nditulis: {cfg['out']} (cocok dengan angka terbitan Fenton di 30w)")


if __name__ == "__main__":
    main()
