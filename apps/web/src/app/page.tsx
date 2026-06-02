import { SiteHeader } from "@/components/site-header";
import { getMenu } from "@/features/menu/api/get-menu";
import { MenuBrowser } from "@/features/menu/components/menu-browser";
import { MenuHero } from "@/features/menu/components/menu-hero";

export default async function HomePage() {
  try {
    const menu = await getMenu();

    return (
      <main className="min-h-screen bg-slate-50">
        <SiteHeader />

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <MenuHero />
          <MenuBrowser categories={menu.categories} />
        </div>
      </main>
    );
  } catch (error) {
    return (
      <main className="min-h-screen bg-slate-50">
        <SiteHeader />

        <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-slate-950">
              Menu is unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              The frontend could not load menu data from the API. Please make
              sure the NestJS backend is running on port 4000.
            </p>

            <pre className="mt-4 overflow-auto rounded-2xl bg-slate-100 p-4 text-xs text-slate-700">
              {error instanceof Error ? error.message : "Unknown error"}
            </pre>
          </div>
        </div>
      </main>
    );
  }
}
