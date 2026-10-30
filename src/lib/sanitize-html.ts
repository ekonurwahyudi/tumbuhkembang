/**
 * Pembersih HTML artikel blog.
 *
 * INI BATAS KEAMANAN, bukan kerapian. Isi `content_html` dirender dengan
 * `dangerouslySetInnerHTML` ke SEMUA orang tua yang membuka artikelnya, jadi satu
 * `<script>` yang lolos berarti XML tersimpan (stored XSS) di setiap pembaca —
 * bukan hanya di layar admin yang menulisnya.
 *
 * Ditulis sendiri, bukan `sanitize-html`/DOMPurify, dengan alasan yang spesifik:
 * keduanya butuh DOM (jsdom di server), dan satu-satunya sumber HTML di aplikasi
 * ini adalah form superadmin — bukan komentar publik atau tempel dari web.
 *
 * Cara kerjanya ALLOWLIST, bukan denylist: apa pun yang tidak disebut di
 * `ALLOWED` dibuang. Denylist ("buang <script>") selalu kalah — `<SCRIPT >`,
 * `<img onerror>`, `javascript:` di href, `<svg><animate>` adalah empat jalan
 * masuk berbeda yang masing-masing butuh aturannya sendiri.
 *
 * Yang TIDAK ditangani di sini dan karena itu tidak boleh diizinkan: `<style>`
 * dan atribut `style` (CSS bisa menutupi layar atau memuat URL eksternal),
 * `<img>`/`<iframe>` (pelacak pihak ketiga — lihat alasan yang sama pada logo bank
 * di schemas/registry.ts), dan semua atribut `on*`.
 */

/** Tag yang boleh ada. Tidak ada tag yang memuat/menjalankan sumber daya luar. */
const ALLOWED: Record<string, readonly string[]> = {
  p: [],
  h2: [],
  h3: [],
  h4: [],
  ul: [],
  ol: [],
  li: [],
  strong: [],
  b: [],
  em: [],
  i: [],
  blockquote: [],
  br: [],
  hr: [],
  a: ["href"],
};

/** Tag tanpa penutup — `</br>` tidak pernah ada, jadi tidak ikut dihitung. */
const VOID_TAGS = new Set(["br", "hr"]);

const ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeText = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPE[c]);

/**
 * Hanya http(s) absolut, dan `mailto:`. Yang dicegat di sini terutama
 * `javascript:alert(1)` — href adalah satu-satunya atribut yang diizinkan, jadi
 * ia juga satu-satunya tempat skema berbahaya bisa masuk.
 *
 * `data:` ikut ditolak: `data:text/html,<script>` berjalan sebagai halaman penuh
 * di tab yang sama bila dibuka.
 */
function safeHref(raw: string): string | null {
  const value = raw.trim();
  // Entity dan spasi tak kasatmata dipakai untuk menyamarkan skema:
  // `java&Tab;script:` atau `java\0script:`. Dinormalkan dulu, baru diuji.
  const normalized = value.replace(/[\s\u0000-\u001f  -‍﻿]/g, "").toLowerCase();
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) return value;
  if (normalized.startsWith("mailto:")) return value;
  return null;
}

/**
 * Kembalikan HTML yang hanya berisi tag dan atribut dari allowlist.
 *
 * Isi `<script>`, `<style>`, dan `<template>` dibuang BESERTA teksnya; tag lain
 * yang tidak dikenal dibuang tapi teks di dalamnya dipertahankan — `<div>Halo</div>`
 * jadi `Halo`, bukan hilang sama sekali.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";

  let html = input;
  // Komentar bisa menyembunyikan tag dari parser naif; dibuang lebih dulu.
  html = html.replace(/<!--[\s\S]*?-->/g, "");
  // Elemen yang isinya BUKAN teks biasa: buang beserta isinya.
  html = html.replace(
    /<(script|style|template|noscript|iframe|object|embed|svg|math)\b[\s\S]*?<\/\1\s*>/gi,
    "",
  );
  // Sisa pembukanya bila penutupnya tidak ada sama sekali.
  html = html.replace(/<\/?(script|style|template|noscript|iframe|object|embed|svg|math)\b[^>]*>/gi, "");

  const out: string[] = [];
  /** Tag yang sudah dibuka dan masih menunggu penutup, terbaru di akhir. */
  const open: string[] = [];
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;

  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(html)) !== null) {
    const [raw, rawName, rawAttrs] = match;
    const name = rawName.toLowerCase();
    const closing = raw.startsWith("</");

    out.push(escapeText(html.slice(last, match.index)));
    last = match.index + raw.length;

    if (!(name in ALLOWED)) continue;

    if (closing) {
      // Penutup tanpa pembuka (atau yang urutannya kacau) dibuang: menuliskannya
      // apa adanya justru bisa menutup tag pembungkus di halaman.
      const at = open.lastIndexOf(name);
      if (at === -1) continue;
      while (open.length > at) out.push(`</${open.pop()}>`);
      continue;
    }

    const attrs: string[] = [];
    for (const allowed of ALLOWED[name]) {
      const found = new RegExp(`\\b${allowed}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s">]+))`, "i").exec(
        rawAttrs,
      );
      const value = found?.[2] ?? found?.[3] ?? found?.[4];
      if (value === undefined) continue;

      if (allowed === "href") {
        const href = safeHref(value);
        if (!href) continue;
        attrs.push(`href="${escapeText(href)}"`);
      } else {
        attrs.push(`${allowed}="${escapeText(value)}"`);
      }
    }

    // Tautan selalu ke situs lain: `noopener noreferrer` mencegah halaman tujuan
    // menyentuh `window.opener`, dan `_blank` menjaga artikel tetap terbuka.
    if (name === "a") {
      if (!attrs.some((a) => a.startsWith("href="))) continue;
      attrs.push('target="_blank"', 'rel="noopener noreferrer nofollow"');
    }

    const open_ = attrs.length > 0 ? `<${name} ${attrs.join(" ")}>` : `<${name}>`;
    if (VOID_TAGS.has(name)) {
      out.push(`<${name}>`);
    } else {
      out.push(open_);
      open.push(name);
    }
  }

  out.push(escapeText(html.slice(last)));
  // Tag yang tidak pernah ditutup penulisnya ditutup di sini, supaya potongan
  // HTML ini tidak pernah merusak tata letak halaman yang memuatnya.
  while (open.length > 0) out.push(`</${open.pop()}>`);

  return out.join("").trim();
}

/** Teks polos dari HTML — untuk ringkasan otomatis dan perkiraan waktu baca. */
export function htmlToText(html: string): string {
  return html
    .replace(/<\/(p|h2|h3|h4|li|blockquote)\s*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** ~200 kata per menit, dibulatkan ke atas; minimal 1 menit. */
export function readingMinutes(html: string): number {
  const words = htmlToText(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
