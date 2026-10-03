/**
 * Logo Android, Apple, dan WhatsApp sebagai SVG inline.
 *
 * Font ikon aplikasi ini adalah subset Material Symbols, dan Material Symbols tidak
 * memuat logo merek sama sekali — jadi tidak ada jalan lewat `<Icon>`. Alasan yang
 * sama membuat logo bank dan marketplace digambar sendiri.
 *
 * `currentColor`, bukan warna merek yang dipatok: ketiganya dipakai di dalam tombol
 * berwarna, dan warnanya ditentukan pemanggilnya lewat `className`. Hijau Android di
 * atas latar biru justru lebih sulit dibaca daripada monokrom; WhatsApp sebaliknya
 * diberi #25D366 di tombol gelap, karena di situlah logonya dikenali.
 * Ketiganya dekoratif — teks di sebelahnya yang menyampaikan makna.
 */

export function AndroidGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.6 9.48l1.84-3.18a.4.4 0 00-.7-.4l-1.87 3.22a11.4 11.4 0 00-9.74 0L5.26 5.9a.4.4 0 10-.7.4L6.4 9.48A10.8 10.8 0 001 18h22a10.8 10.8 0 00-5.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
    </svg>
  );
}

export function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 012.41 5.82c0 4.54-3.7 8.24-8.25 8.24a8.23 8.23 0 01-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 01-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24zm-3.5 4.3c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09 0 1.23.9 2.42 1.02 2.59.13.16 1.74 2.66 4.22 3.73.59.25 1.05.4 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.23-.16-.47-.29-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.97-.15.16-.29.19-.53.06-.25-.12-1.04-.38-1.98-1.22a7.4 7.4 0 01-1.37-1.7c-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.43-.06-.13-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.42h-.49z" />
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
