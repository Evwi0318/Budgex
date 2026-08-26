import { useLocation, useNavigate } from "react-router-dom";
import type { ComponentType } from "react";
import { House, PiggyBank, User } from "lucide-react";

interface NavItem {
  path: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
}

const navItems: NavItem[] = [
  { path: "/", icon: House, label: "Hem" },
  { path: "/savings", icon: PiggyBank, label: "Sparande" },
  { path: "/profile", icon: User, label: "Profil" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10 mx-auto max-w-[480px] h-16 bg-[var(--color-surface)] rounded-t-[var(--radius-hero)] flex items-center justify-around px-2"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex items-center justify-center w-12 h-12 transition ${
              isActive
                ? "text-[var(--color-mint)]"
                : "text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
            }`}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={24} strokeWidth={1.5} />
          </button>
        );
      })}
    </nav>
  );
}
