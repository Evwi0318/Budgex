export function TopBar() {
  return (
    <div
      className="flex h-14 items-center justify-center border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <h1 className="text-xl font-black text-[var(--color-text)]">Budgex</h1>
    </div>
  );
}
