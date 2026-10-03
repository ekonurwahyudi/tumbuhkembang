import "server-only";
import { ALLOWED_PHOTO_TYPES, MAX_UPLOAD_BYTES } from "@/lib/storage-limits";

/**
 * Ambil nama, foto, dan (bila ada) harga barang dari tautan toko yang ditempel orang tua.
 *
 * Dua toko yang didukung, dan alasannya berbeda-beda:
 *
 * SHOPEE — halaman produknya dirender di klien. Dibuka dengan User-Agent browser
 * biasa, yang datang cuma kerangka SPA tanpa satu pun tag `og:`. Yang masih disajikan
 * lengkap adalah versi untuk crawler pratayang tautan, jadi UA-nya harus berbentuk
 * crawler. Diukur 2026-09-30: UA jujur ("TumbuhKembangBot/1.0") dapat 0 tag og; UA
 * crawler dapat lengkap. Satu fetch cukup untuk ketiga bentuk tautannya (short link
 * `s.shopee.co.id/XXX`, slug-panjang `/Nama-i.<shop>.<item>`, kanonis
 * `/product/<shop>/<item>`). `robots.txt`-nya hanya melarang /cart/, /checkout/,
 * /user/, /me/, /order/ dan beberapa halaman rekomendasi — halaman produk tidak.
 *
 * TOKOPEDIA — lebih terbuka: halaman produknya terdaftar di sitemap publik
 * (`/sitemap/product-dir/*.xml.gz`), `robots.txt` tidak melarangnya (blokir total
 * hanya untuk Yandex), dan ia menyajikan JSON-LD `@type: Product` lengkap dengan
 * nama, gambar, DAN harga. Itu sebabnya harga ikut terisi di sini tapi tidak di
 * Shopee. Yang 410 Gone adalah halaman toko dan kategori, bukan halaman produk —
 * kekeliruan saya sebelumnya. UA crawler tetap dipakai: dengan UA browser JSON-LD-nya
 * tidak ikut terkirim.
 *
 * TIKTOK SHOP TIDAK DIDUKUNG, dan ini keputusan, bukan kegagalan teknis:
 * `tiktok.com/robots.txt` melarang `/shop/view/product/` secara eksplisit untuk
 * `User-agent: *` — itu justru path halaman produknya. Menembaknya berarti melanggar
 * larangan yang ditulis pemiliknya terang-terangan. Tokopedia dan Shopee tidak
 * melarang halaman produk mereka; TikTok melarang. Jadi tombolnya tidak ada di sana.
 *
 * Yang SENGAJA tidak diambil:
 * - Harga Shopee. Tidak ada di respons itu sama sekali (dicari `Rp` dan `"price`: nol
 *   kecocokan); angkanya dimuat lewat `/api/v4/pdp/*` yang menjawab 403.
 * - Deskripsi produk, di kedua toko. `og:description` bukan deskripsi: isinya bungkus
 *   SEO yang sama untuk semua barang ("Beli <nama> Terbaru Harga Murah di Shopee…",
 *   "Beli <nama> di <Toko>. Bebas ongkir…"). Nama di dalamnya yang dipakai.
 *
 * Ini menempel pada HTML pihak ketiga yang bisa berubah tanpa pemberitahuan — sudah
 * berubah sekali saat modul ini ditulis. Karena itu setiap kegagalan mengembalikan
 * `null`, bukan melempar: form tetap bisa diisi tangan, dan tombolnya cuma kehilangan
 * gunanya — bukan merusak halaman.
 */

/**
 * BATAS SSRF. URL-nya datang dari isian orang, dan `fetch` ini berjalan di server —
 * tanpa daftar ini, isian `http://169.254.169.254/` atau `http://localhost:5432`
 * membuat server menembak jaringan internal VPS sendiri dan memuntahkan hasilnya.
 *
 * Dicocokkan persis, bukan `endsWith`: "shopee.co.id.evil.com" lolos dari endsWith.
 */
const SHOPEE_HOSTS = new Set([
  "s.shopee.co.id",
  "shopee.co.id",
  "www.shopee.co.id",
  "id.shp.ee",
  "shp.ee",
]);
const TOKOPEDIA_HOSTS = new Set(["tokopedia.com", "www.tokopedia.com", "m.tokopedia.com"]);
/**
 * TikTok SENGAJA tidak ikut `PAGE_HOSTS` — host-nya hanya dikenali untuk menempatkan
 * tautannya di kolom yang benar, tidak pernah dituju `fetch`. Lihat catatan kepala.
 */
const TIKTOK_HOSTS = new Set(["tiktok.com", "www.tiktok.com", "vt.tiktok.com", "shop.tiktok.com"]);

/** Diturunkan, bukan daftar kedua: satu daftar host yang tidak bisa keluar sinkron. */
const PAGE_HOSTS = new Set([...SHOPEE_HOSTS, ...TOKOPEDIA_HOSTS]);

