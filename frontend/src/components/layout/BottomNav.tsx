import { useLocation, useNavigate } from "react-router-dom";
import type { ComponentType } from "react";
import { Hexagon, Plus, BarChart3, Target, User } from "lucide-react";

interface NavItem {
  path: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  disabled?: boolean;
}

// Statistik är post-MVP och renderas dimmad utan funktion
const navItems: NavItem[] = [
  { path: "/", icon: Hexagon, label: "Hem" },
  { path: "/stats", icon: BarChart3, label: "Statistik", disabled: true },
  { path: "/savings", icon: Target, label: "Sparande" },
  { path: "/profile", icon: User, label: "Profil" },
];

interface BottomNavProps {
  onAdd: () => void;
}

export function BottomNav({ onAdd }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Plus-knappen renderas mellan Hem och Statistik, som i mockupen
  const [homeItem, ...restItems] = navItems;

  const renderNavButton = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <button
        key={item.path}
        onClick={() => !item.disabled && navigate(item.path)}
        disabled={item.disabled}
        className={`flex items-center justify-center w-12 h-12 transition ${
          item.disabled
            ? "cursor-not-allowed opacity-40 text-[var(--color-text-faint)]"
            : isActive
              ? "text-[var(--color-mint)]"
              : "text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
        }`}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon size={24} strokeWidth={1.5} />
      </button>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] h-16 bg-[var(--color-surface)] rounded-t-[var(--radius-hero)] flex items-center justify-around px-2"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {renderNavButton(homeItem)}

      {/* Plus är en handling, inte en rutt — den öppnar lägg till-arket */}
      <button
        onClick={onAdd}
        className="flex items-center justify-center w-12 h-12 text-[var(--color-text-faint)] hover:text-[var(--color-mint)] transition active:scale-[0.98]"
        aria-label="Lägg till"
      >
        <Plus size={24} strokeWidth={1.5} />
      </button>

      {restItems.map(renderNavButton)}
    </nav>
  );
}
