export function MenuHero() {
  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
            Good food, made simple
          </p>

          <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Order from Orderly Kitchen
          </h1>

          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Fresh ingredients, bold flavours, and a smooth ordering experience
            built for modern restaurants.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <InfoChip label="Pickup" value="20–30 min" />
            <InfoChip label="Delivery" value="30–45 min" />
            <InfoChip label="Rating" value="4.8 / 5" />
            <InfoChip label="Status" value="Open now" />
          </div>
        </div>

        <div className="relative min-h-64 overflow-hidden rounded-3xl bg-gradient-to-br from-orange-100 to-stone-100">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-48 w-48 items-center justify-center rounded-full bg-white text-7xl shadow-sm sm:h-56 sm:w-56">
              🍕
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type InfoChipProps = {
  label: string;
  value: string;
};

function InfoChip({ label, value }: InfoChipProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