export type StoreBrand = "shopee" | "tokopedia" | "tiktok";

/**
 * Toko mana, dilihat dari host-nya. Dipakai form Shop yang cuma punya SATU kolom
 * tautan: servernya yang memutuskan kolom tautan toko mana yang terisi.
 *
 * Dicocokkan persis lewat Set yang sama dengan penjaga SSRF di atas — bukan
 * `includes`/`endsWith`: "shopee.co.id.evil.com" lolos dari keduanya.
 */
export function storeBrandOf(raw: string): StoreBrand | null {
  let host: string;
  try {
    host = new URL(raw.trim()).hostname;
  } catch {
    return null;
  }
  if (SHOPEE_HOSTS.has(host)) return "shopee";
  if (TOKOPEDIA_HOSTS.has(host)) return "tokopedia";
  if (TIKTOK_HOSTS.has(host)) return "tiktok";
  return null;
}

/** Host CDN gambar kedua toko — hanya dari sini bytes foto diunduh. */
const IMAGE_HOSTS = new Set([
  // Shopee
  "down-id.img.susercontent.com",
  "down-aka-id.img.susercontent.com",
  "cf.shopee.co.id",
  "deo.shopeemobile.com",
  // Tokopedia — sejak diakuisisi TikTok, gambarnya disajikan dari CDN ByteDance.
  "p16-oec-sg.ibyteimg.com",
  "images.tokopedia.net",
  "ecs7.tokopedia.net",
  "ecs7-p.tokopedia.net",
]);

const TIMEOUT_MS = 8000;
/** Halaman Tokopedia ±320 KB; sisanya kelonggaran bila isinya bertambah. */
const MAX_HTML_BYTES = 600_000;

/** Lihat catatan di kepala berkas: tanpa UA crawler, kedua toko tidak memberi apa pun. */
const UA = "WhatsApp/2.23.20.0";

export type StorePreview = {
  name: string;
  image: { bytes: Uint8Array; type: string } | null;
  /** Rupiah bulat. Hanya Tokopedia; Shopee tidak menyajikannya sama sekali. */
  priceIdr: number | null;
};

const httpsUrl = (raw: string, allowed: Set<string>) => {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "https:" && allowed.has(u.hostname) ? u : null;
  } catch {
    return null;
  }
};

/** Baca badan respons dengan batas byte, supaya halaman raksasa tidak menghabiskan memori. */
async function readCapped(res: Response, max: number): Promise<Uint8Array | null> {
  const reader = res.body?.getReader();
  if (!reader) return null;

  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (size + value.length > max) {
      await reader.cancel();
      // Sebagian isi sudah cukup untuk <head>; hanya gambar yang butuh utuh, dan di
      // sana pemanggilnya yang menolak hasil terpotong lewat perbandingan panjang.
      break;
    }
    chunks.push(value);
    size += value.length;
  }

  const out = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

/**
 * `<meta ... property="og:x" content="...">` dengan atribut apa pun di antaranya:
 * kedua toko menyelipkan `data-rh="true"` sebelum `property`, jadi pola yang menuntut
 * keduanya bersebelahan tidak akan cocok.
 */
const metaContent = (html: string, prop: string) =>
  new RegExp(`<meta[^>]*property="${prop}"[^>]*content="([^"]{1,500})"`, "i").exec(html)?.[1] ??
  new RegExp(`<meta[^>]*content="([^"]{1,500})"[^>]*property="${prop}"`, "i").exec(html)?.[1] ??
  null;

/** `&amp;` dkk. — og:title ditulis ter-escape HTML. */
const unescapeHtml = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&apos;|&#x27;/g, "'")
    .replace(/&amp;/g, "&");

/**
 * Buang ekor dan awalan yang dipasang toko: "Jual <nama> | Shopee Indonesia" dan
 * "<nama> di <Toko> | Tokopedia" → "<nama>".
 *
 * Nama barang sering memuat "|" sebagai pemisah varian, jadi yang dibuang hanya ekor
 * nama tokonya — bukan semua yang setelah "|" pertama.
 */
