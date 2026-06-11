import { getMenu } from "@/features/menu/api/get-menu";
import { MenuBrowser } from "@/features/menu/components/menu-browser";
import { MenuHero } from "@/features/menu/components/menu-hero";

async function getMenuSafely() {
  try {
    return await getMenu();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const menu = await getMenuSafely();

  if (!menu)
    return (
      <main className="min-h-screen bg-[var(--color-background)]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <MenuHero />

          <section className="mt-8 rounded-3xl border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] px-6 py-8 text-center">
            <p className="text-sm font-semibold text-[var(--color-danger-strong)]">
              We could not load the menu right now.
            </p>
            <p className="mt-2 text-sm text-[var(--color-danger)]">
              Please check that the API server is running and try again.
            </p>
          </section>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <MenuHero />
        <MenuBrowser categories={menu.categories} />
      </div>
    </main>
  );
}
