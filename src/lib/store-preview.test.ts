import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanStoreTitle,
  extractName,
  extractPriceIdr,
  extractStoreDetails,
  fetchStorePreview,
  storeBrandOf,
} from "./store-preview";

/**
 * Yang diuji di sini cuma pengurai teksnya — satu-satunya logika di modul ini yang
 * tidak butuh jaringan. Fixture-nya diambil apa adanya dari respons Shopee sungguhan
 * pada 2026-09-30; memalsukan bentuk lain hanya akan menguji tiruan yang saya tulis
 * sendiri, dan tidak akan gagal ketika Shopee mengubah halamannya.
 */
describe("cleanStoreTitle", () => {
  it("membuang awalan Jual dan ekor Shopee Indonesia", () => {
    expect(cleanStoreTitle("Jual MOMCOZY M6 Wearable Breast Pump | Shopee Indonesia")).toBe(
      "MOMCOZY M6 Wearable Breast Pump",
    );
  });

  it("mempertahankan pemisah varian di tengah nama", () => {
    // "|" dipakai Shopee sebagai pemisah varian; hanya ekornya yang ekor.
    expect(
      cleanStoreTitle("Jual Pompa ASI Elektrik | Handsfree | Double Pump 2 pcs | Shopee Indonesia"),
    ).toBe("Pompa ASI Elektrik | Handsfree | Double Pump 2 pcs");
  });

  it("membuka escape HTML", () => {
    expect(cleanStoreTitle("Jual Stroller Ringan &amp; Ringkas | Shopee Indonesia")).toBe(
      "Stroller Ringan & Ringkas",
    );
  });

  it("memangkas ke 120 karakter, batas kolom nama", () => {
    expect(cleanStoreTitle("A".repeat(300))).toHaveLength(120);
  });
});

describe("extractName", () => {
  // Kedua fixture ini respons sungguhan; og:title-nya terpangkas Shopee di ~70 char.
  const DESC =
    "Beli MOMCOZY M6 Wearable Breast Pump | Pompa ASI Elektrik Wireless | Handsfree Breastpump ( Double Pump 2 pcs ) Terbaru Harga Murah di Shopee. Ada Gratis Ongkir, Promo COD, &amp; Cashback.";
  const TITLE =
    "Jual MOMCOZY M6 Wearable Breast Pump | Pompa ASI Elektrik Wireless |... | Shopee Indonesia";

  it("mengambil nama utuh dari deskripsi, bukan judul yang terpangkas", () => {
    expect(extractName(DESC, TITLE)).toBe(
      "MOMCOZY M6 Wearable Breast Pump | Pompa ASI Elektrik Wireless | Handsfree Breastpump ( Double Pump 2 pcs )",
    );
  });

  it("jatuh ke judul bila bungkus SEO deskripsi berubah bentuk", () => {
    expect(extractName("Promo apa pun yang tidak dikenali", TITLE)).toBe(
      "MOMCOZY M6 Wearable Breast Pump | Pompa ASI Elektrik Wireless",
    );
  });

  it("nama pendek tanpa pemisah ikut terambil", () => {
    expect(
      extractName("Beli EUFY - Wearable Breast Pump S1 Terbaru Harga Murah di Shopee. Ada", null),
    ).toBe("EUFY - Wearable Breast Pump S1");
  });

  it("kosong bila dua-duanya tidak ada", () => {
    expect(extractName(null, null)).toBe("");
  });

  // Tokopedia memakai bungkus SEO berbeda, dan og:title-nya membawa ekor "di <Toko>".
  it("nama Tokopedia dari deskripsi, tanpa nama tokonya", () => {
    expect(
      extractName(
        "Beli Jam Tangan CASIO MQ-38 Original di Ogytashop. Bebas ongkir dan promo khusus pengguna baru di aplikasi Tokopedia!",
        "Jam Tangan CASIO MQ-38 Original di Ogytashop | Tokopedia",
      ),
    ).toBe("Jam Tangan CASIO MQ-38 Original");
  });

  it("ekor 'di <Toko>' juga dibuang saat jatuh ke judul Tokopedia", () => {
    expect(extractName(null, "Modem Smartfren TR-8881 EVDO Rev.A di Ebenhaezer | Tokopedia")).toBe(
      "Modem Smartfren TR-8881 EVDO Rev.A",
    );
  });
});

describe("extractPriceIdr", () => {
  const ld = (obj: unknown) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;

  it("mengambil offers.price dari JSON-LD Product", () => {
    expect(
      extractPriceIdr(
        ld({ "@type": "BreadcrumbList" }) +
          ld({
            "@type": "Product",
            name: "Jam Tangan Casio Mq-38 Original",
            offers: { "@type": "Offer", priceCurrency: "IDR", price: 199900 },
          }),
      ),
    ).toBe(199900);
  });

  it("null bila tidak ada JSON-LD Product — ini Shopee", () => {
    expect(extractPriceIdr(ld({ "@type": "WebSite", name: "Shopee" }))).toBeNull();
  });

  it("null untuk angka ngawur, supaya tidak masuk basis data", () => {
    for (const price of [0, -5, 999_999_999])
      expect(extractPriceIdr(ld({ "@type": "Product", offers: { price } }))).toBeNull();
  });

  it("JSON rusak dilewati, bukan melempar", () => {
    expect(
      extractPriceIdr(
        `<script type="application/ld+json">{bukan json</script>` +
          ld({ "@type": "Product", offers: { price: 27500 } }),
      ),
    ).toBe(27500);
  });
});

/**
 * `storeBrandOf` adalah penjaga, bukan kenyamanan: satu kolom input berarti servernya
 * yang memutuskan host mana yang boleh dituju `fetch` dan kolom tautan mana yang terisi.
 * Yang membuat tes ini ada artinya adalah tiga kasus penolakan di bawah, bukan tiga
 * kasus pengenalan di atasnya.
 */
