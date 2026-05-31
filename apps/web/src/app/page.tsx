import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <p className="text-sm font-bold uppercase tracking-[0.24em] text-orange-600">
        Orderly
      </p>

      <h1 className="mt-4 max-w-3xl text-5xl font-bold tracking-tight text-slate-950">
        Production-grade restaurant ordering platform.
      </h1>

      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
        A full-stack online ordering system built with Next.js, NestJS,
        PostgreSQL, Prisma, and Docker.
      </p>
    </div>
  );
}
