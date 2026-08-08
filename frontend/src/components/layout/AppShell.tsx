import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
      <div className="w-full max-w-[480px] flex flex-col h-screen bg-[var(--color-bg)]">
        {/* Toppbar */}
        <TopBar />

        {/* Huvudinnehål */}
        <main className="flex-1 overflow-y-auto pb-24">
          <Outlet />
        </main>

        {/* Bottennavigering */}
        <BottomNav />
      </div>
    </div>
  );
}
