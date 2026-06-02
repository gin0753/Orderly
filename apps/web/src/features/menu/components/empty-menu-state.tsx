export function EmptyMenuState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h2 className="text-lg font-semibold text-slate-950">
        No menu items yet
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Menu categories and products will appear here once they are added from
        the backend.
      </p>
    </div>
  );
}
