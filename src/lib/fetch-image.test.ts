import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchImageFromUrl } from "./fetch-image";

/**
 * Yang membuat berkas ini ada artinya adalah blok "menolak". `fetch` di modul ini
 * berjalan DI SERVER atas perintah URL yang diketik orang — satu jalan masuk yang
 * lolos berarti server menembak jaringan internalnya sendiri (SSRF).
 */
const imageResponse = (type = "image/jpeg", bytes = new Uint8Array([1, 2, 3])) =>
  new Response(bytes, { headers: { "content-type": type } });

describe("fetchImageFromUrl — menolak", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("menolak skema selain https", async () => {
    for (const url of [
      "http://example.test/a.jpg",
      "file:///etc/passwd",
      "ftp://example.test/a.jpg",
      "data:image/png;base64,iVBORw0KGgo=",
    ]) {
      const r = await fetchImageFromUrl(url);
      expect(r.ok).toBe(false);
    }
  });

  it("menolak alamat IP langsung — ini jalan masuk metadata cloud", async () => {
    // 169.254.169.254 adalah endpoint metadata AWS/GCP; isinya kredensial.
    for (const url of [
      "https://169.254.169.254/latest/meta-data/",
      "https://127.0.0.1/a.jpg",
      "https://10.0.0.5/a.jpg",
      "https://[::1]/a.jpg",
    ]) {
      const r = await fetchImageFromUrl(url);
      expect(r.ok).toBe(false);
    }
  });

  it("menolak nama host internal", async () => {
    for (const url of ["https://localhost/a.jpg", "https://db.internal/a.jpg"]) {
      const r = await fetchImageFromUrl(url);
      expect(r.ok).toBe(false);
    }
  });

  it("menolak pengalihan, bukan mengikutinya", async () => {
    // URL publik yang membalas 302 ke alamat internal adalah jalan memutar klasik.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 302 })),
    );
    const r = await fetchImageFromUrl("https://example.test/a.jpg");
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.reason).toContain("mengalihkan");
  });

  it("menolak respons yang bukan gambar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => imageResponse("text/html")),
    );
    const r = await fetchImageFromUrl("https://example.test/a.jpg");
    expect(r.ok).toBe(false);
  });

  it("menolak gambar yang melebihi batas, walau header-nya berbohong", async () => {
    // `content-length` tidak disetel; yang menentukan byte yang benar-benar datang.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => imageResponse("image/jpeg", new Uint8Array(7 * 1024 * 1024))),
    );
    const r = await fetchImageFromUrl("https://example.test/besar.jpg");
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.reason).toContain("batas");
  });

  it("menolak isi kosong dan status gagal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => imageResponse("image/jpeg", new Uint8Array(0))),
    );
    expect((await fetchImageFromUrl("https://example.test/a.jpg")).ok).toBe(false);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 404 })),
    );
    expect((await fetchImageFromUrl("https://example.test/a.jpg")).ok).toBe(false);
  });

  it("gagal jaringan jadi pesan, bukan lemparan", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    const r = await fetchImageFromUrl("https://example.test/a.jpg");
    expect(r.ok).toBe(false);
  });
});

describe("fetchImageFromUrl — menerima", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("mengembalikan byte dan tipe untuk gambar yang sah", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => imageResponse("image/webp", new Uint8Array([9, 9, 9, 9]))),
    );
    const r = await fetchImageFromUrl("https://upload.wikimedia.org/x.webp");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.image.contentType).toBe("image/webp");
      expect(r.image.bytes).toHaveLength(4);
    }
  });
});