describe("extractStoreDetails", () => {
  const image = (id: number) => `https://down-id.img.susercontent.com/file/${id}`;
  const ld = (data: unknown) => `<script type="application/ld+json">${JSON.stringify(data)}</script>`;

  it("mengambil judul, deskripsi, dan galeri Product dalam @graph", () => {
    const html = ld({ "@graph": [{
      "@type": ["Product"], name: "Stroller &amp; Tas",
      description: "Ringan<br>Warna biru &amp; putih",
      image: [image(1), { contentUrl: image(2) }, { url: image(3) }],
      offers: { price: 750000 },
    }] });
    expect(extractStoreDetails(html)).toEqual({
      name: "Stroller & Tas", description: "Ringan\nWarna biru & putih",
      images: [image(1), image(2), image(3)],
    });
    expect(extractPriceIdr(html)).toBe(750000);
  });

  it("memakai metadata bila JSON-LD rusak, menghapus duplikat dan menolak host asing", () => {
    const html = `<script type="application/ld+json">rusak</script>
      <meta property="og:title" content="Jual Stroller | Shopee Indonesia">
      <meta property="og:description" content="Ringan &amp; praktis">
      <meta property="og:image" content="${image(1)}">
      <meta content="${image(1)}" property="og:image">
      <meta property="og:image" content="http://down-id.img.susercontent.com/file/2">
      <meta property="og:image" content="https://down-id.img.susercontent.com.evil.com/x">
      <meta property="og:image" content="http://127.0.0.1/x">
      <meta property="og:image" content="${image(2)}">`;
    expect(extractStoreDetails(html)).toEqual({
      name: "Stroller", description: "", images: [image(1), image(2)],
    });
  });

  it("tidak menganggap promosi SEO Shopee sebagai deskripsi produk", () => {
    // Metadata dari tautan pengguna, shop 295104809 / item 25805460704.
    const name = "BUKU TULIS 38 LEMBAR GARIS A5 SKOLA BY SiDU NOTEBOOK SKOLA BY SINAR DUNIA BUKU TULIS ANAK SEKOLAH PACK [10PCS]";
    const photo = "https://down-id.img.susercontent.com/file/id-11134207-822wq-mmd28pthpkasf8";
    const html = `<meta property="og:title" content="Jual ${name} | Shopee Indonesia">
      <meta property="og:description" content="Beli ${name} Terbaru Harga Murah di Shopee. Ada Gratis Ongkir, Promo COD, &amp; Cashback. Cek Review Produk Terlengkap">
      <meta property="og:image" content="${photo}">
      ${ld({ "@type": "WebSite", name: "Shopee" })}`;
    expect(extractStoreDetails(html)).toEqual({ name, description: "", images: [photo] });
  });

  it("membatasi nama, deskripsi dan jumlah foto; mengabaikan data bukan Product", () => {
    const html = ld([
      { "@type": "Organization", image: image(99) },
      { "@type": "Product", name: "A".repeat(200), description: "B".repeat(1500),
        image: Array.from({ length: 8 }, (_, i) => image(i)) },
    ]);
    const details = extractStoreDetails(html);
    expect(details.name).toHaveLength(120);
    expect(details.description).toHaveLength(1000);
    expect(details.images).toEqual([0, 1, 2, 3, 4].map(image));
    expect(extractStoreDetails("")).toEqual({ name: "", description: "", images: [] });
  });
});

describe("fetchStorePreview", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("mengembalikan beberapa foto valid tanpa gagal saat satu foto tidak tersedia", async () => {
    const html = `<meta property="og:title" content="Stroller">
      ${[1, 2, 3].map((n) => `<meta property="og:image" content="https://down-id.img.susercontent.com/file/${n}">`).join("")}`;
    const fetchMock = vi.fn(async (url: URL) => {
      if (url.hostname === "shopee.co.id") return new Response(html);
      if (url.pathname.endsWith("/2")) return new Response("", { status: 404 });
      return new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/jpeg" } });
    });
    vi.stubGlobal("fetch", fetchMock);
    const preview = await fetchStorePreview("https://shopee.co.id/product/1/2", 5);
    expect(preview?.images).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    fetchMock.mockClear();
    expect((await fetchStorePreview("https://shopee.co.id/product/1/2"))?.images).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("storeBrandOf", () => {
  it("mengenali host resmi ketiga toko", () => {
    expect(storeBrandOf("https://s.shopee.co.id/60S055iVg8")).toBe("shopee");
    expect(storeBrandOf("https://shopee.co.id/product/123/456")).toBe("shopee");
    expect(storeBrandOf("https://www.tokopedia.com/toko/barang")).toBe("tokopedia");
    expect(storeBrandOf("https://vt.tiktok.com/XXX")).toBe("tiktok");
  });

  it("menolak subdomain penipu yang lolos dari endsWith", () => {
    // Inilah alasan pencocokannya Set.has(), bukan endsWith/includes.
    expect(storeBrandOf("https://shopee.co.id.evil.com/x")).toBeNull();
    expect(storeBrandOf("https://evil.com/shopee.co.id")).toBeNull();
    expect(storeBrandOf("https://tokopedia.com.attacker.net/p")).toBeNull();
  });

  it("menolak alamat internal dan masukan yang bukan URL", () => {
    expect(storeBrandOf("http://169.254.169.254/")).toBeNull();
    expect(storeBrandOf("http://localhost:3000/")).toBeNull();
    expect(storeBrandOf("bukan-url")).toBeNull();
    expect(storeBrandOf("")).toBeNull();
  });
});
