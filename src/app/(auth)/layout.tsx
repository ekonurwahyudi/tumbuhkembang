export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[#f8f9ff]">
      {/* Dekorasi blur ala mock Stitch. */}
      <div
        aria-hidden
        className="pointer-events-none fixed -top-24 -left-20 z-0 size-80 rounded-full bg-[#E0F2FE]/60 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed top-1/2 -right-24 z-0 size-72 rounded-full bg-[#FEF08A]/30 blur-3xl"
      />

      <div className="relative z-10 mx-auto w-full max-w-md px-4 pt-10 pb-8">{children}</div>
    </main>
  );
}
