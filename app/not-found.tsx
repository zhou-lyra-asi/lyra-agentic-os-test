import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_30%,rgba(214,176,121,0.12),transparent_70%)]" />
      <div className="relative">
        <div className="eyebrow">404 · Lyra</div>
        <h1 className="display mt-5 text-[clamp(2.5rem,7vw,4.5rem)] ivory-text">
          Misi ini tidak ditemukan.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-sand/60">
          Tidak ada jejak di Memory Fabric untuk alamat tersebut. Kembali ke inti, atau buka konsol untuk memulai misi baru.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-full bg-gradient-to-b from-gold-bright to-gold px-6 py-3 text-[12px] font-medium uppercase tracking-[0.12em] text-[#231708]">
            Kembali
          </Link>
          <Link href="/console" className="rounded-full border border-gold/35 px-6 py-3 text-[12px] uppercase tracking-[0.12em] text-gold-bright hover:bg-gold/[0.06]">
            Buka Konsol
          </Link>
        </div>
      </div>
    </main>
  );
}
