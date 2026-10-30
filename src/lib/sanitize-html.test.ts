import { describe, expect, it } from "vitest";
import { htmlToText, readingMinutes, sanitizeHtml } from "./sanitize-html";

/**
 * Yang membuat berkas ini ada artinya adalah blok "menolak" — bukan blok
 * "mempertahankan". `content_html` dirender dengan `dangerouslySetInnerHTML` ke
 * setiap pembaca artikel, jadi satu jalan masuk yang lolos berarti stored XSS.
 */
describe("sanitizeHtml — menolak", () => {
  it("membuang script beserta isinya, dalam huruf apa pun", () => {
    expect(sanitizeHtml('<p>Aman</p><script>alert(1)</script>')).toBe("<p>Aman</p>");
    expect(sanitizeHtml('<SCRIPT>alert(1)</SCRIPT><p>Aman</p>')).toBe("<p>Aman</p>");
    expect(sanitizeHtml('<script src="https://evil.test/x.js"></script>')).toBe("");
    // Pembuka tanpa penutup tidak boleh menyisakan apa pun yang bisa dieksekusi.
    expect(sanitizeHtml("<script>alert(1)")).not.toContain("<script");
  });

  it("membuang style, iframe, svg, dan object beserta isinya", () => {
    expect(sanitizeHtml("<style>body{display:none}</style><p>Hai</p>")).toBe("<p>Hai</p>");
    expect(sanitizeHtml('<iframe src="https://evil.test"></iframe>')).toBe("");
    expect(sanitizeHtml("<svg><animate onbegin=alert(1)></svg>")).toBe("");
    expect(sanitizeHtml('<object data="x"></object>')).toBe("");
  });

  it("membuang atribut on* dan style walau tag-nya diizinkan", () => {
    const html = sanitizeHtml('<p onclick="alert(1)" style="color:red">Teks</p>');
    expect(html).toBe("<p>Teks</p>");
    expect(sanitizeHtml('<a href="https://who.int" onmouseover="alert(1)">x</a>')).not.toContain(
      "onmouseover",
    );
  });

  it("menolak href berskema berbahaya — ini satu-satunya atribut yang lolos", () => {
    // Tanpa href yang sah, <a>-nya ikut dibuang tapi teksnya tetap terbaca.
    expect(sanitizeHtml('<a href="javascript:alert(1)">klik</a>')).toBe("klik");
    expect(sanitizeHtml('<a href="data:text/html,<script>alert(1)</script>">klik</a>')).toBe(
      "klik",
    );
    expect(sanitizeHtml('<a href="vbscript:msgbox(1)">klik</a>')).toBe("klik");
    // Penyamaran lewat spasi/tab/entity di tengah skema.
    expect(sanitizeHtml('<a href="java\tscript:alert(1)">klik</a>')).toBe("klik");
    expect(sanitizeHtml('<a href=" JaVaScRiPt:alert(1)">klik</a>')).toBe("klik");
  });

  it("membuang tag tak dikenal tapi mempertahankan teksnya", () => {
    expect(sanitizeHtml("<div><p>Isi</p></div>")).toBe("<p>Isi</p>");
    expect(sanitizeHtml("<marquee>Lari</marquee>")).toBe("Lari");
    expect(sanitizeHtml('<img src=x onerror="alert(1)">')).toBe("");
  });

  it("meng-escape teks dan komentar yang menyamarkan tag", () => {
    expect(sanitizeHtml("<p>5 < 10 & 10 > 5</p>")).toBe("<p>5 &lt; 10 &amp; 10 &gt; 5</p>");
    expect(sanitizeHtml("<!-- <script>alert(1)</script> --><p>Hai</p>")).toBe("<p>Hai</p>");
  });

  it("menutup tag yang menggantung, jadi tata letak halaman tidak ikut rusak", () => {
    expect(sanitizeHtml("<p>Tanpa penutup")).toBe("<p>Tanpa penutup</p>");
    // Penutup liar tidak boleh ditulis apa adanya — ia bisa menutup pembungkusnya.
    expect(sanitizeHtml("</p>Teks")).toBe("Teks");
    expect(sanitizeHtml("<ul><li>Satu</ul>")).toBe("<ul><li>Satu</li></ul>");
  });
});

describe("sanitizeHtml — mempertahankan", () => {
  it("menjaga struktur artikel yang wajar", () => {
    const html = "<h2>Judul</h2><p>Isi <strong>tebal</strong> dan <em>miring</em>.</p>";
    expect(sanitizeHtml(html)).toBe(html);
    expect(sanitizeHtml("<ol><li>Satu</li><li>Dua</li></ol>")).toBe(
      "<ol><li>Satu</li><li>Dua</li></ol>",
    );
    expect(sanitizeHtml("<blockquote><p>Kutipan</p></blockquote>")).toBe(
      "<blockquote><p>Kutipan</p></blockquote>",
    );
  });

  it("tautan http(s) lolos dan selalu dapat rel pengaman", () => {
    const html = sanitizeHtml('<a href="https://www.who.int/x">WHO</a>');
    expect(html).toContain('href="https://www.who.int/x"');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
    expect(html).toContain('target="_blank"');
    expect(sanitizeHtml('<a href="mailto:a@b.test">Surel</a>')).toContain("mailto:a@b.test");
  });

  it("tag tanpa penutup tidak menelan sisa artikel", () => {
    expect(sanitizeHtml("<p>Satu<br>Dua</p>")).toBe("<p>Satu<br>Dua</p>");
  });

  it("string kosong aman", () => {
    expect(sanitizeHtml("")).toBe("");
  });
});

describe("htmlToText / readingMinutes", () => {
  it("membuang tag dan merapikan spasi", () => {
    expect(htmlToText("<h2>Judul</h2><p>Satu dua</p>")).toBe("Judul Satu dua");
    expect(htmlToText("<p>A &amp; B</p>")).toBe("A & B");
  });

  it("minimal satu menit, ~200 kata per menit", () => {
    expect(readingMinutes("<p>Pendek sekali</p>")).toBe(1);
    expect(readingMinutes(`<p>${"kata ".repeat(600)}</p>`)).toBe(3);
  });
});
