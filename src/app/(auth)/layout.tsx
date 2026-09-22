import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon.svg" alt="" width={40} height={40} className="rounded-lg" />
            <span className="text-xl font-semibold tracking-tight">Tumbuh Kembang</span>
          </Link>
          <p className="text-muted-foreground text-sm">
            Pantau pertumbuhan anak dengan catatan yang rapi.
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
