"use client";

import { useEffect, useRef, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize-html";

/**
 * Penyunting teks sederhana untuk isi artikel.
 *
 * `contenteditable` bawaan browser, BUKAN pustaka editor: TipTap/ProseMirror
 * menambah lima paket demi tujuh tombol, dan tag yang boleh ada di sini cuma
 * segelintir — daftarnya ditentukan `sanitizeHtml`, bukan kemampuan editornya.
 *
 * ponytail: `document.execCommand` sudah deprecated dan tidak punya pengganti
 * baku; ia masih jalan di semua browser arus utama dan yang memakainya cuma
 * superadmin. Kalau suatu saat benar-benar dicabut, ganti dengan TipTap —
 * antarmuka komponen ini (`name`, `defaultValue`) tidak perlu berubah.
 *
 * Yang tersimpan tetap lewat `sanitizeHtml` DI SERVER (`blogPostSchema`). Yang di
 * sini hanya supaya tempelan dari Word/web tidak membawa `<span style>` sejak awal.
 */
/*
  Label tombolnya teks, bukan ikon: `format_bold` dkk. tidak ada di subset
  woff2 (src/components/ui/icon.tsx), dan regenerate font demi tujuh glyph
  tidak sepadan. "B" tebal dan "I" miring juga konvensi yang sudah dikenal.
*/
type ToolButton = {
  label: string;
  text: string;
  /** Kelas gaya untuk labelnya, supaya "B" benar-benar terlihat tebal. */
  className?: string;
  command: string;
  value?: string;
};

const TOOLS: ToolButton[] = [
  { label: "Tebal", text: "B", className: "font-black", command: "bold" },
  { label: "Miring", text: "I", className: "italic", command: "italic" },
  { label: "Judul bagian", text: "H2", command: "formatBlock", value: "h2" },
  { label: "Subjudul", text: "H3", command: "formatBlock", value: "h3" },
  { label: "Paragraf", text: "¶", command: "formatBlock", value: "p" },
  { label: "Daftar bertitik", text: "•—", command: "insertUnorderedList" },
  { label: "Daftar bernomor", text: "1.", command: "insertOrderedList" },
  { label: "Kutipan", text: "❝", command: "formatBlock", value: "blockquote" },
];

export function RichTextEditor({
  name,
  defaultValue,
  invalid,
}: {
  name: string;
  defaultValue?: string;
  invalid?: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  // Nilai inilah yang ikut terkirim di FormData — `contenteditable` tidak pernah
  // ikut submit sendiri, jadi satu input tersembunyi yang membawanya.
  const [html, setHtml] = useState(defaultValue ?? "");
  const [source, setSource] = useState(false);

  // Isi awal dipasang sekali lewat ref, bukan lewat `dangerouslySetInnerHTML` di
  // JSX: React akan menulis ulang DOM-nya tiap render dan memindahkan kursor
  // pengguna ke awal di tengah pengetikan.
  useEffect(() => {
    if (editorRef.current && defaultValue) editorRef.current.innerHTML = defaultValue;
  }, [defaultValue]);

  const sync = () => setHtml(editorRef.current?.innerHTML ?? "");

  const run = (tool: ToolButton) => {
    editorRef.current?.focus();
    document.execCommand(tool.command, false, tool.value);
    sync();
  };

  /** Tempelan dibersihkan dulu — Word dan halaman web membawa gaya bawaannya. */
  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertHTML", false, pasted ? sanitizeHtml(pasted) : text);
    sync();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1">
        {TOOLS.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={tool.label}
            aria-label={tool.label}
            disabled={source}
            // `onMouseDown` + preventDefault, bukan `onClick`: mengeklik tombol
            // memindahkan fokus dan menghapus seleksi teks sebelum perintahnya
            // sempat berjalan.
            onMouseDown={(e) => {
              e.preventDefault();
              run(tool);
            }}
            className={`bg-muted hover:bg-accent text-muted-foreground grid size-8 place-items-center rounded-lg text-xs font-bold disabled:opacity-40 ${tool.className ?? ""}`}
          >
            {tool.text}
          </button>
        ))}

        <button
          type="button"
          onClick={() => {
            // Berpindah dari mode HTML: isi editornya disegarkan dari teks yang
            // barusan disunting, kalau tidak suntingannya hilang saat kembali.
            if (source && editorRef.current) editorRef.current.innerHTML = html;
            setSource(!source);
          }}
          className="bg-muted hover:bg-accent text-muted-foreground ml-auto rounded-lg px-2.5 py-1.5 text-xs font-bold"
        >
          {source ? "Mode Teks" : "Mode HTML"}
        </button>
      </div>

      {source ? (
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={16}
          className="border-input bg-background focus-visible:ring-ring w-full rounded-xl border p-3 font-mono text-xs outline-none focus-visible:ring-2"
          aria-label="Sunting HTML artikel"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Isi artikel"
          aria-invalid={invalid}
          onInput={sync}
          onBlur={sync}
          onPaste={onPaste}
          className="border-input bg-background focus-visible:ring-ring text-body-md [&_h2]:text-headline-md [&_h3]:text-headline-sm min-h-80 w-full space-y-3 rounded-xl border p-3 outline-none focus-visible:ring-2 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--rule)] [&_blockquote]:pl-3 [&_blockquote]:italic [&_h2]:mt-4 [&_h3]:mt-3 [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc"
        />
      )}

      <input type="hidden" name={name} value={html} />
      <p className="text-muted-foreground text-xs">
        Gambar, video, dan gaya warna tidak didukung — hanya teks, judul, daftar, kutipan, dan
        tautan. Selebihnya dibuang saat disimpan.
      </p>
    </div>
  );
}
