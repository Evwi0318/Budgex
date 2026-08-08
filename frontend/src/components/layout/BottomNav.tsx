import { useLocation, useNavigate } from "react-router-dom";
import type { ComponentType } from "react";
import { Hexagon, Plus, BarChart3, Target, User } from "lucide-react";

interface NavItem {
  path: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { path: "/", icon: Hexagon, label: "Hem" },
  { path: "/add", icon: Plus, label: "Lägg till", disabled: true },
  { path: "/stats", icon: BarChart3, label: "Statistik", disabled: true },
  { path: "/savings", icon: Target, label: "Sparande" },
  { path: "/profile", icon: User, label: "Profil", disabled: true },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-16 bg-[var(--color-surface)] rounded-t-[var(--radius-hero)] border-t border-[var(--color-border)] flex items-center justify-around mx-2 mb-2"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        const isDisabled = item.disabled;

        return (
          <button
            key={item.path}
            onClick={() => !isDisabled && navigate(item.path)}
            disabled={isDisabled}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition ${
              isDisabled
                ? "cursor-not-allowed opacity-50"
                : isActive
                  ? "text-[var(--color-mint)]"
                  : "text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
            }`}
            aria-label={item.label}
          >
            <Icon size={24} strokeWidth={1.5} />
          </button>
        );
      })}
    </div>
  );
}
