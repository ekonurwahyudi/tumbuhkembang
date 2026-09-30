/**
 * Logo Android dan Apple sebagai SVG inline.
 *
 * Font ikon aplikasi ini adalah subset Material Symbols, dan Material Symbols tidak
 * memuat logo merek sama sekali — jadi tidak ada jalan lewat `<Icon>`. Alasan yang
 * sama membuat logo bank dan marketplace digambar sendiri.
 *
 * `currentColor`, bukan warna merek: keduanya dipakai di dalam tombol berwarna, dan
 * hijau Android di atas latar biru justru lebih sulit dibaca daripada monokrom.
 * Keduanya dekoratif — teks "Pasang" di sebelahnya yang menyampaikan makna.
 */

export function AndroidGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.6 9.48l1.84-3.18a.4.4 0 00-.7-.4l-1.87 3.22a11.4 11.4 0 00-9.74 0L5.26 5.9a.4.4 0 10-.7.4L6.4 9.48A10.8 10.8 0 001 18h22a10.8 10.8 0 00-5.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
    </svg>
  );
}

export function AppleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.05 12.94c-.03-2.65 2.16-3.92 2.26-3.98-1.23-1.8-3.15-2.05-3.83-2.08-1.63-.17-3.18.96-4.01.96-.83 0-2.1-.94-3.46-.91-1.78.03-3.42 1.03-4.34 2.62-1.85 3.21-.47 7.96 1.33 10.56.88 1.27 1.93 2.7 3.3 2.65 1.32-.05 1.82-.86 3.42-.86 1.6 0 2.05.86 3.44.83 1.42-.02 2.32-1.3 3.19-2.58 1-1.48 1.42-2.91 1.44-2.98-.03-.01-2.76-1.06-2.79-4.2zM14.47 4.9c.73-.89 1.22-2.12 1.09-3.35-1.05.04-2.32.7-3.07 1.58-.67.78-1.26 2.03-1.1 3.23 1.17.09 2.36-.6 3.08-1.46z" />
    </svg>
  );
}
