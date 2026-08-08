export function TopBar() {
  return (
    <div
      className="h-14 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Wordmark */}
      <h1 className="text-xl font-black text-white">Budgex</h1>

      {/* Post-MVP: streak och PRO-knapp gömda */}
      <div className="w-8" />
    </div>
  );
}
