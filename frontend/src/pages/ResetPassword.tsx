import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AuthCard, AuthMessage } from "../components/auth/AuthCard";
import { AuthField, AuthSubmit } from "../components/auth/AuthField";
import { useAuth } from "../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL;
const MIN_LENGTH = 8;

export function ResetPassword() {
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  if (!email || !token) return <Navigate to="/forgot-password" replace />;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword: password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? body.errors?.join(" ") ?? "Något gick fel. Försök igen.");
      }

      await signIn(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nätverksfel. Kontrollera anslutningen.");
      setPending(false);
    }
  }

  return (
    <AuthCard>
      <h2 className="mb-2 text-lg font-extrabold">Välj ett nytt lösenord</h2>
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">
        För {email}. Alla inloggade enheter loggas ut när du sparar.
      </p>

      {error && <AuthMessage tone="danger">{error}</AuthMessage>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Nytt lösenord"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          hint={`Minst ${MIN_LENGTH} tecken.`}
        />

        <AuthSubmit pending={pending || password.length < MIN_LENGTH}>
          {pending ? "Sparar..." : "Spara nytt lösenord"}
        </AuthSubmit>
      </form>

      <Link to="/forgot-password" className="mt-6 block text-center text-sm font-semibold text-[var(--color-mint)]">
        Begär en ny länk
      </Link>
    </AuthCard>
  );
}
