import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";

export function Profile() {
  const { userEmail, logout } = useAuth();

  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-xl font-extrabold text-[var(--color-text)]">Profil</h1>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-faint)]">
          Inloggad som
        </p>
        <p className="text-[15px] text-[var(--color-text)] mt-1">{userEmail}</p>
      </div>

      <Button variant="ghost" size="lg" className="w-full" onClick={logout}>
        Logga ut
      </Button>
    </div>
  );
}
