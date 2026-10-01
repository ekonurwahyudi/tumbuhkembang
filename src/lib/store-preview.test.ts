import { describe, expect, it } from "vitest";
import { cleanStoreTitle, extractName, extractPriceIdr } from "./store-preview";

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
