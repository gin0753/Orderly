export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">
            O
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-950">
            Orderly
          </span>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="/" className="text-slate-950">
            Menu
          </a>
          <a href="/" className="transition hover:text-slate-950">
            Deals
          </a>
          <a href="/" className="transition hover:text-slate-950">
            Orders
          </a>
        </nav>

        <button
          type="button"
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Cart
        </button>
      </div>
    </header>
  );
}