export function cleanStoreTitle(raw: string): string {
  return unescapeHtml(raw)
    .replace(/\s*\|\s*(?:Shopee\s+Indonesia|Tokopedia)\s*$/i, "")
    .replace(/^\s*(?:Jual|Beli)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

/**
 * Nama barang diambil dari `og:description` lebih dulu, bukan `og:title`.
 *
 * Alasannya: og:title Shopee sudah dipangkas ke ~70 karakter dan diberi ekor "..."
 * ("MOMCOZY M6 Wearable Breast Pump | Pompa ASI Elektrik Wireless |..."), sementara
 * og:description memuat nama utuh di dalam bungkus SEO-nya. Diukur pada dua barang
 * sungguhan: 106 dan 30 karakter, dua-duanya utuh. Tokopedia tidak memangkas, tapi
 * og:title-nya membawa ekor "di <Nama Toko>" yang bukan bagian nama barang — dan
 * deskripsinya memuat nama bersih. Jadi urutan yang sama menguntungkan keduanya;
 * og:title tetap jadi cadangan bila bungkusnya berubah bentuk.
 */
export function extractName(description: string | null, title: string | null): string {
  const desc = description ? unescapeHtml(description) : "";
  const fromDesc =
    // Shopee: "Beli <nama> Terbaru Harga Murah di Shopee. ..."
    /^\s*Beli\s+(.+?)\s+Terbaru\s+Harga\s+Murah\s+di\s+Shopee\./i.exec(desc) ??
    // Tokopedia: "Beli <nama> di <Toko>. Bebas ongkir ..."
    /^\s*Beli\s+(.+?)\s+di\s+[^.]{1,60}\.\s/i.exec(desc);

  const raw = fromDesc?.[1] ?? title;
  if (!raw) return "";
  return (
    cleanStoreTitle(raw)
      // Judul yang sudah terpangkas Shopee membawa ekor "...".
      .replace(/\s*\|?\s*\.\.\.$/, "")
      // Ekor "di <Nama Toko>" hanya dipasang Tokopedia di og:title-nya.
      .replace(/\s+di\s+[A-Z][\w\s.'&-]{1,40}$/, "")
      .trim()
  );
}

/**
 * Harga dari JSON-LD `@type: Product` — hanya Tokopedia yang menyajikannya.
 *
 * Diambil dari JSON-LD, bukan dari teks "Rp199.900" di halaman: angka di badan halaman
 * muncul berkali-kali dan sebagian milik barang lain (rekomendasi, ongkir), sedangkan
 * `offers.price` menunjuk barang yang diminta. Ditolak bila nol/negatif atau di atas
 * seratus juta — di luar itu hampir pasti bukan harga barang bayi, dan lebih baik
 * kosong daripada angka ngawur masuk basis data.
 */
export function extractPriceIdr(html: string): number | null {
  for (const m of html.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]{1,200000}?)<\/script>/gi,
  )) {
    let data: unknown;
    try {
      data = JSON.parse(m[1]);
    } catch {
      continue;
    }
    if (!data || typeof data !== "object") continue;
    const node = data as { "@type"?: unknown; offers?: { price?: unknown } };
    if (node["@type"] !== "Product") continue;

    const price = Number(node.offers?.price);
    if (Number.isFinite(price) && price > 0 && price <= 100_000_000) return Math.round(price);
  }
  return null;
}

async function getImage(raw: string): Promise<{ bytes: Uint8Array; type: string } | null> {
  const url = httpsUrl(raw, IMAGE_HOSTS);
  if (!url) return null;

  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": UA },
    });
    if (!res.ok) return null;

    // Tipe dari Content-Type, bukan dari ekstensi URL: URL gambar Shopee tidak punya
    // ekstensi sama sekali. Tetap disaring ke daftar yang sama dengan unggahan biasa.
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!ALLOWED_PHOTO_TYPES.includes(type as (typeof ALLOWED_PHOTO_TYPES)[number])) return null;

    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared > MAX_UPLOAD_BYTES) return null;

    const bytes = await readCapped(res, MAX_UPLOAD_BYTES);
    // Header boleh bohong atau absen; yang menentukan adalah yang benar-benar terunduh.
    if (!bytes || bytes.length === 0) return null;
    // Terpotong di batas berarti gambarnya kebesaran — separuh JPEG tidak berguna.
    if (declared > 0 && bytes.length < declared) return null;
    return { bytes, type };
  } catch {
    return null;
  }
}

/**
 * Tautan Shopee/Tokopedia → nama, foto utama, dan harga bila tokonya menyajikannya.
 * `null` berarti tidak dapat; pemanggilnya yang menerjemahkan itu jadi pesan untuk
 * orang tua.
 */
export async function fetchStorePreview(rawUrl: string): Promise<StorePreview | null> {
  const url = httpsUrl(rawUrl, PAGE_HOSTS);
  if (!url) return null;

  let html: string;
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": UA, "Accept-Language": "id-ID,id;q=0.9" },
    });
    if (!res.ok) return null;
    const bytes = await readCapped(res, MAX_HTML_BYTES);
    if (!bytes) return null;
    html = new TextDecoder().decode(bytes);
  } catch {
    // Timeout, DNS, atau TLS — semuanya berarti "tidak dapat".
    return null;
  }

  const name = extractName(metaContent(html, "og:description"), metaContent(html, "og:title"));
  // Judul halaman depan dipakai kedua toko sebagai fallback untuk tautan yang tidak
  // menunjuk barang; itu bukan nama barang, jadi dianggap gagal.
  if (!name || /^(?:Shopee Indonesia|Tokopedia)/i.test(name)) return null;

  const rawImage = metaContent(html, "og:image");
  return {
    name,
    image: rawImage ? await getImage(unescapeHtml(rawImage)) : null,
    priceIdr: extractPriceIdr(html),
  };
}
